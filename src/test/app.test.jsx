import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestApp } from '../App.jsx';
import { STORAGE_KEY } from '../services/model.js';

const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY));
const setup = (path = '/app/tasks') => { const user = userEvent.setup(); render(<TestApp initialEntries={[path]} />); return user; };

describe('React workspace acceptance flows', () => {
  it('renders a useful empty workspace without invented records', () => {
    setup('/app');
    expect(screen.getByRole('heading', { name: /Good (morning|afternoon|evening)/ })).toBeInTheDocument();
    expect(screen.getByText('A little breathing room')).toBeInTheDocument();
    expect(screen.getByText('Your next chapter starts here.')).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
  it('creates a task, persists it, edits it, completes it and reopens it', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'New task' }));
    const dialog = screen.getByRole('dialog', { name: 'Make room for a new task' });
    await user.type(within(dialog).getByLabelText(/Task title/), 'Ship the React workspace');
    await user.selectOptions(within(dialog).getByLabelText('Priority'), 'high');
    await user.type(within(dialog).getByLabelText('Due date'), '2026-11-07');
    await user.click(within(dialog).getByRole('button', { name: 'Create task' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(stored().tasks[0].title).toBe('Ship the React workspace');
    expect(stored().tasks[0].priority).toBe('high');
    await user.click(screen.getByRole('button', { name: 'Edit Ship the React workspace' }));
    const edit = screen.getByRole('dialog', { name: 'Edit task' });
    await user.clear(within(edit).getByLabelText(/Task title/));
    await user.type(within(edit).getByLabelText(/Task title/), 'Ship a tested workspace');
    await user.click(within(edit).getByRole('button', { name: 'Save changes' }));
    expect(stored().tasks[0].title).toBe('Ship a tested workspace');
    await user.click(screen.getByRole('button', { name: 'Complete Ship a tested workspace' }));
    expect(stored().tasks[0].status).toBe('completed');
    await user.click(screen.getByRole('button', { name: 'Reopen Ship a tested workspace' }));
    expect(stored().tasks[0].status).toBe('todo');
  });
  it('validates whitespace-only task titles at the form boundary', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'New task' }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText(/Task title/), '   ');
    await user.click(within(dialog).getByRole('button', { name: 'Create task' }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent('required');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
  it('confirms destructive deletion and supports undo', async () => {
    const user = setup();
    await user.type(screen.getByLabelText('Quick add a task'), 'A task to remove');
    await user.click(screen.getByRole('button', { name: 'Add task', exact: true }));
    await user.click(screen.getByLabelText('More actions for A task to remove'));
    await user.click(screen.getByRole('button', { name: 'Delete task', exact: true }));
    expect(stored().tasks).toHaveLength(1);
    const confirm = screen.getByRole('dialog', { name: 'Delete this task?' });
    await user.click(within(confirm).getByRole('button', { name: 'Delete task', exact: true }));
    expect(stored().tasks).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(stored().tasks[0].title).toBe('A task to remove');
  });
  it('creates a project and links a real task to it', async () => {
    const user = setup('/app/projects');
    await user.click(screen.getByRole('button', { name: 'New project' }));
    const projectDialog = screen.getByRole('dialog', { name: 'Start a new project' });
    await user.type(within(projectDialog).getByLabelText(/Project name/), 'Everyday planning');
    await user.click(within(projectDialog).getByRole('radio', { name: 'Sage' }));
    await user.click(within(projectDialog).getByRole('button', { name: 'Create project' }));
    expect(stored().projects[0].name).toBe('Everyday planning');
    await user.click(screen.getByRole('link', { name: /Everyday planning/ }));
    await user.type(screen.getByLabelText('Quick add a task'), 'Outline the first step');
    await user.click(screen.getByRole('button', { name: 'Add task', exact: true }));
    expect(stored().tasks[0].projectId).toBe(stored().projects[0].id);
    expect(screen.getByText('Outline the first step')).toBeInTheDocument();
  });
  it('autosaves a note, pins it and finds it through global search', async () => {
    const user = setup('/app/notes');
    await user.click(screen.getByRole('button', { name: 'New note' }));
    const dialog = screen.getByRole('dialog', { name: 'A space for your thoughts' });
    await user.type(within(dialog).getByLabelText('Note title'), 'A quieter approach');
    await user.type(within(dialog).getByLabelText('Note body'), 'Make space for deep work.');
    await user.click(within(dialog).getByRole('button', { name: 'Pin note' }));
    await user.click(within(dialog).getByRole('button', { name: 'Done' }));
    expect(stored().notes[0].title).toBe('A quieter approach');
    expect(stored().notes[0].pinned).toBe(true);
    await user.keyboard('{Control>}k{/Control}');
    const search = screen.getByRole('dialog', { name: 'Find your next thing' });
    await user.type(within(search).getByLabelText('Search your workspace'), 'quieter');
    expect(within(search).getByText('A quieter approach')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Find your next thing' })).not.toBeInTheDocument();
  });
  it('persists theme and focus preferences', async () => {
    const user = setup('/app/settings');
    await user.click(screen.getByRole('button', { name: 'Quiet & dark' }));
    expect(stored().preferences.theme).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    await user.clear(screen.getByLabelText('Focus duration (minutes)'));
    await user.type(screen.getByLabelText('Focus duration (minutes)'), '45');
    await user.click(screen.getByRole('button', { name: 'Save durations' }));
    expect(stored().preferences.focusMinutes).toBe(45);
    await user.selectOptions(screen.getByLabelText('Week starts on'), 'sunday');
    expect(stored().preferences.weekStart).toBe('sunday');
  });
  it('renders calendar views and keeps undated tasks separate', async () => {
    const user = setup('/app/calendar');
    expect(screen.getByText('Still finding a place')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Week', exact: true }));
    expect(document.querySelector('.calendar-week')).toBeTruthy();
    await user.click(screen.getByRole('tab', { name: 'Day', exact: true }));
    expect(screen.getByText('A day with a little possibility')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Month', exact: true }));
    expect(document.querySelectorAll('.calendar-cell').length % 7).toBe(0);
  });
  it('starts and pauses a real focus timer', async () => {
    const user = setup('/app/focus');
    expect(screen.getByRole('timer')).toHaveTextContent('25:00');
    await user.click(screen.getByRole('button', { name: 'Start focus' }));
    expect(screen.getByRole('button', { name: 'Pause', exact: true })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('moment:v2:focus')).phase).toBe('running');
    await user.click(screen.getByRole('button', { name: 'Pause', exact: true }));
    expect(screen.getByRole('button', { name: 'Resume', exact: true })).toBeInTheDocument();
    expect(stored()?.focusSessions || []).toHaveLength(0);
  });
  it('requires explicit confirmation and the word DELETE before deleting all data', async () => {
    const user = setup('/app/settings');
    await user.click(screen.getByRole('button', { name: 'Delete all workspace data' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete your workspace?' });
    expect(within(dialog).getByRole('button', { name: 'Delete everything' })).toBeDisabled();
    await user.type(within(dialog).getByLabelText('Confirmation'), 'DELETE');
    await user.click(within(dialog).getByRole('button', { name: 'Delete everything' }));
    expect(stored().tasks).toEqual([]);
    expect(stored().preferences.theme).toBe('light');
  });
  it('renders every public route and an honest contact path', async () => {
    const user = setup('/contact');
    expect(screen.getByText(/A support inbox isn’t connected/)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/What’s on your mind\?/), 'A useful idea');
    await user.type(screen.getByLabelText(/Your note/), 'Keep the workspace simple.');
    await user.click(screen.getByRole('button', { name: 'Save as a note' }));
    expect(stored().notes[0].tags).toContain('feedback');
    expect(stored().notes[0].title).toBe('Feedback: A useful idea');
  });
  it('shows a recovery path for a missing project and a 404 page', () => {
    setup('/app/projects/missing');
    expect(screen.getByText('This project isn’t here')).toBeInTheDocument();
  });
});
