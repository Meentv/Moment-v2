import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useWorkspace } from './WorkspaceContext.jsx';
import { useToast } from './ToastContext.jsx';
import { useDialogs } from './DialogContext.jsx';
import { readTimer, writeTimer } from '../storage/focusAdapter.js';
import { initialTimer, startTimer, pauseTimer, remainingTime, completeTimer } from '../services/focus.js';
import { clock } from '../services/dates.js';

const FocusContext = createContext(null);
export function FocusProvider({ children }) {
  const { data, transact, service } = useWorkspace();
  const notify = useToast();
  const { confirm } = useDialogs();
  const [timer, setTimer] = useState(() => readTimer(data));
  const timerRef = useRef(timer);
  const dataRef = useRef(data);
  dataRef.current = data;
  const [now, setNow] = useState(Date.now());
  const [timerStorageError, setTimerStorageError] = useState(false);
  const completedIds = useRef(new Set());
  const commit = useCallback((next) => {
    timerRef.current = next; setTimer(next); setNow(Date.now());
    setTimerStorageError(!writeTimer(next));
  }, []);

  useEffect(() => {
    if (timer.phase !== 'running') return;
    setNow(Date.now());
    const tick = () => setNow(Date.now());
    const interval = setInterval(tick, 500);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', tick); window.removeEventListener('focus', tick); };
  }, [timer.phase, timer.id]);

  useEffect(() => {
    const current = timerRef.current;
    if (current.phase !== 'running' || now < current.endsAt || completedIds.current.has(current.id)) return;
    completedIds.current.add(current.id);
    const outcome = completeTimer(current, dataRef.current, Date.now());
    let saved = true;
    if (current.mode === 'focus') {
      const session = { id: current.id, startedAt: current.startedAt, endedAt: new Date(current.endsAt).toISOString(), durationSeconds: current.durationSeconds, taskId: dataRef.current.tasks.some((task) => task.id === current.taskId) ? current.taskId : null, projectId: dataRef.current.projects.some((project) => project.id === current.projectId) ? current.projectId : null };
      try { saved = transact((currentData) => service.recordFocusSession(currentData, session)).saved; }
      catch { completedIds.current.delete(current.id); return; }
    }
    commit(outcome.timer);
    notify(!saved ? 'Session finished, but history couldn’t be saved. Check the storage warning.' : current.mode === 'focus' ? 'Focus complete. Take a breath — you’ve earned a break.' : 'Break complete. Ready for a fresh moment of focus?', { type: saved ? 'success' : 'error' });
  }, [now, timer, commit, notify, service, transact]);

  useEffect(() => {
    if (timerRef.current.phase === 'idle') commit({ ...initialTimer(data.preferences, timerRef.current.mode), taskId: timerRef.current.taskId, projectId: timerRef.current.projectId });
  }, [data.preferences.focusMinutes, data.preferences.breakMinutes, commit]);

  useEffect(() => {
    const reset = () => { completedIds.current.clear(); commit(initialTimer(dataRef.current.preferences)); };
    window.addEventListener('moment:reset', reset);
    return () => window.removeEventListener('moment:reset', reset);
  }, [commit]);

  useEffect(() => {
    if (timer.phase === 'running') document.title = `${clock(remainingTime(timer, now))} · ${timer.mode === 'focus' ? 'Focus' : 'Break'} — MOMENT`;
    else document.title = 'MOMENT — Make room for what matters';
  }, [timer.phase, timer.mode, now, timer]);

  const start = useCallback(() => commit(startTimer(timerRef.current)), [commit]);
  const pause = useCallback(() => commit(pauseTimer(timerRef.current)), [commit]);
  const reset = useCallback(async () => {
    const current = timerRef.current;
    if (current.phase !== 'idle') {
      const accepted = await confirm({ title: 'Reset this session?', description: 'The current, unfinished session will not be added to your focus history. Your completed sessions are safe.', confirmLabel: 'Reset timer' });
      if (!accepted) return;
    }
    commit({ ...initialTimer(dataRef.current.preferences, current.mode), taskId: current.taskId, projectId: current.projectId });
  }, [commit, confirm]);
  const setMode = useCallback(async (mode) => {
    const current = timerRef.current;
    if (current.mode === mode) return;
    if (current.phase !== 'idle') {
      const accepted = await confirm({ title: `Switch to ${mode === 'focus' ? 'focus' : 'a break'}?`, description: 'This unfinished session will be reset and won’t appear in your history.', confirmLabel: 'Switch mode' });
      if (!accepted) return;
    }
    commit({ ...initialTimer(dataRef.current.preferences, mode), taskId: current.taskId, projectId: current.projectId });
  }, [commit, confirm]);
  const linkTask = useCallback((taskId) => {
    const current = timerRef.current;
    if (current.phase !== 'idle') return;
    const task = dataRef.current.tasks.find((item) => item.id === taskId);
    commit({ ...current, taskId: task?.id || null, projectId: task?.projectId || null });
  }, [commit]);
  const remaining = remainingTime(timer, now);
  return <FocusContext.Provider value={{ timer, remaining, start, pause, reset, setMode, linkTask, timerStorageError }}>{children}</FocusContext.Provider>;
}
export function useFocus() { const value = useContext(FocusContext); if (!value) throw new Error('FocusProvider is missing'); return value; }
