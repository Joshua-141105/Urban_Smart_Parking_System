#!/usr/bin/env python3
"""
generate_dataset_v2.py
──────────────────────
Generates a lot-specific parking occupancy dataset.

New column added:  parking_lot_id

Final CSV columns:
  parking_lot_id, hour_of_day, day_of_week, is_weekend,
  current_occupancy, total_slots, bookings_last_hour, occupancy_percentage

Lot type patterns (derived from DataSeeder.java naming + Chennai location):
  OFFICE     — High 9am–6pm weekdays, quiet evenings/weekends
  SHOPPING   — High evenings + weekends, moderate weekday afternoons
  RESIDENTIAL— High nights (8pm–8am), quiet during office hours
  MIXED      — Balanced all day, peaks at lunch and evening

Run:  python3 generate_dataset_v2.py
Output: parking_occupancy_dataset_v2.csv
"""

import csv
import random
from datetime import datetime, timedelta
from pathlib import Path

random.seed(42)

# ── Lot definitions ──────────────────────────────────────────────────────────
# Derived from DataSeeder.java: 30 lots seeded with 50–300 total_capacity each.
# We assign a type to each lot ID (1–30) and carry their realistic total_slots.
# Types rotate: OFFICE(10), SHOPPING(10), RESIDENTIAL(5), MIXED(5)

LOT_CONFIGS = []
LOT_TYPES   = (
    ["OFFICE"]      * 10 +
    ["SHOPPING"]    * 10 +
    ["RESIDENTIAL"] *  5 +
    ["MIXED"]       *  5
)
# Total slots mirrors DataSeeder: random 50–300 but seeded so values are fixed
rng_slots = random.Random(99)   # separate seed so main seed stays clean
for lot_id in range(1, 31):
    total_slots = rng_slots.randint(50, 300)
    LOT_CONFIGS.append({
        "lot_id":     lot_id,
        "lot_type":   LOT_TYPES[lot_id - 1],
        "total_slots": total_slots,
    })


# ── Occupancy curves per lot type ────────────────────────────────────────────

def base_occupancy_office(hour: int, dow: int) -> float:
    """
    OFFICE lots: Monday–Friday 9am–6pm is peak.
    Evenings and weekends are quiet.
    """
    is_weekend = dow >= 5
    if is_weekend:
        if hour < 8 or hour >= 20:  return random.uniform(2, 8)
        return random.uniform(5, 20)   # some weekend workers
    # Weekday
    if hour < 7:                    return random.uniform(1, 5)
    if 7 <= hour < 9:               return random.uniform(20, 45)   # arrivals
    if 9 <= hour < 12:              return random.uniform(75, 95)   # full office
    if 12 <= hour < 14:             return random.uniform(55, 75)   # lunch out
    if 14 <= hour < 18:             return random.uniform(70, 92)   # afternoon
    if 18 <= hour < 20:             return random.uniform(30, 55)   # departures
    return random.uniform(5, 15)                                    # night


def base_occupancy_shopping(hour: int, dow: int) -> float:
    """
    SHOPPING lots: evenings and weekends are peak.
    Quiet early mornings.
    """
    is_weekend = dow >= 5
    if hour < 8:                    return random.uniform(2, 8)
    if is_weekend:
        if 8 <= hour < 10:          return random.uniform(15, 35)
        if 10 <= hour < 14:         return random.uniform(65, 88)   # weekend shopping
        if 14 <= hour < 20:         return random.uniform(70, 95)   # peak
        if 20 <= hour < 22:         return random.uniform(50, 70)
        return random.uniform(10, 25)
    # Weekday
    if 8 <= hour < 11:              return random.uniform(15, 35)
    if 11 <= hour < 14:             return random.uniform(35, 60)   # lunch shoppers
    if 14 <= hour < 18:             return random.uniform(40, 65)
    if 18 <= hour < 21:             return random.uniform(65, 92)   # evening peak
    if 21 <= hour < 23:             return random.uniform(30, 55)
    return random.uniform(5, 15)


def base_occupancy_residential(hour: int, dow: int) -> float:
    """
    RESIDENTIAL lots: cars parked overnight, less during work hours.
    Pattern is roughly inverse of office.
    """
    if hour < 6:                    return random.uniform(75, 95)   # all cars home
    if 6 <= hour < 9:               return random.uniform(50, 75)   # people leaving
    if 9 <= hour < 17:              return random.uniform(20, 45)   # work hours
    if 17 <= hour < 20:             return random.uniform(55, 80)   # returning
    if 20 <= hour < 23:             return random.uniform(75, 92)   # evening home
    return random.uniform(80, 95)                                   # late night


def base_occupancy_mixed(hour: int, dow: int) -> float:
    """
    MIXED lots: combination of retail + office. Relatively busy all day.
    """
    is_weekend = dow >= 5
    if hour < 7:                    return random.uniform(10, 25)
    if is_weekend:
        if 7 <= hour < 11:          return random.uniform(30, 55)
        if 11 <= hour < 20:         return random.uniform(60, 85)
        return random.uniform(20, 45)
    # Weekday
    if 7 <= hour < 9:               return random.uniform(35, 55)
    if 9 <= hour < 12:              return random.uniform(60, 80)
    if 12 <= hour < 14:             return random.uniform(55, 75)
    if 14 <= hour < 18:             return random.uniform(60, 80)
    if 18 <= hour < 21:             return random.uniform(65, 88)
    return random.uniform(15, 35)


# Dispatch table
OCCUPANCY_FN = {
    "OFFICE":      base_occupancy_office,
    "SHOPPING":    base_occupancy_shopping,
    "RESIDENTIAL": base_occupancy_residential,
    "MIXED":       base_occupancy_mixed,
}


def add_noise(value: float, sigma: float = 7.0) -> float:
    """Add Gaussian noise, clamp to [0, 100]."""
    return max(0.0, min(100.0, value + random.gauss(0, sigma)))


def bookings_last_hour(occ_pct: float, total_slots: int) -> int:
    """Estimate new bookings in the last hour."""
    base = int((occ_pct / 100) * total_slots * 0.12)
    return max(0, base + random.randint(-2, 3))


# ── Generation ───────────────────────────────────────────────────────────────

all_rows = []
start_date = datetime(2025, 1, 1)

# Generate ~180 days per lot → at least 180*24*3 = ~12,960 rows per lot
# We use 3 observations per hour to comfortably exceed 1,000 rows/lot
DAYS     = 180
OBS_PER_HOUR = 3

for config in LOT_CONFIGS:
    lot_id     = config["lot_id"]
    lot_type   = config["lot_type"]
    total_slots = config["total_slots"]
    occ_fn     = OCCUPANCY_FN[lot_type]

    for day_offset in range(DAYS):
        current_date = start_date + timedelta(days=day_offset)
        dow          = current_date.weekday()       # 0=Mon, 6=Sun
        is_weekend   = 1 if dow >= 5 else 0

        for hour in range(24):
            for _ in range(OBS_PER_HOUR):
                base_occ    = occ_fn(hour, dow)
                occ_pct     = add_noise(base_occ)
                current_occ = int(round((occ_pct / 100) * total_slots))
                current_occ = max(0, min(total_slots, current_occ))
                blh         = bookings_last_hour(occ_pct, total_slots)

                all_rows.append({
                    "parking_lot_id":      lot_id,
                    "hour_of_day":         hour,
                    "day_of_week":         dow,
                    "is_weekend":          is_weekend,
                    "current_occupancy":   current_occ,
                    "total_slots":         total_slots,
                    "bookings_last_hour":  blh,
                    "occupancy_percentage": round(occ_pct, 2),
                })

# Shuffle (good for train/test split later)
random.shuffle(all_rows)

# ── Write CSV ─────────────────────────────────────────────────────────────────

FIELDNAMES = [
    "parking_lot_id", "hour_of_day", "day_of_week", "is_weekend",
    "current_occupancy", "total_slots", "bookings_last_hour",
    "occupancy_percentage",
]

output_file = Path("parking_occupancy_dataset_v2.csv")
with open(output_file, "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
    writer.writeheader()
    writer.writerows(all_rows)

# ── Summary ───────────────────────────────────────────────────────────────────
total_rows = len(all_rows)
print(f"✓  Dataset written: {output_file}")
print(f"   Total rows    : {total_rows:,}")
print(f"   Lots covered  : {len(LOT_CONFIGS)}")
print(f"   Rows per lot  : {total_rows // len(LOT_CONFIGS):,}")
print()
print("Lot breakdown:")
print(f"  {'ID':<4} {'Type':<12} {'Slots':<8} {'Rows':>8}")
print(f"  {'-'*35}")
type_counts = {}
for c in LOT_CONFIGS:
    t = c["lot_type"]
    type_counts[t] = type_counts.get(t, 0) + 1

for t, cnt in sorted(type_counts.items()):
    print(f"  {t:<12}  {cnt} lots  × {DAYS * 24 * OBS_PER_HOUR:,} rows/lot")

print()
print("Sample rows (first 5):")
print(f"  {', '.join(FIELDNAMES)}")
for row in all_rows[:5]:
    print(f"  {', '.join(str(row[f]) for f in FIELDNAMES)}")