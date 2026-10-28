/**
 * Utility functions for currency, dates and business documents
 */

export function formatDZD(amount: number, withSymbol: boolean = true): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return withSymbol ? '0,00 DA' : '0,00';
  }
  
  // Format with space as thousands separator and comma as decimal separator
  const parts = Math.abs(amount).toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const decimalPart = parts[1];
  
  const sign = amount < 0 ? '-' : '';
  const formatted = `${sign}${integerPart},${decimalPart}`;
  
  return withSymbol ? `${formatted} DA` : formatted;
}

export function formatDateFR(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('fr-DZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatDateTimeFR(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('fr-DZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

// Convert numbers to French words for Algerian Bons de Caisse & Reçus
export function nombreEnLettresDZD(nombre: number): string {
  const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const dizaines = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingts', 'quatre-vingt-dix'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];

  function convertLessThanThousand(n: number): string {
    if (n === 0) return '';
    let res = '';
    
    // Hundreds
    if (n >= 100) {
      const c = Math.floor(n / 100);
      if (c === 1) {
        res += 'cent ';
      } else {
        res += unites[c] + ' cent ';
      }
      n %= 100;
    }
    
    // Tens & units
    if (n >= 10 && n < 20) {
      res += teens[n - 10] + ' ';
    } else if (n >= 20) {
      const d = Math.floor(n / 10);
      const u = n % 10;
      if (d === 7) {
        res += 'soixante-' + teens[u] + ' ';
      } else if (d === 9) {
        res += 'quatre-vingt-' + teens[u] + ' ';
      } else {
        res += dizaines[d] + (u > 0 ? (u === 1 ? '-et-un ' : '-' + unites[u] + ' ') : ' ');
      }
    } else if (n > 0) {
      res += unites[n] + ' ';
    }
    
    return res.trim();
  }

  const intPart = Math.floor(Math.abs(nombre));
  const decPart = Math.round((Math.abs(nombre) - intPart) * 100);

  if (intPart === 0) return 'zéro Dinar Algérien';

  let result = '';
  
  // Billions / Milliards
  const milliards = Math.floor(intPart / 1_000_000_000);
  const millions = Math.floor((intPart % 1_000_000_000) / 1_000_000);
  const mille = Math.floor((intPart % 1_000_000) / 1_000);
  const reste = intPart % 1_000;

  if (milliards > 0) {
    result += `${convertLessThanThousand(milliards)} milliard${milliards > 1 ? 's' : ''} `;
  }
  if (millions > 0) {
    result += `${convertLessThanThousand(millions)} million${millions > 1 ? 's' : ''} `;
  }
  if (mille > 0) {
    if (mille === 1) {
      result += 'mille ';
    } else {
      result += `${convertLessThanThousand(mille)} mille `;
    }
  }
  if (reste > 0) {
    result += convertLessThanThousand(reste) + ' ';
  }

  result = result.trim() + ' Dinars Algériens';

  if (decPart > 0) {
    result += ` et ${convertLessThanThousand(decPart)} centimes`;
  }

  // Capitalize first letter
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export const CORPS_METIER_LABELS: Record<string, { label: string; color: string; badgeBg: string }> = {
  chef_chantier: { label: 'Chef de Chantier', color: 'text-indigo-700', badgeBg: 'bg-indigo-50 border-indigo-200' },
  metreur_technicien: { label: 'Métreur / Technicien', color: 'text-sky-700', badgeBg: 'bg-sky-50 border-sky-200' },
  grutier_conducteur_engin: { label: 'Grutier / Conducteur Engin', color: 'text-amber-800', badgeBg: 'bg-amber-50 border-amber-200' },
  macon_qualifie: { label: 'Maçon Qualifié', color: 'text-orange-700', badgeBg: 'bg-orange-50 border-orange-200' },
  ferrailleur: { label: 'Ferrailleur', color: 'text-purple-700', badgeBg: 'bg-purple-50 border-purple-200' },
  coffreur_bancheur: { label: 'Coffreur / Bancheur', color: 'text-blue-700', badgeBg: 'bg-blue-50 border-blue-200' },
  manoeuvre: { label: 'Manœuvre de Chantier', color: 'text-slate-700', badgeBg: 'bg-slate-100 border-slate-200' },
  electricien_plombier: { label: 'Électricien / Plombier', color: 'text-emerald-700', badgeBg: 'bg-emerald-50 border-emerald-200' },
  gardien_chantier: { label: 'Gardien de Chantier', color: 'text-teal-700', badgeBg: 'bg-teal-50 border-teal-200' },
  magasinier: { label: 'Magasinier Dépôt', color: 'text-rose-700', badgeBg: 'bg-rose-50 border-rose-200' },
};

export const CONTRAT_LABELS: Record<string, { label: string; badge: string }> = {
  journalier_quinzaine: { label: 'Journalier / Quinzaine', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  mensuel_permanent: { label: 'Mensuel Permanent', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
  tache_rendement: { label: 'À la tâche / Rendement', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
};

export const CATEGORIE_MATERIEL_LABELS: Record<string, { label: string; badgeBg: string; color: string; iconDesc: string }> = {
  engin_lourd: { label: 'Engins Lourds & Terrassement', badgeBg: 'bg-amber-50 border-amber-200', color: 'text-amber-800', iconDesc: 'Pelles, chargeuses, bulldozers' },
  levage_manutention: { label: 'Levage & Manutention', badgeBg: 'bg-blue-50 border-blue-200', color: 'text-blue-800', iconDesc: 'Grues à tour, chariots télescopiques' },
  beton_malaxage: { label: 'Béton & Malaxage', badgeBg: 'bg-emerald-50 border-emerald-200', color: 'text-emerald-800', iconDesc: 'Pompes à béton, toupies, bétonnières' },
  energie_compresseur: { label: 'Énergie & Compresseurs', badgeBg: 'bg-purple-50 border-purple-200', color: 'text-purple-800', iconDesc: 'Groupes électrogènes, compresseurs' },
  coffrage_echafaudage: { label: 'Coffrage & Échafaudage', badgeBg: 'bg-orange-50 border-orange-200', color: 'text-orange-800', iconDesc: 'Banches métalliques, étais, échafaudages' },
  petit_outillage: { label: 'Petit Outillage & Finition', badgeBg: 'bg-slate-100 border-slate-200', color: 'text-slate-800', iconDesc: 'Aiguilles vibrantes, hélicoptères béton' },
};

export const STATUT_MATERIEL_LABELS: Record<string, { label: string; badge: string; dotColor: string }> = {
  en_service: { label: 'En service (Actif)', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', dotColor: 'bg-emerald-500' },
  disponible: { label: 'Disponible (Parc/Dépôt)', badge: 'bg-sky-100 text-sky-800 border-sky-200', dotColor: 'bg-sky-500' },
  en_maintenance: { label: 'En maintenance / Révision', badge: 'bg-amber-100 text-amber-800 border-amber-200', dotColor: 'bg-amber-500' },
  en_panne: { label: 'En panne (Indisponible)', badge: 'bg-rose-100 text-rose-800 border-rose-200', dotColor: 'bg-rose-500' },
};

export const TYPE_INTERVENTION_LABELS: Record<string, { label: string; badge: string }> = {
  visite_ctc_levage: { label: 'Contrôle Technique Réglementaire CTC', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  vidange_filtres: { label: 'Vidange & Remplacement Filtres', badge: 'bg-sky-100 text-sky-800 border-sky-200' },
  curative_panne: { label: 'Réparation Curative (Panne)', badge: 'bg-rose-100 text-rose-800 border-rose-200' },
  preventive: { label: 'Entretien Préventif Périodique', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  pneumatique_chenilles: { label: 'Train de Roulement & Chenilles', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  plein_gasoil: { label: 'Ravitaillement Carburant (Gasoil)', badge: 'bg-teal-100 text-teal-800 border-teal-200' },
};
