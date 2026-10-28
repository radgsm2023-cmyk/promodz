import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TypeTransaction, ModePaiement, CategorieFlux } from '../types';
import { X, ArrowDownRight, ArrowUpRight, DollarSign, Building, Wallet, UserCheck, Lock, AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TypeTransaction;
  defaultCaisseId?: string;
  defaultChantierId?: string;
}

export const TransactionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultType = 'sortie',
  defaultCaisseId,
  defaultChantierId,
}) => {
  const { chantiers, userAllowedChantiers, isChantierAllowed, isGlobalUser, caisses, tiers, addTransaction, currentUser, estDateVerrouillee, hasPermission } = useApp();

  const allowedCaisses = caisses.filter((cs) => {
    if (isGlobalUser) return true;
    if (!cs.chantierId) return false;
    return isChantierAllowed(cs.chantierId);
  });

  const [type, setType] = useState<TypeTransaction>(defaultType);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [chantierId, setChantierId] = useState(defaultChantierId || userAllowedChantiers[0]?.id || chantiers[0]?.id || '');
  const [caisseId, setCaisseId] = useState(defaultCaisseId || allowedCaisses[0]?.id || caisses[0]?.id || '');
  const [tierId, setTierId] = useState('');
  const [beneficiaireNom, setBeneficiaireNom] = useState('');
  const [montantDZD, setMontantDZD] = useState('');
  const [modePaiement, setModePaiement] = useState<ModePaiement>('especes');
  const [categorie, setCategorie] = useState<CategorieFlux>('materiaux_construction');
  const [motif, setMotif] = useState('');
  const [numeroChequeVirement, setNumeroChequeVirement] = useState('');
  const [pieceJointeNom, setPieceJointeNom] = useState('');

  if (!isOpen || currentUser.role === 'superadmin' || !hasPermission('transactions_create')) return null;

  // When a tier is selected, auto-fill beneficiary name
  const handleTierChange = (selectedTierId: string) => {
    setTierId(selectedTierId);
    const selected = tiers.find((t) => t.id === selectedTierId);
    if (selected) {
      setBeneficiaireNom(selected.nomRaisonSociale);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const montant = parseFloat(montantDZD);
    if (isNaN(montant) || montant <= 0) return;

    addTransaction({
      date,
      type,
      caisseSourceId: type === 'sortie' ? caisseId : undefined,
      caisseDestinationId: type === 'entree' ? caisseId : undefined,
      chantierId: chantierId || undefined,
      tierId: tierId || undefined,
      beneficiaireNom: beneficiaireNom.trim() || 'Bénéficiaire divers',
      montantDZD: montant,
      modePaiement,
      categorie,
      statut: 'valide', // Validated directly by default or in review
      motif: motif.trim() || 'Règlement opérationnel',
      numeroChequeVirement: numeroChequeVirement.trim() || undefined,
      pieceJointeNom: pieceJointeNom.trim() || undefined,
      enregistrePar: currentUser.nom,
      validePar: currentUser.nom,
      dateValidation: date,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold">
              {type === 'sortie'
                ? 'Enregistrer une Dépense / Règlement'
                : 'Enregistrer une Recette / Encaissement'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type Segmented Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setType('sortie')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
                type === 'sortie'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              Dépense / Sortie d’argent
            </button>
            <button
              type="button"
              onClick={() => setType('entree')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
                type === 'entree'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Recette / Entrée d’argent
            </button>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Montant en Dinar Algérien (DA) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  placeholder="Ex: 150000"
                  value={montantDZD}
                  onChange={(e) => setMontantDZD(e.target.value)}
                  className="w-full px-3 py-2 text-base font-mono font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden tabular-nums"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 font-mono">
                  DA
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date de l'opération *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden font-mono"
              />
            </div>
          </div>

          {/* Chantier & Caisse */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                <Building className="w-3.5 h-3.5 text-slate-500" />
                Chantier d'affectation
              </label>
              <select
                value={chantierId}
                onChange={(e) => setChantierId(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              >
                {isGlobalUser && <option value="">-- Non rattaché (Frais généraux siège) --</option>}
                {userAllowedChantiers.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.nom} ({ch.wilaya})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                <Wallet className="w-3.5 h-3.5 text-slate-500" />
                {type === 'sortie' ? 'Caisse source (Fond de roulement)' : 'Caisse réceptrice'}
              </label>
              <select
                value={caisseId}
                onChange={(e) => setCaisseId(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              >
                {allowedCaisses.map((cs) => (
                  <option key={cs.id} value={cs.id}>
                    {cs.nom} (Solde : {cs.soldeActuelDZD.toLocaleString('fr-DZ')} DA)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mode de règlement & Catégorie */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mode de règlement *
              </label>
              <select
                value={modePaiement}
                onChange={(e) => setModePaiement(e.target.value as ModePaiement)}
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              >
                <option value="especes">Espèces (Génère un Bon de Caisse)</option>
                <option value="cheque">Chèque bancaire</option>
                <option value="virement">Virement bancaire</option>
                <option value="traite">Effet de commerce / Traite</option>
                <option value="versement_especes_banque">Versement bancaire direct</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catégorie analytique *
              </label>
              <select
                value={categorie}
                onChange={(e) => setCategorie(e.target.value as CategorieFlux)}
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              >
                <option value="materiaux_construction">Matériaux de construction (Béton, Fer, Brique...)</option>
                <option value="main_d_oeuvre_journaliere">Main d’œuvre ouvriers / journaliers</option>
                <option value="sous_traitance">Sous-traitance (Élec, Plomberie, Étanchéité...)</option>
                <option value="engins_carburant">Location engins, grue & carburant</option>
                <option value="honoraires_archi_ctc">Honoraires Architecte, CTC & Laboratoire</option>
                <option value="taxes_permis_administrations">Taxes permis, urbanisme & domaine</option>
                <option value="acompte_client_vsp">Versement acompte client VSP</option>
                <option value="versement_tranche_vsp">Tranche d'avancement VSP</option>
                <option value="frais_generaux_bureau">Frais généraux & fournitures bureau</option>
                <option value="divers">Divers imprévus</option>
              </select>
            </div>
          </div>

          {/* Bénéficiaire & Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                Sélectionner un Tiers enregistré
              </label>
              <select
                value={tierId}
                onChange={(e) => handleTierChange(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              >
                <option value="">-- Saisie libre ou Tiers externe --</option>
                {tiers.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.type === 'fournisseur' ? 'Fournisseur' : t.type === 'sous_traitant' ? 'Sous-traitant' : 'Client'}] {t.nomRaisonSociale}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nom du bénéficiaire / Destinataire *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: SARL Béton Plus ou Équipe coffrage"
                value={beneficiaireNom}
                onChange={(e) => setBeneficiaireNom(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Motif */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Motif & Description détaillée de la transaction *
            </label>
            <textarea
              required
              rows={2}
              placeholder="Ex: Paiement quinzaine ouvriers ferraillage 4ème étage"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
            />
          </div>

          {/* References & Attachments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Réf. Chèque / Virement / N° Bon (facultatif)
              </label>
              <input
                type="text"
                placeholder="Ex: CHQ BNA 0098421"
                value={numeroChequeVirement}
                onChange={(e) => setNumeroChequeVirement(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nom de la pièce justificative (BL, Facture...)
              </label>
              <input
                type="text"
                placeholder="Ex: Facture_Lafarge_F2026-11.pdf"
                value={pieceJointeNom}
                onChange={(e) => setPieceJointeNom(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Lock Check Warning Banner */}
          {(() => {
            const lockCheck = estDateVerrouillee(date);
            if (lockCheck.isLocked && lockCheck.cloture) {
              return (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 text-amber-900 text-xs">
                  <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block mb-0.5">Période Comptable Clôturée ({lockCheck.cloture.libelleMois})</strong>
                    Le mois correspondant à la date saisie ({date.slice(0, 7)}) a été définitivement clôturé et verrouillé par <strong>{lockCheck.cloture.verrouilleParNom}</strong>. La création de transactions y est interdite.
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={estDateVerrouillee(date).isLocked}
              className={`px-5 py-2 text-xs font-semibold text-white rounded-lg transition-colors shadow-xs ${
                estDateVerrouillee(date).isLocked
                  ? 'bg-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-slate-900 hover:bg-slate-800 cursor-pointer'
              }`}
            >
              Enregistrer la transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
