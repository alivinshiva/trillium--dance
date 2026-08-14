import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { user, isSignedIn } = useUser();
    const [notifications, setNotifications] = useState([]);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    // unreadCount is derived from state so live pushes and optimistic reads can't desync.
    const unreadCount = notifications.filter(n => !n.read).length;

    // Fetch Notifications (seed history on sign-in)
    const fetchNotifications = async () => {
        if (!isSignedIn || !user) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/notifications?userId=${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    // Initial fetch + live Server-Sent Events stream
    useEffect(() => {
        if (!isSignedIn || !user) {
            setNotifications([]);
            return;
        }

        fetchNotifications();

        const es = new EventSource(`${import.meta.env.VITE_API_URL}/notifications/stream?userId=${user.id}`);
        es.addEventListener('notification', (event) => {
            const { notification } = JSON.parse(event.data);
            // Dedupe guards against a race where the initial fetch already returned it.
            setNotifications(prev => prev.some(n => n._id === notification._id)
                ? prev
                : [notification, ...prev]);
        });

        return () => es.close();
    }, [isSignedIn, user]);

    // Mark as Read
    const markAsRead = async (id) => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));

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
