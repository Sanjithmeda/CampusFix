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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

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
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 text-slate-900 shadow-xs w-full max-w-full">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1">
          {/* Left: Mobile trigger & Branding */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="md:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition focus:outline-none shrink-0"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center shrink-0">
              <CampusFixLogo variant="horizontal" size="sm" className="sm:hidden" />
              <CampusFixLogo variant="horizontal" size="md" className="hidden sm:flex" />
            </div>
          </div>

          {/* Right: Actions, Demo Switcher, Notifications, User info */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            {/* Quick Demo Switcher */}
            <div className="relative" ref={roleRef}>
              <button
                type="button"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] sm:text-xs font-medium text-slate-700 transition"
                title="Switch role view for project testing"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="hidden md:inline text-slate-500">Role:</span>
                <span className="font-semibold text-slate-900 capitalize truncate max-w-[65px] sm:max-w-none">{userProfile?.role}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-48 sm:w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                  <div className="px-3.5 py-2 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 tracking-wider">
                    Switch Role (Demo)
                  </div>
                  {(['student', 'faculty', 'maintenance', 'admin'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        switchDemoRole(r);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-50 transition ${
                        userProfile?.role === r ? 'text-indigo-600 font-semibold bg-indigo-50/50' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {r === 'admin' && <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                        {r === 'maintenance' && <Wrench className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                        {r === 'faculty' && <Briefcase className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                        {r === 'student' && <GraduationCap className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                        <span className="capitalize truncate">{r === 'maintenance' ? 'Maintenance' : r}</span>
                      </div>
                      {userProfile?.role === r && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* AI Engine Settings Button (hidden on mobile navbar to preserve space) */}
            {onOpenAISettings && (
              <button
                type="button"
                onClick={onOpenAISettings}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/80 text-xs font-semibold text-indigo-700 transition"
                title="Configure OpenAI API / Prioritization Engine"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>AI Engine</span>
              </button>
            )}

            {/* In-app Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-1.5 sm:p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition focus:outline-none"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-indigo-600 text-white font-bold text-[9px] sm:text-[10px] rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50 border-b border-slate-200">
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
                          className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition ${
                            !n.isRead ? 'bg-indigo-50/40' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-semibold ${!n.isRead ? 'text-indigo-950' : 'text-slate-800'} truncate pr-2`}>
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">
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

            {/* User Profile Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-1.5 pl-1.5 pr-1 py-1 rounded-lg hover:bg-slate-100 transition focus:outline-none"
                aria-label="User Profile Menu"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-semibold text-xs shrink-0">
                  {userProfile?.fullName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-800 truncate max-w-[100px]">
                    {userProfile?.fullName || 'User'}
                  </div>
                  <div className="text-[10px] text-slate-500 capitalize leading-none">
                    {userProfile?.role}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50">
                  <div className="px-3.5 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900 truncate">{userProfile?.fullName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{userProfile?.email}</p>
                    <div className="mt-1.5">{getRoleBadge(userProfile?.role)}</div>
                  </div>
                  <div className="px-1 py-1">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
