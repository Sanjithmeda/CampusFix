import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, sanitizeForFirestore } from '../firebase/config';
import { CampusArea, Category, MaintenanceTeam, UserProfile } from '../types';
import { DEMO_PROFILES } from '../context/AuthContext';

export const DEFAULT_AREAS: CampusArea[] = [
  { id: 'area_hostels', name: 'Hostels & Residential Halls', buildingCode: 'HST', description: 'Student and faculty residential quarters and common rooms', highPriorityZone: true, isActive: true },
  { id: 'area_labs', name: 'Laboratories & Research Wings', buildingCode: 'LAB', description: 'Engineering, chemistry, and science laboratory facilities', highPriorityZone: true, isActive: true },
  { id: 'area_washrooms', name: 'Campus Washrooms & Restrooms', buildingCode: 'WSH', description: 'Sanitary facilities across academic blocks', highPriorityZone: true, isActive: true },
  { id: 'area_classrooms', name: 'Classrooms & Lecture Theatres', buildingCode: 'CLS', description: 'Teaching spaces, auditoriums, and seminar halls', highPriorityZone: false, isActive: true },
  { id: 'area_network', name: 'Wi-Fi & Network Infrastructure', buildingCode: 'NET', description: 'Campus fibre hotspots, server nodes, and antennas', highPriorityZone: false, isActive: true },
  { id: 'area_dining', name: 'Cafeteria & Dining Halls', buildingCode: 'CAF', description: 'Central food court, kitchen hygiene, and dining halls', highPriorityZone: true, isActive: true },
  { id: 'area_transport', name: 'Bus & Transport Bay', buildingCode: 'TRN', description: 'Campus bus depot, shuttle stops, and fleet parking', highPriorityZone: false, isActive: true },
  { id: 'area_parking', name: 'Parking Complexes', buildingCode: 'PKG', description: 'Two-wheeler and four-wheeler campus parking lots', highPriorityZone: false, isActive: true },
  { id: 'area_roads', name: 'Internal Roads & Pathways', buildingCode: 'RDS', description: 'Pedestrian walks, street lighting, and internal avenues', highPriorityZone: false, isActive: true },
  { id: 'area_parks', name: 'Parks & Sports Grounds', buildingCode: 'PRK', description: 'Botanical garden, sports pavilion, and open recreation', highPriorityZone: false, isActive: true }
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_water', name: 'Water Systems & Quality', code: 'WTR', defaultTeam: 'Water Quality & Supply Team', description: 'Supply disruption, filtration, leakage, taste/odor issues', baseSeverity: 'high' },
  { id: 'cat_plumbing', name: 'Plumbing & Drainage', code: 'PLM', defaultTeam: 'Plumbing & Sanitation Division', description: 'Faucets, flush valves, blockage, burst pipelines', baseSeverity: 'medium' },
  { id: 'cat_electrical', name: 'Electrical Faults & Power', code: 'ELEC', defaultTeam: 'Electrical Works Crew', description: 'Power tripping, exposed wires, lighting failure, switchboards', baseSeverity: 'high' },
  { id: 'cat_cleanliness', name: 'Cleanliness & Sanitation', code: 'CLN', defaultTeam: 'Sanitation & Hygiene Services', description: 'Garbage accumulation, unhygienic washrooms, pest issues', baseSeverity: 'medium' },
  { id: 'cat_network', name: 'Network & IT Infrastructure', code: 'NET', defaultTeam: 'Campus IT Operations', description: 'Access point failure, LAN sockets, lab connectivity', baseSeverity: 'medium' },
  { id: 'cat_equipment', name: 'Equipment & Furniture', code: 'EQP', defaultTeam: 'General Facilities Maintenance', description: 'Broken desks, projectors, AC units, laboratory benches', baseSeverity: 'low' },
  { id: 'cat_transport', name: 'Transport & Fleet', code: 'TRN', defaultTeam: 'Transport Logistics Team', description: 'Shuttle delays, bus maintenance, stop shelters', baseSeverity: 'medium' },
  { id: 'cat_safety', name: 'Safety & Structural', code: 'SFT', defaultTeam: 'Campus Safety & Civil Works', description: 'Broken glass, staircase railings, fire equipment, road potholes', baseSeverity: 'critical' }
];

export const DEFAULT_TEAMS: MaintenanceTeam[] = [
  { id: 'team_water', name: 'Water Quality & Supply Team', specialty: 'Water Treatment & Pipelines', leadName: 'Er. Rajesh Varma', leadEmail: 'rajesh.water@campusfix.edu', contactPhone: '+91 98450 11234', memberCount: 6, activeCases: 3 },
  { id: 'team_electrical', name: 'Electrical Works Crew', specialty: 'High Voltage & Facility Power', leadName: 'K. Senthil Kumar', leadEmail: 'senthil.elec@campusfix.edu', contactPhone: '+91 98450 22345', memberCount: 8, activeCases: 5 },
  { id: 'team_plumbing', name: 'Plumbing & Sanitation Division', specialty: 'Drainage & Sanitary Fittings', leadName: 'M. Ramesh', leadEmail: 'ramesh.plumbing@campusfix.edu', contactPhone: '+91 98450 33456', memberCount: 7, activeCases: 4 },
  { id: 'team_it', name: 'Campus IT Operations', specialty: 'Fibre, Routers & Cabling', leadName: 'Priya Sharma', leadEmail: 'priya.it@campusfix.edu', contactPhone: '+91 98450 44567', memberCount: 5, activeCases: 2 },
  { id: 'team_facilities', name: 'General Facilities Maintenance', specialty: 'HVAC, Carpentry & Furniture', leadName: 'Vikram Joshi', leadEmail: 'vikram.facilities@campusfix.edu', contactPhone: '+91 98450 55678', memberCount: 9, activeCases: 6 },
  { id: 'team_civil', name: 'Campus Safety & Civil Works', specialty: 'Structural, Roads & Railings', leadName: 'Anil Deshmukh', leadEmail: 'anil.civil@campusfix.edu', contactPhone: '+91 98450 66789', memberCount: 6, activeCases: 2 }
];

export async function getCampusAreas(): Promise<CampusArea[]> {
  try {
    const snap = await getDocs(collection(db, 'campus_areas'));
    if (snap.empty) {
      for (const area of DEFAULT_AREAS) {
        await setDoc(doc(db, 'campus_areas', area.id), sanitizeForFirestore(area));
      }
      return DEFAULT_AREAS;
    }
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as CampusArea));
  } catch (error) {
    console.error('Error fetching campus areas from Firestore:', error);
    return DEFAULT_AREAS;
  }
}

export async function saveCampusArea(area: CampusArea): Promise<void> {
  try {
    await setDoc(doc(db, 'campus_areas', area.id), sanitizeForFirestore(area));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `campus_areas/${area.id}`);
  }
}

export async function deleteCampusArea(areaId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'campus_areas', areaId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `campus_areas/${areaId}`);
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const snap = await getDocs(collection(db, 'categories'));
    if (snap.empty) {
      for (const cat of DEFAULT_CATEGORIES) {
        await setDoc(doc(db, 'categories', cat.id), sanitizeForFirestore(cat));
      }
      return DEFAULT_CATEGORIES;
    }
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Category));
  } catch (error) {
    console.error('Error fetching categories from Firestore:', error);
    return DEFAULT_CATEGORIES;
  }
}

export async function saveCategory(cat: Category): Promise<void> {
  try {
    await setDoc(doc(db, 'categories', cat.id), sanitizeForFirestore(cat));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `categories/${cat.id}`);
  }
}

export async function deleteCategory(catId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'categories', catId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `categories/${catId}`);
  }
}

export async function getMaintenanceTeams(): Promise<MaintenanceTeam[]> {
  try {
    const snap = await getDocs(collection(db, 'maintenance_teams'));
    if (snap.empty) {
      for (const team of DEFAULT_TEAMS) {
        await setDoc(doc(db, 'maintenance_teams', team.id), sanitizeForFirestore(team));
      }
      return DEFAULT_TEAMS;
    }
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as MaintenanceTeam));
  } catch (error) {
    console.error('Error fetching maintenance teams from Firestore:', error);
    return DEFAULT_TEAMS;
  }
}

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    if (snap.empty) {
      return Object.values(DEMO_PROFILES);
    }
    const firestoreUsers = snap.docs.map(d => ({ ...d.data(), id: d.id } as UserProfile));
    // Ensure all demo users also appear for testing
    const map = new Map<string, UserProfile>();
    Object.values(DEMO_PROFILES).forEach(u => map.set(u.id, u));
    firestoreUsers.forEach(u => map.set(u.id, u));
    return Array.from(map.values());
  } catch (error) {
    console.warn('Error reading users collection, falling back to demo users:', error);
    return Object.values(DEMO_PROFILES);
  }
}

export async function updateUserAccountStatus(
  userId: string,
  newStatus: 'active' | 'pending_approval' | 'rejected' | 'suspended',
  newRole?: 'student' | 'faculty' | 'maintenance' | 'admin'
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    const updateData: Partial<UserProfile> = {
      status: newStatus,
      updatedAt: new Date().toISOString()
    };
    if (newRole) {
      updateData.role = newRole;
    }
    await updateDoc(userRef, sanitizeForFirestore(updateData));
  } catch (error) {
    console.warn(`Error updating user status in Firestore:`, error);
  }
}

/**
 * Seeds initial master data (areas, categories, teams) into Firestore if empty
 */
export async function initializeMasterData(): Promise<void> {
  try {
    const areasSnap = await getDocs(collection(db, 'campus_areas'));
    if (areasSnap.empty) {
      for (const area of DEFAULT_AREAS) {
        await setDoc(doc(db, 'campus_areas', area.id), sanitizeForFirestore(area));
      }
    }

    const catSnap = await getDocs(collection(db, 'categories'));
    if (catSnap.empty) {
      for (const cat of DEFAULT_CATEGORIES) {
        await setDoc(doc(db, 'categories', cat.id), sanitizeForFirestore(cat));
      }
    }

    const teamsSnap = await getDocs(collection(db, 'maintenance_teams'));
    if (teamsSnap.empty) {
      for (const team of DEFAULT_TEAMS) {
        await setDoc(doc(db, 'maintenance_teams', team.id), sanitizeForFirestore(team));
      }
    }
  } catch (err) {
    console.warn('Initial master data seeding note:', err);
  }
}

