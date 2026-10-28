import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Chantier } from '../types';
import { formatDZD } from '../utils/formatters';
import {
  PieChart,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Building,
  Target,
  DollarSign,
  Percent,
} from 'lucide-react';

interface Props {
  chantiers: Chantier[];
  activeChantierId: string | null;
}

export const DashboardKpiBudgets: React.FC<Props> = ({
  chantiers,
  activeChantierId,
}) => {
  const filteredChantiers = useMemo(() => {
    return activeChantierId
      ? chantiers.filter((c) => c.id === activeChantierId)
      : chantiers;
  }, [chantiers, activeChantierId]);

  // Aggregate totals
  const totalBudget = useMemo(() => {
    return filteredChantiers.reduce((acc, c) => acc + c.budgetTotalDZD, 0);
  }, [filteredChantiers]);

  const totalDepenses = useMemo(() => {
    return filteredChantiers.reduce((acc, c) => acc + c.depensesEngageesDZD, 0);
  }, [filteredChantiers]);

  const soldeRestantGlobal = totalBudget - totalDepenses;
  const tauxConsommationGlobal = totalBudget > 0 ? (totalDepenses / totalBudget) * 100 : 0;

  // Format chart data
  const chartData = useMemo(() => {
    return filteredChantiers.map((c) => {
      const budget = c.budgetTotalDZD;
      const depenses = c.depensesEngageesDZD;
      const ecart = budget - depenses;
      const taux = budget > 0 ? (depenses / budget) * 100 : 0;

      return {
        id: c.id,
        code: c.code,
        nomCourt: c.nom.length > 20 ? c.nom.slice(0, 18) + '...' : c.nom,
        nomComplet: c.nom,
        budget,
        depenses,
        ecart,
        taux: parseFloat(taux.toFixed(1)),
        statut:
          taux > 100
            ? 'depassement'
            : taux > 85
            ? 'vigilance'
            : 'conforme',
      };
    });
  }, [filteredChantiers]);

  // Y-Axis Formatter (Millions DA)
  const formatYAxis = (val: number) => {
    if (val === 0) return '0';
    return `${(val / 1000000).toFixed(0)} M DA`;
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;

    return (
      <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-2xl border border-slate-700 text-xs backdrop-blur-xs min-w-[240px] space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="font-bold text-amber-400 font-mono">{data.nomComplet}</span>
          <span className="text-[10px] text-slate-400 font-mono">{data.code}</span>
        </div>

        <div className="space-y-1.5 font-mono">
          <div className="flex justify-between items-center text-slate-300">
            <span className="text-[11px] text-slate-400">Budget Alloué :</span>
            <span className="font-bold text-indigo-400">{formatDZD(data.budget)}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span className="text-[11px] text-slate-400">Dépenses Réelles :</span>
            <span className="font-bold text-amber-400">{formatDZD(data.depenses)}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span className="text-[11px] text-slate-400">Marge Disponible :</span>
            <span className={`font-bold ${data.ecart >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatDZD(data.ecart)}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px]">
          <span className="text-slate-400">Consommation :</span>
          <span className={`font-bold font-mono ${data.taux > 90 ? 'text-red-400' : 'text-emerald-400'}`}>
            {data.taux}% du budget
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Data Visualization — Comparatif Budgets Prévisionnels vs Dépenses Réelles
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Suivi des coûts engagés et contrôle de gestion par chantier BTPH
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-xs font-bold rounded-lg">
            Taux de Consommation Moyen : {tauxConsommationGlobal.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Budget Contractuel Total
          </span>
          <span className="text-xl font-mono font-bold text-indigo-700 block tabular-nums">
            {formatDZD(totalBudget)}
          </span>
          <span className="text-[10px] text-slate-500 block">Alloué aux chantiers</span>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Dépenses Réelles Engagées
          </span>
          <span className="text-xl font-mono font-bold text-amber-600 block tabular-nums">
            {formatDZD(totalDepenses)}
          </span>
          <span className="text-[10px] text-slate-500 block">Factures, caisses, paies</span>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Marge Budgétaire Restante
          </span>
          <span className={`text-xl font-mono font-bold block tabular-nums ${soldeRestantGlobal >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {formatDZD(soldeRestantGlobal)}
          </span>
          <span className="text-[10px] text-slate-500 block">Disponibilité globale</span>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Statut de Santé Financière
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {tauxConsommationGlobal > 90 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-800 border border-red-300 rounded-lg text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Vigilance Budget
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Maîtrise des Coûts
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 block">Écart dans les normes BTPH</span>
        </div>
      </div>

      {/* Main Dual Bar Chart (Recharts) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span className="font-bold text-slate-800">Comparaison Graphique par Chantier (DZD) :</span>
          <span className="text-[11px] text-slate-500">Barres groupées : Budget Alloué (Indigo) vs Dépenses Réelles (Orange)</span>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 15, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="nomCourt"
                tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                interval={0}
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                width={75}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 15, fontSize: 12, fontWeight: 600 }}
                formatter={(value) => {
                  return value === 'budget' ? 'Budget Prévisionnel Alloué' : 'Dépenses Réelles Engagées';
                }}
              />
              <Bar
                dataKey="budget"
                name="budget"
                fill="#4f46e5"
                radius={[6, 6, 0, 0]}
                barSize={32}
              />
              <Bar
                dataKey="depenses"
                name="depenses"
                fill="#f59e0b"
                radius={[6, 6, 0, 0]}
                barSize={32}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.taux > 90 ? '#e11d48' : entry.taux > 75 ? '#f59e0b' : '#10b981'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table & Health Gauges Breakdown */}
      <div className="pt-2 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
          Tableau Analytique de Consommation Budgétaire
        </h4>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Chantier & Code</th>
                <th className="py-3 px-4 text-right">Budget Prévisionnel (DA)</th>
                <th className="py-3 px-4 text-right">Dépenses Réelles (DA)</th>
                <th className="py-3 px-4 text-right">Marge Disponible (DA)</th>
                <th className="py-3 px-4 text-center">Consommation</th>
                <th className="py-3 px-4 text-center">Statut Santé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
              {chartData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors font-mono">
                  <td className="py-3 px-4 font-sans font-bold text-slate-900">
                    <div>{item.nomComplet}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{item.code}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-indigo-700 tabular-nums">
                    {formatDZD(item.budget)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-amber-600 tabular-nums">
                    {formatDZD(item.depenses)}
                  </td>
                  <td className={`py-3 px-4 text-right font-bold tabular-nums ${item.ecart >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {formatDZD(item.ecart)}
                  </td>
                  <td className="py-3 px-4 text-center font-sans min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            item.taux > 90
                              ? 'bg-red-600'
                              : item.taux > 75
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, item.taux)}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-bold text-slate-800 w-10 text-right">
                        {item.taux}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-sans">
                    {item.statut === 'depassement' ? (
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-300 rounded text-[10px] font-bold">
                        ⚠️ Dépassement
                      </span>
                    ) : item.statut === 'vigilance' ? (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded text-[10px] font-bold">
                        ⚡ Vigilance
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[10px] font-bold">
                        ✓ Conforme
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
