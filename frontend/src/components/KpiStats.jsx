import React from 'react';
import { Car, ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function KpiStats({ vehicles = [] }) {
  // Aggregate stats across all registered vehicles and their compliance records
  const totalVehicles = vehicles.length;

  let fullyCompliantCount = 0;
  let expiringSoonRecords = 0;
  let expiredRecords = 0;

  vehicles.forEach((vehicle) => {
    const records = vehicle.complianceRecords || [];
    if (records.length === 0) return;

    const hasExpired = records.some((r) => r.isExpired || r.daysUntilExpiry < 0);
    const hasExpiringSoon = records.some(
      (r) => !r.isExpired && r.daysUntilExpiry >= 0 && r.daysUntilExpiry <= 30
    );

    if (!hasExpired && !hasExpiringSoon) {
      fullyCompliantCount++;
    }

    records.forEach((r) => {
      if (r.isExpired || r.daysUntilExpiry < 0) {
        expiredRecords++;
      } else if (r.daysUntilExpiry <= 30) {
        expiringSoonRecords++;
      }
    });
  });

  const cards = [
    {
      title: 'Total Vehicles',
      value: totalVehicles,
      subtitle: 'Registered in fleet inventory',
      icon: <Car className="w-6 h-6 text-sky-600" />,
      bg: 'bg-sky-50/70',
      border: 'border-sky-200/80',
      badge: 'Active Fleet',
      badgeColor: 'bg-sky-100 text-sky-800'
    },
    {
      title: 'Fully Compliant',
      value: fullyCompliantCount,
      subtitle: 'All documents valid (>30 days)',
      icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />,
      bg: 'bg-emerald-50/70',
      border: 'border-emerald-200/80',
      badge: `${totalVehicles > 0 ? Math.round((fullyCompliantCount / totalVehicles) * 100) : 0}% compliant`,
      badgeColor: 'bg-emerald-100 text-emerald-800'
    },
    {
      title: 'Expiring Soon',
      value: expiringSoonRecords,
      subtitle: 'Due within 30 days window',
      icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
      bg: 'bg-amber-50/70',
      border: 'border-amber-200/80',
      badge: 'Action Required',
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    {
      title: 'Expired / Non-Compliant',
      value: expiredRecords,
      subtitle: 'Immediate legal penalty risk',
      icon: <ShieldAlert className="w-6 h-6 text-rose-600" />,
      bg: 'bg-rose-50/70',
      border: 'border-rose-200/80',
      badge: 'Critical Alert',
      badgeColor: 'bg-rose-100 text-rose-800'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {cards.map((card, i) => (
        <div
          key={i}
          className={`relative overflow-hidden rounded-2xl border ${card.border} ${card.bg} p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {card.title}
            </span>
            <div className="p-2.5 rounded-xl bg-white shadow-xs">
              {card.icon}
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {card.value}
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${card.badgeColor}`}>
              {card.badge}
            </span>
          </div>

          <p className="mt-2 text-xs text-slate-500 font-medium">
            {card.subtitle}
          </p>
        </div>
      ))}
    </div>
  );
}

