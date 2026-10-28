import React from 'react';
import { useApp } from '../context/AppContext';
import { formatDZD, formatDateFR } from '../utils/formatters';
import {
  Wallet,
  TrendingUp,
  Building,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  Plus,
  RefreshCw,
  HardHat,
  ChevronRight,
  Package,
  PackageX,
  ArrowRight,
  FileDown,
  Truck,
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { DashboardCharts } from './DashboardCharts';
import { CashAlerts } from './CashAlerts';
import { DashboardKpiBudgets } from './DashboardKpiBudgets';

interface Props {
  onNavigate: (tab: NavTab) => void;
  onOpenTransactionModal: () => void;
  onOpenAlimenterModal: (caisseId?: string) => void;
  onOpenChantierModal: () => void;
  onOpenStockMovementModal: (stockItemId?: string) => void;
  onOpenExportPdfModal?: (type?: 'financier' | 'paie') => void;
}

export const DashboardView: React.FC<Props> = ({
  onNavigate,
  onOpenTransactionModal,
  onOpenAlimenterModal,
  onOpenChantierModal,
  onOpenStockMovementModal,
  onOpenExportPdfModal,
}) => {
  const {
    t,
    chantiers,
    caisses,
    transactions,
    tiers,
    stocks,
    employes,
    bulletinsPaie,
    materiels,
    activeChantierId,
    setActiveChantierId,
    openPrintBonCaisse,
    currentUser,
    hasPermission,
  } = useApp();

  const isGlobalUser =
    currentUser.role === 'superadmin' ||
    currentUser.role === 'directeur_promoteur' ||
    currentUser.chantiersAssignes.includes('*');

  // Allowed chantiers for this user
  const userAllowedChantiers = isGlobalUser
    ? chantiers
    : chantiers.filter((c) => currentUser.chantiersAssignes.includes(c.id));

  // Filtered chantiers based on active selection and allowed sites
  const filteredChantiers = activeChantierId
    ? userAllowedChantiers.filter((c) => c.id === activeChantierId)
    : userAllowedChantiers;

  const allowedIds = new Set(filteredChantiers.map((c) => c.id));

  // Filtered caisses (hide central headquarters caisse and unassigned caisses for site managers)
  const filteredCaisses = caisses.filter((c) => {
    if (!c.chantierId) {
      return isGlobalUser && !activeChantierId;
    }
    return allowedIds.has(c.chantierId);
  });

  // Financial aggregates
  const totalSoldeCaisses = filteredCaisses.reduce((acc, c) => acc + c.soldeActuelDZD, 0);
  const totalDepenses = filteredChantiers.reduce((acc, c) => acc + c.depensesEngageesDZD, 0);
  const totalRecettes = filteredChantiers.reduce((acc, c) => acc + c.recettesEncaisseesDZD, 0);
  const totalBudget = filteredChantiers.reduce((acc, c) => acc + c.budgetTotalDZD, 0);

  // Cash alerts (only for visible caisses)
  const caissesEnAlerte = filteredCaisses.filter((c) => c.soldeActuelDZD <= c.seuilAlerteDZD);

  // Stock alerts (quantiteEnStock <= quantiteMinAlerte)
  const filteredStocks = stocks.filter((s) => allowedIds.has(s.chantierId));
  const stocksEnAlerte = filteredStocks.filter((s) => s.quantiteEnStock <= s.quantiteMinAlerte);

  // Recent transactions
  const filteredTransactions = transactions.filter(
    (tx) => tx.chantierId && allowedIds.has(tx.chantierId)
  );
  const recentTransactions = filteredTransactions.slice(0, 6);

  // Suppliers with debts
  const totalDettesFournisseurs = tiers
    .filter((t) => t.type === 'fournisseur' || t.type === 'sous_traitant')
    .reduce((acc, t) => acc + t.soldeDuDZD, 0);

  return (
    <div className="space-y-6">
      <CashAlerts 
        caissesEnAlerte={caissesEnAlerte}
        onOpenAlimenterModal={onOpenAlimenterModal}
      />

      {/* Visual Stock Threshold Alert Notification */}
      {stocksEnAlerte.length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex flex-col gap-3 text-red-950">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 bg-red-600 text-white rounded-lg shadow-xs">
                <PackageX className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-red-950">
                  {t.alertesCaissesBasses} : {stocksEnAlerte.length} article{stocksEnAlerte.length > 1 ? 's' : ''} {t.sous_le_seuil_alerte}
                </h4>
                <p className="text-xs text-red-700">
                  {t.risque_arret_travaux}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('stocks')}
              className="text-xs font-semibold text-red-800 hover:text-red-950 underline self-start sm:self-auto flex items-center gap-1"
            >
              <span>{t.inventaire_complet}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {stocksEnAlerte.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-red-200 text-xs shadow-2xs"
              >
                <div className="min-w-0 pr-2">
                  <span className="font-bold text-slate-900 block truncate">{item.designation}</span>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                    <span className="truncate max-w-[110px]">{item.chantierNom}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-red-600 font-bold tabular-nums">
                      {item.quantiteEnStock} {item.unite}s
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      (min {item.quantiteMinAlerte})
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onOpenStockMovementModal(item.id)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded shadow-xs whitespace-nowrap transition-colors"
                  title="Enregistrer un Bon de Réception / Livraison"
                >
                  + Réceptionner
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Liquidité / Caisses */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold uppercase tracking-wider">{t.tresorerieDisponible}</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {formatDZD(totalSoldeCaisses)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{filteredCaisses.length} {t.caisses_gerees}</span>
            <button
              onClick={() => onNavigate('caisses')}
              className="text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-0.5"
            >
              {t.gerer} <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KPI 2: Dépenses Engagées */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold uppercase tracking-wider">Dépenses Cumulées</span>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-red-600 tabular-nums">
            {formatDZD(totalDepenses)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Budget: {formatDZD(totalBudget)}</span>
            <span className="font-mono font-semibold">
              {totalBudget > 0 ? ((totalDepenses / totalBudget) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        {/* KPI 3: Recettes Clients VSP */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold uppercase tracking-wider">Encaissements Clients VSP</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-600 tabular-nums">
            {formatDZD(totalRecettes)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>Ratio Recettes / Dépenses</span>
            <span className="font-mono font-semibold text-emerald-700">
              {totalDepenses > 0 ? (totalRecettes / totalDepenses).toFixed(2) : '1.0'}x
            </span>
          </div>
        </div>

        {/* KPI 4: Dettes Fournisseurs & Sous-traitants */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold uppercase tracking-wider">{t.reste_du_fournisseurs}</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {formatDZD(totalDettesFournisseurs)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{t.engagements_soustraitance}</span>
            <button
              onClick={() => onNavigate('tiers')}
              className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-0.5"
            >
              {t.echeancier} <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Data Visualization KPI Component: Budgets Prévisionnels vs Dépenses Réelles */}
      <DashboardKpiBudgets
        chantiers={userAllowedChantiers}
        activeChantierId={activeChantierId}
      />

      {/* Recharts: Évolution des dépenses par chantier (6 derniers mois) et Trésorerie */}
      <DashboardCharts
        chantiers={userAllowedChantiers}
        transactions={filteredTransactions}
        activeChantierId={activeChantierId}
      />

      {/* Row 2: Etat des Caisses & Portefeuille Chantiers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Portefeuille Chantiers Actifs */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">{t.suivi_avancement}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.progression_budgetaire}
              </p>
            </div>
            <button
              onClick={onOpenChantierModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {t.nouveauChantier}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredChantiers.map((chantier) => {
              const pctBudget = chantier.budgetTotalDZD > 0
                ? Math.round((chantier.depensesEngageesDZD / chantier.budgetTotalDZD) * 100)
                : 0;

              return (
                <div
                  key={chantier.id}
                  onClick={() => {
                    setActiveChantierId(chantier.id);
                    onNavigate('chantiers');
                  }}
                  className="group cursor-pointer rounded-lg border border-slate-200 overflow-hidden hover:border-slate-400 hover:shadow-xs transition-all bg-white flex flex-col"
                >
                  {/* Photo with overlay */}
                  <div className="relative h-32 w-full overflow-hidden bg-slate-100">
                    <img
                      src={chantier.imageUrl}
                      alt={chantier.nom}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between text-white">
                      <div>
                        <span className="text-[10px] font-mono uppercase bg-amber-400 text-slate-950 font-bold px-1.5 py-0.5 rounded">
                          {chantier.wilaya}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1 leading-tight drop-shadow-xs">
                          {chantier.nom}
                        </h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-300 tabular-nums">
                        {chantier.avancementPourcentage}% avancement
                      </span>
                    </div>
                  </div>

                  {/* Body details */}
                  <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Physical progress bar */}
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${chantier.avancementPourcentage}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[11px]">{t.depenses_reelles}</span>
                          <span className="font-mono font-semibold text-slate-800 tabular-nums">
                            {formatDZD(chantier.depensesEngageesDZD)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">{t.budget_alloue}</span>
                          <span className="font-mono text-slate-600 tabular-nums">
                            {formatDZD(chantier.budgetTotalDZD)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{chantier.nbrLogements} logements · {chantier.surfaceM2} m²</span>
                      <span className="font-medium text-slate-700">{t.chef_chantier_label} {chantier.chefChantier}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Caisses de Fond de Roulement instantanées */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Caisses & Trésorerie</h3>
                <p className="text-xs text-slate-500 mt-0.5">Soldes instantanés en Dinars</p>
              </div>
              <button
                onClick={() => onOpenAlimenterModal()}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-900 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Alimenter
              </button>
            </div>

            <div className="space-y-3">
              {filteredCaisses.map((cs) => {
                const isLow = cs.soldeActuelDZD <= cs.seuilAlerteDZD;
                return (
                  <div
                    key={cs.id}
                    className={`p-3 rounded-lg border transition-all ${
                      isLow
                        ? 'border-red-300 bg-red-50/50'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {cs.nom}
                      </span>
                      {isLow && (
                        <span className="text-[10px] font-bold text-red-600 uppercase font-mono">
                          Alerte Seuil
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline justify-between mt-1">
                      <p className="text-lg font-mono font-bold text-slate-900 tabular-nums">
                        {formatDZD(cs.soldeActuelDZD)}
                      </p>
                      <button
                        onClick={() => onOpenAlimenterModal(cs.id)}
                        className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold"
                      >
                        + Recharger
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                      <span>Resp: {cs.responsable}</span>
                      <span>Seuil min: {formatDZD(cs.seuilAlerteDZD, false)} DA</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={() => onNavigate('caisses')}
              className="w-full py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-center"
            >
              Voir le journal des caisses complet
            </button>
          </div>
        </div>
      </div>

      {/* Row: Mobilisation des Équipes & Paie */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-800 rounded-lg">
              <HardHat className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Mobilisation de la Main-d'Œuvre & Affectations Multi-Chantiers
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {employes.length} collaborateurs déployés sur site · {bulletinsPaie.filter((b) => b.statut === 'en_attente').length} quinzaines en attente de paiement
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onOpenExportPdfModal && (
              <button
                onClick={() => onOpenExportPdfModal('paie')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors shadow-2xs"
                title="Exporter le Bilan Mensuel de Paie en PDF"
              >
                <FileDown className="w-3.5 h-3.5 text-amber-700" />
                <span>Bilan Paie PDF</span>
              </button>
            )}
            <button
              onClick={() => onNavigate('personnel')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-2xs"
            >
              <span>Module Personnel & Paie</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {userAllowedChantiers.map((ch) => {
            const chEmployes = employes.filter((e) => e.chantierId === ch.id);
            return (
              <div
                key={ch.id}
                onClick={() => {
                  setActiveChantierId(ch.id);
                  onNavigate('personnel');
                }}
                className="p-3 bg-slate-50 hover:bg-amber-500/5 hover:border-amber-300 rounded-lg border border-slate-200 transition-all cursor-pointer text-xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 truncate max-w-[140px]">{ch.nom}</span>
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded">
                    {ch.wilaya}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-slate-200/80">
                  <span className="text-slate-500">Ouvriers affectés :</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{chEmployes.length}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  Chef : {ch.chefChantier}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row: Parc Engins & Matériel de Chantier */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-800 rounded-lg">
              <Truck className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Parc Engins, Grues & Matériel Lourd
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {materiels.filter((m) => m.statut === 'en_service').length} engins actifs sur chantiers ·{' '}
                {materiels.filter((m) => m.statut === 'disponible').length} disponibles au parc central ·{' '}
                {materiels.filter((m) => m.statut === 'en_panne' || m.statut === 'en_maintenance').length} en maintenance/panne
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => onNavigate('materiel')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-2xs"
            >
              <span>Gérer le Parc & Transferts</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {userAllowedChantiers.map((ch) => {
            const chMateriels = materiels.filter((m) => m.chantierId === ch.id);
            const rentalCount = chMateriels.filter((m) => m.typeAcquisition === 'location').length;
            return (
              <div
                key={ch.id}
                onClick={() => {
                  setActiveChantierId(ch.id);
                  onNavigate('materiel');
                }}
                className="p-3 bg-slate-50 hover:bg-amber-500/5 hover:border-amber-300 rounded-lg border border-slate-200 transition-all cursor-pointer text-xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 truncate max-w-[140px]">{ch.nom}</span>
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                    {chMateriels.length} engins
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-slate-200/80">
                  <span className="text-slate-500">Engins loués :</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {rentalCount > 0 ? `${rentalCount} loué(s)` : '0 (100% propre)'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 truncate">
                  {chMateriels.slice(0, 2).map((m) => m.nom).join(', ') || 'Aucun engin affecté'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 3: Dernières Transactions & Décaissements */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Derniers Flux Financiers & Décaissements</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Journal des règlements espèces, chèques et virements avec impression de bons de caisse
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onOpenExportPdfModal && (
              <button
                onClick={() => onOpenExportPdfModal('financier')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
                title="Exporter le Bilan Financier et Journal en PDF"
              >
                <FileDown className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Bilan Financier PDF</span>
                <span className="sm:hidden">PDF</span>
              </button>
            )}
            {hasPermission('transactions_create') && currentUser.role !== 'superadmin' && (
              <button
                onClick={onOpenTransactionModal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                Ajouter une opération
              </button>
            )}
            <button
              onClick={() => onNavigate('transactions')}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Voir tout ({transactions.length})
            </button>
          </div>
        </div>

        {/* Table of recent transactions */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <th className="py-2.5 px-3">Réf. / Date</th>
                <th className="py-2.5 px-3">Chantier</th>
                <th className="py-2.5 px-3">Bénéficiaire / Motif</th>
                <th className="py-2.5 px-3">Mode</th>
                <th className="py-2.5 px-3 text-right">Montant (DA)</th>
                <th className="py-2.5 px-3 text-center">Action / Justificatif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentTransactions.map((tx) => {
                const txChantier = chantiers.find((c) => c.id === tx.chantierId);
                const isSortie = tx.type === 'sortie';
                const isEntree = tx.type === 'entree';

                return (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-mono font-semibold text-slate-900 block">{tx.reference}</span>
                      <span className="text-slate-400 text-[11px]">{formatDateFR(tx.date)}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium text-slate-800 block">
                        {txChantier ? txChantier.nom : 'Frais Siège'}
                      </span>
                      <span className="text-[11px] text-slate-500">{tx.categorie.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <span className="font-semibold text-slate-900 block truncate">
                        {tx.beneficiaireNom}
                      </span>
                      <span className="text-[11px] text-slate-500 line-clamp-1">{tx.motif}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {tx.modePaiement}
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
                        title="Imprimer le bon de caisse"
                      >
                        <Printer className="w-3 h-3 text-slate-600" />
                        <span>Bon de caisse</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
