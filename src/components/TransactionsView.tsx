import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Transaction, TypeTransaction, ModePaiement } from '../types';
import { formatDZD, formatDateFR } from '../utils/formatters';
import {
  Receipt,
  Plus,
  Search,
  Download,
  Printer,
  CheckCircle,
  XCircle,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  FileCheck,
  FileDown,
  Lock,
} from 'lucide-react';

interface Props {
  onOpenTransactionModal: () => void;
  onOpenExportPdfModal?: () => void;
}

export const TransactionsView: React.FC<Props> = ({
  onOpenTransactionModal,
  onOpenExportPdfModal,
}) => {
  const {
    t,
    transactions,
    chantiers,
    caisses,
    validerTransaction,
    rejeterTransaction,
    openPrintBonCaisse,
    estDateVerrouillee,
    currentUser,
    hasPermission,
  } = useApp();

  const isGlobalUser =
    currentUser.role === 'superadmin' ||
    currentUser.role === 'directeur_promoteur' ||
    currentUser.chantiersAssignes.includes('*');

  const userAllowedChantiers = isGlobalUser
    ? chantiers
    : chantiers.filter((c) => currentUser.chantiersAssignes.includes(c.id));

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterChantier, setFilterChantier] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [filterStatut, setFilterStatut] = useState<string>('all');

  // Filter transactions
  const filtered = transactions.filter((tx) => {
    // Site-level restriction
    if (!isGlobalUser && (!tx.chantierId || !currentUser.chantiersAssignes.includes(tx.chantierId))) {
      return false;
    }

    const matchSearch =
      tx.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.beneficiaireNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.motif.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.numeroChequeVirement && tx.numeroChequeVirement.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchType = filterType === 'all' || tx.type === filterType;
    const matchChantier = filterChantier === 'all' || tx.chantierId === filterChantier;
    const matchMode = filterMode === 'all' || tx.modePaiement === filterMode;
    const matchStatut = filterStatut === 'all' || tx.statut === filterStatut;

    return matchSearch && matchType && matchChantier && matchMode && matchStatut;
  });

  // Calculate totals for filtered
  const totalSorties = filtered
    .filter((tx) => tx.type === 'sortie' && tx.statut !== 'rejete')
    .reduce((acc, tx) => acc + tx.montantDZD, 0);

  const totalEntrees = filtered
    .filter((tx) => tx.type === 'entree' && tx.statut !== 'rejete')
    .reduce((acc, tx) => acc + tx.montantDZD, 0);

  const soldeNet = totalEntrees - totalSorties;

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Reference',
      'Date',
      'Type',
      'Chantier',
      'Beneficiaire',
      'Categorie',
      'Mode_Paiement',
      'Montant_DA',
      'Statut',
      'Motif',
      'Ref_Paiement',
    ];

    const rows = filtered.map((tx) => {
      const ch = chantiers.find((c) => c.id === tx.chantierId);
      return [
        `"${tx.reference}"`,
        `"${tx.date}"`,
        `"${tx.type}"`,
        `"${ch ? ch.nom : 'Siège'}"`,
        `"${tx.beneficiaireNom.replace(/"/g, '""')}"`,
        `"${tx.categorie}"`,
        `"${tx.modePaiement}"`,
        tx.montantDZD,
        `"${tx.statut}"`,
        `"${tx.motif.replace(/"/g, '""')}"`,
        `"${tx.numeroChequeVirement || tx.bonCaisseNumero || ''}"`,
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Transactions_BatiPromote_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block mb-1">
            {t.totalDepenses || 'Total Dépenses Sélectionnées'}
          </span>
          <p className="text-xl font-mono font-bold text-red-600 dark:text-red-400 tabular-nums">
            {formatDZD(totalSorties)}
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block mb-1">
            {t.totalRecettesVSP || 'Total Entrées Sélectionnées'}
          </span>
          <p className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatDZD(totalEntrees)}
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block mb-1">
            {t.soldeCaissesChantiers || 'Flux Net Période'}
          </span>
          <p
            className={`text-xl font-mono font-bold tabular-nums ${
              soldeNet >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
            }`}
          >
            {soldeNet >= 0 ? '+' : ''}{formatDZD(soldeNet)}
          </p>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute start-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t.rechercher || 'Rechercher par référence, bénéficiaire, motif...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full ps-9 pe-3 py-1.5 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors cursor-pointer"
              title="Exporter sous format Excel / CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.exporterDonnees || 'Exporter CSV'}</span>
            </button>

            {onOpenExportPdfModal && (
              <button
                onClick={onOpenExportPdfModal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-amber-300 bg-amber-400/20 hover:bg-amber-400/30 border border-amber-300 rounded-lg transition-colors cursor-pointer"
                title="Générer et exporter le Bilan Financier mensuel au format PDF"
              >
                <FileDown className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>{t.bilanFinancier || 'Bilan Financier PDF'}</span>
              </button>
            )}

            {hasPermission('transactions_create') && currentUser.role !== 'superadmin' && (
              <button
                onClick={onOpenTransactionModal}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-slate-950" />
                <span>{t.nouvelleDepense || 'Nouvelle Dépense'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
          <div className="flex items-center gap-1 text-slate-400 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>{t.filtrer || 'Filtres'} :</span>
          </div>

          {/* Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden"
          >
            <option value="all">Tous les flux</option>
            <option value="sortie">Dépenses (Sorties)</option>
            <option value="entree">Recettes (Entrées)</option>
            <option value="transfert_caisse">Transferts de caisse</option>
          </select>

          {/* Chantier */}
          <select
            value={filterChantier}
            onChange={(e) => setFilterChantier(e.target.value)}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden"
          >
            <option value="all">{isGlobalUser ? (t.tousLesChantiers || 'Tous les chantiers') : 'Tous mes chantiers'}</option>
            {userAllowedChantiers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>

          {/* Mode */}
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden"
          >
            <option value="all">Tous les modes</option>
            <option value="especes">Espèces (Bons de caisse)</option>
            <option value="cheque">Chèque bancaire</option>
            <option value="virement">Virement bancaire</option>
            <option value="traite">Effet / Traite</option>
          </select>

          {/* Statut */}
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden"
          >
            <option value="all">Tous les statuts</option>
            <option value="valide">Validé</option>
            <option value="en_attente">En attente de visa</option>
            <option value="rejete">Rejeté</option>
          </select>

          {(filterType !== 'all' ||
            filterChantier !== 'all' ||
            filterMode !== 'all' ||
            filterStatut !== 'all' ||
            searchTerm) && (
            <button
              onClick={() => {
                setFilterType('all');
                setFilterChantier('all');
                setFilterMode('all');
                setFilterStatut('all');
                setSearchTerm('');
              }}
              className="text-amber-700 dark:text-amber-400 hover:underline text-[11px] font-semibold ms-auto cursor-pointer"
            >
              Réinitialiser filtres
            </button>
          )}
        </div>
      </div>

      {/* Main Transactions Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <th className="py-3 px-3.5">Référence / Date</th>
                <th className="py-3 px-3.5">Chantier</th>
                <th className="py-3 px-3.5">Bénéficiaire / Tiers</th>
                <th className="py-3 px-3.5">Catégorie & Motif</th>
                <th className="py-3 px-3.5">Mode / Pièce</th>
                <th className="py-3 px-3.5 text-end">Montant ({t.devise || 'DA'})</th>
                <th className="py-3 px-3.5 text-center">Statut</th>
                <th className="py-3 px-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Aucune transaction ne correspond aux critères sélectionnés.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => {
                  const ch = chantiers.find((c) => c.id === tx.chantierId);
                  const isSortie = tx.type === 'sortie';
                  const isLockedMonth = estDateVerrouillee(tx.date).isLocked;

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                      {/* Ref & Date */}
                      <td className="py-3 px-3.5 font-mono">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{tx.reference}</span>
                          {isLockedMonth && (
                            <span title="Mois verrouillé par clôture comptable" className="text-amber-600">
                              <Lock className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans">{formatDateFR(tx.date)}</div>
                      </td>

                      {/* Chantier */}
                      <td className="py-3 px-3.5 font-semibold text-slate-800 dark:text-slate-200">
                        {ch ? ch.nom : 'Siège Principal'}
                      </td>

                      {/* Beneficiaire */}
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{tx.beneficiaireNom}</div>
                        <div className="text-[10px] text-slate-400 uppercase">Tiers</div>
                      </td>

                      {/* Categorie & Motif */}
                      <td className="py-3 px-3.5 max-w-xs">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-700 dark:text-slate-200 text-slate-700 rounded text-[10px] font-semibold mb-0.5">
                          {tx.categorie}
                        </span>
                        <p className="text-xs text-slate-600 dark:text-slate-300 truncate font-medium">{tx.motif}</p>
                      </td>

                      {/* Mode & Ref */}
                      <td className="py-3 px-3.5 font-mono">
                        <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800">
                          {tx.modePaiement}
                        </span>
                        {(tx.numeroChequeVirement || tx.bonCaisseNumero) && (
                          <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[120px]">
                            {tx.numeroChequeVirement || tx.bonCaisseNumero}
                          </div>
                        )}
                      </td>

                      {/* Montant */}
                      <td className={`py-3 px-3.5 text-end font-mono font-black tabular-nums ${isSortie ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {isSortie ? '-' : '+'}{formatDZD(tx.montantDZD)}
                      </td>

                      {/* Statut */}
                      <td className="py-3 px-3.5 text-center">
                        {tx.statut === 'valide' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-full text-[10px] font-bold">
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> Validé
                          </span>
                        )}
                        {tx.statut === 'en_attente' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-full text-[10px] font-bold animate-pulse">
                            En attente
                          </span>
                        )}
                        {tx.statut === 'rejete' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-full text-[10px] font-bold">
                            <XCircle className="w-3 h-3 text-rose-600" /> Rejeté
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Print Voucher button */}
                          <button
                            onClick={() => openPrintBonCaisse(tx)}
                            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition"
                            title="Imprimer le bon de caisse / ordre de décaissement officiel"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Approve / Reject if pending */}
                          {tx.statut === 'en_attente' && !isLockedMonth && (
                            <>
                              <button
                                onClick={() => validerTransaction(tx.id)}
                                className="p-1.5 text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition"
                                title="Valider la transaction"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => rejeterTransaction(tx.id)}
                                className="p-1.5 text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-lg transition"
                                title="Rejeter la transaction"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
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
  );
};
