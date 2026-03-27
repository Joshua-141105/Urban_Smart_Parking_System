import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import {
    LayoutDashboard,
    MapPin,
    LogOut,
    Menu,
    X,
    History,
    FileText,
    Building2,
    BarChart3,
    Map,
    Bell,
    User,
    LogIn,
    Settings,
    Car,
    Users
} from "lucide-react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import AnimatedBackground from "../components/AnimatedBackground";

const MainLayout = () => {
    const { user, logout } = useAuth();
    const { unreadCount } = useNotifications();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (sidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [sidebarOpen]);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const isActive = (path) => location.pathname === path;

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const getNavItems = () => {
        if (!user) {
            return [
                { name: "Find Parking", path: "/find-parking", icon: <MapPin size={18} /> },
            ];
        }

        const roles = user?.roles?.map(r => r.replace("ROLE_", "")) || [];

        if (roles.includes("DRIVER")) {
            return [
                { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={18} /> },
                { name: "Find Parking", path: "/find-parking", icon: <MapPin size={18} /> },
                { name: "My Bookings", path: "/bookings", icon: <History size={18} /> },
                { name: "Permits", path: "/permits", icon: <FileText size={18} /> },
                { name: "Notifications", path: "/notifications", icon: <Bell size={18} /> },
                { name: "User Profile", path: "/profile", icon: <User size={18} /> },
            ];
        }

        if (roles.includes("PARKING_MANAGER")) {
            return [
                { name: "Dashboard", path: "/manager/dashboard", icon: <LayoutDashboard size={18} /> },
                { name: "Find Parking", path: "/find-parking", icon: <MapPin size={18} /> },
                { name: "My Lots", path: "/manager/lots", icon: <Building2 size={18} /> },
                { name: "Bookings", path: "/admin/all-bookings", icon: <History size={18} /> },
                { name: "Spot Booking", path: "/admin/booking", icon: <FileText size={18} /> },
                { name: "Profile", path: "/profile", icon: <User size={18} /> },
            ];
        }

        if (roles.includes("CITY_ADMIN") || roles.includes("SYSTEM_ADMIN")) {
            const adminRoutes = [
                { name: "Overview", path: "/admin/dashboard", icon: <LayoutDashboard size={18} /> },
                { name: "City Heatmap", path: "/admin/city", icon: <Map size={18} /> },
                { name: "Analytics", path: "/admin/analytics", icon: <BarChart3 size={18} /> },
                { name: "All Bookings", path: "/admin/all-bookings", icon: <History size={18} /> },
                { name: "Parking Lots", path: "/admin/parking-lots", icon: <Building2 size={18} /> }
            ];

            if (roles.includes("CITY_ADMIN")) {
                adminRoutes.push({ name: "Spot Booking", path: "/admin/booking", icon: <FileText size={18} /> });
            }

            if (roles.includes("SYSTEM_ADMIN")) {
                adminRoutes.push({ name: "User Management", path: "/admin/users", icon: <Users size={18} /> });
            }

            adminRoutes.push({ name: "Settings", path: "/admin/settings", icon: <Settings size={18} /> });

            return adminRoutes;
        }

        return [
            { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={18} /> },
            { name: "Find Parking", path: "/find-parking", icon: <MapPin size={18} /> },
        ];
    };

    const navItems = getNavItems();
    const roleLabel = user?.roles?.[0]?.replace('ROLE_', '').replace('_', ' ') || '';
    const initial = user?.username?.charAt(0).toUpperCase() || '';

    return (
        <div className="flex" style={{ height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            <AnimatedBackground />

            {/* Backdrop */}
            <div
                className="fixed inset-0 z-20"
                style={{
                    background: sidebarOpen ? 'rgba(10,15,26,0.75)' : 'transparent',
                    backdropFilter: sidebarOpen ? 'blur(6px)' : 'none',
                    WebkitBackdropFilter: sidebarOpen ? 'blur(6px)' : 'none',
                    opacity: sidebarOpen ? 1 : 0,
                    pointerEvents: sidebarOpen ? 'auto' : 'none',
                    transition: 'all 0.25s ease',
                }}
                onClick={() => setSidebarOpen(false)}
            />

            {/* ── SIDEBAR ── */}
            <aside style={{
                position: 'fixed', top: 0, left: 0, bottom: 0,
                width: '252px', zIndex: 30,
                background: 'rgba(11,16,28,0.98)',
                backdropFilter: 'blur(20px)',
                borderRight: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', flexDirection: 'column',
                height: '100vh',
                transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
            }}>
                {/* Sidebar Header */}
                <div style={{
                    padding: '0 1.125rem',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    height: '64px', flexShrink: 0,
                }}>
                    <Link to="/" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '9px',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 3px 10px rgba(99,102,241,0.35)',
                        }}>
                            <Car size={15} color="#fff" />
                        </div>
                        <span style={{
                            fontSize: '1.0625rem', fontWeight: 700, letterSpacing: '-0.01em',
                            background: 'linear-gradient(135deg, #e0e7ff, #a5b4fc)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        }}>ParkVerse</span>
                    </Link>
                    <button onClick={toggleSidebar} className="btn-close">
                        <X size={18} />
                    </button>
                </div>

                {/* Nav Items */}
                <nav style={{ flex: 1, padding: '0.75rem', overflowY: 'auto' }}>
                    {/* Optional section label */}
                    {user && (
                        <p style={{
                            fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.07em',
                            textTransform: 'uppercase', color: 'var(--text-muted)',
                            padding: '0.5rem 0.75rem 0.75rem',
                        }}>Navigation</p>
                    )}
                    <ul style={{ listStyle: 'none' }}>
                        {navItems.map((item) => (
                            <li key={item.path} style={{ marginBottom: '0.125rem' }}>
                                <Link
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                                        padding: '0.625rem 0.875rem',
                                        borderRadius: '9px', textDecoration: 'none',
                                        fontSize: '0.875rem', fontWeight: isActive(item.path) ? 600 : 500,
                                        color: isActive(item.path) ? '#fff' : 'var(--text-secondary)',
                                        background: isActive(item.path)
                                            ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.18))'
                                            : 'transparent',
                                        boxShadow: isActive(item.path) ? 'inset 0 0 0 1px rgba(99,102,241,0.3)' : 'none',
                                        transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={e => {
                                        if (!isActive(item.path)) {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                            e.currentTarget.style.color = '#fff';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!isActive(item.path)) {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = 'var(--text-secondary)';
                                        }
                                    }}
                                >
                                    <span style={{ color: isActive(item.path) ? '#a5b4fc' : 'inherit', flexShrink: 0 }}>
                                        {item.icon}
                                    </span>
                                    {item.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* User Footer */}
                {user ? (
                    <div style={{
                        padding: '0.875rem', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
                    }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.625rem 0.75rem', marginBottom: '0.75rem',
                            borderRadius: '10px', background: 'rgba(255,255,255,0.04)',
                        }}>
                            <div style={{
                                width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.875rem', fontWeight: 700, color: '#fff',
                            }}>{initial}</div>
                            <div style={{ minWidth: 0 }}>
                                <p style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {user?.username}
                                </p>
                                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, textTransform: 'capitalize' }}>
                                    {roleLabel}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => { handleLogout(); setSidebarOpen(false); }}
                            style={{
                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                padding: '0.625rem', borderRadius: '9px',
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                color: '#fca5a5', fontWeight: 600, fontSize: '0.8125rem',
                                cursor: 'pointer', transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                        >
                            <LogOut size={15} /> Sign Out
                        </button>
                    </div>
                ) : (
                    <div style={{ padding: '0.875rem', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                        <Link to="/login" className="btn btn-primary w-full" onClick={() => setSidebarOpen(false)}
                            style={{ borderRadius: '9px', height: '40px', fontSize: '0.875rem' }}>
                            <LogIn size={15} /> Sign In
                        </Link>
                    </div>
                )}
            </aside>

            {/* ── MAIN CONTENT ── */}
            <div className="flex-1 flex flex-col min-w-0" style={{
                position: 'relative', zIndex: 10,
                filter: sidebarOpen ? 'blur(3px)' : 'none',
                transition: 'filter 0.25s ease',
                pointerEvents: sidebarOpen ? 'none' : 'auto',
            }}>
                {/* Header */}
                <header style={{
                    height: '64px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center',
                    padding: '0 1.5rem',
                    justifyContent: 'space-between',
                    background: 'rgba(11,16,28,0.9)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    flexShrink: 0,
                    position: 'relative',
                }}>
                    {/* Hamburger */}
                    <button
                        onClick={toggleSidebar}
                        style={{
                            padding: '0.5rem', borderRadius: '9px',
                            background: 'transparent', border: 'none',
                            color: 'var(--text-secondary)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center',
                            transition: 'background 0.15s, color 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                        <Menu size={21} />
                    </button>

                    {/* Logo */}
                    <div style={{
                        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                        display: 'flex', alignItems: 'center', gap: '0.625rem',
                    }}>
                        <div style={{
                            width: '30px', height: '30px', borderRadius: '8px',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Car size={14} color="#fff" />
                        </div>
                        <span style={{
                            fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em',
                            background: 'linear-gradient(135deg, #e0e7ff, #a5b4fc)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        }}>ParkVerse</span>
                    </div>

                    {/* Right actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {user ? (
                            <Link to="/notifications" style={{
                                position: 'relative', padding: '0.5rem',
                                borderRadius: '9px', textDecoration: 'none',
                                color: 'var(--text-secondary)',
                                display: 'flex', alignItems: 'center',
                                transition: 'background 0.15s, color 0.15s',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                            >
                                <Bell size={19} />
                                {unreadCount > 0 && (
                                    <span style={{
                                        position: 'absolute', top: '5px', right: '5px',
                                        width: '17px', height: '17px', borderRadius: '50%',
                                        background: '#ef4444',
                                        border: '2px solid var(--bg-secondary)',
                                        color: '#fff', fontSize: '0.6rem', fontWeight: 700,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        lineHeight: 1,
                                    }}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </Link>
                        ) : (
                            <Link to="/login" className="btn btn-primary btn-sm"
                                style={{ borderRadius: '8px', fontSize: '0.8125rem', height: '36px', padding: '0 0.875rem' }}>
                                <LogIn size={14} /> Sign In
                            </Link>
                        )}
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1" style={{ overflowY: 'auto', padding: '1.75rem' }}>
                    <Outlet />
                </main>

                <ToastContainer
                    position="top-right"
                    theme="dark"
                    toastStyle={{
                        background: 'rgba(17,24,39,0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(12px)',
                        borderRadius: '12px',
                    }}
                />
            </div>
        </div>
    );
};

export default MainLayout;