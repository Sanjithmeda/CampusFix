import React, { useState } from 'react';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Search,
  MapPin,
  ChevronRight,
  Droplets,
  Calendar
} from 'lucide-react';
import { Announcement, Complaint, MaintenanceTeam } from '../../types';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';

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
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      c.title.toLowerCase().includes(query) ||
      c.complaintNumber.toLowerCase().includes(query) ||
      c.campusArea.toLowerCase().includes(query) ||
      c.specificLocation.toLowerCase().includes(query);

    const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const getTabTitle = () => {
    switch (activeTab) {
      case 'completed':
        return 'Resolution History';
      case 'water_alerts':
        return 'Water Systems Priority';
      case 'announcements':
        return 'Maintenance Announcements';
      case 'work_orders':
      default:
        return 'Assigned Work Orders';
    }
  };

  const getTabSubtitle = () => {
    switch (activeTab) {
      case 'completed':
        return 'Resolved tickets and verified facility repairs';
      case 'water_alerts':
        return 'Water supply and sanitation priority queue';
      case 'announcements':
        return 'Scheduled maintenance alerts and utility notices';
      case 'work_orders':
      default:
        return 'Active field tasks and repair dispatch queue';
    }
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {getTabTitle()}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {getTabSubtitle()}
          </p>
        </div>

        {activeTab === 'announcements' && (
          <button
            onClick={onOpenAnnouncementModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition self-start sm:self-auto"
          >
            <Radio className="w-3.5 h-3.5" />
            New Announcement
          </button>
        )}
      </div>

      {/* Compact Status Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium block">Pending Dispatches</span>
          <span className="text-lg font-bold text-slate-900 mt-0.5 block">
            {complaints.filter(c => c.status === 'assigned').length}
          </span>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium block">In Progress</span>
          <span className="text-lg font-bold text-blue-600 mt-0.5 block">
            {complaints.filter(c => c.status === 'in_progress').length}
          </span>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium block">Critical / Overdue</span>
          <span className="text-lg font-bold text-rose-600 mt-0.5 block">
            {complaints.filter(c => c.priority === 'critical' || c.isOverdue).length}
          </span>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium block">Completed</span>
          <span className="text-lg font-bold text-emerald-600 mt-0.5 block">
            {completedOrders.length}
          </span>
        </div>
      </div>

      {/* VIEW: ANNOUNCEMENTS MANAGEMENT */}
      {activeTab === 'announcements' && (
        <div className="space-y-3 pt-1">
          {announcements.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-slate-200/80 shadow-xs">
              <Radio className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No active maintenance announcements.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {announcements.map((ann) => (
                <div key={ann.id} className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-blue-50 text-blue-700 border border-blue-200/60">
                      {ann.status.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400">{new Date(ann.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-xs sm:text-sm">{ann.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2">{ann.description}</p>
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex flex-wrap gap-x-3">
                    <span><strong>Area:</strong> {ann.affectedArea}</span>
                    <span><strong>Target:</strong> {new Date(ann.expectedCompletion).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: WORK ORDERS, COMPLETED, OR WATER PRIORITY */}
      {activeTab !== 'announcements' && (
        <div className="space-y-3 pt-1">
          {/* Compact Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="relative flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ID, title, area, or location..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shrink-0 w-full sm:w-auto"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Work Orders List: Compact, Information-Dense Cards */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center border border-slate-200/80 shadow-xs">
              <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-2">
                <Wrench className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-800 text-sm">No work orders found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
                There are no tasks matching your search or filter criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredOrders.map((comp) => (
                <div
                  key={comp.id}
                  onClick={() => onSelectComplaint(comp)}
                  className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/80 hover:border-blue-400 shadow-xs hover:shadow-sm transition cursor-pointer flex flex-col justify-between gap-2.5 group"
                >
                  {/* Row 1: ID, Status Badge, Water alert & Priority with score */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800">
                        {comp.complaintNumber}
                      </span>
                      <StatusBadge status={comp.status} size="sm" />
                      {comp.suspectedContamination && (
                        <span className="px-1.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-semibold rounded">
                          Water Contamination
                        </span>
                      )}
                    </div>
                    <PriorityBadge priority={comp.priority} score={comp.priorityScore} size="sm" />
                  </div>

                  {/* Row 2: Prominent Title */}
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition leading-snug">
                      {comp.title}
                    </h3>

                    {/* Secondary metadata: location and assignment */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 mt-1">
                      <span className="text-slate-600 font-medium">
                        {comp.campusArea} · {comp.specificLocation}
                      </span>
                      {comp.assignedTeamName && (
                        <span className="text-slate-400">
                          · Assigned: <span className="text-slate-600 font-medium">{comp.assignedTeamName}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 3: SLA Deadline and Primary Action Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="text-xs">
                      <span className="text-slate-400 text-[11px]">SLA: </span>
                      <span className={`font-medium ${comp.isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-700'}`}>
                        {comp.dueDate
                          ? new Date(comp.dueDate).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Standard'}
                      </span>
                      {comp.isOverdue && (
                        <span className="ml-1.5 text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-1 py-0.2 rounded font-semibold">
                          Overdue
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectComplaint(comp);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                    >
                      {comp.status === 'assigned'
                        ? 'Accept & Start'
                        : comp.status === 'in_progress'
                        ? 'Resolve'
                        : 'View Details'}
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
