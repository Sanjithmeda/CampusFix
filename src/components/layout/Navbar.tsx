import React, { useState, useEffect, useRef } from 'react';
import {
  Wrench,
  Bell,
  LogOut,
  User,
  Shield,
  Briefcase,
  GraduationCap,
  Sparkles,
  ChevronDown,
  Check,
  Menu,
  X
} from 'lucide-react';
import { useAuth, DEMO_PROFILES } from '../../context/AuthContext';
import { NotificationItem, UserRole } from '../../types';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../services/notificationService';
import { CampusFixLogo } from '../common/CampusFixLogo';

interface NavbarProps {
  onSelectComplaint?: (complaintId: string) => void;
  onOpenMobileMenu?: () => void;
  onOpenAISettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSelectComplaint, onOpenMobileMenu, onOpenAISettings }) => {
  const { userProfile, logout, switchDemoRole } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userProfile) return;
    const fetchNotifs = async () => {
      try {
        const list = await getUserNotifications(userProfile.id);
        setNotifications(list);
      } catch (err) {
        console.warn('Could not fetch notifications:', err);
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 20000);
    return () => clearInterval(interval);
  }, [userProfile?.id]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      await markNotificationAsRead(notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    }
    if (notif.relatedComplaintId && onSelectComplaint) {
      onSelectComplaint(notif.relatedComplaintId);
      setShowNotifications(false);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead(notifications);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <Shield className="w-3 h-3 text-amber-600" />
            Main Admin
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Wrench className="w-3 h-3 text-indigo-600" />
            Maintenance Team
          </span>
        );
      case 'faculty':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200">
            <Briefcase className="w-3 h-3 text-sky-600" />
            Faculty
          </span>
        );
      case 'student':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <GraduationCap className="w-3 h-3 text-slate-500" />
            Student
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 text-slate-900 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile trigger & Branding */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition focus:outline-none"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <CampusFixLogo variant="horizontal" size="md" />
              <span className="hidden sm:inline-block text-[11px] font-medium text-sky-700 bg-sky-50 border border-sky-200/60 px-2 py-0.5 rounded-md">
                Institutional Suite
              </span>
            </div>
          </div>

          {/* Right: Actions, Demo Switcher, Notifications, User info */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Demo Switcher */}
            <div className="relative" ref={roleRef}>
              <button
                type="button"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-medium text-slate-700 transition"
                title="Switch role view for project testing"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden md:inline text-slate-500">View as:</span>
                <span className="font-semibold text-slate-900 capitalize">{userProfile?.role}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50">
                  <div className="px-3.5 py-2 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 tracking-wider">
                    Switch Perspective (Demo)
                  </div>
                  {(['student', 'faculty', 'maintenance', 'admin'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        switchDemoRole(r);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left hover:bg-slate-50 transition ${
                        userProfile?.role === r ? 'text-indigo-600 font-semibold bg-indigo-50/50' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {r === 'admin' && <Shield className="w-3.5 h-3.5 text-amber-600" />}
                        {r === 'maintenance' && <Wrench className="w-3.5 h-3.5 text-indigo-600" />}
                        {r === 'faculty' && <Briefcase className="w-3.5 h-3.5 text-sky-600" />}
                        {r === 'student' && <GraduationCap className="w-3.5 h-3.5 text-slate-500" />}
                        <span className="capitalize">{r === 'maintenance' ? 'Maintenance Team' : r}</span>
                      </div>
                      {userProfile?.role === r && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* AI Engine Settings Button */}
            {onOpenAISettings && (
              <button
                type="button"
                onClick={onOpenAISettings}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/80 text-xs font-semibold text-indigo-700 transition"
                title="Configure OpenAI API / Prioritization Engine"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">AI Engine</span>
              </button>
            )}

            {/* In-app Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition focus:outline-none"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 text-white font-bold text-[10px] rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-indigo-600" />
                      <span className="font-semibold text-xs text-slate-900">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded font-bold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3.5 text-xs cursor-pointer hover:bg-slate-50 transition ${
                            !n.isRead ? 'bg-indigo-50/40' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-semibold ${!n.isRead ? 'text-indigo-950' : 'text-slate-800'}`}>
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-600 line-clamp-2 text-[11px]">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Badge */}
            <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-indigo-700 font-bold text-xs">
                {userProfile?.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">
                  {userProfile?.fullName || 'User'}
                </div>
                <div>{getRoleBadge(userProfile?.role)}</div>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={() => logout()}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
