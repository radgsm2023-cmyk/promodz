import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Tier, TypeTier, TrancheVSP } from '../types';
import { formatDZD, formatDateFR } from '../utils/formatters';
import {
  Users,
  Plus,
  Search,
  Building,
  Phone,
  Mail,
  FileText,
  DollarSign,
  Printer,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  CreditCard,
} from 'lucide-react';

interface Props {
  onOpenTransactionModalWithTier: (tierId: string, type: 'sortie' | 'entree') => void;
}

export const TiersView: React.FC<Props> = ({ onOpenTransactionModalWithTier }) => {
  const { tiers, chantiers, userAllowedChantiers, isChantierAllowed, isGlobalUser, addTier, validerTrancheVSP, openPrintRecuVSP, hasPermission, currentUser } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'fournisseurs' | 'clients'>('fournisseurs');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewTierModalOpen, setIsNewTierModalOpen] = useState(false);
  const [selectedClientForVSP, setSelectedClientForVSP] = useState<Tier | null>(null);

  // Form state for new Tier
  const [nomRaisonSociale, setNomRaisonSociale] = useState('');
  const [typeTier, setTypeTier] = useState<TypeTier>('fournisseur');
  const [specialite, setSpecialite] = useState('');
  const [registreCommerceNIF, setRegistreCommerceNIF] = useState('');
  const [telephone, setTelephone] = useState('+213 (0) ');
  const [email, setEmail] = useState('');
  const [wilaya, setWilaya] = useState('Alger');
  const [adresse, setAdresse] = useState('');
  const [totalEngagementsDZD, setTotalEngagementsDZD] = useState('5000000');
  const [chantierId, setChantierId] = useState(userAllowedChantiers[0]?.id || chantiers[0]?.id || '');

  // Form state for client VSP
  const [lotReserve, setLotReserve] = useState('Appartement F4 - Bloc B - 3ème étage');
  const [contratNotarieRef, setContratNotarieRef] = useState('Acte Notarié Me Larbi n° 24/189');
  const [prixVenteTotalDZD, setPrixVenteTotalDZD] = useState('24000000');

  // Filtered lists
  const fournisseursAndSubcontractors = tiers.filter(
    (t) => t.type === 'fournisseur' || t.type === 'sous_traitant'
  );
  const clientsVSP = tiers.filter((t) => {
    if (t.type !== 'client_vsp') return false;
    if (isGlobalUser) return true;
    return t.chantiersAssocies && t.chantiersAssocies.some((id) => isChantierAllowed(id));
  });

  const currentList = activeSubTab === 'fournisseurs' ? fournisseursAndSubcontractors : clientsVSP;

  const filtered = currentList.filter((t) => {
    const q = searchTerm.toLowerCase();
    return (
      t.nomRaisonSociale.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q) ||
      (t.specialite && t.specialite.toLowerCase().includes(q)) ||
      (t.lotReserve && t.lotReserve.toLowerCase().includes(q))
    );
  });

  const handleCreateTier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomRaisonSociale.trim()) return;

    const engagements = parseFloat(totalEngagementsDZD) || 0;
    const prixVente = parseFloat(prixVenteTotalDZD) || 0;

    // If client VSP, generate initial 5-tranches schedule
    let echeancier: TrancheVSP[] | undefined = undefined;
    if (typeTier === 'client_vsp') {
      echeancier = [
        {
          id: `tr-${Date.now()}-1`,
          numero: 1,
          libelle: 'Tranche 1 - Dépôt de garantie & Réservation (20%)',
          pourcentage: 20,
          montantDZD: prixVente * 0.2,
          dateEcheance: new Date().toISOString().split('T')[0],
          statut: 'regle',
          montantPayeDZD: prixVente * 0.2,
          datePaiement: new Date().toISOString().split('T')[0],
          recuNumero: `REC-${Date.now().toString().slice(-4)}`,
        },
        {
          id: `tr-${Date.now()}-2`,
          numero: 2,
          libelle: 'Tranche 2 - Achèvement des Fondations (15%)',
          pourcentage: 15,
          montantDZD: prixVente * 0.15,
          dateEcheance: '2026-11-30',
          statut: 'a_venir',
          montantPayeDZD: 0,
        },
        {
          id: `tr-${Date.now()}-3`,
          numero: 3,
          libelle: 'Tranche 3 - Achèvement du Gros Œuvre (35%)',
          pourcentage: 35,
          montantDZD: prixVente * 0.35,
          dateEcheance: '2027-04-30',
          statut: 'a_venir',
          montantPayeDZD: 0,
        },
        {
          id: `tr-${Date.now()}-4`,
          numero: 4,
          libelle: 'Tranche 4 - Menuiserie & Cloisonnement (15%)',
          pourcentage: 15,
          montantDZD: prixVente * 0.15,
          dateEcheance: '2027-08-31',
          statut: 'a_venir',
          montantPayeDZD: 0,
        },
        {
          id: `tr-${Date.now()}-5`,
          numero: 5,
          libelle: 'Tranche 5 - Remise des clés & Conformité (15%)',
          pourcentage: 15,
          montantDZD: prixVente * 0.15,
          dateEcheance: '2027-12-31',
          statut: 'a_venir',
          montantPayeDZD: 0,
        },
      ];
    }

    addTier({
      nomRaisonSociale: nomRaisonSociale.trim(),
      type: typeTier,
      specialite: specialite.trim() || undefined,
      registreCommerceNIF: registreCommerceNIF.trim() || undefined,
      telephone: telephone.trim(),
      email: email.trim(),
      wilaya,
      adresse: adresse.trim(),
      soldeDuDZD: typeTier === 'client_vsp' ? prixVente * 0.8 : engagements,
      soldeRegleDZD: typeTier === 'client_vsp' ? prixVente * 0.2 : 0,
      totalEngagementsDZD: typeTier === 'client_vsp' ? prixVente : engagements,
      chantiersAssocies: chantierId ? [chantierId] : [],
      lotReserve: typeTier === 'client_vsp' ? lotReserve.trim() : undefined,
      contratNotarieRef: typeTier === 'client_vsp' ? contratNotarieRef.trim() : undefined,
      dateReservation: new Date().toISOString().split('T')[0],
      prixVenteTotalDZD: typeTier === 'client_vsp' ? prixVente : undefined,
      echeancierVSP: echeancier,
    });

    setIsNewTierModalOpen(false);
  };

  const handleEncaisserTranche = (client: Tier, tranche: TrancheVSP) => {
    const today = new Date().toISOString().split('T')[0];
    const recuNo = `REC-VSP-${Date.now().toString().slice(-4)}`;
    
    validerTrancheVSP(
      client.id,
      tranche.id,
      tranche.montantDZD,
      today,
      'cheque',
      recuNo
    );

    // Open printable receipt immediately
    openPrintRecuVSP(client, {
      ...tranche,
      statut: 'regle',
      montantPayeDZD: tranche.montantDZD,
      recuNumero: recuNo,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        {/* Segmented Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveSubTab('fournisseurs')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeSubTab === 'fournisseurs'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Fournisseurs & Sous-traitants ({fournisseursAndSubcontractors.length})
          </button>
          <button
            onClick={() => setActiveSubTab('clients')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeSubTab === 'clients'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Clients VSP (Vente sur plan) ({clientsVSP.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher partenaire ou client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
            />
          </div>

          {/* New Tier CTA */}
          <button
            onClick={() => {
              setTypeTier(activeSubTab === 'clients' ? 'client_vsp' : 'fournisseur');
              setIsNewTierModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>{activeSubTab === 'clients' ? 'Nouveau Client VSP' : 'Nouveau Fournisseur'}</span>
          </button>
        </div>
      </div>

      {/* Subtab 1: Fournisseurs & Sous-traitants */}
      {activeSubTab === 'fournisseurs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((tier) => {
            const hasDebt = tier.soldeDuDZD > 0;
            return (
              <div
                key={tier.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                        {tier.code}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{tier.nomRaisonSociale}</h3>
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {tier.type === 'fournisseur' ? 'Fournisseur' : 'Sous-traitant'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mb-3 line-clamp-1 font-medium">
                    {tier.specialite || 'Matériaux de construction'}
                  </p>

                  {/* Financial Balance */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5 text-xs mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Volume d'affaires :</span>
                      <span className="font-mono font-semibold text-slate-800 tabular-nums">
                        {formatDZD(tier.totalEngagementsDZD)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Total déjà réglé :</span>
                      <span className="font-mono font-semibold text-emerald-700 tabular-nums">
                        {formatDZD(tier.soldeRegleDZD)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                      <span className="font-semibold text-slate-700">Solde Restant Dû :</span>
                      <span
                        className={`font-mono font-bold tabular-nums ${
                          hasDebt ? 'text-red-600' : 'text-slate-500'
                        }`}
                      >
                        {formatDZD(tier.soldeDuDZD)}
                      </span>
                    </div>
                  </div>

                  {/* Contacts */}
                  <div className="space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono text-slate-700">{tier.telephone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{tier.adresse}, {tier.wilaya}</span>
                    </div>
                  </div>
                </div>

                {hasPermission('transactions_create') && currentUser.role !== 'superadmin' && (
                  <div className="pt-4 border-t border-slate-100 mt-4 flex items-center gap-2">
                    <button
                      onClick={() => onOpenTransactionModalWithTier(tier.id, 'sortie')}
                      className="w-full py-1.5 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors text-center"
                    >
                      + Enregistrer un règlement
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Subtab 2: Clients VSP (Vente sur plan) */}
      {activeSubTab === 'clients' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Conformité <strong>Loi n° 11-04</strong> : Les versements des acquéreurs en Vente Sur Plan sont
                échelonnés selon l'avancement physique attesté du chantier.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filtered.map((client) => {
              const chAssocie = chantiers.find((c) => client.chantiersAssocies.includes(c.id));
              const pctPaye = client.prixVenteTotalDZD
                ? Math.round((client.soldeRegleDZD / client.prixVenteTotalDZD) * 100)
                : 0;

              return (
                <div
                  key={client.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4"
                >
                  {/* Client Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                        {client.code} · Acquéreur VSP
                      </span>
                      <h3 className="text-base font-bold text-slate-900">{client.nomRaisonSociale}</h3>
                      <p className="text-xs text-amber-700 font-medium mt-0.5">{client.lotReserve}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Prix de vente total :</span>
                      <span className="text-lg font-mono font-bold text-slate-900 tabular-nums">
                        {formatDZD(client.prixVenteTotalDZD || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500">
                        Total Encaissé : <strong className="font-mono text-emerald-700">{formatDZD(client.soldeRegleDZD)}</strong>
                      </span>
                      <span className="font-mono font-bold text-slate-900">{pctPaye}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pctPaye}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>Projet : {chAssocie ? chAssocie.nom : 'Chantier'}</span>
                      <span className="text-amber-700 font-semibold font-mono">
                        Reste dû : {formatDZD(client.soldeDuDZD)}
                      </span>
                    </div>
                  </div>

                  {/* Tranches Table */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold">
                        <tr>
                          <th className="p-2.5">Tranche</th>
                          <th className="p-2.5">Échéance</th>
                          <th className="p-2.5 text-right">Montant (DA)</th>
                          <th className="p-2.5 text-center">Statut / Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {client.echeancierVSP?.map((tr) => (
                          <tr key={tr.id} className="hover:bg-slate-50/70">
                            <td className="p-2.5">
                              <span className="font-semibold text-slate-800 block">{tr.libelle}</span>
                              {tr.recuNumero && (
                                <span className="text-[10px] font-mono text-emerald-700">
                                  Reçu : {tr.recuNumero}
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 font-mono text-slate-500">
                              {formatDateFR(tr.dateEcheance)}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold tabular-nums">
                              {formatDZD(tr.montantDZD)}
                            </td>
                            <td className="p-2.5 text-center">
                              {tr.statut === 'regle' ? (
                                <button
                                  onClick={() => openPrintRecuVSP(client, tr)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded transition-colors"
                                  title="Réimprimer le reçu officiel"
                                >
                                  <Printer className="w-3 h-3" />
                                  <span>Reçu payé</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleEncaisserTranche(client, tr)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded shadow-xs transition-colors"
                                  title="Encaisser cette tranche"
                                >
                                  <CreditCard className="w-3 h-3" />
                                  <span>Encaisser</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Legal Ref */}
                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                    <span>{client.contratNotarieRef}</span>
                    <span className="font-mono text-slate-600">{client.telephone}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Add New Tier */}
      {isNewTierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-semibold">
                  {typeTier === 'client_vsp'
                    ? 'Ajouter un Acquéreur (Client VSP)'
                    : 'Ajouter un Partenaire / Fournisseur'}
                </h3>
              </div>
              <button
                onClick={() => setIsNewTierModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTier} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Type de partenaire *
                </label>
                <select
                  value={typeTier}
                  onChange={(e) => setTypeTier(e.target.value as TypeTier)}
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                >
                  <option value="fournisseur">Fournisseur de matériaux / équipements</option>
                  <option value="sous_traitant">Sous-traitant / Entreprise artisanale</option>
                  <option value="client_vsp">Client VSP (Acquéreur de logement sur plan)</option>
                  <option value="prestataire_service">Bureau d'études / Prestataire de services</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nom ou Raison Sociale *
                </label>
                <input
                  type="text"
                  required
                  placeholder={typeTier === 'client_vsp' ? 'Ex: M. Slimane Brahimi' : 'Ex: SARL Béton Algérie'}
                  value={nomRaisonSociale}
                  onChange={(e) => setNomRaisonSociale(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden font-medium"
                />
              </div>

              {typeTier === 'client_vsp' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Lot Réservé / Appartement *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Appartement F4 - Bloc C - 2ème étage"
                      value={lotReserve}
                      onChange={(e) => setLotReserve(e.target.value)}
                      className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Prix Total du Bien (DA) *
                      </label>
                      <input
                        type="number"
                        step="100000"
                        min="1000000"
                        required
                        value={prixVenteTotalDZD}
                        onChange={(e) => setPrixVenteTotalDZD(e.target.value)}
                        className="w-full px-3 py-2 text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Chantier affecté
                      </label>
                      <select
                        value={chantierId}
                        onChange={(e) => setChantierId(e.target.value)}
                        className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                      >
                        {userAllowedChantiers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Référence Acte Notarié VSP
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Acte Notarié Me Larbi n° 24/189"
                      value={contratNotarieRef}
                      onChange={(e) => setContratNotarieRef(e.target.value)}
                      className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Spécialité / Métier
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Ferronnerie, Ciment..."
                        value={specialite}
                        onChange={(e) => setSpecialite(e.target.value)}
                        className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        NIF / RC
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 000116009823489"
                        value={registreCommerceNIF}
                        onChange={(e) => setRegistreCommerceNIF(e.target.value)}
                        className="w-full px-3 py-2 text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Montant du marché / Engagement initial (DA)
                    </label>
                    <input
                      type="number"
                      step="50000"
                      value={totalEngagementsDZD}
                      onChange={(e) => setTotalEngagementsDZD(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-hidden tabular-nums"
                    />
                  </div>
                </>
              )}

              {/* Contact info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Téléphone *
                  </label>
                  <input
                    type="text"
                    required
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Wilaya</label>
                  <input
                    type="text"
                    value={wilaya}
                    onChange={(e) => setWilaya(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewTierModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-xs"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
