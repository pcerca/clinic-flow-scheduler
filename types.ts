
export enum DurationType {
  DATE_RANGE = 'DATE_RANGE',
  SESSION_COUNT = 'SESSION_COUNT',
}

export enum LocationType {
  CABINET = 'CABINET',
  HOME = 'HOME',
}

export enum SessionStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED', // Session took place
  ABSENT = 'ABSENT',       // Patient cancelled/missed
  CANCELLED = 'CANCELLED'  // Removed entirely
}

export interface Session {
  id: string;
  patientId: string;
  date: string; // ISO Date String YYYY-MM-DD
  time: string; // HH:mm
  status: SessionStatus;
  isLocked: boolean; // "Registered on PC" - blocks further edits
  notes?: string;
}

export interface ScheduleConfig {
  day: number; // 0-6
  time: string; // HH:mm
}

export interface Patient {
  id: string;
  name: string;
  nomenclature: string;
  location: LocationType;
  address?: string; // For domicile patients
  coordinates?: {
    lat: number;
    lng: number;
  };
  startConfig: {
    startDate: string;
    schedule: ScheduleConfig[];
    durationType: DurationType;
    endDate?: string;       // For DATE_RANGE
    totalSessions?: number; // For SESSION_COUNT
  };
  sessions: Session[];
}

export interface DayStats {
  date: string;
  totalScheduled: number;
  totalCompleted: number;
  totalLocked: number;
}

export type Language = 'en' | 'fr';
