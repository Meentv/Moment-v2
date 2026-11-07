export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = 'moment:v2:workspace';
export const TIMER_KEY = 'moment:v2:focus';
export const RECOVERY_PREFIX = 'moment:v2:recovery:';
export const TASK_STATUSES = ['todo', 'in-progress', 'completed'];
export const PRIORITIES = ['low', 'medium', 'high'];
export const PROJECT_STATUSES = ['active', 'on-hold', 'completed', 'archived'];
export const PROJECT_COLORS = [
  { id: 'rose', name: 'Rose', value: '#C94363' },
  { id: 'coral', name: 'Coral', value: '#D66650' },
  { id: 'amber', name: 'Amber', value: '#A66B16' },
  { id: 'sage', name: 'Sage', value: '#32856A' },
  { id: 'blue', name: 'Blue', value: '#3976AC' },
  { id: 'slate', name: 'Slate', value: '#697183' },
];
export const STATUS_LABELS = { todo: 'To do', 'in-progress': 'In progress', completed: 'Completed' };
export const PROJECT_STATUS_LABELS = { active: 'Active', 'on-hold': 'On hold', completed: 'Completed', archived: 'Archived' };
export const DEFAULT_PREFERENCES = {
  theme: 'light', weekStart: 'monday', focusMinutes: 25, breakMinutes: 5,
  autoStartBreak: false, displayName: '',
};

export function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function emptyWorkspace() {
  return { schemaVersion: SCHEMA_VERSION, tasks: [], projects: [], notes: [], focusSessions: [], preferences: { ...DEFAULT_PREFERENCES } };
}

export function colorValue(id) {
  return PROJECT_COLORS.find((color) => color.id === id)?.value || PROJECT_COLORS[0].value;
}
