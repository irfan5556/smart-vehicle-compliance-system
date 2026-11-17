import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Car, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  Building2, 
  FileCheck, 
  ArrowRight,
  Sliders,
  Sparkles,
  Layers,
  Check
} from 'lucide-react';
import { vehicleApi } from '../services/api';

const INDIAN_PLATE_REGEX = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/;

export default function LookupModal({ isOpen, onClose, onEnrolled, showToast }) {
  const [activeTab, setActiveTab] = useState('sandbox'); // 'sandbox' | 'manual'

  // Tab 1: Sandbox Auto-Lookup State
  const [plateInput, setPlateInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState(null);

  // Tab 2: Manual Registration Form State
  const [manualForm, setManualForm] = useState({
    registrationNumber: '',
    makeAndModel: '',
    vehicleType: 'Motor Car (LMV)',
    insuranceProvider: 'ICICI Lombard General Insurance',
    insurancePolicyNumber: '',
    insuranceExpiryDate: getDefaultDate(45),
    pucCertificateNumber: '',
    pucProvider: 'Authorized Emission Test Center',
    pucExpiryDate: getDefaultDate(15),
    roadTaxExpiryDate: getDefaultDate(365 * 15)
  });
  const [manualError, setManualError] = useState(null);
  const [manualLoading, setManualLoading] = useState(false);

  if (!isOpen) return null;

  const normalizedPlate = plateInput.toUpperCase().replace(/\s+/g, '');
  const isValidPlate = INDIAN_PLATE_REGEX.test(normalizedPlate);

  function getDefaultDate(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  }

  const handleInputChange = (e) => {
    const val = e.target.value.toUpperCase();
    setPlateInput(val);
    setError(null);
    setPreviewData(null);
  };

  const handleQuickPlate = (plate) => {
    setPlateInput(plate);
    setError(null);
    setPreviewData(null);
  };

  // Tab 1: Fetch via Parivahan Sandbox / RTO API
  const handleLookup = async (e) => {
    e.preventDefault();
    if (!isValidPlate) {
      setError('Please enter a valid Indian vehicle registration number (e.g., TN09BX4521, PY01BU1938)');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPreviewData(null);

    try {
      const res = await vehicleApi.lookupAndEnroll({
        registrationNumber: normalizedPlate,
        useSandbox: true
      });
      if (res.success && res.data) {
        setPreviewData({
          ...res.data,
          dataSource: res.source
        });
      } else {
        throw new Error('Unable to retrieve vehicle information from RTO service.');
      }
    } catch (err) {
      setError(err.message || 'Failed to query RTO service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Tab 1 Confirm CTA
  const handleConfirmEnrollment = () => {
    if (previewData) {
      onEnrolled(previewData);
      showToast({
        type: 'success',
        title: 'Vehicle Enrolled Successfully',
        message: `${previewData.registrationNumber} (${previewData.makeAndModel}) has been added to your garage.`
      });
      handleClose();
    }
  };

  // Tab 2: Submit Manual Vehicle Registration
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const cleanManualPlate = manualForm.registrationNumber.toUpperCase().replace(/\s+/g, '');

    if (!INDIAN_PLATE_REGEX.test(cleanManualPlate)) {
      setManualError('Please enter a valid Indian plate format (e.g. TN09BX4521 or PY01BU1938)');
      return;
    }
    if (!manualForm.makeAndModel.trim()) {
      setManualError('Make and Model is required (e.g. Tata Nexon EV, Hyundai Creta)');
      return;
    }

    setManualLoading(true);
    setManualError(null);

    try {
      const res = await vehicleApi.lookupAndEnroll({
        ...manualForm,
        registrationNumber: cleanManualPlate,
        useSandbox: false
      });

      if (res.success && res.data) {
        onEnrolled(res.data);
        showToast({
          type: 'success',
          title: 'Custom Vehicle Registered',
          message: `${cleanManualPlate} (${manualForm.makeAndModel}) added to compliance ledger.`
        });
        handleClose();
      } else {
        throw new Error('Failed to register manual vehicle record');
      }
    } catch (err) {
      setManualError(err.message || 'Failed to submit vehicle. Please try again.');
    } finally {
      setManualLoading(false);
    }
  };

  const handleClose = () => {
    setPlateInput('');
    setPreviewData(null);
    setError(null);
    setIsLoading(false);
    setManualError(null);
    setManualLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden transition-all duration-300 max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Enroll Vehicle into Fleet
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Sandbox Active
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Automatic RTO Simulator Lookup & Custom Fleet Registration
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 pt-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'sandbox'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Parivahan RTO Simulator (Auto-Fill)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'manual'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Manual Fleet Entry
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* ================================================================ */}
          {/* TAB 1: PARIVAHAN RTO SIMULATOR */}
          {/* ================================================================ */}
          {activeTab === 'sandbox' && (
            <div className="space-y-5">
              {/* Sandbox Announcement Pill */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 leading-relaxed">
                  <span className="font-bold">Zero-Cost Parivahan Simulator:</span> Test any Indian vehicle plate (e.g. <span className="font-mono font-semibold">PY01BU1938</span>, <span className="font-mono font-semibold">MH12DE1432</span>). Real-time realistic RC, Insurance, and PUC data will be generated and verified automatically.
                </div>
              </div>

              {/* Plate Input Section */}
              <form onSubmit={handleLookup} className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Vehicle Registration Plate
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={plateInput}
                    onChange={handleInputChange}
                    placeholder="e.g. PY01BU1938, TN09BX4521, MH12DE1432"
                    maxLength={13}
                    className={`w-full pl-10 pr-28 py-3 bg-slate-50 border rounded-xl text-base font-mono-plate font-semibold tracking-wider text-slate-900 placeholder:text-slate-400 placeholder:font-sans focus:outline-none focus:ring-2 transition-all ${
                      plateInput.length === 0
                        ? 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                        : isValidPlate
                        ? 'border-emerald-400 bg-emerald-50/20 focus:ring-emerald-500/20 focus:border-emerald-500'
                        : 'border-rose-300 bg-rose-50/20 focus:ring-rose-500/20 focus:border-rose-500'
                    }`}
                  />
                  <div className="absolute inset-y-0 right-1.5 flex items-center">
                    <button
                      type="submit"
                      disabled={!isValidPlate || isLoading}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                    >
                      {isLoading ? 'Querying...' : 'Fetch Details'}
                    </button>
                  </div>
                </div>

                {/* Validation Feedback */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    {plateInput.length > 0 && (
                      isValidPlate ? (
                        <span className="text-emerald-600 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Valid Indian Plate Format
                        </span>
                      ) : (
                        <span className="text-rose-500 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> Pattern: State (2) + District (1-2) + Series (0-3) + Number (4)
                        </span>
                      )
                    )}
                    {plateInput.length === 0 && (
                      <span className="text-slate-400">
                        Supports all state plates (PY, TN, MH, DL, KA, UP, GJ, KL, etc.)
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Demo Plates */}
                <div className="pt-1 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-slate-400 font-medium">Quick Test:</span>
                  {['PY01BU1938', 'TN09BX4521', 'DL03CC8812', 'MH12DE1432', 'KA05MJ9988'].map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => handleQuickPlate(p)}
                      className="px-2 py-0.5 font-mono text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded border border-slate-200 transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </form>

              {/* Loading Skeleton */}
              {isLoading && (
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="h-16 bg-slate-200 rounded-xl"></div>
                    <div className="h-16 bg-slate-200 rounded-xl"></div>
                  </div>
                  <p className="text-center text-xs font-semibold text-slate-400 animate-pulse">
                    Querying Parivahan Simulator & generating authentic compliance records...
                  </p>
                </div>
              )}

              {/* Error Box */}
              {error && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Query Failed</p>
                    <p className="text-rose-600 mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {/* Preview Card */}
              {previewData && !isLoading && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5 space-y-4 animate-fade-in">
                  <div className="flex items-start justify-between pb-3 border-b border-emerald-100">
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1.5 bg-amber-400 text-slate-900 font-mono font-bold text-sm rounded-lg border-2 border-slate-900 shadow-xs">
                        {previewData.registrationNumber}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {previewData.makeAndModel}
                        </h3>
                        <p className="text-xs text-slate-500">{previewData.vehicleType}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5" /> Parivahan Sandbox Verified
                    </span>
                  </div>

                  {/* Compliance Breakdown Preview */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {previewData.complianceRecords?.map((rec) => {
                      const isExp = rec.isExpired || rec.daysUntilExpiry < 0;
                      const isSoon = !isExp && rec.daysUntilExpiry <= 30;

                      return (
                        <div 
                          key={rec.id || rec.complianceType}
                          className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                              rec.complianceType === 'INSURANCE' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {rec.complianceType}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isExp 
                                ? 'bg-rose-100 text-rose-800' 
                                : isSoon 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isExp ? 'EXPIRED' : `${rec.daysUntilExpiry}d left`}
                            </span>
                          </div>

                          <div className="text-xs text-slate-600">
                            <div className="flex items-center gap-1 text-slate-500">
                              <Building2 className="w-3 h-3" />
                              <span className="truncate">{rec.provider || 'RTO Authority'}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1 font-semibold text-slate-900">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>Valid upto: {rec.expiryDate}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* CTA */}
                  <button
                    type="button"
                    onClick={handleConfirmEnrollment}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Confirm & Add Vehicle to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 2: MANUAL FLEET REGISTRATION */}
          {/* ================================================================ */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              {manualError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{manualError}</span>
                </div>
              )}

              {/* Plate & Model Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Plate Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PY01BU1938"
                    value={manualForm.registrationNumber}
                    onChange={(e) => setManualForm({ ...manualForm, registrationNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={manualForm.vehicleType}
                    onChange={(e) => setManualForm({ ...manualForm, vehicleType: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="Motor Car (LMV)">Motor Car (LMV)</option>
                    <option value="Electric Vehicle (EV)">Electric Vehicle (EV)</option>
                    <option value="Two-Wheeler (Motorcycle/Scooter)">Two-Wheeler (Motorcycle/Scooter)</option>
                    <option value="Commercial Goods Vehicle (HMV)">Commercial Goods Vehicle (HMV)</option>
                    <option value="Light Commercial Vehicle (LCV)">Light Commercial Vehicle (LCV)</option>
                  </select>
                </div>
              </div>

              {/* Make & Model */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Make & Model *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tata Nexon EV, Hyundai Creta SX, Mahindra Thar"
                  value={manualForm.makeAndModel}
                  onChange={(e) => setManualForm({ ...manualForm, makeAndModel: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Insurance Details Section */}
              <div className="p-3.5 rounded-2xl bg-blue-50/40 border border-blue-100 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Insurance Policy Details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Insurance Provider</label>
                    <input
                      type="text"
                      value={manualForm.insuranceProvider}
                      onChange={(e) => setManualForm({ ...manualForm, insuranceProvider: e.target.value })}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Insurance Expiry Date *</label>
                    <input
                      type="date"
                      required
                      value={manualForm.insuranceExpiryDate}
                      onChange={(e) => setManualForm({ ...manualForm, insuranceExpiryDate: e.target.value })}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* PUC Emission Details Section */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>PUC Emission Certificate</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">PUC Center / Lab</label>
                    <input
                      type="text"
                      value={manualForm.pucProvider}
                      onChange={(e) => setManualForm({ ...manualForm, pucProvider: e.target.value })}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">PUC Expiry Date *</label>
                    <input
                      type="date"
                      required
                      value={manualForm.pucExpiryDate}
                      onChange={(e) => setManualForm({ ...manualForm, pucExpiryDate: e.target.value })}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Manual */}
              <button
                type="submit"
                disabled={manualLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all mt-4"
              >
                {manualLoading ? (
                  <span>Registering Vehicle...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Register Custom Vehicle to Fleet</span>
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
