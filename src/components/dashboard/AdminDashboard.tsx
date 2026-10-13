import React, { useState, useEffect } from 'react';
import {
  Shield,
  FolderTree,
  Users,
  MapPin,
  BarChart3,
  Droplets,
  Radio,
  AlertTriangle,
  Clock,
  CheckCircle2,
  PlusCircle,
  Search,
  Filter,
  Download,
  Database,
  Trash2,
  Check,
  XCircle,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Tag,
  Building
} from 'lucide-react';
import {
  Announcement,
  CampusArea,
  Category,
  Complaint,
  MaintenanceTeam,
  UserProfile,
  UserRole
} from '../../types';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import { WaterSafetyBadge } from '../common/WaterSafetyBadge';
import { CampusFixIcon } from '../common/CampusFixLogo';
import {
  getAllUsers,
  updateUserAccountStatus,
  saveCampusArea,
  deleteCampusArea,
  saveCategory,
  deleteCategory
} from '../../services/masterDataService';
import { seedDemoData } from '../../services/complaintService';

interface AdminDashboardProps {
  activeTab: string;
  complaints: Complaint[];
  announcements: Announcement[];
  campusAreas: CampusArea[];
  categories: Category[];
  maintenanceTeams: MaintenanceTeam[];
  onSelectComplaint: (complaint: Complaint) => void;
  onOpenSubmitModal: () => void;
  onOpenAnnouncementModal: () => void;
  onRefreshData: () => void;
  onOpenAISettings?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  activeTab,
  complaints,
  announcements,
  campusAreas,
  categories,
  maintenanceTeams,
  onSelectComplaint,
  onOpenSubmitModal,
  onOpenAnnouncementModal,
  onRefreshData,
  onOpenAISettings
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Master Data Add Forms
  const [showAddArea, setShowAddArea] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaCode, setNewAreaCode] = useState('');
  const [newAreaDesc, setNewAreaDesc] = useState('');

  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatCode, setNewCatCode] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Fetch users when on users tab
  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'overview') {
      const fetchU = async () => {
        setLoadingUsers(true);
        const uList = await getAllUsers();
        setUsers(uList);
        setLoadingUsers(false);
      };
      fetchU();
    }
  }, [activeTab]);

  // Derived Dynamic KPI Figures calculated from live database records
  const totalCount = complaints.length;
  const pendingTriageCount = complaints.filter(c => c.status === 'submitted' || c.status === 'under_review').length;
  const criticalCount = complaints.filter(c => c.priority === 'critical' || c.severity === 'critical').length;
  const overdueCount = complaints.filter(c => c.isOverdue || (c.dueDate && new Date(c.dueDate) < new Date() && c.status !== 'closed' && c.status !== 'resolved')).length;
  const resolvedCount = complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length;
  const waterEmergencyCount = complaints.filter(c => c.suspectedContamination).length;
  const pendingApprovals = users.filter(u => u.status === 'pending_approval');

  // Filter complaints
  const filteredComplaints = complaints.filter(c => {
    if (activeTab === 'water_alerts' && !c.isWaterIssue && !c.suspectedContamination) {
      return false;
    }
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.complaintNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.specificLocation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesArea = areaFilter === 'all' || c.campusArea === areaFilter;
    const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesArea && matchesPriority;
  });

  const handleApproveUser = async (userId: string, role: UserRole) => {
    await updateUserAccountStatus(userId, 'active', role);
    const updated = await getAllUsers();
    setUsers(updated);
  };

  const handleSuspendUser = async (userId: string) => {
    await updateUserAccountStatus(userId, 'suspended');
    const updated = await getAllUsers();
    setUsers(updated);
  };

  const handleSeedDemo = async () => {
    setSeeding(true);
    await seedDemoData();
    setSeeding(false);
    setSeedSuccess(true);
    onRefreshData();
    setTimeout(() => setSeedSuccess(false), 3000);
  };

  const handleExportCSV = () => {
    const headers = ['ComplaintNumber', 'Title', 'CampusArea', 'Location', 'Category', 'Severity', 'Priority', 'Status', 'Reporter', 'Created'];
    const rows = complaints.map(c => [
      c.complaintNumber,
      `"${c.title.replace(/"/g, '""')}"`,
      `"${c.campusArea}"`,
      `"${c.specificLocation}"`,
      c.category,
      c.severity,
      c.priority,
      c.status,
      `"${c.reporterName}"`,
      c.createdAt
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `campusfix_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaName || !newAreaCode) return;
    const id = `area_${Date.now()}`;
    await saveCampusArea({
      id,
      name: newAreaName.trim(),
      buildingCode: newAreaCode.trim().toUpperCase(),
      description: newAreaDesc.trim() || 'Campus facility area',
      highPriorityZone: false,
      isActive: true
    });
    setNewAreaName('');
    setNewAreaCode('');
    setNewAreaDesc('');
    setShowAddArea(false);
    onRefreshData();
  };

  const handleCreateCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatCode) return;
    const id = `cat_${Date.now()}`;
    await saveCategory({
      id,
      name: newCatName.trim(),
      code: newCatCode.trim().toUpperCase(),
      defaultTeam: maintenanceTeams[0]?.name || 'Facilities Maintenance',
      description: newCatDesc.trim() || 'Maintenance classification',
      baseSeverity: 'medium'
    });
    setNewCatName('');
    setNewCatCode('');
    setNewCatDesc('');
    setShowAddCat(false);
    onRefreshData();
  };

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-slate-800/90 border border-slate-700/80 shadow-xs flex items-center justify-center shrink-0">
              <CampusFixIcon sizePx={38} />
            </div>
            <div>
              <div className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/30 mb-2 uppercase tracking-wider">
                CENTRAL ADMINISTRATION · GOVERNANCE DESK
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Estate Directorate Executive Operations
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1">
                Multi-factor campus maintenance prioritization, work order triage, duplicate linking, and staff oversight.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {onOpenAISettings && (
              <button
                onClick={onOpenAISettings}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-xs"
                title="Configure OpenAI API / Gemini Prioritization Engine"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                AI Prioritization Engine
              </button>
            )}

            <button
              onClick={handleSeedDemo}
              disabled={seeding}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition shadow-xs"
              title="Populates realistic sample complaints across campus for demonstration"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              {seeding ? 'Seeding...' : seedSuccess ? 'Demo Data Seeded!' : 'Seed Demo Data'}
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* 6 Real-time Calculated KPI Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Total Complaints</span>
            <span className="text-xl font-bold text-white mt-0.5 block">{totalCount}</span>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Pending Triage</span>
            <span className="text-xl font-bold text-sky-400 mt-0.5 block">{pendingTriageCount}</span>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Critical Priority</span>
            <span className="text-xl font-bold text-rose-400 mt-0.5 block">{criticalCount}</span>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Overdue Cases</span>
            <span className="text-xl font-bold text-amber-400 mt-0.5 block">{overdueCount}</span>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Resolved & Closed</span>
            <span className="text-xl font-bold text-emerald-400 mt-0.5 block">{resolvedCount}</span>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/60">
            <span className="text-[10px] text-rose-300 block font-semibold uppercase tracking-wider flex items-center gap-1">
              <Droplets className="w-3 h-3 text-rose-400" />
              Water Alerts
            </span>
            <span className="text-xl font-bold text-rose-400 mt-0.5 block">{waterEmergencyCount}</span>
          </div>
        </div>
      </div>

      {/* VIEW: USER APPROVALS & ROLES */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">User Account Verification & Role Approvals</h2>
              <p className="text-xs text-slate-500">
                Authorise new maintenance personnel and review active student & faculty credentials
              </p>
            </div>
          </div>

          {/* Pending Approvals Section */}
          {pendingApprovals.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <Clock className="w-4 h-4 text-amber-600" />
                Registrations Awaiting Approval ({pendingApprovals.length})
              </div>
              <div className="space-y-2">
                {pendingApprovals.map((u) => (
                  <div
                    key={u.id}
                    className="bg-white p-3.5 rounded-xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{u.fullName}</div>
                      <div className="text-slate-500">
                        Email: {u.email} · ID: <strong>{u.idNumber}</strong> · Dept: {u.department}
                      </div>
                      <div className="text-amber-800 font-semibold text-[11px] mt-0.5">
                        Requested Role: {u.role.toUpperCase()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveUser(u.id, u.role)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1 transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve & Activate
                      </button>
                      <button
                        onClick={() => handleSuspendUser(u.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold border border-rose-200 transition"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Users Directory */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 font-bold text-xs text-slate-700 uppercase tracking-wider">
              Enrolled Campus Users ({users.length})
            </div>
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {users.map((u) => (
                <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{u.fullName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                        {u.role}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        u.status === 'active' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {u.status}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {u.email} · ID: {u.idNumber} · Section: {u.department}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {u.status === 'active' ? (
                      <button
                        onClick={() => handleSuspendUser(u.id)}
                        className="text-slate-500 hover:text-rose-600 font-medium"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApproveUser(u.id, u.role)}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        Activate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: CAMPUS AREAS & CATEGORIES */}
      {activeTab === 'master_data' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Areas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                Campus Areas & Zones ({campusAreas.length})
              </h2>
              <button
                onClick={() => setShowAddArea(!showAddArea)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                + Add Area
              </button>
            </div>

            {showAddArea && (
              <form onSubmit={handleCreateArea} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
                <div>
                  <label className="font-medium text-slate-700">Area Name</label>
                  <input
                    type="text"
                    required
                    value={newAreaName}
                    onChange={(e) => setNewAreaName(e.target.value)}
                    placeholder="e.g. Sports Complex, North Quad"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700">Building Code</label>
                  <input
                    type="text"
                    required
                    value={newAreaCode}
                    onChange={(e) => setNewAreaCode(e.target.value)}
                    placeholder="e.g. SPT"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAddArea(false)} className="px-3 py-1 text-slate-600">
                    Cancel
                  </button>
                  <button type="submit" className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold">
                    Save
                  </button>
                </div>
              </form>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {campusAreas.map((area) => (
                <div key={area.id} className="p-3.5 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{area.name}</span>
                    <span className="ml-2 font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                      {area.buildingCode}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">{area.description}</p>
                  </div>
                  <button
                    onClick={() => deleteCampusArea(area.id)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                    title="Delete area"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-600" />
                Issue Categories ({categories.length})
              </h2>
              <button
                onClick={() => setShowAddCat(!showAddCat)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                + Add Category
              </button>
            </div>

            {showAddCat && (
              <form onSubmit={handleCreateCat} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
                <div>
                  <label className="font-medium text-slate-700">Category Name</label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Elevators & Lifts"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700">Category Code</label>
                  <input
                    type="text"
                    required
                    value={newCatCode}
                    onChange={(e) => setNewCatCode(e.target.value)}
                    placeholder="e.g. LFT"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAddCat(false)} className="px-3 py-1 text-slate-600">
                    Cancel
                  </button>
                  <button type="submit" className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold">
                    Save
                  </button>
                </div>
              </form>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {categories.map((cat) => (
                <div key={cat.id} className="p-3.5 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{cat.name}</span>
                    <span className="ml-2 font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                      {cat.code}
                    </span>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Default: <strong>{cat.defaultTeam}</strong>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                    title="Delete category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: ANALYTICS & REPORTS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Campus Maintenance Intelligence & Workload Analytics</h2>
              <p className="text-xs text-slate-500">Live breakdown of incidents by category, campus zone, and operational dispatch team</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* By Category */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">Incidents by Category</h3>
              <div className="space-y-2.5 text-xs">
                {categories.map((cat) => {
                  const count = complaints.filter(c => c.category === cat.name).length;
                  const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                  return (
                    <div key={cat.id} className="space-y-1">
                      <div className="flex justify-between font-medium">
                        <span className="truncate max-w-[180px]">{cat.name}</span>
                        <span className="text-slate-500">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* By Priority */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">Priority Tiers</h3>
              <div className="space-y-3 text-xs pt-2">
                {[
                  { label: 'Critical Priority', key: 'critical', color: 'bg-rose-500', count: criticalCount },
                  { label: 'High Priority', key: 'high', color: 'bg-amber-500', count: complaints.filter(c => c.priority === 'high').length },
                  { label: 'Medium Priority', key: 'medium', color: 'bg-blue-500', count: complaints.filter(c => c.priority === 'medium').length },
                  { label: 'Low Priority', key: 'low', color: 'bg-slate-400', count: complaints.filter(c => c.priority === 'low').length }
                ].map((tier) => {
                  const pct = totalCount > 0 ? Math.round((tier.count / totalCount) * 100) : 0;
                  return (
                    <div key={tier.key} className="space-y-1">
                      <div className="flex justify-between font-medium">
                        <span>{tier.label}</span>
                        <span className="text-slate-500">{tier.count} tickets ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className={`${tier.color} h-full rounded-full transition-all`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Maintenance Team Workload */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">Team Workload Active Tasks</h3>
              <div className="space-y-2 text-xs">
                {maintenanceTeams.map((team) => {
                  const count = complaints.filter(c => c.assignedTeamId === team.id && c.status !== 'closed' && c.status !== 'resolved').length;
                  return (
                    <div key={team.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{team.name}</div>
                        <div className="text-[11px] text-slate-500">Lead: {team.leadName}</div>
                      </div>
                      <span className="font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60 text-xs">
                        {count} active
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: COMPLAINT QUEUE / TRIAGE / WATER ALERTS */}
      {(activeTab === 'overview' || activeTab === 'complaints' || activeTab === 'water_alerts') && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter queue by ID, summary, reporter, location..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
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
                  <option value="closed">Closed</option>
                  <option value="reopened">Reopened</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <select
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Campus Areas</option>
                  {campusAreas.map((a) => (
                    <option key={a.id} value={a.name}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table / Cards */}
          {filteredComplaints.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-xs">
              <FolderTree className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 text-sm">No complaints in this queue view</h3>
              <p className="text-xs text-slate-500 mt-1">Adjust search parameters or filters above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredComplaints.map((comp) => (
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
                          WATER CONTAMINATION ALERT
                        </span>
                      )}
                      {comp.linkedComplaintIds && comp.linkedComplaintIds.length > 0 && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-semibold rounded-md border border-amber-200">
                          {comp.linkedComplaintIds.length} Linked Duplicates
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
                      <span>Reporter: <strong>{comp.reporterName}</strong></span>
                      <span>Assigned: <strong>{comp.assignedTeamName || 'Unassigned'}</strong></span>
                      <span>Impact: <strong>{comp.affectedPeople} occupants</strong></span>
                    </div>

                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 truncate">
                      <strong className="text-slate-800">Priority logic:</strong> {comp.priorityReason}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-right text-xs">
                      <div className="text-[10px] text-slate-400">Created</div>
                      <div className="text-slate-700 font-medium">
                        {new Date(comp.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectComplaint(comp);
                      }}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                    >
                      Review & Triage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: ANNOUNCEMENTS BROADCASTS */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Campus Maintenance Activity Broadcasts</h2>
              <p className="text-xs text-slate-500">Publish, modify, or archive campus-wide maintenance notices</p>
            </div>
            <button
              onClick={onOpenAnnouncementModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5"
            >
              <Radio className="w-3.5 h-3.5" />
              Publish Broadcast
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
                  <div className="p-2 bg-sky-50 text-sky-900 text-xs rounded-lg border border-sky-200">
                    <strong>Contingency:</strong> {ann.alternateRoute}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
