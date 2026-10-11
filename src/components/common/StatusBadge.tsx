import React from 'react';
import { ComplaintPriority, ComplaintStatus } from '../../types';

interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs font-medium';

  switch (status) {
    case 'submitted':
      return (
        <span className={`inline-flex items-center rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 font-medium ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-slate-400"></span>
          Submitted
        </span>
      );
    case 'under_review':
      return (
        <span className={`inline-flex items-center rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 font-medium ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-blue-500"></span>
          Under Review
        </span>
      );
    case 'assigned':
      return (
        <span className={`inline-flex items-center rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-medium ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-indigo-500"></span>
          Assigned
        </span>
      );
    case 'in_progress':
      return (
        <span className={`inline-flex items-center rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 font-medium ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-500"></span>
          In Progress
        </span>
      );
    case 'resolved':
      return (
        <span className={`inline-flex items-center rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-medium ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500"></span>
          Resolved
        </span>
      );
    case 'closed':
      return (
        <span className={`inline-flex items-center rounded-md bg-slate-100 text-slate-800 border border-slate-300 font-medium ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-600"></span>
          Verified & Closed
        </span>
      );
    case 'reopened':
      return (
        <span className={`inline-flex items-center rounded-md bg-rose-50 text-rose-700 border border-rose-200/80 font-medium ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-500"></span>
          Reopened
        </span>
      );
    case 'cancelled':
      return (
        <span className={`inline-flex items-center rounded-md bg-slate-100 text-slate-500 border border-slate-200 font-medium ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-slate-400"></span>
          Cancelled
        </span>
      );
    default:
      return null;
  }
};

interface PriorityBadgeProps {
  priority: ComplaintPriority;
  score?: number;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, score, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs font-semibold';

  switch (priority) {
    case 'critical':
      return (
        <span className={`inline-flex items-center rounded-md bg-rose-50 text-rose-800 border border-rose-200 font-semibold tracking-wide ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-600"></span>
          CRITICAL {score ? `· ${score}` : ''}
        </span>
      );
    case 'high':
      return (
        <span className={`inline-flex items-center rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-semibold tracking-wide ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-600"></span>
          HIGH {score ? `· ${score}` : ''}
        </span>
      );
    case 'medium':
      return (
        <span className={`inline-flex items-center rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-semibold tracking-wide ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-blue-500"></span>
          MEDIUM {score ? `· ${score}` : ''}
        </span>
      );
    case 'low':
    default:
      return (
        <span className={`inline-flex items-center rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-semibold tracking-wide ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-slate-400"></span>
          LOW {score ? `· ${score}` : ''}
        </span>
      );
  }
};
