import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AppSettings, RoleDefinition } from '../types';
import { formatDateTimeFR } from '../utils/formatters';
import {
  Sliders,
  Lock,
  Key,
  Check,
  AlertTriangle,
  CheckCircle,
  Layers,
  Briefcase,
  Percent,
  ClipboardList,
  HardHat,
  HardDrive,
  ShieldCheck,
  DatabaseBackup,
  Wallet,
  TrendingUp,
  RotateCcw,
  ShieldAlert,
  Fingerprint,
  LogOut,
  User,
  Eye,
  EyeOff,
  Smartphone,
  Shield,
  Activity,
  Users,
  CheckSquare,
  Square,
  Save,
  Search,
  LockKeyhole,
  FileCheck,
  MessageSquareText,
  Building2,
  ClipboardCheck,
} from 'lucide-react';
import { ComplianceAuditView } from './ComplianceAuditView';
import { BackupManagementView } from './BackupManagementView';
import { ClotureMensuelleView } from './ClotureMensuelleView';
import { MaintenanceModeCard } from './MaintenanceModeCard';
import { LogsAuditView } from './LogsAuditView';
import { UtilisateursView } from './UtilisateursView';
import {
  checkAuthRateLimit,
  recordFailedAuthAttempt,
  resetAuthRateLimit,
} from '../utils/security';

export const SuperAdminView: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    utilisateurs,
    appSettings,
    updateAppSettings,
    roles,
    updateRole,
    allPermissions,
    resetToInitialData,
    logAudit,
    caisses,
    updateCaisse,
    journalAudit,
  } = useApp();

  const isUserIntegrateur = currentUser.role === 'superadmin';

  // Navigation Sub-tab inside SuperAdmin View
  const [activeTab, setActiveTab] = useState<'modules' | 'users_roles' | 'rbac_matrix' | 'workflow' | 'backup_cloud' | 'audit' | 'maintenance'>('modules');

  // Security & Authentication State
  const [isSuperAdminUnlocked, setIsSuperAdminUnlocked] = useState(isUserIntegrateur);
  const [emailInput, setEmailInput] = useState('superadmin@batipromote-dz.com');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [authMethod, setAuthMethod] = useState<'password' | '2fa' | 'biometric'>('password');
  const [biometricScanning, setBiometricScanning] = useState(false);

  // 2FA Security Token generator simulation
  const [current2FAToken, setCurrent2FAToken] = useState('842915');
  const [sessionTimeLeft, setSessionTimeLeft] = useState(900); // 15 min session countdown

  const [formData, setFormData] = useState<AppSettings>({ 
    ...appSettings,
    validationWorkflow: appSettings.validationWorkflow || {
      deuxNiveauxActive: false,
      seuilMontantValidationDZD: 0,
    }
  });
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Filter state for RBAC Matrix
  const [selectedRoleCode, setSelectedRoleCode] = useState<string>('conducteur_travaux');
  const [permissionSearchTerm, setPermissionSearchTerm] = useState('');
  const [permissionModuleFilter, setPermissionModuleFilter] = useState<string>('all');

  // Auto-refresh OTP every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      const newToken = Math.floor(100000 + Math.random() * 900000).toString();
      setCurrent2FAToken(newToken);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Session timer when unlocked
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSuperAdminUnlocked) {
      timer = setInterval(() => {
        setSessionTimeLeft((prev) => {
          if (prev <= 1) {
            setIsSuperAdminUnlocked(false);
            setStatusMessage({ text: 'Session Intégrateur expirée par sécurité. Veuillez vous re-connecter.', isError: true });
            return 900;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSuperAdminUnlocked]);

  // Handle Login Submission
  const handleSuperAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    // Check brute force rate limit on superadmin account
    const rateStatus = checkAuthRateLimit('superadmin');
    if (rateStatus.isLocked) {
      setAuthError(`Sécurité : Accès Intégrateur temporairement bloqué suite à trop d'échecs. Patientez ${rateStatus.remainingSeconds}s.`);
      return;
    }

    const superAdminAcc = utilisateurs.find((u) => u.role === 'superadmin') || utilisateurs[0];

    // Check credentials
    if (passwordInput === '2026' || passwordInput === 'superadmin2026' || passwordInput === 'admin2026') {
      if (otpCode && otpCode !== current2FAToken && otpCode !== '123456') {
        const failRecord = recordFailedAuthAttempt('superadmin');
        setAuthError(`Code de sécurité 2FA incorrect. ${failRecord.attemptsLeft} tentative(s) restante(s).`);
        return;
      }

      resetAuthRateLimit('superadmin');
      setCurrentUser(superAdminAcc);
      setIsSuperAdminUnlocked(true);
      setSessionTimeLeft(900);
      setPasswordInput('');
      setOtpCode('');
      setAuthError('');

      logAudit({
        utilisateurNom: superAdminAcc.nom,
        utilisateurRole: 'Intégrateur Système',
        action: 'validation',
        module: 'securite',
        entiteReference: 'LOGIN-SUPERADMIN',
        details: 'Authentification renforcée récurrente réussie pour le Panneau Intégrateur.',
      });

      setStatusMessage({ text: 'Accès Intégrateur déverrouillé avec succès (Session sécurisée 15 min).' });
      setTimeout(() => setStatusMessage(null), 4000);
    } else {
      const failRecord = recordFailedAuthAttempt('superadmin');
      if (failRecord.isNowLocked) {
        setAuthError(`Verrouillage de sécurité : 5 échecs consécutifs. Accès bloqué pendant 60 secondes.`);
        logAudit({
          utilisateurNom: 'Inconnu (Tentative Intégrateur)',
          utilisateurRole: 'visiteur',
          action: 'securite_alerte',
          module: 'securite',
          entiteReference: 'BRUTE-FORCE-SUPERADMIN',
          details: 'Alerte sécurité : 5 échecs de mot de passe consécutifs sur le portail Intégrateur. Verrouillage automatique déclenché.',
        });
      } else {
        setAuthError(`Mot de passe Intégrateur invalide (Ex: 2026). ${failRecord.attemptsLeft} tentative(s) restante(s).`);
      }
    }
  };

  // Biometric Authentication Simulation
  const handleBiometricAuth = () => {
    setBiometricScanning(true);
    setAuthError('');
    setTimeout(() => {
      setBiometricScanning(false);
      const superAdminAcc = utilisateurs.find((u) => u.role === 'superadmin') || utilisateurs[0];
      setCurrentUser(superAdminAcc);
      setIsSuperAdminUnlocked(true);
      setSessionTimeLeft(900);

      logAudit({
        utilisateurNom: superAdminAcc.nom,
        utilisateurRole: 'Intégrateur Système',
        action: 'validation',
        module: 'settings',
        entiteReference: 'BIOMETRIC-SUPERADMIN',
        details: 'Authentification biométrique empreinte/FaceID réussie.',
      });

      setStatusMessage({ text: 'Authentification biométrique réussie !' });
      setTimeout(() => setStatusMessage(null), 4000);
    }, 1500);
  };

  // Lock Session
  const handleLockSession = () => {
    setIsSuperAdminUnlocked(false);
    setStatusMessage({ text: 'Session Intégrateur verrouillée.' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Toggle Module Status
  const handleToggleModule = (key: string) => {
    const allModuleKeys = Array.from(new Set(allPermissions.map(p => p.module)));
    const currentMods = formData.modulesActifs || allModuleKeys.reduce((acc, mod) => ({ ...acc, [mod]: true }), {});

    const updatedMods = {
      ...currentMods,
      [key]: !currentMods[key as keyof typeof currentMods],
    };

    setFormData((prev) => ({ ...prev, modulesActifs: updatedMods }));
    updateAppSettings({ modulesActifs: updatedMods });

    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'modification',
      module: 'settings',
      entiteReference: `MODULE-${String(key).toUpperCase()}`,
      details: `Changement du statut du module ${key} : ${updatedMods[key as keyof typeof updatedMods] ? 'Activé' : 'Désactivé'}`,
    });

    setStatusMessage({ text: `Statut du module mis à jour (${updatedMods[key as keyof typeof updatedMods] ? 'Activé' : 'Désactivé'}).` });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Toggle Permission for Role
  const handleToggleRolePermission = (roleId: string, permissionKey: string) => {
    const targetRole = roles.find((r) => r.id === roleId);
    if (!targetRole) return;

    const hasPerm = targetRole.permissions.includes(permissionKey);
    const updatedPermissions = hasPerm
      ? targetRole.permissions.filter((p) => p !== permissionKey)
      : [...targetRole.permissions, permissionKey];

    updateRole(roleId, { permissions: updatedPermissions });

    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'modification',
      module: 'roles',
      entiteReference: `PERM-${targetRole.code}`,
      details: `${hasPerm ? 'Révocation' : 'Attribution'} de la permission "${permissionKey}" pour le rôle ${targetRole.label}`,
    });

    setStatusMessage({
      text: `Permission ${hasPerm ? 'révoquée' : 'accordée'} avec succès pour le rôle ${targetRole.label}.`,
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Grant All / Revoke All Permissions for a Role
  const handleBulkPermissions = (roleId: string, grantAll: boolean) => {
    const targetRole = roles.find((r) => r.id === roleId);
    if (!targetRole) return;

    const updatedPermissions = grantAll ? allPermissions.map((p) => p.key) : [];
    updateRole(roleId, { permissions: updatedPermissions });

    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'modification',
      module: 'roles',
      entiteReference: `BULK-PERM-${targetRole.code}`,
      details: `${grantAll ? 'Octroi global' : 'Révocation globale'} de toutes les permissions pour le rôle ${targetRole.label}`,
    });

    setStatusMessage({
      text: grantAll
        ? `Toutes les permissions ont été accordées au rôle ${targetRole.label}.`
        : `Toutes les permissions ont été révoquées du rôle ${targetRole.label}.`,
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const allModulesList = Array.from(new Set(allPermissions.map((p) => p.module)));
  const modulesList = allModulesList.map(modName => {
    // Try to find icon, or default to Sliders
    const existing = [
      { key: 'vspBeneficiaires', title: 'Vente sur Plan (VSP)', desc: 'Lots appartements, dossiers des bénéficiaires (NIN), contrats notariés et tableau de bord VSP.', icon: Layers },
      { key: 'sousTraitance', title: 'Tiers & Sous-traitance', desc: 'Contrats de sous-traitance, attachements mensuels et retenues de garantie (10%).', icon: Briefcase },
      { key: 'fiscaliteG50', title: 'Fiscalité Algérienne (G50)', desc: 'Calcul automatique des impôts (TAP 2%, TVA 19%, IBS, IRG) et édition d\'états fiscaux.', icon: Percent },
      { key: 'avancementJournal', title: 'Suivi Travaux & Journal Quotidien', desc: 'Pointage agile du personnel, relevés météo, taches de chantier et PVs avec visas CTC.', icon: ClipboardList },
      { key: 'materielEngins', title: 'Parc Matériel & Engins', desc: 'Parc d\'engins, transferts inter-chantiers, carnets d\'entretien et visites techniques CTC.', icon: HardHat },
      { key: 'stocks', title: 'Stocks & Matériaux', desc: 'Entrées/sorties de ciment, acier, agrégats et alertes de seuil minimal par chantier.', icon: HardDrive },
      { key: 'personnelPaie', title: 'Personnel & Paie', desc: 'Registre des ouvriers, bulletins de paie quinzaine/mois et acomptes.', icon: ShieldCheck },
      { key: 'gedDocuments', title: 'GED & Documents', desc: 'Archivage sécurisé des permis de construire, plans, contrats, devis et prévisualisation PDF.', icon: DatabaseBackup },
      { key: 'caissesTresorerie', title: 'Trésorerie & Caisses', desc: 'Caisses chantiers, approvisionnements, bons de caisse et validation des dépenses.', icon: Wallet },
      { key: 'messagerieChantier', title: 'Messagerie & Tickets Chantier', desc: 'Communication instantanée entre le siège et les chantiers via des tickets d\'incidents.', icon: MessageSquareText },
      { key: 'rentabiliteReporting', title: 'Rentabilité & Reporting Analytique', desc: 'Analyses de marges par chantier, graphes de rentabilité et export de rapports de performance.', icon: TrendingUp },
      { key: 'auditConformite', title: 'Audit de Conformité & Contrôle Interne', desc: 'Vérification automatique des transactions, détection d\'anomalies et rapports d\'audit.', icon: ShieldCheck },
      { key: 'administration', title: 'Administration & Sécurité', desc: 'Gestion des utilisateurs, des rôles RBAC, des paramètres entreprise et sauvegardes.', icon: ShieldAlert },
      { key: 'chantiers', title: 'Chantiers & Projets', desc: 'Pilotage des opérations, budgets, et avancement global des chantiers.', icon: Building2 },
      { key: 'technique', title: 'Technique & CTC', desc: 'Suivi des étapes techniques, PVs d\'avancement et coordination CTC.', icon: ClipboardCheck },
    ].find(m => m.title.includes(modName) || modName.includes(m.key));
    
    return {
      key: modName,
      title: modName,
      desc: `Module dédié à : ${modName}`,
      icon: existing ? existing.icon : Sliders
    };
  });

  const modulesActifsState = formData.modulesActifs || allModulesList.reduce((acc, mod) => ({ ...acc, [mod]: true }), {} as Record<string, boolean>);

  const selectedRole = roles.find((r) => r.code === selectedRoleCode) || roles[0];

  const filteredPermissions = allPermissions.filter((p) => {
    const matchesModule = permissionModuleFilter === 'all' || p.module === permissionModuleFilter;
    const matchesSearch =
      !permissionSearchTerm ||
      p.label.toLowerCase().includes(permissionSearchTerm.toLowerCase()) ||
      p.key.toLowerCase().includes(permissionSearchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(permissionSearchTerm.toLowerCase());
    return matchesModule && matchesSearch;
  });

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  // IF NOT INTÉGRATEUR UNLOCKED -> DISPLAY REINFORCED SECURITY LOGIN SCREEN
  if (!isSuperAdminUnlocked) {
    return (
      <div className="max-w-xl mx-auto py-8 px-4 space-y-6">
        <div className="bg-slate-950 border border-slate-800 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Top Decorative Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center space-y-3 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20 font-black">
              <ShieldAlert className="w-9 h-9" />
            </div>

            <div>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-[10px] rounded-full uppercase tracking-wider">
                Authentification Renforcée Intégrateur
              </span>
              <h2 className="text-2xl font-black mt-2 tracking-tight">Portail de Sécurité Système</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                L'activation des modules et le contrôle d'infrastructure nécessitent une authentification de haut niveau réservée à l'Intégrateur.
              </p>
            </div>
          </div>

          {/* Method Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-900 rounded-2xl border border-slate-800 my-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setAuthMethod('password')}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                authMethod === 'password'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Mot de passe & 2FA</span>
            </button>

            <button
              type="button"
              onClick={() => setAuthMethod('biometric')}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                authMethod === 'biometric'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>Biométrie / Passkey</span>
            </button>
          </div>

          {/* Form 1: Password + 2FA */}
          {authMethod === 'password' && (
            <form onSubmit={handleSuperAdminLogin} className="space-y-4 relative z-10">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Identifiant Intégrateur
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs text-white bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="superadmin@batipromote-dz.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Mot de passe Intégrateur
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono">Code PIN par défaut : 2026</span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Saisissez le mot de passe (ex: 2026)"
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setAuthError('');
                    }}
                    className="w-full pl-10 pr-10 py-2.5 text-xs text-white bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 2FA Token Code */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                    <span>Jeton Sécurité 2FA (Facultatif)</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">Jeton simulé : <strong className="text-amber-400">{current2FAToken}</strong></span>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Code OTP à 6 chiffres (ex: 842915)"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full px-4 py-2 text-xs font-mono tracking-widest text-center text-amber-400 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {authError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Valider l'Authentification Intégrateur</span>
              </button>
            </form>
          )}

          {/* Form 2: Biometric Passkey */}
          {authMethod === 'biometric' && (
            <div className="text-center py-6 space-y-5">
              <button
                type="button"
                onClick={handleBiometricAuth}
                disabled={biometricScanning}
                className="w-24 h-24 rounded-full bg-slate-900 border-2 border-amber-500/40 text-amber-400 hover:border-amber-400 flex items-center justify-center mx-auto shadow-inner transition transform hover:scale-105 cursor-pointer relative group"
              >
                <Fingerprint className={`w-12 h-12 ${biometricScanning ? 'animate-pulse text-amber-300' : ''}`} />
                {biometricScanning && (
                  <span className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping opacity-50" />
                )}
              </button>

              <div>
                <h4 className="text-sm font-bold text-white">Scanner la Clé Biométrique / TouchID</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Utilisez votre lecteur d'empreinte digitale, FaceID ou clé physique FIDO2 pour déverrouiller.
                </p>
              </div>

              <button
                type="button"
                onClick={handleBiometricAuth}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer inline-flex items-center gap-2"
              >
                <Fingerprint className="w-4 h-4" />
                <span>Simuler le Scan Biométrique</span>
              </button>
            </div>
          )}

          {/* Footer Note */}
          <div className="mt-6 pt-4 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-amber-400" /> Session chiffrée SSL / AES-256
            </span>
            <span>Réseau Interne Sécurisé</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header with Active Session Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Espace Intégrateur Système
            </span>
            <span className="text-xs text-slate-400">Contrôle des Modules & Matrice de Permissions RBAC</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Paramétrage, Modules & Habilitations par Rôle</h2>
          <p className="text-xs text-slate-400 mt-1">
            Gérez l'activation des modules applicatifs et configurez la matrice d'accès fine (RBAC) pour chaque profil utilisateur.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-amber-400 font-mono text-xs font-bold rounded-xl flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Session : {formatSeconds(sessionTimeLeft)}</span>
          </div>

          <button
            onClick={handleLockSession}
            className="w-9 h-9 flex items-center justify-center bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl transition cursor-pointer"
            title="Verrouiller la session Intégrateur"
            aria-label="Verrouiller la session Intégrateur"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('modules')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'modules'
              ? 'border-amber-500 text-amber-700 bg-amber-50/50 rounded-t-lg font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sliders className="w-4 h-4 text-amber-600" />
          <span>01. Modules Applicatifs Globaux</span>
        </button>

        <button
          onClick={() => setActiveTab('users_roles')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'users_roles'
              ? 'border-amber-500 text-amber-700 bg-amber-50/50 rounded-t-lg font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4 text-amber-600" />
          <span>01.5. Comptes & Rôles</span>
        </button>

        <button
          onClick={() => setActiveTab('rbac_matrix')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'rbac_matrix'
              ? 'border-amber-500 text-amber-700 bg-amber-50/50 rounded-t-lg font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <LockKeyhole className="w-4 h-4 text-amber-600" />
          <span>02. Habilitations Fine par Rôle (Matrice RBAC)</span>
        </button>
        <button
          onClick={() => setActiveTab('workflow')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'workflow'
              ? 'border-amber-500 text-amber-700 bg-amber-50/50 rounded-t-lg font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          <span>03. Workflow de Validation</span>
        </button>

        <button
          onClick={() => setActiveTab('backup_cloud')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'backup_cloud'
              ? 'border-amber-500 text-amber-700 bg-amber-50/50 rounded-t-lg font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <DatabaseBackup className="w-4 h-4 text-amber-600" />
          <span>04. Sauvegardes & Restauration Cloud (1-Clic)</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'audit'
              ? 'border-amber-500 text-amber-700 bg-amber-50/50 rounded-t-lg font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ClipboardList className="w-4 h-4 text-amber-600" />
          <span>08. Journal d’Audit Système ({journalAudit.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'maintenance'
              ? 'border-amber-500 text-amber-700 bg-amber-50/50 rounded-t-lg font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <RotateCcw className="w-4 h-4 text-amber-600" />
          <span>08. Maintenance & Base de Données</span>
        </button>
      </div>

      {/* Status Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${
            statusMessage.isError
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {statusMessage.isError ? (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}


      {/* TAB 00.5: UTILISATEURS & ROLES */}
      {activeTab === 'users_roles' && <UtilisateursView />}

      {/* TAB 01: MODULES APPLICATIFS GLOBAUX */}
      {activeTab === 'modules' && (
        <div className="space-y-6">
          <MaintenanceModeCard />

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-600" />
                  Matrice de Contrôle des Modules Applicatifs Globaux
                </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Les modules désactivés par l'Intégrateur sont immédiatement masqués du menu de navigation pour l'ensemble des utilisateurs.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {modulesList.map((m) => {
              const Icon = m.icon;
              const isEnabled = modulesActifsState[m.key];
              return (
                <div
                  key={m.key}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                    isEnabled
                      ? 'bg-slate-50 border-slate-300 shadow-xs'
                      : 'bg-slate-100/60 border-slate-200 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
                        <Icon className="w-5 h-5" />
                      </div>

                      <button
                        onClick={() => handleToggleModule(m.key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                          isEnabled
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-300 text-slate-700'
                        }`}
                      >
                        {isEnabled ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Module Actif</span>
                          </>
                        ) : (
                          <span>Désactivé</span>
                        )}
                      </button>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{m.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      )}

      {/* TAB 02: HABILITATIONS FINE PAR RÔLE (MATRICE RBAC) */}
      {activeTab === 'rbac_matrix' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <LockKeyhole className="w-5 h-5 text-amber-600" />
                Matrice des Habilitations & Permissions par Rôle (RBAC)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Restreignez l'accès aux fonctionnalités sensibles (Comptabilité, Trésorerie, Décaissements, Budget) pour chaque profil d'utilisateur.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkPermissions(selectedRole.id, true)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tout Accorder</span>
              </button>

              <button
                onClick={() => handleBulkPermissions(selectedRole.id, false)}
                aria-label="Tout Révoquer les permissions"
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 text-rose-600" />
                <span>Tout Révoquer</span>
              </button>
            </div>
          </div>

          {/* Role Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {roles.map((r) => {
              const isSelected = selectedRole.code === r.code;
              const countPerms = r.permissions.length;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoleCode(r.code)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-amber-400 shadow-md ring-2 ring-amber-500/50'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{r.label}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${isSelected ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-200 text-slate-700'}`}>
                    {countPerms}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Role Summary Header */}
          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-amber-900 text-sm">{selectedRole.label}</span>
                <span className="px-2 py-0.5 bg-slate-900 text-amber-400 font-mono font-bold rounded text-[10px]">
                  Code: {selectedRole.code}
                </span>
                {selectedRole.isSystem && (
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-semibold rounded text-[10px]">
                    Rôle Système
                  </span>
                )}
              </div>
              <p className="text-slate-600 mt-1">{selectedRole.description}</p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-slate-500 font-medium block">Taux d'accès :</span>
              <span className="text-base font-black text-amber-800 font-mono">
                {selectedRole.permissions.length} / {allPermissions.length} prérogatives ({Math.round((selectedRole.permissions.length / allPermissions.length) * 100)}%)
              </span>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrer une permission (ex: comptabilité, trésorerie, caisse, budget)..."
                value={permissionSearchTerm}
                onChange={(e) => setPermissionSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <select
              value={permissionModuleFilter}
              onChange={(e) => setPermissionModuleFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 w-full sm:w-auto"
            >
              <option value="all">📁 Tous les modules ({allPermissions.length})</option>
              {allModulesList.map((mod) => (
                <option key={mod} value={mod}>
                  {mod}
                </option>
              ))}
            </select>
          </div>

          {/* Permissions Toggle Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-slate-200 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <th className="p-3.5 w-16 text-center">Accès</th>
                  <th className="p-3.5">Permission / Fonctionnalité</th>
                  <th className="p-3.5">Module</th>
                  <th className="p-3.5">Description & Portée</th>
                  <th className="p-3.5 w-24 text-center">Code Clé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredPermissions.map((perm) => {
                  const isGranted = selectedRole.permissions.includes(perm.key);
                  return (
                    <tr
                      key={perm.key}
                      onClick={() => handleToggleRolePermission(selectedRole.id, perm.key)}
                      className={`hover:bg-amber-50/40 transition cursor-pointer ${
                        isGranted ? 'bg-white' : 'bg-slate-50/50 text-slate-400'
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isGranted}
                          onChange={() => {}} // Handled by tr onClick
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                        />
                      </td>

                      <td className="p-3.5">
                        <div className={`font-bold ${isGranted ? 'text-slate-900' : 'text-slate-500'}`}>
                          {perm.label}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {perm.module}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-500 text-[11px] leading-relaxed">
                        {perm.description}
                      </td>

                      <td className="p-3.5 text-center font-mono text-[10px] text-slate-400">
                        {perm.key}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 03: WORKFLOW DE VALIDATION */}
      {activeTab === 'workflow' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              Workflow de Validation à Deux Niveaux
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Activez une double validation pour les transactions sortantes dépassant un montant seuil défini.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Activer le workflow double niveau</h4>
                <p className="text-xs text-slate-500">Exige une validation par deux responsables différents.</p>
              </div>
              <button
                onClick={() => {
                  const currentWorkflow = formData.validationWorkflow || { deuxNiveauxActive: false, seuilMontantValidationDZD: 0 };
                  const newValue = !currentWorkflow.deuxNiveauxActive;
                  const updatedWorkflow = { ...currentWorkflow, deuxNiveauxActive: newValue };
                  setFormData((prev) => ({ ...prev, validationWorkflow: updatedWorkflow }));
                  updateAppSettings({ validationWorkflow: updatedWorkflow });
                }}
                className={`p-2 rounded-xl transition ${
                  (formData.validationWorkflow?.deuxNiveauxActive) ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                }`}
              >
                {(formData.validationWorkflow?.deuxNiveauxActive) ? <Check className="w-5 h-5" /> : <div className="w-5 h-5" />}
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <label className="text-xs font-semibold text-slate-600">Seuil de montant pour déclenchement (DZD):</label>
              <input
                type="number"
                value={formData.validationWorkflow.seuilMontantValidationDZD}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const updatedWorkflow = { ...formData.validationWorkflow, seuilMontantValidationDZD: val };
                  setFormData((prev) => ({ ...prev, validationWorkflow: updatedWorkflow }));
                  updateAppSettings({ validationWorkflow: updatedWorkflow });
                }}
                className="w-full mt-2 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
              />
            </div>
          </div>
        </div>
      )}
      {/* TAB 04: SAUVEGARDES & RESTAURATION CLOUD EXTERNE */}
      {activeTab === 'backup_cloud' && <BackupManagementView />}

      {/* TAB 08: JOURNAL D'AUDIT SYSTÈME & LOGS */}
      {activeTab === 'audit' && <LogsAuditView />}

      {/* TAB 08: MAINTENANCE SYSTÈME & BASE DE DONNÉES */}
      {activeTab === 'maintenance' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-600" />
              Maintenance Système & Réinitialisation Usine
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              En cas de besoin de réinitialisation usine ou de dépannage, réinitialisez l'intégralité de la base de données applicative.
            </p>
          </div>

          <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
            <h4 className="text-sm font-bold text-rose-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Réinitialisation Usine Intégrale
            </h4>
            <p className="text-xs text-rose-800 leading-relaxed">
              Attention : Cette action efface toutes les transactions enregistrées, re-génère le jeu de démonstration usine et réinitialise les rôles et utilisateurs à leur état initial.
            </p>

            <button
              onClick={() => {
                if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes les données système aux paramètres d\'usine ?')) {
                  resetToInitialData();
                  setStatusMessage({ text: 'Système réinitialisé aux données d\'usine.' });
                }
              }}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Exécuter la Réinitialisation Usine</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
