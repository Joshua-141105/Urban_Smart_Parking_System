import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';
import api from '../api/axios';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const hasShownLoginToasts = useRef(false);
    const previousUserId = useRef(null);

    // Fetch notifications from backend when user logs in
    useEffect(() => {
        if (user) {
            fetchNotifications();
        } else {
            // User logged out - reset state
            setNotifications([]);
            hasShownLoginToasts.current = false;
            previousUserId.current = null;
        }
    }, [user]);

    // Detect fresh login vs page refresh
    // A fresh login means the user ID changed from null to a value
    useEffect(() => {
        if (user && user.id) {
            const isNewLogin = previousUserId.current === null || previousUserId.current !== user.id;
            const loginFlag = sessionStorage.getItem('edith_login_toast_shown');

            if (isNewLogin && !loginFlag) {
                // This is a fresh login - show toasts for unread notifications
                hasShownLoginToasts.current = false;
            }

            previousUserId.current = user.id;
        }
    }, [user]);

    // Show toasts only once on fresh login
    useEffect(() => {
        if (user && notifications.length > 0 && !hasShownLoginToasts.current) {
            const loginFlag = sessionStorage.getItem('edith_login_toast_shown');
            if (loginFlag) {
                // Already shown toasts in this session (page was refreshed)
                hasShownLoginToasts.current = true;
                return;
            }

            const unread = notifications.filter(n => !n.read);
            if (unread.length > 0) {
                setTimeout(() => {
                    unread.forEach(n => {
                        if (n.type === 'danger') toast.error(n.message || n.title);
                        else if (n.type === 'warning') toast.warn(n.message || n.title);
                        else toast.info(n.message || n.title);
                    });
                }, 800);
            }

            hasShownLoginToasts.current = true;
            // Mark in sessionStorage so page refresh won't re-trigger
            sessionStorage.setItem('edith_login_toast_shown', 'true');
        }
    }, [user, notifications]);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            if (res.data && Array.isArray(res.data)) {
                setNotifications(res.data.map(n => ({
                    id: n.id,
                    type: n.type || 'info',
                    title: n.title || 'Notification',
                    message: n.message,
                    timestamp: n.timestamp || formatTimeAgo(n.createdAt),
                    read: n.read || false,
                    iconType: n.iconType || getIconType(n.type)
                })));
            }
        } catch (error) {
            // If API not available, use fallback mock data for development
            console.warn('Notification API not available, using local state');
            if (notifications.length === 0) {
                setNotifications([
                    {
                        id: 1,
                        type: "warning",
                        title: "Parking Expiring Soon",
                        message: "Parking expires in 15 minutes",
                        timestamp: "Just now",
                        read: false,
                        iconType: 'clock'
                    },
                    {
                        id: 2,
                        type: "danger",
                        title: "Overstay Warning",
                        message: "You have 5 minutes before overstay charges apply",
                        timestamp: "2 mins ago",
                        read: false,
                        iconType: 'alert'
                    },
                    {
                        id: 3,
                        type: "info",
                        title: "Permit Expiry",
                        message: "Your parking permit expires in 7 days",
                        timestamp: "1 hour ago",
                        read: true,
                        iconType: 'file'
                    },
                    {
                        id: 4,
                        type: "info",
                        title: "Payment Reminder",
                        message: "Monthly pass due for renewal",
                        timestamp: "1 day ago",
                        read: true,
                        iconType: 'credit'
                    }
                ]);
            }
        }
    };

    const markAsRead = async (id) => {
        // Optimistic UI update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

        // Persist to backend
        try {
            await api.put(`/notifications/${id}/read`);
        } catch (error) {
            console.warn('Failed to persist notification read status:', error);
        }
    };

    const markAllAsRead = async () => {
        // Optimistic UI update
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        toast.success("All notifications marked as read");

        // Persist to backend
        try {
            await api.put('/notifications/read-all');
        } catch (error) {
            console.warn('Failed to persist mark-all-as-read:', error);
        }
    };

    const deleteNotification = async (id) => {
        // Optimistic UI update
        setNotifications(prev => prev.filter(n => n.id !== id));
        toast.info("Notification removed");

        // Persist to backend
        try {
            await api.delete(`/notifications/${id}`);
        } catch (error) {
            console.warn('Failed to delete notification from backend:', error);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            markAsRead,
            markAllAsRead,
            deleteNotification,
            unreadCount
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

// Helper functions
function getIconType(type) {
    switch (type) {
        case 'warning': return 'clock';
        case 'danger': return 'alert';
        case 'info': return 'file';
        default: return 'bell';
    }
}

function formatTimeAgo(dateString) {
    if (!dateString) return 'Just now';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}
