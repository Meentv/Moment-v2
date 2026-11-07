import { SCHEMA_VERSION, TASK_STATUSES, PRIORITIES, PROJECT_STATUSES, PROJECT_COLORS, DEFAULT_PREFERENCES } from './model.js';
import { isValidDay } from './dates.js';

export class ValidationError extends Error {
  constructor(message, fields = {}) { super(message); this.name = 'ValidationError'; this.fields = fields; }
}

function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function text(value, label, max, required = false) {
  if (value === undefined || value === null) value = '';
  if (typeof value !== 'string') throw new ValidationError(`${label} must be text.`);
  const result = value.trim();
  if (required && !result) throw new ValidationError(`${label} is required.`, { [label === 'Task title' ? 'title' : 'name']: `${label} is required.` });
  if (result.length > max) throw new ValidationError(`${label} must be ${max.toLocaleString()} characters or fewer.`);
  return result;
}
function id(value, label = 'ID') {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(value)) throw new ValidationError(`${label} is invalid.`);
  return value;
}
function timestamp(value, label) {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) throw new ValidationError(`${label} is invalid.`);
  return new Date(value).toISOString();
}
function choice(value, options, label) {
  if (!options.includes(value)) throw new ValidationError(`Choose a valid ${label}.`);
  return value;
}
function integer(value, min, max, label) {
  if (!Number.isInteger(value) || value < min || value > max) throw new ValidationError(`${label} must be a whole number between ${min} and ${max}.`);
  return value;
}
function reference(value, collection, label) {
  if (value === null || value === undefined || value === '') return null;
  const result = id(value, label);
  if (!collection.some((item) => item.id === result)) throw new ValidationError(`The selected ${label} no longer exists.`);
  return result;
}

export function validatePreferences(input = {}) {
  if (!object(input)) throw new ValidationError('Preferences must be an object.');
  const value = { ...DEFAULT_PREFERENCES, ...input };
  return {
    theme: choice(value.theme, ['light', 'dark', 'system'], 'theme'),
    weekStart: choice(value.weekStart, ['monday', 'sunday'], 'week start'),
    focusMinutes: integer(value.focusMinutes, 1, 180, 'Focus duration'),
    breakMinutes: integer(value.breakMinutes, 1, 60, 'Break duration'),
    autoStartBreak: typeof value.autoStartBreak === 'boolean' ? value.autoStartBreak : false,
    displayName: text(value.displayName, 'Display name', 60),
  };
}

export function validateTask(input, projects = []) {
  if (!object(input)) throw new ValidationError('Task must be an object.');
  const status = choice(input.status ?? 'todo', TASK_STATUSES, 'task status');
  if (input.dueDate && !isValidDay(input.dueDate)) throw new ValidationError('Choose a valid due date between 1900 and 2200.', { dueDate: 'Choose a valid date.' });
  return {
    id: id(input.id), title: text(input.title, 'Task title', 200, true),
    description: text(input.description, 'Description', 10000),
    status, priority: choice(input.priority ?? 'medium', PRIORITIES, 'priority'),
    dueDate: input.dueDate ? choice(input.dueDate, [input.dueDate], 'due date') : '',
    projectId: reference(input.projectId, projects, 'project'),
    createdAt: timestamp(input.createdAt, 'Created date'), updatedAt: timestamp(input.updatedAt, 'Updated date'),
    completedAt: status === 'completed' ? timestamp(input.completedAt || input.updatedAt, 'Completion date') : null,
  };
}

export function validateProject(input) {
  if (!object(input)) throw new ValidationError('Project must be an object.');
  return {
    id: id(input.id), name: text(input.name, 'Project name', 100, true),
    description: text(input.description, 'Description', 5000),
    color: choice(input.color ?? 'rose', PROJECT_COLORS.map((color) => color.id), 'project colour'),
    status: choice(input.status ?? 'active', PROJECT_STATUSES, 'project status'),
    startDate: input.startDate || '', endDate: input.endDate || '',
    createdAt: timestamp(input.createdAt, 'Created date'), updatedAt: timestamp(input.updatedAt, 'Updated date'),
    archivedAt: input.archivedAt ? timestamp(input.archivedAt, 'Archive date') : null,
    ...((input.startDate && !isValidDay(input.startDate)) || (input.endDate && !isValidDay(input.endDate)) ? (() => { throw new ValidationError('Choose valid project dates between 1900 and 2200.'); })() : {}),
    ...(input.startDate && input.endDate && input.endDate < input.startDate ? (() => { throw new ValidationError('The end date must be on or after the start date.', { endDate: 'End date cannot be before start date.' }); })() : {}),
  };
}

export function validateNote(input) {
  if (!object(input)) throw new ValidationError('Note must be an object.');
  if (input.tags !== undefined && !Array.isArray(input.tags)) throw new ValidationError('Tags must be a list.');
  const title = text(input.title, 'Note title', 200);
  const body = text(input.body, 'Note body', 100000);
  if (!title && !body) throw new ValidationError('Add a title or some text before saving your note.');
  const tags = [...new Set((input.tags || []).map((tag) => text(tag, 'Tag', 30, true).toLowerCase()))];
  if (tags.length > 12) throw new ValidationError('Use no more than 12 tags per note.');
  return {
    id: id(input.id), title, body, tags, pinned: input.pinned === true,
    createdAt: timestamp(input.createdAt, 'Created date'), updatedAt: timestamp(input.updatedAt, 'Updated date'),
  };
}

export function validateSession(input, tasks = [], projects = []) {
  if (!object(input)) throw new ValidationError('Focus session must be an object.');
  const session = {
    id: id(input.id), startedAt: timestamp(input.startedAt, 'Session start'), endedAt: timestamp(input.endedAt, 'Session end'),
    durationSeconds: integer(input.durationSeconds, 1, 10800, 'Session duration'),
    taskId: reference(input.taskId, tasks, 'task'), projectId: reference(input.projectId, projects, 'project'),
  };
  if (Date.parse(session.endedAt) < Date.parse(session.startedAt)) throw new ValidationError('Session end cannot be before its start.');
  return session;
}

export function validateWorkspace(input) {
  if (!object(input) || input.schemaVersion !== SCHEMA_VERSION) throw new ValidationError('This is not a supported MOMENT v2 backup. Choose a JSON backup exported from this app.');
  for (const key of ['tasks', 'projects', 'notes', 'focusSessions']) {
    if (!Array.isArray(input[key])) throw new ValidationError(`The backup is missing a valid ${key} list.`);
    if (input[key].length > 20000) throw new ValidationError('This backup is too large. The limit is 20,000 items per collection.');
  }
  const projects = input.projects.map(validateProject);
  const tasks = input.tasks.map((task) => validateTask(task, projects));
  const notes = input.notes.map(validateNote);
  const focusSessions = input.focusSessions.map((session) => validateSession(session, tasks, projects));
  for (const collection of [projects, tasks, notes, focusSessions]) {
    if (new Set(collection.map((item) => item.id)).size !== collection.length) throw new ValidationError('The backup contains duplicate record IDs. No data has been changed.');
  }
  return { schemaVersion: SCHEMA_VERSION, tasks, projects, notes, focusSessions, preferences: validatePreferences(input.preferences) };
}

export function parseTags(value) {
  return [...new Set(value.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}
