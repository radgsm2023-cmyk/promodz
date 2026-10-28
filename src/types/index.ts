export type Langue = 'fr' | 'ar' | 'en';

export type UserRole =
  | 'superadmin'
  | 'directeur_promoteur'
  | 'conducteur_travaux'
  | 'responsable_chantier'
  | 'chef_projet'
  | 'tresorier_caissier'
  | 'comptable'
  | 'responsable_achats'
  | string;

export interface PermissionDefinition {
  key: string;
  label: string;
  module: string;
  description: string;
}

export type RoleColor = 'amber' | 'blue' | 'emerald' | 'indigo' | 'purple' | 'cyan' | 'rose' | 'slate';

export interface RoleDefinition {
  id: string;
  code: string;
  label: string;
  description: string;
  couleur: RoleColor;
  permissions: string[];
  isSystem?: boolean;
}

export interface RoleChantier {
  chantierId: string;
  role: UserRole;
}

export interface Utilisateur {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  role: UserRole; // Global primary role
  rolesParChantier?: RoleChantier[]; // Specific roles for specific sites
  avatar?: string;
  chantiersAssignes: string[]; // IDs or ['*'] for all
  statut: 'actif' | 'inactif';
  dateCreation?: string;
  dernierAcces?: string;
  motDePasse?: string;
  motDePasseModifieLe?: string;
}

export type StatutChantier =
  | 'etude_permis'
  | 'terrassement'
  | 'gros_oeuvre'
  | 'second_oeuvre'
  | 'finition'
  | 'livre'
  | 'en_arret';

export interface Chantier {
  id: string;
  code: string;
  nom: string;
  wilaya: string;
  commune: string;
  adresse: string;
  statut: StatutChantier;
  budgetTotalDZD: number;
  depensesEngageesDZD: number;
  recettesEncaisseesDZD: number;
  avancementPourcentage: number;
  dateDebut: string;
  dateFinPrevue: string;
  chefChantier: string;
  chefChantierTel: string;
  nbrLogements: number;
  nbrLocauxCommerciaux: number;
  surfaceM2: number;
  permisConstruireNumero: string;
  datePermis: string;
  description: string;
  imageUrl: string;
  caisseId?: string;
}

export interface CaisseFondRoulement {
  id: string;
  code: string;
  nom: string;
  chantierId: string | null; // null for Caisse Centrale Siège
  chantierNom?: string;
  responsable: string;
  telephoneResponsable: string;
  soldeInitialDZD: number;
  soldeActuelDZD: number;
  seuilAlerteDZD: number;
  plafondMaxDZD: number;
  dernierReapproDate: string;
  statut: 'actif' | 'bloque' | 'alerte_seuil';
}

export interface DemandeAlimenterCaisse {
  id: string;
  code: string;
  caisseCibleId: string;
  caisseCibleNom: string;
  chantierId?: string | null;
  chantierNom?: string;
  caisseSourceId?: string | null;
  montantDZD: number;
  motif: string;
  modePaiement: ModePaiement;
  demandeurId: string;
  demandeurNom: string;
  demandeurRole: string;
  dateDemande: string;
  statut: 'en_attente_validation' | 'validee' | 'refusee';
  validateurNom?: string;
  dateValidation?: string;
  motifRefus?: string;
}

export type TypeTransaction = 'entree' | 'sortie' | 'transfert_caisse';

export type ModePaiement =
  | 'especes'
  | 'cheque'
  | 'virement'
  | 'traite'
  | 'versement_especes_banque';

export type CategorieFlux =
  | 'gros_oeuvre'
  | 'second_oeuvre'
  | 'materiaux_construction'
  | 'main_d_oeuvre_journaliere'
  | 'sous_traitance'
  | 'engins_carburant'
  | 'honoraires_archi_ctc'
  | 'taxes_permis_administrations'
  | 'reapprovisionnement_caisse'
  | 'acompte_client_vsp'
  | 'versement_tranche_vsp'
  | 'apport_associe_promoteur'
  | 'frais_generaux_bureau'
  | 'divers';

export interface Transaction {
  id: string;
  reference: string;
  date: string;
  type: TypeTransaction;
  caisseSourceId?: string;
  caisseDestinationId?: string;
  chantierId?: string;
  tierId?: string;
  beneficiaireNom: string;
  montantDZD: number;
  modePaiement: ModePaiement;
  categorie: CategorieFlux;
  statut: 'valide' | 'en_attente' | 'en_attente_visa' | 'rejete';
  motif: string;
  pieceJointeNom?: string;
  bonCaisseNumero?: string;
  numeroChequeVirement?: string;
  enregistrePar: string;
  validePar?: string;
  dateValidation?: string;
}

export type TypeTier = 'fournisseur' | 'sous_traitant' | 'client_vsp' | 'prestataire_service' | 'autre';

export interface TrancheVSP {
  id: string;
  numero: number;
  libelle: string; // e.g. "Réservation 10%", "Fondations achevées 20%", "Gros œuvre 30%", "Menuiserie 20%", "Remise des clés 20%"
  pourcentage: number;
  montantDZD: number;
  dateEcheance: string;
  statut: 'regle' | 'partiel' | 'en_retard' | 'a_venir';
  montantPayeDZD: number;
  datePaiement?: string;
  recuNumero?: string;
}


export interface Tier {
  id: string;
  code: string;
  type: TypeTier;
  nomRaisonSociale: string;
  specialite?: string; // ex: "Béton Prêt à l'Emploi", "Ferronnerie & Menuiserie Alu", "Plomberie & Chauffage", "Acquéreur F4"
  registreCommerceNIF?: string;
  telephone: string;
  email: string;
  wilaya: string;
  adresse: string;
  soldeDuDZD: number; // ce qu'on doit au fournisseur ou ce que le client nous doit
  soldeRegleDZD: number;
  totalEngagementsDZD: number;
  chantiersAssocies: string[];
  contactPrincipal?: string;

  // Spécifique client VSP (Vente sur plan)
  lotReserve?: string; // ex: "Appartement F4 - Bloc B - 4ème étage"
  contratNotarieRef?: string;
  dateReservation?: string;
  prixVenteTotalDZD?: number;
  echeancierVSP?: TrancheVSP[];
}

export interface StockItem {
  id: string;
  code: string;
  designation: string;
  categorie: 'agregats' | 'liants_ciment' | 'acier_fer' | 'maconnerie' | 'plomberie_sanitaire' | 'electricite' | 'carrelage_marbre' | 'peinture_etancheite' | 'quincaillerie_outillage';
  chantierId: string;
  chantierNom?: string;
  quantiteEnStock: number;
  quantiteMinAlerte: number;
  unite: 'tonne' | 'sac' | 'm3' | 'piece' | 'palette' | 'm2' | 'rouleau' | 'litre' | 'barre';
  prixUnitaireMoyenDZD: number;
  valeurTotaleDZD: number;
  dernierMouvementDate: string;
  emplacementChantier: string;
}

export interface MouvementStock {
  id: string;
  date: string;
  stockItemId: string;
  stockDesignation: string;
  chantierId: string;
  type: 'entree_livraison' | 'sortie_consommation' | 'transfert';
  quantite: number;
  unite: string;
  referenceBon: string;
  fournisseurNom?: string;
  agentRecepteur: string;
  motif: string;
}

export type CategorieDocGED =
  | 'permis_construire'
  | 'plan_architecture'
  | 'etude_sol_ctc'
  | 'contrat_marche'
  | 'facture_devis'
  | 'pv_reception'
  | 'bon_caisse'
  | 'assurance_decennale'
  | 'acte_notarie_vsp';

export interface DocumentGED {
  id: string;
  code: string;
  titre: string;
  categorie: CategorieDocGED;
  chantierId?: string;
  chantierNom?: string;
  tierId?: string;
  tierNom?: string;
  dateUpload: string;
  tailleKo: number;
  format: 'PDF' | 'DWG' | 'DOCX' | 'JPG';
  referenceInterne: string;
  statut: 'valide' | 'provisoire' | 'archive';
}

export type CorpsMetier =
  | 'chef_chantier'
  | 'metreur_technicien'
  | 'grutier_conducteur_engin'
  | 'macon_qualifie'
  | 'ferrailleur'
  | 'coffreur_bancheur'
  | 'manoeuvre'
  | 'electricien_plombier'
  | 'gardien_chantier'
  | 'magasinier';

export type TypeContratTravail = 'mensuel_permanent' | 'journalier_quinzaine' | 'tache_rendement';

export interface Employe {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  corpsMetier: CorpsMetier;
  specialiteLibelle: string;
  typeContrat: TypeContratTravail;
  chantierId: string;
  chantierNom?: string;
  telephone: string;
  cniNumero: string;
  dateEmbauche: string;
  salaireBaseMensuelDZD?: number;
  tarifJournalierDZD?: number;
  statut: 'actif' | 'conge' | 'arret_travail' | 'demission';
}

export interface BulletinPaie {
  id: string;
  reference: string;
  employeId: string;
  employeNom: string;
  corpsMetier: CorpsMetier;
  chantierId: string;
  chantierNom: string;
  periodeMois: string;
  typeContrat: TypeContratTravail;
  joursTravailles: number;
  tarifUnitaireDZD: number;
  salaireBaseDZD: number;
  primePanierTransportDZD: number;
  heuresSupplementairesDZD: number;
  avancesAcomptesDeduitesDZD: number;
  netAPayerDZD: number;
  statut: 'paye' | 'en_attente';
  dateReglement?: string;
  modePaiement: 'especes_caisse' | 'virement' | 'cheque';
  caisseId?: string;
  bonCaisseNumero?: string;
}

export type CategorieMateriel =
  | 'engin_lourd'
  | 'levage_manutention'
  | 'beton_malaxage'
  | 'energie_compresseur'
  | 'coffrage_echafaudage'
  | 'petit_outillage';

export type StatutMateriel = 'en_service' | 'disponible' | 'en_maintenance' | 'en_panne';

export type TypeAcquisitionMateriel = 'propre' | 'location';

export interface Materiel {
  id: string;
  code: string; // e.g. "ENG-001", "LEV-002"
  nom: string; // e.g. "Pelle hydraulique CAT 320D"
  categorie: CategorieMateriel;
  marqueModele: string; // e.g. "Caterpillar 320D L"
  numeroSerieChassis: string;
  immatriculation: string; // Matricule ou numéro de parc (ex: 00412-120-16)
  anneeFabrication: number;
  typeAcquisition: TypeAcquisitionMateriel;
  loueurTierId?: string;
  loueurNom?: string;
  coutLocationJournalierDZD?: number;
  valeurAchatDZD?: number;
  dateAcquisition: string;
  chantierId: string | null; // null = Parc Central / Dépôt
  chantierNom?: string;
  statut: StatutMateriel;
  compteurHeuresKm: number;
  uniteCompteur: 'heures' | 'km';
  conducteurNom?: string;
  conducteurTel?: string;
  prochaineVisiteCTCDueDate?: string; // Contrôle Technique de Levage CTC
  derniereVidangeHeures?: number;
  consommationMoyenneGasoilLHeure?: number; // Litres par heure ou L/100km
  observations?: string;
  photoUrl?: string;
}

export interface TransfertMateriel {
  id: string;
  date: string;
  materielId: string;
  materielNom: string;
  codeMateriel: string;
  chantierDepartId: string | null;
  chantierDepartNom: string;
  chantierDestinationId: string | null;
  chantierDestinationNom: string;
  transporteur: string; // Transporteur ou Chauffeur Porte-char
  bonTransfertNumero: string;
  motif: string;
  compteurAuDepart: number;
  statut: 'effectue' | 'en_transit';
  validePar: string;
}

export type TypeInterventionMaintenance =
  | 'preventive'
  | 'curative_panne'
  | 'visite_ctc_levage'
  | 'vidange_filtres'
  | 'pneumatique_chenilles'
  | 'plein_gasoil';

export interface InterventionMaintenance {
  id: string;
  materielId: string;
  materielNom: string;
  date: string;
  typeIntervention: TypeInterventionMaintenance;
  description: string;
  coutTotalDZD: number;
  heuresCompteur: number;
  technicienPrestataire: string;
  caisseId?: string;
  bonCaisseNumero?: string;
  statut: 'termine' | 'en_cours';
}

export interface CompteBancaireEntreprise {
  id: string;
  nomBanque: string; // e.g. BNA, BEA, CPA, Al Baraka
  codeAgence: string; // e.g. Agence Chéraga (Code 00612)
  numeroCompteRIB: string; // RIB 20 chiffres
  titulaire: string;
  devise: string;
}

export interface TrancheVSPModele {
  id?: string;
  ordre?: number;
  numero?: number;
  libelle: string;
  pourcentage: number;
  conditionDeclenchement?: string;
  description?: string;
}

export type StatutVisaCTC = 'favorable' | 'avec_reserves' | 'defavorable' | 'en_attente';
export type EtapeTravaux = 'terrassement' | 'fondations' | 'gros_oeuvre' | 'maconnerie' | 'second_oeuvre' | 'finition' | 'vrd';

export interface PVSituationChantier {
  id: string;
  numeroPV: string; // ex: "PV-CHT01-2026-04"
  chantierId: string;
  chantierNom: string;
  date: string;
  titre: string; // ex: "Coulage Dalle Haute 4ème Étage & Contrôle Armatures"
  etapeTravaux: EtapeTravaux;
  pourcentageAvancementConstate: number;
  visaCTC: StatutVisaCTC;
  numeroRapportCTC?: string;
  ingenieurBET: string; // Bureau d'études
  conducteurChantier: string;
  observations: string;
  reserves?: string;
  declencheAppelFondsVSP: boolean;
  trancheVSPDeclenchee?: string;
  statut: 'valide' | 'brouillon';
}

// Suivi Journalier des Travaux & Pointage Quotidien Agile
export type StatutPresence = 'present' | 'demi_journee' | 'absent_injustifie' | 'conge_arret';

export interface PointageOuvrierJournalier {
  employeId: string;
  employeNom: string;
  matricule: string;
  corpsMetier: CorpsMetier;
  statutPresence: StatutPresence;
  heuresNormales: number; // default 8h
  heuresSupplementaires: number; // default 0h
  primePanierAttribuee: boolean;
  primeTransportAttribuee: boolean;
  tacheAffectee?: string;
  observations?: string;
}

export type StatutTacheAgile = 'a_faire' | 'en_cours' | 'attente_ctc' | 'termine';
export type PrioriteTache = 'haute' | 'normale' | 'urgente';

export interface TacheJournaliereChantier {
  id: string;
  titre: string;
  corpsEtat: string;
  localisation: string;
  statutAgile: StatutTacheAgile;
  priorite: PrioriteTache;
  avancementEstimePourcent: number;
  ouvriersAssignesNoms: string[];
  responsableNom: string;
  observationsTechniques?: string;
}

export type MeteoChantier = 'ensoleille' | 'nuageux' | 'pluvieux' | 'vent_fort_sirocco' | 'canicule';

export interface JournalChantierQuotidien {
  id: string;
  chantierId: string;
  chantierNom: string;
  date: string;
  meteo: MeteoChantier;
  temperatureC: number;
  conditionCoulageBeton: 'optimale' | 'vigilance' | 'interdite';
  effectifsTotalPresents: number;
  effectifsTotalAbsents: number;
  heuresTravaillesTotalChantier: number;
  tachesDuJour: TacheJournaliereChantier[];
  pointagesPersonnel: PointageOuvrierJournalier[];
  materielsMobilises: string[];
  materiauxRecus: string[];
  incidentsOuAleas?: string;
  redigePar: string;
  valideParConducteur?: string;
  statutRapport: 'brouillon' | 'valide';
}

export type ActionAudit = 'creation' | 'modification' | 'suppression' | 'validation' | 'decaissement' | 'transfert' | 'backup' | 'restauration' | 'cloture' | 'deverrouillage' | 'securite_alerte';
export type ModuleAudit = 'caisses' | 'transactions' | 'chantiers' | 'tiers' | 'materiel' | 'stocks' | 'personnel' | 'pv_avancement' | 'settings' | 'utilisateurs' | 'roles' | 'journal_chantier' | 'beneficiaires' | 'logements' | 'conformite' | 'backup' | 'messagerie' | 'cloture_mensuelle' | 'securite';

export interface ClotureMensuelle {
  id: string;
  anneeMois: string; // "YYYY-MM"
  libelleMois: string; // "Septembre 2026"
  dateVerrouillage: string;
  verrouilleParNom: string;
  verrouilleParRole: string;
  statut: 'verrouille' | 'deverrouille_exceptionnel';
  nbTransactionsVerrouillees: number;
  totalDepensesDZD: number;
  totalRecettesDZD: number;
  soldeNetMoisDZD: number;
  motifsDeverrouillage?: string;
  dateDeverrouillage?: string;
  deverrouilleParNom?: string;
  chantiersImpactesCount: number;
}

export interface JournalAuditItem {
  id: string;
  date: string;
  utilisateurNom: string;
  utilisateurRole: string;
  action: ActionAudit;
  module: ModuleAudit;
  entiteReference: string;
  details: string;
  impactFinancierDZD?: number;
}

// -------------------------------------------------------------
// MODULE AUDIT DE CONFORMITÉ & CONTRÔLE INTERNE (SUPERADMIN)
// -------------------------------------------------------------
export type StatutConformiteTransaction = 'a_verifier' | 'conforme' | 'reserve' | 'bloque';
export type SeveriteAnomalie = 'critique' | 'haute' | 'moyenne' | 'info';

export interface AnomalieConformite {
  code: string;
  titre: string;
  severite: SeveriteAnomalie;
  explication: string;
}

export interface RevueConformiteTransaction {
  transactionId: string;
  statut: StatutConformiteTransaction;
  anomalies: AnomalieConformite[];
  commentaireAuditeur: string;
  dateRevue?: string;
  auditePar?: string;
}

export interface RapportAuditMensuel {
  id: string;
  mois: string; // ex: "2026-10"
  statut: 'brouillon' | 'cloture_vise';
  dateGeneration: string;
  dateCloture?: string;
  visePar?: string;
  observationsGenerales?: string;
  totalTransactions: number;
  montantTotalTransactionsDZD: number;
  totalAtypiques: number;
  montantTotalAtypiquesDZD: number;
  tauxConformitePourcent: number;
}

// -------------------------------------------------------------
// MODULE PLANIFICATION SAUVEGARDES & RESTAURATION (SUPERADMIN)
// -------------------------------------------------------------
export type TypeStockageExterne = 'gcs' | 's3' | 'sftp' | 'nas_local';
export type FrequenceSauvegarde = 'quotidienne' | 'bihebdomadaire' | 'hebdomadaire' | 'toutes_les_6h' | 'toutes_les_12h';

export interface ConfigurationBackupPlanifie {
  actif: boolean;
  frequence: FrequenceSauvegarde;
  heureExecution: string; // ex: "02:00"
  joursSemaine?: number[]; // [0, 4]
  retentionJours: number; // 30
  chiffrementActif: boolean;
  algorithmeChiffrement: 'AES-256-GCM' | 'ChaCha20-Poly1305';
  stockageCible: TypeStockageExterne;
  gcsConfig: {
    bucketName: string;
    region: string;
    serviceAccountEmail: string;
  };
  s3Config: {
    bucketName: string;
    region: string;
    accessKeyId: string;
  };
  sftpConfig: {
    host: string;
    port: number;
    user: string;
    remotePath: string;
  };
  nasConfig: {
    pathPartage: string;
    ipServeur: string;
  };
  derniereExecution?: string;
  prochaineExecution?: string;
  dernierStatut?: 'succes' | 'echec' | 'en_cours';
}

export interface SnapshotBackup {
  id: string;
  date: string;
  nomFichier: string;
  type: 'automatique' | 'manuelle';
  stockageCible: TypeStockageExterne;
  stockageLibelle: string;
  tailleKo: number;
  hashSha256: string;
  chiffre: boolean;
  donneesJSON?: string;
  stats: {
    chantiersCount: number;
    caissesCount: number;
    transactionsCount: number;
    employesCount: number;
    tiersCount: number;
  };
}

// -------------------------------------------------------------
// MODULE MESSAGERIE INTERNE & TICKETS DE CHANTIER
// -------------------------------------------------------------
export type CategorieTicket =
  | 'technique_ctc'
  | 'approvisionnement'
  | 'tresorerie_caisse'
  | 'securite_intemperies'
  | 'materiel_panne'
  | 'general'
  | 'ctc_technique'
  | 'approvisionnement_beton_fer'
  | 'securite_meteo'
  | 'materiel_engin_panne'
  | 'autre';

export type PrioriteTicket = 'urgente' | 'haute' | 'normale' | 'faible' | 'basse';
export type StatutTicket = 'ouvert' | 'en_cours' | 'resolu' | 'ferme';

export interface MessageDiscussion {
  id: string;
  ticketId?: string;
  auteurId: string;
  auteurNom: string;
  auteurRole: string;
  auteurType: 'siege' | 'chantier';
  contenu: string;
  dateEnvoi: string; // ISO string
  pieceJointeNom?: string;
  pieceJointeUrl?: string;
  pieceJointeType?: 'image' | 'pdf' | 'doc';
  pieceJointe?: {
    nom: string;
    url?: string;
    type?: 'image' | 'pdf' | 'doc';
  };
  luPar?: string[];
  lu?: boolean;
}

export interface TicketDiscussion {
  id: string;
  numeroTicket?: string; // ex: "TCK-JASM-001"
  titre: string;
  chantierId: string;
  chantierNom?: string;
  categorie: CategorieTicket;
  priorite: PrioriteTicket;
  statut: StatutTicket;
  creeParId?: string;
  creeParNom: string;
  creeParRole: string;
  creeParType: 'siege' | 'chantier';
  dateCreation: string;
  dateDernierMessage: string;
  dernierMessageApercu?: string;
  nbMessages?: number;
  messages: MessageDiscussion[];
  participants?: {
    userId: string;
    nom: string;
    role: string;
  }[];
  estEpingle?: boolean;
  nonLuParSiege?: boolean;
  nonLuParChantier?: boolean;
}

export interface NotificationMessageRealtime {
  id: string;
  ticketId: string;
  ticketTitre: string;
  chantierNom: string;
  auteurNom: string;
  auteurRole: string;
  messageApercu?: string;
  contenuApercu?: string;
  date?: string;
  dateEnvoi?: string;
  priorite?: PrioriteTicket;
  lu?: boolean;
}

export type NotificationType = 'cash' | 'ticket' | 'stock' | 'materiel' | 'vsp';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  priority: 'low' | 'medium' | 'high';
  data?: any;
}

// -------------------------------------------------------------
// MODULE BÉNÉFICIAIRES & LOGEMENTS (VSP - LOI 11-04)
// -------------------------------------------------------------
export type StatutLogement = 'disponible' | 'reserve' | 'vendu_vsp' | 'livre' | 'bloque';
export type TypeLogement = 'F2' | 'F3' | 'F4' | 'F5' | 'duplex' | 'penthouse' | 'local_commercial' | 'box_parking';

export interface ReserveLivraison {
  id: string;
  element: string; // ex: "Menuiserie aluminium", "Robinetterie salle de bain", "Peinture séjour", "Carrelage terrasse"
  description: string;
  levee: boolean;
  dateSignalement: string;
  dateResolution?: string;
}

export interface LogementLot {
  id: string;
  chantierId: string;
  chantierNom: string;
  numeroLot: string; // "A-01", "B-14", "LC-02", "BOX-07"
  bloc: string; // "Bloc A", "Bloc B", "Tour C"
  etage: number; // 0 = RDC, 1 = 1er étage...
  type: TypeLogement;
  surfaceHabitableM2: number;
  surfaceUtileTerrasseM2: number;
  orientation: string; // "Sud-Est", "Double Façade", "Vue Mer", "Dégagée"
  prixTotalDZD: number;
  prixMetreCarreDZD: number;
  statut: StatutLogement;
  beneficiaireId?: string;
  beneficiaireNom?: string;
  contratDate?: string;
  finition: 'semi_fini' | 'haut_standing' | 'ultra_luxe';
  reserves?: ReserveLivraison[];
}

export type ModeFinancementVSP =
  | 'autofinancement_echelonne'
  | 'credit_bancaire_classique'
  | 'finance_islamique_mourabaha'
  | 'comptant_fonds_propres';

export type StatutDossierBeneficiaire =
  | 'prospect_interesse'
  | 'reservation_signee'
  | 'contrat_vsp_notarie'
  | 'en_cours_paiement'
  | 'livre_cles_remises'
  | 'desiste';

export interface PieceDossierVSP {
  id: string;
  libelle: string;
  fourni: boolean;
  dateDepot?: string;
  statut: 'conforme' | 'a_completer' | 'non_fourni';
  remarque?: string;
}

export interface OptionFinitionAcquereur {
  id: string;
  categorie: 'revetement_sol' | 'faience_cuisine' | 'sanitaire' | 'menuiserie' | 'domotique';
  choix: string;
  surcoutDZD: number;
  valide: boolean;
}

export interface BeneficiaireVSP {
  id: string;
  code: string; // ex: "BEN-2026-001"
  nom: string;
  prenom: string;
  nomJeuneFille?: string;
  dateNaissance: string;
  lieuNaissance: string;
  wilayaNaissance: string;
  nin: string; // Numéro d'Identification National à 18 chiffres
  numeroCNI: string;
  dateDelivranceCNI: string;
  autoriteDelivranceCNI: string; // ex: "Daïra de Sidi M'Hamed"
  telephone: string;
  telephone2?: string;
  email: string;
  adresse: string;
  wilayaResidence: string;
  profession: string;
  employeurOuActivite?: string;
  
  // Lot assigné
  chantierId: string;
  chantierNom: string;
  logementLotId: string;
  logementNumero: string;
  logementType: TypeLogement;
  surfaceM2: number;
  etage: number;
  bloc: string;
  
  // Contrat & Légal (Loi 11-04)
  dateReservation: string;
  referenceReservation: string;
  montantDepotGarantieDZD: number;
  dateActeNotarieVSP?: string;
  referenceActeNotarie?: string;
  notaireInstrumentaire?: string;
  notaireWilaya?: string;
  policeAssuranceFGCMPI?: string; // N° Attestation Garantie Achèvement FGCMPI
  
  // Financement & Recouvrement
  modeFinancement: ModeFinancementVSP;
  etablissementBancaire?: string; // CNEP-Banque, BNA, CPA, Al Baraka, Banque Essalam...
  montantApportPersonnelDZD: number;
  montantCreditBancaireDZD: number;
  prixTotalCessionDZD: number;
  totalEncaisseDZD: number;
  soldeRestantDZD: number;
  echeancierVSP: TrancheVSP[];
  
  // Suivi
  statutDossier: StatutDossierBeneficiaire;
  piecesDossier: PieceDossierVSP[];
  optionsFinition?: OptionFinitionAcquereur[];
  dateLivraisonPrevisionnelle: string;
  dateLivraisonEffective?: string;
  pvLivraisonSigne?: boolean;
  remarques?: string;
}

export interface PrintVoucherState {
  isOpen: boolean;
  type:
    | 'bon_caisse'
    | 'recu_vsp'
    | 'situation_chantier'
    | 'bulletin_paie'
    | 'appel_fonds_vsp'
    | 'pv_avancement'
    | 'rapport_journalier'
    | 'contrat_reservation'
    | 'pv_remise_cles';
  transaction?: Transaction;
  tier?: Tier;
  chantier?: Chantier;
  caisse?: CaisseFondRoulement;
  employe?: Employe;
  bulletin?: BulletinPaie;
  pv?: PVSituationChantier;
  journalQuotidien?: JournalChantierQuotidien;
  beneficiaire?: BeneficiaireVSP;
  logement?: LogementLot;
  appelFonds?: {
    tier: Tier;
    tranche: TrancheVSP;
    chantier: Chantier;
  };
  data?: any;
}

export interface AppSettings {
  // 1. Identité Société & Légal
  raisonSociale: string;
  formeJuridique: 'SARL' | 'EURL' | 'SPA' | 'SNC';
  nomCommercial: string;
  agrementPromoteurNumero: string;
  dateAgrement: string;
  registreCommerceRC: string;
  nif: string;
  nis: string;
  articleImpositionAI: string;
  capitalSocialDZD: number;
  directeurGeneralNom: string;
  siegeWilaya: string;
  siegeCommune: string;
  siegeAdresse: string;
  telephoneSiege: string;
  emailDirection: string;
  siteWeb: string;
  logoUrl?: string;

  // 2. Paramétrage Trésorerie & Caisses
  devisePrincipale: string;
  seuilAlerteCaisseDefautDZD: number;
  plafondDecaissementSansVisaDZD: number;
  prefixeBonCaisse: string;
  tvaParDefautPourcentage: number;
  validationDirecteurObligatoire: boolean;
  comptesBancaires: CompteBancaireEntreprise[];

  // 3. Paramétrage VSP & Chantiers
  echeancierVSPDefaut: TrancheVSPModele[];
  seuilAlerteDepassementBudgetPourcent: number;
  delaiAlerteVisiteCTCJours: number;
  wilayasIntervention: string[];

  // 4. Paramétrage Paie & Main-d'œuvre
  indemnitePanierDefautDZD: number;
  indemniteTransportDefautDZD: number;
  majorationHeuresSuppSemainePourcent: number;
  majorationHeuresSuppVendrediPourcent: number;
  deductionAutomatiqueAcomptes: boolean;

  // 5. Activation des Modules (SuperAdmin)
  modulesActifs?: Record<string, boolean>;

  // 6. Workflow de validation
  validationWorkflow: {
    deuxNiveauxActive: boolean;
    seuilMontantValidationDZD: number;
  };

  // 7. Planification automatique des sauvegardes
  backupPlanifie?: ConfigurationBackupPlanifie;

  // 8. Mode Maintenance Système
  modeMaintenance?: {
    actif: boolean;
    messageCustom: string;
    dateDebut?: string;
    activeParNom?: string;
    activeParRole?: string;
    autoriserAdminsOnly: boolean;
  };
}

// -------------------------------------------------------------
// MODULE SOUS-TRAITANCE & DÉCOMPTES MENSUELS (DPM)
// -------------------------------------------------------------
export type CorpsSousTraitance =
  | 'gros_oeuvre'
  | 'etancheite_isolation'
  | 'menuiserie_alu_bois'
  | 'plomberie_sanitaire_hvac'
  | 'electricite_courant_fort_faible'
  | 'revetement_sol_faience'
  | 'peinture_decoration'
  | 'terrassement_vrd';

export interface ContratSousTraitance {
  id: string;
  code: string; // ex: "ST-2026-001"
  sousTraitantNom: string;
  sousTraitantId?: string;
  chantierId: string;
  chantierNom: string;
  corpsMetier: CorpsSousTraitance;
  objetContrat: string;
  montantMarcheInitialDZD: number;
  montantAvenantsDZD: number;
  montantMarcheTotalDZD: number;
  dateSignature: string;
  delaiExecutionMois: number;
  tauxRetenueGarantiePourcent: number; // e.g. 10%
  retenueGarantieCumuleeDZD: number;
  statut: 'en_cours' | 'suspendu' | 'acheve' | 'resilie';
}

export interface SituationAttachement {
  id: string;
  code: string; // ex: "ATT-2026-04"
  contratId: string;
  contratCode: string;
  sousTraitantNom: string;
  chantierId: string;
  chantierNom: string;
  periodeMois: string; // ex: "2026-04"
  montantTravauxMoisDZD: number;
  cumulPrecedentDZD: number;
  cumulTotalTravauxDZD: number;
  retenueGarantieMoisDZD: number;
  netAPayerDZD: number;
  statut: 'brouillon' | 'valide_conducteur' | 'valide_direction' | 'paye';
  dateValidation?: string;
  observateursNotes?: string;
}



