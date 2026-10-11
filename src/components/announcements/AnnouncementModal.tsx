import React, { useState } from 'react';
import { X, Radio, Calendar, MapPin, Navigation, CheckCircle2 } from 'lucide-react';
import { Announcement, AnnouncementStatus, CampusArea } from '../../types';
import { createAnnouncement } from '../../services/announcementService';
import { useAuth } from '../../context/AuthContext';

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  campusAreas: CampusArea[];
  onCreated: () => void;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  isOpen,
  onClose,
  campusAreas,
  onCreated
}) => {
  const { userProfile } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [affectedArea, setAffectedArea] = useState(campusAreas[0]?.name || 'Hostels & Residential Halls');
  const [startTime, setStartTime] = useState(new Date().toISOString().slice(0, 16));
  const [expectedCompletion, setExpectedCompletion] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );
  const [status, setStatus] = useState<AnnouncementStatus>('planned');
  const [alternateRoute, setAlternateRoute] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !affectedArea) {
      setError('Please fill in title, description and affected area.');
      return;
    }
    if (!userProfile) return;

    try {
      setLoading(true);
      setError(null);
      await createAnnouncement({
        title: title.trim(),
        description: description.trim(),
        affectedArea,
        startTime,
        expectedCompletion,
        status,
        alternateRoute: alternateRoute.trim() || undefined,
        publishedBy: userProfile.id,
        publishedByName: userProfile.fullName
      });

      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to publish announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 text-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-200/80">
              <Radio className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Publish Maintenance Activity Broadcast</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-800">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Broadcast Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Scheduled Water Tank Cleaning, Electrical Feeder Upgrade..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Affected Campus Area <span className="text-rose-500">*</span>
              </label>
              <select
                value={affectedArea}
                onChange={(e) => setAffectedArea(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {campusAreas.map((area) => (
                  <option key={area.id} value={area.name}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Current Activity Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AnnouncementStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="planned">Planned (Advance Notice)</option>
                <option value="in_progress">In Progress (Work Underway)</option>
                <option value="delayed">Delayed / Rescheduled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Expected Completion
              </label>
              <input
                type="datetime-local"
                value={expectedCompletion}
                onChange={(e) => setExpectedCompletion(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description & Campus Impact <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline what work is taking place, expected utility disruptions, and duration..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Alternate Route / Contingency Location (Optional)
            </label>
            <input
              type="text"
              value={alternateRoute}
              onChange={(e) => setAlternateRoute(e.target.value)}
              placeholder="e.g. Pedestrian detour via Academic Block 2, Water tankers at Hostel Courtyard"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              {loading ? 'Publishing...' : 'Publish to Campus'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
