import React from 'react';
import { Home, DollarSign, Receipt, Wallet, Settings } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function AppLayout() {
  const { pathname } = useLocation();
  const currentPage = getCurrentPage(pathname);

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>RouteFinance</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<NavLink to="/" />}
                    isActive={pathname === '/'}
                  >
                    <Home data-icon="inline-start" />
                    Dashboard
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<NavLink to="/earnings" />}
                    isActive={pathname === '/earnings'}
                  >
                    <DollarSign data-icon="inline-start" />
                    Ganhos
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<NavLink to="/expenses" />}
                    isActive={pathname === '/expenses'}
                  >
                    <Receipt data-icon="inline-start" />
                    Gastos
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<NavLink to="/wallets" />}
                    isActive={pathname === '/wallets'}
                  >
                    <Wallet data-icon="inline-start" />
                    Carteiras
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<NavLink to="/settings" />}
                    isActive={pathname === '/settings'}
                  >
                    <Settings data-icon="inline-start" />
                    Configurações
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-h-svh">
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:h-16">
          <SidebarTrigger className="-ml-1" />
          <Breadcrumb className="hidden md:block">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<NavLink to="/" />}>
                  RouteFinance
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{currentPage}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto text-sm font-medium text-muted-foreground">
            {currentPage}
          </div>
        </header>

        <div className="flex flex-1 flex-col overflow-y-auto pb-24 md:pb-0">
          <Outlet />
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between border-t bg-card/80 px-6 py-3 backdrop-blur md:hidden">
          <NavItem to="/" icon={<Home />} label="Início" />
          <NavItem to="/earnings" icon={<DollarSign />} label="Ganhos" />
          <NavItem to="/expenses" icon={<Receipt />} label="Gastos" />
          <NavItem to="/wallets" icon={<Wallet />} label="Carteiras" />
          <NavItem to="/settings" icon={<Settings />} label="Config" />
        </nav>
      </SidebarInset>
    </SidebarProvider>
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

function getCurrentPage(pathname: string) {
  if (pathname === '/') return 'Dashboard';
  if (pathname === '/earnings') return 'Ganhos';
  if (pathname === '/expenses') return 'Gastos';
  if (pathname === '/wallets') return 'Carteiras';
  if (pathname === '/settings') return 'Configurações';
  return 'Página';
}
