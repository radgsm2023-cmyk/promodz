import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DocumentGED, CategorieDocGED } from '../types';
import { formatDateFR, formatDZD } from '../utils/formatters';
import {
  FolderLock,
  Plus,
  Search,
  FileText,
  Download,
  Trash2,
  Eye,
  Building,
  CheckCircle,
  FileCheck,
  FileDown,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
  onOpenExportPdfModal?: (type?: 'financier' | 'paie') => void;
}

export const DocumentsView: React.FC<Props> = ({ onOpenExportPdfModal }) => {
  const { documents, chantiers, userAllowedChantiers, isChantierAllowed, isGlobalUser, addDocument, deleteDocument, appSettings } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterChantier, setFilterChantier] = useState<string>('all');
  const [filterCategorie, setFilterCategorie] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentGED | null>(null);

  // New doc form state
  const [titre, setTitre] = useState('');
  const [categorie, setCategorie] = useState<CategorieDocGED>('permis_construire');
  const [chantierId, setChantierId] = useState(userAllowedChantiers[0]?.id || chantiers[0]?.id || '');
  const [format, setFormat] = useState<'PDF' | 'DWG' | 'DOCX' | 'JPG'>('PDF');
  const [referenceInterne, setReferenceInterne] = useState('');

  // Filtered documents
  const filtered = documents.filter((doc) => {
    if (doc.chantierId && !isChantierAllowed(doc.chantierId)) {
      return false;
    }
    const matchSearch =
      doc.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.referenceInterne.toLowerCase().includes(searchTerm.toLowerCase());
    const matchChantier = filterChantier === 'all' || doc.chantierId === filterChantier;
    const matchCategorie = filterCategorie === 'all' || doc.categorie === filterCategorie;
    return matchSearch && matchChantier && matchCategorie;
  });

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) return;

    const ch = chantiers.find((c) => c.id === chantierId);

    addDocument({
      titre: titre.trim(),
      categorie,
      chantierId: chantierId || undefined,
      chantierNom: ch ? ch.nom : undefined,
      dateUpload: new Date().toISOString().split('T')[0],
      tailleKo: Math.floor(1000 + Math.random() * 8000),
      format,
      referenceInterne: referenceInterne.trim() || `REF-${Date.now().toString().slice(-4)}`,
      statut: 'valide',
    });

    setIsAddModalOpen(false);
    setTitre('');
    setReferenceInterne('');
  };

  const handleDownloadSim = (doc: DocumentGED) => {
    const fileContent = `BATIPROMOTE ALGÉRIE - GED OFFICIELLE\n\nDocument: ${doc.titre}\nCode: ${doc.code}\nRéférence: ${doc.referenceInterne}\nChantier: ${doc.chantierNom || 'Siège Social'}\nDate d'archivage: ${doc.dateUpload}\nFormat: ${doc.format}\n\nCe document est certifié conforme aux réglementations algériennes en vigueur (Loi 11-04 relative à la promotion immobilière et Codes de l'urbanisme).`;
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.code}_${doc.titre.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPreview = (doc: DocumentGED) => {
    const pdf = new jsPDF();
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text(appSettings.raisonSociale.toUpperCase(), 14, 15);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Gestion Électronique des Documents (GED) - Certificat d'Archivage`, 14, 22);
    pdf.text(`--------------------------------------------------------------------------------------------------`, 14, 27);

    pdf.setFont('helvetica', 'bold');
    pdf.text(`Détails du Document :`, 14, 38);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`- Titre : ${doc.titre}`, 14, 46);
    pdf.text(`- Code GED : ${doc.code}`, 14, 53);
    pdf.text(`- Catégorie : ${doc.categorie.replace(/_/g, ' ').toUpperCase()}`, 14, 60);
    pdf.text(`- Chantier : ${doc.chantierNom || 'Siège Social / Multi-projets'}`, 14, 67);
    pdf.text(`- Référence Interne / Visa : ${doc.referenceInterne}`, 14, 74);
    pdf.text(`- Date d'archivage : ${doc.dateUpload}`, 14, 81);
    pdf.text(`- Format d'origine : ${doc.format} (${(doc.tailleKo / 1024).toFixed(2)} Mo)`, 14, 88);
    pdf.text(`- Statut de conformité : Validé et Conforme (Loi 11-04)`, 14, 95);

    pdf.text(`Cachet et Visa de la Direction Technique :`, 14, 120);
    pdf.save(`GED_${doc.code}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par titre, visa CTC, n° permis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
            />
          </div>

          <select
            value={filterChantier}
            onChange={(e) => setFilterChantier(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
          >
            <option value="all">{isGlobalUser ? 'Tous les chantiers' : 'Mes chantiers'}</option>
            {userAllowedChantiers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>

          <select
            value={filterCategorie}
            onChange={(e) => setFilterCategorie(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
          >
            <option value="all">Toutes les catégories</option>
            <option value="permis_construire">Permis de construire</option>
            <option value="etude_sol_ctc">Rapports & Visas CTC</option>
            <option value="plan_architecture">Plans d'architecture & d'exécution</option>
            <option value="assurance_decennale">Assurance décennale</option>
            <option value="acte_notarie_vsp">Actes notariés VSP</option>
            <option value="contrat_marche">Contrats & Marchés</option>
            <option value="facture_devis">Factures & Devis</option>
          </select>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenExportPdfModal && (
            <button
              onClick={() => onOpenExportPdfModal('financier')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-amber-400/20 hover:bg-amber-400/30 border border-amber-300 rounded-lg transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
              title="Générer un bilan mensuel financier ou de paie officiel en PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-amber-700" />
              <span>Générer Bilan PDF</span>
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Archiver un Document</span>
          </button>
        </div>
      </div>

      {/* Documents Grid / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                <th className="py-3 px-3.5">Code / Format</th>
                <th className="py-3 px-3.5">Titre du Document</th>
                <th className="py-3 px-3.5">Catégorie</th>
                <th className="py-3 px-3.5">Chantier rattaché</th>
                <th className="py-3 px-3.5">Référence Interne</th>
                <th className="py-3 px-3.5 text-right">Date d'archivage</th>
                <th className="py-3 px-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-amber-400">
                        {doc.format}
                      </span>
                      <span className="font-mono text-slate-500">{doc.code}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="font-bold text-slate-900 block">{doc.titre}</span>
                    <span className="text-[11px] text-slate-400">
                      {(doc.tailleKo / 1024).toFixed(2)} Mo · Conforme Loi 11-04
                    </span>
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="capitalize text-slate-700 font-medium">
                      {doc.categorie.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="font-semibold text-slate-800">
                      {doc.chantierNom || 'Direction Siège'}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 font-mono text-slate-600">{doc.referenceInterne}</td>
                  <td className="py-3 px-3.5 text-right font-mono text-slate-500">
                    {formatDateFR(doc.dateUpload)}
                  </td>
                  <td className="py-3 px-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded cursor-pointer"
                        title="Prévisualiser PDF"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadSim(doc)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-semibold">Prévisualisation Document GED : {previewDoc.code}</h3>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Simulated PDF Reader Page */}
            <div className="p-8 bg-slate-100 overflow-y-auto max-h-[70vh]">
              <div className="bg-white p-8 rounded-lg shadow-md border border-slate-200 space-y-6 text-slate-800">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 uppercase">{appSettings.raisonSociale}</h4>
                    <p className="text-[11px] text-slate-500">Agément Promoteur n° {appSettings.agrementPromoteurNumero}</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                    Document Archivé & Validé
                  </span>
                </div>

                <div className="text-center space-y-2 py-4">
                  <span className="px-3 py-1 bg-slate-900 text-amber-400 font-mono text-xs font-bold rounded">
                    {previewDoc.format} · {previewDoc.code}
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900">{previewDoc.titre}</h3>
                  <p className="text-xs text-slate-500">
                    Catégorie : <strong className="capitalize text-slate-800">{previewDoc.categorie.replace(/_/g, ' ')}</strong>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block mb-0.5">Chantier rattaché :</span>
                    <strong className="text-slate-900">{previewDoc.chantierNom || 'Siège Social / Multi-projets'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Référence / Visa :</span>
                    <strong className="font-mono text-slate-900">{previewDoc.referenceInterne}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Date d'archivage :</span>
                    <strong className="font-mono text-slate-900">{formatDateFR(previewDoc.dateUpload)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Poids du fichier :</span>
                    <strong className="font-mono text-slate-900">{(previewDoc.tailleKo / 1024).toFixed(2)} Mo</strong>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed">
                  <strong>Conformité réglementaire (Algérie) :</strong> Ce document a été versé dans la GED sécurisée de l'entreprise conformément aux exigences de la Loi n° 11-04 fixant les règles régissant l'activité de promotion immobilière.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
              <button
                onClick={() => handlePrintPreview(previewDoc)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-700" />
                <span>Télécharger / Imprimer PDF Officiel</span>
              </button>

              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Fermer l'aperçu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Document */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <FolderLock className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-semibold">Archiver un Document GED</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Titre du document *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Visa CTC Phase Terrassement ou Arrêté de Permis"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catégorie *
                  </label>
                  <select
                    value={categorie}
                    onChange={(e) => setCategorie(e.target.value as CategorieDocGED)}
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                  >
                    <option value="permis_construire">Permis de construire</option>
                    <option value="etude_sol_ctc">Étude de sol & Visas CTC</option>
                    <option value="plan_architecture">Plans d'architecture & BA</option>
                    <option value="contrat_marche">Contrat / Marché sous-traitance</option>
                    <option value="assurance_decennale">Police d'assurance décennale</option>
                    <option value="acte_notarie_vsp">Acte notarié VSP</option>
                    <option value="facture_devis">Facture / Devis</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chantier concerné
                  </label>
                  <select
                    value={chantierId}
                    onChange={(e) => setChantierId(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                  >
                    {isGlobalUser && <option value="">-- Non rattaché (Siège) --</option>}
                    {userAllowedChantiers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Format</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                  >
                    <option value="PDF">Document PDF</option>
                    <option value="DWG">Plan AutoCAD (DWG)</option>
                    <option value="DOCX">Word (DOCX)</option>
                    <option value="JPG">Image Haute Résolution (JPG)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Référence interne ou n° visa
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: CTC-VISA-2026-09"
                    value={referenceInterne}
                    onChange={(e) => setReferenceInterne(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  Ajouter au dossier GED
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
