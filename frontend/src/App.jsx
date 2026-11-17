import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import KpiStats from './components/KpiStats';
import ComplianceTable from './components/ComplianceTable';
import LookupModal from './components/LookupModal';
import AuthModal from './components/AuthModal';
import Toast from './components/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { vehicleApi, adminApi } from './services/api';
import { Crown, ShieldAlert, Sparkles, UserCheck, LogIn } from 'lucide-react';

function DashboardContent() {
  const { 
    user, 
    token, 
    isAdmin, 
    isAuthenticated, 
    authModalOpen, 
    closeAuthModal, 
    openLoginModal,
    openRegisterModal
  } = useAuth();

  const [vehicles, setVehicles] = useState([]);
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time ticking clock interval (updates every 1000ms)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (toastObj) => {
    setToast(toastObj);
  };

  // Fetch vehicles based on authenticated role
  const loadFleetData = useCallback(async () => {
    if (isAdmin) {
      const data = await adminApi.getAllVehicles();
      setVehicles(data);
    } else {
      const data = await vehicleApi.getMyVehicles(user);
      setVehicles(data);
    }
  }, [isAdmin, user]);

  useEffect(() => {
    loadFleetData();
  }, [loadFleetData, token]);

  // Callback when a new vehicle is enrolled
  const handleVehicleEnrolled = (newVehicle) => {
    setVehicles((prev) => {
      const existingIdx = prev.findIndex(
        (v) => v.registrationNumber.toUpperCase() === newVehicle.registrationNumber.toUpperCase()
      );
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = newVehicle;
        return copy;
      }
      return [newVehicle, ...prev];
    });
  };

  // Callback when a compliance record validity is updated/renewed
  const handleRecordUpdated = (vehicleId, recordId, newExpiryDate) => {
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id !== vehicleId) return v;
        const updatedRecords = v.complianceRecords.map((r) => {
          if (r.id !== recordId) return r;
          const expiry = new Date(newExpiryDate);
          const today = new Date();
          const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
          return {
            ...r,
            expiryDate: newExpiryDate,
            daysUntilExpiry: diffDays,
            isExpired: diffDays < 0
          };
        });
        return { ...v, complianceRecords: updatedRecords };
      })
    );
  };

  // Admin delete vehicle handler
  const handleDeleteVehicle = async (vehicleId, plate) => {
    try {
      await adminApi.deleteVehicle(vehicleId);
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
      showToast({
        type: 'success',
        title: 'Vehicle Removed',
        message: `Vehicle ${plate} has been successfully deleted from fleet records.`
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete vehicle record.'
      });
    }
  };

  // Audit trigger handler (Administrative fleet-wide or regular)
  const handleTriggerAudit = async () => {
    setIsAuditing(true);
    try {
      if (isAdmin) {
        const res = await adminApi.runDailyAudit();
        showToast({
          type: 'success',
          title: 'System-Wide Audit Completed',
          message: `Administrative cron audit scanned all active fleet records. Dispatched ${res.dispatchedReminders || 'scheduled'} alerts.`
        });
      } else {
        await vehicleApi.triggerReminder(null, 'FLEET-ALL');
        showToast({
          type: 'success',
          title: 'Daily Audit Executed',
          message: 'Scanned your garage for 30d, 7d, and today expirations. Dispatched reminders.'
        });
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Audit Trigger Failed',
        message: 'Could not contact scheduler engine.'
      });
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Top Navigation */}
      <Navbar
        onOpenLookup={() => setIsLookupOpen(true)}
        onTriggerAudit={handleTriggerAudit}
        isAuditing={isAuditing}
      />

      {/* Main Dashboard Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Unauthenticated Quick Banner */}
        {!isAuthenticated && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-700 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Secure JWT & Role-Based Access Control Active</h3>
                <p className="text-xs text-white/80">
                  Sign in as Admin (System-Wide Fleet Management) or Regular User (Personal Vehicle Garage).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openLoginModal}
                className="px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold shadow-xs hover:bg-slate-100 transition-colors flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Demo Accounts</span>
              </button>
            </div>
          </div>
        )}

        {/* Page Title & Live Real-Time Ticking Clock */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {isAdmin ? 'System-Wide Fleet Compliance' : 'Vehicle Compliance Dashboard'}
              </h2>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-100 text-purple-900 border border-purple-200">
                  <Crown className="w-3.5 h-3.5 text-purple-600" />
                  Admin Privilege
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {isAdmin
                ? 'Centralized administration view: Monitor compliance across all registered owners and trigger bulk audits.'
                : 'Personal fleet garage: Real-time monitor for Insurance, Pollution Under Control (PUC), and Road Tax.'}
            </p>
          </div>

          {/* Real-time Ticking Clock Display */}
          <div className="inline-flex items-center gap-2.5 bg-white border border-slate-200/90 px-3.5 py-2 rounded-xl shadow-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="text-xs text-slate-600 font-medium flex items-center gap-2">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Live Time:</span>
              <span className="font-mono-plate font-bold text-slate-900 text-sm tracking-wide">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600 text-xs">
                {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <KpiStats vehicles={vehicles} />

        {/* Live Filterable Compliance Audit Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800">
                {isAdmin ? 'System-Wide Active Fleet Ledger' : 'My Active Vehicle Records'}
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}
              </span>
            </div>
            <span className="text-xs text-slate-400">
              {isAdmin ? 'Full RBAC Access Enabled' : 'Scoped to User Account'}
            </span>
          </div>

          <ComplianceTable
            vehicles={vehicles}
            onRecordUpdated={handleRecordUpdated}
            onDeleteVehicle={handleDeleteVehicle}
            showToast={showToast}
          />
        </div>
      </main>

      {/* Modal: Live Lookup & Enroll */}
      <LookupModal
        isOpen={isLookupOpen}
        onClose={() => setIsLookupOpen(false)}
        onEnrolled={handleVehicleEnrolled}
        showToast={showToast}
      />

      {/* Modal: JWT Authentication & Demo Login */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={closeAuthModal}
        showToast={showToast}
      />

      {/* Floating UI Feedback Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
