import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, Utilisateur } from '../types';
import { 
  Plus, 
  Building, 
  User, 
  ChevronDown, 
  FileDown, 
  Search, 
  MessageSquareText, 
  Sun, 
  Moon, 
  Menu, 
  HelpCircle, 
  LogOut,
  Sparkles,
  Check,
  Zap,
  CheckCircle2,
  Users,
  KeyRound
} from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { NavTab } from './Sidebar';
import { ChangePasswordModal } from './ChangePasswordModal';

interface Props {
  onOpenTransactionModal: () => void;
  onOpenExportPdfModal: (type?: 'financier' | 'paie' | 'materiel') => void;
  onOpenCommandPalette: () => void;
  onNavigate: (tab: NavTab) => void;
  onOpenAlimenterModal: (caisseId?: string) => void;
  activeTabTitle: string;
  onToggleSidebar: () => void;
}

export const Header: React.FC<Props> = ({
  onOpenTransactionModal,
  onOpenExportPdfModal,
  onOpenCommandPalette,
  onNavigate,
  onOpenAlimenterModal,
  activeTabTitle,
  onToggleSidebar,
}) => {
  const {
    theme,
    toggleTheme,
    t,
    chantiers,
    activeChantierId,
    setActiveChantierId,
    currentUser,
    effectiveRole,
    setCurrentUser,
    utilisateurs,
    getRoleLabel,
    unreadTicketsCount,
    logout,
    isLoggedIn,
    hasPermission,
  } = useApp();

  const [isDemoDropdownOpen, setIsDemoDropdownOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const demoDropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    setIsDemoDropdownOpen(false);
    logout();
  };

  const handleSwitchUser = (user: Utilisateur) => {
    setCurrentUser(user);
    setIsDemoDropdownOpen(false);
  };

  const getChantierNom = (id: string) => {
    return chantiers.find(c => c.id === id)?.nom || id;
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (demoDropdownRef.current && !demoDropdownRef.current.contains(event.target as Node)) {
        setIsDemoDropdownOpen(false);
      }
    };
    if (isDemoDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDemoDropdownOpen]);

  const isIntegrateur = currentUser.role === 'superadmin';

  const isGlobalUser =
    currentUser.role === 'directeur_promoteur' ||
    currentUser.chantiersAssignes.includes('*');

  const accessibleChantiers = isGlobalUser
    ? chantiers
    : chantiers.filter((c) => currentUser.chantiersAssignes.includes(c.id));

  // If a site-scoped user has an activeChantierId that is not in their assigned chantiers, reset it
  useEffect(() => {
    if (!isGlobalUser && !isIntegrateur && activeChantierId && !currentUser.chantiersAssignes.includes(activeChantierId)) {
      setActiveChantierId(currentUser.chantiersAssignes[0] || null);
    }
  }, [isGlobalUser, isIntegrateur, activeChantierId, currentUser.chantiersAssignes, setActiveChantierId]);

  if (!isLoggedIn) return null;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 md:gap-4 px-3 md:px-6 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors h-14 md:h-16">
      {/* Zone 1: Mobile Toggle, Contextual Breadcrumb & Active Chantier Filter */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="md:hidden h-9 w-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-700/80 cursor-pointer shrink-0 shadow-2xs"
          title="Ouvrir le menu de navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
          <span className="font-bold text-slate-900 dark:text-white truncate max-w-[140px] lg:max-w-none">
            {activeTabTitle}
          </span>
        </div>

        {/* Global Chantier Selector - Minimized */}
        {!isIntegrateur && (
          <div className="relative flex items-center shrink-0">
            <Building className="absolute start-2 w-3 h-3 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <select
              value={activeChantierId || 'all'}
              onChange={(e) => setActiveChantierId(e.target.value === 'all' ? null : e.target.value)}
              className="h-8 ps-6 pe-5 text-[11px] font-bold text-slate-800 dark:text-slate-100 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-hidden appearance-none cursor-pointer transition-colors max-w-[105px] sm:max-w-[130px] md:max-w-[155px] truncate shadow-2xs"
              title="Filtrer par chantier actif"
            >
              <option value="all">
                🏢 {isGlobalUser ? t.tousLesChantiers : 'Mes Chantiers'}
              </option>
              {accessibleChantiers.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.nom} ({ch.wilaya})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute end-1.5 w-3 h-3 text-slate-500 dark:text-slate-400 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Zone 2: Search, PDF, Notifications, Guide, Dark Mode, User Name, Logout, CTA */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Quick Search Spotlight Trigger - Minimized */}
        {!isIntegrateur && (
          <button
            onClick={onOpenCommandPalette}
            className="h-8 flex items-center justify-center gap-1.5 px-2 sm:px-2.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700/80 cursor-pointer shrink-0 shadow-2xs"
            title="Recherche globale et raccourcis (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden lg:inline text-slate-600 dark:text-slate-300 text-[10px]">Rechercher...</span>
            <kbd className="hidden xl:inline-block text-[9px] font-mono px-1 py-0.2 rounded bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              Ctrl+K
            </kbd>
          </button>
        )}

        {/* PDF Reports Export Trigger - Minimized */}
        {!isIntegrateur && (
          <button
            onClick={() => onOpenExportPdfModal('financier')}
            className="h-8 hidden lg:flex items-center gap-1 px-2 text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700/80 cursor-pointer shrink-0 shadow-2xs"
            title="Exporter un rapport PDF (Financier, Paie, Matériel)"
          >
            <FileDown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden xl:inline">PDF</span>
          </button>
        )}

        {/* Real-time Notification Center */}
        {!isIntegrateur && (
          <NotificationCenter
            onNavigate={onNavigate}
            onOpenAlimenterModal={onOpenAlimenterModal}
          />
        )}

        {/* Welcome Tour Toggle */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-welcome-tour'))}
          className="h-8 w-8 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700/80 cursor-pointer shrink-0 shadow-2xs"
          title="Guide interactif du système"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>

        {/* Dark Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className="h-8 w-8 flex items-center justify-center text-slate-600 dark:text-amber-400 hover:text-slate-900 dark:hover:text-amber-300 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700/80 cursor-pointer shrink-0 shadow-2xs"
          title={theme === 'dark' ? 'Passer en Mode Clair' : 'Passer en Mode Sombre'}
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-slate-700" />
          )}
        </button>

        {/* Minimized User Name & Profile Switcher Zone */}
        <div className="relative" ref={demoDropdownRef}>
          <button
            onClick={() => setIsDemoDropdownOpen(prev => !prev)}
            className="h-8 flex items-center gap-1.5 px-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800/60 rounded-lg transition-all cursor-pointer shadow-2xs group shrink-0"
            title={`${currentUser.nom} (${getRoleLabel(effectiveRole)})`}
          >
            <div className="w-5 h-5 rounded bg-amber-500 text-slate-950 flex items-center justify-center font-black text-[10px] shrink-0 shadow-xs">
              <Sparkles className="w-3 h-3 text-slate-950" />
            </div>
            <div className="hidden sm:flex items-center gap-1 max-w-[100px] md:max-w-[130px] truncate">
              <span className="text-[11px] font-bold text-slate-900 dark:text-amber-200 truncate">
                {currentUser.nom.split(' ')[0]}
              </span>
              <span className="hidden md:inline-block text-[8px] px-1 py-0.2 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold uppercase shrink-0 truncate max-w-[70px]">
                {getRoleLabel(effectiveRole).split(' ')[0]}
              </span>
            </div>
            <ChevronDown className={`w-3 h-3 text-amber-700 dark:text-amber-400 transition-transform ${isDemoDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Interactive User Switcher Popover */}
          {isDemoDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-900 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
                      Accès Rapide Démonstration
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Basculez de profil en 1-clic pour tester les droits
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold">
                  {utilisateurs.length} profils
                </span>
              </div>

              {/* Notice context role */}
              <div className="px-3 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200/50 dark:border-amber-900/40 text-[10px] text-amber-900 dark:text-amber-200">
                <span>Rôle effectif actuel : </span>
                <strong className="font-bold underline">{getRoleLabel(effectiveRole)}</strong>
                {activeChantierId && (
                  <span className="block text-[9px] text-amber-700 dark:text-amber-400 mt-0.5">
                    (sur {getChantierNom(activeChantierId)})
                  </span>
                )}
              </div>

              {/* Profiles List */}
              <div className="max-h-[380px] overflow-y-auto p-2 space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800/50">
                {utilisateurs.map((u) => {
                  const isActive = u.id === currentUser.id;
                  const hasSiteRoles = u.rolesParChantier && u.rolesParChantier.length > 0;

                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSwitchUser(u)}
                      className={`w-full p-2.5 rounded-xl transition-all text-left flex flex-col gap-1 cursor-pointer group ${
                        isActive
                          ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 shadow-2xs'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            u.role === 'superadmin'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : u.role === 'directeur_promoteur'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : u.role === 'responsable_chantier' || u.role === 'chef_projet'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {u.nom.charAt(0)}
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                              {u.nom}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
                              {getRoleLabel(u.role)}
                            </span>
                          </div>
                        </div>

                        {isActive ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Actif
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 shrink-0 flex items-center gap-0.5">
                            <Zap className="w-3 h-3 text-amber-500" />
                            <span>Basculer</span>
                          </span>
                        )}
                      </div>

                      {/* Display rolesParChantier if assigned */}
                      {hasSiteRoles && (
                        <div className="mt-1 pt-1 border-t border-slate-200/50 dark:border-slate-800/80 flex flex-wrap gap-1">
                          <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-0.5 mr-0.5">
                            <Building className="w-2.5 h-2.5" />
                            Rôles site :
                          </span>
                          {u.rolesParChantier!.map((rc, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs"
                            >
                              <strong className="text-amber-700 dark:text-amber-400">{getChantierNom(rc.chantierId)}:</strong>{' '}
                              {getRoleLabel(rc.role)}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Bottom Actions */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsDemoDropdownOpen(false);
                    onNavigate('profile');
                  }}
                  className="text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-amber-600 flex items-center gap-1 p-1 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-amber-500" />
                  <span>Mon Profil</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDemoDropdownOpen(false);
                    setIsChangePasswordModalOpen(true);
                  }}
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-800 dark:text-amber-400 flex items-center gap-1.5 p-1 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-md cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                  <span>Mot de passe</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDemoDropdownOpen(false);
                    onNavigate('utilisateurs');
                  }}
                  className="text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-amber-600 flex items-center gap-1 p-1 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Rôles & Utilisateurs</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md cursor-pointer"
                  title={t.deconnexion}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="sm:hidden">{t.deconnexion}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Direct Logout Button - Pure Icon */}
        <button
          onClick={handleLogout}
          className="w-9 h-9 flex items-center justify-center text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50/70 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 border border-rose-200/80 dark:border-rose-900/60 rounded-xl transition-all cursor-pointer shadow-2xs shrink-0"
          title="Se déconnecter de la session"
          aria-label="Se déconnecter de la session"
        >
          <LogOut className="w-4 h-4" />
        </button>

        {/* Primary CTA: Nouvelle Dépense - Restricted to authorized business roles */}
        {!isIntegrateur && hasPermission('transactions_create') && (
          <button
            onClick={onOpenTransactionModal}
            className="h-9 flex items-center gap-1.5 px-3 sm:px-3.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-98 rounded-xl shadow-xs transition-all whitespace-nowrap shrink-0 cursor-pointer"
            title="Enregistrer une nouvelle sortie ou entrée de caisse"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span className="hidden sm:inline">{t.nouvelleDepense}</span>
          </button>
        )}
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
    </header>
  );
};
