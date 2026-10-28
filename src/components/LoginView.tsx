import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Utilisateur } from '../types';
import {
  checkAuthRateLimit,
  recordFailedAuthAttempt,
  resetAuthRateLimit,
  verifyUserCredentials,
} from '../utils/security';
import { 
  Building2, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  HardHat, 
  ChevronRight,
  Sparkles,
  Zap,
  Building,
  CheckCircle2,
  ShieldAlert,
  AlertOctagon,
  Clock
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { t, utilisateurs, setCurrentUser, logAudit, getRoleLabel, chantiers } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'chantier_roles'>('all');
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Monitor Rate Limiting Lockout
  useEffect(() => {
    const rateStatus = checkAuthRateLimit(email || 'default');
    if (rateStatus.isLocked) {
      setLockoutSeconds(rateStatus.remainingSeconds);
    }
  }, [email]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          setError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const targetEmail = email.trim();

    // Check rate limit before proceeding
    const rateStatus = checkAuthRateLimit(targetEmail);
    if (rateStatus.isLocked) {
      setLockoutSeconds(rateStatus.remainingSeconds);
      setError(`Sécurité anti-intrusion : Compte verrouillé suite à 5 tentatives infructueuses. Patientez ${rateStatus.remainingSeconds}s.`);
      setIsLoading(false);
      return;
    }

    const user = utilisateurs.find((u) => u.email.toLowerCase() === targetEmail.toLowerCase());

    setTimeout(() => {
      // User must exist, be active, and password must match
      if (user) {
        if (user.statut !== 'actif') {
          setError('Ce compte collaborateur est désactivé ou suspendu. Contactez votre administrateur.');
          setIsLoading(false);
          logAudit({
            utilisateurNom: user.nom,
            utilisateurRole: user.role,
            action: 'securite_alerte',
            module: 'securite',
            entiteReference: `AUTH-BLOCKED-${user.id}`,
            details: `Tentative de connexion sur un compte inactif/suspendu (${user.email})`,
          });
          return;
        }

        const isPasswordCorrect = verifyUserCredentials(user, password);

        if (isPasswordCorrect) {
          resetAuthRateLimit(targetEmail);
          setCurrentUser(user);
          logAudit({
            utilisateurNom: user.nom,
            utilisateurRole: user.role,
            action: 'validation',
            module: 'securite',
            entiteReference: 'LOGIN-SUCCESS',
            details: `Connexion authentifiée réussie de ${user.nom} (${getRoleLabel(user.role)})`,
          });
        } else {
          const failRecord = recordFailedAuthAttempt(targetEmail);
          if (failRecord.isNowLocked) {
            setLockoutSeconds(failRecord.lockoutDurationSec);
            setError(`Compte verrouillé pour 60 secondes suite à 5 échecs consécutifs d'authentification.`);
            logAudit({
              utilisateurNom: user.nom,
              utilisateurRole: user.role,
              action: 'securite_alerte',
              module: 'securite',
              entiteReference: 'BRUTE-FORCE-LOCKOUT',
              details: `Seuil d'échecs de mot de passe dépassé (5 tentatives). Verrouillage temporaire activé pour ${targetEmail}.`,
            });
          } else {
            setError(`Mot de passe incorrect. ${failRecord.attemptsLeft} tentative(s) restante(s).`);
          }
          setIsLoading(false);
        }
      } else {
        // Unknown user: record attempt to prevent username enumeration brute force
        const failRecord = recordFailedAuthAttempt(targetEmail || 'unknown');
        if (failRecord.isNowLocked) {
          setLockoutSeconds(failRecord.lockoutDurationSec);
          setError(`Accès temporairement bloqué pendant 60 secondes suite à de multiples tentatives erronées.`);
        } else {
          setError(t.identifiantsIncorrects);
        }
        setIsLoading(false);
      }
    }, 450);
  };

  // Direct 1-click login for demonstration
  const handleDirectConnect = (user: Utilisateur) => {
    setIsLoading(true);
    setEmail(user.email);
    setPassword('demo2026');
    resetAuthRateLimit(user.email);
    setTimeout(() => {
      setCurrentUser(user);
      logAudit({
        utilisateurNom: user.nom,
        utilisateurRole: user.role,
        action: 'validation',
        module: 'securite',
        entiteReference: 'LOGIN_DEMO',
        details: `Connexion directe démo autorisée : ${user.nom} (${getRoleLabel(user.role)})`,
      });
    }, 250);
  };

  const handleFillInputs = (e: React.MouseEvent, user: Utilisateur) => {
    e.stopPropagation();
    setEmail(user.email);
    setPassword(user.role === 'superadmin' ? '2026' : 'demo2026');
    setError('');
  };

  const handleIntegrateurFill = () => {
    const superAdminAcc = utilisateurs.find((u) => u.role === 'superadmin');
    if (superAdminAcc) {
      setEmail(superAdminAcc.email);
      setPassword('2026');
      setError('');
    }
  };

  const getChantierNom = (id: string) => {
    return chantiers.find((c) => c.id === id)?.nom || id;
  };

  // Exclude Intégrateur (superadmin) from regular business user lists
  const displayedUsers = (activeFilter === 'chantier_roles'
    ? utilisateurs.filter((u) => u.rolesParChantier && u.rolesParChantier.length > 0)
    : utilisateurs
  ).filter((u) => u.role !== 'superadmin');

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-3 sm:p-5 font-sans select-none overflow-y-auto relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 relative z-10 my-4 max-h-[94vh]">
        
        {/* Left Side: Branding & Info */}
        <div className="md:col-span-5 bg-slate-900 p-6 md:p-10 text-white flex flex-col justify-between relative overflow-y-auto">
          {/* Pattern Overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <HardHat className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight leading-none uppercase">{t.appName}</h1>
                <p className="text-[9px] text-amber-400 font-bold tracking-widest mt-1 uppercase">{t.appTagline}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black leading-tight tracking-tight">
                Solution Intégrée de Gestion Immobilière & Travaux
              </h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                Plateforme conforme à la réglementation algérienne (Loi 11-04 VSP, RPA 99/2003, Trésorerie en Dinar Algérien DZD).
              </p>

              <div className="space-y-2.5 pt-2">
                {[
                  "Suivi multi-chantiers en temps réel",
                  "Gestion des rôles & habilitations par chantier",
                  "Contrôle des caisses de fond de roulement",
                  "Gestion des encaissements VSP (Loi 11-04)",
                  "Audit & Contrôle interne certifié"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Notice on Roles par Chantier */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs mt-4">
                <div className="flex items-center gap-2 text-amber-300 font-bold mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Gestion des Rôles par Chantier Active</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Un collaborateur peut exercer un rôle différent selon le chantier sélectionné (ex: Responsable Chantier à Chéraga et Chef de Projet à Oran).
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest border-t border-slate-800/80 mt-6">
            <span>© 2026 BATIPROMOTE DZ</span>
            <span>V2.4.0 STABLE</span>
          </div>
        </div>

        {/* Right Side: Login Form + Enhanced Quick Access */}
        <div className="md:col-span-7 p-6 md:p-8 flex flex-col justify-start overflow-y-auto">
          <div className="mb-5">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{t.authentification}</h3>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">{t.bienvenue}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider ml-1">
                {t.identifiant}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                  placeholder="nom@batipromote-dz.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  {t.motDePasse}
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  (démo: <strong className="text-amber-600">demo2026</strong>)
                </span>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {lockoutSeconds > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-2.5 animate-pulse">
                <div className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] font-bold text-amber-900 leading-tight">
                  Verrouillage de sécurité actif : veuillez patienter <span className="font-mono text-xs font-black text-rose-700">{lockoutSeconds}s</span> avant une nouvelle tentative.
                </div>
              </div>
            )}

            {error && lockoutSeconds === 0 && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <XCircleIcon className="w-3 h-3" />
                </div>
                <span className="text-[11px] font-bold text-rose-700">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || lockoutSeconds > 0}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md shadow-slate-900/10 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : lockoutSeconds > 0 ? (
                <div className="flex items-center gap-2 text-amber-300 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Verrouillé ({lockoutSeconds}s)</span>
                </div>
              ) : (
                <>
                  <span>{t.seConnecter}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-amber-400" />
                </>
              )}
            </button>
          </form>

          {/* Accès Rapide Démonstration */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Accès Rapide Démonstration
                </p>
                <p className="text-[10px] text-slate-500">
                  Cliquez sur un profil pour vous connecter en 1-clic avec ses habilitations
                </p>
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    activeFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Tous ({utilisateurs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('chantier_roles')}
                  className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 ${
                    activeFilter === 'chantier_roles'
                      ? 'bg-amber-400 text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Utilisateurs ayant des rôles spécifiques par chantier"
                >
                  <span>Multi-Chantiers</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                </button>
              </div>
            </div>

            <div className="max-h-[320px] overflow-y-auto pr-1.5 space-y-2.5">
              <div className="grid grid-cols-1 gap-2.5">
                {displayedUsers.map((u) => {
                  const hasSiteRoles = u.rolesParChantier && u.rolesParChantier.length > 0;
                  const isSelected = email.toLowerCase() === u.email.toLowerCase();

                  return (
                    <div
                      key={u.id}
                      onClick={() => handleDirectConnect(u)}
                      className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between group cursor-pointer relative ${
                        isSelected
                          ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/20 shadow-xs'
                          : hasSiteRoles
                          ? 'bg-slate-50/90 border-slate-200 hover:border-amber-300 hover:bg-amber-50/40'
                          : 'bg-slate-50/70 border-slate-200/90 hover:border-slate-300 hover:bg-slate-100/60'
                      }`}
                    >
                    <div>
                      {/* Top line: Name + Role Badge */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            u.role === 'superadmin' 
                              ? 'bg-rose-100 text-rose-700' 
                              : u.role === 'directeur_promoteur'
                              ? 'bg-amber-100 text-amber-800'
                              : u.role === 'responsable_chantier' || u.role === 'chef_projet'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {u.nom.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-slate-900 block truncate group-hover:text-amber-900">
                              {u.nom}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 block truncate">
                              {getRoleLabel(u.role)}
                            </span>
                          </div>
                        </div>

                        {/* Quick 1-Click Action Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDirectConnect(u);
                          }}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-2xs opacity-90 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 cursor-pointer"
                          title="Connexion directe 1-clic"
                        >
                          <Zap className="w-3 h-3" />
                          <span>1-Clic</span>
                        </button>
                      </div>

                      {/* Display rolesParChantier if user has specific site assignments */}
                      {hasSiteRoles && (
                        <div className="mt-2 pt-2 border-t border-slate-200/80 space-y-1.5">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-900 uppercase tracking-tight">
                            <Building className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Rôles spécifiques par chantier :</span>
                          </div>
                          <div className="space-y-1">
                            {u.rolesParChantier!.map((rc, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-[10px] px-2 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs"
                                title={`${getChantierNom(rc.chantierId)} : ${getRoleLabel(rc.role)}`}
                              >
                                <span className="font-bold text-amber-800 truncate pr-2">
                                  🏢 {getChantierNom(rc.chantierId)}
                                </span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-slate-400">→</span>
                                  <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {getRoleLabel(rc.role)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Line: Email hint & fill option */}
                    <div className="mt-2.5 pt-1.5 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100">
                      <span className="truncate max-w-[180px] font-mono text-slate-500">{u.email}</span>
                      <button
                        type="button"
                        onClick={(e) => handleFillInputs(e, u)}
                        className="text-amber-700 hover:text-amber-900 underline font-semibold cursor-pointer"
                      >
                        Préremplir
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>

              {/* Discrete Integrator Portal access */}
              <div className="mt-4 pt-3 border-t border-dashed border-slate-200 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1.5 text-[10px]">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                  Portail Technique Plateforme
                </span>
                <button
                  type="button"
                  onClick={handleIntegrateurFill}
                  className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  title="Préremplir les identifiants de l'Intégrateur pour la configuration technique"
                >
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>Accès Intégrateur Système</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const XCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

