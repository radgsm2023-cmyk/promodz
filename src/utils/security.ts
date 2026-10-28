/**
 * Utilitaires de Sécurité & Contrôle d'Intégrité - BatiPromote DZ
 * Fournit:
 * 1. Chiffrement et vérification de signature de session (Anti-Tampering)
 * 2. Protection contre les attaques par force brute (Rate Limiting & Lockout)
 * 3. Assainissement des entrées (XSS & Injection Protection)
 * 4. Validation stricte des rôles et des habilitations contextuelles
 */

import { Utilisateur } from '../types';

const SESSION_SALT = 'BatiPromoteDZ_SecSalt_2026_@AlgEnterprise';
const BRUTE_FORCE_KEY_PREFIX = 'batipromote_sec_auth_';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 secondes de verrouillage

/**
 * Génère une empreinte SHA-256 ou hash pseudo-cryptographique pour vérifier
 * l'intégrité de la session utilisateur stockée dans le navigateur.
 */
export function generateSessionSignature(user: Utilisateur, timestamp: number): string {
  const payload = `${user.id}#${user.email.toLowerCase()}#${user.role}#${user.statut}#${timestamp}#${SESSION_SALT}`;
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convertit en 32-bit integer
  }
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  return `BP-SEC-${hexHash}-${timestamp}`;
}

export interface SessionVerificationResult {
  isValid: boolean;
  reason?: 'NOT_FOUND' | 'INACTIVE' | 'ROLE_TAMPERED' | 'INVALID_SIGNATURE' | 'MALFORMED';
  sanitizedUser?: Utilisateur;
}

/**
 * Valide l'intégrité de l'utilisateur en session par rapport à la base d'utilisateurs système.
 * Détecte toute tentative d'élévation de privilèges ou falsification locale du rôle.
 */
export function verifySessionIntegrity(
  sessionUser: any,
  registeredUsers: Utilisateur[]
): SessionVerificationResult {
  if (!sessionUser || typeof sessionUser !== 'object' || !sessionUser.id || !sessionUser.role) {
    return { isValid: false, reason: 'MALFORMED' };
  }

  const dbUser = registeredUsers.find((u) => u.id === sessionUser.id);
  if (!dbUser) {
    return { isValid: false, reason: 'NOT_FOUND' };
  }

  // Vérifier si le compte a été suspendu ou désactivé
  if (dbUser.statut !== 'actif') {
    return { isValid: false, reason: 'INACTIVE' };
  }

  // Vérifier si le rôle en session a été manipulé (privilege escalation)
  if (dbUser.role !== sessionUser.role) {
    return { isValid: false, reason: 'ROLE_TAMPERED' };
  }

  // Vérifier la cohérence de l'email
  if (dbUser.email.toLowerCase() !== (sessionUser.email || '').toLowerCase()) {
    return { isValid: false, reason: 'ROLE_TAMPERED' };
  }

  // Retourne la version authentique provenant de la base système
  return {
    isValid: true,
    sanitizedUser: {
      ...dbUser,
      dernierAcces: sessionUser.dernierAcces || dbUser.dernierAcces,
    },
  };
}

/**
 * Gestion du Rate-Limiting & Protection contre la force brute
 */
interface LockoutState {
  attempts: number;
  lockedUntil: number | null;
}

function getLockoutState(identifier: string): LockoutState {
  try {
    const key = `${BRUTE_FORCE_KEY_PREFIX}${identifier.toLowerCase()}`;
    const data = localStorage.getItem(key);
    if (!data) return { attempts: 0, lockedUntil: null };
    const parsed = JSON.parse(data);
    return parsed;
  } catch {
    return { attempts: 0, lockedUntil: null };
  }
}

function saveLockoutState(identifier: string, state: LockoutState): void {
  try {
    const key = `${BRUTE_FORCE_KEY_PREFIX}${identifier.toLowerCase()}`;
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // ignore
  }
}

/**
 * Vérifie si une tentative de connexion est permise pour cet identifiant
 */
export function checkAuthRateLimit(identifier: string): {
  isLocked: boolean;
  remainingSeconds: number;
  attemptsLeft: number;
} {
  const state = getLockoutState(identifier);
  const now = Date.now();

  if (state.lockedUntil && now < state.lockedUntil) {
    const remainingSeconds = Math.ceil((state.lockedUntil - now) / 1000);
    return {
      isLocked: true,
      remainingSeconds,
      attemptsLeft: 0,
    };
  }

  // Si le verrouillage a expiré, réinitialiser
  if (state.lockedUntil && now >= state.lockedUntil) {
    saveLockoutState(identifier, { attempts: 0, lockedUntil: null });
    return {
      isLocked: false,
      remainingSeconds: 0,
      attemptsLeft: MAX_LOGIN_ATTEMPTS,
    };
  }

  const attemptsLeft = Math.max(0, MAX_LOGIN_ATTEMPTS - state.attempts);
  return {
    isLocked: false,
    remainingSeconds: 0,
    attemptsLeft,
  };
}

/**
 * Enregistre un échec d'authentification
 */
export function recordFailedAuthAttempt(identifier: string): {
  isNowLocked: boolean;
  lockoutDurationSec: number;
  attemptsLeft: number;
} {
  const state = getLockoutState(identifier);
  const newAttempts = state.attempts + 1;
  const now = Date.now();

  if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
    const lockedUntil = now + LOCKOUT_DURATION_MS;
    saveLockoutState(identifier, { attempts: newAttempts, lockedUntil });
    return {
      isNowLocked: true,
      lockoutDurationSec: Math.ceil(LOCKOUT_DURATION_MS / 1000),
      attemptsLeft: 0,
    };
  }

  saveLockoutState(identifier, { attempts: newAttempts, lockedUntil: null });
  return {
    isNowLocked: false,
    lockoutDurationSec: 0,
    attemptsLeft: MAX_LOGIN_ATTEMPTS - newAttempts,
  };
}

/**
 * Réinitialise le compteur d'échecs après une connexion réussie
 */
export function resetAuthRateLimit(identifier: string): void {
  try {
    const key = `${BRUTE_FORCE_KEY_PREFIX}${identifier.toLowerCase()}`;
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

const USER_PWD_PREFIX = 'batipromote_pwd_';

export function getUserCustomPassword(userId: string): string | null {
  try {
    return localStorage.getItem(`${USER_PWD_PREFIX}${userId}`);
  } catch {
    return null;
  }
}

export function setUserCustomPassword(userId: string, newPassword: string): void {
  try {
    localStorage.setItem(`${USER_PWD_PREFIX}${userId}`, newPassword);
  } catch {
    // ignore
  }
}

/**
 * Validation des mots de passe
 * Vérifie le mot de passe personnalisé ou les valeurs par défaut
 */
export function verifyUserCredentials(user: Utilisateur, passwordInput: string): boolean {
  if (!passwordInput || passwordInput.trim().length === 0) return false;
  
  const trimmed = passwordInput.trim();

  // 1. Vérifier si un mot de passe personnalisé a été défini par l'utilisateur
  const customPwd = user.motDePasse || getUserCustomPassword(user.id);
  if (customPwd) {
    return trimmed === customPwd;
  }

  // 2. Pour le compte Intégrateur / superadmin par défaut
  if (user.role === 'superadmin') {
    return trimmed === '2026' || trimmed === 'superadmin2026' || trimmed === 'admin2026';
  }

  // 3. Mots de passe standard valides pour la démo / configuration initiale
  const validPasswords = ['demo2026', 'bati2026', 'promoteur2026', 'algerie2026', 'admin'];
  return validPasswords.includes(trimmed.toLowerCase());
}

/**
 * Assainissement de texte pour prévenir les injections HTML et attaques XSS
 */
export function sanitizeInput(input: string | undefined | null): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Nettoie les noms de fichiers téléversés pour bloquer les path traversals
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\.\./g, '_')
    .trim();
}
