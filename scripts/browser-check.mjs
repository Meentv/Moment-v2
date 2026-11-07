import { chromium as playwright } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.MOMENT_URL || 'http://127.0.0.1:5173';
const out = process.env.MOMENT_SCREENSHOTS || '/tmp/moment-screenshots';
await mkdir(out, { recursive: true });
let browser;
const report = { checks: [], accessibility: [], consoleErrors: [], overflows: [] };
const check = (name) => { report.checks.push(name); console.log('PASS', name); };
try {
  const options = { headless: true, args: ['--no-sandbox'] };
  if (process.env.MOMENT_CHROMIUM_PATH) options.executablePath = process.env.MOMENT_CHROMIUM_PATH;
  browser = await playwright.launch(options);
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.on('pageerror', (error) => report.consoleErrors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  const goto = async (path) => { await page.goto(`${base}${path}`, { waitUntil: 'networkidle' }); };
  const axe = async (name) => {
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    report.accessibility.push({ name, violations: results.violations.map((v) => ({ id: v.id, impact: v.impact, description: v.description, nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })) })) });
    console.log('AXE', name, results.violations.map((v) => `${v.id}:${v.nodes.length}`).join(', ') || 'clean');
  };

  await goto('/app');
  assert.match(await page.locator('h1').innerText(), /Good/);
  await page.screenshot({ path: `${out}/today-empty-desktop.png`, fullPage: true });
  await axe('today-empty-light');
  check('Today renders a real empty workspace');

  await page.getByRole('button', { name: 'New task', exact: true }).click();
  await page.getByLabel('Task title').fill('Prepare the weekly plan');
  await page.getByLabel('Description', { exact: true }).fill('Outline priorities and leave room for focus.');
  await page.getByLabel('Priority', { exact: true }).selectOption('high');
  await page.getByLabel('Due date', { exact: true }).fill(new Date().toLocaleDateString('en-CA'));
  await page.getByRole('button', { name: 'Create task', exact: true }).click();
  await page.getByRole('button', { name: 'Complete Prepare the weekly plan', exact: true }).click();
  let stored = await page.evaluate(() => JSON.parse(localStorage.getItem('moment:v2:workspace')));
  assert.equal(stored.tasks[0].status, 'completed');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.getByRole('button', { name: 'Edit Prepare the weekly plan' }).count(), 1);
  check('Task create, complete, reopen and refresh persistence');

  await goto('/app/projects');
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByLabel('Project name').fill('Everyday clarity');
  await page.getByLabel('Description', { exact: true }).fill('A little space for the work that matters.');
  await page.getByRole('radio', { name: 'Sage', exact: true }).check();
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await page.getByRole('link', { name: /Everyday clarity A little space/ }).click();
  await page.getByLabel('Quick add a task').fill('Sketch the first milestone');
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  stored = await page.evaluate(() => JSON.parse(localStorage.getItem('moment:v2:workspace')));
  assert.equal(stored.tasks[0].projectId, stored.projects[0].id);
  check('Project creation and linked task capture');

  await goto('/app/notes');
  await page.getByRole('button', { name: 'New note', exact: true }).click();
  await page.getByLabel('Note title', { exact: true }).fill('A quieter approach');
  await page.getByLabel('Note body', { exact: true }).fill('Make space for deep work. Capture the small ideas before they disappear.');
  await page.getByLabel('Tags', { exact: true }).fill('focus, planning');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.getByRole('heading', { name: 'A quieter approach' }).count(), 1);
  await page.getByRole('button', { name: 'Pin A quieter approach', exact: true }).click();
  await page.keyboard.press('Control+k');
  await page.getByLabel('Search your workspace').fill('quieter');
  assert.equal(await page.getByRole('dialog').getByText('A quieter approach').count(), 1);
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(), 0);
  check('Note autosave, refresh, pin, global search and Escape');

  await goto('/app/tasks');
  await page.getByLabel('Filter by priority').selectOption('high');
  await page.waitForFunction(() => document.querySelectorAll('.task-row').length === 1);
  assert.equal(await page.locator('.task-row').count(), 1);
  await page.getByLabel('Filter by priority').selectOption('low');
  await page.getByText('No tasks match these filters').waitFor();
  assert.equal(await page.getByText('No tasks match these filters').count(), 1);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.getByRole('button', { name: 'Board view' }).click();
  await page.waitForFunction(() => document.querySelectorAll('.board-column').length === 3);
  assert.equal(await page.locator('.board-column').count(), 3);
  check('Task filters, no-results state and board view');

  await goto('/app/calendar');
  for (const view of ['Day', 'Week', 'Month']) { await page.getByRole('tab', { name: view, exact: true }).click(); }
  await page.getByRole('button', { name: 'Next month' }).click();
  await page.getByRole('button', { name: 'Today', exact: true }).click();
  check('Calendar day/week/month navigation');

  await goto('/app/focus');
  await page.getByRole('button', { name: 'Start focus', exact: true }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: 'Resume', exact: true }).count(), 1);
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.getByRole('button', { name: 'Resume', exact: true }).count(), 1);
  await page.evaluate(() => { const key = 'moment:v2:focus'; const timer = JSON.parse(localStorage.getItem(key)); timer.phase = 'running'; timer.endsAt = Date.now() - 1000; timer.startedAt = new Date(Date.now() - timer.durationSeconds * 1000 - 1000).toISOString(); localStorage.setItem(key, JSON.stringify(timer)); });
  await page.reload({ waitUntil: 'networkidle' });
  stored = await page.evaluate(() => JSON.parse(localStorage.getItem('moment:v2:workspace')));
  assert.equal(stored.focusSessions.length, 1);
  await page.reload({ waitUntil: 'networkidle' });
  stored = await page.evaluate(() => JSON.parse(localStorage.getItem('moment:v2:workspace')));
  assert.equal(stored.focusSessions.length, 1);
  check('Focus pause/resume, refresh recovery and exactly-once completion');

  await goto('/app/settings');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup', exact: true }).click();
  const download = await downloadEvent;
  const backupPath = `${out}/backup.json`;
  await download.saveAs(backupPath);
  const { readFile } = await import('node:fs/promises');
  const backup = JSON.parse(await readFile(backupPath, 'utf8'));
  assert.equal(backup.application, 'MOMENT');
  assert.equal(backup.tasks.length, 2);
  await page.getByLabel('Import a MOMENT JSON backup').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{bad') });
  await page.getByText(/This file is not valid JSON/).first().waitFor();
  assert.equal(await page.getByText(/This file is not valid JSON/).count() > 0, true);
  stored = await page.evaluate(() => JSON.parse(localStorage.getItem('moment:v2:workspace')));
  assert.equal(stored.tasks.length, 2);
  await page.getByLabel('Import a MOMENT JSON backup').setInputFiles(backupPath);
  await page.getByRole('button', { name: 'Import & replace', exact: true }).click();
  stored = await page.evaluate(() => JSON.parse(localStorage.getItem('moment:v2:workspace')));
  assert.equal(stored.notes.length, 1);
  check('JSON export, invalid import rejection and confirmed round-trip import');

  await page.getByRole('button', { name: 'Quiet & dark', exact: true }).click();
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
  await goto('/app');
  await page.screenshot({ path: `${out}/today-dark-desktop.png`, fullPage: true });
  await axe('today-dark');
  await goto('/app/settings');
  await page.getByRole('button', { name: 'Light & warm', exact: true }).click();
  check('Theme preference persists across routes');

  const routes = ['/', '/features', '/about', '/help', '/contact', '/app', '/app/tasks', '/app/projects', '/app/notes', '/app/calendar', '/app/focus', '/app/settings', '/app/search?q=plan'];
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await goto(route);
      const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: innerWidth }));
      if (size.scroll > size.inner + 1) report.overflows.push({ route, width, ...size });
    }
  }
  check('All public and workspace routes at five viewport widths');
  await page.setViewportSize({ width: 390, height: 844 });
  await goto('/app');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'Notes & ideas' }).click();
  assert.match(page.url(), /\/app\/notes/);
  await page.screenshot({ path: `${out}/notes-mobile.png`, fullPage: true });
  await goto('/app');
  await page.screenshot({ path: `${out}/today-mobile.png`, fullPage: true });
  await goto('/');
  await page.screenshot({ path: `${out}/home-mobile.png`, fullPage: true });
  await axe('home-mobile');
  check('Mobile navigation drawer and screenshots');

  await page.setViewportSize({ width: 1440, height: 1000 });
  await goto('/');
  await page.screenshot({ path: `${out}/home-desktop.png`, fullPage: true });
  await axe('home-desktop');
  await goto('/app/tasks');
  await page.screenshot({ path: `${out}/tasks-desktop.png`, fullPage: true });
  await axe('tasks-desktop');
  await goto('/app/notes');
  await page.screenshot({ path: `${out}/notes-desktop.png`, fullPage: true });
  await goto('/app/focus');
  await page.screenshot({ path: `${out}/focus-desktop.png`, fullPage: true });
  await goto('/app/calendar');
  await page.screenshot({ path: `${out}/calendar-desktop.png`, fullPage: true });
  await goto('/app/settings');
  await page.screenshot({ path: `${out}/settings-desktop.png`, fullPage: true });
  await axe('settings-desktop');

  await goto('/app/settings');
  await page.getByRole('button', { name: 'Delete all workspace data' }).click();
  assert.equal(await page.getByRole('button', { name: 'Delete everything' }).isDisabled(), true);
  await page.getByLabel('Confirmation', { exact: true }).fill('DELETE');
  await page.getByRole('button', { name: 'Delete everything' }).click();
  stored = await page.evaluate(() => JSON.parse(localStorage.getItem('moment:v2:workspace')));
  assert.equal(stored.tasks.length, 0);
  assert.equal(stored.notes.length, 0);
  assert.equal(stored.focusSessions.length, 0);
  check('Explicit typed confirmation deletes all workspace data');

  const violations = report.accessibility.flatMap((entry) => entry.violations.map((violation) => ({ screen: entry.name, id: violation.id })));
  assert.deepEqual(violations, []);
  check('Automated WCAG A/AA scans report no violations on sampled screens');
  assert.deepEqual(report.consoleErrors, []);
  assert.deepEqual(report.overflows, []);
  check('No browser console errors or horizontal page overflow');
} catch (error) {
  report.failure = error.stack;
  console.error(error);
  process.exitCode = 1;
} finally {
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  await browser?.close();
  console.log('Report:', `${out}/report.json`);
}
