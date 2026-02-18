import { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
    AreaChart,
    Area,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import {
    Map,
    TrendingUp,
    TrendingDown,
    Building2,
    Car,
    AlertTriangle,
    Activity,
    Zap,
    CloudRain
} from "lucide-react";

const CityDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [cityStats, setCityStats] = useState({});
    const [hotspots, setHotspots] = useState([]);
    const [trendsData, setTrendsData] = useState([]);
    const [congestionAlerts, setCongestionAlerts] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch City Stats
                const statsRes = await fetch('http://localhost:8080/api/analytics/city-stats', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (statsRes.ok) {
                    const data = await statsRes.json();
                    setCityStats({
                        totalLots: data.totalLots,
                        totalSpaces: data.totalLots * 50, // rough estimate if not provided
                        currentOccupancy: 0, // need to sum from lots
                        avgOccupancyRate: 0,
                        todayRevenue: data.totalRevenue,
                        weekRevenue: data.totalRevenue * 7,
                        trafficReduction: 28, // static for now
                        avgSearchTime: 4.5    // static for now
                    });
                }

                // Fetch All Lots for Heatmap
                const lotsRes = await fetch('http://localhost:8080/api/parking/all', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (lotsRes.ok) {
                    const lots = await lotsRes.json();

                    const mappedHotspots = lots.map(lot => ({
                        id: lot.id,
                        name: lot.name,
                        lat: lot.latitude,
                        lng: lot.longitude,
                        occupancy: lot.occupiedSlots,
                        capacity: lot.totalCapacity
                    }));
                    setHotspots(mappedHotspots);

                    // Recalculate city stats based on real lot data
                    const totalOcc = lots.reduce((acc, lot) => acc + lot.occupiedSlots, 0);
                    const totalCap = lots.reduce((acc, lot) => acc + lot.totalCapacity, 0);

                    setCityStats(prev => ({
                        ...prev,
                        currentOccupancy: totalOcc,
                        totalSpaces: totalCap,
                        avgOccupancyRate: totalCap > 0 ? Math.round((totalOcc / totalCap) * 100) : 0
                    }));
                }

                setLoading(false);
            } catch (error) {
                console.error("Error fetching city dashboard data:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getHotspotColor = (occupancyPercent) => {
        if (occupancyPercent < 50) return '#10b981';
        if (occupancyPercent < 80) return '#eab308';
        if (occupancyPercent < 95) return '#f97316';
        return '#ef4444';
    };

    const getHotspotRadius = (capacity) => {
        return Math.max(15, Math.min(40, capacity / 4));
    };

    if (loading) {
        return (
            <div className="flex-center min-h-[400px]">
                <div className="animate-spin w-10 h-10 rounded-full border-3 border-accent-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header flex-between">
                <div>
                    <h1 className="page-title">
                        <span className="gradient-text">City Traffic Authority</span>
                    </h1>
                    <p className="page-subtitle">City-wide parking and traffic analytics</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="badge badge-success">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
                        Live Data
                    </span>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="stat-card">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="stat-label mb-2">Parking Facilities</p>
                            <p className="stat-value">{cityStats.totalLots}</p>
                        </div>
                        <div className="stat-icon bg-indigo-500/10 text-indigo-500">
                            <Building2 size={22} />
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="stat-label mb-2">Vehicles Parked</p>
                            <p className="stat-value">{cityStats.currentOccupancy.toLocaleString()}</p>
                            <p className="text-xs text-emerald-400 mt-1">{cityStats.avgOccupancyRate}% avg occupancy</p>
                        </div>
                        <div className="stat-icon bg-emerald-500/10 text-emerald-500">
                            <Car size={22} />
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="stat-label mb-2">Traffic Reduction</p>
                            <p className="stat-value text-emerald-400">-{cityStats.trafficReduction}%</p>
                            <p className="text-xs text-secondary mt-1">vs last month</p>
                        </div>
                        <div className="stat-icon bg-purple-500/10 text-purple-500">
                            <Activity size={22} />
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="stat-label mb-2">Avg. Search Time</p>
                            <p className="stat-value text-cyan-400">{cityStats.avgSearchTime}<span className="text-lg"> min</span></p>
                            <p className="text-xs text-secondary mt-1">Down from 25 min</p>
                        </div>
                        <div className="stat-icon bg-cyan-500/10 text-cyan-500">
                            <Zap size={22} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* City Heatmap */}
                <div className="glass-panel p-6 lg:col-span-2">
                    <div className="section-header">
                        <div>
                            <h3 className="section-title">City-Wide Occupancy</h3>
                            <p className="text-sm text-secondary">Real-time parking density</p>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>Low</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>Moderate</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>High</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>Critical</span>
                        </div>
                    </div>
                    <div className="rounded-xl overflow-hidden" style={{ height: 400 }}>
                        <MapContainer
                            center={[12.9716, 77.5946]}
                            zoom={11}
                            style={{ height: "100%", width: "100%", background: 'var(--bg-primary)' }}
                        >
                            <TileLayer
                                attribution='&copy; OpenStreetMap'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {hotspots.map((spot) => {
                                const occupancyPercent = (spot.occupancy / spot.capacity) * 100;
                                return (
                                    <CircleMarker
                                        key={spot.id}
                                        center={[spot.lat, spot.lng]}
                                        radius={getHotspotRadius(spot.capacity)}
                                        fillColor={getHotspotColor(occupancyPercent)}
                                        color={getHotspotColor(occupancyPercent)}
                                        weight={2}
                                        opacity={0.8}
                                        fillOpacity={0.4}
                                    >
                                        <Popup>
                                            <div className="p-1">
                                                <h4 className="font-bold">{spot.name}</h4>
                                                <p className="text-sm">Occupancy: {spot.occupancy}/{spot.capacity}</p>
                                                <p className="text-sm font-semibold" style={{ color: getHotspotColor(occupancyPercent) }}>
                                                    {Math.round(occupancyPercent)}% Full
                                                </p>
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                );
                            })}
                        </MapContainer>
                    </div>
                </div>

                {/* Congestion Alerts */}
                <div className="glass-panel p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle size={20} className="text-warning" />
                        <h3 className="text-lg font-semibold">Congestion Alerts</h3>
                    </div>
                    <div className="space-y-3 min-h-[100px]">
                        {congestionAlerts.length > 0 ? congestionAlerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`glass-card-static p-4 border-l-4 ${alert.severity === 'high' ? 'border-l-red-500' : 'border-l-yellow-500'
                                    }`}
                            >
                                <div className="flex-between mb-1">
                                    <span className="font-semibold">{alert.area}</span>
                                    <span className={`badge ${alert.severity === 'high' ? 'badge-danger' : 'badge-warning'}`}>
                                        {alert.severity}
                                    </span>
                                </div>
                                <p className="text-sm text-secondary mb-1">{alert.message}</p>
                                <p className="text-xs text-muted">{alert.time}</p>
                            </div>
                        )) : (
                            <div className="text-center text-secondary py-4">
                                No active congestion alerts.
                            </div>
                        )}
                    </div>

                    <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--glass-border)' }}>
                        <h4 className="text-sm font-semibold mb-3">Quick Actions</h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between glass-card-static p-2 mb-2">
                                <div className="flex items-center gap-2">
                                    <Zap size={16} className="text-accent-primary" />
                                    <span className="text-sm">Auto-Surge Pricing</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-primary"></div>
                                </label>
                            </div>

                            <button
                                onClick={() => alert("Simulating Incident Report Modal")}
                                className="btn btn-secondary btn-sm w-full justify-start hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/50"
                            >
                                <AlertTriangle size={16} />
                                Report Traffic Incident
                            </button>
                            <button className="btn btn-secondary btn-sm w-full justify-start">
                                <CloudRain size={16} />
                                Enable Weather Mode
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Occupancy Trends */}
            <div className="glass-panel p-6">
                <h3 className="text-lg font-semibold mb-1">City Occupancy Trends</h3>
                <p className="text-sm text-secondary mb-4">Real-time data visualization</p>
                <div className="flex-center h-[200px] text-secondary">
                    <p>Historical trends data will appear here once enough data is collected.</p>
                </div>
            </div>
        </div>
    );
};

export default CityDashboard;
