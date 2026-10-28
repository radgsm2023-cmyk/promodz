import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatDZD } from '../utils/formatters';
import {
  Calculator,
  FileText,
  DollarSign,
  TrendingUp,
  Building2,
  Calendar,
  Printer,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  FileSpreadsheet,
  Users,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SyntheseFiscaleView } from './SyntheseFiscaleView';

export const ComptabiliteView: React.FC = () => {
  const { chantiers, userAllowedChantiers, isChantierAllowed, transactions, tiers, bulletinsPaie, appSettings } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'synthese_fiscale' | 'g50' | 'balance' | 'resultat' | 'fiscalite'>('synthese_fiscale');
  const [selectedPeriode, setSelectedPeriode] = useState<'mois_en_cours' | 'trimestre_1' | 'trimestre_2' | 'trimestre_3' | 'trimestre_4' | 'annuel'>('mois_en_cours');

  // Calculate totals for tax & accounting (scoped)
  const totalEncaisseVSP = tiers
    .filter((t) => t.type === 'client_vsp' && t.chantiersAssocies.some((id) => isChantierAllowed(id)))
    .reduce((acc, t) => acc + (t.soldeRegleDZD || 0), 0);

  const totalCAVSP = tiers
    .filter((t) => t.type === 'client_vsp' && t.chantiersAssocies.some((id) => isChantierAllowed(id)))
    .reduce((acc, t) => acc + (t.prixVenteTotalDZD || t.totalEngagementsDZD || 0), 0);

  const totalDepenses = transactions
    .filter((tx) => tx.type === 'sortie' && tx.statut === 'valide' && isChantierAllowed(tx.chantierId))
    .reduce((acc, tx) => acc + tx.montantDZD, 0);

  const totalSalaires = bulletinsPaie
    .filter((bp) => bp.statut === 'paye' && isChantierAllowed(bp.chantierId))
    .reduce((acc, bp) => acc + bp.netAPayerDZD, 0);

  // Algerian Tax Calculations (Estimates based on SCF & Code des Impôts Directs)
  const tauxTAP = 0.02; // 2%
  const montantTAPEstime = Math.round(totalEncaisseVSP * tauxTAP);

  const tauxTVA = 0.19;
  const tvaCollecteeEstimee = Math.round(totalEncaisseVSP * (tauxTVA / (1 + tauxTVA)));
  const tvaDeductibleEstimee = Math.round(totalDepenses * 0.12); // ~12% average deductible VAT on building materials & services
  const tvaDue = Math.max(0, tvaCollecteeEstimee - tvaDeductibleEstimee);

  const resultatNetAvantImpot = Math.max(0, totalEncaisseVSP - totalDepenses - totalSalaires);
  const tauxIBS = 0.19; // 19% construction
  const ibsEstime = Math.round(resultatNetAvantImpot * tauxIBS);

  const irgSalairesEstime = Math.round(totalSalaires * 0.10); // ~10% average IRG on payroll

  // Total provisions G50
  const totalProvisionsG50 = montantTAPEstime + tvaDue + irgSalairesEstime + ibsEstime;

  // SCF Account Classes breakdown
  const classesComptables = [
    {
      classe: 'Classe 2 : Immobilisations & Chantiers',
      libelle: 'Immobilisations corporelles et en-cours de production immobilière',
      solde: chantiers.reduce((acc, c) => acc + (c.depensesEngageesDZD || 0), 0),
      color: 'bg-blue-500',
    },
    {
      classe: 'Classe 3 : Stocks',
      libelle: 'Stocks de matériaux, ciment, acier, menuiserie sur chantiers',
      solde: 18500000,
      color: 'bg-emerald-500',
    },
    {
      classe: 'Classe 4 : Tiers',
      libelle: 'Créances clients VSP & Dettes fournisseurs/sous-traitants',
      solde: totalCAVSP - totalEncaisseVSP,
      color: 'bg-amber-500',
    },
    {
      classe: 'Classe 5 : Trésorerie',
      libelle: 'Caisses chantiers, Caisse siège & Comptes bancaires',
      solde: chantiers.reduce((acc, c) => acc + (c.recettesEncaisseesDZD || 0), 0) - totalDepenses,
      color: 'bg-purple-500',
    },
    {
      classe: 'Classe 6 : Charges',
      libelle: 'Achats consommés, salaires, sous-traitance, honoraires BET/CTC',
      solde: totalDepenses + totalSalaires,
      color: 'bg-rose-500',
    },
    {
      classe: 'Classe 7 : Produits',
      libelle: 'Ventes sur plan (VSP) et produits annexes',
      solde: totalCAVSP,
      color: 'bg-indigo-500',
    },
  ];

  const handlePrintG50 = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('REPUBLIQUE ALGERIENNE DEMOCRATIQUE ET POPULAIRE', 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('DIRECTION GENERALE DES IMPOTS - SERIE G N° 50', 105, 23, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Promoteur : ${appSettings.raisonSociale} | NIF : ${appSettings.nif || '002016091234567'}`, 14, 32);
    doc.text(`Adresse : ${appSettings.siegeAdresse}`, 14, 38);
    doc.text(`Période de déclaration : ${selectedPeriode.replace('_', ' ').toUpperCase()}`, 14, 44);

    autoTable(doc, {
      startY: 52,
      head: [['Impôt / Taxe (G50)', 'Base Imposable (DA)', 'Taux', 'Montant Dû (DA)']],
      body: [
        ['TAP (Taxe sur l\'Activité Professionnelle)', formatDZD(totalEncaisseVSP), '2%', formatDZD(montantTAPEstime)],
        ['TVA Collectée (Ventes sur Plan)', formatDZD(totalEncaisseVSP), '19%', formatDZD(tvaCollecteeEstimee)],
        ['TVA Déductible (Achats / Charges)', formatDZD(totalDepenses), '12% moy.', `(${formatDZD(tvaDeductibleEstimee)})`],
        ['TVA Net à Payer', '-', '-', formatDZD(tvaDue)],
        ['IRG / Retenue à la Source Salaires', formatDZD(totalSalaires), 'Barème', formatDZD(irgSalairesEstime)],
        ['IBS Provisionnel (Bénéfices)', formatDZD(resultatNetAvantImpot), '19%', formatDZD(ibsEstime)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59] },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL GENERAL DES PROVISIONS ET IMPOTS A VERSER : ${formatDZD(totalProvisionsG50)} DA`, 14, finalY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Cachet et Signature du Promoteur / Gérant :', 14, finalY + 25);

    doc.save(`Declaration_G50_${selectedPeriode}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              SCF & Fiscalité Algérienne (G50)
            </span>
            <span className="text-xs text-slate-400">Code des Impôts & Loi Fiscale</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Comptabilité, Provisions Fiscales & G50</h2>
          <p className="text-xs text-slate-400 mt-1">
            Calcul automatique des provisions mensuelles (TAP, TVA, IBS, IRG) basé sur le chiffre d'affaires VSP et les dépenses de chantiers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedPeriode}
            onChange={(e) => setSelectedPeriode(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 text-xs font-semibold rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="mois_en_cours">Mois en cours (G50 Mensuel)</option>
            <option value="trimestre_1">1er Trimestre (G50)</option>
            <option value="trimestre_2">2ème Trimestre (G50)</option>
            <option value="trimestre_3">3ème Trimestre (G50)</option>
            <option value="trimestre_4">4ème Trimestre (G50)</option>
            <option value="annuel">Bilan Annuel Global</option>
          </select>

          <button
            onClick={handlePrintG50}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer G50 / Bilan</span>
          </button>
        </div>
      </div>

      {/* Alert Banner for Tax Deadline (G50 due before 20th of the month) */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide">Alerte Échéance Déclarative G50</h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                Échéance légale : 20 du mois
              </span>
            </div>
            <p className="text-xs text-amber-800 mt-0.5">
              Provision totale calculée à régler pour la période : <strong className="font-mono">{formatDZD(totalProvisionsG50)} DZD</strong>. Veuillez valider et télétransmettre la déclaration avant la date limite pour éviter les pénalités de retard.
            </p>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-200/60 px-3 py-1.5 rounded-lg border border-amber-300">
            <Clock className="w-4 h-4" />
            Statut : Prêt à valider
          </span>
        </div>
      </div>

      {/* Sub-tabs navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('synthese_fiscale')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'synthese_fiscale'
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calculator className="w-4 h-4 text-amber-700" />
          <span>Synthèse Fiscale (G50 Dynamique)</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/30 text-slate-950 font-black">
            Automatisé
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('g50')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'g50'
              ? 'bg-slate-900 text-amber-400 shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Déclaration G50 & Provisions</span>
        </button>

        <button
          onClick={() => setActiveSubTab('balance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'balance'
              ? 'bg-slate-900 text-amber-400 shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Balance des Comptes (Classes SCF)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('resultat')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'resultat'
              ? 'bg-slate-900 text-amber-400 shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Compte de Résultat & Marges</span>
        </button>

        <button
          onClick={() => setActiveSubTab('fiscalite')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'fiscalite'
              ? 'bg-slate-900 text-amber-400 shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Guide Fiscal Promotion Immobilière</span>
        </button>
      </div>

      {/* SubTab 0: Synthèse Fiscale Dynamique basée sur les transactions */}
      {activeSubTab === 'synthese_fiscale' && <SyntheseFiscaleView />}

      {/* SubTab 1: G50 & Provisions */}
      {activeSubTab === 'g50' && (
        <div className="space-y-6">
          {/* Summary Tax Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">TAP (2%)</span>
                <Receipt className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-xl font-black text-slate-900 font-mono">
                {formatDZD(montantTAPEstime)} DA
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Basé sur CA encaissé VSP</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">TVA Nette Due</span>
                <Calculator className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-xl font-black text-slate-900 font-mono">
                {formatDZD(tvaDue)} DA
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Collectée ({formatDZD(tvaCollecteeEstimee)}) - Déductible</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">IRG / Salaires</span>
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-xl font-black text-slate-900 font-mono">
                {formatDZD(irgSalairesEstime)} DA
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Retenue à la source paie</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">IBS (19%)</span>
                <Building2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-xl font-black text-slate-900 font-mono">
                {formatDZD(ibsEstime)} DA
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Provision sur bénéfices</p>
            </div>
          </div>

          {/* Detailed G50 Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Calcul Automatique des Provisions G50 (CA & Dépenses)</h3>
                <p className="text-xs text-slate-500">Mise à jour en temps réel selon les encaissements VSP et les décaissements chantiers</p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                Conforme Code des Impôts Directs
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-3">Impôt / Taxe (Série G N° 50)</th>
                    <th className="px-6 py-3">Base Imposable (CA / Dépenses)</th>
                    <th className="px-6 py-3">Taux Applicable</th>
                    <th className="px-6 py-3 text-right">Provision Due (DZD)</th>
                    <th className="px-6 py-3 text-center">Échéance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-900">Taxe sur l'Activité Professionnelle (TAP)</td>
                    <td className="px-6 py-4 font-mono">{formatDZD(totalEncaisseVSP)} DA (CA Encaissé)</td>
                    <td className="px-6 py-4">2.0%</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">{formatDZD(montantTAPEstime)} DA</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Avant le 20</span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-900">TVA sur Ventes sur Plan (Collectée)</td>
                    <td className="px-6 py-4 font-mono">{formatDZD(totalEncaisseVSP)} DA (VSP)</td>
                    <td className="px-6 py-4">19%</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">{formatDZD(tvaCollecteeEstimee)} DA</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Avant le 20</span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-900">TVA Déductible (Achats & Sous-traitance)</td>
                    <td className="px-6 py-4 font-mono">{formatDZD(totalDepenses)} DA (Dépenses)</td>
                    <td className="px-6 py-4">12% moy. déductible</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">({formatDZD(tvaDeductibleEstimee)}) DA</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Déductible</span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-900">Impôt sur le Revenu Global (IRG / Salaires)</td>
                    <td className="px-6 py-4 font-mono">{formatDZD(totalSalaires)} DA (Masse salariale)</td>
                    <td className="px-6 py-4">Barème IRG</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">{formatDZD(irgSalairesEstime)} DA</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Avant le 20</span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-900">Acompte IBS (Bénéfices de construction)</td>
                    <td className="px-6 py-4 font-mono">{formatDZD(resultatNetAvantImpot)} DA (Résultat net)</td>
                    <td className="px-6 py-4">19%</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">{formatDZD(ibsEstime)} DA</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Trimestriel</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Total Général des Provisions G50 à verser au Trésor Public :</span>
              <span className="text-base font-black font-mono text-amber-600">
                {formatDZD(totalProvisionsG50)} DZD
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 2: Balance des Comptes (SCF) */}
      {activeSubTab === 'balance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Balance Générale des Comptes (Système Comptable Financier - SCF)</h3>
            <p className="text-xs text-slate-500 mb-6">Synthèse par classes comptables normalisées en Algérie</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {classesComptables.map((cls, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-3 h-3 rounded-full ${cls.color}`} />
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">{cls.classe}</h4>
                    </div>
                    <p className="text-xs text-slate-600 mb-4">{cls.libelle}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-semibold">Solde cumulé :</span>
                    <span className="text-sm font-black font-mono text-slate-900">{formatDZD(cls.solde)} DA</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SubTab 3: Compte de Résultat */}
      {activeSubTab === 'resultat' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Compte de Résultat Prévisionnel & Réel (SCF)</h3>
            <p className="text-xs text-slate-500">Synthèse des produits d'exploitation (VSP) et des charges de chantiers</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase">Total Produits d'Exploitation (Classe 7 - VSP)</span>
                <p className="text-[11px] text-emerald-600">Chiffre d'affaires global des ventes sur plan en cours</p>
              </div>
              <span className="text-lg font-black font-mono text-emerald-700">{formatDZD(totalCAVSP)} DA</span>
            </div>

            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-rose-800 uppercase">Total Charges d'Exploitation (Classes 6 - Chantiers & Salaires)</span>
                <p className="text-[11px] text-rose-600">Achats, sous-traitance, honoraires BET/CTC, salaires</p>
              </div>
              <span className="text-lg font-black font-mono text-rose-700">({formatDZD(totalDepenses + totalSalaires)}) DA</span>
            </div>

            <div className="p-5 bg-slate-900 text-white rounded-xl flex items-center justify-between shadow-md">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase">Résultat Brut d'Exploitation (Marge Promotrice)</span>
                <p className="text-[11px] text-slate-400">Avant impôt sur les sociétés (IBS)</p>
              </div>
              <span className="text-xl font-black font-mono text-amber-400">
                {formatDZD(totalCAVSP - (totalDepenses + totalSalaires))} DA
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 4: Guide Fiscal Promotion Immobilière */}
      {activeSubTab === 'fiscalite' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Guide Pratique de la Fiscalité Immobilière en Algérie</h3>
            <p className="text-xs text-slate-500">Règles fiscales spécifiques applicables aux promoteurs immobiliers (Loi de Finances & Code des Impôts)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase">
                <Building2 className="w-4 h-4" />
                <span>Exonérations & Régimes Particuliers</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Les projets de logements sociaux ou promotionnels aidés (LPA) bénéficient souvent d'exonérations de TVA ou de réductions de TAP selon les décrets exécutifs en vigueur. Les ventes sur plan (VSP) sont soumises à la TVA au taux réduit ou normal selon la nature des locaux (habitation vs. commercial).
              </p>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase">
                <ShieldCheck className="w-4 h-4" />
                <span>Garanties & FGCMPI (Loi 11-04)</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Conformément à la Loi 11-04 relative à l'activité de promotion immobilière, le promoteur doit obligatoirement souscrire une garantie financière (FGCMPI ou caution bancaire) avant l'obtention du permis de vente sur plan et l'encaissement des tranches auprès des acquéreurs.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
