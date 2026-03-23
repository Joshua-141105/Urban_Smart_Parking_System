import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, CheckCircle, Zap, RefreshCw, Activity } from "lucide-react";
import api from "../api/axios";

/**
 * OccupancyPredictionWidget  (v2 — lot-specific)
 * ────────────────────────────────────────────────
 * Extends v1 with:
 *  - lotId prop: when passed, fetches lot-specific forecast
 *  - lotName prop: displayed in the card header
 *  - bookingsLastHour prop: real-time demand signal
 *
 * Backward compatible: all v1 usage (no props / currentOccupancy only) still works.
 *
 * Usage (generic):
 *   <OccupancyPredictionWidget />
 *
 * Usage (lot-specific):
 *   <OccupancyPredictionWidget
 *     lotId={5}
 *     lotName="Central Mall Parking"
 *     bookingsLastHour={8}
 *   />
 */
const OccupancyPredictionWidget = ({
    lotId             = null,
    lotName           = null,
    currentOccupancy  = null,   // kept for backward-compat & confidence adj.
    totalSlots        = null,   // kept for backward-compat & confidence adj.
    bookingsLastHour  = null,   // NEW: real-time demand signal
}) => {
    const [prediction,   setPrediction]   = useState(null);
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState(null);
    const [lastUpdated,  setLastUpdated]  = useState(null);

    const fetchPrediction = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();

            // Lot-specific param (NEW)
            if (lotId !== null) params.set("lotId", lotId);

            // Real-time demand signal (NEW)
            if (bookingsLastHour !== null) params.set("bookings_last_hour", bookingsLastHour);

            // Backward-compat params (v1)
            if (currentOccupancy !== null) params.set("current_occupancy", currentOccupancy);
            if (totalSlots       !== null) params.set("total_slots",        totalSlots);

            const query = params.toString() ? `?${params.toString()}` : "";
            const res   = await api.get(`/predict-occupancy${query}`);
            setPrediction(res.data);
            setLastUpdated(new Date());
        } catch (err) {
            setError("Prediction unavailable");
            console.error("ML prediction error:", err);
        } finally {
            setLoading(false);
        }
    }, [lotId, bookingsLastHour, currentOccupancy, totalSlots]);

    // Fetch on mount and every 5 minutes
    useEffect(() => {
        fetchPrediction();
        const interval = setInterval(fetchPrediction, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchPrediction]);

    // ── Risk config ──────────────────────────────────────────────────────────
    const riskConfig = {
        Low:      { color: "#10b981", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)",  icon: <CheckCircle  size={15} /> },
        Medium:   { color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)",  icon: <AlertTriangle size={15} /> },
        High:     { color: "#f97316", bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.3)",  icon: <AlertTriangle size={15} /> },
        Critical: { color: "#ef4444", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)",   icon: <Zap           size={15} /> },
    };

    const risk = prediction?.riskLevel || "Low";
    const rc   = riskConfig[risk] || riskConfig.Low;
    const pct  = prediction?.predictedOccupancy ?? 0;

    // SVG arc: 180° half-circle gauge
    const ARC_LENGTH  = 204;
    const filledArc   = (pct / 100) * ARC_LENGTH;

    // ── Loading skeleton ─────────────────────────────────────────────────────
    if (loading && !prediction) {
        return (
            <div style={styles.card}>
                <WidgetHeader
                    lotName={lotName} loading={loading}
                    onRefresh={fetchPrediction}
                />
                <div style={{ display: "flex", alignItems: "center",
                              justifyContent: "center", height: "130px" }}>
                    <RefreshCw size={20} style={{ color: "var(--text-muted)",
                                                  animation: "pv-spin 1s linear infinite" }} />
                </div>
                <SpinKeyframe />
            </div>
        );
    }

    // ── Error state ──────────────────────────────────────────────────────────
    if (error && !prediction) {
        return (
            <div style={styles.card}>
                <WidgetHeader
                    lotName={lotName} loading={false}
                    onRefresh={fetchPrediction}
                />
                <div style={{ textAlign: "center", padding: "1.5rem 1rem",
                              color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    {error}
                </div>
            </div>
        );
    }

    // ── Main render ──────────────────────────────────────────────────────────
    return (
        <div style={styles.card}>
            {/* Header */}
            <WidgetHeader
                lotName={lotName} loading={loading}
                onRefresh={fetchPrediction}
                fallback={prediction?.fallback}
            />

            {/* Gauge */}
            <div style={{ display: "flex", flexDirection: "column",
                          alignItems: "center", padding: "0.875rem 0 0.375rem" }}>
                <svg width="156" height="88" viewBox="0 0 156 88">
                    {/* Track */}
                    <path d="M 13 83 A 65 65 0 0 1 143 83"
                          fill="none" stroke="rgba(255,255,255,0.07)"
                          strokeWidth="13" strokeLinecap="round" />
                    {/* Fill */}
                    {pct > 0 && (
                        <path d="M 13 83 A 65 65 0 0 1 143 83"
                              fill="none"
                              stroke={rc.color}
                              strokeWidth="13"
                              strokeLinecap="round"
                              strokeDasharray={`${filledArc} ${ARC_LENGTH}`}
                              style={{ transition: "stroke-dasharray 0.9s ease, stroke 0.4s ease" }}
                        />
                    )}
                    {/* Percent label */}
                    <text x="78" y="76" textAnchor="middle"
                          fontSize="21" fontWeight="800" fill="#f1f5f9">
                        {pct}%
                    </text>
                </svg>

                {/* Risk badge */}
                <div style={{
                    display: "inline-flex", alignItems: "center", gap: "0.35rem",
                    padding: "0.275rem 0.8rem", borderRadius: "999px",
                    background: rc.bg, border: `1px solid ${rc.border}`,
                    color: rc.color, fontSize: "0.76rem", fontWeight: 700,
                    marginTop: "-0.125rem",
                }}>
                    {rc.icon} {risk} Demand
                </div>
            </div>

            {/* Suggestion */}
            <p style={{
                fontSize: "0.8rem", color: "var(--text-secondary)",
                textAlign: "center", padding: "0 0.5rem 0.625rem",
                lineHeight: 1.5, margin: 0,
            }}>
                {prediction?.message}
            </p>

            {/* Confidence bar */}
            <div style={{ padding: "0 0.125rem 0.125rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between",
                              marginBottom: "0.3rem" }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 500 }}>
                        Model confidence
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>
                        {prediction?.confidence ?? 0}%
                    </span>
                </div>
                <div style={{ height: "4px", borderRadius: "999px",
                              background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                    <div style={{
                        height: "100%", borderRadius: "999px",
                        background: "linear-gradient(90deg, #6366f1, #a855f7)",
                        width: `${prediction?.confidence ?? 0}%`,
                        transition: "width 0.9s ease",
                    }} />
                </div>
            </div>

            {/* Footer: last updated + version */}
            {lastUpdated && (
                <p style={{ fontSize: "0.67rem", color: "var(--text-muted)",
                            textAlign: "center", marginTop: "0.625rem" }}>
                    Updated {lastUpdated.toLocaleTimeString()}
                    {prediction?.modelVersion && !prediction?.fallback &&
                        ` · v${prediction.modelVersion}`}
                </p>
            )}

            <SpinKeyframe />
        </div>
    );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const WidgetHeader = ({ lotName, loading, onRefresh, fallback }) => (
    <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: "0.125rem",
    }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem",
                      minWidth: 0, flex: 1 }}>
            <Activity size={16} style={{ color: "#a5b4fc", flexShrink: 0 }} />
            <span style={{
                fontSize: "0.85rem", fontWeight: 700, color: "#f1f5f9",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
                {lotName ? `${lotName}` : "Next-Hour Forecast"}
            </span>
            {fallback && (
                <span style={{
                    fontSize: "0.64rem", padding: "1px 5px", borderRadius: "4px",
                    background: "rgba(245,158,11,0.15)", color: "#fbbf24",
                    flexShrink: 0,
                }}>Rule-based</span>
            )}
        </div>
        <button
            onClick={onRefresh}
            disabled={loading}
            style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-muted)", padding: "2px", flexShrink: 0,
                display: "flex", alignItems: "center",
            }}
            title="Refresh prediction"
        >
            <RefreshCw
                size={13}
                style={loading ? { animation: "pv-spin 1s linear infinite" } : {}}
            />
        </button>
    </div>
);

const SpinKeyframe = () => (
    <style>{`@keyframes pv-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
);

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
    card: {
        background:   "rgba(255,255,255,0.03)",
        border:       "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
        padding:      "1.125rem",
        minWidth:     "210px",
    },
};

export default OccupancyPredictionWidget;