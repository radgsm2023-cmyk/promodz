import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { JournalAuditItem, ActionAudit, ModuleAudit } from '../types';
import { formatDateTimeFR, formatDZD } from '../utils/formatters';
import {
  ClipboardList,
  Search,
  Filter,
  Download,
  ShieldAlert,
  User,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  ArrowUpDown,
  Layers,
  Activity,
  AlertTriangle,
  Lock,
  Unlock,
  RefreshCw,
} from 'lucide-react';

const MODULE_LABELS: Record<string, string> = {
  caisses: 'Trésorerie & Caisses',
  transactions: 'Dépenses & Recettes',
  chantiers: 'Chantiers & Projets',
  tiers: 'Tiers & Sous-traitants',
  materiel: 'Engins & Matériel',
  stocks: 'Stocks BTPH',
  personnel: 'Personnel & Paie',
  pv_avancement: 'PVs & Visas CTC',
  settings: 'Paramètres Entreprise',
  utilisateurs: 'Utilisateurs System',
  roles: 'Rôles & RBAC',
  journal_chantier: 'Journal Quotidien',
  beneficiaires: 'Acquéreurs VSP',
  logements: 'Lots & Appartements',
  conformite: 'Audit Conformité',
  backup: 'Sauvegardes',
  messagerie: 'Messagerie Interne',
  cloture_mensuelle: 'Clôture Mensuelle',
  securite: 'Sécurité & Contrôle d\'Accès',
};

export const LogsAuditView: React.FC = () => {
  const { journalAudit } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Filter logs
  const filteredLogs = journalAudit.filter((item) => {
    const matchSearch =
      item.utilisateurNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.utilisateurRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.entiteReference && item.entiteReference.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchModule = selectedModule === 'all' || item.module === selectedModule;
    const matchAction = selectedAction === 'all' || item.action === selectedAction;

    return matchSearch && matchModule && matchAction;
  });

  // Sort logs chronologically
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  // KPI Statistics
  const totalEvents = journalAudit.length;
  const criticalActions = journalAudit.filter((i) =>
    ['suppression', 'deverrouillage', 'cloture', 'restauration'].includes(i.action)
  ).length;
  const uniqueUsers = new Set(journalAudit.map((i) => i.utilisateurNom)).size;
  const totalFinancialImpact = journalAudit.reduce(
    (acc, i) => acc + (i.impactFinancierDZD || 0),
    0
  );

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'ID_Audit',
      'Horodatage_ISO',
      'Utilisateur_Nom',
      'Utilisateur_Role',
      'Module',
      'Action',
      'Entite_Reference',
      'Details',
      'Impact_Financier_DZD',
    ];

    const rows = sortedLogs.map((item) =>
      [
        `"${item.id}"`,
        `"${item.date}"`,
        `"${item.utilisateurNom.replace(/"/g, '""')}"`,
        `"${item.utilisateurRole.replace(/"/g, '""')}"`,
        `"${item.module}"`,
        `"${item.action}"`,
        `"${item.entiteReference || ''}"`,
        `"${item.details.replace(/"/g, '""')}"`,
        item.impactFinancierDZD || 0,
      ].join(';')
    );

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LOGS_AUDIT_BATIPROMOTE_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper badge color for Action
  const getActionBadge = (action: ActionAudit) => {
    switch (action) {
      case 'creation':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'modification':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'suppression':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
      case 'validation':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'decaissement':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'cloture':
        return 'bg-purple-100 text-purple-800 border-purple-300 font-bold';
      case 'deverrouillage':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse';
      case 'backup':
      case 'restauration':
        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'securite_alerte':
        return 'bg-rose-600 text-white border-rose-700 font-extrabold shadow-xs';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" /> Sécurité & Registre d'Inviolabilité
              </span>
              <span className="text-xs text-slate-400">Traçabilité Chronologique Rétroactive</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">Journal d'Audit Système & Logs des Actions Critiques</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Consultez l'historique inaltérable de toutes les opérations effectuées sur la plateforme :
              créations, modifications financières, validations, suppressions, clôtures mensuelles et déverrouillages d'exception.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer shrink-0 self-start md:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>Exporter le Rapport CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Événements
            </span>
            <ClipboardList className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-2xl font-mono font-black text-slate-900 block">{totalEvents}</span>
          <span className="text-[10px] text-slate-500 block">Actions enregistrées dans la base</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
              Actions Critiques
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-2xl font-mono font-black text-rose-600 block">{criticalActions}</span>
          <span className="text-[10px] text-rose-600 block">Suppressions, Clôtures & Dév.</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Intervenants Uniques
            </span>
            <User className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-2xl font-mono font-black text-slate-900 block">{uniqueUsers}</span>
          <span className="text-[10px] text-slate-500 block">Utilisateurs distincts</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
              Impact Financier Tracé
            </span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-xl font-mono font-black text-slate-900 block tabular-nums">
            {formatDZD(totalFinancialImpact)}
          </span>
          <span className="text-[10px] text-slate-500 block">Montants certifiés</span>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher utilisateur, détail, ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden"
            />
          </div>

          {/* Module Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              <option value="all">Tous les Modules (Global)</option>
              {Object.entries(MODULE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              <option value="all">Toutes les Actions</option>
              <option value="creation">Créations</option>
              <option value="modification">Modifications</option>
              <option value="suppression">Suppressions</option>
              <option value="validation">Validations & Visas</option>
              <option value="decaissement">Décaissements</option>
              <option value="cloture">Clôtures Mensuelles</option>
              <option value="deverrouillage">Déverrouillages Exceptionnels</option>
              <option value="backup">Sauvegardes / Restauration</option>
              <option value="securite_alerte">Incidents de Sécurité & Falsification</option>
            </select>
          </div>

          {/* Order Sort Toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-600" />
            <span>Ordre : {sortOrder === 'desc' ? 'Plus Récents Premier' : 'Plus Anciens Premier'}</span>
          </button>
        </div>

        {(searchTerm || selectedModule !== 'all' || selectedAction !== 'all') && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Affichage de {sortedLogs.length} sur {totalEvents} événements filtrés</span>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedModule('all');
                setSelectedAction('all');
              }}
              className="text-amber-700 hover:underline font-bold text-[11px]"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      {/* Main Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3.5 px-4">Timestamp / Date</th>
                <th className="py-3.5 px-4">Utilisateur & Rôle</th>
                <th className="py-3.5 px-4">Module Concerné</th>
                <th className="py-3.5 px-4 text-center">Type d'Action</th>
                <th className="py-3.5 px-4">Référence & Détails de l'Opération</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {sortedLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Aucun événement d'audit ne correspond à votre recherche.
                  </td>
                </tr>
              ) : (
                sortedLogs.map((item) => {
                  const moduleLibelle = MODULE_LABELS[item.module] || item.module;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDateTimeFR(item.date)}</span>
                        </div>
                      </td>

                      {/* User */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.utilisateurNom}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{item.utilisateurRole}</div>
                      </td>

                      {/* Module */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">{moduleLibelle}</span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{item.module}</span>
                      </td>

                      {/* Action Badge */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] uppercase font-bold border ${getActionBadge(
                            item.action
                          )}`}
                        >
                          {item.action}
                        </span>
                      </td>

                      {/* Details & Impact */}
                      <td className="py-3 px-4 max-w-md">
                        <div className="flex items-center gap-2 mb-0.5">
                          {item.entiteReference && (
                            <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono font-bold text-slate-700 shrink-0">
                              {item.entiteReference}
                            </span>
                          )}
                          {item.impactFinancierDZD ? (
                            <span className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded text-[10px] font-mono font-bold shrink-0">
                              {formatDZD(item.impactFinancierDZD)}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-sans font-medium">
                          {item.details}
                        </p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
