import { useState, useEffect } from "react";
import {
    Search,
    Filter,
    Calendar,
    Car,
    User,
    Building2,
    IndianRupee,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    FileText
} from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const statusConfig = {
    ACTIVE: { color: "#10b981", bg: "rgba(16, 185, 129, 0.15)", label: "Active" },
    PENDING: { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", label: "Pending" },
    COMPLETED: { color: "#6366f1", bg: "rgba(99, 102, 241, 0.15)", label: "Completed" },
    CANCELLED: { color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", label: "Cancelled" },
};

const AdminBookingsPage = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const isSystemAdmin = user?.roles?.some(r => r.includes("SYSTEM_ADMIN"));

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await api.get("/admin/bookings");
            setBookings(res.data);
        } catch (error) {
            console.error("Error fetching bookings:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredBookings = bookings.filter((b) => {
        const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
        const term = searchTerm.toLowerCase();
        const matchesSearch =
            !searchTerm ||
            (b.vehicleNumber && b.vehicleNumber.toLowerCase().includes(term)) ||
            (b.username && b.username.toLowerCase().includes(term)) ||
            (b.parkingLotName && b.parkingLotName.toLowerCase().includes(term)) ||
            (b.id && b.id.toString().includes(term));
        return matchesStatus && matchesSearch;
    });

    const stats = {
        total: bookings.length,
        active: bookings.filter((b) => b.status === "ACTIVE").length,
        completed: bookings.filter((b) => b.status === "COMPLETED").length,
        cancelled: bookings.filter((b) => b.status === "CANCELLED").length,
        pending: bookings.filter((b) => b.status === "PENDING").length,
    };

    const totalRevenue = bookings
        .filter((b) => b.status === "COMPLETED" || b.status === "ACTIVE")
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    const formatDateTime = (dtStr) => {
        if (!dtStr) return "—";
        const dt = new Date(dtStr);
        return dt.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className="flex-center" style={{ minHeight: "400px" }}>
                <div className="animate-spin w-10 h-10 rounded-full border-3 border-accent-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 className="text-3xl font-bold" style={{ marginBottom: '0.5rem' }}>
                    <span className="gradient-text">
                        {isSystemAdmin ? "All Bookings" : "My Lot Bookings"}
                    </span>
                </h1>
                <p className="text-secondary">
                    {isSystemAdmin
                        ? "View and manage all bookings across the system"
                        : "View bookings for parking lots you manage"}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4" style={{ marginBottom: '1.5rem' }}>
                {[
                    { label: "Total", value: stats.total, icon: <FileText size={20} />, color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.15)" },
                    { label: "Active", value: stats.active, icon: <CheckCircle2 size={20} />, color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" },
                    { label: "Pending", value: stats.pending, icon: <Clock size={20} />, color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" },
                    { label: "Completed", value: stats.completed, icon: <CheckCircle2 size={20} />, color: "#6366f1", bg: "rgba(99, 102, 241, 0.15)" },
                    { label: "Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: <IndianRupee size={20} />, color: "#06b6d4", bg: "rgba(6, 182, 212, 0.15)" },
                ].map((stat, i) => (
                    <div key={i} className="glass-card" style={{ padding: '1.25rem' }}>
                        <div className="flex items-center gap-3">
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '10px',
                                background: stat.bg, color: stat.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0
                            }}>{stat.icon}</div>
                            <div>
                                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: stat.color, lineHeight: 1.2 }}>{stat.value}</p>
                                <p className="text-secondary" style={{ fontSize: '0.75rem' }}>{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1rem' }}>
                <div className="flex flex-wrap gap-4 items-center">
                    {/* Search */}
                    <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '200px' }}>
                        <Search size={16} style={{
                            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                            color: 'var(--text-secondary)'
                        }} />
                        <input
                            type="text"
                            placeholder="Search by vehicle, user, or lot name..."
                            className="input-field"
                            style={{ paddingLeft: '36px', width: '100%' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Status Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Filter size={16} className="text-secondary" />
                        <select
                            className="input-field"
                            style={{ minWidth: '150px' }}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="ACTIVE">Active</option>
                            <option value="PENDING">Pending</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>

                    <span className="text-secondary" style={{ fontSize: '0.8rem', marginLeft: 'auto' }}>
                        Showing {filteredBookings.length} of {bookings.length}
                    </span>
                </div>
            </div>

            {/* Bookings Table */}
            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                {filteredBookings.length === 0 ? (
                    <div className="flex-center" style={{ padding: '4rem 2rem', flexDirection: 'column', gap: '1rem' }}>
                        <Car size={48} className="text-secondary" style={{ opacity: 0.3 }} />
                        <p className="text-secondary">No bookings found</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <th style={thStyle}>#ID</th>
                                    {isSystemAdmin && <th style={thStyle}>User</th>}
                                    <th style={thStyle}>Parking Lot</th>
                                    <th style={thStyle}>Space</th>
                                    <th style={thStyle}>Vehicle</th>
                                    <th style={thStyle}>Start</th>
                                    <th style={thStyle}>End</th>
                                    <th style={thStyle}>Amount</th>
                                    <th style={thStyle}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBookings.map((b) => {
                                    const sc = statusConfig[b.status] || statusConfig.PENDING;
                                    return (
                                        <tr key={b.id} style={{
                                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                                            transition: 'background 0.15s ease',
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={tdStyle}>
                                                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-secondary)' }}>
                                                    #{b.id}
                                                </span>
                                            </td>
                                            {isSystemAdmin && (
                                                <td style={tdStyle}>
                                                    <div>
                                                        <span style={{ fontWeight: 500 }}>{b.username}</span>
                                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                                                            {b.userEmail}
                                                        </p>
                                                    </div>
                                                </td>
                                            )}
                                            <td style={tdStyle}>
                                                <div className="flex items-center gap-2">
                                                    <Building2 size={14} className="text-secondary" />
                                                    <span>{b.parkingLotName}</span>
                                                </div>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{b.spaceNumber}</span>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{ fontWeight: 500 }}>{b.vehicleNumber || "—"}</span>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{ fontSize: '0.8rem' }}>{formatDateTime(b.startTime)}</span>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{ fontSize: '0.8rem' }}>{formatDateTime(b.endTime)}</span>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                                                    ₹{b.totalAmount?.toLocaleString() || "0"}
                                                </span>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                    padding: '4px 10px', borderRadius: '9999px',
                                                    fontSize: '0.75rem', fontWeight: 600,
                                                    background: sc.bg, color: sc.color,
                                                }}>
                                                    {sc.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const thStyle = {
    textAlign: 'left',
    padding: '0.875rem 1rem',
    fontWeight: 600,
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
};

const tdStyle = {
    padding: '0.875rem 1rem',
    whiteSpace: 'nowrap',
};

export default AdminBookingsPage;
