import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowUpRight, Mail, Menu, ShieldCheck } from 'lucide-react';
import { Brand } from '../components/UI.jsx';
import Modal from '../components/Modal.jsx';
import { CONTACT_EMAIL, contactMailto } from '../lib/contact.js';
import { useEffect } from 'react';

function PublicNav({ onClick }) {
  return <><NavLink to="/features" onClick={onClick}>Features</NavLink><Link to="/#how-it-works" onClick={onClick}>How it works</Link><NavLink to="/about" onClick={onClick}>About</NavLink><NavLink to="/help" onClick={onClick}>Help</NavLink></>;
}
export default function PublicLayout() {
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  useEffect(() => { setMenu(false); if (location.hash) setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 80); else window.scrollTo(0, 0); }, [location.pathname, location.hash]);
  return <div className="public-shell"><a href="#public-content" className="skip-link">Skip to content</a><header className="public-header"><Link to="/" aria-label="MOMENT home"><Brand /></Link><nav className="public-nav" aria-label="Main navigation"><PublicNav /></nav><div className="public-header-actions"><Link className="button primary" to="/app">Open workspace<ArrowUpRight size={16} /></Link><button className="icon-button public-menu-button" aria-label="Open menu" onClick={() => setMenu(true)}><Menu size={22} /></button></div></header><main id="public-content"><Outlet /></main><footer className="public-footer"><div><Link to="/" aria-label="MOMENT home"><Brand /></Link><p>Make Everything Simple With Focus.</p><a className="public-footer-email" href={contactMailto()}><Mail size={13} />{CONTACT_EMAIL}</a></div><nav aria-label="Footer navigation"><Link to="/features">Features</Link><Link to="/about">About</Link><Link to="/help">Help & FAQ</Link><Link to="/contact">Contact</Link><Link to="/app/settings">Your data</Link></nav><div className="public-footer-bottom"><span>© {new Date().getFullYear()} MOMENT. A little more room for you.</span><span><ShieldCheck size={14} />Local-first. No account needed.</span></div></footer>{menu && <Modal title="A little look around" onClose={() => setMenu(false)}><nav className="mobile-public-nav" aria-label="Mobile main navigation"><PublicNav onClick={() => setMenu(false)} /><Link to="/app" onClick={() => setMenu(false)}>Open workspace<ArrowUpRight size={17} /></Link></nav></Modal>}</div>;
}
