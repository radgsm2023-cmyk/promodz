import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StockItem } from '../types';
import { formatDZD, formatDateFR } from '../utils/formatters';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Building,
  Layers,
  History,
  Edit2,
  X,
  BellRing,
  Filter,
} from 'lucide-react';

interface Props {
  onOpenStockMovementModal: (stockItemId?: string) => void;
}

export const StocksView: React.FC<Props> = ({ onOpenStockMovementModal }) => {
  const { stocks, chantiers, mouvementsStock, addStockItem, updateStockItemThreshold, currentUser } = useApp();

  const isGlobalUser = currentUser.role === 'superadmin' || currentUser.role === 'directeur_promoteur' || currentUser.chantiersAssignes.includes('*');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterChantier, setFilterChantier] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterOnlyAlerts, setFilterOnlyAlerts] = useState<boolean>(false);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);

  // Edit threshold modal state
  const [editingThresholdItem, setEditingThresholdItem] = useState<StockItem | null>(null);
  const [newThresholdValue, setNewThresholdValue] = useState<string>('');

  // New stock form
  const [designation, setDesignation] = useState('');
  const [categorie, setCategorie] = useState<StockItem['categorie']>('liants_ciment');
  const [chantierId, setChantierId] = useState(chantiers[0]?.id || '');
  const [quantiteEnStock, setQuantiteEnStock] = useState('100');
  const [quantiteMinAlerte, setQuantiteMinAlerte] = useState('20');
  const [unite, setUnite] = useState<StockItem['unite']>('sac');
  const [prixUnitaireMoyenDZD, setPrixUnitaireMoyenDZD] = useState('650');
  const [emplacementChantier, setEmplacementChantier] = useState('Dépôt Matériaux');

  // Filter stocks
  const filtered = stocks.filter((item) => {
    if (!isGlobalUser && !currentUser.chantiersAssignes.includes(item.chantierId)) {
      return false;
    }
    const matchSearch =
      item.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchChantier = filterChantier === 'all' || item.chantierId === filterChantier;
    const matchCategory = filterCategory === 'all' || item.categorie === filterCategory;
    const matchAlerts = !filterOnlyAlerts || item.quantiteEnStock <= item.quantiteMinAlerte;
    return matchSearch && matchChantier && matchCategory && matchAlerts;
  });

  const totalValeurStock = filtered.reduce((acc, s) => acc + s.valeurTotaleDZD, 0);
  const itemsEnAlerte = stocks.filter((s) => {
    if (!isGlobalUser && !currentUser.chantiersAssignes.includes(s.chantierId)) return false;
    return s.quantiteEnStock <= s.quantiteMinAlerte;
  });

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!designation.trim()) return;

    const selectedCh = chantiers.find((c) => c.id === chantierId);

    addStockItem({
      designation: designation.trim(),
      categorie,
      chantierId,
      chantierNom: selectedCh?.nom || 'Chantier',
      quantiteEnStock: parseFloat(quantiteEnStock) || 0,
      quantiteMinAlerte: parseFloat(quantiteMinAlerte) || 0,
      unite,
      prixUnitaireMoyenDZD: parseFloat(prixUnitaireMoyenDZD) || 0,
      dernierMouvementDate: new Date().toISOString().split('T')[0],
      emplacementChantier: emplacementChantier.trim() || 'Zone stockage chantier',
    });

    setIsAddStockModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">
            Valorisation Totale du Stock
          </span>
          <p className="text-xl font-mono font-bold text-slate-900 tabular-nums">
            {formatDZD(totalValeurStock)}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            Matériaux physiques présents sur les chantiers
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">
            Nombre de Références Suivies
          </span>
          <p className="text-xl font-mono font-bold text-slate-900 tabular-nums">
            {filtered.length} articles
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            Ciment, Acier, Briques, Sable, Granulats...
          </span>
        </div>

        <div
          className={`p-4 rounded-xl border shadow-2xs ${
            itemsEnAlerte.length > 0
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <span className="text-xs font-semibold uppercase tracking-wider block mb-1">
            Articles Sous Seuil Minimal
          </span>
          <div className="flex items-center justify-between">
            <p className="text-xl font-mono font-bold text-amber-700 tabular-nums">
              {itemsEnAlerte.length} alerte{itemsEnAlerte.length > 1 ? 's' : ''}
            </p>
            {itemsEnAlerte.length > 0 && (
              <span className="text-xs text-amber-800 font-semibold">Réapprovisionner</span>
            )}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Risque de rupture de coulage ou de pose
          </span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher matériau, acier, ciment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
            />
          </div>

          <select
            value={filterChantier}
            onChange={(e) => setFilterChantier(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
          >
            <option value="all">Tous les chantiers</option>
            {chantiers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
          >
            <option value="all">Toutes les catégories</option>
            <option value="liants_ciment">Liants & Ciments</option>
            <option value="acier_fer">Acier & Fer à béton</option>
            <option value="maconnerie">Maçonnerie & Briques</option>
            <option value="agregats">Agrégats & Sable</option>
            <option value="carrelage_marbre">Carrelage & Marbre</option>
          </select>

          {/* Quick toggle for threshold alerts */}
          <button
            type="button"
            onClick={() => setFilterOnlyAlerts(!filterOnlyAlerts)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
              filterOnlyAlerts
                ? 'bg-red-600 text-white border-red-700 shadow-xs'
                : itemsEnAlerte.length > 0
                ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>En alerte seuil ({itemsEnAlerte.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenStockMovementModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Mouvement Entrée/Sortie</span>
          </button>
          <button
            onClick={() => setIsAddStockModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Nouvel Article</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                <th className="py-3 px-3.5">Réf / Article</th>
                <th className="py-3 px-3.5">Chantier d'entreposage</th>
                <th className="py-3 px-3.5 text-right">Quantité Stock</th>
                <th className="py-3 px-3.5 text-right">Seuil Alerte Défini</th>
                <th className="py-3 px-3.5 text-right">Prix Unitaire Moyen</th>
                <th className="py-3 px-3.5 text-right">Valeur Totale (DA)</th>
                <th className="py-3 px-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((item) => {
                const isCritique = item.quantiteEnStock <= item.quantiteMinAlerte;
                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isCritique ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="py-3 px-3.5">
                      <div className="flex items-start gap-2">
                        {isCritique && (
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className="font-bold text-slate-900 block">{item.designation}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {item.code} · {item.emplacementChantier}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3.5">
                      <span className="font-semibold text-slate-800 block">{item.chantierNom}</span>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {item.categorie.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <span
                        className={`text-sm font-mono font-bold tabular-nums ${
                          isCritique ? 'text-red-600' : 'text-slate-900'
                        }`}
                      >
                        {item.quantiteEnStock} {item.unite}s
                      </span>
                      {isCritique && (
                        <span className="text-[10px] text-red-600 font-bold block uppercase tracking-tight">
                          Stock Critique
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={() => {
                          setEditingThresholdItem(item);
                          setNewThresholdValue(item.quantiteMinAlerte.toString());
                        }}
                        className="inline-flex items-center gap-1 font-mono text-slate-700 hover:text-amber-700 hover:underline cursor-pointer group"
                        title="Cliquer pour ajuster le seuil d'alerte"
                      >
                        <span className="tabular-nums font-semibold">{item.quantiteMinAlerte} {item.unite}s</span>
                        <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-amber-600" />
                      </button>
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono tabular-nums">
                      {formatDZD(item.prixUnitaireMoyenDZD)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatDZD(item.valeurTotaleDZD)}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenStockMovementModal(item.id)}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors ${
                            isCritique
                              ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-2xs font-bold'
                              : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                          }`}
                        >
                          {isCritique ? '+ Réapprovisionner' : 'Mouvement'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingThresholdItem(item);
                            setNewThresholdValue(item.quantiteMinAlerte.toString());
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                          title="Modifier le seuil d'alerte"
                        >
                          <BellRing className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Stock Movements Journal */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
          Historique des Derniers Mouvements (Bons de Livraison & Bons de Sortie)
        </h3>
        <div className="space-y-2">
          {mouvementsStock.map((mvt) => (
            <div
              key={mvt.id}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/60 text-xs"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`p-1.5 rounded ${
                    mvt.type === 'entree_livraison'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {mvt.type === 'entree_livraison' ? (
                    <ArrowDownLeft className="w-4 h-4" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4" />
                  )}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{mvt.stockDesignation}</span>
                    <span className="font-mono text-slate-500 font-semibold">{mvt.referenceBon}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {mvt.motif} {mvt.fournisseurNom ? `· Fournisseur: ${mvt.fournisseurNom}` : ''}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono font-bold text-slate-900 block tabular-nums">
                  {mvt.type === 'entree_livraison' ? '+' : '-'}{mvt.quantite} {mvt.unite}s
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{formatDateFR(mvt.date)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Stock Item Modal */}
      {isAddStockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-semibold">Ajouter un Article au Stock Chantier</h3>
              </div>
              <button
                onClick={() => setIsAddStockModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddStock} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Désignation du matériau *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ciment Gris CPJ 42.5 ou Fer à béton D14"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catégorie *
                  </label>
                  <select
                    value={categorie}
                    onChange={(e) => setCategorie(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                  >
                    <option value="liants_ciment">Liants & Ciment</option>
                    <option value="acier_fer">Acier & Fer à béton</option>
                    <option value="maconnerie">Maçonnerie & Briques</option>
                    <option value="agregats">Agrégats & Sable</option>
                    <option value="carrelage_marbre">Carrelage & Marbre</option>
                    <option value="peinture_etancheite">Peinture & Étanchéité</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chantier d'affectation *
                  </label>
                  <select
                    value={chantierId}
                    onChange={(e) => setChantierId(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                  >
                    {chantiers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantité *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={quantiteEnStock}
                    onChange={(e) => setQuantiteEnStock(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unité *</label>
                  <select
                    value={unite}
                    onChange={(e) => setUnite(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                  >
                    <option value="sac">Sacs (50kg)</option>
                    <option value="tonne">Tonnes</option>
                    <option value="piece">Pièces</option>
                    <option value="m3">Mètres cubes (m³)</option>
                    <option value="m2">Mètres carrés (m²)</option>
                    <option value="palette">Palettes</option>
                    <option value="litre">Litres</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Seuil Alerte
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={quantiteMinAlerte}
                    onChange={(e) => setQuantiteMinAlerte(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prix Unitaire Moyen (DA)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={prixUnitaireMoyenDZD}
                    onChange={(e) => setPrixUnitaireMoyenDZD(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Emplacement sur site
                  </label>
                  <input
                    type="text"
                    value={emplacementChantier}
                    onChange={(e) => setEmplacementChantier(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddStockModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Ajouter au stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Threshold */}
      {editingThresholdItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-semibold">Seuil d'Alerte Minimal</h3>
              </div>
              <button
                onClick={() => setEditingThresholdItem(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const newMin = parseFloat(newThresholdValue);
                if (!isNaN(newMin) && newMin >= 0) {
                  updateStockItemThreshold(editingThresholdItem.id, newMin);
                  setEditingThresholdItem(null);
                }
              }}
              className="p-6 space-y-4"
            >
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <span className="text-slate-500 block">Article :</span>
                <span className="font-bold text-slate-900 block text-sm">
                  {editingThresholdItem.designation}
                </span>
                <div className="flex items-center justify-between text-slate-600 mt-2 pt-2 border-t border-slate-200">
                  <span>Chantier : {editingThresholdItem.chantierNom}</span>
                  <span>
                    Stock actuel :{' '}
                    <strong className="font-mono text-slate-900">
                      {editingThresholdItem.quantiteEnStock} {editingThresholdItem.unite}s
                    </strong>
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nouveau seuil minimal d'alerte ({editingThresholdItem.unite}s) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={newThresholdValue}
                    onChange={(e) => setNewThresholdValue(e.target.value)}
                    className="w-full px-3 py-2 text-base font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-semibold text-slate-400">
                    {editingThresholdItem.unite}s
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                  Lorsque le stock réel descend à cette valeur ou en dessous, une notification d'alerte visuelle s'affiche instantanément dans le Tableau de Bord principal.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingThresholdItem(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
                >
                  Enregistrer le nouveau seuil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

