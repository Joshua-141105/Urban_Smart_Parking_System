import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';
import api from '../api/axios';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    // Track whether we've already shown toasts for this login session.
    // Using sessionStorage so it resets on new tab / after logout.
    const toastShownRef = useRef(false);

    // ── Reset when user logs out ────────────────────────────────────────────
    useEffect(() => {
        if (!user) {
            setNotifications([]);
            toastShownRef.current = false;
            sessionStorage.removeItem('pv_notif_toast_shown');
        }
    }, [user]);

    // ── Fetch notifications only after a real login ─────────────────────────
    // Triggered when user object appears (login) — NOT on every render.
    useEffect(() => {
        if (user?.id) {
            fetchNotifications();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    // ── Core fetch ───────────────────────────────────────────────────────────
    const fetchNotifications = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const res = await api.get('/notifications');
            if (res.data && Array.isArray(res.data)) {
                setNotifications(res.data);

                // Show unread toasts ONCE per login session
                const sessionFlag = sessionStorage.getItem('pv_notif_toast_shown');
                if (!sessionFlag && !toastShownRef.current) {
                    const unread = res.data.filter(n => !n.read);
                    if (unread.length > 0) {
                        // Small delay so the page has settled
                        setTimeout(() => {
                            unread.slice(0, 3).forEach(n => {
                                // Show at most 3 toasts to avoid spam
                                if (n.type === 'danger') toast.error(n.title || n.message);
                                else if (n.type === 'warning') toast.warn(n.title || n.message);
                                else if (n.type === 'success') toast.success(n.title || n.message);
                                else toast.info(n.title || n.message);
                            });
                        }, 900);
                    }
                    toastShownRef.current = true;
                    sessionStorage.setItem('pv_notif_toast_shown', 'true');
                }
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            // Do NOT fall back to demo/mock data — just leave state empty
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    // ── Mark single notification as read ─────────────────────────────────────
    const markAsRead = useCallback(async (id) => {
        // Optimistic update
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );

        try {
            await api.put(`/notifications/${id}/read`);
        } catch (error) {
            console.warn('Failed to persist read status, reverting:', error);
            // Revert optimistic update on failure
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: false } : n)
            );
        }
    }, []);

    // ── Mark all as read ─────────────────────────────────────────────────────
    const markAllAsRead = useCallback(async () => {
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));

        try {
            await api.put('/notifications/read-all');
            toast.success('All notifications marked as read');
        } catch (error) {
            console.warn('Failed to mark all as read:', error);
            // Revert
            await fetchNotifications();
        }
    }, [fetchNotifications]);

    // ── Delete notification ──────────────────────────────────────────────────
    const deleteNotification = useCallback(async (id) => {
        // Optimistic update
        setNotifications(prev => prev.filter(n => n.id !== id));

        try {
            await api.delete(`/notifications/${id}`);
            toast.info('Notification removed');
        } catch (error) {
            console.warn('Failed to delete notification:', error);
            // Revert by re-fetching
            await fetchNotifications();
        }
    }, [fetchNotifications]);

    // ── Computed: only unread ────────────────────────────────────────────────
    const unreadCount = notifications.filter(n => !n.read).length;

    // ── Allow manual refresh (e.g. from NotificationsPage) ──────────────────
    const refresh = useCallback(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    return (
        <NotificationContext.Provider value={{
            notifications,
            loading,
            markAsRead,
            markAllAsRead,
            deleteNotification,
            refresh,
            unreadCount,
        }}>
            {children}
        </NotificationContext.Provider>
    );
};