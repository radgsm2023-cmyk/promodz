import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Transaction } from '../types';
import { formatDZD, formatDateFR, nombreEnLettresDZD } from '../utils/formatters';
import {
  Calculator,
  Receipt,
  FileText,
  Calendar,
  Building2,
  Printer,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Percent,
  Coins,
  FileCheck,
  TrendingUp,
  Info,
  ChevronDown,
  RefreshCw,
  Search,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const SyntheseFiscaleView: React.FC = () => {
  const {
    transactions,
    chantiers,
    userAllowedChantiers,
    isChantierAllowed,
    appSettings,
    bulletinsPaie,
    logAudit,
    currentUser,
  } = useApp();

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [selectedChantierId, setSelectedChantierId] = useState<string>('all');
  const [includePending, setIncludePending] = useState<boolean>(true); // Previsionnel: include en_attente & en_attente_visa
  const [tauxTvaVsp, setTauxTvaVsp] = useState<number>(0.19); // 19% normal, 9% reduit
  const [exonereTap, setExonereTap] = useState<boolean>(false); // Exonération TAP BTPH
  const [transactionSearch, setTransactionSearch] = useState<string>('');
  const [selectedDetailFilter, setSelectedDetailFilter] = useState<'all' | 'collectee' | 'deductible_biens' | 'deductible_services' | 'irg' | 'timbre'>('all');

  // Available months from recorded transactions
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add('2026-10');
    months.add('2026-09');
    months.add('2026-08');
    transactions.forEach((tx) => {
      if (tx.date) {
        months.add(tx.date.slice(0, 7));
      }
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  // Filtered transactions for the selected month and site
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Date filter
      if (!tx.date.startsWith(selectedMonth)) return false;

      // Scoped site permission
      if (!isChantierAllowed(tx.chantierId)) return false;

      // Specific site filter
      if (selectedChantierId !== 'all' && tx.chantierId !== selectedChantierId) return false;

      // Status filter
      if (!includePending) {
        return tx.statut === 'valide';
      } else {
        return tx.statut === 'valide' || tx.statut === 'en_attente' || tx.statut === 'en_attente_visa';
      }
    });
  }, [transactions, selectedMonth, selectedChantierId, includePending, isChantierAllowed]);

  // Filtered payroll slips for the selected month
  const filteredBulletins = useMemo(() => {
    return bulletinsPaie.filter((bp) => {
      if (!bp.periodeMois?.startsWith(selectedMonth)) return false;
      if (!isChantierAllowed(bp.chantierId)) return false;
      if (selectedChantierId !== 'all' && bp.chantierId !== selectedChantierId) return false;
      return true;
    });
  }, [bulletinsPaie, selectedMonth, selectedChantierId, isChantierAllowed]);

  // ==========================================
  // CALCULS AUTOMATIQUES DU G50 (ALGERIE)
  // ==========================================

  // 1. Chiffre d'Affaires & Encaissements Imposables (Recettes VSP & Clients)
  const transactionsEntrees = useMemo(() => {
    return filteredTransactions.filter(
      (tx) => tx.type === 'entree' && tx.categorie !== 'reapprovisionnement_caisse' && tx.categorie !== 'apport_associe_promoteur'
    );
  }, [filteredTransactions]);

  const totalEncaissementsImposablesTTC = useMemo(() => {
    return transactionsEntrees.reduce((sum, tx) => sum + tx.montantDZD, 0);
  }, [transactionsEntrees]);

  const baseHTVSP = Math.round(totalEncaissementsImposablesTTC / (1 + tauxTvaVsp));
  const tvaCollectee = Math.round(baseHTVSP * tauxTvaVsp);

  // 2. Taxe sur l'Activité Professionnelle (TAP) - 2%
  const tauxTAP = exonereTap ? 0 : 0.02;
  const montantTAP = Math.round(totalEncaissementsImposablesTTC * tauxTAP);

  // 3. Dépenses & Achats Déductibles de TVA (Sorties)
  // A. Achats de Biens & Matières de Construction (Ciment, Fer, Agrégats, Briques...)
  const transactionsBiens = useMemo(() => {
    return filteredTransactions.filter(
      (tx) =>
        tx.type === 'sortie' &&
        (tx.categorie === 'materiaux_construction' ||
          tx.categorie === 'gros_oeuvre' ||
          tx.categorie === 'second_oeuvre')
    );
  }, [filteredTransactions]);

  const totalDepensesBiensTTC = useMemo(() => {
    return transactionsBiens.reduce((sum, tx) => sum + tx.montantDZD, 0);
  }, [transactionsBiens]);

  // Taux de TVA récupérable sur matières premières BTPH (19%)
  const baseHTBiens = Math.round(totalDepensesBiensTTC / 1.19);
  const tvaDeductibleBiens = Math.round(baseHTBiens * 0.19);

  // B. Prestations de Services & Sous-traitance (Engins, BET, CTC, ST...)
  const transactionsServices = useMemo(() => {
    return filteredTransactions.filter(
      (tx) =>
        tx.type === 'sortie' &&
        (tx.categorie === 'sous_traitance' ||
          tx.categorie === 'honoraires_archi_ctc' ||
          tx.categorie === 'engins_carburant' ||
          tx.categorie === 'frais_generaux_bureau')
    );
  }, [filteredTransactions]);

  const totalDepensesServicesTTC = useMemo(() => {
    return transactionsServices.reduce((sum, tx) => sum + tx.montantDZD, 0);
  }, [transactionsServices]);

  const baseHTServices = Math.round(totalDepensesServicesTTC / 1.19);
  const tvaDeductibleServices = Math.round(baseHTServices * 0.19);

  // Total TVA Déductible
  const totalTvaDeductible = tvaDeductibleBiens + tvaDeductibleServices;

  // TVA Nette Due ou Crédit de TVA (Précompte)
  const soldeTVA = tvaCollectee - totalTvaDeductible;
  const tvaNetteDue = Math.max(0, soldeTVA);
  const creditTvaReportable = soldeTVA < 0 ? Math.abs(soldeTVA) : 0;

  // 4. Retenues à la Source : IRG / Salaires & Main-d'œuvre
  const transactionsMainOeuvre = useMemo(() => {
    return filteredTransactions.filter(
      (tx) => tx.type === 'sortie' && tx.categorie === 'main_d_oeuvre_journaliere'
    );
  }, [filteredTransactions]);

  const totalMasseSalarialeJournaliere = useMemo(() => {
    return transactionsMainOeuvre.reduce((sum, tx) => sum + tx.montantDZD, 0);
  }, [transactionsMainOeuvre]);

  const totalSalairesBulletins = useMemo(() => {
    return filteredBulletins.reduce((sum, bp) => sum + bp.netAPayerDZD, 0);
  }, [filteredBulletins]);

  const totalMasseSalarialePeriode = totalMasseSalarialeJournaliere + totalSalairesBulletins;
  // Barème IRG moyen estimé à la source (10%)
  const irgSalairesDue = Math.round(totalMasseSalarialePeriode * 0.10);

  // 5. Droits de Timbre Fiscal (Règlements en espèces)
  const transactionsEspeces = useMemo(() => {
    return filteredTransactions.filter((tx) => tx.modePaiement === 'especes');
  }, [filteredTransactions]);

  const droitTimbreEstime = useMemo(() => {
    // 1% sur encaissements/paiements espèces, min 50 DA, max 10 000 DA par quittance
    return transactionsEspeces.reduce((sum, tx) => {
      const timbre = Math.min(10000, Math.max(50, Math.round(tx.montantDZD * 0.01)));
      return sum + timbre;
    }, 0);
  }, [transactionsEspeces]);

  // 6. Acompte Provisionnel IBS (19% BTPH / Immobilier)
  const totalDepensesGlobales = totalDepensesBiensTTC + totalDepensesServicesTTC + totalMasseSalarialePeriode;
  const resultatNetEstime = Math.max(0, totalEncaissementsImposablesTTC - totalDepensesGlobales);
  // Provision mensuelle basée sur 1/3 de l'acompte trimestriel IBS
  const acompteIbsEstime = Math.round((resultatNetEstime * 0.19) / 3);

  // Total Net Prévisionnel G50 à régler
  const totalG50APayer = montantTAP + tvaNetteDue + irgSalairesDue + droitTimbreEstime + acompteIbsEstime;

  // Détermination de la date limite déclarative (20 du mois suivant)
  const [yearStr, monthStr] = selectedMonth.split('-');
  const dateMoisSuivant = new Date(parseInt(yearStr), parseInt(monthStr), 20);
  const dateLimiteG50 = `${dateMoisSuivant.getFullYear()}-${String(dateMoisSuivant.getMonth() + 1).padStart(2, '0')}-20`;
  const isEcheanceProche = true;

  // Drilldown items for the detailed table
  const drilldownTransactions = useMemo(() => {
    return filteredTransactions.filter((tx) => {
      if (transactionSearch.trim()) {
        const query = transactionSearch.toLowerCase();
        const matchText =
          tx.reference.toLowerCase().includes(query) ||
          tx.beneficiaireNom.toLowerCase().includes(query) ||
          tx.motif.toLowerCase().includes(query) ||
          (tx.bonCaisseNumero && tx.bonCaisseNumero.toLowerCase().includes(query));
        if (!matchText) return false;
      }

      if (selectedDetailFilter === 'collectee') {
        return tx.type === 'entree' && tx.categorie !== 'reapprovisionnement_caisse' && tx.categorie !== 'apport_associe_promoteur';
      }
      if (selectedDetailFilter === 'deductible_biens') {
        return (
          tx.type === 'sortie' &&
          (tx.categorie === 'materiaux_construction' ||
            tx.categorie === 'gros_oeuvre' ||
            tx.categorie === 'second_oeuvre')
        );
      }
      if (selectedDetailFilter === 'deductible_services') {
        return (
          tx.type === 'sortie' &&
          (tx.categorie === 'sous_traitance' ||
            tx.categorie === 'honoraires_archi_ctc' ||
            tx.categorie === 'engins_carburant' ||
            tx.categorie === 'frais_generaux_bureau')
        );
      }
      if (selectedDetailFilter === 'irg') {
        return tx.type === 'sortie' && tx.categorie === 'main_d_oeuvre_journaliere';
      }
      if (selectedDetailFilter === 'timbre') {
        return tx.modePaiement === 'especes';
      }
      return true;
    });
  }, [filteredTransactions, transactionSearch, selectedDetailFilter]);

  // Export PDF Officiel G50
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const moisNom = new Date(`${selectedMonth}-01`).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });

    // En-tête officiel DGI Algérie
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE', 105, 12, { align: 'center' });
    doc.setFontSize(10);
    doc.text('MINISTÈRE DES FINANCES — DIRECTION GÉNÉRALE DES IMPÔTS', 105, 18, { align: 'center' });
    doc.setFontSize(12);
    doc.text('DÉCLARATION MENSUELLE DES TAXES ET DROITS — SÉRIE G N° 50', 105, 25, { align: 'center' });

    // Informations du promoteur & Période
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.rect(14, 30, 182, 22);
    doc.text(`Raison Sociale : ${appSettings.raisonSociale} (${appSettings.formeJuridique})`, 18, 36);
    doc.text(`NIF : ${appSettings.nif || '002016091234567'}  |  RC : ${appSettings.registreCommerceRC || '16/00-098741B20'}  |  AI : ${appSettings.articleImpositionAI || '16120345678'}`, 18, 42);
    doc.text(`Siège : ${appSettings.siegeAdresse}, ${appSettings.siegeCommune} (${appSettings.siegeWilaya})`, 18, 48);
    doc.text(`Période Déclarative : ${moisNom.toUpperCase()}`, 135, 36);
    doc.text(`Date Limite : 20/${monthStr}/${yearStr}`, 135, 42);

    // Tableau Officiel G50
    autoTable(doc, {
      startY: 56,
      head: [
        [
          'CADRE / IMPÔT OU TAXE',
          'BASE IMPOSABLE (DZD)',
          'TAUX',
          'DÉDUCTION (DZD)',
          'MONTANT DÛ (DZD)',
        ],
      ],
      body: [
        [
          'CADRE I : Taxe sur l\'Activité Professionnelle (TAP)\n(Chiffre d\'affaires encaissé sur VSP)',
          formatDZD(totalEncaissementsImposablesTTC),
          exonereTap ? 'Exonéré' : '2.00%',
          '-',
          formatDZD(montantTAP),
        ],
        [
          `CADRE II-A : TVA Collectée (Ventes sur Plan)\n(Taux applicable : ${(tauxTvaVsp * 100).toFixed(0)}%)`,
          formatDZD(baseHTVSP),
          `${(tauxTvaVsp * 100).toFixed(0)}%`,
          '-',
          formatDZD(tvaCollectee),
        ],
        [
          'CADRE II-B : TVA Déductible sur Achats de Biens\n(Ciment, acier, briques, agrégats chantiers)',
          formatDZD(baseHTBiens),
          '19%',
          formatDZD(tvaDeductibleBiens),
          '-',
        ],
        [
          'CADRE II-C : TVA Déductible sur Services & Sous-traitance\n(Engins, sous-traitants, bureaux d\'études BET/CTC)',
          formatDZD(baseHTServices),
          '19%',
          formatDZD(tvaDeductibleServices),
          '-',
        ],
        [
          'CADRE II-D : TVA Nette Due ou (Crédit Reportable)\n(Total Collectée - Total Déductible)',
          '-',
          '-',
          formatDZD(totalTvaDeductible),
          soldeTVA >= 0 ? formatDZD(tvaNetteDue) : `Crédit: (${formatDZD(creditTvaReportable)})`,
        ],
        [
          'CADRE III : IRG / Salaires & Main-d\'œuvre\n(Retenue à la source ouvriers & collaborateurs)',
          formatDZD(totalMasseSalarialePeriode),
          'Barème / 10%',
          '-',
          formatDZD(irgSalairesDue),
        ],
        [
          'CADRE IV : Droit de Timbre de Quittance\n(Règlements en espèces selon barème légal)',
          formatDZD(transactionsEspeces.reduce((acc, t) => acc + t.montantDZD, 0)),
          '1% barème',
          '-',
          formatDZD(droitTimbreEstime),
        ],
        [
          'CADRE V : Acompte Provisionnel IBS (BTPH)\n(Provision sur marge nette prévisionnelle)',
          formatDZD(resultatNetEstime),
          '19% (1/3 trim.)',
          '-',
          formatDZD(acompteIbsEstime),
        ],
      ],
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [15, 23, 42] },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { halign: 'right', font: 'courier' },
        2: { halign: 'center' },
        3: { halign: 'right', font: 'courier' },
        4: { halign: 'right', font: 'courier', fontStyle: 'bold' },
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 6;

    // Total final
    doc.setFillColor(248, 250, 252);
    doc.rect(14, finalY, 182, 16, 'F');
    doc.rect(14, finalY, 182, 16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('TOTAL GÉNÉRAL DU BORDEREAU G50 À VERSER AU TRÉSOR PUBLIC :', 18, finalY + 10);
    doc.setFont('courier', 'bold');
    doc.setFontSize(12);
    doc.text(`${formatDZD(totalG50APayer)} DZD`, 190, finalY + 10, { align: 'right' });

    // Lettres
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text(`Arrêté la présente prévision G50 à la somme de : ${nombreEnLettresDZD(totalG50APayer)}.`, 18, finalY + 22);

    // Signatures
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Date d\'édition : ' + formatDateFR(new Date().toISOString()), 18, finalY + 32);
    doc.text('Visa de l\'Expert-Comptable / DAF :', 18, finalY + 40);
    doc.text('Signature & Cachet Officiel du Promoteur :', 135, finalY + 40);

    doc.save(`G50_Synthese_Fiscale_${selectedMonth}.pdf`);

    logAudit({
      utilisateurNom: currentUser.nom,
      utilisateurRole: currentUser.role,
      action: 'validation',
      module: 'fiscalite_manage' as any,
      entiteReference: `G50-${selectedMonth}`,
      details: `Génération et téléchargement du bordereau officiel de synthèse fiscale G50 (${formatDZD(totalG50APayer)} DZD)`,
      impactFinancierDZD: totalG50APayer,
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Reference',
      'Date',
      'Type',
      'Categorie',
      'Beneficiaire_Tier',
      'Chantier',
      'Montant_TTC_DZD',
      'Impact_Fiscal_G50',
      'Statut',
      'Mode_Paiement',
    ];

    const rows = drilldownTransactions.map((tx) => {
      let impact = 'Non applicable';
      if (tx.type === 'entree') impact = `Base TAP (2%) & TVA Collectée (${(tauxTvaVsp * 100).toFixed(0)}%)`;
      if (tx.categorie === 'materiaux_construction' || tx.categorie === 'gros_oeuvre' || tx.categorie === 'second_oeuvre')
        impact = 'TVA Déductible sur Biens (19%)';
      if (tx.categorie === 'sous_traitance' || tx.categorie === 'honoraires_archi_ctc' || tx.categorie === 'engins_carburant')
        impact = 'TVA Déductible sur Services (19%)';
      if (tx.categorie === 'main_d_oeuvre_journaliere') impact = 'Assiette IRG / Salaires';
      if (tx.modePaiement === 'especes') impact += ' + Timbre fiscal 1%';

      const ch = chantiers.find((c) => c.id === tx.chantierId);

      return [
        tx.reference,
        tx.date,
        tx.type,
        tx.categorie,
        `"${tx.beneficiaireNom.replace(/"/g, '""')}"`,
        `"${ch?.nom || tx.chantierId || 'Siège'}"`,
        tx.montantDZD,
        `"${impact}"`,
        tx.statut,
        tx.modePaiement,
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Synthese_Transactions_G50_${selectedMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5" />
                Série G N° 50 — Fiscalité BTPH & Promotion Immobilière
              </span>
              <span className="text-xs text-slate-400 font-mono">Loi n° 11-04 & Code des Impôts Directs</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Synthèse Fiscale & Prévisions G50</span>
              <span className="text-xs px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-wider">
                Automatisé en temps réel
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Consolidation automatique des flux de trésorerie enregistrés pour calculer les déclarations mensuelles de{' '}
              <strong className="text-amber-400">TAP</strong>, <strong className="text-amber-400">TVA (Collectée & Déductible)</strong>,{' '}
              <strong className="text-amber-400">IRG Salaires</strong>, <strong className="text-amber-400">Droits de Timbre</strong> et{' '}
              <strong className="text-amber-400">Acomptes IBS</strong>.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition shadow-xs cursor-pointer"
              title="Exporter les écritures fiscales en CSV"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl transition shadow-lg shadow-amber-400/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Générer Bordereau G50 Officiel (PDF)</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 relative z-10">
          {/* Month Selector */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Mois d'Imposition (G50)
            </label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-3 pointer-events-none" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 text-xs font-bold rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                {availableMonths.map((m) => {
                  const label = new Date(`${m}-01`).toLocaleDateString('fr-FR', {
                    month: 'long',
                    year: 'numeric',
                  });
                  return (
                    <option key={m} value={m}>
                      {label.charAt(0).toUpperCase() + label.slice(1)} ({m})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Chantier Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Périmètre Chantier
            </label>
            <div className="relative">
              <Building2 className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-3 pointer-events-none" />
              <select
                value={selectedChantierId}
                onChange={(e) => setSelectedChantierId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 text-xs font-bold rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="all">Tous les chantiers (Consolidé Siège)</option>
                {userAllowedChantiers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* TVA Rate Toggle */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Taux TVA VSP
            </label>
            <select
              value={tauxTvaVsp}
              onChange={(e) => setTauxTvaVsp(parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-xs font-bold rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value={0.19}>19% - Taux Normal (Promotion & Locaux)</option>
              <option value={0.09}>9% - Taux Réduit (Logement Aidé)</option>
            </select>
          </div>

          {/* TAP Regime Toggle */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Régime TAP (2%)
            </label>
            <button
              type="button"
              onClick={() => setExonereTap(!exonereTap)}
              className={`w-full py-2 px-3 text-xs font-bold rounded-xl border transition flex items-center justify-between cursor-pointer ${
                exonereTap
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              <span>{exonereTap ? 'Exonéré (LF BTPH)' : 'Assujetti 2.0%'}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${exonereTap ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>
                {exonereTap ? '0%' : '2%'}
              </span>
            </button>
          </div>

          {/* Pending Transactions Toggle */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Portée Prévisionnelle
            </label>
            <button
              type="button"
              onClick={() => setIncludePending(!includePending)}
              className={`w-full py-2 px-3 text-xs font-bold rounded-xl border transition flex items-center justify-between cursor-pointer ${
                includePending
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              <span>{includePending ? 'Validées + En Cours' : 'Validées Uniquement'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                {filteredTransactions.length} flux
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Tax Deadline Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-white border border-amber-300 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md shadow-amber-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Échéance Légale Déclaration & Paiement G50
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-950 border border-amber-300">
                Avant le 20 du mois M+1
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Dépôt obligatoire auprès de la Recette des Impôts compétente avant le <strong className="font-mono text-slate-900">{formatDateFR(dateLimiteG50)}</strong>.
              Montant prévisionnel total calculé à ordonnancer : <strong className="font-mono font-black text-amber-700">{formatDZD(totalG50APayer)} DZD</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right mr-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Nombre de Transactions</span>
            <span className="text-xs font-black font-mono text-slate-800">{filteredTransactions.length} flux pris en compte</span>
          </div>
          <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-700" />
            <span>Prêt pour Télédéclaration</span>
          </span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total G50 Due */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-amber-400 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Total Bordereau G50 Dû</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
            {formatDZD(totalG50APayer)} <span className="text-xs text-slate-500 font-normal">DZD</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Pression fiscale estimée :</span>
            <span className="font-bold font-mono text-slate-900">
              {totalEncaissementsImposablesTTC > 0
                ? `${((totalG50APayer / totalEncaissementsImposablesTTC) * 100).toFixed(1)}%`
                : '0.0%'}
            </span>
          </div>
        </div>

        {/* TVA Nette Due or Credit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-blue-400 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
              {soldeTVA >= 0 ? 'TVA Nette à Décaisser' : 'Crédit de TVA (Reportable)'}
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
              soldeTVA >= 0 ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black font-mono tracking-tight ${
            soldeTVA >= 0 ? 'text-slate-900' : 'text-emerald-600'
          }`}>
            {soldeTVA >= 0 ? formatDZD(tvaNetteDue) : `+${formatDZD(creditTvaReportable)}`} <span className="text-xs text-slate-500 font-normal">DZD</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Collectée: {formatDZD(tvaCollectee)}</span>
            <span>Déductible: {formatDZD(totalTvaDeductible)}</span>
          </div>
        </div>

        {/* TAP (2%) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-purple-400 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Taxe Activité (TAP 2%)</span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
            {formatDZD(montantTAP)} <span className="text-xs text-slate-500 font-normal">DZD</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Base CA Encaissé :</span>
            <span className="font-bold font-mono text-slate-900">{formatDZD(totalEncaissementsImposablesTTC)}</span>
          </div>
        </div>

        {/* Retenues Salaires & Timbre */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-emerald-400 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">IRG / Salaires & Timbres</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
            {formatDZD(irgSalairesDue + droitTimbreEstime)} <span className="text-xs text-slate-500 font-normal">DZD</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>IRG: {formatDZD(irgSalairesDue)}</span>
            <span>Timbres Espèces: {formatDZD(droitTimbreEstime)}</span>
          </div>
        </div>
      </div>

      {/* Official Reconstituted G50 Statement Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Bordereau Récapitulatif G50 (Format Conforme DGI)
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                Période {selectedMonth}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Calculé à partir des {filteredTransactions.length} transactions et {filteredBulletins.length} bulletins de paie de la période
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Total prévisionnel :</span>
            <span className="text-base font-black font-mono text-amber-700 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
              {formatDZD(totalG50APayer)} DZD
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 text-[11px] font-black uppercase tracking-wider">
                <th className="px-6 py-3">Rubrique / Nature de l'Impôt</th>
                <th className="px-6 py-3 text-right">Base Imposable (TTC / HT)</th>
                <th className="px-6 py-3 text-center">Taux Appliqué</th>
                <th className="px-6 py-3 text-right">Déductions / Précomptes</th>
                <th className="px-6 py-3 text-right">Montant Prévisionnel Dû</th>
                <th className="px-6 py-3 text-center">Détail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
              {/* Ligne 1 : TAP */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">1. Taxe sur l'Activité Professionnelle (TAP)</div>
                  <div className="text-[11px] text-slate-500">Chiffre d'affaires encaissé sur ventes sur plan et locaux commerciaux</div>
                </td>
                <td className="px-6 py-4 text-right font-mono font-semibold">
                  {formatDZD(totalEncaissementsImposablesTTC)} DA
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${exonereTap ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                    {exonereTap ? 'Exonéré' : '2.0%'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-mono text-slate-400">-</td>
                <td className="px-6 py-4 text-right font-mono font-black text-slate-900">
                  {formatDZD(montantTAP)} DA
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => setSelectedDetailFilter('collectee')}
                    className="text-[11px] font-bold text-amber-700 hover:underline"
                  >
                    Voir flux
                  </button>
                </td>
              </tr>

              {/* Ligne 2 : TVA Collectée */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">2. TVA Collectée sur VSP</div>
                  <div className="text-[11px] text-slate-500">Ventes d'appartements et locaux facturés/encaissés sur la période</div>
                </td>
                <td className="px-6 py-4 text-right font-mono font-semibold">
                  {formatDZD(baseHTVSP)} DA <span className="text-[10px] text-slate-400 font-sans">(HT)</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                    {(tauxTvaVsp * 100).toFixed(0)}%
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-mono text-slate-400">-</td>
                <td className="px-6 py-4 text-right font-mono font-black text-slate-900">
                  {formatDZD(tvaCollectee)} DA
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => setSelectedDetailFilter('collectee')}
                    className="text-[11px] font-bold text-amber-700 hover:underline"
                  >
                    Voir flux
                  </button>
                </td>
              </tr>

              {/* Ligne 3 : TVA Déductible Biens */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">3. TVA Déductible sur Achats de Biens & Matières</div>
                  <div className="text-[11px] text-slate-500">Ciment, acier fer à béton, agrégats, briques, carrelage, plomberie</div>
                </td>
                <td className="px-6 py-4 text-right font-mono font-semibold">
                  {formatDZD(baseHTBiens)} DA <span className="text-[10px] text-slate-400 font-sans">(HT)</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">19% déductible</span>
                </td>
                <td className="px-6 py-4 text-right font-mono font-black text-emerald-600">
                  ({formatDZD(tvaDeductibleBiens)}) DA
                </td>
                <td className="px-6 py-4 text-right font-mono text-slate-400">-</td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => setSelectedDetailFilter('deductible_biens')}
                    className="text-[11px] font-bold text-amber-700 hover:underline"
                  >
                    Voir flux
                  </button>
                </td>
              </tr>

              {/* Ligne 4 : TVA Déductible Services */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">4. TVA Déductible sur Services & Sous-traitance</div>
                  <div className="text-[11px] text-slate-500">Contrats de sous-traitance, bureaux d'études BET, contrôle CTC, carburant engins</div>
                </td>
                <td className="px-6 py-4 text-right font-mono font-semibold">
                  {formatDZD(baseHTServices)} DA <span className="text-[10px] text-slate-400 font-sans">(HT)</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">19% déductible</span>
                </td>
                <td className="px-6 py-4 text-right font-mono font-black text-emerald-600">
                  ({formatDZD(tvaDeductibleServices)}) DA
                </td>
                <td className="px-6 py-4 text-right font-mono text-slate-400">-</td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => setSelectedDetailFilter('deductible_services')}
                    className="text-[11px] font-bold text-amber-700 hover:underline"
                  >
                    Voir flux
                  </button>
                </td>
              </tr>

              {/* Ligne 5 : Solde TVA Due / Crédit */}
              <tr className="bg-slate-50/60 font-bold border-y-2 border-slate-200">
                <td className="px-6 py-3.5">
                  <span className="font-black text-slate-900 uppercase">
                    Solde Net TVA ({soldeTVA >= 0 ? 'TVA à Verser' : 'Crédit Reportable'})
                  </span>
                </td>
                <td className="px-6 py-3.5 text-right font-mono">-</td>
                <td className="px-6 py-3.5 text-center font-mono">Net</td>
                <td className="px-6 py-3.5 text-right font-mono font-black text-emerald-700">
                  Total Déductible: {formatDZD(totalTvaDeductible)} DA
                </td>
                <td className={`px-6 py-3.5 text-right font-mono font-black text-sm ${soldeTVA >= 0 ? 'text-slate-950' : 'text-emerald-700'}`}>
                  {soldeTVA >= 0 ? `${formatDZD(tvaNetteDue)} DA` : `Crédit: (${formatDZD(creditTvaReportable)} DA)`}
                </td>
                <td className="px-6 py-3.5 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${soldeTVA >= 0 ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'}`}>
                    {soldeTVA >= 0 ? 'À régler' : 'Report M+1'}
                  </span>
                </td>
              </tr>

              {/* Ligne 6 : IRG Salaires */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">5. Retenue à la Source IRG / Salaires & Main-d'œuvre</div>
                  <div className="text-[11px] text-slate-500">Ouvriers de chantiers, pointage journalier et cadres administratifs</div>
                </td>
                <td className="px-6 py-4 text-right font-mono font-semibold">
                  {formatDZD(totalMasseSalarialePeriode)} DA
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                    Barème IRG (~10%)
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-mono text-slate-400">-</td>
                <td className="px-6 py-4 text-right font-mono font-black text-slate-900">
                  {formatDZD(irgSalairesDue)} DA
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => setSelectedDetailFilter('irg')}
                    className="text-[11px] font-bold text-amber-700 hover:underline"
                  >
                    Voir flux
                  </button>
                </td>
              </tr>

              {/* Ligne 7 : Droit de timbre */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">6. Droits de Timbre Fiscal (Règlements en Espèces)</div>
                  <div className="text-[11px] text-slate-500">Calculé sur les quittances et décaissements espèces selon code du timbre</div>
                </td>
                <td className="px-6 py-4 text-right font-mono font-semibold">
                  {formatDZD(transactionsEspeces.reduce((sum, tx) => sum + tx.montantDZD, 0))} DA
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">1% plafonné</span>
                </td>
                <td className="px-6 py-4 text-right font-mono text-slate-400">-</td>
                <td className="px-6 py-4 text-right font-mono font-black text-slate-900">
                  {formatDZD(droitTimbreEstime)} DA
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => setSelectedDetailFilter('timbre')}
                    className="text-[11px] font-bold text-amber-700 hover:underline"
                  >
                    Voir flux
                  </button>
                </td>
              </tr>

              {/* Ligne 8 : Provision IBS */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">7. Acompte Provisionnel IBS (BTPH 19%)</div>
                  <div className="text-[11px] text-slate-500">Marge brute estimée d'exploitation ({formatDZD(resultatNetEstime)} DA)</div>
                </td>
                <td className="px-6 py-4 text-right font-mono font-semibold">
                  {formatDZD(resultatNetEstime)} DA
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">19% (1/3 trim.)</span>
                </td>
                <td className="px-6 py-4 text-right font-mono text-slate-400">-</td>
                <td className="px-6 py-4 text-right font-mono font-black text-slate-900">
                  {formatDZD(acompteIbsEstime)} DA
                </td>
                <td className="px-6 py-4 text-center font-mono text-[11px] text-slate-400">-</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white font-black text-sm">
                <td colSpan={4} className="px-6 py-4 uppercase tracking-wider text-amber-400">
                  TOTAL NET PRÉVISIONNEL G50 À VERSER AU TRÉSOR PUBLIC ({selectedMonth}) :
                </td>
                <td className="px-6 py-4 text-right font-mono text-lg text-amber-400 font-black">
                  {formatDZD(totalG50APayer)} DZD
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={handleExportPDF}
                    className="px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 text-[10px] font-black uppercase transition cursor-pointer"
                  >
                    Télécharger
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Drill-down Transactions Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <span>Justificatifs & Écritures ayant alimenté le G50</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold">
                {drilldownTransactions.length} transaction(s)
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Audit transactionnel ligne à ligne pour justification fiscale et commissariat aux comptes
            </p>
          </div>

          {/* Quick Sub-Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedDetailFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedDetailFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Toutes ({filteredTransactions.length})
            </button>
            <button
              onClick={() => setSelectedDetailFilter('collectee')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedDetailFilter === 'collectee'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
              }`}
            >
              TVA Collectée ({transactionsEntrees.length})
            </button>
            <button
              onClick={() => setSelectedDetailFilter('deductible_biens')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedDetailFilter === 'deductible_biens'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              TVA Déductible Biens ({transactionsBiens.length})
            </button>
            <button
              onClick={() => setSelectedDetailFilter('deductible_services')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedDetailFilter === 'deductible_services'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              TVA Déductible Services ({transactionsServices.length})
            </button>
            <button
              onClick={() => setSelectedDetailFilter('irg')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedDetailFilter === 'irg'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
              }`}
            >
              IRG Salaires ({transactionsMainOeuvre.length})
            </button>
          </div>
        </div>

        {/* Search input inside transactions */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Rechercher par référence, fournisseur, tiers, motif ou bon de caisse..."
            value={transactionSearch}
            onChange={(e) => setTransactionSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
          />
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-4 py-2.5">Date & Réf</th>
                <th className="px-4 py-2.5">Chantier</th>
                <th className="px-4 py-2.5">Tiers / Bénéficiaire</th>
                <th className="px-4 py-2.5">Catégorie & Motif</th>
                <th className="px-4 py-2.5">Mode</th>
                <th className="px-4 py-2.5 text-right">Montant TTC</th>
                <th className="px-4 py-2.5">Traitement Fiscal G50</th>
                <th className="px-4 py-2.5 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {drilldownTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Aucune transaction correspondante pour cette période et ce filtre.
                  </td>
                </tr>
              ) : (
                drilldownTransactions.map((tx) => {
                  const ch = chantiers.find((c) => c.id === tx.chantierId);

                  // Fiscal description for this transaction
                  let fiscalTag = 'Hors champ principal';
                  let tagColor = 'bg-slate-100 text-slate-700';

                  if (tx.type === 'entree') {
                    fiscalTag = `Base TAP + TVA Collectée ${(tauxTvaVsp * 100).toFixed(0)}% (${formatDZD(Math.round((tx.montantDZD / (1 + tauxTvaVsp)) * tauxTvaVsp))} DA)`;
                    tagColor = 'bg-blue-100 text-blue-800 font-bold';
                  } else if (
                    tx.categorie === 'materiaux_construction' ||
                    tx.categorie === 'gros_oeuvre' ||
                    tx.categorie === 'second_oeuvre'
                  ) {
                    fiscalTag = `TVA Déductible Biens 19% (${formatDZD(Math.round((tx.montantDZD / 1.19) * 0.19))} DA)`;
                    tagColor = 'bg-emerald-100 text-emerald-800 font-bold';
                  } else if (
                    tx.categorie === 'sous_traitance' ||
                    tx.categorie === 'honoraires_archi_ctc' ||
                    tx.categorie === 'engins_carburant' ||
                    tx.categorie === 'frais_generaux_bureau'
                  ) {
                    fiscalTag = `TVA Déductible Services 19% (${formatDZD(Math.round((tx.montantDZD / 1.19) * 0.19))} DA)`;
                    tagColor = 'bg-emerald-100 text-emerald-800 font-bold';
                  } else if (tx.categorie === 'main_d_oeuvre_journaliere') {
                    fiscalTag = `Assiette IRG Salaires 10% (${formatDZD(Math.round(tx.montantDZD * 0.10))} DA)`;
                    tagColor = 'bg-purple-100 text-purple-800 font-bold';
                  }

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">{tx.reference}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{tx.date}</div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-800 block truncate max-w-[150px]">
                          {ch?.nom || 'Siège Central'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{ch?.code || 'SIEGE'}</span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 truncate max-w-[180px]">{tx.beneficiaireNom}</div>
                        {tx.bonCaisseNumero && (
                          <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1 rounded">
                            {tx.bonCaisseNumero}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 max-w-xs">
                        <span className="font-semibold text-slate-800 block text-[11px] truncate">{tx.motif}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">{tx.categorie.replace(/_/g, ' ')}</span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 uppercase">
                          {tx.modePaiement}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold whitespace-nowrap">
                        <span className={tx.type === 'entree' ? 'text-emerald-700' : 'text-slate-900'}>
                          {tx.type === 'entree' ? '+' : '-'}{formatDZD(tx.montantDZD)} DA
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded-lg text-[10px] ${tagColor}`}>
                          {fiscalTag}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            tx.statut === 'valide'
                              ? 'bg-emerald-100 text-emerald-800'
                              : tx.statut === 'en_attente_visa'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {tx.statut === 'valide' ? 'Validé' : 'En Attente'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
