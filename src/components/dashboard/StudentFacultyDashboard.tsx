import React, { useState } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Radio,
  PlusCircle,
  Search,
  Filter,
  Droplets,
  MapPin,
  ChevronRight,
  Info
} from 'lucide-react';
import { Announcement, Complaint } from '../../types';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import { WaterSafetyBadge } from '../common/WaterSafetyBadge';
import { useAuth } from '../../context/AuthContext';

interface StudentFacultyDashboardProps {
  activeTab: string;
  complaints: Complaint[];
  announcements: Announcement[];
  onSelectComplaint: (complaint: Complaint) => void;
  onOpenSubmitModal: () => void;
}

export const StudentFacultyDashboard: React.FC<StudentFacultyDashboardProps> = ({
  activeTab,
  complaints,
  announcements,
  onSelectComplaint,
  onOpenSubmitModal
}) => {
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const myComplaints = complaints.filter(c => c.reporterId === userProfile?.id);
  const activeAnnouncements = announcements.filter(a => a.status === 'planned' || a.status === 'in_progress');

  // Filter complaints based on tab and inputs
  const displayedComplaints = (activeTab === 'campus_feed' ? complaints : myComplaints).filter(c => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      c.title.toLowerCase().includes(query) ||
      c.complaintNumber.toLowerCase().includes(query) ||
      c.campusArea.toLowerCase().includes(query) ||
      c.specificLocation.toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const waterComplaints = complaints.filter(c => c.isWaterIssue || c.category.toLowerCase().includes('water'));

  const getTabTitle = () => {
    switch (activeTab) {
      case 'campus_feed':
        return 'Campus Incident Feed';
      case 'water_desk':
        return 'Water Safety Desk';
      case 'announcements':
        return 'Maintenance Notices';
      case 'my_reports':
      default:
        return 'My Complaints';
    }
  };

  const getTabSubtitle = () => {
    switch (activeTab) {
      case 'campus_feed':
        return 'Community facility reports logged across campus';
      case 'water_desk':
        return 'Campus water quality, sanitation, and supply status';
      case 'announcements':
        return 'Scheduled maintenance downtime and facility upgrades';
      case 'my_reports':
      default:
        return 'Track your reported maintenance issues and resolution status';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {getTabTitle()}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {getTabSubtitle()}
          </p>
        </div>

        <button
          onClick={onOpenSubmitModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Report Issue
        </button>
      </div>

      {/* Mini Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium block">My Submitted</span>
          <span className="text-lg font-bold text-slate-900 mt-0.5 block">{myComplaints.length}</span>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium block">In Progress</span>
          <span className="text-lg font-bold text-blue-600 mt-0.5 block">
            {myComplaints.filter(c => c.status === 'in_progress' || c.status === 'assigned').length}
          </span>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium block">Resolved & Closed</span>
          <span className="text-lg font-bold text-emerald-600 mt-0.5 block">
            {myComplaints.filter(c => c.status === 'resolved' || c.status === 'closed').length}
          </span>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium block">Active Notices</span>
          <span className="text-lg font-bold text-slate-700 mt-0.5 block">{activeAnnouncements.length}</span>
        </div>
      </div>

      {/* VIEW: ANNOUNCEMENTS */}
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
                <div
                  key={ann.id}
                  className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:shadow-sm transition space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      ann.status === 'in_progress'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : ann.status === 'planned'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {ann.status.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-semibold text-slate-900 text-sm">{ann.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{ann.description}</p>

                  <div className="p-2.5 bg-slate-50 rounded-lg text-xs text-slate-600 space-y-1 border border-slate-100">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>Affected: {ann.affectedArea}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {new Date(ann.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} — {new Date(ann.expectedCompletion).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {ann.alternateRoute && (
                    <div className="p-2 bg-blue-50/70 border border-blue-200/60 rounded-lg text-xs text-blue-900">
                      <strong>Alternate:</strong> {ann.alternateRoute}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: WATER SAFETY DESK */}
      {activeTab === 'water_desk' && (
        <div className="space-y-3 pt-1">
          <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3.5 text-slate-800 space-y-1.5">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Campus Water Quality & Sanitation</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Report anomalies regarding tap water (color, odor, taste, low pressure, leaks, or suspected contamination).
            </p>
          </div>

          <div className="flex justify-between items-center pt-1">
            <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">Active Water Reports</h3>
            <button
              onClick={onOpenSubmitModal}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Report Water Issue
            </button>
          </div>

          {waterComplaints.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-slate-200/80 shadow-xs">
              <Droplets className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No water-related issues currently logged.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {waterComplaints.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onSelectComplaint(c)}
                  className="bg-white rounded-xl p-3.5 border border-slate-200/80 hover:border-blue-400 shadow-xs cursor-pointer transition space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {c.complaintNumber}
                    </span>
                    <StatusBadge status={c.status} size="sm" />
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition truncate">
                    {c.title}
                  </h4>
                  <WaterSafetyBadge
                    suspectedContamination={c.suspectedContamination}
                    waterIssueType={c.waterIssueType}
                  />
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1.5 border-t border-slate-100">
                    <span className="truncate max-w-[200px]">{c.campusArea} · {c.specificLocation}</span>
                    <PriorityBadge priority={c.priority} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: MY COMPLAINTS OR CAMPUS FEED */}
      {(activeTab === 'my_reports' || activeTab === 'campus_feed') && (
        <div className="space-y-3 pt-1">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="relative flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ID, title, facility, location..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shrink-0 w-full sm:w-auto"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Verified & Closed</option>
              <option value="reopened">Reopened</option>
            </select>
          </div>

          {/* Complaints List */}
          {displayedComplaints.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center border border-slate-200/80 shadow-xs">
              <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-2">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-800 text-sm">No complaints found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5 mb-3">
                {searchTerm || statusFilter !== 'all'
                  ? 'No records match your selected filter criteria.'
                  : activeTab === 'my_reports'
                  ? 'You have not submitted any complaints yet.'
                  : 'No complaints in the campus feed.'}
              </p>
              <button
                onClick={onOpenSubmitModal}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
              >
                Report New Issue
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {displayedComplaints.map((comp) => (
                <div
                  key={comp.id}
                  onClick={() => onSelectComplaint(comp)}
                  className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/80 hover:border-blue-400 shadow-xs hover:shadow-sm transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-800">
                        {comp.complaintNumber}
                      </span>
                      <StatusBadge status={comp.status} size="sm" />
                      <PriorityBadge priority={comp.priority} score={comp.priorityScore} size="sm" />
                      {comp.suspectedContamination && (
                        <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold rounded">
                          Water Contamination
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition truncate">
                      {comp.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                      <span>{comp.campusArea} · <strong className="text-slate-600">{comp.specificLocation}</strong></span>
                      <span>Category: <strong>{comp.category}</strong></span>
                    </div>

                    {comp.status === 'resolved' && (
                      <div className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-1">
                        Repair completed. Click to verify & rate.
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 text-xs">
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">Reported</div>
                      <div className="text-slate-700 font-medium">
                        {new Date(comp.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
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
