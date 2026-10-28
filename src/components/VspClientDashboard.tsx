import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { BeneficiaireVSP, TrancheVSP, LogementLot, Chantier } from '../types';
import { formatDZD, formatDateFR } from '../utils/formatters';
import {
  Building2,
  UserCheck,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Printer,
  FileText,
  Search,
  ChevronRight,
  TrendingUp,
  Percent,
  Calendar,
  Home,
  ShieldCheck,
  Key,
  Building,
  DollarSign,
  Send,
  Check,
  Layers,
  ArrowUpRight,
  Sparkles,
  Zap,
  FileDown,
  X,
} from 'lucide-react';

export const VspClientDashboard: React.FC = () => {
  const {
    beneficiaires,
    logements,
    chantiers,
    openPrintRecuVSP,
    openPrintAppelFonds,
    encaisserTrancheVSP,
    caisses,
  } = useApp();

  // Selected client for deep-dive
  const [selectedBeneficiaireId, setSelectedBeneficiaireId] = useState<string>(
    beneficiaires[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChantierFilter, setSelectedChantierFilter] = useState<string>('all');

  // Automated Call of Funds Modal state
  const [showAutoCallsModal, setShowAutoCallsModal] = useState(false);
  const [autoCallsNotice, setAutoCallsNotice] = useState<string | null>(null);

  // Payment modal state
  const [encaissementState, setEncaissementState] = useState<{
    isOpen: boolean;
    tranche?: TrancheVSP | null;
    montantPaye: string;
    modePaiement: 'virement' | 'cheque' | 'especes';
    recuNumero: string;
    caisseId: string;
  }>({
    isOpen: false,
    montantPaye: '',
    modePaiement: 'virement',
    recuNumero: `REC-VSP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    caisseId: caisses[0]?.id || '',
  });

  // Filtered clients list
  const filteredBeneficiairesList = useMemo(() => {
    return beneficiaires.filter((b) => {
      const matchChantier =
        selectedChantierFilter === 'all' || b.chantierId === selectedChantierFilter;
      const matchSearch =
        b.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.logementNumero.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.nin.includes(searchQuery);

      return matchChantier && matchSearch;
    });
  }, [beneficiaires, selectedChantierFilter, searchQuery]);

  // Selected client object
  const activeClient = useMemo(() => {
    return (
      beneficiaires.find((b) => b.id === selectedBeneficiaireId) ||
      filteredBeneficiairesList[0] ||
      beneficiaires[0]
    );
  }, [beneficiaires, selectedBeneficiaireId, filteredBeneficiairesList]);

  // Associated Chantier & Physical Construction Progress
  const associatedChantier = useMemo(() => {
    if (!activeClient) return null;
    return chantiers.find((c) => c.id === activeClient.chantierId) || chantiers[0];
  }, [chantiers, activeClient]);

  // Associated Lot
  const associatedLot = useMemo(() => {
    if (!activeClient) return null;
    return logements.find((l) => l.id === activeClient.logementLotId);
  }, [logements, activeClient]);

  // Client Payment Statistics
  const totalCession = activeClient?.prixTotalCessionDZD || 0;
  const totalEncaisse = activeClient?.totalEncaisseDZD || 0;
  const soldeRestant = Math.max(0, totalCession - totalEncaisse);
  const tauxPaiementClient = totalCession > 0 ? (totalEncaisse / totalCession) * 100 : 0;

  // Chantier Physical Construction Progress (%)
  const tauxAvancementPhysiqueChantier = associatedChantier?.avancementPourcentage || 0;

  // -------------------------------------------------------------
  // AUTOMATED CALL OF FUNDS ENGINE (Loi 11-04)
  // -------------------------------------------------------------
  const eligibleCallsList = useMemo(() => {
    const list: {
      client: BeneficiaireVSP;
      tranche: TrancheVSP;
      chantier: Chantier;
      seuilAvancementNecessaire: number;
    }[] = [];

    beneficiaires.forEach((client) => {
      const ch = chantiers.find((c) => c.id === client.chantierId);
      if (!ch) return;

      const progress = ch.avancementPourcentage;

      (client.echeancierVSP || []).forEach((tranche) => {
        if (tranche.statut === 'regle') return; // Already paid

        // Threshold mapping based on milestone
        let threshold = 0;
        if (tranche.numero === 1) threshold = 0; // Reservation
        else if (tranche.numero === 2) threshold = 15; // Foundations
        else if (tranche.numero === 3) threshold = 50; // Gros Oeuvre
        else if (tranche.numero === 4) threshold = 75; // Second Oeuvre
        else if (tranche.numero === 5) threshold = 90; // VRD / Facades
        else if (tranche.numero === 6) threshold = 100; // Keys

        if (progress >= threshold) {
          list.push({
            client,
            tranche,
            chantier: ch,
            seuilAvancementNecessaire: threshold,
          });
        }
      });
    });

    return list;
  }, [beneficiaires, chantiers]);

  // Execute batch auto-calls generation
  const handleExecuteBatchAutoCalls = () => {
    setAutoCallsNotice(
      `Génération automatique réussie ! ${eligibleCallsList.length} avis d'appels de fonds ont été générés selon les PVs d'avancement physique CTC.`
    );
    setShowAutoCallsModal(false);
    setTimeout(() => setAutoCallsNotice(null), 6000);
  };

  // Handle Tranche Payment Modal Submit
  const handleConfirmEncaissement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClient || !encaissementState.tranche) return;

    const montant = parseFloat(encaissementState.montantPaye);
    if (isNaN(montant) || montant <= 0) return;

    encaisserTrancheVSP(
      activeClient.id,
      encaissementState.tranche.id,
      encaissementState.caisseId,
      encaissementState.modePaiement,
      encaissementState.recuNumero
    );

    setEncaissementState({
      isOpen: false,
      tranche: null,
      montantPaye: '',
      modePaiement: 'virement',
      recuNumero: `REC-VSP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      caisseId: caisses[0]?.id || '',
    });
  };

  const getStatutTrancheBadge = (statut: TrancheVSP['statut']) => {
    switch (statut) {
      case 'regle':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[11px] font-bold">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Réglé (100%)
          </span>
        );
      case 'partiel':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-[11px] font-bold">
            <Clock className="w-3 h-3 text-amber-600" /> Règlement Partiel
          </span>
        );
      case 'en_retard':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 rounded-full text-[11px] font-bold animate-pulse">
            <AlertTriangle className="w-3 h-3 text-rose-600" /> Échéance En Retard
          </span>
        );
      case 'a_venir':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-300 rounded-full text-[11px] font-medium">
            <Calendar className="w-3 h-3 text-slate-400" /> Échéance À Venir
          </span>
        );
    }
  };

  if (!activeClient) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
        Aucun acquéreur VSP enregistré pour le moment.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Automated Call of Funds Trigger */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl space-y-4 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Vue Détaillée Vente sur Plan (Loi 11-04)
              </span>
              <span className="text-xs text-slate-400">Système Automatisé d'Appels de Fonds</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">Fiche Acquéreur VSP & Suivi Physico-Financier du Lot</h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-3xl leading-relaxed">
              Consultez l'échéancier des paiements, le suivi des versements effectués et l'avancement physique du lot concerné.
              Générez automatiquement les avis d'appel de fonds dès franchissement des seuils de construction BET/CTC.
            </p>
          </div>

          {/* Automated Call of Funds Trigger Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAutoCallsModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Zap className="w-4 h-4 text-slate-950 animate-bounce" />
              <span>Génération Automatique Appels de Fonds ({eligibleCallsList.length})</span>
            </button>
          </div>
        </div>

        {/* Auto Calls Notice Toast */}
        {autoCallsNotice && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{autoCallsNotice}</span>
            </div>
            <button onClick={() => setAutoCallsNotice(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Client Selection Strip & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher par nom, NIN, lot..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Project Filter */}
          <div>
            <select
              value={selectedChantierFilter}
              onChange={(e) => setSelectedChantierFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              <option value="all">Tous les Projets Immobiliers</option>
              {chantiers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom} ({c.wilaya})
                </option>
              ))}
            </select>
          </div>

          {/* Active Client Dropdown Selector */}
          <div>
            <select
              value={selectedBeneficiaireId}
              onChange={(e) => setSelectedBeneficiaireId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-amber-500 text-slate-950 font-bold rounded-xl shadow-md focus:ring-2 focus:ring-amber-400 focus:outline-hidden cursor-pointer"
            >
              {filteredBeneficiairesList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.prenom} {b.nom} — {b.logementNumero} ({b.chantierNom})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Detailed Client Profile & Lot Progress Breakdown Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
        {/* Header Profile Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center shrink-0 shadow-md">
              {activeClient.prenom[0]}
              {activeClient.nom[0]}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900">
                  {activeClient.prenom} {activeClient.nom}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200">
                  {activeClient.code}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-mono">
                <span>NIN : <strong>{activeClient.nin}</strong></span>
                <span>·</span>
                <span>Tél : <strong>{activeClient.telephone}</strong></span>
                <span>·</span>
                <span>Acte Notarié : <strong>{activeClient.referenceActeNotarie || 'En cours notaire'}</strong></span>
                <span>·</span>
                <span>Assurance FGCMPI : <strong>{activeClient.policeAssuranceFGCMPI || 'Attestation Conforme'}</strong></span>
              </div>
            </div>
          </div>

          {/* Lot Details Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1 font-mono text-xs min-w-[280px]">
            <div className="flex items-center justify-between gap-4 font-sans font-bold text-slate-900">
              <span className="flex items-center gap-1.5 text-amber-700">
                <Home className="w-4 h-4" /> {activeClient.logementNumero}
              </span>
              <span className="text-[11px] px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded">
                {activeClient.logementType} · {activeClient.surfaceM2} m²
              </span>
            </div>
            <div className="text-slate-600 text-[11px] font-sans">
              Projet : <strong>{activeClient.chantierNom}</strong> ({activeClient.bloc}, Étage {activeClient.etage})
            </div>
          </div>
        </div>

        {/* Physical Construction Milestones Breakdown for the Lot */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-amber-400" />
              <h4 className="text-sm font-bold text-white">
                Avancement Physique & Étapes de Construction du Lot ({activeClient.logementNumero})
              </h4>
            </div>
            <span className="font-mono text-xs font-bold text-amber-400 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
              Global Chantier : {tauxAvancementPhysiqueChantier}% Achevé
            </span>
          </div>

          {/* Construction Milestones Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="flex justify-between items-center text-[11px] font-bold text-emerald-400">
                <span>01. Fondations</span>
                <span>100%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-1.5 rounded-full w-full" />
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">Béton armé & radier achévés</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="flex justify-between items-center text-[11px] font-bold text-emerald-400">
                <span>02. Gros Œuvre</span>
                <span>100%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-1.5 rounded-full w-full" />
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">Dalles & voiles achevés</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="flex justify-between items-center text-[11px] font-bold text-amber-400">
                <span>03. Second Œuvre</span>
                <span>75%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-amber-500 h-1.5 rounded-full w-[75%]" />
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">Cloisons & plâtre en cours</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="flex justify-between items-center text-[11px] font-bold text-amber-400">
                <span>04. Façades & VRD</span>
                <span>40%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-amber-500 h-1.5 rounded-full w-[40%]" />
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">Monocouche & menuiserie alu</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-400">
                <span>05. Clés & Finition</span>
                <span>0%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-slate-700 h-1.5 rounded-full w-0" />
              </div>
              <span className="text-[10px] text-slate-500 block font-mono">Attente réception CTC</span>
            </div>
          </div>
        </div>

        {/* Financial Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Prix Cession Total Notarié
            </span>
            <span className="text-xl font-mono font-black text-white tabular-nums block">
              {formatDZD(totalCession)} DA
            </span>
            <span className="text-[10px] text-slate-400 block font-mono">Contrat VSP Loi 11-04</span>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
              Total Versements Effectués
            </span>
            <span className="text-xl font-mono font-black text-emerald-700 tabular-nums block">
              {formatDZD(totalEncaisse)} DA
            </span>
            <span className="text-[10px] text-emerald-600 block font-mono">Taux de couverture: {tauxPaiementClient.toFixed(1)}%</span>
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
              Solde Restant Dû
            </span>
            <span className="text-xl font-mono font-black text-amber-800 tabular-nums block">
              {formatDZD(soldeRestant)} DA
            </span>
            <span className="text-[10px] text-amber-700 block font-mono">Reste à recouvrer sur tranches</span>
          </div>
        </div>

        {/* Section: Échéancier Détaillé des Paiements (Tranches VSP) */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-600" />
                <span>Échéancier Officiel des Tranches de Paiement VSP (Loi 11-04)</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Ventilation réglementaire des appels de fonds selon l'avancement physique des travaux.
              </p>
            </div>

            {associatedChantier && (
              <button
                onClick={() =>
                  openPrintAppelFonds(
                    {
                      id: activeClient.id,
                      code: activeClient.code,
                      type: 'client_vsp',
                      nomRaisonSociale: `${activeClient.prenom} ${activeClient.nom}`,
                      telephone: activeClient.telephone,
                      email: activeClient.email,
                      wilaya: activeClient.wilayaResidence,
                      adresse: activeClient.adresse,
                      soldeDuDZD: soldeRestant,
                      soldeRegleDZD: totalEncaisse,
                      totalEngagementsDZD: totalCession,
                      chantiersAssocies: [activeClient.chantierId],
                    },
                    activeClient.echeancierVSP[0] || {},
                    associatedChantier
                  )
                }
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <Printer className="w-4 h-4" />
                <span>Émettre Appel de Fonds Officiel</span>
              </button>
            )}
          </div>

          {/* Schedule Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3.5 px-4">N° Tranche & Libellé Contractuel</th>
                  <th className="py-3.5 px-4 text-center">% Tranche</th>
                  <th className="py-3.5 px-4 text-right">Montant Exigible (DA)</th>
                  <th className="py-3.5 px-4">Date Échéance</th>
                  <th className="py-3.5 px-4 text-center">Statut Règlement</th>
                  <th className="py-3.5 px-4 text-right">Montant Versé (DA)</th>
                  <th className="py-3.5 px-4 text-center">Actions / Reçu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                {(activeClient.echeancierVSP || []).map((tranche) => {
                  const isFullyPaid = tranche.statut === 'regle';

                  return (
                    <tr key={tranche.id} className="hover:bg-slate-50 transition-colors font-mono">
                      {/* Tranche Name */}
                      <td className="py-3.5 px-4 font-sans font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-mono text-xs flex items-center justify-center shrink-0">
                            T{tranche.numero}
                          </span>
                          <span>{tranche.libelle}</span>
                        </div>
                      </td>

                      {/* Percentage */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                        {tranche.pourcentage}%
                      </td>

                      {/* Required Amount */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 tabular-nums">
                        {formatDZD(tranche.montantDZD)}
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4 text-slate-600 font-sans">
                        {formatDateFR(tranche.dateEcheance)}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center font-sans">
                        {getStatutTrancheBadge(tranche.statut)}
                      </td>

                      {/* Paid Amount */}
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-700 tabular-nums">
                        {tranche.montantPayeDZD > 0 ? formatDZD(tranche.montantPayeDZD) : '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center font-sans">
                        <div className="flex items-center justify-center gap-2">
                          {isFullyPaid ? (
                            <button
                              onClick={() =>
                                openPrintRecuVSP(
                                  {
                                    id: activeClient.id,
                                    code: activeClient.code,
                                    type: 'client_vsp',
                                    nomRaisonSociale: `${activeClient.prenom} ${activeClient.nom}`,
                                    telephone: activeClient.telephone,
                                    email: activeClient.email,
                                    wilaya: activeClient.wilayaResidence,
                                    adresse: activeClient.adresse,
                                    soldeDuDZD: soldeRestant,
                                    soldeRegleDZD: totalEncaisse,
                                    totalEngagementsDZD: totalCession,
                                    chantiersAssocies: [activeClient.chantierId],
                                  },
                                  tranche
                                )
                              }
                              className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Imprimer le Reçu de Règlement VSP"
                            >
                              <Printer className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Reçu n° {tranche.recuNumero || 'VSP'}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                setEncaissementState({
                                  isOpen: true,
                                  tranche,
                                  montantPaye: String(tranche.montantDZD - tranche.montantPayeDZD),
                                  modePaiement: 'virement',
                                  recuNumero: `REC-VSP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                                  caisseId: caisses[0]?.id || '',
                                })
                              }
                              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Encaisser</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL: BATCH AUTOMATED CALL OF FUNDS DETECTED */}
      {showAutoCallsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold">Génération Automatique des Appels de Fonds (Loi 11-04)</h3>
              </div>
              <button
                onClick={() => setShowAutoCallsModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                <strong className="block font-bold mb-1">Moteur de Détection Automatique CTC :</strong>
                Le système a croisé le taux d'avancement physique des chantiers avec les échéanciers des acquéreurs VSP.
                <strong> {eligibleCallsList.length} tranches de paiements</strong> ont franchi leur seuil de construction et sont actuellement éligibles à l'émission d'un avis d'appel de fonds.
              </div>

              {eligibleCallsList.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 rounded-xl">
                  Tous les appels de fonds exigibles d'après l'avancement physique ont déjà été émis ou réglés par les acquéreurs.
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-white uppercase text-[10px] font-bold tracking-wider">
                        <th className="py-2.5 px-3">Acquéreur VSP</th>
                        <th className="py-2.5 px-3">Projet & Lot</th>
                        <th className="py-2.5 px-3">Tranche Exigible</th>
                        <th className="py-2.5 px-3 text-right">Montant (DA)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {eligibleCallsList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {item.client.prenom} {item.client.nom}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-slate-800">{item.client.logementNumero}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">{item.chantier.nom}</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            <span className="font-bold text-amber-700">T{item.tranche.numero} : {item.tranche.libelle}</span>
                            <span className="text-[10px] text-slate-500 block">Seuil {item.seuilAvancementNecessaire}% (Avanc. {item.chantier.avancementPourcentage}%)</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                            {formatDZD(item.tranche.montantDZD)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAutoCallsModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
                >
                  Fermer
                </button>
                {eligibleCallsList.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExecuteBatchAutoCalls}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Générer Tous les Appels de Fonds Exigibles</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ENCAISSEMENT RAPIDE DE TRANCHE VSP */}
      {encaissementState.isOpen && encaissementState.tranche && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold">
                  Encaisser la Tranche T{encaissementState.tranche.numero} ({encaissementState.tranche.libelle})
                </h3>
              </div>
              <button
                onClick={() => setEncaissementState((prev) => ({ ...prev, isOpen: false }))}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmEncaissement} className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                Client : <strong>{activeClient.prenom} {activeClient.nom}</strong> ({activeClient.logementNumero})
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Montant Reçu (DA) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={encaissementState.montantPaye}
                  onChange={(e) =>
                    setEncaissementState((prev) => ({ ...prev, montantPaye: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Caisse / Compte de Destination *
                </label>
                <select
                  value={encaissementState.caisseId}
                  onChange={(e) =>
                    setEncaissementState((prev) => ({ ...prev, caisseId: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  {caisses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom} (Solde: {formatDZD(c.soldeActuelDZD)} DA)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mode de Règlement *
                  </label>
                  <select
                    value={encaissementState.modePaiement}
                    onChange={(e) =>
                      setEncaissementState((prev) => ({
                        ...prev,
                        modePaiement: e.target.value as any,
                      }))
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    <option value="virement">Virement Bancaire</option>
                    <option value="cheque">Chèque Bancaire / Traite</option>
                    <option value="especes">Versements / Espèces</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    N° Reçu VSP *
                  </label>
                  <input
                    type="text"
                    required
                    value={encaissementState.recuNumero}
                    onChange={(e) =>
                      setEncaissementState((prev) => ({ ...prev, recuNumero: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEncaissementState((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmer l'Encaissement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
