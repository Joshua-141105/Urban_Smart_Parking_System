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

        if (user && !user.roles?.some(r => r.includes("CITY_ADMIN") || r.includes("SYSTEM_ADMIN") || r.includes("PARKING_MANAGER"))) {
            fetchDashboardData();
        }
    }, [user]);

    const getStatusBadge = (status) => {
        const statusConfig = {
            ACTIVE: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', label: 'Active' },
            COMPLETED: { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.25)', label: 'Completed' },
            CANCELLED: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', label: 'Cancelled' },
        };
        const cfg = statusConfig[status] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.25)', label: status };
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.2rem 0.6rem', borderRadius: '999px',
                background: cfg.bg, border: `1px solid ${cfg.border}`,
                color: cfg.color, fontSize: '0.72rem', fontWeight: 600,
            }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: cfg.color }} />
                {cfg.label}
            </span>
        );
    };

    const quickStats = [
        {
            title: "Active Bookings",
            value: stats.activeBookings,
            icon: <Car size={20} />,
            color: "rgba(16,185,129,0.15)",
            textColor: "#6ee7b7",
            iconColor: "#10b981",
            trend: "Right now",
        },
        {
            title: "Total Bookings",
            value: stats.totalBookings,
            icon: <History size={20} />,
            color: "rgba(99,102,241,0.15)",
            textColor: "#a5b4fc",
            iconColor: "#6366f1",
            trend: "All time",
        },
        {
            title: "Total Spent",
            value: `₹${stats.totalSpent.toLocaleString()}`,
            icon: <CreditCard size={20} />,
            color: "rgba(168,85,247,0.15)",
            textColor: "#c084fc",
            iconColor: "#a855f7",
            trend: "Lifetime",
        },
        {
            title: "Time Saved",
            value: `${stats.savedTime} min`,
            icon: <Clock size={20} />,
            color: "rgba(6,182,212,0.15)",
            textColor: "#67e8f9",
            iconColor: "#06b6d4",
            trend: "This month",
        },
    ];

    const quickActions = [
        {
            title: "Find Parking",
            description: "Search for nearby parking spots",
            icon: <MapPin size={19} />,
            link: "/find-parking",
            gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        },
        {
            title: "My Bookings",
            description: "View and manage your bookings",
            icon: <History size={19} />,
            link: "/bookings",
            gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
        },
        {
            title: "Permits",
            description: "Monthly parking passes",
            icon: <FileText size={19} />,
            link: "/permits",
            gradient: 'linear-gradient(135deg, #f59e0b, #f97316)',
        }
    ];

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{
                    fontSize: 'clamp(1.625rem, 3vw, 2rem)', fontWeight: 800,
                    letterSpacing: '-0.025em', marginBottom: '0.375rem',
                }}>
                    Welcome back, <span className="gradient-text">{user?.username}</span>!
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Here's what's happening with your parking today.
                </p>
            </div>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem', marginBottom: '1.5rem',
            }}>
                {quickStats.map((stat, index) => (
                    <div key={index} style={{
                        padding: '1.375rem',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '14px',
                        position: 'relative', overflow: 'hidden',
                        transition: 'border-color 0.2s, transform 0.2s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                    {stat.title}
                                </p>
                                <p style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1, color: stat.textColor }}>
                                    {stat.value}
                                </p>
                            </div>
                            <div style={{
                                width: '42px', height: '42px', borderRadius: '11px', flexShrink: 0,
                                background: stat.color, color: stat.iconColor,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                {stat.icon}
                            </div>
                        </div>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                            fontSize: '0.75rem', fontWeight: 600,
                            color: stat.iconColor, background: stat.color,
                            padding: '0.2rem 0.5rem', borderRadius: '6px',
                        }}>
                            <TrendingUp size={11} /> {stat.trend}
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div style={{
                padding: '1.5rem',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px',
                marginBottom: '1.5rem',
            }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', color: '#f1f5f9' }}>
                    Quick Actions
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.875rem' }}>
                    {quickActions.map((action, index) => (
                        <Link key={index} to={action.link} style={{
                            padding: '1.125rem',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: '12px',
                            textDecoration: 'none',
                            display: 'flex', flexDirection: 'column', gap: '0.875rem',
                            transition: 'border-color 0.2s, transform 0.2s, background 0.2s',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                                    background: action.gradient,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
                                }}>
                                    {action.icon}
                                </div>
                                <ArrowRight size={14} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
                            </div>
                            <div>
                                <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#f1f5f9', marginBottom: '0.25rem' }}>{action.title}</p>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>{action.description}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Bookings */}
            <div style={{
                padding: '1.5rem',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <History size={16} style={{ color: '#6366f1' }} />
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>Recent Bookings</h2>
                    </div>
                    <Link to="/bookings" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                        fontSize: '0.8rem', fontWeight: 600, color: '#a5b4fc',
                        textDecoration: 'none', transition: 'color 0.2s',
                    }}>
                        View All <ArrowRight size={14} />
                    </Link>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[1, 2].map(i => (
                            <div key={i} style={{
                                padding: '1.125rem',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: '12px',
                            }}>
                                <div style={{ height: '1rem', width: '50%', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', marginBottom: '0.625rem' }} />
                                <div style={{ height: '0.75rem', width: '75%', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }} />
                            </div>
                        ))}
                    </div>
                ) : recentBookings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                        <Car size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>No bookings yet</p>
                        <Link to="/find-parking" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.6rem 1.25rem', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: '#fff', fontWeight: 600, fontSize: '0.875rem',
                            textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s',
                            boxShadow: '0 3px 12px rgba(99,102,241,0.3)',
                        }}>
                            <MapPin size={16} /> Find Parking
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {recentBookings.map((booking) => (
                            <div key={booking.id} style={{
                                padding: '1.125rem',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: '12px',
                                display: 'flex', alignItems: 'center', gap: '1rem',
                                transition: 'border-color 0.2s, transform 0.2s',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '11px', flexShrink: 0,
                                    background: 'rgba(99,102,241,0.15)', color: '#6366f1',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Car size={22} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                                        <h4 style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                                            {booking.parkingLotName}
                                        </h4>
                                        {getStatusBadge(booking.status)}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                            <Calendar size={12} /> {booking.date}
                                        </span>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                            <Clock size={12} /> {booking.time}
                                        </span>
                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                            {booking.duration}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <p style={{ fontSize: '1.125rem', fontWeight: 800, color: '#c084fc', margin: 0 }}>₹{booking.amount}</p>
                                    {booking.status === 'ACTIVE' && (
                                        <button
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                                                marginTop: '0.5rem', padding: '0.35rem 0.75rem',
                                                borderRadius: '8px', border: 'none', cursor: 'pointer',
                                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                color: '#fff', fontSize: '0.75rem', fontWeight: 600,
                                                transition: 'transform 0.2s, box-shadow 0.2s',
                                                boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                                            onClick={() => navigate(`/navigation?lat=${booking.latitude}&lon=${booking.longitude}&name=${encodeURIComponent(booking.parkingLotName)}`)}
                                        >
                                            <Navigation size={12} />
                                            Navigate
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                @media (max-width: 640px) {
                    .driver-stats-grid { grid-template-columns: 1fr 1fr !important; }
                }
                @media (max-width: 400px) {
                    .driver-stats-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
