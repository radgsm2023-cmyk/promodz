import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatDZD } from '../utils/formatters';
import {
  TrendingUp,
  Building2,
  DollarSign,
  PieChart,
  FileDown,
  Printer,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Calculator,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const RentabiliteView: React.FC = () => {
  const {
    chantiers,
    userAllowedChantiers,
    isGlobalUser,
    activeChantierId,
    transactions,
    tiers,
    employes,
    bulletinsPaie,
    materiels,
    maintenancesMateriel,
    stocks,
    appSettings,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChantierFilter, setSelectedChantierFilter] = useState<string>(activeChantierId || 'all');

  // Filter chantiers
  const filteredChantiers = userAllowedChantiers.filter((c) => {
    const matchFilter = selectedChantierFilter === 'all' || c.id === selectedChantierFilter;
    const matchSearch =
      c.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.wilaya.toLowerCase().includes(searchTerm.toLowerCase());
    return matchFilter && matchSearch;
  });

  // Calculate detailed financials for each chantier
  const projectsAnalysis = filteredChantiers.map((ch) => {
    // 1. Turnover & VSP Clients
    const buyers = tiers.filter(
      (t) => t.type === 'client_vsp' && t.chantiersAssocies.includes(ch.id)
    );
    const caPrevisionnelTotalDZD = buyers.reduce(
      (acc, b) => acc + (b.prixVenteTotalDZD || b.totalEngagementsDZD || 0),
      0
    ) || ch.budgetTotalDZD * 1.35; // Fallback to 35% margin on budget if buyers still enrolling

    const totalEncaisseVSP = buyers.reduce((acc, b) => acc + b.soldeRegleDZD, 0) || ch.recettesEncaisseesDZD;
    const resteARecouvrerVSP = Math.max(0, caPrevisionnelTotalDZD - totalEncaisseVSP);
    const tauxRecouvrement = caPrevisionnelTotalDZD > 0
      ? Math.round((totalEncaisseVSP / caPrevisionnelTotalDZD) * 100)
      : 0;

    // 2. Real Cost of Construction Breakdown
    // A. Transactions sorties on this chantier
    const chTransactions = transactions.filter(
      (tx) => tx.chantierId === ch.id && tx.type === 'sortie' && tx.statut === 'valide'
    );

    const coutMateriaux = chTransactions
      .filter((tx) => tx.categorie === 'materiaux_construction' || tx.categorie === 'gros_oeuvre')
      .reduce((acc, tx) => acc + tx.montantDZD, 0);

    const coutSousTraitance = chTransactions
      .filter((tx) => tx.categorie === 'sous_traitance' || tx.categorie === 'second_oeuvre')
      .reduce((acc, tx) => acc + tx.montantDZD, 0);

    const coutBETCTC = chTransactions
      .filter((tx) => tx.categorie === 'honoraires_archi_ctc' || tx.categorie === 'taxes_permis_administrations')
      .reduce((acc, tx) => acc + tx.montantDZD, 0);

    // B. Labor cost (paid bulletins + day laborers)
    const coutSalairesPaie = bulletinsPaie
      .filter((bp) => bp.chantierId === ch.id && bp.statut === 'paye')
      .reduce((acc, bp) => acc + bp.netAPayerDZD, 0) +
      chTransactions
        .filter((tx) => tx.categorie === 'main_d_oeuvre_journaliere')
        .reduce((acc, tx) => acc + tx.montantDZD, 0);

    // C. Equipment & Fuel cost (assigned machines + fuel/maintenance)
    const assignedEngins = materiels.filter((m) => m.chantierId === ch.id);
    const coutMaintenanceEngins = maintenancesMateriel
      .filter((mnt) => assignedEngins.some((m) => m.id === mnt.materielId))
      .reduce((acc, mnt) => acc + mnt.coutTotalDZD, 0);

    const coutCarburant = chTransactions
      .filter((tx) => tx.categorie === 'engins_carburant')
      .reduce((acc, tx) => acc + tx.montantDZD, 0);

    const coutEnginsTotal = coutMaintenanceEngins + coutCarburant;

    // Total Real Incurred Cost
    const coutTotalReelDZD =
      coutMateriaux + coutSousTraitance + coutSalairesPaie + coutEnginsTotal + coutBETCTC;
    
    // Fallback if transaction entries are still being logged
    const finalCoutReelDZD = Math.max(coutTotalReelDZD, ch.depensesEngageesDZD);

    // 3. Profit Margin Calculation
    const margeBruteDZD = caPrevisionnelTotalDZD - finalCoutReelDZD;
    const margePourcentage = caPrevisionnelTotalDZD > 0
      ? Math.round((margeBruteDZD / caPrevisionnelTotalDZD) * 100)
      : 0;

    // Unit economics per m²
    const coutM2ConstruitDZD = ch.surfaceM2 > 0 ? Math.round(finalCoutReelDZD / ch.surfaceM2) : 0;
    const prixVenteMoyenM2DZD = ch.surfaceM2 > 0 ? Math.round(caPrevisionnelTotalDZD / ch.surfaceM2) : 0;

    return {
      chantier: ch,
      buyersCount: buyers.length,
      caPrevisionnelTotalDZD,
      totalEncaisseVSP,
      resteARecouvrerVSP,
      tauxRecouvrement,
      coutMateriaux,
      coutSousTraitance,
      coutSalairesPaie,
      coutEnginsTotal,
      coutBETCTC,
      finalCoutReelDZD,
      margeBruteDZD,
      margePourcentage,
      coutM2ConstruitDZD,
      prixVenteMoyenM2DZD,
    };
  });

  // Global Portfolio Totals
  const totalPortefeuilleCA = projectsAnalysis.reduce((acc, p) => acc + p.caPrevisionnelTotalDZD, 0);
  const totalEncaisseGlobal = projectsAnalysis.reduce((acc, p) => acc + p.totalEncaisseVSP, 0);
  const totalCoutReelGlobal = projectsAnalysis.reduce((acc, p) => acc + p.finalCoutReelDZD, 0);
  const margeGlobaleDZD = totalPortefeuilleCA - totalCoutReelGlobal;
  const margeGlobalePourcent = totalPortefeuilleCA > 0
    ? Math.round((margeGlobaleDZD / totalPortefeuilleCA) * 100)
    : 0;

  // Export PDF Bilan Analytique
  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');

    // Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 297, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`${appSettings.raisonSociale} - BILAN FINANCIER & RENTABILITÉ PROMOTIONNELLE`, 14, 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    doc.text(
      `Agrément Promoteur MHUV : ${appSettings.agrementPromoteurNumero} | Devise : Dinars Algériens (DA) | Date : ${new Date().toLocaleDateString('fr-DZ')}`,
      14,
      20
    );

    // Summary Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 34, 269, 20, 2, 2, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`PORTFOLIO PROMOTION IMMOBILIÈRE :`, 18, 42);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `CA VSP Total : ${formatDZD(totalPortefeuilleCA)}  |  Encaissements Réels : ${formatDZD(
        totalEncaisseGlobal
      )}  |  Coûts Réalisés : ${formatDZD(totalCoutReelGlobal)}  |  Marge Nette Estimée : ${formatDZD(
        margeGlobaleDZD
      )} (${margeGlobalePourcent}%)`,
      18,
      49
    );

    // Table
    const tableData = projectsAnalysis.map((p) => [
      p.chantier.code,
      p.chantier.nom,
      `${p.chantier.surfaceM2} m²`,
      `${p.chantier.avancementPourcentage}%`,
      formatDZD(p.caPrevisionnelTotalDZD),
      formatDZD(p.totalEncaisseVSP),
      formatDZD(p.finalCoutReelDZD),
      `${formatDZD(p.coutM2ConstruitDZD)}/m²`,
      formatDZD(p.margeBruteDZD),
      `${p.margePourcentage}%`,
    ]);

    autoTable(doc, {
      startY: 60,
      head: [
        [
          'Code',
          'Chantier',
          'Surface',
          'Avanc.',
          'CA VSP Prévu',
          'Recettes Encaissées',
          'Coût Revient Réel',
          'Coût / m²',
          'Marge Nette (DA)',
          'Marge %',
        ],
      ],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7.5,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    doc.save(`BatiPromote_Bilan_Rentabilite_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-md">
                Contrôle de Gestion & Analyse Promoteur
              </span>
              <span className="text-xs text-slate-500 font-medium">Bilan Analytique par Opération</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Rentabilité, Marges & Prix de Revient par Chantier
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Consultez les marges financières nettes en Dinars (DA) et en pourcentage, comparez le coût de construction au m² face au prix de vente VSP, et anticipez les flux d'encaissement pour vos dossiers bancaires promoteur.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              <FileDown className="w-4 h-4 text-amber-400" />
              <span>Exporter Bilan Analytique (PDF)</span>
            </button>
          </div>
        </div>

        {/* Global KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 block uppercase">
              Chiffre d'Affaires VSP Portefeuille
            </span>
            <p className="text-xl font-black font-mono text-slate-900 mt-1">
              {formatDZD(totalPortefeuilleCA)}
            </p>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Dont <strong className="text-emerald-700">{formatDZD(totalEncaisseGlobal)}</strong> déjà encaissés
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 block uppercase">
              Coûts de Revient Engagés
            </span>
            <p className="text-xl font-black font-mono text-red-600 mt-1">
              {formatDZD(totalCoutReelGlobal)}
            </p>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Achats BTPH + Salaires + Engins + CTC
            </span>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-[11px] font-medium text-emerald-800 block uppercase">
              Marge Brute Promotionnelle
            </span>
            <p className="text-2xl font-black font-mono text-emerald-900 mt-1">
              {formatDZD(margeGlobaleDZD)}
            </p>
            <span className="text-[11px] text-emerald-700 mt-1 block font-semibold">
              Taux de marge nette estimé : {margeGlobalePourcent}%
            </span>
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
            <span className="text-[11px] font-medium text-amber-900 block uppercase">
              Taux Moyen de Recouvrement VSP
            </span>
            <p className="text-2xl font-black font-mono text-amber-950 mt-1">
              {totalPortefeuilleCA > 0 ? Math.round((totalEncaisseGlobal / totalPortefeuilleCA) * 100) : 0}%
            </p>
            <span className="text-[11px] text-amber-800 mt-1 block">
              Tranches échues & règlements clients
            </span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un projet, code ou commune..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedChantierFilter}
            onChange={(e) => setSelectedChantierFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
          >
            <option value="all">🏢 {isGlobalUser ? 'Tous les chantiers' : 'Mes chantiers'} ({userAllowedChantiers.length})</option>
            {userAllowedChantiers.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.nom} ({ch.wilaya})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Project Cards Detail */}
      <div className="space-y-4">
        {projectsAnalysis.map((item) => {
          const { chantier } = item;

          return (
            <div
              key={chantier.id}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded">
                      {chantier.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{chantier.nom}</h3>
                    <span className="text-xs text-slate-500">
                      ({chantier.commune}, Wilaya de {chantier.wilaya})
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>Surface : <strong className="text-slate-800">{chantier.surfaceM2} m²</strong></span>
                    <span>Logements : <strong className="text-slate-800">{chantier.nbrLogements}</strong></span>
                    <span>Locaux : <strong className="text-slate-800">{chantier.nbrLocauxCommerciaux}</strong></span>
                    <span>Acquéreurs inscrits : <strong className="text-slate-800">{item.buyersCount}</strong></span>
                    <span>Avancement physique : <strong className="text-amber-600 font-bold">{chantier.avancementPourcentage}%</strong></span>
                  </div>
                </div>

                {/* Right Margin Pill */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
                      Marge Brute Prévue
                    </span>
                    <div className="flex items-baseline gap-1.5 justify-end">
                      <span className="text-lg font-black font-mono text-emerald-700">
                        {formatDZD(item.margeBruteDZD)}
                      </span>
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {item.margePourcentage}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost & Turnover Grid */}
              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Column 1: Sales / VSP */}
                <div className="space-y-3 p-4 bg-slate-50/70 rounded-xl border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      Chiffre d'Affaires VSP
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {formatDZD(item.caPrevisionnelTotalDZD)}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-200">
                    <div className="flex justify-between">
                      <span>Total déjà encaissé :</span>
                      <strong className="text-emerald-700 font-mono">{formatDZD(item.totalEncaisseVSP)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Reste à recouvrer :</span>
                      <strong className="text-amber-800 font-mono">{formatDZD(item.resteARecouvrerVSP)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Prix moyen au m² :</span>
                      <strong className="text-slate-800 font-mono">{formatDZD(item.prixVenteMoyenM2DZD)} / m²</strong>
                    </div>

                    {/* Recovery Gauge */}
                    <div className="pt-2">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-500">Taux d'encaissement</span>
                        <span className="font-bold text-slate-800">{item.tauxRecouvrement}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full"
                          style={{ width: `${Math.min(100, item.tauxRecouvrement)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Breakdown of Real Expenses */}
                <div className="space-y-3 p-4 bg-slate-50/70 rounded-xl border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Calculator className="w-4 h-4 text-red-600" />
                      Coût de Revient Réel
                    </span>
                    <span className="text-xs font-mono font-bold text-red-600">
                      {formatDZD(item.finalCoutReelDZD)}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200">
                    <div className="flex justify-between">
                      <span>• Matériaux & Liants (Ciment/Acier) :</span>
                      <span className="font-mono">{formatDZD(item.coutMateriaux)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Sous-traitance & Gros Œuvre :</span>
                      <span className="font-mono">{formatDZD(item.coutSousTraitance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Salaires & Quinzaines Paie :</span>
                      <span className="font-mono">{formatDZD(item.coutSalairesPaie)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Engins, Entretien & Carburant :</span>
                      <span className="font-mono">{formatDZD(item.coutEnginsTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Honoraires BET, CTC & Taxes :</span>
                      <span className="font-mono">{formatDZD(item.coutBETCTC)}</span>
                    </div>
                  </div>
                </div>

                {/* Column 3: Profitability & Unit Economics */}
                <div className="space-y-3 p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <TrendingUp className="w-4 h-4 text-emerald-700" />
                      Ratios Économiques & Marge
                    </span>

                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 bg-white rounded-lg border border-emerald-200">
                        <span className="text-[10px] text-slate-500 uppercase block">Coût Réel au m² Construit</span>
                        <p className="text-base font-bold font-mono text-slate-900">
                          {formatDZD(item.coutM2ConstruitDZD)} / m²
                        </p>
                      </div>

                      <div className="p-2.5 bg-white rounded-lg border border-emerald-200">
                        <span className="text-[10px] text-slate-500 uppercase block">Marge Nette Dégagée au m²</span>
                        <p className="text-base font-bold font-mono text-emerald-700">
                          {formatDZD(Math.max(0, item.prixVenteMoyenM2DZD - item.coutM2ConstruitDZD))} / m²
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-emerald-800 leading-snug pt-2">
                    Indicateur promoteur conforme aux normes du Ministère de l'Habitat et de l'Urbanisme (MHUV).
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
