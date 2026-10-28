import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BeneficiaireVSP, TypeLogement, ModeFinancementVSP, TrancheVSP } from '../types';
import { X, UserPlus, Building, Calculator, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NewBeneficiaireModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { chantiers, userAllowedChantiers, logements, addBeneficiaire, updateLogement } = useApp();

  // Form State - Identification
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [dateNaissance, setDateNaissance] = useState('1985-06-15');
  const [lieuNaissance, setLieuNaissance] = useState('Alger');
  const [wilayaNaissance, setWilayaNaissance] = useState('16 - Alger');
  const [nin, setNin] = useState('185160000000000000');
  const [numeroCNI, setNumeroCNI] = useState('102938475');
  const [telephone, setTelephone] = useState('+213 (0) 550 ');
  const [email, setEmail] = useState('');
  const [adresse, setAdresse] = useState('Alger');
  const [wilayaResidence, setWilayaResidence] = useState('16 - Alger');
  const [profession, setProfession] = useState('Cadre / Fonctionnaire');

  // Form State - Assignment
  const [chantierId, setChantierId] = useState(userAllowedChantiers[0]?.id || chantiers[0]?.id || '');
  const [selectedLotId, setSelectedLotId] = useState('');
  const [logementNumero, setLogementNumero] = useState('Lot B12');
  const [logementType, setLogementType] = useState<TypeLogement>('F4');
  const [surfaceM2, setSurfaceM2] = useState('105');
  const [etage, setEtage] = useState('3');
  const [bloc, setBloc] = useState('Bloc B');

  // Form State - Financement
  const [prixTotalCessionDZD, setPrixTotalCessionDZD] = useState('18500000');
  const [modeFinancement, setModeFinancement] = useState<ModeFinancementVSP>('autofinancement_echelonne');
  const [etablissementBancaire, setEtablissementBancaire] = useState('CNEP-Banque');
  const [montantDepotGarantieDZD, setMontantDepotGarantieDZD] = useState('3700000'); // 20%
  const [dateReservation, setDateReservation] = useState(new Date().toISOString().split('T')[0]);
  const [notaireInstrumentaire, setNotaireInstrumentaire] = useState('Maître Amrani - Notaire à Alger');

  if (!isOpen) return null;

  // Available lots for selected chantier
  const availableLots = logements.filter(
    (l) => l.chantierId === chantierId && (l.statut === 'disponible' || l.id === selectedLotId)
  );

  const handleChantierChange = (cid: string) => {
    setChantierId(cid);
    const firstLot = logements.find((l) => l.chantierId === cid && l.statut === 'disponible');
    if (firstLot) {
      setSelectedLotId(firstLot.id);
      setLogementNumero(firstLot.numeroLot);
      setLogementType(firstLot.type);
      setSurfaceM2(firstLot.surfaceHabitableM2.toString());
      setEtage(firstLot.etage.toString());
      setBloc(firstLot.bloc);
      if (firstLot.prixTotalDZD) {
        setPrixTotalCessionDZD(firstLot.prixTotalDZD.toString());
        setMontantDepotGarantieDZD(Math.round(firstLot.prixTotalDZD * 0.2).toString());
      }
    }
  };

  const handleLotSelect = (lotId: string) => {
    setSelectedLotId(lotId);
    const lot = logements.find((l) => l.id === lotId);
    if (lot) {
      setLogementNumero(lot.numeroLot);
      setLogementType(lot.type);
      setSurfaceM2(lot.surfaceHabitableM2.toString());
      setEtage(lot.etage.toString());
      setBloc(lot.bloc);
      if (lot.prixTotalDZD) {
        setPrixTotalCessionDZD(lot.prixTotalDZD.toString());
        setMontantDepotGarantieDZD(Math.round(lot.prixTotalDZD * 0.2).toString());
      }
    }
  };

  const handlePrixChange = (val: string) => {
    setPrixTotalCessionDZD(val);
    const numeric = parseFloat(val) || 0;
    setMontantDepotGarantieDZD(Math.round(numeric * 0.2).toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || !prenom.trim()) return;

    const prixTotal = parseFloat(prixTotalCessionDZD) || 0;
    const depotGarantie = parseFloat(montantDepotGarantieDZD) || Math.round(prixTotal * 0.2);
    const selectedChantier = chantiers.find((c) => c.id === chantierId);

    // Generate Loi 11-04 legal tranches
    const tranches: TrancheVSP[] = [
      {
        id: `tr-1-${Date.now()}`,
        numero: 1,
        libelle: 'Tranche 1 : Réservation / Dépôt de garantie (20%)',
        pourcentage: 20,
        montantDZD: Math.round(prixTotal * 0.2),
        dateEcheance: dateReservation,
        statut: 'regle',
        montantPayeDZD: Math.round(prixTotal * 0.2),
        datePaiement: dateReservation,
        recuNumero: `REC-VSP-${Date.now().toString().slice(-4)}`,
      },
      {
        id: `tr-2-${Date.now()}`,
        numero: 2,
        libelle: 'Tranche 2 : Achèvement des fondations & sous-sol (15%)',
        pourcentage: 15,
        montantDZD: Math.round(prixTotal * 0.15),
        dateEcheance: '2026-06-30',
        statut: 'a_venir',
        montantPayeDZD: 0,
      },
      {
        id: `tr-3-${Date.now()}`,
        numero: 3,
        libelle: 'Tranche 3 : Achèvement Gros-Œuvre & Toiture (35%)',
        pourcentage: 35,
        montantDZD: Math.round(prixTotal * 0.35),
        dateEcheance: '2026-11-30',
        statut: 'a_venir',
        montantPayeDZD: 0,
      },
      {
        id: `tr-4-${Date.now()}`,
        numero: 4,
        libelle: 'Tranche 4 : Achèvement Travaux & Finitions (25%)',
        pourcentage: 25,
        montantDZD: Math.round(prixTotal * 0.25),
        dateEcheance: '2027-03-31',
        statut: 'a_venir',
        montantPayeDZD: 0,
      },
      {
        id: `tr-5-${Date.now()}`,
        numero: 5,
        libelle: 'Tranche 5 : Remise des clés & Prise de possession (5%)',
        pourcentage: 5,
        montantDZD: Math.round(prixTotal * 0.05),
        dateEcheance: '2027-06-30',
        statut: 'a_venir',
        montantPayeDZD: 0,
      },
    ];

    const newBeneficiare: Omit<BeneficiaireVSP, 'id' | 'code'> = {
      nom: nom.trim(),
      prenom: prenom.trim(),
      dateNaissance,
      lieuNaissance,
      wilayaNaissance,
      nin,
      numeroCNI,
      dateDelivranceCNI: '2022-01-10',
      autoriteDelivranceCNI: 'Daïra d\'Alger',
      telephone,
      email,
      adresse,
      wilayaResidence,
      profession,
      chantierId,
      chantierNom: selectedChantier?.nom || 'Projet Promotionnel',
      logementLotId: selectedLotId || `lot-${Date.now()}`,
      logementNumero,
      logementType,
      surfaceM2: parseFloat(surfaceM2) || 100,
      etage: parseInt(etage) || 1,
      bloc,
      dateReservation,
      referenceReservation: `RES-2026-${Math.floor(100 + Math.random() * 900)}`,
      montantDepotGarantieDZD: depotGarantie,
      dateActeNotarieVSP: dateReservation,
      notaireInstrumentaire,
      policeAssuranceFGCMPI: `FGCMPI-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      modeFinancement,
      etablissementBancaire: modeFinancement === 'credit_bancaire_classique' ? etablissementBancaire : undefined,
      montantApportPersonnelDZD: Math.round(prixTotal * 0.5),
      montantCreditBancaireDZD: modeFinancement === 'credit_bancaire_classique' ? Math.round(prixTotal * 0.5) : 0,
      prixTotalCessionDZD: prixTotal,
      totalEncaisseDZD: Math.round(prixTotal * 0.2), // Tranche 1
      soldeRestantDZD: Math.round(prixTotal * 0.8),
      echeancierVSP: tranches,
      statutDossier: 'contrat_vsp_notarie',
      piecesDossier: [
        { id: 'p1', libelle: 'Copie Carte d\'Identité Nationale (CNI)', fourni: true, dateDepot: dateReservation, statut: 'conforme' },
        { id: 'p2', libelle: 'Acte de Naissance n° 12', fourni: true, dateDepot: dateReservation, statut: 'conforme' },
        { id: 'p3', libelle: 'Certificat de Résidence', fourni: true, dateDepot: dateReservation, statut: 'conforme' },
        { id: 'p4', libelle: 'Attestation de Garantie FGCMPI', fourni: true, dateDepot: dateReservation, statut: 'conforme' },
      ],
      dateLivraisonPrevisionnelle: '2027-06-30',
    };

    addBeneficiaire(newBeneficiare);

    // Update lot status if selected
    if (selectedLotId) {
      updateLogement(selectedLotId, {
        statut: 'vendu_vsp',
        beneficiaireNom: `${nom.trim()} ${prenom.trim()}`,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Enregistrer un Nouvel Acquéreur VSP</h3>
              <p className="text-xs text-slate-400">Contrat notarié & Vente sur Plan (Loi n° 11-04)</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Section 1: Identification Acquéreur */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              <Building className="w-4 h-4 text-emerald-600" />
              <span>1. État Civil & Identification de l'Acquéreur</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nom de famille *</label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="ex: Benali"
                  className="w-full mt-1 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Prénom *</label>
                <input
                  type="text"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  placeholder="ex: Mohamed"
                  className="w-full mt-1 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">NIN (Numéro d'Identité National - 18 chiffres)</label>
                <input
                  type="text"
                  value={nin}
                  onChange={(e) => setNin(e.target.value)}
                  placeholder="185160000000000000"
                  className="w-full mt-1 px-3 py-1.5 text-xs font-medium font-mono text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">N° Carte CNI / Passeport</label>
                <input
                  type="text"
                  value={numeroCNI}
                  onChange={(e) => setNumeroCNI(e.target.value)}
                  placeholder="102938475"
                  className="w-full mt-1 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Téléphone Mobile</label>
                <input
                  type="text"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Profession</label>
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Affectation du Lot & Projet */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              <Building className="w-4 h-4 text-blue-600" />
              <span>2. Projet Promotionnel & Lot de Logement</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Chantier / Residence *</label>
                <select
                  value={chantierId}
                  onChange={(e) => handleChantierChange(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  {userAllowedChantiers.map((ch) => (
                    <option key={ch.id} value={ch.id}>{ch.nom} ({ch.wilaya})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Choisir un lot disponible</label>
                <select
                  value={selectedLotId}
                  onChange={(e) => handleLotSelect(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="">-- Saisie manuelle du lot --</option>
                  {availableLots.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.numeroLot} ({l.type} - {l.surfaceHabitableM2}m² - {l.bloc})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Numéro du lot *</label>
                <input
                  type="text"
                  value={logementNumero}
                  onChange={(e) => setLogementNumero(e.target.value)}
                  placeholder="ex: Lot A-04"
                  className="w-full mt-1 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Typologie</label>
                  <select
                    value={logementType}
                    onChange={(e) => setLogementType(e.target.value as TypeLogement)}
                    className="w-full mt-1 px-2.5 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="F2">F2</option>
                    <option value="F3">F3</option>
                    <option value="F4">F4</option>
                    <option value="F5">F5</option>
                    <option value="Duplex">Duplex</option>
                    <option value="Local_Commercial">Local Commercial</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Surface (m²)</label>
                  <input
                    type="number"
                    value={surfaceM2}
                    onChange={(e) => setSurfaceM2(e.target.value)}
                    className="w-full mt-1 px-2.5 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Montants & Échéancier VSP */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              <Calculator className="w-4 h-4 text-amber-500" />
              <span>3. Modalités Financières & Échéancier (Loi n° 11-04)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Prix total de cession (DZD) *</label>
                <input
                  type="number"
                  value={prixTotalCessionDZD}
                  onChange={(e) => handlePrixChange(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-xs font-bold font-mono text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Dépôt de garantie Tranche 1 (20% légal)</label>
                <input
                  type="number"
                  value={montantDepotGarantieDZD}
                  onChange={(e) => setMontantDepotGarantieDZD(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mode de financement</label>
                <select
                  value={modeFinancement}
                  onChange={(e) => setModeFinancement(e.target.value as ModeFinancementVSP)}
                  className="w-full mt-1 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="autofinancement_echelonne">Autofinancement Échelonné VSP (Loi 11-04)</option>
                  <option value="credit_bancaire_classique">Crédit Bancaire Classique (CNEP / BNA / CPA)</option>
                  <option value="finance_islamique_mourabaha">Finance Islamique (Mourabaha)</option>
                  <option value="comptant_fonds_propres">Comptant Fonds Propres</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Notaire Instrumentaire</label>
                <input
                  type="text"
                  value={notaireInstrumentaire}
                  onChange={(e) => setNotaireInstrumentaire(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
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
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Valider & Générer Dossier VSP</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
