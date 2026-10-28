import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Chantier, StatutChantier } from '../types';
import { formatDZD, formatDateFR } from '../utils/formatters';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Calendar,
  HardHat,
  Wallet,
  Receipt,
  Package,
  FileText,
  Edit2,
  Trash2,
  ArrowRight,
  X,
  Phone,
} from 'lucide-react';

interface Props {
  onOpenChantierModal: (chantierToEdit?: Chantier) => void;
  onOpenTransactionModalWithChantier: (chantierId: string) => void;
  onOpenAlimenterModalWithCaisse: (caisseId?: string) => void;
}

export const ChantiersView: React.FC<Props> = ({
  onOpenChantierModal,
  onOpenTransactionModalWithChantier,
  onOpenAlimenterModalWithCaisse,
}) => {
  const { chantiers, userAllowedChantiers, isGlobalUser, caisses, transactions, stocks, documents, deleteChantier, hasPermission, currentUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWilaya, setSelectedWilaya] = useState<string>('all');
  const [selectedStatut, setSelectedStatut] = useState<string>('all');
  const [selectedChantierDetail, setSelectedChantierDetail] = useState<Chantier | null>(null);

  // Filter chantiers strictly to allowed projects
  const filtered = userAllowedChantiers.filter((c) => {
    const matchSearch =
      c.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.commune.toLowerCase().includes(searchTerm.toLowerCase());
    const matchWilaya = selectedWilaya === 'all' || c.wilaya === selectedWilaya;
    const matchStatut = selectedStatut === 'all' || c.statut === selectedStatut;
    return matchSearch && matchWilaya && matchStatut;
  });

  const uniqueWilayas = Array.from(new Set(userAllowedChantiers.map((c) => c.wilaya)));

  const handleDelete = (id: string, nom: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le chantier "${nom}" ?`)) {
      deleteChantier(id);
      if (selectedChantierDetail?.id === id) {
        setSelectedChantierDetail(null);
      }
    }
  };

  const getStatutBadge = (statut: StatutChantier) => {
    switch (statut) {
      case 'etude_permis':
        return <span className="text-xs text-sky-700 font-semibold">Études & Permis</span>;
      case 'terrassement':
        return <span className="text-xs text-amber-700 font-semibold">Terrassement</span>;
      case 'gros_oeuvre':
        return <span className="text-xs text-amber-600 font-bold">Gros Œuvre BA</span>;
      case 'second_oeuvre':
        return <span className="text-xs text-indigo-700 font-semibold">Second Œuvre</span>;
      case 'finition':
        return <span className="text-xs text-teal-700 font-semibold">Finitions</span>;
      case 'livre':
        return <span className="text-xs text-emerald-700 font-bold">Livré</span>;
      case 'en_arret':
        return <span className="text-xs text-red-600 font-bold">En arrêt</span>;
      default:
        return <span className="text-xs text-slate-600">{statut}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, code, commune..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
            />
          </div>

          {/* Wilaya Filter */}
          <select
            value={selectedWilaya}
            onChange={(e) => setSelectedWilaya(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
          >
            <option value="all">Toutes les wilayas</option>
            {uniqueWilayas.map((w) => (
              <option key={w} value={w}>
                Wilaya de {w}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatut}
            onChange={(e) => setSelectedStatut(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
          >
            <option value="all">Tous les statuts</option>
            <option value="terrassement">Terrassement & Fondations</option>
            <option value="gros_oeuvre">Gros Œuvre</option>
            <option value="second_oeuvre">Second Œuvre</option>
            <option value="finition">Finitions</option>
            <option value="livre">Livré</option>
          </select>
        </div>

        {/* New Chantier CTA */}
        {(isGlobalUser || hasPermission('chantiers_manage')) && (
          <button
            onClick={() => onOpenChantierModal()}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Nouveau Chantier</span>
          </button>
        )}
      </div>

      {/* Grid of Chantiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((chantier) => {
          const caisse = caisses.find((c) => c.id === chantier.caisseId);
          const chantierTx = transactions.filter((t) => t.chantierId === chantier.id);
          const chantierStocks = stocks.filter((s) => s.chantierId === chantier.id);
          const budgetConsommePct = chantier.budgetTotalDZD > 0
            ? Math.round((chantier.depensesEngageesDZD / chantier.budgetTotalDZD) * 100)
            : 0;

          return (
            <div
              key={chantier.id}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between hover:border-slate-400 transition-all"
            >
              <div>
                {/* Photo Header */}
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={chantier.imageUrl}
                    alt={chantier.nom}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900/80 text-white backdrop-blur-xs">
                      {chantier.code}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenChantierModal(chantier);
                      }}
                      className="p-1.5 bg-white/80 hover:bg-white text-slate-800 rounded-md backdrop-blur-xs transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(chantier.id, chantier.nom);
                      }}
                      className="p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-md backdrop-blur-xs transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{chantier.commune}, {chantier.wilaya}</span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-0.5 leading-snug drop-shadow-xs">
                      {chantier.nom}
                    </h3>
                  </div>
                </div>

                {/* Progress Strip */}
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500">Phase travaux : {getStatutBadge(chantier.statut)}</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {chantier.avancementPourcentage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${chantier.avancementPourcentage}%` }}
                    />
                  </div>
                </div>

                {/* Body Metrics */}
                <div className="p-4 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[11px]">Dépenses engagées</span>
                      <span className="text-sm font-mono font-bold text-red-600 tabular-nums">
                        {formatDZD(chantier.depensesEngageesDZD)}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                        {budgetConsommePct}% du budget
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[11px]">Solde Caisse Chantier</span>
                      <span className="text-sm font-mono font-bold text-slate-900 tabular-nums">
                        {caisse ? formatDZD(caisse.soldeActuelDZD) : 'N/A'}
                      </span>
                      <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">
                        Fond de roulement
                      </span>
                    </div>
                  </div>

                  {/* Specific specs */}
                  <div className="space-y-1.5 pt-1 text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Programme :</span>
                      <span className="font-semibold text-slate-800">
                        {chantier.nbrLogements} Logements {chantier.nbrLocauxCommerciaux > 0 ? `+ ${chantier.nbrLocauxCommerciaux} Commerces` : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Conducteur :</span>
                      <span className="font-medium text-slate-800">{chantier.chefChantier}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Permis de construire :</span>
                      <span className="font-mono text-slate-700">{chantier.permisConstruireNumero}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                {hasPermission('transactions_create') && currentUser.role !== 'superadmin' && (
                  <button
                    onClick={() => onOpenTransactionModalWithChantier(chantier.id)}
                    className="flex-1 py-1.5 px-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-center"
                  >
                    + Dépense
                  </button>
                )}
                <button
                  onClick={() => setSelectedChantierDetail(chantier)}
                  className="flex-1 py-1.5 px-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors text-center flex items-center justify-center gap-1"
                >
                  <span>Détails & GED</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chantier Detail Modal / Drawer */}
      {selectedChantierDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-bold">{selectedChantierDetail.nom}</h3>
                  <p className="text-xs text-slate-400">
                    {selectedChantierDetail.code} · {selectedChantierDetail.commune}, {selectedChantierDetail.wilaya}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedChantierDetail(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Top Banner Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 block">Budget Total Prévu</span>
                  <p className="text-lg font-mono font-bold text-slate-900 tabular-nums">
                    {formatDZD(selectedChantierDetail.budgetTotalDZD)}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 block">Dépenses Réalisées</span>
                  <p className="text-lg font-mono font-bold text-red-600 tabular-nums">
                    {formatDZD(selectedChantierDetail.depensesEngageesDZD)}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 block">Recettes Clients Encaissées</span>
                  <p className="text-lg font-mono font-bold text-emerald-600 tabular-nums">
                    {formatDZD(selectedChantierDetail.recettesEncaisseesDZD)}
                  </p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <span className="text-xs text-amber-800 block">Taux d'Avancement</span>
                  <p className="text-2xl font-mono font-bold text-amber-950 tabular-nums">
                    {selectedChantierDetail.avancementPourcentage}%
                  </p>
                </div>
              </div>

              {/* Technical Description & Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Fiche Technique & Prestations
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {selectedChantierDetail.description || 'Aucune description saisie.'}
                  </p>
                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    <p>• Surface de plancher développée : <strong className="text-slate-800">{selectedChantierDetail.surfaceM2} m²</strong></p>
                    <p>• Logements : <strong className="text-slate-800">{selectedChantierDetail.nbrLogements}</strong> · Locaux commerciaux : <strong className="text-slate-800">{selectedChantierDetail.nbrLocauxCommerciaux}</strong></p>
                    <p>• Permis de construire : <strong className="font-mono text-slate-800">{selectedChantierDetail.permisConstruireNumero}</strong> ({formatDateFR(selectedChantierDetail.datePermis)})</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Supervision & Calendrier
                  </h4>
                  <div className="space-y-2 text-xs text-slate-600">
                    <p className="flex items-center gap-2">
                      <HardHat className="w-4 h-4 text-slate-400" />
                      <span>Conducteur de travaux : <strong className="text-slate-900">{selectedChantierDetail.chefChantier}</strong></span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>Téléphone : <strong className="font-mono text-slate-900">{selectedChantierDetail.chefChantierTel}</strong></span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>Date démarrage : {formatDateFR(selectedChantierDetail.dateDebut)}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>Livraison prévisionnelle : <strong>{formatDateFR(selectedChantierDetail.dateFinPrevue)}</strong></span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Chantier Team / Habilitations specific to this site */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    L'équipe du Chantier & Responsabilités
                  </h4>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                    Habilitations spécifiques
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {useApp().utilisateurs.filter(u => 
                    u.chantiersAssignes.includes(selectedChantierDetail.id) || 
                    u.chantiersAssignes.includes('*') ||
                    (u.rolesParChantier && u.rolesParChantier.some(rc => rc.chantierId === selectedChantierDetail.id))
                  ).map(user => {
                    const siteSpecificRole = user.rolesParChantier?.find(rc => rc.chantierId === selectedChantierDetail.id);
                    const displayRole = siteSpecificRole ? siteSpecificRole.role : user.role;
                    const isCustom = !!siteSpecificRole;

                    return (
                      <div key={user.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3 shadow-xs">
                        <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-slate-200">
                          {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : user.nom.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{user.nom}</p>
                          <div className="flex items-center gap-1.5">
                             <p className={`text-[10px] font-bold uppercase ${isCustom ? 'text-amber-600' : 'text-slate-400'}`}>
                               {useApp().getRoleLabel(displayRole)}
                             </p>
                             {isCustom && (
                               <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title="Rôle spécifique à ce chantier" />
                             )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Transactions on this site */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Dépenses & Règlements Affectés à ce Chantier
                  </h4>
                  {hasPermission('transactions_create') && currentUser.role !== 'superadmin' && (
                    <button
                      onClick={() => {
                        onOpenTransactionModalWithChantier(selectedChantierDetail.id);
                      }}
                      className="text-xs font-semibold text-amber-700 hover:text-amber-800"
                    >
                      + Enregistrer une dépense sur ce site
                    </button>
                  )}
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-500 uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Bénéficiaire / Motif</th>
                        <th className="p-2.5">Catégorie</th>
                        <th className="p-2.5">Mode</th>
                        <th className="p-2.5 text-right">Montant (DA)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {transactions
                        .filter((tx) => tx.chantierId === selectedChantierDetail.id)
                        .map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-mono text-slate-500">{formatDateFR(tx.date)}</td>
                            <td className="p-2.5">
                              <span className="font-semibold text-slate-900 block">{tx.beneficiaireNom}</span>
                              <span className="text-[11px] text-slate-500">{tx.motif}</span>
                            </td>
                            <td className="p-2.5">{tx.categorie.replace(/_/g, ' ')}</td>
                            <td className="p-2.5 font-mono uppercase">{tx.modePaiement}</td>
                            <td className="p-2.5 text-right font-mono font-bold tabular-nums">
                              {formatDZD(tx.montantDZD)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Stocks located on this site */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Stocks & Approvisionnements sur le Site
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {stocks
                    .filter((s) => s.chantierId === selectedChantierDetail.id)
                    .map((item) => (
                      <div key={item.id} className="p-3 bg-white border border-slate-200 rounded-lg text-xs">
                        <span className="font-semibold text-slate-900 block truncate">{item.designation}</span>
                        <div className="flex items-baseline justify-between mt-1">
                          <span className="text-lg font-mono font-bold text-slate-800 tabular-nums">
                            {item.quantiteEnStock} {item.unite}s
                          </span>
                          <span className="font-mono text-slate-500">{formatDZD(item.valeurTotaleDZD)}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-1">{item.emplacementChantier}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
              <button
                onClick={() => {
                  const ch = selectedChantierDetail;
                  setSelectedChantierDetail(null);
                  onOpenChantierModal(ch);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Modifier les informations
              </button>
              <button
                onClick={() => setSelectedChantierDetail(null)}
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
