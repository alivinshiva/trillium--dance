import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, CheckCheck, Bell, MessageSquare, Video, Info } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const NotificationPanel = () => {
    const {
        notifications,
        isPanelOpen,
        closePanel,
        markAsRead,
        markAllAsRead
    } = useNotification();
    const navigate = useNavigate();

    if (!isPanelOpen) return null;

    const handleNotificationClick = (notification) => {
        markAsRead(notification._id);
        closePanel();
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'video_approved': return <Video size={18} className="text-green-400" />;
            case 'video_rejected': return <Info size={18} className="text-red-400" />;
            case 'new_comment': return <MessageSquare size={18} className="text-blue-400" />;
            default: return <Bell size={18} className="text-white" />;
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] transition-opacity"
                onClick={closePanel}
            ></div>

            {/* Panel */}
            <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-[#111] border-l border-white/10 z-[100] shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/50 backdrop-blur-md">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Bell size={20} className="text-primary" /> Notifications
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={markAllAsRead}
                            className="p-2 text-white/40 hover:text-white transition-colors"
                            title="Mark all as read"
                        >
                            <CheckCheck size={18} />
                        </button>
                        <button
                            onClick={closePanel}
                            className="p-2 text-white/40 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {notifications.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-white/30 gap-4">
                            <Bell size={48} />
                            <p>No new notifications</p>
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <div
                                key={notif._id}
                                onClick={() => handleNotificationClick(notif)}
                                className={`p-4 rounded-xl cursor-pointer border transition-all hover:bg-white/5 ${notif.read
                                    ? 'bg-transparent border-transparent opacity-60'
                                    : 'bg-white/5 border-white/10 shadow-lg'
                                    }`}
                            >
                                <div className="flex gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notif.read ? 'bg-white/5' : 'bg-primary/20'
                                        }`}>
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className={`text-sm font-bold mb-1 ${notif.read ? 'text-white/70' : 'text-white'}`}>
                                            {notif.title}
                                        </h4>
                                        <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">
                                            {notif.message}
                                        </p>
                                        <span className="text-[10px] text-white/30 mt-2 block font-medium">
                                            {new Date(notif.createdAt).toLocaleDateString()} • {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    {!notif.read && (
                                        <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default NotificationPanel;
