import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ContratSousTraitance, SituationAttachement, CorpsSousTraitance } from '../types';
import { formatDZD, formatDateFR } from '../utils/formatters';
import {
  HardHat,
  Plus,
  Search,
  FileText,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Building,
  Printer,
  FileCheck,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const SousTraitanceView: React.FC = () => {
  const {
    contratsSousTraitance,
    situationsAttachements,
    chantiers,
    userAllowedChantiers,
    isChantierAllowed,
    isGlobalUser,
    tiers,
    addContratSousTraitance,
    addSituationAttachement,
    validerSituationAttachement,
    appSettings,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'contrats' | 'situations' | 'retenues'>('contrats');
  const [selectedChantierId, setSelectedChantierId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isContratModalOpen, setIsContratModalOpen] = useState(false);
  const [isSituationModalOpen, setIsSituationModalOpen] = useState(false);

  // Allowed subsets
  const allowedContrats = contratsSousTraitance.filter((c) => isChantierAllowed(c.chantierId));
  const allowedSituations = situationsAttachements.filter((s) => isChantierAllowed(s.chantierId));

  // New Contract Form State
  const [sousTraitantNom, setSousTraitantNom] = useState('');
  const [chantierId, setChantierId] = useState(userAllowedChantiers[0]?.id || chantiers[0]?.id || '');
  const [corpsMetier, setCorpsMetier] = useState<CorpsSousTraitance>('gros_oeuvre');
  const [objetContrat, setObjetContrat] = useState('');
  const [montantMarcheInitialDZD, setMontantMarcheInitialDZD] = useState<number>(5000000);
  const [delaiExecutionMois, setDelaiExecutionMois] = useState<number>(12);
  const [tauxRetenueGarantiePourcent, setTauxRetenueGarantiePourcent] = useState<number>(10);

  // New Situation Form State
  const [selectedContratId, setSelectedContratId] = useState<string>(allowedContrats[0]?.id || '');
  const [montantTravauxMoisDZD, setMontantTravauxMoisDZD] = useState<number>(1200000);
  const [periodeMois, setPeriodeMois] = useState('2026-04');
  const [observateursNotes, setObservateursNotes] = useState('');

  // Filtered contracts
  const filteredContrats = allowedContrats.filter((c) => {
    const matchCh = selectedChantierId === 'all' || c.chantierId === selectedChantierId;
    const matchSearch =
      c.sousTraitantNom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.objetContrat.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCh && matchSearch;
  });

  // Filtered situations
  const filteredSituations = allowedSituations.filter((s) => {
    const matchCh = selectedChantierId === 'all' || s.chantierId === selectedChantierId;
    const matchSearch =
      s.sousTraitantNom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCh && matchSearch;
  });

  // Global KPIs (scoped)
  const totalMarchesDZD = allowedContrats.reduce((acc, c) => acc + c.montantMarcheTotalDZD, 0);
  const totalRetenuesGarantieDZD = allowedContrats.reduce((acc, c) => acc + c.retenueGarantieCumuleeDZD, 0);
  const totalSituationsPayeesDZD = allowedSituations
    .filter((s) => s.statut === 'paye' || s.statut === 'valide_direction')
    .reduce((acc, s) => acc + s.netAPayerDZD, 0);

  const handleCreateContrat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sousTraitantNom.trim() || !objetContrat.trim()) return;

    const ch = chantiers.find((c) => c.id === chantierId);

    addContratSousTraitance({
      code: `ST-2026-0${contratsSousTraitance.length + 1}`,
      sousTraitantNom: sousTraitantNom.trim(),
      chantierId: chantierId || chantiers[0].id,
      chantierNom: ch ? ch.nom : 'Chantier Principal',
      corpsMetier,
      objetContrat: objetContrat.trim(),
      montantMarcheInitialDZD: Number(montantMarcheInitialDZD),
      montantAvenantsDZD: 0,
      montantMarcheTotalDZD: Number(montantMarcheInitialDZD),
      dateSignature: new Date().toISOString().split('T')[0],
      delaiExecutionMois: Number(delaiExecutionMois),
      tauxRetenueGarantiePourcent: Number(tauxRetenueGarantiePourcent),
      retenueGarantieCumuleeDZD: 0,
      statut: 'en_cours',
    });

    setIsContratModalOpen(false);
    setSousTraitantNom('');
    setObjetContrat('');
  };

  const handleCreateSituation = (e: React.FormEvent) => {
    e.preventDefault();
    const contrat = contratsSousTraitance.find((c) => c.id === selectedContratId);
    if (!contrat) return;

    const montantMois = Number(montantTravauxMoisDZD);
    const cumulPrec = situationsAttachements
      .filter((s) => s.contratId === contrat.id)
      .reduce((acc, s) => acc + s.montantTravauxMoisDZD, 0);
    const cumulTotal = cumulPrec + montantMois;
    const retentionMois = Math.round(montantMois * (contrat.tauxRetenueGarantiePourcent / 100));
    const netPayer = montantMois - retentionMois;

    addSituationAttachement({
      code: `ATT-2026-0${situationsAttachements.length + 1}`,
      contratId: contrat.id,
      contratCode: contrat.code,
      sousTraitantNom: contrat.sousTraitantNom,
      chantierId: contrat.chantierId,
      chantierNom: contrat.chantierNom,
      periodeMois,
      montantTravauxMoisDZD: montantMois,
      cumulPrecedentDZD: cumulPrec,
      cumulTotalTravauxDZD: cumulTotal,
      retenueGarantieMoisDZD: retentionMois,
      netAPayerDZD: netPayer,
      statut: 'brouillon',
      observateursNotes: observateursNotes.trim() || 'Situation établie selon attachement contradictoire',
    });

    setIsSituationModalOpen(false);
    setObservateursNotes('');
  };

  const handlePrintDecompte = (sit: SituationAttachement) => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(appSettings.raisonSociale.toUpperCase(), 14, 15);
    doc.setFontSize(11);
    doc.text(`DECOMPTE PROVISOIRE MENSUEL (DPM) - SOUS-TRAITANCE`, 14, 23);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`---------------------------------------------------------------------------------------------------------`, 14, 28);
    doc.text(`Sous-traitant : ${sit.sousTraitantNom}`, 14, 36);
    doc.text(`Chantier : ${sit.chantierNom}`, 14, 43);
    doc.text(`Contrat Réf : ${sit.contratCode} | Attachement : ${sit.code}`, 14, 50);
    doc.text(`Période de situation : Mois de ${sit.periodeMois}`, 14, 57);

    autoTable(doc, {
      startY: 65,
      head: [['Désignation de la Situation / Décompte', 'Montant (DZD)']],
      body: [
        ['1. Montant des travaux réalisés ce mois (Attachement brut)', formatDZD(sit.montantTravauxMoisDZD) + ' DA'],
        ['2. Cumul des travaux antérieurs', formatDZD(sit.cumulPrecedentDZD) + ' DA'],
        ['3. Cumul total des travaux à ce jour', formatDZD(sit.cumulTotalTravauxDZD) + ' DA'],
        ['4. Retenue de garantie du mois (10%)', `(${formatDZD(sit.retenueGarantieMoisDZD)}) DA`],
        ['NET A PAYER AU SOUS-TRAITANT (DPM)', formatDZD(sit.netAPayerDZD) + ' DA'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59] },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('Visa du Conducteur de Travaux :', 14, finalY);
    doc.text('Visa de la Direction / Comptabilité :', 120, finalY);

    doc.save(`Decompte_${sit.code}_${sit.sousTraitantNom.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-1">
            <HardHat className="w-4 h-4" />
            <span>Gestion des Entreprises & Sous-Traitance Bâtiment</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Contrats, Attachements & Décomptes Mensuels (DPM)</h1>
          <p className="text-slate-400 text-xs mt-1">
            Suivi des marchés de sous-traitance, validation des situations de travaux contradictoires et gestion automatisée des retenues de garantie (10%).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsContratModalOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Contrat ST</span>
          </button>
          <button
            onClick={() => setIsSituationModalOpen(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <FileCheck className="w-4 h-4 text-amber-400" />
            <span>Établir une Situation (Attachement)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Marchés Sous-Traitance</span>
            <Building className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {formatDZD(totalMarchesDZD)} DA
          </div>
          <p className="text-xs text-slate-500 mt-1">{contratsSousTraitance.length} contrats actifs engagés</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Retenues de Garantie Cumulées</span>
            <ShieldCheck className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700 font-mono">
            {formatDZD(totalRetenuesGarantieDZD)} DA
          </div>
          <p className="text-xs text-slate-500 mt-1">Garantie de parfait achèvement (10%)</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Décomptes Validés / Payés</span>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            {formatDZD(totalSituationsPayeesDZD)} DA
          </div>
          <p className="text-xs text-slate-500 mt-1">{allowedSituations.length} situations d'attachement</p>
        </div>
      </div>

      {/* Sub-tabs & Filter bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('contrats')}
            className={`px-4 py-2 font-medium rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'contrats'
                ? 'bg-slate-900 text-amber-400 shadow-sm font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <HardHat className="w-4 h-4" />
            <span>Contrats de Sous-Traitance ({allowedContrats.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('situations')}
            className={`px-4 py-2 font-medium rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'situations'
                ? 'bg-slate-900 text-amber-400 shadow-sm font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Situations & Décomptes (DPM) ({situationsAttachements.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('retenues')}
            className={`px-4 py-2 font-medium rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'retenues'
                ? 'bg-slate-900 text-amber-400 shadow-sm font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Gestion des Retenues de Garantie</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={selectedChantierId}
            onChange={(e) => setSelectedChantierId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">{isGlobalUser ? 'Tous les chantiers' : 'Mes chantiers assignés'}</option>
            {userAllowedChantiers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>

          <div className="relative flex-1 md:w-60">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher sous-traitant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: CONTRATS */}
      {activeSubTab === 'contrats' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Code / Sous-Traitant</th>
                  <th className="py-3 px-4">Corps d'État</th>
                  <th className="py-3 px-4">Chantier rattaché</th>
                  <th className="py-3 px-4 text-right">Montant Marché (DA)</th>
                  <th className="py-3 px-4 text-right">Retenue Garantie (10%)</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {filteredContrats.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{c.sousTraitantNom}</div>
                      <div className="text-[11px] font-mono text-slate-400">{c.code} · Objet : {c.objetContrat}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold capitalize">
                        {c.corpsMetier.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{c.chantierNom}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {formatDZD(c.montantMarcheTotalDZD)} DA
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-purple-700">
                      {formatDZD(c.retenueGarantieCumuleeDZD)} DA
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        En cours
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SITUATIONS & DÉCOMPTES */}
      {activeSubTab === 'situations' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Réf / Période</th>
                  <th className="py-3 px-4">Sous-Traitant & Chantier</th>
                  <th className="py-3 px-4 text-right">Travaux Mois (DA)</th>
                  <th className="py-3 px-4 text-right">Retenue Garantie</th>
                  <th className="py-3 px-4 text-right">Net à Payer (DPM)</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {filteredSituations.map((sit) => (
                  <tr key={sit.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-slate-900">{sit.code}</div>
                      <div className="text-[11px] text-slate-400">Mois {sit.periodeMois}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{sit.sousTraitantNom}</div>
                      <div className="text-[11px] text-slate-500">{sit.chantierNom}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {formatDZD(sit.montantTravauxMoisDZD)} DA
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-purple-700">
                      ({formatDZD(sit.retenueGarantieMoisDZD)}) DA
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                      {formatDZD(sit.netAPayerDZD)} DA
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        {sit.statut.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handlePrintDecompte(sit)}
                          className="px-3 py-1.5 bg-slate-900 text-amber-400 rounded-lg font-medium text-xs shadow-2xs hover:bg-slate-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Imprimer le Décompte Provisoire Mensuel (DPM)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>DPM PDF</span>
                        </button>
                        {sit.statut !== 'valide_direction' && (
                          <button
                            onClick={() => validerSituationAttachement(sit.id)}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-medium text-xs shadow-2xs hover:bg-emerald-700 transition-colors cursor-pointer"
                          >
                            Valider
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: RETENUES DE GARANTIE */}
      {activeSubTab === 'retenues' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Suivi et Libération des Retenues de Garantie (Parfait Achèvement)</h3>
            <p className="text-xs text-slate-500">
              Conformément à la réglementation des marchés de travaux, 10% sont prélevés sur chaque situation d'attachement. Cette somme est restituée aux sous-traitants après la réception définitive des chantiers et la levée de toutes les réserves.
            </p>

            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Sous-Traitant</th>
                    <th className="p-3">Chantier</th>
                    <th className="p-3 text-right">Montant Marché (DA)</th>
                    <th className="p-3 text-right">Retenue Consignée (10%)</th>
                    <th className="p-3 text-center">Date Restitution Prévue</th>
                    <th className="p-3 text-center">Statut Consignation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                  {contratsSousTraitance.map((c) => (
                    <tr key={c.id} className="hover:bg-white transition-colors">
                      <td className="p-3 font-bold text-slate-900">{c.sousTraitantNom}</td>
                      <td className="p-3">{c.chantierNom}</td>
                      <td className="p-3 text-right font-mono">{formatDZD(c.montantMarcheTotalDZD)} DA</td>
                      <td className="p-3 text-right font-mono font-bold text-purple-700">{formatDZD(c.retenueGarantieCumuleeDZD)} DA</td>
                      <td className="p-3 text-center font-mono">1 an après réception</td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Consigné en compte
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NEW CONTRAT ST */}
      {isContratModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Nouveau Contrat de Sous-Traitance</h3>
              <button onClick={() => setIsContratModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateContrat} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Raison Sociale du Sous-Traitant *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: SARL Bâtiment & Étanchéité"
                  value={sousTraitantNom}
                  onChange={(e) => setSousTraitantNom(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chantier rattaché</label>
                  <select
                    value={chantierId}
                    onChange={(e) => setChantierId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    {userAllowedChantiers.map((c) => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Corps d'État</label>
                  <select
                    value={corpsMetier}
                    onChange={(e) => setCorpsMetier(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl capitalize"
                  >
                    <option value="gros_oeuvre">Gros Œuvre</option>
                    <option value="etancheite_isolation">Étanchéité & Isolation</option>
                    <option value="menuiserie_alu_bois">Menuiserie ALU / Bois</option>
                    <option value="plomberie_sanitaire_hvac">Plomberie & HVAC</option>
                    <option value="electricite_courant_fort_faible">Électricité</option>
                    <option value="revetement_sol_faience">Carrelage & Faïence</option>
                    <option value="peinture_decoration">Peinture</option>
                    <option value="terrassement_vrd">Terrassement & VRD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Objet du Contrat *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Réalisation des lots de plomberie et évacuation"
                  value={objetContrat}
                  onChange={(e) => setObjetContrat(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Montant Marché (DA)</label>
                  <input
                    type="number"
                    required
                    value={montantMarcheInitialDZD}
                    onChange={(e) => setMontantMarcheInitialDZD(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Délai (mois)</label>
                  <input
                    type="number"
                    required
                    value={delaiExecutionMois}
                    onChange={(e) => setDelaiExecutionMois(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Retenue Garantie (%)</label>
                  <input
                    type="number"
                    required
                    value={tauxRetenueGarantiePourcent}
                    onChange={(e) => setTauxRetenueGarantiePourcent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button type="button" onClick={() => setIsContratModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl">Annuler</button>
                <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-xl font-semibold">Créer le Contrat</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW SITUATION ATTACHEMENT */}
      {isSituationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Établir une Situation d'Attachement (DPM)</h3>
              <button onClick={() => setIsSituationModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateSituation} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contrat de Sous-Traitance *</label>
                <select
                  value={selectedContratId}
                  onChange={(e) => setSelectedContratId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  {contratsSousTraitance.map((c) => (
                    <option key={c.id} value={c.id}>{c.sousTraitantNom} ({c.chantierNom})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Période (Mois) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 2026-04"
                    value={periodeMois}
                    onChange={(e) => setPeriodeMois(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Montant Travaux du Mois (DA) *</label>
                  <input
                    type="number"
                    required
                    value={montantTravauxMoisDZD}
                    onChange={(e) => setMontantTravauxMoisDZD(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observations / Visa technique</label>
                <input
                  type="text"
                  placeholder="Ex: Attachement contradictoire validé par le BET"
                  value={observateursNotes}
                  onChange={(e) => setObservateursNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1 font-mono text-[11px] text-slate-700">
                <div>• Retenue de garantie calculée (10%) : <strong className="text-purple-700">{formatDZD(Math.round(montantTravauxMoisDZD * 0.1))} DA</strong></div>
                <div>• Net à payer au sous-traitant : <strong className="text-emerald-600">{formatDZD(Math.round(montantTravauxMoisDZD * 0.9))} DA</strong></div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button type="button" onClick={() => setIsSituationModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl">Annuler</button>
                <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-xl font-semibold">Enregistrer l'Attachement</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
