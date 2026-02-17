import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Info, AlertTriangle, X } from 'lucide-react';

const NotificationCenter = ({ isOpen, onClose, onUnreadCountChange }) => {
    const [notifications, setNotifications] = useState([
        { id: 1, type: 'success', title: 'Form Approved', message: 'Your Leave Application #1024 has been approved.', time: '2 min ago', read: false },
        { id: 2, type: 'info', title: 'New Template', message: 'A new Scholarship Application template is available.', time: '1 hour ago', read: false },
        { id: 3, type: 'warning', title: 'Action Required', message: 'Agent Smith requires clarification on Form #1023.', time: '3 hours ago', read: true },
    ]);

    const markAsRead = (id) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const deleteNotification = (id) => {
        setNotifications(notifications.filter(n => n.id !== id));
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    // Notify parent of unread count changes
    React.useEffect(() => {
        if (onUnreadCountChange) {
            onUnreadCountChange(unreadCount);
        }
    }, [unreadCount, onUnreadCountChange]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-[90vw] max-w-[18rem] sm:w-80 md:left-full md:translate-x-0 md:bottom-auto md:top-0 md:ml-4 bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden z-50"
                >
                    <div className="p-3 sm:p-4 border-b border-[var(--glass-border)] flex justify-between items-center">
                        <h3 className="text-sm sm:text-base font-bold text-[var(--page-text)]">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full font-medium">
                                {unreadCount} new
                            </span>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-[var(--text-muted)]">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[var(--glass-border)]">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-3 sm:p-4 hover:bg-[var(--glass-bg)] transition-colors relative group ${!notification.read ? 'bg-primary-500/5' : ''}`}
                                    >
                                        <div className="flex gap-2 sm:gap-3">
                                            <div className={`mt-1 p-1.5 rounded-full h-fit ${notification.type === 'success' ? 'bg-green-500/20 text-green-500' :
                                                notification.type === 'warning' ? 'bg-yellow-500/20 text-yellow-500' :
                                                    'bg-blue-500/20 text-blue-500'
                                                }`}>
                                                {notification.type === 'success' ? <Check className="w-3 h-3" /> :
                                                    notification.type === 'warning' ? <AlertTriangle className="w-3 h-3" /> :
                                                        <Info className="w-3 h-3" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1 gap-2">
                                                    <h4 className={`text-xs sm:text-sm font-medium truncate ${!notification.read ? 'text-[var(--page-text)]' : 'text-[var(--text-muted)]'}`}>
                                                        {notification.title}
                                                    </h4>
                                                    <span className="text-xs text-[var(--text-muted)] whitespace-nowrap flex-shrink-0">{notification.time}</span>
                                                </div>
                                                <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-2">
                                                    {notification.message}
                                                </p>
                                                {!notification.read && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                                                        className="text-xs text-primary-400 hover:text-primary-300 font-medium"
                                                    >
                                                        Mark as read
                                                    </button>
                                                )}
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                                                className="absolute top-2 right-2 p-1 text-[var(--text-muted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NotificationCenter;
