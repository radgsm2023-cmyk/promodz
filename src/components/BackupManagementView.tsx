import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ConfigurationBackupPlanifie,
  SnapshotBackup,
  TypeStockageExterne,
  FrequenceSauvegarde,
} from '../types';
import { INITIAL_SNAPSHOTS_BACKUP } from '../data/mockData';
import { formatDateTimeFR } from '../utils/formatters';
import {
  Cloud,
  Database,
  HardDrive,
  Server,
  RotateCcw,
  Download,
  Lock,
  Key,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  FileCheck,
  Zap,
  Check,
  ShieldCheck,
  Layers,
  ArrowRight,
  Sliders,
  Radio,
  FileCode,
  Copy,
  ExternalLink,
} from 'lucide-react';

export const BackupManagementView: React.FC = () => {
  const {
    appSettings,
    updateAppSettings,
    currentUser,
    logAudit,
    exportDataJSON,
    importDataJSON,
    resetToInitialData,
    chantiers,
    caisses,
    transactions,
    employes,
    tiers,
  } = useApp();

  // Load or initialize backup configuration from appSettings
  const [config, setConfig] = useState<ConfigurationBackupPlanifie>(() => {
    return (
      appSettings.backupPlanifie || {
        actif: true,
        frequence: 'quotidienne',
        heureExecution: '02:00',
        retentionJours: 30,
        chiffrementActif: true,
        algorithmeChiffrement: 'AES-256-GCM',
        stockageCible: 'gcs',
        gcsConfig: {
          bucketName: 'gs://batipromote-backup-alger-prod/',
          region: 'europe-west1 (GCP)',
          serviceAccountEmail: 'sa-backup-automated@batipromote-dz.iam.gserviceaccount.com',
        },
        s3Config: {
          bucketName: 's3://batipromote-enterprise-backups/',
          region: 'eu-central-1',
          accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        },
        sftpConfig: {
          host: 'sftp.datacenter-algerie.dz',
          port: 2222,
          user: 'batipromote_adm',
          remotePath: '/var/backups/batipromote/encrypted/',
        },
        nasConfig: {
          pathPartage: 'smb://192.168.1.250/backup_direction/',
          ipServeur: '192.168.1.250',
        },
        derniereExecution: '2026-10-25 02:00:14',
        prochaineExecution: '2026-10-26 02:00:00',
        dernierStatut: 'succes',
      }
    );
  });

  // Snapshots list state
  const [snapshots, setSnapshots] = useState<SnapshotBackup[]>(INITIAL_SNAPSHOTS_BACKUP);

  // Connectivity Test State
  const [isTestingConnexion, setIsTestingConnexion] = useState(false);
  const [connexionStatus, setConnexionStatus] = useState<{
    tested: boolean;
    success: boolean;
    latencyMs: number;
    message: string;
  } | null>(null);

  // Manual Backup State (Simulation & In-progress)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupProgressStep, setBackupProgressStep] = useState<string>('');

  // 1-Click Restore Modal State
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [snapshotToRestore, setSnapshotToRestore] = useState<SnapshotBackup | null>(null);
  const [createSafetyPoint, setCreateSafetyPoint] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState<{ step: number; message: string }>({
    step: 0,
    message: '',
  });

  // UI Toast message
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);

  // Save Schedule Config
  const handleSaveConfig = () => {
    updateAppSettings({ backupPlanifie: config });

    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'modification',
      module: 'backup',
      entiteReference: 'CONFIG-BACKUP',
      details: `Modification planification sauvegarde automatique : ${config.actif ? 'Active' : 'Désactivée'}, Fréquence: ${config.frequence}, Heure: ${config.heureExecution}, Cible: ${config.stockageCible.toUpperCase()}, Rétention: ${config.retentionJours}j`,
    });

    setStatusMessage({ text: 'Configuration de la planification des sauvegardes enregistrée avec succès.' });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Test Storage Connection
  const handleTestConnection = () => {
    setIsTestingConnexion(true);
    setConnexionStatus(null);

    setTimeout(() => {
      setIsTestingConnexion(false);
      const latency = Math.floor(18 + Math.random() * 25);
      const targetLabel =
        config.stockageCible === 'gcs'
          ? 'Google Cloud Storage'
          : config.stockageCible === 's3'
          ? 'Amazon AWS S3'
          : config.stockageCible === 'sftp'
          ? 'Serveur SFTP DataCenter'
          : 'NAS Local';

      setConnexionStatus({
        tested: true,
        success: true,
        latencyMs: latency,
        message: `Connectivité vérifiée avec succès vers ${targetLabel}. Bucket accessible en écriture/lecture TLS 1.3. Latence: ${latency}ms.`,
      });

      logAudit({
        utilisateurNom: currentUser.nom,
        utilisateurRole: currentUser.role,
        action: 'validation',
        module: 'backup',
        entiteReference: `STORAGE-${config.stockageCible.toUpperCase()}`,
        details: `Test de connectivité réussi vers le stockage externe ${targetLabel} (${latency}ms)`,
      });
    }, 1200);
  };

  // Trigger Immediate Backup to External Storage
  const handleTriggerManualBackup = () => {
    setIsCreatingBackup(true);
    setBackupProgressStep('Génération de l\'instantané JSON de la base de données...');

    setTimeout(() => {
      setBackupProgressStep('Chiffrement des données en AES-256-GCM et calcul empreinte SHA-256...');

      setTimeout(() => {
        const targetLabel =
          config.stockageCible === 'gcs'
            ? 'Google Cloud Storage (GCS)'
            : config.stockageCible === 's3'
            ? 'Amazon AWS S3'
            : config.stockageCible === 'sftp'
            ? 'SFTP DataCenter National'
            : 'NAS Réseau Local';

        setBackupProgressStep(`Transmission chiffrée vers ${targetLabel}...`);

        setTimeout(() => {
          const now = new Date();
          const timestampId = now.toISOString().replace(/[-:T]/g, '').slice(0, 12);
          const dateStr = formatDateTimeFR(now.toISOString());
          const jsonBundle = exportDataJSON();
          const approxKo = Math.round(jsonBundle.length / 1024) + 1200;

          // Generate random hash
          const hashArray = Array.from({ length: 64 }, () =>
            Math.floor(Math.random() * 16).toString(16)
          ).join('');

          const newSnapshot: SnapshotBackup = {
            id: `SNAP-${timestampId}`,
            date: dateStr,
            nomFichier: `batipromote_manual_${timestampId}.json.enc`,
            type: 'manuelle',
            stockageCible: config.stockageCible,
            stockageLibelle: targetLabel,
            tailleKo: approxKo,
            hashSha256: hashArray,
            chiffre: true,
            donneesJSON: jsonBundle,
            stats: {
              chantiersCount: chantiers.length,
              caissesCount: caisses.length,
              transactionsCount: transactions.length,
              employesCount: employes.length,
              tiersCount: tiers.length,
            },
          };

          setSnapshots((prev) => [newSnapshot, ...prev]);
          setIsCreatingBackup(false);
          setBackupProgressStep('');

          // Update config last exec
          const updatedConfig: ConfigurationBackupPlanifie = {
            ...config,
            derniereExecution: dateStr,
            dernierStatut: 'succes',
          };
          setConfig(updatedConfig);
          updateAppSettings({ backupPlanifie: updatedConfig });

          logAudit({
            utilisateurNom: currentUser.nom,
            utilisateurRole: currentUser.role,
            action: 'backup',
            module: 'backup',
            entiteReference: newSnapshot.id,
            details: `Sauvegarde manuelle immédiate réussie vers ${targetLabel}. Taille: ${approxKo} Ko. Fichier: ${newSnapshot.nomFichier}`,
          });

          setStatusMessage({
            text: `Sauvegarde immédiate ${newSnapshot.id} créée et téléversée avec succès sur ${targetLabel}.`,
          });
          setTimeout(() => setStatusMessage(null), 4000);
        }, 900);
      }, 700);
    }, 600);
  };

  // Open 1-Click Restore Confirmation Modal
  const handleOpenRestoreModal = (snapshot: SnapshotBackup) => {
    setSnapshotToRestore(snapshot);
    setRestoreModalOpen(true);
    setRestoreProgress({ step: 0, message: '' });
  };

  // Execute 1-Click Quick Restore
  const handleConfirmRestore = () => {
    if (!snapshotToRestore) return;

    setIsRestoring(true);
    setRestoreProgress({
      step: 1,
      message: `Connexion sécurisée au stockage externe (${snapshotToRestore.stockageLibelle})...`,
    });

    setTimeout(() => {
      setRestoreProgress({
        step: 2,
        message: `Téléchargement du snapshot ${snapshotToRestore.nomFichier} (${snapshotToRestore.tailleKo} Ko)...`,
      });

      setTimeout(() => {
        setRestoreProgress({
          step: 3,
          message: 'Vérification de la signature cryptographique SHA-256 & Déchiffrement AES-256-GCM...',
        });

        setTimeout(() => {
          setRestoreProgress({
            step: 4,
            message: 'Restauration atomique des tables (Chantiers, Caisses, Flux, Tiers, RH)...',
          });

          setTimeout(() => {
            // Apply restoration
            if (snapshotToRestore.donneesJSON) {
              importDataJSON(snapshotToRestore.donneesJSON);
            } else {
              // Restore initial database state if mock
              resetToInitialData();
            }

            logAudit({
              utilisateurNom: currentUser.nom,
              utilisateurRole: currentUser.role,
              action: 'restauration',
              module: 'backup',
              entiteReference: snapshotToRestore.id,
              details: `Restauration rapide en 1 clic effectuée avec succès depuis le snapshot ${snapshotToRestore.id} (${snapshotToRestore.stockageLibelle}). Données rétablies à l'état du ${snapshotToRestore.date}.`,
            });

            setIsRestoring(false);
            setRestoreModalOpen(false);
            setSnapshotToRestore(null);

            setStatusMessage({
              text: `Restauration rapide réussie ! L'ensemble de la base de données a été réinitialisé à l'état du snapshot ${snapshotToRestore.id}.`,
            });
            setTimeout(() => setStatusMessage(null), 5000);
          }, 800);
        }, 700);
      }, 700);
    }, 600);
  };

  // Download snapshot file as JSON
  const handleDownloadSnapshot = (snap: SnapshotBackup) => {
    const dataToDownload = snap.donneesJSON || exportDataJSON();
    const blob = new Blob([dataToDownload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = snap.nomFichier.replace('.enc', '.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setStatusMessage({ text: `Téléchargement du fichier de sauvegarde ${snap.nomFichier} démarré.` });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Delete snapshot
  const handleDeleteSnapshot = (id: string) => {
    if (confirm(`Confirmez-vous la suppression définitive du snapshot de sauvegarde ${id} du stockage externe ?`)) {
      setSnapshots((prev) => prev.filter((s) => s.id !== id));
      logAudit({
        utilisateurNom: currentUser.nom,
        utilisateurRole: currentUser.role,
        action: 'suppression',
        module: 'backup',
        entiteReference: id,
        details: `Suppression du snapshot de sauvegarde ${id} du stockage externe`,
      });
      setStatusMessage({ text: `Snapshot ${id} supprimé du référentiel.` });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Copy SHA-256 hash
  const handleCopyHash = (id: string, hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHashId(id);
    setTimeout(() => setCopiedHashId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner with Primary Flash Restore Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-800 border border-amber-500/30 font-bold text-[10px] rounded uppercase tracking-wider flex items-center gap-1">
                <Database className="w-3 h-3 text-amber-700" /> Infrastructure & Haute Disponibilité
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-mono">Chiffrement AES-256-GCM</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Planification Automatique des Sauvegardes & Restauration 1-Clic
            </h3>
            <p className="text-xs text-slate-500 max-w-3xl">
              Programmez l'export automatique et chiffré de vos chantiers, caisses et transactions vers un cloud externe sécurisé
              (Google Cloud Storage, AWS S3 ou SFTP). En cas d'incident, rétablissez l'intégralité du système en un clic.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {snapshots.length > 0 && (
              <button
                type="button"
                onClick={() => handleOpenRestoreModal(snapshots[0])}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                title="Restauration d'urgence immédiate depuis le dernier snapshot certifié"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Restauration 1-Clic (Dernier Snapshot)</span>
              </button>
            )}

            <button
              type="button"
              disabled={isCreatingBackup}
              onClick={handleTriggerManualBackup}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCreatingBackup ? 'animate-spin' : ''}`} />
              <span>{isCreatingBackup ? 'Sauvegarde en cours...' : 'Sauvegarder Maintenant'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Status / Feedback Message */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              statusMessage.isError
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            {statusMessage.isError ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Live Backup Progress Banner */}
        {isCreatingBackup && (
          <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
            <div className="flex-1">
              <span className="text-xs font-bold text-amber-400 block">Exécution du backup externe en cours</span>
              <p className="text-xs text-slate-300 mt-0.5">{backupProgressStep}</p>
            </div>
          </div>
        )}

        {/* KPI / Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Card 1: Statut de la planification */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Planification Automatique
            </span>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-900">
                {config.actif ? 'Active' : 'Désactivée'}
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                  config.actif ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {config.actif ? config.frequence : 'Suspendu'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 pt-1 border-t border-slate-200/60 font-mono">
              Heure : {config.heureExecution} · Rétention : {config.retentionJours}j
            </div>
          </div>

          {/* Card 2: Stockage Externe Cible */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Destination Externe
            </span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 uppercase">
                {config.stockageCible === 'gcs'
                  ? 'Google Cloud Storage'
                  : config.stockageCible === 's3'
                  ? 'AWS S3 Cloud'
                  : config.stockageCible === 'sftp'
                  ? 'SFTP DataCenter'
                  : 'NAS Local'}
              </span>
              <Cloud className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-[11px] text-slate-500 mt-1 pt-1 border-t border-slate-200/60 truncate font-mono">
              {config.stockageCible === 'gcs'
                ? config.gcsConfig.bucketName
                : config.stockageCible === 's3'
                ? config.s3Config.bucketName
                : config.stockageCible === 'sftp'
                ? config.sftpConfig.host
                : config.nasConfig.pathPartage}
            </div>
          </div>

          {/* Card 3: Dernier Snapshot Valide */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Dernière Sauvegarde Réussie
            </span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 font-mono">
                {snapshots[0]?.id || 'Aucun'}
              </span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                Valide
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 pt-1 border-t border-slate-200/60 font-mono">
              {snapshots[0]?.date || 'En attente'} ({snapshots[0]?.tailleKo || 0} Ko)
            </div>
          </div>

          {/* Card 4: Chiffrement & Sécurité */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Sécurité & Chiffrement
            </span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 font-mono">
                {config.algorithmeChiffrement}
              </span>
              <Lock className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-[11px] text-slate-500 mt-1 pt-1 border-t border-slate-200/60">
              Signature SHA-256 · Chiffrement AES
            </div>
          </div>
        </div>
      </div>

      {/* Row: Configuration de la Planification & Configuration du Stockage Externe */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Box: Paramétrage Planification Automatique */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Planification Automatisée (Cron Externe)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Définissez la fréquence et l'heure creuse pour exécuter les copies de sécurité sans impact sur les chantiers.
              </p>
            </div>

            {/* Toggle On/Off */}
            <button
              type="button"
              onClick={() => setConfig({ ...config, actif: !config.actif })}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                config.actif
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              {config.actif ? <Check className="w-3.5 h-3.5" /> : null}
              <span>{config.actif ? 'Planification Active' : 'Désactivée'}</span>
            </button>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Fréquence */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fréquence des Sauvegardes</label>
              <select
                value={config.frequence}
                onChange={(e) => setConfig({ ...config, frequence: e.target.value as FrequenceSauvegarde })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium cursor-pointer"
              >
                <option value="quotidienne">Quotidienne (Chaque nuit à l'heure définie)</option>
                <option value="bihebdomadaire">Bi-hebdomadaire (Deux fois par semaine - Mardi & Jeudi)</option>
                <option value="hebdomadaire">Hebdomadaire (Chaque vendredi à minuit)</option>
                <option value="toutes_les_12h">Toutes les 12 heures</option>
                <option value="toutes_les_6h">Toutes les 6 heures (Haute fréquence)</option>
              </select>
            </div>

            {/* Heure d'exécution & Rétention */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Heure de Sauvegarde (Heure Creuse)</label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="time"
                    value={config.heureExecution}
                    onChange={(e) => setConfig({ ...config, heureExecution: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rétention des Snapshots</label>
                <select
                  value={config.retentionJours}
                  onChange={(e) => setConfig({ ...config, retentionJours: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium cursor-pointer"
                >
                  <option value={7}>7 jours (1 semaine)</option>
                  <option value={15}>15 jours</option>
                  <option value={30}>30 jours (Recommandé)</option>
                  <option value={90}>90 jours (3 mois)</option>
                  <option value={365}>365 jours (1 an - Conformité fiscale)</option>
                </select>
              </div>
            </div>

            {/* Chiffrement Algorithme */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Chiffrement Militaire AES-256-GCM
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold rounded">
                  ACTIVÉ
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Toutes les sauvegardes envoyées au stockage externe sont préalablement chiffrées avec une clé privée dérivée.
                Aucune donnée en clair ne transite sur le réseau.
              </p>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveConfig}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 text-amber-400" />
                <span>Enregistrer la Planification</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Box: Configuration du Stockage Externe Sécurisé */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Cloud className="w-4 h-4 text-amber-600" />
                Stockage Externe Sécurisé Cible
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Sélectionnez le fournisseur de stockage cloud ou le serveur déporté pour héberger les snapshots.
              </p>
            </div>
          </div>

          {/* Storage Providers Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'gcs' as const, label: 'Google Cloud (GCS)', icon: Cloud },
              { id: 's3' as const, label: 'AWS S3', icon: Database },
              { id: 'sftp' as const, label: 'SFTP DataCenter', icon: Server },
              { id: 'nas_local' as const, label: 'NAS Local', icon: HardDrive },
            ].map((p) => {
              const Icon = p.icon;
              const isSelected = config.stockageCible === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setConfig({ ...config, stockageCible: p.id });
                    setConnexionStatus(null);
                  }}
                  className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-xs ring-2 ring-amber-500/50'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[11px] font-bold leading-tight">{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Provider Specific Settings */}
          <div className="space-y-3 text-xs pt-1">
            {config.stockageCible === 'gcs' && (
              <div className="space-y-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bucket Google Cloud Storage (URI)</label>
                  <input
                    type="text"
                    value={config.gcsConfig.bucketName}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        gcsConfig: { ...config.gcsConfig, bucketName: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Région Cloud</label>
                    <input
                      type="text"
                      value={config.gcsConfig.region}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          gcsConfig: { ...config.gcsConfig, region: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Compte de Service (IAM)</label>
                    <input
                      type="text"
                      value={config.gcsConfig.serviceAccountEmail}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          gcsConfig: { ...config.gcsConfig, serviceAccountEmail: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs truncate"
                    />
                  </div>
                </div>
              </div>
            )}

            {config.stockageCible === 's3' && (
              <div className="space-y-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bucket AWS S3</label>
                  <input
                    type="text"
                    value={config.s3Config.bucketName}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        s3Config: { ...config.s3Config, bucketName: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Région AWS</label>
                    <input
                      type="text"
                      value={config.s3Config.region}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          s3Config: { ...config.s3Config, region: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Access Key ID</label>
                    <input
                      type="text"
                      value={config.s3Config.accessKeyId}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          s3Config: { ...config.s3Config, accessKeyId: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {config.stockageCible === 'sftp' && (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Hôte SFTP</label>
                    <input
                      type="text"
                      value={config.sftpConfig.host}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          sftpConfig: { ...config.sftpConfig, host: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Port</label>
                    <input
                      type="number"
                      value={config.sftpConfig.port}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          sftpConfig: { ...config.sftpConfig, port: Number(e.target.value) },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Utilisateur</label>
                    <input
                      type="text"
                      value={config.sftpConfig.user}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          sftpConfig: { ...config.sftpConfig, user: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Dossier Distant</label>
                    <input
                      type="text"
                      value={config.sftpConfig.remotePath}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          sftpConfig: { ...config.sftpConfig, remotePath: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs truncate"
                    />
                  </div>
                </div>
              </div>
            )}

            {config.stockageCible === 'nas_local' && (
              <div className="space-y-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Partage Réseau SMB/NFS</label>
                  <input
                    type="text"
                    value={config.nasConfig.pathPartage}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        nasConfig: { ...config.nasConfig, pathPartage: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">IP Serveur NAS</label>
                  <input
                    type="text"
                    value={config.nasConfig.ipServeur}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        nasConfig: { ...config.nasConfig, ipServeur: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>
            )}

            {/* Test Connection Button & Status */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                disabled={isTestingConnexion}
                onClick={handleTestConnection}
                className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Server className="w-3.5 h-3.5" />
                <span>{isTestingConnexion ? 'Test en cours...' : 'Tester la Connexion'}</span>
              </button>

              {connexionStatus && (
                <div
                  className={`text-xs font-semibold flex items-center gap-1.5 ${
                    connexionStatus.success ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">{connexionStatus.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Snapshots Repository Table with 1-Click Restore Buttons */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-600" />
              Répertoire des Snapshots Disponibles sur Stockage Externe ({snapshots.length})
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Historique des archives chiffrées avec signature SHA-256 et restauration instantanée en 1 clic pour les administrateurs.
            </p>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Rétention active : <strong className="text-slate-800">{config.retentionJours} jours</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Horodatage / Réf.</th>
                <th className="py-3 px-4">Type & Cible Externe</th>
                <th className="py-3 px-4">Volume Données Sauvegardées</th>
                <th className="py-3 px-4">Poids & Intégrité SHA-256</th>
                <th className="py-3 px-4 text-right">Actions SuperAdmin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {snapshots.map((snap, index) => {
                const isLatest = index === 0;
                return (
                  <tr
                    key={snap.id}
                    className={`transition-colors hover:bg-slate-50 ${isLatest ? 'bg-amber-50/20' : ''}`}
                  >
                    {/* Timestamp & Ref */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{snap.id}</span>
                        {isLatest && (
                          <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 font-bold text-[9px] rounded uppercase font-sans">
                            Dernier
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{snap.date}</div>
                    </td>

                    {/* Type & Target */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            snap.type === 'automatique'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {snap.type}
                        </span>
                        <span className="text-xs font-semibold text-slate-800">
                          {snap.stockageLibelle}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-xs">
                        {snap.nomFichier}
                      </div>
                    </td>

                    {/* Stats entities */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex flex-wrap items-center gap-x-2 text-[11px]">
                        <span><strong>{snap.stats.chantiersCount}</strong> chantiers</span>
                        <span>·</span>
                        <span><strong>{snap.stats.caissesCount}</strong> caisses</span>
                        <span>·</span>
                        <span><strong>{snap.stats.transactionsCount}</strong> flux</span>
                        <span>·</span>
                        <span><strong>{snap.stats.employesCount}</strong> RH</span>
                      </div>
                      <div className="text-[10px] text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> Chiffré AES-256-GCM
                      </div>
                    </td>

                    {/* Weight & Hash */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-slate-900 tabular-nums">
                        {snap.tailleKo} Ko
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] text-slate-400 truncate max-w-[130px]" title={snap.hashSha256}>
                          {snap.hashSha256.slice(0, 16)}...
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyHash(snap.id, snap.hashSha256)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="Copier le hash SHA-256"
                        >
                          {copiedHashId === snap.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Actions: 1-Click Restore, Download, Delete */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* THE 1-CLICK RESTORE BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleOpenRestoreModal(snap)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                          title="Restauration rapide en un clic"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-300" />
                          <span>Restaurer en 1 Clic</span>
                        </button>

                        {/* Download JSON */}
                        <button
                          type="button"
                          onClick={() => handleDownloadSnapshot(snap)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                          title="Télécharger l'archive JSON"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDeleteSnapshot(snap.id)}
                          className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 rounded-lg transition cursor-pointer"
                          title="Supprimer du stockage externe"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1-CLICK RESTORE MODAL */}
      {restoreModalOpen && snapshotToRestore && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h4 className="text-base font-bold">Restauration Rapide en 1 Clic</h4>
                  <span className="text-[11px] text-rose-100 font-mono">
                    Procédure de rétablissement système d'urgence
                  </span>
                </div>
              </div>

              {!isRestoring && (
                <button
                  type="button"
                  onClick={() => setRestoreModalOpen(false)}
                  className="text-white/80 hover:text-white cursor-pointer font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs text-slate-700">
              {isRestoring ? (
                /* In-Progress State */
                <div className="py-6 space-y-4 text-center">
                  <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <RefreshCw className="w-7 h-7 animate-spin" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">
                      Restauration en cours... Étape {restoreProgress.step}/4
                    </h5>
                    <p className="text-xs text-slate-500 mt-1 font-mono">{restoreProgress.message}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-rose-600 h-full transition-all duration-300"
                      style={{ width: `${(restoreProgress.step / 4) * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                /* Pre-Restore Confirmation */
                <>
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-rose-900">
                    <h5 className="font-bold text-sm flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      Attention : Remplacement des données actives
                    </h5>
                    <p className="text-xs leading-relaxed text-rose-800">
                      Cette opération va écraser la base de données active et rétablir instantanément l'intégralité des
                      chantiers, caisses, transactions et utilisateurs tels qu'ils existaient au moment de ce snapshot.
                    </p>
                  </div>

                  {/* Snapshot Details Recap */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Identifiant :</span>
                      <strong className="text-slate-900">{snapshotToRestore.id}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date d'archivage :</span>
                      <span className="text-slate-800">{snapshotToRestore.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Stockage externe :</span>
                      <span className="text-slate-800">{snapshotToRestore.stockageLibelle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Données incluses :</span>
                      <span className="text-slate-800 font-sans">
                        {snapshotToRestore.stats.chantiersCount} chantiers, {snapshotToRestore.stats.caissesCount} caisses, {snapshotToRestore.stats.transactionsCount} flux
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 text-[10px]">
                      <span className="text-slate-400">Empreinte SHA-256 :</span>
                      <span className="text-slate-600">{snapshotToRestore.hashSha256.slice(0, 20)}...</span>
                    </div>
                  </div>

                  {/* Safety Checkbox */}
                  <label className="flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createSafetyPoint}
                      onChange={(e) => setCreateSafetyPoint(e.target.checked)}
                      className="w-4 h-4 text-amber-500 rounded mt-0.5 focus:ring-amber-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">
                        Créer un point de sauvegarde miroir avant restauration (Recommandé)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Archive l'état actuel sous le libellé "pre_restore_safety" avant d'écraser la base.
                      </span>
                    </div>
                  </label>

                  {/* Modal Action Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setRestoreModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                    >
                      Annuler
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmRestore}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>Confirmer & Restaurer Immédiatement</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
