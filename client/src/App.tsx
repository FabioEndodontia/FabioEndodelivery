import { Switch, Route, useLocation, useRoute } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Patients from "@/pages/patients";
import Dentists from "@/pages/dentists";
import Procedures from "@/pages/procedures";
import ViewProcedure from "@/pages/view-procedure";
import Financial from "@/pages/financial";
import Reports from "@/pages/reports";
import Invoices from "@/pages/invoices";
import Appointments from "@/pages/appointments";
import Sidebar from "@/components/ui/sidebar";

function Router() {
  const [location] = useLocation();

  // Helper to get the page title based on current route
  const getPageTitle = () => {
    switch (true) {
      case location === "/":
        return "Dashboard";
      case location === "/patients":
        return "Pacientes";
      case location === "/dentists":
        return "Dentistas/Clínicas";
      case location === "/procedures":
        return "Atendimentos";
      case location === "/appointments":
        return "Agenda";
      case location === "/financial":
        return "Financeiro";
      case location === "/reports":
        return "Relatórios";
      case location === "/invoices":
        return "Notas Fiscais";
      default:
        return "EndoFinance";
    }
  };

  // Helper to get the page subtitle based on current route
  const getPageSubtitle = () => {
    switch (true) {
      case location === "/":
        return "Visão geral do seu desempenho";
      case location === "/patients":
        return "Gerenciar seus pacientes";
      case location === "/dentists":
        return "Gerenciar seus dentistas e clínicas parceiras";
      case location === "/procedures":
        return "Gerenciar seus atendimentos";
      case location === "/appointments":
        return "Gerenciar agendamentos e integração com Calendly";
      case location === "/financial":
        return "Controle de pagamentos e recebimentos";
      case location === "/reports":
        return "Relatórios e análises";
      case location === "/invoices":
        return "Controle de notas fiscais";
      default:
        return "";
    }
  };

  // Verifica se estamos em rotas especiais que não devem mostrar o cabeçalho/sidebar
  const [isViewProcedurePath] = useRoute('/procedure/:id');

  // Layout completo com sidebar e cabeçalho
  const renderFullLayout = () => (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="px-6 py-4">
            <h2 className="text-xl font-semibold text-neutral-900">{getPageTitle()}</h2>
            <p className="text-sm text-neutral-800">{getPageSubtitle()}</p>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-neutral-100 p-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/patients" component={Patients} />
            <Route path="/dentists" component={Dentists} />
            <Route path="/procedures" component={Procedures} />
            <Route path="/appointments" component={Appointments} />
            <Route path="/financial" component={Financial} />
            <Route path="/reports" component={Reports} />
            <Route path="/invoices" component={Invoices} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );

  // Layout simplificado para páginas específicas
  const renderSimpleLayout = () => (
    <div className="min-h-screen bg-neutral-100">
      <Switch>
        <Route path="/procedure/:id" component={ViewProcedure} />
      </Switch>
    </div>
  );

  return isViewProcedurePath ? renderSimpleLayout() : renderFullLayout();
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
