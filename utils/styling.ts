import { Session, SessionStatus } from '../types';

export const getSessionStyle = (session: Session, date: string) => {
    // 1. Canceled/Absent -> Red
    if (session.status === SessionStatus.ABSENT) {
        return {
            container: 'bg-red-50 border-red-200 opacity-75 grayscale',
            text: 'text-slate-500 line-through',
            badge: 'bg-red-100 text-red-700',
            icon: 'text-red-400'
        };
    }

    // 2. Confirmed/Locked -> Light Green
    if (session.status === SessionStatus.COMPLETED || session.isLocked) {
        return {
            container: 'bg-emerald-50 border-emerald-200 shadow-sm',
            text: 'text-emerald-900',
            badge: 'bg-emerald-100 text-emerald-700',
            icon: 'text-emerald-600'
        };
    }

    // 3. Scheduled (Time-based logic)
    const now = new Date();
    const sessionDateTime = new Date(`${date}T${session.time}`);

    // Check if valid date
    if (isNaN(sessionDateTime.getTime())) {
        return {
            container: 'bg-white border-transparent shadow-card hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/20',
            text: 'text-slate-800',
            badge: 'bg-white border border-primary/20 text-primaryDark',
            icon: 'text-slate-400'
        };
    }

    const diffInMinutes = (sessionDateTime.getTime() - now.getTime()) / 1000 / 60;

    if (diffInMinutes < -15) {
        // Past (> 15 mins ago) -> Light Blue
        return {
            container: 'bg-blue-50 border-blue-200',
            text: 'text-blue-900',
            badge: 'bg-blue-100 text-blue-700',
            icon: 'text-blue-500'
        };
    } else if (diffInMinutes <= 45) {
        // Current (within last 15 mins or next 45 mins) -> Dark Blue
        return {
            container: 'bg-blue-600 border-blue-700 shadow-md text-white',
            text: 'text-white',
            badge: 'bg-blue-500 text-white border border-blue-400',
            icon: 'text-blue-200'
        };
    } else {
        // Future -> White (Default)
        return {
            container: 'bg-white border-transparent shadow-card hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/20',
            text: 'text-slate-800',
            badge: 'bg-white border border-primary/20 text-primaryDark',
            icon: 'text-slate-400'
        };
    }
};
