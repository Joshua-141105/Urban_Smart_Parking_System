import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useWebSocket } from "../../context/WebSocketContext";
import {
    Car,
    MapPin,
    Clock,
    Calendar,
    CreditCard,
    TrendingUp,
    ArrowRight,
    Navigation,
    History,
    FileText
} from "lucide-react";
import api from "../../api/axios";

const Dashboard = () => {
    const { user } = useAuth();
    const { bookingUpdates } = useWebSocket();
    const [stats, setStats] = useState({
        activeBookings: 0,
        totalBookings: 12,
        totalSpent: 2450,
        savedTime: 45
    });
    const [recentBookings, setRecentBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Redirect admins to admin dashboard
    useEffect(() => {
        if (user?.roles?.some(role => role.includes("CITY_ADMIN") || role.includes("SYSTEM_ADMIN"))) {
            navigate("/admin/dashboard");
        }
    }, [user, navigate]);

    useEffect(() => {
        if (bookingUpdates && bookingUpdates.length > 0) {
            const latestUpdate = bookingUpdates[0]; // Get the newest update

            // Update Recent Bookings list if the updated booking is present
            setRecentBookings(prev => prev.map(item =>
                item.id === latestUpdate.id ? { ...item, status: latestUpdate.status } : item
            ));

            // Update stats if status changed to COMPLETED
            if (latestUpdate.status === 'COMPLETED') {
                setStats(prev => ({
                    ...prev,
                    activeBookings: Math.max(0, prev.activeBookings - 1)
                }));
            }
        }
    }, [bookingUpdates]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const res = await api.get("/bookings/user");
                const allBookings = res.data;

                // Calculate Stats
                const active = allBookings.filter(b => b.status === "ACTIVE").length;
                const completed = allBookings.filter(b => b.status === "COMPLETED").length;
                const spent = allBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

                // Calculate time saved (dummy formula for now based on bookings)
                const saved = (active + completed) * 15;

                setStats({
                    activeBookings: active,
                    totalBookings: allBookings.length,
                    totalSpent: spent,
                    savedTime: saved
                });

                // Format Recent Bookings (Top 2)
                const sortedRecent = allBookings
                    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
                    .slice(0, 2)
                    .map(b => ({
                        id: b.id,
                        parkingLotName: b.parkingSpace.parkingLot.name,
                        latitude: b.parkingSpace.parkingLot.latitude,
                        longitude: b.parkingSpace.parkingLot.longitude,
                        vehicleNumber: b.vehicleNumber || "N/A",
                        date: new Date(b.startTime).toLocaleDateString(),
                        time: new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        duration: `${Math.round((new Date(b.endTime) - new Date(b.startTime)) / (1000 * 60 * 60))} hours`,
                        amount: b.totalAmount,
                        status: b.status
                    }));

                setRecentBookings(sortedRecent);
            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'ACTIVE':
                return <span className="badge badge-success">Active</span>;
            case 'COMPLETED':
                return <span className="badge badge-neutral">Completed</span>;
            case 'CANCELLED':
                return <span className="badge badge-danger">Cancelled</span>;
            default:
                return <span className="badge badge-neutral">{status}</span>;
        }
    };

    const quickActions = [
        {
            title: "Find Parking",
            description: "Search for nearby parking spots",
            icon: <MapPin size={24} />,
            link: "/find-parking",
            color: "from-indigo-500 to-purple-600"
        },
        {
            title: "My Bookings",
            description: "View and manage your bookings",
            icon: <History size={24} />,
            link: "/bookings",
            color: "from-emerald-500 to-teal-600"
        },
        {
            title: "Permits",
            description: "Monthly parking passes",
            icon: <FileText size={24} />,
            link: "/permits",
            color: "from-orange-500 to-red-600"
        }
    ];

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <h1 className="page-title">
                    Welcome back, <span className="gradient-text">{user?.username}</span>!
                </h1>
                <p className="page-subtitle">Here's what's happening with your parking today.</p>
            </div>

            {/* Stats Grid */}
            <div className="stats-flex-container">
                <div className="stat-card">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="stat-label mb-2">Active Bookings</p>
                            <p className="stat-value text-emerald-400">{stats.activeBookings}</p>
                        </div>
                        <div className="stat-icon bg-emerald-500/10 text-emerald-500">
                            <Car size={22} />
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="stat-label mb-2">Total Bookings</p>
                            <p className="stat-value">{stats.totalBookings}</p>
                        </div>
                        <div className="stat-icon bg-indigo-500/10 text-indigo-500">
                            <History size={22} />
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="stat-label mb-2">Total Spent</p>
                            <p className="stat-value text-purple-400">₹{stats.totalSpent.toLocaleString()}</p>
                        </div>
                        <div className="stat-icon bg-purple-500/10 text-purple-500">
                            <CreditCard size={22} />
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="stat-label mb-2">Time Saved</p>
                            <p className="stat-value text-cyan-400">{stats.savedTime}<span className="text-lg"> min</span></p>
                            <p className="text-xs text-secondary mt-1">This month</p>
                        </div>
                        <div className="stat-icon bg-cyan-500/10 text-cyan-500">
                            <Clock size={22} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h2 className="section-title mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {quickActions.map((action, index) => (
                        <Link
                            key={index}
                            to={action.link}
                            className="glass-card p-5 flex items-center gap-4 group hover:border-white/20"
                        >
                            <div className={`w-12 h-12 rounded-xl flex-center text-white shrink-0 bg-gradient-to-br ${action.color}`}>
                                {action.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold group-hover:text-accent-secondary transition-colors">{action.title}</h3>
                                <p className="text-sm text-secondary truncate">{action.description}</p>
                            </div>
                            <ArrowRight size={18} className="text-muted group-hover:text-accent-secondary group-hover:translate-x-1 transition-all shrink-0" />
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Bookings */}
            <div className="glass-panel p-6">
                <div className="section-header">
                    <h2 className="section-title">Recent Bookings</h2>
                    <Link to="/bookings" className="text-accent-secondary text-sm hover:underline flex items-center gap-1">
                        View All <ArrowRight size={14} />
                    </Link>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2].map(i => (
                            <div key={i} className="glass-card-static p-4">
                                <div className="skeleton skeleton-title"></div>
                                <div className="skeleton skeleton-text w-3/4"></div>
                            </div>
                        ))}
                    </div>
                ) : recentBookings.length === 0 ? (
                    <div className="text-center py-8">
                        <Car size={48} className="mx-auto mb-4 text-muted" />
                        <p className="text-secondary">No bookings yet</p>
                        <Link to="/find-parking" className="btn btn-primary mt-4">
                            Find Parking
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {recentBookings.map((booking) => (
                            <div key={booking.id} className="glass-card-static p-4 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg flex-center shrink-0" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>
                                    <Car size={24} className="text-accent" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold truncate">{booking.parkingLotName}</h4>
                                        {getStatusBadge(booking.status)}
                                    </div>
                                    <p className="text-sm text-secondary flex items-center gap-3">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {booking.date}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} />
                                            {booking.time}
                                        </span>
                                        <span>{booking.duration}</span>
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-lg font-bold">₹{booking.amount}</p>
                                    {booking.status === 'ACTIVE' && (
                                        <button
                                            className="btn btn-primary btn-sm mt-1"
                                            onClick={() => navigate(`/navigation?lat=${booking.latitude}&lon=${booking.longitude}&name=${encodeURIComponent(booking.parkingLotName)}`)}
                                        >
                                            <Navigation size={14} />
                                            Navigate
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
