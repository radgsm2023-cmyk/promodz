import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  CategorieTicket,
  PrioriteTicket,
  StatutTicket,
  TicketDiscussion,
} from '../types';
import {
  MessageSquare,
  Send,
  Paperclip,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  Building2,
  ShieldAlert,
  Wrench,
  Truck,
  Coins,
  FileText,
  X,
  Volume2,
  Check,
  ChevronDown,
} from 'lucide-react';

export const MessagerieView: React.FC = () => {
  const {
    ticketsDiscussion,
    activeTicketId,
    setActiveTicketId,
    creerTicketDiscussion,
    envoyerMessageTicket,
    changerStatutTicket,
    marquerTicketLu,
    chantiers,
    userAllowedChantiers,
    isChantierAllowed,
    isGlobalUser,
    currentUser,
    effectiveRole,
    playChimeNotification,
  } = useApp();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChantierFilter, setSelectedChantierFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedStatutFilter, setSelectedStatutFilter] = useState<string>('all');
  const [selectedPrioriteFilter, setSelectedPrioriteFilter] = useState<string>('all');

  // Active chat state
  const [nouveauMessage, setNouveauMessage] = useState('');
  const [pieceJointeSimulee, setPieceJointeSimulee] = useState<{
    nom: string;
    url?: string;
    type?: 'image' | 'pdf' | 'doc';
  } | null>(null);

  // Simulation role toggle: allows switching between responding as Siège or Chef de Chantier
  const [simulationRole, setSimulationRole] = useState<'siege' | 'chantier'>(() => {
    return ['chef_chantier', 'conducteur_travaux', 'ingenieur_suivi', 'responsable_chantier', 'chef_projet'].includes(effectiveRole)
      ? 'chantier'
      : 'siege';
  });

  // Modal: Nouveau Ticket
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitre, setModalTitre] = useState('');
  const [modalChantierId, setModalChantierId] = useState<string>(userAllowedChantiers[0]?.id || chantiers[0]?.id || '');
  const [modalCategorie, setModalCategorie] = useState<CategorieTicket>('ctc_technique');
  const [modalPriorite, setModalPriorite] = useState<PrioriteTicket>('haute');
  const [modalMessage, setModalMessage] = useState('');
  const [modalPieceJointe, setModalPieceJointe] = useState<string>('');
  const [modalRoleType, setModalRoleType] = useState<'siege' | 'chantier'>('chantier');

  // Auto-scroll chat to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Selected ticket
  const selectedTicket = useMemo(() => {
    const allowedTickets = ticketsDiscussion.filter((t) => isChantierAllowed(t.chantierId));
    if (!activeTicketId) return allowedTickets[0] || null;
    return allowedTickets.find((t) => t.id === activeTicketId) || allowedTickets[0] || null;
  }, [ticketsDiscussion, activeTicketId, isChantierAllowed]);

  // Mark selected ticket as read when opened
  useEffect(() => {
    if (selectedTicket) {
      marquerTicketLu(selectedTicket.id);
    }
  }, [selectedTicket?.id, selectedTicket?.messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedTicket?.messages.length]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return ticketsDiscussion.filter((t) => {
      // Must be allowed site
      if (!isChantierAllowed(t.chantierId)) {
        return false;
      }
      // Chantier
      if (selectedChantierFilter !== 'all' && t.chantierId !== selectedChantierFilter) {
        return false;
      }
      // Categorie
      if (selectedCategoryFilter !== 'all' && t.categorie !== selectedCategoryFilter) {
        return false;
      }
      // Statut
      if (selectedStatutFilter !== 'all' && t.statut !== selectedStatutFilter) {
        return false;
      }
      // Priorite
      if (selectedPrioriteFilter !== 'all' && t.priorite !== selectedPrioriteFilter) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const chantier = chantiers.find((c) => c.id === t.chantierId);
        const matchTitle = t.titre.toLowerCase().includes(q);
        const matchId = t.id.toLowerCase().includes(q);
        const matchChantier = chantier?.nom.toLowerCase().includes(q) || false;
        const matchDernier = (t.dernierMessageApercu || t.messages[t.messages.length - 1]?.contenu || '').toLowerCase().includes(q);
        const matchMsg = t.messages.some((m) => m.contenu.toLowerCase().includes(q));
        if (!matchTitle && !matchId && !matchChantier && !matchDernier && !matchMsg) {
          return false;
        }
      }
      return true;
    });
  }, [
    ticketsDiscussion,
    selectedChantierFilter,
    selectedCategoryFilter,
    selectedStatutFilter,
    selectedPrioriteFilter,
    searchQuery,
    chantiers,
  ]);

  // Category labels & icons
  const getCategoryMeta = (cat: CategorieTicket) => {
    switch (cat) {
      case 'technique_ctc':
      case 'ctc_technique':
        return { label: 'CTC & Technique', icon: ShieldAlert, color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10' };
      case 'approvisionnement':
      case 'approvisionnement_beton_fer':
        return { label: 'Béton & Aciers', icon: Truck, color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10' };
      case 'tresorerie_caisse':
        return { label: 'Caisse & Trésorerie', icon: Coins, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' };
      case 'securite_intemperies':
      case 'securite_meteo':
        return { label: 'Sécurité & Aléas', icon: AlertTriangle, color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10' };
      case 'materiel_panne':
      case 'materiel_engin_panne':
        return { label: 'Engins & Matériel', icon: Wrench, color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10' };
      default:
        return { label: 'Général', icon: FileText, color: 'text-slate-600 dark:text-slate-400 bg-slate-500/10' };
    }
  };

  const getPriorityBadge = (p: PrioriteTicket) => {
    switch (p) {
      case 'urgente':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-semibold rounded bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
            Urgente
          </span>
        );
      case 'haute':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            Haute
          </span>
        );
      case 'normale':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 text-xs rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Normale
          </span>
        );
      case 'faible':
      case 'basse':
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 text-xs rounded bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            Basse
          </span>
        );
    }
  };

  const getStatusBadge = (st: StatutTicket) => {
    switch (st) {
      case 'ouvert':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            <Clock className="w-3 h-3" />
            Ouvert
          </span>
        );
      case 'en_cours':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <Clock className="w-3 h-3" />
            En traitement
          </span>
        );
      case 'resolu':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            Résolu
          </span>
        );
      case 'ferme':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
            Clôturé
          </span>
        );
    }
  };

  // Quick reply chips tailored for BTPH Algerian operations
  const quickReplies = [
    "Reçu. Inspection technique programmée ce jour avec le bureau CTC.",
    "Alimentation de caisse validée par la Direction Financière.",
    "Bons de livraison ferraillage et ciment confirmés pour demain 07h00.",
    "Arrêt temporaire validé pour cause météo. Rédiger le rapport quotidien.",
    "Équipe de maintenance mécanique dépêchée sur chantier.",
  ];

  const handleSendMessage = () => {
    if (!selectedTicket) return;
    if (!nouveauMessage.trim() && !pieceJointeSimulee) return;

    // Simulation role determines author type
    const authorNom =
      simulationRole === 'chantier'
        ? 'M. Khaled Bouzid (Chef Chantier)'
        : `${currentUser.nom} (Siège / DAF)`;

    const authorRole = simulationRole === 'chantier' ? 'chef_chantier' : currentUser.role;

    envoyerMessageTicket(
      selectedTicket.id,
      nouveauMessage,
      pieceJointeSimulee || undefined,
      {
        id: simulationRole === 'chantier' ? 'user-cc-sim' : currentUser.id,
        nom: authorNom,
        role: authorRole,
        type: simulationRole,
      }
    );

    setNouveauMessage('');
    setPieceJointeSimulee(null);
  };

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitre.trim() || !modalMessage.trim() || !modalChantierId) return;

    let pjData = undefined;
    if (modalPieceJointe.trim()) {
      const isImg = modalPieceJointe.match(/\.(jpeg|jpg|png|webp)$/i);
      const isPdf = modalPieceJointe.match(/\.pdf$/i);
      pjData = {
        nom: modalPieceJointe.trim(),
        type: (isImg ? 'image' : isPdf ? 'pdf' : 'doc') as 'image' | 'pdf' | 'doc',
      };
    }

    creerTicketDiscussion(
      {
        titre: modalTitre.trim(),
        chantierId: modalChantierId,
        categorie: modalCategorie,
        priorite: modalPriorite,
        creeParType: modalRoleType,
      },
      modalMessage.trim(),
      pjData
    );

    setIsModalOpen(false);
    setModalTitre('');
    setModalMessage('');
    setModalPieceJointe('');
  };

  // Quick preset attachments
  const attachPresets = [
    { nom: 'PV_Constat_Fissure_Voile.pdf', type: 'pdf' as const },
    { nom: 'Photo_Avarie_Grue_G1.jpg', type: 'image' as const },
    { nom: 'Bon_Livraison_Ciment_GICA.pdf', type: 'pdf' as const },
    { nom: 'Demande_Fonds_Caisse_Urgent.pdf', type: 'pdf' as const },
  ];

  // Stats (strictly scoped to user allowed sites)
  const stats = useMemo(() => {
    const allowed = ticketsDiscussion.filter((t) => isChantierAllowed(t.chantierId));
    const total = allowed.length;
    const ouverts = allowed.filter((t) => t.statut === 'ouvert' || t.statut === 'en_cours').length;
    const urgents = allowed.filter((t) => t.priorite === 'urgente' && t.statut !== 'ferme').length;
    return { total, ouverts, urgents };
  }, [ticketsDiscussion, isChantierAllowed]);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden">
      {/* Top Banner / Metrics & Action */}
      <div className="px-6 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Messagerie & Tickets Chantier
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Temps Réel
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Canal de communication direct entre la Direction Siège et les Chefs de Chantier
            </p>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-md">
            <span className="text-slate-500 dark:text-slate-400">Tickets actifs :</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
              {stats.ouverts} / {stats.total}
            </span>
          </div>
          {stats.urgents > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 rounded-md text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              <span className="font-semibold">{stats.urgents} urgence(s) requérant arbitrage</span>
            </div>
          )}

          {/* Test Chime button */}
          <button
            onClick={playChimeNotification}
            title="Tester le signal sonore de notification"
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Primary Action Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Nouveau Ticket
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left Master List / Right Detail Chat */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: Ticket Master List */}
        <div className="w-96 min-w-[340px] max-w-sm flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          {/* Search Bar */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher réf, titre, message..."
                className="w-full pl-9 pr-7 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filters */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <select
                value={selectedChantierFilter}
                onChange={(e) => setSelectedChantierFilter(e.target.value)}
                className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-200 focus:outline-none text-[11px]"
              >
                <option value="all">{isGlobalUser ? 'Tous chantiers' : 'Mes chantiers'}</option>
                {userAllowedChantiers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>

              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-200 focus:outline-none text-[11px]"
              >
                <option value="all">Toutes catégories</option>
                <option value="ctc_technique">CTC & Technique</option>
                <option value="approvisionnement_beton_fer">Béton & Ferraillage</option>
                <option value="tresorerie_caisse">Trésorerie & Caisse</option>
                <option value="securite_meteo">Sécurité & Météo</option>
                <option value="materiel_engin_panne">Matériel & Pannes</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            {/* Statut filter tabs */}
            <div className="flex gap-1 pt-1 text-[11px]">
              {[
                { id: 'all', label: 'Tous' },
                { id: 'ouvert', label: 'Ouverts' },
                { id: 'en_cours', label: 'En cours' },
                { id: 'resolu', label: 'Résolus' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatutFilter(tab.id)}
                  className={`flex-1 py-1 px-1.5 text-center rounded transition font-medium ${
                    selectedStatutFilter === tab.id
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Aucun ticket ne correspond aux critères de filtre.
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const isSelected = selectedTicket?.id === ticket.id;
                const chantier = chantiers.find((c) => c.id === ticket.chantierId);
                const catMeta = getCategoryMeta(ticket.categorie);
                const hasUnread =
                  ['chef_chantier', 'conducteur_travaux', 'ingenieur_suivi', 'responsable_chantier', 'chef_projet'].includes(effectiveRole)
                    ? ticket.nonLuParChantier
                    : ticket.nonLuParSiege;

                return (
                  <button
                    key={ticket.id}
                    onClick={() => {
                      setActiveTicketId(ticket.id);
                      marquerTicketLu(ticket.id);
                    }}
                    className={`w-full text-left p-3 transition relative flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-l-4 border-l-emerald-600'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Header Row: Ref, Chantier & Status */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-mono font-medium text-slate-600 dark:text-slate-400">
                        {hasUnread && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shrink-0" title="Nouveau message non lu" />
                        )}
                        <span className="text-[11px] font-bold text-slate-900 dark:text-slate-200">{ticket.id}</span>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="truncate max-w-[140px] text-[11px] text-slate-500 dark:text-slate-400">
                          {chantier?.nom || 'Chantier'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 tabular-nums">
                        {new Date(ticket.dateDernierMessage).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Title */}
                    <div className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">
                      {ticket.titre}
                    </div>

                    {/* Message Preview */}
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                      {ticket.dernierMessageApercu || ticket.messages[ticket.messages.length - 1]?.contenu || ''}
                    </div>

                    {/* Badges footer */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${catMeta.color}`}>
                          <catMeta.icon className="w-2.5 h-2.5" />
                          {catMeta.label}
                        </span>
                        {getPriorityBadge(ticket.priorite)}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                        <MessageSquare className="w-3 h-3 text-slate-400" />
                        <span>{ticket.nbMessages ?? ticket.messages.length}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Detail Thread & Composer */}
        {selectedTicket ? (
          <div className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-900/60 overflow-hidden">
            {/* Conversation Header */}
            <div className="px-6 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {selectedTicket.id}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {chantiers.find((c) => c.id === selectedTicket.chantierId)?.nom}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  {getPriorityBadge(selectedTicket.priorite)}
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedTicket.titre}
                </h2>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>Initié par {selectedTicket.creeParNom} ({selectedTicket.creeParRole})</span>
                  <span>·</span>
                  <span>
                    Le {new Date(selectedTicket.dateCreation).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* Status Selector Dropdown */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Statut:</span>
                  <select
                    value={selectedTicket.statut}
                    onChange={(e) => changerStatutTicket(selectedTicket.id, e.target.value as StatutTicket)}
                    className="bg-transparent font-medium text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  >
                    <option value="ouvert">Ouvert</option>
                    <option value="en_cours">En cours de traitement</option>
                    <option value="resolu">Résolu</option>
                    <option value="ferme">Clôturé</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Conversation Messages Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedTicket.messages.map((message) => {
                const isFromChantier = message.auteurType === 'chantier';
                const isCurrentSimulator =
                  (simulationRole === 'chantier' && isFromChantier) ||
                  (simulationRole === 'siege' && !isFromChantier);

                return (
                  <div
                    key={message.id}
                    className={`flex flex-col ${
                      isFromChantier ? 'items-start' : 'items-end'
                    }`}
                  >
                    {/* Author Meta Line */}
                    <div
                      className={`flex items-center gap-2 text-xs mb-1 px-1 ${
                        isFromChantier ? 'text-teal-700 dark:text-teal-400' : 'text-blue-700 dark:text-blue-400'
                      }`}
                    >
                      <span className="font-semibold">{message.auteurNom}</span>
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {isFromChantier ? 'Sur Chantier' : 'Siège Direction'}
                      </span>
                      <span className="text-slate-400 text-[11px] tabular-nums">
                        {new Date(message.dateEnvoi).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Chat Bubble */}
                    <div
                      className={`max-w-xl rounded-xl p-3.5 shadow-sm text-xs leading-relaxed ${
                        isFromChantier
                          ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-teal-200/60 dark:border-teal-900/40 rounded-tl-sm'
                          : 'bg-emerald-600 text-white rounded-tr-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.contenu}</p>

                      {/* Attachment if present */}
                      {(message.pieceJointeNom || message.pieceJointe?.nom) && (
                        <div
                          className={`mt-2.5 pt-2 flex items-center justify-between gap-2 border-t ${
                            isFromChantier
                              ? 'border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                              : 'border-emerald-500/60 text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Paperclip className="w-3.5 h-3.5 shrink-0 opacity-80" />
                            <span className="truncate text-xs font-mono font-medium">
                              {message.pieceJointeNom || message.pieceJointe?.nom}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase ${
                              isFromChantier
                                ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                : 'bg-emerald-700/80 text-white'
                            }`}
                          >
                            {message.pieceJointeType || message.pieceJointe?.type || 'Fichier'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggested Replies Strip */}
            <div className="px-6 py-2 bg-white/70 dark:bg-slate-900/70 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
              <span className="text-[11px] font-semibold text-slate-400 shrink-0">Réponses types :</span>
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => setNouveauMessage(reply)}
                  className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] whitespace-nowrap transition border border-slate-200 dark:border-slate-700"
                >
                  {reply.length > 45 ? `${reply.slice(0, 45)}...` : reply}
                </button>
              ))}
            </div>

            {/* Composer Box */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
              {/* Persona switch bar for interactive demonstration */}
              <div className="flex items-center justify-between text-xs px-1">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Émetteur actuel :</span>
                  <div className="inline-flex rounded-md p-0.5 bg-slate-100 dark:bg-slate-800">
                    <button
                      type="button"
                      onClick={() => setSimulationRole('siege')}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                        simulationRole === 'siege'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Siège (Direction / DAF)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulationRole('chantier')}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                        simulationRole === 'chantier'
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Chef de Chantier (Site)
                    </button>
                  </div>
                </div>

                {/* Preset attachment quick picker */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[11px]">Joindre document :</span>
                  {attachPresets.map((att, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPieceJointeSimulee(att)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition ${
                        pieceJointeSimulee?.nom === att.nom
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {att.nom.split('_')[1] || att.nom.slice(0, 10)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected attachment pill */}
              {pieceJointeSimulee && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-md text-xs text-emerald-800 dark:text-emerald-200">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pièce jointe prête : <strong>{pieceJointeSimulee.nom}</strong></span>
                  </div>
                  <button
                    onClick={() => setPieceJointeSimulee(null)}
                    className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Text Input & Send */}
              <div className="flex items-end gap-2">
                <textarea
                  value={nouveauMessage}
                  onChange={(e) => setNouveauMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={2}
                  placeholder={`Rédiger une réponse officielle en tant que ${
                    simulationRole === 'siege' ? 'Direction Siège' : 'Chef de Chantier'
                  }... (Entrée pour envoyer)`}
                  className="flex-1 p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 resize-none"
                />

                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!nouveauMessage.trim() && !pieceJointeSimulee}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg transition active:scale-95 flex items-center gap-1.5 text-xs font-semibold shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>Envoyer</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <MessageSquare className="w-12 h-12 stroke-[1.5] mb-3 text-slate-300 dark:text-slate-700" />
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
              Aucun ticket sélectionné
            </h3>
            <p className="text-xs max-w-sm mt-1">
              Sélectionnez une discussion dans le volet gauche ou ouvrez un nouveau ticket pour démarrer une transmission.
            </p>
          </div>
        )}
      </div>

      {/* MODAL: Nouveau Ticket Discussion */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-600">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Ouvrir un nouveau ticket de discussion
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="p-5 space-y-4 text-xs">
              {/* Chantier & Categorie */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Chantier concerné *
                  </label>
                  <select
                    value={modalChantierId}
                    onChange={(e) => setModalChantierId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {userAllowedChantiers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Catégorie thématique *
                  </label>
                  <select
                    value={modalCategorie}
                    onChange={(e) => setModalCategorie(e.target.value as CategorieTicket)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="ctc_technique">Contrôle Technique CTC / Bureau d'Étude</option>
                    <option value="approvisionnement_beton_fer">Approvisionnement Béton / Ferraillage</option>
                    <option value="tresorerie_caisse">Trésorerie & Réapprovisionnement Caisse</option>
                    <option value="securite_meteo">Sécurité, Intempéries & Aléas</option>
                    <option value="materiel_engin_panne">Pannes Engins & Matériel</option>
                    <option value="autre">Autre sujet opérationnel</option>
                  </select>
                </div>
              </div>

              {/* Titre */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Objet / Titre du ticket *
                </label>
                <input
                  type="text"
                  value={modalTitre}
                  onChange={(e) => setModalTitre(e.target.value)}
                  placeholder="Ex: Demande urgente de validation ferraillage radier bloc B"
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Priorite & Émetteur */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Niveau de priorité *
                  </label>
                  <select
                    value={modalPriorite}
                    onChange={(e) => setModalPriorite(e.target.value as PrioriteTicket)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="basse">Basse (Information)</option>
                    <option value="normale">Normale (Planification courante)</option>
                    <option value="haute">Haute (Sous 24h)</option>
                    <option value="urgente">Urgente (Chantier bloqué / Arrêt des travaux)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Émis depuis *
                  </label>
                  <select
                    value={modalRoleType}
                    onChange={(e) => setModalRoleType(e.target.value as 'siege' | 'chantier')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="chantier">Le Chantier (Chef de Chantier / Conducteur)</option>
                    <option value="siege">Le Siège (Direction Générale / DAF)</option>
                  </select>
                </div>
              </div>

              {/* Message initial */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Message initial / Description détaillée *
                </label>
                <textarea
                  value={modalMessage}
                  onChange={(e) => setModalMessage(e.target.value)}
                  rows={4}
                  required
                  placeholder="Expliquez la situation, les contraintes sur le terrain, ou les instructions du siège..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Optional attachment */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nom d'un document ou photo à joindre (optionnel)
                </label>
                <input
                  type="text"
                  value={modalPieceJointe}
                  onChange={(e) => setModalPieceJointe(e.target.value)}
                  placeholder="Ex: PV_Coulage_Dalle_Niv3.pdf ou Photo_Coulis.jpg"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-xs"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold transition active:scale-95"
                >
                  Ouvrir le ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
