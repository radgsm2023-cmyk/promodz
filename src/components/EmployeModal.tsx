import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Employe, CorpsMetier, TypeContratTravail } from '../types';
import { X, UserPlus, HardHat, Phone, CreditCard, Building2, Calendar, DollarSign } from 'lucide-react';
import { CORPS_METIER_LABELS } from '../utils/formatters';

interface Props {
  isOpen: boolean;
  employeToEdit?: Employe | null;
  defaultChantierId?: string;
  onClose: () => void;
}

export const EmployeModal: React.FC<Props> = ({
  isOpen,
  employeToEdit,
  defaultChantierId,
  onClose,
}) => {
  const { chantiers, userAllowedChantiers, addEmploye, updateEmploye } = useApp();

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [corpsMetier, setCorpsMetier] = useState<CorpsMetier>('macon_qualifie');
  const [specialiteLibelle, setSpecialiteLibelle] = useState('');
  const [typeContrat, setTypeContrat] = useState<TypeContratTravail>('journalier_quinzaine');
  const [chantierId, setChantierId] = useState('');
  const [telephone, setTelephone] = useState('+213 (0) ');
  const [cniNumero, setCniNumero] = useState('');
  const [dateEmbauche, setDateEmbauche] = useState(new Date().toISOString().split('T')[0]);
  const [tarifJournalierDZD, setTarifJournalierDZD] = useState<number | ''>(3500);
  const [salaireBaseMensuelDZD, setSalaireBaseMensuelDZD] = useState<number | ''>('');
  const [statut, setStatut] = useState<'actif' | 'conge' | 'arret_travail' | 'demission'>('actif');

  useEffect(() => {
    if (employeToEdit) {
      setNom(employeToEdit.nom);
      setPrenom(employeToEdit.prenom);
      setCorpsMetier(employeToEdit.corpsMetier);
      setSpecialiteLibelle(employeToEdit.specialiteLibelle || '');
      setTypeContrat(employeToEdit.typeContrat);
      setChantierId(employeToEdit.chantierId);
      setTelephone(employeToEdit.telephone);
      setCniNumero(employeToEdit.cniNumero);
      setDateEmbauche(employeToEdit.dateEmbauche);
      setTarifJournalierDZD(employeToEdit.tarifJournalierDZD ?? '');
      setSalaireBaseMensuelDZD(employeToEdit.salaireBaseMensuelDZD ?? '');
      setStatut(employeToEdit.statut);
    } else {
      setNom('');
      setPrenom('');
      setCorpsMetier('macon_qualifie');
      setSpecialiteLibelle('');
      setTypeContrat('journalier_quinzaine');
      setChantierId(defaultChantierId || (chantiers[0]?.id || ''));
      setTelephone('+213 (0) ');
      setCniNumero('');
      setDateEmbauche(new Date().toISOString().split('T')[0]);
      setTarifJournalierDZD(3500);
      setSalaireBaseMensuelDZD('');
      setStatut('actif');
    }
  }, [employeToEdit, defaultChantierId, chantiers, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || !prenom.trim() || !chantierId) return;

    const dataPayload = {
      nom: nom.trim(),
      prenom: prenom.trim(),
      corpsMetier,
      specialiteLibelle: specialiteLibelle.trim() || CORPS_METIER_LABELS[corpsMetier]?.label || corpsMetier,
      typeContrat,
      chantierId,
      telephone: telephone.trim(),
      cniNumero: cniNumero.trim(),
      dateEmbauche,
      tarifJournalierDZD: typeContrat !== 'mensuel_permanent' && tarifJournalierDZD ? Number(tarifJournalierDZD) : undefined,
      salaireBaseMensuelDZD: typeContrat === 'mensuel_permanent' && salaireBaseMensuelDZD ? Number(salaireBaseMensuelDZD) : undefined,
      statut,
    };

    if (employeToEdit) {
      updateEmploye(employeToEdit.id, dataPayload);
    } else {
      addEmploye(dataPayload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold">
              {employeToEdit ? `Modifier le collaborateur: ${employeToEdit.prenom} ${employeToEdit.nom}` : 'Nouveau Collaborateur / Ouvrier de Chantier'}
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
          {/* Identity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nom de famille *
              </label>
              <input
                type="text"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="ex: Belhadj"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prénom *
              </label>
              <input
                type="text"
                required
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="ex: Slimane"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Profession & Specialite */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Corps de métier *
              </label>
              <select
                value={corpsMetier}
                onChange={(e) => setCorpsMetier(e.target.value as CorpsMetier)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
              >
                <option value="macon_qualifie">Maçon Qualifié</option>
                <option value="ferrailleur">Ferrailleur (Armatures & Cages)</option>
                <option value="coffreur_bancheur">Coffreur / Bancheur (Voiles & Dalles)</option>
                <option value="grutier_conducteur_engin">Grutier / Conducteur d'Engin</option>
                <option value="chef_chantier">Chef d'Équipe / Chef de Chantier</option>
                <option value="manoeuvre">Manœuvre de Chantier</option>
                <option value="electricien_plombier">Électricien / Plombier Chantier</option>
                <option value="metreur_technicien">Métreur / Technicien Travaux</option>
                <option value="gardien_chantier">Gardien de Chantier (Sécurité)</option>
                <option value="magasinier">Magasinier Dépôt & Outillage</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Spécialité / Qualification détaillée
              </label>
              <input
                type="text"
                value={specialiteLibelle}
                onChange={(e) => setSpecialiteLibelle(e.target.value)}
                placeholder="ex: Chef d'équipe maçonnerie brique et parpaing"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Chantier d'Affectation & Contrat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                Chantier d'affectation principal *
              </label>
              <select
                required
                value={chantierId}
                onChange={(e) => setChantierId(e.target.value)}
                className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
              >
                <option value="">-- Sélectionner un chantier --</option>
                {userAllowedChantiers.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.nom} ({ch.wilaya})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Type de Contrat & Régime *
              </label>
              <select
                value={typeContrat}
                onChange={(e) => setTypeContrat(e.target.value as TypeContratTravail)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
              >
                <option value="journalier_quinzaine">Journalier / Quinzaine (Bordereau pointage)</option>
                <option value="mensuel_permanent">Mensuel Permanent (CDI / CDD)</option>
                <option value="tache_rendement">À la tâche / Rendement métré</option>
              </select>
            </div>
          </div>

          {/* Rémunération selon Contrat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {typeContrat === 'mensuel_permanent' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Salaire de base mensuel (DZD / DA) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="10000"
                    step="1000"
                    required
                    value={salaireBaseMensuelDZD}
                    onChange={(e) => setSalaireBaseMensuelDZD(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="ex: 110000"
                    className="w-full pl-3 pr-12 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 tabular-nums"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    DA/mois
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tarif journalier de référence (DZD / DA) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1000"
                    step="100"
                    required
                    value={tarifJournalierDZD}
                    onChange={(e) => setTarifJournalierDZD(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="ex: 3500"
                    className="w-full pl-3 pr-12 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 tabular-nums"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    DA/jour
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Statut actuel
              </label>
              <select
                value={statut}
                onChange={(e) => setStatut(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
              >
                <option value="actif">Actif sur chantier</option>
                <option value="conge">En congé annuel / repos</option>
                <option value="arret_travail">Arrêt maladie / accident</option>
                <option value="demission">Sorti / Démobilisé</option>
              </select>
            </div>
          </div>

          {/* Contact & Legal Documents */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Numéro de Téléphone
              </label>
              <input
                type="text"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="+213 (0) 550..."
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                N° CNI (Biométrique)
              </label>
              <input
                type="text"
                value={cniNumero}
                onChange={(e) => setCniNumero(e.target.value)}
                placeholder="ex: 16-00459201"
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date d'embauche
              </label>
              <input
                type="date"
                value={dateEmbauche}
                onChange={(e) => setDateEmbauche(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors"
            >
              {employeToEdit ? 'Enregistrer les modifications' : 'Créer la fiche collaborateur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
