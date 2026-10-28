import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatDZD } from '../utils/formatters';
import { X, Wallet, ArrowRight, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetCaisseId?: string;
}

export const AlimenterCaisseModal: React.FC<Props> = ({
  isOpen,
  onClose,
  targetCaisseId,
}) => {
  const { caisses, isChantierAllowed, isGlobalUser, demanderAlimentationCaisse } = useApp();

  const targetCaisses = caisses.filter((c) => {
    if (isGlobalUser) return true;
    if (!c.chantierId) return false;
    return isChantierAllowed(c.chantierId);
  });

  const [caisseCibleId, setCaisseCibleId] = useState(
    targetCaisseId || targetCaisses[0]?.id || caisses[0]?.id || ''
  );
  const [caisseSourceId, setCaisseSourceId] = useState<string>(
    caisses.find((c) => c.chantierId === null)?.id || 'banque'
  );
  const [montantDZD, setMontantDZD] = useState('500000');
  const [modePaiement, setModePaiement] = useState<'especes' | 'virement' | 'cheque'>('especes');
  const [motif, setMotif] = useState('Réapprovisionnement fond de roulement chantier pour dépenses urgentes et main d’œuvre');

  if (!isOpen) return null;

  const targetCaisse = caisses.find((c) => c.id === caisseCibleId);
  const sourceCaisse = caisses.find((c) => c.id === caisseSourceId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const montant = parseFloat(montantDZD);
    if (isNaN(montant) || montant <= 0) return;

    demanderAlimentationCaisse({
      caisseCibleId,
      montantDZD: montant,
      caisseSourceId: caisseSourceId === 'banque' ? null : caisseSourceId,
      motif,
      modePaiement,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold">
              {isGlobalUser ? "Alimenter une Caisse de Chantier" : "Demander l'Alimentation d'une Caisse"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              {isGlobalUser
                ? "En tant qu'administrateur / directeur, ce réapprovisionnement sera exécuté immédiatement avec mise à jour automatique des soldes et émission des pièces comptables."
                : "En tant que responsable / chef de chantier, votre demande sera transmise à l'administration / direction pour validation avant l'exécution du transfert de trésorerie."}
            </p>
          </div>

          {/* Caisse source */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Provenance des fonds (Source) *
            </label>
            <select
              value={caisseSourceId}
              onChange={(e) => setCaisseSourceId(e.target.value)}
              className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
            >
              <option value="banque">Compte Bancaire Entreprise (Retrait bancaire)</option>
              {caisses.map((cs) => (
                <option key={cs.id} value={cs.id} disabled={cs.id === caisseCibleId}>
                  {cs.nom} (Solde disponible : {formatDZD(cs.soldeActuelDZD)})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-center -my-1 text-slate-400">
            <ArrowRight className="w-4 h-4 rotate-90" />
          </div>

          {/* Caisse cible */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Caisse bénéficiaire (Chantier récepteur) *
            </label>
            <select
              value={caisseCibleId}
              onChange={(e) => setCaisseCibleId(e.target.value)}
              className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
            >
              {targetCaisses.map((cs) => (
                <option key={cs.id} value={cs.id} disabled={cs.id === caisseSourceId}>
                  {cs.nom} — Solde actuel: {formatDZD(cs.soldeActuelDZD)}
                </option>
              ))}
            </select>
            {targetCaisse && (
              <p className="text-[11px] text-slate-500 mt-1">
                Responsable caisse : <span className="font-semibold text-slate-700">{targetCaisse.responsable}</span> ({targetCaisse.telephoneResponsable})
              </p>
            )}
          </div>

          {/* Montant */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Montant à verser en Dinars Algériens (DA) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="1000"
                required
                value={montantDZD}
                onChange={(e) => setMontantDZD(e.target.value)}
                className="w-full px-3 py-2 text-base font-mono font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden tabular-nums"
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 font-mono">
                DA
              </span>
            </div>
            {/* Quick amount chips */}
            <div className="flex items-center gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => setMontantDZD('200000')}
                className="px-2 py-1 text-[11px] font-mono text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
              >
                200 000 DA
              </button>
              <button
                type="button"
                onClick={() => setMontantDZD('500000')}
                className="px-2 py-1 text-[11px] font-mono text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
              >
                500 000 DA
              </button>
              <button
                type="button"
                onClick={() => setMontantDZD('1000000')}
                className="px-2 py-1 text-[11px] font-mono text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
              >
                1 000 000 DA
              </button>
            </div>
          </div>

          {/* Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mode de transfert *
            </label>
            <select
              value={modePaiement}
              onChange={(e) => setModePaiement(e.target.value as any)}
              className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
            >
              <option value="especes">Espèces (Mise à disposition en mains propres)</option>
              <option value="cheque">Chèque bancaire de réapprovisionnement</option>
              <option value="virement">Virement bancaire interne</option>
            </select>
          </div>

          {/* Motif */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Motif du réapprovisionnement
            </label>
            <textarea
              rows={2}
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              Confirmer le transfert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
