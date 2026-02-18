import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    BarChart3,
    Users,
    Map,
    TrendingUp,
    Building2,
    Car,
    IndianRupee,
    Activity,
    ArrowRight,
    Settings,
    AlertTriangle
} from "lucide-react";

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalLots: 50,
        totalUsers: 1240,
        totalRevenue: 1580000,
        activeBookings: 312
    });

    const [recentAlerts, setRecentAlerts] = useState([
        { id: 1, type: 'warning', message: 'MG Road Parking at 95% capacity', time: '2 mins ago' },
        { id: 2, type: 'info', message: 'Price surge activated in Koramangala', time: '15 mins ago' },
        { id: 3, type: 'success', message: 'New parking lot added: HSR Layout', time: '1 hour ago' }
    ]);

    const quickStats = [
        {
            title: "Parking Lots",
            value: stats.totalLots,
            suffix: "+",
            icon: <Building2 size={24} />,
            color: "rgba(99, 102, 241, 0.15)",
            textColor: "var(--accent-secondary)",
            trend: "+3 this month"
        },
        {
            title: "Total Users",
            value: stats.totalUsers.toLocaleString(),
            icon: <Users size={24} />,
            color: "rgba(139, 92, 246, 0.15)",
            textColor: "#a855f7",
            trend: "+127 this week"
        },
        {
            title: "Monthly Revenue",
            value: `₹${(stats.totalRevenue / 100000).toFixed(1)}L`,
            icon: <IndianRupee size={24} />,
            color: "rgba(16, 185, 129, 0.15)",
            textColor: "var(--success)",
            trend: "+12% vs last month"
        },
        {
            title: "Active Bookings",
            value: stats.activeBookings,
            icon: <Car size={24} />,
            color: "rgba(6, 182, 212, 0.15)",
            textColor: "#06b6d4",
            trend: "Right now"
        }
    ];

    const quickActions = [
        { title: "City Heatmap", description: "View city-wide parking density", icon: <Map size={20} />, link: "/admin/city" },
        { title: "Analytics", description: "Revenue, Ratings & Predictions", icon: <BarChart3 size={20} />, link: "/admin/analytics" },
        { title: "Manage Lots", description: "Add or edit parking lots", icon: <Building2 size={20} />, link: "/admin/parking-lots" },
        { title: "Settings", description: "System configuration", icon: <Settings size={20} />, link: "/admin/settings" }
    ];

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">
                    <span className="gradient-text">Admin Overview</span>
                </h1>
                <p className="text-secondary">System performance and management dashboard</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-6 mb-8">
                {quickStats.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <div
                            className="stat-icon"
                            style={{ background: stat.color, color: stat.textColor }}
                        >
                            {stat.icon}
                        </div>
                        <div className="stat-value" style={{ color: stat.textColor }}>
                            {stat.value}{stat.suffix || ''}
                        </div>
                        <div className="stat-label">{stat.title}</div>
                        <div className="stat-trend up">
                            <TrendingUp size={14} />
                            {stat.trend}
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-3 gap-6 mb-8">
                {/* Quick Actions */}
                <div className="col-span-2 glass-panel p-6">
                    <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {quickActions.map((action, index) => (
                            <Link
                                key={index}
                                to={action.link}
                                className="glass-card p-4 flex flex-col items-start gap-3 group relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg"
                            >
                                <div className="flex w-full justify-between items-start">
                                    <div
                                        className="w-12 h-12 rounded-xl flex-center text-white shadow-lg"
                                        style={{
                                            background: index === 0 ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' :
                                                index === 1 ? 'linear-gradient(135deg, #10b981, #06b6d4)' :
                                                    'linear-gradient(135deg, #f59e0b, #ef4444)'
                                        }}
                                    >
                                        {action.icon}
                                    </div>
                                    <ArrowRight size={18} className="text-secondary group-hover:text-white group-hover:translate-x-1 transition-transform" />
                                </div>

                                <div>
                                    <h4 className="font-semibold text-lg group-hover:text-white transition-colors">{action.title}</h4>
                                    <p className="text-xs text-secondary group-hover:text-gray-300 transition-colors line-clamp-2">
                                        {action.description}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent Alerts */}
                <div className="glass-panel p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle size={18} className="text-warning" />
                        <h2 className="text-lg font-semibold">Recent Alerts</h2>
                    </div>
                    <div className="space-y-3">
                        {recentAlerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`glass-card-static p-3 border-l-4 ${alert.type === 'warning' ? 'border-l-yellow-500' :
                                    alert.type === 'info' ? 'border-l-blue-500' : 'border-l-green-500'
                                    }`}
                            >
                                <p className="text-sm mb-1">{alert.message}</p>
                                <p className="text-xs text-muted">{alert.time}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* System Status */}
            <div className="glass-panel p-6">
                <div className="flex-between mb-4">
                    <h2 className="text-lg font-semibold">System Status</h2>
                    <span className="badge badge-success">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
                        All Systems Operational
                    </span>
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {[
                        { name: 'API Server', status: 'Healthy', latency: '12ms' },
                        { name: 'Database', status: 'Healthy', latency: '3ms' },
                        { name: 'WebSocket', status: 'Healthy', connections: '1,234' },
                        { name: 'Payment Gateway', status: 'Healthy', uptime: '99.99%' }
                    ].map((service, i) => (
                        <div key={i} className="glass-card-static p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span className="font-medium">{service.name}</span>
                            </div>
                            <p className="text-sm text-secondary">
                                {service.latency || service.connections || service.uptime}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
