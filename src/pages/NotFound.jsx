import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { EmptyState } from '../components/UI.jsx';
export default function NotFound() { return <div className="not-found page-enter"><span className="eyebrow">A LITTLE DETOUR · 404</span><EmptyState icon={Compass} title="This page has wandered off" description="Let’s get you back to a little clarity. Your workspace is right where you left it." action={<Link className="button primary" to="/app"><ArrowLeft size={16} />Back to your workspace</Link>} /></div>; }
