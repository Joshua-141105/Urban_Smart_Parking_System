import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';
import { Clock, AlertTriangle, FileText, CreditCard } from 'lucide-react';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([
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

    // Effect to trigger toasts on login (when user becomes available)
    useEffect(() => {
        if (user) {
            const unread = notifications.filter(n => !n.read);
            if (unread.length > 0) {
                // Add a small delay to ensure UI is ready
                setTimeout(() => {
                    unread.forEach(n => {
                        if (n.type === 'danger') toast.error(n.message);
                        else if (n.type === 'warning') toast.warn(n.message);
                        else toast.info(n.message);
                    });
                }, 500);
            }
        }
    }, [user]); // user dependency ensures this runs on login

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        toast.success("All notifications marked as read");
    };

    const deleteNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        toast.info("Notification removed");
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
