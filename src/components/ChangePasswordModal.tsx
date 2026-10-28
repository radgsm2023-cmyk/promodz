import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { currentUser, changerMotDePasse } = useApp();

  const [ancienMdp, setAncienMdp] = useState('');
  const [nouveauMdp, setNouveauMdp] = useState('');
  const [confirmationMdp, setConfirmationMdp] = useState('');

  const [showAncien, setShowAncien] = useState(false);
  const [showNouveau, setShowNouveau] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleResetForm = () => {
    setAncienMdp('');
    setNouveauMdp('');
    setConfirmationMdp('');
    setFeedback(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!ancienMdp) {
      setFeedback({ type: 'error', message: 'Veuillez saisir votre mot de passe actuel.' });
      return;
    }

    if (!nouveauMdp || nouveauMdp.trim().length < 4) {
      setFeedback({ type: 'error', message: 'Le nouveau mot de passe doit comporter au moins 4 caractères.' });
      return;
    }

    if (nouveauMdp !== confirmationMdp) {
      setFeedback({ type: 'error', message: 'Le nouveau mot de passe et sa confirmation ne correspondent pas.' });
      return;
    }

    if (ancienMdp === nouveauMdp) {
      setFeedback({ type: 'error', message: 'Le nouveau mot de passe doit être différent de l\'ancien.' });
      return;
    }

    setIsSubmitting(true);

    const result = changerMotDePasse(ancienMdp, nouveauMdp);

    setIsSubmitting(false);

    if (result.success) {
      setFeedback({ type: 'success', message: result.message });
      setTimeout(() => {
        handleClose();
      }, 1500);
    } else {
      setFeedback({ type: 'error', message: result.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-400/20 text-amber-400 border border-amber-400/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Changer mon mot de passe</h3>
              <p className="text-xs text-slate-400">Compte : {currentUser?.nom} ({currentUser?.email})</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {feedback && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Ancien mot de passe */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Mot de passe actuel</span>
              <span className="text-[10px] font-normal text-slate-400">Obligatoire</span>
            </label>
            <div className="relative">
              <input
                type={showAncien ? 'text' : 'password'}
                value={ancienMdp}
                onChange={(e) => setAncienMdp(e.target.value)}
                placeholder="Saisissez votre mot de passe actuel"
                className="w-full pl-3 pr-10 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
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
              Nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={showNouveau ? 'text' : 'password'}
                value={nouveauMdp}
                onChange={(e) => setNouveauMdp(e.target.value)}
                placeholder="Au moins 4 caractères"
                className="w-full pl-3 pr-10 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
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

          {/* Confirmer le nouveau mot de passe */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Confirmer le nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={showConfirmation ? 'text' : 'password'}
                value={confirmationMdp}
                onChange={(e) => setConfirmationMdp(e.target.value)}
                placeholder="Répétez le nouveau mot de passe"
                className="w-full pl-3 pr-10 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
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

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Enregistrement...' : 'Mettre à jour le mot de passe'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
