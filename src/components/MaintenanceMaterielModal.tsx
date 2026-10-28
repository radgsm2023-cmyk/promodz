import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TypeInterventionMaintenance } from '../types';
import { X, Wrench, Calendar, Gauge, DollarSign, Wallet, ShieldCheck, Fuel } from 'lucide-react';
import { TYPE_INTERVENTION_LABELS } from '../utils/formatters';

interface Props {
  isOpen: boolean;
  defaultMaterielId?: string;
  defaultType?: TypeInterventionMaintenance;
  onClose: () => void;
}

export const MaintenanceMaterielModal: React.FC<Props> = ({
  isOpen,
  defaultMaterielId,
  defaultType,
  onClose,
}) => {
  const { materiels, caisses, enregistrerMaintenance } = useApp();

  const [materielId, setMaterielId] = useState('');
  const [typeIntervention, setTypeIntervention] = useState<TypeInterventionMaintenance>('vidange_filtres');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [coutTotalDZD, setCoutTotalDZD] = useState<number | ''>(25000);
  const [heuresCompteur, setHeuresCompteur] = useState<number>(0);
  const [technicienPrestataire, setTechnicienPrestataire] = useState('');
  const [caisseId, setCaisseId] = useState<string>('');
  const [deduireCaisse, setDeduireCaisse] = useState<boolean>(true);
  const [statut, setStatut] = useState<'termine' | 'en_cours'>('termine');

  const selectedMateriel = materiels.find((m) => m.id === materielId);

  useEffect(() => {
    if (defaultMaterielId) {
      setMaterielId(defaultMaterielId);
    } else if (materiels.length > 0 && !materielId) {
      setMaterielId(materiels[0].id);
    }
  }, [defaultMaterielId, materiels, isOpen]);

  useEffect(() => {
    if (defaultType) {
      setTypeIntervention(defaultType);
    }
  }, [defaultType, isOpen]);

  useEffect(() => {
    if (selectedMateriel) {
      setHeuresCompteur(selectedMateriel.compteurHeuresKm);
      // Auto-assign caisse of the site where machine is located
      const chantierCaisse = caisses.find((c) => c.chantierId === selectedMateriel.chantierId);
      if (chantierCaisse) {
        setCaisseId(chantierCaisse.id);
      } else {
        setCaisseId(caisses[0]?.id || '');
      }
    }
  }, [materielId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMateriel) return;

    enregistrerMaintenance(
      {
        materielId: selectedMateriel.id,
        materielNom: selectedMateriel.nom,
        date,
        typeIntervention,
        description: description.trim() || `Intervention ${typeIntervention} effectuée sur ${selectedMateriel.nom}`,
        coutTotalDZD: Number(coutTotalDZD) || 0,
        heuresCompteur: Number(heuresCompteur) || selectedMateriel.compteurHeuresKm,
        technicienPrestataire: technicienPrestataire.trim() || 'Atelier Central / Prestataire',
        caisseId: deduireCaisse && caisseId ? caisseId : undefined,
        statut,
      },
      deduireCaisse
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Enregistrer un Entretien / Contrôle CTC / Carburant</h3>
              <p className="text-xs text-emerald-100">
                Suivi des vidanges, visites réglementaires CTC, réparations et facturation caisse
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Engin / Matériel concerné *
              </label>
              <select
                value={materielId}
                onChange={(e) => setMaterielId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
              >
                {materiels.map((m) => (
                  <option key={m.id} value={m.id}>
                    [{m.code}] {m.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nature de l'intervention *
              </label>
              <select
                value={typeIntervention}
                onChange={(e) => setTypeIntervention(e.target.value as TypeInterventionMaintenance)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
              >
                {Object.entries(TYPE_INTERVENTION_LABELS).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date, Meter & Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Date intervention *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Relevé Compteur ({selectedMateriel?.uniteCompteur || 'heures'})
              </label>
              <div className="relative">
                <Gauge className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="number"
                  min="0"
                  value={heuresCompteur}
                  onChange={(e) => setHeuresCompteur(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Statut travaux
              </label>
              <select
                value={statut}
                onChange={(e) => setStatut(e.target.value as 'termine' | 'en_cours')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              >
                <option value="termine">Terminé & Conforme</option>
                <option value="en_cours">En cours de réparation</option>
              </select>
            </div>
          </div>

          {/* Prestataire / Technicien & Coût */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Prestataire / Technicien / Organisme CTC
              </label>
              <input
                type="text"
                placeholder="ex: Organisme CTC Alger / Société Hydra-Flex / Atelier Sidi Moussa"
                value={technicienPrestataire}
                onChange={(e) => setTechnicienPrestataire(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Coût total de l'intervention (DA)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  placeholder="ex: 45 000"
                  value={coutTotalDZD}
                  onChange={(e) => setCoutTotalDZD(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full pl-3 pr-12 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-semibold"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">DA</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Détail des opérations réalisées & pièces remplacées
            </label>
            <textarea
              rows={2}
              required
              placeholder="ex: Remplacement huile moteur 15W40 + cartouches filtres, vérification étanchéité vérins et graissage général."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Caisse deduction box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-sm text-slate-800">
                <input
                  type="checkbox"
                  checked={deduireCaisse}
                  onChange={(e) => setDeduireCaisse(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Imputer automatiquement cette dépense sur une caisse de chantier</span>
              </label>
            </div>

            {deduireCaisse && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Caisse débitée</label>
                  <select
                    value={caisseId}
                    onChange={(e) => setCaisseId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    {caisses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nom} (Solde : {c.soldeActuelDZD.toLocaleString()} DA)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center text-xs text-slate-500 pt-5">
                  <p>
                    Un bon de caisse sera généré et enregistré dans le grand livre sous la catégorie{' '}
                    <strong className="text-slate-700">Engins & Carburant</strong>.
                  </p>
                </div>
              </div>
            )}
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
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm shadow-sm transition flex items-center gap-2"
            >
              <Wrench className="w-4 h-4" />
              Enregistrer l'Intervention
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
