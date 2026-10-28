import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatDZD, formatDateFR } from '../utils/formatters';
import {
  Bell,
  AlertTriangle,
  Wallet,
  Package,
  Truck,
  Users,
  Check,
  ChevronRight,
  ShieldAlert,
  MessageSquareText,
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface Props {
  onNavigate: (tab: NavTab) => void;
  onOpenAlimenterModal: (caisseId?: string) => void;
}

export const NotificationCenter: React.FC<Props> = ({ onNavigate, onOpenAlimenterModal }) => {
  const {
    computeNotifications,
    currentUser,
    validerDemandeAlimentation,
    refuserDemandeAlimentation,
    validerTransaction,
    rejeterTransaction,
    setActiveTicketId,
  } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const notifications = computeNotifications();
  const totalAlertsCount = notifications.length;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-9 w-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-700/80 cursor-pointer shrink-0 shadow-2xs"
        title="Centre d'alertes & notifications de gestion"
      >
        <Bell className="w-4 h-4" />
        {totalAlertsCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black text-white bg-rose-600 rounded-full shadow-xs animate-pulse">
            {totalAlertsCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-4 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Centre d'Alertes BatiPromote
              </h4>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold">
              {totalAlertsCount} alertes actives
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {totalAlertsCount === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-800">Aucune alerte critique</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tous les voyants sont au vert pour vos chantiers autorisés.
                </p>
              </div>
            ) : (
              <>
                {notifications.map((n) => (
                  <div key={n.id} className={`p-2.5 rounded-lg border text-xs ${
                    n.type === 'cash' ? 'bg-amber-50/90 border-amber-300' :
                    n.type === 'ticket' ? 'bg-emerald-50/80 border-emerald-200/80' :
                    n.type === 'stock' ? 'bg-amber-50/70 border-amber-200/60' :
                    n.type === 'materiel' ? 'bg-sky-50/70 border-sky-200/60' :
                    'bg-purple-50/70 border-purple-200/60'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        {n.type === 'cash' && <Wallet className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />}
                        {n.type === 'ticket' && <MessageSquareText className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                        {n.type === 'stock' && <Package className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />}
                        {n.type === 'materiel' && <Truck className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />}
                        {n.type === 'vsp' && <Users className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-950 block">{n.title}</span>
                          </div>
                          <span className="text-[11px] font-medium text-slate-900 block truncate max-w-[170px]">
                            {n.message}
                          </span>
                        </div>
                      </div>
                      {(n.data?.statut === 'en_attente_validation' || n.data?.statut === 'en_attente_visa' || n.data?.statut === 'en_attente') && (currentUser.role === 'superadmin' || currentUser.role === 'directeur_promoteur') ? (
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (n.data?.statut === 'en_attente_validation') {
                                  validerDemandeAlimentation(n.data.id);
                                } else {
                                  validerTransaction(n.data.id);
                                }
                              }}
                              className="px-2 py-0.5 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors flex items-center gap-0.5 cursor-pointer shadow-2xs"
                              title="Approuver et valider"
                            >
                              <Check className="w-3 h-3" />
                              <span>Valider</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (n.data?.statut === 'en_attente_validation') {
                                  refuserDemandeAlimentation(n.data.id, 'Refusé depuis le centre de notifications');
                                } else {
                                  rejeterTransaction(n.data.id);
                                }
                              }}
                              className="px-2 py-0.5 text-[10px] font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 rounded transition-colors cursor-pointer"
                              title="Rejeter la demande"
                            >
                              <span>Rejeter</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setIsOpen(false);
                              onNavigate(n.link.replace('/', '') as any);
                            }}
                            className="text-[9px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 underline cursor-pointer"
                          >
                            Détails
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            if (n.type === 'ticket') {
                              setActiveTicketId(n.data.id);
                              onNavigate('messagerie');
                            } else {
                              onNavigate(n.link.replace('/', '') as any);
                            }
                          }}
                          className={`px-2 py-1 text-[10px] font-bold text-white rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            n.type === 'cash' ? 'bg-amber-600 hover:bg-amber-700' :
                            n.type === 'ticket' ? 'bg-emerald-600 hover:bg-emerald-700' :
                            n.type === 'stock' ? 'bg-amber-600 hover:bg-amber-700' :
                            n.type === 'materiel' ? 'bg-sky-600 hover:bg-sky-700' :
                            'bg-purple-600 hover:bg-purple-700'
                          }`}
                        >
                          Voir
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
