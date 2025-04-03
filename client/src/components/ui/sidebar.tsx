import { Link, useRoute } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Activity,
  User, 
  Users, 
  DollarSign, 
  FileText, 
  Receipt, 
  Settings,
  LogOut,
  Calendar
} from "lucide-react";

const Sidebar = () => {
  const links = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/procedures", label: "Atendimentos", icon: Activity },
    { href: "/appointments", label: "Agenda", icon: Calendar },
    { href: "/patients", label: "Pacientes", icon: User },
    { href: "/dentists", label: "Dentistas/Clínicas", icon: Users },
    { href: "/financial", label: "Financeiro", icon: DollarSign },
    { href: "/reports", label: "Relatórios", icon: FileText },
    { href: "/invoices", label: "Notas Fiscais", icon: Receipt },
  ];

  return (
    <div className="w-64 h-full shadow-lg bg-white flex-shrink-0 flex flex-col">
      <div className="p-4 border-b border-neutral-200">
        <h1 className="text-2xl font-semibold text-primary">EndoFinance</h1>
        <p className="text-sm text-neutral-800">Sistema de Gestão</p>
      </div>
      
      <div className="py-4 flex-1">
        {links.map(link => (
          <SidebarLink 
            key={link.href} 
            href={link.href} 
            label={link.label} 
            icon={link.icon} 
          />
        ))}
      </div>
      
      <div className="p-4 border-t border-neutral-200">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <User size={20} />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">Dra. Maria Silva</p>
            <p className="text-xs text-neutral-800">Endodontista</p>
          </div>
          <button className="ml-auto text-neutral-800">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

interface SidebarLinkProps {
  href: string;
  label: string;
  icon: React.ElementType;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ href, label, icon: Icon }) => {
  const [isActive] = useRoute(href === "/" ? href : `${href}`);
  
  return (
    <Link href={href}>
      <a className={cn(
        "flex items-center px-4 py-3 text-neutral-900 hover:bg-neutral-100 transition-colors",
        isActive && "bg-primary/10 text-primary border-l-4 border-primary"
      )}>
        <Icon className="w-6 h-6 mr-2" />
        <span>{label}</span>
      </a>
    </Link>
  );
};

export default Sidebar;
