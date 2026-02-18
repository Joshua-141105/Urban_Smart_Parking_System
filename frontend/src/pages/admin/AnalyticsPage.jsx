import { useState, useEffect } from "react";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from "recharts";
import { Star, TrendingUp, Users, Activity } from "lucide-react";
import { toast } from "react-toastify";

import api from "../../api/axios";

const AnalyticsPage = () => {
    const [loading, setLoading] = useState(true);
    const [ratingStats, setRatingStats] = useState(null);
    const [predictions, setPredictions] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Review Stats
                const reviewsRes = await api.get('/reviews/stats');
                setRatingStats(reviewsRes.data);

                // Fetch Predictions
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

    // Prepare data for bar chart (Rating Distribution)
    const ratingData = ratingStats ? Object.entries(ratingStats.distribution).map(([rating, count]) => ({
        rating: `${rating} Stars`,
        count: count
    })) : [];

    if (loading) {
        return <div className="flex-center min-h-[500px]">
            <div className="animate-spin w-10 h-10 rounded-full border-3 border-accent-primary border-t-transparent"></div>
        </div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">
                    <span className="gradient-text">Advanced Analytics</span>
                </h1>
                <p className="page-subtitle">Platform performance and predictive insights</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Rating Overview Card */}
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
                                {ratingStats?.averageRating || 0}<span className="text-sm text-secondary">/5</span>
                            </div>
                            <div className="text-xs text-secondary">{ratingStats?.totalReviews} total reviews</div>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ratingData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.1} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="rating" type="category" width={60} tick={{ fill: '#9ca3af' }} />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151', borderRadius: '0.5rem' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                    {ratingData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={`hsl(45, 100%, ${50 + (index * 5)}%)`} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Occupancy Prediction Card */}
                <div className="glass-panel p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex-center text-purple-500">
                            <Activity size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Occupancy Prediction</h2>
                            <p className="text-sm text-secondary">Next 24 hours forecast (AI Model)</p>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={predictions}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis
                                    dataKey="time"
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    interval={3}
                                />
                                <YAxis tick={{ fill: '#9ca3af' }} domain={[0, 100]} />
                                <RechartsTooltip
                                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151', borderRadius: '0.5rem' }}
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
                                <strong>Insights:</strong> Peak occupancy expected around 18:00 (Evening Rush). Consider applying dynamic pricing during these hours.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
