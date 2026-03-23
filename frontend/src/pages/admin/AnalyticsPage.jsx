import { useState, useEffect } from "react";
import {
    BarChart, Bar, LineChart, Line,
    XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend, ResponsiveContainer, Cell
} from "recharts";
import { Star, TrendingUp, Users, Activity, Building2, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";

import api from "../../api/axios";
// NEW: Import the prediction widget
import OccupancyPredictionWidget from "../../components/OccupancyPredictionWidget";

const AnalyticsPage = () => {
    const [loading,        setLoading]        = useState(true);
    const [ratingStats,    setRatingStats]     = useState(null);
    const [predictions,    setPredictions]     = useState([]);

    // NEW: lot selector state
    const [lots,           setLots]            = useState([]);
    const [selectedLotId,  setSelectedLotId]   = useState(null);
    const [selectedLotName, setSelectedLotName] = useState(null);
    const [lotsLoading,    setLotsLoading]     = useState(true);

    // ── Fetch existing analytics data (unchanged) ────────────────────────────
    useEffect(() => {
        const fetchData = async () => {
            try {
                const reviewsRes = await api.get('/reviews/stats');
                setRatingStats(reviewsRes.data);

                const predictionRes = await api.get('/analytics/predictions');
                setPredictions(predictionRes.data);

                setLoading(false);
            } catch (error) {
                console.error("Error fetching analytics:", error);
                toast.error("Failed to load analytics data");
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // ── NEW: Fetch lot list for the prediction widget dropdown ───────────────
    useEffect(() => {
        const fetchLots = async () => {
            setLotsLoading(true);
            try {
                // Try the admin my-lots endpoint first (has full lot details)
                const res = await api.get('/admin/my-lots');
                if (res.data && res.data.length > 0) {
                    setLots(res.data);
                    // Default: select the first lot
                    setSelectedLotId(res.data[0].id);
                    setSelectedLotName(res.data[0].name);
                }
            } catch {
                // Fallback: try the ML server's lot list (just IDs)
                try {
                    const mlRes = await api.get('/lots');
                    if (mlRes.data?.lotIds?.length > 0) {
                        const simpleLots = mlRes.data.lotIds.map(id => ({ id, name: `Lot ${id}` }));
                        setLots(simpleLots);
                        setSelectedLotId(simpleLots[0].id);
                        setSelectedLotName(simpleLots[0].name);
                    }
                } catch {
                    // ML server offline — widget will use generic prediction
                    console.warn("Could not fetch lot list");
                }
            } finally {
                setLotsLoading(false);
            }
        };
        fetchLots();
    }, []);

    // ── Lot selector handler ─────────────────────────────────────────────────
    const handleLotChange = (e) => {
        const id   = parseInt(e.target.value, 10);
        const lot  = lots.find(l => l.id === id);
        setSelectedLotId(id);
        setSelectedLotName(lot?.name || `Lot ${id}`);
    };

    // ── Prepare rating chart data (unchanged) ────────────────────────────────
    const ratingData = ratingStats
        ? Object.entries(ratingStats.distribution).map(([rating, count]) => ({
            rating: `${rating} Stars`,
            count:  count,
          }))
        : [];

    if (loading) {
        return (
            <div className="flex-center min-h-[500px]">
                <div className="animate-spin w-10 h-10 rounded-full border-3 border-accent-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title">
                    <span className="gradient-text">Advanced Analytics</span>
                </h1>
                <p className="page-subtitle">Platform performance, predictions, and insights</p>
            </div>

            {/* ── NEW: ML Prediction Section ──────────────────────────────── */}
            <div style={{
                marginBottom: "2rem",
                padding: "1.5rem",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
            }}>
                {/* Section header with lot dropdown */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "1rem",
                    marginBottom: "1.25rem",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                        <div style={{
                            width: "36px", height: "36px", borderRadius: "10px",
                            background: "rgba(99,102,241,0.15)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#a5b4fc",
                        }}>
                            <Activity size={18} />
                        </div>
                        <div>
                            <h2 style={{
                                fontSize: "1rem", fontWeight: 700,
                                color: "#f1f5f9", margin: 0,
                            }}>
                                Occupancy Forecast
                            </h2>
                            <p style={{
                                fontSize: "0.78rem", color: "var(--text-secondary)", margin: 0,
                            }}>
                                ML-powered next-hour prediction per parking lot
                            </p>
                        </div>
                    </div>

                    {/* Lot selector dropdown */}
                    {lots.length > 0 && (
                        <div style={{ position: "relative" }}>
                            <Building2
                                size={14}
                                style={{
                                    position: "absolute", left: "0.625rem",
                                    top: "50%", transform: "translateY(-50%)",
                                    color: "var(--text-secondary)", pointerEvents: "none",
                                }}
                            />
                            <ChevronDown
                                size={13}
                                style={{
                                    position: "absolute", right: "0.625rem",
                                    top: "50%", transform: "translateY(-50%)",
                                    color: "var(--text-secondary)", pointerEvents: "none",
                                }}
                            />
                            <select
                                value={selectedLotId ?? ""}
                                onChange={handleLotChange}
                                style={{
                                    appearance: "none",
                                    padding: "0.5rem 2rem 0.5rem 2rem",
                                    background: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "9px",
                                    color: "#f1f5f9",
                                    fontSize: "0.84rem",
                                    cursor: "pointer",
                                    minWidth: "200px",
                                    outline: "none",
                                }}
                            >
                                {lotsLoading ? (
                                    <option>Loading lots…</option>
                                ) : (
                                    lots.map(lot => (
                                        <option key={lot.id} value={lot.id}>
                                            {lot.name}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                    )}
                </div>

                {/* Prediction widgets grid */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                    gap: "1rem",
                }}>
                    {/* Selected lot specific prediction */}
                    <OccupancyPredictionWidget
                        lotId={selectedLotId}
                        lotName={selectedLotName ? `${selectedLotName} — Next Hour` : "Next-Hour Forecast"}
                    />

                    {/* Show 2 more lots for comparison if we have data */}
                    {lots.length >= 2 && (() => {
                        // Pick 2 different lots for comparison (not the selected one)
                        const others = lots.filter(l => l.id !== selectedLotId).slice(0, 2);
                        return others.map(lot => (
                            <OccupancyPredictionWidget
                                key={lot.id}
                                lotId={lot.id}
                                lotName={lot.name}
                            />
                        ));
                    })()}
                </div>

                {/* Info note */}
                <p style={{
                    fontSize: "0.72rem", color: "var(--text-muted)",
                    marginTop: "0.875rem", textAlign: "center",
                }}>
                    Predictions update every 5 minutes · Powered by Random Forest (R² ≈ 0.944)
                    · Different lots show different demand patterns
                </p>
            </div>

            {/* ── EXISTING: Analytics charts (unchanged) ───────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Rating Overview Card — unchanged */}
                <div className="glass-panel p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex-center text-yellow-500">
                            <Star size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">User Satisfaction</h2>
                            <p className="text-sm text-secondary">Based on user reviews</p>
                        </div>
                        <div className="ml-auto text-right">
                            <div className="text-2xl font-bold text-yellow-400">
                                {ratingStats?.averageRating || 0}
                                <span className="text-sm text-secondary">/5</span>
                            </div>
                            <div className="text-xs text-secondary">
                                {ratingStats?.totalReviews} total reviews
                            </div>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ratingData} layout="vertical">
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    horizontal={true} vertical={false}
                                    opacity={0.1}
                                />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="rating" type="category"
                                    width={60} tick={{ fill: "#9ca3af" }}
                                />
                                <RechartsTooltip
                                    contentStyle={{
                                        backgroundColor: "#1e293b",
                                        border: "1px solid #374151",
                                        borderRadius: "0.5rem",
                                    }}
                                    itemStyle={{ color: "#fff" }}
                                />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                    {ratingData.map((_, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={`hsl(45, 100%, ${50 + index * 5}%)`}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Occupancy Prediction Chart — unchanged */}
                <div className="glass-panel p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex-center text-purple-500">
                            <Activity size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">24-Hour Forecast</h2>
                            <p className="text-sm text-secondary">Next 24 hours prediction</p>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={predictions}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false} opacity={0.1}
                                />
                                <XAxis
                                    dataKey="time"
                                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                                    interval={3}
                                />
                                <YAxis tick={{ fill: "#9ca3af" }} domain={[0, 100]} />
                                <RechartsTooltip
                                    labelStyle={{ color: "#fff", fontWeight: "bold" }}
                                    contentStyle={{
                                        backgroundColor: "#1e293b",
                                        border: "1px solid #374151",
                                        borderRadius: "0.5rem",
                                    }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="occupancy"
                                    name="Occupancy %"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                        <div className="flex items-start gap-2">
                            <TrendingUp size={16} className="text-purple-400 mt-0.5" />
                            <p className="text-sm text-purple-200">
                                <strong>Insight:</strong> Peak occupancy expected around 18:00 (Evening Rush).
                                Consider applying dynamic pricing during peak hours.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;