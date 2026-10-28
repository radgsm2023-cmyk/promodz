import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportBilanFinancierPDF, exportBilanPaiePDF, exportParcMaterielPDF } from '../utils/pdfExport';
import { formatDZD } from '../utils/formatters';
import {
  X,
  FileDown,
  FileText,
  DollarSign,
  Users,
  Building2,
  Calendar,
  CheckCircle2,
  Printer,
  Sparkles,
  Truck,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  defaultType?: 'financier' | 'paie' | 'materiel';
  defaultChantierId?: string | null;
  onClose: () => void;
}

export const ExportPdfModal: React.FC<Props> = ({
  isOpen,
  defaultType = 'financier',
  defaultChantierId = null,
  onClose,
}) => {
  const { chantiers, caisses, transactions, employes, bulletinsPaie, materiels, activeChantierId } = useApp();

  const [reportType, setReportType] = useState<'financier' | 'paie' | 'materiel'>(defaultType);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [selectedChantier, setSelectedChantier] = useState<string>(defaultChantierId || activeChantierId || 'all');
  const [inclureJournal, setInclureJournal] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  if (!isOpen) return null;

  // Compute preview metrics based on selections
  const targetChantierId = selectedChantier === 'all' ? null : selectedChantier;

  // Filtered transactions for financial preview
  const filteredTx = transactions.filter((tx) => {
    if (targetChantierId && tx.chantierId !== targetChantierId) return false;
    if (selectedMonth !== 'all' && !tx.date.startsWith(selectedMonth)) return false;
    return true;
  });

  const previewDepenses = filteredTx
    .filter((tx) => tx.type === 'sortie')
    .reduce((a, b) => a + b.montantDZD, 0);

  const previewRecettes = filteredTx
    .filter((tx) => tx.type === 'entree')
    .reduce((a, b) => a + b.montantDZD, 0);

  // Filtered bulletins for payroll preview
  const filteredBp = bulletinsPaie.filter((bp) => {
    if (targetChantierId && bp.chantierId !== targetChantierId) return false;
    if (selectedMonth !== 'all') {
      const monthNames: Record<string, string> = {
        '2026-10': 'octobre',
        '2026-09': 'septembre',
        '2026-08': 'août',
        '2026-07': 'juillet',
      };
      const name = monthNames[selectedMonth] || '';
      if (name && !bp.periodeMois.toLowerCase().includes(name)) return false;
    }
    return true;
  });

  const previewMasseSalariale = filteredBp.reduce((a, b) => a + b.netAPayerDZD, 0);
  const previewAcomptes = filteredBp.reduce((a, b) => a + (b.avancesAcomptesDeduitesDZD || 0), 0);
  const previewEffectif = targetChantierId
    ? employes.filter((e) => e.chantierId === targetChantierId).length
    : employes.length;

  const previewMaterielCount = targetChantierId
    ? materiels.filter((m) => m.chantierId === targetChantierId).length
    : materiels.length;

  const previewMaterielLocation = (targetChantierId
    ? materiels.filter((m) => m.chantierId === targetChantierId)
    : materiels
  )
    .filter((m) => m.typeAcquisition === 'location' && m.statut === 'en_service')
    .reduce((a, b) => a + (b.coutLocationJournalierDZD || 0), 0);

  const handleGeneratePDF = (action: 'download' | 'preview') => {
    setIsGenerating(true);

    try {
      let doc;
      const monthLabel =
        selectedMonth === '2026-10'
          ? 'Octobre 2026'
          : selectedMonth === '2026-09'
          ? 'Septembre 2026'
          : selectedMonth === '2026-08'
          ? 'Août 2026'
          : selectedMonth === 'all'
          ? 'Exercice 2026 complet'
          : selectedMonth;

      if (reportType === 'financier') {
        doc = exportBilanFinancierPDF({
          mois: monthLabel,
          chantierId: targetChantierId,
          chantiers,
          caisses,
          transactions,
          inclureJournal,
        });

        const filename = `Bilan_Financier_BatiPromote_${selectedMonth}_${targetChantierId || 'Tous'}.pdf`;
        if (action === 'download') {
          doc.save(filename);
        } else {
          window.open(doc.output('bloburl'), '_blank');
        }
      } else if (reportType === 'paie') {
        doc = exportBilanPaiePDF({
          periode: monthLabel,
          chantierId: targetChantierId,
          chantiers,
          employes,
          bulletinsPaie,
        });

        const filename = `Bilan_Paie_MainOeuvre_BatiPromote_${selectedMonth}_${targetChantierId || 'Tous'}.pdf`;
        if (action === 'download') {
          doc.save(filename);
        } else {
          window.open(doc.output('bloburl'), '_blank');
        }
      } else {
        doc = exportParcMaterielPDF({
          chantierId: targetChantierId,
          chantiers,
          materiels,
        });

        const filename = `Inventaire_Parc_Engins_BatiPromote_${targetChantierId || 'Tous'}.pdf`;
        if (action === 'download') {
          doc.save(filename);
        } else {
          window.open(doc.output('bloburl'), '_blank');
        }
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <FileDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">Exportation de Bilans Mensuels (PDF)</h3>
              <p className="text-[11px] text-slate-400">
                Génération de documents haute fidélité pour promoteurs & directeurs financiers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* 1. Report Type Selection Cards */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Type de rapport mensuel à générer *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setReportType('financier')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  reportType === 'financier'
                    ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <DollarSign className={`w-4 h-4 ${reportType === 'financier' ? 'text-amber-700' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold text-slate-900">Bilan Financier</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Recettes VSP, dépenses, caisses et journal.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setReportType('paie')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  reportType === 'paie'
                    ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Users className={`w-4 h-4 ${reportType === 'paie' ? 'text-amber-700' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold text-slate-900">Bilan Paie</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Pointages quinzaines, salaires et acomptes.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setReportType('materiel')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  reportType === 'materiel'
                    ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Truck className={`w-4 h-4 ${reportType === 'materiel' ? 'text-amber-700' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold text-slate-900">Parc Engins</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Inventaire engins, grues, compteurs et CTC.
                </p>
              </button>
            </div>
          </div>

          {/* 2. Parameters: Period & Project */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                Mois / Période du bilan
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="2026-10">Octobre 2026 (En cours)</option>
                <option value="2026-09">Septembre 2026</option>
                <option value="2026-08">Août 2026</option>
                <option value="2026-07">Juillet 2026</option>
                <option value="all">Exercice Annuel 2026 complet</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                Périmètre Chantier
              </label>
              <select
                value={selectedChantier}
                onChange={(e) => setSelectedChantier(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="all">Tous les chantiers (Synthèse globale)</option>
                {chantiers.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.nom} ({ch.wilaya})
                  </option>
                ))}
              </select>
            </div>

            {/* Checkbox for financial report */}
            {reportType === 'financier' && (
              <div className="sm:col-span-2 pt-2 border-t border-slate-200 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="inclureJournal"
                  checked={inclureJournal}
                  onChange={(e) => setInclureJournal(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="inclureJournal" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Inclure le grand livre / journal détaillé des pièces et virements
                </label>
              </div>
            )}
          </div>

          {/* 3. Live Metrics Summary Preview */}
          <div className="p-4 bg-slate-900 text-white rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Aperçu des Données du Rapport (Dinars Algériens - DA)
              </span>
              <span className="text-[10px] font-mono text-amber-400">Format A4 Prêt à imprimer</span>
            </div>

            {reportType === 'financier' ? (
              <div className="grid grid-cols-3 gap-3 pt-2 text-xs border-t border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block">Dépenses engagées</span>
                  <span className="text-sm font-bold font-mono text-red-400 tabular-nums">
                    {formatDZD(previewDepenses)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Recettes VSP</span>
                  <span className="text-sm font-bold font-mono text-emerald-400 tabular-nums">
                    {formatDZD(previewRecettes)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Opérations comptables</span>
                  <span className="text-sm font-bold font-mono text-white tabular-nums">
                    {filteredTx.length} flux
                  </span>
                </div>
              </div>
            ) : reportType === 'paie' ? (
              <div className="grid grid-cols-3 gap-3 pt-2 text-xs border-t border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block">Masse salariale nette</span>
                  <span className="text-sm font-bold font-mono text-emerald-400 tabular-nums">
                    {formatDZD(previewMasseSalariale)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Acomptes déduits</span>
                  <span className="text-sm font-bold font-mono text-amber-400 tabular-nums">
                    {formatDZD(previewAcomptes)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Effectif concerné</span>
                  <span className="text-sm font-bold font-mono text-white tabular-nums">
                    {previewEffectif} ouvriers
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 pt-2 text-xs border-t border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block">Parc d'engins ciblé</span>
                  <span className="text-sm font-bold font-mono text-amber-400 tabular-nums">
                    {previewMaterielCount} matériels
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Coût location actif</span>
                  <span className="text-sm font-bold font-mono text-emerald-400 tabular-nums">
                    {formatDZD(previewMaterielLocation, false)} DA/j
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Sécurité & conformité</span>
                  <span className="text-sm font-bold font-mono text-white tabular-nums">
                    Visas CTC inclus
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Fermer
            </button>

            <button
              type="button"
              onClick={() => handleGeneratePDF('preview')}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              Aperçu dans l'onglet
            </button>

            <button
              type="button"
              onClick={() => handleGeneratePDF('download')}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              {isGenerating ? 'Génération...' : 'Télécharger le PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
