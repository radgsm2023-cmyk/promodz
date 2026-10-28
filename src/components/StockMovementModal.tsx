import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, PackageCheck, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultStockItemId?: string;
}

export const StockMovementModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultStockItemId,
}) => {
  const { stocks, chantiers, isChantierAllowed, tiers, addMouvementStock, currentUser } = useApp();

  const allowedStocks = stocks.filter((s) => isChantierAllowed(s.chantierId));

  const [stockItemId, setStockItemId] = useState(defaultStockItemId || allowedStocks[0]?.id || stocks[0]?.id || '');
  const [type, setType] = useState<'entree_livraison' | 'sortie_consommation'>('entree_livraison');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantite, setQuantite] = useState('50');
  const [referenceBon, setReferenceBon] = useState(`BL-${Date.now().toString().slice(-5)}`);
  const [fournisseurNom, setFournisseurNom] = useState('Lafarge Béton & Ciments Algérie');
  const [agentRecepteur, setAgentRecepteur] = useState(currentUser.nom);
  const [motif, setMotif] = useState('Réception approvisionnement matériaux sur chantier');

  if (!isOpen) return null;

  const currentItem = stocks.find((s) => s.id === stockItemId);
  const fournisseurs = tiers.filter((t) => t.type === 'fournisseur');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem) return;

    const qty = parseFloat(quantite);
    if (isNaN(qty) || qty <= 0) return;

    addMouvementStock({
      date,
      stockItemId: currentItem.id,
      stockDesignation: currentItem.designation,
      chantierId: currentItem.chantierId,
      type,
      quantite: qty,
      unite: currentItem.unite,
      referenceBon: referenceBon.trim(),
      fournisseurNom: type === 'entree_livraison' ? fournisseurNom : undefined,
      agentRecepteur: agentRecepteur.trim() || currentUser.nom,
      motif: motif.trim() || 'Mouvement de stock régulier',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold">Enregistrer un Mouvement de Matériau</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type Segmented switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setType('entree_livraison');
                setReferenceBon(`BL-${Date.now().toString().slice(-5)}`);
                setMotif('Réception approvisionnement livraison fournisseur');
              }}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
                type === 'entree_livraison'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              Bon d'Entrée (Livraison)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('sortie_consommation');
                setReferenceBon(`BS-${Date.now().toString().slice(-5)}`);
                setMotif('Consommation sur chantier pour travaux de coulage / maçonnerie');
              }}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
                type === 'sortie_consommation'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Bon de Sortie (Chantier)
            </button>
          </div>

          {/* Select Stock item */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Article / Matériau concerné *
            </label>
            <select
              value={stockItemId}
              onChange={(e) => setStockItemId(e.target.value)}
              className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
            >
              {allowedStocks.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.designation} — Stock actuel : {item.quantiteEnStock} {item.unite}s ({item.chantierNom})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantité ({currentItem?.unite || 'unité'}) *
              </label>
              <input
                type="number"
                step="any"
                min="0.1"
                required
                value={quantite}
                onChange={(e) => setQuantite(e.target.value)}
                className="w-full px-3 py-2 text-base font-mono font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden font-mono"
              />
            </div>
          </div>

          {/* Reference Document */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {type === 'entree_livraison' ? 'N° Bon de Livraison Fournisseur *' : 'N° Bon de Sortie Interne *'}
            </label>
            <input
              type="text"
              required
              value={referenceBon}
              onChange={(e) => setReferenceBon(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
            />
          </div>

          {type === 'entree_livraison' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fournisseur expéditeur
              </label>
              <input
                type="text"
                value={fournisseurNom}
                onChange={(e) => setFournisseurNom(e.target.value)}
                placeholder="Ex: Lafarge Béton Algérie"
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Agent réceptionnaire / Conducteur de travaux
            </label>
            <input
              type="text"
              value={agentRecepteur}
              onChange={(e) => setAgentRecepteur(e.target.value)}
              className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Motif / Destination d’emploi
            </label>
            <input
              type="text"
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
              Valider le mouvement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
