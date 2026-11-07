import { makeId } from './model.js';

export function initialTimer(preferences, mode = 'focus') {
  const durationSeconds = (mode === 'break' ? preferences.breakMinutes : preferences.focusMinutes) * 60;
  return { id: makeId(), mode, phase: 'idle', durationSeconds, remainingSeconds: durationSeconds, endsAt: null, startedAt: null, taskId: null, projectId: null };
}

export function startTimer(timer, timestamp = Date.now()) {
  if (timer.phase === 'running') return timer;
  const remainingSeconds = timer.phase === 'paused' ? timer.remainingSeconds : timer.durationSeconds;
  return { ...timer, phase: 'running', remainingSeconds, endsAt: timestamp + remainingSeconds * 1000, startedAt: timer.startedAt || new Date(timestamp).toISOString() };
}
export function pauseTimer(timer, timestamp = Date.now()) {
  if (timer.phase !== 'running') return timer;
  return { ...timer, phase: 'paused', remainingSeconds: Math.max(0, (timer.endsAt - timestamp) / 1000), endsAt: null };
}
export function remainingTime(timer, timestamp = Date.now()) {
  return timer.phase === 'running' ? Math.max(0, (timer.endsAt - timestamp) / 1000) : timer.remainingSeconds;
}
export function completeTimer(timer, data, timestamp = Date.now()) {
  if (timer.phase !== 'running' || timestamp < timer.endsAt) return { timer, data, completed: false };
  let nextData = data;
  if (timer.mode === 'focus') {
    const session = { id: timer.id, startedAt: timer.startedAt, endedAt: new Date(timer.endsAt).toISOString(), durationSeconds: timer.durationSeconds, taskId: timer.taskId, projectId: timer.projectId };
    if (!data.focusSessions.some((item) => item.id === session.id)) nextData = { ...data, focusSessions: [session, ...data.focusSessions] };
  }
  const mode = timer.mode === 'focus' ? 'break' : 'focus';
  const next = initialTimer(data.preferences, mode);
  if (data.preferences.autoStartBreak && mode === 'break') {
    return { timer: startTimer({ ...next, taskId: timer.taskId, projectId: timer.projectId }, timer.endsAt), data: nextData, completed: true, completedMode: timer.mode };
  }
  return { timer: next, data: nextData, completed: true, completedMode: timer.mode };
}

export function validateTimer(value, preferences, data) {
  const fallback = initialTimer(preferences);
  if (!value || !['focus', 'break'].includes(value.mode) || !['idle', 'running', 'paused'].includes(value.phase)) return fallback;
  if (typeof value.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(value.id)) return fallback;
  if (!Number.isFinite(value.durationSeconds) || value.durationSeconds < 60 || value.durationSeconds > 10800) return fallback;
  if (!Number.isFinite(value.remainingSeconds) || value.remainingSeconds < 0 || value.remainingSeconds > value.durationSeconds) return fallback;
  if (value.phase === 'running' && (!Number.isFinite(value.endsAt) || value.endsAt <= 0 || value.endsAt > Date.now() + 10801000 || typeof value.startedAt !== 'string' || !Number.isFinite(Date.parse(value.startedAt)))) return fallback;
  if (value.phase !== 'idle' && (typeof value.startedAt !== 'string' || !Number.isFinite(Date.parse(value.startedAt)))) return fallback;
  return { ...fallback, ...value, taskId: data.tasks.some((task) => task.id === value.taskId) ? value.taskId : null, projectId: data.projects.some((project) => project.id === value.projectId) ? value.projectId : null };
}
