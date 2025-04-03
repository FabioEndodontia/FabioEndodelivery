import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface TopNavProps {
  openSidebar: () => void;
}

export default function TopNav({ openSidebar }: TopNavProps) {
  const [location] = useLocation();
  
  // Map routes to page titles
  const pageTitles: Record<string, string> = {
    "/": "Dashboard",
    "/pacientes": "Pacientes",
    "/dentistas": "Dentistas/Clínicas",
    "/atendimentos": "Atendimentos",
    "/financeiro": "Financeiro",
    "/relatorios": "Relatórios",
    "/configuracoes": "Configurações",
    "/ajuda": "Ajuda & Suporte"
  };
  
  const currentTitle = pageTitles[location] || "Página não encontrada";
  
  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={openSidebar}
            className="md:hidden mr-4 text-neutral-600 hover:text-neutral-800"
          >
            <i className="ri-menu-line text-xl"></i>
          </Button>
          <h2 className="text-lg font-semibold">{currentTitle}</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Button variant="ghost" size="icon" className="relative text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-full">
              <i className="ri-notification-3-line text-xl"></i>
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
            </Button>
          </div>
          
          <div className="relative">
            <Button variant="ghost" className="flex items-center text-neutral-600 hover:text-primary-600">
              <span className="mr-1 hidden sm:inline-block">Hoje</span>
              <i className="ri-calendar-line"></i>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
