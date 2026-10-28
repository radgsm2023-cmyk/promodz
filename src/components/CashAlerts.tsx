import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { CaisseFondRoulement } from '../types';
import { formatDZD } from '../utils/formatters';

interface Props {
  caissesEnAlerte: CaisseFondRoulement[];
  onOpenAlimenterModal: (caisseId?: string) => void;
}

export const CashAlerts: React.FC<Props> = ({ caissesEnAlerte, onOpenAlimenterModal }) => {
  if (caissesEnAlerte.length === 0) return null;

  return (
    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-amber-900">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-amber-950">
            Alerte Seuil Bas sur {caissesEnAlerte.length} Caisse{caissesEnAlerte.length > 1 ? 's' : ''} de Fond de Roulement
          </h4>
          <p className="text-xs text-amber-800 mt-0.5">
            {caissesEnAlerte.map((c) => `${c.nom} (${formatDZD(c.soldeActuelDZD)})`).join(' · ')}
          </p>
        </div>
      </div>
      <button
        onClick={() => onOpenAlimenterModal(caissesEnAlerte[0]?.id)}
        className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors self-start md:self-auto whitespace-nowrap"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Réapprovisionner d'urgence
      </button>
    </div>
  );
};
