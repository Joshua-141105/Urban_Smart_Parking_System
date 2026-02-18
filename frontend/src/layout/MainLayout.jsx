import { useState, useRef, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    LayoutDashboard,
    MapPin,
    LogOut,
    Menu,
    History,
    FileText,
    Building2,
    BarChart3,
    Map,
    Bell,
    User,
    ChevronDown,
    LogIn,
    Settings
} from "lucide-react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MainLayout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef(null);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const toggleProfile = () => setProfileOpen(!profileOpen);

    const isActive = (path) => location.pathname === path;

    // Handle clicks outside profile dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setProfileOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/login");
        setProfileOpen(false);
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
                { name: "Bookings", path: "/manager/bookings", icon: <History size={20} /> },
            ];
        }

        if (roles.includes("CITY_ADMIN") || roles.includes("SYSTEM_ADMIN")) {
            return [
                { name: "Overview", path: "/admin/dashboard", icon: <LayoutDashboard size={20} /> },
                { name: "City Heatmap", path: "/admin/city", icon: <Map size={20} /> },
                { name: "Analytics", path: "/admin/analytics", icon: <BarChart3 size={20} /> },
                { name: "Find Parking", path: "/find-parking", icon: <MapPin size={20} /> },
                { name: "Settings", path: "/admin/settings", icon: <Settings size={20} /> },
            ];
        }

        // Fallback for any authenticated user
        return [
            { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
            { name: "Find Parking", path: "/find-parking", icon: <MapPin size={20} /> },
        ];
    };

    const navItems = getNavItems();

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-20 backdrop-blur-sm lg:hidden"
                    style={{ background: 'rgba(10, 15, 26, 0.7)' }}
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
                style={{
                    background: 'var(--bg-secondary)',
                    borderRight: '1px solid var(--glass-border)',

                    flexDirection: 'column',
                    // Logic: If sidebarOpen is true, we show it. If false, we hide it via translation.
                    // But for desktop layout flow, we also need to control if it takes space or not if we want it "collapsible" in layout too.
                    // Given the current CSS classes, "fixed lg:static" means it takes space on desktop.
                    // If we want it to DISAPPEAR on desktop, we should probably switch to absolute/fixed or handle width. 
                    // However, standard toggle behavior is just hiding. 
                    display: sidebarOpen ? 'flex' : 'none'
                }}
            >
                {/* Logo */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <Link to="/" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
                        <div className="w-10 h-10 rounded-lg flex-center" style={{ background: 'var(--accent-gradient)' }}>
                            <MapPin size={20} className="text-white" />
                        </div>
                        <span className="text-xl font-bold gradient-text">EDITH</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
                    <ul style={{ listStyle: 'none' }}>
                        {navItems.map((item) => (
                            <li key={item.path} style={{ marginBottom: '0.375rem' }}>
                                <Link
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive(item.path)
                                        ? 'bg-accent-primary text-white'
                                        : 'text-secondary hover:bg-glass-bg-light hover:text-primary'
                                        }`}
                                    style={{
                                        textDecoration: 'none',
                                        color: isActive(item.path) ? '#fff' : 'var(--text-secondary)',
                                        background: isActive(item.path) ? 'var(--accent-primary)' : 'transparent'
                                    }}
                                >
                                    {item.icon}
                                    <span className="font-medium">{item.name}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* User & Logout - Only show if logged in */}
                {user && (
                    <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)' }}>
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
                            onClick={handleLogout}
                            className="btn btn-danger w-full"
                        >
                            <LogOut size={18} />
                            Sign Out
                        </button>
                    </div>
                )}

                {!user && (
                    <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                        <Link to="/login" className="btn btn-primary w-full">
                            <LogIn size={18} />
                            Sign In
                        </Link>
                    </div>
                )}
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header style={{
                    height: '64px',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 1.5rem',
                    justifyContent: 'space-between',
                    background: 'var(--bg-secondary)'
                }}>
                    {/* Mobile menu button */}
                    <button
                        className="btn btn-ghost btn-icon" // Removed lg:hidden
                        onClick={toggleSidebar}
                    >
                        <Menu size={24} />
                    </button>

                    {/* Page title - dynamic based on route */}
                    <div className="hidden lg:block">
                        <h1 className="text-lg font-semibold">
                            {navItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
                        </h1>
                    </div>

                    {/* Right side actions */}
                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                {/* Notification bell */}
                                <Link to="/notifications" className="btn btn-ghost btn-icon relative hidden sm:flex">
                                    <Bell size={20} />
                                    {/* Ideally count comes from context, but keeping it simple pulse for yes/no or just always pulse if unread */}
                                    <span className="notification-dot pulse"></span>
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

                {/* Scrollable Content Area */}
                <main className="flex-1 overflow-auto p-6 custom-scrollbar">
                    <Outlet />
                </main>
                <ToastContainer position="top-right" theme="dark" />
            </div>
        </div>
    );
};

export default MainLayout;
