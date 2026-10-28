import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CompteBancaireEntreprise, AppSettings } from '../types';
import { formatDateTimeFR } from '../utils/formatters';
import {
  Building2,
  Wallet,
  HardHat,
  DatabaseBackup,
  Download,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Save,
  Plus,
  Trash2,
  Briefcase,
  Layers,
  ClipboardList,
  LockKeyhole,
} from 'lucide-react';
import { ClotureMensuelleView } from './ClotureMensuelleView';
import { MaintenanceModeCard } from './MaintenanceModeCard';
import { LogsAuditView } from './LogsAuditView';

export const BackupView: React.FC = () => {
  const {
    appSettings,
    updateAppSettings,
    journalAudit,
    exportDataJSON,
    importDataJSON,
    resetToInitialData,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'societe' | 'tresorerie' | 'vsp_chantiers' | 'rh_paie' | 'sauvegarde' | 'audit' | 'cloture_mensuelle'
  >('societe');

  const [formData, setFormData] = useState<AppSettings>({ ...appSettings });
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [importText, setImportText] = useState('');

  // Bank account form state
  const [newBankForm, setNewBankForm] = useState<{
    nomBanque: string;
    codeAgence: string;
    numeroCompteRIB: string;
    titulaire: string;
    devise: string;
  }>({
    nomBanque: '',
    codeAgence: '',
    numeroCompteRIB: '',
    titulaire: formData.raisonSociale || 'SARL BATIPROMOTE ALGÉRIE',
    devise: 'DZD',
  });
  const [showAddBank, setShowAddBank] = useState(false);

  // Save changes
  const handleSaveSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateAppSettings(formData);
    setStatusMessage({ text: 'Paramètres de l\'entreprise enregistrés avec succès !' });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Add Bank Account
  const handleAddBankAccount = () => {
    if (!newBankForm.nomBanque.trim() || !newBankForm.numeroCompteRIB.trim()) {
      setStatusMessage({ text: 'Veuillez saisir le nom de la banque et le numéro RIB.', isError: true });
      return;
    }

    const newAccount: CompteBancaireEntreprise = {
      id: `cpt-${Date.now().toString().slice(-4)}`,
      nomBanque: newBankForm.nomBanque.trim(),
      codeAgence: newBankForm.codeAgence.trim() || 'Agence Principale',
      numeroCompteRIB: newBankForm.numeroCompteRIB.trim(),
      titulaire: newBankForm.titulaire.trim() || formData.raisonSociale,
      devise: newBankForm.devise || 'DZD',
    };

    const updatedAccounts = [...formData.comptesBancaires, newAccount];
    setFormData((prev) => ({ ...prev, comptesBancaires: updatedAccounts }));
    updateAppSettings({ comptesBancaires: updatedAccounts });

    setNewBankForm({
      nomBanque: '',
      codeAgence: '',
      numeroCompteRIB: '',
      titulaire: formData.raisonSociale,
      devise: 'DZD',
    });
    setShowAddBank(false);
    setStatusMessage({ text: 'Compte bancaire RIB ajouté aux paramètres.' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleDeleteBankAccount = (id: string) => {
    const updatedAccounts = formData.comptesBancaires.filter((c) => c.id !== id);
    setFormData((prev) => ({ ...prev, comptesBancaires: updatedAccounts }));
    updateAppSettings({ comptesBancaires: updatedAccounts });
  };

  const handleExport = () => {
    const json = exportDataJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BATIPROMOTE_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const ok = importDataJSON(importText);
    if (ok) {
      setStatusMessage({ text: 'Base de données restaurée avec succès !' });
      setImportText('');
    } else {
      setStatusMessage({ text: 'Format de fichier JSON invalide.', isError: true });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Paramètres Entreprise & Direction
            </span>
            <span className="text-xs text-slate-400">Accès Réseau Admin Général</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Paramètres Entreprise & Modèles Opérationnels</h2>
          <p className="text-xs text-slate-400 mt-1">
            Identité juridique, coordonnées bancaires (RIB), règles VSP loi 11-04, taux de cotisation et sauvegardes JSON.
          </p>
        </div>

        <button
          onClick={() => handleSaveSettings()}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition shadow-md cursor-pointer self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>Enregistrer les Modifications</span>
        </button>
      </div>

      {/* Maintenance Mode Control Card */}
      <MaintenanceModeCard />

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

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('societe')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'societe'
              ? 'border-amber-500 text-amber-700 bg-amber-50/50 rounded-t-lg font-black'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4 text-amber-600" />
          <span>1. Identité Société & Agrément</span>
        </button>

        <button
          onClick={() => setActiveTab('tresorerie')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'tresorerie'
              ? 'border-amber-500 text-amber-700 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>2. RIBs & Comptes Bancaires</span>
        </button>

        <button
          onClick={() => setActiveTab('vsp_chantiers')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'vsp_chantiers'
              ? 'border-amber-500 text-amber-700 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>3. Modèles VSP & Échéanciers</span>
        </button>

        <button
          onClick={() => setActiveTab('rh_paie')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'rh_paie'
              ? 'border-amber-500 text-amber-700 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <HardHat className="w-4 h-4" />
          <span>4. RH & Cotisations Paie</span>
        </button>

        <button
          onClick={() => setActiveTab('sauvegarde')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'sauvegarde'
              ? 'border-amber-500 text-amber-700 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <DatabaseBackup className="w-4 h-4" />
          <span>5. Sauvegarde JSON & Export</span>
        </button>

        <button
          onClick={() => setActiveTab('cloture_mensuelle')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'cloture_mensuelle'
              ? 'border-amber-500 text-amber-700 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <LockKeyhole className="w-4 h-4 text-amber-600" />
          <span>6. Clôture Mensuelle & Verrou</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'audit'
              ? 'border-amber-500 text-amber-700 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>7. Journal d’Audit ({journalAudit.length})</span>
        </button>
      </div>

      {/* TAB 1: SOCIÉTÉ & LÉGAL */}
      {activeTab === 'societe' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-amber-600" />
            Identité Juridique & Mentions Légales de la Promotion
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Raison Sociale *</label>
              <input
                type="text"
                value={formData.raisonSociale}
                onChange={(e) => setFormData({ ...formData, raisonSociale: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Forme Juridique</label>
              <select
                value={formData.formeJuridique}
                onChange={(e) => setFormData({ ...formData, formeJuridique: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="SARL">SARL (Société à Responsabilité Limitée)</option>
                <option value="EURL">EURL (Entreprise Unipersonnelle)</option>
                <option value="SPA">SPA (Société Par Actions)</option>
                <option value="SNC">SNC (Société en Nom Collectif)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">N° Agrément Promoteur *</label>
              <input
                type="text"
                value={formData.agrementPromoteurNumero}
                onChange={(e) => setFormData({ ...formData, agrementPromoteurNumero: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">NIF (Identifiant Fiscal)</label>
              <input
                type="text"
                value={formData.nif}
                onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">NIS (Identifiant Statistique)</label>
              <input
                type="text"
                value={formData.nis}
                onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Registre du Commerce (RC)</label>
              <input
                type="text"
                value={formData.registreCommerceRC}
                onChange={(e) => setFormData({ ...formData, registreCommerceRC: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Adresse Siège Social</label>
              <input
                type="text"
                value={formData.siegeAdresse}
                onChange={(e) => setFormData({ ...formData, siegeAdresse: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Wilaya Siège</label>
              <input
                type="text"
                value={formData.siegeWilaya}
                onChange={(e) => setFormData({ ...formData, siegeWilaya: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Téléphone Contact</label>
              <input
                type="text"
                value={formData.telephoneSiege}
                onChange={(e) => setFormData({ ...formData, telephoneSiege: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Officiel</label>
              <input
                type="email"
                value={formData.emailDirection}
                onChange={(e) => setFormData({ ...formData, emailDirection: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRÉSORERIE & COMETES BANCAIRES RIB */}
      {activeTab === 'tresorerie' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-amber-600" />
                Comptes Bancaires Officiels & Numéros RIB
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Comptes bancaires professionnels utilisés pour la réception des versements acquéreurs VSP et les règlements de sous-traitance.
              </p>
            </div>

            <button
              onClick={() => setShowAddBank(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un RIB</span>
            </button>
          </div>

          {showAddBank && (
            <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-amber-900 uppercase">Nouveau Compte Bancaire (RIB)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Banque (ex: BNA, BEA, CPA, BADR)</label>
                  <input
                    type="text"
                    placeholder="ex: BNA Agence 632"
                    value={newBankForm.nomBanque}
                    onChange={(e) => setNewBankForm({ ...newBankForm, nomBanque: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Code Agence / Guichet</label>
                  <input
                    type="text"
                    placeholder="ex: 00632 Oran Es-Senia"
                    value={newBankForm.codeAgence}
                    onChange={(e) => setNewBankForm({ ...newBankForm, codeAgence: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Numéro RIB (20 chiffres)</label>
                  <input
                    type="text"
                    placeholder="ex: 00200012123456789012"
                    value={newBankForm.numeroCompteRIB}
                    onChange={(e) => setNewBankForm({ ...newBankForm, numeroCompteRIB: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowAddBank(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddBankAccount}
                  className="px-4 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-xs"
                >
                  Enregistrer le RIB
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.comptesBancaires.map((cpt) => (
              <div key={cpt.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative group">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 bg-slate-900 text-amber-400 text-[10px] font-bold font-mono rounded">
                      {cpt.nomBanque}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-2">{cpt.titulaire}</h4>
                    <p className="text-xs text-slate-500">{cpt.codeAgence}</p>
                    <div className="mt-3 p-2 bg-white border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-800 tracking-wider">
                      {cpt.numeroCompteRIB}
                    </div>
                  </div>
                  {formData.comptesBancaires.length > 1 && (
                    <button
                      onClick={() => handleDeleteBankAccount(cpt.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MODÈLES VSP */}
      {activeTab === 'vsp_chantiers' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-600" />
            Échéancier Standard Vente sur Plan (Loi n° 11-04)
          </h3>
          <p className="text-xs text-slate-500">
            Définissez la répartition des tranches d'appels de fonds par défaut appliquées lors de la réservation de logements VSP.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs">
            {formData.echeancierVSPDefaut.map((tranche, idx) => (
              <div key={tranche.id || `tranche-${idx}`} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold text-[11px]">
                    {tranche.ordre ?? tranche.numero ?? idx + 1}
                  </span>
                  <span className="font-mono font-bold text-slate-900">{tranche.pourcentage}%</span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs">{tranche.libelle}</h4>
                <p className="text-[11px] text-slate-500 leading-tight">{tranche.description || tranche.conditionDeclenchement}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: RH & PAIE */}
      {activeTab === 'rh_paie' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <HardHat className="w-5 h-5 text-amber-600" />
            Règles Réglementaires Paie & Cotisations Sociales Algérie
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-slate-500 font-medium">Cotisation Patronale CNAS</span>
              <div className="text-xl font-black text-slate-900 font-mono">26.5 %</div>
              <p className="text-[11px] text-slate-500">Sécurité sociale & accidents de travail</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-slate-500 font-medium">Cotisation Salariale CNAS</span>
              <div className="text-xl font-black text-slate-900 font-mono">9.0 %</div>
              <p className="text-[11px] text-slate-500">Retenue à la source sur le brut imposable</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-slate-500 font-medium">Cotisation CACOBATPH</span>
              <div className="text-xl font-black text-slate-900 font-mono">0.75 %</div>
              <p className="text-[11px] text-slate-500">Congés payés & chômage intempéries BTPH</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SAUVEGARDE & RESTAURATION */}
      {activeTab === 'sauvegarde' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <DatabaseBackup className="w-5 h-5 text-amber-600" />
              Sauvegarde, Restauration & Clôture Système
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Exportez l'intégralité des données en fichier JSON sécurisé ou réinitialisez la base aux données usine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <h4 className="text-sm font-bold text-slate-900">1. Exporter la Base de Données (Backup JSON)</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Générez un fichier complet contenant tous les chantiers, caisses, transactions, acquéreurs VSP, contrats de sous-traitance et pièces GED.
              </p>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger la Sauvegarde (.JSON)</span>
              </button>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <h4 className="text-sm font-bold text-slate-900">2. Réinitialisation aux Données Usine</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Restaurez les données de démonstration initiales et réinitialisez l'historique complet des opérations.
              </p>
              <button
                onClick={() => {
                  if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes les données ?')) {
                    resetToInitialData();
                    setStatusMessage({ text: 'Application réinitialisée aux données usine.' });
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Réinitialiser la Base</span>
              </button>
            </div>
          </div>

          {/* Automated Cloud Backup Notice */}
          <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 font-mono text-[10px] font-bold rounded">
                  PLANIFICATION CLOUD ACTIVE
                </span>
                <span className="text-xs text-slate-400 font-mono">Chiffrement AES-256-GCM</span>
              </div>
              <h4 className="text-sm font-bold text-white">Sauvegardes Automatisées & Restauration 1-Clic</h4>
              <p className="text-xs text-slate-300">
                Les instantanés de la base sont sauvegardés automatiquement chaque nuit à 02:00 vers Google Cloud Storage / SFTP.
                Le paramétrage des règles fines et la restauration rapide en un clic sont centralisés dans le Panneau SuperAdmin.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: CLÔTURE MENSUELLE */}
      {activeTab === 'cloture_mensuelle' && <ClotureMensuelleView />}

      {/* TAB 7: AUDIT */}
      {activeTab === 'audit' && <LogsAuditView />}
    </div>
  );
};
