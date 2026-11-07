import { makeId, emptyWorkspace } from './model.js';
import { validateWorkspace, validateTask, validateProject, validateNote, validateSession, validatePreferences, ValidationError } from './validation.js';
import { dateKey } from './dates.js';

const now = () => new Date().toISOString();
const result = (data, record, extra = {}) => ({ data: validateWorkspace(data), record, ...extra });

export function listTasks(data) { return data.tasks; }
export function listProjects(data) { return data.projects; }
export function listNotes(data) { return data.notes; }

export function createTask(data, input) {
  const timestamp = now();
  const record = validateTask({ id: makeId(), status: 'todo', priority: 'medium', ...input, createdAt: timestamp, updatedAt: timestamp }, data.projects);
  return result({ ...data, tasks: [record, ...data.tasks] }, record);
}
export function updateTask(data, id, patch) {
  const previous = data.tasks.find((task) => task.id === id);
  if (!previous) throw new ValidationError('This task no longer exists.');
  const record = validateTask({ ...previous, ...patch, id, updatedAt: now() }, data.projects);
  return result({ ...data, tasks: data.tasks.map((task) => task.id === id ? record : task) }, record);
}
export function restoreTask(data, record) {
  const task = validateTask({ ...record, projectId: data.projects.some((project) => project.id === record.projectId) ? record.projectId : null }, data.projects);
  if (data.tasks.some((item) => item.id === task.id)) return { data, record: task };
  return result({ ...data, tasks: [task, ...data.tasks] }, task);
}
export function deleteTask(data, id) {
  const record = data.tasks.find((task) => task.id === id);
  if (!record) throw new ValidationError('This task no longer exists.');
  return result({ ...data, tasks: data.tasks.filter((task) => task.id !== id), focusSessions: data.focusSessions.map((session) => session.taskId === id ? { ...session, taskId: null } : session) }, record);
}

export function createProject(data, input) {
  const timestamp = now();
  const record = validateProject({ id: makeId(), color: 'rose', status: 'active', ...input, createdAt: timestamp, updatedAt: timestamp });
  return result({ ...data, projects: [record, ...data.projects] }, record);
}
export function updateProject(data, id, patch) {
  const previous = data.projects.find((project) => project.id === id);
  if (!previous) throw new ValidationError('This project no longer exists.');
  const status = patch.status ?? previous.status;
  const record = validateProject({ ...previous, ...patch, id, updatedAt: now(), archivedAt: status === 'archived' ? previous.archivedAt || now() : null });
  return result({ ...data, projects: data.projects.map((project) => project.id === id ? record : project) }, record);
}
export function deleteProject(data, id) {
  const record = data.projects.find((project) => project.id === id);
  if (!record) throw new ValidationError('This project no longer exists.');
  return result({ ...data, projects: data.projects.filter((project) => project.id !== id), tasks: data.tasks.map((task) => task.projectId === id ? { ...task, projectId: null, updatedAt: now() } : task), focusSessions: data.focusSessions.map((session) => session.projectId === id ? { ...session, projectId: null } : session) }, record);
}

export function createNote(data, input) {
  const timestamp = now();
  const record = validateNote({ id: makeId(), title: '', body: '', tags: [], pinned: false, ...input, createdAt: timestamp, updatedAt: timestamp });
  return result({ ...data, notes: [record, ...data.notes] }, record);
}
export function updateNote(data, id, patch) {
  const previous = data.notes.find((note) => note.id === id);
  if (!previous) throw new ValidationError('This note no longer exists.');
  const record = validateNote({ ...previous, ...patch, id, updatedAt: now() });
  return result({ ...data, notes: data.notes.map((note) => note.id === id ? record : note) }, record);
}
export function restoreNote(data, record) {
  const note = validateNote(record);
  if (data.notes.some((item) => item.id === note.id)) return { data, record: note };
  return result({ ...data, notes: [note, ...data.notes] }, note);
}
export function deleteNote(data, id) {
  const record = data.notes.find((note) => note.id === id);
  if (!record) throw new ValidationError('This note no longer exists.');
  return result({ ...data, notes: data.notes.filter((note) => note.id !== id) }, record);
}

export function recordFocusSession(data, input) {
  if (data.focusSessions.some((session) => session.id === input.id)) return { data, record: data.focusSessions.find((session) => session.id === input.id) };
  const record = validateSession(input, data.tasks, data.projects);
  return result({ ...data, focusSessions: [record, ...data.focusSessions] }, record);
}
export function updatePreferences(data, patch) {
  return result({ ...data, preferences: validatePreferences({ ...data.preferences, ...patch }) }, data.preferences);
}
export function deleteWorkspace() { return { data: emptyWorkspace(), record: null }; }

export function exportWorkspace(data) {
  return JSON.stringify({ application: 'MOMENT', exportedAt: now(), ...validateWorkspace(data) }, null, 2);
}
export function importWorkspace(json) {
  if (typeof json !== 'string' || json.length > 10 * 1024 * 1024) throw new ValidationError('Choose a JSON backup smaller than 10 MB.');
  let parsed;
  try { parsed = JSON.parse(json); } catch { throw new ValidationError('This file is not valid JSON. Your existing data has not been changed.'); }
  if (parsed?.application && parsed.application !== 'MOMENT') throw new ValidationError('This backup belongs to a different application.');
  return validateWorkspace(parsed);
}

export function projectProgress(data, projectId) {
  const tasks = data.tasks.filter((task) => task.projectId === projectId);
  const completed = tasks.filter((task) => task.status === 'completed').length;
  return { total: tasks.length, completed, percent: tasks.length ? Math.round(completed / tasks.length * 100) : 0 };
}

export function searchWorkspace(data, query) {
  const term = query.trim().toLocaleLowerCase();
  if (!term) return [];
  const matches = (value) => value.toLocaleLowerCase().includes(term);
  return [
    ...data.tasks.filter((task) => matches(`${task.title} ${task.description}`)).map((record) => ({ type: 'task', id: record.id, title: record.title, description: record.description, record })),
    ...data.projects.filter((project) => matches(`${project.name} ${project.description}`)).map((record) => ({ type: 'project', id: record.id, title: record.name, description: record.description, record })),
    ...data.notes.filter((note) => matches(`${note.title} ${note.body} ${note.tags.join(' ')}`)).map((record) => ({ type: 'note', id: record.id, title: record.title || 'Untitled note', description: record.body, record })),
  ].sort((a, b) => (b.record.updatedAt || '').localeCompare(a.record.updatedAt || ''));
}

export function sortTasks(tasks, sort = 'created-desc') {
  return [...tasks].sort((a, b) => {
    if (sort === 'due-asc') return (a.dueDate || '9999').localeCompare(b.dueDate || '9999') || b.createdAt.localeCompare(a.createdAt);
    if (sort === 'due-desc') return (b.dueDate || '').localeCompare(a.dueDate || '') || b.createdAt.localeCompare(a.createdAt);
    if (sort === 'priority') return ['high', 'medium', 'low'].indexOf(a.priority) - ['high', 'medium', 'low'].indexOf(b.priority) || b.createdAt.localeCompare(a.createdAt);
    if (sort === 'created-asc') return a.createdAt.localeCompare(b.createdAt);
    if (sort === 'title') return a.title.localeCompare(b.title);
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function filterTasks(tasks, filters = {}) {
  const today = filters.today || dateKey();
  return tasks.filter((task) => {
    if (filters.status && filters.status !== 'all' && task.status !== filters.status) return false;
    if (filters.priority && filters.priority !== 'all' && task.priority !== filters.priority) return false;
    if (filters.projectId && filters.projectId !== 'all' && task.projectId !== filters.projectId) return false;
    if (filters.query && !`${task.title} ${task.description}`.toLowerCase().includes(filters.query.toLowerCase().trim())) return false;
    if (filters.date === 'today' && task.dueDate !== today) return false;
    if (filters.date === 'overdue' && (!task.dueDate || task.dueDate >= today || task.status === 'completed')) return false;
    if (filters.date === 'upcoming' && (!task.dueDate || task.dueDate <= today)) return false;
    if (filters.date === 'unscheduled' && task.dueDate) return false;
    if (filters.date === 'week' && (!task.dueDate || task.dueDate < today || task.dueDate > (filters.weekEnd || today))) return false;
    return true;
  });
}
