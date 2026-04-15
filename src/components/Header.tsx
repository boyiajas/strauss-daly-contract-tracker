import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Clock, LogOut, Menu, Search, Settings } from 'lucide-react';
import { fetchNotificationLogs } from '../lib/notifications';
import { NotificationLog } from '../types';

interface HeaderProps {
  onMenuClick: () => void;
  onLogout: () => void;
  user: any;
}

const menuWidth = 220;
const notificationsWidth = 320;

const getMenuPosition = (rect: DOMRect, width: number, height: number) => {
  let left = rect.right - width;
  let top = rect.bottom + 8;

  if (left < 8) left = 8;
  if (left + width > window.innerWidth - 8) {
    left = window.innerWidth - width - 8;
  }
  if (top + height > window.innerHeight - 8) {
    top = rect.top - height - 8;
  }
  if (top < 8) top = 8;

  return { top, left };
};

export function Header({ onMenuClick, onLogout, user }: HeaderProps) {
  const navigate = useNavigate();
  const [bellOpen, setBellOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [bellPosition, setBellPosition] = useState<{ top: number; left: number } | null>(null);
  const [userPosition, setUserPosition] = useState<{ top: number; left: number } | null>(null);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);

  const closeMenus = useCallback(() => {
    setBellOpen(false);
    setUserOpen(false);
    setBellPosition(null);
    setUserPosition(null);
  }, []);

  useEffect(() => {
    if (!bellOpen && !userOpen) return;
    const handleScroll = () => closeMenus();
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [bellOpen, userOpen, closeMenus]);

  const loadNotifications = useCallback(async () => {
    setIsLoadingNotifications(true);
    try {
      const data = await fetchNotificationLogs();
      setNotifications(data);
      setNotificationsError(null);
    } catch (error) {
      setNotificationsError('Unable to load notifications.');
    } finally {
      setIsLoadingNotifications(false);
    }
  }, []);

  const recentNotifications = useMemo(() => notifications.slice(0, 5), [notifications]);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button 
          onClick={onMenuClick}
          className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg lg:hidden"
        >
          <Menu size={20} />
        </button>
        
        <div className="relative w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search contracts, parties, or users..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        <button
          className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setUserOpen(false);
            setUserPosition(null);
            setBellOpen((prev) => {
              const next = !prev;
              if (next) {
                setBellPosition(getMenuPosition(rect, notificationsWidth, 280));
                loadNotifications();
              } else {
                setBellPosition(null);
              }
              return next;
            });
          }}
        >
          <Bell size={20} />
          {notifications.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </button>
        
        <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

        <button
          className="flex items-center gap-2 sm:gap-3 hover:bg-slate-50 p-1.5 sm:pr-3 rounded-full transition-colors"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setBellOpen(false);
            setBellPosition(null);
            setUserOpen((prev) => {
              const next = !prev;
              setUserPosition(next ? getMenuPosition(rect, menuWidth, 140) : null);
              return next;
            });
          }}
        >
          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
            {user.name.split(' ').map((n: string) => n[0]).join('')}
          </div>
          <div className="text-left hidden md:block">
            <p className="text-sm font-semibold text-slate-900 leading-none">{user.name}</p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-bold">{user.role}</p>
          </div>
          <ChevronDown size={14} className="text-slate-400" />
        </button>
      </div>

      {bellOpen && bellPosition && typeof document !== 'undefined'
        ? createPortal(
            <>
              <div className="fixed inset-0 z-40" onClick={closeMenus} />
              <div
                className="fixed z-50 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-4"
                style={{ top: bellPosition.top, left: bellPosition.left }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-slate-900">Notifications</p>
                  <button
                    onClick={() => {
                      closeMenus();
                      navigate('/notifications');
                    }}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    View all
                  </button>
                </div>

                <div className="space-y-3 max-h-72 overflow-auto">
                  {isLoadingNotifications && (
                    <p className="text-sm text-slate-500">Loading notifications...</p>
                  )}
                  {!isLoadingNotifications && notificationsError && (
                    <p className="text-sm text-red-500">{notificationsError}</p>
                  )}
                  {!isLoadingNotifications && !notificationsError && recentNotifications.length === 0 && (
                    <p className="text-sm text-slate-500">No notifications yet.</p>
                  )}
                  {!isLoadingNotifications && !notificationsError && recentNotifications.map((log) => (
                    <div key={log.id} className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                        <Clock size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">{log.subject}</p>
                        <p className="text-xs text-slate-500">{log.recipient}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{log.timestamp}</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>,
            document.body
          )
        : null}

      {userOpen && userPosition && typeof document !== 'undefined'
        ? createPortal(
            <>
              <div className="fixed inset-0 z-40" onClick={closeMenus} />
              <div
                className="fixed z-50 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2"
                style={{ top: userPosition.top, left: userPosition.left }}
              >
                <button
                  onClick={() => {
                    closeMenus();
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors text-left"
                >
                  <Settings size={16} /> System Settings
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button
                  onClick={() => {
                    closeMenus();
                    onLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            </>,
            document.body
          )
        : null}
    </header>
  );
}
