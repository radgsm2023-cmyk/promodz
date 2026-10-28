import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Employe } from '../types';
import { X, ArrowRight, Building2, HardHat, CheckCircle2, Calendar } from 'lucide-react';
import { CORPS_METIER_LABELS } from '../utils/formatters';

interface Props {
  isOpen: boolean;
  employe?: Employe | null;
  onClose: () => void;
}

export const AffectationModal: React.FC<Props> = ({
  isOpen,
  employe,
  onClose,
}) => {
  const { employes, chantiers, userAllowedChantiers, affecterEmployeChantier } = useApp();

  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [targetChantierId, setTargetChantierId] = useState('');
  const [motif, setMotif] = useState('Renfort d\'équipe pour phase active');
  const [dateEffet, setDateEffet] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (employe) {
      setSelectedEmpId(employe.id);
      // default destination to another chantier if available
      const otherCh = chantiers.find((c) => c.id !== employe.chantierId);
      setTargetChantierId(otherCh?.id || '');
    } else if (employes.length > 0) {
      setSelectedEmpId(employes[0].id);
      const otherCh = chantiers.find((c) => c.id !== employes[0].chantierId);
      setTargetChantierId(otherCh?.id || '');
    }
  }, [employe, employes, chantiers, isOpen]);

  if (!isOpen) return null;

  const currentEmp = employes.find((e) => e.id === selectedEmpId) || employe;
  const currentChantier = chantiers.find((c) => c.id === currentEmp?.chantierId);
  const targetChantier = chantiers.find((c) => c.id === targetChantierId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmp || !targetChantierId) return;

    affecterEmployeChantier(currentEmp.id, targetChantierId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold">Affectation & Mutation de Chantier</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Employe selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Collaborateur / Ouvrier à réaffecter *
            </label>
            <select
              value={selectedEmpId}
              onChange={(e) => {
                setSelectedEmpId(e.target.value);
                const selected = employes.find((emp) => emp.id === e.target.value);
                if (selected) {
                  const other = chantiers.find((c) => c.id !== selected.chantierId);
                  setTargetChantierId(other?.id || '');
                }
              }}
              className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
            >
              {employes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.prenom} {e.nom} · {e.matricule} ({CORPS_METIER_LABELS[e.corpsMetier]?.label || e.corpsMetier})
                </option>
              ))}
            </select>
          </div>

          {/* Current vs Target Flow */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="grid grid-cols-1 sm:grid-cols-5 items-center gap-3">
              {/* Source */}
              <div className="sm:col-span-2 p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Chantier Actuel
                </span>
                <p className="text-xs font-bold text-slate-900 truncate">
                  {currentChantier?.nom || 'Non affecté'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {currentChantier?.wilaya || '-'}
                </p>
              </div>

              {/* Arrow */}
              <div className="flex justify-center text-amber-500">
                <ArrowRight className="w-6 h-6 rotate-90 sm:rotate-0" />
              </div>

              {/* Destination */}
              <div className="sm:col-span-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                <span className="text-[10px] uppercase font-bold text-amber-700 block mb-1">
                  Nouveau Chantier Cible *
                </span>
                <select
                  required
                  value={targetChantierId}
                  onChange={(e) => setTargetChantierId(e.target.value)}
                  className="w-full text-xs font-bold text-slate-900 bg-transparent border-0 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Choisir le chantier --</option>
                  {userAllowedChantiers.map((ch) => (
                    <option key={ch.id} value={ch.id} disabled={ch.id === currentChantier?.id}>
                      {ch.nom} {ch.id === currentChantier?.id ? '(actuel)' : `(${ch.wilaya})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Motif & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date d'effet de l'affectation
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={dateEffet}
                  onChange={(e) => setDateEffet(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motif de la mutation / affectation
              </label>
              <select
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
              >
                <option value="Renfort coulage dalle et voile">Renfort coulage dalle et voiles</option>
                <option value="Démarrage nouvelle tranche travaux">Démarrage nouvelle tranche</option>
                <option value="Achèvement phase gros œuvre">Achèvement gros œuvre</option>
                <option value="Besoins d'encadrement technique">Besoin encadrement technique</option>
                <option value="Remplacement temporaire">Remplacement temporaire</option>
              </select>
            </div>
          </div>

          {/* Info Banner */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              Le pointage et les futurs bordereaux de quinzaine de cet ouvrier seront imputés sur le budget et la caisse du chantier <strong>{targetChantier?.nom || 'sélectionné'}</strong>.
            </p>
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
              disabled={!targetChantierId || targetChantierId === currentChantier?.id}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:pointer-events-none rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Building2 className="w-4 h-4" />
              Confirmer la réaffectation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
