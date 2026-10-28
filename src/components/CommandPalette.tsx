import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  Building2,
  Users,
  Wallet,
  Package,
  Truck,
  HardHat,
  Receipt,
  FileText,
  Plus,
  ArrowRight,
  X,
  TrendingUp,
  MessageSquareText,
  FileCheck,
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { formatDZD } from '../utils/formatters';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavTab) => void;
  onOpenTransactionModal: () => void;
  onOpenAlimenterModal: (caisseId?: string) => void;
  onOpenChantierModal: () => void;
}

export const CommandPalette: React.FC<Props> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenTransactionModal,
  onOpenAlimenterModal,
  onOpenChantierModal,
}) => {
  const {
    chantiers,
    caisses,
    tiers,
    stocks,
    materiels,
    employes,
    ticketsDiscussion,
    setActiveTicketId,
    setActiveChantierId,
    currentUser,
    hasPermission,
  } = useApp();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Global keydown listener for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger handled in parent
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || currentUser.role === 'superadmin') return null;

  const q = query.trim().toLowerCase();

  // Search results
  const matchedChantiers = q
    ? chantiers.filter(
        (c) =>
          c.nom.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.wilaya.toLowerCase().includes(q)
      )
    : [];

  const matchedTiers = q
    ? tiers.filter(
        (t) =>
          t.nomRaisonSociale.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q) ||
          (t.lotReserve && t.lotReserve.toLowerCase().includes(q))
      )
    : [];

  const matchedCaisses = q
    ? caisses.filter((c) => c.nom.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
    : [];

  const matchedStocks = q
    ? stocks.filter((s) => s.designation.toLowerCase().includes(q) || s.code.toLowerCase().includes(q))
    : [];

  const matchedMateriel = q
    ? materiels.filter(
        (m) =>
          m.nom.toLowerCase().includes(q) ||
          m.code.toLowerCase().includes(q) ||
          m.marqueModele.toLowerCase().includes(q)
      )
    : [];

  const matchedEmployes = q
    ? employes.filter(
        (e) =>
          `${e.nom} ${e.prenom}`.toLowerCase().includes(q) ||
          e.matricule.toLowerCase().includes(q) ||
          e.specialiteLibelle.toLowerCase().includes(q)
      )
    : [];

  const matchedTickets = q
    ? ticketsDiscussion.filter(
        (t) =>
          t.titre.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          (t.dernierMessageApercu || t.messages[t.messages.length - 1]?.contenu || '').toLowerCase().includes(q)
      )
    : [];

  const handleSelectChantier = (id: string) => {
    setActiveChantierId(id);
    onNavigate('chantiers');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Search Input Box */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 bg-slate-50">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Rechercher un chantier, client VSP, caisse, matériau, engin, action rapide..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm font-medium text-slate-900 bg-transparent border-none focus:outline-hidden focus:ring-0 placeholder:text-slate-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-200 rounded border border-slate-300">
            ESC
          </kbd>
        </div>

        {/* Content Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {/* Quick Actions (when query is empty or matches) */}
          {(!query || 'dépense nouvelle caisse chantier alimenter pv rapport rentabilité'.includes(q)) && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 px-2">
                Actions Rapides Entreprise
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {hasPermission('transactions_create') && currentUser.role !== 'superadmin' && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenTransactionModal();
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-left text-xs font-semibold text-slate-800 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Enregistrer une dépense / bon de caisse</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    onClose();
                    onOpenAlimenterModal();
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-left text-xs font-semibold text-slate-800 transition-colors"
                >
                  <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Alimenter une caisse de chantier</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('avancement');
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-left text-xs font-semibold text-slate-800 transition-colors"
                >
                  <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Consulter les PVs & Rapports CTC</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('rentabilite');
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-left text-xs font-semibold text-slate-800 transition-colors"
                >
                  <TrendingUp className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Voir la rentabilité & marges des projets</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('audit');
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-left text-xs font-semibold text-slate-800 transition-colors"
                >
                  <FileCheck className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Effectuer un audit de conformité interne</span>
                </button>
              </div>
            </div>
          )}

          {/* Results: Chantiers */}
          {matchedChantiers.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 px-2">
                Chantiers & Projets ({matchedChantiers.length})
              </span>
              <div className="space-y-1">
                {matchedChantiers.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => handleSelectChantier(ch.id)}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-left text-xs border border-transparent hover:border-slate-200 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-900 block">{ch.nom}</span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {ch.code} · {ch.commune}, {ch.wilaya} · Avancement : {ch.avancementPourcentage}%
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results: Clients VSP & Fournisseurs */}
          {matchedTiers.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 px-2">
                Tiers, Fournisseurs & Acquéreurs VSP ({matchedTiers.length})
              </span>
              <div className="space-y-1">
                {matchedTiers.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onNavigate('tiers');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-left text-xs border border-transparent hover:border-slate-200 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-900 block">{t.nomRaisonSociale}</span>
                        <span className="text-[11px] text-slate-500">
                          {t.type === 'client_vsp' ? `Acquéreur VSP (${t.lotReserve || 'Lot réservé'})` : t.specialite || t.type}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-700">
                      {formatDZD(t.soldeDuDZD)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results: Materiels & Engins */}
          {matchedMateriel.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 px-2">
                Engins & Matériel de Chantier ({matchedMateriel.length})
              </span>
              <div className="space-y-1">
                {matchedMateriel.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onNavigate('materiel');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-left text-xs border border-transparent hover:border-slate-200 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <Truck className="w-4 h-4 text-sky-500 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-900 block">{m.nom}</span>
                        <span className="text-[11px] text-slate-500">
                          {m.code} · {m.chantierNom || 'Parc Central'}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-600">{m.compteurHeuresKm} {m.uniteCompteur}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results: Stocks */}
          {matchedStocks.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 px-2">
                Stocks & Matériaux ({matchedStocks.length})
              </span>
              <div className="space-y-1">
                {matchedStocks.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onNavigate('stocks');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-left text-xs border border-transparent hover:border-slate-200 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <Package className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-900 block">{s.designation}</span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {s.quantiteEnStock} {s.unite}s en stock
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-800">{formatDZD(s.valeurTotaleDZD)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results: Tickets de discussion & Messagerie */}
          {matchedTickets.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 px-2">
                Tickets de Discussion Chantier ({matchedTickets.length})
              </span>
              <div className="space-y-1">
                {matchedTickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTicketId(t.id);
                      onNavigate('messagerie');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-left text-xs border border-transparent hover:border-slate-200 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <MessageSquareText className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{t.id}</span>
                          <span className="text-[11px] font-semibold text-slate-700">{t.titre}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 italic block truncate max-w-md">
                          "{t.dernierMessageApercu || t.messages[t.messages.length - 1]?.contenu || ''}"
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* If query entered but no results */}
          {query &&
            matchedChantiers.length === 0 &&
            matchedTiers.length === 0 &&
            matchedCaisses.length === 0 &&
            matchedStocks.length === 0 &&
            matchedMateriel.length === 0 &&
            matchedEmployes.length === 0 &&
            matchedTickets.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs">
                Aucun élément correspondant à "<strong className="text-slate-800">{query}</strong>"
              </div>
            )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>Tapez pour rechercher immédiatement</span>
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded font-mono font-semibold">
                ↵
              </kbd>{' '}
              Sélectionner
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded font-mono font-semibold">
                ESC
              </kbd>{' '}
              Fermer
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
