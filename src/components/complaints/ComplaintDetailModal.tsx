import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  MapPin,
  Tag,
  Users,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Star,
  RefreshCw,
  Send,
  MessageSquare,
  Wrench,
  Shield,
  FileText,
  Calendar,
  Building,
  AlertCircle,
  ExternalLink,
  Camera,
  Upload
} from 'lucide-react';
import {
  Complaint,
  ComplaintActivity,
  ComplaintPriority,
  ComplaintStatus,
  MaintenanceTeam,
  UserRole
} from '../../types';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import { WaterSafetyBadge } from '../common/WaterSafetyBadge';
import { CameraCapture } from '../common/CameraCapture';
import {
  getComplaintHistory,
  updateComplaintStatus,
  assignComplaint,
  resolveComplaint,
  verifyAndCloseComplaint,
  reopenComplaint,
  linkComplaintDuplicates
} from '../../services/complaintService';
import { useAuth } from '../../context/AuthContext';
import { CampusFixIcon } from '../common/CampusFixLogo';

interface ComplaintDetailModalProps {
  complaint: Complaint | null;
  onClose: () => void;
  onUpdated: () => void;
  maintenanceTeams: MaintenanceTeam[];
  allComplaints?: Complaint[];
}

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  complaint,
  onClose,
  onUpdated,
  maintenanceTeams,
  allComplaints = []
}) => {
  const { userProfile } = useAuth();
  const [history, setHistory] = useState<ComplaintActivity[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states for modal actions
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(complaint?.assignedTeamId || '');
  const [selectedPriority, setSelectedPriority] = useState<ComplaintPriority>(complaint?.priority || 'medium');
  const [assignNote, setAssignNote] = useState('');

  // Resolution Form
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [hoursSpent, setHoursSpent] = useState<number>(1);
  const [partsReplaced, setPartsReplaced] = useState('');
  const [resolutionPhoto, setResolutionPhoto] = useState<string>('');
  const [isResolveCameraOpen, setIsResolveCameraOpen] = useState(false);

  // Feedback Form (Student/Faculty)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState('');

  // Reopen Form
  const [showReopenForm, setShowReopenForm] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  // Link Duplicates Form
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [duplicateToLink, setDuplicateToLink] = useState('');

  useEffect(() => {
    if (!complaint) return;
    const fetchHist = async () => {
      setLoadingHistory(true);
      const acts = await getComplaintHistory(complaint.id);
      setHistory(acts);
      setLoadingHistory(false);
    };
    fetchHist();
    setSelectedTeamId(complaint.assignedTeamId || (maintenanceTeams[0]?.id || ''));
    setSelectedPriority(complaint.priority);
  }, [complaint?.id]);

  if (!complaint) return null;

  const currentRole = userProfile?.role || 'student';
  const isAdmin = currentRole === 'admin';
  const isMaintenance = currentRole === 'maintenance';
  const isReporter = userProfile?.id === complaint.reporterId;

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    const team = maintenanceTeams.find(t => t.id === selectedTeamId);
    if (!team) return;

    try {
      setActionLoading(true);
      setError(null);
      await assignComplaint(
        complaint.id,
        team.id,
        team.name,
        selectedPriority,
        { id: userProfile.id, fullName: userProfile.fullName, role: userProfile.role },
        assignNote
      );
      setShowAssignForm(false);
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to assign team');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartWork = async () => {
    if (!userProfile) return;
    try {
      setActionLoading(true);
      setError(null);
      await updateComplaintStatus(
        complaint.id,
        'in_progress',
        { id: userProfile.id, fullName: userProfile.fullName, role: userProfile.role },
        'Maintenance crew arrived on-site and initiated active diagnosis and repair.'
      );
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update work order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !resolutionNote.trim()) return;

    try {
      setActionLoading(true);
      setError(null);
      await resolveComplaint(
        complaint.id,
        { id: userProfile.id, fullName: userProfile.fullName, role: userProfile.role },
        resolutionNote.trim(),
        hoursSpent,
        partsReplaced.trim() || undefined,
        resolutionPhoto || undefined
      );
      setShowResolveForm(false);
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to resolve complaint');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    try {
      setActionLoading(true);
      setError(null);
      await verifyAndCloseComplaint(
        complaint.id,
        { id: userProfile.id, fullName: userProfile.fullName, role: userProfile.role },
        feedbackRating,
        feedbackComment.trim()
      );
      setShowFeedbackForm(false);
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to verify and close complaint');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !reopenReason.trim()) return;

    try {
      setActionLoading(true);
      setError(null);
      await reopenComplaint(
        complaint.id,
        { id: userProfile.id, fullName: userProfile.fullName, role: userProfile.role },
        reopenReason.trim()
      );
      setShowReopenForm(false);
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reopen complaint');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !duplicateToLink) return;

    try {
      setActionLoading(true);
      setError(null);
      await linkComplaintDuplicates(
        complaint.id,
        duplicateToLink,
        { id: userProfile.id, fullName: userProfile.fullName, role: userProfile.role }
      );
      setShowLinkForm(false);
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to link complaints');
    } finally {
      setActionLoading(false);
    }
  };

  // Find other complaints for duplicate linking dropdown
  const otherComplaints = allComplaints.filter(c => c.id !== complaint.id);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 sm:px-6 py-3 sm:py-4 bg-white border-b border-slate-200 text-slate-900 gap-2">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 min-w-0">
            <CampusFixIcon sizePx={24} className="shrink-0" />
            <span className="font-mono text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 bg-indigo-50 border border-indigo-200/80 text-indigo-700 font-semibold rounded-md">
              {complaint.complaintNumber}
            </span>
            <StatusBadge status={complaint.status} size="sm" />
            <PriorityBadge priority={complaint.priority} score={complaint.priorityScore} size="sm" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-5 max-h-[78vh] overflow-y-auto text-slate-800">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Title & Water Notice */}
          <div>
            <h1 className="text-xl font-bold text-slate-900 mb-2 leading-tight">
              {complaint.title}
            </h1>
            <WaterSafetyBadge
              suspectedContamination={complaint.suspectedContamination}
              waterIssueType={complaint.waterIssueType}
              showDisclaimer={complaint.isWaterIssue}
            />
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Campus Facility</span>
              <span className="font-semibold text-slate-800">{complaint.campusArea}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Precise Location</span>
              <span className="font-semibold text-slate-800 truncate block">{complaint.specificLocation}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Category</span>
              <span className="font-semibold text-slate-800">{complaint.category}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Assigned Team</span>
              <span className="font-semibold text-slate-800 truncate block">
                {complaint.assignedTeamName || 'Unassigned'}
              </span>
            </div>
          </div>

          {/* Reporter & SLA */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 px-1">
            <div className="flex items-center gap-1.5">
              <span>Reported by:</span>
              <strong className="text-slate-800 font-semibold">{complaint.reporterName}</strong>
              <span className="capitalize text-slate-400">({complaint.reporterRole})</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Submitted: {new Date(complaint.createdAt).toLocaleDateString()}</span>
              {complaint.dueDate && (
                <span className={complaint.isOverdue ? 'text-rose-600 font-semibold' : ''}>
                  SLA Target: {new Date(complaint.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Priority Explanation Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800">
            <div className="font-semibold flex items-center gap-1.5 text-indigo-700 mb-1">
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              Prioritization Rationale (Score: {complaint.priorityScore}/100)
            </div>
            <p className="text-slate-600 leading-relaxed">{complaint.priorityReason}</p>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Issue Description</h3>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 whitespace-pre-line leading-relaxed">
              {complaint.description}
            </div>
          </div>

          {/* Optional Image */}
          {complaint.imageUrl && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Attached Image Evidence</h3>
              <div className="rounded-xl overflow-hidden border border-slate-200 max-h-64 bg-slate-100 flex items-center justify-center">
                <img src={complaint.imageUrl} alt="Attached incident photo" className="object-cover w-full h-full" />
              </div>
            </div>
          )}

          {/* Linked Complaints (Duplicates / Repeated Incidents) */}
          {complaint.linkedComplaintIds && complaint.linkedComplaintIds.length > 0 && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs">
              <div className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-amber-700" />
                Linked Repeat Reports ({complaint.linkedComplaintIds.length})
              </div>
              <p className="text-amber-800 text-[11px] mb-2">
                These separate reports have been grouped under this master ticket to avoid redundant dispatches while preserving individual user tracking.
              </p>
              <div className="flex gap-2 flex-wrap">
                {complaint.linkedComplaintIds.map((id) => (
                  <span key={id} className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300 text-amber-900">
                    ID: {id}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Resolution Details Box (if resolved/closed) */}
          {complaint.resolutionDetails && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Resolution Work Report
                </div>
                <span className="text-[11px] text-emerald-700">
                  {new Date(complaint.resolutionDetails.resolvedAt).toLocaleString()}
                </span>
              </div>
              <p className="text-slate-800 bg-white p-2.5 rounded-lg border border-emerald-200 text-xs">
                {complaint.resolutionDetails.resolutionNote}
              </p>
              <div className="flex gap-4 text-[11px] text-emerald-800">
                <span>By: <strong>{complaint.resolutionDetails.resolvedByName}</strong></span>
                <span>Labor: <strong>{complaint.resolutionDetails.hoursSpent} hours</strong></span>
                {complaint.resolutionDetails.partsReplaced && (
                  <span>Parts: <strong>{complaint.resolutionDetails.partsReplaced}</strong></span>
                )}
              </div>
              {complaint.resolutionDetails.resolutionImageUrl && (
                <div className="mt-2 pt-2 border-t border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-900 block mb-1">Attached Completion Photo Evidence:</span>
                  <div className="w-32 h-24 rounded-lg overflow-hidden border border-emerald-300">
                    <img src={complaint.resolutionDetails.resolutionImageUrl} alt="Resolution evidence" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Verification & Feedback Box */}
          {complaint.verificationDetails && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">User Satisfaction & Verification</span>
                <div className="flex items-center text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < (complaint.verificationDetails?.feedbackRating || 5)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-slate-600 italic">
                "{complaint.verificationDetails.feedbackComment || 'No additional comments.'}"
              </p>
            </div>
          )}

          {/* Reopen Box */}
          {complaint.reopenDetails && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-950">
              <strong className="text-rose-900 font-bold block mb-1">Reopened by {complaint.reopenDetails.reopenedByName}:</strong>
              <p className="text-slate-700">{complaint.reopenDetails.reason}</p>
            </div>
          )}

          {/* Action Sections based on Role & State */}
          <div className="pt-2 border-t border-slate-100">
            {/* ADMIN ACTIONS */}
            {isAdmin && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAssignForm(!showAssignForm)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    {complaint.assignedTeamId ? 'Reassign Team / Adjust Priority' : 'Assign Team & Priority'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowLinkForm(!showLinkForm)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition flex items-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Link Duplicate Report
                  </button>

                  {(complaint.status === 'resolved' || complaint.status === 'closed') && (
                    <button
                      type="button"
                      onClick={() => setShowReopenForm(!showReopenForm)}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-200 transition flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Reopen Complaint
                    </button>
                  )}
                </div>

                {/* Assign Sub-form */}
                {showAssignForm && (
                  <form onSubmit={handleAssignSubmit} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Assignment & Priority Override
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Maintenance Team</label>
                        <select
                          value={selectedTeamId}
                          onChange={(e) => setSelectedTeamId(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          {maintenanceTeams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name} ({team.activeCases} active tasks)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Set Priority</label>
                        <select
                          value={selectedPriority}
                          onChange={(e) => setSelectedPriority(e.target.value as ComplaintPriority)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="critical">Critical (Immediate dispatch)</option>
                          <option value="high">High (24-hour SLA)</option>
                          <option value="medium">Medium (Routine queue)</option>
                          <option value="low">Low (Standard maintenance)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Assignment Note for Team</label>
                      <input
                        type="text"
                        value={assignNote}
                        onChange={(e) => setAssignNote(e.target.value)}
                        placeholder="e.g. Inspect isolation valve first, coordinate with lab assistant..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAssignForm(false)}
                        className="px-3 py-1.5 text-xs text-slate-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                      >
                        {actionLoading ? 'Saving...' : 'Confirm Assignment'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Duplicate Link Sub-form */}
                {showLinkForm && (
                  <form onSubmit={handleLinkSubmit} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Link Related / Duplicate Report
                    </h4>
                    <p className="text-xs text-slate-500">
                      Linking groups repeated complaints without erasing the reporter's record, while increasing this ticket's priority score.
                    </p>
                    <select
                      value={duplicateToLink}
                      onChange={(e) => setDuplicateToLink(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="">Select an open complaint to link...</option>
                      {otherComplaints.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.complaintNumber} — {c.title} ({c.campusArea})
                        </option>
                      ))}
                    </select>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowLinkForm(false)}
                        className="px-3 py-1.5 text-xs text-slate-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!duplicateToLink || actionLoading}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                      >
                        {actionLoading ? 'Linking...' : 'Link Duplicate Ticket'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* MAINTENANCE TEAM ACTIONS */}
            {isMaintenance && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {complaint.status === 'assigned' && (
                    <button
                      type="button"
                      onClick={handleStartWork}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                    >
                      {actionLoading ? 'Updating...' : 'Accept Assignment & Start Work'}
                    </button>
                  )}

                  {complaint.status === 'in_progress' && (
                    <button
                      type="button"
                      onClick={() => setShowResolveForm(!showResolveForm)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Record Resolution & Mark Resolved
                    </button>
                  )}
                </div>

                {/* Resolve Sub-form */}
                {showResolveForm && (
                  <form onSubmit={handleResolveSubmit} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Work Order Resolution Summary
                    </h4>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Detailed Resolution Work Completed <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                        placeholder="Describe root cause, actions taken, valve or wiring replaced..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Hours Spent</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={hoursSpent}
                          onChange={(e) => setHoursSpent(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Parts / Materials Replaced</label>
                        <input
                          type="text"
                          value={partsReplaced}
                          onChange={(e) => setPartsReplaced(e.target.value)}
                          placeholder="e.g. 1/2-inch brass ball valve, Teflon tape"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    {/* Optional Resolution Photo with Camera */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Completion Photo Proof (Optional)
                      </label>
                      {!resolutionPhoto ? (
                        <button
                          type="button"
                          onClick={() => setIsResolveCameraOpen(true)}
                          className="px-3 py-2 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Camera className="w-3.5 h-3.5 text-indigo-600" />
                          Snap Photo of Completed Repair with Camera
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-12 rounded border border-indigo-200 overflow-hidden bg-slate-100">
                            <img src={resolutionPhoto} alt="Fix evidence" className="w-full h-full object-cover" />
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsResolveCameraOpen(true)}
                            className="text-xs text-indigo-600 hover:underline font-medium"
                          >
                            Retake
                          </button>
                          <button
                            type="button"
                            onClick={() => setResolutionPhoto('')}
                            className="text-xs text-rose-600 hover:underline font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowResolveForm(false)}
                        className="px-3 py-1.5 text-xs text-slate-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                      >
                        {actionLoading ? 'Recording...' : 'Submit Resolution'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* STUDENT / FACULTY ACTIONS (Verify Feedback or Reopen) */}
            {(isReporter || isAdmin) && complaint.status === 'resolved' && (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <span className="leading-relaxed">The maintenance team marked this issue resolved. Please verify the fix:</span>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowFeedbackForm(true)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                    >
                      Verify & Close
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReopenForm(true)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                    >
                      Still Broken / Reopen
                    </button>
                  </div>
                </div>

                {/* Feedback Dialog */}
                {showFeedbackForm && (
                  <form onSubmit={handleVerifySubmit} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Resolution Feedback & Rating
                    </h4>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Satisfaction Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFeedbackRating(star)}
                            className="p-1 text-amber-400 hover:scale-110 transition"
                          >
                            <Star className={`w-6 h-6 ${star <= feedbackRating ? 'fill-amber-400' : 'text-slate-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Feedback Comment</label>
                      <textarea
                        rows={2}
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder="Was the problem completely fixed? Was the area cleaned up?"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowFeedbackForm(false)}
                        className="px-3 py-1.5 text-xs text-slate-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                      >
                        {actionLoading ? 'Closing...' : 'Close Ticket'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Reopen Form for any authorized staff or reporter */}
            {showReopenForm && (
              <form onSubmit={handleReopenSubmit} className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3 mt-3">
                <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                  Reopen Complaint Reason
                </h4>
                <textarea
                  required
                  rows={2}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="Explain why the issue is still unresolved or recurred..."
                  className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg text-xs"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReopenForm(false)}
                    className="px-3 py-1.5 text-xs text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
                  >
                    {actionLoading ? 'Reopening...' : 'Confirm Reopen Ticket'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Audit Trail Timeline */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Auditable Status & Assignment History
            </h3>

            {loadingHistory ? (
              <div className="p-4 text-center text-xs text-slate-400">Loading activity trail...</div>
            ) : history.length === 0 ? (
              <div className="p-3 text-xs text-slate-400 bg-slate-50 rounded-lg border border-slate-200">
                Created on {new Date(complaint.createdAt).toLocaleString()} by {complaint.reporterName}.
              </div>
            ) : (
              <div className="space-y-2.5 pl-2 border-l-2 border-slate-200">
                {history.map((act) => (
                  <div key={act.id} className="relative pl-4 text-xs">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white"></div>
                    <div className="flex items-center justify-between text-slate-500 text-[11px] mb-0.5">
                      <span className="font-semibold text-slate-800">
                        {act.performedByName} ({act.performedByRole})
                      </span>
                      <span>{new Date(act.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                    <p className="text-slate-600">{act.note}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Resolution Camera Capture Overlay */}
      {isResolveCameraOpen && (
        <CameraCapture
          onCapture={(photoDataUrl) => {
            setResolutionPhoto(photoDataUrl);
            setIsResolveCameraOpen(false);
          }}
          onClose={() => setIsResolveCameraOpen(false)}
        />
      )}
    </div>
  );
};
