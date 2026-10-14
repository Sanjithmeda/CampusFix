import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Droplets,
  Radio,
  Wrench,
  CheckCircle2,
  Users,
  MapPin,
  BarChart3,
  FolderTree,
  FileText,
  X
} from 'lucide-react';
import { UserRole } from '../../types';
import { CampusFixLogo } from '../common/CampusFixLogo';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  userRole: UserRole;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenSubmitModal?: () => void;
  pendingApprovalsCount?: number;
  waterAlertCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  userRole,
  isOpenMobile = false,
  onCloseMobile,
  onOpenSubmitModal,
  pendingApprovalsCount = 0,
  waterAlertCount = 0
}) => {
  const getNavItems = () => {
    switch (userRole) {
      case 'admin':
        return [
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'complaints', label: 'Complaint Queue', icon: FolderTree },
          {
            id: 'water_alerts',
            label: 'Water Emergency Desk',
            icon: Droplets,
            badge: waterAlertCount > 0 ? `${waterAlertCount}` : undefined,
            badgeColor: 'bg-rose-50 text-rose-700 border border-rose-200'
          },
          {
            id: 'users',
            label: 'User Approvals',
            icon: Users,
            badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount}` : undefined,
            badgeColor: 'bg-amber-50 text-amber-800 border border-amber-200'
          },
          { id: 'master_data', label: 'Areas & Categories', icon: MapPin },
          { id: 'announcements', label: 'Announcements', icon: Radio },
          { id: 'analytics', label: 'Reports & Analytics', icon: BarChart3 }
        ];

      case 'maintenance':
        return [
          { id: 'work_orders', label: 'Assigned Work Orders', icon: Wrench },
          { id: 'completed', label: 'Resolution History', icon: CheckCircle2 },
          {
            id: 'water_alerts',
            label: 'Water Systems Priority',
            icon: Droplets,
            badge: waterAlertCount > 0 ? 'Urgent' : undefined,
            badgeColor: 'bg-rose-50 text-rose-700 border border-rose-200'
          },
          { id: 'announcements', label: 'Maintenance Announcements', icon: Radio }
        ];

      case 'student':
      case 'faculty':
      default:
        return [
          { id: 'my_reports', label: 'My Complaints', icon: FileText },
          { id: 'campus_feed', label: 'Campus Feed', icon: LayoutDashboard },
          { id: 'water_desk', label: 'Water Desk', icon: Droplets },
          { id: 'announcements', label: 'Maintenance Notices', icon: Radio }
        ];
    }
  };

  const navItems = getNavItems();

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200/80 text-slate-700 w-60 select-none">
      {/* Mobile close button with Brand Logo */}
      <div className="md:hidden flex items-center justify-between p-3.5 border-b border-slate-100">
        <CampusFixLogo variant="horizontal" size="sm" />
        <button
          onClick={onCloseMobile}
          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Action Button for Submitting Complaints */}
      {(userRole === 'student' || userRole === 'faculty' || userRole === 'admin') && onOpenSubmitModal && (
        <div className="p-3 border-b border-slate-100">
          <button
            onClick={() => {
              onOpenSubmitModal();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            Report Issue
          </button>
        </div>
      )}

      {/* Nav List */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${item.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Unobtrusive Emergency Help footer */}
      <div className="px-3 py-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-slate-600">
          <Droplets className="w-3 h-3 text-blue-600" />
          Emergency
        </span>
        <span className="font-semibold text-slate-700 font-mono text-[11px]">Ext. 1008</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden md:flex flex-col h-[calc(100vh-4rem)] sticky top-16 shrink-0">
        {content}
      </aside>

      {/* Mobile drawer overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-900/40 backdrop-blur-xs flex">
          <div className="relative flex-1 max-w-xs w-full bg-white h-full shadow-2xl">
            {content}
          </div>
          <div className="flex-1" onClick={onCloseMobile}></div>
        </div>
      )}
    </>
  );
};
