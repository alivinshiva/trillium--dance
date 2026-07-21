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
            const response = await fetch(`${import.meta.env.VITE_API_URL}/notifications?userId=${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.read).length);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    // Initial Fetch only - no polling (use manual refresh or real-time later)
    useEffect(() => {
        if (isSignedIn) {
            fetchNotifications();
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

            await fetch(`${import.meta.env.VITE_API_URL}/notifications/${id}/read`, { method: 'PATCH' });
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

            await fetch(`${import.meta.env.VITE_API_URL}/notifications/mark-all-read`, {
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
