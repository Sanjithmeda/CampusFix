import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, sanitizeForFirestore } from '../firebase/config';
import { NotificationItem } from '../types';

export async function getUserNotifications(userId: string): Promise<NotificationItem[]> {
  try {
    const snap = await getDocs(collection(db, 'notifications'));
    const items = snap.docs
      .map(d => ({ ...d.data(), id: d.id } as NotificationItem))
      .filter(n => n.userId === userId || n.userId === 'all');
    
    // Sort descending by createdAt
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.warn('Could not fetch notifications from Firestore:', error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      isRead: true
    });
  } catch (error) {
    console.warn('Error marking notification as read:', error);
  }
}

export async function markAllNotificationsAsRead(notifications: NotificationItem[]): Promise<void> {
  try {
    for (const notif of notifications) {
      if (!notif.isRead) {
        await updateDoc(doc(db, 'notifications', notif.id), { isRead: true });
      }
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'complaint_update' | 'assignment' | 'water_alert' | 'announcement' | 'status_change',
  relatedComplaintId?: string
): Promise<void> {
  try {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const notification: Record<string, any> = {
      id,
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    if (relatedComplaintId) {
      notification.relatedComplaintId = relatedComplaintId;
    }
    await setDoc(doc(db, 'notifications', id), sanitizeForFirestore(notification));
  } catch (error) {
    console.warn('Could not save notification to Firestore:', error);
  }
}

