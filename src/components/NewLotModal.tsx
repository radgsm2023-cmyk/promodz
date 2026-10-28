import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LogementLot, TypeLogement, StatutLogement } from '../types';
import { X, Home, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NewLotModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { chantiers, userAllowedChantiers, addLogement } = useApp();

  const [chantierId, setChantierId] = useState(userAllowedChantiers[0]?.id || chantiers[0]?.id || '');
  const [numeroLot, setNumeroLot] = useState('Lot B-15');
  const [type, setType] = useState<TypeLogement>('F4');
  const [surfaceM2, setSurfaceM2] = useState('110');
  const [etage, setEtage] = useState('4');
  const [bloc, setBloc] = useState('Bloc B');
  const [orientation, setOrientation] = useState('Sud-Est (Vue dégagée)');
  const [prixVenteUnitaireDZD, setPrixVenteUnitaireDZD] = useState('19000000');
  const [statut, setStatut] = useState<StatutLogement>('disponible');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroLot.trim()) return;

    const selectedChantier = chantiers.find((c) => c.id === chantierId);
    const prix = parseFloat(prixVenteUnitaireDZD) || 15000000;
    const surf = parseFloat(surfaceM2) || 100;

    const newLot: Omit<LogementLot, 'id'> = {
      chantierId,
      chantierNom: selectedChantier?.nom || 'Projet BTPH',
      numeroLot: numeroLot.trim(),
      type,
      surfaceHabitableM2: surf,
      surfaceUtileTerrasseM2: 12,
      etage: parseInt(etage) || 1,
      bloc: bloc.trim() || 'Bloc A',
      orientation,
      prixTotalDZD: prix,
      prixMetreCarreDZD: Math.round(prix / (surf || 1)),
      statut,
      finition: 'haut_standing',
    };

    addLogement(newLot);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-400/20 text-amber-400 border border-amber-400/30">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Ajouter un Lot de Logement VSP</h3>
              <p className="text-xs text-slate-400">Création d'un appartement ou local commercial dans le programme</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Chantier / Residence *</label>
            <select
              value={chantierId}
              onChange={(e) => setChantierId(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              {userAllowedChantiers.map((ch) => (
                <option key={ch.id} value={ch.id}>{ch.nom} ({ch.wilaya})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Numéro de Lot *</label>
              <input
                type="text"
                value={numeroLot}
                onChange={(e) => setNumeroLot(e.target.value)}
                placeholder="ex: Lot A-05"
                className="w-full mt-1 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Typologie</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TypeLogement)}
                className="w-full mt-1 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="F2">F2</option>
                <option value="F3">F3</option>
                <option value="F4">F4</option>
                <option value="F5">F5</option>
                <option value="Duplex">Duplex</option>
                <option value="Local_Commercial">Local Commercial</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Surface (m²)</label>
              <input
                type="number"
                value={surfaceM2}
                onChange={(e) => setSurfaceM2(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Étage</label>
              <input
                type="number"
                value={etage}
                onChange={(e) => setEtage(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Bloc</label>
              <input
                type="text"
                value={bloc}
                onChange={(e) => setBloc(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Prix unitaire indicatif (DZD)</label>
              <input
                type="number"
                value={prixVenteUnitaireDZD}
                onChange={(e) => setPrixVenteUnitaireDZD(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs font-bold font-mono text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Statut initial</label>
              <select
                value={statut}
                onChange={(e) => setStatut(e.target.value as StatutLogement)}
                className="w-full mt-1 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="disponible">Disponible à la vente</option>
                <option value="reserve">Réservé</option>
                <option value="vendu_vsp">Vendu (VSP)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Enregistrer le Lot</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
