import React, { useState, useEffect } from 'react';
import { STATUS, Step } from 'react-joyride';
import { Joyride } from 'react-joyride';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { Play } from 'lucide-react';

export const WelcomeTour: React.FC = () => {
  const { t } = useTranslation();
  const [run, setRun] = useState(false);

  useEffect(() => {
    const handleToggleTour = () => setRun((prev) => !prev);
    window.addEventListener('toggle-welcome-tour', handleToggleTour);

    const hasSeenTour = localStorage.getItem('batipromote_dz_tour_seen');
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        setRun(true);
      }, 1200);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('toggle-welcome-tour', handleToggleTour);
      };
    }
    return () => window.removeEventListener('toggle-welcome-tour', handleToggleTour);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('batipromote_dz_tour_seen', 'true');
    }
  };

  const steps: Step[] = [
    {
      target: 'body',
      placement: 'center',
      title: t('tourWelcomeTitle') || 'Bienvenue sur BatiPromote DZ',
      content: t('tourWelcomeContent') || 'Votre solution ERP complète pour la gestion immobilière et multi-chantiers en Algérie (Loi 11-04).',
    },
    {
      target: 'select',
      content: t('tourChantierContent') || 'Sélectionnez et filtrez facilement vos projets en cours.',
      title: t('tourChantierTitle') || 'Filtre & Gestion des Chantiers',
    },
    {
      target: 'aside',
      content: t('tourCaissesContent') || 'Accédez à l’ensemble des modules de trésorerie, paie, stocks et VSP.',
      title: t('tourHelpTitle') || 'Navigation Principale',
    },
    {
      target: 'aside nav button:nth-child(8)',
      content: t('tourCaissesContent') || 'Suivez en temps réel les fonds de roulement en Dinar Algérien (DA).',
      title: t('tourCaissesTitle') || 'Caisses & Trésorerie',
    },
    {
      target: 'aside nav button:nth-child(11)',
      content: t('tourVspContent') || 'Gérez les acquéreurs sur plan, l’échéancier et les appels de fonds.',
      title: t('tourVspTitle') || 'Clients VSP (Loi 11-04)',
    },
  ];

  return (
    <>
      <Joyride
        {...({
          steps,
          run,
          callback: handleJoyrideCallback,
          locale: {
            back: 'Précédent',
            close: 'Fermer',
            last: 'Terminer',
            next: 'Suivant',
            skip: 'Passer',
          }
        } as any)}
      />

      <button
        onClick={() => setRun(true)}
        className="fixed bottom-6 start-6 z-45 px-3.5 py-2 bg-slate-900 dark:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-700 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold transition-all hover:scale-105 no-print cursor-pointer"
        title="Lancer le guide interactif"
      >
        <Play className="w-3.5 h-3.5 fill-amber-400" />
        <span className="hidden sm:inline">Guide Interactif</span>
      </button>
    </>
  );
};
