import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CaisseFondRoulement } from '../types';
import { formatDZD, formatDateFR } from '../utils/formatters';
import {
  Wallet,
  Plus,
  RefreshCw,
  Printer,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Building,
  User,
  Phone,
  Search,
  Clock,
  Check,
  XCircle,
  ShieldCheck,
  FileText,
} from 'lucide-react';

interface Props {
  onOpenAlimenterModal: (caisseId?: string) => void;
  onOpenTransactionModalWithCaisse: (caisseId: string) => void;
}

export const CaissesView: React.FC<Props> = ({
  onOpenAlimenterModal,
  onOpenTransactionModalWithCaisse,
}) => {
  const {
    t,
    caisses,
    transactions,
    chantiers,
    openPrintBonCaisse,
    currentUser,
    demandesAlimentation,
    validerDemandeAlimentation,
    refuserDemandeAlimentation,
    isChantierAllowed,
    isGlobalUser,
    hasPermission,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'caisses' | 'demandes' | 'journal'>('caisses');
  const [selectedCaisseId, setSelectedCaisseId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const visibleCaisses = caisses.filter((c) => {
    if (isGlobalUser) return true;
    if (!c.chantierId) return false;
    return isChantierAllowed(c.chantierId);
  });

  const visibleDemandes = demandesAlimentation.filter((d) => {
    if (isGlobalUser) return true;
    return isChantierAllowed(d.chantierId) || d.demandeurId === currentUser.id;
  });

  const pendingDemandesCount = demandesAlimentation.filter(
    (d) => d.statut === 'en_attente_validation' && (isGlobalUser || isChantierAllowed(d.chantierId))
  ).length;

  // Total cash across visible desks
  const totalSolde = visibleCaisses.reduce((acc, c) => acc + c.soldeActuelDZD, 0);

  // Filter transactions
  const caisseTransactions = transactions.filter((tx) => {
    const isCaisseFlow =
      tx.modePaiement === 'especes' ||
      tx.type === 'transfert_caisse' ||
      tx.caisseSourceId ||
      tx.caisseDestinationId;

    if (!isCaisseFlow) return false;

    if (selectedCaisseId !== 'all') {
      const matchCaisse =
        tx.caisseSourceId === selectedCaisseId || tx.caisseDestinationId === selectedCaisseId;
      if (!matchCaisse) return false;
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchQuery =
        tx.beneficiaireNom.toLowerCase().includes(q) ||
        tx.motif.toLowerCase().includes(q) ||
        (tx.bonCaisseNumero && tx.bonCaisseNumero.toLowerCase().includes(q)) ||
        tx.reference.toLowerCase().includes(q);
      if (!matchQuery) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Stat Strip */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold block mb-1">
              Trésorerie Liquide & Caisses Chantiers
            </span>
            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl font-extrabold font-mono tracking-tight tabular-nums">
                {formatDZD(totalSolde)}
              </h2>
              <span className="text-xs text-slate-400">
                sur {caisses.length} caisses opérationnelles
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2">
              Chaque chantier dispose d'une caisse de menues dépenses alimentée périodiquement pour
              régler la main-d'œuvre journalière, le carburant et les fournitures d'urgence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onOpenAlimenterModal()}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Alimenter une caisse
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimer l'état des caisses
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('caisses')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'caisses'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Wallet className="w-4 h-4" />
          Caisses & Soldes ({visibleCaisses.length})
        </button>

        <button
          onClick={() => setActiveTab('demandes')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 relative ${
            activeTab === 'demandes'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          Demandes d'Alimentation
          {pendingDemandesCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-black text-white bg-amber-500 rounded-full">
              {pendingDemandesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('journal')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'journal'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Journal des Mouvements ({caisseTransactions.length})
        </button>
      </div>

      {/* 1. TAB: CAISSES GRID */}
      {(activeTab === 'caisses' || activeTab === 'journal') && activeTab === 'caisses' && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visibleCaisses.map((caisse) => {
          const isLow = caisse.soldeActuelDZD <= caisse.seuilAlerteDZD;
          const ratio = Math.min(100, (caisse.soldeActuelDZD / caisse.plafondMaxDZD) * 100);

          return (
            <div
              key={caisse.id}
              className={`bg-white rounded-xl border p-5 shadow-2xs flex flex-col justify-between transition-all ${
                isLow ? 'border-red-300 ring-1 ring-red-200' : 'border-slate-200'
              }`}
            >
              <div>
                {/* Title & Status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                      {caisse.code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{caisse.nom}</h3>
                  </div>
                  {isLow ? (
                    <span className="text-[10px] font-mono font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded uppercase">
                      {t.seuil_bas}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase">
                      {t.normal}
                    </span>
                  )}
                </div>

                {/* Balance Amount */}
                <div className="my-3">
                  <span className="text-xs text-slate-500 block mb-0.5">Solde disponible :</span>
                  <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                    {formatDZD(caisse.soldeActuelDZD)}
                  </div>
                </div>

                {/* Progress bar towards max ceiling */}
                <div className="my-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>Niveau de trésorerie</span>
                    <span className="font-mono">{ratio.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        isLow ? 'bg-red-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Responsable :</span>
                    <span className="font-semibold text-slate-800">{caisse.responsable}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Téléphone :</span>
                    <span className="font-mono text-slate-700">{caisse.telephoneResponsable}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Seuil d'alerte :</span>
                    <span className="font-mono text-amber-700 font-semibold">
                      {formatDZD(caisse.seuilAlerteDZD)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Dernier rechargement :</span>
                    <span className="font-mono text-slate-500">
                      {formatDateFR(caisse.dernierReapproDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center gap-2">
                <button
                  onClick={() => onOpenAlimenterModal(caisse.id)}
                  className="flex-1 py-1.5 px-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors text-center"
                >
                  + Alimenter
                </button>
                {hasPermission('transactions_create') && currentUser.role !== 'superadmin' && (
                  <button
                    onClick={() => onOpenTransactionModalWithCaisse(caisse.id)}
                    className="flex-1 py-1.5 px-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-center"
                  >
                    - Décaissement
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* 2. TAB: DEMANDES D'ALIMENTATION DE CAISSE */}
      {activeTab === 'demandes' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Demandes d'Alimentation de Caisse
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isGlobalUser
                  ? "Validation par l'administration / direction des demandes de réapprovisionnement"
                  : "Suivi du statut de vos demandes de réapprovisionnement en fonds"}
              </p>
            </div>
            <button
              onClick={() => onOpenAlimenterModal()}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Nouvelle Demande
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                  <th className="py-2.5 px-3">Code / Date</th>
                  <th className="py-2.5 px-3">Caisse Cible</th>
                  <th className="py-2.5 px-3">Demandeur</th>
                  <th className="py-2.5 px-3">Motif & Justification</th>
                  <th className="py-2.5 px-3 text-right">Montant (DA)</th>
                  <th className="py-2.5 px-3 text-center">Statut</th>
                  <th className="py-2.5 px-3 text-center">Validation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {visibleDemandes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Aucune demande d'alimentation enregistrée pour vos chantiers.
                    </td>
                  </tr>
                ) : (
                  visibleDemandes.map((demande) => {
                    const isPending = demande.statut === 'en_attente_validation';
                    const isValidated = demande.statut === 'validee';
                    const isRejected = demande.statut === 'refusee';

                    return (
                      <tr key={demande.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                          <div>{demande.code}</div>
                          <span className="text-[10px] text-slate-400 font-normal">{formatDateFR(demande.dateDemande)}</span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-900">
                          {demande.caisseCibleNom}
                          {demande.chantierNom && (
                            <span className="block text-[10px] text-slate-500 font-normal">{demande.chantierNom}</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-800 block">{demande.demandeurNom}</span>
                          <span className="text-[10px] text-slate-400 capitalize">{demande.demandeurRole?.replace(/_/g, ' ')}</span>
                        </td>
                        <td className="py-3 px-3 max-w-xs">
                          <p className="text-xs text-slate-700 line-clamp-2">{demande.motif}</p>
                          {demande.motifRefus && (
                            <p className="text-[10px] text-red-600 font-semibold mt-0.5">Refus: {demande.motifRefus}</p>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {formatDZD(demande.montantDZD)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              isPending
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : isValidated
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-red-100 text-red-900 border border-red-300'
                            }`}
                          >
                            {isPending && <Clock className="w-3 h-3 text-amber-600" />}
                            {isValidated && <Check className="w-3 h-3 text-emerald-600" />}
                            {isRejected && <XCircle className="w-3 h-3 text-red-600" />}
                            {isPending
                              ? 'En attente'
                              : isValidated
                              ? `Validée par ${demande.validateurNom || 'Admin'}`
                              : 'Refusée'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isPending && isGlobalUser ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => validerDemandeAlimentation(demande.id)}
                                className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-xs transition-colors cursor-pointer"
                              >
                                Valider
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt("Motif du refus de la demande :");
                                  if (reason !== null) {
                                    refuserDemandeAlimentation(demande.id, reason);
                                  }
                                }}
                                className="px-2.5 py-1 text-[11px] font-bold text-white bg-red-600 hover:bg-red-700 rounded shadow-xs transition-colors cursor-pointer"
                              >
                                Refuser
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {isValidated ? formatDateFR(demande.dateValidation || '') : '-'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. TAB: JOURNAL DES FLUX DE CAISSE */}
      {(activeTab === 'caisses' || activeTab === 'journal') && (
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Journal des Mouvements de Caisse</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Traçabilité complète des entrées, sorties espèces et transferts de fond de roulement
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by Caisse */}
            <select
              value={selectedCaisseId}
              onChange={(e) => setSelectedCaisseId(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
            >
              <option value="all">Toutes les caisses</option>
              {caisses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher bénéficiaire, motif..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <th className="py-2.5 px-3">Date / Bon N°</th>
                <th className="py-2.5 px-3">Caisse</th>
                <th className="py-2.5 px-3">Chantier d'affectation</th>
                <th className="py-2.5 px-3">Bénéficiaire & Motif</th>
                <th className="py-2.5 px-3">Type Flux</th>
                <th className="py-2.5 px-3 text-right">Montant (DA)</th>
                <th className="py-2.5 px-3 text-center">Bon de Caisse</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {caisseTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Aucun mouvement de caisse trouvé pour cette sélection.
                  </td>
                </tr>
              ) : (
                caisseTransactions.map((tx) => {
                  const caisseSrc = caisses.find((c) => c.id === tx.caisseSourceId);
                  const caisseDst = caisses.find((c) => c.id === tx.caisseDestinationId);
                  const chantier = chantiers.find((c) => c.id === tx.chantierId);
                  const isSortie = tx.type === 'sortie';
                  const isEntree = tx.type === 'entree';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono font-semibold text-slate-900 block">
                          {tx.bonCaisseNumero || tx.reference}
                        </span>
                        <span className="text-[11px] text-slate-400">{formatDateFR(tx.date)}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800 block">
                          {isSortie
                            ? caisseSrc?.nom || 'Caisse'
                            : isEntree
                            ? caisseDst?.nom || 'Caisse'
                            : `${caisseSrc?.nom || 'Source'} ➔ ${caisseDst?.nom || 'Cible'}`}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-slate-700 font-medium">
                          {chantier ? chantier.nom : 'Siège Promoteur'}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <span className="font-semibold text-slate-900 block truncate">
                          {tx.beneficiaireNom}
                        </span>
                        <span className="text-[11px] text-slate-500 line-clamp-1">{tx.motif}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded capitalize ${
                            isSortie
                              ? 'text-red-700 bg-red-50'
                              : isEntree
                              ? 'text-emerald-700 bg-emerald-50'
                              : 'text-amber-700 bg-amber-50'
                          }`}
                        >
                          {isSortie ? (
                            <ArrowDownRight className="w-3 h-3" />
                          ) : isEntree ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <RefreshCw className="w-3 h-3" />
                          )}
                          {tx.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums">
                        <span
                          className={
                            isSortie
                              ? 'text-red-600'
                              : isEntree
                              ? 'text-emerald-600'
                              : 'text-amber-600'
                          }
                        >
                          {isSortie ? '-' : '+'}{formatDZD(tx.montantDZD)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => openPrintBonCaisse(tx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                          title="Imprimer le justificatif légal"
                        >
                          <Printer className="w-3 h-3 text-slate-600" />
                          <span>Imprimer</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
};
