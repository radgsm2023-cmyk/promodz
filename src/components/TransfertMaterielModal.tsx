import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Materiel } from '../types';
import { X, ArrowRightLeft, Truck, Calendar, MapPin, Gauge, FileText } from 'lucide-react';

interface Props {
  isOpen: boolean;
  defaultMaterielId?: string;
  onClose: () => void;
}

export const TransfertMaterielModal: React.FC<Props> = ({
  isOpen,
  defaultMaterielId,
  onClose,
}) => {
  const { materiels, chantiers, userAllowedChantiers, isChantierAllowed, isGlobalUser, transfererMateriel } = useApp();

  const allowedMateriels = materiels.filter((m) => isChantierAllowed(m.chantierId));

  const [materielId, setMaterielId] = useState('');
  const [chantierDestinationId, setChantierDestinationId] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [transporteur, setTransporteur] = useState('Transport Porte-char SARL Trans-Mitidja');
  const [compteurAuDepart, setCompteurAuDepart] = useState<number>(0);
  const [motif, setMotif] = useState('');

  const selectedMateriel = materiels.find((m) => m.id === materielId);

  useEffect(() => {
    if (defaultMaterielId) {
      setMaterielId(defaultMaterielId);
    } else if (allowedMateriels.length > 0 && !materielId) {
      setMaterielId(allowedMateriels[0].id);
    }
  }, [defaultMaterielId, allowedMateriels, isOpen]);

  useEffect(() => {
    if (selectedMateriel) {
      setCompteurAuDepart(selectedMateriel.compteurHeuresKm);
      // Auto default destination to different from current
      const otherChantier = chantiers.find((c) => c.id !== selectedMateriel.chantierId);
      if (selectedMateriel.chantierId === null) {
        setChantierDestinationId(otherChantier ? otherChantier.id : '');
      } else {
        setChantierDestinationId(''); // Can choose central depot
      }
    }
  }, [materielId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMateriel) return;

    const destChantier = chantierDestinationId ? chantiers.find((c) => c.id === chantierDestinationId) : null;
    const depChantier = selectedMateriel.chantierId ? chantiers.find((c) => c.id === selectedMateriel.chantierId) : null;

    transfererMateriel({
      date,
      materielId: selectedMateriel.id,
      materielNom: selectedMateriel.nom,
      codeMateriel: selectedMateriel.code,
      chantierDepartId: selectedMateriel.chantierId,
      chantierDepartNom: depChantier ? depChantier.nom : 'Parc Central & Dépôt Sidi Moussa',
      chantierDestinationId: chantierDestinationId || null,
      chantierDestinationNom: destChantier ? destChantier.nom : 'Parc Central & Dépôt Sidi Moussa',
      transporteur: transporteur.trim() || 'Transport Interne BatiPromote',
      motif: motif.trim() || 'Transfert inter-chantiers pour besoins d\'exploitation',
      compteurAuDepart: Number(compteurAuDepart) || selectedMateriel.compteurHeuresKm,
      statut: 'effectue',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <ArrowRightLeft className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Bon de Transfert Inter-Chantiers</h3>
              <p className="text-xs text-blue-100">
                Déplacement d'engin, transport porte-char & mise à jour d'affectation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Equipment selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Engin / Matériel à transférer *
            </label>
            <select
              value={materielId}
              onChange={(e) => setMaterielId(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
            >
              {materiels.map((m) => (
                <option key={m.id} value={m.id}>
                  [{m.code}] {m.nom} — {m.chantierNom || 'Dépôt Central'} ({m.compteurHeuresKm} {m.uniteCompteur})
                </option>
              ))}
            </select>
          </div>

          {/* Current location to Destination preview */}
          {selectedMateriel && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
              <div className="flex-1">
                <span className="text-slate-500 block mb-0.5 font-medium">Départ actuel :</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  {selectedMateriel.chantierNom || 'Parc Central & Dépôt Sidi Moussa'}
                </span>
              </div>
              <ArrowRightLeft className="w-5 h-5 text-blue-500 shrink-0" />
              <div className="flex-1 text-right">
                <span className="text-slate-500 block mb-0.5 font-medium">Destination visée :</span>
                <span className="font-bold text-blue-900">
                  {chantierDestinationId
                    ? chantiers.find((c) => c.id === chantierDestinationId)?.nom
                    : 'Parc Central & Dépôt Sidi Moussa'}
                </span>
              </div>
            </div>
          )}

          {/* New Destination Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Chantier de destination *
            </label>
            <select
              value={chantierDestinationId}
              onChange={(e) => setChantierDestinationId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              {isGlobalUser && <option value="">Parc Central & Dépôt Sidi Moussa (Rapatriement)</option>}
              {userAllowedChantiers
                .filter((ch) => ch.id !== selectedMateriel?.chantierId)
                .map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.nom} ({ch.wilaya} - {ch.commune})
                  </option>
                ))}
            </select>
          </div>

          {/* Date & Meter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Date du transfert *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Compteur au départ ({selectedMateriel?.uniteCompteur || 'heures'})
              </label>
              <div className="relative">
                <Gauge className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="number"
                  min="0"
                  value={compteurAuDepart}
                  onChange={(e) => setCompteurAuDepart(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Transporter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Transporteur / Chauffeur Porte-char
            </label>
            <input
              type="text"
              placeholder="ex: Transport Porte-char SARL Trans-Mitidja / Camion BatiPromote"
              value={transporteur}
              onChange={(e) => setTransporteur(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Reason / Motif */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Motif du déplacement / Justification des travaux
            </label>
            <textarea
              rows={2}
              placeholder="ex: Fin des terrassements sur site initial, transfert urgent pour levage charpente et déchargement livraisons."
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-medium text-sm transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm shadow-sm transition flex items-center gap-2"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Émettre le Bon de Transfert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
