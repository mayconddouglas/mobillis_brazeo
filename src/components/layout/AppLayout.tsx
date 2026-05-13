import React, { useState, useEffect } from 'react';
import { Home, TrendingUp, Receipt, Wallet, Settings } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

export default function AppLayout() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isDesktop) {
    return (
      <div className="flex items-center justify-center min-h-screen text-center p-8 bg-background text-foreground">
        <p>Este aplicativo foi desenvolvido exclusivamente para dispositivos móveis (celulares ou tablets).</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col overflow-y-auto pb-24">
        <Outlet />
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between border-t bg-card/80 px-6 py-3 backdrop-blur">
        <NavItem to="/" icon={<Home />} label="Início" />
        <NavItem to="/receitas" icon={<TrendingUp />} label="Receitas" />
        <NavItem to="/despesas" icon={<Receipt />} label="Despesas" />
        <NavItem to="/contas" icon={<Wallet />} label="Contas" />
        <NavItem to="/configuracoes" icon={<Settings />} label="Config" />
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 transition-colors ${
          isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        }`
      }
    >
      <div className="relative">
        {React.cloneElement(icon as React.ReactElement, { className: 'size-5' })}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  );
}
