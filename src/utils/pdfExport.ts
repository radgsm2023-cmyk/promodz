import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Chantier, CaisseFondRoulement, Transaction, Employe, BulletinPaie, Materiel, TransfertMateriel } from '../types';
import { formatDZD, formatDateFR, CORPS_METIER_LABELS, CATEGORIE_MATERIEL_LABELS, STATUT_MATERIEL_LABELS } from './formatters';

interface FinancialReportOptions {
  titre?: string;
  mois: string; // e.g. "2026-10" or "Octobre 2026"
  chantierId?: string | null;
  chantiers: Chantier[];
  caisses: CaisseFondRoulement[];
  transactions: Transaction[];
  inclureJournal?: boolean;
}

interface PayrollReportOptions {
  titre?: string;
  periode: string; // e.g. "Octobre 2026"
  chantierId?: string | null;
  chantiers: Chantier[];
  employes: Employe[];
  bulletinsPaie: BulletinPaie[];
}

/**
 * Draws the standard corporate header for SARL BATIPROMOTE ALGÉRIE
 */
function drawCorporateHeader(
  doc: jsPDF,
  title: string,
  subtitle: string,
  chantierNom?: string,
  periodeLabel?: string
) {
  // Brand Header Box
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(14, 12, 182, 28, 'F');

  // Amber accent bar
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(14, 12, 4, 28, 'F');

  // Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('SARL BATIPROMOTE ALGÉRIE', 23, 21);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('Société de Promotion Immobilière & Travaux de Bâtiment · Agrément n° 16/DHW/2021', 23, 27);
  doc.text('Siège : Val d\'Hydra, Alger · RC : 16/00-098741B20 · NIF : 002016009874133 · Devise : Dinar Algérien (DA)', 23, 33);

  // Document Title & Metadata
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(title.toUpperCase(), 14, 48);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(subtitle, 14, 54);

  // Metadata Pill Box (Right aligned)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(120, 44, 76, 14, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Période : ${periodeLabel || 'Courante'}`, 123, 49.5);
  doc.text(`Chantier : ${chantierNom || 'Tous les chantiers'}`, 123, 54.5);

  // Separator line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(14, 61, 196, 61);
}

/**
 * Draws the footer with signature placeholders and page numbers
 */
function drawCorporateFooter(doc: jsPDF, pageNumber: number, totalPages: number) {
  const pageHeight = doc.internal.pageSize.height || 297;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, pageHeight - 20, 196, pageHeight - 20);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'BatiPromote DZ · Document certifié conforme généré automatiquement · Valable pour justificatif de gestion & fiscalité',
    14,
    pageHeight - 15
  );

  doc.setFont('helvetica', 'normal');
  doc.text(`Page ${pageNumber} / ${totalPages}`, 180, pageHeight - 15);
}

/**
 * Exports a comprehensive Monthly Financial Report to PDF
 */
export function exportBilanFinancierPDF(options: FinancialReportOptions): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { mois, chantierId, chantiers, caisses, transactions, inclureJournal = true } = options;

  const targetChantier = chantierId ? chantiers.find((c) => c.id === chantierId) : null;
  const chantierNom = targetChantier ? targetChantier.nom : 'Tous les chantiers de la promotion';

  // Filter transactions by chantier and by month
  const filteredTx = transactions.filter((tx) => {
    if (chantierId && tx.chantierId !== chantierId) return false;
    if (mois && mois !== 'all') {
      const txMonth = tx.date.slice(0, 7);
      if (txMonth !== mois && !mois.toLowerCase().includes(txMonth)) {
        // Also check if text matches e.g. "2026-10"
        if (!tx.date.startsWith(mois.slice(0, 7))) {
          return false;
        }
      }
    }
    return true;
  });

  const totalDepenses = filteredTx
    .filter((tx) => tx.type === 'sortie')
    .reduce((acc, tx) => acc + tx.montantDZD, 0);

  const totalRecettes = filteredTx
    .filter((tx) => tx.type === 'entree')
    .reduce((acc, tx) => acc + tx.montantDZD, 0);

  const totalTransferts = filteredTx
    .filter((tx) => tx.type === 'transfert_caisse')
    .reduce((acc, tx) => acc + tx.montantDZD, 0);

  const soldeNet = totalRecettes - totalDepenses;

  // Header
  drawCorporateHeader(
    doc,
    'Bilan Financier & Trésorerie Mensuel',
    'Rapport de gestion multi-chantiers · Suivi des flux et caisses de roulement',
    chantierNom,
    mois
  );

  let startY = 66;

  // Key Figures Summary KPI Cards (4 columns)
  const cardWidth = 43;
  const cardHeight = 18;
  const startX = 14;

  const kpis = [
    { label: 'RECETTES ENCAISSÉES', value: formatDZD(totalRecettes), color: [16, 185, 129] }, // emerald
    { label: 'DÉPENSES ENGAGÉES', value: formatDZD(totalDepenses), color: [239, 68, 68] }, // red
    { label: 'FLUX NET TRÉSORERIE', value: formatDZD(soldeNet), color: soldeNet >= 0 ? [5, 150, 105] : [220, 38, 38] },
    { label: 'FONDS DE ROULEMENT', value: formatDZD(caisses.reduce((acc, c) => acc + c.soldeActuelDZD, 0)), color: [217, 119, 6] },
  ];

  kpis.forEach((kpi, idx) => {
    const x = startX + idx * (cardWidth + 3.3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    // Colored top line
    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.rect(x, startY, cardWidth, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 3, startY + 6);

    doc.setFontSize(8.5);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, x + 3, startY + 12.5);
  });

  startY += 24;

  // Section 1: Breakdown by Project / Chantier
  const chantierRows = (chantierId ? chantiers.filter((c) => c.id === chantierId) : chantiers).map((ch) => {
    const depCh = filteredTx
      .filter((tx) => tx.chantierId === ch.id && tx.type === 'sortie')
      .reduce((a, b) => a + b.montantDZD, 0);
    const recCh = filteredTx
      .filter((tx) => tx.chantierId === ch.id && tx.type === 'entree')
      .reduce((a, b) => a + b.montantDZD, 0);
    const pct = ch.budgetTotalDZD > 0 ? Math.round((ch.depensesEngageesDZD / ch.budgetTotalDZD) * 100) : 0;

    return [
      ch.nom,
      ch.wilaya,
      `${ch.avancementPourcentage}%`,
      formatDZD(ch.budgetTotalDZD),
      formatDZD(depCh),
      formatDZD(recCh),
      `${pct}%`,
    ];
  });

  autoTable(doc, {
    startY,
    head: [['Chantier / Projet', 'Wilaya', 'Avanc.', 'Budget Total DA', 'Dépenses Période', 'Recettes Période', '% Conso']],
    body: chantierRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 20 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 26, halign: 'right' },
      6: { cellWidth: 13, halign: 'center' },
    },
  });

  // @ts-ignore
  let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : startY + 30;

  // Section 2: Petty cash balances status
  finalY += 6;
  const caisseRows = caisses.map((c) => {
    const alert = c.soldeActuelDZD <= c.seuilAlerteDZD ? 'Alerte Basse' : 'Normal';
    return [
      c.code,
      c.nom,
      c.responsable,
      formatDZD(c.seuilAlerteDZD),
      formatDZD(c.soldeActuelDZD),
      alert,
    ];
  });

  autoTable(doc, {
    startY: finalY,
    head: [['Réf', 'Caisse Fond de Roulement', 'Responsable', 'Seuil Alerte DA', 'Solde Actuel DA', 'État']],
    body: caisseRows,
    theme: 'striped',
    headStyles: {
      fillColor: [217, 119, 6], // amber-600
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 55 },
      2: { cellWidth: 40 },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 15, halign: 'center' },
    },
  });

  // Section 3: Transactions Journal (if requested)
  if (inclureJournal && filteredTx.length > 0) {
    // Add page for transactions journal
    doc.addPage();
    drawCorporateHeader(
      doc,
      'Journal des Opérations & Règlements',
      'Détail des pièces comptables, bons de caisse et virements bancaires',
      chantierNom,
      mois
    );

    const txRows = filteredTx.map((tx) => {
      const ch = chantiers.find((c) => c.id === tx.chantierId);
      const isOut = tx.type === 'sortie';
      const sign = isOut ? '-' : tx.type === 'entree' ? '+' : '';
      return [
        formatDateFR(tx.date),
        tx.reference,
        ch ? ch.nom : 'Siège / Caisse centrale',
        tx.beneficiaireNom,
        tx.motif,
        tx.modePaiement.toUpperCase(),
        `${sign}${formatDZD(tx.montantDZD)}`,
      ];
    });

    autoTable(doc, {
      startY: 66,
      head: [['Date', 'Réf.', 'Chantier', 'Bénéficiaire / Tiers', 'Motif de l\'opération', 'Mode', 'Montant DA']],
      body: txRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        textColor: [15, 23, 42],
      },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 24, fontStyle: 'bold' },
        2: { cellWidth: 32 },
        3: { cellWidth: 34 },
        4: { cellWidth: 44 },
        5: { cellWidth: 14, halign: 'center' },
        6: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
      },
    });
  }

  // Dual Signatures Area on the last page
  const pageCount = (doc.internal as any).getNumberOfPages();
  doc.setPage(pageCount);

  // @ts-ignore
  let signY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 230;
  if (signY > 245) {
    doc.addPage();
    signY = 30;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  // Left signature box
  doc.text('Le Chef Comptable / Trésorier', 25, signY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Visa & Date de vérification des caisses', 25, signY + 4);
  doc.setDrawColor(203, 213, 225);
  doc.line(25, signY + 18, 75, signY + 18);

  // Right signature box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Le Promoteur Immobilier / Directeur Général', 125, signY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Approbation définitive & Arrêté de trésorerie', 125, signY + 4);
  doc.line(125, signY + 18, 185, signY + 18);

  // Draw corporate footers across all pages
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawCorporateFooter(doc, i, totalPages);
  }

  return doc;
}

/**
 * Exports a comprehensive Monthly Payroll and Site Workforce Report to PDF
 */
export function exportBilanPaiePDF(options: PayrollReportOptions): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { periode, chantierId, chantiers, employes, bulletinsPaie } = options;

  const targetChantier = chantierId ? chantiers.find((c) => c.id === chantierId) : null;
  const chantierNom = targetChantier ? targetChantier.nom : 'Tous les chantiers de la promotion';

  const filteredEmployes = chantierId
    ? employes.filter((e) => e.chantierId === chantierId)
    : employes;

  const filteredBulletins = bulletinsPaie.filter((bp) => {
    if (chantierId && bp.chantierId !== chantierId) return false;
    if (periode && periode !== 'all') {
      if (!bp.periodeMois.toLowerCase().includes(periode.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  const totalBrut = filteredBulletins.reduce(
    (a, b) => a + (b.salaireBaseDZD + b.primePanierTransportDZD + b.heuresSupplementairesDZD),
    0
  );
  const totalNet = filteredBulletins.reduce((a, b) => a + b.netAPayerDZD, 0);
  const totalAcomptes = filteredBulletins.reduce((a, b) => a + (b.avancesAcomptesDeduitesDZD || 0), 0);
  const totalPaye = filteredBulletins.filter((b) => b.statut === 'paye').reduce((a, b) => a + b.netAPayerDZD, 0);
  const totalEnAttente = filteredBulletins.filter((b) => b.statut === 'en_attente').reduce((a, b) => a + b.netAPayerDZD, 0);

  // Corporate Header
  drawCorporateHeader(
    doc,
    'Bilan Mensuel de Paie & Débours Main-d\'Œuvre',
    'Rapport de pointage des quinzaines, salaires permanents et émargements chantiers',
    chantierNom,
    periode
  );

  let startY = 66;

  // KPI Strip
  const cardWidth = 43;
  const cardHeight = 18;
  const startX = 14;

  const kpis = [
    { label: 'EFFECTIF MOBILISÉ', value: `${filteredEmployes.length} ouvriers`, color: [30, 41, 59] },
    { label: 'MASSE SALARIALE NETTE', value: formatDZD(totalNet), color: [16, 185, 129] },
    { label: 'ACOMPTES DÉDUITS', value: formatDZD(totalAcomptes), color: [220, 38, 38] },
    { label: 'SALAIRES EN ATTENTE', value: formatDZD(totalEnAttente), color: [217, 119, 6] },
  ];

  kpis.forEach((kpi, idx) => {
    const x = startX + idx * (cardWidth + 3.3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.rect(x, startY, cardWidth, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 3, startY + 6);

    doc.setFontSize(8.5);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, x + 3, startY + 12.5);
  });

  startY += 24;

  // Table of Payroll Slips & Worker Breakdown
  const tableData = filteredBulletins.map((bp) => {
    const metierLabel = CORPS_METIER_LABELS[bp.corpsMetier]?.label || bp.corpsMetier;
    const statutTxt = bp.statut === 'paye' ? 'RÉGLÉ' : 'EN ATTENTE';

    return [
      bp.reference,
      bp.employeNom,
      metierLabel,
      bp.chantierNom,
      `${bp.joursTravailles} j`,
      formatDZD(bp.salaireBaseDZD),
      `+${formatDZD(bp.primePanierTransportDZD + bp.heuresSupplementairesDZD)}`,
      bp.avancesAcomptesDeduitesDZD > 0 ? `-${formatDZD(bp.avancesAcomptesDeduitesDZD)}` : '0,00',
      formatDZD(bp.netAPayerDZD),
      statutTxt,
    ];
  });

  autoTable(doc, {
    startY,
    head: [['Réf.', 'Salarié', 'Corps d\'État', 'Chantier', 'Jours', 'Base DA', 'Primes DA', 'Acomptes DA', 'Net à Payer DA', 'Statut']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: 'bold' },
      1: { cellWidth: 28 },
      2: { cellWidth: 26 },
      3: { cellWidth: 26 },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 18, halign: 'right' },
      6: { cellWidth: 16, halign: 'right' },
      7: { cellWidth: 16, halign: 'right', textColor: [220, 38, 38] },
      8: { cellWidth: 20, halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] },
      9: { cellWidth: 16, halign: 'center' },
    },
  });

  // @ts-ignore
  let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : startY + 30;

  // Breakdown by Site Crew Deployment
  finalY += 8;
  if (finalY > 210) {
    doc.addPage();
    finalY = 30;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('RÉPARTITION DU PERSONNEL ACTIF PAR CHANTIER', 14, finalY);

  const deploymentRows = (chantierId ? chantiers.filter((c) => c.id === chantierId) : chantiers).map((ch) => {
    const chEmps = employes.filter((e) => e.chantierId === ch.id);
    const journaliers = chEmps.filter((e) => e.typeContrat === 'journalier_quinzaine').length;
    const permanents = chEmps.filter((e) => e.typeContrat === 'mensuel_permanent').length;
    const chPaie = filteredBulletins
      .filter((b) => b.chantierId === ch.id)
      .reduce((a, b) => a + b.netAPayerDZD, 0);

    return [
      ch.nom,
      ch.wilaya,
      ch.chefChantier,
      `${chEmps.length} ouvriers`,
      `${journaliers} jour. / ${permanents} perm.`,
      formatDZD(chPaie),
    ];
  });

  autoTable(doc, {
    startY: finalY + 4,
    head: [['Chantier', 'Wilaya', 'Chef de Chantier', 'Effectif Déployé', 'Type Contrat', 'Masse Salariale Période DA']],
    body: deploymentRows,
    theme: 'striped',
    headStyles: {
      fillColor: [217, 119, 6], // amber-600
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 20 },
      2: { cellWidth: 35 },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 35 },
      5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
  });

  // Signatures on the last page
  const pageCount = (doc.internal as any).getNumberOfPages();
  doc.setPage(pageCount);

  // @ts-ignore
  let signY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 230;
  if (signY > 245) {
    doc.addPage();
    signY = 30;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  doc.text('Le Responsable RH / Pointage Chantier', 25, signY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Visa de conformité des heures et pointages', 25, signY + 4);
  doc.setDrawColor(203, 213, 225);
  doc.line(25, signY + 18, 75, signY + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Le Directeur des Travaux & Promoteur', 125, signY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Bon à payer & Ordonnancement des caisses', 125, signY + 4);
  doc.line(125, signY + 18, 185, signY + 18);

  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawCorporateFooter(doc, i, totalPages);
  }

  return doc;
}

/**
 * Downloads a single employee's payslip as an official PDF
 */
export function exportBulletinIndividuelPDF(bulletin: BulletinPaie, employe?: Employe): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Draw Header
  drawCorporateHeader(
    doc,
    'Bulletin de Paie & Bordereau d\'Émargement',
    'Décompte des salaires de quinzaine chantier et émargement de versement',
    bulletin.chantierNom,
    bulletin.periodeMois
  );

  const startY = 66;

  // Worker & site info box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, startY, 182, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(bulletin.employeNom, 18, startY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Matricule : ${employe?.matricule || 'EMP-DZ-AUTO'}   ·   CNI Biométrique : ${employe?.cniNumero || '-'}`, 18, startY + 14);
  doc.text(`Qualification : ${employe?.specialiteLibelle || bulletin.corpsMetier}`, 18, startY + 20);
  doc.text(`Chantier d'imputation : ${bulletin.chantierNom}`, 18, startY + 25);

  doc.text(`Période : ${bulletin.periodeMois}`, 115, startY + 14);
  doc.text(`Régime : ${bulletin.typeContrat.replace(/_/g, ' ')}`, 115, startY + 20);
  doc.text(`Réf. Bulletin : ${bulletin.reference}`, 115, startY + 25);

  // Table breakdown
  const rubriques = [
    [
      'Salaire de base / Jours travaillés (Pointage)',
      `${bulletin.joursTravailles} jours`,
      formatDZD(bulletin.tarifUnitaireDZD),
      formatDZD(bulletin.salaireBaseDZD),
    ],
  ];

  if (bulletin.primePanierTransportDZD > 0) {
    rubriques.push([
      'Indemnité de panier & transport chantier',
      'Forfait',
      '-',
      `+${formatDZD(bulletin.primePanierTransportDZD)}`,
    ]);
  }

  if (bulletin.heuresSupplementairesDZD > 0) {
    rubriques.push([
      'Heures supplémentaires & coulage exceptionnel',
      '-',
      '-',
      `+${formatDZD(bulletin.heuresSupplementairesDZD)}`,
    ]);
  }

  if (bulletin.avancesAcomptesDeduitesDZD > 0) {
    rubriques.push([
      'Retenue d\'avance / acompte sur caisse de chantier',
      'Acompte',
      '-',
      `-${formatDZD(bulletin.avancesAcomptesDeduitesDZD)}`,
    ]);
  }

  autoTable(doc, {
    startY: startY + 34,
    head: [['Rubrique de Rémunération', 'Base / Décompte', 'Taux Unitaire', 'Montant DA']],
    body: rubriques,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 32, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
  });

  // @ts-ignore
  const tableY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : startY + 80;

  // Net a payer banner
  doc.setFillColor(254, 243, 199); // amber-100
  doc.setDrawColor(245, 158, 11); // amber-500
  doc.roundedRect(14, tableY, 182, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(146, 64, 14); // amber-800
  doc.text('NET À PAYER AU SALARIÉ / OUVRIER :', 18, tableY + 8);

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(formatDZD(bulletin.netAPayerDZD), 140, tableY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Mode de règlement : ${bulletin.modePaiement === 'especes_caisse' ? 'Espèces (Caisse Chantier)' : bulletin.modePaiement} · Réf bon de caisse : ${bulletin.bonCaisseNumero || 'BC-AUTO'}`,
    18,
    tableY + 16
  );

  // Signatures
  const signY = tableY + 34;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  doc.text('L\'Ouvrier / Salarié (Émargement pour acquit)', 25, signY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(bulletin.employeNom, 25, signY + 4);
  doc.setDrawColor(203, 213, 225);
  doc.line(25, signY + 22, 80, signY + 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Le Promoteur Immobilier (Cachet & Visa)', 125, signY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('SARL BatiPromote Algérie', 125, signY + 4);
  doc.line(125, signY + 22, 180, signY + 22);

  drawCorporateFooter(doc, 1, 1);

  return doc;
}

export interface MaterielReportOptions {
  titre?: string;
  chantierId?: string | null;
  chantiers: Chantier[];
  materiels: Materiel[];
}

/**
 * Generates an official Equipment & Machinery Park PDF Report for BatiPromote DZ
 */
export function exportParcMaterielPDF({
  titre = 'INVENTAIRE DU PARC ENGINS & MATÉRIEL DE CHANTIER',
  chantierId = null,
  chantiers,
  materiels,
}: MaterielReportOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const targetChantier = chantierId ? chantiers.find((c) => c.id === chantierId) : null;
  const filteredMateriels = chantierId
    ? materiels.filter((m) => m.chantierId === chantierId)
    : materiels;

  const totalEngins = filteredMateriels.length;
  const totalPropres = filteredMateriels.filter((m) => m.typeAcquisition === 'propre').length;
  const totalLocations = filteredMateriels.filter((m) => m.typeAcquisition === 'location').length;
  const totalActifs = filteredMateriels.filter((m) => m.statut === 'en_service').length;
  const totalLocationDZD = filteredMateriels
    .filter((m) => m.typeAcquisition === 'location' && m.statut === 'en_service')
    .reduce((acc, m) => acc + (m.coutLocationJournalierDZD || 0), 0);

  // Corporate Header
  drawCorporateHeader(
    doc,
    titre,
    'Registre des Engins Lourds, Levage, Béton et Sécurité CTC',
    targetChantier ? targetChantier.nom : 'Tous les chantiers & Parc Central',
    `Édité le ${formatDateFR(new Date().toISOString().split('T')[0])}`
  );

  // Summary Metrics Banner
  let y = 46;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 20, 2, 2, 'FD');

  const cardWidth = 182 / 4;
  const metrics = [
    { label: 'PARC TOTAL', value: `${totalEngins} Engins` },
    { label: 'ACTIFS CHANTIERS', value: `${totalActifs} en service` },
    { label: 'RÉGIME', value: `${totalPropres} propres / ${totalLocations} loués` },
    { label: 'LOCATION / JOUR', value: `${formatDZD(totalLocationDZD, false)} DA` },
  ];

  metrics.forEach((m, idx) => {
    const cardX = 14 + idx * cardWidth;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, cardX + 4, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(m.value, cardX + 4, y + 14);

    if (idx < metrics.length - 1) {
      doc.setDrawColor(226, 232, 240);
      doc.line(cardX + cardWidth, y + 3, cardX + cardWidth, y + 17);
    }
  });

  // Table of equipment
  y += 24;
  const tableData = filteredMateriels.map((mat) => {
    const catLabel = CATEGORIE_MATERIEL_LABELS[mat.categorie]?.label || mat.categorie;
    const statutLabel = STATUT_MATERIEL_LABELS[mat.statut]?.label || mat.statut;
    const regime = mat.typeAcquisition === 'propre' ? 'Propre' : `Loc. (${mat.coutLocationJournalierDZD || 0} DA/j)`;
    const ctc = mat.prochaineVisiteCTCDueDate ? formatDateFR(mat.prochaineVisiteCTCDueDate) : '-';

    return [
      mat.code,
      mat.nom,
      mat.chantierNom || 'Parc Central Sidi Moussa',
      regime,
      statutLabel,
      `${mat.compteurHeuresKm.toLocaleString()} ${mat.uniteCompteur}`,
      mat.conducteurNom || 'Non assigné',
      ctc,
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [[
      'Code',
      'Désignation Engin & Marque',
      'Affectation Chantier',
      'Régime',
      'Statut',
      'Compteur',
      'Conducteur Attitré',
      'Visa CTC',
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: 'bold' },
      1: { cellWidth: 42 },
      2: { cellWidth: 32 },
      3: { cellWidth: 24 },
      4: { cellWidth: 20 },
      5: { cellWidth: 16, halign: 'right' },
      6: { cellWidth: 20 },
      7: { cellWidth: 18, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  // Footer & Signatures
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  if (finalY < 250) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    doc.text('Le Responsable Logistique & Matériel', 25, finalY);
    doc.setDrawColor(203, 213, 225);
    doc.line(25, finalY + 16, 75, finalY + 16);

    doc.text('Le Conducteur Principal des Travaux (Visa CTC)', 115, finalY);
    doc.line(115, finalY + 16, 175, finalY + 16);
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawCorporateFooter(doc, i, pageCount);
  }

  return doc;
}
