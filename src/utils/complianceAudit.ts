import { Transaction, AppSettings, AnomalieConformite, SeveriteAnomalie } from '../types';

/**
 * Moteur d'audit de conformité et de détection des anomalies pour le BTPH et la promotion immobilière.
 * Détecte les opérations hors normes, décaissements espèces atypiques et saisies dérogatoires.
 */

export const REGLES_AUDIT = [
  {
    id: 'R01_ESPECES',
    code: 'SEUIL_ESPECES',
    titre: 'Plafond Décaissement Espèces',
    description: 'Paiements en liquide supérieurs au seuil légal ou prudentiel de trésorerie (200 000 DZD).',
  },
  {
    id: 'R02_WORKFLOW',
    code: 'DOUBLE_VISA_REQUIS',
    titre: 'Workflow Double Niveau Non Soldé',
    description: 'Transaction excédant le seuil de double validation SuperAdmin/Directeur sans clôture.',
  },
  {
    id: 'R03_PJ',
    code: 'JUSTIFICATIF_MANQUANT',
    titre: 'Absence de Pièce Justificative',
    description: 'Dépense engagée sans facture scannée, bon de livraison (BL) ou bon de caisse numéroté.',
  },
  {
    id: 'R04_TIERS',
    code: 'TIERS_NON_HOMOLOGUE',
    titre: 'Fournisseur / Tiers Non Enregistré',
    description: 'Décaissement émis vers un tiers en texte libre, non référencé au répertoire des partenaires.',
  },
  {
    id: 'R05_MANUEL',
    code: 'SAISIE_MANUELLE_RECTIF',
    titre: 'Saisie Dérogatoire / Régularisation',
    description: 'Opération manuelle identifiée comme écart de caisse, dépannage urgent ou avance sans contrat.',
  },
  {
    id: 'R06_CALENDRIER',
    code: 'JOUR_NON_OUVRE',
    titre: 'Opération en Jour Non Ouvré',
    description: 'Transaction enregistrée un vendredi (repos hebdomadaire BTPH) sans visa d\'astreinte.',
  },
  {
    id: 'R07_STATUT',
    code: 'STATUT_SUSPENDU',
    titre: 'Transaction En Attente de Visa',
    description: 'Flux financier en instance de signature ou soumis à réserve hiérarchique.',
  },
];

/**
 * Détecte l'ensemble des anomalies de conformité pour une transaction donnée.
 */
export function detecterAnomaliesTransaction(
  tx: Transaction,
  appSettings: AppSettings
): AnomalieConformite[] {
  const anomalies: AnomalieConformite[] = [];

  // Règle 1 : Espèces élevées
  if (tx.modePaiement === 'especes' && tx.montantDZD >= 200000) {
    anomalies.push({
      code: 'SEUIL_ESPECES',
      titre: 'Décaissement Espèces Atypique',
      severite: tx.montantDZD >= 500000 ? 'critique' : 'haute',
      explication: `Règlement en espèces de ${tx.montantDZD.toLocaleString()} DZD dépassant le seuil prudentiel de 200 000 DZD. Exigence de traçabilité bancaire.`,
    });
  }

  // Règle 2 : Workflow de validation double niveau
  const seuilWorkflow = appSettings.validationWorkflow?.seuilMontantValidationDZD || 500000;
  const workflowActive = appSettings.validationWorkflow?.deuxNiveauxActive ?? true;

  if (workflowActive && tx.montantDZD >= seuilWorkflow) {
    if (tx.statut === 'en_attente_visa' || tx.statut === 'en_attente') {
      anomalies.push({
        code: 'DOUBLE_VISA_REQUIS',
        titre: 'Double Validation SuperAdmin Requise',
        severite: 'critique',
        explication: `Montant de ${tx.montantDZD.toLocaleString()} DZD supérieur au seuil critique (${seuilWorkflow.toLocaleString()} DZD). Nécessite le visa formel du SuperAdmin.`,
      });
    }
  }

  // Règle 3 : Justificatif ou pièce jointe manquante
  const hasJustificatif = Boolean(tx.pieceJointeNom || tx.bonCaisseNumero || tx.numeroChequeVirement);
  if (tx.type === 'sortie' && !hasJustificatif && tx.montantDZD >= 50000) {
    anomalies.push({
      code: 'JUSTIFICATIF_MANQUANT',
      titre: 'Absence de Pièce Justificative',
      severite: 'haute',
      explication: 'Aucun document justificatif (facture, reçu ou BL) ni référence de bon de caisse attachée.',
    });
  }

  // Règle 4 : Tiers non homologué (saisie libre sans tierId)
  if (tx.type === 'sortie' && !tx.tierId && tx.montantDZD >= 100000) {
    anomalies.push({
      code: 'TIERS_NON_HOMOLOGUE',
      titre: 'Bénéficiaire Non Référencé',
      severite: tx.montantDZD >= 300000 ? 'haute' : 'moyenne',
      explication: `Le bénéficiaire "${tx.beneficiaireNom}" n'est rattaché à aucun compte tiers / sous-traitant homologué du système.`,
    });
  }

  // Règle 5 : Saisie manuelle dérogatoire / mots-clés d'alerte dans le motif
  const motifLower = (tx.motif || '').toLowerCase();
  const alertKeywords = [
    'urgent',
    'comptant sans facture',
    'sans facture',
    'sans reçu',
    'écart de caisse',
    'régularisation',
    'regularisation',
    'ajustement',
    'dépannage',
    'depannage',
    'avance sans',
  ];

  const matchedKeyword = alertKeywords.find((kw) => motifLower.includes(kw));
  if (matchedKeyword) {
    anomalies.push({
      code: 'SAISIE_MANUELLE_RECTIF',
      titre: 'Saisie Dérogatoire / Hors Procédure',
      severite: 'haute',
      explication: `Motif d'opération sensible détecté ("${matchedKeyword}"). Justification manuelle obligatoire par la direction.`,
    });
  }

  // Règle 6 : Opération le Vendredi (repos hebdomadaire en Algérie)
  if (tx.date) {
    const parts = tx.date.split('-');
    if (parts.length === 3) {
      const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      if (dateObj.getDay() === 5) {
        // 5 = Vendredi
        anomalies.push({
          code: 'JOUR_NON_OUVRE',
          titre: 'Opération Vendredi (Jour Férié/Chômé)',
          severite: 'moyenne',
          explication: 'Décaissement exécuté un vendredi, jour de fermeture officielle des chantiers hors vacation d\'astreinte.',
        });
      }
    }
  }

  // Règle 7 : Statut rejeté ou en instance non résolue
  if (tx.statut === 'rejete') {
    anomalies.push({
      code: 'STATUT_SUSPENDU',
      titre: 'Transaction Rejetée / Litigieuse',
      severite: 'critique',
      explication: 'Cette opération a fait l\'objet d\'un refus de paiement ou d\'une annulation pour non-conformité.',
    });
  }

  return anomalies;
}

export interface AnalyseMoisResultat {
  mois: string; // "2026-10"
  labelMois: string; // "Octobre 2026"
  toutesTransactions: Transaction[];
  transactionsAtypiques: {
    transaction: Transaction;
    anomalies: AnomalieConformite[];
    severiteMax: SeveriteAnomalie;
  }[];
  totalTransactions: number;
  montantTotalTransactionsDZD: number;
  totalAtypiques: number;
  montantTotalAtypiquesDZD: number;
  tauxConformitePourcent: number;
  repartitionSeverite: {
    critique: number;
    haute: number;
    moyenne: number;
    info: number;
  };
}

/**
 * Analyse l'ensemble des transactions pour un mois donné et produit les statistiques d'audit.
 */
export function analyserMoisConformite(
  transactions: Transaction[],
  moisKey: string, // format "YYYY-MM" (ex: "2026-10") ou "all"
  appSettings: AppSettings
): AnalyseMoisResultat {
  const moisTransactions = transactions.filter((tx) => {
    if (moisKey === 'all') return true;
    return tx.date.startsWith(moisKey);
  });

  const transactionsAtypiques: {
    transaction: Transaction;
    anomalies: AnomalieConformite[];
    severiteMax: SeveriteAnomalie;
  }[] = [];

  let montantTotalTransactionsDZD = 0;
  let montantTotalAtypiquesDZD = 0;

  const repartitionSeverite = {
    critique: 0,
    haute: 0,
    moyenne: 0,
    info: 0,
  };

  moisTransactions.forEach((tx) => {
    montantTotalTransactionsDZD += tx.montantDZD;
    const anomalies = detecterAnomaliesTransaction(tx, appSettings);

    if (anomalies.length > 0) {
      montantTotalAtypiquesDZD += tx.montantDZD;

      // Déterminer sévérité maximale
      let severiteMax: SeveriteAnomalie = 'moyenne';
      if (anomalies.some((a) => a.severite === 'critique')) {
        severiteMax = 'critique';
        repartitionSeverite.critique += 1;
      } else if (anomalies.some((a) => a.severite === 'haute')) {
        severiteMax = 'haute';
        repartitionSeverite.haute += 1;
      } else {
        severiteMax = 'moyenne';
        repartitionSeverite.moyenne += 1;
      }

      transactionsAtypiques.push({
        transaction: tx,
        anomalies,
        severiteMax,
      });
    }
  });

  const totalTransactions = moisTransactions.length;
  const totalAtypiques = transactionsAtypiques.length;
  const tauxConformitePourcent =
    totalTransactions > 0
      ? Math.round(((totalTransactions - totalAtypiques) / totalTransactions) * 1000) / 10
      : 100;

  return {
    mois: moisKey,
    labelMois: formatMoisLabel(moisKey),
    toutesTransactions: moisTransactions,
    transactionsAtypiques,
    totalTransactions,
    montantTotalTransactionsDZD,
    totalAtypiques,
    montantTotalAtypiquesDZD,
    tauxConformitePourcent,
    repartitionSeverite,
  };
}

/**
 * Extrait la liste ordonnée des mois disponibles dans la base de transactions.
 */
export function getMoisDisponibles(transactions: Transaction[]): { key: string; label: string }[] {
  const moisSet = new Set<string>();

  transactions.forEach((tx) => {
    if (tx.date && tx.date.length >= 7) {
      moisSet.add(tx.date.substring(0, 7));
    }
  });

  // Assurer la présence des mois récents
  moisSet.add('2026-10');
  moisSet.add('2026-09');

  const sorted = Array.from(moisSet).sort((a, b) => b.localeCompare(a));
  return sorted.map((key) => ({
    key,
    label: formatMoisLabel(key),
  }));
}

export function formatMoisLabel(moisKey: string): string {
  if (moisKey === 'all') return 'Toutes Périodes Cumulées';
  const [annee, mois] = moisKey.split('-');
  const nomsMois: Record<string, string> = {
    '01': 'Janvier',
    '02': 'Février',
    '03': 'Mars',
    '04': 'Avril',
    '05': 'Mai',
    '06': 'Juin',
    '07': 'Juillet',
    '08': 'Août',
    '09': 'Septembre',
    '10': 'Octobre',
    '11': 'Novembre',
    '12': 'Décembre',
  };
  return `${nomsMois[mois] || mois} ${annee}`;
}
