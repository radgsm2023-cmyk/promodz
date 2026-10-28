import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  KeyRound,
  ShieldCheck,
  Mail,
  Phone,
  Building,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Calendar,
  Clock,
  Shield,
  Save,
  Sparkles,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    updateUtilisateur,
    changerMotDePasse,
    getRoleLabel,
    effectiveRole,
    roles,
    allPermissions,
    chantiers,
  } = useApp();

  // Navigation subtab inside profile
  const [activeTab, setActiveTab] = useState<'info' | 'securite' | 'permissions'>('info');

  // Form State - Personal Info
  const [nom, setNom] = useState(currentUser.nom || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [telephone, setTelephone] = useState(currentUser.telephone || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');

  const [infoFeedback, setInfoFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State - Password Change
  const [ancienMdp, setAncienMdp] = useState('');
  const [nouveauMdp, setNouveauMdp] = useState('');
  const [confirmationMdp, setConfirmationMdp] = useState('');

  const [showAncien, setShowAncien] = useState(false);
  const [showNouveau, setShowNouveau] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [pwdFeedback, setPwdFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmittingPwd, setIsSubmittingPwd] = useState(false);

  // Current role definition & permissions
  const userRoleDef = roles.find((r) => r.code === effectiveRole);
  const userPermissions = userRoleDef ? userRoleDef.permissions : [];

  const assignedChantiersList = currentUser.chantiersAssignes.includes('*')
    ? 'Accès Global à tous les chantiers'
    : chantiers
        .filter((c) => currentUser.chantiersAssignes.includes(c.id))
        .map((c) => c.nom)
        .join(', ') || 'Aucun chantier assigné';

  // Handle Save Personal Info
  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setInfoFeedback(null);

    if (!nom.trim()) {
      setInfoFeedback({ type: 'error', message: 'Le nom ne peut pas être vide.' });
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setInfoFeedback({ type: 'error', message: 'Veuillez saisir un e-mail valide.' });
      return;
    }

    updateUtilisateur(currentUser.id, {
      nom: nom.trim(),
      email: email.trim(),
      telephone: telephone.trim(),
      avatar: avatar.trim() || undefined,
    });

    setInfoFeedback({ type: 'success', message: 'Informations personnelles mises à jour avec succès.' });
    setTimeout(() => setInfoFeedback(null), 3500);
  };

  // Handle Change Password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdFeedback(null);

    if (!ancienMdp) {
      setPwdFeedback({ type: 'error', message: 'Veuillez saisir votre mot de passe actuel.' });
      return;
    }

    if (!nouveauMdp || nouveauMdp.trim().length < 4) {
      setPwdFeedback({ type: 'error', message: 'Le nouveau mot de passe doit comporter au moins 4 caractères.' });
      return;
    }

    if (nouveauMdp !== confirmationMdp) {
      setPwdFeedback({ type: 'error', message: 'Le nouveau mot de passe et sa confirmation ne correspondent pas.' });
      return;
    }

    if (ancienMdp === nouveauMdp) {
      setPwdFeedback({ type: 'error', message: 'Le nouveau mot de passe doit être différent de l\'ancien.' });
      return;
    }

    setIsSubmittingPwd(true);

    const result = changerMotDePasse(ancienMdp, nouveauMdp);

    setIsSubmittingPwd(false);

    if (result.success) {
      setPwdFeedback({ type: 'success', message: result.message });
      setAncienMdp('');
      setNouveauMdp('');
      setConfirmationMdp('');
      setTimeout(() => setPwdFeedback(null), 4000);
    } else {
      setPwdFeedback({ type: 'error', message: result.message });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Profile Header Hero Card */}
      <div className="p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            {/* Avatar / Initials */}
            <div className="relative">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.nom}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-2xl border-2 border-amber-300 shadow-md">
                  {currentUser.nom.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-slate-900 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </span>
            </div>

            {/* User Title & Badges */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-white tracking-tight">{currentUser.nom}</h1>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {getRoleLabel(effectiveRole)}
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Compte Actif
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-300 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {currentUser.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {currentUser.telephone || 'Non renseigné'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs space-y-1 self-stretch sm:self-auto shrink-0 min-w-[200px]">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400 text-[11px]">Chantiers :</span>
              <span className="font-bold text-amber-400 truncate max-w-[120px]">{assignedChantiersList}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400 text-[11px]">Dernier accès :</span>
              <span className="font-mono text-[10px] text-slate-300">{currentUser.dernierAcces || 'Aujourd\'hui'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'info'
              ? 'bg-amber-400 text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Informations Personnelles</span>
        </button>

        <button
          onClick={() => setActiveTab('securite')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'securite'
              ? 'bg-amber-400 text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Sécurité & Mot de Passe</span>
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'permissions'
              ? 'bg-amber-400 text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Mes Habilitations & Rôle</span>
        </button>
      </div>

      {/* Tab 1: Informations Personnelles */}
      {activeTab === 'info' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Modifier mes informations personnelles
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mettez à jour vos coordonnées de contact pour les notifications et tickets de chantier.
              </p>
            </div>
            <User className="w-5 h-5 text-amber-500" />
          </div>

          {infoFeedback && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
                infoFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {infoFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{infoFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handleSaveInfo} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nom Complet *</label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Adresse E-mail *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Numéro de Téléphone</label>
                <input
                  type="text"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="+213 (0) 550 00 00 00"
                  className="w-full mt-1 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Lien Photo d'Avatar (URL)</label>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://... (Laisser vide pour utiliser les initiales)"
                  className="w-full mt-1 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer les modifications</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Sécurité & Changement de Mot de Passe */}
      {activeTab === 'securite' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" />
                Changer mon mot de passe
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Saisissez votre mot de passe actuel puis choisissez votre nouveau mot de passe sécurisé.
              </p>
            </div>
            <KeyRound className="w-5 h-5 text-amber-500" />
          </div>

          {pwdFeedback && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2.5 ${
                pwdFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {pwdFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{pwdFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
            {/* Ancien mot de passe */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Mot de passe actuel *
              </label>
              <div className="relative">
                <input
                  type={showAncien ? 'text' : 'password'}
                  value={ancienMdp}
                  onChange={(e) => setAncienMdp(e.target.value)}
                  placeholder="Saisissez votre mot de passe actuel"
                  className="w-full pl-3 pr-10 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowAncien(!showAncien)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showAncien ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Nouveau mot de passe */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Nouveau mot de passe *
              </label>
              <div className="relative">
                <input
                  type={showNouveau ? 'text' : 'password'}
                  value={nouveauMdp}
                  onChange={(e) => setNouveauMdp(e.target.value)}
                  placeholder="Au moins 4 caractères"
                  className="w-full pl-3 pr-10 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNouveau(!showNouveau)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showNouveau ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmation mot de passe */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Confirmer le nouveau mot de passe *
              </label>
              <div className="relative">
                <input
                  type={showConfirmation ? 'text' : 'password'}
                  value={confirmationMdp}
                  onChange={(e) => setConfirmationMdp(e.target.value)}
                  placeholder="Répétez le nouveau mot de passe"
                  className="w-full pl-3 pr-10 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmation(!showConfirmation)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showConfirmation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingPwd}
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSubmittingPwd ? 'Mise à jour...' : 'Changer mon mot de passe'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Rôles & Mes Habilitations (RBAC) */}
      {activeTab === 'permissions' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Mes Droits d'Accès & Habilitations Système (RBAC)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Synthèse des privilèges accordés à votre compte ({getRoleLabel(effectiveRole)}).
              </p>
            </div>
            <Shield className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase block">
                Rôle Principal
              </span>
              <p className="text-sm font-black text-amber-600 dark:text-amber-400">
                {getRoleLabel(effectiveRole)}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {userRoleDef?.description || 'Gestionnaire système BatiPromote DZ'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase block">
                Chantiers Habilités
              </span>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {assignedChantiersList}
              </p>
            </div>
          </div>

          {/* List of Permissions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Liste des Habilitations Activées ({userPermissions.length} droits)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {userPermissions.map((permKey) => {
                const permDef = allPermissions.find((p) => p.key === permKey);
                return (
                  <div
                    key={permKey}
                    className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block truncate">
                        {permDef?.label || permKey}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase">
                        Module: {permDef?.module || 'Système'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
