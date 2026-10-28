import React from 'react';
import { useApp } from '../context/AppContext';
import { formatDZD, formatDateFR, nombreEnLettresDZD } from '../utils/formatters';
import { Printer, X, CheckCircle, FileText, FileDown } from 'lucide-react';
import { exportBulletinIndividuelPDF } from '../utils/pdfExport';

export const PrintVoucherModal: React.FC = () => {
  const { printVoucher, setPrintVoucher, chantiers, employes } = useApp();

  if (!printVoucher.isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    setPrintVoucher((prev) => ({ ...prev, isOpen: false }));
  };

  const { type, transaction, tier, chantier, caisse, employe, bulletin, data } = printVoucher;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8 print:m-0 print:border-none print:shadow-none print:w-full">
        {/* Modal Toolbar - Hidden during print */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold">
              {type === 'bon_caisse'
                ? 'Bon de Caisse (Justificatif de décaissement)'
                : type === 'recu_vsp'
                ? 'Reçu de Versement Client VSP'
                : type === 'bulletin_paie'
                ? 'Bordereau de Paie & Émargement Quinzaine'
                : type === 'appel_fonds_vsp'
                ? 'Avis d’Appel de Fonds VSP (Loi 11-04)'
                : type === 'pv_avancement'
                ? 'Procès-Verbal de Constat d’Avancement des Travaux'
                : type === 'rapport_journalier'
                ? 'Rapport Journalier de Chantier & Pointage des Équipes'
                : 'Fiche Synthèse Chantier'}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            {type === 'bulletin_paie' && bulletin && (
              <button
                onClick={() => {
                  const targetEmp = employe || employes.find((e) => e.id === bulletin.employeId);
                  const doc = exportBulletinIndividuelPDF(bulletin, targetEmp);
                  doc.save(
                    `Bulletin_Paie_${bulletin.reference}_${bulletin.employeNom.replace(/\s+/g, '_')}.pdf`
                  );
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors shadow-xs"
                title="Télécharger le document officiel en PDF"
              >
                <FileDown className="w-4 h-4 text-amber-600" />
                <span>Télécharger PDF</span>
              </button>
            )}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Imprimer le document
            </button>
            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Document Container */}
        <div className="p-8 md:p-10 bg-white text-slate-900 print:p-4 print-card">
          {/* Header Promoteur */}
          <div className="border-b-2 border-slate-900 pb-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
                  SARL BATIPROMOTE ALGÉRIE
                </h1>
                <p className="text-xs text-slate-600 mt-0.5">
                  Société de Promotion Immobilière & Travaux Bâtiment
                </p>
                <div className="text-xs text-slate-500 mt-2 space-y-0.5">
                  <p>Siège Social : Boulevard du 11 Décembre 1960, Val d'Hydra, Alger</p>
                  <p>RC : 16/00-098741B20 · NIF : 002016009874133 · NIS : 002016010045</p>
                  <p>Agrément Promoteur Immobilier n° 16/DHW/2021</p>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-block border border-slate-300 rounded px-3 py-1 bg-slate-50 text-xs font-mono">
                  {type === 'bon_caisse' && (transaction?.bonCaisseNumero || transaction?.reference || 'BC-DZ-001')}
                  {type === 'recu_vsp' && (data?.tranche?.recuNumero || 'REC-VSP-2026')}
                  {type === 'bulletin_paie' && (bulletin?.reference || 'PAY-2026-DZ')}
                  {type === 'appel_fonds_vsp' && 'AVIS-FND-VSP-2026'}
                  {type === 'pv_avancement' && (printVoucher.pv?.numeroPV || 'PV-CONST-2026')}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Date : <span className="font-semibold text-slate-800 font-mono">{formatDateFR(bulletin?.dateReglement || transaction?.date || printVoucher.pv?.date || new Date().toISOString())}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Document Content */}
          {type === 'bon_caisse' && transaction && (
            <div>
              <div className="text-center my-6">
                <h2 className="text-xl font-extrabold uppercase tracking-wider text-slate-900 inline-block border-b-2 border-amber-500 pb-1">
                  BON DE DÉCAISSEMENT DE CAISSE
                </h2>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-sm mb-6">
                <div>
                  <span className="text-xs text-slate-500 block">Caisse débitée :</span>
                  <span className="font-semibold text-slate-900">{caisse?.nom || 'Caisse Chantier'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Chantier d'imputation :</span>
                  <span className="font-semibold text-slate-900">{chantier?.nom || 'Frais Généraux Promotion'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Bénéficiaire :</span>
                  <span className="font-semibold text-slate-900">{transaction.beneficiaireNom}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Mode de paiement :</span>
                  <span className="font-semibold text-slate-900 capitalize font-mono">
                    {transaction.modePaiement === 'especes' ? 'Espèces (Caisse de fond de roulement)' : transaction.modePaiement}
                  </span>
                </div>
              </div>

              {/* Motif */}
              <div className="mb-6 p-4 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500 block mb-1">Motif détaillé de la dépense :</span>
                <p className="text-sm font-medium text-slate-800 italic">{transaction.motif}</p>
                {transaction.pieceJointeNom && (
                  <p className="text-xs text-slate-500 mt-2">
                    Pièce justificative rattachée : <span className="font-mono text-slate-700">{transaction.pieceJointeNom}</span>
                  </p>
                )}
              </div>

              {/* Montant Box */}
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase text-amber-900 tracking-wider">
                    Montant décaissé :
                  </span>
                  <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                    {formatDZD(transaction.montantDZD)}
                  </span>
                </div>
                <div className="text-xs text-slate-700 border-t border-amber-200 pt-2">
                  <span className="text-slate-500">Arrêté le présent bon à la somme de : </span>
                  <span className="font-semibold underline">
                    {nombreEnLettresDZD(transaction.montantDZD)}
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200 text-center text-xs">
                <div>
                  <p className="font-semibold text-slate-700 mb-12">Le Caissier / Émetteur</p>
                  <p className="text-slate-400 font-mono text-[10px]">{transaction.enregistrePar}</p>
                  <div className="border-t border-dashed border-slate-300 mt-1"></div>
                </div>
                <div>
                  <p className="font-semibold text-slate-700 mb-12">Le Bénéficiaire (Bon pour reçu)</p>
                  <p className="text-slate-400 font-mono text-[10px]">{transaction.beneficiaireNom}</p>
                  <div className="border-t border-dashed border-slate-300 mt-1"></div>
                </div>
                <div>
                  <p className="font-semibold text-slate-700 mb-12">Visa Direction / Promoteur</p>
                  <p className="text-slate-400 font-mono text-[10px]">{transaction.validePar || 'Redha Mansouri'}</p>
                  <div className="border-t border-dashed border-slate-300 mt-1"></div>
                </div>
              </div>
            </div>
          )}

          {/* VSP Receipt Content */}
          {type === 'recu_vsp' && tier && (
            <div>
              <div className="text-center my-6">
                <h2 className="text-xl font-extrabold uppercase tracking-wider text-slate-900 inline-block border-b-2 border-emerald-600 pb-1">
                  REÇU OFFICIEL DE PAIEMENT TRANCHE VSP
                </h2>
                <p className="text-xs text-slate-500 mt-1">Vente sur Plan (Loi n° 11-04 régissant la promotion immobilière en Algérie)</p>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-sm mb-6">
                <div>
                  <span className="text-xs text-slate-500 block">Acquéreur (Client) :</span>
                  <span className="font-semibold text-slate-900">{tier.nomRaisonSociale}</span>
                  <p className="text-xs text-slate-500 mt-0.5">{tier.telephone} · {tier.email}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Programme Immobilier :</span>
                  <span className="font-semibold text-slate-900">{chantier?.nom || 'Projet Résidentiel'}</span>
                  <p className="text-xs text-slate-500 mt-0.5">{chantier?.adresse}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-slate-500 block">Désignation du Lot Réservé :</span>
                  <span className="font-semibold text-slate-900">{tier.lotReserve || 'Lot sur plan'}</span>
                  {tier.contratNotarieRef && (
                    <p className="text-xs text-slate-600 mt-0.5">Réf. Acte notarié : {tier.contratNotarieRef}</p>
                  )}
                </div>
              </div>

              {/* Tranche details */}
              <div className="mb-6 p-4 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 block">Tranche concernée :</span>
                    <span className="font-bold text-slate-900 text-base">{data?.tranche?.libelle}</span>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded">
                    Tranche Réglée
                  </span>
                </div>
              </div>

              {/* Amount */}
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase text-emerald-900 tracking-wider">
                    Montant encaissé :
                  </span>
                  <span className="text-2xl font-bold font-mono text-emerald-950 tabular-nums">
                    {formatDZD(data?.tranche?.montantPayeDZD || data?.tranche?.montantDZD || 0)}
                  </span>
                </div>
                <div className="text-xs text-slate-700 border-t border-emerald-200 pt-2">
                  <span className="text-slate-500">Montant arrêté à : </span>
                  <span className="font-semibold underline">
                    {nombreEnLettresDZD(data?.tranche?.montantPayeDZD || data?.tranche?.montantDZD || 0)}
                  </span>
                </div>
              </div>

              {/* Situational Balance */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs mb-8">
                <div>
                  <span className="text-slate-500 block">Prix Total Logement :</span>
                  <span className="font-mono font-semibold text-slate-800 tabular-nums">
                    {formatDZD(tier.prixVenteTotalDZD || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Cumulé Payé :</span>
                  <span className="font-mono font-semibold text-emerald-700 tabular-nums">
                    {formatDZD(tier.soldeRegleDZD)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Solde Restant Dû :</span>
                  <span className="font-mono font-semibold text-amber-700 tabular-nums">
                    {formatDZD(tier.soldeDuDZD)}
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-center text-xs">
                <div>
                  <p className="font-semibold text-slate-700 mb-12">L'Acquéreur (Pour acquit)</p>
                  <p className="text-slate-400 font-mono text-[10px]">{tier.nomRaisonSociale}</p>
                  <div className="border-t border-dashed border-slate-300 mt-1"></div>
                </div>
                <div>
                  <p className="font-semibold text-slate-700 mb-12">Le Promoteur Immobilier (Cachet & Signature)</p>
                  <p className="text-slate-400 font-mono text-[10px]">SARL BatiPromote Algérie</p>
                  <div className="border-t border-dashed border-slate-300 mt-1"></div>
                </div>
              </div>
            </div>
          )}

          {/* Bulletin de Paie & Bordereau d'Émargement Quinzaine Content */}
          {type === 'bulletin_paie' && bulletin && (
            <div>
              <div className="text-center my-6">
                <h2 className="text-xl font-extrabold uppercase tracking-wider text-slate-900 inline-block border-b-2 border-amber-500 pb-1">
                  BULLETIN DE PAIE & BORDEREAU D'ÉMARGEMENT
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Décompte des salaires & rémunérations de quinzaine chantier
                </p>
              </div>

              {/* Identity & Mission Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-sm mb-6">
                <div>
                  <span className="text-xs text-slate-500 block">Salarié / Ouvrier :</span>
                  <span className="font-bold text-slate-900 text-base">{bulletin.employeNom}</span>
                  <span className="text-xs text-slate-500 block mt-1 font-mono">
                    Matricule : {employe?.matricule || 'EMP-DZ'} · CNI : {employe?.cniNumero || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Chantier d'affectation :</span>
                  <span className="font-semibold text-slate-900">{bulletin.chantierNom}</span>
                  <span className="text-xs text-slate-500 block mt-1">
                    Corps de métier : <strong className="text-slate-800">{employe?.specialiteLibelle || bulletin.corpsMetier}</strong>
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Période concernée :</span>
                  <span className="font-semibold text-slate-800">{bulletin.periodeMois}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Régime de contrat :</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {bulletin.typeContrat === 'journalier_quinzaine'
                      ? 'Journalier / Quinzaine (Bordereau pointage)'
                      : bulletin.typeContrat === 'mensuel_permanent'
                      ? 'Mensuel Permanent'
                      : 'À la tâche'}
                  </span>
                </div>
              </div>

              {/* Detailed Breakdown Table */}
              <div className="border border-slate-300 rounded-lg overflow-hidden mb-6 text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Rubriques de Paie</th>
                      <th className="py-2.5 px-4 text-center">Base / Jours</th>
                      <th className="py-2.5 px-4 text-right">Taux / Tarif (DA)</th>
                      <th className="py-2.5 px-4 text-right">Montant (DA)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-2 px-4 font-semibold text-slate-900">Salaire de base / Jours ouvrés travaillés</td>
                      <td className="py-2 px-4 text-center font-mono">{bulletin.joursTravailles} jours</td>
                      <td className="py-2 px-4 text-right font-mono">{formatDZD(bulletin.tarifUnitaireDZD)}</td>
                      <td className="py-2 px-4 text-right font-mono font-bold">{formatDZD(bulletin.salaireBaseDZD)}</td>
                    </tr>
                    {bulletin.primePanierTransportDZD > 0 && (
                      <tr>
                        <td className="py-2 px-4 text-slate-700">Indemnité panier & frais de transport chantier</td>
                        <td className="py-2 px-4 text-center font-mono">-</td>
                        <td className="py-2 px-4 text-right font-mono">-</td>
                        <td className="py-2 px-4 text-right font-mono text-emerald-700 font-semibold">
                          +{formatDZD(bulletin.primePanierTransportDZD)}
                        </td>
                      </tr>
                    )}
                    {bulletin.heuresSupplementairesDZD > 0 && (
                      <tr>
                        <td className="py-2 px-4 text-slate-700">Heures supplémentaires & travaux exceptionnels (coulage)</td>
                        <td className="py-2 px-4 text-center font-mono">-</td>
                        <td className="py-2 px-4 text-right font-mono">-</td>
                        <td className="py-2 px-4 text-right font-mono text-emerald-700 font-semibold">
                          +{formatDZD(bulletin.heuresSupplementairesDZD)}
                        </td>
                      </tr>
                    )}
                    {bulletin.avancesAcomptesDeduitesDZD > 0 && (
                      <tr className="bg-red-50/40">
                        <td className="py-2 px-4 text-red-800 font-semibold">
                          Retenue / Déduction d'avances sur caisse de chantier
                        </td>
                        <td className="py-2 px-4 text-center font-mono text-red-700">Acomptes</td>
                        <td className="py-2 px-4 text-right font-mono text-red-700">-</td>
                        <td className="py-2 px-4 text-right font-mono font-bold text-red-600">
                          -{formatDZD(bulletin.avancesAcomptesDeduitesDZD)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Net Payable Highlight */}
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs font-bold uppercase text-amber-900 tracking-wider">
                      Net à Payer au Collaborateur :
                    </span>
                    <span className="text-xs text-slate-500 block">
                      Mode de paiement : {bulletin.modePaiement === 'especes_caisse' ? 'Espèces (Caisse Chantier)' : bulletin.modePaiement} · Bon réf : {bulletin.bonCaisseNumero || 'BC-PAY-AUTO'}
                    </span>
                  </div>
                  <span className="text-2xl font-black font-mono text-slate-900 tabular-nums">
                    {formatDZD(bulletin.netAPayerDZD)}
                  </span>
                </div>
                <div className="text-xs text-slate-700 border-t border-amber-200 pt-2">
                  <span className="text-slate-500">Arrêté le présent décompte à la somme nette de : </span>
                  <span className="font-semibold underline">
                    {nombreEnLettresDZD(bulletin.netAPayerDZD)}
                  </span>
                </div>
              </div>

              {/* Signatures & Émargement */}
              <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 text-center text-xs">
                <div>
                  <p className="font-semibold text-slate-700 mb-12">Le Salarié / Ouvrier (Émargement pour acquit)</p>
                  <p className="text-slate-400 font-mono text-[10px]">{bulletin.employeNom}</p>
                  <div className="border-t border-dashed border-slate-300 mt-1"></div>
                </div>
                <div>
                  <p className="font-semibold text-slate-700 mb-12">Le Chef de Chantier & Direction (Visa & Cachet)</p>
                  <p className="text-slate-400 font-mono text-[10px]">SARL BatiPromote Algérie</p>
                  <div className="border-t border-dashed border-slate-300 mt-1"></div>
                </div>
              </div>
            </div>
          )}

          {/* Type: Avis d'Appel de Fonds VSP (Loi 11-04) */}
          {type === 'appel_fonds_vsp' && (
            <div>
              <div className="text-center my-6">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                  Réglementation Vente Sur Plan (VSP) · Loi N° 11-04 du 17 Février 2011
                </span>
                <h2 className="text-xl font-extrabold uppercase tracking-wider text-slate-900 inline-block border-b-2 border-amber-500 pb-1">
                  AVIS D'APPEL DE FONDS CONTRACTUEL
                </h2>
              </div>

              {/* Acquéreur & Lot details */}
              <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg border border-slate-200 mb-6 text-xs">
                <div>
                  <span className="text-slate-500 block uppercase font-semibold">Destinataire (L'Acquéreur) :</span>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {tier?.nomRaisonSociale || printVoucher.appelFonds?.tier?.nomRaisonSociale || 'M. / Mme L\'Acquéreur'}
                  </p>
                  <p className="text-slate-600 mt-0.5">
                    Téléphone : {tier?.telephone || printVoucher.appelFonds?.tier?.telephone || '-'}
                  </p>
                  <p className="text-slate-600">
                    Adresse : {tier?.adresse || printVoucher.appelFonds?.tier?.adresse || 'Alger'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-semibold">Bien Immobilier Réservé :</span>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {tier?.lotReserve || printVoucher.appelFonds?.tier?.lotReserve || 'Appartement VSP'}
                  </p>
                  <p className="text-slate-600 mt-0.5">
                    Projet : {chantier?.nom || printVoucher.appelFonds?.chantier?.nom || 'Promotion Immobilière'}
                  </p>
                  <p className="text-slate-600">
                    Réf. Contrat de Réservation : <strong className="font-mono">{tier?.contratNotarieRef || 'ACT-NOT-2024-DZ'}</strong>
                  </p>
                </div>
              </div>

              {/* Milestone Details */}
              <div className="mb-6">
                <p className="text-xs text-slate-700 leading-relaxed mb-4">
                  Madame, Monsieur,<br />
                  Conformément aux clauses du contrat préliminaire de vente sur plan régissant l'acquisition de votre lot immobilier au sein de notre promotion, et faisant suite à la délivrance du procès-verbal technique d'avancement des travaux certifié par le Contrôle Technique de la Construction (CTC), nous vous informons que le stade d'avancement suivant a été officiellement atteint et validé :
                </p>

                <div className="p-4 bg-amber-50/70 border border-amber-300 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-amber-950 uppercase block">
                        Tranche de paiement exigible :
                      </span>
                      <p className="text-base font-extrabold text-slate-900 mt-0.5">
                        {data?.tranche?.libelle || printVoucher.appelFonds?.tranche?.libelle || 'Achèvement des travaux prévus'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 block">Montant à régler :</span>
                      <span className="text-2xl font-black font-mono text-slate-900">
                        {formatDZD(data?.tranche?.montantDZD || printVoucher.appelFonds?.tranche?.montantDZD || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-700 border-t border-amber-200 mt-3 pt-2">
                    <span className="text-slate-500">Soit en toutes lettres : </span>
                    <span className="font-bold underline">
                      {nombreEnLettresDZD(data?.tranche?.montantDZD || printVoucher.appelFonds?.tranche?.montantDZD || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Instructions & Bank details */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2 mb-6">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider">
                  Modalités de Règlement & Coordonnées Bancaires
                </h4>
                <p className="text-slate-600">
                  Le versement de cette tranche doit s'effectuer dans un délai maximum de <strong>15 jours ouvrables</strong> à compter de la réception du présent avis, par virement bancaire ou chèque certifié libellé à l'ordre du compte séquestre de l'opération :
                </p>
                <div className="p-3 bg-white rounded border border-slate-200 font-mono text-xs space-y-1">
                  <p>• Banque : <strong>Banque Nationale d'Algérie (BNA) - Agence Chéraga (612)</strong></p>
                  <p>• Titulaire : <strong>SARL BATIPROMOTE ALGÉRIE (Compte Promoteur VSP)</strong></p>
                  <p>• RIB Bancaire (20 chiffres) : <strong className="text-amber-700">00100 612 0300045612 88</strong></p>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 text-center text-xs">
                <div>
                  <p className="font-semibold text-slate-700 mb-12">Accusé de réception de l'Acquéreur</p>
                  <p className="text-slate-400 font-mono text-[10px]">Date & Signature</p>
                  <div className="border-t border-dashed border-slate-300 mt-1"></div>
                </div>
                <div>
                  <p className="font-semibold text-slate-700 mb-12">Le Promoteur Immobilier (Signature & Cachet)</p>
                  <p className="text-slate-400 font-mono text-[10px]">SARL BatiPromote Algérie</p>
                  <div className="border-t border-dashed border-slate-300 mt-1"></div>
                </div>
              </div>
            </div>
          )}

          {/* Type: PV de Constat d'Avancement des Travaux */}
          {type === 'pv_avancement' && printVoucher.pv && (
            <div>
              <div className="text-center my-6">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                  Chantiers BTPH · Contrôle Technique de la Construction (CTC) & Bureau d'Études
                </span>
                <h2 className="text-xl font-extrabold uppercase tracking-wider text-slate-900 inline-block border-b-2 border-amber-500 pb-1">
                  PROCÈS-VERBAL DE CONSTAT D'AVANCEMENT TECHNIQUE
                </h2>
              </div>

              {/* Project & Milestone banner */}
              <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg border border-slate-200 mb-6 text-xs">
                <div>
                  <span className="text-slate-500 block uppercase font-semibold">Projet / Chantier :</span>
                  <p className="text-sm font-bold text-slate-900 mt-1">{printVoucher.pv.chantierNom}</p>
                  <p className="text-slate-600 mt-0.5">Réf. Chantier : {printVoucher.chantier?.code || 'CHT-DZ'}</p>
                  <p className="text-slate-600">Localisation : {printVoucher.chantier?.commune}, Wilaya de {printVoucher.chantier?.wilaya}</p>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-semibold">Contrôle & Visas :</span>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    Visa CTC : <span className="uppercase text-emerald-700 font-black">{printVoucher.pv.visaCTC}</span>
                  </p>
                  <p className="text-slate-600 mt-0.5">
                    N° Rapport CTC : <strong className="font-mono">{printVoucher.pv.numeroRapportCTC || 'CTC-RPT-OFFICIEL'}</strong>
                  </p>
                  <p className="text-slate-600">Bureau d'Études (BET) : {printVoucher.pv.ingenieurBET}</p>
                </div>
              </div>

              {/* Inspection Summary */}
              <div className="p-4 bg-white border border-slate-200 rounded-lg mb-6 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-[11px] text-slate-500 uppercase font-semibold block">Nature des travaux inspectés :</span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">{printVoucher.pv.titre}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 uppercase font-semibold block">Taux d'Avancement Global :</span>
                    <span className="text-2xl font-black font-mono text-slate-900">{printVoucher.pv.pourcentageAvancementConstate}%</span>
                  </div>
                </div>

                <div className="text-xs space-y-2 pt-1 text-slate-700">
                  <p><strong>Observations techniques constatées :</strong> {printVoucher.pv.observations}</p>
                  {printVoucher.pv.reserves && (
                    <div className="p-3 bg-amber-50 rounded border border-amber-300 text-amber-900">
                      <strong>Réserves formulées :</strong> {printVoucher.pv.reserves}
                    </div>
                  )}
                  {printVoucher.pv.declencheAppelFondsVSP && (
                    <p className="text-emerald-700 font-semibold">
                      ✓ Constat technique ouvrant droit à l'émission de l'Appel de Fonds : {printVoucher.pv.trancheVSPDeclenchee}
                    </p>
                  )}
                </div>
              </div>

              {/* Tripartite Signatures */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 text-center text-xs">
                <div>
                  <p className="font-semibold text-slate-700 mb-12">Le Conducteur de Travaux</p>
                  <p className="text-slate-400 font-mono text-[10px]">{printVoucher.pv.conducteurChantier}</p>
                  <div className="border-t border-dashed border-slate-300 mt-1"></div>
                </div>
                <div>
                  <p className="font-semibold text-slate-700 mb-12">L'Ingénieur BET (Architecture / GC)</p>
                  <p className="text-slate-400 font-mono text-[10px]">{printVoucher.pv.ingenieurBET}</p>
                  <div className="border-t border-dashed border-slate-300 mt-1"></div>
                </div>
                <div>
                  <p className="font-semibold text-slate-700 mb-12">L'Ingénieur Contrôleur CTC (Visa)</p>
                  <p className="text-slate-400 font-mono text-[10px]">Organisme National CTC</p>
                  <div className="border-t border-dashed border-slate-300 mt-1"></div>
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENT TYPE 6: RAPPORT JOURNALIER DE CHANTIER & POINTAGE EFFECTIFS */}
          {printVoucher.type === 'rapport_journalier' && printVoucher.journalQuotidien && (
            <div>
              {/* Document Title Banner */}
              <div className="bg-slate-900 text-white p-3.5 rounded-lg mb-6 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400 font-bold block">
                    JOURNAL OFFICIEL DE CHANTIER BTPH
                  </span>
                  <h2 className="text-base font-bold tracking-tight">
                    RAPPORT QUOTIDIEN DES TRAVAUX & ÉMARGEMENT DES ÉQUIPES
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Date du rapport :</span>
                  <span className="font-mono text-sm font-bold text-amber-400">
                    {formatDateFR(printVoucher.journalQuotidien.date)}
                  </span>
                </div>
              </div>

              {/* Site & Weather Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg mb-6 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Chantier / Opération :</span>
                  <span className="font-bold text-slate-900">{printVoucher.journalQuotidien.chantierNom}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Conditions Météo :</span>
                  <span className="font-semibold text-slate-900 capitalize">
                    {printVoucher.journalQuotidien.meteo.replace(/_/g, ' ')} ({printVoucher.journalQuotidien.temperatureC}°C)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Coulage Béton (CTC) :</span>
                  <span className={`font-bold uppercase ${
                    printVoucher.journalQuotidien.conditionCoulageBeton === 'optimale'
                      ? 'text-emerald-700'
                      : printVoucher.journalQuotidien.conditionCoulageBeton === 'vigilance'
                      ? 'text-amber-700'
                      : 'text-rose-700'
                  }`}>
                    {printVoucher.journalQuotidien.conditionCoulageBeton}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Effectifs sur site :</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {printVoucher.journalQuotidien.effectifsTotalPresents} présents / {printVoucher.journalQuotidien.effectifsTotalAbsents} absents ({printVoucher.journalQuotidien.heuresTravaillesTotalChantier}h)
                  </span>
                </div>
              </div>

              {/* Tâches Réalisées ce Jour */}
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 border-b pb-1">
                  1. Tâches & Travaux Exécutés sur Site :
                </h4>
                {printVoucher.journalQuotidien.tachesDuJour.length > 0 ? (
                  <div className="space-y-2">
                    {printVoucher.journalQuotidien.tachesDuJour.map((t, idx) => (
                      <div key={t.id || idx} className="p-2.5 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 block">{t.titre}</span>
                          <span className="text-slate-500 text-[11px]">
                            {t.corpsEtat} · {t.localisation} {t.ouvriersAssignesNoms?.length ? `· Effectif: ${t.ouvriersAssignesNoms.join(', ')}` : ''}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-slate-100 text-slate-800">
                            {t.statutAgile.replace(/_/g, ' ')} ({t.avancementEstimePourcent}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Aucune tâche spécifique saisie pour cette journée.</p>
                )}
              </div>

              {/* Pointage du Personnel */}
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 border-b pb-1">
                  2. Émargement & Pointage Journalier de la Main-d'œuvre :
                </h4>
                {printVoucher.journalQuotidien.pointagesPersonnel.length > 0 ? (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold text-[11px]">
                        <th className="py-1.5 px-2">Matricule</th>
                        <th className="py-1.5 px-2">Nom & Prénom</th>
                        <th className="py-1.5 px-2">Corps de Métier</th>
                        <th className="py-1.5 px-2 text-center">Présence</th>
                        <th className="py-1.5 px-2 text-center">Heures Normales</th>
                        <th className="py-1.5 px-2 text-center">Heures Sup.</th>
                        <th className="py-1.5 px-2 text-center">Panier</th>
                        <th className="py-1.5 px-2">Affectation / Tâche</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {printVoucher.journalQuotidien.pointagesPersonnel.map((p, idx) => (
                        <tr key={p.employeId || idx}>
                          <td className="py-1.5 px-2 font-mono text-[11px] text-slate-500">{p.matricule}</td>
                          <td className="py-1.5 px-2 font-bold text-slate-900">{p.employeNom}</td>
                          <td className="py-1.5 px-2 text-slate-600 capitalize text-[11px]">{p.corpsMetier.replace(/_/g, ' ')}</td>
                          <td className="py-1.5 px-2 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              p.statutPresence === 'present'
                                ? 'bg-emerald-50 text-emerald-800'
                                : p.statutPresence === 'demi_journee'
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-rose-50 text-rose-800'
                            }`}>
                              {p.statutPresence.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-1.5 px-2 text-center font-mono">{p.statutPresence === 'present' ? p.heuresNormales : p.statutPresence === 'demi_journee' ? p.heuresNormales / 2 : 0}h</td>
                          <td className="py-1.5 px-2 text-center font-mono font-bold text-amber-800">{p.heuresSupplementaires ? `+${p.heuresSupplementaires}h` : '—'}</td>
                          <td className="py-1.5 px-2 text-center">{p.primePanierAttribuee ? '✓' : '—'}</td>
                          <td className="py-1.5 px-2 text-slate-600 text-[11px]">{p.tacheAffectee || 'Affectation générale site'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-xs text-slate-400 italic">Aucun ouvrier pointé pour cette journée.</p>
                )}
              </div>

              {/* Matériels & Matériaux & Aléas */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <span className="font-bold text-slate-900 block mb-1">Matériel & Engins Mobilisés :</span>
                  <p className="text-slate-600">
                    {printVoucher.journalQuotidien.materielsMobilises?.join(', ') || 'Grue à tour et outillage standard.'}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-900 block mb-1">Matériaux Réceptionnés / Consommés :</span>
                  <p className="text-slate-600">
                    {printVoucher.journalQuotidien.materiauxRecus?.join(', ') || 'Fournitures de stock chantier habituel.'}
                  </p>
                </div>
              </div>

              {printVoucher.journalQuotidien.incidentsOuAleas && (
                <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                  <strong>Incidents / Remarques du jour :</strong> {printVoucher.journalQuotidien.incidentsOuAleas}
                </div>
              )}

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-center text-xs">
                <div>
                  <p className="font-semibold text-slate-700 mb-12">Le Chef de Chantier (Rédacteur)</p>
                  <p className="text-slate-400 font-mono text-[10px]">{printVoucher.journalQuotidien.redigePar}</p>
                  <div className="border-t border-dashed border-slate-300 mt-1"></div>
                </div>
                <div>
                  <p className="font-semibold text-slate-700 mb-12">Le Conducteur de Travaux (Visa)</p>
                  <p className="text-slate-400 font-mono text-[10px]">{printVoucher.journalQuotidien.valideParConducteur || 'Ing. Sofiane Belkacem'}</p>
                  <div className="border-t border-dashed border-slate-300 mt-1"></div>
                </div>
              </div>
            </div>
          )}

          {type === 'contrat_reservation' && printVoucher.beneficiaire && (
            <div className="space-y-6 text-slate-800 text-sm leading-relaxed">
              <div className="text-center border-b pb-4">
                <h2 className="text-lg font-bold uppercase tracking-wide">CONTRAT PRÉLIMINAIRE DE VENTE SUR PLAN (VSP)</h2>
                <p className="text-xs text-slate-500">Conforme à la Loi n° 11-04 fixant les règles régissant l'activité de promotion immobilière</p>
                <p className="text-xs font-mono mt-1">Réf: {printVoucher.beneficiaire.referenceReservation} · Date: {printVoucher.beneficiaire.dateReservation}</p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 bg-slate-100 p-2 rounded">
                  1. IDENTIFICATION DES PARTIES CONTRACTANTES
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p><strong>LE PROMOTEUR :</strong> SARL BATIPROMOTE ALGÉRIE</p>
                    <p>Agrément n° 16/DHW/2021</p>
                    <p>Représenté par le Directeur Général</p>
                  </div>
                  <div>
                    <p><strong>L'ACQUÉREUR :</strong> {printVoucher.beneficiaire.nom} {printVoucher.beneficiaire.prenom}</p>
                    <p>NIN : {printVoucher.beneficiaire.nin}</p>
                    <p>CNI : {printVoucher.beneficiaire.numeroCNI} délivrée le {printVoucher.beneficiaire.dateDelivranceCNI} à {printVoucher.beneficiaire.autoriteDelivranceCNI}</p>
                    <p>Adresse : {printVoucher.beneficiaire.adresse}, {printVoucher.beneficiaire.wilayaResidence}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 bg-slate-100 p-2 rounded">
                  2. DESIGNATION DU LOT IMMOBILIER & PRIX DE CESSION
                </h4>
                <p className="text-xs">
                  Le Promoteur vend par les présentes à l'Acquéreur, qui accepte, le lot immobilier désigné ci-après :
                </p>
                <div className="bg-slate-50 p-3 rounded border text-xs space-y-1">
                  <div><strong>Chantier / Projet :</strong> {printVoucher.beneficiaire.chantierNom}</div>
                  <div><strong>Lot N° / Type :</strong> Lot {printVoucher.beneficiaire.logementNumero} — Appartement type <strong>{printVoucher.beneficiaire.logementType}</strong> ({printVoucher.beneficiaire.surfaceM2} m²)</div>
                  <div><strong>Implantation :</strong> {printVoucher.beneficiaire.bloc} · Étage R+{printVoucher.beneficiaire.etage}</div>
                  <div><strong>Prix Total de Cession (TTC) :</strong> <span className="font-bold text-slate-900">{printVoucher.beneficiaire.prixTotalCessionDZD.toLocaleString()} DA</span> ({nombreEnLettresDZD(printVoucher.beneficiaire.prixTotalCessionDZD)})</div>
                  <div><strong>Mode de Financement :</strong> {printVoucher.beneficiaire.modeFinancement.replace(/_/g, ' ').toUpperCase()} ({printVoucher.beneficiaire.etablissementBancaire || 'Fonds Propres'})</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 bg-slate-100 p-2 rounded">
                  3. GARANTIE D'ACHÈVEMENT & NOTAIRE INSTRUMENTAIRE
                </h4>
                <p className="text-xs">
                  Conformément aux dispositions de la Loi 11-04, la présente vente est couverte par l'attestation de garantie d'achèvement 
                  <strong> {printVoucher.beneficiaire.policeAssuranceFGCMPI || 'FGCMPI-ACT-2024-00892'}</strong>. 
                  L'acte notarié définitif est dressé en l'étude de <strong>{printVoucher.beneficiaire.notaireInstrumentaire || 'Maître Kaddour Ahmed'}</strong>, Notaire à {printVoucher.beneficiaire.notaireWilaya || 'Alger'}.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8 border-t text-center text-xs">
                <div>
                  <p className="font-semibold text-slate-700 mb-12">Signature de l'Acquéreur (Lu et approuvé)</p>
                  <div className="border-t border-dashed border-slate-300"></div>
                </div>
                <div>
                  <p className="font-semibold text-slate-700 mb-12">Cachet & Signature du Promoteur</p>
                  <div className="border-t border-dashed border-slate-300"></div>
                </div>
              </div>
            </div>
          )}

          {type === 'pv_remise_cles' && printVoucher.logement && (
            <div className="space-y-6 text-slate-800 text-sm leading-relaxed">
              <div className="text-center border-b pb-4">
                <h2 className="text-lg font-bold uppercase tracking-wide">PROCÈS-VERBAL DE RÉCEPTION & REMISE DES CLÉS</h2>
                <p className="text-xs text-slate-500">Chantier : {printVoucher.logement.chantierNom} · Lot N° : {printVoucher.logement.numeroLot}</p>
              </div>

              <div className="space-y-3 text-xs">
                <p>
                  Le présent procès-verbal atteste qu'en date de ce jour, il a été procédé par le Représentant de la SARL BATIPROMOTE ALGÉRIE 
                  et l'acquéreur du lot <strong>{printVoucher.logement.numeroLot}</strong> ({printVoucher.logement.type}, Bloc {printVoucher.logement.bloc}, Surface {printVoucher.logement.surfaceHabitableM2} m²), 
                  à la visite contradictoire des lieux et à la vérification de la conformité des finitions (<strong>{printVoucher.logement.finition.replace(/_/g, ' ')}</strong>).
                </p>

                <div className="bg-slate-50 p-3 rounded border space-y-2">
                  <h5 className="font-bold text-slate-900">État des réserves et levées :</h5>
                  {printVoucher.logement.reserves && printVoucher.logement.reserves.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {printVoucher.logement.reserves.map((res) => (
                        <li key={res.id}>
                          <strong>{res.element} :</strong> {res.description} — <span className={res.levee ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>{res.levee ? 'LEVÉE ET CONFORME' : 'EN COURS DE TRAITEMENT'}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-emerald-700 font-medium">Aucune réserve formulée. Le logement est reçu en parfait état de conformité.</p>
                  )}
                </div>

                <p>
                  L'acquéreur déclare avoir reçu les clés de son appartement ainsi que les badges d'accès parking et télécommandes de portail. 
                  Il est dès à présent entré en jouissance de son bien immobilier.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8 border-t text-center text-xs">
                <div>
                  <p className="font-semibold text-slate-700 mb-12">L'Acquéreur (Bénéficiaire)</p>
                  <div className="border-t border-dashed border-slate-300"></div>
                </div>
                <div>
                  <p className="font-semibold text-slate-700 mb-12">Le Représentant du Promoteur</p>
                  <div className="border-t border-dashed border-slate-300"></div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Legal notice */}
          <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
            Document généré automatiquement via la plateforme BatiPromote DZ · Valable pour justificatif comptable et fiscal.
          </div>
        </div>
      </div>
    </div>
  );
};
