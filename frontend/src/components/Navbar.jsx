import React from 'react';
import { 
  ShieldCheck, 
  Plus, 
  RefreshCw, 
  User, 
  ShieldAlert, 
  LogOut, 
  LogIn, 
  Crown 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onOpenLookup, onTriggerAudit, isAuditing }) {
  const { 
    user, 
    isAuthenticated, 
    isAdmin, 
    logout, 
    openLoginModal, 
    openRegisterModal 
  } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                Smart Vehicle Compliance
              </h1>
              {isAdmin ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-900 border border-purple-200 shadow-2xs">
                  <Crown className="w-3 h-3 text-purple-600" />
                  Admin Console
                </span>
              ) : isAuthenticated ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-800">
                  User Garage
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                  Fleet Monitor
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              {isAdmin 
                ? 'System-Wide Fleet Records & Audit Management' 
                : 'Continuous Motor Vehicles Act Audit & Auto-Reminders'}
            </p>
          </div>
        </div>

        {/* Actions & User State */}
        <div className="flex items-center gap-3">
          {/* Admin Run Audit Button */}
          {isAdmin && (
            <button
              onClick={onTriggerAudit}
              disabled={isAuditing}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors disabled:opacity-60"
              title="Execute administrative system-wide compliance audit"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>{isAuditing ? 'Auditing Fleet...' : 'Run Fleet Audit (8 AM)'}</span>
            </button>
          )}

          {/* Lookup & Enroll Button */}
          <button
            onClick={onOpenLookup}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs shadow-brand-500/30 transition-all hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Lookup & Enroll</span>
          </button>

          {/* User Profile & Auth Controls */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700">
                  {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {user.username}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    {user.email}
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <button
                onClick={openLoginModal}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
