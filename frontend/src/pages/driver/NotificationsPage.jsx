import { Bell, Clock, AlertTriangle, FileText, CreditCard, Check, Trash2 } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";

const NotificationsPage = () => {
    const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

    const getIcon = (type) => {
        switch (type) {
            case 'clock': return <Clock size={20} className="text-orange-500" />;
            case 'alert': return <AlertTriangle size={20} className="text-red-500" />;
            case 'file': return <FileText size={20} className="text-blue-500" />;
            case 'credit': return <CreditCard size={20} className="text-purple-500" />;
            default: return <Bell size={20} className="text-gray-500" />;
        }
    };

    const allRead = notifications.every(n => n.read);

    return (
        <div className="page-container">
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="page-title">Notifications</h1>
                    <p className="page-subtitle">Stay updated with your parking activity</p>
                </div>
                <button
                    onClick={markAllAsRead}
                    className="btn btn-secondary btn-sm"
                    disabled={allRead}
                >
                    <Check size={16} /> Mark all as read
                </button>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
                {notifications.length === 0 ? (
                    <div className="text-center py-10 glass-panel">
                        <Bell size={48} className="mx-auto mb-4 text-muted" />
                        <p className="text-secondary">No notifications</p>
                    </div>
                ) : (
                    notifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`glass-panel p-4 flex items-center gap-4 transition-all ${notification.read ? 'opacity-70' : 'border-l-4 border-accent-primary'}`}
                        >
                            <div className={`w-10 h-10 rounded-full flex-center shrink-0 bg-white/5`}>
                                {getIcon(notification.iconType)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className={`font-semibold mb-1 ${notification.read ? 'text-secondary' : 'text-white'}`}>
                                    {notification.title}
                                </h3>
                                <p className="text-sm text-secondary leading-relaxed">
                                    {notification.message}
                                </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs text-muted whitespace-nowrap mr-2">
                                    {notification.timestamp}
                                </span>
                                {!notification.read && (
                                    <button
                                        onClick={() => markAsRead(notification.id)}
                                        className="p-2 hover:bg-white/10 rounded-lg text-secondary hover:text-success transition-colors"
                                        title="Mark as read"
                                    >
                                        <Check size={18} />
                                    </button>
                                )}
                                <button
                                    onClick={() => deleteNotification(notification.id)}
                                    className="p-2 hover:bg-white/10 rounded-lg text-secondary hover:text-danger transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
