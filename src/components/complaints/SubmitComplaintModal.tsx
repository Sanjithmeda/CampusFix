import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  AlertTriangle,
  Droplets,
  Camera,
  MapPin,
  Tag,
  Users,
  Info,
  CheckCircle2,
  Sparkles,
  Upload,
  Zap
} from 'lucide-react';
import { CampusArea, Category, ComplaintSeverity, WaterIssueType } from '../../types';
import { calculateComplaintPriority, getWaterIssueLabel } from '../../utils/prioritization';
import { createComplaint } from '../../services/complaintService';
import { useAuth } from '../../context/AuthContext';
import { PriorityBadge } from '../common/StatusBadge';
import { CameraCapture } from '../common/CameraCapture';
import { CampusFixIcon } from '../common/CampusFixLogo';

interface SubmitComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  campusAreas: CampusArea[];
  categories: Category[];
  onComplaintCreated: () => void;
  onOpenAISettings?: () => void;
}

export const SubmitComplaintModal: React.FC<SubmitComplaintModalProps> = ({
  isOpen,
  onClose,
  campusAreas,
  categories,
  onComplaintCreated,
  onOpenAISettings
}) => {
  const { userProfile } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [campusArea, setCampusArea] = useState('');
  const [specificLocation, setSpecificLocation] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState<ComplaintSeverity>('medium');
  const [affectedPeople, setAffectedPeople] = useState<number>(10);
  const [imageUrl, setImageUrl] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Water issue module
  const [isWaterIssue, setIsWaterIssue] = useState(false);
  const [waterIssueType, setWaterIssueType] = useState<WaterIssueType>('none');
  const [suspectedContamination, setSuspectedContamination] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeviceFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDimension = 1024;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          setImageUrl(compressed);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Set defaults when areas & categories load
  useEffect(() => {
    if (campusAreas.length > 0 && !campusArea) {
      setCampusArea(campusAreas[0].name);
    }
  }, [campusAreas, campusArea]);

  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0].name);
    }
  }, [categories, category]);

  // Priority preview
  const priorityPreview = calculateComplaintPriority({
    severity,
    affectedPeople,
    campusArea: campusArea || 'Campus',
    isWaterIssue,
    suspectedContamination
  });

  const handleCategoryChange = (catName: string) => {
    setCategory(catName);
    const lower = catName.toLowerCase();
    if (lower.includes('water') || lower.includes('plumbing') || lower.includes('sanitation')) {
      setIsWaterIssue(true);
      if (waterIssueType === 'none') {
        setWaterIssueType('leakage');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim() || !campusArea || !specificLocation.trim()) {
      setError('Please provide the summary, specific location, and incident description.');
      return;
    }

    try {
      setLoading(true);

      const reporterName = userProfile?.fullName || 'Campus User';
      const reporterEmail = userProfile?.email || 'user@campusfix.edu';
      const reporterRole = userProfile?.role || 'student';
      const reporterId = userProfile?.id || 'demo_user';

      await createComplaint(
        {
          title: title.trim(),
          description: description.trim(),
          campusArea,
          specificLocation: specificLocation.trim(),
          category,
          severity,
          affectedPeople,
          isWaterIssue,
          waterIssueType: isWaterIssue ? waterIssueType : 'none',
          suspectedContamination,
          imageUrl: imageUrl.trim() || undefined,
          reporterId,
          reporterName,
          reporterEmail,
          reporterRole
        },
        { id: reporterId, fullName: reporterName, role: reporterRole }
      );

      // Reset form
      setTitle('');
      setDescription('');
      setSpecificLocation('');
      setAffectedPeople(10);
      setSeverity('medium');
      setImageUrl('');
      setIsWaterIssue(false);
      setWaterIssueType('none');
      setSuspectedContamination(false);

      onComplaintCreated();
      onClose();
    } catch (err: any) {
      console.error('Complaint submission error:', err);
      setError(err.message || 'Unable to submit maintenance ticket. Please verify inputs.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between text-slate-900">
          <div className="flex items-center gap-3">
            <CampusFixIcon sizePx={32} />
            <div>
              <h2 className="text-base font-bold text-slate-900">Report Campus Facility Complaint</h2>
              <p className="text-[11px] text-slate-500">
                Log equipment damage, water leak, electrical fault, or sanitary maintenance issue
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Priority Preview Banner */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">Priority Engine:</span>
            <PriorityBadge priority={priorityPreview.priority} score={priorityPreview.score} />
            {onOpenAISettings && (
              <button
                type="button"
                onClick={onOpenAISettings}
                className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-0.5 rounded-md border border-indigo-200/80 transition"
                title="Configure OpenAI / Gemini AI Prioritization Engine"
              >
                <Zap className="w-3 h-3 text-indigo-600" />
                AI Engine
              </button>
            )}
          </div>
          <div className="text-slate-500 text-[11px] truncate max-w-md">
            <strong>Factor Rationale:</strong> {priorityPreview.reason}
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-slate-800">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Issue Summary / Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Water leak under sink in Lab 302, Hostel tap rusty water..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Area & Specific Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Campus Facility / Area <span className="text-rose-500">*</span>
              </label>
              <select
                value={campusArea}
                onChange={(e) => setCampusArea(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {campusAreas.map((area) => (
                  <option key={area.id} value={area.name}>
                    {area.name} ({area.buildingCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Precise Location <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={specificLocation}
                onChange={(e) => setSpecificLocation(e.target.value)}
                placeholder="e.g. Block C, 3rd Floor, Room 314"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Category & Severity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Observed Severity <span className="text-rose-500">*</span>
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as ComplaintSeverity)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="low">Low — Routine cosmetic or minor inconvenience</option>
                <option value="medium">Medium — Impairs comfort or normal workflow</option>
                <option value="high">High — Significant outage or equipment damage risk</option>
                <option value="critical">Critical — Immediate life-safety, health, or hazard</option>
              </select>
            </div>
          </div>

          {/* Affected People Count */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Estimated People Affected
              </label>
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                {affectedPeople} occupants / users
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="250"
              value={affectedPeople}
              onChange={(e) => setAffectedPeople(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>1 person</span>
              <span>50 occupants</span>
              <span>150+ (Wing/Hostel)</span>
              <span>250+ (Auditorium/Campus)</span>
            </div>
          </div>

          {/* Special Water Safety Module */}
          <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-sky-700" />
                <span className="text-xs font-bold text-sky-950 uppercase tracking-wider">
                  Water Quality & Potability Section
                </span>
              </div>
              <label className="flex items-center gap-2 text-xs text-sky-900 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={isWaterIssue}
                  onChange={(e) => setIsWaterIssue(e.target.checked)}
                  className="rounded border-sky-300 text-indigo-600 focus:ring-indigo-500"
                />
                This is a water-related report
              </label>
            </div>

            {isWaterIssue && (
              <div className="space-y-3 pt-2 border-t border-sky-200">
                <div>
                  <label className="block text-xs font-semibold text-sky-900 mb-1">
                    Specific Water Anomaly Observed:
                  </label>
                  <select
                    value={waterIssueType}
                    onChange={(e) => setWaterIssueType(e.target.value as WaterIssueType)}
                    className="w-full px-3 py-2 bg-white border border-sky-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="unusual_taste">Unusual Chemical or Metallic Taste</option>
                    <option value="colour">Abnormal Color / Discoloration (Brown/Cloudy)</option>
                    <option value="smell">Foul or Pungent Smell / Rotten Odor</option>
                    <option value="dirty_water">Visible Dirt / Suspended Sediments</option>
                    <option value="low_pressure">Abnormally Low Water Pressure</option>
                    <option value="no_supply">Complete Water Supply Cutoff</option>
                    <option value="leakage">Severe Pipe Burst or Continuous Leak</option>
                    <option value="suspected_contamination">Suspected Chemical/Biological Contamination</option>
                    <option value="other">Other Water Supply Defect</option>
                  </select>
                </div>

                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={suspectedContamination}
                      onChange={(e) => setSuspectedContamination(e.target.checked)}
                      className="mt-0.5 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                    />
                    <div className="text-xs text-rose-900 leading-tight">
                      <strong className="text-rose-700 font-bold">Flag as Suspected Water Contamination (Emergency Alert):</strong> Check this if anyone suffered illness, or if water is visibly toxic or chemically contaminated.
                    </div>
                  </label>
                </div>

                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Statutory Disclaimer:</strong> CampusFix does not independently test or certify water safety. Checking this flag automatically notifies the Water Quality Team and Campus Health Centre for human inspection.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened, any visible danger, sounds, odor, or recurrence..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Photo Attachment with Camera Access */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Photo Evidence (Camera / Upload)
              </label>
              <span className="text-[11px] text-slate-400">Optional but recommended</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleDeviceFileSelect}
            />

            {!imageUrl ? (
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Direct Camera Shutter Button */}
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition"
                  >
                    <Camera className="w-4 h-4" />
                    Take Photo with Camera
                  </button>

                  {/* Upload from Gallery / Storage */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 shadow-xs transition"
                  >
                    <Upload className="w-4 h-4 text-slate-500" />
                    Upload from Device
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Or paste image web link..."
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl('https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=800&q=80')}
                    className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] rounded-lg font-medium transition whitespace-nowrap"
                  >
                    Demo Sample
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                    <img src={imageUrl} alt="Attached incident photo" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Photo Evidence Attached
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">Ready to submit with complaint ticket</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition flex items-center gap-1"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Retake
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
                    title="Remove attached photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition disabled:opacity-60 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting Report...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Submit Maintenance Complaint
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Direct Camera Capture Modal Overlay */}
      {isCameraOpen && (
        <CameraCapture
          onCapture={(photoDataUrl) => {
            setImageUrl(photoDataUrl);
            setIsCameraOpen(false);
          }}
          onClose={() => setIsCameraOpen(false)}
        />
      )}
    </div>
  );
};
