import { useLocation, Link } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

interface SidebarLinkProps {
  href: string;
  icon: string;
  children: React.ReactNode;
}

function SidebarLink({ href, icon, children }: SidebarLinkProps) {
  const [location] = useLocation();
  const isActive = location === href;
  
  return (
    <li>
      <Link href={href}>
        <a className={cn(
          "flex items-center pl-4 pr-6 py-3 text-neutral-700 hover:bg-neutral-50",
          isActive && "bg-primary-50 border-l-4 border-primary-500 text-primary-600 font-medium"
        )}>
          <i className={`${icon} mr-3 text-lg`}></i>
          <span>{children}</span>
        </a>
      </Link>
    </li>
  );
}

export default function Sidebar({ isOpen, closeSidebar }: SidebarProps) {
  return (
    <div className={cn(
      "sidebar bg-white border-r border-neutral-200 w-64 flex flex-col z-40",
      "fixed h-full md:static md:h-auto transform transition-transform duration-200 ease-in-out",
      isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )}>
      <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
        <div className="flex items-center">
          <i className="ri-pulse-line text-primary-500 text-2xl mr-2"></i>
          <h1 className="text-xl font-semibold text-primary-600">EndoControl</h1>
        </div>
        <button 
          onClick={closeSidebar}
          className="md:hidden text-neutral-600 hover:text-neutral-800"
        >
          <i className="ri-close-line text-xl"></i>
        </button>
      </div>
      
      <div className="p-4">
        <div className="flex items-center space-x-3 mb-6">
          <Avatar>
            <AvatarFallback>DR</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">Dr. Rodrigo</p>
            <p className="text-xs text-neutral-500">Endodontista</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul>
          <SidebarLink href="/" icon="ri-dashboard-line">
            Dashboard
          </SidebarLink>
          <SidebarLink href="/pacientes" icon="ri-user-line">
            Pacientes
          </SidebarLink>
          <SidebarLink href="/dentistas" icon="ri-team-line">
            Dentistas/Clínicas
          </SidebarLink>
          <SidebarLink href="/atendimentos" icon="ri-stethoscope-line">
            Atendimentos
          </SidebarLink>
          <SidebarLink href="/financeiro" icon="ri-money-dollar-circle-line">
            Financeiro
          </SidebarLink>
          <SidebarLink href="/relatorios" icon="ri-file-chart-line">
            Relatórios
          </SidebarLink>
          <SidebarLink href="/metas" icon="ri-award-line">
            Metas e Conquistas
          </SidebarLink>
          <SidebarLink href="/configuracoes" icon="ri-settings-3-line">
            Configurações
          </SidebarLink>
        </ul>
      </nav>
      
      <div className="p-4 border-t border-neutral-200">
        <Link href="/ajuda">
          <a className="flex items-center text-neutral-600 hover:text-primary-600">
            <i className="ri-question-line mr-2"></i>
            <span>Ajuda & Suporte</span>
          </a>
        </Link>
      </div>
    </div>
  );
}
