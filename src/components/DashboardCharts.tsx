import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Chantier, Transaction } from '../types';
import { formatDZD } from '../utils/formatters';
import { TrendingUp, BarChart3, LineChart as LineChartIcon, Building2, Calendar } from 'lucide-react';

interface Props {
  chantiers: Chantier[];
  transactions: Transaction[];
  activeChantierId: string | null;
}

// Colors for each chantier
const CHANTIER_COLORS: Record<string, { fill: string; stroke: string; label: string }> = {
  'ch-01': { fill: '#f59e0b', stroke: '#d97706', label: 'Résidence Les Jasmins' },
  'ch-02': { fill: '#0284c7', stroke: '#0369a1', label: 'Tour Méditerranée' },
  'ch-03': { fill: '#0d9488', stroke: '#0f766e', label: 'Lotissement El Bahia' },
  'ch-04': { fill: '#6366f1', stroke: '#4f46e5', label: 'Résidence El Mouradia' },
};

export const DashboardCharts: React.FC<Props> = ({
  chantiers,
  transactions,
  activeChantierId,
}) => {
  const [chartType, setChartType] = useState<'depenses_chantiers' | 'flux_tresorerie'>('depenses_chantiers');

  // Compute 6 months data dynamically
  const monthlyData = useMemo(() => {
    const months = [
      { key: '2026-05', label: 'Mai 2026' },
      { key: '2026-06', label: 'Juin 2026' },
      { key: '2026-07', label: 'Juil 2026' },
      { key: '2026-08', label: 'Août 2026' },
      { key: '2026-09', label: 'Sept 2026' },
      { key: '2026-10', label: 'Oct 2026' },
    ];

    // Baseline historical distribution (realistic numbers for Algerian multi-site construction)
    const baselineMonthly: Record<string, { 'ch-01': number; 'ch-02': number; 'ch-03': number; 'ch-04': number; entrees: number }> = {
      '2026-05': { 'ch-01': 18500000, 'ch-02': 22400000, 'ch-03': 3800000, 'ch-04': 14200000, entrees: 38000000 },
      '2026-06': { 'ch-01': 21000000, 'ch-02': 26800000, 'ch-03': 6500000, 'ch-04': 16800000, entrees: 42500000 },
      '2026-07': { 'ch-01': 24500000, 'ch-02': 29400000, 'ch-03': 7200000, 'ch-04': 19500000, entrees: 51000000 },
      '2026-08': { 'ch-01': 28900000, 'ch-02': 34200000, 'ch-03': 8900000, 'ch-04': 22100000, entrees: 45000000 },
      '2026-09': { 'ch-01': 31200000, 'ch-02': 36500000, 'ch-03': 9400000, 'ch-04': 18900000, entrees: 62000000 },
      '2026-10': { 'ch-01': 16800000, 'ch-02': 21500000, 'ch-03': 5200000, 'ch-04': 11400000, entrees: 48500000 },
    };

    return months.map((m) => {
      const base = baselineMonthly[m.key] || { 'ch-01': 0, 'ch-02': 0, 'ch-03': 0, 'ch-04': 0, entrees: 0 };
      
      // Calculate dynamic additions from actual transactions logged this month
      let extraJasmins = 0;
      let extraTour = 0;
      let extraBahia = 0;
      let extraMouradia = 0;
      let extraEntrees = 0;

      transactions.forEach((tx) => {
        if (tx.date.startsWith(m.key) && tx.statut === 'valide') {
          if (tx.type === 'sortie') {
            if (tx.chantierId === 'ch-01') extraJasmins += tx.montantDZD;
            else if (tx.chantierId === 'ch-02') extraTour += tx.montantDZD;
            else if (tx.chantierId === 'ch-03') extraBahia += tx.montantDZD;
            else if (tx.chantierId === 'ch-04') extraMouradia += tx.montantDZD;
          } else if (tx.type === 'entree') {
            extraEntrees += tx.montantDZD;
          }
        }
      });

      const ch01 = base['ch-01'] + extraJasmins;
      const ch02 = base['ch-02'] + extraTour;
      const ch03 = base['ch-03'] + extraBahia;
      const ch04 = base['ch-04'] + extraMouradia;

      const chMap: Record<string, number> = {
        'ch-01': ch01,
        'ch-02': ch02,
        'ch-03': ch03,
        'ch-04': ch04,
      };

      const allowedChantierIds = new Set(chantiers.map((c) => c.id));
      const totalSorties = Object.entries(chMap)
        .filter(([id]) => allowedChantierIds.has(id))
        .reduce((sum, [, val]) => sum + val, 0);

      const totalEntrees = base.entrees + extraEntrees;

      return {
        month: m.label,
        monthKey: m.key,
        'ch-01': ch01,
        'ch-02': ch02,
        'ch-03': ch03,
        'ch-04': ch04,
        totalSorties,
        totalEntrees,
        soldeNet: totalEntrees - totalSorties,
      };
    });
  }, [transactions, chantiers]);

  // Total past 6 months spending
  const total6MoisSorties = monthlyData.reduce((acc, d) => acc + d.totalSorties, 0);
  const total6MoisEntrees = monthlyData.reduce((acc, d) => acc + d.totalEntrees, 0);
  const moyenneMensuelle = Math.round(total6MoisSorties / (monthlyData.length || 1));

  // Custom Formatter for Y-Axis (Millions DA)
  const formatYAxisMillion = (val: number) => {
    if (val === 0) return '0';
    return `${(val / 1000000).toFixed(0)} M DA`;
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-slate-900/95 text-white p-3.5 rounded-lg shadow-xl border border-slate-700 text-xs backdrop-blur-xs min-w-[220px]">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
          <span className="font-bold text-amber-400 font-mono">{label}</span>
          <span className="text-[10px] text-slate-400">Suivi Trésorerie DZ</span>
        </div>

        {chartType === 'depenses_chantiers' ? (
          <div className="space-y-1.5">
            {payload.map((entry: any) => {
              const info = CHANTIER_COLORS[entry.dataKey] || { fill: entry.color, label: entry.name };
              return (
                <div key={entry.dataKey} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0"
                      style={{ backgroundColor: entry.color || info.fill }}
                    />
                    <span className="text-slate-300 truncate">{info.label} :</span>
                  </div>
                  <span className="font-mono font-bold text-white tabular-nums">
                    {formatDZD(entry.value)}
                  </span>
                </div>
              );
            })}

            {/* Total Month */}
            <div className="pt-2 mt-2 border-t border-slate-800 flex items-center justify-between font-bold">
              <span className="text-slate-200">Total Mois :</span>
              <span className="font-mono text-amber-400 tabular-nums">
                {formatDZD(payload.reduce((acc: number, p: any) => acc + (p.value || 0), 0))}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {payload.map((entry: any) => (
              <div key={entry.dataKey} className="flex items-center justify-between gap-4">
                <span className="text-slate-300">{entry.name} :</span>
                <span
                  className="font-mono font-bold tabular-nums"
                  style={{ color: entry.dataKey === 'totalEntrees' ? '#10b981' : '#f87171' }}
                >
                  {formatDZD(entry.value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">
              {chartType === 'depenses_chantiers'
                ? 'Évolution des Dépenses par Chantier (6 Derniers Mois)'
                : 'Flux de Trésorerie Global (Encaissements VSP vs Dépenses)'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi analytique consolidé en Dinars Algériens (DA)
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setChartType('depenses_chantiers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              chartType === 'depenses_chantiers'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Dépenses par Chantier</span>
          </button>
          <button
            onClick={() => setChartType('flux_tresorerie')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              chartType === 'flux_tresorerie'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LineChartIcon className="w-3.5 h-3.5" />
            <span>Flux de Trésorerie</span>
          </button>
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'depenses_chantiers' ? (
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatYAxisMillion}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 12, fontSize: 11 }}
                formatter={(val) => {
                  return (
                    <span className="text-slate-700 font-medium">
                      {CHANTIER_COLORS[val]?.label || val}
                    </span>
                  );
                }}
              />
              {/* If activeChantierId is set, highlight only that chantier */}
              {activeChantierId ? (
                <Bar
                  dataKey={activeChantierId}
                  name={activeChantierId}
                  fill={CHANTIER_COLORS[activeChantierId]?.fill || '#f59e0b'}
                  radius={[4, 4, 0, 0]}
                />
              ) : (
                chantiers.map((ch, idx) => (
                  <Bar
                    key={ch.id}
                    dataKey={ch.id}
                    name={ch.id}
                    stackId="a"
                    fill={CHANTIER_COLORS[ch.id]?.fill || '#f59e0b'}
                    radius={idx === chantiers.length - 1 ? [4, 4, 0, 0] : undefined}
                  />
                ))
              )}
            </BarChart>
          ) : (
            <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEntrees" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorSorties" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatYAxisMillion}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 12, fontSize: 11 }}
              />
              <Area
                type="monotone"
                dataKey="totalEntrees"
                name="Recettes Clients VSP"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorEntrees)"
              />
              <Area
                type="monotone"
                dataKey="totalSorties"
                name="Dépenses & Décaissements"
                stroke="#ef4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSorties)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary Footer Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
        <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
          <span className="text-slate-500">Total Dépensé (6 mois) :</span>
          <span className="font-mono font-bold text-red-600 tabular-nums">
            {formatDZD(total6MoisSorties)}
          </span>
        </div>
        <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
          <span className="text-slate-500">Moyenne Mensuelle Décaissements :</span>
          <span className="font-mono font-bold text-slate-800 tabular-nums">
            {formatDZD(moyenneMensuelle)}
          </span>
        </div>
        <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
          <span className="text-slate-500">Total Recettes VSP (6 mois) :</span>
          <span className="font-mono font-bold text-emerald-600 tabular-nums">
            {formatDZD(total6MoisEntrees)}
          </span>
        </div>
      </div>
    </div>
  );
};
