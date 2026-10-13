import React, { useState } from 'react';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Radio,
  PlusCircle,
  Search,
  Filter,
  MapPin,
  ChevronRight,
  Droplets,
  Calendar
} from 'lucide-react';
import { Announcement, Complaint, MaintenanceTeam } from '../../types';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import { WaterSafetyBadge } from '../common/WaterSafetyBadge';
import { useAuth } from '../../context/AuthContext';
import { CampusFixIcon } from '../common/CampusFixLogo';

interface MaintenanceDashboardProps {
  activeTab: string;
  complaints: Complaint[];
  announcements: Announcement[];
  maintenanceTeams: MaintenanceTeam[];
  onSelectComplaint: (complaint: Complaint) => void;
  onOpenAnnouncementModal: () => void;
}

export const MaintenanceDashboard: React.FC<MaintenanceDashboardProps> = ({
  activeTab,
  complaints,
  announcements,
  maintenanceTeams,
  onSelectComplaint,
  onOpenAnnouncementModal
}) => {
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Work orders assigned or open
  const assignedWorkOrders = complaints.filter(c =>
    c.status === 'assigned' || c.status === 'in_progress' || c.status === 'reopened'
  );

  const completedOrders = complaints.filter(c =>
    c.status === 'resolved' || c.status === 'closed'
  );

  const waterTickets = complaints.filter(c =>
    c.isWaterIssue || c.category.toLowerCase().includes('water')
  );

  const filteredOrders = (
    activeTab === 'completed'
      ? completedOrders
      : activeTab === 'water_alerts'
      ? waterTickets
      : assignedWorkOrders
  ).filter(c => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.complaintNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.campusArea.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.specificLocation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-slate-800/90 border border-slate-700/80 shadow-xs flex items-center justify-center shrink-0">
              <CampusFixIcon sizePx={38} />
            </div>
            <div>
              <div className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/30 mb-2 uppercase tracking-wider">
                OPERATIONS DESK · MAINTENANCE CREW
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Maintenance Field Queue
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1">
                Active dispatch list, SLA response tracking, on-site diagnostics, and resolution records.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAnnouncementModal}
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition"
          >
            <Radio className="w-4 h-4" />
            Publish Campus Broadcast
          </button>
        </div>

        {/* Counter cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block font-medium">Pending Dispatches</span>
            <span className="text-xl font-bold text-amber-400 mt-0.5 block">
              {complaints.filter(c => c.status === 'assigned').length}
            </span>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block font-medium">Active In-Progress</span>
            <span className="text-xl font-bold text-indigo-400 mt-0.5 block">
              {complaints.filter(c => c.status === 'in_progress').length}
            </span>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block font-medium">Critical / Overdue</span>
            <span className="text-xl font-bold text-rose-400 mt-0.5 block">
              {complaints.filter(c => c.priority === 'critical' || c.isOverdue).length}
            </span>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block font-medium">Resolved This Term</span>
            <span className="text-xl font-bold text-emerald-400 mt-0.5 block">{completedOrders.length}</span>
          </div>
        </div>
      </div>

      {/* VIEW: ANNOUNCEMENTS MANAGEMENT */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Publish Maintenance Activity Announcements</h2>
              <p className="text-xs text-slate-500">Keep campus inhabitants informed about scheduled facility interventions</p>
            </div>
            <button
              onClick={onOpenAnnouncementModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5"
            >
              <Radio className="w-3.5 h-3.5" />
              New Broadcast
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map((ann) => (
              <div key={ann.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                    {ann.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-400">{new Date(ann.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{ann.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{ann.description}</p>
                <div className="p-2.5 bg-slate-50 rounded-lg text-xs text-slate-700 space-y-1">
                  <div><strong>Area:</strong> {ann.affectedArea}</div>
                  <div><strong>Window:</strong> {new Date(ann.startTime).toLocaleString()} — {new Date(ann.expectedCompletion).toLocaleString()}</div>
                </div>
                {ann.alternateRoute && (
                  <div className="p-2.5 bg-sky-50 text-sky-900 text-xs rounded-lg border border-sky-200">
                    <strong>Contingency:</strong> {ann.alternateRoute}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: WORK ORDERS, COMPLETED, OR WATER PRIORITY */}
      {activeTab !== 'announcements' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter work orders by title, complaint #, location..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical Only</option>
                <option value="high">High Only</option>
                <option value="medium">Medium Only</option>
                <option value="low">Low Only</option>
              </select>
            </div>
          </div>

          {/* Work Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-xs">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">No work orders in this view</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                There are no maintenance tasks currently matching the selected filter.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((comp) => (
                <div
                  key={comp.id}
                  onClick={() => onSelectComplaint(comp)}
                  className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 hover:border-indigo-400 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                        {comp.complaintNumber}
                      </span>
                      <StatusBadge status={comp.status} size="sm" />
                      <PriorityBadge priority={comp.priority} score={comp.priorityScore} size="sm" />
                      {comp.suspectedContamination && (
                        <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-md">
                          WATER CONTAMINATION ALERT
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition truncate">
                      {comp.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                        {comp.campusArea} · {comp.specificLocation}
                      </span>
                      <span>Category: <strong>{comp.category}</strong></span>
                      <span>Assigned to: <strong>{comp.assignedTeamName || 'General Maintenance'}</strong></span>
                      <span>Affected: <strong>{comp.affectedPeople} people</strong></span>
                    </div>

                    <div className="text-[11px] text-slate-500 italic line-clamp-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      "{comp.description}"
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-right text-xs">
                      <div className="text-[10px] text-slate-400">Target SLA</div>
                      <div className={`font-semibold ${comp.isOverdue ? 'text-rose-600' : 'text-slate-700'}`}>
                        {comp.dueDate ? new Date(comp.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit' }) : 'ASAP'}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectComplaint(comp);
                      }}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                    >
                      {comp.status === 'assigned' ? 'Accept & Start' : comp.status === 'in_progress' ? 'Resolve' : 'View Details'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
