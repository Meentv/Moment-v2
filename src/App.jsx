import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { WorkspaceProvider } from './context/WorkspaceContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { DialogProvider } from './context/DialogContext.jsx';
import { FocusProvider } from './context/FocusContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import WorkspaceLayout from './layouts/WorkspaceLayout.jsx';
import PublicLayout from './layouts/PublicLayout.jsx';
import Today from './pages/Today.jsx';
import Tasks from './pages/Tasks.jsx';
import Projects from './pages/Projects.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import Notes from './pages/Notes.jsx';
import Calendar from './pages/Calendar.jsx';
import Focus from './pages/Focus.jsx';
import Settings from './pages/Settings.jsx';
import Search from './pages/Search.jsx';
import NotFound from './pages/NotFound.jsx';
import Home from './pages/public/Home.jsx';
import Features from './pages/public/Features.jsx';
import About from './pages/public/About.jsx';
import Help from './pages/public/Help.jsx';
import Contact from './pages/public/Contact.jsx';
import { useAccessibleMenus } from './lib/useAccessibleMenus.js';

export function AppRoutes() {
  return <Routes><Route element={<PublicLayout />}><Route index element={<Home />} /><Route path="features" element={<Features />} /><Route path="about" element={<About />} /><Route path="help" element={<Help />} /><Route path="contact" element={<Contact />} /></Route><Route path="app" element={<WorkspaceLayout />}><Route index element={<Today />} /><Route path="tasks" element={<Tasks />} /><Route path="projects" element={<Projects />} /><Route path="projects/:id" element={<ProjectDetail />} /><Route path="notes" element={<Notes />} /><Route path="calendar" element={<Calendar />} /><Route path="focus" element={<Focus />} /><Route path="settings" element={<Settings />} /><Route path="search" element={<Search />} /></Route><Route path="*" element={<NotFound />} /></Routes>;
}
export function AppProviders({ children }) {
  useAccessibleMenus();
  return <ErrorBoundary><WorkspaceProvider><ToastProvider><DialogProvider><FocusProvider>{children}</FocusProvider></DialogProvider></ToastProvider></WorkspaceProvider></ErrorBoundary>;
}
export function TestApp({ initialEntries = ['/app'] }) { return <MemoryRouter initialEntries={initialEntries}><AppProviders><AppRoutes /></AppProviders></MemoryRouter>; }
export default function App() { return <BrowserRouter><AppProviders><AppRoutes /></AppProviders></BrowserRouter>; }
