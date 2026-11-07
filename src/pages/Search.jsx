import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, ArrowUpRight, X, Plus } from 'lucide-react';
import { PageHeading, EmptyState } from '../components/UI.jsx';
import { RESULT_ICONS } from '../components/SearchDialog.jsx';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { useDialogs } from '../context/DialogContext.jsx';
import { searchWorkspace } from '../services/workspace.js';

export default function Search() {
  const { data } = useWorkspace();
  const { openTask, openNote } = useDialogs();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const type = params.get('type') || 'all';
  const all = useMemo(() => searchWorkspace(data, query), [data, query]);
  const results = all.filter((result) => type === 'all' || result.type === type);
  const setParam = (key, value) => setParams((current) => { const next = new URLSearchParams(current); if (!value || value === 'all') next.delete(key); else next.set(key, value); return next; }, { replace: true });
  const open = (result) => { if (result.type === 'task') openTask(result.record); else if (result.type === 'note') openNote(result.record); else navigate(`/app/projects/${result.id}`); };
  return <div className="page-enter"><PageHeading eyebrow="EVERYTHING IN ITS PLACE" title="Find a little clarity" description="One search across your tasks, projects, notes, and ideas." /><div className="full-search-input input-with-icon"><SearchIcon size={21} /><input autoFocus aria-label="Search all workspace content" placeholder="Search by title, detail, or tag…" value={query} onChange={(event) => setParam('q', event.target.value)} />{query && <button className="icon-button small" aria-label="Clear search" onClick={() => setParam('q', '')}><X size={17} /></button>}</div><div className="collection-toolbar"><div className="segmented-tabs" role="tablist" aria-label="Search result type">{[['all', 'Everything'], ['task', 'Tasks'], ['project', 'Projects'], ['note', 'Notes']].map(([value, label]) => <button key={value} role="tab" aria-selected={type === value} className={type === value ? 'active' : ''} onClick={() => setParam('type', value)}>{label}<span>{value === 'all' ? all.length : all.filter((result) => result.type === value).length}</span></button>)}</div>{query && <span className="muted">{results.length} result{results.length === 1 ? '' : 's'}</span>}</div><section className="panel full-search-results">{!query.trim() ? <EmptyState icon={SearchIcon} title="What’s on your mind?" description="Start typing to find anything in your workspace. Try a project name, a task detail, or a note tag." /> : !results.length ? <EmptyState icon={SearchIcon} title="No matches this time" description={`Nothing matched “${query}”${type !== 'all' ? ' in this category' : ''}. Try a shorter word or look in Everything.`} action={<button className="button secondary" onClick={() => setParams({})}>Start a new search</button>} /> : results.map((result) => { const Icon = RESULT_ICONS[result.type]; return <button className="search-result" key={`${result.type}-${result.id}`} onClick={() => open(result)}><span className={`result-icon type-${result.type}`}><Icon size={20} /></span><span className="result-text"><strong>{result.title}</strong><span>{result.type}{result.description ? ` · ${result.description.slice(0, 180)}` : ''}</span></span><ArrowUpRight size={17} /></button>; })}</section></div>;
}
