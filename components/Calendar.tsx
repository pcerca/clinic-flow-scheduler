
import React, { useState, useEffect } from 'react';
import { getDaysInMonth, getDaysInWeek, getFirstDayOfMonth, formatDateISO, getDayLabel, getMonthLabel, getLocale } from '../utils';
import { DAYS_OF_WEEK, TRANSLATIONS } from '../constants';
import { Patient, SessionStatus, Session, Language } from '../types';
import { ChevronLeft, ChevronRight, CalendarDays, CalendarRange, LayoutList, Building, Home, User, CheckCircle2, ChevronDown } from 'lucide-react';
import { DayDetail } from './DayDetail';
import { getSessionStyle } from '../utils/styling';

interface CalendarProps {
    currentDate: Date;
    patients: Patient[];
    holidays: Record<string, string>;
    onDateChange: (date: Date) => void;
    onDayClick: (dateISO: string) => void;
    viewMode: 'month' | 'week' | 'day' | 'patient';
    onViewModeChange: (mode: 'month' | 'week' | 'day' | 'patient') => void;
    onUpdateSession: (patientId: string, sessionId: string, updates: Partial<Session>) => void;
    lang: Language;
    onLangChange: (lang: Language) => void;
}

export const Calendar: React.FC<CalendarProps> = ({
    currentDate,
    patients,
    holidays,
    onDateChange,
    onDayClick,
    viewMode,
    onViewModeChange,
    onUpdateSession,
    lang,
    onLangChange
}) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const t = TRANSLATIONS[lang];

    useEffect(() => {
        if (viewMode === 'patient' && !selectedPatientId && patients.length > 0) {
            setSelectedPatientId(patients[0].id);
        }
    }, [viewMode, patients, selectedPatientId]);

    const handlePrev = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') {
            newDate.setMonth(month - 1);
            newDate.setDate(1);
        } else if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() - 7);
        } else if (viewMode === 'day') {
            newDate.setDate(newDate.getDate() - 1);
        }
        onDateChange(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') {
            newDate.setMonth(month + 1);
            newDate.setDate(1);
        } else if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() + 7);
        } else if (viewMode === 'day') {
            newDate.setDate(newDate.getDate() + 1);
        }
        onDateChange(newDate);
    };

    const getDaySessions = (dateISO: string) => {
        const sessions: { status: SessionStatus, isLocked: boolean, patient: Patient, session: Session }[] = [];
        patients.forEach(p => {
            const session = p.sessions.find(s => s.date === dateISO && s.status !== SessionStatus.CANCELLED);
            if (session) {
                sessions.push({
                    status: session.status,
                    isLocked: session.isLocked,
                    patient: p,
                    session
                });
            }
        });
        return sessions.sort((a, b) => (a.session.time || '00:00').localeCompare(b.session.time || '00:00'));
    };

    const renderMonthView = () => {
        const days = getDaysInMonth(year, month);
        const firstDayIndex = getFirstDayOfMonth(year, month);

        const blanks = Array(firstDayIndex).fill(null);

        return (
            <div className="flex flex-col h-full">
                <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 shrink-0">
                    {DAYS_OF_WEEK.map(day => (
                        <div key={day.id} className="py-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            {getDayLabel(day.id, lang)}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 auto-rows-fr flex-1 bg-slate-100 gap-px border-slate-200 overflow-y-auto touch-pan-y p-1 rounded-b-2xl">
                    {blanks.map((_, i) => (
                        <div key={`blank-${i}`} className="bg-slate-50/50 min-h-[80px] rounded-lg"></div>
                    ))}

                    {days.map(day => {
                        const dateISO = formatDateISO(day);
                        const isToday = dateISO === formatDateISO(new Date());
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                        const sessions = getDaySessions(dateISO);
                        const count = sessions.length;
                        const completed = sessions.filter(s => s.status === SessionStatus.COMPLETED || s.isLocked).length;
                        const holidayName = holidays[dateISO];

                        return (
                            <div
                                key={dateISO}
                                onClick={() => onDayClick(dateISO)}
                                className={`min-h-[80px] p-2 relative group hover:bg-primary/5 hover:z-10 hover:shadow-md transition-all cursor-pointer rounded-lg m-[1px] ${isToday ? 'bg-white ring-2 ring-primary ring-inset z-10' :
                                    isWeekend ? 'bg-weekend-pattern' : 'bg-white'
                                    } ${holidayName ? 'bg-amber-50/30' : ''}`}
                            >
                                <div className="flex justify-between items-start">
                                    <span className={`
                        flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold transition-colors
                        ${isToday ? 'bg-primary text-white shadow-lg shadow-primary/30' :
                                            isWeekend ? 'text-slate-400' : 'text-slate-700 group-hover:bg-white group-hover:text-primary'}
                        `}>
                                        {day.getDate()}
                                    </span>

                                    {count > 0 && (
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="w-full max-w-[40px] h-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${completed === count ? 'bg-emerald-400' : 'bg-primary'}`}
                                                    style={{ width: `${(completed / count) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {holidayName && (
                                    <div className="mt-1">
                                        <span className="text-[9px] text-amber-600 font-bold bg-amber-100 px-1.5 py-0.5 rounded truncate block w-full border border-amber-200/50" title={holidayName}>
                                            {holidayName}
                                        </span>
                                    </div>
                                )}

                                <div className="mt-2">
                                    {count > 0 ? (
                                        <div className="flex flex-wrap gap-1 content-start">
                                            {sessions.slice(0, 8).map((s, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${s.status === SessionStatus.ABSENT ? 'bg-red-400' :
                                                        s.isLocked ? 'bg-violet-400' :
                                                            s.status === SessionStatus.COMPLETED ? 'bg-emerald-400' : 'bg-primary/60'
                                                        }`}
                                                />
                                            ))}
                                            {count > 8 && <span className="text-[9px] text-slate-300 leading-none">+</span>}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderWeekView = () => {
        const days = getDaysInWeek(currentDate);

        return (
            <div className="flex flex-col h-full">
                <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 shrink-0">
                    {days.map((day, i) => {
                        const isToday = formatDateISO(day) === formatDateISO(new Date());
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                        return (
                            <div key={i} className={`py-3 text-center ${isToday ? 'bg-primary/5 border-b-2 border-primary' : isWeekend ? 'bg-weekend-pattern' : ''}`}>
                                <div className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${isToday ? 'text-primary' : 'text-slate-400'}`}>
                                    {getDayLabel(day.getDay(), lang)}
                                </div>
                                <div className={`text-lg font-bold ${isToday ? 'text-primary' : 'text-slate-700'}`}>{day.getDate()}</div>
                            </div>
                        );
                    })}
                </div>
                <div className="grid grid-cols-7 flex-1 bg-slate-50 divide-x divide-slate-200 overflow-y-auto p-2 gap-2">
                    {days.map(day => {
                        const dateISO = formatDateISO(day);
                        const sessions = getDaySessions(dateISO);
                        const holidayName = holidays[dateISO];
                        const isToday = dateISO === formatDateISO(new Date());
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                        const sessionsByTime = sessions.reduce((acc, item) => {
                            const t = item.session.time;
                            if (!acc[t]) acc[t] = [];
                            acc[t].push(item);
                            return acc;
                        }, {} as Record<string, typeof sessions>);

                        const sortedTimes = Object.keys(sessionsByTime).sort();

                        return (
                            <div key={dateISO} onClick={() => onDayClick(dateISO)} className={`flex flex-col rounded-xl transition-all cursor-pointer min-h-[200px] ${isToday ? 'bg-white ring-1 ring-primary/20 shadow-lg shadow-primary/5' :
                                isWeekend ? 'bg-weekend-pattern' : 'hover:bg-white hover:shadow-md'
                                }`}>
                                {holidayName && (
                                    <div className="p-1 text-center">
                                        <span className="text-[9px] text-amber-600 font-bold bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full block truncate">
                                            {holidayName}
                                        </span>
                                    </div>
                                )}
                                <div className="flex-1 p-1.5 space-y-2">
                                    {sortedTimes.map(time => (
                                        <div key={time} className="flex flex-wrap gap-1">
                                            {sessionsByTime[time].map(({ session, patient, status, isLocked }) => {
                                                const styles = getSessionStyle(session, dateISO);
                                                return (
                                                    <div key={session.id} className={`flex-1 min-w-[45%] p-2 rounded-lg border text-xs transition-all hover:scale-105 ${styles.container}`}>
                                                        <div className="font-bold flex justify-between items-center mb-0.5">
                                                            <span className={styles.text}>{session.time}</span>
                                                            {patient.location === 'HOME' ? <Home className={`w-2.5 h-2.5 opacity-40 shrink-0 ${styles.text}`} /> : <Building className={`w-2.5 h-2.5 opacity-40 shrink-0 ${styles.text}`} />}
                                                        </div>
                                                        <div className={`truncate font-medium ${styles.text}`}>{patient.name}</div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    };

    const renderDayView = () => {
        return (
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-3xl mx-auto min-h-full animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-4 mb-6">
                        <h2 className="text-3xl font-bold text-slate-800">
                            {new Date(currentDate).toLocaleDateString(getLocale(lang), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </h2>
                        {holidays[formatDateISO(currentDate)] && (
                            <span className="text-sm font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full shadow-sm">
                                {holidays[formatDateISO(currentDate)]}
                            </span>
                        )}
                    </div>
                    <DayDetail
                        date={formatDateISO(currentDate)}
                        patients={patients}
                        onUpdateSession={onUpdateSession}
                        lang={lang}
                    />
                </div>
            </div>
        )
    };

    const renderPatientView = () => {
        const patient = patients.find(p => p.id === selectedPatientId);
        if (!patient && patients.length > 0) return null;
        if (!patient) return <div className="p-12 text-center text-slate-400">{t.noPatients}</div>;

        const unvalidated = patient.sessions
            .filter(s => !s.isLocked && s.status !== SessionStatus.CANCELLED)
            .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());

        return (
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-card border border-slate-100 overflow-hidden flex flex-col h-full max-h-[80vh]">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/80 backdrop-blur flex justify-between items-center sticky top-0 z-10">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">{t.unvalidatedSessions} ({unvalidated.length})</h3>
                            <div className="text-xs text-slate-500 mt-0.5">
                                {t.requiresValidation}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs font-medium text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-violet-500 mr-1.5"></span> {t.validated}</span>
                            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-primary mr-1.5"></span> {t.scheduled}</span>
                        </div>
                    </div>
                    <div className="divide-y divide-slate-50 overflow-y-auto flex-1 bg-white">
                        {unvalidated.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                    <CheckCircle2 className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">{t.allClear}</h3>
                                <p className="text-slate-400 mt-2">{t.allClearMsg.replace('{name}', patient.name)}</p>
                            </div>
                        ) : (
                            unvalidated.map(session => {
                                const d = new Date(session.date);
                                const styles = getSessionStyle(session, session.date);
                                return (
                                    <div key={session.id} className={`p-4 hover:bg-slate-50 flex items-center justify-between group transition-all duration-200 border-l-4 border-transparent hover:border-primary ${styles.container}`}>
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col items-center w-16 shrink-0 bg-slate-50 rounded-xl p-2 border border-slate-100">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    {d.toLocaleDateString(getLocale(lang), { weekday: 'short' })}
                                                </span>
                                                <span className="text-2xl font-bold text-slate-800 leading-none my-0.5">
                                                    {d.getDate()}
                                                </span>
                                                <span className="text-[10px] font-bold text-primary uppercase">
                                                    {d.toLocaleDateString(getLocale(lang), { month: 'short' })}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className={`font-mono font-bold px-2.5 py-0.5 rounded-lg text-xs ${styles.badge}`}>
                                                        {session.time}
                                                    </span>
                                                    {session.status === SessionStatus.ABSENT && (
                                                        <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-lg font-bold border border-red-100">{t.absent}</span>
                                                    )}
                                                    {session.status === SessionStatus.COMPLETED && (
                                                        <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg font-bold border border-emerald-100">{t.completed}</span>
                                                    )}
                                                </div>
                                                <div className="text-sm">
                                                    {session.notes ? <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-xs font-medium">{session.notes}</span> : <span className="text-slate-300 text-xs italic">{t.noNotes}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center pr-2">
                                            <button
                                                onClick={() => onUpdateSession(patient.id, session.id, { isLocked: true, status: SessionStatus.COMPLETED })}
                                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 shadow-sm text-sm font-bold rounded-xl text-slate-600 hover:bg-violet-500 hover:text-white hover:border-violet-500 hover:shadow-lg hover:shadow-violet-500/30 transition-all transform active:scale-95"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span className="hidden sm:inline">{t.validate}</span>
                                            </button>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const getTitle = () => {
        if (viewMode === 'patient') return t.patientOverview;
        if (viewMode === 'day') return t.dailySchedule;
        if (viewMode === 'week') {
            const start = getDaysInWeek(currentDate)[0];
            const end = getDaysInWeek(currentDate)[6];
            const startMonth = getMonthLabel(start.getMonth(), lang);
            const endMonth = getMonthLabel(end.getMonth(), lang);
            if (startMonth === endMonth) {
                return `${startMonth} ${year}`;
            }
            return `${startMonth.substring(0, 3)} - ${endMonth.substring(0, 3)} ${year}`;
        }
        return `${getMonthLabel(month, lang)} ${year}`;
    };

    return (
        <div className="bg-white rounded-3xl shadow-card border border-slate-100 overflow-hidden flex flex-col h-full">
            <div className="flex flex-col gap-4 md:flex-row items-center justify-between p-5 md:p-6 border-b border-slate-100 shrink-0 bg-white z-20">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3 whitespace-nowrap">
                        {getTitle()}
                    </h2>
                    {viewMode === 'patient' && (
                        <div className="relative">
                            <select
                                className="appearance-none pl-4 pr-10 py-2 rounded-xl bg-slate-50 border-transparent hover:bg-slate-100 focus:border-primary focus:ring-0 text-sm font-bold text-slate-700 cursor-pointer transition-colors"
                                value={selectedPatientId}
                                onChange={(e) => setSelectedPatientId(e.target.value)}
                            >
                                {patients.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                <User className="w-4 h-4" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end overflow-x-auto no-scrollbar">
                    {/* View Switcher */}
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                        <button
                            onClick={() => onViewModeChange('month')}
                            className={`flex items-center px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${viewMode === 'month' ? 'bg-white text-primary shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                        >
                            <CalendarDays className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">{t.month}</span>
                        </button>
                        <button
                            onClick={() => onViewModeChange('week')}
                            className={`flex items-center px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${viewMode === 'week' ? 'bg-white text-primary shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                        >
                            <CalendarRange className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">{t.week}</span>
                        </button>
                        <button
                            onClick={() => onViewModeChange('day')}
                            className={`flex items-center px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${viewMode === 'day' ? 'bg-white text-primary shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                        >
                            <LayoutList className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">{t.day}</span>
                        </button>
                        <button
                            onClick={() => onViewModeChange('patient')}
                            className={`flex items-center px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${viewMode === 'patient' ? 'bg-white text-primary shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                        >
                            <User className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">{t.patient}</span>
                        </button>
                    </div>

                    {viewMode !== 'patient' && (
                        <div className="flex gap-2 shrink-0 ml-2">
                            <button onClick={handlePrev} className="p-2.5 bg-white border border-slate-200 hover:border-primary hover:text-primary rounded-xl shadow-sm transition-all text-slate-500">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button onClick={handleNext} className="p-2.5 bg-white border border-slate-200 hover:border-primary hover:text-primary rounded-xl shadow-sm transition-all text-slate-500">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* Language Dropdown */}
                    <div className="ml-2 relative shrink-0">
                        <select
                            value={lang}
                            onChange={(e) => onLangChange(e.target.value as Language)}
                            className="appearance-none bg-slate-100 border-none text-xs font-bold text-slate-600 py-2.5 pl-3 pr-8 rounded-xl cursor-pointer hover:bg-slate-200 focus:ring-0 transition-all"
                        >
                            <option value="en">EN</option>
                            <option value="fr">FR</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                            <ChevronDown className="w-3 h-3" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative bg-slate-50/50">
                {viewMode === 'month' && renderMonthView()}
                {viewMode === 'week' && renderWeekView()}
                {viewMode === 'day' && renderDayView()}
                {viewMode === 'patient' && renderPatientView()}
            </div>
        </div>
    );
};
