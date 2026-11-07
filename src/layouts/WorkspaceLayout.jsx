import { useEffect, useState } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { Sun, CheckSquare2, FolderClosed, StickyNote, CalendarDays, Timer, Settings2, Search, ChevronRight, Menu, ShieldCheck, ArrowUpRight, Sparkles, X, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { Brand, SaveIndicator } from '../components/UI.jsx';
import Modal from '../components/Modal.jsx';
import SearchDialog from '../components/SearchDialog.jsx';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { useDialogs } from '../context/DialogContext.jsx';
import { dateKey, formatDate } from '../services/dates.js';
import { downloadText } from '../lib/download.js';
import { exportWorkspace } from '../services/workspace.js';

const navigation = [
  { to: '/app', label: 'Today', icon: Sun },
  { to: '/app/tasks', label: 'Tasks', icon: CheckSquare2 },
  { to: '/app/projects', label: 'Projects', icon: FolderClosed },
  { to: '/app/notes', label: 'Notes & ideas', icon: StickyNote },
  { to: '/app/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/app/focus', label: 'Focus', icon: Timer },
];
const pageNames = { tasks: 'Tasks', projects: 'Projects', notes: 'Notes & ideas', calendar: 'Calendar', focus: 'Focus', settings: 'Settings', search: 'Search' };
function Navigation({ onNavigate }) {
  const { data } = useWorkspace();
  const todayCount = data.tasks.filter((task) => task.dueDate === dateKey() && task.status !== 'completed').length;
  return <nav aria-label="Workspace navigation" className="sidebar-nav">{navigation.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/app'} onClick={onNavigate} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Icon size={19} strokeWidth={1.7} /><span>{label}</span>{to === '/app/tasks' && data.tasks.filter((task) => task.status !== 'completed').length > 0 && <span className="nav-count">{data.tasks.filter((task) => task.status !== 'completed').length}</span>}{to === '/app' && todayCount > 0 && <span className="nav-dot" />}</NavLink>)}</nav>;
}
function SidebarContent({ onNavigate }) {
  const { data } = useWorkspace();
  const name = data.preferences.displayName;
  return <><Link to="/" className="sidebar-brand" aria-label="MOMENT home" onClick={onNavigate}><Brand /><span className="version-label">V2</span></Link><div className="workspace-switch"><span className="workspace-avatar">M</span><div><strong>Personal workspace</strong><span>A little space, just for you</span></div></div><p className="nav-section-label">WORKSPACE</p><Navigation onNavigate={onNavigate} /><div className="sidebar-bottom"><div className="sidebar-note"><span className="sidebar-spark"><Sparkles size={19} /></span><h3>Less noise.<br />More moment.</h3><p>Make everything simple<br />with focus.</p><Link to="/app/focus" onClick={onNavigate}>Find your focus<ArrowUpRight size={14} /></Link><span className="note-decoration" aria-hidden="true" /></div><NavLink to="/app/settings" onClick={onNavigate} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Settings2 size={19} strokeWidth={1.7} /><span>Settings</span></NavLink><Link to="/help" className="nav-item" onClick={onNavigate}><ShieldCheck size={18} /><span>Help & privacy</span><ArrowUpRight size={13} /></Link><div className="sidebar-profile"><span className="profile-avatar">{name ? name[0].toUpperCase() : 'M'}</span><div><strong>{name || 'Your personal space'}</strong><span><span className="local-dot" />Local workspace</span></div><Link to="/app/settings" className="icon-button small" aria-label="Workspace settings" onClick={onNavigate}><ChevronRight size={16} /></Link></div></div></>;
}
export default function WorkspaceLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const { data, saved, saving, storageError, retrySave, service } = useWorkspace();
  const { openTask } = useDialogs();
  const page = location.pathname.split('/')[2];
  const title = pageNames[page] || 'Today';
  useEffect(() => { window.scrollTo(0, 0); setMobileOpen(false); setSearchOpen(false); }, [location.pathname]);
  useEffect(() => {
    const keyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        if (document.querySelector('dialog[open]') && !searchOpen) return;
        event.preventDefault(); setSearchOpen((current) => !current);
      }
    };
    window.addEventListener('keydown', keyDown);
    return () => window.removeEventListener('keydown', keyDown);
  }, [searchOpen]);
  return <div className="workspace-shell"><a href="#main-content" className="skip-link">Skip to content</a><aside className="sidebar"><SidebarContent /></aside><div className="workspace-main"><header className="workspace-topbar"><div className="topbar-left"><button className="icon-button mobile-menu-button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={21} /></button><div className="breadcrumb"><span>My workspace</span><ChevronRight size={13} /><strong>{title}</strong>{location.pathname.split('/').length > 3 && page === 'projects' && <><ChevronRight size={13} /><span>Details</span></>}</div></div><div className="topbar-actions"><button className="global-search-button" onClick={() => setSearchOpen(true)}><Search size={16} /><span>Search anything…</span><kbd>⌘ K</kbd></button><span className="topbar-divider" /><SaveIndicator saved={saved} saving={saving} error={storageError} /><button className="topbar-avatar" onClick={() => openTask({})} aria-label="Create a new task" title="Create a new task"><span>{data.preferences.displayName?.[0]?.toUpperCase() || 'M'}</span></button></div></header>
    {storageError && <div className="storage-banner" role="alert"><AlertCircle size={18} /><p>{storageError}</p><button onClick={() => downloadText(`moment-backup-${dateKey()}.json`, exportWorkspace(data))}><Download size={14} />Export</button><button onClick={retrySave}><RefreshCw size={14} />Retry</button><Link to="/app/settings">Settings</Link></div>}
    <main id="main-content" className="workspace-content" tabIndex={-1}><Outlet /></main><footer className="workspace-footer"><span>A little progress is still progress.</span><span>Made for your everyday <span className="footer-dot">·</span> MOMENT V2</span></footer></div>
    {mobileOpen && <Modal title="Your workspace" onClose={() => setMobileOpen(false)} className="navigation-modal"><SidebarContent onNavigate={() => setMobileOpen(false)} /></Modal>}
    {searchOpen && <SearchDialog onClose={() => setSearchOpen(false)} />}
  </div>;
}
