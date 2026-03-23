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
    AlertTriangle,
    CheckCircle2
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
            icon: <Building2 size={20} />,
            color: "rgba(99,102,241,0.15)",
            textColor: "#a5b4fc",
            iconColor: "#6366f1",
            trend: "+3 this month"
        },
        {
            title: "Total Users",
            value: stats.totalUsers.toLocaleString(),
            icon: <Users size={20} />,
            color: "rgba(168,85,247,0.15)",
            textColor: "#c084fc",
            iconColor: "#a855f7",
            trend: "+127 this week"
        },
        {
            title: "Monthly Revenue",
            value: `₹${(stats.totalRevenue / 100000).toFixed(1)}L`,
            icon: <IndianRupee size={20} />,
            color: "rgba(16,185,129,0.15)",
            textColor: "#6ee7b7",
            iconColor: "#10b981",
            trend: "+12% vs last month"
        },
        {
            title: "Active Bookings",
            value: stats.activeBookings,
            icon: <Car size={20} />,
            color: "rgba(6,182,212,0.15)",
            textColor: "#67e8f9",
            iconColor: "#06b6d4",
            trend: "Right now"
        }
    ];

    const quickActions = [
        {
            title: "City Heatmap",
            description: "View city-wide parking density",
            icon: <Map size={19} />,
            link: "/admin/city",
            gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        },
        {
            title: "Analytics",
            description: "Revenue, Ratings & Predictions",
            icon: <BarChart3 size={19} />,
            link: "/admin/analytics",
            gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
        },
        {
            title: "Manage Lots",
            description: "Add or edit parking lots",
            icon: <Building2 size={19} />,
            link: "/admin/parking-lots",
            gradient: 'linear-gradient(135deg, #f59e0b, #f97316)',
        },
        {
            title: "Settings",
            description: "System configuration",
            icon: <Settings size={19} />,
            link: "/admin/settings",
            gradient: 'linear-gradient(135deg, #6366f1, #a855f7)',
        }
    ];

    const services = [
        { name: 'API Server', status: 'Healthy', detail: '12ms' },
        { name: 'Database', status: 'Healthy', detail: '3ms' },
        { name: 'WebSocket', status: 'Healthy', detail: '1,234 conn' },
        { name: 'Payment Gateway', status: 'Healthy', detail: '99.99% uptime' }
    ];

    const alertStyles = {
        warning: { border: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
        info: { border: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
        success: { border: '#10b981', bg: 'rgba(16,185,129,0.08)' },
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{
                    fontSize: 'clamp(1.625rem, 3vw, 2rem)', fontWeight: 800,
                    letterSpacing: '-0.025em', marginBottom: '0.375rem',
                }}>
                    <span className="gradient-text">Admin Overview</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    System performance and management dashboard
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
                                    {stat.value}{stat.suffix || ''}
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

            {/* Quick Actions + Alerts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(0, 320px)', gap: '1rem', marginBottom: '1.5rem' }}>
                {/* Quick Actions */}
                <div style={{
                    padding: '1.5rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '16px',
                }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', color: '#f1f5f9' }}>
                        Quick Actions
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.875rem' }}>
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

                {/* Recent Alerts */}
                <div style={{
                    padding: '1.5rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '16px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>Recent Alerts</h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        {recentAlerts.map((alert) => {
                            const s = alertStyles[alert.type];
                            return (
                                <div key={alert.id} style={{
                                    padding: '0.75rem 0.875rem',
                                    borderRadius: '10px',
                                    background: s.bg,
                                    borderLeft: `3px solid ${s.border}`,
                                }}>
                                    <p style={{ fontSize: '0.8125rem', color: '#e2e8f0', marginBottom: '0.25rem', lineHeight: 1.4 }}>
                                        {alert.message}
                                    </p>
                                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>{alert.time}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* System Status */}
            <div style={{
                padding: '1.5rem',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>System Status</h2>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                        padding: '0.3rem 0.75rem', borderRadius: '999px',
                        background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
                        color: '#6ee7b7', fontSize: '0.75rem', fontWeight: 600,
                    }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
                        All Systems Operational
                    </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                    {services.map((service, i) => (
                        <div key={i} style={{
                            padding: '0.875rem 1rem',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: '10px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                                <CheckCircle2 size={13} style={{ color: '#10b981', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9' }}>{service.name}</span>
                            </div>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>{service.detail}</p>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                @media (max-width: 900px) {
                    .admin-two-col { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;