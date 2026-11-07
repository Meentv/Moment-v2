import { describe, it, expect } from 'vitest';
import { emptyWorkspace, DEFAULT_PREFERENCES } from './model.js';
import * as service from './workspace.js';
import { validateWorkspace, validateTask, parseTags } from './validation.js';
import { dateKey, addDays, isValidDay, monthGrid, startOfWeek, clock } from './dates.js';

const makeTask = (data = emptyWorkspace(), input = {}) => service.createTask(data, { title: 'Write the plan', ...input });
const makeProject = (data = emptyWorkspace(), input = {}) => service.createProject(data, { name: 'A meaningful project', ...input });
const makeNote = (data = emptyWorkspace(), input = {}) => service.createNote(data, { title: 'An idea', body: 'Keep it simple.', ...input });

describe('task service', () => {
  it('creates, reads, updates, completes, reopens and deletes real records', () => {
    const created = makeTask();
    expect(created.record.title).toBe('Write the plan');
    expect(created.record.status).toBe('todo');
    expect(created.record.priority).toBe('medium');
    expect(created.record.createdAt).toBe(created.record.updatedAt);
    expect(service.listTasks(created.data)).toHaveLength(1);
    const updated = service.updateTask(created.data, created.record.id, { title: 'Write a clearer plan', status: 'in-progress', priority: 'high' });
    expect(updated.record.title).toBe('Write a clearer plan');
    expect(updated.record.status).toBe('in-progress');
    const completed = service.updateTask(updated.data, created.record.id, { status: 'completed' });
    expect(completed.record.completedAt).toBeTruthy();
    const reopened = service.updateTask(completed.data, created.record.id, { status: 'todo' });
    expect(reopened.record.completedAt).toBeNull();
    const deleted = service.deleteTask(reopened.data, created.record.id);
    expect(deleted.data.tasks).toHaveLength(0);
    expect(reopened.data.tasks).toHaveLength(1);
  });
  it('trims titles and rejects empty titles, invalid enums, dates and references', () => {
    expect(makeTask(emptyWorkspace(), { title: '  A small step  ' }).record.title).toBe('A small step');
    expect(() => makeTask(emptyWorkspace(), { title: '   ' })).toThrow('required');
    expect(() => makeTask(emptyWorkspace(), { status: 'finished' })).toThrow('status');
    expect(() => makeTask(emptyWorkspace(), { priority: 'urgent' })).toThrow('priority');
    expect(() => makeTask(emptyWorkspace(), { dueDate: '2026-02-30' })).toThrow('valid due date');
    expect(() => makeTask(emptyWorkspace(), { projectId: 'missing' })).toThrow('no longer exists');
    expect(() => makeTask(emptyWorkspace(), { title: 'x'.repeat(201) })).toThrow('200');
  });
  it('keeps undated tasks out of dated filters and sorts missing dates last', () => {
    let data = emptyWorkspace();
    data = makeTask(data, { title: 'No date' }).data;
    data = makeTask(data, { title: 'Tomorrow', dueDate: '2026-11-08' }).data;
    data = makeTask(data, { title: 'Today', dueDate: '2026-11-07' }).data;
    data = makeTask(data, { title: 'Overdue', dueDate: '2026-11-06' }).data;
    const options = { today: '2026-11-07', weekEnd: '2026-11-13' };
    expect(service.filterTasks(data.tasks, { ...options, date: 'today' }).map((task) => task.title)).toEqual(['Today']);
    expect(service.filterTasks(data.tasks, { ...options, date: 'overdue' }).map((task) => task.title)).toEqual(['Overdue']);
    expect(service.filterTasks(data.tasks, { ...options, date: 'unscheduled' }).map((task) => task.title)).toEqual(['No date']);
    expect(service.filterTasks(data.tasks, { ...options, date: 'week' })).toHaveLength(2);
    expect(service.sortTasks(data.tasks, 'due-asc').at(-1).title).toBe('No date');
  });
  it('combines status, priority, project and text filters', () => {
    const project = makeProject();
    let data = makeTask(project.data, { title: 'Draft outline', projectId: project.record.id, priority: 'high', status: 'in-progress' }).data;
    data = makeTask(data, { title: 'Other task', priority: 'low' }).data;
    expect(service.filterTasks(data.tasks, { status: 'in-progress', priority: 'high', projectId: project.record.id, query: 'outline' })).toHaveLength(1);
    expect(service.filterTasks(data.tasks, { status: 'completed' })).toHaveLength(0);
  });
  it('restores a deleted task for undo without duplicating IDs', () => {
    const created = makeTask();
    const deleted = service.deleteTask(created.data, created.record.id);
    const restored = service.restoreTask(deleted.data, deleted.record);
    expect(restored.data.tasks).toHaveLength(1);
    expect(service.restoreTask(restored.data, deleted.record).data.tasks).toHaveLength(1);
  });
  it('detaches focus history when a linked task is deleted', () => {
    const task = makeTask();
    const session = service.recordFocusSession(task.data, { id: 'session-1', taskId: task.record.id, startedAt: '2026-11-07T10:00:00.000Z', endedAt: '2026-11-07T10:25:00.000Z', durationSeconds: 1500 });
    const deleted = service.deleteTask(session.data, task.record.id);
    expect(deleted.data.focusSessions).toHaveLength(1);
    expect(deleted.data.focusSessions[0].taskId).toBeNull();
  });
});

describe('project service', () => {
  it('creates, edits, archives and restores projects', () => {
    const created = makeProject(emptyWorkspace(), { color: 'sage', description: 'A real plan' });
    const edited = service.updateProject(created.data, created.record.id, { name: 'New name', status: 'on-hold' });
    expect(edited.record.name).toBe('New name');
    const archived = service.updateProject(edited.data, created.record.id, { status: 'archived' });
    expect(archived.record.archivedAt).toBeTruthy();
    expect(service.updateProject(archived.data, created.record.id, { status: 'active' }).record.archivedAt).toBeNull();
  });
  it('calculates progress from actual linked tasks only', () => {
    const project = makeProject();
    let data = makeTask(project.data, { projectId: project.record.id, status: 'completed' }).data;
    data = makeTask(data, { projectId: project.record.id }).data;
    data = makeTask(data, { title: 'Unrelated' }).data;
    expect(service.projectProgress(data, project.record.id)).toEqual({ total: 2, completed: 1, percent: 50 });
    expect(service.projectProgress(data, 'missing')).toEqual({ total: 0, completed: 0, percent: 0 });
  });
  it('deletes a project without deleting its tasks', () => {
    const project = makeProject();
    const task = makeTask(project.data, { projectId: project.record.id });
    const deleted = service.deleteProject(task.data, project.record.id);
    expect(deleted.data.projects).toHaveLength(0);
    expect(deleted.data.tasks).toHaveLength(1);
    expect(deleted.data.tasks[0].projectId).toBeNull();
  });
  it('rejects reversed project dates and invalid colours', () => {
    expect(() => makeProject(emptyWorkspace(), { startDate: '2026-12-01', endDate: '2026-11-01' })).toThrow('after');
    expect(() => makeProject(emptyWorkspace(), { color: 'neon' })).toThrow('colour');
    expect(() => makeProject(emptyWorkspace(), { name: '' })).toThrow('required');
  });
});

describe('notes service', () => {
  it('creates, edits, pins, searches and deletes notes', () => {
    const created = makeNote(emptyWorkspace(), { tags: ['Work', 'work', 'ideas'] });
    expect(created.record.tags).toEqual(['work', 'ideas']);
    const pinned = service.updateNote(created.data, created.record.id, { pinned: true, body: 'A thoughtful plan' });
    expect(pinned.record.pinned).toBe(true);
    expect(service.searchWorkspace(pinned.data, 'thoughtful')).toHaveLength(1);
    expect(service.searchWorkspace(pinned.data, 'IDEAS')[0].type).toBe('note');
    expect(service.deleteNote(pinned.data, created.record.id).data.notes).toHaveLength(0);
  });
  it('accepts body-only notes but rejects completely empty notes and excess tags', () => {
    expect(makeNote(emptyWorkspace(), { title: '', body: 'A small thought' }).record.title).toBe('');
    expect(() => makeNote(emptyWorkspace(), { title: '', body: '' })).toThrow('Add a title');
    expect(() => makeNote(emptyWorkspace(), { tags: Array.from({ length: 13 }, (_, i) => `tag${i}`) })).toThrow('12');
    expect(parseTags(' work, ideas,work,, inspiration ')).toEqual(['work', 'ideas', 'inspiration']);
  });
  it('restores notes for undo', () => {
    const note = makeNote();
    const deleted = service.deleteNote(note.data, note.record.id);
    expect(service.restoreNote(deleted.data, deleted.record).data.notes).toHaveLength(1);
  });
});

describe('global search, preferences and focus history', () => {
  it('searches all three collections and returns useful empty results', () => {
    let data = makeTask(emptyWorkspace(), { title: 'Launch plan', description: 'Prepare the release' }).data;
    data = makeProject(data, { name: 'Launch project' }).data;
    data = makeNote(data, { title: 'Launch thoughts' }).data;
    expect(service.searchWorkspace(data, 'launch')).toHaveLength(3);
    expect(service.searchWorkspace(data, 'release')).toHaveLength(1);
    expect(service.searchWorkspace(data, '   ')).toEqual([]);
    expect(service.searchWorkspace(data, 'no-such-record')).toEqual([]);
  });
  it('records completed focus sessions once and validates links', () => {
    const input = { id: 'focus-1', startedAt: '2026-11-07T10:00:00Z', endedAt: '2026-11-07T10:25:00Z', durationSeconds: 1500, taskId: null, projectId: null };
    const recorded = service.recordFocusSession(emptyWorkspace(), input);
    expect(recorded.data.focusSessions).toHaveLength(1);
    expect(service.recordFocusSession(recorded.data, input).data.focusSessions).toHaveLength(1);
    expect(() => service.recordFocusSession(emptyWorkspace(), { ...input, taskId: 'missing' })).toThrow('no longer exists');
    expect(() => service.recordFocusSession(emptyWorkspace(), { ...input, durationSeconds: -1 })).toThrow('duration');
  });
  it('validates preferences and keeps unrelated data intact', () => {
    const task = makeTask();
    const updated = service.updatePreferences(task.data, { theme: 'dark', focusMinutes: 50 });
    expect(updated.data.preferences.theme).toBe('dark');
    expect(updated.data.preferences.breakMinutes).toBe(DEFAULT_PREFERENCES.breakMinutes);
    expect(updated.data.tasks).toHaveLength(1);
    expect(() => service.updatePreferences(task.data, { focusMinutes: 0 })).toThrow('between');
    expect(() => service.updatePreferences(task.data, { weekStart: 'tuesday' })).toThrow('week start');
  });
});

describe('portable backups and corrupted data', () => {
  it('round-trips all collections and preferences', () => {
    let data = makeProject(emptyWorkspace(), { color: 'blue' }).data;
    data = makeTask(data, { projectId: data.projects[0].id, dueDate: '2026-11-07' }).data;
    data = makeNote(data, { tags: ['plan'], pinned: true }).data;
    data = service.updatePreferences(data, { theme: 'system' }).data;
    const restored = service.importWorkspace(service.exportWorkspace(data));
    expect(restored).toEqual(validateWorkspace(data));
  });
  it('rejects malformed JSON, unsupported versions, duplicate IDs and broken links without mutating input', () => {
    expect(() => service.importWorkspace('{bad')).toThrow('not valid JSON');
    expect(() => service.importWorkspace(JSON.stringify({ ...emptyWorkspace(), schemaVersion: 99 }))).toThrow('supported');
    const task = makeTask();
    expect(() => service.importWorkspace(JSON.stringify({ ...task.data, tasks: [task.record, task.record] }))).toThrow('duplicate');
    expect(() => service.importWorkspace(JSON.stringify({ ...task.data, tasks: [{ ...task.record, projectId: 'missing' }] }))).toThrow('no longer exists');
    expect(task.data.tasks).toHaveLength(1);
    expect(() => service.importWorkspace('x'.repeat(10 * 1024 * 1024 + 1))).toThrow('10 MB');
  });
  it('handles missing and malformed stored shapes safely', () => {
    expect(() => validateWorkspace(null)).toThrow();
    expect(() => validateWorkspace({ ...emptyWorkspace(), notes: {} })).toThrow('notes');
    const task = makeTask();
    expect(() => validateWorkspace({ ...task.data, tasks: [{ ...task.record, title: 42 }] })).toThrow('text');
    expect(() => validateWorkspace({ ...task.data, preferences: { theme: 'neon' } })).toThrow('theme');
  });
});

describe('local calendar helpers', () => {
  it('uses local calendar days rather than UTC shifting', () => {
    expect(dateKey(new Date(2026, 10, 7, 23, 30))).toBe('2026-11-07');
    expect(dateKey(addDays('2026-12-31', 1))).toBe('2027-01-01');
    expect(isValidDay('2028-02-29')).toBe(true);
    expect(isValidDay('2026-02-29')).toBe(false);
    expect(isValidDay('2026-13-01')).toBe(false);
  });
  it('builds complete weeks and month grids for both week starts', () => {
    expect(dateKey(startOfWeek('2026-11-08', 'monday'))).toBe('2026-11-02');
    expect(dateKey(startOfWeek('2026-11-08', 'sunday'))).toBe('2026-11-08');
    const grid = monthGrid('2026-11-07', 'monday');
    expect(grid.length % 7).toBe(0);
    expect(dateKey(grid[0])).toBe('2026-10-26');
    expect(dateKey(grid.at(-1))).toBe('2026-12-06');
  });
  it('formats timer clocks without negative values', () => {
    expect(clock(1500)).toBe('25:00');
    expect(clock(61.2)).toBe('01:02');
    expect(clock(-5)).toBe('00:00');
  });
});
