import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Wrench, ShieldAlert, Key, User, Lock, ArrowRight, RefreshCw, CheckCircle, Shield } from 'lucide-react';

export const MaintenanceLockScreen: React.FC = () => {
  const { appSettings, currentUser, utilisateurs, setCurrentUser, updateAppSettings, logAudit } = useApp();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const currentMaintenance = appSettings.modeMaintenance || {
    actif: true,
    messageCustom: 'Application BatiPromote DZ en cours de maintenance corrective et de mise à jour des modules. L\'accès est momentanément restreint. Reprise estimée sous peu.',
    autoriserAdminsOnly: true,
    dateDebut: undefined,
    activeParNom: undefined,
    activeParRole: undefined,
  };

  const adminUsers = utilisateurs.filter(
    (u) => u.role === 'superadmin' || u.role === 'directeur_promoteur'
  );

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const targetUser = adminUsers.find((u) => u.id === selectedAdminId) || adminUsers[0];
    if (!targetUser) return;

    if (pinCode === '2026' || pinCode === 'admin' || pinCode === 'superadmin2026') {
      setCurrentUser(targetUser);
      logAudit({
        utilisateurNom: targetUser.nom,
        utilisateurRole: targetUser.role,
        action: 'validation',
        module: 'settings',
        entiteReference: 'LOGIN-MAINTENANCE-BYPASS',
        details: `Connexion d'urgence Administrateur depuis l'écran de maintenance.`,
      });
      setShowAdminLogin(false);
    } else {
      setErrorMsg('Code PIN Administrateur invalide (Ex: 2026).');
    }
  };

  const handleQuickSwitchSuperAdmin = () => {
    const superAdminUser = utilisateurs.find((u) => u.role === 'superadmin') || adminUsers[0];
    if (superAdminUser) {
      setCurrentUser(superAdminUser);
      logAudit({
        utilisateurNom: superAdminUser.nom,
        utilisateurRole: superAdminUser.role,
        action: 'validation',
        module: 'settings',
        entiteReference: 'SWITCH-SUPERADMIN-MAINTENANCE',
        details: `Changement de compte vers SuperAdmin pendant la maintenance.`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6 text-center">
        {/* Top Icon Header */}
        <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-amber-500/10">
          <Wrench className="w-10 h-10 text-slate-950 animate-bounce" />
        </div>

        {/* Title */}
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold rounded-full uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" /> Maintenance Technique en Cours
          </span>
          <h1 className="text-2xl font-black mt-3 tracking-tight text-white">
            BatiPromote DZ — Accès Momentanément Restreint
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Système de Gestion Immobilière & Suivi des Chantiers
          </p>
        </div>

        {/* Custom Message Card */}
        <div className="p-5 bg-slate-950/80 border border-amber-500/30 rounded-2xl text-left space-y-2 relative overflow-hidden shadow-inner">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-400 uppercase tracking-wider">
            <span>Note d'Information Direction :</span>
            <span className="font-mono text-slate-500 text-[10px]">
              {currentMaintenance.dateDebut ? new Date(currentMaintenance.dateDebut).toLocaleDateString('fr-FR') : 'Aujourd\'hui'}
            </span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            "{currentMaintenance.messageCustom}"
          </p>
          {currentMaintenance.activeParNom && (
            <div className="pt-2 text-[10px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-900">
              <span>Initiée par : {currentMaintenance.activeParNom}</span>
              <span>Rôle : {currentMaintenance.activeParRole || 'Administration'}</span>
            </div>
          )}
        </div>

        {/* Current User Info */}
        <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-500" />
            <span>Compte connecté : <strong>{currentUser.nom}</strong> ({currentUser.role})</span>
          </div>
          <span className="text-[10px] text-rose-400 font-bold px-2 py-0.5 bg-rose-950/50 border border-rose-800 rounded">Accès Bloqué</span>
        </div>

        {/* Admin Login / Bypass Actions */}
        <div className="pt-2 space-y-3">
          {!showAdminLogin ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowAdminLogin(true)}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Key className="w-4 h-4" />
                <span>Accès Administrateur / SuperAdmin</span>
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Actualiser la Page</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleAdminLogin} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-left animate-fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                <span>Authentification Administrateur</span>
                <button
                  type="button"
                  onClick={() => setShowAdminLogin(false)}
                  className="text-slate-500 hover:text-slate-300 text-[11px]"
                >
                  Fermer
                </button>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-lg font-bold">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                  Sélectionner un Compte Administrateur
                </label>
                <select
                  value={selectedAdminId}
                  onChange={(e) => setSelectedAdminId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  <option value="">-- Choisir un administrateur --</option>
                  {adminUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nom} ({u.role === 'superadmin' ? 'SuperAdmin' : 'Directeur Général'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                  Mot de passe / Code PIN (ex: 2026)
                </label>
                <input
                  type="password"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="Code PIN (Ex: 2026)"
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 text-white rounded-xl font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleQuickSwitchSuperAdmin}
                  className="text-[11px] text-amber-400 hover:underline font-bold"
                >
                  Basculer directement en SuperAdmin
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Déverrouiller</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Note */}
        <div className="pt-4 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-600">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-amber-400" /> BatiPromote DZ v2026.10
          </span>
          <span>Support Technique Siège</span>
        </div>
      </div>
    </div>
  );
};
