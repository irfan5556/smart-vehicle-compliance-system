import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Send, 
  RefreshCw, 
  Calendar, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  FileText,
  Clock,
  Trash2,
  User as UserIcon,
  Crown
} from 'lucide-react';
import { vehicleApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ComplianceTable({ vehicles, onRecordUpdated, onDeleteVehicle, showToast }) {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sendingId, setSendingId] = useState(null);

  // Flatten vehicle records into individual compliance rows for tabular audit
  const rows = useMemo(() => {
    const list = [];
    vehicles.forEach((vehicle) => {
      (vehicle.complianceRecords || []).forEach((record) => {
        const isExp = record.isExpired || record.daysUntilExpiry < 0;
        const isSoon = !isExp && record.daysUntilExpiry <= 30;
        
        let status = 'VALID';
        if (isExp) status = 'EXPIRED';
        else if (isSoon) status = 'EXPIRING_SOON';

        list.push({
          vehicleId: vehicle.id,
          registrationNumber: vehicle.registrationNumber,
          makeAndModel: vehicle.makeAndModel,
          vehicleType: vehicle.vehicleType,
          userEmail: vehicle.userEmail,
          username: vehicle.username,
          recordId: record.id,
          complianceType: record.complianceType,
          certificateNumber: record.certificateNumber,
          provider: record.provider,
          expiryDate: record.expiryDate,
          daysUntilExpiry: record.daysUntilExpiry,
          status
        });
      });
    });
    return list;
  }, [vehicles]);

  // Filter rows based on search input and selected filters
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch = row.registrationNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase().replace(/\s+/g, '')) ||
        row.makeAndModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.username && row.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (row.userEmail && row.userEmail.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = 
        statusFilter === 'ALL' || row.status === statusFilter;

      const matchesType = 
        typeFilter === 'ALL' || row.complianceType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [rows, searchTerm, statusFilter, typeFilter]);

  // Handle manual "Send Reminder Now" trigger
  const handleSendReminder = async (row) => {
    setSendingId(row.recordId);
    try {
      const res = await vehicleApi.triggerReminder(row.recordId, row.registrationNumber);
      showToast({
        type: 'success',
        title: 'Dispatch Triggered Successfully',
        message: `Automated ${row.complianceType} renewal alert dispatched to ${row.userEmail || 'owner'}.`
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Dispatch Failed',
        message: err.message || 'Unable to contact mail/SMS dispatcher.'
      });
    } finally {
      setSendingId(null);
    }
  };

  // Quick manual simulated renewal
  const handleRenewPrompt = (row) => {
    const newDate = new Date();
    newDate.setFullYear(newDate.getFullYear() + 1);
    const dateStr = newDate.toISOString().split('T')[0];

    onRecordUpdated(row.vehicleId, row.recordId, dateStr);

    showToast({
      type: 'success',
      title: 'Compliance Renewed',
      message: `${row.registrationNumber} ${row.complianceType} renewed until ${dateStr}.`
    });
  };

  const handleDeletePrompt = (row) => {
    if (window.confirm(`Are you sure you want to remove vehicle ${row.registrationNumber} (${row.makeAndModel}) from the fleet?`)) {
      onDeleteVehicle(row.vehicleId, row.registrationNumber);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Table Control Bar */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isAdmin ? "Search Plate, Model, or Owner..." : "Search by Plate or Model..."}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Filter:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="EXPIRING_SOON">Expiring Soon (≤ 30d)</option>
            <option value="EXPIRED">Expired</option>
            <option value="VALID">Valid</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="ALL">All Documents</option>
            <option value="INSURANCE">Insurance</option>
            <option value="PUC">PUC (Pollution)</option>
            <option value="ROAD_TAX">Road Tax</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <th className="py-3.5 px-4 sm:px-6">Vehicle No</th>
              <th className="py-3.5 px-4">Make & Model</th>
              {isAdmin && (
                <th className="py-3.5 px-4 text-purple-900 bg-purple-50/40">
                  <div className="flex items-center gap-1">
                    <Crown className="w-3 h-3 text-purple-600" />
                    <span>Owner (Fleet Scoped)</span>
                  </div>
                </th>
              )}
              <th className="py-3.5 px-4">Document Type</th>
              <th className="py-3.5 px-4">Expiry Date</th>
              <th className="py-3.5 px-4">Days Remaining</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="text-center py-12 text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="font-semibold">No compliance records found</p>
                  <p className="text-[11px] mt-0.5">Try adjusting your search query or status filter.</p>
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr 
                  key={`${row.vehicleId}-${row.recordId}`}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Plate */}
                  <td className="py-4 px-4 sm:px-6">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-400/90 text-slate-950 font-mono-plate font-extrabold text-xs rounded border border-slate-800 shadow-2xs">
                      <span className="text-[9px] text-slate-700 uppercase font-sans font-bold">IND</span>
                      <span>{row.registrationNumber}</span>
                    </div>
                  </td>

                  {/* Model */}
                  <td className="py-4 px-4">
                    <div className="font-semibold text-slate-900">{row.makeAndModel}</div>
                    <div className="text-[11px] text-slate-400">{row.vehicleType}</div>
                  </td>

                  {/* Owner (Admin View only) */}
                  {isAdmin && (
                    <td className="py-4 px-4 bg-purple-50/20">
                      <div className="font-bold text-slate-800 flex items-center gap-1">
                        <UserIcon className="w-3 h-3 text-purple-600" />
                        <span>{row.username || 'System User'}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {row.userEmail}
                      </div>
                    </td>
                  )}

                  {/* Doc Type Badge */}
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md font-bold text-[11px] ${
                      row.complianceType === 'INSURANCE'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : row.complianceType === 'PUC'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-purple-100 text-purple-800 border border-purple-200'
                    }`}>
                      {row.complianceType}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[140px]" title={row.provider}>
                      {row.provider}
                    </div>
                  </td>

                  {/* Expiry Date */}
                  <td className="py-4 px-4 font-medium text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{row.expiryDate}</span>
                    </div>
                  </td>

                  {/* Days Counter */}
                  <td className="py-4 px-4">
                    {row.daysUntilExpiry < 0 ? (
                      <span className="font-bold text-rose-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Expired {Math.abs(row.daysUntilExpiry)}d ago
                      </span>
                    ) : row.daysUntilExpiry === 0 ? (
                      <span className="font-bold text-rose-600 animate-pulse flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Expires TODAY
                      </span>
                    ) : row.daysUntilExpiry <= 7 ? (
                      <span className="font-bold text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {row.daysUntilExpiry} days left
                      </span>
                    ) : row.daysUntilExpiry <= 30 ? (
                      <span className="font-semibold text-amber-700">
                        {row.daysUntilExpiry} days left
                      </span>
                    ) : (
                      <span className="font-medium text-slate-600">
                        {row.daysUntilExpiry} days left
                      </span>
                    )}
                  </td>

                  {/* Status Chip */}
                  <td className="py-4 px-4">
                    {row.status === 'EXPIRED' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        Expired
                      </span>
                    ) : row.status === 'EXPIRING_SOON' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Expiring Soon
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Valid
                      </span>
                    )}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-4 px-4 sm:px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleRenewPrompt(row)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        title="Simulate extension/renewal for 1 year"
                      >
                        Renew
                      </button>

                      <button
                        onClick={() => handleSendReminder(row)}
                        disabled={sendingId === row.recordId}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                          row.status !== 'VALID'
                            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                            : 'bg-brand-50 hover:bg-brand-100 text-brand-700'
                        } disabled:opacity-50`}
                        title="Dispatch immediate reminder email and SMS notice"
                      >
                        <Send className={`w-3 h-3 ${sendingId === row.recordId ? 'animate-bounce' : ''}`} />
                        <span>{sendingId === row.recordId ? 'Sending...' : 'Remind'}</span>
                      </button>

                      {/* Admin Delete Action */}
                      {isAdmin && (
                        <button
                          onClick={() => handleDeletePrompt(row)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Administrative Delete: Remove vehicle from fleet"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
        <span>
          Showing {filteredRows.length} of {rows.length} records 
          {isAdmin ? ' (System-Wide Fleet View)' : ' (Personal Garage)'}
        </span>
        <span className="hidden sm:inline">Daily compliance cron triggers at 08:00 AM IST</span>
      </div>
    </div>
  );
}
