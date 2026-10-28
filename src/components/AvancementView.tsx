import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  PVSituationChantier,
  EtapeTravaux,
  StatutVisaCTC,
  JournalChantierQuotidien,
  PointageOuvrierJournalier,
  TacheJournaliereChantier,
  StatutTacheAgile,
  PrioriteTache,
  MeteoChantier,
  StatutPresence,
} from '../types';
import { formatDZD, formatDateFR } from '../utils/formatters';
import {
  ClipboardCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  FileText,
  Printer,
  ChevronRight,
  ShieldCheck,
  Send,
  Trash2,
  X,
  HardHat,
  Award,
  Calendar,
  Sun,
  CloudRain,
  Wind,
  Thermometer,
  Zap,
  Users,
  Check,
  ArrowRight,
  ArrowLeft,
  Sliders,
  Sparkles,
  Layers,
  ChevronDown,
  Info,
  Edit2,
  Eye,
  CheckSquare,
  Square,
  Flame,
} from 'lucide-react';

type SubTab = 'journal' | 'pointage' | 'agile' | 'pvs' | 'jalons';

export const AvancementView: React.FC = () => {
  const {
    chantiers,
    activeChantierId,
    setActiveChantierId,
    pvsChantier,
    addPVChantier,
    validerPVChantier,
    deletePVChantier,
    declencherAppelFondsPourChantier,
    openPrintPVAvancement,
    openPrintRapportJournalier,
    tiers,
    currentUser,
    employes,
    materiels,
    stocks,
    journauxChantier,
    addJournalChantier,
    updateJournalChantier,
    savePointageJournalier,
    addTacheAgileChantier,
    updateTacheAgileChantier,
    deleteTacheAgileChantier,
    effectiveRole,
  } = useApp();

  // Tab state
  const [activeTab, setActiveTab] = useState<SubTab>('journal');

  // Selected Chantier & Date for Daily Tracking
  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);
  const isGlobalUser =
    currentUser.role === 'superadmin' ||
    currentUser.role === 'directeur_promoteur' ||
    currentUser.chantiersAssignes.includes('*');

  const userAllowedChantiers = isGlobalUser
    ? chantiers
    : chantiers.filter((c) => currentUser.chantiersAssignes.includes(c.id));

  const [selectedDate, setSelectedDate] = useState<string>(todayISO);
  const [selectedChantierId, setSelectedChantierId] = useState<string>(() => {
    if (activeChantierId && (isGlobalUser || currentUser.chantiersAssignes.includes(activeChantierId))) {
      return activeChantierId;
    }
    return userAllowedChantiers[0]?.id || '';
  });

  // Sync with global active chantier if selected
  const activeChantier = useMemo(() => {
    return userAllowedChantiers.find((c) => c.id === selectedChantierId) || userAllowedChantiers[0];
  }, [userAllowedChantiers, selectedChantierId]);

  // Current Daily Journal for selected site and date
  const currentJournal = useMemo(() => {
    const existing = journauxChantier.find(
      (j) => j.chantierId === selectedChantierId && j.date === selectedDate
    );
    if (existing) return existing;

    // Default template if no journal exists yet for this date
    return {
      id: `virtual-${selectedChantierId}-${selectedDate}`,
      chantierId: selectedChantierId,
      chantierNom: activeChantier?.nom || 'Chantier',
      date: selectedDate,
      meteo: 'ensoleille' as MeteoChantier,
      temperatureC: 24,
      conditionCoulageBeton: 'optimale' as const,
      effectifsTotalPresents: 0,
      effectifsTotalAbsents: 0,
      heuresTravaillesTotalChantier: 0,
      tachesDuJour: [],
      pointagesPersonnel: [],
      materielsMobilises: ['Grue à tour Potain 50m (LEV-002)', 'Bétonnière thermique 500L'],
      materiauxRecus: ['Ciment CPJ 42.5', 'Béton B25'],
      redigePar: currentUser.nom,
      statutRapport: 'brouillon' as const,
    };
  }, [journauxChantier, selectedChantierId, selectedDate, activeChantier, currentUser.nom]);

  // Workers attached to this chantier (or all if not filtered)
  const siteWorkers = useMemo(() => {
    return employes.filter((e) => e.chantierId === selectedChantierId || !e.chantierId);
  }, [employes, selectedChantierId]);

  // Current Attendance Map
  const [pointageState, setPointageState] = useState<Record<string, PointageOuvrierJournalier>>({});

  // Sync pointage state when date or chantier changes
  React.useEffect(() => {
    const existingPointages = currentJournal.pointagesPersonnel || [];
    const map: Record<string, PointageOuvrierJournalier> = {};

    siteWorkers.forEach((emp) => {
      const found = existingPointages.find((p) => p.employeId === emp.id);
      if (found) {
        map[emp.id] = { ...found };
      } else {
        map[emp.id] = {
          employeId: emp.id,
          employeNom: `${emp.prenom} ${emp.nom}`,
          matricule: emp.matricule,
          corpsMetier: emp.corpsMetier,
          statutPresence: 'present',
          heuresNormales: 8,
          heuresSupplementaires: 0,
          primePanierAttribuee: true,
          primeTransportAttribuee: true,
          tacheAffectee: 'Travaux généraux de corps d’état',
        };
      }
    });

    setPointageState(map);
  }, [currentJournal, siteWorkers]);

  // Agile Task Creation Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState<{
    titre: string;
    corpsEtat: string;
    localisation: string;
    statutAgile: StatutTacheAgile;
    priorite: PrioriteTache;
    avancementEstimePourcent: number;
    responsableNom: string;
    observationsTechniques: string;
  }>({
    titre: '',
    corpsEtat: 'Gros Œuvre / Béton Armé',
    localisation: 'Bloc A - Niveau R+3',
    statutAgile: 'a_faire',
    priorite: 'normale',
    avancementEstimePourcent: 0,
    responsableNom: currentUser.nom,
    observationsTechniques: '',
  });

  // Weather & Journal Edit State
  const [isJournalConfigOpen, setIsJournalConfigOpen] = useState(false);
  const [journalMeteo, setJournalMeteo] = useState<MeteoChantier>(currentJournal.meteo);
  const [journalTemp, setJournalTemp] = useState<number>(currentJournal.temperatureC);
  const [journalConditionBeton, setJournalConditionBeton] = useState<'optimale' | 'vigilance' | 'interdite'>(
    currentJournal.conditionCoulageBeton
  );
  const [journalIncidents, setJournalIncidents] = useState<string>(currentJournal.incidentsOuAleas || '');

  // PVs & Milestone Tranches State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEtape, setSelectedEtape] = useState<string>('all');
  const [selectedVisa, setSelectedVisa] = useState<string>('all');
  const [isPVModalOpen, setIsPVModalOpen] = useState(false);

  // PV Form State
  const [formTitre, setFormTitre] = useState('');
  const [formDate, setFormDate] = useState(todayISO);
  const [formEtape, setFormEtape] = useState<EtapeTravaux>('gros_oeuvre');
  const [formPourcentage, setFormPourcentage] = useState(50);
  const [formVisaCTC, setFormVisaCTC] = useState<StatutVisaCTC>('favorable');
  const [formRapportCTC, setFormRapportCTC] = useState('');
  const [formBET, setFormBET] = useState("Bureau d'Études & Architecture A. Mansouri");
  const [formConducteur, setFormConducteur] = useState(
    ['conducteur_travaux', 'responsable_chantier', 'chef_projet'].includes(effectiveRole) ? currentUser.nom : 'Ing. Sofiane Belkacem'
  );
  const [formObservations, setFormObservations] = useState('');
  const [formReserves, setFormReserves] = useState('');
  const [formDeclencheAppel, setFormDeclencheAppel] = useState(false);
  const [formTrancheNom, setFormTrancheNom] = useState('Tranche 3 : Gros Œuvre 30%');

  // Filter PVs
  const filteredPVs = pvsChantier.filter((pv) => {
    const matchChantier = selectedChantierId ? pv.chantierId === selectedChantierId : true;
    const matchSearch =
      pv.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pv.numeroPV.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pv.chantierNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pv.numeroRapportCTC && pv.numeroRapportCTC.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchEtape = selectedEtape === 'all' || pv.etapeTravaux === selectedEtape;
    const matchVisa = selectedVisa === 'all' || pv.visaCTC === selectedVisa;

    return matchChantier && matchSearch && matchEtape && matchVisa;
  });

  // Date Navigation Handlers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // 1-Click Pointage: Mark all present
  const handleBatchAllPresent = () => {
    const updated: Record<string, PointageOuvrierJournalier> = {};
    siteWorkers.forEach((emp) => {
      updated[emp.id] = {
        employeId: emp.id,
        employeNom: `${emp.prenom} ${emp.nom}`,
        matricule: emp.matricule,
        corpsMetier: emp.corpsMetier,
        statutPresence: 'present',
        heuresNormales: 8,
        heuresSupplementaires: 0,
        primePanierAttribuee: true,
        primeTransportAttribuee: true,
        tacheAffectee: 'Affectation générale de chantier',
      };
    });
    setPointageState(updated);
    savePointageJournalier(selectedChantierId, selectedDate, Object.values(updated));
  };

  // Save current pointage state
  const handleSavePointage = () => {
    savePointageJournalier(selectedChantierId, selectedDate, Object.values(pointageState));
  };

  // Add Task Submit
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.titre.trim()) return;

    addTacheAgileChantier(selectedChantierId, selectedDate, {
      titre: taskForm.titre.trim(),
      corpsEtat: taskForm.corpsEtat,
      localisation: taskForm.localisation,
      statutAgile: taskForm.statutAgile,
      priorite: taskForm.priorite,
      avancementEstimePourcent: Number(taskForm.avancementEstimePourcent),
      ouvriersAssignesNoms: [],
      responsableNom: taskForm.responsableNom || currentUser.nom,
      observationsTechniques: taskForm.observationsTechniques,
    });

    setIsTaskModalOpen(false);
    setTaskForm({
      titre: '',
      corpsEtat: 'Gros Œuvre / Béton Armé',
      localisation: 'Bloc A - Niveau R+3',
      statutAgile: 'a_faire',
      priorite: 'normale',
      avancementEstimePourcent: 0,
      responsableNom: currentUser.nom,
      observationsTechniques: '',
    });
  };

  // Agile Kanban Column Advance / Regress
  const handleMoveTaskStage = (tacheId: string, currentStage: StatutTacheAgile, direction: 'next' | 'prev') => {
    const stages: StatutTacheAgile[] = ['a_faire', 'en_cours', 'attente_ctc', 'termine'];
    const idx = stages.indexOf(currentStage);
    const targetIdx = direction === 'next' ? Math.min(stages.length - 1, idx + 1) : Math.max(0, idx - 1);
    const nextStage = stages[targetIdx];

    const updates: Partial<TacheJournaliereChantier> = { statutAgile: nextStage };
    if (nextStage === 'termine') updates.avancementEstimePourcent = 100;
    if (nextStage === 'a_faire' && currentStage === 'termine') updates.avancementEstimePourcent = 0;

    updateTacheAgileChantier(selectedChantierId, selectedDate, tacheId, updates);
  };

  // PV Submit
  const handleSubmitPV = (e: React.FormEvent) => {
    e.preventDefault();
    const ch = chantiers.find((c) => c.id === selectedChantierId);
    if (!ch) return;

    const numeroPV = `PV-${ch.code.slice(0, 5)}-${new Date().getFullYear()}-${String(
      pvsChantier.length + 1
    ).padStart(2, '0')}`;

    addPVChantier({
      numeroPV,
      chantierId: selectedChantierId,
      chantierNom: ch.nom,
      date: formDate,
      titre: formTitre,
      etapeTravaux: formEtape,
      pourcentageAvancementConstate: Number(formPourcentage),
      visaCTC: formVisaCTC,
      numeroRapportCTC: formRapportCTC || undefined,
      ingenieurBET: formBET,
      conducteurChantier: formConducteur,
      observations: formObservations,
      reserves: formReserves || undefined,
      declencheAppelFondsVSP: formDeclencheAppel,
      trancheVSPDeclenchee: formDeclencheAppel ? formTrancheNom : undefined,
      statut: 'brouillon',
    });

    setIsPVModalOpen(false);
  };

  // Attendance summary metrics
  const pointageMetrics = useMemo(() => {
    const list = Object.values(pointageState);
    const presents = list.filter((p) => p.statutPresence === 'present').length;
    const demi = list.filter((p) => p.statutPresence === 'demi_journee').length;
    const absents = list.filter((p) => p.statutPresence === 'absent_injustifie' || p.statutPresence === 'conge_arret').length;
    const totalPresents = presents + demi;
    const totalHours = list.reduce((acc, p) => {
      const base = p.statutPresence === 'present' ? p.heuresNormales : p.statutPresence === 'demi_journee' ? p.heuresNormales / 2 : 0;
      return acc + base + (p.heuresSupplementaires || 0);
    }, 0);
    const totalSupp = list.reduce((acc, p) => acc + (p.heuresSupplementaires || 0), 0);
    const totalPaniers = list.filter((p) => p.primePanierAttribuee && (p.statutPresence === 'present' || p.statutPresence === 'demi_journee')).length;

    return { presents, demi, absents, totalPresents, totalHours, totalSupp, totalPaniers, totalWorkers: list.length };
  }, [pointageState]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Context Controls */}
      <div className="p-5 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                Pilotage Opérationnel de Chantier BTPH
              </span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs text-slate-300 font-medium">Loi 11-04 & Règles Parasismiques RPA 99/2003</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Suivi Journalier des Travaux & Émargement Main-d'œuvre
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Consultez et validez au quotidien les tâches réalisées, les pointages ouvriers, les conditions climatiques et
              l'avancement technique sur le tableau agile de chaque chantier.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tâche Agile</span>
            </button>
            <button
              onClick={handleBatchAllPresent}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg shadow-sm transition-colors cursor-pointer"
              title="Pointer tous les ouvriers présents pour 8 heures"
            >
              <Zap className="w-4 h-4 text-emerald-300" />
              <span>Pointer Tous Présents</span>
            </button>
            <button
              onClick={() => openPrintRapportJournalier(currentJournal)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              title="Imprimer le rapport officiel de la journée"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Imprimer Journal</span>
            </button>
          </div>
        </div>

        {/* Global Chantier, Date Navigation & Climate Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 mt-4 border-t border-slate-800 text-xs">
          {/* Site Selector */}
          <div className="flex items-center gap-2 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
            <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Chantier Actif :</span>
              <select
                value={selectedChantierId}
                onChange={(e) => {
                  setSelectedChantierId(e.target.value);
                  if (activeChantierId !== e.target.value) {
                    setActiveChantierId(e.target.value);
                  }
                }}
                className="w-full bg-transparent text-white font-bold text-xs focus:outline-hidden cursor-pointer truncate"
              >
                {userAllowedChantiers.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    {c.nom} ({c.wilaya} - {c.avancementPourcentage}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Navigator */}
          <div className="flex items-center justify-between gap-2 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
            <button
              onClick={handlePrevDay}
              className="p-1 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
              title="Jour précédent"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="text-center min-w-0">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Date de Suivi :</span>
              <div className="flex items-center justify-center gap-1.5 font-bold text-amber-300">
                <Calendar className="w-3.5 h-3.5" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-white font-mono text-xs focus:outline-hidden cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedDate(todayISO)}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                  selectedDate === todayISO ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-slate-300'
                }`}
              >
                Auj.
              </button>
              <button
                onClick={handleNextDay}
                className="p-1 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
                title="Jour suivant"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weather & Concrete Pouring CTC status */}
          <div className="flex items-center justify-between gap-3 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2">
              {currentJournal.meteo === 'ensoleille' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : currentJournal.meteo === 'vent_fort_sirocco' ? (
                <Wind className="w-5 h-5 text-amber-500" />
              ) : (
                <CloudRain className="w-5 h-5 text-blue-400" />
              )}
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Climat & Météo :</span>
                <span className="font-bold text-white capitalize">
                  {currentJournal.meteo.replace(/_/g, ' ')} ({currentJournal.temperatureC}°C)
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Coulage Béton CTC :</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  currentJournal.conditionCoulageBeton === 'optimale'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : currentJournal.conditionCoulageBeton === 'vigilance'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {currentJournal.conditionCoulageBeton}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('journal')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'journal'
                ? 'border-amber-500 text-slate-900 bg-amber-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-600" />
            <span>Journal Quotidien</span>
          </button>

          <button
            onClick={() => setActiveTab('pointage')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'pointage'
                ? 'border-amber-500 text-slate-900 bg-amber-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-amber-600" />
            <span>Pointage Effectifs ({pointageMetrics.totalPresents}/{pointageMetrics.totalWorkers})</span>
          </button>

          <button
            onClick={() => setActiveTab('agile')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'agile'
                ? 'border-amber-500 text-slate-900 bg-amber-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Tableau Agile / Kanban ({currentJournal.tachesDuJour.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pvs')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'pvs'
                ? 'border-amber-500 text-slate-900 bg-amber-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 text-amber-600" />
            <span>PVs Techniques & Visas CTC ({filteredPVs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('jalons')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'jalons'
                ? 'border-amber-500 text-slate-900 bg-amber-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-4 h-4 text-amber-600" />
            <span>Jalons VSP & Appels de Fonds</span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-1 text-[11px] text-slate-500 pr-2">
          <span>Avancement Physique Global :</span>
          <strong className="text-slate-900 font-mono text-xs">{activeChantier.avancementPourcentage}%</strong>
        </div>
      </div>

      {/* ================= TAB 1: JOURNAL QUOTIDIEN ================= */}
      {activeTab === 'journal' && (
        <div className="space-y-6">
          {/* Quick Metrics of the Day */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] uppercase font-semibold text-slate-400 block">Effectifs Mobilisés</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black font-mono text-slate-900">{pointageMetrics.totalPresents}</span>
                <span className="text-xs text-slate-500">/ {pointageMetrics.totalWorkers} ouvriers</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                {pointageMetrics.absents === 0 ? '✓ Taux de présence 100%' : `${pointageMetrics.absents} absent(s) signalés`}
              </span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] uppercase font-semibold text-slate-400 block">Volume Heures du Jour</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black font-mono text-amber-700">{pointageMetrics.totalHours}</span>
                <span className="text-xs text-slate-500">heures cumulées</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                dont +{pointageMetrics.totalSupp}h supplémentaires
              </span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] uppercase font-semibold text-slate-400 block">Tâches Exécutées</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black font-mono text-slate-900">
                  {currentJournal.tachesDuJour.filter((t) => t.statutAgile === 'termine').length}
                </span>
                <span className="text-xs text-slate-500">/ {currentJournal.tachesDuJour.length} terminées</span>
              </div>
              <span className="text-[11px] text-blue-700 font-semibold mt-1 block">
                {currentJournal.tachesDuJour.filter((t) => t.statutAgile === 'en_cours').length} tâche(s) en cours
              </span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] uppercase font-semibold text-slate-400 block">Validations & Visas</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-sm font-bold text-slate-900">
                  {currentJournal.statutRapport === 'valide' ? 'Validé par Conducteur' : 'Brouillon en saisie'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Rédigé par : {currentJournal.redigePar}
              </span>
            </div>
          </div>

          {/* Daily Tasks Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Tâches & Activités Prévues / Réalisées ce Jour ({formatDateFR(selectedDate)})
                </h3>
                <p className="text-xs text-slate-500">
                  Affectation des équipes et mise à jour de l'état d'avancement des postes de travail.
                </p>
              </div>

              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une Tâche</span>
              </button>
            </div>

            {currentJournal.tachesDuJour.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentJournal.tachesDuJour.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex flex-col justify-between space-y-2 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 leading-snug">{task.titre}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            task.priorite === 'urgente'
                              ? 'bg-rose-100 text-rose-800'
                              : task.priorite === 'haute'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {task.priorite}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 space-y-0.5 mt-1">
                        <div>
                          <strong>Corps d'état :</strong> {task.corpsEtat}
                        </div>
                        <div>
                          <strong>Localisation :</strong> {task.localisation}
                        </div>
                        {task.observationsTechniques && (
                          <p className="text-[11px] text-slate-600 italic bg-white p-1.5 rounded border border-slate-200 mt-1">
                            {task.observationsTechniques}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 space-y-2">
                      {/* Avancement Slider */}
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="font-semibold text-slate-600">Avancement estimé</span>
                          <span className="font-mono font-bold text-slate-900">{task.avancementEstimePourcent}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={task.avancementEstimePourcent}
                          onChange={(e) =>
                            updateTacheAgileChantier(selectedChantierId, selectedDate, task.id, {
                              avancementEstimePourcent: Number(e.target.value),
                            })
                          }
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>

                      {/* Stage Selector Pills */}
                      <div className="flex items-center justify-between gap-1 pt-1">
                        <div className="flex gap-1">
                          {(['a_faire', 'en_cours', 'attente_ctc', 'termine'] as StatutTacheAgile[]).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => {
                                const updates: Partial<TacheJournaliereChantier> = { statutAgile: st };
                                if (st === 'termine') updates.avancementEstimePourcent = 100;
                                updateTacheAgileChantier(selectedChantierId, selectedDate, task.id, updates);
                              }}
                              className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase transition-colors cursor-pointer ${
                                task.statutAgile === st
                                  ? 'bg-slate-900 text-amber-400'
                                  : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              {st === 'a_faire'
                                ? 'À faire'
                                : st === 'en_cours'
                                ? 'En cours'
                                : st === 'attente_ctc'
                                ? 'Visa CTC'
                                : 'Terminé'}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => deleteTacheAgileChantier(selectedChantierId, selectedDate, task.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Supprimer la tâche"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <ClipboardCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">Aucune tâche enregistrée pour ce jour</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Cliquez sur "+ Ajouter une Tâche" ou naviguez sur le tableau Kanban Agile.
                </p>
              </div>
            )}
          </div>

          {/* Equipment & Materials Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-xs font-bold text-slate-900 block uppercase tracking-wider">
                Engins & Matériels Opérationnels ce Jour
              </span>
              <p className="text-[11px] text-slate-500">
                Engins lourds et équipements actifs sous le contrôle du chef de chantier.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {currentJournal.materielsMobilises.map((m, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-1 rounded-lg"
                  >
                    🚜 {m}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-xs font-bold text-slate-900 block uppercase tracking-wider">
                Matériaux Réceptionnés / Bons de Livraison
              </span>
              <p className="text-[11px] text-slate-500">
                Matériaux livrés sur site et soumis au contrôle d'admission BET/CTC.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {currentJournal.materiauxRecus.map((mat, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg"
                  >
                    📦 {mat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: POINTAGE EFFECTIFS ================= */}
      {activeTab === 'pointage' && (
        <div className="space-y-4">
          {/* Top Pointage Bar & Agility CTA */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Feuille d'Émargement & Pointage Journalier : {activeChantier.nom}
                </h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  {formatDateFR(selectedDate)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pointez la présence, les heures normales et les heures supplémentaires pour chaque ouvrier affecté à ce chantier.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleBatchAllPresent}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-2xs transition-colors cursor-pointer"
                title="Définir tous les effectifs comme présents 8h"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-200" />
                <span>Pointer Tous Présents (8h)</span>
              </button>

              <button
                onClick={handleSavePointage}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 text-slate-900" />
                <span>Enregistrer le Pointage</span>
              </button>
            </div>
          </div>

          {/* Workers Pointage Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white border-b border-slate-800 text-[11px]">
                    <th className="py-3 px-4 font-semibold">Ouvrier / Collaborateur</th>
                    <th className="py-3 px-3 font-semibold text-center">Statut de Présence</th>
                    <th className="py-3 px-3 font-semibold text-center">Heures Normales</th>
                    <th className="py-3 px-3 font-semibold text-center">Heures Sup.</th>
                    <th className="py-3 px-3 font-semibold text-center">Panier & Transport</th>
                    <th className="py-3 px-4 font-semibold">Tâche / Poste Assigné</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {siteWorkers.map((emp) => {
                    const row = pointageState[emp.id] || {
                      employeId: emp.id,
                      employeNom: `${emp.prenom} ${emp.nom}`,
                      matricule: emp.matricule,
                      corpsMetier: emp.corpsMetier,
                      statutPresence: 'present',
                      heuresNormales: 8,
                      heuresSupplementaires: 0,
                      primePanierAttribuee: true,
                      primeTransportAttribuee: true,
                      tacheAffectee: 'Travaux généraux de corps d’état',
                    };

                    const isPresent = row.statutPresence === 'present' || row.statutPresence === 'demi_journee';

                    return (
                      <tr
                        key={emp.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          !isPresent ? 'bg-slate-50/60 opacity-80' : ''
                        }`}
                      >
                        {/* Worker Identity */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                              {emp.prenom.charAt(0)}
                              {emp.nom.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{emp.prenom} {emp.nom}</div>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {emp.matricule} · {emp.corpsMetier.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Status Pills */}
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                            <button
                              type="button"
                              onClick={() =>
                                setPointageState((prev) => ({
                                  ...prev,
                                  [emp.id]: { ...row, statutPresence: 'present', heuresNormales: 8 },
                                }))
                              }
                              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                                row.statutPresence === 'present'
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Présent (8h)
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPointageState((prev) => ({
                                  ...prev,
                                  [emp.id]: { ...row, statutPresence: 'demi_journee', heuresNormales: 4 },
                                }))
                              }
                              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                                row.statutPresence === 'demi_journee'
                                  ? 'bg-amber-500 text-slate-900 shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              ½ Jour (4h)
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPointageState((prev) => ({
                                  ...prev,
                                  [emp.id]: {
                                    ...row,
                                    statutPresence: 'absent_injustifie',
                                    heuresNormales: 0,
                                    heuresSupplementaires: 0,
                                    primePanierAttribuee: false,
                                  },
                                }))
                              }
                              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                                row.statutPresence === 'absent_injustifie'
                                  ? 'bg-rose-600 text-white shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Absent
                            </button>
                          </div>
                        </td>

                        {/* Heures Normales */}
                        <td className="py-3 px-3 text-center">
                          <span className="font-mono font-bold text-slate-900">
                            {row.statutPresence === 'present' ? '8h' : row.statutPresence === 'demi_journee' ? '4h' : '0h'}
                          </span>
                        </td>

                        {/* Heures Supplémentaires Counter */}
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              disabled={!isPresent || (row.heuresSupplementaires || 0) <= 0}
                              onClick={() =>
                                setPointageState((prev) => ({
                                  ...prev,
                                  [emp.id]: {
                                    ...row,
                                    heuresSupplementaires: Math.max(0, (row.heuresSupplementaires || 0) - 1),
                                  },
                                }))
                              }
                              className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold text-xs flex items-center justify-center disabled:opacity-30 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-8 font-mono font-bold text-center text-amber-700">
                              +{row.heuresSupplementaires || 0}h
                            </span>
                            <button
                              type="button"
                              disabled={!isPresent}
                              onClick={() =>
                                setPointageState((prev) => ({
                                  ...prev,
                                  [emp.id]: {
                                    ...row,
                                    heuresSupplementaires: (row.heuresSupplementaires || 0) + 1,
                                  },
                                }))
                              }
                              className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 font-bold text-xs flex items-center justify-center disabled:opacity-30 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* Paniers & Transport Checkbox */}
                        <td className="py-3 px-3 text-center">
                          <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={row.primePanierAttribuee}
                              disabled={!isPresent}
                              onChange={(e) =>
                                setPointageState((prev) => ({
                                  ...prev,
                                  [emp.id]: { ...row, primePanierAttribuee: e.target.checked },
                                }))
                              }
                              className="rounded text-amber-500 focus:ring-amber-400"
                            />
                            <span>Panier (800 DA)</span>
                          </label>
                        </td>

                        {/* Tâche Affectée */}
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder="ex: Coulage dalle Bloc A..."
                            value={row.tacheAffectee || ''}
                            onChange={(e) =>
                              setPointageState((prev) => ({
                                ...prev,
                                [emp.id]: { ...row, tacheAffectee: e.target.value },
                              }))
                            }
                            className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900 bg-white"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Sticky Save Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 text-slate-600">
                <span>
                  Total Présents : <strong className="text-slate-900">{pointageMetrics.totalPresents}</strong>
                </span>
                <span>
                  Total Absents : <strong className="text-rose-700">{pointageMetrics.absents}</strong>
                </span>
                <span>
                  Volume d'heures : <strong className="text-amber-800">{pointageMetrics.totalHours}h</strong>
                </span>
                <span>
                  Paniers repas : <strong className="text-slate-900">{pointageMetrics.totalPaniers}</strong>
                </span>
              </div>

              <button
                onClick={handleSavePointage}
                className="px-4 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Enregistrer & Valider le Pointage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: TABLEAU AGILE / KANBAN ================= */}
      {activeTab === 'agile' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Tableau Agile des Travaux de Chantier (Daily Sprint Board)
                </h3>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase">
                  Agilité BTPH
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Organisez les activités du chantier de manière agile. Avancez les cartes de gauche à droite selon la progression réelle des équipes.
              </p>
            </div>

            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-2xs cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nouvelle Tâche Agile</span>
            </button>
          </div>

          {/* Kanban 4 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Column 1: Backlog / À Planifier */}
            <div className="bg-slate-100 rounded-xl p-3.5 space-y-3 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">À Planifier</h4>
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {currentJournal.tachesDuJour.filter((t) => t.statutAgile === 'a_faire').length}
                </span>
              </div>

              <div className="space-y-2.5 flex-1">
                {currentJournal.tachesDuJour
                  .filter((t) => t.statutAgile === 'a_faire')
                  .map((task) => (
                    <div
                      key={task.id}
                      className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-2 hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 leading-snug">{task.titre}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            task.priorite === 'urgente'
                              ? 'bg-rose-100 text-rose-800'
                              : task.priorite === 'haute'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {task.priorite}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 space-y-0.5">
                        <div>{task.corpsEtat}</div>
                        <div className="text-slate-700 font-medium">{task.localisation}</div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-mono">0%</span>
                        <button
                          type="button"
                          onClick={() => handleMoveTaskStage(task.id, 'a_faire', 'next')}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-slate-800 bg-amber-400 hover:bg-amber-300 rounded transition-colors cursor-pointer"
                        >
                          <span>Lancer</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Column 2: Daily Sprint / En cours */}
            <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3.5 space-y-3 flex flex-col">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950">Sprint en Cours</h4>
                </div>
                <span className="text-[11px] font-mono font-bold text-amber-900 bg-white px-2 py-0.5 rounded border border-amber-200">
                  {currentJournal.tachesDuJour.filter((t) => t.statutAgile === 'en_cours').length}
                </span>
              </div>

              <div className="space-y-2.5 flex-1">
                {currentJournal.tachesDuJour
                  .filter((t) => t.statutAgile === 'en_cours')
                  .map((task) => (
                    <div
                      key={task.id}
                      className="bg-white p-3 rounded-lg border border-amber-200 shadow-2xs space-y-2 hover:border-amber-400 transition-all"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 leading-snug">{task.titre}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 uppercase">
                          {task.priorite}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 space-y-0.5">
                        <div>{task.corpsEtat}</div>
                        <div className="text-slate-700 font-medium">{task.localisation}</div>
                      </div>

                      {/* Slider */}
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-600 mb-0.5">
                          <span>Avancement</span>
                          <span className="font-bold font-mono">{task.avancementEstimePourcent}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={task.avancementEstimePourcent}
                          onChange={(e) =>
                            updateTacheAgileChantier(selectedChantierId, selectedDate, task.id, {
                              avancementEstimePourcent: Number(e.target.value),
                            })
                          }
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveTaskStage(task.id, 'en_cours', 'prev')}
                          className="px-1.5 py-0.5 text-[9px] text-slate-500 hover:text-slate-800"
                        >
                          ← Retour
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveTaskStage(task.id, 'en_cours', 'next')}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors cursor-pointer"
                        >
                          <span>Visa CTC</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Column 3: Qualité & Visa CTC */}
            <div className="bg-blue-50/70 border border-blue-200/60 rounded-xl p-3.5 space-y-3 flex flex-col">
              <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-950">Contrôle & Visa CTC</h4>
                </div>
                <span className="text-[11px] font-mono font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200">
                  {currentJournal.tachesDuJour.filter((t) => t.statutAgile === 'attente_ctc').length}
                </span>
              </div>

              <div className="space-y-2.5 flex-1">
                {currentJournal.tachesDuJour
                  .filter((t) => t.statutAgile === 'attente_ctc')
                  .map((task) => (
                    <div
                      key={task.id}
                      className="bg-white p-3 rounded-lg border border-blue-200 shadow-2xs space-y-2 hover:border-blue-400 transition-all"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 leading-snug">{task.titre}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 uppercase">
                          Inspection
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 space-y-0.5">
                        <div>{task.corpsEtat}</div>
                        <div className="text-slate-700 font-medium">{task.localisation}</div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveTaskStage(task.id, 'attente_ctc', 'prev')}
                          className="px-1.5 py-0.5 text-[9px] text-slate-500 hover:text-slate-800"
                        >
                          ← Retour
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveTaskStage(task.id, 'attente_ctc', 'next')}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors cursor-pointer"
                        >
                          <span>Valider</span>
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Column 4: Terminé & Validé */}
            <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-xl p-3.5 space-y-3 flex flex-col">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950">Terminé & Validé</h4>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-200">
                  {currentJournal.tachesDuJour.filter((t) => t.statutAgile === 'termine').length}
                </span>
              </div>

              <div className="space-y-2.5 flex-1">
                {currentJournal.tachesDuJour
                  .filter((t) => t.statutAgile === 'termine')
                  .map((task) => (
                    <div
                      key={task.id}
                      className="bg-white p-3 rounded-lg border border-emerald-200 shadow-2xs space-y-2 hover:border-emerald-400 transition-all"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 leading-snug line-through text-slate-500">
                          {task.titre}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 uppercase">
                          100%
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 space-y-0.5">
                        <div>{task.corpsEtat}</div>
                        <div className="text-slate-700 font-medium">{task.localisation}</div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-emerald-700 font-semibold">
                        <span>✓ Conforme CTC</span>
                        <button
                          type="button"
                          onClick={() => handleMoveTaskStage(task.id, 'termine', 'prev')}
                          className="text-[9px] text-slate-400 hover:text-slate-700"
                        >
                          Rouvrir
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: PVS TECHNIQUES & VISAS CTC ================= */}
      {activeTab === 'pvs' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-2 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par titre, n° PV, n° rapport CTC..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedEtape}
                onChange={(e) => setSelectedEtape(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden"
              >
                <option value="all">Toutes les Étapes</option>
                <option value="terrassement">Terrassement</option>
                <option value="fondations">Fondations</option>
                <option value="gros_oeuvre">Gros Œuvre</option>
                <option value="maconnerie">Maçonnerie</option>
                <option value="second_oeuvre">Second Œuvre</option>
                <option value="finition">Finitions</option>
                <option value="vrd">VRD</option>
              </select>

              <select
                value={selectedVisa}
                onChange={(e) => setSelectedVisa(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden"
              >
                <option value="all">Tous Visas CTC</option>
                <option value="favorable">Favorable</option>
                <option value="avec_reserves">Avec Réserves</option>
                <option value="defavorable">Défavorable</option>
                <option value="en_attente">En Attente</option>
              </select>

              <button
                onClick={() => setIsPVModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau PV de Chantier</span>
              </button>
            </div>
          </div>

          {/* PVs List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPVs.map((pv) => (
              <div
                key={pv.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold">
                        {pv.numeroPV}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{pv.titre}</h4>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border shrink-0 ${
                        pv.visaCTC === 'favorable'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : pv.visaCTC === 'avec_reserves'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      Visa CTC: {pv.visaCTC.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 mb-3">{pv.observations}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="block text-[10px] uppercase font-semibold">Chantier :</span>
                      <strong className="text-slate-800">{pv.chantierNom}</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-semibold">Date d'inspection :</span>
                      <strong className="text-slate-800">{formatDateFR(pv.date)}</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-semibold">Avancement constaté :</span>
                      <strong className="text-amber-800 font-mono">{pv.pourcentageAvancementConstate}%</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-semibold">Rapport CTC n° :</span>
                      <strong className="text-slate-800 font-mono">{pv.numeroRapportCTC || 'En cours'}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {pv.statut === 'brouillon' ? (
                      <button
                        onClick={() => validerPVChantier(pv.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        Valider Officiellement
                      </button>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Validé & Conforme
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openPrintPVAvancement(pv)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Imprimer le PV officiel"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deletePVChantier(pv.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 5: JALONS VSP & APPELS DE FONDS ================= */}
      {activeTab === 'jalons' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Échéancier Légal VSP (Loi 11-04) & Déclenchement des Appels de Fonds
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                La loi algérienne relative à la promotion immobilière autorise le promoteur à émettre des avis d'appels de fonds
                auprès des acquéreurs dès l'achèvement validé de chaque phase technique.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { num: 1, lib: 'Signature du contrat notarié de réservation (20%)', condition: 'Dépôt du permis de construire', pct: 20 },
                { num: 2, lib: 'Achèvement des Fondations & Infrastructure (15%)', condition: 'Coulage radier et longrines avec visa CTC favorable', pct: 35 },
                { num: 3, lib: 'Achèvement du Gros Œuvre & Dalles (35%)', condition: 'Dernière dalle haute coulée + PV d\'avancement technique', pct: 70 },
                { num: 4, lib: 'Achèvement des Travaux de Finition & VRD (25%)', condition: 'Raccordements Sonelgaz/ADE & menuiserie achevée', pct: 95 },
                { num: 5, lib: 'Remise des clés & Certificat de Conformité (5%)', condition: 'Permis d\'habiter délivré par la DUAC', pct: 100 },
              ].map((j) => {
                const isPassed = activeChantier.avancementPourcentage >= j.pct;
                return (
                  <div
                    key={j.num}
                    className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      isPassed ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">
                        Tranche {j.num} ({j.pct}%)
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{j.lib}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">Condition : {j.condition}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      {isPassed ? (
                        <button
                          onClick={() => declencherAppelFondsPourChantier(selectedChantierId, j.num)}
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg shadow-2xs transition-colors cursor-pointer"
                        >
                          Émettre l'Appel de Fonds
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">En attente d'avancement</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: NOUVELLE TACHE AGILE ================= */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold">Créer une Tâche Agile de Chantier</h3>
              </div>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Intitulé de la Tâche <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Coulage dalle haute 4ème étage..."
                  value={taskForm.titre}
                  onChange={(e) => setTaskForm({ ...taskForm, titre: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Corps d'état BTPH</label>
                  <select
                    value={taskForm.corpsEtat}
                    onChange={(e) => setTaskForm({ ...taskForm, corpsEtat: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Gros Œuvre / Béton Armé">Gros Œuvre / Béton Armé</option>
                    <option value="Ferraillage & Armatures">Ferraillage & Armatures</option>
                    <option value="Coffrage & Étaiement">Coffrage & Étaiement</option>
                    <option value="Maçonnerie Briques">Maçonnerie Briques</option>
                    <option value="Électricité & Fluides">Électricité & Fluides</option>
                    <option value="Étanchéité & Isolation">Étanchéité & Isolation</option>
                    <option value="Plâtrerie & Revêtements">Plâtrerie & Revêtements</option>
                    <option value="VRD & Assainissement">VRD & Assainissement</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Localisation précise</label>
                  <input
                    type="text"
                    placeholder="ex: Bloc B - Niveau R+3"
                    value={taskForm.localisation}
                    onChange={(e) => setTaskForm({ ...taskForm, localisation: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Statut Initial</label>
                  <select
                    value={taskForm.statutAgile}
                    onChange={(e) => setTaskForm({ ...taskForm, statutAgile: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="a_faire">À Planifier (Backlog)</option>
                    <option value="en_cours">En Cours Aujourd'hui</option>
                    <option value="attente_ctc">Contrôle & Visa CTC</option>
                    <option value="termine">Terminé & Validé</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Niveau d'Urgence</label>
                  <select
                    value={taskForm.priorite}
                    onChange={(e) => setTaskForm({ ...taskForm, priorite: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="normale">Priorité Normale</option>
                    <option value="haute">Priorité Haute</option>
                    <option value="urgente">Urgence Critique</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Remarques ou Contraintes Techniques</label>
                <textarea
                  rows={2}
                  placeholder="ex: Vérifier le calage des armatures avant le passage du contrôleur CTC..."
                  value={taskForm.observationsTechniques}
                  onChange={(e) => setTaskForm({ ...taskForm, observationsTechniques: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-slate-900 bg-amber-400 font-bold rounded-lg shadow-sm"
                >
                  Créer la Tâche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: NOUVEAU PV DE CHANTIER ================= */}
      {isPVModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold">Rédiger un Procès-Verbal de Chantier & Visa CTC</h3>
              </div>
              <button onClick={() => setIsPVModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPV} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Intitulé du Procès-Verbal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Coulage Dalle Haute 4ème Étage & Contrôle Armatures..."
                  value={formTitre}
                  onChange={(e) => setFormTitre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date du Constat</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Avancement Constaté (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={formPourcentage}
                    onChange={(e) => setFormPourcentage(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Visa CTC</label>
                  <select
                    value={formVisaCTC}
                    onChange={(e) => setFormVisaCTC(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="favorable">Favorable (Coulage autorisé)</option>
                    <option value="avec_reserves">Favorable avec Réserves</option>
                    <option value="defavorable">Défavorable (Arrêt requis)</option>
                    <option value="en_attente">En Attente de Visite</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">N° Rapport CTC</label>
                  <input
                    type="text"
                    placeholder="ex: CTC-ALG-2026-0812"
                    value={formRapportCTC}
                    onChange={(e) => setFormRapportCTC(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observations Techniques</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Détails des contrôles (ferraillage, calage, vibration, propreté des coffrages)..."
                  value={formObservations}
                  onChange={(e) => setFormObservations(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 border-t border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={formDeclencheAppel}
                    onChange={(e) => setFormDeclencheAppel(e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  <span>Ce PV autorise le lancement d'un Appel de Fonds VSP</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPVModalOpen(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-slate-900 bg-amber-400 font-bold rounded-lg shadow-sm"
                >
                  Créer le PV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
