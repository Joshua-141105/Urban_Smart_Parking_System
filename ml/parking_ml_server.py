#!/usr/bin/env python3
"""
parking_ml_server.py  (v2 — lot-specific forecast)
────────────────────────────────────────────────────
Extends the original ML server with lot-specific occupancy FORECASTING.

KEY DESIGN DECISION: Forecast vs. Real-time
  The model predicts NEXT-HOUR occupancy from time+lot patterns only.
  It does NOT use current_occupancy as a feature because:
    - That would be a "now" reading, not a forecast.
    - The model learns each lot's demand curve from historical data.
  current_occupancy is still accepted as a param but used only for
  the confidence calculation (how far is prediction from reality).

WHAT CHANGED FROM v1
────────────────────
1. Dataset: parking_lot_id column added.
2. FORECAST_FEATURES: [parking_lot_id, hour_of_day, day_of_week,
                        is_weekend, bookings_last_hour]
   (current_occupancy removed — it was data leakage for a forecast model)
3. GET /api/predict-occupancy?lotId=1   (lotId is NEW, optional)
4. POST /api/training-data: accepts parking_lot_id field (optional)
5. GET /api/lots: NEW — returns all lot IDs in dataset

BACKWARD COMPATIBILITY
──────────────────────
Callers that omit lotId continue to receive a valid generic prediction.
The response shape is identical to v1.
"""

import csv
import json
import time
import threading
import logging
from datetime import datetime
from pathlib import Path

import pandas as pd
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from flask import Flask, request, jsonify

# ── Config ─────────────────────────────────────────────────────────────────
BASE_DIR      = Path(__file__).parent
DATASET_PATH  = BASE_DIR / "parking_occupancy_dataset_v2.csv"
if not DATASET_PATH.exists():
    DATASET_PATH = BASE_DIR / "parking_occupancy_dataset.csv"

MODEL_PATH    = BASE_DIR / "parking_model_v2.joblib"
METADATA_PATH = BASE_DIR / "model_metadata_v2.json"

RETRAIN_EVERY_N  = 50
RETRAIN_INTERVAL = 30 * 60   # seconds

# Features used for training (no current_occupancy — avoids data leakage)
FORECAST_FEATURES = [
    "parking_lot_id",
    "hour_of_day",
    "day_of_week",
    "is_weekend",
    "bookings_last_hour",
]
# Generic features when no lot_id (v1 backward-compat)
GENERIC_FEATURES = [
    "hour_of_day",
    "day_of_week",
    "is_weekend",
    "bookings_last_hour",
]
TARGET = "occupancy_percentage"

RF_PARAMS = dict(
    n_estimators=100,
    max_depth=10,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1,
)

# ── App ─────────────────────────────────────────────────────────────────────
app = Flask(__name__)
logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

_model          = None    # primary model (with parking_lot_id)
_model_generic  = None    # fallback for calls without lotId
_model_lock     = threading.Lock()
_new_rows_count = 0
_last_retrain   = 0.0
_model_version  = "0.0.0"
_model_mae      = None
_model_r2       = None
_df_cache       = None
_df_cache_time  = 0


# ── Training ────────────────────────────────────────────────────────────────

def load_dataset():
    return pd.read_csv(DATASET_PATH)


def _do_train(df, features):
    X = df[features]; y = df[TARGET]
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.15, random_state=42)
    m = RandomForestRegressor(**RF_PARAMS)
    m.fit(X_tr, y_tr)
    preds = m.predict(X_te)
    return m, mean_absolute_error(y_te, preds), r2_score(y_te, preds)


def train_both(df):
    """Train primary (lot-specific) and generic (fallback) models."""
    has_lot = "parking_lot_id" in df.columns

    if has_lot:
        log.info("Training lot-specific model on %d rows …", len(df))
        m_primary, mae, r2 = _do_train(df, FORECAST_FEATURES)
        log.info("Lot-specific model — MAE=%.2f%%  R²=%.4f", mae, r2)
    else:
        log.info("No parking_lot_id — training generic model only …")
        m_primary, mae, r2 = _do_train(df, GENERIC_FEATURES)

    # Generic model (always trained for v1 backward-compat)
    log.info("Training generic fallback model …")
    m_generic, _, _ = _do_train(df, GENERIC_FEATURES)

    return m_primary, m_generic, mae, r2


def save_models(m_primary, m_generic, mae, r2):
    global _model_version, _model_mae, _model_r2, _last_retrain

    version = datetime.now().strftime("%Y%m%d.%H%M%S")
    joblib.dump({
        "model":         m_primary,
        "model_generic": m_generic,
        "features":      FORECAST_FEATURES,
    }, MODEL_PATH)

    meta = {
        "version": version,
        "trained_at": datetime.now().isoformat(),
        "mae": round(mae, 4),
        "r2":  round(r2, 4),
        "forecast_features": FORECAST_FEATURES,
        "dataset_rows": len(load_dataset()),
    }
    METADATA_PATH.write_text(json.dumps(meta, indent=2))

    _model_version = version
    _model_mae     = mae
    _model_r2      = r2
    _last_retrain  = time.time()
    log.info("Models saved — version %s", version)


def load_or_train():
    global _model, _model_generic, _model_version, _model_mae, _model_r2, _last_retrain

    if MODEL_PATH.exists():
        log.info("Loading saved models …")
        saved = joblib.load(MODEL_PATH)
        if isinstance(saved, dict):
            _model         = saved.get("model")
            _model_generic = saved.get("model_generic", saved.get("model"))
        else:
            _model = _model_generic = saved   # legacy plain model

        if METADATA_PATH.exists():
            meta = json.loads(METADATA_PATH.read_text())
            _model_version = meta.get("version", "unknown")
            _model_mae     = meta.get("mae")
            _model_r2      = meta.get("r2")
        _last_retrain = time.time()
        log.info("Models loaded — version %s", _model_version)
    else:
        log.info("No saved model — training from scratch …")
        df = load_dataset()
        m_primary, m_generic, mae, r2 = train_both(df)
        with _model_lock:
            _model         = m_primary
            _model_generic = m_generic
        save_models(m_primary, m_generic, mae, r2)


def maybe_retrain():
    global _model, _model_generic, _new_rows_count
    should = (
        _new_rows_count >= RETRAIN_EVERY_N or
        (time.time() - _last_retrain) >= RETRAIN_INTERVAL
    )
    if not should:
        return
    log.info("Retraining (new_rows=%d) …", _new_rows_count)
    try:
        df = load_dataset()
        m_primary, m_generic, mae, r2 = train_both(df)
        with _model_lock:
            _model         = m_primary
            _model_generic = m_generic
        save_models(m_primary, m_generic, mae, r2)
        _new_rows_count = 0
    except Exception as e:
        log.error("Retrain failed: %s", e)


# ── Helpers ─────────────────────────────────────────────────────────────────

def risk_label(pct):
    if pct < 50: return "Low"
    if pct < 75: return "Medium"
    if pct < 90: return "High"
    return "Critical"

def suggestion_message(pct):
    if pct < 50: return "Plenty of spots available. Great time to park!"
    if pct < 75: return "Moderate demand. Spots filling up — book soon."
    if pct < 90: return "High demand expected. Limited spots remaining."
    return "Near full capacity. Consider alternative parking."

def confidence_from_r2(r2):
    if r2 is None: return 75
    return max(0, min(100, int(r2 * 100)))

def get_lot_total_slots(lot_id):
    """Look up total_slots for a lot from the dataset (cached)."""
    global _df_cache, _df_cache_time
    if _df_cache is None or (time.time() - _df_cache_time) > 600:
        try:
            _df_cache      = pd.read_csv(DATASET_PATH)
            _df_cache_time = time.time()
        except Exception:
            return 100
    if "parking_lot_id" not in _df_cache.columns:
        return 100
    sub = _df_cache[_df_cache["parking_lot_id"] == lot_id]
    return int(sub["total_slots"].iloc[0]) if not sub.empty else 100


# ── Routes ───────────────────────────────────────────────────────────────────

@app.route("/api/predict-occupancy", methods=["GET"])
def predict_occupancy():
    """
    GET /api/predict-occupancy
    Optional params:
      lotId               (NEW) parking lot ID
      hour_of_day         0-23 (default: current hour)
      day_of_week         0-6  (default: today)
      is_weekend          0/1
      bookings_last_hour  (default: 0)
      current_occupancy   (accepted but NOT used in prediction —
                           kept for API backward-compatibility)
      total_slots         (accepted but NOT used in forecast model)
    """
    if _model is None:
        return jsonify({"error": "Model not ready"}), 503

    now = datetime.now()
    dow = now.weekday()

    def qp(name, cast, default):
        v = request.args.get(name)
        return cast(v) if v is not None else default

    try:
        lot_id_raw = request.args.get("lotId")
        lot_id     = int(lot_id_raw) if lot_id_raw is not None else None

        hour_of_day       = qp("hour_of_day",        int,   now.hour)
        day_of_week       = qp("day_of_week",         int,   dow)
        is_weekend        = qp("is_weekend",          int,   1 if dow >= 5 else 0)
        bookings_last_hour = qp("bookings_last_hour", int,   0)

        # These are accepted for caller convenience but not used in forecast
        current_occupancy = qp("current_occupancy",  float, None)
        total_slots_param = qp("total_slots",         int,   None)

    except (ValueError, TypeError) as e:
        return jsonify({"error": f"Invalid param: {e}"}), 400

    with _model_lock:
        if lot_id is not None and _model is not None:
            # ── Lot-specific prediction ──────────────────────────────────────
            row = pd.DataFrame([{
                "parking_lot_id":    lot_id,
                "hour_of_day":       hour_of_day,
                "day_of_week":       day_of_week,
                "is_weekend":        is_weekend,
                "bookings_last_hour": bookings_last_hour,
            }])
            raw = _model.predict(row[FORECAST_FEATURES])[0]
        else:
            # ── Generic prediction (v1 backward-compat) ──────────────────────
            row = pd.DataFrame([{
                "hour_of_day":       hour_of_day,
                "day_of_week":       day_of_week,
                "is_weekend":        is_weekend,
                "bookings_last_hour": bookings_last_hour,
            }])
            m = _model_generic if _model_generic is not None else _model
            raw = m.predict(row[GENERIC_FEATURES])[0]

    predicted  = round(max(0.0, min(100.0, float(raw))), 1)
    confidence = confidence_from_r2(_model_r2)

    # If caller sent current_occupancy, use it to slightly adjust confidence
    # (high deviation from current reality → lower confidence)
    if current_occupancy is not None and total_slots_param is not None and total_slots_param > 0:
        actual_pct = (current_occupancy / total_slots_param) * 100
        deviation  = abs(predicted - actual_pct)
        if deviation > 30:
            confidence = max(50, confidence - 15)

    return jsonify({
        "predictedOccupancy": predicted,
        "confidence":         confidence,
        "riskLevel":          risk_label(predicted),
        "message":            suggestion_message(predicted),
        "modelVersion":       _model_version,
        "lotId":              lot_id,
        "features": {
            "hour_of_day": hour_of_day,
            "day_of_week": day_of_week,
            "is_weekend":  is_weekend,
            "bookings_last_hour": bookings_last_hour,
        },
    })


@app.route("/api/training-data", methods=["POST"])
def add_training_data():
    """
    POST /api/training-data
    Body: parking_lot_id (NEW, optional) + all v1 fields.
    """
    global _new_rows_count

    body     = request.get_json(silent=True) or {}
    required = ["hour_of_day", "day_of_week", "is_weekend",
                "bookings_last_hour", "occupancy_percentage"]
    missing  = [f for f in required if f not in body]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    occ_pct = float(body["occupancy_percentage"])
    if not (0 <= occ_pct <= 100):
        return jsonify({"error": "occupancy_percentage must be 0-100"}), 400

    # Determine if dataset already has parking_lot_id header
    file_exists = DATASET_PATH.exists()
    if file_exists:
        with open(DATASET_PATH) as f:
            fieldnames = f.readline().strip().split(",")
    else:
        fieldnames = ["parking_lot_id"] + required if "parking_lot_id" in body else required

    row = {f: body.get(f, 0) for f in fieldnames}

    with open(DATASET_PATH, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)

    _new_rows_count += 1
    threading.Thread(target=maybe_retrain, daemon=True).start()

    return jsonify({"success": True, "pendingRetrain": _new_rows_count})


@app.route("/api/model-status", methods=["GET"])
def model_status():
    dataset_rows = 0
    if DATASET_PATH.exists():
        with open(DATASET_PATH) as f:
            dataset_rows = sum(1 for _ in f) - 1

    return jsonify({
        "modelReady":          _model is not None,
        "modelVersion":        _model_version,
        "mae":                 _model_mae,
        "r2":                  _model_r2,
        "confidence":          confidence_from_r2(_model_r2),
        "datasetRows":         dataset_rows,
        "newRowsSinceRetrain": _new_rows_count,
        "lotSpecific":         True,
        "forecastFeatures":    FORECAST_FEATURES,
        "lastRetrained":       (
            datetime.fromtimestamp(_last_retrain).isoformat()
            if _last_retrain else None
        ),
    })


@app.route("/api/lots", methods=["GET"])
def list_lots():
    """NEW — returns all lot IDs present in the training dataset."""
    try:
        df = pd.read_csv(DATASET_PATH)
        if "parking_lot_id" not in df.columns:
            return jsonify({"lotIds": [], "message": "No lot data in dataset"})
        lot_ids = sorted(int(x) for x in df["parking_lot_id"].unique().tolist())
        return jsonify({"lotIds": lot_ids, "count": len(lot_ids)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    log.info("=== ParkVerse ML Server v2 (lot-specific forecast) ===")
    load_or_train()
    log.info("Ready — Flask on :5001")
    app.run(host="0.0.0.0", port=5001, debug=False)