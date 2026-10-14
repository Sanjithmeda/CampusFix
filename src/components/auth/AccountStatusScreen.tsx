import React, { useState } from 'react';
import { Clock, ShieldAlert, XCircle, RefreshCw, LogOut, Mail, Building } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CampusFixLogo } from '../common/CampusFixLogo';

export const AccountStatusScreen: React.FC = () => {
  const { userProfile, logout, refreshUserProfile } = useAuth();
  const [checking, setChecking] = useState(false);

  const handleRefresh = async () => {
    setChecking(true);
    await refreshUserProfile();
    setTimeout(() => setChecking(false), 800);
  };

  const status = userProfile?.status || 'pending_approval';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-3 sm:p-4 w-full max-w-full overflow-x-hidden">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xs p-5 sm:p-8 border border-slate-200 text-center relative overflow-hidden">
        {/* Top Decorative accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-600"></div>

        {/* Brand Logo */}
        <div className="flex justify-center mb-6">
          <CampusFixLogo variant="horizontal" size="md" />
        </div>

        {status === 'pending_approval' && (
          <>
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Account Under Approval</h2>
            <div className="inline-block px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-xs font-semibold mb-4">
              ROLE: {userProfile?.role.toUpperCase()} · STATUS: PENDING VERIFICATION
            </div>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Your registration as <strong className="text-slate-800">{userProfile?.fullName}</strong> ({userProfile?.idNumber}) in <span className="font-medium text-slate-800">{userProfile?.department}</span> requires institutional verification by the Main Administrator before operational duties can be accessed.
            </p>
          </>
        )}

        {status === 'suspended' && (
          <>
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl border border-rose-200 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Account Suspended</h2>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Your campus maintenance portal credentials have been temporarily suspended by the administration. Please contact the Estate Directorate to resolve this block.
            </p>
          </>
        )}

        {status === 'rejected' && (
          <>
            <div className="w-14 h-14 bg-slate-100 text-slate-600 rounded-2xl border border-slate-200 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Registration Rejected</h2>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Your account request was not verified against institutional enrollment records.
            </p>
          </>
        )}

        {/* Verification Info Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs text-slate-600 mb-6 space-y-2">
          <div className="flex items-center gap-2 font-medium text-slate-800">
            <Building className="w-4 h-4 text-indigo-600" />
            Estate Operations & Facilities Office
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400" />
            estate.director@campusfix.edu · Ext. 4022
          </div>
          <p className="text-slate-500 pt-1 border-t border-slate-200">
            Tip for reviewers: Sign in as Main Admin (<code className="text-indigo-700 font-mono">admin@campusfix.edu</code>) to approve pending accounts in the User Approvals tab.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleRefresh}
            disabled={checking}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking...' : 'Check Approval Status'}
          </button>
          <button
            onClick={() => logout()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
