import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { user, isSignedIn } = useUser();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    // Fetch Notifications
    const fetchNotifications = async () => {
        if (!isSignedIn || !user) return;

        try {
            const response = await fetch(`http://localhost:5001/api/notifications?userId=${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.read).length);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    // Initial Fetch & Polling
    useEffect(() => {
        if (isSignedIn) {
            fetchNotifications();
            // Poll every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [isSignedIn, user]);

    // Mark as Read
    const markAsRead = async (id) => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));

            await fetch(`http://localhost:5001/api/notifications/${id}/read`, { method: 'PATCH' });
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
            fetchNotifications(); // Revert on error
        }
    };

    // Mark All as Read
    const markAllAsRead = async () => {
        try {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);

            await fetch(`http://localhost:5001/api/notifications/mark-all-read`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });
        } catch (error) {
            console.error("Failed to mark all as read:", error);
            fetchNotifications();
        }
    };

    const togglePanel = () => setIsPanelOpen(prev => !prev);
    const closePanel = () => setIsPanelOpen(false);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            isPanelOpen,
            togglePanel,
            closePanel,
            markAsRead,
            markAllAsRead,
            refreshNotifications: fetchNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
