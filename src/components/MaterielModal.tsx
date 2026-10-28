import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Materiel, CategorieMateriel, StatutMateriel, TypeAcquisitionMateriel } from '../types';
import { X, Truck, Wrench, ShieldCheck, Gauge, Calendar, DollarSign, Building2, User } from 'lucide-react';
import { CATEGORIE_MATERIEL_LABELS } from '../utils/formatters';

interface Props {
  isOpen: boolean;
  materielToEdit?: Materiel | null;
  defaultChantierId?: string | null;
  onClose: () => void;
}

export const MaterielModal: React.FC<Props> = ({
  isOpen,
  materielToEdit,
  defaultChantierId,
  onClose,
}) => {
  const { chantiers, userAllowedChantiers, isGlobalUser, tiers, addMateriel, updateMateriel } = useApp();

  const [nom, setNom] = useState('');
  const [categorie, setCategorie] = useState<CategorieMateriel>('engin_lourd');
  const [marqueModele, setMarqueModele] = useState('');
  const [numeroSerieChassis, setNumeroSerieChassis] = useState('');
  const [immatriculation, setImmatriculation] = useState('');
  const [anneeFabrication, setAnneeFabrication] = useState<number>(2022);
  const [typeAcquisition, setTypeAcquisition] = useState<TypeAcquisitionMateriel>('propre');
  const [valeurAchatDZD, setValeurAchatDZD] = useState<number | ''>('');
  const [loueurTierId, setLoueurTierId] = useState('');
  const [loueurNom, setLoueurNom] = useState('');
  const [coutLocationJournalierDZD, setCoutLocationJournalierDZD] = useState<number | ''>('');
  const [chantierId, setChantierId] = useState<string>('');
  const [statut, setStatut] = useState<StatutMateriel>('en_service');
  const [compteurHeuresKm, setCompteurHeuresKm] = useState<number>(0);
  const [uniteCompteur, setUniteCompteur] = useState<'heures' | 'km'>('heures');
  const [conducteurNom, setConducteurNom] = useState('');
  const [conducteurTel, setConducteurTel] = useState('+213 (0) ');
  const [prochaineVisiteCTCDueDate, setProchaineVisiteCTCDueDate] = useState('');
  const [consommationMoyenneGasoilLHeure, setConsommationMoyenneGasoilLHeure] = useState<number | ''>('');
  const [observations, setObservations] = useState('');

  // Suppliers for equipment rental
  const loueurs = tiers.filter((t) => t.type === 'fournisseur' || t.type === 'sous_traitant' || t.type === 'prestataire_service');

  useEffect(() => {
    if (materielToEdit) {
      setNom(materielToEdit.nom);
      setCategorie(materielToEdit.categorie);
      setMarqueModele(materielToEdit.marqueModele);
      setNumeroSerieChassis(materielToEdit.numeroSerieChassis);
      setImmatriculation(materielToEdit.immatriculation);
      setAnneeFabrication(materielToEdit.anneeFabrication || 2022);
      setTypeAcquisition(materielToEdit.typeAcquisition);
      setValeurAchatDZD(materielToEdit.valeurAchatDZD ?? '');
      setLoueurTierId(materielToEdit.loueurTierId || '');
      setLoueurNom(materielToEdit.loueurNom || '');
      setCoutLocationJournalierDZD(materielToEdit.coutLocationJournalierDZD ?? '');
      setChantierId(materielToEdit.chantierId || '');
      setStatut(materielToEdit.statut);
      setCompteurHeuresKm(materielToEdit.compteurHeuresKm || 0);
      setUniteCompteur(materielToEdit.uniteCompteur || 'heures');
      setConducteurNom(materielToEdit.conducteurNom || '');
      setConducteurTel(materielToEdit.conducteurTel || '+213 (0) ');
      setProchaineVisiteCTCDueDate(materielToEdit.prochaineVisiteCTCDueDate || '');
      setConsommationMoyenneGasoilLHeure(materielToEdit.consommationMoyenneGasoilLHeure ?? '');
      setObservations(materielToEdit.observations || '');
    } else {
      setNom('');
      setCategorie('engin_lourd');
      setMarqueModele('');
      setNumeroSerieChassis('');
      setImmatriculation('');
      setAnneeFabrication(2023);
      setTypeAcquisition('propre');
      setValeurAchatDZD('');
      setLoueurTierId('');
      setLoueurNom('');
      setCoutLocationJournalierDZD('');
      setChantierId(defaultChantierId || (chantiers[0]?.id || ''));
      setStatut('en_service');
      setCompteurHeuresKm(0);
      setUniteCompteur('heures');
      setConducteurNom('');
      setConducteurTel('+213 (0) ');
      // Default CTC 6 months from now
      const d = new Date();
      d.setMonth(d.getMonth() + 6);
      setProchaineVisiteCTCDueDate(d.toISOString().split('T')[0]);
      setConsommationMoyenneGasoilLHeure('');
      setObservations('');
    }
  }, [materielToEdit, defaultChantierId, chantiers, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return;

    const selectedChantier = chantierId ? chantiers.find((c) => c.id === chantierId) : null;
    const selectedLoueur = loueurTierId ? tiers.find((t) => t.id === loueurTierId) : null;

    const payload = {
      nom: nom.trim(),
      categorie,
      marqueModele: marqueModele.trim() || nom.trim(),
      numeroSerieChassis: numeroSerieChassis.trim() || `SN-${Date.now()}`,
      immatriculation: immatriculation.trim() || `PARC-${Math.floor(100 + Math.random() * 900)}`,
      anneeFabrication: Number(anneeFabrication) || 2022,
      typeAcquisition,
      valeurAchatDZD: typeAcquisition === 'propre' && valeurAchatDZD !== '' ? Number(valeurAchatDZD) : undefined,
      loueurTierId: typeAcquisition === 'location' ? loueurTierId || undefined : undefined,
      loueurNom: typeAcquisition === 'location' ? (selectedLoueur ? selectedLoueur.nomRaisonSociale : loueurNom) : undefined,
      coutLocationJournalierDZD: typeAcquisition === 'location' && coutLocationJournalierDZD !== '' ? Number(coutLocationJournalierDZD) : undefined,
      dateAcquisition: materielToEdit?.dateAcquisition || new Date().toISOString().split('T')[0],
      chantierId: chantierId ? chantierId : null,
      chantierNom: selectedChantier ? selectedChantier.nom : 'Parc Central & Dépôt Sidi Moussa',
      statut,
      compteurHeuresKm: Number(compteurHeuresKm) || 0,
      uniteCompteur,
      conducteurNom: conducteurNom.trim() || undefined,
      conducteurTel: conducteurTel.trim().length > 10 ? conducteurTel.trim() : undefined,
      prochaineVisiteCTCDueDate: prochaineVisiteCTCDueDate || undefined,
      consommationMoyenneGasoilLHeure: consommationMoyenneGasoilLHeure !== '' ? Number(consommationMoyenneGasoilLHeure) : undefined,
      observations: observations.trim() || undefined,
    };

    if (materielToEdit) {
      updateMateriel(materielToEdit.id, payload);
    } else {
      addMateriel(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {materielToEdit ? 'Modifier la Fiche Engin / Matériel' : 'Ajouter un Nouvel Engin au Parc'}
              </h3>
              <p className="text-xs text-amber-100">
                Enregistrement, affectation chantier, contrôle CTC et suivi compteur
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Désignation de l'engin / équipement *
              </label>
              <input
                type="text"
                required
                placeholder="ex: Pelle Hydraulique CAT 320D, Grue à tour Potain MC85"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Catégorie de matériel *
              </label>
              <select
                value={categorie}
                onChange={(e) => setCategorie(e.target.value as CategorieMateriel)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
              >
                {Object.entries(CATEGORIE_MATERIEL_LABELS).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Marque & Identification */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Marque & Modèle précis
              </label>
              <input
                type="text"
                placeholder="ex: Caterpillar 320D L / Manitou MT 1840"
                value={marqueModele}
                onChange={(e) => setMarqueModele(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Immatriculation / Matricule Parc
              </label>
              <input
                type="text"
                placeholder="ex: 00412-120-16 ou PARC-GRU-01"
                value={immatriculation}
                onChange={(e) => setImmatriculation(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                N° de Série / Châssis
              </label>
              <input
                type="text"
                placeholder="ex: CAT-320DL-99120"
                value={numeroSerieChassis}
                onChange={(e) => setNumeroSerieChassis(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Propriété vs Location */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Mode d'acquisition & Propriété
              </span>
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="typeAcquisition"
                    checked={typeAcquisition === 'propre'}
                    onChange={() => setTypeAcquisition('propre')}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  Matériel Propre (Actif Société)
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="typeAcquisition"
                    checked={typeAcquisition === 'location'}
                    onChange={() => setTypeAcquisition('location')}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  Location Externe (Tiers Loueur)
                </label>
              </div>
            </div>

            {typeAcquisition === 'propre' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Valeur d'acquisition / Achat (DA)</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="ex: 18 500 000"
                      value={valeurAchatDZD}
                      onChange={(e) => setValeurAchatDZD(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full pl-3 pr-12 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">DA</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Année de mise en service</label>
                  <input
                    type="number"
                    min="1995"
                    max="2030"
                    value={anneeFabrication}
                    onChange={(e) => setAnneeFabrication(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Société Loueur / Fournisseur</label>
                  <select
                    value={loueurTierId}
                    onChange={(e) => {
                      setLoueurTierId(e.target.value);
                      const t = tiers.find((item) => item.id === e.target.value);
                      if (t) setLoueurNom(t.nomRaisonSociale);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                  >
                    <option value="">Sélectionner un partenaire loueur...</option>
                    {loueurs.map((loueur) => (
                      <option key={loueur.id} value={loueur.id}>
                        {loueur.nomRaisonSociale} ({loueur.wilaya})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Tarif de location journalier (DA/jour)</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="ex: 45 000"
                      value={coutLocationJournalierDZD}
                      onChange={(e) => setCoutLocationJournalierDZD(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full pl-3 pr-16 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">DA / jour</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Affectation & Statut */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Chantier d'affectation
              </label>
              <select
                value={chantierId}
                onChange={(e) => setChantierId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white"
              >
                {isGlobalUser && <option value="">Parc Central & Dépôt Sidi Moussa (Non affecté)</option>}
                {userAllowedChantiers.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.nom} ({ch.wilaya} - {ch.commune})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Statut actuel
              </label>
              <select
                value={statut}
                onChange={(e) => setStatut(e.target.value as StatutMateriel)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white"
              >
                <option value="en_service">En service (Actif sur chantier)</option>
                <option value="disponible">Disponible (Au parc central / dépôt)</option>
                <option value="en_maintenance">En maintenance / révision</option>
                <option value="en_panne">En panne (Indisponible)</option>
              </select>
            </div>
          </div>

          {/* Compteur & CTC */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Compteur actuel
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  value={compteurHeuresKm}
                  onChange={(e) => setCompteurHeuresKm(Number(e.target.value))}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <select
                  value={uniteCompteur}
                  onChange={(e) => setUniteCompteur(e.target.value as 'heures' | 'km')}
                  className="w-24 px-2 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="heures">Heures</option>
                  <option value="km">Km</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Échéance Contrôle CTC Levage
              </label>
              <input
                type="date"
                value={prochaineVisiteCTCDueDate}
                onChange={(e) => setProchaineVisiteCTCDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Conso Gasoil (L/heure)
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="ex: 12.5"
                value={consommationMoyenneGasoilLHeure}
                onChange={(e) => setConsommationMoyenneGasoilLHeure(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Conducteur / Opérateur */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Conducteur / Chauffeur attitré
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="ex: Mustapha Brahimi (Conducteur agréé)"
                  value={conducteurNom}
                  onChange={(e) => setConducteurNom(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Téléphone Conducteur
              </label>
              <input
                type="text"
                placeholder="+213 (0) 550 12 34 56"
                value={conducteurTel}
                onChange={(e) => setConducteurTel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Observations techniques, révisions & accessoires
            </label>
            <textarea
              rows={2}
              placeholder="ex: Certificat de conformité CTC valide. Livré avec godet terrassement 1.2m³ et godet curage."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
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
              className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium text-sm shadow-sm transition flex items-center gap-2"
            >
              <Truck className="w-4 h-4" />
              {materielToEdit ? 'Enregistrer les modifications' : 'Ajouter au Parc'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
