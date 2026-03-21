import { useState, useEffect } from "react";
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
    Zap
} from "lucide-react";
import ParkingMap from "../../components/ParkingMap";

const CityDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [cityStats, setCityStats] = useState({
        totalLots: 0,
        totalSpaces: 0,
        currentOccupancy: 0,
        avgOccupancyRate: 0,
        todayRevenue: 0,
        weekRevenue: 0,
        trafficReduction: 0,
        avgSearchTime: 0
    });
    const [parkingLots, setParkingLots] = useState([]);
    const [congestionAlerts, setCongestionAlerts] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch City Stats (Mock or Real)
                // For now keeping the existing call but handling errors gracefully
                try {
                    const statsRes = await fetch('http://localhost:8080/api/analytics/city-stats', {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    });
                    if (statsRes.ok) {
                        const data = await statsRes.json();
                        setCityStats({
                            totalLots: data.totalLots,
                            totalSpaces: data.totalLots * 50,
                            currentOccupancy: 0,
                            avgOccupancyRate: 0,
                            todayRevenue: data.totalRevenue,
                            weekRevenue: data.totalRevenue * 7,
                            trafficReduction: 28,
                            avgSearchTime: 4.5
                        });
                    }
                } catch (e) {
                    // Ignore analytics error and proceed
                }

                // Fetch Admin's Parking Lots
                const lotsRes = await fetch('http://localhost:8080/api/admin/my-lots', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                
                if (lotsRes.ok) {
                    const lots = await lotsRes.json();

                    // Map backend response to component expected format
                    const mappedLots = lots.map(lot => ({
                        id: lot.id,
                        name: lot.name,
                        latitude: lot.latitude,
                        longitude: lot.longitude,
                        totalCapacity: lot.totalSpaces,
                        availableSlots: lot.availableSpaces,
                        baseRate: lot.baseRate,
                        occupancyPercentage: lot.occupancyPercentage
                    }));
                    
                    setParkingLots(mappedLots);

                    // Recalculate stats based on real lot data
                    const totalOcc = mappedLots.reduce((acc, lot) => acc + (lot.totalCapacity - lot.availableSlots), 0);
                    const totalCap = mappedLots.reduce((acc, lot) => acc + lot.totalCapacity, 0);

                    setCityStats(prev => ({
                        ...prev,
                        totalLots: mappedLots.length,
                        totalSpaces: totalCap,
                        currentOccupancy: totalOcc,
                        avgOccupancyRate: totalCap > 0 ? Math.round((totalOcc / totalCap) * 100) : 0
                    }));

                    // Generate congestion alerts from high occupancy lots
                    const alerts = mappedLots
                        .filter(lot => lot.occupancyPercentage >= 80)
                        .map(lot => ({
                            id: `alert-${lot.id}`,
                            area: lot.name,
                            severity: lot.occupancyPercentage >= 90 ? 'high' : 'medium',
                            message: `High occupancy detected (${lot.occupancyPercentage}%). Consider dynamic pricing.`,
                            time: 'Live'
                        }));

                    setCongestionAlerts(alerts);
                }

                setLoading(false);
            } catch (error) {
                console.error("Error fetching city dashboard data:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);



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

            {/* Main Content - Full Width Heatmap */}
            <div className="mb-8">
                <div className="glass-panel p-6">
                    <div className="section-header">
                        <div>
                            <h3 className="section-title">Parking Congestion Heatmap</h3>
                            <p className="text-sm text-secondary">Real-time occupancy heatmap across all parking facilities</p>
                        </div>
                    </div>
                    <div className="rounded-xl overflow-hidden" style={{ height: 500 }}>
                        <ParkingMap parkingLots={parkingLots} enableHeatmap={true} showBookingOptions={false} />
                    </div>
                </div>
            </div>

            {/* Occupancy Trends & Congestion Alerts at Bottom */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Occupancy Trends */}
                <div className="glass-panel p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-1">City Occupancy Trends</h3>
                    <p className="text-sm text-secondary mb-4">Real-time data visualization</p>
                    <div className="flex-center h-[200px] text-secondary">
                        <p>Historical trends data will appear here once enough data is collected.</p>
                    </div>
                </div>

                {/* Bottom Congestion Alerts */}
                <div className="glass-panel p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle size={20} className="text-warning" />
                        <h3 className="text-lg font-semibold">Active Congestion Alerts</h3>
                    </div>
                    <div className="space-y-3">
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
                </div>
            </div>
        </div>
    );
};

export default CityDashboard;
