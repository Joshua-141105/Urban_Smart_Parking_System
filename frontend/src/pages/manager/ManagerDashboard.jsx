import { useState, useEffect } from "react";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";
import {
    Building2,
    Car,
    IndianRupee,
    TrendingUp,
    Users,
    Settings, 
    AlertTriangle,
    CheckCircle2,
    XCircle,
    LayoutGrid,
    FileText,
    MessageSquare,
    Download,
    Save
} from "lucide-react";

const ManagerDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [stats, setStats] = useState({});
    const [revenueData, setRevenueData] = useState([]);
    const [peakHoursData, setPeakHoursData] = useState([]);
    const [occupancyData, setOccupancyData] = useState([]);

    // Spaces State
    const [spaces, setSpaces] = useState([]);

    // Pricing State
    const [pricing, setPricing] = useState({
        baseRate: 40,
        weekendMultiplier: 1.2,
        holidayMultiplier: 1.5,
        zones: [
            { id: 1, name: "Premium Zone A", multiplier: 1.5 },
            { id: 2, name: "Standard Zone B", multiplier: 1.0 },
            { id: 3, name: "Economy Zone C", multiplier: 0.8 }
        ]
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // In a real app, we'd get the manager's assigned lot ID from their profile
                // For demo, we'll use ID 1
                const lotId = 1;

                // Fetch Stats
                // Note: You need to import api from whatever axios helper you have, e.g. import api from "../../api/axios";
                // If not available, use axios directly or fetch
                // Assuming api instance exists as per common patterns

                // We will use standard fetch for now to be safe or axios if I see it in imports
                // Let's use the local state setters

                // Fetch basic stats
                const statsRes = await fetch(`http://localhost:8080/api/analytics/manager-stats?lotId=${lotId}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (statsRes.ok) {
                    const data = await statsRes.json();
                    setStats({
                        totalSpaces: data.totalCapacity,
                        occupiedSpaces: data.occupiedSpaces,
                        todayRevenue: data.todayRevenue,
                        weekRevenue: data.todayRevenue * 7, // approximate for now
                        avgOccupancy: data.occupancyPercent,
                        todayBookings: data.occupiedSpaces + 12 // approximate
                    });
                }

                // Fetch Spaces
                const spacesRes = await fetch(`http://localhost:8080/api/parking/${lotId}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (spacesRes.ok) {
                    const data = await spacesRes.json();
                    const mappedSpaces = data.spaces.map(s => ({
                        id: s.id,
                        number: s.spaceNumber,
                        status: s.isOccupied ? 'OCCUPIED' : s.isMaintenance ? 'MAINTENANCE' : 'AVAILABLE',
                        type: s.vehicleType || 'STANDARD'
                    }));
                    setSpaces(mappedSpaces);
                }

                setLoading(false);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSpaceClick = (id) => {
        setSpaces(spaces.map(space => {
            if (space.id === id) {
                // Cycle states for demo: AVAILABLE -> MAINTENANCE -> AVAILABLE
                if (space.status === 'AVAILABLE') return { ...space, status: 'MAINTENANCE' };
                if (space.status === 'MAINTENANCE') return { ...space, status: 'AVAILABLE' };
            }
            return space;
        }));
    };

    const handlePricingChange = (e, field, zoneId = null) => {
        if (zoneId) {
            setPricing({
                ...pricing,
                zones: pricing.zones.map(z => z.id === zoneId ? { ...z, [field]: parseFloat(e.target.value) } : z)
            });
        } else {
            setPricing({ ...pricing, [field]: parseFloat(e.target.value) });
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'AVAILABLE': return 'bg-emerald-500/20 border-emerald-500 text-emerald-500';
            case 'OCCUPIED': return 'bg-indigo-500/20 border-indigo-500 text-indigo-500';
            case 'MAINTENANCE': return 'bg-red-500/20 border-red-500 text-red-500';
            default: return 'bg-gray-500/20 border-gray-500 text-gray-500';
        }
    };

    if (loading) {
        return (
            <div className="flex-center min-h-[400px]">
                <div className="animate-spin w-10 h-10 rounded-full border-3 border-accent-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">
                        <span className="gradient-text">Lot Manager Dashboard</span>
                    </h1>
                    <p className="text-secondary">Manage Main Street Parking Complex</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-secondary text-sm">
                        <Download size={16} className="mr-2" />
                        Export Report
                    </button>
                    <button className="btn btn-primary text-sm">
                        <Settings size={16} className="mr-2" />
                        Lot Settings
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                {[
                    { id: 'overview', label: 'Overview', icon: <LayoutGrid size={18} /> },
                    { id: 'spaces', label: 'Spaces', icon: <Car size={18} /> },
                    { id: 'pricing', label: 'Pricing', icon: <IndianRupee size={18} /> },
                    { id: 'reports', label: 'Reports', icon: <TrendingUp size={18} /> },
                    { id: 'feedback', label: 'Feedback', icon: <MessageSquare size={18} /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap font-medium ${activeTab === tab.id
                            ? 'bg-gradient-to-r from-accent-primary to-purple-600 text-white shadow-lg shadow-accent-primary/25'
                            : 'text-secondary hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'
                            }`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <div className="animate-fade-in space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="stat-card">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="stat-label mb-2">Today's Revenue</p>
                                    <p className="stat-value text-emerald-400">₹{stats.todayRevenue?.toLocaleString() || 0}</p>
                                </div>
                                <div className="stat-icon bg-emerald-500/10 text-emerald-500">
                                    <IndianRupee size={22} />
                                </div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="stat-label mb-2">Current Occupancy</p>
                                    <p className="stat-value">{stats.occupiedSpaces || 0}<span className="text-lg text-secondary">/{stats.totalSpaces || 0}</span></p>
                                </div>
                                <div className="stat-icon bg-indigo-500/10 text-indigo-500">
                                    <Car size={22} />
                                </div>
                            </div>
                            <div className="w-full bg-white/10 h-1.5 rounded-full mt-4 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-500"
                                    style={{ width: `${stats.totalSpaces ? (stats.occupiedSpaces / stats.totalSpaces) * 100 : 0}%` }}
                                />
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="stat-label mb-2">Occupancy Rate</p>
                                    <p className="stat-value">{stats.avgOccupancy || 0}%</p>
                                </div>
                                <div className="stat-icon bg-purple-500/10 text-purple-500">
                                    <Users size={22} />
                                </div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="stat-label mb-2">Available Spaces</p>
                                    <p className="stat-value text-cyan-400">{(stats.totalSpaces - stats.occupiedSpaces) || 0}</p>
                                </div>
                                <div className="stat-icon bg-cyan-500/10 text-cyan-500">
                                    <CheckCircle2 size={22} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="glass-panel p-6">
                        <h3 className="section-title mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <button className="glass-card p-4 flex flex-col items-center gap-3 hover:bg-white/5 transition-colors group">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex-center text-emerald-500 group-hover:scale-110 transition-transform">
                                    <Car size={24} />
                                </div>
                                <span className="text-sm font-medium">View Spaces</span>
                            </button>
                            <button className="glass-card p-4 flex flex-col items-center gap-3 hover:bg-white/5 transition-colors group">
                                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex-center text-indigo-500 group-hover:scale-110 transition-transform">
                                    <IndianRupee size={24} />
                                </div>
                                <span className="text-sm font-medium">Update Pricing</span>
                            </button>
                            <button className="glass-card p-4 flex flex-col items-center gap-3 hover:bg-white/5 transition-colors group">
                                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex-center text-amber-500 group-hover:scale-110 transition-transform">
                                    <AlertTriangle size={24} />
                                </div>
                                <span className="text-sm font-medium">Maintenance</span>
                            </button>
                            <button className="glass-card p-4 flex flex-col items-center gap-3 hover:bg-white/5 transition-colors group">
                                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex-center text-purple-500 group-hover:scale-110 transition-transform">
                                    <TrendingUp size={24} />
                                </div>
                                <span className="text-sm font-medium">View Reports</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SPACES TAB */}
            {activeTab === 'spaces' && (
                <div className="animate-fade-in space-y-6">
                    <div className="glass-panel p-6">
                        <div className="section-header">
                            <h3 className="section-title">Live Parking Grid</h3>
                            <div className="flex flex-wrap gap-4 text-sm">
                                <span className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                    Available
                                </span>
                                <span className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                                    Occupied
                                </span>
                                <span className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                    Maintenance
                                </span>
                            </div>
                        </div>

                        {spaces.length > 0 ? (
                            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                                {spaces.map((space) => (
                                    <button
                                        key={space.id}
                                        onClick={() => handleSpaceClick(space.id)}
                                        disabled={space.status === 'OCCUPIED'}
                                        className={`
                                            aspect-square rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-all
                                            hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70
                                            ${getStatusColor(space.status)}
                                        `}
                                    >
                                        <span className="text-[10px] font-mono font-bold opacity-80">{space.number}</span>
                                        {space.status === 'OCCUPIED' && <Car size={16} />}
                                        {space.status === 'MAINTENANCE' && <AlertTriangle size={16} />}
                                        {space.status === 'AVAILABLE' && <CheckCircle2 size={16} />}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <Car size={48} className="empty-state-icon" />
                                <p className="empty-state-title">No spaces found</p>
                                <p className="empty-state-text">Parking spaces will appear here once loaded from the system.</p>
                            </div>
                        )}

                        <p className="text-xs text-secondary mt-6 text-center border-t border-white/10 pt-4">
                            Click <span className="text-emerald-400">AVAILABLE</span> to mark for maintenance • Click <span className="text-red-400">MAINTENANCE</span> to reopen
                        </p>
                    </div>
                </div>
            )}

            {/* PRICING TAB */}
            {activeTab === 'pricing' && (
                <div className="animate-fade-in">
                    <div className="glass-panel p-6 md:p-8 max-w-3xl">
                        <div className="section-header">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-accent-primary/20 flex-center text-accent-primary">
                                    <IndianRupee size={20} />
                                </div>
                                <h3 className="section-title">Pricing Configuration</h3>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* Base Rates */}
                            <div>
                                <h4 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-4">Base Rates</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm text-secondary">Hourly Rate (₹)</label>
                                        <input
                                            type="number"
                                            value={pricing.baseRate}
                                            onChange={(e) => handlePricingChange(e, 'baseRate')}
                                            className="input-field"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-secondary">Weekend Multiplier</label>
                                        <input
                                            type="number" step="0.1"
                                            value={pricing.weekendMultiplier}
                                            onChange={(e) => handlePricingChange(e, 'weekendMultiplier')}
                                            className="input-field"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="divider" />

                            {/* Zone Multipliers */}
                            <div>
                                <h4 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-4">Zone Multipliers</h4>
                                <div className="space-y-3">
                                    {pricing.zones.map(zone => (
                                        <div key={zone.id} className="glass-card-static p-4 flex items-center justify-between">
                                            <span className="font-medium">{zone.name}</span>
                                            <div className="w-24">
                                                <input
                                                    type="number" step="0.1"
                                                    value={zone.multiplier}
                                                    onChange={(e) => handlePricingChange(e, 'multiplier', zone.id)}
                                                    className="input-field text-center"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button className="btn btn-primary">
                                    <Save size={18} />
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* REPORTS TAB */}
            {activeTab === 'reports' && (
                <div className="animate-fade-in space-y-6">
                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-lg">
                        <div>
                            <h3 className="font-semibold">Export Data</h3>
                            <p className="text-sm text-secondary">Download detailed reports in CSV/PDF format</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-secondary text-sm">Last 30 Days</button>
                            <button className="btn btn-primary text-sm"><Download size={16} className="mr-2" /> Download CSV</button>
                        </div>
                    </div>

                    <div className="glass-panel p-6">
                        <h3 className="font-semibold mb-4">Peak Occupancy Analysis</h3>
                        <div className="flex-center h-[200px] text-secondary">
                            <p>Historical data visualization will be available after gathering sufficient logs.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* FEEDBACK TAB */}
            {activeTab === 'feedback' && (
                <div className="animate-fade-in">
                    <div className="flex-center h-[200px] text-secondary glass-panel">
                        <p>No new feedback entries.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerDashboard;
