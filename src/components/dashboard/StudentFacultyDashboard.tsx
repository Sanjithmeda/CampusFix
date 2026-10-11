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
  ExternalLink,
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
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.complaintNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.campusArea.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.specificLocation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const waterComplaints = complaints.filter(c => c.isWaterIssue || c.category.toLowerCase().includes('water'));

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2 uppercase tracking-wider">
              {userProfile?.role.toUpperCase()} PORTAL · {userProfile?.department}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Welcome back, {userProfile?.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1">
              Report campus facilities issues, track real-time resolution progress, and verify completed repairs.
            </p>
          </div>
          <button
            onClick={onOpenSubmitModal}
            className="self-start md:self-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            Report New Complaint
          </button>
        </div>

        {/* Mini metric counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block font-medium">My Submitted Reports</span>
            <span className="text-xl font-bold text-white mt-0.5 block">{myComplaints.length}</span>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block font-medium">In Progress / Assigned</span>
            <span className="text-xl font-bold text-amber-400 mt-0.5 block">
              {myComplaints.filter(c => c.status === 'in_progress' || c.status === 'assigned').length}
            </span>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block font-medium">Resolved & Closed</span>
            <span className="text-xl font-bold text-emerald-400 mt-0.5 block">
              {myComplaints.filter(c => c.status === 'resolved' || c.status === 'closed').length}
            </span>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block font-medium">Active Maintenance Notices</span>
            <span className="text-xl font-bold text-sky-400 mt-0.5 block">{activeAnnouncements.length}</span>
          </div>
        </div>
      </div>

      {/* VIEW: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Campus Maintenance Activity Broadcasts</h2>
              <p className="text-xs text-slate-500">Scheduled utility outages, pipeline cleaning, and facility upgrades</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
                    ann.status === 'in_progress'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : ann.status === 'planned'
                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    {ann.status.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    By {ann.publishedByName}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm">{ann.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{ann.description}</p>

                <div className="p-2.5 bg-slate-50 rounded-lg text-xs text-slate-700 space-y-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Affected Area: <strong>{ann.affectedArea}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      Window: {new Date(ann.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} — {new Date(ann.expectedCompletion).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {ann.alternateRoute && (
                  <div className="p-2.5 bg-indigo-50/70 border border-indigo-200/60 rounded-lg text-xs text-indigo-950 flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <span><strong>Contingency / Alternate Route:</strong> {ann.alternateRoute}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: WATER SAFETY DESK */}
      {activeTab === 'water_desk' && (
        <div className="space-y-4">
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5 text-sky-950 space-y-3">
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-sky-600" />
              <h2 className="text-lg font-bold">Campus Drinking Water & Sanitation Desk</h2>
            </div>
            <p className="text-xs leading-relaxed max-w-2xl text-sky-900">
              Safe drinking water is fundamental to campus health. Use this specialized module to report water quality anomalies (taste, smell, turbidity, low pressure, leaks) or suspected contamination.
            </p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span className="text-[11px]">
                <strong>Statutory Advisory:</strong> CampusFix is an incident logging platform and does not perform physical microbiological or chemical water tests. Reports flagged as suspected contamination trigger an immediate automated dispatch alert to the campus health & water laboratory team.
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <h3 className="font-bold text-slate-800 text-sm">Active Campus Water Quality Tickets</h3>
            <button
              onClick={onOpenSubmitModal}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Report Water Issue
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {waterComplaints.map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectComplaint(c)}
                className="bg-white rounded-xl p-4 border border-slate-200 hover:border-indigo-400 shadow-xs cursor-pointer transition space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                    {c.complaintNumber}
                  </span>
                  <StatusBadge status={c.status} size="sm" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{c.title}</h4>
                <WaterSafetyBadge
                  suspectedContamination={c.suspectedContamination}
                  waterIssueType={c.waterIssueType}
                />
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <span className="truncate max-w-[200px]">{c.specificLocation}</span>
                  <PriorityBadge priority={c.priority} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: MY COMPLAINTS OR CAMPUS FEED */}
      {(activeTab === 'my_reports' || activeTab === 'campus_feed') && (
        <div className="space-y-4">
          {/* Controls bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search complaints by ID, title, facility..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          </div>

          {/* Complaints List */}
          {displayedComplaints.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-xs">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">No complaints found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'No tickets match the selected filters.'
                  : activeTab === 'my_reports'
                  ? 'You have not submitted any complaints yet. Use the button below to report any broken equipment, leak, or electrical fault.'
                  : 'No campus reports found.'}
              </p>
              <button
                onClick={onOpenSubmitModal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
              >
                Submit First Complaint
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedComplaints.map((comp) => (
                <div
                  key={comp.id}
                  onClick={() => onSelectComplaint(comp)}
                  className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 hover:border-indigo-400 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                        {comp.complaintNumber}
                      </span>
                      <StatusBadge status={comp.status} size="sm" />
                      <PriorityBadge priority={comp.priority} score={comp.priorityScore} size="sm" />
                      {comp.suspectedContamination && (
                        <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-md">
                          WATER CONTAMINATION
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition truncate">
                      {comp.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {comp.campusArea} · <span className="text-slate-700 font-medium">{comp.specificLocation}</span>
                      </span>
                      <span>Category: <strong>{comp.category}</strong></span>
                      <span>Impact: <strong>{comp.affectedPeople} users</strong></span>
                    </div>

                    {comp.status === 'resolved' && (
                      <div className="text-[11px] text-emerald-800 font-medium bg-emerald-50 px-2.5 py-1 rounded-md inline-block border border-emerald-200/60">
                        Work marked complete by {comp.resolutionDetails?.resolvedByName || 'Maintenance'}. Click to verify and rate!
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 text-xs">
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">Submitted</div>
                      <div className="text-slate-700 font-medium">
                        {new Date(comp.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-transform" />
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
