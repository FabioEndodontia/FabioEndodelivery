import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Activity, 
  DollarSign, 
  Users, 
  Receipt, 
  Plus 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import StatCard from "@/components/stat-card";
import ProcedureList from "@/components/procedure-list";
import PendingPayments from "@/components/pending-payments";
import PendingInvoices from "@/components/pending-invoices";
import ProcedureForm from "@/components/forms/procedure-form";

const Dashboard = () => {
  const [showProcedureModal, setShowProcedureModal] = useState(false);

  // Fetch dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  // Fetch recent procedures
  const { data: recentProcedures, isLoading: isLoadingProcedures } = useQuery({
    queryKey: ['/api/dashboard/recent-procedures'],
  });

  // Fetch pending payments
  const { data: pendingPayments, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['/api/dashboard/pending-payments'],
  });

  // Fetch pending invoices
  const { data: pendingInvoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['/api/dashboard/pending-invoices'],
  });

  return (
    <div className="space-y-6">
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Atendimentos este mês"
          value={isLoadingStats ? "-" : stats?.monthlyProcedures}
          icon={<Activity className="h-6 w-6 text-primary" />}
          trend={{
            value: "12.5% desde mês passado",
            isPositive: true
          }}
        />
        
        <StatCard
          title="Faturamento este mês"
          value={isLoadingStats ? "-" : formatCurrency(stats?.monthlyRevenue || 0)}
          icon={<DollarSign className="h-6 w-6 text-secondary" />}
          iconClassName="bg-secondary bg-opacity-10"
          trend={{
            value: "8.3% desde mês passado",
            isPositive: true
          }}
        />
        
        <StatCard
          title="Clínicas parceiras ativas"
          value={isLoadingStats ? "-" : stats?.activeDentists}
          icon={<Users className="h-6 w-6 text-accent" />}
          iconClassName="bg-accent bg-opacity-10"
          trend={{
            value: "2 novos este mês",
            isPositive: true
          }}
        />
        
        <StatCard
          title="Recebimentos pendentes"
          value={isLoadingStats ? "-" : formatCurrency(stats?.pendingPayments || 0)}
          icon={<Receipt className="h-6 w-6 text-warning" />}
          iconClassName="bg-warning bg-opacity-10"
          trend={{
            value: "3 notas pendentes",
            isPositive: false
          }}
        />
      </div>

      {/* Recent Activity / Upcoming Procedures */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold">Atendimentos Recentes</h3>
              <Button variant="link" className="text-sm text-primary p-0 h-auto">
                Ver todos
              </Button>
            </div>
            
            <ProcedureList
              procedures={recentProcedures || []}
              isLoading={isLoadingProcedures}
            />
          </div>
        </div>
        
        <div className="space-y-6">
          <PendingPayments
            payments={pendingPayments || []}
            isLoading={isLoadingPayments}
          />
          
          <PendingInvoices
            invoices={pendingInvoices || []}
            isLoading={isLoadingInvoices}
          />
        </div>
      </div>

      {/* Floating Add Button */}
      <Button
        className="fixed right-6 bottom-6 rounded-full w-14 h-14 shadow-lg"
        onClick={() => setShowProcedureModal(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* New Procedure Modal */}
      <Dialog open={showProcedureModal} onOpenChange={setShowProcedureModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Novo Atendimento</DialogTitle>
          </DialogHeader>
          <ProcedureForm
            onSuccess={() => setShowProcedureModal(false)}
            onCancel={() => setShowProcedureModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
