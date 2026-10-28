import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Chantier, StatutChantier } from '../types';
import { X, Building2, HardHat, Calendar, DollarSign, MapPin } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  chantierToEdit?: Chantier | null;
}

export const ChantierModal: React.FC<Props> = ({
  isOpen,
  onClose,
  chantierToEdit,
}) => {
  const { addChantier, updateChantier } = useApp();

  const [nom, setNom] = useState(chantierToEdit?.nom || '');
  const [code, setCode] = useState(chantierToEdit?.code || `CHT-${Date.now().toString().slice(-4)}`);
  const [wilaya, setWilaya] = useState(chantierToEdit?.wilaya || 'Alger');
  const [commune, setCommune] = useState(chantierToEdit?.commune || 'Chéraga');
  const [adresse, setAdresse] = useState(chantierToEdit?.adresse || '');
  const [statut, setStatut] = useState<StatutChantier>(chantierToEdit?.statut || 'gros_oeuvre');
  const [budgetTotalDZD, setBudgetTotalDZD] = useState(chantierToEdit?.budgetTotalDZD?.toString() || '350000000');
  const [avancementPourcentage, setAvancementPourcentage] = useState(chantierToEdit?.avancementPourcentage?.toString() || '30');
  const [dateDebut, setDateDebut] = useState(chantierToEdit?.dateDebut || new Date().toISOString().split('T')[0]);
  const [dateFinPrevue, setDateFinPrevue] = useState(chantierToEdit?.dateFinPrevue || '2027-12-31');
  const [chefChantier, setChefChantier] = useState(chantierToEdit?.chefChantier || 'Ing. Sofiane Belkacem');
  const [chefChantierTel, setChefChantierTel] = useState(chantierToEdit?.chefChantierTel || '+213 (0) 661 00 00 00');
  const [nbrLogements, setNbrLogements] = useState(chantierToEdit?.nbrLogements?.toString() || '48');
  const [nbrLocauxCommerciaux, setNbrLocauxCommerciaux] = useState(chantierToEdit?.nbrLocauxCommerciaux?.toString() || '6');
  const [surfaceM2, setSurfaceM2] = useState(chantierToEdit?.surfaceM2?.toString() || '6200');
  const [permisConstruireNumero, setPermisConstruireNumero] = useState(chantierToEdit?.permisConstruireNumero || 'PC-16-092/2026');
  const [datePermis, setDatePermis] = useState(chantierToEdit?.datePermis || '2026-01-15');
  const [description, setDescription] = useState(chantierToEdit?.description || '');
  const [imageUrl, setImageUrl] = useState(chantierToEdit?.imageUrl || '/src/assets/images/chantier_residence_jasmins_1792194081119.jpg');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return;

    const budget = parseFloat(budgetTotalDZD) || 0;
    const avancement = Math.min(100, Math.max(0, parseInt(avancementPourcentage, 10) || 0));
    const logements = parseInt(nbrLogements, 10) || 0;
    const locaux = parseInt(nbrLocauxCommerciaux, 10) || 0;
    const surface = parseFloat(surfaceM2) || 0;

    if (chantierToEdit) {
      updateChantier(chantierToEdit.id, {
        nom: nom.trim(),
        code: code.trim(),
        wilaya,
        commune: commune.trim(),
        adresse: adresse.trim(),
        statut,
        budgetTotalDZD: budget,
        avancementPourcentage: avancement,
        dateDebut,
        dateFinPrevue,
        chefChantier: chefChantier.trim(),
        chefChantierTel: chefChantierTel.trim(),
        nbrLogements: logements,
        nbrLocauxCommerciaux: locaux,
        surfaceM2: surface,
        permisConstruireNumero: permisConstruireNumero.trim(),
        datePermis,
        description: description.trim(),
        imageUrl,
      });
    } else {
      addChantier({
        nom: nom.trim(),
        code: code.trim(),
        wilaya,
        commune: commune.trim(),
        adresse: adresse.trim(),
        statut,
        budgetTotalDZD: budget,
        depensesEngageesDZD: 0,
        recettesEncaisseesDZD: 0,
        avancementPourcentage: avancement,
        dateDebut,
        dateFinPrevue,
        chefChantier: chefChantier.trim(),
        chefChantierTel: chefChantierTel.trim(),
        nbrLogements: logements,
        nbrLocauxCommerciaux: locaux,
        surfaceM2: surface,
        permisConstruireNumero: permisConstruireNumero.trim(),
        datePermis,
        description: description.trim(),
        imageUrl,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold">
              {chantierToEdit ? 'Modifier le Chantier' : 'Créer un Nouveau Chantier Promotionnel'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Row 1: Nom & Code */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nom du Projet / Résidence *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Résidence Les Orangers"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Code Référence *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Row 2: Localisation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Wilaya *
              </label>
              <select
                value={wilaya}
                onChange={(e) => setWilaya(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              >
                <option value="Alger">16 - Alger</option>
                <option value="Oran">31 - Oran</option>
                <option value="Tipaza">42 - Tipaza</option>
                <option value="Blida">09 - Blida</option>
                <option value="Boumerdès">35 - Boumerdès</option>
                <option value="Constantine">25 - Constantine</option>
                <option value="Annaba">23 - Annaba</option>
                <option value="Tlemcen">13 - Tlemcen</option>
                <option value="Sétif">19 - Sétif</option>
                <option value="Béjaïa">06 - Béjaïa</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Commune *</label>
              <input
                type="text"
                required
                placeholder="Ex: Chéraga, Dely Ibrahim..."
                value={commune}
                onChange={(e) => setCommune(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Adresse exacte / Lotissement
              </label>
              <input
                type="text"
                placeholder="Ex: Lot n° 45, Dar Diaf"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Row 3: Statut, Budget & Avancement */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Statut actuel des travaux *
              </label>
              <select
                value={statut}
                onChange={(e) => setStatut(e.target.value as StatutChantier)}
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              >
                <option value="etude_permis">Étude technique & Permis</option>
                <option value="terrassement">Terrassement & Fondations</option>
                <option value="gros_oeuvre">Gros Œuvre (Béton Armé)</option>
                <option value="second_oeuvre">Second Œuvre (Maçonnerie, Lots techniques)</option>
                <option value="finition">Finitions & Aménagements</option>
                <option value="livre">Livré / Réception définitive</option>
                <option value="en_arret">En arrêt temporaire</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                Budget Total Prévisionnel (DA) *
              </label>
              <input
                type="number"
                step="100000"
                min="0"
                required
                value={budgetTotalDZD}
                onChange={(e) => setBudgetTotalDZD(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Taux d'avancement physique (%) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={avancementPourcentage}
                  onChange={(e) => setAvancementPourcentage(e.target.value)}
                  className="w-full accent-amber-500"
                />
                <span className="font-mono text-xs font-bold text-slate-800 w-10 text-right">
                  {avancementPourcentage}%
                </span>
              </div>
            </div>
          </div>

          {/* Row 4: Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Date de début des travaux
              </label>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden font-mono"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Date prévisionnelle de livraison
              </label>
              <input
                type="date"
                value={dateFinPrevue}
                onChange={(e) => setDateFinPrevue(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden font-mono"
              />
            </div>
          </div>

          {/* Row 5: Chef de chantier */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                <HardHat className="w-3.5 h-3.5 text-slate-400" />
                Ingénieur / Conducteur de travaux responsable
              </label>
              <input
                type="text"
                value={chefChantier}
                onChange={(e) => setChefChantier(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Téléphone du conducteur de travaux
              </label>
              <input
                type="text"
                placeholder="+213 (0) 550..."
                value={chefChantierTel}
                onChange={(e) => setChefChantierTel(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden font-mono"
              />
            </div>
          </div>

          {/* Row 6: Caractéristiques techniques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre de Logements
              </label>
              <input
                type="number"
                min="0"
                value={nbrLogements}
                onChange={(e) => setNbrLogements(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Locaux Commerciaux
              </label>
              <input
                type="number"
                min="0"
                value={nbrLocauxCommerciaux}
                onChange={(e) => setNbrLocauxCommerciaux(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Surface Plancher (m²)
              </label>
              <input
                type="number"
                min="0"
                value={surfaceM2}
                onChange={(e) => setSurfaceM2(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Row 7: Permis de construire */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                N° Arrêté Permis de Construire
              </label>
              <input
                type="text"
                placeholder="Ex: PC-16-042/2024"
                value={permisConstruireNumero}
                onChange={(e) => setPermisConstruireNumero(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date de délivrance du Permis
              </label>
              <input
                type="date"
                value={datePermis}
                onChange={(e) => setDatePermis(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden font-mono"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description & Prestations du programme immobilier
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Résidence de grand standing avec façade ventilée, parkings souterrains, ascenseurs..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
            />
          </div>

          {/* Image Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Visuel du chantier
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setImageUrl('/src/assets/images/chantier_residence_jasmins_1792194081119.jpg')}
                className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                  imageUrl.includes('jasmins')
                    ? 'border-amber-500 bg-amber-50 text-amber-900 font-semibold'
                    : 'border-slate-300 text-slate-600'
                }`}
              >
                Chantier Résidentiel Côtier
              </button>
              <button
                type="button"
                onClick={() => setImageUrl('/src/assets/images/chantier_tour_mediterranee_1792194080543.jpg')}
                className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                  imageUrl.includes('tour')
                    ? 'border-amber-500 bg-amber-50 text-amber-900 font-semibold'
                    : 'border-slate-300 text-slate-600'
                }`}
              >
                Chantier Tour R+16
              </button>
            </div>
          </div>

          {/* Footer buttons */}
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
              {chantierToEdit ? 'Enregistrer les modifications' : 'Créer le chantier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
