import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, sanitizeForFirestore } from '../firebase/config';
import { Announcement } from '../types';
import { createNotification } from './notificationService';

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_water_shutdown_1',
    title: 'Scheduled Water Tank Cleaning & Pipeline Sanitization',
    description: 'Periodic chemical flush, sediment cleanout and pipeline sterilization across Hostels Block A, B & Dining Hall.',
    affectedArea: 'Hostels & Residential Halls',
    startTime: '2026-10-12T08:00:00Z',
    expectedCompletion: '2026-10-12T16:00:00Z',
    status: 'planned',
    alternateRoute: 'Temporary potable water tankers positioned near Hostel Courtyard C and Sports Ground.',
    publishedBy: 'admin_sys',
    publishedByName: 'Chief Engineer Office',
    createdAt: new Date().toISOString()
  },
  {
    id: 'ann_power_substation_2',
    title: 'Electrical Substation 2 Circuit Breaker Replacement',
    description: 'Upgrading 11kV feeder switches. Backup generators will operate critical lab refrigeration.',
    affectedArea: 'Laboratories & Research Wings',
    startTime: '2026-10-11T14:00:00Z',
    expectedCompletion: '2026-10-11T18:00:00Z',
    status: 'planned',
    alternateRoute: 'Uninterrupted power supplies (UPS) active for Server Room 101.',
    publishedBy: 'admin_sys',
    publishedByName: 'Electrical Operations Wing',
    createdAt: new Date().toISOString()
  },
  {
    id: 'ann_road_resurfacing_3',
    title: 'North Gate Avenue Bitumen Resurfacing',
    description: 'Pothole patchworks and road surface re-carpeting following recent heavy monsoon runoff.',
    affectedArea: 'Internal Roads & Pathways',
    startTime: '2026-10-10T06:00:00Z',
    expectedCompletion: '2026-10-10T18:00:00Z',
    status: 'in_progress',
    alternateRoute: 'Diverted via Academic Ring Road; East Gate open 24/7 for shuttle transport.',
    publishedBy: 'admin_sys',
    publishedByName: 'Civil Infrastructure Works',
    createdAt: new Date().toISOString()
  }
];

export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const snap = await getDocs(collection(db, 'announcements'));
    if (snap.empty) {
      for (const ann of INITIAL_ANNOUNCEMENTS) {
        await setDoc(doc(db, 'announcements', ann.id), sanitizeForFirestore(ann));
      }
      return INITIAL_ANNOUNCEMENTS;
    }
    const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as Announcement));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching announcements from Firestore:', error);
    return INITIAL_ANNOUNCEMENTS;
  }
}

export async function createAnnouncement(announcement: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> {
  try {
    const id = `ann_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newAnn: Announcement = {
      ...announcement,
      id,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'announcements', id), sanitizeForFirestore(newAnn));

    // Notify all campus users
    await createNotification(
      'all',
      `Campus Maintenance Notice: ${newAnn.title}`,
      `Affecting: ${newAnn.affectedArea}. Status: ${newAnn.status.toUpperCase()}.`,
      'announcement'
    );

    return newAnn;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'announcements');
  }
}

export async function updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<void> {
  try {
    await updateDoc(doc(db, 'announcements', id), sanitizeForFirestore({
      ...updates,
      updatedAt: new Date().toISOString()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `announcements/${id}`);
  }
}

export async function deleteAnnouncement(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'announcements', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `announcements/${id}`);
  }
}

