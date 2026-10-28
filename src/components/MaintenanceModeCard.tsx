import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, Wrench, AlertTriangle, CheckCircle, Save, Power, UserCheck, MessageSquare } from 'lucide-react';

export const MaintenanceModeCard: React.FC = () => {
  const { appSettings, updateAppSettings, currentUser, logAudit } = useApp();

  const currentMaintenance = appSettings.modeMaintenance || {
    actif: false,
    messageCustom: 'Application BatiPromote DZ en cours de maintenance corrective et de mise à jour des modules. L\'accès est momentanément restreint. Reprise estimée sous peu.',
    autoriserAdminsOnly: true,
  };

  const [actif, setActif] = useState(currentMaintenance.actif);
  const [messageCustom, setMessageCustom] = useState(currentMaintenance.messageCustom);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const handleToggle = (newActifState: boolean) => {
    const updated = {
      actif: newActifState,
      messageCustom: messageCustom.trim() || 'Application en maintenance technique. L\'accès public est temporairement suspendu.',
      dateDebut: newActifState ? new Date().toISOString() : undefined,
      activeParNom: currentUser.nom,
      activeParRole: currentUser.role,
      autoriserAdminsOnly: true,
    };

    setActif(newActifState);
    updateAppSettings({ modeMaintenance: updated });

    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: newActifState ? 'cloture' : 'deverrouillage',
      module: 'settings',
      entiteReference: 'MODE-MAINTENANCE',
      details: `${newActifState ? 'ACTIVATION' : 'DÉSACTIVATION'} du Mode Maintenance Système par ${currentUser.nom}. Message: "${updated.messageCustom}"`,
    });

    setStatusMessage({
      text: newActifState
        ? 'Mode Maintenance ACTIVÉ ! L\'accès est désormais restreint aux seuls administrateurs.'
        : 'Mode Maintenance DÉSACTIVÉ ! L\'accès est rétabli pour l\'ensemble des utilisateurs.',
    });

    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleSaveMessageOnly = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...currentMaintenance,
      actif,
      messageCustom: messageCustom.trim(),
    };

    updateAppSettings({ modeMaintenance: updated });

    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'modification',
      module: 'settings',
      entiteReference: 'MSG-MAINTENANCE',
      details: `Mise à jour du message d'information du Mode Maintenance : "${messageCustom}"`,
    });

    setStatusMessage({ text: 'Message d\'information de maintenance mis à jour avec succès.' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${actif ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Mode Maintenance & Restriction d'Accès</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                actif ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {actif ? '🔴 Maintenance Active' : '🟢 Application en Ligne'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Restreint l'accès à l'application pour les utilisateurs non-admins durant les mises à jour ou interventions techniques.
            </p>
          </div>
        </div>

        {/* Big Switch Button */}
        <button
          onClick={() => handleToggle(!actif)}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer ${
            actif
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-rose-600 hover:bg-rose-500 text-white'
          }`}
        >
          <Power className="w-4 h-4" />
          <span>{actif ? 'Désactiver le Mode Maintenance' : 'Activer le Mode Maintenance'}</span>
        </button>
      </div>

      {/* Status Feedback Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2.5 animate-fade-in ${
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

      {/* Form for Custom Message */}
      <form onSubmit={handleSaveMessageOnly} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-amber-600" />
            <span>Message Personnalisé Affiché aux Utilisateurs Bloqués</span>
          </label>
          <textarea
            rows={3}
            value={messageCustom}
            onChange={(e) => setMessageCustom(e.target.value)}
            placeholder="Saisissez ici le motif et l'heure estimée de reprise (ex: Intervention technique sur le serveur BatiPromote DZ. Reprise estimée à 14h00)..."
            className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden leading-relaxed"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-slate-700 shrink-0" />
            <span>
              <strong>Comptes Autorisés pendant la maintenance :</strong> SuperAdmin Système (`superadmin`) & Directeur Général (`directeur_promoteur`).
            </span>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Enregistrer le Message</span>
          </button>
        </div>
      </form>
    </div>
  );
};
