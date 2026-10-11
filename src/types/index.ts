export type UserRole = 'student' | 'faculty' | 'maintenance' | 'admin';
export type AccountStatus = 'active' | 'pending_approval' | 'rejected' | 'suspended';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  idNumber: string; // Student ID / Faculty ID / Employee ID
  department: string;
  status: AccountStatus;
  createdAt: string;
  updatedAt?: string;
  phone?: string;
}

export type ComplaintSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ComplaintPriority = 'low' | 'medium' | 'high' | 'critical';

export type ComplaintStatus =
  | 'submitted'
  | 'under_review'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'reopened'
  | 'cancelled';

export type WaterIssueType =
  | 'unusual_taste'
  | 'colour'
  | 'smell'
  | 'dirty_water'
  | 'low_pressure'
  | 'no_supply'
  | 'leakage'
  | 'suspected_contamination'
  | 'other'
  | 'none';

export interface ResolutionDetails {
  resolvedBy: string;
  resolvedByName: string;
  resolvedAt: string;
  resolutionNote: string;
  hoursSpent?: number;
  partsReplaced?: string;
  resolutionImageUrl?: string;
}

export interface VerificationDetails {
  verifiedBy: string;
  verifiedAt: string;
  feedbackRating?: number; // 1 to 5
  feedbackComment?: string;
}

export interface ReopenDetails {
  reopenedBy: string;
  reopenedByName: string;
  reopenedAt: string;
  reason: string;
}

export interface Complaint {
  id: string;
  complaintNumber: string; // e.g. "CF-2026-104"
  title: string;
  description: string;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  reporterRole: UserRole;
  campusArea: string; // e.g., "Hostels", "Classrooms", "Laboratories", etc.
  specificLocation: string; // e.g., "Block B, Room 204"
  category: string; // e.g., "Plumbing", "Electrical", "Water Systems", etc.
  severity: ComplaintSeverity;
  priority: ComplaintPriority;
  priorityScore: number; // 0-100 calculated score
  priorityReason: string;
  affectedPeople: number;
  isWaterIssue: boolean;
  waterIssueType?: WaterIssueType;
  suspectedContamination: boolean;
  status: ComplaintStatus;
  assignedTeamId?: string;
  assignedTeamName?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  isOverdue?: boolean;
  linkedComplaintIds?: string[];
  resolutionDetails?: ResolutionDetails;
  verificationDetails?: VerificationDetails;
  reopenDetails?: ReopenDetails;
  cancellationReason?: string;
}

export interface ComplaintActivity {
  id: string;
  complaintId: string;
  action: string;
  previousStatus?: ComplaintStatus;
  newStatus?: ComplaintStatus;
  performedBy: string;
  performedByName: string;
  performedByRole: UserRole;
  note: string;
  timestamp: string;
}

export type AnnouncementStatus = 'planned' | 'in_progress' | 'completed' | 'delayed';

export interface Announcement {
  id: string;
  title: string;
  description: string;
  affectedArea: string;
  startTime: string;
  expectedCompletion: string;
  status: AnnouncementStatus;
  alternateRoute?: string;
  publishedBy: string;
  publishedByName: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CampusArea {
  id: string;
  name: string;
  buildingCode: string;
  description: string;
  highPriorityZone: boolean;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  defaultTeam: string;
  description: string;
  baseSeverity: ComplaintSeverity;
}

export interface MaintenanceTeam {
  id: string;
  name: string;
  specialty: string;
  leadName: string;
  leadEmail: string;
  contactPhone: string;
  memberCount: number;
  activeCases: number;
}

export interface NotificationItem {
  id: string;
  userId: string; // UID or "all"
  title: string;
  message: string;
  type: 'complaint_update' | 'assignment' | 'water_alert' | 'announcement' | 'status_change';
  relatedComplaintId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface PriorityFactors {
  severity: ComplaintSeverity;
  affectedPeople: number;
  campusArea: string;
  isHighPriorityZone?: boolean;
  isWaterIssue: boolean;
  suspectedContamination: boolean;
  repeatedReportsCount?: number;
  hoursElapsed?: number;
}

export type AIProvider = 'openai' | 'gemini' | 'heuristics' | 'auto';

export interface AISettingsConfig {
  provider: AIProvider;
  openaiApiKey?: string;
  openaiBaseUrl?: string;
  openaiModel?: string;
}

