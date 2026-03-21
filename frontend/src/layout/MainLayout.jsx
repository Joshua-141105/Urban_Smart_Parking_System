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

    // Lock body scroll ONLY when sidebar overlay is open
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

    // Determine navigation based on role
    const getNavItems = () => {
        if (!user) {
            return [
                { name: "Find Parking", path: "/find-parking", icon: <MapPin size={20} /> },
            ];
        }

        const roles = user?.roles?.map(r => r.replace("ROLE_", "")) || [];

        if (roles.includes("DRIVER")) {
            return [
                { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
                { name: "Find Parking", path: "/find-parking", icon: <MapPin size={20} /> },
                { name: "My Bookings", path: "/bookings", icon: <History size={20} /> },
                { name: "Permits", path: "/permits", icon: <FileText size={20} /> },
                { name: "Notifications", path: "/notifications", icon: <Bell size={20} /> },
                { name: "User Profile", path: "/profile", icon: <User size={20} /> },
            ];
        }

        if (roles.includes("PARKING_MANAGER")) {
            return [
                { name: "Dashboard", path: "/manager/dashboard", icon: <LayoutDashboard size={20} /> },
                { name: "Find Parking", path: "/find-parking", icon: <MapPin size={20} /> },
                { name: "My Lots", path: "/manager/lots", icon: <Building2 size={20} /> },
                { name: "Bookings", path: "/admin/all-bookings", icon: <History size={20} /> },
                { name: "Spot Booking", path: "/admin/booking", icon: <FileText size={20} /> },
                { name: "Profile", path: "/profile", icon: <User size={20} /> },
            ];
        }

        if (roles.includes("CITY_ADMIN") || roles.includes("SYSTEM_ADMIN")) {
            const adminRoutes = [
                { name: "Overview", path: "/admin/dashboard", icon: <LayoutDashboard size={20} /> },
                { name: "City Heatmap", path: "/admin/city", icon: <Map size={20} /> },
                { name: "Analytics", path: "/admin/analytics", icon: <BarChart3 size={20} /> },
                { name: "All Bookings", path: "/admin/all-bookings", icon: <History size={20} /> },
                { name: "Parking Lots", path: "/admin/parking-lots", icon: <Building2 size={20} /> }
            ];

            if (roles.includes("CITY_ADMIN")) {
                adminRoutes.push({ name: "Spot Booking", path: "/admin/booking", icon: <FileText size={20} /> });
            }

            if (roles.includes("SYSTEM_ADMIN")) {
                adminRoutes.push({ name: "User Management", path: "/admin/users", icon: <Users size={20} /> });
            }

            adminRoutes.push({ name: "Settings", path: "/admin/settings", icon: <Settings size={20} /> });

            return adminRoutes;
        }

        return [
            { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
            { name: "Find Parking", path: "/find-parking", icon: <MapPin size={20} /> },
        ];
    };

    const navItems = getNavItems();

    return (
        <div className="flex" style={{ height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>

            {/* Animated Background */}
            <AnimatedBackground />

            {/* Backdrop overlay with blur transition when sidebar is open */}
            <div
                className="fixed inset-0 z-20"
                style={{
                    background: sidebarOpen ? 'rgba(10, 15, 26, 0.7)' : 'rgba(10, 15, 26, 0)',
                    backdropFilter: sidebarOpen ? 'blur(8px)' : 'blur(0px)',
                    WebkitBackdropFilter: sidebarOpen ? 'blur(8px)' : 'blur(0px)',
                    opacity: sidebarOpen ? 1 : 0,
                    pointerEvents: sidebarOpen ? 'auto' : 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onClick={() => setSidebarOpen(false)}
            ></div>

            {/* Sidebar - fixed height, appears/disappears on toggle */}
            <aside
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: '260px',
                    zIndex: 30,
                    background: 'var(--bg-secondary)',
                    borderRight: '1px solid var(--glass-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100vh',
                    transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            >
                {/* Sidebar Header with close (hamburger) button */}
                <div style={{
                    padding: '1rem 1.25rem',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: '64px',
                    flexShrink: 0,
                }}>
                    <Link to="/" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)} style={{ textDecoration: 'none' }}>
                        <div style={{
                            width: '2.2vw', height: '2.2vw', minWidth: '24px', minHeight: '24px',
                            maxWidth: '32px', maxHeight: '32px',
                            borderRadius: '0.4vw', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'var(--accent-gradient)',
                        }}>
                            <Car style={{ width: '1.2vw', height: '1.2vw', minWidth: '12px', minHeight: '12px', maxWidth: '18px', maxHeight: '18px' }} className="text-white" />
                        </div>
                        <span className="gradient-text" style={{ fontSize: 'max(1.1vw, 16px)', fontWeight: 700 }}>ParkVerse</span>
                    </Link>
                    <button
                        onClick={toggleSidebar}
                        className="btn btn-ghost btn-icon"
                        style={{ padding: '0.5rem' }}
                        title="Close menu"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Navigation - scrollable area */}
                <nav style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
                    <ul style={{ listStyle: 'none' }}>
                        {navItems.map((item) => (
                            <li key={item.path} style={{ marginBottom: '0.375rem' }}>
                                <Link
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
                                    style={{
                                        textDecoration: 'none',
                                        color: isActive(item.path) ? '#fff' : 'var(--text-secondary)',
                                        background: isActive(item.path) ? 'var(--accent-primary)' : 'transparent',
                                        borderRadius: 'var(--radius-md)',
                                    }}
                                >
                                    {item.icon}
                                    <span className="font-medium">{item.name}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* User & Logout - pinned to bottom, never scrolls away */}
                {user && (
                    <div style={{
                        padding: '1rem',
                        borderTop: '1px solid var(--glass-border)',
                        flexShrink: 0,
                    }}>
                        <div className="flex items-center gap-3 mb-3 px-2">
                            <div className="avatar block">
                                {user?.username?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{user?.username}</p>
                                <p className="text-xs text-muted truncate">
                                    {user?.roles?.[0]?.replace('ROLE_', '').replace('_', ' ')}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => { handleLogout(); setSidebarOpen(false); }}
                            className="btn btn-danger w-full"
                        >
                            <LogOut size={18} />
                            Sign Out
                        </button>
                    </div>
                )}

                {!user && (
                    <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)', flexShrink: 0 }}>
                        <Link to="/login" className="btn btn-primary w-full" onClick={() => setSidebarOpen(false)}>
                            <LogIn size={18} />
                            Sign In
                        </Link>
                    </div>
                )}
            </aside>

            {/* Main Content - takes full width since sidebar is overlay */}
            <div
                className="flex-1 flex flex-col min-w-0"
                style={{
                    position: 'relative',
                    zIndex: 10,
                    filter: sidebarOpen ? 'blur(4px)' : 'none',
                    transition: 'filter 0.3s ease',
                    pointerEvents: sidebarOpen ? 'none' : 'auto'
                }}
            >
                {/* Header */}
                <header style={{
                    height: '64px',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 1.5rem',
                    justifyContent: 'space-between',
                    background: 'var(--bg-secondary)',
                    flexShrink: 0,
                    position: 'relative',
                }}>
                    {/* Left: Hamburger menu button (visible when sidebar closed) */}
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={toggleSidebar}
                        title="Open menu"
                    >
                        <Menu size={24} />
                    </button>

                    {/* Center: Logo & App Name */}
                    <div style={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex', alignItems: 'center', gap: '0.5vw',
                    }}>
                        <div style={{
                            width: '2.2vw', height: '2.2vw', minWidth: '24px', minHeight: '24px',
                            maxWidth: '32px', maxHeight: '32px',
                            borderRadius: '0.4vw', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'var(--accent-gradient)',
                        }}>
                            <Car style={{ width: '1.2vw', height: '1.2vw', minWidth: '12px', minHeight: '12px', maxWidth: '18px', maxHeight: '18px' }} className="text-white" />
                        </div>
                        <span className="gradient-text" style={{ fontSize: 'max(1.1vw, 16px)', fontWeight: 700 }}>ParkVerse</span>
                    </div>

                    {/* Right side actions */}
                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                {/* Notification bell with unread count */}
                                <Link to="/notifications" className="btn btn-ghost btn-icon relative" style={{ position: 'relative' }}>
                                    <Bell size={20} />
                                    {unreadCount > 0 && (
                                        <span style={{
                                            position: 'absolute',
                                            top: '4px',
                                            right: '4px',
                                            width: '18px',
                                            height: '18px',
                                            borderRadius: '50%',
                                            background: 'var(--danger)',
                                            color: '#fff',
                                            fontSize: '0.65rem',
                                            fontWeight: '700',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            lineHeight: 1,
                                        }}>
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </Link>
                            </>
                        ) : (
                            <Link to="/login" className="btn btn-primary btn-sm">
                                <LogIn size={16} />
                                Sign In
                            </Link>
                        )}
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 p-6" style={{ overflowY: 'auto' }}>
                    <Outlet />
                </main>
                <ToastContainer position="top-right" theme="dark" />
            </div>
        </div>
    );
};

export default MainLayout;
