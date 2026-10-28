import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Building2,
  Wallet,
  Receipt,
  Users,
  Package,
  FolderLock,
  UserCog,
  HardHat,
  Truck,
  Settings,
  ClipboardCheck,
  TrendingUp,
  UserCheck,
  Calculator,
  FileCheck,
  Sliders,
  MessageSquareText,
  LogOut,
  X,
} from 'lucide-react';

// NavTab is defined in Sidebar.tsx in original, let's keep it locally or redefine
export type NavTab =
  | 'dashboard'
  | 'chantiers'
  | 'messagerie'
  | 'avancement'
  | 'rentabilite'
  | 'comptabilite'
  | 'soustraitance'
  | 'caisses'
  | 'transactions'
  | 'tiers'
  | 'stocks'
  | 'materiel'
  | 'personnel'
  | 'documents'
  | 'beneficiaires'
  | 'utilisateurs'
  | 'profile'
  | 'backup'
  | 'audit'
  | 'superadmin_config';

interface Props {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<Props> = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const {
    t,
    caisses,
    transactions,
    activeChantierId,
    chantiers,
    stocks,
    employes,
    bulletinsPaie,
    materiels,
    pvsChantier,
    contratsSousTraitance,
    appSettings,
    currentUser,
    effectiveRole,
    unreadTicketsCount,
    logout,
    isGlobalUser,
    userAllowedChantiers,
    isChantierAllowed,
  } = useApp();

  const lowCashCount = caisses.filter(
    (c) => isChantierAllowed(c.chantierId) && c.soldeActuelDZD <= c.seuilAlerteDZD
  ).length;
  const lowStockCount = stocks.filter(
    (s) => isChantierAllowed(s.chantierId) && s.quantiteEnStock <= s.quantiteMinAlerte
  ).length;
  const pendingTxCount = transactions.filter(
    (tx) => isChantierAllowed(tx.chantierId) && tx.statut === 'en_attente'
  ).length;
  const pendingPaieCount = bulletinsPaie.filter(
    (bp) => isChantierAllowed(bp.chantierId) && bp.statut === 'en_attente'
  ).length;
  const visibleMateriels = materiels.filter((m) => isChantierAllowed(m.chantierId));
  const issueMaterielCount = visibleMateriels.filter(
    (m) => m.statut === 'en_panne' || m.statut === 'en_maintenance'
  ).length;
  const visiblePvs = pvsChantier.filter((pv) => isChantierAllowed(pv.chantierId));
  const visibleContrats = contratsSousTraitance.filter((c) => isChantierAllowed(c.chantierId));

  const currentChantier = activeChantierId
    ? chantiers.find((c) => c.id === activeChantierId)
    : null;

  const navItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; count?: number; alert?: boolean; rolesAllowed?: string[] }[] = [
    {
      id: 'dashboard',
      label: t.dashboard,
      icon: LayoutDashboard,
      rolesAllowed: ['directeur_promoteur', 'tresorier_caissier', 'comptable', 'responsable_chantier', 'conducteur_travaux', 'chef_projet', 'responsable_achats', 'metreur_estimateur'],
    },
    {
      id: 'chantiers',
      label: t.chantiers,
      icon: Building2,
      count: userAllowedChantiers.length,
      rolesAllowed: ['directeur_promoteur', 'conducteur_travaux', 'chef_projet', 'responsable_chantier', 'metreur_estimateur'],
    },
    {
      id: 'messagerie',
      label: t.messagerieChantier,
      icon: MessageSquareText,
      count: unreadTicketsCount > 0 ? unreadTicketsCount : undefined,
      alert: unreadTicketsCount > 0,
      rolesAllowed: [
        'directeur_promoteur',
        'conducteur_travaux',
        'responsable_chantier',
        'chef_projet',
        'tresorier_caissier',
        'comptable',
        'responsable_achats',
        'metreur_estimateur',
      ],
    },
    {
      id: 'avancement',
      label: t.avancement,
      icon: ClipboardCheck,
      count: visiblePvs.length,
      rolesAllowed: ['directeur_promoteur', 'conducteur_travaux', 'chef_projet', 'responsable_chantier', 'metreur_estimateur'],
    },
    {
      id: 'rentabilite',
      label: t.rentabilite,
      icon: TrendingUp,
      rolesAllowed: ['directeur_promoteur', 'comptable'],
    },
    {
      id: 'comptabilite',
      label: t.comptabilite,
      icon: Calculator,
      rolesAllowed: ['directeur_promoteur', 'comptable'],
    },
    {
      id: 'soustraitance',
      label: t.soustraitance,
      icon: FileCheck,
      count: visibleContrats.length,
      rolesAllowed: ['directeur_promoteur', 'conducteur_travaux', 'chef_projet', 'responsable_achats', 'comptable'],
    },
    {
      id: 'caisses',
      label: t.caisses,
      icon: Wallet,
      count: lowCashCount > 0 ? lowCashCount : undefined,
      alert: lowCashCount > 0,
      rolesAllowed: ['directeur_promoteur', 'tresorier_caissier', 'comptable', 'responsable_chantier'],
    },
    {
      id: 'transactions',
      label: t.transactions,
      icon: Receipt,
      count: pendingTxCount > 0 ? pendingTxCount : undefined,
      rolesAllowed: ['directeur_promoteur', 'tresorier_caissier', 'comptable', 'responsable_chantier'],
    },
    {
      id: 'tiers',
      label: t.tiers,
      icon: Users,
      rolesAllowed: ['directeur_promoteur', 'tresorier_caissier', 'comptable', 'responsable_achats'],
    },
    {
      id: 'stocks',
      label: t.stocks,
      icon: Package,
      count: lowStockCount > 0 ? lowStockCount : undefined,
      alert: lowStockCount > 0,
      rolesAllowed: ['directeur_promoteur', 'conducteur_travaux', 'chef_projet', 'responsable_chantier', 'responsable_achats'],
    },
    {
      id: 'materiel',
      label: t.materiel,
      icon: Truck,
      count: issueMaterielCount > 0 ? issueMaterielCount : visibleMateriels.length,
      alert: issueMaterielCount > 0,
      rolesAllowed: ['directeur_promoteur', 'conducteur_travaux', 'chef_projet', 'responsable_chantier', 'responsable_achats'],
    },
    {
      id: 'personnel',
      label: t.personnelPaie,
      icon: HardHat,
      count: pendingPaieCount > 0 ? pendingPaieCount : employes.length,
      alert: pendingPaieCount > 0,
      rolesAllowed: ['directeur_promoteur', 'comptable', 'responsable_chantier'],
    },
    {
      id: 'beneficiaires',
      label: t.beneficiaires,
      icon: UserCheck,
      rolesAllowed: ['directeur_promoteur', 'tresorier_caissier'],
    },
    {
      id: 'documents',
      label: t.documents,
      icon: FolderLock,
      rolesAllowed: ['directeur_promoteur', 'conducteur_travaux', 'chef_projet', 'responsable_chantier', 'metreur_estimateur', 'comptable'],
    },
    {
      id: 'utilisateurs',
      label: t.utilisateurs,
      icon: UserCog,
      rolesAllowed: ['directeur_promoteur'],
    },
    {
      id: 'profile',
      label: 'Mon Profil & Sécurité',
      icon: UserCheck,
      rolesAllowed: [
        'directeur_promoteur',
        'tresorier_caissier',
        'comptable',
        'responsable_chantier',
        'conducteur_travaux',
        'chef_projet',
        'responsable_achats',
        'metreur_estimateur',
        'superadmin',
      ],
    },
    {
      id: 'backup',
      label: t.parametresEntreprise,
      icon: Settings,
      rolesAllowed: ['directeur_promoteur'],
    },
    {
      id: 'audit',
      label: 'Audit & Contrôle Interne',
      icon: FileCheck,
      rolesAllowed: ['directeur_promoteur'],
    },
    {
      id: 'superadmin_config',
      label: t.panneauSuperadmin,
      icon: Sliders,
      rolesAllowed: ['superadmin'],
    },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" 
          onClick={onClose}
        />
      )}
      <aside className={`fixed inset-y-0 start-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-e border-slate-800 no-print select-none transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
              <HardHat className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-wide text-white uppercase">
                {t.appName}
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">{t.appTagline}</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden p-1 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter context banner if filtered */}
        {currentChantier && (
          <div className="mt-3.5 p-2 bg-slate-800/80 rounded-md border border-slate-700/60 text-xs mx-3">
            <div className="flex items-center justify-between text-[11px] text-amber-400 font-semibold mb-0.5">
              <span>{t.filtreChantierActif}</span>
              <span>{currentChantier.wilaya}</span>
            </div>
            <p className="text-xs font-medium text-white truncate">{currentChantier.nom}</p>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems
            .filter((item) => {
              if (item.rolesAllowed && effectiveRole && !item.rolesAllowed.includes(effectiveRole)) {
                return false;
              }
              const mods = appSettings.modulesActifs;
              if (!mods) return true;
              if (item.id === 'chantiers') return mods['Chantiers & Projets'] !== false;
              if (item.id === 'beneficiaires') return mods['Vente sur Plan (VSP)'] !== false;
              if (item.id === 'soustraitance') return mods['Tiers & Sous-traitance'] !== false;
              if (item.id === 'tiers') return mods['Tiers & Sous-traitance'] !== false;
              if (item.id === 'comptabilite') return mods['Fiscalité Algérienne (G50)'] !== false;
              if (item.id === 'avancement') return mods['Technique & CTC'] !== false || mods['Suivi Travaux & Journal Quotidien'] !== false;
              if (item.id === 'materiel') return mods['Parc Matériel & Engins'] !== false;
              if (item.id === 'stocks') return mods['Stocks & Matériaux'] !== false;
              if (item.id === 'personnel') return mods['Personnel & Paie'] !== false;
              if (item.id === 'documents') return mods['GED & Documents'] !== false;
              if (item.id === 'caisses') return mods['Trésorerie & Caisses'] !== false;
              if (item.id === 'transactions') return mods['Trésorerie & Caisses'] !== false;
              if (item.id === 'messagerie') return mods['Messagerie & Tickets Chantier'] !== false;
              if (item.id === 'rentabilite') return mods['Rentabilité & Reporting Analytique'] !== false;
              if (item.id === 'audit') return mods['Audit de Conformité & Contrôle Interne'] !== false;
              if (item.id === 'utilisateurs') return mods['Administration & Sécurité'] !== false;
              if (item.id === 'backup') return mods['Administration & Sécurité'] !== false;
              
              return true;
            })
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); onClose(); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-slate-950' : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.count !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded tabular-nums ${
                        item.alert
                          ? 'bg-red-500 text-white animate-pulse'
                          : isActive
                          ? 'bg-slate-900 text-amber-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/40">
          <div className="flex items-center justify-between mb-1">
            <span>{t.devisePrincipale} :</span>
            <span className="font-mono font-bold text-amber-400">{t.devise === 'DA' ? 'Dinar Algérien (DA)' : t.devise === 'د.ج' ? 'دينار جزائري (د.ج)' : 'Algerian Dinar (DZD)'}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-3">
            <span>{t.reglementation} :</span>
            <span>Loi n° 11-04 (VSP DZ)</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400">{currentUser.nom.split(' ')[0]}</span>
            <button
              onClick={() => logout()}
              className="w-8 h-8 flex items-center justify-center text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-lg transition-all cursor-pointer"
              title="Se déconnecter"
              aria-label="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
