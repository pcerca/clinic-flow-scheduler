import React, { useMemo, useState } from 'react';
import { Patient, Session, SessionStatus, LocationType, Language } from '../types';
import { Button } from './Button';
import { MapView } from './MapView';
import { Check, Lock, UserX, CalendarOff, FileText, Home, Building, Edit2, Save, X } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { getSessionStyle } from '../utils/styling';

interface DayDetailProps {
  date: string; // ISO
  patients: Patient[];
  onUpdateSession: (patientId: string, sessionId: string, updates: Partial<Session>) => void;
  onClose?: () => void;
  className?: string;
  lang: Language;
}

export const DayDetail: React.FC<DayDetailProps> = ({ date, patients, onUpdateSession, onClose, className = '', lang }) => {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ date: string, time: string }>({ date: '', time: '' });
  const t = TRANSLATIONS[lang];

  const dailySessions = useMemo(() => {
    const result: { patient: Patient; session: Session }[] = [];
    patients.forEach(p => {
      const s = p.sessions.find(sess => sess.date === date && sess.status !== SessionStatus.CANCELLED);
      if (s) {
        result.push({ patient: p, session: s });
      }
    });
    return result.sort((a, b) => (a.session.time || '00:00').localeCompare(b.session.time || '00:00'));
  }, [patients, date]);

  const stats = useMemo(() => {
    let completed = 0;
    let locked = 0;
    dailySessions.forEach(({ session }) => {
      if (session.status === SessionStatus.COMPLETED || session.isLocked) {
        completed++;
      }
      if (session.isLocked) locked++;
    });
    return { completed, locked };
  }, [dailySessions]);

  const handleComplete = (e: React.MouseEvent, pId: string, sId: string) => {
    e.stopPropagation();
    onUpdateSession(pId, sId, { status: SessionStatus.COMPLETED });
  };

  const handleAbsent = (e: React.MouseEvent, pId: string, sId: string, currentStatus: SessionStatus) => {
    e.stopPropagation();
    if (currentStatus === SessionStatus.ABSENT) {
      onUpdateSession(pId, sId, { status: SessionStatus.SCHEDULED });
    } else {
      onUpdateSession(pId, sId, { status: SessionStatus.ABSENT });
    }
  };

  const handleLock = (e: React.ChangeEvent<HTMLInputElement>, pId: string, sId: string, currentLockState: boolean) => {
    e.stopPropagation();
    onUpdateSession(pId, sId, {
      isLocked: !currentLockState,
      status: !currentLockState ? SessionStatus.COMPLETED : SessionStatus.COMPLETED
    });
  };

  const handleStartEdit = (session: Session) => {
    setEditingSessionId(session.id);
    setEditForm({ date: session.date, time: session.time });
  };

  const handleCancelEdit = () => {
    setEditingSessionId(null);
  };

  const handleSaveEdit = (patientId: string) => {
    if (!editingSessionId) return;
    onUpdateSession(patientId, editingSessionId, {
      date: editForm.date,
      time: editForm.time,
      status: SessionStatus.SCHEDULED
    });
    setEditingSessionId(null);
  };

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Summary Card */}
      <div className="flex items-center justify-between bg-white/60 backdrop-blur p-4 rounded-2xl border border-white shadow-sm">
        <div className="text-sm text-slate-600">
          <div className="font-semibold text-slate-900 mb-1">{t.overview}</div>
          <div className="flex gap-3">
            <span className="flex items-center text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
              <Check className="w-3 h-3 mr-1.5" /> {stats.completed} {t.done}
            </span>
            <span className="flex items-center text-violet-600 text-xs font-bold bg-violet-50 px-2 py-1 rounded-lg">
              <Lock className="w-3 h-3 mr-1.5" /> {stats.locked} {t.validated}
            </span>
          </div>
        </div>
        <div>
          <span className="text-xs font-bold bg-primary/10 text-primaryDark px-3 py-1.5 rounded-xl">
            {dailySessions.length} {t.total}
          </span>
        </div>
      </div>

      {/* Map View for Domicile Patients */}
      <MapView patients={patients} selectedDate={date} />

      <div className="space-y-3">
        {dailySessions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-white/40 rounded-3xl border border-dashed border-slate-200">
            <CalendarOff className="w-12 h-12 mx-auto mb-3 opacity-50 text-slate-300" />
            <p className="font-medium">{t.noSessions}</p>
          </div>
        ) : (
          dailySessions.map(({ patient, session }) => {
            const isEditing = editingSessionId === session.id;
            const styles = getSessionStyle(session, date);

            if (isEditing) {
              return (
                <div key={session.id} className="bg-white p-5 rounded-2xl border border-primary shadow-lg shadow-primary/10 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-slate-900">{patient.name}</h4>
                    <button onClick={handleCancelEdit} className="p-1 hover:bg-slate-100 rounded-full text-slate-400"><X className="w-4 h-4" /></button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{t.newDate}</label>
                      <input
                        type="date"
                        value={editForm.date}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        className="w-full rounded-xl border-slate-200 bg-slate-50 shadow-sm focus:border-primary focus:ring-primary text-sm py-2.5 px-3"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{t.newTime}</label>
                      <input
                        type="time"
                        value={editForm.time}
                        onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                        className="w-full rounded-xl border-slate-200 bg-slate-50 shadow-sm focus:border-primary focus:ring-primary text-sm py-2.5 px-3"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={handleCancelEdit}>{t.cancel}</Button>
                    <Button variant="primary" size="sm" onClick={() => handleSaveEdit(patient.id)}>
                      <Save className="w-4 h-4 mr-2" /> {t.save}
                    </Button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={session.id}
                className={`relative flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border transition-all duration-300 gap-4 group ${styles.container}`}
              >
                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {/* Time Badge */}
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm ${styles.badge}`}>
                      {session.time || '00:00'}
                    </div>

                    {session.isLocked && <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-1 rounded-lg font-bold uppercase tracking-wide shadow-sm">{t.validated}</span>}

                    {session.status === SessionStatus.ABSENT && (
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded-lg font-bold uppercase tracking-wide">{t.cancelled}</span>
                    )}
                  </div>

                  <h4 className={`font-bold text-lg truncate ${styles.text}`}>
                    {patient.name}
                  </h4>

                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                      <FileText className="w-3 h-3" /> {patient.nomenclature || 'N/A'}
                    </div>
                    {patient.location === LocationType.HOME ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md">
                        <Home className="w-3 h-3" /> {t.domicile}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-white border border-slate-100 px-2 py-1 rounded-md">
                        <Building className="w-3 h-3" /> {t.cabinet}
                      </div>
                    )}
                  </div>
                  {session.notes && <div className="text-amber-600 text-xs font-medium mt-2 bg-amber-50 inline-block px-2 py-1 rounded">{t.note}: {session.notes}</div>}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 mt-1 md:mt-0 justify-end">

                  {!session.isLocked && (
                    <>
                      <button
                        disabled={session.status === SessionStatus.ABSENT}
                        onClick={(e) => session.status !== SessionStatus.COMPLETED && handleComplete(e, patient.id, session.id)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${session.status === SessionStatus.ABSENT ? 'text-slate-300 cursor-not-allowed' :
                          session.status === SessionStatus.COMPLETED
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 scale-105'
                            : 'bg-slate-100 text-slate-400 hover:bg-emerald-500 hover:text-white hover:shadow-lg hover:shadow-emerald-500/30'
                          }`}
                        title={session.status === SessionStatus.COMPLETED ? t.confirmed : t.confirmSession}
                      >
                        <Check className="w-5 h-5" />
                      </button>

                      <button
                        onClick={(e) => handleAbsent(e, patient.id, session.id, session.status)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${session.status === SessionStatus.ABSENT
                          ? 'bg-red-500 text-white shadow-lg shadow-red-500/40'
                          : 'bg-slate-100 text-slate-400 hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/30'
                          }`}
                        title={session.status === SessionStatus.ABSENT ? t.restore : t.cancel}
                      >
                        <UserX className="w-5 h-5" />
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); handleStartEdit(session); }}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-400 hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
                        title={t.edit}
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Validate Checkbox */}
                  <div className="pl-4 border-l ml-2 border-slate-100 flex flex-col items-center">
                    <label className={`flex items-center justify-center w-10 h-10 rounded-xl cursor-pointer transition-all ${session.isLocked ? 'bg-violet-100' : 'hover:bg-slate-50'}`} title={t.validateOnPC}>
                      <input
                        type="checkbox"
                        disabled={session.status === SessionStatus.ABSENT}
                        checked={session.isLocked}
                        onChange={(e) => handleLock(e, patient.id, session.id, session.isLocked)}
                        className="form-checkbox h-5 w-5 text-violet-600 rounded-md focus:ring-violet-500 border-slate-300 cursor-pointer disabled:opacity-50"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {onClose && (
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <Button onClick={onClose} variant="secondary" className="w-full sm:w-auto">{t.close}</Button>
        </div>
      )}
    </div>
  );
};
