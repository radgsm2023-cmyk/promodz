import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ClotureMensuelle } from '../types';
import { formatDZD, formatDateFR, formatDateTimeFR } from '../utils/formatters';
import {
  Lock,
  Unlock,
  ShieldAlert,
  Calendar,
  DollarSign,
  TrendingDown,
  TrendingUp,
  FileCheck,
  Building,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Info,
  ShieldCheck,
  History,
  LockKeyhole,
  Check,
  X,
} from 'lucide-react';

const MOIS_FR: { [key: string]: string } = {
  '01': 'Janvier',
  '02': 'Février',
  '03': 'Mars',
  '04': 'Avril',
  '05': 'Mai',
  '06': 'Juin',
  '07': 'Juillet',
  '08': 'Août',
  '09': 'Septembre',
  '10': 'Octobre',
  '11': 'Novembre',
  '12': 'Décembre',
};

export const ClotureMensuelleView: React.FC = () => {
  const {
    cloturesMensuelles,
    transactions,
    chantiers,
    effectuerClotureMensuelle,
    deverrouillerClotureMensuelle,
    reverrouillerClotureMensuelle,
    currentUser,
  } = useApp();

  // Default selected month to lock (e.g. current or previous month)
  const today = new Date();
  const defaultYear = today.getFullYear();
  const defaultMonth = String(today.getMonth() + 1).padStart(2, '0');
  const [selectedAnneeMois, setSelectedAnneeMois] = useState(`${defaultYear}-${defaultMonth}`);

  // Confirm closure modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Exceptional unlock modal state
  const [unlockTarget, setUnlockTarget] = useState<ClotureMensuelle | null>(null);
  const [unlockMotif, setUnlockMotif] = useState('');
  const [unlockError, setUnlockError] = useState('');

  // Status notification
  const [notification, setNotification] = useState<{ text: string; isError?: boolean } | null>(null);

  // Calculate statistics for the selected month in preview
  const txsMoisSelected = transactions.filter(
    (tx) => tx.date.startsWith(selectedAnneeMois) && tx.statut !== 'rejete'
  );

  const totalDepensesDZD = txsMoisSelected
    .filter((tx) => tx.type === 'sortie')
    .reduce((acc, tx) => acc + tx.montantDZD, 0);

  const totalRecettesDZD = txsMoisSelected
    .filter((tx) => tx.type === 'entree')
    .reduce((acc, tx) => acc + tx.montantDZD, 0);

  const soldeNetDZD = totalRecettesDZD - totalDepensesDZD;

  const chantiersImpactesCount = new Set(
    txsMoisSelected.map((tx) => tx.chantierId).filter(Boolean)
  ).size;

  const existingCloture = cloturesMensuelles.find((c) => c.anneeMois === selectedAnneeMois);
  const isSelectedMonthClosed = existingCloture?.statut === 'verrouille';

  // Format label for year-month
  const formatLibelleAnneeMois = (ym: string) => {
    const [y, m] = ym.split('-');
    const mName = MOIS_FR[m] || m;
    return `${mName} ${y}`;
  };

  // Perform closure
  const handleExecuteCloture = () => {
    effectuerClotureMensuelle(selectedAnneeMois);
    setShowConfirmModal(false);
    setNotification({
      text: `Clôture mensuelle définitive exécutée pour ${formatLibelleAnneeMois(selectedAnneeMois)}. Toutes les transactions du mois sont désormais verrouillées.`,
    });
    setTimeout(() => setNotification(null), 5000);
  };

  // Execute Exceptional Unlock
  const handleConfirmUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockMotif.trim() || unlockMotif.trim().length < 10) {
      setUnlockError('Veuillez fournir un motif d’exception détaillé (minimum 10 caractères).');
      return;
    }

    if (unlockTarget) {
      deverrouillerClotureMensuelle(unlockTarget.id, unlockMotif.trim());
      setNotification({
        text: `Déverrouillage exceptionnel accordé pour la clôture ${unlockTarget.libelleMois}. Motifs consignés dans le journal d'audit.`,
      });
      setTimeout(() => setNotification(null), 5000);
    }

    setUnlockTarget(null);
    setUnlockMotif('');
    setUnlockError('');
  };

  // Re-lock
  const handleReLock = (clotureId: string, libelle: string) => {
    reverrouillerClotureMensuelle(clotureId);
    setNotification({
      text: `Période ${libelle} re-verrouillée avec succès.`,
    });
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                <LockKeyhole className="w-3.5 h-3.5" /> Clôture Comptable & Verrouillage Financier
              </span>
              <span className="text-xs text-slate-400">Périodes Inviolables (Normes BTPH / Direction)</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">Verrouillage Définitif des Transactions Passées</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              La clôture mensuelle fige définitivement les états financiers du mois écoulé. Une fois un mois clôturé,
              toute modification, suppression ou ajout rétroactif de dépenses et recettes est rigoureusement bloqué.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl flex items-center gap-2 font-mono">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>{cloturesMensuelles.filter((c) => c.statut === 'verrouille').length} Mois Clôturés</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notification toast */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-md animate-fade-in ${
            notification.isError
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.isError ? (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Section 1: Perform New Monthly Closure */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              <span>Exécuter une Nouvelle Clôture Mensuelle</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sélectionnez une période mensuelle pour analyser les totaux financiers et verrouiller le mois.
            </p>
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Période Cible :</label>
            <input
              type="month"
              value={selectedAnneeMois}
              onChange={(e) => setSelectedAnneeMois(e.target.value)}
              className="px-3 py-2 text-xs font-mono font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Selected Period Financial Preview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Volume Transactions
            </span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-mono font-black text-slate-900">{txsMoisSelected.length}</span>
              <FileCheck className="w-5 h-5 text-slate-400" />
            </div>
            <span className="text-[10px] text-slate-500 block">Sur {chantiersImpactesCount} chantier(s)</span>
          </div>

          <div className="p-4 bg-red-50/70 rounded-xl border border-red-100 space-y-1">
            <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider block">
              Total Dépenses Cumulées
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-mono font-bold text-red-700 tabular-nums">
                {formatDZD(totalDepensesDZD)}
              </span>
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <span className="text-[10px] text-red-600 block">Frais engins, matériaux, paies</span>
          </div>

          <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-100 space-y-1">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
              Total Recettes Encaissées
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-mono font-bold text-emerald-700 tabular-nums">
                {formatDZD(totalRecettesDZD)}
              </span>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-[10px] text-emerald-600 block">Apports VSP & réapprovisionnements</span>
          </div>

          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-1">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
              Solde Net Période (DA)
            </span>
            <div className="flex items-center justify-between">
              <span className={`text-xl font-mono font-bold tabular-nums ${soldeNetDZD >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {soldeNetDZD >= 0 ? '+' : ''}{formatDZD(soldeNetDZD)}
              </span>
              <DollarSign className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-[10px] text-slate-400 block">Résultat net comptable</span>
          </div>
        </div>

        {/* Action Button & Status Banner */}
        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            {isSelectedMonthClosed ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-xs font-bold">
                <Lock className="w-4 h-4 text-amber-700" />
                <span>Ce mois ({formatLibelleAnneeMois(selectedAnneeMois)}) est déjà clôturé et verrouillé.</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Le mois <strong>{formatLibelleAnneeMois(selectedAnneeMois)}</strong> est actuellement <strong>ouvert</strong> aux saisies et modifications.
                </span>
              </div>
            )}
          </div>

          {!isSelectedMonthClosed && (
            <button
              onClick={() => setShowConfirmModal(true)}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Clôturer Définitivement le Mois ({selectedAnneeMois})</span>
            </button>
          )}
        </div>
      </div>

      {/* Section 2: Table of Historical Closures */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-amber-600" />
              <span>Historique des Clôtures & Registre de Verrouillage</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Consultez toutes les clôtures mensuelles enregistrées et les éventuels déverrouillages exceptionnels.
            </p>
          </div>

          <span className="text-xs font-mono font-bold text-slate-600 px-3 py-1 bg-slate-100 rounded-lg">
            Total : {cloturesMensuelles.length} Périodes Registrées
          </span>
        </div>

        {cloturesMensuelles.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Aucune clôture mensuelle enregistrée pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white uppercase tracking-wider text-[11px] font-bold">
                  <th className="py-3 px-4">Période Clôturée</th>
                  <th className="py-3 px-4">Date Verrouillage</th>
                  <th className="py-3 px-4">Verrouillé Par</th>
                  <th className="py-3 px-4 text-center">Volume Tx</th>
                  <th className="py-3 px-4 text-right">Dépenses (DA)</th>
                  <th className="py-3 px-4 text-right">Recettes (DA)</th>
                  <th className="py-3 px-4 text-right">Solde Net (DA)</th>
                  <th className="py-3 px-4 text-center">Statut Verrou</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {cloturesMensuelles.map((cloture) => {
                  const isLocked = cloture.statut === 'verrouille';
                  return (
                    <tr key={cloture.id} className="hover:bg-slate-50 transition-colors font-mono">
                      <td className="py-3 px-4 font-bold text-slate-900 font-sans">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>{cloture.libelleMois}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({cloture.anneeMois})</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{formatDateTimeFR(cloture.dateVerrouillage)}</td>
                      <td className="py-3 px-4 font-sans text-slate-800">
                        <div className="font-semibold">{cloture.verrouilleParNom}</div>
                        <div className="text-[10px] text-slate-400">{cloture.verrouilleParRole}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">
                        {cloture.nbTransactionsVerrouillees} tx
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-red-600 tabular-nums">
                        {formatDZD(cloture.totalDepensesDZD)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 tabular-nums">
                        {formatDZD(cloture.totalRecettesDZD)}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold tabular-nums ${cloture.soldeNetMoisDZD >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {cloture.soldeNetMoisDZD >= 0 ? '+' : ''}{formatDZD(cloture.soldeNetMoisDZD)}
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-800 border border-red-300 rounded-full text-[10px] font-bold">
                            <Lock className="w-3 h-3 text-red-700" /> Verrouillé
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-[10px] font-bold">
                            <Unlock className="w-3 h-3 text-amber-700" /> Déverrouillé (Exception)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        {isLocked ? (
                          <button
                            onClick={() => {
                              setUnlockTarget(cloture);
                              setUnlockMotif('');
                              setUnlockError('');
                            }}
                            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-amber-400 text-[11px] font-bold rounded-lg transition shadow-2xs flex items-center justify-center gap-1 mx-auto cursor-pointer"
                            title="SuperAdmin : Déverrouillage exceptionnel temporaire"
                          >
                            <Unlock className="w-3 h-3" />
                            <span>Déverrouiller</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReLock(cloture.id, cloture.libelleMois)}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold rounded-lg transition shadow-2xs flex items-center justify-center gap-1 mx-auto cursor-pointer"
                            title="Re-verrouiller définitivement"
                          >
                            <Lock className="w-3 h-3" />
                            <span>Re-verrouiller</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: CONFIRMATION CLÔTURE */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold">Confirmation Clôture Mensuelle ({selectedAnneeMois})</h3>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <strong className="block font-bold mb-1">Avertissement Inviolabilité Comptable :</strong>
                  Vous êtes sur le point de clôturer définitivement le mois de <strong>{formatLibelleAnneeMois(selectedAnneeMois)}</strong>.
                  Cette opération fige <strong>{txsMoisSelected.length} transactions</strong> pour un solde net de <strong>{formatDZD(soldeNetDZD)}</strong>.
                  Toute modification ultérieure sur ces écritures sera bloquée.
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono">
                <div className="flex justify-between">
                  <span>Operateur :</span>
                  <span className="font-bold text-slate-900">{currentUser.nom} ({currentUser.role})</span>
                </div>
                <div className="flex justify-between">
                  <span>Transactions impactées :</span>
                  <span className="font-bold text-slate-900">{txsMoisSelected.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dépenses totales :</span>
                  <span className="font-bold text-red-600">{formatDZD(totalDepensesDZD)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Recettes totales :</span>
                  <span className="font-bold text-emerald-600">{formatDZD(totalRecettesDZD)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleExecuteCloture}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Confirmer la Clôture Définitive</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DÉVERROUILLAGE EXCEPTIONNEL SUPERADMIN */}
      {unlockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-red-950 text-white">
              <div className="flex items-center gap-2">
                <Unlock className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold">Déverrouillage Exceptionnel ({unlockTarget.libelleMois})</h3>
              </div>
              <button
                onClick={() => setUnlockTarget(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmUnlock} className="p-6 space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 leading-relaxed">
                <strong className="block font-bold mb-1">Procédure de Sécurité SuperAdmin :</strong>
                Le déverrouillage d'un mois clos altère la piste d'audit financière. Un motif impératif doit être consigné et sera conservé de façon inaltérable dans le Journal d'Audit Système.
              </div>

              {unlockError && (
                <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-xl text-xs font-bold">
                  {unlockError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Motif Obligatoire de Déverrouillage *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ex: Correction sous la supervision du Chef Comptable suite au contrôle fiscal ou révision d'attachement sous-traitant."
                  value={unlockMotif}
                  onChange={(e) => {
                    setUnlockMotif(e.target.value);
                    setUnlockError('');
                  }}
                  className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUnlockTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Accorder le Déverrouillage Exceptionnel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
