import React from 'react';
import { Home, DollarSign, Receipt, Wallet, Settings } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

export default function AppLayout() {
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background text-foreground shadow-2xl">
      <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 bg-card border-t border-border px-6 py-3 flex justify-between items-center rounded-t-2xl shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-50">
        <NavItem to="/" icon={<Home size={24} />} label="Início" />
        <NavItem to="/earnings" icon={<DollarSign size={24} />} label="Ganhos" />
        <NavItem to="/expenses" icon={<Receipt size={24} />} label="Gastos" />
        <NavItem to="/wallets" icon={<Wallet size={24} />} label="Carteiras" />
        <NavItem to="/settings" icon={<Settings size={24} />} label="Config" />
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
        {icon}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  );
}
