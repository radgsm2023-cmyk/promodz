import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Employe, BulletinPaie, CorpsMetier, TypeContratTravail } from '../types';
import { formatDZD, formatDateFR, CORPS_METIER_LABELS, CONTRAT_LABELS } from '../utils/formatters';
import {
  HardHat,
  Users,
  Plus,
  Search,
  Building2,
  DollarSign,
  Receipt,
  Calendar,
  Phone,
  CreditCard,
  Printer,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  Briefcase,
  AlertCircle,
  FileCheck,
  TrendingUp,
  FileDown,
} from 'lucide-react';
import { exportBulletinIndividuelPDF } from '../utils/pdfExport';

interface Props {
  onOpenEmployeModal: (employeToEdit?: Employe | null, defaultChantierId?: string) => void;
  onOpenAffectationModal: (employe?: Employe | null) => void;
  onOpenBulletinPaieModal: (defaultEmployeId?: string) => void;
  onOpenExportPdfModal?: () => void;
}

export const PersonnelView: React.FC<Props> = ({
  onOpenEmployeModal,
  onOpenAffectationModal,
  onOpenBulletinPaieModal,
  onOpenExportPdfModal,
}) => {
  const {
    employes,
    bulletinsPaie,
    chantiers,
    caisses,
    activeChantierId,
    deleteEmploye,
    reglerBulletinPaie,
    openPrintBulletinPaie,
    currentUser,
  } = useApp();

  const isGlobalUser =
    currentUser.role === 'superadmin' ||
    currentUser.role === 'directeur_promoteur' ||
    currentUser.chantiersAssignes.includes('*');

  const userAllowedChantiers = isGlobalUser
    ? chantiers
    : chantiers.filter((c) => currentUser.chantiersAssignes.includes(c.id));

  const [activeSubTab, setActiveSubTab] = useState<'liste' | 'affectations' | 'paie' | 'acomptes'>('liste');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMetier, setSelectedMetier] = useState<string>('all');
  const [selectedContrat, setSelectedContrat] = useState<string>('all');
  const [selectedChantierFilter, setSelectedChantierFilter] = useState<string>('all');
  const [statutPaieFilter, setStatutPaieFilter] = useState<'all' | 'paye' | 'en_attente'>('all');

  // Filter employes
  const filteredEmployes = employes.filter((emp) => {
    // Site-level restriction
    if (!isGlobalUser && (!emp.chantierId || !currentUser.chantiersAssignes.includes(emp.chantierId))) {
      return false;
    }
    // Global filter from header if set
    if (activeChantierId && emp.chantierId !== activeChantierId) return false;
    // Local chantier filter
    if (selectedChantierFilter !== 'all' && emp.chantierId !== selectedChantierFilter) return false;
    // Trade filter
    if (selectedMetier !== 'all' && emp.corpsMetier !== selectedMetier) return false;
    // Contract filter
    if (selectedContrat !== 'all' && emp.typeContrat !== selectedContrat) return false;
    // Search term
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = `${emp.prenom} ${emp.nom}`.toLowerCase().includes(q);
      const matchMatricule = emp.matricule.toLowerCase().includes(q);
      const matchSpecialite = (emp.specialiteLibelle || '').toLowerCase().includes(q);
      const matchCNI = (emp.cniNumero || '').toLowerCase().includes(q);
      const matchTel = (emp.telephone || '').toLowerCase().includes(q);
      return matchName || matchMatricule || matchSpecialite || matchCNI || matchTel;
    }
    return true;
  });

  // Filter payroll slips
  const filteredBulletins = bulletinsPaie.filter((bp) => {
    // Site-level restriction
    if (!isGlobalUser && (!bp.chantierId || !currentUser.chantiersAssignes.includes(bp.chantierId))) {
      return false;
    }
    if (activeChantierId && bp.chantierId !== activeChantierId) return false;
    if (selectedChantierFilter !== 'all' && bp.chantierId !== selectedChantierFilter) return false;
    if (statutPaieFilter !== 'all' && bp.statut !== statutPaieFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        bp.employeNom.toLowerCase().includes(q) ||
        bp.reference.toLowerCase().includes(q) ||
        bp.chantierNom.toLowerCase().includes(q) ||
        bp.periodeMois.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Allowed employes & bulletins for KPIs
  const visibleEmployes = isGlobalUser
    ? employes
    : employes.filter((e) => e.chantierId && currentUser.chantiersAssignes.includes(e.chantierId));
  const visibleBulletins = isGlobalUser
    ? bulletinsPaie
    : bulletinsPaie.filter((b) => b.chantierId && currentUser.chantiersAssignes.includes(b.chantierId));

  // Aggregates & KPIs
  const totalEffectif = visibleEmployes.length;
  const effectifFiltre = filteredEmployes.length;
  const totalMasseSalariale = visibleBulletins.reduce((acc, b) => acc + b.netAPayerDZD, 0);
  const totalPaieEnAttente = visibleBulletins
    .filter((b) => b.statut === 'en_attente')
    .reduce((acc, b) => acc + b.netAPayerDZD, 0);
  const countPaieEnAttente = visibleBulletins.filter((b) => b.statut === 'en_attente').length;
  const totalAvancesDeduites = visibleBulletins.reduce((acc, b) => acc + (b.avancesAcomptesDeduitesDZD || 0), 0);

  // Grouping by chantier for the assignment matrix
  const employesParChantier = chantiers.map((ch) => {
    const assigned = employes.filter((e) => e.chantierId === ch.id);
    return {
      chantier: ch,
      employes: assigned,
      totalOuvriers: assigned.length,
      journaliers: assigned.filter((e) => e.typeContrat === 'journalier_quinzaine').length,
      permanents: assigned.filter((e) => e.typeContrat === 'mensuel_permanent').length,
    };
  });

  return (
    <div className="space-y-6">
      {/* View Header with Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-amber-500/10 text-amber-700 rounded-lg">
              <HardHat className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Gestion du Personnel, Paie & Affectations
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Suivi des équipes travaux, matricules, pointage quinzaines, salaires en Dinars Algériens (DA) et déploiement multi-chantiers
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenExportPdfModal && (
            <button
              onClick={onOpenExportPdfModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-amber-400/20 hover:bg-amber-400/30 border border-amber-300 rounded-lg transition-colors shadow-2xs"
              title="Générer et exporter le Bilan Mensuel de Paie et Débours en PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-amber-700" />
              Bilan Paie PDF
            </button>
          )}

          <button
            onClick={() => onOpenAffectationModal(null)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-slate-600" />
            Changer Affectation
          </button>

          <button
            onClick={() => onOpenBulletinPaieModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors border border-amber-300"
          >
            <Receipt className="w-3.5 h-3.5 text-amber-800" />
            + Nouveau Bulletin de Paie
          </button>

          <button
            onClick={() => onOpenEmployeModal(null, activeChantierId || undefined)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            + Nouveau Collaborateur
          </button>
        </div>
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Effectif Total Mobilisé */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold uppercase tracking-wider">Effectif Mobilisé</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {activeChantierId ? effectifFiltre : totalEffectif}
            </span>
            <span className="text-xs text-slate-500 font-medium">collaborateurs / ouvriers</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>Journaliers : {employes.filter((e) => e.typeContrat === 'journalier_quinzaine').length}</span>
            <span>Permanents : {employes.filter((e) => e.typeContrat === 'mensuel_permanent').length}</span>
          </div>
        </div>

        {/* KPI 2: Masse Salariale Quinzaine/Mois */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold uppercase tracking-wider">Masse Salariale Émise</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
              {formatDZD(totalMasseSalariale)}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            Cumul des bordereaux et salaires enregistrés
          </p>
        </div>

        {/* KPI 3: Salaires en Attente */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold uppercase tracking-wider">Paies en Attente</span>
            <div className={`p-2 rounded-lg ${countPaieEnAttente > 0 ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-700 tabular-nums">
              {formatDZD(totalPaieEnAttente)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>{countPaieEnAttente} bordereau{countPaieEnAttente > 1 ? 'x' : ''} à régler</span>
            {countPaieEnAttente > 0 && (
              <span className="text-amber-700 font-semibold">À liquider via caisse</span>
            )}
          </div>
        </div>

        {/* KPI 4: Acomptes & Avances déduites */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold uppercase tracking-wider">Avances & Acomptes</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-purple-700 tabular-nums">
              {formatDZD(totalAvancesDeduites)}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            Déduits sur caisses de fond de roulement
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('liste')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'liste'
              ? 'border-amber-500 text-amber-700 bg-amber-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Répertoire du Personnel ({filteredEmployes.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('affectations')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'affectations'
              ? 'border-amber-500 text-amber-700 bg-amber-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Matrice d'Affectation Multi-Chantiers</span>
        </button>

        <button
          onClick={() => setActiveSubTab('paie')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'paie'
              ? 'border-amber-500 text-amber-700 bg-amber-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Bordereaux de Paie & Quinzaines ({bulletinsPaie.length})</span>
          {countPaieEnAttente > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-amber-500 text-slate-950 rounded">
              {countPaieEnAttente}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('acomptes')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'acomptes'
              ? 'border-amber-500 text-amber-700 bg-amber-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Suivi Acomptes & Débours Caisse</span>
        </button>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, matricule, CNI, métier..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Chantier Filter */}
          <select
            value={selectedChantierFilter}
            onChange={(e) => setSelectedChantierFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="all">
              {isGlobalUser ? `Tous les chantiers (${chantiers.length})` : 'Tous mes chantiers'}
            </option>
            {userAllowedChantiers.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.nom}
              </option>
            ))}
          </select>

          {/* Trade Filter */}
          {activeSubTab === 'liste' && (
            <select
              value={selectedMetier}
              onChange={(e) => setSelectedMetier(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="all">Tous les corps de métier</option>
              <option value="macon_qualifie">Maçons</option>
              <option value="ferrailleur">Ferrailleurs</option>
              <option value="coffreur_bancheur">Coffreurs / Bancheurs</option>
              <option value="grutier_conducteur_engin">Grutiers</option>
              <option value="chef_chantier">Chefs de chantier</option>
              <option value="manoeuvre">Manœuvres</option>
              <option value="electricien_plombier">Électriciens / Plombiers</option>
              <option value="gardien_chantier">Gardiens</option>
              <option value="magasinier">Magasiniers</option>
            </select>
          )}

          {/* Contract Filter */}
          {activeSubTab === 'liste' && (
            <select
              value={selectedContrat}
              onChange={(e) => setSelectedContrat(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="all">Tous les régimes de contrat</option>
              <option value="journalier_quinzaine">Journaliers (Quinzaine)</option>
              <option value="mensuel_permanent">Mensuels Permanents</option>
              <option value="tache_rendement">À la tâche</option>
            </select>
          )}

          {/* Payroll status filter */}
          {activeSubTab === 'paie' && (
            <select
              value={statutPaieFilter}
              onChange={(e) => setStatutPaieFilter(e.target.value as any)}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="all">Tous les statuts de paie</option>
              <option value="en_attente">En attente de règlement</option>
              <option value="paye">Réglés & Émargés</option>
            </select>
          )}
        </div>
      </div>

      {/* SUB-TAB 1: LISTE DU PERSONNEL */}
      {activeSubTab === 'liste' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployes.map((emp) => {
            const metierCfg = CORPS_METIER_LABELS[emp.corpsMetier] || {
              label: emp.corpsMetier,
              color: 'text-slate-800',
              badgeBg: 'bg-slate-100 border-slate-200',
            };
            const contratCfg = CONTRAT_LABELS[emp.typeContrat] || {
              label: emp.typeContrat,
              badge: 'bg-slate-100 text-slate-700 border-slate-200',
            };
            const assignedChantier = chantiers.find((c) => c.id === emp.chantierId);

            return (
              <div
                key={emp.id}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Matricule & Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {emp.matricule}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        emp.statut === 'actif'
                          ? 'bg-emerald-100 text-emerald-800'
                          : emp.statut === 'conge'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {emp.statut === 'actif' ? 'En poste' : emp.statut}
                    </span>
                  </div>

                  {/* Name & Trade */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-800 font-black text-sm flex items-center justify-center shrink-0 border border-amber-500/20">
                      {emp.prenom[0]}
                      {emp.nom[0]}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {emp.prenom} {emp.nom}
                      </h3>
                      <div className="mt-0.5">
                        <span
                          className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded border ${metierCfg.badgeBg} ${metierCfg.color}`}
                        >
                          {metierCfg.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Qualification */}
                  <p className="text-xs text-slate-600 italic mb-4 line-clamp-1">
                    "{emp.specialiteLibelle}"
                  </p>

                  {/* Details Card */}
                  <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs mb-4">
                    {/* Assigned Chantier with Quick Transfer Button */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-amber-600" />
                        Chantier :
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 truncate max-w-[130px]">
                          {assignedChantier?.nom || 'Non affecté'}
                        </span>
                        <button
                          onClick={() => onOpenAffectationModal(emp)}
                          className="text-[10px] text-amber-700 font-bold hover:underline"
                          title="Modifier l'affectation de chantier"
                        >
                          [Changer]
                        </button>
                      </div>
                    </div>

                    {/* Contract & Rate */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                        Contrat :
                      </span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${contratCfg.badge}`}>
                        {contratCfg.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        Tarif / Base :
                      </span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        {emp.typeContrat === 'mensuel_permanent'
                          ? `${formatDZD(emp.salaireBaseMensuelDZD || 0)}/mois`
                          : `${formatDZD(emp.tarifJournalierDZD || 0)}/jour`}
                      </span>
                    </div>

                    {/* Phone & CNI */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                      <span>CNI : {emp.cniNumero || '-'}</span>
                      <span className="font-mono">{emp.telephone}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => onOpenBulletinPaieModal(emp.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-2xs"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    Établir Paie
                  </button>

                  <button
                    onClick={() => onOpenEmployeModal(emp)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                    title="Modifier la fiche"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`Confirmer la suppression du collaborateur ${emp.prenom} ${emp.nom} ?`)) {
                        deleteEmploye(emp.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUB-TAB 2: MATRICE D'AFFECTATION MULTI-CHANTIERS */}
      {activeSubTab === 'affectations' && (
        <div className="space-y-6">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-950 flex items-start gap-3">
            <Building2 className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-950">
                Déploiement Opérationnel du Personnel Multi-Chantiers
              </h4>
              <p className="text-amber-800 mt-0.5">
                Visualisez la répartition des ouvriers par chantier, équilibrez les équipes entre gros œuvre, coffrage, ferraillage et finitions, et effectuez des transferts immédiats.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {employesParChantier.map(({ chantier, employes: crew, totalOuvriers, journaliers, permanents }) => (
              <div
                key={chantier.id}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between"
              >
                {/* Site Header */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{chantier.nom}</h3>
                        <span className="text-xs font-mono px-2 py-0.5 bg-slate-200 text-slate-800 rounded font-bold">
                          {chantier.wilaya}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Chef de Chantier : <strong>{chantier.chefChantier}</strong> ({chantier.chefChantierTel})
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-black font-mono text-slate-900">{totalOuvriers}</span>
                      <span className="text-xs text-slate-500 block">ouvriers sur site</span>
                    </div>
                  </div>

                  {/* Breakdown badges */}
                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-600">
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-semibold rounded text-[11px]">
                      {journaliers} Journaliers / Quinzaine
                    </span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-semibold rounded text-[11px]">
                      {permanents} Permanents mensuels
                    </span>
                  </div>
                </div>

                {/* Crew List on Site */}
                <div className="p-5 flex-1 space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Personnel affecté sur ce chantier :
                  </h4>

                  {crew.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      Aucun ouvrier actuellement affecté sur ce chantier.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {crew.map((emp) => {
                        const metierCfg = CORPS_METIER_LABELS[emp.corpsMetier] || {
                          label: emp.corpsMetier,
                          color: 'text-slate-800',
                          badgeBg: 'bg-slate-100 border-slate-200',
                        };

                        return (
                          <div
                            key={emp.id}
                            className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-200 transition-colors text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="font-mono text-[10px] text-slate-400 font-bold">
                                {emp.matricule}
                              </span>
                              <span className="font-bold text-slate-900 truncate">
                                {emp.prenom} {emp.nom}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${metierCfg.badgeBg} ${metierCfg.color}`}
                              >
                                {metierCfg.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-mono text-[11px] text-slate-500">
                                {emp.typeContrat === 'mensuel_permanent'
                                  ? `${formatDZD(emp.salaireBaseMensuelDZD || 0)}`
                                  : `${formatDZD(emp.tarifJournalierDZD || 0)}/j`}
                              </span>
                              <button
                                onClick={() => onOpenAffectationModal(emp)}
                                className="px-2 py-1 text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded transition-colors"
                                title="Muter vers un autre chantier"
                              >
                                Muter
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Site Deployment Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Avancement chantier : <strong>{chantier.avancementPourcentage}%</strong>
                  </span>
                  <button
                    onClick={() => onOpenAffectationModal(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-600" />
                    + Affecter un ouvrier ici
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: BORDEREAUX DE PAIE & QUINZAINES */}
      {activeSubTab === 'paie' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Bordereaux de Paie & Quinzaines Ouvriers ({filteredBulletins.length})
              </h3>
              <button
                onClick={() => onOpenBulletinPaieModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                + Établir Bulletin de Paie
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Référence</th>
                    <th className="py-3 px-4">Salarié / Métier</th>
                    <th className="py-3 px-4">Chantier</th>
                    <th className="py-3 px-4">Période</th>
                    <th className="py-3 px-4 text-center">Jours</th>
                    <th className="py-3 px-4 text-right">Base / Taux</th>
                    <th className="py-3 px-4 text-right">Primes & Supp</th>
                    <th className="py-3 px-4 text-right">Acomptes Déd.</th>
                    <th className="py-3 px-4 text-right font-black">Net à Payer</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredBulletins.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400 italic">
                        Aucun bordereau de paie ne correspond aux filtres.
                      </td>
                    </tr>
                  ) : (
                    filteredBulletins.map((bp) => {
                      const metierCfg = CORPS_METIER_LABELS[bp.corpsMetier] || {
                        label: bp.corpsMetier,
                        color: 'text-slate-800',
                        badgeBg: 'bg-slate-100',
                      };

                      return (
                        <tr key={bp.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-600 whitespace-nowrap">
                            {bp.reference}
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block truncate max-w-[150px]">
                              {bp.employeNom}
                            </span>
                            <span className={`text-[10px] font-semibold ${metierCfg.color}`}>
                              {metierCfg.label}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                            {bp.chantierNom}
                          </td>

                          <td className="py-3 px-4 text-slate-700 whitespace-nowrap font-medium">
                            {bp.periodeMois}
                          </td>

                          <td className="py-3 px-4 text-center font-mono font-bold tabular-nums">
                            {bp.joursTravailles} j
                          </td>

                          <td className="py-3 px-4 text-right font-mono text-slate-600 tabular-nums">
                            {formatDZD(bp.salaireBaseDZD)}
                          </td>

                          <td className="py-3 px-4 text-right font-mono text-emerald-700 tabular-nums">
                            +{formatDZD((bp.primePanierTransportDZD || 0) + (bp.heuresSupplementairesDZD || 0))}
                          </td>

                          <td className="py-3 px-4 text-right font-mono text-red-600 tabular-nums">
                            {bp.avancesAcomptesDeduitesDZD > 0
                              ? `-${formatDZD(bp.avancesAcomptesDeduitesDZD)}`
                              : '-'}
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900 text-sm tabular-nums">
                            {formatDZD(bp.netAPayerDZD)}
                          </td>

                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {bp.statut === 'paye' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3" />
                                Payé
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                                <Clock className="w-3 h-3" />
                                En attente
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              {bp.statut === 'en_attente' && (
                                <button
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        `Régler immédiatement le bordereau de ${bp.employeNom} (${formatDZD(bp.netAPayerDZD)}) via la caisse du chantier ?`
                                      )
                                    ) {
                                      reglerBulletinPaie(bp.id);
                                    }
                                  }}
                                  className="px-2.5 py-1 text-[11px] font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded shadow-2xs transition-colors"
                                  title="Débiter la caisse et valider le paiement"
                                >
                                  Régler
                                </button>
                              )}

                              <button
                                onClick={() => openPrintBulletinPaie(bp)}
                                className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors"
                                title="Imprimer le bulletin de paie et bon d'émargement"
                              >
                                <Printer className="w-3 h-3 text-slate-600" />
                                Imprimer
                              </button>

                              <button
                                onClick={() => {
                                  const emp = employes.find((e) => e.id === bp.employeId);
                                  const doc = exportBulletinIndividuelPDF(bp, emp);
                                  doc.save(
                                    `Bulletin_Paie_${bp.reference}_${bp.employeNom.replace(/\s+/g, '_')}.pdf`
                                  );
                                }}
                                className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 rounded border border-amber-300 transition-colors"
                                title="Télécharger directement le bulletin au format PDF"
                              >
                                <FileDown className="w-3 h-3 text-amber-700" />
                                PDF
                              </button>
                            </div>
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
      )}

      {/* SUB-TAB 4: SUIVI ACOMPTES & DÉBOURS */}
      {activeSubTab === 'acomptes' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 flex items-start gap-3">
            <FileCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-blue-950">
                Principe de Gestion des Acomptes & Avances de Chantier en Algérie
              </h4>
              <p className="text-blue-800 mt-0.5">
                Sur les chantiers de bâtiment en Algérie, les chefs de chantier délivrent couramment des avances sur salaire depuis leur caisse de fond de roulement en espèces (Bon de Caisse). Lors de l'arrêté de quinzaine, ces avances sont automatiquement imputées en déduction du Net à Payer.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                Récapitulatif des Déductions d'Acomptes sur la Paie
              </h3>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-xs text-slate-500 block mb-1">Total Acomptes Déduits</span>
                  <span className="text-xl font-bold font-mono text-red-600 tabular-nums">
                    {formatDZD(totalAvancesDeduites)}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-xs text-slate-500 block mb-1">Nombre d'Ouvriers Concernés</span>
                  <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                    {bulletinsPaie.filter((b) => b.avancesAcomptesDeduitesDZD > 0).length} ouvriers
                  </span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-xs text-slate-500 block mb-1">Impact sur Trésorerie Caisse</span>
                  <span className="text-xs text-slate-600 font-medium">
                    Régularisé automatiquement sur les bons de décaissement de quinzaine.
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-2.5 px-4">Salarié</th>
                      <th className="py-2.5 px-4">Chantier</th>
                      <th className="py-2.5 px-4">Période du Décompte</th>
                      <th className="py-2.5 px-4 text-right">Salaire Brut</th>
                      <th className="py-2.5 px-4 text-right">Acompte Retenu</th>
                      <th className="py-2.5 px-4 text-right">Net Final Réglé</th>
                      <th className="py-2.5 px-4 text-center">Bon Caisse Émis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {bulletinsPaie
                      .filter((b) => b.avancesAcomptesDeduitesDZD > 0)
                      .map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-bold text-slate-900">{b.employeNom}</td>
                          <td className="py-2.5 px-4 text-slate-600">{b.chantierNom}</td>
                          <td className="py-2.5 px-4 font-medium">{b.periodeMois}</td>
                          <td className="py-2.5 px-4 text-right font-mono text-slate-700">
                            {formatDZD(b.salaireBaseDZD + b.primePanierTransportDZD + b.heuresSupplementairesDZD)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-red-600">
                            -{formatDZD(b.avancesAcomptesDeduitesDZD)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-black text-slate-900">
                            {formatDZD(b.netAPayerDZD)}
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono text-slate-500">
                            {b.bonCaisseNumero || 'BC-PAY-AUTO'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
