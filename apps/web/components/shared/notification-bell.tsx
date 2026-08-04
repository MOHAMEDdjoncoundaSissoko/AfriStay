'use client';

import { useEffect, useState, useRef } from 'react';
import { apiFetch } from '@/lib/api/client';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  createdAt: string;
}

const iconMap: Record<string, string> = {
  BOOKING_REQUEST: 'fas fa-calendar-check text-blue-500',
  BOOKING_CONFIRMED: 'fas fa-check-circle text-green-500',
  BOOKING_REJECTED: 'fas fa-times-circle text-red-500',
  BOOKING_CANCELLED: 'fas fa-ban text-red-500',
  PAYMENT_RECEIVED: 'fas fa-money-bill-wave text-green-500',
  PAYMENT_FAILED: 'fas fa-exclamation-triangle text-red-500',
  NEW_MESSAGE: 'fas fa-comment text-orange-500',
  NEW_REVIEW: 'fas fa-star text-yellow-500',
  REVIEW_REPLY: 'fas fa-reply text-blue-500',
  HOST_VERIFICATION: 'fas fa-id-card text-purple-500',
  PROMOTION: 'fas fa-bullhorn text-pink-500',
};

const linkMap: Record<string, string> = {
  BOOKING_REQUEST: '/host/dashboard',
  BOOKING_CONFIRMED: '/traveler/bookings',
  BOOKING_REJECTED: '/traveler/bookings',
  BOOKING_CANCELLED: '/traveler/bookings',
  PAYMENT_RECEIVED: '/host/revenues',
  PAYMENT_FAILED: '/traveler/bookings',
  NEW_MESSAGE: '/messages',
  NEW_REVIEW: '/host/properties',
  REVIEW_REPLY: '/traveler/reviews',
  HOST_VERIFICATION: '/profile',
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Charger les notifications
  async function loadNotifications() {
    try {
      const [list, countData] = await Promise.all([
        apiFetch('/api/notifications'),
        apiFetch('/api/notifications/unread-count'),
      ]);
      setNotifications(Array.isArray(list) ? list : []);
      setUnreadCount(countData.count || 0);
    } catch {}
  }

  // Charger au mount + polling toutes les 30s
  useEffect(() => {
    const token = localStorage.getItem('afristay_token');
    if (!token) return;
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fermer le dropdown au clic dehors
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function markAsRead(id: string) {
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  }

  async function markAllAsRead() {
    try {
      await apiFetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  }

  function getLink(notif: Notification): string {
    if (notif.data?.propertyId) return `/property/${notif.data.propertyId}`;
    if (notif.data?.bookingId) return `/traveler/bookings`;
    return linkMap[notif.type] || '/';
  }

  function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    if (diffH < 24) return `Il y a ${diffH}h`;
    if (diffD < 7) return `Il y a ${diffD}j`;
    return date.toLocaleDateString('fr-FR');
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton cloche */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-600 hover:text-primary transition rounded-lg hover:bg-gray-100"
        aria-label="Notifications"
      >
        <i className="fas fa-bell text-lg" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
          {/* En-tête */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary font-medium hover:underline"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* Liste */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-gray-400">
                <i className="far fa-bell-slash text-3xl mb-2" />
                <p className="text-sm">Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const icon = iconMap[notif.type] || 'fas fa-bell text-gray-400';
                const link = getLink(notif);
                return (
                  <a
                    key={notif.id}
                    href={link}
                    onClick={() => {
                      if (!notif.isRead) markAsRead(notif.id);
                      setOpen(false);
                    }}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition cursor-pointer border-b border-gray-50 last:border-0 ${
                      !notif.isRead ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 ${!notif.isRead ? 'ring-2 ring-primary/30' : ''}`}>
                      <i className={`${icon} text-sm`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notif.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                    )}
                  </a>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}