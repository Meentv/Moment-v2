import { describe, it, expect } from 'vitest';
import { initialTimer, startTimer, pauseTimer, remainingTime, completeTimer, validateTimer } from './focus.js';
import { emptyWorkspace } from './model.js';
import { readTimer, writeTimer } from '../storage/focusAdapter.js';

const prefs = emptyWorkspace().preferences;
const start = 1800000000000;

describe('timestamp-based focus timer', () => {
  it('starts, pauses and resumes without counting paused time', () => {
    const idle = initialTimer(prefs);
    const running = startTimer(idle, start);
    expect(remainingTime(running, start + 60000)).toBe(1440);
    const paused = pauseTimer(running, start + 60000);
    expect(paused.phase).toBe('paused');
    expect(remainingTime(paused, start + 600000)).toBe(1440);
    const resumed = startTimer(paused, start + 600000);
    expect(resumed.endsAt).toBe(start + 600000 + 1440000);
    expect(resumed.startedAt).toBe(idle.startedAt || new Date(start).toISOString());
  });
  it('calculates accurate remaining time after a long tab absence', () => {
    const running = startTimer(initialTimer(prefs), start);
    expect(remainingTime(running, start + 1200000)).toBe(300);
    expect(remainingTime(running, start + 2000000)).toBe(0);
  });
  it('records a focus session exactly once at completion', () => {
    const data = emptyWorkspace();
    const running = startTimer(initialTimer(prefs), start);
    expect(completeTimer(running, data, start + 1000).completed).toBe(false);
    const finished = completeTimer(running, data, start + 1500000);
    expect(finished.completed).toBe(true);
    expect(finished.data.focusSessions).toHaveLength(1);
    expect(finished.data.focusSessions[0].durationSeconds).toBe(1500);
    expect(finished.data.focusSessions[0].id).toBe(running.id);
    expect(finished.timer.mode).toBe('break');
    expect(finished.timer.phase).toBe('idle');
    expect(completeTimer(running, finished.data, start + 1600000).data.focusSessions).toHaveLength(1);
  });
  it('does not record breaks or reset sessions as focus history', () => {
    const running = startTimer(initialTimer(prefs, 'break'), start);
    const finished = completeTimer(running, emptyWorkspace(), start + 300000);
    expect(finished.data.focusSessions).toHaveLength(0);
    expect(finished.timer.mode).toBe('focus');
    const reset = initialTimer(prefs);
    expect(reset.phase).toBe('idle');
    expect(reset.remainingSeconds).toBe(1500);
  });
  it('can start a break automatically using the actual focus end time', () => {
    const data = { ...emptyWorkspace(), preferences: { ...prefs, autoStartBreak: true } };
    const running = startTimer(initialTimer(prefs), start);
    const finished = completeTimer(running, data, start + 1600000);
    expect(finished.timer.mode).toBe('break');
    expect(finished.timer.phase).toBe('running');
    expect(finished.timer.endsAt).toBe(start + 1800000);
  });
  it('restores a running timer from storage and completes it after refresh', () => {
    const storage = { value: null, getItem() { return this.value; }, setItem(_, value) { this.value = value; } };
    const data = emptyWorkspace();
    const running = startTimer(initialTimer(prefs), Date.now() - 1200000);
    writeTimer(running, storage);
    const restored = readTimer(data, storage);
    expect(restored.id).toBe(running.id);
    expect(restored.phase).toBe('running');
    expect(remainingTime(restored)).toBeLessThanOrEqual(300);
    expect(remainingTime(restored)).toBeGreaterThan(298);
    const expired = { ...running, endsAt: Date.now() - 1000, startedAt: new Date(Date.now() - 1501000).toISOString() };
    writeTimer(expired, storage);
    const outcome = completeTimer(readTimer(data, storage), data, Date.now());
    expect(outcome.completed).toBe(true);
    expect(outcome.data.focusSessions).toHaveLength(1);
  });
  it('recovers safely from malformed timer storage', () => {
    const storage = { getItem: () => '{bad', setItem: () => {} };
    expect(readTimer(emptyWorkspace(), storage).phase).toBe('idle');
    expect(validateTimer({ ...initialTimer(prefs), durationSeconds: -5 }, prefs, emptyWorkspace()).durationSeconds).toBe(1500);
    expect(validateTimer({ ...initialTimer(prefs), phase: 'running', endsAt: 'soon' }, prefs, emptyWorkspace()).phase).toBe('idle');
  });
});
