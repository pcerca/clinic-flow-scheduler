
import { Session, SessionStatus, Patient, DurationType, ScheduleConfig, Language } from './types';

export const generateId = (): string => Math.random().toString(36).substr(2, 9);

export const formatDateISO = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getLocale = (lang: Language) => lang === 'fr' ? 'fr-FR' : 'en-US';

export const getDayLabel = (dayId: number, lang: Language) => {
  // Jan 1, 2023 was a Sunday
  const date = new Date(2023, 0, 1 + dayId); 
  return date.toLocaleDateString(getLocale(lang), { weekday: 'short' });
};

export const getMonthLabel = (monthIndex: number, lang: Language) => {
  const date = new Date(2023, monthIndex, 1);
  return date.toLocaleDateString(getLocale(lang), { month: 'long' });
};

export const getDaysInMonth = (year: number, month: number): Date[] => {
  const date = new Date(year, month, 1);
  const days: Date[] = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

export const getDaysInWeek = (current: Date): Date[] => {
  const start = new Date(current);
  start.setDate(start.getDate() - start.getDay()); // Set to Sunday
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(new Date(start));
    start.setDate(start.getDate() + 1);
  }
  return days;
};

export const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

export const fetchFrenchHolidays = async (year: number): Promise<Record<string, string>> => {
  try {
    const response = await fetch(`https://calendrier.api.gouv.fr/jours-feries/metropole/${year}.json`);
    if (!response.ok) throw new Error("Failed to fetch");
    return await response.json();
  } catch (e) {
    console.error("Failed to fetch holidays", e);
    return {};
  }
};

// Logic to generate sessions based on configuration
export const generateInitialSessions = (
  patientId: string,
  startConfig: Patient['startConfig'],
  existingSessionsCount = 0
): Session[] => {
  const sessions: Session[] = [];
  const { startDate, schedule, durationType, endDate, totalSessions } = startConfig;
  
  let current = new Date(startDate);
  let count = existingSessionsCount;
  
  // Safety break to prevent infinite loops
  const MAX_SESSIONS = 500; 
  // Safety loop counter
  let loopCount = 0;

  // Helper to find time for current day
  const getTimeForDay = (d: Date): string | undefined => {
    const dayId = d.getDay();
    return schedule.find(s => s.day === dayId)?.time;
  };

  if (durationType === DurationType.DATE_RANGE && endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    while (current <= end && loopCount < MAX_SESSIONS) {
      const time = getTimeForDay(current);
      if (time) {
        sessions.push({
          id: generateId(),
          patientId,
          date: formatDateISO(current),
          time: time,
          status: SessionStatus.SCHEDULED,
          isLocked: false,
        });
        count++;
      }
      current.setDate(current.getDate() + 1);
      loopCount++;
    }
  } else if (durationType === DurationType.SESSION_COUNT && totalSessions) {
    while (count < totalSessions && loopCount < MAX_SESSIONS) {
      const time = getTimeForDay(current);
      if (time) {
        sessions.push({
          id: generateId(),
          patientId,
          date: formatDateISO(current),
          time: time,
          status: SessionStatus.SCHEDULED,
          isLocked: false,
        });
        count++;
      }
      current.setDate(current.getDate() + 1);
      loopCount++; 
    }
  }

  return sessions;
};

export const addMakeupSession = (patient: Patient): Session => {
  // Get the last session from the list, assuming chronological order or just appending to the end.
  const lastSession = patient.sessions[patient.sessions.length - 1];
  let startSearchDate = new Date();
  
  if (lastSession) {
    startSearchDate = new Date(lastSession.date);
    startSearchDate.setDate(startSearchDate.getDate() + 1); // Start searching from next day
  }

  let nextDate = new Date(startSearchDate);
  let safety = 0;
  
  while (safety < 365) {
    const scheduleItem = patient.startConfig.schedule.find(s => s.day === nextDate.getDay());
    if (scheduleItem) {
      return {
        id: generateId(),
        patientId: patient.id,
        date: formatDateISO(nextDate),
        time: scheduleItem.time,
        status: SessionStatus.SCHEDULED,
        isLocked: false,
        notes: 'Rescheduled (Makeup)'
      };
    }
    nextDate.setDate(nextDate.getDate() + 1);
    safety++;
  }
  
  // Fallback
  return {
     id: generateId(),
     patientId: patient.id,
     date: formatDateISO(new Date()),
     time: '12:00',
     status: SessionStatus.SCHEDULED,
     isLocked: false
  };
};

export const regenerateFutureSessions = (patient: Patient, newStartConfig: Patient['startConfig']): Session[] => {
    // Keep past sessions (Completed, Absent, Locked) or sessions today/past
    const today = new Date();
    const todayISO = formatDateISO(today);

    const pastSessions = patient.sessions.filter(s => {
        // Use string comparison for date stability (lexicographical comparison works for ISO YYYY-MM-DD)
        // Keep if NOT scheduled (interacted with) OR if date is <= today
        return s.status !== SessionStatus.SCHEDULED || s.date <= todayISO;
    });

    // Calculate how many "valid" sessions have been consumed towards the limit
    // Absent sessions do NOT count towards the limit for SESSION_COUNT type
    const consumedSessions = pastSessions.filter(s => 
        s.status === SessionStatus.COMPLETED || s.isLocked
    ).length;

    // Start generating from tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Ensure we don't start before the config's start date if it's in the future
    // But if config start date is past, we must start from tomorrow to preserve history
    const configStartDate = new Date(newStartConfig.startDate);
    const generationStartDate = configStartDate > tomorrow ? configStartDate : tomorrow;

    const effectiveConfig = {
        ...newStartConfig,
        startDate: formatDateISO(generationStartDate)
    };

    const newSessions = generateInitialSessions(patient.id, effectiveConfig, consumedSessions);

    return [...pastSessions, ...newSessions].sort((a, b) => {
        const dateA = new Date(a.date + 'T' + a.time);
        const dateB = new Date(b.date + 'T' + b.time);
        return dateA.getTime() - dateB.getTime();
    });
};
