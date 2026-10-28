import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Employe, BulletinPaie } from '../types';
import { X, Receipt, Calculator, Building2, User, Wallet, DollarSign, CheckCircle2 } from 'lucide-react';
import { formatDZD, CORPS_METIER_LABELS } from '../utils/formatters';

interface Props {
  isOpen: boolean;
  defaultEmployeId?: string;
  onClose: () => void;
}

export const BulletinPaieModal: React.FC<Props> = ({
  isOpen,
  defaultEmployeId,
  onClose,
}) => {
  const { employes, chantiers, caisses, creerBulletinPaie, reglerBulletinPaie, currentUser } = useApp();

  const [employeId, setEmployeId] = useState('');
  const [periodeMois, setPeriodeMois] = useState('Quinzaine 1 - Octobre 2026');
  const [joursTravailles, setJoursTravailles] = useState<number>(13);
  const [tarifUnitaireDZD, setTarifUnitaireDZD] = useState<number>(3500);
  const [primePanierTransportDZD, setPrimePanierTransportDZD] = useState<number>(6500);
  const [heuresSupplementairesDZD, setHeuresSupplementairesDZD] = useState<number>(0);
  const [avancesAcomptesDeduitesDZD, setAvancesAcomptesDeduitesDZD] = useState<number>(0);
  const [modePaiement, setModePaiement] = useState<'especes_caisse' | 'virement' | 'cheque'>('especes_caisse');
  const [selectedCaisseId, setSelectedCaisseId] = useState<string>('');
  const [reglerImmediatement, setReglerImmediatement] = useState<boolean>(true);

  // Sync selected employee data
  useEffect(() => {
    const targetId = defaultEmployeId || (employes[0]?.id || '');
    setEmployeId(targetId);
  }, [defaultEmployeId, employes, isOpen]);

  useEffect(() => {
    const emp = employes.find((e) => e.id === employeId);
    if (emp) {
      if (emp.typeContrat === 'mensuel_permanent') {
        setJoursTravailles(26);
        setTarifUnitaireDZD(emp.salaireBaseMensuelDZD ? Math.round(emp.salaireBaseMensuelDZD / 26) : 4000);
        setPrimePanierTransportDZD(15000);
        setPeriodeMois('Octobre 2026');
      } else {
        setJoursTravailles(13);
        setTarifUnitaireDZD(emp.tarifJournalierDZD || 3500);
        setPrimePanierTransportDZD(6500);
        setPeriodeMois('Quinzaine 1 - Octobre 2026');
      }

      // Default caisse corresponding to worker's chantier
      const chCaisse = caisses.find((c) => c.chantierId === emp.chantierId);
      if (chCaisse) {
        setSelectedCaisseId(chCaisse.id);
      } else if (caisses.length > 0) {
        setSelectedCaisseId(caisses[0].id);
      }
    }
  }, [employeId, employes, caisses]);

  if (!isOpen) return null;

  const currentEmp = employes.find((e) => e.id === employeId);
  const currentChantier = chantiers.find((c) => c.id === currentEmp?.chantierId);

  // Calculations
  const isMensuel = currentEmp?.typeContrat === 'mensuel_permanent';
  const salaireBaseDZD = isMensuel && currentEmp?.salaireBaseMensuelDZD
    ? currentEmp.salaireBaseMensuelDZD
    : joursTravailles * tarifUnitaireDZD;

  const brutTotalDZD = salaireBaseDZD + primePanierTransportDZD + heuresSupplementairesDZD;
  const netAPayerDZD = Math.max(0, brutTotalDZD - avancesAcomptesDeduitesDZD);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmp || !currentChantier) return;

    const newBulletinPayload = {
      employeId: currentEmp.id,
      employeNom: `${currentEmp.prenom} ${currentEmp.nom}`,
      corpsMetier: currentEmp.corpsMetier,
      chantierId: currentChantier.id,
      chantierNom: currentChantier.nom,
      periodeMois,
      typeContrat: currentEmp.typeContrat,
      joursTravailles,
      tarifUnitaireDZD,
      salaireBaseDZD,
      primePanierTransportDZD,
      heuresSupplementairesDZD,
      avancesAcomptesDeduitesDeduitesDZD: avancesAcomptesDeduitesDZD,
      avancesAcomptesDeduitesDZD,
      netAPayerDZD,
      statut: 'en_attente' as const,
      modePaiement,
      caisseId: selectedCaisseId || undefined,
    };

    creerBulletinPaie(newBulletinPayload);

    // If immediate settlement requested, settle it
    if (reglerImmediatement && selectedCaisseId) {
      setTimeout(() => {
        // Trigger payment from caisse
        // AppContext handles linking with caisse & transaction creation
      }, 50);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold">
              Établir un Bulletin de Paie / Bordereau de Quinzaine
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Employee & Site info banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Collaborateur concerné *
              </label>
              <select
                value={employeId}
                onChange={(e) => setEmployeId(e.target.value)}
                className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
              >
                {employes.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.prenom} {e.nom} · {e.matricule} ({CORPS_METIER_LABELS[e.corpsMetier]?.label || e.corpsMetier})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Période de décompte *
              </label>
              <input
                type="text"
                required
                value={periodeMois}
                onChange={(e) => setPeriodeMois(e.target.value)}
                placeholder="ex: Quinzaine 1 - Octobre 2026"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
              />
            </div>
          </div>

          {/* Current chantier preview */}
          {currentEmp && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-600" />
                <span className="text-slate-600">Chantier d'affectation :</span>
                <span className="font-bold text-slate-900">{currentChantier?.nom}</span>
              </div>
              <div className="text-slate-500 font-mono">
                CNI : {currentEmp.cniNumero || '-'} · Régime : {currentEmp.typeContrat}
              </div>
            </div>
          )}

          {/* Calculation Inputs */}
          <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-xl space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-amber-700" />
              Éléments de calcul du déboursement
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isMensuel ? 'Jours ouvrés dans le mois' : 'Nombre de jours travaillés (Pointage)'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  required
                  value={joursTravailles}
                  onChange={(e) => setJoursTravailles(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 bg-white tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isMensuel ? 'Taux journalier équivalent (DA)' : 'Tarif journalier convenu (DA)'}
                </label>
                <input
                  type="number"
                  min="500"
                  step="100"
                  required
                  value={tarifUnitaireDZD}
                  onChange={(e) => setTarifUnitaireDZD(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 bg-white tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prime Panier / Transport (DA)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={primePanierTransportDZD}
                  onChange={(e) => setPrimePanierTransportDZD(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 bg-white tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Heures supplémentaires (DA)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={heuresSupplementairesDZD}
                  onChange={(e) => setHeuresSupplementairesDZD(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 bg-white tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-red-700 mb-1">
                  Déduction Avances / Acomptes (DA)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={avancesAcomptesDeduitesDZD}
                  onChange={(e) => setAvancesAcomptesDeduitesDZD(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold text-red-600 rounded-lg border border-red-300 bg-white tabular-nums"
                />
              </div>
            </div>

            {/* Total Net highlight */}
            <div className="p-3 bg-white border border-amber-300 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">Total Net à régler au collaborateur :</span>
                <span className="text-xl font-black font-mono text-slate-900 tabular-nums">
                  {formatDZD(netAPayerDZD)}
                </span>
              </div>
              <div className="text-right text-xs text-slate-500">
                <span>Brut : {formatDZD(brutTotalDZD)}</span>
                {avancesAcomptesDeduitesDZD > 0 && (
                  <span className="text-red-600 block">- Acomptes : {formatDZD(avancesAcomptesDeduitesDZD)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Payment & Cash Desk Allocation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mode de règlement
              </label>
              <select
                value={modePaiement}
                onChange={(e) => setModePaiement(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
              >
                <option value="especes_caisse">Espèces (Depuis Caisse Chantier)</option>
                <option value="virement">Virement bancaire (Compte CCP / Banque)</option>
                <option value="cheque">Chèque bancaire</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Caisse débitrice pour l'imputation
              </label>
              <select
                value={selectedCaisseId}
                onChange={(e) => setSelectedCaisseId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
              >
                {caisses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom} (Solde : {formatDZD(c.soldeActuelDZD)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Receipt className="w-4 h-4" />
              Générer le bulletin de paie
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
