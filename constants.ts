
import { Language } from './types';

export const DAYS_OF_WEEK = [
  { id: 0, label: 'Sun', full: 'Sunday' },
  { id: 1, label: 'Mon', full: 'Monday' },
  { id: 2, label: 'Tue', full: 'Tuesday' },
  { id: 3, label: 'Wed', full: 'Wednesday' },
  { id: 4, label: 'Thu', full: 'Thursday' },
  { id: 5, label: 'Fri', full: 'Friday' },
  { id: 6, label: 'Sat', full: 'Saturday' },
];

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // General
    appName: "ClinicFlow",
    subtitle: "Medical Scheduler v2.0",
    newPatient: "New Patient",
    syncHolidays: "Sync Holidays",
    searchPlaceholder: "Search patients...",
    noPatients: "No patients found",
    endingSoon: "Ending Soon",
    progress: "Progress",
    
    // Calendar Views
    month: "Month",
    week: "Week",
    day: "Day",
    patient: "Patient",
    
    // Stats / Headers
    overview: "Overview",
    total: "Total",
    done: "Done",
    validated: "Validated",
    scheduled: "Scheduled",
    cancelled: "Cancelled",
    absent: "Absent",
    completed: "Completed",
    
    // Actions
    save: "Save Changes",
    create: "Create Schedule",
    update: "Update Schedule",
    cancel: "Cancel",
    close: "Close",
    edit: "Edit",
    delete: "Delete",
    confirm: "Confirm",
    restore: "Restore",
    validate: "Validate",
    
    // Form
    patientName: "Patient Name",
    nomenclature: "Nomenclature",
    location: "Location",
    cabinet: "Cabinet",
    domicile: "Domicile",
    startDate: "Start Date",
    weeklySchedule: "Weekly Schedule",
    durationMode: "Duration Mode",
    byCount: "By Count",
    byDateRange: "By Date Range",
    totalSessions: "Total Sessions",
    endDate: "End Date",
    extendPrescription: "Extend Prescription",
    months: "Months",
    coreLocked: "Core details locked. Only schedule adjustments allowed.",
    selectDay: "Please select at least one day of the week.",
    zeroSessions: "Configuration resulted in 0 sessions. Please check dates.",
    
    // Patient View
    unvalidatedSessions: "Unvalidated Sessions",
    requiresValidation: "Requires PC Validation",
    allClear: "All Clear!",
    allClearMsg: "All sessions for {name} are validated.",
    
    // Messages
    syncConfirm: "Sync with Google Calendar Holidays?\n\nThis will mark holiday sessions as absent and reschedule them.",
    scheduleChanged: "Schedule configuration changed. Update future sessions?",
    
    // Day Detail
    noSessions: "No sessions scheduled",
    newDate: "New Date",
    newTime: "New Time",
    note: "Note",
    noNotes: "No notes",
    confirmSession: "Confirm Session",
    validateOnPC: "Validate on PC"
  },
  fr: {
    // General
    appName: "ClinicFlow",
    subtitle: "Planificateur Médical v2.0",
    newPatient: "Nouveau Patient",
    syncHolidays: "Sync Jours Fériés",
    searchPlaceholder: "Rechercher...",
    noPatients: "Aucun patient",
    endingSoon: "Bientôt Terminé",
    progress: "Progression",
    
    // Calendar Views
    month: "Mois",
    week: "Semaine",
    day: "Jour",
    patient: "Patient",
    
    // Stats / Headers
    overview: "Aperçu",
    total: "Total",
    done: "Fait",
    validated: "Validé",
    scheduled: "Prévu",
    cancelled: "Annulé",
    absent: "Absent",
    completed: "Terminé",
    
    // Actions
    save: "Enregistrer",
    create: "Créer Planning",
    update: "Mettre à jour",
    cancel: "Annuler",
    close: "Fermer",
    edit: "Modifier",
    delete: "Supprimer",
    confirm: "Confirmer",
    restore: "Restaurer",
    validate: "Valider",
    
    // Form
    patientName: "Nom du Patient",
    nomenclature: "Nomenclature",
    location: "Lieu",
    cabinet: "Cabinet",
    domicile: "Domicile",
    startDate: "Date de Début",
    weeklySchedule: "Planning Hebdo",
    durationMode: "Mode de Durée",
    byCount: "Par Nombre",
    byDateRange: "Par Période",
    totalSessions: "Nb Séances",
    endDate: "Date de Fin",
    extendPrescription: "Renouveler",
    months: "Mois",
    coreLocked: "Détails verrouillés. Seul le planning est modifiable.",
    selectDay: "Veuillez sélectionner au moins un jour.",
    zeroSessions: "La configuration donne 0 séances. Vérifiez les dates.",
    
    // Patient View
    unvalidatedSessions: "Séances Non Validées",
    requiresValidation: "Validation Requise",
    allClear: "Tout est bon !",
    allClearMsg: "Toutes les séances de {name} sont validées.",
    
    // Messages
    syncConfirm: "Synchroniser avec les jours fériés ?\n\nCela marquera les séances comme absentes et les replanifiera.",
    scheduleChanged: "Configuration modifiée. Mettre à jour les séances futures ?",
    
    // Day Detail
    noSessions: "Aucune séance prévue",
    newDate: "Nouvelle Date",
    newTime: "Nouvelle Heure",
    note: "Note",
    noNotes: "Pas de notes",
    confirmSession: "Confirmer la séance",
    validateOnPC: "Valider sur PC"
  }
};
