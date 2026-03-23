import { useEffect } from "react";
import { Bell, Clock, AlertTriangle, FileText, CreditCard, Check, Trash2, RefreshCw, CheckCircle } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";

const NotificationsPage = () => {
    const {
        notifications,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refresh,
        unreadCount,
    } = useNotifications();

    // Refresh when page mounts (in case new notifications arrived)
    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getIcon = (iconType) => {
        switch (iconType) {
            case 'clock':  return <Clock size={20} className="text-orange-400" />;
            case 'alert':  return <AlertTriangle size={20} className="text-red-400" />;
            case 'file':   return <FileText size={20} className="text-blue-400" />;
            case 'credit': return <CreditCard size={20} className="text-purple-400" />;
            case 'check':  return <CheckCircle size={20} className="text-emerald-400" />;
            default:       return <Bell size={20} style={{ color: "var(--text-secondary)" }} />;
        }
    };

    const getBorderColor = (type) => {
        switch (type) {
            case 'danger':  return '#ef4444';
            case 'warning': return '#f59e0b';
            case 'success': return '#10b981';
            default:        return '#6366f1';
        }
    };

    const allRead = notifications.every(n => n.read);

    return (
        <div className="page-container">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div>
                    <h1 className="page-title">
                        <span className="gradient-text">Notifications</span>
                        {unreadCount > 0 && (
                            <span style={{
                                marginLeft: '0.75rem',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                minWidth: '24px', height: '24px', borderRadius: '999px',
                                background: '#ef4444', color: '#fff',
                                fontSize: '0.75rem', fontWeight: 700,
                                verticalAlign: 'middle',
                            }}>
                                {unreadCount}
                            </span>
                        )}
                    </h1>
                    <p className="page-subtitle">Stay updated with your parking activity</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                        onClick={refresh}
                        disabled={loading}
                        className="btn btn-ghost btn-sm"
                        title="Refresh notifications"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                    >
                        <RefreshCw size={15} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
                        {loading ? 'Refreshing…' : 'Refresh'}
                    </button>

                    <button
                        onClick={markAllAsRead}
                        className="btn btn-secondary btn-sm"
                        disabled={allRead || loading}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                    >
                        <Check size={15} /> Mark all read
                    </button>
                </div>
            </div>

            {/* Loading */}
            {loading && notifications.length === 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#6366f1',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                </div>
            )}

            {/* Empty state */}
            {!loading && notifications.length === 0 && (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <Bell size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)', opacity: 0.4 }} />
                    <p style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--text-secondary)' }}>
                        No notifications
                    </p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        You're all caught up! New notifications will appear here.
                    </p>
                </div>
            )}

            {/* Notification list */}
            <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {notifications.map(notification => (
                    <div
                        key={notification.id}
                        onClick={() => !notification.read && markAsRead(notification.id)}
                        style={{
                            display: 'flex', alignItems: 'flex-start', gap: '1rem',
                            padding: '1rem 1.125rem',
                            borderRadius: '14px',
                            background: notification.read
                                ? 'rgba(255,255,255,0.02)'
                                : 'rgba(99,102,241,0.06)',
                            border: notification.read
                                ? '1px solid rgba(255,255,255,0.06)'
                                : `1px solid rgba(99,102,241,0.2)`,
                            borderLeft: `3px solid ${notification.read ? 'transparent' : getBorderColor(notification.type)}`,
                            cursor: notification.read ? 'default' : 'pointer',
                            transition: 'background 0.15s, border-color 0.15s',
                            opacity: notification.read ? 0.75 : 1,
                        }}
                        onMouseEnter={e => { if (!notification.read) e.currentTarget.style.background = 'rgba(99,102,241,0.09)'; }}
                        onMouseLeave={e => { if (!notification.read) e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; }}
                    >
                        {/* Icon */}
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                            background: 'rgba(255,255,255,0.05)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {getIcon(notification.iconType)}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <h3 style={{
                                    fontWeight: notification.read ? 500 : 700,
                                    fontSize: '0.9rem',
                                    color: notification.read ? 'var(--text-secondary)' : '#f1f5f9',
                                    margin: 0,
                                }}>
                                    {notification.title}
                                </h3>
                                {!notification.read && (
                                    <span style={{
                                        width: '7px', height: '7px', borderRadius: '50%',
                                        background: '#6366f1', flexShrink: 0,
                                    }} />
                                )}
                            </div>
                            <p style={{
                                fontSize: '0.825rem',
                                color: 'var(--text-secondary)',
                                lineHeight: 1.5, margin: 0,
                            }}>
                                {notification.message}
                            </p>
                        </div>

                        {/* Right side: time + actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                {notification.timestamp || formatTime(notification.createdAt)}
                            </span>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                {!notification.read && (
                                    <button
                                        onClick={e => { e.stopPropagation(); markAsRead(notification.id); }}
                                        title="Mark as read"
                                        style={actionBtn}
                                        onMouseEnter={e => e.currentTarget.style.color = '#10b981'}
                                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                                    >
                                        <Check size={15} />
                                    </button>
                                )}
                                <button
                                    onClick={e => { e.stopPropagation(); deleteNotification(notification.id); }}
                                    title="Delete"
                                    style={actionBtn}
                                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

const actionBtn = {
    padding: '0.3rem', borderRadius: '6px',
    background: 'transparent', border: 'none',
    cursor: 'pointer', color: 'var(--text-secondary)',
    display: 'flex', alignItems: 'center',
    transition: 'color 0.15s',
};

function formatTime(createdAt) {
    if (!createdAt) return '';
    const d = new Date(createdAt);
    const now = new Date();
    const diffMin = Math.floor((now - d) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    return `${Math.floor(diffH / 24)}d ago`;
}

export default NotificationsPage;