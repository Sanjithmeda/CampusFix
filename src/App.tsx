/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { AccountStatusScreen } from './components/auth/AccountStatusScreen';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { StudentFacultyDashboard } from './components/dashboard/StudentFacultyDashboard';
import { MaintenanceDashboard } from './components/dashboard/MaintenanceDashboard';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { SubmitComplaintModal } from './components/complaints/SubmitComplaintModal';
import { ComplaintDetailModal } from './components/complaints/ComplaintDetailModal';
import { AnnouncementModal } from './components/announcements/AnnouncementModal';
import { AISettingsModal } from './components/common/AISettingsModal';
import { CampusFixLogo } from './components/common/CampusFixLogo';
import {
  CampusArea,
  Category,
  Complaint,
  MaintenanceTeam,
  Announcement
} from './types';
import { getComplaints, getComplaintById } from './services/complaintService';
import { getAnnouncements } from './services/announcementService';
import {
  getCampusAreas,
  getCategories,
  getMaintenanceTeams,
  initializeMasterData
} from './services/masterDataService';

const MainAppContent: React.FC = () => {
  const { currentUser, userProfile, loading, isDemoMode } = useAuth();

  // Navigation & View State
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Data State
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [campusAreas, setCampusAreas] = useState<CampusArea[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [maintenanceTeams, setMaintenanceTeams] = useState<MaintenanceTeam[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [isAISettingsModalOpen, setIsAISettingsModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Set default tab when role changes
  useEffect(() => {
    if (userProfile?.role === 'admin') {
      setActiveTab('overview');
    } else if (userProfile?.role === 'maintenance') {
      setActiveTab('work_orders');
    } else {
      setActiveTab('my_reports');
    }
  }, [userProfile?.role]);

  // Load core application data
  const loadAppData = async () => {
    setLoadingData(true);
    try {
      await initializeMasterData();
      const [comps, anns, areas, cats, teams] = await Promise.all([
        getComplaints(),
        getAnnouncements(),
        getCampusAreas(),
        getCategories(),
        getMaintenanceTeams()
      ]);
      setComplaints(comps);
      setAnnouncements(anns);
      setCampusAreas(areas);
      setCategories(cats);
      setMaintenanceTeams(teams);
    } catch (err) {
      console.warn('Error fetching application state:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadAppData();
    const interval = setInterval(loadAppData, 30000); // Polling update every 30s
    return () => clearInterval(interval);
  }, []);

  const handleSelectComplaintById = async (id: string) => {
    const existing = complaints.find(c => c.id === id);
    if (existing) {
      setSelectedComplaint(existing);
    } else {
      const fetched = await getComplaintById(id);
      if (fetched) setSelectedComplaint(fetched);
    }
  };

  // 1. Initial Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-900 p-4">
        <CampusFixLogo variant="stacked" size="xl" className="animate-pulse mb-3" />
        <p className="text-xs text-slate-500 font-medium animate-pulse">Initializing campus maintenance workspace...</p>
      </div>
    );
  }

  // 2. Unauthenticated View (Login / Register)
  if (!currentUser && !userProfile && !isDemoMode) {
    if (authView === 'register') {
      return <RegisterPage onNavigateToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onNavigateToRegister={() => setAuthView('register')} />;
  }

  // 3. Account Status Check (Approval Gate / Suspended Gate)
  if (userProfile && userProfile.status !== 'active') {
    return <AccountStatusScreen />;
  }

  const role = userProfile?.role || 'student';
  const waterAlertCount = complaints.filter(c => c.suspectedContamination).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        onSelectComplaint={handleSelectComplaintById}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenAISettings={() => setIsAISettingsModalOpen(true)}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          userRole={role}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
          waterAlertCount={waterAlertCount}
        />

        {/* Dashboard Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {role === 'admin' && (
            <AdminDashboard
              activeTab={activeTab}
              complaints={complaints}
              announcements={announcements}
              campusAreas={campusAreas}
              categories={categories}
              maintenanceTeams={maintenanceTeams}
              onSelectComplaint={setSelectedComplaint}
              onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
              onOpenAnnouncementModal={() => setIsAnnouncementModalOpen(true)}
              onRefreshData={loadAppData}
              onOpenAISettings={() => setIsAISettingsModalOpen(true)}
            />
          )}

          {role === 'maintenance' && (
            <MaintenanceDashboard
              activeTab={activeTab}
              complaints={complaints}
              announcements={announcements}
              maintenanceTeams={maintenanceTeams}
              onSelectComplaint={setSelectedComplaint}
              onOpenAnnouncementModal={() => setIsAnnouncementModalOpen(true)}
            />
          )}

          {(role === 'student' || role === 'faculty') && (
            <StudentFacultyDashboard
              activeTab={activeTab}
              complaints={complaints}
              announcements={announcements}
              onSelectComplaint={setSelectedComplaint}
              onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* MODALS */}
      {/* 1. Submit Complaint Modal */}
      <SubmitComplaintModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        campusAreas={campusAreas}
        categories={categories}
        onComplaintCreated={() => {
          loadAppData();
        }}
        onOpenAISettings={() => setIsAISettingsModalOpen(true)}
      />

      {/* 2. Complaint Detail & Lifecycle Modal */}
      <ComplaintDetailModal
        complaint={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        onUpdated={() => {
          loadAppData();
        }}
        maintenanceTeams={maintenanceTeams}
        allComplaints={complaints}
      />

      {/* 3. Maintenance Announcement Broadcast Modal */}
      <AnnouncementModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
        campusAreas={campusAreas}
        onCreated={() => {
          loadAppData();
        }}
      />

      {/* 4. AI Engine Configuration Modal */}
      <AISettingsModal
        isOpen={isAISettingsModalOpen}
        onClose={() => setIsAISettingsModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
