import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, sanitizeForFirestore } from '../firebase/config';
import {
  Complaint,
  ComplaintActivity,
  ComplaintPriority,
  ComplaintSeverity,
  ComplaintStatus,
  UserRole,
  WaterIssueType
} from '../types';
import { calculateComplaintPriority, fetchAIPrioritization } from '../utils/prioritization';
import { createNotification } from './notificationService';

const CACHE_KEY = 'campusfix_local_complaints';

export function getLocalComplaintsCache(): Complaint[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }
  return [];
}

export function saveLocalComplaintsCache(list: Complaint[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(list));
  } catch (e) {
    // ignore
  }
}

export const SAMPLE_COMPLAINTS: Complaint[] = [
  {
    id: 'comp_water_hostel_101',
    complaintNumber: 'CF-2026-101',
    title: 'Yellow Discoloration & Chemical Smell in Drinking Water Cooler',
    description: 'The RO drinking water cooler on the 2nd floor corridor of Hostel Block B is dispensing cloudy yellow-tinted water with a strong chlorine/metallic odor. Multiple students reported stomach discomfort.',
    reporterId: 'demo_student_uid',
    reporterName: 'Aarav Nair',
    reporterEmail: 'aarav.student@campusfix.edu',
    reporterRole: 'student',
    campusArea: 'Hostels & Residential Halls',
    specificLocation: 'Hostel Block B, 2nd Floor, Wing C Water Cooler',
    category: 'Water Systems & Quality',
    severity: 'critical',
    priority: 'critical',
    priorityScore: 95,
    priorityReason: '🚨 SUSPECTED WATER CONTAMINATION — Immediate Emergency Review Required • High-density zone: Hostels & Residential Halls • Widespread campus impact (140+ people)',
    affectedPeople: 140,
    isWaterIssue: true,
    waterIssueType: 'suspected_contamination',
    suspectedContamination: true,
    status: 'assigned',
    assignedTeamId: 'team_water',
    assignedTeamName: 'Water Quality & Supply Team',
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=800&q=80',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    dueDate: new Date(Date.now() + 3600000 * 6).toISOString(),
    isOverdue: false,
    linkedComplaintIds: []
  },
  {
    id: 'comp_elec_lab_102',
    complaintNumber: 'CF-2026-102',
    title: 'Exposed High Voltage Wiring & Breaker Tripping in Lab 304',
    description: 'Main distribution panel in Organic Synthesis Lab sparks intermittently when high-draw centrifuges start up. Exposed terminal block poses severe shock hazard.',
    reporterId: 'demo_faculty_uid',
    reporterName: 'Dr. Shalini Ramanathan',
    reporterEmail: 'shalini.faculty@campusfix.edu',
    reporterRole: 'faculty',
    campusArea: 'Laboratories & Research Wings',
    specificLocation: 'Chemical Engineering Wing, Room LAB-304',
    category: 'Electrical Faults & Power',
    severity: 'critical',
    priority: 'critical',
    priorityScore: 88,
    priorityReason: 'Critical system hazard • High-density zone: Laboratories & Research Wings • Moderate group impact (45 people)',
    affectedPeople: 45,
    isWaterIssue: false,
    waterIssueType: 'none',
    suspectedContamination: false,
    status: 'in_progress',
    assignedTeamId: 'team_electrical',
    assignedTeamName: 'Electrical Works Crew',
    imageUrl: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=800&q=80',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    dueDate: new Date(Date.now() + 3600000 * 4).toISOString(),
    isOverdue: false,
    linkedComplaintIds: []
  },
  {
    id: 'comp_plumbing_washroom_103',
    complaintNumber: 'CF-2026-103',
    title: 'Major Flush Valve Leakage Flooding 1st Floor Restroom',
    description: 'Pressurized water valve stuck in open position in Academic Block 1 ground floor gents restroom. Water is overflowing into the main corridor.',
    reporterId: 'demo_student_uid',
    reporterName: 'Aarav Nair',
    reporterEmail: 'aarav.student@campusfix.edu',
    reporterRole: 'student',
    campusArea: 'Campus Washrooms & Restrooms',
    specificLocation: 'Academic Complex 1, Ground Floor West Wing',
    category: 'Plumbing & Drainage',
    severity: 'high',
    priority: 'high',
    priorityScore: 72,
    priorityReason: 'High severity issue • Water supply anomaly • High-density zone: Campus Washrooms & Restrooms',
    affectedPeople: 80,
    isWaterIssue: true,
    waterIssueType: 'leakage',
    suspectedContamination: false,
    status: 'under_review',
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    dueDate: new Date(Date.now() - 3600000 * 4).toISOString(),
    isOverdue: true,
    linkedComplaintIds: []
  },
  {
    id: 'comp_net_audi_104',
    complaintNumber: 'CF-2026-104',
    title: 'Auditorium Optical Fibre Switch Down Before Symposium',
    description: 'Core Gigabit switch in Main Auditorium rack offline. Guest presentation podium and live-streaming encoders cannot acquire IP address.',
    reporterId: 'demo_faculty_uid',
    reporterName: 'Dr. Shalini Ramanathan',
    reporterEmail: 'shalini.faculty@campusfix.edu',
    reporterRole: 'faculty',
    campusArea: 'Wi-Fi & Network Infrastructure',
    specificLocation: 'Central Auditorium, Rack AV-2',
    category: 'Network & IT Infrastructure',
    severity: 'high',
    priority: 'high',
    priorityScore: 68,
    priorityReason: 'High severity issue • Widespread campus impact (250+ people)',
    affectedPeople: 250,
    isWaterIssue: false,
    waterIssueType: 'none',
    suspectedContamination: false,
    status: 'assigned',
    assignedTeamId: 'team_it',
    assignedTeamName: 'Campus IT Operations',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    dueDate: new Date(Date.now() + 3600000 * 10).toISOString(),
    isOverdue: false,
    linkedComplaintIds: []
  },
  {
    id: 'comp_facilities_resolved_105',
    complaintNumber: 'CF-2026-105',
    title: 'Ceiling Fan Wobbling & Sparking in Classroom 102',
    description: 'Heavy ceiling fan shaking violently above row 3 in Lecture Hall 102. Screws loose on hanger bracket.',
    reporterId: 'demo_student_uid',
    reporterName: 'Aarav Nair',
    reporterEmail: 'aarav.student@campusfix.edu',
    reporterRole: 'student',
    campusArea: 'Classrooms & Lecture Theatres',
    specificLocation: 'Science Block, Lecture Hall 102',
    category: 'Equipment & Furniture',
    severity: 'medium',
    priority: 'medium',
    priorityScore: 42,
    priorityReason: 'Moderate severity • Localized team impact (35 people)',
    affectedPeople: 35,
    isWaterIssue: false,
    waterIssueType: 'none',
    suspectedContamination: false,
    status: 'resolved',
    assignedTeamId: 'team_facilities',
    assignedTeamName: 'General Facilities Maintenance',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    dueDate: new Date(Date.now() - 3600000 * 12).toISOString(),
    isOverdue: false,
    resolutionDetails: {
      resolvedBy: 'demo_maint_uid',
      resolvedByName: 'Vikram Joshi (Facilities Lead)',
      resolvedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      resolutionNote: 'Replaced defective hanger clamp assembly and re-torqued safety pin. Tested fan speed regulation on all steps. Operation smooth and silent.',
      hoursSpent: 1.5,
      partsReplaced: 'Clamp assembly M10, Cotter safety pin'
    },
    linkedComplaintIds: []
  }
];

export async function getComplaints(): Promise<Complaint[]> {
  const localCache = getLocalComplaintsCache();
  try {
    const snap = await getDocs(collection(db, 'complaints'));
    if (snap.empty) {
      for (const comp of SAMPLE_COMPLAINTS) {
        await setDoc(doc(db, 'complaints', comp.id), sanitizeForFirestore(comp));
      }
      saveLocalComplaintsCache(SAMPLE_COMPLAINTS);
      return SAMPLE_COMPLAINTS;
    }
    const firestoreList = snap.docs.map(d => ({ ...d.data(), id: d.id } as Complaint));
    
    // Merge any locally cached tickets seamlessly
    const map = new Map<string, Complaint>();
    for (const c of firestoreList) {
      map.set(c.id, c);
    }
    for (const c of localCache) {
      if (!map.has(c.id)) {
        map.set(c.id, c);
        // Sync back to Firestore in background
        setDoc(doc(db, 'complaints', c.id), sanitizeForFirestore(c)).catch(() => {});
      }
    }
    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    saveLocalComplaintsCache(merged);
    return merged;
  } catch (error) {
    console.warn('Error fetching complaints from Firestore, using local cache:', error);
    if (localCache.length > 0) {
      return localCache;
    }
    return SAMPLE_COMPLAINTS;
  }
}

export async function getComplaintById(complaintId: string): Promise<Complaint | null> {
  try {
    const snap = await getDoc(doc(db, 'complaints', complaintId));
    if (!snap.exists()) {
      const local = getLocalComplaintsCache().find(c => c.id === complaintId);
      return local || null;
    }
    return { ...snap.data(), id: snap.id } as Complaint;
  } catch (error) {
    console.warn('Error in getComplaintById, checking local cache:', error);
    const local = getLocalComplaintsCache().find(c => c.id === complaintId);
    return local || null;
  }
}

export async function createComplaint(
  data: Omit<Complaint, 'id' | 'complaintNumber' | 'priority' | 'priorityScore' | 'priorityReason' | 'status' | 'createdAt' | 'updatedAt'>,
  user: { id: string; fullName: string; role: UserRole }
): Promise<Complaint> {
  try {
    const id = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const complaintNumber = `CF-2026-${randomSuffix}`;

    const priorityCalc = await fetchAIPrioritization({
      title: data.title,
      description: data.description,
      category: data.category,
      campusArea: data.campusArea,
      specificLocation: data.specificLocation,
      severity: data.severity,
      affectedPeople: data.affectedPeople || 1,
      isWaterIssue: !!data.isWaterIssue,
      suspectedContamination: !!data.suspectedContamination,
    });

    const now = new Date().toISOString();
    // Calculate SLA due date based on priority
    const slaHours = priorityCalc.priority === 'critical' ? 6 : priorityCalc.priority === 'high' ? 24 : priorityCalc.priority === 'medium' ? 72 : 120;
    const dueDate = new Date(Date.now() + slaHours * 3600000).toISOString();

    const newComplaint: Complaint = {
      ...data,
      id,
      complaintNumber,
      priority: priorityCalc.priority,
      priorityScore: priorityCalc.score,
      priorityReason: priorityCalc.reason,
      status: 'submitted',
      createdAt: now,
      updatedAt: now,
      dueDate,
      isOverdue: false,
      linkedComplaintIds: []
    };

    if (data.imageUrl) {
      newComplaint.imageUrl = data.imageUrl;
    }

    // 1. Immediately cache locally so UI displays it instantaneously
    const currentCached = getLocalComplaintsCache();
    saveLocalComplaintsCache([newComplaint, ...currentCached.filter(c => c.id !== id)]);

    // 2. Persist to Firestore with full sanitization
    const sanitized = sanitizeForFirestore(newComplaint);
    await setDoc(doc(db, 'complaints', id), sanitized);

    // Add initial activity
    await logComplaintActivity({
      complaintId: id,
      action: 'TICKET_CREATED',
      newStatus: 'submitted',
      performedBy: user.id,
      performedByName: user.fullName,
      performedByRole: user.role,
      note: `Ticket created with initial priority ${priorityCalc.priority.toUpperCase()} (${priorityCalc.source || 'Engine'}).${priorityCalc.waterAlert ? ' [WATER SAFETY ALERT FLAGGED]' : ''}`
    });

    // Notify user
    await createNotification(
      user.id,
      `Complaint Registered: ${complaintNumber}`,
      `Your report "${newComplaint.title}" has been submitted successfully and assigned priority ${newComplaint.priority.toUpperCase()}.`,
      'complaint_update',
      id
    );

    // If suspected water contamination, alert admin & maintenance immediately
    if (data.suspectedContamination) {
      await createNotification(
        'all',
        `🚨 CRITICAL WATER ALERT: ${data.campusArea}`,
        `Suspected water contamination reported at ${data.specificLocation}. Immediate inspection required!`,
        'water_alert',
        id
      );
    }

    return newComplaint;
  } catch (error) {
    console.error('Error during createComplaint:', error);
    handleFirestoreError(error, OperationType.CREATE, 'complaints');
  }
}

export async function updateComplaintStatus(
  complaintId: string,
  newStatus: ComplaintStatus,
  user: { id: string; fullName: string; role: UserRole },
  note: string,
  extraUpdates: Partial<Complaint> = {}
): Promise<void> {
  try {
    const compRef = doc(db, 'complaints', complaintId);
    let prevStatus: ComplaintStatus = 'submitted';
    let currentNumber = complaintId;
    let reporterId: string | undefined;

    const existingSnap = await getDoc(compRef);
    if (existingSnap.exists()) {
      const current = existingSnap.data() as Complaint;
      prevStatus = current.status;
      currentNumber = current.complaintNumber;
      reporterId = current.reporterId;
    } else {
      const cached = getLocalComplaintsCache().find(c => c.id === complaintId);
      if (cached) {
        prevStatus = cached.status;
        currentNumber = cached.complaintNumber;
        reporterId = cached.reporterId;
      }
    }

    const updates: Partial<Complaint> = {
      ...extraUpdates,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };

    // Update local cache
    const currentCached = getLocalComplaintsCache();
    const updatedCache = currentCached.map(c => (c.id === complaintId ? { ...c, ...updates } : c));
    saveLocalComplaintsCache(updatedCache);

    // Update Firestore
    await updateDoc(compRef, sanitizeForFirestore(updates));

    // Log history
    await logComplaintActivity({
      complaintId,
      action: `STATUS_CHANGED_TO_${newStatus.toUpperCase()}`,
      previousStatus: prevStatus,
      newStatus,
      performedBy: user.id,
      performedByName: user.fullName,
      performedByRole: user.role,
      note: note || `Status transitioned from ${prevStatus} to ${newStatus}`
    });

    // Notify reporter
    if (reporterId) {
      await createNotification(
        reporterId,
        `Update on ${currentNumber}`,
        `Status updated to: ${newStatus.replace('_', ' ').toUpperCase()}${note ? ` — "${note}"` : ''}`,
        'status_change',
        complaintId
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `complaints/${complaintId}`);
  }
}

export async function assignComplaint(
  complaintId: string,
  teamId: string,
  teamName: string,
  priority: ComplaintPriority,
  adminUser: { id: string; fullName: string; role: UserRole },
  note?: string
): Promise<void> {
  try {
    const compRef = doc(db, 'complaints', complaintId);
    let prevStatus: ComplaintStatus = 'under_review';
    let complaintNumber = complaintId;
    let reporterId: string | undefined;

    const existingSnap = await getDoc(compRef);
    if (existingSnap.exists()) {
      const current = existingSnap.data() as Complaint;
      prevStatus = current.status;
      complaintNumber = current.complaintNumber;
      reporterId = current.reporterId;
    } else {
      const cached = getLocalComplaintsCache().find(c => c.id === complaintId);
      if (cached) {
        prevStatus = cached.status;
        complaintNumber = cached.complaintNumber;
        reporterId = cached.reporterId;
      }
    }

    const updates = {
      assignedTeamId: teamId,
      assignedTeamName: teamName,
      priority,
      status: 'assigned' as ComplaintStatus,
      updatedAt: new Date().toISOString()
    };

    // Update local cache
    const currentCached = getLocalComplaintsCache();
    saveLocalComplaintsCache(currentCached.map(c => c.id === complaintId ? { ...c, ...updates } : c));

    // Update Firestore
    await updateDoc(compRef, sanitizeForFirestore(updates));

    await logComplaintActivity({
      complaintId,
      action: 'TEAM_ASSIGNED',
      previousStatus: prevStatus,
      newStatus: 'assigned',
      performedBy: adminUser.id,
      performedByName: adminUser.fullName,
      performedByRole: adminUser.role,
      note: note || `Assigned to team ${teamName} with priority ${priority.toUpperCase()}`
    });

    if (reporterId) {
      await createNotification(
        reporterId,
        `Team Assigned: ${complaintNumber}`,
        `Your complaint has been assigned to ${teamName}. Work will commence shortly.`,
        'assignment',
        complaintId
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `complaints/${complaintId}`);
  }
}

export async function resolveComplaint(
  complaintId: string,
  maintUser: { id: string; fullName: string; role: UserRole },
  resolutionNote: string,
  hoursSpent?: number,
  partsReplaced?: string,
  resolutionImageUrl?: string
): Promise<void> {
  const resolutionDetails: Record<string, any> = {
    resolvedBy: maintUser.id,
    resolvedByName: maintUser.fullName,
    resolvedAt: new Date().toISOString(),
    resolutionNote,
    hoursSpent: hoursSpent || 1,
    partsReplaced: partsReplaced || 'N/A'
  };
  if (resolutionImageUrl) {
    resolutionDetails.resolutionImageUrl = resolutionImageUrl;
  }

  await updateComplaintStatus(
    complaintId,
    'resolved',
    maintUser,
    `Work completed by ${maintUser.fullName}: ${resolutionNote}`,
    { resolutionDetails: resolutionDetails as any }
  );
}

export async function verifyAndCloseComplaint(
  complaintId: string,
  user: { id: string; fullName: string; role: UserRole },
  rating: number,
  feedbackComment: string
): Promise<void> {
  const verificationDetails = {
    verifiedBy: user.id,
    verifiedAt: new Date().toISOString(),
    feedbackRating: rating,
    feedbackComment
  };

  await updateComplaintStatus(
    complaintId,
    'closed',
    user,
    `Verified & Closed by user with rating ${rating}/5: "${feedbackComment}"`,
    { verificationDetails }
  );
}

export async function reopenComplaint(
  complaintId: string,
  user: { id: string; fullName: string; role: UserRole },
  reason: string
): Promise<void> {
  const reopenDetails = {
    reopenedBy: user.id,
    reopenedByName: user.fullName,
    reopenedAt: new Date().toISOString(),
    reason
  };

  await updateComplaintStatus(
    complaintId,
    'reopened',
    user,
    `Complaint reopened: ${reason}`,
    { reopenDetails }
  );
}

export async function linkComplaintDuplicates(
  primaryId: string,
  duplicateId: string,
  adminUser: { id: string; fullName: string; role: UserRole }
): Promise<void> {
  try {
    const primaryRef = doc(db, 'complaints', primaryId);
    const dupRef = doc(db, 'complaints', duplicateId);

    const [primSnap, dupSnap] = await Promise.all([getDoc(primaryRef), getDoc(dupRef)]);
    let primData = primSnap.exists() ? (primSnap.data() as Complaint) : getLocalComplaintsCache().find(c => c.id === primaryId);
    let dupData = dupSnap.exists() ? (dupSnap.data() as Complaint) : getLocalComplaintsCache().find(c => c.id === duplicateId);

    if (!primData || !dupData) return;

    const existingLinks = primData.linkedComplaintIds || [];
    if (!existingLinks.includes(duplicateId)) {
      existingLinks.push(duplicateId);
    }

    // Re-evaluate priority of primary with repeated report boost
    const recalculated = calculateComplaintPriority({
      severity: primData.severity,
      affectedPeople: primData.affectedPeople + dupData.affectedPeople,
      campusArea: primData.campusArea,
      isWaterIssue: primData.isWaterIssue || dupData.isWaterIssue,
      suspectedContamination: primData.suspectedContamination || dupData.suspectedContamination,
      repeatedReportsCount: existingLinks.length + 1
    });

    const updates = {
      linkedComplaintIds: existingLinks,
      priority: recalculated.priority,
      priorityScore: recalculated.score,
      priorityReason: recalculated.reason,
      updatedAt: new Date().toISOString()
    };

    // Update local cache
    const currentCached = getLocalComplaintsCache();
    saveLocalComplaintsCache(currentCached.map(c => c.id === primaryId ? { ...c, ...updates } : c));

    // Update Firestore
    await updateDoc(primaryRef, sanitizeForFirestore(updates));

    await logComplaintActivity({
      complaintId: primaryId,
      action: 'COMPLAINTS_LINKED',
      performedBy: adminUser.id,
      performedByName: adminUser.fullName,
      performedByRole: adminUser.role,
      note: `Linked duplicate ticket ${dupData.complaintNumber}. Priority recalculated to ${recalculated.priority.toUpperCase()} (Score: ${recalculated.score}).`
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `complaints/${primaryId}`);
  }
}

export async function logComplaintActivity(activity: Omit<ComplaintActivity, 'id' | 'timestamp'>): Promise<void> {
  try {
    const id = `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const fullActivity: Record<string, any> = {
      ...activity,
      id,
      timestamp: new Date().toISOString()
    };
    await setDoc(doc(db, 'complaints', activity.complaintId, 'history', id), sanitizeForFirestore(fullActivity));
  } catch (error) {
    console.warn('Complaint activity logging error:', error);
  }
}

export async function getComplaintHistory(complaintId: string): Promise<ComplaintActivity[]> {
  try {
    const snap = await getDocs(collection(db, 'complaints', complaintId, 'history'));
    const items = snap.docs.map(d => ({ ...d.data(), id: d.id } as ComplaintActivity));
    return items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch (error) {
    console.warn('Could not fetch complaint history subcollection:', error);
    return [];
  }
}

/**
 * Seeds realistic campus complaints for project demonstration
 */
export async function seedDemoData(): Promise<void> {
  try {
    for (const comp of SAMPLE_COMPLAINTS) {
      await setDoc(doc(db, 'complaints', comp.id), comp);
      // Seed initial history
      await logComplaintActivity({
        complaintId: comp.id,
        action: 'INITIAL_LOG',
        newStatus: comp.status,
        performedBy: 'system',
        performedByName: 'CampusFix Demo Seeder',
        performedByRole: 'admin',
        note: `Sample complaint initialized with priority ${comp.priority.toUpperCase()}`
      });
    }
  } catch (error) {
    console.error('Seed demo data error:', error);
  }
}
