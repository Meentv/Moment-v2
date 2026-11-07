import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CheckSquare2, FolderClosed, StickyNote, ArrowRight, CornerDownLeft } from 'lucide-react';
import Modal from './Modal.jsx';
import { EmptyState } from './UI.jsx';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { useDialogs } from '../context/DialogContext.jsx';
import { searchWorkspace } from '../services/workspace.js';

export const RESULT_ICONS = { task: CheckSquare2, project: FolderClosed, note: StickyNote };
export default function SearchDialog({ onClose }) {
  const { data } = useWorkspace();
  const { openTask, openNote } = useDialogs();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const results = useMemo(() => searchWorkspace(data, query), [data, query]);
  const shown = results.slice(0, 8);
  const refs = useRef([]);
  const openResult = (result) => {
    onClose();
    if (result.type === 'task') openTask(result.record);
    else if (result.type === 'note') openNote(result.record);
    else navigate(`/app/projects/${result.id}`);
  };
  const keyDown = (event) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); const next = Math.min(active + 1, shown.length - 1); setActive(Math.max(0, next)); refs.current[Math.max(0, next)]?.focus(); }
    if (event.key === 'ArrowUp') { event.preventDefault(); const next = active - 1; setActive(next); if (next < 0) document.getElementById('global-search-input')?.focus(); else refs.current[next]?.focus(); }
    if (event.key === 'Enter' && shown.length) { event.preventDefault(); openResult(shown[Math.max(0, active)]); }
  };
  return <Modal title="Find your next thing" onClose={onClose} className="search-modal" size="large">
    <div className="search-dialog-input"><Search size={21} /><input id="global-search-input" autoFocus aria-label="Search your workspace" placeholder="Search tasks, projects, and notes…" value={query} onChange={(event) => { setQuery(event.target.value); setActive(0); }} onKeyDown={keyDown} /><kbd>esc</kbd></div>
    <div className="search-dialog-results">
      {!query.trim() ? <EmptyState compact icon={Search} title="Everything, a little easier to find" description="Search by title, description, note text, or tag. Your information stays in this browser." /> : !shown.length ? <EmptyState compact icon={Search} title="No matches just yet" description={`Nothing matched “${query}”. Try a shorter word or a different spelling.`} /> : <><p className="section-kicker">{results.length} RESULT{results.length === 1 ? '' : 'S'} IN YOUR WORKSPACE</p>{shown.map((result, index) => { const Icon = RESULT_ICONS[result.type]; return <button key={`${result.type}-${result.id}`} ref={(element) => { refs.current[index] = element; }} className={`search-result ${active === index ? 'active' : ''}`} onFocus={() => setActive(index)} onClick={() => openResult(result)}><span className={`result-icon type-${result.type}`}><Icon size={19} /></span><span className="result-text"><strong>{result.title}</strong><span>{result.type}{result.description ? ` · ${result.description.slice(0, 90)}` : ''}</span></span><CornerDownLeft size={15} /></button>; })}</>}
    </div>
    <div className="search-dialog-footer"><span><kbd>↑</kbd><kbd>↓</kbd> to navigate <kbd>↵</kbd> to open</span><button className="text-link" onClick={() => { navigate(`/app/search?q=${encodeURIComponent(query)}`); onClose(); }}>Full search<ArrowRight size={14} /></button></div>
  </Modal>;
}
