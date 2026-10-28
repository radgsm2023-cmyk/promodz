import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BeneficiaireVSP, LogementLot, StatutLogement, StatutDossierBeneficiaire } from '../types';
import { formatDZD, formatDateFR } from '../utils/formatters';
import {
  Home,
  Users,
  Search,
  Plus,
  FileText,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Building,
  ShieldCheck,
  CreditCard,
  UserCheck,
  Key,
  Eye,
  MapPin,
  TrendingUp,
  PieChart,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { VspClientDashboard } from './VspClientDashboard';
import { NewBeneficiaireModal } from './NewBeneficiaireModal';
import { NewLotModal } from './NewLotModal';

export const BeneficiairesView: React.FC = () => {
  const {
    beneficiaires,
    logements,
    chantiers,
    userAllowedChantiers,
    isChantierAllowed,
    isGlobalUser,
    setPrintVoucher,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'beneficiaires' | 'logements' | 'tableau_de_bord_vsp'>('tableau_de_bord_vsp');
  const [selectedChantierId, setSelectedChantierId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatutFilter, setSelectedStatutFilter] = useState<string>('all');
  const [selectedBeneficiaire, setSelectedBeneficiaire] = useState<BeneficiaireVSP | null>(null);
  const [isNewBeneficiaireModalOpen, setIsNewBeneficiaireModalOpen] = useState(false);
  const [isNewLotModalOpen, setIsNewLotModalOpen] = useState(false);

  // Allowed subsets
  const allowedBeneficiaires = beneficiaires.filter((b) => isChantierAllowed(b.chantierId));
  const allowedLogements = logements.filter((l) => isChantierAllowed(l.chantierId));

  // Filtered beneficiaries
  const filteredBeneficiaires = allowedBeneficiaires.filter((b) => {
    const matchChantier = selectedChantierId === 'all' || b.chantierId === selectedChantierId;
    const matchSearch =
      b.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.logementNumero.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.nin.includes(searchQuery);
    const matchStatut = selectedStatutFilter === 'all' || b.statutDossier === selectedStatutFilter;
    return matchChantier && matchSearch && matchStatut;
  });

  // Filtered logements
  const filteredLogements = allowedLogements.filter((l) => {
    const matchChantier = selectedChantierId === 'all' || l.chantierId === selectedChantierId;
    const matchSearch =
      l.numeroLot.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.bloc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.beneficiaireNom && l.beneficiaireNom.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchStatut = selectedStatutFilter === 'all' || l.statut === selectedStatutFilter;
    return matchChantier && matchSearch && matchStatut;
  });

  // Global KPIs (scoped)
  const totalLogements = allowedLogements.length;
  const totalVendus = allowedLogements.filter((l) => l.statut === 'vendu_vsp' || l.statut === 'livre').length;
  const totalReserves = allowedLogements.filter((l) => l.statut === 'reserve').length;
  const totalDisponibles = allowedLogements.filter((l) => l.statut === 'disponible').length;

  const totalEncaisseGlobal = allowedBeneficiaires.reduce((acc, b) => acc + b.totalEncaisseDZD, 0);
  const totalRestantGlobal = allowedBeneficiaires.reduce((acc, b) => acc + b.soldeRestantDZD, 0);

  // Project-wise VSP Analytics
  const projectVSPAnalytics = userAllowedChantiers.map((ch) => {
    const chLogements = logements.filter((l) => l.chantierId === ch.id);
    const chBeneficiaires = beneficiaires.filter((b) => b.chantierId === ch.id);
    const totalLotsCh = chLogements.length;
    const vendusCh = chLogements.filter((l) => l.statut === 'vendu_vsp' || l.statut === 'livre' || l.statut === 'reserve').length;
    const tauxCommercialisation = totalLotsCh > 0 ? Math.round((vendusCh / totalLotsCh) * 100) : 0;

    const encaisseCh = chBeneficiaires.reduce((acc, b) => acc + b.totalEncaisseDZD, 0) || Math.round(ch.recettesEncaisseesDZD);
    const caPrevisionnelCh = chBeneficiaires.reduce((acc, b) => acc + (b.prixTotalCessionDZD || 0), 0) || Math.round(ch.budgetTotalDZD * 1.35);
    const resteARecouvrerCh = Math.max(0, caPrevisionnelCh - encaisseCh);
    const tauxRecouvrementCh = caPrevisionnelCh > 0 ? Math.round((encaisseCh / caPrevisionnelCh) * 100) : 0;

    return {
      chantier: ch,
      totalLots: totalLotsCh,
      vendus: vendusCh,
      tauxCommercialisation,
      encaisseDZD: encaisseCh,
      caPrevisionnelDZD: caPrevisionnelCh,
      resteARecouvrerDZD: resteARecouvrerCh,
      tauxRecouvrement: tauxRecouvrementCh,
      beneficiairesCount: chBeneficiaires.length,
    };
  });

  // Cash flow forecast from tranches (scoped)
  const allTranches = allowedBeneficiaires.flatMap((b) => b.echeancierVSP || []);
  const tranchesReglees = allTranches.filter((t) => t.statut === 'regle').reduce((acc, t) => acc + t.montantPayeDZD, 0);
  const tranchesAVenir = allTranches.filter((t) => t.statut === 'a_venir' || t.statut === 'partiel').reduce((acc, t) => acc + (t.montantDZD - t.montantPayeDZD), 0);
  const tranchesRetard = allTranches.filter((t) => t.statut === 'en_retard').reduce((acc, t) => acc + (t.montantDZD - t.montantPayeDZD), 0);

  const getStatutLogementBadge = (statut: StatutLogement) => {
    switch (statut) {
      case 'disponible':
        return <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded text-xs">Disponible</span>;
      case 'reserve':
        return <span className="text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded text-xs">Réservé</span>;
      case 'vendu_vsp':
        return <span className="text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded text-xs">Vendu VSP</span>;
      case 'livre':
        return <span className="text-purple-700 font-medium bg-purple-50 px-2 py-0.5 rounded text-xs">Livré & Clés Remises</span>;
      case 'bloque':
        return <span className="text-rose-700 font-medium bg-rose-50 px-2 py-0.5 rounded text-xs">Bloqué / Contentieux</span>;
    }
  };

  const getStatutDossierBadge = (statut: StatutDossierBeneficiaire) => {
    switch (statut) {
      case 'prospect_interesse':
        return <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-xs font-medium">Prospect</span>;
      case 'reservation_signee':
        return <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs font-medium">Réservation Signée</span>;
      case 'contrat_vsp_notarie':
        return <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs font-medium">Contrat VSP Notarié</span>;
      case 'en_cours_paiement':
        return <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs font-medium">En Cours de Paiement</span>;
      case 'livre_cles_remises':
        return <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs font-medium">Livré (Clés Remises)</span>;
      case 'desiste':
        return <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-xs font-medium">Désisté / Remboursé</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm mb-1">
            <Building className="w-4 h-4" />
            <span>Promotion Immobilière & Vente sur Plan (Loi 11-04)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Bénéficiaires & Lots Appartements VSP</h1>
          <p className="text-slate-500 text-sm">
            Gestion notariale des acquéreurs, dossiers d'identification (NIN/CNI), échéanciers de tranches, garanties FGCMPI et suivi des clés.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNewLotModalOpen(true)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un Lot</span>
          </button>
          <button
            onClick={() => setIsNewBeneficiaireModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>Nouvel Acquéreur VSP</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Total Lots / Unités</span>
            <Home className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalLogements}</div>
          <div className="text-xs text-slate-500 mt-1">
            {totalDisponibles} disponibles · {totalReserves} réservés
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Unités Vendues / Livrées</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{totalVendus}</div>
          <div className="text-xs text-slate-500 mt-1">
            {((totalVendus / (totalLogements || 1)) * 100).toFixed(0)}% du portefeuille commercialisé
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Total Encaissé VSP</span>
            <CreditCard className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-blue-600 font-mono">
            {(totalEncaisseGlobal / 1000000).toFixed(1)} <span className="text-xs">M DZD</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Fonds reçus en caisse / banques</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Restant à Recouvrer</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600 font-mono">
            {(totalRestantGlobal / 1000000).toFixed(1)} <span className="text-xs">M DZD</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Tranches en attente d'échéance</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Garantie Achèvement</span>
            <ShieldCheck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-lg font-bold text-purple-700">FGCMPI Conforme</div>
          <div className="text-xs text-slate-500 mt-1">Loi 11-04 applicable</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Filters Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('tableau_de_bord_vsp')}
            className={`px-4 py-2 font-medium rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'tableau_de_bord_vsp'
                ? 'bg-slate-900 text-amber-400 shadow-sm font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Tableau de Bord VSP & Trésorerie</span>
          </button>

          <button
            onClick={() => setActiveSubTab('beneficiaires')}
            className={`px-4 py-2 font-medium rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'beneficiaires'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Acquéreurs & Dossiers VSP ({beneficiaires.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('logements')}
            className={`px-4 py-2 font-medium rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'logements'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Plan de Masse & Lots ({logements.length})</span>
          </button>
        </div>

        {activeSubTab !== 'tableau_de_bord_vsp' && (
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Chantier Filter */}
            <select
              value={selectedChantierId}
              onChange={(e) => setSelectedChantierId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">{isGlobalUser ? 'Tous les chantiers' : 'Mes chantiers'}</option>
              {userAllowedChantiers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, NIN, lot..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* SUB-TAB 3: TABLEAU DE BORD VSP & TRÉSORERIE */}
      {activeSubTab === 'tableau_de_bord_vsp' && (
        <div className="space-y-6">
          {/* Specific VSP Client Dashboard: Schedule, Payments, & Construction Progress */}
          <VspClientDashboard />

          {/* Top Cash Flow Forecast Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tranches Encaissées (Règles)</span>
                <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
                  {formatDZD(tranchesReglees)} DA
                </div>
                <p className="text-xs text-slate-400 mt-1">Fonds reçus et validés en caisse</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Flux Prévisionnels à Venir</span>
                <div className="text-2xl font-black text-blue-600 font-mono mt-1">
                  {formatDZD(tranchesAVenir)} DA
                </div>
                <p className="text-xs text-slate-400 mt-1">Échéances planifiées des acquéreurs</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Échéances en Retard / Impayés</span>
                <div className="text-2xl font-black text-rose-600 font-mono mt-1">
                  {formatDZD(tranchesRetard)} DA
                </div>
                <p className="text-xs text-slate-400 mt-1">Nécessite relance contentieuse</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Project-wise Commercialization & Cumulative Collections Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Analyse du Taux de Commercialisation & Encaissements par Projet</h3>
                <p className="text-xs text-slate-500">Suivi consolidé des ventes sur plan (VSP) et des recouvrements par chantier</p>
              </div>
              <span className="px-3 py-1 bg-slate-900 text-amber-400 text-xs font-bold rounded-lg font-mono">
                {chantiers.length} Chantiers Actifs
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                    <th className="px-6 py-3.5">Chantier / Projet</th>
                    <th className="px-6 py-3.5 text-center">Unités / Lots</th>
                    <th className="px-6 py-3.5">Taux de Commercialisation</th>
                    <th className="px-6 py-3.5 text-right">CA Prévisionnel VSP</th>
                    <th className="px-6 py-3.5 text-right">Cumul Encaissé</th>
                    <th className="px-6 py-3.5 text-right">Reste à Recouvrer</th>
                    <th className="px-6 py-3.5 text-center">Taux Recouvrement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {projectVSPAnalytics.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{item.chantier.nom}</div>
                        <div className="text-[11px] text-slate-400">{item.chantier.wilaya} · {item.beneficiairesCount} Acquéreurs</div>
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold">
                        {item.vendus} / {item.totalLots}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.tauxCommercialisation >= 75 ? 'bg-emerald-500' : item.tauxCommercialisation >= 40 ? 'bg-blue-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, item.tauxCommercialisation)}%` }}
                            />
                          </div>
                          <span className="font-bold font-mono text-slate-900">{item.tauxCommercialisation}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                        {formatDZD(item.caPrevisionnelDZD)} DA
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">
                        {formatDZD(item.encaisseDZD)} DA
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-amber-600">
                        {formatDZD(item.resteARecouvrerDZD)} DA
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                          item.tauxRecouvrement >= 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.tauxRecouvrement}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 1: ACQUÉREURS & DOSSIERS VSP */}
      {activeSubTab === 'beneficiaires' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Code / Acquéreur</th>
                  <th className="py-3 px-4">NIN / CNI</th>
                  <th className="py-3 px-4">Lot Réservé</th>
                  <th className="py-3 px-4">Statut Dossier VSP</th>
                  <th className="py-3 px-4 text-right">Total Encaissé</th>
                  <th className="py-3 px-4 text-right">Reste Dû</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {filteredBeneficiaires.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{b.prenom} {b.nom}</div>
                      <div className="text-[11px] font-mono text-slate-400">{b.code} · {b.telephone}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{b.nin}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{b.logementNumero}</div>
                      <div className="text-[11px] text-slate-400">{b.chantierNom}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatutDossierBadge(b.statutDossier)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                      {formatDZD(b.totalEncaisseDZD)} DA
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-600">
                      {formatDZD(b.soldeRestantDZD)} DA
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedBeneficiaire(b)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-medium rounded-lg text-xs transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Dossier & Échéancier</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: PLAN DE MASSE & LOTS */}
      {activeSubTab === 'logements' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">N° Lot / Unité</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Chantier / Bloc</th>
                  <th className="py-3 px-4 text-right">Surface (m²)</th>
                  <th className="py-3 px-4 text-right">Prix Vente (DA)</th>
                  <th className="py-3 px-4 text-center">Statut Lot</th>
                  <th className="py-3 px-4">Acquéreur Rattaché</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {filteredLogements.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold font-mono text-slate-900">{l.numeroLot}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 uppercase">{l.type}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{l.chantierNom}</div>
                      <div className="text-[11px] text-slate-400">Bloc {l.bloc} · Étage {l.etage}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">{l.surfaceHabitableM2} m²</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">{formatDZD(l.prixTotalDZD)} DA</td>
                    <td className="py-3.5 px-4 text-center">{getStatutLogementBadge(l.statut)}</td>
                    <td className="py-3.5 px-4">
                      {l.beneficiaireNom ? (
                        <span className="font-bold text-blue-700">{l.beneficiaireNom}</span>
                      ) : (
                        <span className="text-slate-400 italic">Non attribué</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: BENEFICIAIRE DETAILS & TRANCHES */}
      {selectedBeneficiaire && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-amber-400">
                  {selectedBeneficiaire.code}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  {selectedBeneficiaire.prenom} {selectedBeneficiaire.nom}
                </h2>
                <p className="text-xs text-slate-500">
                  NIN : {selectedBeneficiaire.nin} · Lot : {selectedBeneficiaire.logementNumero} ({selectedBeneficiaire.chantierNom})
                </p>
              </div>
              <button
                onClick={() => setSelectedBeneficiaire(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Tranches VSP Table */}
            <div>
              <h3 className="text-md font-bold text-slate-900 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Échéancier des Tranches de Paiement (Vente sur Plan)</span>
              </h3>
              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-3">Tranche</th>
                      <th className="p-3">Libellé des Travaux / Étape</th>
                      <th className="p-3">Pourcentage</th>
                      <th className="p-3 text-right">Montant (DZD)</th>
                      <th className="p-3 text-center">Échéance</th>
                      <th className="p-3 text-center">Statut</th>
                      <th className="p-3 text-right">Reçu N°</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                    {selectedBeneficiaire.echeancierVSP.map((tr) => (
                      <tr key={tr.id} className="hover:bg-white transition-colors">
                        <td className="p-3 font-bold font-mono">Tranche {tr.numero}</td>
                        <td className="p-3">{tr.libelle}</td>
                        <td className="p-3 font-mono font-bold">{tr.pourcentage}%</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          {formatDZD(tr.montantDZD)} DA
                        </td>
                        <td className="p-3 text-center font-mono text-slate-600">{tr.dateEcheance}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tr.statut === 'regle'
                                ? 'bg-emerald-100 text-emerald-800'
                                : tr.statut === 'en_retard'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {tr.statut.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono text-xs text-blue-600 font-semibold">
                          {tr.recuNumero || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pieces Dossier Checklist */}
            <div>
              <h3 className="text-md font-bold text-slate-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Pièces du Dossier Administratif & Notarié</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedBeneficiaire.piecesDossier.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-sm">
                    <div className="flex items-center gap-2.5">
                      {p.fourni ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <span className={p.fourni ? 'text-slate-800 font-medium' : 'text-slate-500'}>{p.libelle}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${p.fourni ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {p.fourni ? 'Conforme' : 'En attente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() =>
                  setPrintVoucher({
                    isOpen: true,
                    type: 'contrat_reservation',
                    beneficiaire: selectedBeneficiaire,
                  })
                }
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer Acte / Reçu VSP</span>
              </button>
              <button
                onClick={() => setSelectedBeneficiaire(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Creation Modals */}
      <NewBeneficiaireModal
        isOpen={isNewBeneficiaireModalOpen}
        onClose={() => setIsNewBeneficiaireModalOpen(false)}
      />

      <NewLotModal
        isOpen={isNewLotModalOpen}
        onClose={() => setIsNewLotModalOpen(false)}
      />
    </div>
  );
};
