/**
 * MLPredictionBadge
 * ──────────────────
 * Compact coloured badge showing ML-predicted demand level for a parking lot.
 *
 * Props:
 *   demandScore        "Low" | "Medium" | "High" | "Critical"
 *   confidenceLevel    number 0-100
 *   fillingFastAlert   boolean
 *   compact            boolean — hide label text (icon only)
 */

const DEMAND_CONFIG = {
    Low:      { emoji: "🟢", label: "Available",    color: "#10b981", bg: "rgba(16,185,129,0.15)",  border: "rgba(16,185,129,0.3)" },
    Medium:   { emoji: "🟡", label: "Filling Fast", color: "#f59e0b", bg: "rgba(245,158,11,0.15)",  border: "rgba(245,158,11,0.3)" },
    High:     { emoji: "🔴", label: "Likely Full",  color: "#ef4444", bg: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.3)" },
    Critical: { emoji: "🔴", label: "Full",         color: "#dc2626", bg: "rgba(220,38,38,0.15)",   border: "rgba(220,38,38,0.3)" },
};

const MLPredictionBadge = ({
    demandScore = "Low",
    confidenceLevel = null,
    fillingFastAlert = false,
    compact = false,
    style = {},
}) => {
    const cfg = DEMAND_CONFIG[demandScore] || DEMAND_CONFIG.Low;

    return (
        <span
            title={confidenceLevel != null ? `ML confidence: ${confidenceLevel}%` : "ML prediction"}
            style={{
                display:       "inline-flex",
                alignItems:    "center",
                gap:           "0.25rem",
                padding:       compact ? "1px 5px" : "2px 8px",
                borderRadius:  "999px",
                background:    cfg.bg,
                border:        `1px solid ${cfg.border}`,
                color:         cfg.color,
                fontSize:      compact ? "0.65rem" : "0.7rem",
                fontWeight:    700,
                whiteSpace:    "nowrap",
                lineHeight:    1.4,
                ...style,
            }}
        >
            <span style={{ fontSize: compact ? "0.7rem" : "0.75rem" }}>{cfg.emoji}</span>
            {!compact && <span>{cfg.label}</span>}
            {!compact && fillingFastAlert && (
                <span style={{
                    fontSize: "0.6rem",
                    background: "rgba(239,68,68,0.2)",
                    color: "#fca5a5",
                    padding: "0 4px",
                    borderRadius: "4px",
                    marginLeft: "2px",
                }}>
                    ⚡ Fast
                </span>
            )}
        </span>
    );
};

export default MLPredictionBadge;
