import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Transaction,
  StatutConformiteTransaction,
  RevueConformiteTransaction,
  RapportAuditMensuel,
} from '../types';
import { formatDZD, formatDateFR, formatDateTimeFR } from '../utils/formatters';
import {
  analyserMoisConformite,
  getMoisDisponibles,
  REGLES_AUDIT,
} from '../utils/complianceAudit';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Calendar,
  Building,
  Wallet,
  FileText,
  ChevronDown,
  ChevronUp,
  Download,
  Send,
  Eye,
  Check,
  UserCheck,
  Info,
} from 'lucide-react';

export const ComplianceAuditView: React.FC = () => {
  const {
    transactions,
    chantiers,
    caisses,
    appSettings,
    currentUser,
    logAudit,
    validerTransaction,
  } = useApp();

  // Selected month state
  const moisDisponibles = useMemo(() => getMoisDisponibles(transactions), [transactions]);
  const [selectedMois, setSelectedMois] = useState<string>(
    moisDisponibles[0]?.key || '2026-10'
  );

  // Filters state
  const [filtreChantier, setFiltreChantier] = useState<string>('all');
  const [filtreSeverite, setFiltreSeverite] = useState<string>('all');
  const [filtreStatutConformite, setFiltreStatutConformite] = useState<string>('all');
  const [rechercheTerm, setRechercheTerm] = useState('');
  const [showCompliantList, setShowCompliantList] = useState(false);

  // Reviews state (persisted per transaction ID in local memory)
  const [revues, setRevues] = useState<Record<string, RevueConformiteTransaction>>({
    'tx-009': {
      transactionId: 'tx-009',
      statut: 'a_verifier',
      anomalies: [],
      commentaireAuditeur: 'Exiger la facture proforma et le bon de pesée gasoil avant décaissement.',
    },
    'tx-010': {
      transactionId: 'tx-010',
      statut: 'a_verifier',
      anomalies: [],
      commentaireAuditeur: 'Attente du PV de réception intermédiaire signé par le conducteur de travaux.',
    },
  });

  // Monthly Report Status (persisted per month)
  const [rapportsMensuels, setRapportsMensuels] = useState<Record<string, RapportAuditMensuel>>({
    '2026-09': {
      id: 'RAP-AUDIT-2026-09',
      mois: '2026-09',
      statut: 'cloture_vise',
      dateGeneration: '2026-09-30 18:00',
      dateCloture: '2026-10-01 09:30',
      visePar: 'Directeur Général & SuperAdmin',
      observationsGenerales: 'Contrôle mensuel de septembre validé avec 1 régularisation sous réserve.',
      totalTransactions: 3,
      montantTotalTransactionsDZD: 7270000,
      totalAtypiques: 1,
      montantTotalAtypiquesDZD: 550000,
      tauxConformitePourcent: 66.7,
    },
  });

  // Modal print preview
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [observationsInput, setObservationsInput] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  // Compute monthly analysis
  const analyseMois = useMemo(() => {
    return analyserMoisConformite(transactions, selectedMois, appSettings);
  }, [transactions, selectedMois, appSettings]);

  // Current month report status
  const currentRapport = rapportsMensuels[selectedMois];
  const isMonthClosed = currentRapport?.statut === 'cloture_vise';

  // Filtered atypical transactions
  const atypicalTransactionsFiltrees = useMemo(() => {
    return analyseMois.transactionsAtypiques.filter((item) => {
      const tx = item.transaction;
      const revue = revues[tx.id];
      const statutConformite = revue?.statut || 'a_verifier';

      // Search match
      const matchSearch =
        !rechercheTerm ||
        tx.reference.toLowerCase().includes(rechercheTerm.toLowerCase()) ||
        tx.beneficiaireNom.toLowerCase().includes(rechercheTerm.toLowerCase()) ||
        tx.motif.toLowerCase().includes(rechercheTerm.toLowerCase()) ||
        item.anomalies.some((a) => a.titre.toLowerCase().includes(rechercheTerm.toLowerCase()));

      // Chantier match
      const matchChantier = filtreChantier === 'all' || tx.chantierId === filtreChantier;

      // Severity match
      const matchSeverite =
        filtreSeverite === 'all' || item.severiteMax === filtreSeverite;

      // Statut conformite match
      const matchStatut =
        filtreStatutConformite === 'all' || statutConformite === filtreStatutConformite;

      return matchSearch && matchChantier && matchSeverite && matchStatut;
    });
  }, [analyseMois, revues, rechercheTerm, filtreChantier, filtreSeverite, filtreStatutConformite]);

  // Compliant transactions of the month
  const compliantTransactions = useMemo(() => {
    const atypicalIds = new Set(analyseMois.transactionsAtypiques.map((a) => a.transaction.id));
    return analyseMois.toutesTransactions.filter((tx) => !atypicalIds.has(tx.id));
  }, [analyseMois]);

  // Handlers for transaction review actions
  const handleSetStatutConformite = (
    tx: Transaction,
    nouveauStatut: StatutConformiteTransaction,
    defautCommentaire?: string
  ) => {
    const current = revues[tx.id] || {
      transactionId: tx.id,
      statut: 'a_verifier',
      anomalies: [],
      commentaireAuditeur: '',
    };

    const updated: RevueConformiteTransaction = {
      ...current,
      statut: nouveauStatut,
      commentaireAuditeur: defautCommentaire || current.commentaireAuditeur,
      dateRevue: new Date().toISOString(),
      auditePar: currentUser.nom,
    };

    setRevues((prev) => ({ ...prev, [tx.id]: updated }));

    // Log in global audit journal
    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'validation',
      module: 'conformite',
      entiteReference: tx.reference,
      details: `Revue de conformité transaction "${tx.reference}" (${formatDZD(tx.montantDZD)}) : Statut changé à "${nouveauStatut.toUpperCase()}". Note: ${updated.commentaireAuditeur || 'Aucune'}`,
      impactFinancierDZD: tx.montantDZD,
    });

    setNotification({
      message: `Statut de conformité mis à jour pour ${tx.reference} (${nouveauStatut.replace('_', ' ')}).`,
      type: 'success',
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUpdateCommentaire = (txId: string, commentaire: string) => {
    setRevues((prev) => ({
      ...prev,
      [txId]: {
        ...(prev[txId] || {
          transactionId: txId,
          statut: 'a_verifier',
          anomalies: [],
        }),
        commentaireAuditeur: commentaire,
        dateRevue: new Date().toISOString(),
        auditePar: currentUser.nom,
      },
    }));
  };

  // Sign-off and close the monthly report
  const handleCloturerRapport = () => {
    const newReport: RapportAuditMensuel = {
      id: `RAP-AUDIT-${selectedMois}`,
      mois: selectedMois,
      statut: 'cloture_vise',
      dateGeneration: formatDateTimeFR(new Date().toISOString()),
      dateCloture: formatDateTimeFR(new Date().toISOString()),
      visePar: `${currentUser.nom} (${currentUser.role})`,
      observationsGenerales:
        observationsInput ||
        `Rapport mensuel d'audit visé et validé par le SuperAdmin le ${formatDateFR(new Date().toISOString())}. Toutes anomalies répertoriées traitées.`,
      totalTransactions: analyseMois.totalTransactions,
      montantTotalTransactionsDZD: analyseMois.montantTotalTransactionsDZD,
      totalAtypiques: analyseMois.totalAtypiques,
      montantTotalAtypiquesDZD: analyseMois.montantTotalAtypiquesDZD,
      tauxConformitePourcent: analyseMois.tauxConformitePourcent,
    };

    setRapportsMensuels((prev) => ({ ...prev, [selectedMois]: newReport }));

    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'validation',
      module: 'conformite',
      entiteReference: `RAPPORT-${selectedMois}`,
      details: `Clôture et apposition du visa d'audit SuperAdmin pour le mois ${selectedMois}. Taux conformité: ${analyseMois.tauxConformitePourcent}%. Anomalies traitées: ${analyseMois.totalAtypiques}`,
      impactFinancierDZD: analyseMois.montantTotalAtypiquesDZD,
    });

    setNotification({
      message: `Le rapport d'audit mensuel pour ${analyseMois.labelMois} a été visé et clôturé avec succès.`,
      type: 'success',
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Helpers
  const getSeveriteBadge = (severite: string) => {
    switch (severite) {
      case 'critique':
        return (
          <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold uppercase tracking-wider">
            Critique
          </span>
        );
      case 'haute':
        return (
          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
            Haute
          </span>
        );
      case 'moyenne':
        return (
          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider">
            Moyenne
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
            Info
          </span>
        );
    }
  };

  const getStatutConformiteBadge = (statut: StatutConformiteTransaction) => {
    switch (statut) {
      case 'conforme':
        return (
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-600" />
            Conforme / Dispensé
          </span>
        );
      case 'reserve':
        return (
          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[11px] font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-700" />
            Avec Réserves
          </span>
        );
      case 'bloque':
        return (
          <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[11px] font-bold flex items-center gap-1">
            <XCircle className="w-3 h-3 text-red-600" />
            Bloqué / Refusé
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[11px] font-bold flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-600" />
            À Valider par SuperAdmin
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header with Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-800 border border-amber-500/30 font-bold text-[10px] rounded uppercase tracking-wider flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-amber-700" /> Contrôle Interne & Risques Financiers
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-mono">Loi 11-04 & Code Commerce</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Audit de Conformité & Revue Mensuelle des Transactions
            </h3>
            <p className="text-xs text-slate-500 max-w-3xl">
              Détection automatisée des décaissements en espèces hors normes, dépenses sans pièces justificatives,
              dépassements de plafonds caisse et saisies dérogatoires pour validation SuperAdmin.
            </p>
          </div>

          {/* Month Selector & Primary Export Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-4 h-4 text-slate-500 ml-1.5" />
              <label htmlFor="select-mois-audit" className="sr-only">Sélectionner le mois d'audit</label>
              <select
                id="select-mois-audit"
                value={selectedMois}
                onChange={(e) => setSelectedMois(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 pr-2 focus:outline-none cursor-pointer"
              >
                {moisDisponibles.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Rapport Mensuel PDF</span>
            </button>

            {!isMonthClosed ? (
              <button
                onClick={handleCloturerRapport}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                title="Apposer le visa de conformité SuperAdmin et clôturer l'audit du mois"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Viser & Clôturer le Mois</span>
              </button>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Audit Clôturé & Visé</span>
              </span>
            )}
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification.message}</span>
          </div>
        )}

        {/* Executive KPI Summary Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* KPI 1: Total Audité */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Opérations Auditées
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {analyseMois.totalTransactions}
              </span>
              <span className="text-xs text-slate-500">
                sur {analyseMois.labelMois}
              </span>
            </div>
            <div className="text-[11px] text-slate-600 font-mono mt-1 pt-1 border-t border-slate-200/60 tabular-nums">
              Volume: {formatDZD(analyseMois.montantTotalTransactionsDZD)}
            </div>
          </div>

          {/* KPI 2: Transactions Atypiques */}
          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block mb-1 flex items-center justify-between">
              <span>Opérations Hors Normes</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-amber-950 tabular-nums">
                {analyseMois.totalAtypiques}
              </span>
              <span className="text-xs text-amber-800 font-medium">
                {analyseMois.repartitionSeverite.critique} critiques · {analyseMois.repartitionSeverite.haute} hautes
              </span>
            </div>
            <div className="text-[11px] text-amber-900 font-mono mt-1 pt-1 border-t border-amber-200 tabular-nums">
              Montant à risque: {formatDZD(analyseMois.montantTotalAtypiquesDZD)}
            </div>
          </div>

          {/* KPI 3: Taux de Conformité */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Indice de Conformité
            </span>
            <div className="flex items-baseline justify-between">
              <span
                className={`text-2xl font-black font-mono tabular-nums ${
                  analyseMois.tauxConformitePourcent >= 85
                    ? 'text-emerald-600'
                    : analyseMois.tauxConformitePourcent >= 65
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}
              >
                {analyseMois.tauxConformitePourcent}%
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {analyseMois.tauxConformitePourcent >= 85 ? 'Satisfaisant' : 'Vigilance Requise'}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  analyseMois.tauxConformitePourcent >= 85
                    ? 'bg-emerald-500'
                    : analyseMois.tauxConformitePourcent >= 65
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, analyseMois.tauxConformitePourcent)}%` }}
              />
            </div>
          </div>

          {/* KPI 4: Statut du Visa Rapport */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Statut du Contrôle
            </span>
            <div className="flex items-center gap-2 mt-1">
              {isMonthClosed ? (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 block leading-tight">
                      Visé & Validé
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {currentRapport?.dateCloture || 'Clôturé'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-amber-950 block leading-tight">
                      Revue en cours
                    </span>
                    <span className="text-[10px] text-slate-500">
                      En attente de signature SuperAdmin
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="text-[10px] text-slate-400 mt-2 truncate">
              Visa: {isMonthClosed ? currentRapport?.visePar : 'Non clôturé'}
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Rechercher par réf., motif, bénéficiaire..."
              value={rechercheTerm}
              onChange={(e) => setRechercheTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Chantier Filter */}
          <div>
            <label htmlFor="filtre-chantier-audit" className="sr-only">Filtrer par chantier</label>
            <select
              id="filtre-chantier-audit"
              value={filtreChantier}
              onChange={(e) => setFiltreChantier(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="all">Tous les chantiers ({chantiers.length})</option>
              {chantiers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom} ({c.wilaya})
                </option>
              ))}
            </select>
          </div>

          {/* Sévérité Filter */}
          <div>
            <label htmlFor="filtre-severite-audit" className="sr-only">Filtrer par sévérité</label>
            <select
              id="filtre-severite-audit"
              value={filtreSeverite}
              onChange={(e) => setFiltreSeverite(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="all">Toutes sévérités d'alerte</option>
              <option value="critique">Critique ({analyseMois.repartitionSeverite.critique})</option>
              <option value="haute">Haute ({analyseMois.repartitionSeverite.haute})</option>
              <option value="moyenne">Moyenne ({analyseMois.repartitionSeverite.moyenne})</option>
            </select>
          </div>

          {/* Statut Conformite Filter */}
          <div>
            <label htmlFor="filtre-statut-audit" className="sr-only">Filtrer par statut de revue</label>
            <select
              id="filtre-statut-audit"
              value={filtreStatutConformite}
              onChange={(e) => setFiltreStatutConformite(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="all">Tous les états de revue</option>
              <option value="a_verifier">À valider / Non traité</option>
              <option value="conforme">Conforme / Dispensé</option>
              <option value="reserve">Avec réserves</option>
              <option value="bloque">Bloqué / Rejeté</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Section: List of Atypical Transactions Requiring SuperAdmin Review */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Transactions Atypiques & Saisies Manuelles Détectées ({atypicalTransactionsFiltrees.length})
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Examinez chaque opération signalée, appliquez votre décision d'audit et consignez vos observations de contrôle.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Période :</span>
            <span className="font-bold text-slate-900 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
              {analyseMois.labelMois}
            </span>
          </div>
        </div>

        {atypicalTransactionsFiltrees.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h5 className="text-sm font-bold text-slate-900">
              Aucune opération hors normes pour les critères sélectionnés
            </h5>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Toutes les transactions enregistrées pour {analyseMois.labelMois} respectent les plafonds de décaissement,
              les règles de pièces justificatives et les circuits de validation.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {atypicalTransactionsFiltrees.map((item) => {
              const tx = item.transaction;
              const caisse = caisses.find((c) => c.id === tx.caisseSourceId || c.id === tx.caisseDestinationId);
              const chantier = chantiers.find((c) => c.id === tx.chantierId);
              const revue = revues[tx.id] || {
                transactionId: tx.id,
                statut: 'a_verifier',
                anomalies: item.anomalies,
                commentaireAuditeur: '',
              };

              return (
                <div
                  key={tx.id}
                  className={`p-6 transition-colors ${
                    revue.statut === 'bloque'
                      ? 'bg-red-50/20'
                      : revue.statut === 'conforme'
                      ? 'bg-emerald-50/20'
                      : revue.statut === 'reserve'
                      ? 'bg-amber-50/20'
                      : 'hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Left: Transaction Metadata & Anomalies */}
                    <div className="space-y-3 flex-1 min-w-0">
                      {/* Top line: Reference, Date, Severity and Status */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {tx.reference}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-600 font-mono">
                          {formatDateFR(tx.date)}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        {getSeveriteBadge(item.severiteMax)}
                        {getStatutConformiteBadge(revue.statut)}
                      </div>

                      {/* Middle: Beneficiary, Category & Motif */}
                      <div>
                        <div className="flex items-baseline gap-2">
                          <h5 className="text-sm font-bold text-slate-900 truncate">
                            {tx.beneficiaireNom}
                          </h5>
                          <span className="text-xs text-slate-500 font-medium">
                            ({tx.categorie.replace(/_/g, ' ')})
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                          <strong className="text-slate-800">Motif :</strong> {tx.motif}
                        </p>
                      </div>

                      {/* Operational Context Tagline (No pills, clean unboxed metadata) */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{chantier ? chantier.nom : 'Siège Central'}</span>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1">
                          <Wallet className="w-3.5 h-3.5 text-slate-400" />
                          <span>{caisse ? caisse.nom : 'Caisse Directe'}</span>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Mode : <strong className="font-mono text-slate-700 uppercase">{tx.modePaiement}</strong></span>
                        <span aria-hidden="true">·</span>
                        <span>Saisi par : <strong className="text-slate-700">{tx.enregistrePar}</strong></span>
                        {tx.bonCaisseNumero && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Bon de Caisse : <strong className="font-mono text-slate-700">{tx.bonCaisseNumero}</strong></span>
                          </>
                        )}
                        {tx.pieceJointeNom ? (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-emerald-700 font-medium flex items-center gap-1">
                              <FileCheck className="w-3.5 h-3.5 text-emerald-600" /> {tx.pieceJointeNom}
                            </span>
                          </>
                        ) : (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-red-600 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Pièce justificative manquante
                            </span>
                          </>
                        )}
                      </div>

                      {/* Anomalies Detected Detailed Callout */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Anomalies signalées ({item.anomalies.length}) :
                        </span>
                        <div className="space-y-1.5">
                          {item.anomalies.map((ano, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs space-y-0.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                  {ano.titre}
                                </span>
                                {getSeveriteBadge(ano.severite)}
                              </div>
                              <p className="text-slate-600 text-[11px] pl-5">{ano.explication}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount & SuperAdmin Validation Decision Panel */}
                    <div className="lg:w-80 shrink-0 bg-white p-4 rounded-xl border border-slate-200 space-y-3.5">
                      <div className="flex items-baseline justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-semibold text-slate-500">Montant Décaissé</span>
                        <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                          {formatDZD(tx.montantDZD)}
                        </span>
                      </div>

                      {/* Auditor Actions */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                          Décision SuperAdmin :
                        </span>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSetStatutConformite(tx, 'conforme', 'Validé conforme par SuperAdmin après vérification des pièces.')}
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                              revue.statut === 'conforme'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                            title="Déclarer cette transaction conforme"
                          >
                            <Check className="w-3 h-3" />
                            <span>Conforme</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetStatutConformite(tx, 'reserve', 'Réserves formulées : Justificatif manquant à fournir sous 48h.')}
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                              revue.statut === 'reserve'
                                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-800'
                            }`}
                            title="Émettre des réserves sur cette transaction"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            <span>Réserves</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetStatutConformite(tx, 'bloque', 'Opération bloquée par SuperAdmin pour non-conformité majeure.')}
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                              revue.statut === 'bloque'
                                ? 'bg-red-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-700'
                            }`}
                            title="Rejeter et bloquer cette opération"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Bloquer</span>
                          </button>
                        </div>
                      </div>

                      {/* Auditor Note / Justification Input */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-600">
                            Note de Contrôle d'Audit :
                          </label>
                          {revue.auditePar && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              Par: {revue.auditePar}
                            </span>
                          )}
                        </div>
                        <textarea
                          rows={2}
                          placeholder="Consigner un motif de dispense, une demande de justificatif ou une réserve..."
                          value={revue.commentaireAuditeur || ''}
                          onChange={(e) => handleUpdateCommentaire(tx.id, e.target.value)}
                          className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none text-slate-800 placeholder-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Collapsible Section: Compliant Transactions in the Month */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowCompliantList(!showCompliantList)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Opérations Conformes & Normalisées ({compliantTransactions.length})
              </h4>
              <p className="text-xs text-slate-500">
                Transactions du mois ne présentant aucune anomalie par rapport aux règles de conformité.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              {formatDZD(compliantTransactions.reduce((acc, tx) => acc + tx.montantDZD, 0))}
            </span>
            {showCompliantList ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </button>

        {showCompliantList && (
          <div className="border-t border-slate-200 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-4">Réf. / Date</th>
                  <th className="py-2.5 px-4">Bénéficiaire</th>
                  <th className="py-2.5 px-4">Chantier / Caisse</th>
                  <th className="py-2.5 px-4">Mode / Pièce</th>
                  <th className="py-2.5 px-4 text-right">Montant (DZD)</th>
                  <th className="py-2.5 px-4 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {compliantTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-slate-900">{tx.reference}</div>
                      <div className="text-[11px] text-slate-400">{formatDateFR(tx.date)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{tx.beneficiaireNom}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{tx.motif}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{chantiers.find((c) => c.id === tx.chantierId)?.nom || 'Siège'}</div>
                      <div className="text-[10px] text-slate-400">
                        {caisses.find((c) => c.id === tx.caisseSourceId)?.nom || 'Banque'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-slate-700 uppercase bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        {tx.modePaiement}
                      </span>
                      {tx.pieceJointeNom && (
                        <div className="text-[10px] text-emerald-600 mt-0.5 truncate max-w-[120px]">
                          ✓ {tx.pieceJointeNom}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatDZD(tx.montantDZD)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] inline-flex items-center gap-1">
                        <Check className="w-3 h-3" /> Conforme
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rules Reference Table */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600" />
          Règles de Contrôle Interne & Détection des Anomalies BTPH
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {REGLES_AUDIT.map((r) => (
            <div key={r.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-900 block">{r.titre}</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">{r.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* PRINTABLE / OFFICIAL PDF AUDIT REPORT MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="text-sm font-bold">
                    Rapport Officiel d'Audit de Conformité & Contrôle Interne
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Période d'audit : {analyseMois.labelMois}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer / PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>

            {/* Modal Content - Formal Document Body */}
            <div className="p-8 overflow-y-auto space-y-6 text-slate-900 bg-white" id="compliance-printable-report">
              {/* Formal Letterhead */}
              <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-wider text-slate-900">
                    {appSettings.raisonSociale || 'BATIPROMOTE ALGÉRIE SARL'}
                  </h2>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Société de Promotion Immobilière & Travaux BTPH
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    NIF: {appSettings.nif || '001616098234891'} · RC: {appSettings.registreCommerceRC || '16/00-098234B01'} · Agrément N°: {appSettings.agrementPromoteurNumero || 'PRO-2018-042-ALG'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Siège Social : {appSettings.siegeAdresse || '08 Boulevard Colonel Bougara, El Biar, Alger'}
                  </p>
                </div>

                <div className="text-right shrink-0 sm:border-l sm:border-slate-200 sm:pl-4">
                  <span className="px-2 py-0.5 bg-slate-900 text-amber-400 font-mono text-[10px] font-bold uppercase rounded">
                    CONTRÔLE INTERNE SUPERADMIN
                  </span>
                  <div className="text-xs font-mono font-bold text-slate-900 mt-2">
                    RÉF : AUDIT-{selectedMois}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Date de visa : {formatDateFR(new Date().toISOString())}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Auditeur : {currentUser.nom} ({currentUser.role})
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="text-center py-2 bg-slate-50 border border-slate-200 rounded-xl">
                <h3 className="text-base font-black uppercase tracking-wide text-slate-900">
                  RAPPORT MENSUEL D'AUDIT DE CONFORMITÉ & DE CONTRÔLE DE TRÉSORERIE
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">
                  Revue des flux financiers, décaissements atypiques et saisies dérogatoires — {analyseMois.labelMois}
                </p>
              </div>

              {/* Synthetic Metrics Table */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Opérations</span>
                  <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">{analyseMois.totalTransactions}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Flux Audités</span>
                  <span className="text-sm font-bold font-mono text-slate-900 tabular-nums">{formatDZD(analyseMois.montantTotalTransactionsDZD)}</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-amber-900 block">Anomalies Détectées</span>
                  <span className="text-lg font-bold font-mono text-amber-900 tabular-nums">{analyseMois.totalAtypiques}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Taux de Conformité</span>
                  <span className="text-lg font-black font-mono text-emerald-600 tabular-nums">{analyseMois.tauxConformitePourcent}%</span>
                </div>
              </div>

              {/* Detailed Anomalies Schedule */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5">
                  1. État Détaillé des Opérations Atypiques & Décisions d'Audit
                </h4>

                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                        <th className="p-2.5">Réf. & Date</th>
                        <th className="p-2.5">Bénéficiaire & Chantier</th>
                        <th className="p-2.5">Mode / Pièce</th>
                        <th className="p-2.5 text-right">Montant (DZD)</th>
                        <th className="p-2.5">Anomalies Relevées</th>
                        <th className="p-2.5">Avis SuperAdmin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      {analyseMois.transactionsAtypiques.map((item) => {
                        const tx = item.transaction;
                        const revue = revues[tx.id];
                        const statut = revue?.statut || 'a_verifier';

                        return (
                          <tr key={tx.id} className="align-top">
                            <td className="p-2.5 font-mono">
                              <span className="font-bold block">{tx.reference}</span>
                              <span className="text-slate-500 text-[10px]">{formatDateFR(tx.date)}</span>
                            </td>
                            <td className="p-2.5">
                              <span className="font-bold block">{tx.beneficiaireNom}</span>
                              <span className="text-slate-500 text-[10px]">
                                {chantiers.find((c) => c.id === tx.chantierId)?.nom || 'Siège'}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono uppercase text-[10px]">
                              <span>{tx.modePaiement}</span>
                              <span className="text-slate-400 block">
                                {tx.pieceJointeNom ? 'PJ: Oui' : 'PJ: Non'}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold tabular-nums">
                              {formatDZD(tx.montantDZD)}
                            </td>
                            <td className="p-2.5">
                              <ul className="list-disc pl-3 text-[10px] text-slate-700 space-y-0.5">
                                {item.anomalies.map((a, i) => (
                                  <li key={i}>{a.titre}</li>
                                ))}
                              </ul>
                            </td>
                            <td className="p-2.5">
                              <span className="font-bold uppercase text-[10px] block">
                                {statut === 'conforme'
                                  ? '✓ Conforme (Validé)'
                                  : statut === 'reserve'
                                  ? '⚠ Avec Réserves'
                                  : statut === 'bloque'
                                  ? '⛔ Bloqué / Refusé'
                                  : 'En Attente'}
                              </span>
                              {revue?.commentaireAuditeur && (
                                <span className="text-[10px] text-slate-500 italic block mt-0.5">
                                  "{revue.commentaireAuditeur}"
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* General Audit Observations & Directives */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5">
                  2. Synthèse Générale & Recommandations du SuperAdmin
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {currentRapport?.observationsGenerales ||
                    'Le contrôle mensuel des décaissements et règlements confirme la vigilance portée sur les caisses chantiers. Toutes les opérations signalées font l\'objet d\'un suivi strict. Rappel est fait aux régisseurs de caisse d\'exiger systématiquement les factures justificatives et de limiter les règlements en espèces au seuil réglementaire.'}
                </p>
              </div>

              {/* Signatures Block */}
              <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-3 gap-6 text-center text-xs">
                <div className="space-y-12">
                  <span className="font-bold block uppercase text-slate-600">
                    L'Auditeur / SuperAdmin
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 block">{currentUser.nom}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Visa Apposé</span>
                  </div>
                </div>

                <div className="space-y-12">
                  <span className="font-bold block uppercase text-slate-600">
                    Le Chef Comptable
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 block">Karima Zerrouki</span>
                    <span className="text-[10px] text-slate-400 font-mono">Pour Visa Technique</span>
                  </div>
                </div>

                <div className="space-y-12">
                  <span className="font-bold block uppercase text-slate-600">
                    La Direction Générale
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 block">Redha Mansouri</span>
                    <span className="text-[10px] text-slate-400 font-mono">Pour Approbation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
