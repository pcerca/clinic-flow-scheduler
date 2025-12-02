
import React, { useState, useEffect } from 'react';
import { Patient, DurationType, LocationType, ScheduleConfig, Language } from '../types';
import { Button } from './Button';
import { DAYS_OF_WEEK, TRANSLATIONS } from '../constants';
import { generateId, generateInitialSessions, formatDateISO, getDayLabel } from '../utils';
import { CalendarPlus, Home, Building, Clock, Save, Lock, RefreshCw } from 'lucide-react';

interface AddPatientFormProps {
  initialData?: Patient;
  onSave: (patient: Patient, isEdit: boolean) => void;
  onClose: () => void;
  lang: Language;
}

export const AddPatientForm: React.FC<AddPatientFormProps> = ({ initialData, onSave, onClose, lang }) => {
  const isEditMode = !!initialData;
  const t = TRANSLATIONS[lang];

  const [name, setName] = useState(initialData?.name || '');
  const [nomenclature, setNomenclature] = useState(initialData?.nomenclature || '');
  const [location, setLocation] = useState<LocationType>(initialData?.location || LocationType.CABINET);
  const [startDate, setStartDate] = useState(initialData?.startConfig.startDate || formatDateISO(new Date()));
  
  // Schedule: Map day ID to Time string
  const [schedule, setSchedule] = useState<ScheduleConfig[]>(initialData?.startConfig.schedule || []);

  const [durationType, setDurationType] = useState<DurationType>(initialData?.startConfig.durationType || DurationType.SESSION_COUNT);
  const [totalSessions, setTotalSessions] = useState(initialData?.startConfig.totalSessions || 10);
  
  // For Date Range duration
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [endDate, setEndDate] = useState(initialData?.startConfig.endDate || '');

  useEffect(() => {
    if (durationType === DurationType.DATE_RANGE && !initialData && durationMonths > 0) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setMonth(end.getMonth() + durationMonths);
      setEndDate(formatDateISO(end));
    }
  }, [startDate, durationType, initialData]); 

  const toggleDay = (dayId: number) => {
    const exists = schedule.find(s => s.day === dayId);
    if (exists) {
      setSchedule(prev => prev.filter(s => s.day !== dayId));
    } else {
      setSchedule(prev => [...prev, { day: dayId, time: '09:00' }]);
    }
  };

  const handleTimeChange = (dayId: number, newTime: string) => {
    setSchedule(prev => prev.map(s => s.day === dayId ? { ...s, time: newTime } : s));
  };

  const handleRenew = (monthsToAdd: number) => {
    if (!endDate) return;
    const currentEnd = new Date(endDate);
    const newEnd = new Date(currentEnd);
    newEnd.setMonth(newEnd.getMonth() + monthsToAdd);
    setEndDate(formatDateISO(newEnd));
  };

  const handleDurationSelect = (months: number) => {
    setDurationMonths(months);
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    setEndDate(formatDateISO(end));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (schedule.length === 0) {
      alert(t.selectDay);
      return;
    }

    const startConfig = {
      startDate,
      schedule: schedule.sort((a,b) => a.day - b.day),
      durationType,
      totalSessions: durationType === DurationType.SESSION_COUNT ? totalSessions : undefined,
      endDate: durationType === DurationType.DATE_RANGE ? endDate : undefined,
    };

    if (initialData) {
        const updatedPatient: Patient = {
            ...initialData,
            name,
            nomenclature,
            location,
            startConfig,
        };
        onSave(updatedPatient, true);
    } else {
        const newPatientId = generateId();
        const initialSessions = generateInitialSessions(newPatientId, startConfig);
        
        if (initialSessions.length === 0) {
            alert(t.zeroSessions);
            return;
        }

        const newPatient: Patient = {
            id: newPatientId,
            name,
            nomenclature,
            location,
            startConfig,
            sessions: initialSessions
        };
        onSave(newPatient, false);
    }

    onClose();
  };

  const inputClass = "mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm shadow-sm focus:border-primary focus:ring-primary focus:bg-white transition-all";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {isEditMode && (
        <div className="bg-amber-50/50 border border-amber-100 text-amber-800 text-xs p-4 rounded-2xl flex items-start gap-3">
          <Lock className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
          <span>{t.coreLocked}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
            <label className={labelClass}>{t.patientName}</label>
            <div className="relative">
                <input 
                type="text" 
                required 
                disabled={isEditMode}
                className={`${inputClass} ${isEditMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                />
                {isEditMode && <Lock className="w-3 h-3 text-slate-400 absolute right-4 top-4" />}
            </div>
        </div>

        <div>
            <label className={labelClass}>{t.nomenclature}</label>
            <div className="relative">
                <input 
                type="text" 
                required 
                disabled={isEditMode}
                className={`${inputClass} ${isEditMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                value={nomenclature}
                onChange={(e) => setNomenclature(e.target.value)}
                placeholder="e.g. AMS 7.5"
                />
            </div>
        </div>
      </div>

      <div>
        <label className={labelClass}>{t.location}</label>
        <div className="grid grid-cols-2 gap-4">
             <label className={`flex items-center justify-center p-3 border rounded-xl cursor-pointer transition-all ${location === LocationType.CABINET ? 'bg-primary/10 border-primary text-primaryDark ring-1 ring-primary/20' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                <input type="radio" name="location" disabled={isEditMode} checked={location === LocationType.CABINET} onChange={() => setLocation(LocationType.CABINET)} className="hidden" />
                <Building className="w-4 h-4 mr-2" />
                <span className="font-semibold text-sm">{t.cabinet}</span>
             </label>
             <label className={`flex items-center justify-center p-3 border rounded-xl cursor-pointer transition-all ${location === LocationType.HOME ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-200' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                <input type="radio" name="location" disabled={isEditMode} checked={location === LocationType.HOME} onChange={() => setLocation(LocationType.HOME)} className="hidden" />
                <Home className="w-4 h-4 mr-2" />
                <span className="font-semibold text-sm">{t.domicile}</span>
             </label>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-6">
        <div className="mb-4">
            <label className={labelClass}>{t.startDate}</label>
            <input 
                type="date" 
                required 
                disabled={isEditMode}
                className={`${inputClass} max-w-[200px]`}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
            />
        </div>

        <label className={labelClass}>{t.weeklySchedule}</label>
        <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          {DAYS_OF_WEEK.map(day => {
            const scheduleItem = schedule.find(s => s.day === day.id);
            const isSelected = !!scheduleItem;
            
            return (
                <div key={day.id} className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => toggleDay(day.id)}
                        className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                            isSelected
                            ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                            : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                        }`}
                    >
                        {getDayLabel(day.id, lang).substring(0, 3)}
                    </button>
                    
                    <div className="flex-1 h-10 flex items-center">
                        {isSelected ? (
                            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                                <div className="h-px w-4 bg-primary/30"></div>
                                <Clock className="w-4 h-4 text-primary" />
                                <input 
                                    type="time" 
                                    value={scheduleItem.time}
                                    onChange={(e) => handleTimeChange(day.id, e.target.value)}
                                    className="block rounded-lg border-slate-200 text-sm focus:border-primary focus:ring-primary py-1 px-2 bg-white shadow-sm"
                                    required={isSelected}
                                />
                            </div>
                        ) : (
                            <div className="h-px w-full bg-slate-200/50"></div>
                        )}
                    </div>
                </div>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
        <label className={labelClass}>{t.durationMode}</label>
        <div className="flex gap-4 mb-5">
          <label className="flex items-center cursor-pointer group">
            <div className={`w-4 h-4 rounded-full border-2 mr-2 flex items-center justify-center ${durationType === DurationType.SESSION_COUNT ? 'border-primary' : 'border-slate-300'}`}>
                {durationType === DurationType.SESSION_COUNT && <div className="w-2 h-2 rounded-full bg-primary"></div>}
            </div>
            <input type="radio" className="hidden" name="durationType" disabled={isEditMode} checked={durationType === DurationType.SESSION_COUNT} onChange={() => setDurationType(DurationType.SESSION_COUNT)} />
            <span className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">{t.byCount}</span>
          </label>
          <label className="flex items-center cursor-pointer group">
             <div className={`w-4 h-4 rounded-full border-2 mr-2 flex items-center justify-center ${durationType === DurationType.DATE_RANGE ? 'border-primary' : 'border-slate-300'}`}>
                {durationType === DurationType.DATE_RANGE && <div className="w-2 h-2 rounded-full bg-primary"></div>}
            </div>
            <input type="radio" className="hidden" name="durationType" disabled={isEditMode} checked={durationType === DurationType.DATE_RANGE} onChange={() => setDurationType(DurationType.DATE_RANGE)} />
            <span className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">{t.byDateRange}</span>
          </label>
        </div>

        {durationType === DurationType.SESSION_COUNT ? (
          <div>
            <label className={labelClass}>{t.totalSessions}</label>
            <input 
              type="number" 
              min="1"
              className={inputClass}
              value={totalSessions}
              onChange={(e) => setTotalSessions(Number(e.target.value))}
            />
          </div>
        ) : (
           <div>
            <div className="flex items-center justify-between mb-2">
                <label className={labelClass}>{t.endDate}</label>
            </div>

            {!isEditMode && (
                <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 6, 12].map(m => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => handleDurationSelect(m)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                    durationMonths === m 
                                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/30' 
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                {m} {t.months}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-3">
                <input 
                    type="date"
                    className={inputClass}
                    value={endDate}
                    onChange={(e) => {
                        setEndDate(e.target.value);
                        setDurationMonths(0);
                    }}
                    disabled={isEditMode}
                />

                {isEditMode && (
                    <div className="mt-2 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                        <span className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3 block flex items-center gap-2">
                            <RefreshCw className="w-3 h-3" /> {t.extendPrescription}
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {[1, 2, 3, 6].map(m => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => handleRenew(m)}
                                    className="px-3 py-1.5 bg-white border border-blue-200 text-blue-600 text-xs font-bold rounded-lg shadow-sm hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-colors"
                                >
                                    +{m} {t.months}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
        <Button type="button" variant="ghost" onClick={onClose}>{t.cancel}</Button>
        <Button type="submit" variant="primary" className="shadow-xl shadow-primary/20">
            {initialData ? <Save className="w-4 h-4 mr-2" /> : <CalendarPlus className="w-4 h-4 mr-2" />}
            {initialData ? t.updateSchedule : t.createSchedule}
        </Button>
      </div>
    </form>
  );
};
