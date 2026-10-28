import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ChantiersView } from './components/ChantiersView';
import { CaissesView } from './components/CaissesView';
import { TransactionsView } from './components/TransactionsView';
import { TiersView } from './components/TiersView';
import { StocksView } from './components/StocksView';
import { MaterielView } from './components/MaterielView';
import { PersonnelView } from './components/PersonnelView';
import { DocumentsView } from './components/DocumentsView';
import { BeneficiairesView } from './components/BeneficiairesView';
import { UtilisateursView } from './components/UtilisateursView';
import { ProfileView } from './components/ProfileView';
import { BackupView } from './components/BackupView';
import { SuperAdminView } from './components/SuperAdminView';
import { TransactionModal } from './components/TransactionModal';
import { AlimenterCaisseModal } from './components/AlimenterCaisseModal';
import { ChantierModal } from './components/ChantierModal';
import { StockMovementModal } from './components/StockMovementModal';
import { EmployeModal } from './components/EmployeModal';
import { AffectationModal } from './components/AffectationModal';
import { BulletinPaieModal } from './components/BulletinPaieModal';
import { ExportPdfModal } from './components/ExportPdfModal';
import { PrintVoucherModal } from './components/PrintVoucherModal';
import { MaterielModal } from './components/MaterielModal';
import { TransfertMaterielModal } from './components/TransfertMaterielModal';
import { MaintenanceMaterielModal } from './components/MaintenanceMaterielModal';
import { AvancementView } from './components/AvancementView';
import { RentabiliteView } from './components/RentabiliteView';
import { ComptabiliteView } from './components/ComptabiliteView';
import { SousTraitanceView } from './components/SousTraitanceView';
import { MessagerieView } from './components/MessagerieView';
import { CommandPalette } from './components/CommandPalette';
import { MaintenanceLockScreen } from './components/MaintenanceLockScreen';
import { ComplianceAuditView } from './components/ComplianceAuditView';
import { LoginView } from './components/LoginView';
import { WelcomeTour } from './components/WelcomeTour';
import { Chantier, TypeTransaction, Employe, Materiel } from './types';
import { MessageSquareText, X, AlertTriangle, Wrench, ShieldAlert } from 'lucide-react';

const TAB_ROLES: Record<NavTab, string[]> = {
  dashboard: ['directeur_promoteur', 'tresorier_caissier', 'comptable', 'responsable_chantier', 'conducteur_travaux', 'chef_projet', 'responsable_achats', 'metreur_estimateur', 'visiteur'],
  chantiers: ['directeur_promoteur', 'conducteur_travaux', 'chef_projet', 'responsable_chantier'],
  messagerie: ['directeur_promoteur', 'tresorier_caissier', 'comptable', 'responsable_chantier', 'conducteur_travaux', 'chef_projet', 'responsable_achats', 'metreur_estimateur', 'visiteur'],
  avancement: ['directeur_promoteur', 'conducteur_travaux', 'chef_projet', 'responsable_chantier', 'metreur_estimateur'],
  rentabilite: ['directeur_promoteur', 'comptable'],
  comptabilite: ['directeur_promoteur', 'comptable'],
  soustraitance: ['directeur_promoteur', 'conducteur_travaux', 'chef_projet', 'responsable_achats', 'comptable'],
  caisses: ['directeur_promoteur', 'tresorier_caissier', 'comptable', 'responsable_chantier'],
  transactions: ['directeur_promoteur', 'tresorier_caissier', 'comptable', 'responsable_chantier'],
  tiers: ['directeur_promoteur', 'tresorier_caissier', 'comptable', 'responsable_achats'],
  stocks: ['directeur_promoteur', 'conducteur_travaux', 'chef_projet', 'responsable_chantier', 'responsable_achats'],
  materiel: ['directeur_promoteur', 'conducteur_travaux', 'chef_projet', 'responsable_chantier', 'responsable_achats'],
  personnel: ['directeur_promoteur', 'comptable', 'responsable_chantier'],
  beneficiaires: ['directeur_promoteur', 'tresorier_caissier'],
  documents: ['directeur_promoteur', 'conducteur_travaux', 'chef_projet', 'responsable_chantier', 'metreur_estimateur', 'comptable'],
  utilisateurs: ['directeur_promoteur'],
  profile: ['directeur_promoteur', 'tresorier_caissier', 'comptable', 'responsable_chantier', 'conducteur_travaux', 'chef_projet', 'responsable_achats', 'metreur_estimateur', 'superadmin'],
  backup: ['directeur_promoteur'],
  audit: ['directeur_promoteur'],
  superadmin_config: ['superadmin'],
};

const MainLayout: React.FC = () => {
  const { t, toastNotification, dismissToastNotification, setActiveTicketId, appSettings, currentUser, effectiveRole, isLoggedIn } = useApp();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const allowedRoles = TAB_ROLES[activeTab] || ['superadmin'];
  const hasAccess = allowedRoles.includes(effectiveRole);

  // Always reset to Dashboard whenever user changes, on login/logout, or if current tab is restricted
  React.useEffect(() => {
    setActiveTab(currentUser.role === 'superadmin' ? 'superadmin_config' : 'dashboard');
  }, [currentUser?.id, isLoggedIn]);

  React.useEffect(() => {
    if (!hasAccess) {
      setActiveTab(effectiveRole === 'superadmin' ? 'superadmin_config' : 'dashboard');
    }
  }, [hasAccess, effectiveRole]);

  // Modals state
  const [employeModalState, setEmployeModalState] = useState<{
    isOpen: boolean;
    employeToEdit?: Employe | null;
    defaultChantierId?: string;
  }>({ isOpen: false });

  const [affectationModalState, setAffectationModalState] = useState<{
    isOpen: boolean;
    employe?: Employe | null;
  }>({ isOpen: false });

  const [bulletinPaieModalState, setBulletinPaieModalState] = useState<{
    isOpen: boolean;
    defaultEmployeId?: string;
  }>({ isOpen: false });

  const [exportPdfModalState, setExportPdfModalState] = useState<{
    isOpen: boolean;
    defaultType?: 'financier' | 'paie' | 'materiel';
    defaultChantierId?: string | null;
  }>({ isOpen: false });

  // Materiel modals state
  const [materielModalState, setMaterielModalState] = useState<{
    isOpen: boolean;
    materielToEdit?: Materiel | null;
    defaultChantierId?: string | null;
  }>({ isOpen: false });

  const [transfertModalState, setTransfertModalState] = useState<{
    isOpen: boolean;
    defaultMaterielId?: string;
  }>({ isOpen: false });

  const [maintenanceModalState, setMaintenanceModalState] = useState<{
    isOpen: boolean;
    defaultMaterielId?: string;
    defaultType?: any;
  }>({ isOpen: false });

  // Modals state
  const [transactionModalState, setTransactionModalState] = useState<{
    isOpen: boolean;
    defaultType?: TypeTransaction;
    defaultCaisseId?: string;
    defaultChantierId?: string;
  }>({ isOpen: false });

  const [alimenterModalState, setAlimenterModalState] = useState<{
    isOpen: boolean;
    targetCaisseId?: string;
  }>({ isOpen: false });

  const [chantierModalState, setChantierModalState] = useState<{
    isOpen: boolean;
    chantierToEdit?: Chantier | null;
  }>({ isOpen: false });

  const [stockMovementModalState, setStockMovementModalState] = useState<{
    isOpen: boolean;
    defaultStockItemId?: string;
  }>({ isOpen: false });

  // Global shortcut Ctrl+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        if (currentUser.role === 'superadmin') return; // Disable for superadmin
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUser.role]);

  // -- CONDITIONAL RETURNS MUST BE AFTER ALL HOOKS --

  // 1. If NOT Logged In -> Show Login Screen
  if (!isLoggedIn) {
    return <LoginView />;
  }

  // 2. Check Maintenance Mode
  const isMaintenanceActive = appSettings.modeMaintenance?.actif;
  const isAdminUser = currentUser.role === 'superadmin' || currentUser.role === 'directeur_promoteur';

  // If maintenance mode is active and user is NOT admin/superadmin -> Lock Screen
  if (isMaintenanceActive && !isAdminUser) {
    return <MaintenanceLockScreen />;
  }

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return t.dashboard;
      case 'chantiers':
        return t.chantiers;
      case 'messagerie':
        return 'Messagerie Interne & Tickets Chantier';
      case 'avancement':
        return t.avancement || 'Suivi Travaux & PVs';
      case 'rentabilite':
        return t.rentabilite || 'Rentabilité & Marges';
      case 'comptabilite':
        return 'Comptabilité & Fiscalité (G50)';
      case 'soustraitance':
        return 'Sous-Traitance & Décomptes (DPM)';
      case 'caisses':
        return t.caisses;
      case 'transactions':
        return t.transactions;
      case 'tiers':
        return t.tiers;
      case 'stocks':
        return t.stocks;
      case 'materiel':
        return t.materiel || 'Engins & Matériel';
      case 'personnel':
        return t.personnelPaie;
      case 'documents':
        return t.documents;
      case 'beneficiaires':
        return t.beneficiaires || 'Bénéficiaires & Logements';
      case 'utilisateurs':
        return t.utilisateurs;
      case 'backup':
        return 'Paramètres Entreprise (Admin)';
      case 'audit':
        return 'Audit de Conformité & Contrôle Interne';
      case 'superadmin_config':
        return 'Panneau Intégrateur (Modules)';
      default:
        return t.dashboard;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Maintenance Alert Bar for Admins */}
        {isMaintenanceActive && (
          <div className="bg-rose-900 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md z-30 shrink-0">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
              <span>
                <strong>Mode Maintenance Système Actif :</strong> L'accès public est restreint aux seuls administrateurs.
              </span>
            </div>
            <button
              onClick={() => setActiveTab('superadmin_config')}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px] transition cursor-pointer shrink-0"
            >
              Gérer / Désactiver
            </button>
          </div>
        )}

        {/* Top Header */}
        <Header
          activeTabTitle={getTabTitle()}
          onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
          onOpenTransactionModal={() =>
            setTransactionModalState({ isOpen: true, defaultType: 'sortie' })
          }
          onOpenExportPdfModal={(type) =>
            setExportPdfModalState({ isOpen: true, defaultType: type || 'financier' })
          }
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onNavigate={setActiveTab}
          onOpenAlimenterModal={(caisseId) =>
            setAlimenterModalState({ isOpen: true, targetCaisseId: caisseId })
          }
        />

        {/* Viewport */}
        <main
          className={
            activeTab === 'messagerie'
              ? 'flex-1 overflow-hidden bg-slate-50 dark:bg-slate-900'
              : 'flex-1 overflow-y-auto p-6 md:p-8'
          }
        >
          {!hasAccess ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-lg mx-auto my-12">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 shadow-inner">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">
                Accès Restreint / Non Autorisé
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Votre rôle actuel (<strong className="text-amber-700 dark:text-amber-400">{effectiveRole}</strong>) ne dispose pas des habilitations requises pour accéder au module <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">"{activeTab}"</span>.
              </p>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <span>Retourner au Tableau de Bord</span>
              </button>
            </div>
          ) : activeTab === 'messagerie' ? (
            <MessagerieView />
          ) : (
            <div className="max-w-7xl mx-auto">
              {activeTab === 'dashboard' && (
                <DashboardView
                onNavigate={setActiveTab}
                onOpenTransactionModal={() =>
                  setTransactionModalState({ isOpen: true, defaultType: 'sortie' })
                }
                onOpenAlimenterModal={(caisseId) =>
                  setAlimenterModalState({ isOpen: true, targetCaisseId: caisseId })
                }
                onOpenChantierModal={() =>
                  setChantierModalState({ isOpen: true, chantierToEdit: null })
                }
                onOpenStockMovementModal={(stockItemId) =>
                  setStockMovementModalState({ isOpen: true, defaultStockItemId: stockItemId })
                }
                onOpenExportPdfModal={(type) =>
                  setExportPdfModalState({ isOpen: true, defaultType: type || 'financier' })
                }
              />
            )}

            {activeTab === 'chantiers' && (
              <ChantiersView
                onOpenChantierModal={(ch) =>
                  setChantierModalState({ isOpen: true, chantierToEdit: ch || null })
                }
                onOpenTransactionModalWithChantier={(chantierId) =>
                  setTransactionModalState({
                    isOpen: true,
                    defaultType: 'sortie',
                    defaultChantierId: chantierId,
                  })
                }
                onOpenAlimenterModalWithCaisse={(caisseId) =>
                  setAlimenterModalState({ isOpen: true, targetCaisseId: caisseId })
                }
              />
            )}

            {activeTab === 'avancement' && <AvancementView />}

            {activeTab === 'rentabilite' && <RentabiliteView />}

            {activeTab === 'comptabilite' && <ComptabiliteView />}

            {activeTab === 'soustraitance' && <SousTraitanceView />}

            {activeTab === 'caisses' && (
              <CaissesView
                onOpenAlimenterModal={(caisseId) =>
                  setAlimenterModalState({ isOpen: true, targetCaisseId: caisseId })
                }
                onOpenTransactionModalWithCaisse={(caisseId) =>
                  setTransactionModalState({
                    isOpen: true,
                    defaultType: 'sortie',
                    defaultCaisseId: caisseId,
                  })
                }
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionsView
                onOpenTransactionModal={() =>
                  setTransactionModalState({ isOpen: true, defaultType: 'sortie' })
                }
              />
            )}

            {activeTab === 'tiers' && (
              <TiersView
                onOpenTransactionModalWithTier={(tierId, type) =>
                  setTransactionModalState({ isOpen: true, defaultType: type })
                }
              />
            )}

            {activeTab === 'stocks' && (
              <StocksView
                onOpenStockMovementModal={(stockItemId) =>
                  setStockMovementModalState({ isOpen: true, defaultStockItemId: stockItemId })
                }
              />
            )}

            {activeTab === 'materiel' && (
              <MaterielView
                onOpenMaterielModal={(mat, defaultChId) =>
                  setMaterielModalState({
                    isOpen: true,
                    materielToEdit: mat || null,
                    defaultChantierId: defaultChId,
                  })
                }
                onOpenTransfertModal={(matId) =>
                  setTransfertModalState({
                    isOpen: true,
                    defaultMaterielId: matId,
                  })
                }
                onOpenMaintenanceModal={(matId, defaultType) =>
                  setMaintenanceModalState({
                    isOpen: true,
                    defaultMaterielId: matId,
                    defaultType,
                  })
                }
              />
            )}

            {activeTab === 'personnel' && (
              <PersonnelView
                onOpenEmployeModal={(emp, defaultChId) =>
                  setEmployeModalState({
                    isOpen: true,
                    employeToEdit: emp || null,
                    defaultChantierId: defaultChId,
                  })
                }
                onOpenAffectationModal={(emp) =>
                  setAffectationModalState({
                    isOpen: true,
                    employe: emp || null,
                  })
                }
                onOpenBulletinPaieModal={(empId) =>
                  setBulletinPaieModalState({
                    isOpen: true,
                    defaultEmployeId: empId,
                  })
                }
                onOpenExportPdfModal={() =>
                  setExportPdfModalState({
                    isOpen: true,
                    defaultType: 'paie',
                  })
                }
              />
            )}

            {activeTab === 'documents' && (
              <DocumentsView
                onOpenExportPdfModal={(type) =>
                  setExportPdfModalState({
                    isOpen: true,
                    defaultType: type || 'financier',
                  })
                }
              />
            )}

            {activeTab === 'beneficiaires' && <BeneficiairesView />}

            {activeTab === 'utilisateurs' && <UtilisateursView />}

            {activeTab === 'profile' && <ProfileView />}

            {activeTab === 'backup' && <BackupView />}

            {activeTab === 'audit' && <ComplianceAuditView />}

            {activeTab === 'superadmin_config' && <SuperAdminView />}
          </div>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <TransactionModal
        isOpen={transactionModalState.isOpen}
        defaultType={transactionModalState.defaultType}
        defaultCaisseId={transactionModalState.defaultCaisseId}
        defaultChantierId={transactionModalState.defaultChantierId}
        onClose={() => setTransactionModalState({ isOpen: false })}
      />

      <AlimenterCaisseModal
        isOpen={alimenterModalState.isOpen}
        targetCaisseId={alimenterModalState.targetCaisseId}
        onClose={() => setAlimenterModalState({ isOpen: false })}
      />

      <ChantierModal
        isOpen={chantierModalState.isOpen}
        chantierToEdit={chantierModalState.chantierToEdit}
        onClose={() => setChantierModalState({ isOpen: false })}
      />

      <StockMovementModal
        isOpen={stockMovementModalState.isOpen}
        defaultStockItemId={stockMovementModalState.defaultStockItemId}
        onClose={() => setStockMovementModalState({ isOpen: false })}
      />

      <EmployeModal
        isOpen={employeModalState.isOpen}
        employeToEdit={employeModalState.employeToEdit}
        defaultChantierId={employeModalState.defaultChantierId}
        onClose={() => setEmployeModalState({ isOpen: false })}
      />

      <AffectationModal
        isOpen={affectationModalState.isOpen}
        employe={affectationModalState.employe}
        onClose={() => setAffectationModalState({ isOpen: false })}
      />

      <BulletinPaieModal
        isOpen={bulletinPaieModalState.isOpen}
        defaultEmployeId={bulletinPaieModalState.defaultEmployeId}
        onClose={() => setBulletinPaieModalState({ isOpen: false })}
      />

      {/* Export Reports to PDF Modal */}
      <ExportPdfModal
        isOpen={exportPdfModalState.isOpen}
        defaultType={exportPdfModalState.defaultType}
        defaultChantierId={exportPdfModalState.defaultChantierId}
        onClose={() => setExportPdfModalState({ isOpen: false })}
      />

      {/* Equipment Modals */}
      <MaterielModal
        isOpen={materielModalState.isOpen}
        materielToEdit={materielModalState.materielToEdit}
        defaultChantierId={materielModalState.defaultChantierId}
        onClose={() => setMaterielModalState({ isOpen: false })}
      />

      <TransfertMaterielModal
        isOpen={transfertModalState.isOpen}
        defaultMaterielId={transfertModalState.defaultMaterielId}
        onClose={() => setTransfertModalState({ isOpen: false })}
      />

      <MaintenanceMaterielModal
        isOpen={maintenanceModalState.isOpen}
        defaultMaterielId={maintenanceModalState.defaultMaterielId}
        defaultType={maintenanceModalState.defaultType}
        onClose={() => setMaintenanceModalState({ isOpen: false })}
      />

      {/* Printable Vouchers (Bons de Caisse, Reçus VSP & Bulletins de Paie) */}
      <PrintVoucherModal />

      {/* Global Quick Search Spotlight & Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={setActiveTab}
        onOpenTransactionModal={() =>
          setTransactionModalState({ isOpen: true, defaultType: 'sortie' })
        }
        onOpenAlimenterModal={(caisseId) =>
          setAlimenterModalState({ isOpen: true, targetCaisseId: caisseId })
        }
        onOpenChantierModal={() =>
          setChantierModalState({ isOpen: true, chantierToEdit: null })
        }
      />

      {/* Real-time Floating Toast Notification */}
      {toastNotification && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white border-2 border-emerald-500 rounded-xl shadow-2xl p-4 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                <MessageSquareText className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <span>Nouveau message</span>
                  <span>·</span>
                  <span className="font-mono text-[10px] uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                    {toastNotification.chantierNom}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                  {toastNotification.ticketTitre}
                </h4>
                <p className="text-xs text-slate-600 line-clamp-2">
                  <strong className="text-slate-800">{toastNotification.auteurNom} : </strong>
                  {toastNotification.contenuApercu}
                </p>
                <div className="pt-1.5 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveTicketId(toastNotification.ticketId);
                      setActiveTab('messagerie');
                      dismissToastNotification();
                    }}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-xs transition"
                  >
                    Ouvrir la discussion
                  </button>
                  <button
                    onClick={dismissToastNotification}
                    className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 rounded transition"
                  >
                    Ignorer
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={dismissToastNotification}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Interactive Welcome Tour */}
      <WelcomeTour />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
