import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Materiel, CategorieMateriel, StatutMateriel, TypeAcquisitionMateriel } from '../types';
import {
  Truck,
  Plus,
  ArrowRightLeft,
  Wrench,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Fuel,
  ShieldCheck,
  Gauge,
  Phone,
  User,
  LayoutGrid,
  List,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  formatDZD,
  formatDateFR,
  CATEGORIE_MATERIEL_LABELS,
  STATUT_MATERIEL_LABELS,
  TYPE_INTERVENTION_LABELS,
} from '../utils/formatters';

interface Props {
  onOpenMaterielModal: (materiel?: Materiel | null, defaultChantierId?: string | null) => void;
  onOpenTransfertModal: (materielId?: string) => void;
  onOpenMaintenanceModal: (materielId?: string, defaultType?: any) => void;
}

export const MaterielView: React.FC<Props> = ({
  onOpenMaterielModal,
  onOpenTransfertModal,
  onOpenMaintenanceModal,
}) => {
  const {
    materiels,
    transfertsMateriel,
    maintenancesMateriel,
    chantiers,
    activeChantierId,
    deleteMateriel,
    declarerPanne,
    currentUser,
  } = useApp();

  const isGlobalUser =
    currentUser.role === 'superadmin' ||
    currentUser.role === 'directeur_promoteur' ||
    currentUser.chantiersAssignes.includes('*');

  const userAllowedChantiers = isGlobalUser
    ? chantiers
    : chantiers.filter((c) => currentUser.chantiersAssignes.includes(c.id));

  const [activeSubTab, setActiveSubTab] = useState<'parc' | 'transferts' | 'maintenance'>('parc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChantierFilter, setSelectedChantierFilter] = useState<string>(activeChantierId || 'all');
  const [selectedCategorieFilter, setSelectedCategorieFilter] = useState<string>('all');
  const [selectedStatutFilter, setSelectedStatutFilter] = useState<string>('all');
  const [selectedAcquisitionFilter, setSelectedAcquisitionFilter] = useState<string>('all');

  // Keep filter in sync with global activeChantierId if changed from header
  React.useEffect(() => {
    if (activeChantierId) {
      setSelectedChantierFilter(activeChantierId);
    }
  }, [activeChantierId]);

  const visibleMateriels = useMemo(() => {
    return isGlobalUser
      ? materiels
      : materiels.filter((m) => m.chantierId && currentUser.chantiersAssignes.includes(m.chantierId));
  }, [materiels, isGlobalUser, currentUser.chantiersAssignes]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = visibleMateriels.length;
    const propres = visibleMateriels.filter((m) => m.typeAcquisition === 'propre').length;
    const locations = visibleMateriels.filter((m) => m.typeAcquisition === 'location').length;
    const actifs = visibleMateriels.filter((m) => m.statut === 'en_service').length;
    const disponibles = visibleMateriels.filter((m) => m.statut === 'disponible').length;
    const enPanneOuMaintenance = visibleMateriels.filter(
      (m) => m.statut === 'en_panne' || m.statut === 'en_maintenance'
    ).length;

    // Daily active rental costs
    const coutQuotidienLocation = visibleMateriels
      .filter((m) => m.typeAcquisition === 'location' && m.statut === 'en_service')
      .reduce((acc, m) => acc + (m.coutLocationJournalierDZD || 0), 0);

    // Total maintenance expenditure
    const totalMaintenanceDepenses = maintenancesMateriel.reduce(
      (acc, m) => acc + (m.coutTotalDZD || 0),
      0
    );

    return {
      total,
      propres,
      locations,
      actifs,
      disponibles,
      enPanneOuMaintenance,
      coutQuotidienLocation,
      totalMaintenanceDepenses,
    };
  }, [visibleMateriels, maintenancesMateriel]);

  // Filtered equipment list
  const filteredMateriels = useMemo(() => {
    return visibleMateriels.filter((mat) => {
      // Chantier filter
      if (selectedChantierFilter !== 'all') {
        if (selectedChantierFilter === 'depot') {
          if (mat.chantierId !== null) return false;
        } else if (mat.chantierId !== selectedChantierFilter) {
          return false;
        }
      }

      // Category filter
      if (selectedCategorieFilter !== 'all' && mat.categorie !== selectedCategorieFilter) {
        return false;
      }

      // Status filter
      if (selectedStatutFilter !== 'all' && mat.statut !== selectedStatutFilter) {
        return false;
      }

      // Acquisition filter
      if (selectedAcquisitionFilter !== 'all' && mat.typeAcquisition !== selectedAcquisitionFilter) {
        return false;
      }

      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = mat.nom.toLowerCase().includes(query);
        const matchCode = mat.code.toLowerCase().includes(query);
        const matchBrand = mat.marqueModele.toLowerCase().includes(query);
        const matchImmat = mat.immatriculation.toLowerCase().includes(query);
        const matchConducteur = mat.conducteurNom?.toLowerCase().includes(query);
        const matchChantier = mat.chantierNom?.toLowerCase().includes(query);
        if (!matchName && !matchCode && !matchBrand && !matchImmat && !matchConducteur && !matchChantier) {
          return false;
        }
      }

      return true;
    });
  }, [
    materiels,
    selectedChantierFilter,
    selectedCategorieFilter,
    selectedStatutFilter,
    selectedAcquisitionFilter,
    searchQuery,
  ]);

  // Helper for CTC urgency
  const getCTCUrgency = (dueDate?: string) => {
    if (!dueDate) return null;
    const due = new Date(dueDate).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'overdue', label: 'CTC Expiré !', color: 'text-red-700 bg-red-100 border-red-200' };
    }
    if (diffDays <= 30) {
      return { status: 'urgent', label: `CTC dans ${diffDays}j`, color: 'text-amber-800 bg-amber-100 border-amber-300' };
    }
    return { status: 'ok', label: `CTC : ${formatDateFR(dueDate)}`, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <Truck className="w-5 h-5" />
            </div>
            Gestion du Parc Engins & Matériel
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Suivi des engins lourds, matériel de levage, béton, transferts inter-chantiers, contrôles CTC et carnet d'entretien
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenTransfertModal()}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium transition shadow-sm flex items-center gap-2"
          >
            <ArrowRightLeft className="w-4 h-4 text-blue-600" />
            <span>Transférer un Engin</span>
          </button>

          <button
            onClick={() => onOpenMaintenanceModal()}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium transition shadow-sm flex items-center gap-2"
          >
            <Wrench className="w-4 h-4 text-emerald-600" />
            <span>Entretien / CTC</span>
          </button>

          <button
            onClick={() => onOpenMaterielModal(null, activeChantierId)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold transition shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvel Engin</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Total Engins */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Parc Total</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span><strong className="text-slate-700">{stats.propres}</strong> propres</span>
            <span>•</span>
            <span><strong className="text-amber-700">{stats.locations}</strong> en location</span>
          </div>
        </div>

        {/* Actifs sur Chantiers */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Sur Chantiers</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{stats.actifs}</div>
          <p className="text-xs text-slate-500 mt-1">En exploitation active</p>
        </div>

        {/* Disponibles au Dépôt */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider">Au Dépôt Central</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-sky-600">{stats.disponibles}</div>
          <p className="text-xs text-slate-500 mt-1">Prêts pour réaffectation</p>
        </div>

        {/* En Panne / Maintenance */}
        <div className={`p-4 rounded-2xl border shadow-xs ${stats.enPanneOuMaintenance > 0 ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-slate-200/80'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">En Panne / Révision</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700">{stats.enPanneOuMaintenance}</div>
          <p className="text-xs text-slate-500 mt-1">Nécessite intervention</p>
        </div>

        {/* Coût Location Quotidien */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Location / Jour</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-indigo-700">{formatDZD(stats.coutQuotidienLocation, false)} <span className="text-xs font-normal">DA</span></div>
          <p className="text-xs text-slate-500 mt-1">Total engins loués actifs</p>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveSubTab('parc')}
            className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
              activeSubTab === 'parc'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Parc d'Engins & Équipements ({filteredMateriels.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('transferts')}
            className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
              activeSubTab === 'transferts'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Mouvements & Bons de Transfert ({transfertsMateriel.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('maintenance')}
            className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
              activeSubTab === 'maintenance'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Carnet d'Entretien & Contrôles CTC ({maintenancesMateriel.length})</span>
          </button>
        </div>

        {activeSubTab === 'parc' && (
          <div className="hidden sm:flex items-center gap-1 pb-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg border text-sm transition ${
                viewMode === 'grid'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-white text-slate-400 border-slate-200 hover:text-slate-700'
              }`}
              title="Vue Grille"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg border text-sm transition ${
                viewMode === 'table'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-white text-slate-400 border-slate-200 hover:text-slate-700'
              }`}
              title="Vue Tableau"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: PARC ENGINS */}
      {activeSubTab === 'parc' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Rechercher par engin, code, marque, matricule ou chauffeur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Chantier Filter */}
              <select
                value={selectedChantierFilter}
                onChange={(e) => setSelectedChantierFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 bg-white outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">Tous les chantiers & dépôt</option>
                <option value="depot">Dépôt Central & Parc Sidi Moussa</option>
                {chantiers.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.nom}
                  </option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategorieFilter}
                onChange={(e) => setSelectedCategorieFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 bg-white outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">Toutes les catégories</option>
                {Object.entries(CATEGORIE_MATERIEL_LABELS).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatutFilter}
                onChange={(e) => setSelectedStatutFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 bg-white outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="en_service">En service</option>
                <option value="disponible">Disponible (Dépôt)</option>
                <option value="en_maintenance">En maintenance</option>
                <option value="en_panne">En panne</option>
              </select>

              {/* Acquisition Filter */}
              <select
                value={selectedAcquisitionFilter}
                onChange={(e) => setSelectedAcquisitionFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 bg-white outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">Tous (Propre & Location)</option>
                <option value="propre">Matériel Propre</option>
                <option value="location">En Location</option>
              </select>
            </div>
          </div>

          {/* Cards Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMateriels.map((mat) => {
                const ctcUrgency = getCTCUrgency(mat.prochaineVisiteCTCDueDate);
                const statusMeta = STATUT_MATERIEL_LABELS[mat.statut] || STATUT_MATERIEL_LABELS.en_service;
                const catMeta = CATEGORIE_MATERIEL_LABELS[mat.categorie] || CATEGORIE_MATERIEL_LABELS.engin_lourd;

                return (
                  <div
                    key={mat.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition overflow-hidden flex flex-col justify-between"
                  >
                    {/* Card Top */}
                    <div className="p-5 space-y-3.5">
                      {/* Badge line */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${catMeta.badgeBg} ${catMeta.color}`}>
                          {mat.code}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusMeta.badge}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotColor}`} />
                            {statusMeta.label}
                          </span>
                        </div>
                      </div>

                      {/* Title & Brand */}
                      <div>
                        <h4 className="font-bold text-slate-900 text-base leading-snug">{mat.nom}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{mat.marqueModele}</p>
                      </div>

                      {/* Location & Ownership Info */}
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            Affectation :
                          </span>
                          <span className="font-semibold text-slate-800 text-right">
                            {mat.chantierNom || 'Parc Central & Dépôt Sidi Moussa'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Régime :</span>
                          {mat.typeAcquisition === 'propre' ? (
                            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                              PROPRIÉTÉ SOCIÉTÉ
                            </span>
                          ) : (
                            <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                              LOCATION : {formatDZD(mat.coutLocationJournalierDZD || 0, false)} DA/j
                            </span>
                          )}
                        </div>

                        {mat.immatriculation && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Matricule / N° Parc :</span>
                            <span className="font-mono font-medium text-slate-700">{mat.immatriculation}</span>
                          </div>
                        )}
                      </div>

                      {/* Driver & Meter Details */}
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div className="bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                          <div className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                            <Gauge className="w-3 h-3 text-slate-400" />
                            Compteur
                          </div>
                          <div className="font-bold text-slate-800 mt-0.5 text-sm">
                            {mat.compteurHeuresKm.toLocaleString()} {mat.uniteCompteur}
                          </div>
                        </div>

                        <div className="bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                          <div className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            Conducteur
                          </div>
                          <div className="font-semibold text-slate-800 mt-0.5 truncate" title={mat.conducteurNom}>
                            {mat.conducteurNom || 'Non assigné'}
                          </div>
                        </div>
                      </div>

                      {/* CTC Certificate Badge */}
                      {ctcUrgency && (
                        <div className={`p-2 rounded-lg border text-xs flex items-center justify-between ${ctcUrgency.color}`}>
                          <div className="flex items-center gap-1.5 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Contrôle CTC Levage</span>
                          </div>
                          <span className="font-bold text-[11px]">{ctcUrgency.label}</span>
                        </div>
                      )}

                      {/* Observations snippet if any */}
                      {mat.observations && (
                        <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-2">
                          "{mat.observations}"
                        </p>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onOpenTransfertModal(mat.id)}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-blue-700 font-semibold rounded-lg transition flex items-center gap-1 shadow-2xs"
                          title="Transférer vers un autre chantier"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          <span>Transférer</span>
                        </button>

                        <button
                          onClick={() => onOpenMaintenanceModal(mat.id)}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-emerald-700 font-semibold rounded-lg transition flex items-center gap-1 shadow-2xs"
                          title="Enregistrer un entretien ou visite CTC"
                        >
                          <Wrench className="w-3 h-3" />
                          <span>Entretien</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        {mat.statut !== 'en_panne' && (
                          <button
                            onClick={() => {
                              const reason = prompt(`Motif du signalement de panne pour ${mat.nom} :`);
                              if (reason) declarerPanne(mat.id, reason);
                            }}
                            className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition"
                            title="Signaler panne"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => onOpenMaterielModal(mat)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition"
                          title="Modifier la fiche"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Confirmez-vous la suppression de l'engin ${mat.nom} (${mat.code}) ?`)) {
                              deleteMateriel(mat.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Supprimer du parc"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredMateriels.length === 0 && (
                <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-8">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                    <Truck className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-slate-800">Aucun engin ou matériel trouvé</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Aucun équipement ne correspond aux filtres appliqués. Modifiez vos critères de recherche ou enregistrez un nouvel engin.
                  </p>
                  <button
                    onClick={() => onOpenMaterielModal(null, activeChantierId)}
                    className="mt-4 px-4 py-2 bg-amber-600 text-white text-xs font-semibold rounded-xl hover:bg-amber-700 transition"
                  >
                    Ajouter un premier engin
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Code & Désignation</th>
                      <th className="py-3 px-4">Catégorie</th>
                      <th className="py-3 px-4">Affectation</th>
                      <th className="py-3 px-4">Propriété</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4">Compteur</th>
                      <th className="py-3 px-4">Conducteur</th>
                      <th className="py-3 px-4">Contrôle CTC</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredMateriels.map((mat) => {
                      const ctcUrgency = getCTCUrgency(mat.prochaineVisiteCTCDueDate);
                      const statusMeta = STATUT_MATERIEL_LABELS[mat.statut] || STATUT_MATERIEL_LABELS.en_service;
                      const catMeta = CATEGORIE_MATERIEL_LABELS[mat.categorie] || CATEGORIE_MATERIEL_LABELS.engin_lourd;

                      return (
                        <tr key={mat.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{mat.nom}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {mat.code} • {mat.immatriculation || mat.marqueModele}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${catMeta.badgeBg} ${catMeta.color}`}>
                              {catMeta.label}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800">
                              {mat.chantierNom || 'Parc Central & Dépôt Sidi Moussa'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {mat.typeAcquisition === 'propre' ? (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-emerald-200">
                                Propre
                              </span>
                            ) : (
                              <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-amber-200">
                                Location ({formatDZD(mat.coutLocationJournalierDZD || 0, false)} DA/j)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusMeta.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotColor}`} />
                              {statusMeta.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                            {mat.compteurHeuresKm.toLocaleString()} {mat.uniteCompteur}
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {mat.conducteurNom || <span className="text-slate-400 italic">Non assigné</span>}
                          </td>
                          <td className="py-3 px-4">
                            {ctcUrgency ? (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ctcUrgency.color}`}>
                                {ctcUrgency.label}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => onOpenTransfertModal(mat.id)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Transférer"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onOpenMaintenanceModal(mat.id)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                title="Entretien"
                              >
                                <Wrench className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onOpenMaterielModal(mat)}
                                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                                title="Modifier"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Supprimer ${mat.nom} ?`)) deleteMateriel(mat.id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TRANSFERTS INTER-CHANTIERS */}
      {activeSubTab === 'transferts' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Registre des Bons de Transfert & Mouvements</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Historique des déplacements d'engins lourds, grues et outillages entre chantiers et parc central
              </p>
            </div>
            <button
              onClick={() => onOpenTransfertModal()}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouveau Transfert</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">N° Bon & Date</th>
                    <th className="py-3 px-4">Matériel & Code</th>
                    <th className="py-3 px-4">Chantier Départ</th>
                    <th className="py-3 px-4">Destination</th>
                    <th className="py-3 px-4">Transporteur / Porte-char</th>
                    <th className="py-3 px-4">Compteur</th>
                    <th className="py-3 px-4">Motif & Justification</th>
                    <th className="py-3 px-4">Validé Par</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {transfertsMateriel.map((trf) => (
                    <tr key={trf.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <span className="font-bold font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {trf.bonTransfertNumero}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateFR(trf.date)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{trf.materielNom}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{trf.codeMateriel}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <span className="font-medium text-slate-800">{trf.chantierDepartNom}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-blue-800 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-200/60">
                          {trf.chantierDestinationNom}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {trf.transporteur}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                        {trf.compteurAuDepart.toLocaleString()} h
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs">
                        <p className="line-clamp-2" title={trf.motif}>
                          {trf.motif}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium">
                        {trf.validePar}
                      </td>
                    </tr>
                  ))}
                  {transfertsMateriel.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Aucun bon de transfert enregistré
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CARNET D'ENTRETIEN & CTC */}
      {activeSubTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Carnet d'Entretien, Réparations, CTC & Carburant</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Total des dépenses d'entretien enregistrées :{' '}
                <strong className="text-emerald-700 font-semibold">{formatDZD(stats.totalMaintenanceDepenses)}</strong>
              </p>
            </div>
            <button
              onClick={() => onOpenMaintenanceModal()}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouvelle Intervention</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Date & N° Bon</th>
                    <th className="py-3 px-4">Engin / Matériel</th>
                    <th className="py-3 px-4">Type Intervention</th>
                    <th className="py-3 px-4">Détail des Travaux</th>
                    <th className="py-3 px-4">Prestataire / Atelier</th>
                    <th className="py-3 px-4">Compteur</th>
                    <th className="py-3 px-4">Coût (DA)</th>
                    <th className="py-3 px-4">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {maintenancesMateriel.map((mnt) => {
                    const typeMeta = TYPE_INTERVENTION_LABELS[mnt.typeIntervention] || {
                      label: mnt.typeIntervention,
                      badge: 'bg-slate-100 text-slate-700 border-slate-200',
                    };

                    return (
                      <tr key={mnt.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{formatDateFR(mnt.date)}</div>
                          {mnt.bonCaisseNumero && (
                            <div className="font-mono text-[10px] text-emerald-700 mt-0.5">
                              {mnt.bonCaisseNumero}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{mnt.materielNom}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${typeMeta.badge}`}>
                            {typeMeta.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-sm">
                          <p className="line-clamp-2" title={mnt.description}>
                            {mnt.description}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {mnt.technicienPrestataire}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                          {mnt.heuresCompteur.toLocaleString()} h
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {formatDZD(mnt.coutTotalDZD)}
                        </td>
                        <td className="py-3 px-4">
                          {mnt.statut === 'termine' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Terminé
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              En cours
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {maintenancesMateriel.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Aucune intervention d'entretien enregistrée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
