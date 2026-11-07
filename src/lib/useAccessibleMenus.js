import { useEffect } from 'react';

export function useAccessibleMenus() {
  useEffect(() => {
    const closeMenus = (except) => document.querySelectorAll('details.row-menu[open]').forEach((menu) => { if (menu !== except) menu.open = false; });
    const pointerDown = (event) => {
      const current = event.target.closest('details.row-menu');
      closeMenus(current);
      if (event.target.closest('.menu-popover button')) setTimeout(() => { if (current) current.open = false; }, 0);
    };
    const keyDown = (event) => {
      const menu = event.target.closest('details.row-menu');
      if (event.key === 'Escape' && menu?.open) { event.preventDefault(); event.stopPropagation(); menu.open = false; menu.querySelector('summary')?.focus(); return; }
      if (menu?.open && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        const items = [...menu.querySelectorAll('.menu-popover button')];
        if (!items.length) return;
        event.preventDefault();
        const index = items.indexOf(document.activeElement);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : event.key === 'ArrowDown' ? (index + 1) % items.length : (index - 1 + items.length) % items.length;
        items[next].focus();
      }
      const tab = event.target.closest('[role="tab"]');
      if (tab && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        const tabs = [...tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]')];
        const index = tabs.indexOf(tab);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : event.key === 'ArrowRight' ? (index + 1) % tabs.length : (index - 1 + tabs.length) % tabs.length;
        event.preventDefault(); tabs[next].focus(); tabs[next].click();
      }
    };
    document.addEventListener('pointerdown', pointerDown);
    document.addEventListener('keydown', keyDown, true);
    return () => { document.removeEventListener('pointerdown', pointerDown); document.removeEventListener('keydown', keyDown, true); };
  }, []);
}
