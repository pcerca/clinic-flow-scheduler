
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar } from './components/Calendar';
import { AddPatientForm } from './components/AddPatientForm';
import { DayDetail } from './components/DayDetail';
import { Modal } from './components/Modal';
import { Button } from './components/Button';
import { Logo } from './components/Logo';
import { Patient, Session, DurationType, SessionStatus, ScheduleConfig, Language } from './types';
import { addMakeupSession, regenerateFutureSessions, fetchFrenchHolidays, getLocale } from './utils';
import { TRANSLATIONS } from './constants';
import { Plus, AlertCircle, Search, Menu, X, Edit, Calendar as CalendarIcon } from 'lucide-react';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'patient'>('week');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [holidays, setHolidays] = useState<Record<string, string>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDateISO, setSelectedDateISO] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [lang, setLang] = useState<Language>('en');

  const t = TRANSLATIONS[lang];

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('clinic_patients');
    const savedHolidays = localStorage.getItem('clinic_holidays');
    const savedLang = localStorage.getItem('clinic_lang') as Language;

    if (savedLang) setLang(savedLang);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const migrated = parsed.map((p: any) => {
           if (p.startConfig.selectedDays) {
              const schedule: ScheduleConfig[] = p.startConfig.selectedDays.map((d: number) => ({
                  day: d,
                  time: '09:00'
              }));
              const sessions = p.sessions.map((s: any) => ({
                  ...s,
                  time: s.time || '09:00'
              }));
              const { selectedDays, ...restConfig } = p.startConfig;
              return {
                  ...p,
                  startConfig: { ...restConfig, schedule },
                  sessions
              };
           }
           return p;
        });
        setPatients(migrated);
      } catch (e) {
        console.error("Failed to load data", e);
      }
    }
    
    if (savedHolidays) {
        try {
            setHolidays(JSON.parse(savedHolidays));
        } catch (e) {
            console.error("Failed to load holidays", e);
        }
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('clinic_patients', JSON.stringify(patients));
  }, [patients]);
  
  useEffect(() => {
    localStorage.setItem('clinic_holidays', JSON.stringify(holidays));
  }, [holidays]);

  useEffect(() => {
    localStorage.setItem('clinic_lang', lang);
  }, [lang]);

  const handleSavePatient = (patientData: Patient, isEdit: boolean) => {
    if (isEdit) {
        setPatients(prev => prev.map(p => {
            if (p.id === patientData.id) {
                const scheduleChanged = JSON.stringify(p.startConfig.schedule) !== JSON.stringify(patientData.startConfig.schedule) ||
                                      p.startConfig.startDate !== patientData.startConfig.startDate ||
                                      p.startConfig.totalSessions !== patientData.startConfig.totalSessions;
                
                if (scheduleChanged) {
                    if (confirm(t.scheduleChanged)) {
                        const updatedSessions = regenerateFutureSessions(p, patientData.startConfig);
                        return { ...patientData, sessions: updatedSessions };
                    }
                }
                return { ...patientData, sessions: p.sessions };
            }
            return p;
        }));
    } else {
        setPatients([...patients, patientData]);
    }
    setEditingPatient(null);
  };

  const handleUpdateSession = (patientId: string, sessionId: string, updates: Partial<Session>) => {
    setPatients(prevPatients => prevPatients.map(patient => {
      if (patient.id !== patientId) return patient;

      const oldSession = patient.sessions.find(s => s.id === sessionId);
      let updatedSessions = patient.sessions.map(s => 
        s.id === sessionId ? { ...s, ...updates } : s
      );

      if (updates.status === SessionStatus.ABSENT && 
          oldSession?.status !== SessionStatus.ABSENT && 
          patient.startConfig.durationType === DurationType.SESSION_COUNT) {
        
        const tempPatient = { ...patient, sessions: updatedSessions };
        const newSession = addMakeupSession(tempPatient);
        updatedSessions = [...updatedSessions, newSession];
      }

      return { ...patient, sessions: updatedSessions };
    }));
  };

  const handleImportHolidays = async () => {
      if (!confirm(t.syncConfirm)) {
          return;
      }

      const year = new Date().getFullYear();
      const nextYear = year + 1;
      
      const h1 = await fetchFrenchHolidays(year);
      const h2 = await fetchFrenchHolidays(nextYear);
      const allHolidays = { ...h1, ...h2 };
      
      setHolidays(allHolidays);
      
      setPatients(currentPatients => currentPatients.map(p => {
          const sessionsToCancel = p.sessions.filter(s => 
             allHolidays[s.date] && s.status === SessionStatus.SCHEDULED
          );

          if (sessionsToCancel.length === 0) return p;

          let updatedSessions = [...p.sessions];
          updatedSessions = updatedSessions.map(s => {
              if (allHolidays[s.date] && s.status === SessionStatus.SCHEDULED) {
                  return { 
                      ...s, 
                      status: SessionStatus.ABSENT, 
                      notes: `Holiday: ${allHolidays[s.date]}` 
                  };
              }
              return s;
          });

          if (p.startConfig.durationType === DurationType.SESSION_COUNT) {
              for (let i = 0; i < sessionsToCancel.length; i++) {
                  const tempPatient = { ...p, sessions: updatedSessions };
                  const newSession = addMakeupSession(tempPatient);
                  updatedSessions.push(newSession);
              }
          }

          return { ...p, sessions: updatedSessions };
      }));
  };

  const openEditPatient = (patient: Patient) => {
      setEditingPatient(patient);
      setIsAddModalOpen(true);
      setIsSidebarOpen(false);
  };

  const expiringPatients = useMemo(() => {
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(now.getDate() + 30);

    return patients.filter(p => {
      const validSessions = p.sessions.filter(s => s.status !== SessionStatus.CANCELLED);
      if (validSessions.length === 0) return false;
      
      const lastSession = [...validSessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).pop();
      
      if (!lastSession) return false;

      const lastDate = new Date(lastSession.date);
      return lastDate > now && lastDate <= nextMonth;
    });
  }, [patients]);

  const filteredPatients = useMemo(() => {
    return patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [patients, searchTerm]);

  return (
    <div className="flex h-screen supports-[height:100dvh]:h-[100dvh] w-full bg-background flex-col md:flex-row">
      
      {/* Mobile Header */}
      <header className="md:hidden bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex items-center justify-between z-20 shrink-0 sticky top-0">
        <div className="flex items-center gap-2.5">
           <Logo className="w-9 h-9 drop-shadow-md" />
           <h1 className="text-lg font-bold text-slate-800 tracking-tight">{t.appName}</h1>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
        >
          {isSidebarOpen ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 z-30 md:hidden backdrop-blur-sm transition-all duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-[85vw] max-w-xs bg-white border-r border-slate-200 flex flex-col shadow-2xl md:shadow-none transform transition-transform duration-300 ease-out
        md:relative md:translate-x-0 md:w-72 lg:w-80 md:z-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 hidden md:block">
           <div className="flex items-center gap-3 mb-1">
             <Logo className="w-10 h-10 drop-shadow-lg" />
             <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{t.appName}</h1>
           </div>
           <p className="text-xs text-slate-400 ml-1">{t.subtitle}</p>
        </div>

        <div className="px-6 pb-6 space-y-3">
           <Button onClick={() => { setEditingPatient(null); setIsAddModalOpen(true); setIsSidebarOpen(false); }} className="w-full shadow-lg shadow-primary/20 py-3">
             <Plus className="w-5 h-5 mr-2" /> {t.newPatient}
           </Button>
           
           <Button onClick={handleImportHolidays} variant="ghost" className="w-full justify-start text-slate-500 hover:text-amber-600 hover:bg-amber-50">
             <CalendarIcon className="w-5 h-5 mr-2" /> {t.syncHolidays}
           </Button>
        </div>

        <div className="px-6 mb-4 flex items-center justify-between">
           <div className="flex bg-slate-100 p-1 rounded-xl w-full">
              <button 
                onClick={() => setLang('en')}
                className={`flex-1 flex items-center justify-center text-xs font-bold py-1.5 rounded-lg transition-all ${lang === 'en' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                 EN
              </button>
              <button 
                onClick={() => setLang('fr')}
                className={`flex-1 flex items-center justify-center text-xs font-bold py-1.5 rounded-lg transition-all ${lang === 'fr' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                 FR
              </button>
           </div>
        </div>

        {expiringPatients.length > 0 && (
          <div className="mx-4 mb-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3 flex items-center">
              <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> {t.endingSoon}
            </h3>
            <ul className="space-y-2">
              {expiringPatients.map(p => (
                <li key={p.id} className="text-sm font-medium text-amber-900 bg-white/60 p-2.5 rounded-xl border border-amber-200/50 truncate cursor-pointer hover:bg-white hover:shadow-sm transition-all" onClick={() => openEditPatient(p)}>
                  {p.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="px-4 mb-2">
            <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-primary transition-colors" />
                <input 
                    type="text" 
                    placeholder={t.searchPlaceholder}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-4 scrollbar-thin scrollbar-thumb-slate-200">
          {filteredPatients.length === 0 ? (
              <div className="text-center text-slate-400 text-sm py-8">
                  <div className="mb-2 opacity-20">
                      <Search className="w-8 h-8 mx-auto" />
                  </div>
                  {t.noPatients}
              </div>
          ) : (
              filteredPatients.map(p => {
                  const completed = p.sessions.filter(s => s.status === SessionStatus.COMPLETED || s.isLocked).length;
                  const total = p.sessions.length;
                  const pct = total > 0 ? Math.round((completed/total) * 100) : 0;
                  
                  return (
                    <div 
                        key={p.id} 
                        onClick={() => openEditPatient(p)}
                        className="group p-3.5 rounded-2xl hover:bg-slate-50 hover:shadow-md border border-transparent hover:border-slate-100 transition-all cursor-pointer"
                    >
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="font-bold text-slate-700 truncate text-sm">{p.name}</span>
                            <Edit className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110" />
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                             <span>{t.progress}</span>
                             <span className="text-primary">{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-gradient-to-r from-primary to-primaryDark rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                        </div>
                    </div>
                  );
              })
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-2 md:p-4 h-full overflow-hidden flex flex-col relative w-full">
        <Calendar 
          currentDate={currentDate} 
          onDateChange={setCurrentDate} 
          patients={patients}
          holidays={holidays}
          onDayClick={setSelectedDateISO}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onUpdateSession={handleUpdateSession}
          lang={lang}
        />
      </main>

      {/* Modals */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => { setIsAddModalOpen(false); setEditingPatient(null); }} 
        title={editingPatient ? t.edit + " Patient" : t.newPatient}
      >
        <AddPatientForm 
          initialData={editingPatient || undefined}
          onSave={handleSavePatient} 
          onClose={() => { setIsAddModalOpen(false); setEditingPatient(null); }} 
          lang={lang}
        />
      </Modal>

      <Modal
        isOpen={!!selectedDateISO}
        onClose={() => setSelectedDateISO(null)}
        title={selectedDateISO ? new Date(selectedDateISO).toLocaleDateString(getLocale(lang), { weekday: 'long', month: 'long', day: 'numeric' }) : 'Details'}
        maxWidth="max-w-2xl"
      >
        {selectedDateISO && (
            <DayDetail 
                date={selectedDateISO}
                patients={patients}
                onUpdateSession={handleUpdateSession}
                onClose={() => setSelectedDateISO(null)}
                lang={lang}
            />
        )}
      </Modal>
    </div>
  );
}

export default App;
