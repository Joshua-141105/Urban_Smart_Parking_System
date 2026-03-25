import { useState, useEffect } from "react";
import { Clock, TrendingDown, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import api from "../api/axios";

/**
 * BestTimeSuggestion
 * ───────────────────
 * Expandable panel showing the best time to park at a given lot.
 * Fetches /api/parking/best-time/{lotId} and renders a compact
 * 24-hour horizontal bar chart colour-coded by risk level.
 *
 * Props:
 *   lotId    number  — parking lot ID
 *   lotName  string  — displayed in header
 */

const RISK_COLORS = {
    Low:      "#10b981",
    Medium:   "#f59e0b",
    High:     "#f97316",
    Critical: "#ef4444",
};

const BestTimeSuggestion = ({ lotId, lotName }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [fetched, setFetched] = useState(false);

    // Lazy-load: only fetch when user expands the panel
    useEffect(() => {
        if (!expanded || fetched || !lotId) return;
        setLoading(true);
        api.get(`/parking/best-time/${lotId}`)
            .then(res => { setData(res.data); setFetched(true); })
            .catch(() => {
                // Show static fallback
                setData({ bestWindow: "14:00–16:00", bestOccupancy: 35, fallback: true, hourly: [] });
                setFetched(true);
            })
            .finally(() => setLoading(false));
    }, [expanded, fetched, lotId]);

    return (
        <div style={{
            marginTop: "0.5rem",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.08)",
            overflow: "hidden",
        }}>
            {/* Toggle header */}
            <button
                onClick={() => setExpanded(e => !e)}
                style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.5rem 0.75rem",
                    background: "rgba(255,255,255,0.03)",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-secondary)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                }}
            >
                <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <Clock size={12} style={{ color: "#a5b4fc" }} />
                    Best Time to Park
                    {data && !loading && (
                        <span style={{
                            color: "#10b981",
                            fontWeight: 700,
                            marginLeft: "0.25rem",
                        }}>
                            · {data.bestWindow || `${data.bestHour}:00`}
                        </span>
                    )}
                </span>
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {/* Expanded content */}
            {expanded && (
                <div style={{ padding: "0.625rem 0.75rem", background: "rgba(0,0,0,0.15)" }}>
                    {loading && (
                        <div style={{ display: "flex", justifyContent: "center", padding: "0.5rem" }}>
                            <Loader2 size={14} style={{ color: "var(--text-muted)", animation: "spin 1s linear infinite" }} />
                        </div>
                    )}

                    {data && !loading && (
                        <>
                            {/* Best-time highlight */}
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                marginBottom: "0.625rem",
                                padding: "0.4rem 0.6rem",
                                borderRadius: "6px",
                                background: "rgba(16,185,129,0.1)",
                                border: "1px solid rgba(16,185,129,0.2)",
                            }}>
                                <TrendingDown size={13} style={{ color: "#10b981", flexShrink: 0 }} />
                                <div>
                                    <span style={{ fontSize: "0.72rem", color: "#6ee7b7", fontWeight: 700 }}>
                                        Lowest occupancy: {data.bestWindow || `${data.bestHour}:00`}
                                    </span>
                                    {data.bestOccupancy != null && (
                                        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginLeft: "0.4rem" }}>
                                            (~{Math.round(data.bestOccupancy)}% full)
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* 24-hour bar chart */}
                            {data.hourly && data.hourly.length > 0 && (
                                <div>
                                    <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                                        Predicted occupancy by hour
                                    </p>
                                    <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "36px" }}>
                                        {data.hourly.map(h => (
                                            <div
                                                key={h.hour}
                                                title={`${h.label}: ${h.predictedOccupancy}%`}
                                                style={{
                                                    flex: 1,
                                                    height: `${Math.max(4, (h.predictedOccupancy / 100) * 36)}px`,
                                                    background: RISK_COLORS[h.riskLevel] || "#6366f1",
                                                    borderRadius: "2px 2px 0 0",
                                                    opacity: 0.8,
                                                    transition: "opacity 0.2s",
                                                    cursor: "default",
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.opacity = "1"; }}
                                                onMouseLeave={e => { e.currentTarget.style.opacity = "0.8"; }}
                                            />
                                        ))}
                                    </div>
                                    {/* Hour labels: 0, 6, 12, 18, 23 */}
                                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2px" }}>
                                        {["12am", "6am", "12pm", "6pm", "11pm"].map(l => (
                                            <span key={l} style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>{l}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {data.fallback && (
                                <p style={{ fontSize: "0.63rem", color: "var(--text-muted)", marginTop: "0.4rem", textAlign: "center" }}>
                                    Rule-based estimate (ML server offline)
                                </p>
                            )}
                        </>
                    )}
                </div>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default BestTimeSuggestion;
