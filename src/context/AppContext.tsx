import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n';
import {
  Chantier,
  CaisseFondRoulement,
  Transaction,
  Tier,
  StockItem,
  MouvementStock,
  DocumentGED,
  Utilisateur,
  UserRole,
  Langue,
  Employe,
  BulletinPaie,
  Materiel,
  TransfertMateriel,
  InterventionMaintenance,
  AppSettings,
  PVSituationChantier,
  JournalAuditItem,
  PrintVoucherState,
  RoleDefinition,
  PermissionDefinition,
  JournalChantierQuotidien,
  PointageOuvrierJournalier,
  TacheJournaliereChantier,
  LogementLot,
  BeneficiaireVSP,
  ContratSousTraitance,
  SituationAttachement,
  TicketDiscussion,
  MessageDiscussion,
  NotificationMessageRealtime,
  StatutTicket,
  ClotureMensuelle,
  DemandeAlimenterCaisse,
  NotificationItem,
  NotificationType,
} from '../types';
import {
  INITIAL_CHANTIERS,
  INITIAL_CAISSES,
  INITIAL_DEMANDES_ALIMENTATION,
  INITIAL_TRANSACTIONS,
  INITIAL_TIERS,
  INITIAL_STOCKS,
  INITIAL_MOUVEMENTS_STOCK,
  INITIAL_DOCUMENTS,
  INITIAL_UTILISATEURS,
  INITIAL_EMPLOYES,
  INITIAL_BULLETINS_PAIE,
  INITIAL_MATERIELS,
  INITIAL_TRANSFERTS_MATERIEL,
  INITIAL_MAINTENANCES_MATERIEL,
  INITIAL_SETTINGS,
  INITIAL_PVS_CHANTIER,
  INITIAL_JOURNAL_AUDIT,
  INITIAL_ROLES,
  ALL_PERMISSIONS,
  INITIAL_JOURNAUX_CHANTIER,
  INITIAL_LOGEMENTS,
  INITIAL_BENEFICIAIRES,
  INITIAL_CONTRATS_SOUS_TRAITANCE,
  INITIAL_SITUATIONS_ATTACHEMENT,
  INITIAL_TICKETS_DISCUSSION,
  INITIAL_CLOTURES_MENSUELLES,
} from '../data/mockData';
import { translations } from './translations';
import {
  verifySessionIntegrity,
  generateSessionSignature,
  sanitizeInput,
  setUserCustomPassword,
  verifyUserCredentials,
} from '../utils/security';

interface AppContextType {
  langue: Langue;
  setLangue: (l: Langue) => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  toggleTheme: () => void;
  textDirection: 'ltr' | 'rtl';
  setTextDirection: (dir: 'ltr' | 'rtl') => void;
  toggleTextDirection: () => void;
  t: typeof translations['fr'];
  currentUser: Utilisateur;
  setCurrentUser: (u: Utilisateur) => void;
  effectiveRole: UserRole;
  isLoggedIn: boolean;
  logout: () => void;
  utilisateurs: Utilisateur[];
  roles: RoleDefinition[];
  allPermissions: PermissionDefinition[];
  activeChantierId: string | null;
  setActiveChantierId: (id: string | null) => void;
  isGlobalUser: boolean;
  userAllowedChantiers: Chantier[];
  isChantierAllowed: (chantierId: string | null | undefined) => boolean;

  // Roles & Utilisateurs Actions
  addUtilisateur: (userData: Omit<Utilisateur, 'id' | 'statut' | 'dateCreation'> & { statut?: 'actif' | 'inactif' }) => void;
  updateUtilisateur: (id: string, updates: Partial<Utilisateur>) => void;
  deleteUtilisateur: (id: string) => boolean;
  toggleUtilisateurStatut: (id: string) => void;
  addRole: (roleData: Omit<RoleDefinition, 'id'>) => void;
  updateRole: (id: string, updates: Partial<RoleDefinition>) => void;
  deleteRole: (id: string) => boolean;
  getRoleByCode: (code: string) => RoleDefinition | undefined;
  getRoleLabel: (code: string) => string;
  hasPermission: (permissionKey: string) => boolean;
  changerMotDePasse: (ancienMdp: string, nouveauMdp: string) => { success: boolean; message: string };
  reinitialiserMotDePasse: (userId: string) => { success: boolean; message: string; nouveauMotDePasse: string };

  // Data
  chantiers: Chantier[];
  caisses: CaisseFondRoulement[];
  demandesAlimentation: DemandeAlimenterCaisse[];
  transactions: Transaction[];
  tiers: Tier[];
  stocks: StockItem[];
  mouvementsStock: MouvementStock[];
  documents: DocumentGED[];
  employes: Employe[];
  bulletinsPaie: BulletinPaie[];
  materiels: Materiel[];
  transfertsMateriel: TransfertMateriel[];
  maintenancesMateriel: InterventionMaintenance[];
  pvsChantier: PVSituationChantier[];
  journalAudit: JournalAuditItem[];

  // Chantier actions
  addChantier: (chantier: Omit<Chantier, 'id'>) => void;
  updateChantier: (id: string, updates: Partial<Chantier>) => void;
  deleteChantier: (id: string) => void;

  // Caisse actions
  alimenterCaisse: (
    caisseCibleId: string,
    montantDZD: number,
    caisseSourceId: string | null,
    motif: string,
    modePaiement: any
  ) => void;
  demanderAlimentationCaisse: (data: {
    caisseCibleId: string;
    montantDZD: number;
    caisseSourceId?: string | null;
    motif: string;
    modePaiement: any;
  }) => void;
  validerDemandeAlimentation: (id: string) => void;
  refuserDemandeAlimentation: (id: string, motifRefus?: string) => void;
  updateCaisse: (id: string, updates: Partial<CaisseFondRoulement>) => void;

  // Transaction actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'reference'>) => void;
  validerTransaction: (id: string) => void;
  rejeterTransaction: (id: string) => void;

  // Tiers actions
  addTier: (tier: Omit<Tier, 'id' | 'code'>) => void;
  updateTier: (id: string, updates: Partial<Tier>) => void;
  validerTrancheVSP: (
    tierId: string,
    trancheId: string,
    montantPaye: number,
    datePaiement: string,
    modePaiement: any,
    recuNumero: string
  ) => void;

  // Stocks actions
  addStockItem: (item: Omit<StockItem, 'id' | 'code' | 'valeurTotaleDZD'>) => void;
  updateStockItem: (id: string, updates: Partial<StockItem>) => void;
  updateStockItemThreshold: (id: string, newMin: number) => void;
  addMouvementStock: (mvt: Omit<MouvementStock, 'id'>) => void;

  // Personnel & Paie actions
  addEmploye: (emp: Omit<Employe, 'id' | 'matricule'>) => void;
  updateEmploye: (id: string, updates: Partial<Employe>) => void;
  deleteEmploye: (id: string) => void;
  affecterEmployeChantier: (employeId: string, nouveauChantierId: string) => void;
  creerBulletinPaie: (data: Omit<BulletinPaie, 'id' | 'reference'>) => void;
  reglerBulletinPaie: (bulletinId: string, caisseId?: string, modePaiement?: any) => void;

  // Materiel & Engins actions
  addMateriel: (mat: Omit<Materiel, 'id' | 'code'>) => void;
  updateMateriel: (id: string, updates: Partial<Materiel>) => void;
  deleteMateriel: (id: string) => void;
  transfererMateriel: (transfertData: Omit<TransfertMateriel, 'id' | 'bonTransfertNumero' | 'validePar'>) => void;
  enregistrerMaintenance: (data: Omit<InterventionMaintenance, 'id'>, deduireCaisse?: boolean) => void;
  declarerPanne: (materielId: string, motif: string) => void;

  // Documents GED
  addDocument: (doc: Omit<DocumentGED, 'id' | 'code'>) => void;
  deleteDocument: (id: string) => void;

  // PVs d'avancement & Visas CTC
  addPVChantier: (pv: Omit<PVSituationChantier, 'id'>) => void;
  updatePVChantier: (id: string, updates: Partial<PVSituationChantier>) => void;
  deletePVChantier: (id: string) => void;
  validerPVChantier: (id: string) => void;
  declencherAppelFondsPourChantier: (chantierId: string, trancheNumero: number) => void;

  // Suivi Journalier des Travaux & Pointage agile
  journauxChantier: JournalChantierQuotidien[];
  addJournalChantier: (journal: Omit<JournalChantierQuotidien, 'id'>) => void;
  updateJournalChantier: (id: string, updates: Partial<JournalChantierQuotidien>) => void;
  savePointageJournalier: (chantierId: string, date: string, pointages: PointageOuvrierJournalier[]) => void;
  addTacheAgileChantier: (chantierId: string, date: string, tache: Omit<TacheJournaliereChantier, 'id'>) => void;
  updateTacheAgileChantier: (chantierId: string, date: string, tacheId: string, updates: Partial<TacheJournaliereChantier>) => void;
  deleteTacheAgileChantier: (chantierId: string, date: string, tacheId: string) => void;
  openPrintRapportJournalier: (journal: JournalChantierQuotidien) => void;

  // Bénéficiaires & Logements (Promotion Immobilière VSP - Loi 11-04)
  logements: LogementLot[];
  beneficiaires: BeneficiaireVSP[];
  addLogement: (lot: Omit<LogementLot, 'id'>) => void;
  updateLogement: (id: string, updates: Partial<LogementLot>) => void;
  deleteLogement: (id: string) => void;
  addBeneficiaire: (b: Omit<BeneficiaireVSP, 'id' | 'code'>) => void;
  updateBeneficiaire: (id: string, updates: Partial<BeneficiaireVSP>) => void;
  deleteBeneficiaire: (id: string) => void;
  encaisserTrancheVSP: (
    beneficiaireId: string,
    trancheId: string,
    caisseId?: string,
    modePaiement?: any,
    recuNumero?: string
  ) => void;
  reserverLogement: (logementId: string, beneficiaireData: Partial<BeneficiaireVSP>) => void;
  livrerLogement: (logementId: string, beneficiaireId: string, dateLivraison: string, reserves?: any[]) => void;
  openPrintContratReservation: (beneficiaire: BeneficiaireVSP, logement: LogementLot) => void;
  openPrintPVRemiseCles: (beneficiaire: BeneficiaireVSP, logement: LogementLot) => void;

  // Sous-Traitance & Décomptes Mensuels (DPM)
  contratsSousTraitance: ContratSousTraitance[];
  situationsAttachements: SituationAttachement[];
  addContratSousTraitance: (data: Omit<ContratSousTraitance, 'id'>) => void;
  addSituationAttachement: (data: Omit<SituationAttachement, 'id'>) => void;
  validerSituationAttachement: (id: string) => void;

  // Audit
  logAudit: (item: Omit<JournalAuditItem, 'id' | 'date'>) => void;

  // Print voucher modal state
  printVoucher: PrintVoucherState;
  setPrintVoucher: React.Dispatch<React.SetStateAction<PrintVoucherState>>;
  openPrintBonCaisse: (tx: Transaction) => void;
  openPrintRecuVSP: (tier: Tier, tranche: any) => void;
  openPrintBulletinPaie: (bulletin: BulletinPaie) => void;
  openPrintAppelFonds: (tier: Tier, tranche: any, chantier: Chantier) => void;
  openPrintPVAvancement: (pv: PVSituationChantier) => void;

  // Storage & Reset & Settings
  appSettings: AppSettings;
  updateAppSettings: (updates: Partial<AppSettings>) => void;
  resetToInitialData: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => boolean;

  // Messagerie Interne & Tickets de Chantier
  ticketsDiscussion: TicketDiscussion[];
  activeTicketId: string | null;
  setActiveTicketId: (id: string | null) => void;
  creerTicketDiscussion: (
    ticketData: {
      titre: string;
      chantierId: string;
      categorie: any;
      priorite: any;
      creeParType?: 'siege' | 'chantier';
    },
    premierMessage: string,
    pieceJointe?: { nom: string; url?: string; type?: 'image' | 'pdf' | 'doc' }
  ) => void;
  envoyerMessageTicket: (
    ticketId: string,
    contenu: string,
    pieceJointe?: { nom: string; url?: string; type?: 'image' | 'pdf' | 'doc' },
    overrideAuteur?: { id: string; nom: string; role: string; type: 'siege' | 'chantier' }
  ) => void;
  changerStatutTicket: (ticketId: string, statut: StatutTicket) => void;
  marquerTicketLu: (ticketId: string) => void;
  unreadTicketsCount: number;
  toastNotification: NotificationMessageRealtime | null;
  dismissToastNotification: () => void;
  playChimeNotification: () => void;
  computeNotifications: () => NotificationItem[];

  // Clôture Mensuelle & Verrouillage Comptable
  cloturesMensuelles: ClotureMensuelle[];
  estDateVerrouillee: (dateStr: string) => { isLocked: boolean; cloture?: ClotureMensuelle };
  effectuerClotureMensuelle: (anneeMois: string) => void;
  deverrouillerClotureMensuelle: (id: string, motif: string) => void;
  reverrouillerClotureMensuelle: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'batipromote_dz_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const langue: Langue = 'fr';
  const setLangue = () => {};

  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem(`${STORAGE_KEY_PREFIX}theme`) as 'light' | 'dark') || 'light';
  });

  const setTheme = (t: 'light' | 'dark') => {
    setThemeState(t);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}theme`, t);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const textDirection: 'ltr' | 'rtl' = 'ltr';
  const setTextDirection = () => {};
  const toggleTextDirection = () => {};

  useEffect(() => {
    document.documentElement.dir = textDirection;
    document.documentElement.lang = langue;
    i18n.changeLanguage(langue);
  }, [textDirection, langue]);

  const t = translations['fr'];

  // Roles & Utilisateurs State
  const [roles, setRoles] = useState<RoleDefinition[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}roles`);
    if (saved) {
      try {
        const parsed: RoleDefinition[] = JSON.parse(saved);
        const existingCodes = new Set(parsed.map((r) => r.code));
        const missingRoles = INITIAL_ROLES.filter((r) => !existingCodes.has(r.code));
        // Keep system roles strictly aligned with canonical permissions (e.g. transactions_create reserved to Directeurs & Trésoriers)
        const synced = parsed.map((r) => {
          const initRole = INITIAL_ROLES.find((ir) => ir.code === r.code && ir.isSystem);
          if (initRole) {
            return { ...r, permissions: initRole.permissions };
          }
          return r;
        });
        return [...synced, ...missingRoles];
      } catch {
        return INITIAL_ROLES;
      }
    }
    return INITIAL_ROLES;
  });

  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}utilisateurs`);
    if (saved) {
      try {
        const parsed: Utilisateur[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map((u) => u.id));
        const missingUsers = INITIAL_UTILISATEURS.filter((u) => !existingIds.has(u.id));

        // Sync rolesParChantier and chantiersAssignes for initial users
        const merged = parsed.map((u) => {
          const initUser = INITIAL_UTILISATEURS.find((iu) => iu.id === u.id);
          if (initUser) {
            return {
              ...u,
              rolesParChantier: initUser.rolesParChantier || u.rolesParChantier,
              chantiersAssignes: initUser.chantiersAssignes || u.chantiersAssignes,
              role: initUser.role || u.role,
            };
          }
          return u;
        });

        return [...merged, ...missingUsers];
      } catch {
        return INITIAL_UTILISATEURS;
      }
    }
    return INITIAL_UTILISATEURS;
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem(`${STORAGE_KEY_PREFIX}is_logged_in`) === 'true';
  });

  const [currentUser, setCurrentUserState] = useState<Utilisateur>(() => {
    const savedUser = localStorage.getItem(`${STORAGE_KEY_PREFIX}current_user`);
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        const verification = verifySessionIntegrity(parsed, utilisateurs);
        if (verification.isValid && verification.sanitizedUser) {
          return verification.sanitizedUser;
        } else {
          // Invalidate compromised or inactive session
          localStorage.removeItem(`${STORAGE_KEY_PREFIX}current_user`);
          localStorage.removeItem(`${STORAGE_KEY_PREFIX}is_logged_in`);
          localStorage.removeItem(`${STORAGE_KEY_PREFIX}session_token`);
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_UTILISATEURS[0];
  });

  const setCurrentUser = (u: Utilisateur) => {
    // If it's a known initial user, make sure chantiersAssignes is fresh
    const initUser = INITIAL_UTILISATEURS.find((iu) => iu.id === u.id);
    const resolvedUser = initUser
      ? { ...u, chantiersAssignes: initUser.chantiersAssignes, rolesParChantier: initUser.rolesParChantier, role: initUser.role }
      : u;

    setCurrentUserState(resolvedUser);
    setIsLoggedIn(true);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}current_user`, JSON.stringify(resolvedUser));
    localStorage.setItem(`${STORAGE_KEY_PREFIX}is_logged_in`, 'true');
    localStorage.setItem(`${STORAGE_KEY_PREFIX}session_token`, generateSessionSignature(resolvedUser, Date.now()));
  };

  const computeNotifications = (): NotificationItem[] => {
    if (currentUser.role === 'superadmin') return [];
    const notifications: NotificationItem[] = [];
    const today = new Date();

    // 0. Pending Cash Replenishment requests
    demandesAlimentation.forEach((d) => {
      if (d.statut !== 'en_attente_validation') return;
      if (isGlobalUser || (isChantierAllowed(d.chantierId) && d.demandeurId === currentUser.id)) {
        notifications.push({
          id: `dac-${d.id}`,
          type: 'cash',
          title: `Demande ${d.code}`,
          message: `${d.caisseCibleNom} (${d.montantDZD.toLocaleString('fr-DZ')} DZD) - Demandeur: ${d.demandeurNom}`,
          link: '/caisses',
          priority: isGlobalUser ? 'high' : 'medium',
          data: d,
        });
      }
    });

    // 0.b Pending Expense Validations & Income Info Notifications for Admin
    if (currentUser.role === 'directeur_promoteur' || currentUser.role === 'superadmin') {
      transactions.forEach((tx) => {
        if ((tx.statut === 'en_attente_visa' || tx.statut === 'en_attente') && tx.type === 'sortie') {
          notifications.push({
            id: `tx-visa-${tx.id}`,
            type: 'cash',
            title: `Dépense à Valider (${tx.reference})`,
            message: `${tx.beneficiaireNom}: ${tx.montantDZD.toLocaleString('fr-DZ')} DZD (Trésorier: ${tx.enregistrePar})`,
            link: '/transactions',
            priority: 'high',
            data: tx,
          });
        } else if (tx.type === 'entree' && tx.enregistrePar && tx.enregistrePar !== currentUser.nom) {
          notifications.push({
            id: `tx-info-${tx.id}`,
            type: 'cash',
            title: `Info Recette Encaissée`,
            message: `${tx.reference} - ${tx.beneficiaireNom}: ${tx.montantDZD.toLocaleString('fr-DZ')} DZD (Trésorier: ${tx.enregistrePar})`,
            link: '/transactions',
            priority: 'medium',
            data: tx,
          });
        }
      });
    }

    // 1. Unread tickets
    const isChantierRole = ['chef_chantier', 'conducteur_travaux', 'ingenieur_suivi', 'responsable_chantier', 'chef_projet'].includes(effectiveRole);
    ticketsDiscussion.forEach((t) => {
      if (t.statut === 'ferme') return;
      if (!isGlobalUser && !isChantierAllowed(t.chantierId)) return;
      const isUnread = isChantierRole ? t.nonLuParChantier : t.nonLuParSiege;
      if (isUnread) {
        notifications.push({
          id: `tck-${t.id}`,
          type: 'ticket',
          title: `Ticket ${t.id}`,
          message: t.titre,
          link: '/messagerie',
          priority: t.priorite === 'urgente' ? 'high' : 'medium',
          data: t,
        });
      }
    });

    // 2. Caisses under threshold
    caisses.forEach((c) => {
      if ((isGlobalUser || isChantierAllowed(c.chantierId)) && c.soldeActuelDZD <= c.seuilAlerteDZD) {
        notifications.push({
          id: `cs-${c.id}`,
          type: 'cash',
          title: `Caisse Basse: ${c.nom}`,
          message: `Solde: ${c.soldeActuelDZD.toLocaleString('fr-DZ')} DZD`,
          link: '/caisses',
          priority: 'high',
          data: c,
        });
      }
    });

    // 3. Stocks under min threshold
    stocks.forEach((s) => {
      if ((isGlobalUser || isChantierAllowed(s.chantierId)) && s.quantiteEnStock <= s.quantiteMinAlerte) {
        notifications.push({
          id: `stk-${s.id}`,
          type: 'stock',
          title: `Stock Critique: ${s.designation}`,
          message: `Stock: ${s.quantiteEnStock} ${s.unite}s`,
          link: '/stocks',
          priority: 'medium',
          data: s,
        });
      }
    });

    // 4. Materiel CTC inspections
    materiels.forEach((m) => {
      if (!isGlobalUser && !isChantierAllowed(m.chantierId)) return;
      if (m.statut === 'en_panne') {
        notifications.push({
          id: `mat-${m.id}-panne`,
          type: 'materiel',
          title: `Panne Engin: ${m.nom}`,
          message: `Statut: En panne`,
          link: '/materiel',
          priority: 'high',
          data: m,
        });
      } else if (m.prochaineVisiteCTCDueDate) {
        const dueDate = new Date(m.prochaineVisiteCTCDueDate);
        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 30) {
          notifications.push({
            id: `mat-${m.id}-ctc`,
            type: 'materiel',
            title: `CTC Due: ${m.nom}`,
            message: `Date: ${m.prochaineVisiteCTCDueDate}`,
            link: '/materiel',
            priority: diffDays <= 7 ? 'high' : 'medium',
            data: m,
          });
        }
      }
    });

    // 5. Overdue VSP
    tiers.forEach((t) => {
      const isAssigned = isGlobalUser || t.chantiersAssocies.some((cid) => isChantierAllowed(cid));
      if (isAssigned && t.type === 'client_vsp' && t.echeancierVSP) {
        t.echeancierVSP.forEach((tr) => {
          if (tr.statut === 'en_retard') {
            notifications.push({
              id: `vsp-${t.id}-${tr.id}`,
              type: 'vsp',
              title: `VSP Retard: ${t.nomRaisonSociale}`,
              message: `${tr.libelle}: ${tr.montantDZD.toLocaleString('fr-DZ')} DZD`,
              link: '/tiers',
              priority: 'high',
              data: tr,
            });
          }
        });
      }
    });

    return notifications;
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentUserState(INITIAL_UTILISATEURS[0]);
    setActiveChantierId(null);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}is_logged_in`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}current_user`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}session_token`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}active_chantier_id`);
  };

  // Active Chantier Filter (null means all chantiers)
  const [activeChantierId, setActiveChantierIdState] = useState<string | null>(() => {
    return localStorage.getItem(`${STORAGE_KEY_PREFIX}active_chantier_id`);
  });

  const setActiveChantierId = (id: string | null) => {
    setActiveChantierIdState(id);
    if (id) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}active_chantier_id`, id);
    } else {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}active_chantier_id`);
    }
  };

  // Global access evaluator
  const isGlobalUser = React.useMemo(() => {
    if (!currentUser) return false;
    return (
      // Integrateur (superadmin) should NOT have global access to business data
      currentUser.role === 'directeur_promoteur' ||
      (currentUser.chantiersAssignes && currentUser.chantiersAssignes.includes('*'))
    );
  }, [currentUser]);

  // Persistent States
  const [chantiers, setChantiers] = useState<Chantier[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}chantiers`);
    return saved ? JSON.parse(saved) : INITIAL_CHANTIERS;
  });

  // Allowed chantiers for current user
  const userAllowedChantiers = React.useMemo(() => {
    if (isGlobalUser) return chantiers;
    const assigned = currentUser?.chantiersAssignes || [];
    return chantiers.filter((c) => assigned.includes(c.id));
  }, [isGlobalUser, chantiers, currentUser?.chantiersAssignes]);

  // Centralized site permission check
  const isChantierAllowed = React.useCallback(
    (chantierId: string | null | undefined): boolean => {
      if (isGlobalUser) return true;
      if (!chantierId) return false;
      return (currentUser?.chantiersAssignes || []).includes(chantierId);
    },
    [isGlobalUser, currentUser?.chantiersAssignes]
  );

  // Auto-reset activeChantierId if user is switched to a site-scoped role and had another site selected
  useEffect(() => {
    if (!isGlobalUser && activeChantierId && !currentUser?.chantiersAssignes?.includes(activeChantierId)) {
      setActiveChantierId(currentUser?.chantiersAssignes?.[0] || null);
    }
  }, [isGlobalUser, activeChantierId, currentUser?.chantiersAssignes]);

  // Effective Role (contextual)
  const effectiveRole = React.useMemo(() => {
    if (!activeChantierId || !currentUser) return currentUser?.role || 'visiteur';
    
    // Check if user has a specific role for this chantier
    const siteSpecificRole = currentUser.rolesParChantier?.find(
      (r) => r.chantierId === activeChantierId
    );
    
    if (siteSpecificRole) {
      return siteSpecificRole.role;
    }
    
    return currentUser.role;
  }, [currentUser, activeChantierId]);

  const [caisses, setCaisses] = useState<CaisseFondRoulement[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}caisses`);
    return saved ? JSON.parse(saved) : INITIAL_CAISSES;
  });

  const [demandesAlimentation, setDemandesAlimentation] = useState<DemandeAlimenterCaisse[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}demandes_alimentation`);
    return saved ? JSON.parse(saved) : INITIAL_DEMANDES_ALIMENTATION;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}transactions`);
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [tiers, setTiers] = useState<Tier[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}tiers`);
    return saved ? JSON.parse(saved) : INITIAL_TIERS;
  });

  const [stocks, setStocks] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}stocks`);
    return saved ? JSON.parse(saved) : INITIAL_STOCKS;
  });

  const [mouvementsStock, setMouvementsStock] = useState<MouvementStock[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}mouvements_stock`);
    return saved ? JSON.parse(saved) : INITIAL_MOUVEMENTS_STOCK;
  });

  const [documents, setDocuments] = useState<DocumentGED[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}documents`);
    return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
  });

  const [employes, setEmployes] = useState<Employe[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}employes`);
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYES;
  });

  const [bulletinsPaie, setBulletinsPaie] = useState<BulletinPaie[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}bulletins_paie`);
    return saved ? JSON.parse(saved) : INITIAL_BULLETINS_PAIE;
  });

  const [materiels, setMateriels] = useState<Materiel[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}materiels`);
    return saved ? JSON.parse(saved) : INITIAL_MATERIELS;
  });

  const [transfertsMateriel, setTransfertsMateriel] = useState<TransfertMateriel[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}transferts_materiel`);
    return saved ? JSON.parse(saved) : INITIAL_TRANSFERTS_MATERIEL;
  });

  const [maintenancesMateriel, setMaintenancesMateriel] = useState<InterventionMaintenance[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}maintenances_materiel`);
    return saved ? JSON.parse(saved) : INITIAL_MAINTENANCES_MATERIEL;
  });

  const [pvsChantier, setPvsChantier] = useState<PVSituationChantier[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}pvs_chantier`);
    return saved ? JSON.parse(saved) : INITIAL_PVS_CHANTIER;
  });

  const [journauxChantier, setJournauxChantier] = useState<JournalChantierQuotidien[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}journaux_chantier`);
    return saved ? JSON.parse(saved) : INITIAL_JOURNAUX_CHANTIER;
  });

  const [logements, setLogements] = useState<LogementLot[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}logements`);
    return saved ? JSON.parse(saved) : INITIAL_LOGEMENTS;
  });

  const [beneficiaires, setBeneficiaires] = useState<BeneficiaireVSP[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}beneficiaires`);
    return saved ? JSON.parse(saved) : INITIAL_BENEFICIAIRES;
  });

  const [contratsSousTraitance, setContratsSousTraitance] = useState<ContratSousTraitance[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}contrats_sous_traitance`);
    return saved ? JSON.parse(saved) : INITIAL_CONTRATS_SOUS_TRAITANCE;
  });

  const [situationsAttachements, setSituationsAttachements] = useState<SituationAttachement[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}situations_attachements`);
    return saved ? JSON.parse(saved) : INITIAL_SITUATIONS_ATTACHEMENT;
  });

  const [journalAudit, setJournalAudit] = useState<JournalAuditItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}journal_audit`);
    return saved ? JSON.parse(saved) : INITIAL_JOURNAL_AUDIT;
  });

  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}settings`);
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  // Clôture Mensuelle State
  const [cloturesMensuelles, setCloturesMensuelles] = useState<ClotureMensuelle[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}clotures_mensuelles`);
    return saved ? JSON.parse(saved) : INITIAL_CLOTURES_MENSUELLES;
  });

  // Messagerie & Discussion Tickets State
  const [ticketsDiscussion, setTicketsDiscussion] = useState<TicketDiscussion[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}tickets_discussion`);
    return saved ? JSON.parse(saved) : INITIAL_TICKETS_DISCUSSION;
  });
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [toastNotification, setToastNotification] = useState<NotificationMessageRealtime | null>(null);

  // Print voucher state
  const [printVoucher, setPrintVoucher] = useState<PrintVoucherState>({
    isOpen: false,
    type: 'bon_caisse',
  });

  // Save to LocalStorage on updates
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}tickets_discussion`, JSON.stringify(ticketsDiscussion));
  }, [ticketsDiscussion]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}chantiers`, JSON.stringify(chantiers));
  }, [chantiers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}caisses`, JSON.stringify(caisses));
  }, [caisses]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}demandes_alimentation`, JSON.stringify(demandesAlimentation));
  }, [demandesAlimentation]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}transactions`, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}tiers`, JSON.stringify(tiers));
  }, [tiers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}stocks`, JSON.stringify(stocks));
  }, [stocks]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}mouvements_stock`, JSON.stringify(mouvementsStock));
  }, [mouvementsStock]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}documents`, JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}employes`, JSON.stringify(employes));
  }, [employes]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}bulletins_paie`, JSON.stringify(bulletinsPaie));
  }, [bulletinsPaie]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}materiels`, JSON.stringify(materiels));
  }, [materiels]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}transferts_materiel`, JSON.stringify(transfertsMateriel));
  }, [transfertsMateriel]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}maintenances_materiel`, JSON.stringify(maintenancesMateriel));
  }, [maintenancesMateriel]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}pvs_chantier`, JSON.stringify(pvsChantier));
  }, [pvsChantier]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}journaux_chantier`, JSON.stringify(journauxChantier));
  }, [journauxChantier]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}logements`, JSON.stringify(logements));
  }, [logements]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}beneficiaires`, JSON.stringify(beneficiaires));
  }, [beneficiaires]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}contrats_sous_traitance`, JSON.stringify(contratsSousTraitance));
  }, [contratsSousTraitance]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}situations_attachements`, JSON.stringify(situationsAttachements));
  }, [situationsAttachements]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}journal_audit`, JSON.stringify(journalAudit));
  }, [journalAudit]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}settings`, JSON.stringify(appSettings));
  }, [appSettings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}clotures_mensuelles`, JSON.stringify(cloturesMensuelles));
  }, [cloturesMensuelles]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}roles`, JSON.stringify(roles));
  }, [roles]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}utilisateurs`, JSON.stringify(utilisateurs));
  }, [utilisateurs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}current_user`, JSON.stringify(currentUser));
  }, [currentUser]);

  // Actions
  const addChantier = (newChantierData: Omit<Chantier, 'id'>) => {
    const id = `ch-${Date.now().toString().slice(-4)}`;
    const caisseId = `caisse-${id}`;
    
    // Create Chantier
    const newChantier: Chantier = {
      ...newChantierData,
      id,
      caisseId,
    };

    // Create automatically dedicated Caisse de Fond de Roulement for this chantier
    const newCaisse: CaisseFondRoulement = {
      id: caisseId,
      code: `CS-${newChantier.code.slice(0, 4)}-${Date.now().toString().slice(-2)}`,
      nom: `Caisse Chantier ${newChantier.nom}`,
      chantierId: id,
      chantierNom: newChantier.nom,
      responsable: newChantier.chefChantier || currentUser.nom,
      telephoneResponsable: newChantier.chefChantierTel || currentUser.telephone,
      soldeInitialDZD: 500000,
      soldeActuelDZD: 500000,
      seuilAlerteDZD: 250000,
      plafondMaxDZD: 2000000,
      dernierReapproDate: new Date().toISOString().split('T')[0],
      statut: 'actif',
    };

    setChantiers((prev) => [newChantier, ...prev]);
    setCaisses((prev) => [...prev, newCaisse]);
  };

  const updateChantier = (id: string, updates: Partial<Chantier>) => {
    setChantiers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteChantier = (id: string) => {
    if (!hasPermission('chantiers_manage')) {
      logAudit({
        utilisateurNom: currentUser.nom,
        utilisateurRole: currentUser.role,
        action: 'securite_alerte',
        module: 'securite',
        entiteReference: `SEC-DEL-CHT-${id}`,
        details: `Refus d'autorisation : tentative non habilitée de suppression du chantier ${id}`,
      });
      return;
    }
    const target = chantiers.find((c) => c.id === id);
    setChantiers((prev) => prev.filter((c) => c.id !== id));
    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'suppression',
      module: 'chantiers',
      entiteReference: target?.code || id,
      details: `Suppression définitive du chantier ${target?.nom || id}`,
    });
  };

  const alimenterCaisse = (
    caisseCibleId: string,
    montantDZD: number,
    caisseSourceId: string | null,
    motif: string,
    modePaiement: any
  ) => {
    const dateToday = new Date().toISOString().split('T')[0];
    const targetCaisse = caisses.find((c) => c.id === caisseCibleId);
    if (!targetCaisse) return;

    // Adjust caisses
    setCaisses((prev) =>
      prev.map((c) => {
        if (c.id === caisseCibleId) {
          const newSolde = c.soldeActuelDZD + montantDZD;
          return {
            ...c,
            soldeActuelDZD: newSolde,
            dernierReapproDate: dateToday,
            statut: newSolde <= c.seuilAlerteDZD ? 'alerte_seuil' : 'actif',
          };
        }
        if (caisseSourceId && c.id === caisseSourceId) {
          const newSolde = c.soldeActuelDZD - montantDZD;
          return {
            ...c,
            soldeActuelDZD: newSolde,
            statut: newSolde <= c.seuilAlerteDZD ? 'alerte_seuil' : 'actif',
          };
        }
        return c;
      })
    );

    // Create transaction log
    const txId = `tx-${Date.now()}`;
    const txRef = `ALIM-${Date.now().toString().slice(-6)}`;
    const newTx: Transaction = {
      id: txId,
      reference: txRef,
      date: dateToday,
      type: caisseSourceId ? 'transfert_caisse' : 'entree',
      caisseSourceId: caisseSourceId || undefined,
      caisseDestinationId: caisseCibleId,
      chantierId: targetCaisse.chantierId || undefined,
      beneficiaireNom: `Alimentation ${targetCaisse.nom}`,
      montantDZD,
      modePaiement,
      categorie: 'reapprovisionnement_caisse',
      statut: 'valide',
      motif: motif || `Réapprovisionnement fond de roulement de ${targetCaisse.nom}`,
      bonCaisseNumero: `BC-ALIM-${Date.now().toString().slice(-4)}`,
      enregistrePar: currentUser.nom,
      validePar: currentUser.nom,
      dateValidation: dateToday,
    };

    setTransactions((prev) => [newTx, ...prev]);
  };

  const demanderAlimentationCaisse = (data: {
    caisseCibleId: string;
    montantDZD: number;
    caisseSourceId?: string | null;
    motif: string;
    modePaiement: any;
  }) => {
    const targetCaisse = caisses.find((c) => c.id === data.caisseCibleId);
    if (!targetCaisse) return;

    const dateToday = new Date().toISOString().split('T')[0];

    // If user is Admin / Direction, execute directly
    if (isGlobalUser) {
      alimenterCaisse(data.caisseCibleId, data.montantDZD, data.caisseSourceId || null, data.motif, data.modePaiement);
      const id = `dac-${Date.now()}`;
      const code = `DAC-2026-${Math.floor(100 + Math.random() * 900)}`;
      const newDemande: DemandeAlimenterCaisse = {
        id,
        code,
        caisseCibleId: data.caisseCibleId,
        caisseCibleNom: targetCaisse.nom,
        chantierId: targetCaisse.chantierId || undefined,
        chantierNom: targetCaisse.chantierNom || undefined,
        caisseSourceId: data.caisseSourceId || undefined,
        montantDZD: data.montantDZD,
        motif: data.motif,
        modePaiement: data.modePaiement,
        demandeurId: currentUser.id,
        demandeurNom: currentUser.nom,
        demandeurRole: currentUser.role,
        dateDemande: dateToday,
        statut: 'validee',
        validateurNom: currentUser.nom,
        dateValidation: dateToday,
      };
      setDemandesAlimentation((prev) => [newDemande, ...prev]);
      logAudit({
        utilisateurNom: currentUser.nom,
        utilisateurRole: currentUser.role,
        action: 'creation',
        module: 'caisses',
        entiteReference: code,
        details: `Alimentation directe de caisse (${data.montantDZD.toLocaleString('fr-DZ')} DZD pour ${targetCaisse.nom})`,
        impactFinancierDZD: data.montantDZD,
      });
      return;
    }

    // Otherwise, create request in pending validation
    const id = `dac-${Date.now()}`;
    const code = `DAC-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newDemande: DemandeAlimenterCaisse = {
      id,
      code,
      caisseCibleId: data.caisseCibleId,
      caisseCibleNom: targetCaisse.nom,
      chantierId: targetCaisse.chantierId || undefined,
      chantierNom: targetCaisse.chantierNom || undefined,
      caisseSourceId: data.caisseSourceId || undefined,
      montantDZD: data.montantDZD,
      motif: data.motif,
      modePaiement: data.modePaiement,
      demandeurId: currentUser.id,
      demandeurNom: currentUser.nom,
      demandeurRole: currentUser.role,
      dateDemande: dateToday,
      statut: 'en_attente_validation',
    };

    setDemandesAlimentation((prev) => [newDemande, ...prev]);
    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'creation',
      module: 'caisses',
      entiteReference: code,
      details: `Demande d'alimentation de caisse soumise pour validation (${data.montantDZD.toLocaleString('fr-DZ')} DZD pour ${targetCaisse.nom})`,
    });
  };

  const validerDemandeAlimentation = (id: string) => {
    const demande = demandesAlimentation.find((d) => d.id === id);
    if (!demande || demande.statut !== 'en_attente_validation') return;

    const dateToday = new Date().toISOString().split('T')[0];

    // Execute cash replenishment
    alimenterCaisse(
      demande.caisseCibleId,
      demande.montantDZD,
      demande.caisseSourceId || null,
      `[Validé par ${currentUser.nom}] ${demande.motif}`,
      demande.modePaiement
    );

    // Update request
    setDemandesAlimentation((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              statut: 'validee',
              validateurNom: currentUser.nom,
              dateValidation: dateToday,
            }
          : d
      )
    );

    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'validation',
      module: 'caisses',
      entiteReference: demande.code,
      details: `Validation par l'Admin de la demande d'alimentation (${demande.montantDZD.toLocaleString('fr-DZ')} DZD) pour ${demande.caisseCibleNom}`,
      impactFinancierDZD: demande.montantDZD,
    });
  };

  const refuserDemandeAlimentation = (id: string, motifRefus?: string) => {
    const demande = demandesAlimentation.find((d) => d.id === id);
    if (!demande || demande.statut !== 'en_attente_validation') return;

    const dateToday = new Date().toISOString().split('T')[0];

    setDemandesAlimentation((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              statut: 'refusee',
              validateurNom: currentUser.nom,
              dateValidation: dateToday,
              motifRefus: motifRefus || 'Refusé par la direction',
            }
          : d
      )
    );

    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'modification',
      module: 'caisses',
      entiteReference: demande.code,
      details: `Refus de la demande d'alimentation de caisse pour ${demande.caisseCibleNom}. Motif: ${motifRefus || 'Non spécifié'}`,
    });
  };

  const updateCaisse = (id: string, updates: Partial<CaisseFondRoulement>) => {
    setCaisses((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const estDateVerrouillee = (dateStr: string): { isLocked: boolean; cloture?: ClotureMensuelle } => {
    if (!dateStr) return { isLocked: false };
    const ym = dateStr.slice(0, 7);
    const cloture = cloturesMensuelles.find(
      (c) => c.anneeMois === ym && c.statut === 'verrouille'
    );
    return {
      isLocked: !!cloture,
      cloture,
    };
  };

  const effectuerClotureMensuelle = (anneeMois: string) => {
    const MOIS_FR: { [key: string]: string } = {
      '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
      '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
      '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre',
    };
    const [y, m] = anneeMois.split('-');
    const libelleMois = `${MOIS_FR[m] || m} ${y}`;

    const txs = transactions.filter(
      (t) => t.date.startsWith(anneeMois) && t.statut !== 'rejete'
    );

    const totalDepensesDZD = txs
      .filter((t) => t.type === 'sortie')
      .reduce((acc, t) => acc + t.montantDZD, 0);

    const totalRecettesDZD = txs
      .filter((t) => t.type === 'entree')
      .reduce((acc, t) => acc + t.montantDZD, 0);

    const soldeNetMoisDZD = totalRecettesDZD - totalDepensesDZD;
    const chantiersImpactesCount = new Set(
      txs.map((t) => t.chantierId).filter(Boolean)
    ).size;

    const newCloture: ClotureMensuelle = {
      id: `cloture-${anneeMois}-${Date.now().toString().slice(-4)}`,
      anneeMois,
      libelleMois,
      dateVerrouillage: new Date().toISOString(),
      verrouilleParNom: currentUser.nom,
      verrouilleParRole: currentUser.role === 'superadmin' ? 'SuperAdmin Système' : 'Directeur Général (Admin)',
      statut: 'verrouille',
      nbTransactionsVerrouillees: txs.length,
      totalDepensesDZD,
      totalRecettesDZD,
      soldeNetMoisDZD,
      chantiersImpactesCount,
    };

    setCloturesMensuelles((prev) => {
      const filtered = prev.filter((c) => c.anneeMois !== anneeMois);
      return [newCloture, ...filtered];
    });

    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'cloture',
      module: 'cloture_mensuelle',
      entiteReference: `CLOTURE-${anneeMois}`,
      details: `Clôture mensuelle comptable exécutée pour ${libelleMois}. ${txs.length} transactions verrouillées. Solde Net: ${soldeNetMoisDZD} DZD.`,
      impactFinancierDZD: soldeNetMoisDZD,
    });
  };

  const deverrouillerClotureMensuelle = (id: string, motif: string) => {
    const target = cloturesMensuelles.find((c) => c.id === id);
    if (!target) return;

    setCloturesMensuelles((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              statut: 'deverrouille_exceptionnel',
              motifsDeverrouillage: motif,
              dateDeverrouillage: new Date().toISOString(),
              deverrouilleParNom: currentUser.nom,
            }
          : c
      )
    );

    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'deverrouillage',
      module: 'cloture_mensuelle',
      entiteReference: `DEVERROU-${target.anneeMois}`,
      details: `DÉVERROUILLAGE EXCEPTIONNEL accordé pour la clôture ${target.libelleMois}. Motif: ${motif}`,
    });
  };

  const reverrouillerClotureMensuelle = (id: string) => {
    const target = cloturesMensuelles.find((c) => c.id === id);
    if (!target) return;

    setCloturesMensuelles((prev) =>
      prev.map((c) => (c.id === id ? { ...c, statut: 'verrouille' } : c))
    );

    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'cloture',
      module: 'cloture_mensuelle',
      entiteReference: `REVERROU-${target.anneeMois}`,
      details: `Re-verrouillage de la clôture mensuelle pour ${target.libelleMois}.`,
    });
  };

  const addTransaction = (txData: Omit<Transaction, 'id' | 'reference'>) => {
    // RBAC Security Check: Must have transactions_create permission and cannot be superadmin
    if (!hasPermission('transactions_create') || currentUser.role === 'superadmin') {
      logAudit({
        utilisateurNom: currentUser.nom,
        utilisateurRole: currentUser.role,
        action: 'securite_alerte',
        module: 'securite',
        entiteReference: 'TX-CREATE-DENIED',
        details: `Refus d'autorisation : tentative non habilitée de création d'une opération financière ou d'une dépense.`,
      });
      return;
    }

    const { isLocked, cloture } = estDateVerrouillee(txData.date);
    if (isLocked && cloture) {
      logAudit({
        utilisateurNom: currentUser.nom,
        utilisateurRole: currentUser.role,
        action: 'securite_alerte',
        module: 'cloture_mensuelle',
        entiteReference: 'DATE-VERROUILLEE',
        details: `Rejet de saisie : période comptable ${cloture.libelleMois} définitivement clôturée et verrouillée.`,
      });
      return;
    }

    const id = `tx-${Date.now()}`;
    const dateStr = txData.date.replace(/-/g, '');
    const reference = `FLX-${dateStr}-${Math.floor(100 + Math.random() * 900)}`;

    const isTresorier = currentUser.role === 'tresorier_caissier';

    // Règle de validation Trésorier vs Admin :
    // 1. Dépense (sortie) saisie par Trésorier => En attente de validation Admin ('en_attente_visa')
    // 2. Recette (entrée) saisie par Trésorier => Validée immédiatement, Admin notifié pour information
    // 3. Admin / Directeur => Validé selon demande
    let initialStatut = txData.statut || 'valide';

    if (isTresorier) {
      if (txData.type === 'sortie') {
        initialStatut = 'en_attente_visa';
      } else if (txData.type === 'entree') {
        initialStatut = 'valide';
      }
    } else if (
      appSettings.validationWorkflow?.deuxNiveauxActive &&
      txData.type === 'sortie' &&
      txData.montantDZD >= (appSettings.validationWorkflow?.seuilMontantValidationDZD || 0)
    ) {
      initialStatut = 'en_attente_visa';
    }

    const newTx: Transaction = {
      ...txData,
      id,
      reference,
      statut: initialStatut,
      enregistrePar: txData.enregistrePar || currentUser.nom,
      bonCaisseNumero:
        txData.modePaiement === 'especes'
          ? txData.bonCaisseNumero || `BC-${dateStr.slice(0, 6)}-${Math.floor(100 + Math.random() * 900)}`
          : undefined,
    };

    // If transaction is validated directly, impact caisses and chantiers
    if (newTx.statut === 'valide') {
      applyTransactionBalances(newTx);
    }

    setTransactions((prev) => [newTx, ...prev]);

    // Trésorier Notifications & Audit
    if (isTresorier) {
      if (txData.type === 'sortie') {
        logAudit({
          utilisateurNom: currentUser.nom,
          utilisateurRole: currentUser.role,
          action: 'creation',
          module: 'caisses',
          entiteReference: reference,
          details: `DEMANDE DE DÉPENSE : Le Trésorier ${currentUser.nom} a enregistré une dépense de ${txData.montantDZD.toLocaleString('fr-DZ')} DZD (${txData.beneficiaireNom}) en attente de validation/visa par l'Admin.`,
          impactFinancierDZD: txData.montantDZD,
        });

        setToastNotification({
          id: `toast-${Date.now()}`,
          ticketId: reference,
          ticketTitre: `Demande de Dépense (${reference})`,
          chantierNom: txData.beneficiaireNom || 'Trésorerie',
          auteurNom: currentUser.nom,
          auteurRole: currentUser.role,
          contenuApercu: `Demande de dépense de ${txData.montantDZD.toLocaleString('fr-DZ')} DZD soumise par le Trésorier. En attente de validation.`,
          dateEnvoi: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        });
      } else if (txData.type === 'entree') {
        logAudit({
          utilisateurNom: currentUser.nom,
          utilisateurRole: currentUser.role,
          action: 'creation',
          module: 'caisses',
          entiteReference: reference,
          details: `RECETTE ENCAISSÉE : Le Trésorier ${currentUser.nom} a encaissé et enregistré une recette de ${txData.montantDZD.toLocaleString('fr-DZ')} DZD (${txData.beneficiaireNom}). Notification transmise à l'Admin.`,
          impactFinancierDZD: txData.montantDZD,
        });

        setToastNotification({
          id: `toast-${Date.now()}`,
          ticketId: reference,
          ticketTitre: `Info Encaissement Recette (${reference})`,
          chantierNom: txData.beneficiaireNom || 'Trésorerie',
          auteurNom: currentUser.nom,
          auteurRole: currentUser.role,
          contenuApercu: `Encaissement de ${txData.montantDZD.toLocaleString('fr-DZ')} DZD enregistré par le Trésorier ${currentUser.nom}.`,
          dateEnvoi: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        });
      }
    }
  };

  const applyTransactionBalances = (tx: Transaction) => {
    // 1. If cash disbursement from a caisse
    if (tx.caisseSourceId && (tx.type === 'sortie' || tx.type === 'transfert_caisse')) {
      setCaisses((prev) =>
        prev.map((c) => {
          if (c.id === tx.caisseSourceId) {
            const newSolde = c.soldeActuelDZD - tx.montantDZD;
            return {
              ...c,
              soldeActuelDZD: newSolde,
              statut: newSolde <= c.seuilAlerteDZD ? 'alerte_seuil' : 'actif',
            };
          }
          if (tx.type === 'transfert_caisse' && c.id === tx.caisseDestinationId) {
            const newSolde = c.soldeActuelDZD + tx.montantDZD;
            return {
              ...c,
              soldeActuelDZD: newSolde,
              statut: newSolde <= c.seuilAlerteDZD ? 'alerte_seuil' : 'actif',
            };
          }
          return c;
        })
      );
    } else if (tx.caisseDestinationId && tx.type === 'entree') {
      // Inflow into caisse
      setCaisses((prev) =>
        prev.map((c) => {
          if (c.id === tx.caisseDestinationId) {
            const newSolde = c.soldeActuelDZD + tx.montantDZD;
            return {
              ...c,
              soldeActuelDZD: newSolde,
              statut: newSolde <= c.seuilAlerteDZD ? 'alerte_seuil' : 'actif',
            };
          }
          return c;
        })
      );
    }

    // 2. Impact Chantier expenses or revenues
    if (tx.chantierId) {
      setChantiers((prev) =>
        prev.map((ch) => {
          if (ch.id === tx.chantierId) {
            if (tx.type === 'sortie') {
              return {
                ...ch,
                depensesEngageesDZD: ch.depensesEngageesDZD + tx.montantDZD,
              };
            } else if (tx.type === 'entree') {
              return {
                ...ch,
                recettesEncaisseesDZD: ch.recettesEncaisseesDZD + tx.montantDZD,
              };
            }
          }
          return ch;
        })
      );
    }

    // 3. Impact Tier balance if linked
    if (tx.tierId) {
      setTiers((prev) =>
        prev.map((tier) => {
          if (tier.id === tx.tierId) {
            if (tier.type === 'client_vsp' && tx.type === 'entree') {
              return {
                ...tier,
                soldeRegleDZD: tier.soldeRegleDZD + tx.montantDZD,
                soldeDuDZD: Math.max(0, tier.soldeDuDZD - tx.montantDZD),
              };
            } else if (tier.type === 'fournisseur' || tier.type === 'sous_traitant') {
              if (tx.type === 'sortie') {
                return {
                  ...tier,
                  soldeRegleDZD: tier.soldeRegleDZD + tx.montantDZD,
                  soldeDuDZD: Math.max(0, tier.soldeDuDZD - tx.montantDZD),
                };
              }
            }
          }
          return tier;
        })
      );
    }
  };

  const validerTransaction = (id: string) => {
    // RBAC Security Check: decaissement_approve or directeur_promoteur
    if (!hasPermission('decaissement_approve') && currentUser.role !== 'directeur_promoteur') {
      logAudit({
        utilisateurNom: currentUser.nom,
        utilisateurRole: currentUser.role,
        action: 'securite_alerte',
        module: 'securite',
        entiteReference: `SEC-VAL-TX-${id}`,
        details: `Refus d'autorisation : tentative de validation non habilitée de la transaction ${id}`,
      });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const tx = transactions.find((t) => t.id === id);
    if (!tx || tx.statut === 'valide') return;

    // Check if period is locked
    const { isLocked } = estDateVerrouillee(tx.date);
    if (isLocked) {
      logAudit({
        utilisateurNom: currentUser.nom,
        utilisateurRole: currentUser.role,
        action: 'securite_alerte',
        module: 'cloture_mensuelle',
        entiteReference: tx.reference,
        details: `Rejet de validation : la période comptable correspondant à la date (${tx.date}) est verrouillée.`,
      });
      return;
    }

    applyTransactionBalances(tx);

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              statut: 'valide',
              validePar: currentUser.nom,
              dateValidation: today,
            }
          : t
      )
    );

    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'validation',
      module: 'transactions',
      entiteReference: tx.reference,
      details: `Validation officielle de la transaction ${tx.reference} (${tx.montantDZD.toLocaleString('fr-DZ')} DZD) pour ${tx.beneficiaireNom}`,
      impactFinancierDZD: tx.montantDZD,
    });
  };

  const rejeterTransaction = (id: string) => {
    if (!hasPermission('decaissement_approve') && currentUser.role !== 'directeur_promoteur') {
      logAudit({
        utilisateurNom: currentUser.nom,
        utilisateurRole: currentUser.role,
        action: 'securite_alerte',
        module: 'securite',
        entiteReference: `SEC-REJ-TX-${id}`,
        details: `Refus d'autorisation : tentative de rejet non habilité de la transaction ${id}`,
      });
      return;
    }

    const targetTx = transactions.find((t) => t.id === id);
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, statut: 'rejete' } : t))
    );

    if (targetTx) {
      logAudit({
        utilisateurNom: currentUser.nom,
        utilisateurRole: currentUser.role,
        action: 'modification',
        module: 'transactions',
        entiteReference: targetTx.reference,
        details: `Rejet du décaissement ${targetTx.reference} (${targetTx.montantDZD.toLocaleString('fr-DZ')} DZD)`,
      });
    }
  };

  const addTier = (tierData: Omit<Tier, 'id' | 'code'>) => {
    const prefix =
      tierData.type === 'fournisseur'
        ? 'FRS'
        : tierData.type === 'sous_traitant'
        ? 'STR'
        : tierData.type === 'client_vsp'
        ? 'CLT'
        : 'TRS';
    const id = `tier-${Date.now().toString().slice(-4)}`;
    const code = `${prefix}-${Date.now().toString().slice(-4)}`;

    const newTier: Tier = {
      ...tierData,
      id,
      code,
    };

    setTiers((prev) => [newTier, ...prev]);
  };

  const updateTier = (id: string, updates: Partial<Tier>) => {
    setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const validerTrancheVSP = (
    tierId: string,
    trancheId: string,
    montantPaye: number,
    datePaiement: string,
    modePaiement: any,
    recuNumero: string
  ) => {
    const targetTier = tiers.find((t) => t.id === tierId);
    if (!targetTier || !targetTier.echeancierVSP) return;

    // Update tier and tranche
    setTiers((prev) =>
      prev.map((tier) => {
        if (tier.id === tierId && tier.echeancierVSP) {
          const updatedEcheances = tier.echeancierVSP.map((tr) => {
            if (tr.id === trancheId) {
              return {
                ...tr,
                statut: 'regle' as const,
                montantPayeDZD: montantPaye,
                datePaiement,
                recuNumero,
              };
            }
            return tr;
          });

          const totalPaye = updatedEcheances.reduce((acc, tr) => acc + tr.montantPayeDZD, 0);
          const totalVente = tier.prixVenteTotalDZD || 0;

          return {
            ...tier,
            echeancierVSP: updatedEcheances,
            soldeRegleDZD: totalPaye,
            soldeDuDZD: Math.max(0, totalVente - totalPaye),
          };
        }
        return tier;
      })
    );

    // Register incoming transaction
    const targetChantierId = targetTier.chantiersAssocies[0] || undefined;
    const centralCaisse = caisses.find((c) => c.chantierId === null) || caisses[0];

    addTransaction({
      date: datePaiement,
      type: 'entree',
      caisseDestinationId: centralCaisse.id,
      chantierId: targetChantierId,
      tierId: targetTier.id,
      beneficiaireNom: `${targetTier.nomRaisonSociale} (Client VSP)`,
      montantDZD: montantPaye,
      modePaiement,
      categorie: 'versement_tranche_vsp',
      statut: 'valide',
      motif: `Encaissement Tranche VSP - Reçu n° ${recuNumero}`,
      enregistrePar: currentUser.nom,
      validePar: currentUser.nom,
      dateValidation: datePaiement,
    });
  };

  const addStockItem = (itemData: Omit<StockItem, 'id' | 'code' | 'valeurTotaleDZD'>) => {
    const id = `stk-${Date.now().toString().slice(-4)}`;
    const code = `MAT-${Date.now().toString().slice(-4)}`;
    const valeurTotaleDZD = itemData.quantiteEnStock * itemData.prixUnitaireMoyenDZD;

    const newItem: StockItem = {
      ...itemData,
      id,
      code,
      valeurTotaleDZD,
    };

    setStocks((prev) => [newItem, ...prev]);
  };

  const updateStockItem = (id: string, updates: Partial<StockItem>) => {
    setStocks((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          const qty = updated.quantiteEnStock;
          const pu = updated.prixUnitaireMoyenDZD;
          return {
            ...updated,
            valeurTotaleDZD: qty * pu,
          };
        }
        return item;
      })
    );
  };

  const updateStockItemThreshold = (id: string, newMin: number) => {
    setStocks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantiteMinAlerte: newMin } : item))
    );
  };

  const addMouvementStock = (mvtData: Omit<MouvementStock, 'id'>) => {
    const id = `mvt-${Date.now()}`;
    const newMvt: MouvementStock = {
      ...mvtData,
      id,
    };

    // Update stock item quantity
    setStocks((prev) =>
      prev.map((item) => {
        if (item.id === mvtData.stockItemId) {
          const delta =
            mvtData.type === 'entree_livraison' ? mvtData.quantite : -mvtData.quantite;
          const newQty = Math.max(0, item.quantiteEnStock + delta);
          return {
            ...item,
            quantiteEnStock: newQty,
            valeurTotaleDZD: newQty * item.prixUnitaireMoyenDZD,
            dernierMouvementDate: mvtData.date,
          };
        }
        return item;
      })
    );

    setMouvementsStock((prev) => [newMvt, ...prev]);
  };

  const addDocument = (docData: Omit<DocumentGED, 'id' | 'code'>) => {
    const id = `doc-${Date.now()}`;
    const code = `GED-${Date.now().toString().slice(-4)}`;
    const newDoc: DocumentGED = {
      ...docData,
      id,
      code,
    };
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const deleteDocument = (id: string) => {
    if (!hasPermission('ged_manage')) {
      logAudit({
        utilisateurNom: currentUser.nom,
        utilisateurRole: currentUser.role,
        action: 'securite_alerte',
        module: 'securite',
        entiteReference: `SEC-DEL-DOC-${id}`,
        details: `Refus d'autorisation : tentative non habilitée de suppression du document GED ${id}`,
      });
      return;
    }
    const doc = documents.find((d) => d.id === id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'suppression',
      module: 'settings',
      entiteReference: doc?.code || id,
      details: `Suppression du document GED ${doc?.titre || id}`,
    });
  };

  // Open voucher modals
  const openPrintBonCaisse = (tx: Transaction) => {
    const chantier = tx.chantierId ? chantiers.find((c) => c.id === tx.chantierId) : undefined;
    const caisse = tx.caisseSourceId ? caisses.find((c) => c.id === tx.caisseSourceId) : undefined;
    const tier = tx.tierId ? tiers.find((t) => t.id === tx.tierId) : undefined;
    
    setPrintVoucher({
      isOpen: true,
      type: 'bon_caisse',
      transaction: tx,
      chantier,
      caisse,
      tier,
    });
  };

  const openPrintRecuVSP = (tier: Tier, tranche: any) => {
    const chantier = tier.chantiersAssocies[0]
      ? chantiers.find((c) => c.id === tier.chantiersAssocies[0])
      : undefined;

    setPrintVoucher({
      isOpen: true,
      type: 'recu_vsp',
      tier,
      chantier,
      data: { tranche },
    });
  };

  // Personnel & Paie actions
  const addEmploye = (empData: Omit<Employe, 'id' | 'matricule'>) => {
    const id = `emp-${Date.now().toString().slice(-4)}`;
    const matricule = `EMP-DZ-${Date.now().toString().slice(-3)}`;
    const targetChantier = chantiers.find((c) => c.id === empData.chantierId);
    const newEmp: Employe = {
      ...empData,
      id,
      matricule,
      chantierNom: targetChantier?.nom || 'Non affecté',
    };
    setEmployes((prev) => [newEmp, ...prev]);
  };

  const updateEmploye = (id: string, updates: Partial<Employe>) => {
    setEmployes((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          const updated = { ...e, ...updates };
          if (updates.chantierId) {
            const ch = chantiers.find((c) => c.id === updates.chantierId);
            updated.chantierNom = ch?.nom || updated.chantierNom;
          }
          return updated;
        }
        return e;
      })
    );
  };

  const deleteEmploye = (id: string) => {
    if (!hasPermission('personnel_manage')) {
      logAudit({
        utilisateurNom: currentUser.nom,
        utilisateurRole: currentUser.role,
        action: 'securite_alerte',
        module: 'securite',
        entiteReference: `SEC-DEL-EMP-${id}`,
        details: `Refus d'autorisation : tentative non habilitée de suppression/radiation de l'employé ${id}`,
      });
      return;
    }
    const emp = employes.find((e) => e.id === id);
    setEmployes((prev) => prev.filter((e) => e.id !== id));
    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'suppression',
      module: 'personnel',
      entiteReference: emp?.matricule || id,
      details: `Suppression de la fiche employé ${emp?.nom || id}`,
    });
  };

  const affecterEmployeChantier = (employeId: string, nouveauChantierId: string) => {
    const targetCh = chantiers.find((c) => c.id === nouveauChantierId);
    setEmployes((prev) =>
      prev.map((e) =>
        e.id === employeId
          ? {
              ...e,
              chantierId: nouveauChantierId,
              chantierNom: targetCh ? targetCh.nom : e.chantierNom,
            }
          : e
      )
    );
  };

  const creerBulletinPaie = (data: Omit<BulletinPaie, 'id' | 'reference'>) => {
    const id = `bp-${Date.now().toString().slice(-4)}`;
    const reference = `PAY-${new Date().toISOString().slice(0, 7)}-${Math.floor(10 + Math.random() * 90)}`;
    const newBp: BulletinPaie = {
      ...data,
      id,
      reference,
    };
    setBulletinsPaie((prev) => [newBp, ...prev]);
  };

  const reglerBulletinPaie = (
    bulletinId: string,
    caisseId?: string,
    modePaiement: 'especes_caisse' | 'virement' | 'cheque' = 'especes_caisse'
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const bp = bulletinsPaie.find((b) => b.id === bulletinId);
    if (!bp || bp.statut === 'paye') return;

    const targetCaisse =
      (caisseId ? caisses.find((c) => c.id === caisseId) : undefined) ||
      caisses.find((c) => c.chantierId === bp.chantierId) ||
      caisses[0];

    const bonCaisseNum = `BC-SAL-${Date.now().toString().slice(-4)}`;

    // Update bulletin
    setBulletinsPaie((prev) =>
      prev.map((b) =>
        b.id === bulletinId
          ? {
              ...b,
              statut: 'paye',
              dateReglement: today,
              caisseId: targetCaisse?.id,
              bonCaisseNumero: bonCaisseNum,
              modePaiement,
            }
          : b
      )
    );

    // Create corresponding cash transaction in ledger
    addTransaction({
      date: today,
      type: 'sortie',
      caisseSourceId: targetCaisse?.id,
      chantierId: bp.chantierId,
      beneficiaireNom: `${bp.employeNom} (Salaire / Quinzaine)`,
      montantDZD: bp.netAPayerDZD,
      modePaiement: modePaiement === 'especes_caisse' ? 'especes' : modePaiement,
      categorie: 'main_d_oeuvre_journaliere',
      statut: 'valide',
      motif: `Règlement salaire / quinzaine : ${bp.employeNom} (${bp.periodeMois})`,
      bonCaisseNumero: bonCaisseNum,
      enregistrePar: currentUser.nom,
      validePar: currentUser.nom,
      dateValidation: today,
    });
  };

  const openPrintBulletinPaie = (bulletin: BulletinPaie) => {
    const employe = employes.find((e) => e.id === bulletin.employeId);
    const chantier = chantiers.find((c) => c.id === bulletin.chantierId);
    const caisse = bulletin.caisseId ? caisses.find((c) => c.id === bulletin.caisseId) : undefined;

    setPrintVoucher({
      isOpen: true,
      type: 'bulletin_paie',
      bulletin,
      employe,
      chantier,
      caisse,
    });
  };

  const openPrintAppelFonds = (tier: Tier, tranche: any, chantier: Chantier) => {
    setPrintVoucher({
      isOpen: true,
      type: 'appel_fonds_vsp',
      tier,
      chantier,
      appelFonds: {
        tier,
        tranche,
        chantier,
      },
      data: { tranche },
    });
  };

  const openPrintPVAvancement = (pv: PVSituationChantier) => {
    const chantier = chantiers.find((c) => c.id === pv.chantierId);
    setPrintVoucher({
      isOpen: true,
      type: 'pv_avancement',
      pv,
      chantier,
    });
  };

  const openPrintRapportJournalier = (journal: JournalChantierQuotidien) => {
    const chantier = chantiers.find((c) => c.id === journal.chantierId);
    setPrintVoucher({
      isOpen: true,
      type: 'rapport_journalier',
      journalQuotidien: journal,
      chantier,
    });
  };


  // Materiel & Engins actions
  const addMateriel = (matData: Omit<Materiel, 'id' | 'code'>) => {
    const id = `mat-${Date.now().toString().slice(-4)}`;
    const catCodeMap: Record<string, string> = {
      engin_lourd: 'ENG',
      levage_manutention: 'LEV',
      beton_malaxage: 'BET',
      energie_compresseur: 'NRG',
      coffrage_echafaudage: 'COF',
      petit_outillage: 'OUT',
    };
    const prefix = catCodeMap[matData.categorie] || 'MAT';
    const code = `${prefix}-${Math.floor(100 + Math.random() * 900)}`;

    const targetCh = matData.chantierId ? chantiers.find((c) => c.id === matData.chantierId) : null;
    const newMat: Materiel = {
      ...matData,
      id,
      code,
      chantierNom: targetCh ? targetCh.nom : (matData.chantierId ? undefined : 'Parc Central & Dépôt Sidi Moussa'),
    };
    setMateriels((prev) => [newMat, ...prev]);
  };

  const updateMateriel = (id: string, updates: Partial<Materiel>) => {
    setMateriels((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const updated = { ...m, ...updates };
        if (updates.chantierId !== undefined) {
          if (updates.chantierId) {
            const ch = chantiers.find((c) => c.id === updates.chantierId);
            updated.chantierNom = ch ? ch.nom : updated.chantierNom;
          } else {
            updated.chantierNom = 'Parc Central & Dépôt Sidi Moussa';
          }
        }
        return updated;
      })
    );
  };

  const deleteMateriel = (id: string) => {
    if (!hasPermission('materiel_manage')) {
      logAudit({
        utilisateurNom: currentUser.nom,
        utilisateurRole: currentUser.role,
        action: 'securite_alerte',
        module: 'securite',
        entiteReference: `SEC-DEL-MAT-${id}`,
        details: `Refus d'autorisation : tentative non habilitée de suppression de matériel/engin ${id}`,
      });
      return;
    }
    const mat = materiels.find((m) => m.id === id);
    setMateriels((prev) => prev.filter((m) => m.id !== id));
    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'suppression',
      module: 'materiel',
      entiteReference: mat?.code || id,
      details: `Suppression définitive du matériel ${mat?.nom || id}`,
    });
  };

  const transfererMateriel = (transfertData: Omit<TransfertMateriel, 'id' | 'bonTransfertNumero' | 'validePar'>) => {
    const id = `trf-${Date.now().toString().slice(-4)}`;
    const bonTransfertNumero = `BT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTrf: TransfertMateriel = {
      ...transfertData,
      id,
      bonTransfertNumero,
      validePar: currentUser.nom,
    };

    setTransfertsMateriel((prev) => [newTrf, ...prev]);

    // Update equipment location & status
    const targetCh = transfertData.chantierDestinationId
      ? chantiers.find((c) => c.id === transfertData.chantierDestinationId)
      : null;

    setMateriels((prev) =>
      prev.map((m) => {
        if (m.id !== transfertData.materielId) return m;
        return {
          ...m,
          chantierId: transfertData.chantierDestinationId,
          chantierNom: targetCh ? targetCh.nom : 'Parc Central & Dépôt Sidi Moussa',
          statut: transfertData.chantierDestinationId ? 'en_service' : 'disponible',
          compteurHeuresKm: transfertData.compteurAuDepart || m.compteurHeuresKm,
        };
      })
    );
  };

  const enregistrerMaintenance = (
    data: Omit<InterventionMaintenance, 'id'>,
    deduireCaisse: boolean = true
  ) => {
    const id = `mnt-${Date.now().toString().slice(-4)}`;
    const bonCaisseNumero = data.caisseId ? `BC-MNT-${Date.now().toString().slice(-4)}` : undefined;

    const newMnt: InterventionMaintenance = {
      ...data,
      id,
      bonCaisseNumero: data.bonCaisseNumero || bonCaisseNumero,
    };

    setMaintenancesMateriel((prev) => [newMnt, ...prev]);

    // Update equipment stats
    setMateriels((prev) =>
      prev.map((m) => {
        if (m.id !== data.materielId) return m;
        const updates: Partial<Materiel> = {
          compteurHeuresKm: Math.max(m.compteurHeuresKm, data.heuresCompteur || 0),
        };
        if (data.typeIntervention === 'vidange_filtres') {
          updates.derniereVidangeHeures = data.heuresCompteur;
        }
        if (data.typeIntervention === 'visite_ctc_levage') {
          const nextDate = new Date();
          nextDate.setMonth(nextDate.getMonth() + 6);
          updates.prochaineVisiteCTCDueDate = nextDate.toISOString().split('T')[0];
        }
        if (data.statut === 'termine' && (m.statut === 'en_panne' || m.statut === 'en_maintenance')) {
          updates.statut = m.chantierId ? 'en_service' : 'disponible';
        }
        return { ...m, ...updates };
      })
    );

    // If deduction from caisse requested
    if (deduireCaisse && data.caisseId && data.coutTotalDZD > 0) {
      const mat = materiels.find((m) => m.id === data.materielId);
      addTransaction({
        date: data.date,
        type: 'sortie',
        caisseSourceId: data.caisseId,
        chantierId: mat?.chantierId || undefined,
        beneficiaireNom: `${data.technicienPrestataire} (Maintenance: ${mat?.nom || data.materielNom})`,
        montantDZD: data.coutTotalDZD,
        modePaiement: 'especes',
        categorie: 'engins_carburant',
        statut: 'valide',
        motif: `Maintenance / Entretien ${mat?.code || ''}: ${data.description}`,
        bonCaisseNumero: bonCaisseNumero,
        enregistrePar: currentUser.nom,
        validePar: currentUser.nom,
        dateValidation: data.date,
      });
    }
  };

  const declarerPanne = (materielId: string, motif: string) => {
    setMateriels((prev) =>
      prev.map((m) => {
        if (m.id !== materielId) return m;
        return {
          ...m,
          statut: 'en_panne',
          observations: m.observations ? `${m.observations} | Signalement Panne: ${motif}` : `Signalement Panne: ${motif}`,
        };
      })
    );
  };

  // Journal d'Audit Système
  const logAudit = (item: Omit<JournalAuditItem, 'id' | 'date'>) => {
    const newEntry: JournalAuditItem = {
      ...item,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: new Date().toISOString(),
    };
    setJournalAudit((prev) => [newEntry, ...prev.slice(0, 199)]); // Keep last 200 logs
  };

  // PVs d'Avancement & Contrôle Technique CTC
  const addPVChantier = (pvData: Omit<PVSituationChantier, 'id'>) => {
    const id = `pv-${Date.now().toString().slice(-4)}`;
    const targetChantier = chantiers.find((c) => c.id === pvData.chantierId);
    const newPV: PVSituationChantier = {
      ...pvData,
      id,
      chantierNom: targetChantier?.nom || pvData.chantierNom,
    };

    setPvsChantier((prev) => [newPV, ...prev]);

    // Update Chantier progress if validated or favorable
    if (newPV.statut === 'valide' && targetChantier) {
      if (newPV.pourcentageAvancementConstate > targetChantier.avancementPourcentage) {
        updateChantier(targetChantier.id, {
          avancementPourcentage: newPV.pourcentageAvancementConstate,
        });
      }
    }

    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'creation',
      module: 'pv_avancement',
      entiteReference: newPV.numeroPV,
      details: `Enregistrement du PV de chantier: "${newPV.titre}" (Avancement: ${newPV.pourcentageAvancementConstate}%, Visa CTC: ${newPV.visaCTC.toUpperCase()})`,
    });
  };

  const updatePVChantier = (id: string, updates: Partial<PVSituationChantier>) => {
    setPvsChantier((prev) =>
      prev.map((pv) => {
        if (pv.id !== id) return pv;
        const updated = { ...pv, ...updates };
        if (updated.statut === 'valide') {
          const ch = chantiers.find((c) => c.id === updated.chantierId);
          if (ch && updated.pourcentageAvancementConstate > ch.avancementPourcentage) {
            updateChantier(ch.id, { avancementPourcentage: updated.pourcentageAvancementConstate });
          }
        }
        return updated;
      })
    );
  };

  const deletePVChantier = (id: string) => {
    const pv = pvsChantier.find((p) => p.id === id);
    setPvsChantier((prev) => prev.filter((p) => p.id !== id));
    if (pv) {
      logAudit({
        utilisateurNom: currentUser.nom,
        utilisateurRole: currentUser.role,
        action: 'suppression',
        module: 'pv_avancement',
        entiteReference: pv.numeroPV,
        details: `Suppression du PV de chantier: ${pv.titre}`,
      });
    }
  };

  const validerPVChantier = (id: string) => {
    const pv = pvsChantier.find((p) => p.id === id);
    if (!pv) return;

    setPvsChantier((prev) =>
      prev.map((p) => (p.id === id ? { ...p, statut: 'valide' as const } : p))
    );

    const ch = chantiers.find((c) => c.id === pv.chantierId);
    if (ch && pv.pourcentageAvancementConstate > ch.avancementPourcentage) {
      updateChantier(ch.id, { avancementPourcentage: pv.pourcentageAvancementConstate });
    }

    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'validation',
      module: 'pv_avancement',
      entiteReference: pv.numeroPV,
      details: `Validation officielle du PV de situation technique (Visa CTC: ${pv.visaCTC.toUpperCase()})`,
    });
  };

  const declencherAppelFondsPourChantier = (chantierId: string, trancheNumero: number) => {
    const ch = chantiers.find((c) => c.id === chantierId);
    if (!ch) return;

    let totalTranchesDeclenchees = 0;
    let montantTotalAppelDZD = 0;

    // Update VSP buyers associated with this site
    setTiers((prev) =>
      prev.map((tier) => {
        if (tier.type !== 'client_vsp' || !tier.chantiersAssocies.includes(chantierId)) {
          return tier;
        }

        if (!tier.echeancierVSP) return tier;

        const updatedEcheancier = tier.echeancierVSP.map((tr) => {
          if (tr.numero === trancheNumero && tr.statut === 'a_venir') {
            totalTranchesDeclenchees++;
            montantTotalAppelDZD += tr.montantDZD;
            return {
              ...tr,
              statut: 'en_retard' as const, // Ready for collection
            };
          }
          return tr;
        });

        return {
          ...tier,
          echeancierVSP: updatedEcheancier,
        };
      })
    );

    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'creation',
      module: 'tiers',
      entiteReference: `APPEL-FONDS-TR${trancheNumero}`,
      details: `Lancement officiel de l'Appel de Fonds (Tranche ${trancheNumero}) pour ${totalTranchesDeclenchees} acquéreurs du chantier ${ch.nom}`,
      impactFinancierDZD: montantTotalAppelDZD,
    });
  };

  // Suivi Journalier des Travaux & Pointage agile
  const addJournalChantier = (journalData: Omit<JournalChantierQuotidien, 'id'>) => {
    const id = `jc-${Date.now().toString().slice(-4)}`;
    const newJournal: JournalChantierQuotidien = {
      ...journalData,
      id,
    };
    setJournauxChantier((prev) => [newJournal, ...prev]);
    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'creation',
      module: 'journal_chantier',
      entiteReference: `JRN-${journalData.chantierNom}-${journalData.date}`,
      details: `Création du journal quotidien de chantier pour le ${journalData.date}`,
    });
  };

  const updateJournalChantier = (id: string, updates: Partial<JournalChantierQuotidien>) => {
    setJournauxChantier((prev) =>
      prev.map((j) => (j.id === id ? { ...j, ...updates } : j))
    );
    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'modification',
      module: 'journal_chantier',
      entiteReference: `JRN-${id}`,
      details: `Mise à jour du rapport de chantier journalier`,
    });
  };

  const savePointageJournalier = (
    chantierId: string,
    date: string,
    pointages: PointageOuvrierJournalier[]
  ) => {
    const ch = chantiers.find((c) => c.id === chantierId);
    const presents = pointages.filter((p) => p.statutPresence === 'present' || p.statutPresence === 'demi_journee').length;
    const absents = pointages.filter((p) => p.statutPresence === 'absent_injustifie' || p.statutPresence === 'conge_arret').length;
    const totalHours = pointages.reduce((acc, p) => {
      const normal = p.statutPresence === 'present' ? p.heuresNormales : p.statutPresence === 'demi_journee' ? p.heuresNormales / 2 : 0;
      return acc + normal + (p.heuresSupplementaires || 0);
    }, 0);

    setJournauxChantier((prev) => {
      const existing = prev.find((j) => j.chantierId === chantierId && j.date === date);
      if (existing) {
        return prev.map((j) =>
          j.id === existing.id
            ? {
                ...j,
                pointagesPersonnel: pointages,
                effectifsTotalPresents: presents,
                effectifsTotalAbsents: absents,
                heuresTravaillesTotalChantier: totalHours,
              }
            : j
        );
      } else {
        const newJournal: JournalChantierQuotidien = {
          id: `jc-${Date.now().toString().slice(-4)}`,
          chantierId,
          chantierNom: ch?.nom || 'Chantier',
          date,
          meteo: 'ensoleille',
          temperatureC: 25,
          conditionCoulageBeton: 'optimale',
          effectifsTotalPresents: presents,
          effectifsTotalAbsents: absents,
          heuresTravaillesTotalChantier: totalHours,
          tachesDuJour: [],
          pointagesPersonnel: pointages,
          materielsMobilises: [],
          materiauxRecus: [],
          redigePar: currentUser.nom,
          statutRapport: 'brouillon',
        };
        return [newJournal, ...prev];
      }
    });

    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'modification',
      module: 'journal_chantier',
      entiteReference: `POINTAGE-${ch?.code || chantierId}-${date}`,
      details: `Enregistrement du pointage quotidien : ${presents} présents, ${absents} absents (${totalHours}h)`,
    });
  };

  const addTacheAgileChantier = (
    chantierId: string,
    date: string,
    tacheData: Omit<TacheJournaliereChantier, 'id'>
  ) => {
    const ch = chantiers.find((c) => c.id === chantierId);
    const newTache: TacheJournaliereChantier = {
      ...tacheData,
      id: `t-${Date.now().toString().slice(-4)}`,
    };

    setJournauxChantier((prev) => {
      const existing = prev.find((j) => j.chantierId === chantierId && j.date === date);
      if (existing) {
        return prev.map((j) =>
          j.id === existing.id
            ? { ...j, tachesDuJour: [...j.tachesDuJour, newTache] }
            : j
        );
      } else {
        const newJournal: JournalChantierQuotidien = {
          id: `jc-${Date.now().toString().slice(-4)}`,
          chantierId,
          chantierNom: ch?.nom || 'Chantier',
          date,
          meteo: 'ensoleille',
          temperatureC: 25,
          conditionCoulageBeton: 'optimale',
          effectifsTotalPresents: 0,
          effectifsTotalAbsents: 0,
          heuresTravaillesTotalChantier: 0,
          tachesDuJour: [newTache],
          pointagesPersonnel: [],
          materielsMobilises: [],
          materiauxRecus: [],
          redigePar: currentUser.nom,
          statutRapport: 'brouillon',
        };
        return [newJournal, ...prev];
      }
    });
  };

  const updateTacheAgileChantier = (
    chantierId: string,
    date: string,
    tacheId: string,
    updates: Partial<TacheJournaliereChantier>
  ) => {
    setJournauxChantier((prev) =>
      prev.map((j) => {
        if (j.chantierId === chantierId && j.date === date) {
          return {
            ...j,
            tachesDuJour: j.tachesDuJour.map((t) =>
              t.id === tacheId ? { ...t, ...updates } : t
            ),
          };
        }
        return j;
      })
    );
  };

  const deleteTacheAgileChantier = (
    chantierId: string,
    date: string,
    tacheId: string
  ) => {
    setJournauxChantier((prev) =>
      prev.map((j) => {
        if (j.chantierId === chantierId && j.date === date) {
          return {
            ...j,
            tachesDuJour: j.tachesDuJour.filter((t) => t.id !== tacheId),
          };
        }
        return j;
      })
    );
  };

  // Logements & Bénéficiaires VSP (Loi 11-04) Actions
  const addLogement = (logData: Omit<LogementLot, 'id'>) => {
    const newId = `log-${Date.now().toString().slice(-4)}`;
    const newLog: LogementLot = { ...logData, id: newId };
    setLogements((prev) => [newLog, ...prev]);
    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'creation',
      module: 'logements',
      entiteReference: `LOG-${newLog.numeroLot}`,
      details: `Création du lot immobilier ${newLog.numeroLot} (${newLog.type}) sur ${newLog.chantierNom}`,
    });
  };

  const updateLogement = (id: string, updates: Partial<LogementLot>) => {
    setLogements((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  const deleteLogement = (id: string) => {
    if (!hasPermission('vsp_manage')) {
      logAudit({
        utilisateurNom: currentUser.nom,
        utilisateurRole: currentUser.role,
        action: 'securite_alerte',
        module: 'securite',
        entiteReference: `SEC-DEL-LOT-${id}`,
        details: `Refus d'autorisation : tentative non habilitée de suppression du lot ${id}`,
      });
      return;
    }
    const lot = logements.find((l) => l.id === id);
    setLogements((prev) => prev.filter((l) => l.id !== id));
    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'suppression',
      module: 'logements',
      entiteReference: lot?.numeroLot || id,
      details: `Suppression du lot immobilier ${lot?.numeroLot || id}`,
    });
  };

  const addBeneficiaire = (benData: Omit<BeneficiaireVSP, 'id' | 'code'>) => {
    const newId = `ben-${Date.now().toString().slice(-4)}`;
    const code = `BEN-2026-${Date.now().toString().slice(-3)}`;
    const newBen: BeneficiaireVSP = { ...benData, id: newId, code };
    setBeneficiaires((prev) => [newBen, ...prev]);
    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'creation',
      module: 'beneficiaires',
      entiteReference: `BEN-${newBen.code}`,
      details: `Enregistrement du nouvel acquéreur VSP ${newBen.nom} ${newBen.prenom} pour le lot ${newBen.logementNumero}`,
      impactFinancierDZD: newBen.prixTotalCessionDZD,
    });
  };

  const updateBeneficiaire = (id: string, updates: Partial<BeneficiaireVSP>) => {
    setBeneficiaires((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const deleteBeneficiaire = (id: string) => {
    if (!hasPermission('vsp_manage')) {
      logAudit({
        utilisateurNom: currentUser.nom,
        utilisateurRole: currentUser.role,
        action: 'securite_alerte',
        module: 'securite',
        entiteReference: `SEC-DEL-BEN-${id}`,
        details: `Refus d'autorisation : tentative non habilitée de suppression de l'acquéreur VSP ${id}`,
      });
      return;
    }
    const ben = beneficiaires.find((b) => b.id === id);
    setBeneficiaires((prev) => prev.filter((b) => b.id !== id));
    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'suppression',
      module: 'beneficiaires',
      entiteReference: ben?.code || id,
      details: `Suppression définitive du dossier acquéreur VSP ${ben?.nom || id}`,
    });
  };

  const encaisserTrancheVSP = (
    beneficiaireId: string,
    trancheId: string,
    caisseId?: string,
    modePaiement: any = 'virement_bancaire',
    recuNumero: string = `REC-VSP-${Date.now().toString().slice(-4)}`
  ) => {
    setBeneficiaires((prev) =>
      prev.map((b) => {
        if (b.id !== beneficiaireId) return b;
        let montantEncaisseTranche = 0;
        const updatedEcheancier = b.echeancierVSP.map((tr) => {
          if (tr.id === trancheId) {
            montantEncaisseTranche = tr.montantDZD - tr.montantPayeDZD;
            return {
              ...tr,
              statut: 'regle' as const,
              montantPayeDZD: tr.montantDZD,
              datePaiement: new Date().toISOString().split('T')[0],
              recuNumero,
            };
          }
          return tr;
        });

        const nouveauTotalEncaisse = b.totalEncaisseDZD + montantEncaisseTranche;
        const nouveauSoldeRestant = Math.max(0, b.prixTotalCessionDZD - nouveauTotalEncaisse);

        return {
          ...b,
          echeancierVSP: updatedEcheancier,
          totalEncaisseDZD: nouveauTotalEncaisse,
          soldeRestantDZD: nouveauSoldeRestant,
        };
      })
    );

    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'validation',
      module: 'beneficiaires',
      entiteReference: `VSP-ENCAISSEMENT-${recuNumero}`,
      details: `Encaissement de la tranche VSP pour l'acquéreur ID: ${beneficiaireId} (Quittance: ${recuNumero})`,
    });
  };

  const reserverLogement = (logementId: string, beneficiaireData: Partial<BeneficiaireVSP>) => {
    setLogements((prev) =>
      prev.map((l) => (l.id === logementId ? { ...l, statut: 'reserve', beneficiaireNom: `${beneficiaireData.nom || ''} ${beneficiaireData.prenom || ''}` } : l))
    );
  };

  const livrerLogement = (logementId: string, beneficiaireId: string, dateLivraison: string, reserves: any[] = []) => {
    setLogements((prev) =>
      prev.map((l) => (l.id === logementId ? { ...l, statut: 'livre', reserves } : l))
    );
    setBeneficiaires((prev) =>
      prev.map((b) => (b.id === beneficiaireId ? { ...b, statutDossier: 'livre_cles_remises', dateLivraisonEffective: dateLivraison, pvLivraisonSigne: true } : b))
    );
    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'validation',
      module: 'beneficiaires',
      entiteReference: `REMISE-CLES-${logementId}`,
      details: `Remise officielle des clés et levée des réserves pour le logement lot ${logementId}`,
    });
  };

  const openPrintContratReservation = (beneficiaire: BeneficiaireVSP, logement: LogementLot) => {
    setPrintVoucher({
      isOpen: true,
      type: 'contrat_reservation',
      beneficiaire,
      logement,
    });
  };

  const openPrintPVRemiseCles = (beneficiaire: BeneficiaireVSP, logement: LogementLot) => {
    setPrintVoucher({
      isOpen: true,
      type: 'pv_remise_cles',
      beneficiaire,
      logement,
    });
  };

  // Roles & Utilisateurs Helper & Actions
  const getRoleByCode = (code: string): RoleDefinition | undefined => {
    return roles.find((r) => r.code === code);
  };

  const getRoleLabel = (code: string): string => {
    const found = roles.find((r) => r.code === code);
    if (found) return found.label;
    return code;
  };

  const hasPermission = (permissionKey: string): boolean => {
    if (!currentUser) return false;
    // Le Directeur Général dispose de toutes les prérogatives administratives et opérationnelles
    if (currentUser.role === 'directeur_promoteur') return true;
    
    // L'Intégrateur (superadmin) n'a AUCUNE prérogative métier/opérationnelle : uniquement le paramétrage technique système
    if (currentUser.role === 'superadmin') {
      const allowedSuperadminPermissions = ['users_manage', 'roles_manage', 'settings_manage', 'audit_export'];
      return allowedSuperadminPermissions.includes(permissionKey);
    }

    // Règle d'or de gouvernance financière : seuls les Trésoriers et Directeurs sont habilités à enregistrer des dépenses/sorties
    if (permissionKey === 'transactions_create') {
      const isDirecteurOuTresorier = effectiveRole === 'directeur_promoteur' || effectiveRole === 'tresorier_caissier';
      if (!isDirecteurOuTresorier) return false;
    }
    
    const roleDef = roles.find((r) => r.code === effectiveRole);
    if (!roleDef) return false;
    return roleDef.permissions.includes(permissionKey);
  };

  const addUtilisateur = (userData: Omit<Utilisateur, 'id' | 'statut' | 'dateCreation'> & { statut?: 'actif' | 'inactif' }) => {
    const newId = `user-${Date.now().toString().slice(-4)}`;
    const today = new Date().toISOString().split('T')[0];
    const newUser: Utilisateur = {
      id: newId,
      nom: userData.nom,
      email: userData.email,
      telephone: userData.telephone,
      role: userData.role,
      avatar: userData.avatar || '',
      chantiersAssignes: userData.chantiersAssignes,
      statut: userData.statut || 'actif',
      dateCreation: today,
      dernierAcces: 'Jamais connecté',
    };
    setUtilisateurs((prev) => [newUser, ...prev]);
    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'creation',
      module: 'utilisateurs',
      entiteReference: `USR-${newUser.nom}`,
      details: `Création du collaborateur ${newUser.nom} avec le rôle "${getRoleLabel(newUser.role)}"`,
    });
  };

  const updateUtilisateur = (id: string, updates: Partial<Utilisateur>) => {
    setUtilisateurs((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...updates };
          if (currentUser.id === id) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'modification',
      module: 'utilisateurs',
      entiteReference: `USR-${id}`,
      details: `Mise à jour des informations du profil utilisateur ID: ${id}`,
    });
  };

  const reinitialiserMotDePasse = (userId: string): { success: boolean; message: string; nouveauMotDePasse: string } => {
    // Only Directeur / Admin can reset passwords for other users
    if (currentUser.role !== 'directeur_promoteur' && currentUser.role !== 'superadmin') {
      logAudit({
        utilisateurNom: currentUser.nom,
        utilisateurRole: currentUser.role,
        action: 'securite_alerte',
        module: 'securite',
        entiteReference: `SEC-PWD-RESET-${userId}`,
        details: `Refus d'autorisation : tentative non habilitée de réinitialisation de mot de passe pour l'utilisateur ${userId}`,
      });
      return { success: false, message: 'Action non autorisée : seuls les administrateurs peuvent réinitialiser les mots de passe.', nouveauMotDePasse: '' };
    }

    const targetUser = utilisateurs.find((u) => u.id === userId);
    if (!targetUser) {
      return { success: false, message: 'Utilisateur introuvable.', nouveauMotDePasse: '' };
    }

    const motDePasseBanale = 'bati2026';
    setUserCustomPassword(userId, motDePasseBanale);
    const today = new Date().toISOString().split('T')[0];

    updateUtilisateur(userId, {
      motDePasse: motDePasseBanale,
      motDePasseModifieLe: today,
    });

    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'modification',
      module: 'securite',
      entiteReference: `USR-${userId}`,
      details: `Réinitialisation du mot de passe par l'administrateur ${currentUser.nom} pour l'utilisateur ${targetUser.nom} (${targetUser.email}) au mot de passe par défaut ("bati2026").`,
    });

    return {
      success: true,
      message: `Le mot de passe de ${targetUser.nom} a été réinitialisé avec succès au mot de passe par défaut : "bati2026".`,
      nouveauMotDePasse: motDePasseBanale,
    };
  };

  const toggleUtilisateurStatut = (id: string) => {
    setUtilisateurs((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const newStatut = u.statut === 'actif' ? 'inactif' : 'actif';
          const updated = { ...u, statut: newStatut as 'actif' | 'inactif' };
          if (currentUser.id === id) {
            setCurrentUser(updated);
          }
          logAudit({
            utilisateurNom: currentUser.nom,
            utilisateurRole: currentUser.role,
            action: 'modification',
            module: 'utilisateurs',
            entiteReference: `USR-${id}`,
            details: `Changement de statut pour ${u.nom} : ${newStatut.toUpperCase()}`,
          });
          return updated;
        }
        return u;
      })
    );
  };

  const deleteUtilisateur = (id: string): boolean => {
    if (currentUser.id === id) {
      return false;
    }
    const target = utilisateurs.find((u) => u.id === id);
    setUtilisateurs((prev) => prev.filter((u) => u.id !== id));
    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'suppression',
      module: 'utilisateurs',
      entiteReference: `USR-${id}`,
      details: `Suppression définitive du compte utilisateur ${target?.nom || id}`,
    });
    return true;
  };

  const changerMotDePasse = (ancienMdp: string, nouveauMdp: string): { success: boolean; message: string } => {
    if (!currentUser) {
      return { success: false, message: 'Aucun utilisateur connecté' };
    }

    if (!verifyUserCredentials(currentUser, ancienMdp)) {
      logAudit({
        utilisateurNom: currentUser.nom,
        utilisateurRole: currentUser.role,
        action: 'securite_alerte',
        module: 'securite',
        entiteReference: `SEC-PWD-${currentUser.id}`,
        details: `Échec de modification du mot de passe : mot de passe actuel erroné pour ${currentUser.email}`,
      });
      return { success: false, message: 'Le mot de passe actuel saisi est incorrect.' };
    }

    if (!nouveauMdp || nouveauMdp.trim().length < 4) {
      return { success: false, message: 'Le nouveau mot de passe doit comporter au moins 4 caractères.' };
    }

    const trimmedNew = nouveauMdp.trim();
    setUserCustomPassword(currentUser.id, trimmedNew);
    const today = new Date().toISOString().split('T')[0];

    updateUtilisateur(currentUser.id, {
      motDePasse: trimmedNew,
      motDePasseModifieLe: today,
    });

    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'modification',
      module: 'securite',
      entiteReference: `SEC-PWD-${currentUser.id}`,
      details: `Mot de passe modifié avec succès par l'utilisateur ${currentUser.nom} (${currentUser.email})`,
    });

    return { success: true, message: 'Votre mot de passe a été modifié avec succès.' };
  };

  const addRole = (roleData: Omit<RoleDefinition, 'id'>) => {
    const newId = `role-${Date.now().toString().slice(-4)}`;
    const newRole: RoleDefinition = {
      ...roleData,
      id: newId,
      isSystem: false,
    };
    setRoles((prev) => [...prev, newRole]);
    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'creation',
      module: 'roles',
      entiteReference: `ROLE-${newRole.code}`,
      details: `Création du rôle personnalisé "${newRole.label}" (${newRole.permissions.length} prérogatives RBAC)`,
    });
  };

  const updateRole = (id: string, updates: Partial<RoleDefinition>) => {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return { ...r, ...updates };
        }
        return r;
      })
    );
    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'modification',
      module: 'roles',
      entiteReference: `ROLE-${id}`,
      details: `Modification des habilitations et paramètres du rôle ID: ${id}`,
    });
  };

  const deleteRole = (id: string): boolean => {
    const target = roles.find((r) => r.id === id);
    if (!target || target.isSystem) {
      return false;
    }
    const isAssigned = utilisateurs.some((u) => u.role === target.code);
    if (isAssigned) {
      return false;
    }
    setRoles((prev) => prev.filter((r) => r.id !== id));
    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'suppression',
      module: 'roles',
      entiteReference: `ROLE-${target.code}`,
      details: `Suppression du rôle personnalisé "${target.label}"`,
    });
    return true;
  };

  const updateAppSettings = (updates: Partial<AppSettings>) => {
    setAppSettings((prev) => ({ ...prev, ...updates }));
    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'modification',
      module: 'settings',
      entiteReference: 'CONFIG-ENTREPRISE',
      details: 'Mise à jour des paramètres légaux, financiers ou barèmes VSP',
    });
  };

  const resetToInitialData = () => {
    if (currentUser.role !== 'superadmin' && currentUser.role !== 'directeur_promoteur') {
      logAudit({
        utilisateurNom: currentUser.nom,
        utilisateurRole: currentUser.role,
        action: 'securite_alerte',
        module: 'securite',
        entiteReference: 'RESET-BLOCKED',
        details: 'Tentative non autorisée de remise à zéro des données.',
      });
      return;
    }

    setChantiers(INITIAL_CHANTIERS);
    setCaisses(INITIAL_CAISSES);
    setDemandesAlimentation(INITIAL_DEMANDES_ALIMENTATION);
    setTransactions(INITIAL_TRANSACTIONS);
    setTiers(INITIAL_TIERS);
    setStocks(INITIAL_STOCKS);
    setMouvementsStock(INITIAL_MOUVEMENTS_STOCK);
    setDocuments(INITIAL_DOCUMENTS);
    setEmployes(INITIAL_EMPLOYES);
    setBulletinsPaie(INITIAL_BULLETINS_PAIE);
    setMateriels(INITIAL_MATERIELS);
    setTransfertsMateriel(INITIAL_TRANSFERTS_MATERIEL);
    setMaintenancesMateriel(INITIAL_MAINTENANCES_MATERIEL);
    setPvsChantier(INITIAL_PVS_CHANTIER);
    setJournauxChantier(INITIAL_JOURNAUX_CHANTIER);
    setLogements(INITIAL_LOGEMENTS);
    setBeneficiaires(INITIAL_BENEFICIAIRES);
    setJournalAudit(INITIAL_JOURNAL_AUDIT);
    setTicketsDiscussion(INITIAL_TICKETS_DISCUSSION);
    setAppSettings(INITIAL_SETTINGS);
    setRoles(INITIAL_ROLES);
    setUtilisateurs(INITIAL_UTILISATEURS);
    setCurrentUser(INITIAL_UTILISATEURS[0]);
    localStorage.clear();

    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'restauration',
      module: 'backup',
      entiteReference: 'DATA-RESET',
      details: 'Réinitialisation complète des bases aux valeurs de configuration usine.',
    });
  };

  const exportDataJSON = () => {
    // Si l'utilisateur est l'Intégrateur, il n'a aucune relation métier : exporter uniquement la configuration technique et les habilitations
    if (currentUser.role === 'superadmin') {
      const techExport = {
        exportDate: new Date().toISOString(),
        appName: 'BatiPromote DZ',
        typeExport: 'CONFIGURATION_TECHNIQUE_SYSTEME',
        appSettings,
        roles,
        utilisateurs: utilisateurs.map((u) => ({
          id: u.id,
          nom: u.nom,
          email: u.email,
          role: u.role,
          statut: u.statut,
          chantiersAssignes: u.chantiersAssignes,
        })),
      };
      logAudit({
        utilisateurNom: currentUser.nom,
        utilisateurRole: currentUser.role,
        action: 'backup',
        module: 'backup',
        entiteReference: 'EXPORT-TECH-CONFIG',
        details: 'Export de la configuration technique et de la matrice des rôles (sans données confidentielles).',
      });
      return JSON.stringify(techExport, null, 2);
    }

    const fullBackup = {
      exportDate: new Date().toISOString(),
      appName: 'BatiPromote DZ',
      appSettings,
      roles,
      utilisateurs,
      chantiers,
      caisses,
      demandesAlimentation,
      transactions,
      tiers,
      stocks,
      mouvementsStock,
      documents,
      employes,
      bulletinsPaie,
      materiels,
      transfertsMateriel,
      maintenancesMateriel,
      pvsChantier,
      journauxChantier,
      logements,
      beneficiaires,
      journalAudit,
      ticketsDiscussion,
    };

    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'backup',
      module: 'backup',
      entiteReference: 'EXPORT-GLOBAL-JSON',
      details: 'Export global complet de la base de données ERP pour archivage ou audit.',
    });

    return JSON.stringify(fullBackup, null, 2);
  };

  const importDataJSON = (jsonStr: string): boolean => {
    if (currentUser.role !== 'superadmin' && currentUser.role !== 'directeur_promoteur') {
      logAudit({
        utilisateurNom: currentUser.nom,
        utilisateurRole: currentUser.role,
        action: 'securite_alerte',
        module: 'securite',
        entiteReference: 'IMPORT-UNAUTHORIZED',
        details: 'Tentative non autorisée de restauration ou injection JSON.',
      });
      return false;
    }

    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.chantiers && parsed.caisses && parsed.transactions) {
        setChantiers(parsed.chantiers);
        setCaisses(parsed.caisses);
        if (parsed.demandesAlimentation) setDemandesAlimentation(parsed.demandesAlimentation);
        setTransactions(parsed.transactions);
        if (parsed.roles) setRoles(parsed.roles);
        if (parsed.utilisateurs) setUtilisateurs(parsed.utilisateurs);
        if (parsed.tiers) setTiers(parsed.tiers);
        if (parsed.stocks) setStocks(parsed.stocks);
        if (parsed.mouvementsStock) setMouvementsStock(parsed.mouvementsStock);
        if (parsed.documents) setDocuments(parsed.documents);
        if (parsed.employes) setEmployes(parsed.employes);
        if (parsed.bulletinsPaie) setBulletinsPaie(parsed.bulletinsPaie);
        if (parsed.materiels) setMateriels(parsed.materiels);
        if (parsed.transfertsMateriel) setTransfertsMateriel(parsed.transfertsMateriel);
        if (parsed.maintenancesMateriel) setMaintenancesMateriel(parsed.maintenancesMateriel);
        if (parsed.pvsChantier) setPvsChantier(parsed.pvsChantier);
        if (parsed.journauxChantier) setJournauxChantier(parsed.journauxChantier);
        if (parsed.logements) setLogements(parsed.logements);
        if (parsed.beneficiaires) setBeneficiaires(parsed.beneficiaires);
        if (parsed.journalAudit) setJournalAudit(parsed.journalAudit);
        if (parsed.ticketsDiscussion) setTicketsDiscussion(parsed.ticketsDiscussion);
        if (parsed.appSettings) setAppSettings(parsed.appSettings);

        logAudit({
          utilisateurNom: currentUser.nom,
          utilisateurRole: currentUser.role,
          action: 'restauration',
          module: 'backup',
          entiteReference: 'IMPORT-JSON-SUCCESS',
          details: 'Restauration réussie des données depuis une archive JSON certifiée.',
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const addContratSousTraitance = (data: Omit<ContratSousTraitance, 'id'>) => {
    const newContrat: ContratSousTraitance = {
      ...data,
      id: `st-${Date.now().toString().slice(-4)}`,
    };
    setContratsSousTraitance((prev) => [newContrat, ...prev]);
  };

  const addSituationAttachement = (data: Omit<SituationAttachement, 'id'>) => {
    const newSit: SituationAttachement = {
      ...data,
      id: `att-${Date.now().toString().slice(-4)}`,
    };
    setSituationsAttachements((prev) => [newSit, ...prev]);

    setContratsSousTraitance((prev) =>
      prev.map((c) => {
        if (c.id === data.contratId) {
          const newCumulRetention = c.retenueGarantieCumuleeDZD + data.retenueGarantieMoisDZD;
          return { ...c, retenueGarantieCumuleeDZD: newCumulRetention };
        }
        return c;
      })
    );
  };

  const validerSituationAttachement = (id: string) => {
    setSituationsAttachements((prev) =>
      prev.map((s) => (s.id === id ? { ...s, statut: 'valide_direction', dateValidation: new Date().toISOString().split('T')[0] } : s))
    );
  };

  // Audio Chime notification using Web Audio API (gentle high-frequency two-tone chime)
  const playChimeNotification = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(440, now); // A4
      osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.2); // E5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    } catch {
      // Audio playback might be silenced by browser policy until user gesture
    }
  };

  // Cross-tab real-time sync with Web BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const channel = new BroadcastChannel('batipromote_chat_sync');

    channel.onmessage = (event) => {
      if (currentUser.role === 'superadmin') return;
      const data = event.data;
      if (data?.type === 'NEW_MESSAGE') {
        const { ticketId, message, ticketTitre, chantierNom } = data.payload;
        setTicketsDiscussion((prev) =>
          prev.map((t) => {
            if (t.id === ticketId) {
              const alreadyHas = t.messages.some((m) => m.id === message.id);
              if (alreadyHas) return t;
              return {
                ...t,
                statut: t.statut === 'resolu' || t.statut === 'ferme' ? 'en_cours' : t.statut,
                dateDernierMessage: message.dateEnvoi,
                dernierMessageApercu: (message.contenu || `[Fichier: ${message.pieceJointe?.nom}]`).slice(0, 100),
                nbMessages: (t.nbMessages ?? t.messages.length) + 1,
                messages: [...t.messages, message],
                nonLuParSiege: message.auteurType === 'chantier',
                nonLuParChantier: message.auteurType === 'siege',
              };
            }
            return t;
          })
        );

        setToastNotification({
          id: `toast-${Date.now()}`,
          ticketId,
          ticketTitre,
          chantierNom,
          auteurNom: message.auteurNom,
          auteurRole: message.auteurRole,
          contenuApercu: (message.contenu || `[Pièce jointe: ${message.pieceJointe?.nom}]`).slice(0, 85),
          dateEnvoi: message.dateEnvoi,
        });
        playChimeNotification();
      } else if (data?.type === 'NEW_TICKET') {
        const { ticket } = data.payload;
        setTicketsDiscussion((prev) => {
          if (prev.some((t) => t.id === ticket.id)) return prev;
          return [ticket, ...prev];
        });
        const ch = chantiers.find((c) => c.id === ticket.chantierId);
        setToastNotification({
          id: `toast-${Date.now()}`,
          ticketId: ticket.id,
          ticketTitre: ticket.titre,
          chantierNom: ch?.nom || 'Chantier',
          auteurNom: ticket.creeParNom,
          auteurRole: ticket.creeParRole,
          contenuApercu: `Nouveau ticket: ${ticket.titre}`,
          dateEnvoi: ticket.dateCreation,
        });
        playChimeNotification();
      } else if (data?.type === 'STATUS_CHANGE') {
        const { ticketId, statut } = data.payload;
        setTicketsDiscussion((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, statut } : t))
        );
      }
    };

    return () => {
      channel.close();
    };
  }, [chantiers]);

  const dismissToastNotification = () => {
    setToastNotification(null);
  };

  useEffect(() => {
    if (!toastNotification) return;
    const timer = setTimeout(() => {
      setToastNotification(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [toastNotification]);

  // Messagerie Actions
  const creerTicketDiscussion = (
    ticketData: {
      titre: string;
      chantierId: string;
      categorie: any;
      priorite: any;
      creeParType?: 'siege' | 'chantier';
    },
    premierMessage: string,
    pieceJointe?: { nom: string; url?: string; type?: 'image' | 'pdf' | 'doc' }
  ) => {
    const codeChantier = chantiers.find((c) => c.id === ticketData.chantierId)?.code || 'CH';
    const randCode = Math.floor(100 + Math.random() * 900);
    const newId = `TCK-${codeChantier}-${randCode}`;
    const nowIso = new Date().toISOString();

    const isChantierRole = ['chef_chantier', 'ingenieur_suivi', 'conducteur_travaux'].includes(currentUser.role);
    const authorType: 'siege' | 'chantier' = ticketData.creeParType || (isChantierRole ? 'chantier' : 'siege');

    const firstMsg: MessageDiscussion = {
      id: `msg-${Date.now()}`,
      auteurId: currentUser.id,
      auteurNom: currentUser.nom,
      auteurRole: currentUser.role,
      auteurType: authorType,
      contenu: premierMessage,
      dateEnvoi: nowIso,
      lu: true,
      pieceJointe: pieceJointe?.nom ? pieceJointe : undefined,
    };

    const newTicket: TicketDiscussion = {
      id: newId,
      titre: ticketData.titre,
      chantierId: ticketData.chantierId,
      categorie: ticketData.categorie,
      priorite: ticketData.priorite,
      statut: 'ouvert',
      dateCreation: nowIso,
      dateDernierMessage: nowIso,
      creeParId: currentUser.id,
      creeParNom: currentUser.nom,
      creeParRole: currentUser.role,
      creeParType: authorType,
      dernierMessageApercu: premierMessage.slice(0, 90),
      nbMessages: 1,
      messages: [firstMsg],
      nonLuParSiege: authorType === 'chantier',
      nonLuParChantier: authorType === 'siege',
    };

    setTicketsDiscussion((prev) => [newTicket, ...prev]);
    setActiveTicketId(newId);

    // Broadcast across tabs
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('batipromote_chat_sync');
        channel.postMessage({
          type: 'NEW_TICKET',
          payload: { ticket: newTicket },
        });
        channel.close();
      } catch {
        // ignore
      }
    }

    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'creation',
      module: 'messagerie',
      entiteReference: newId,
      details: `Ouverture ticket discussion: "${ticketData.titre}" (${ticketData.categorie})`,
    });
  };

  const envoyerMessageTicket = (
    ticketId: string,
    contenu: string,
    pieceJointe?: { nom: string; url?: string; type?: 'image' | 'pdf' | 'doc' },
    overrideAuteur?: { id: string; nom: string; role: string; type: 'siege' | 'chantier' }
  ) => {
    if (!contenu.trim() && !pieceJointe) return;

    const isChantierRole = ['chef_chantier', 'ingenieur_suivi', 'conducteur_travaux'].includes(currentUser.role);
    const authorType: 'siege' | 'chantier' = overrideAuteur?.type || (isChantierRole ? 'chantier' : 'siege');
    const authorId = overrideAuteur?.id || currentUser.id;
    const authorNom = overrideAuteur?.nom || currentUser.nom;
    const authorRole = overrideAuteur?.role || currentUser.role;

    const nowIso = new Date().toISOString();
    const newMsg: MessageDiscussion = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      auteurId: authorId,
      auteurNom: authorNom,
      auteurRole: authorRole,
      auteurType: authorType,
      contenu: contenu.trim(),
      dateEnvoi: nowIso,
      lu: true,
      pieceJointe: pieceJointe?.nom ? pieceJointe : undefined,
    };

    let targetTicketTitre = '';
    let targetChantierId = '';

    setTicketsDiscussion((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          targetTicketTitre = t.titre;
          targetChantierId = t.chantierId;
          const newStatus = t.statut === 'resolu' || t.statut === 'ferme' ? 'en_cours' : t.statut;
          return {
            ...t,
            statut: newStatus,
            dateDernierMessage: nowIso,
            dernierMessageApercu: (contenu.trim() || `[Fichier: ${pieceJointe?.nom}]`).slice(0, 100),
            nbMessages: (t.nbMessages ?? t.messages.length) + 1,
            messages: [...t.messages, newMsg],
            nonLuParSiege: authorType === 'chantier',
            nonLuParChantier: authorType === 'siege',
          };
        }
        return t;
      })
    );

    // Broadcast
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('batipromote_chat_sync');
        const ch = chantiers.find((c) => c.id === targetChantierId);
        channel.postMessage({
          type: 'NEW_MESSAGE',
          payload: {
            ticketId,
            ticketTitre: targetTicketTitre,
            chantierNom: ch?.nom || 'Chantier',
            message: newMsg,
          },
        });
        channel.close();
      } catch {
        // ignore
      }
    }
  };

  const changerStatutTicket = (ticketId: string, statut: StatutTicket) => {
    setTicketsDiscussion((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, statut } : t))
    );

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('batipromote_chat_sync');
        channel.postMessage({
          type: 'STATUS_CHANGE',
          payload: { ticketId, statut },
        });
        channel.close();
      } catch {
        // ignore
      }
    }

    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'modification',
      module: 'messagerie',
      entiteReference: ticketId,
      details: `Changement de statut du ticket: ${statut}`,
    });
  };

  const marquerTicketLu = (ticketId: string) => {
    const isChantierRole = ['chef_chantier', 'ingenieur_suivi', 'conducteur_travaux'].includes(currentUser.role);
    setTicketsDiscussion((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            nonLuParSiege: isChantierRole ? t.nonLuParSiege : false,
            nonLuParChantier: isChantierRole ? false : t.nonLuParChantier,
            messages: t.messages.map((m) => ({ ...m, lu: true })),
          };
        }
        return t;
      })
    );
  };

  // Unread tickets count for current role perspective
  const isChantierUser = ['chef_chantier', 'ingenieur_suivi', 'conducteur_travaux'].includes(currentUser.role);
  const unreadTicketsCount = ticketsDiscussion.filter((t) => {
    if (t.statut === 'ferme') return false;
    if (activeChantierId && t.chantierId !== activeChantierId) return false;
    if (!isChantierAllowed(t.chantierId)) return false;
    return isChantierUser ? t.nonLuParChantier : t.nonLuParSiege;
  }).length;

  return (
    <AppContext.Provider
      value={{
        langue,
        setLangue,
        theme,
        setTheme,
        toggleTheme,
        textDirection,
        setTextDirection,
        toggleTextDirection,
        t,
        currentUser,
        setCurrentUser,
        effectiveRole,
        utilisateurs,
        roles,
        allPermissions: ALL_PERMISSIONS,
        activeChantierId,
        setActiveChantierId,
        isGlobalUser,
        userAllowedChantiers,
        isChantierAllowed,
        addUtilisateur,
        updateUtilisateur,
        deleteUtilisateur,
        toggleUtilisateurStatut,
        addRole,
        updateRole,
        deleteRole,
        getRoleByCode,
        getRoleLabel,
        hasPermission,
        changerMotDePasse,
        reinitialiserMotDePasse,
        appSettings,
        updateAppSettings,
        chantiers,
        caisses,
        demandesAlimentation,
        transactions,
        tiers,
        stocks,
        mouvementsStock,
        documents,
        employes,
        bulletinsPaie,
        materiels,
        transfertsMateriel,
        maintenancesMateriel,
        pvsChantier,
        journauxChantier,
        logements,
        beneficiaires,
        journalAudit,
        addChantier,
        updateChantier,
        deleteChantier,
        alimenterCaisse,
        demanderAlimentationCaisse,
        validerDemandeAlimentation,
        refuserDemandeAlimentation,
        updateCaisse,
        addTransaction,
        validerTransaction,
        rejeterTransaction,
        addTier,
        updateTier,
        validerTrancheVSP,
        addStockItem,
        updateStockItem,
        updateStockItemThreshold,
        addMouvementStock,
        addEmploye,
        updateEmploye,
        deleteEmploye,
        affecterEmployeChantier,
        creerBulletinPaie,
        reglerBulletinPaie,
        addMateriel,
        updateMateriel,
        deleteMateriel,
        transfererMateriel,
        enregistrerMaintenance,
        declarerPanne,
        addDocument,
        deleteDocument,
        addPVChantier,
        updatePVChantier,
        deletePVChantier,
        validerPVChantier,
        declencherAppelFondsPourChantier,
        addJournalChantier,
        updateJournalChantier,
        savePointageJournalier,
        addTacheAgileChantier,
        updateTacheAgileChantier,
        deleteTacheAgileChantier,
        openPrintRapportJournalier,
        addLogement,
        updateLogement,
        deleteLogement,
        addBeneficiaire,
        updateBeneficiaire,
        deleteBeneficiaire,
        encaisserTrancheVSP,
        reserverLogement,
        livrerLogement,
        openPrintContratReservation,
        openPrintPVRemiseCles,
        contratsSousTraitance,
        situationsAttachements,
        addContratSousTraitance,
        addSituationAttachement,
        validerSituationAttachement,
        logAudit,
        printVoucher,
        setPrintVoucher,
        openPrintBonCaisse,
        openPrintRecuVSP,
        openPrintBulletinPaie,
        openPrintAppelFonds,
        openPrintPVAvancement,
        resetToInitialData,
        exportDataJSON,
        importDataJSON,
        // Messagerie Interne
        ticketsDiscussion,
        activeTicketId,
        setActiveTicketId,
        creerTicketDiscussion,
        envoyerMessageTicket,
        changerStatutTicket,
        marquerTicketLu,
        unreadTicketsCount,
        toastNotification,
        dismissToastNotification,
        playChimeNotification,
        computeNotifications,
        // Clôture Mensuelle & Verrouillage Comptable
        cloturesMensuelles,
        estDateVerrouillee,
        effectuerClotureMensuelle,
        deverrouillerClotureMensuelle,
        reverrouillerClotureMensuelle,
        isLoggedIn,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
