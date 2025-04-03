import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default function QuickStats() {
  const { data: financialStats } = useQuery({
    queryKey: ["/api/stats/financial"],
  });
  
  const { data: treatments } = useQuery({
    queryKey: ["/api/treatments"],
  });
  
  const { data: dentists } = useQuery({
    queryKey: ["/api/dentists"],
  });
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-500 text-sm">Total de Atendimentos</p>
              <p className="text-2xl font-semibold">{treatments?.length || 0}</p>
            </div>
            <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center text-primary-500">
              <i className="ri-stethoscope-line text-xl"></i>
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs">
            <span className="text-success flex items-center">
              <i className="ri-arrow-up-line mr-1"></i>
              12%
            </span>
            <span className="text-neutral-500 ml-2">vs. mês anterior</span>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-500 text-sm">A Receber</p>
              <p className="text-2xl font-semibold">
                {financialStats ? formatCurrency(financialStats.totalPending) : "R$ 0,00"}
              </p>
            </div>
            <div className="w-10 h-10 bg-warning/20 rounded-full flex items-center justify-center text-warning">
              <i className="ri-time-line text-xl"></i>
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs">
            <span className="text-warning flex items-center">
              <i className="ri-arrow-up-line mr-1"></i>
              8%
            </span>
            <span className="text-neutral-500 ml-2">vs. mês anterior</span>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-500 text-sm">Recebido</p>
              <p className="text-2xl font-semibold">
                {financialStats ? formatCurrency(financialStats.totalReceived) : "R$ 0,00"}
              </p>
            </div>
            <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center text-success">
              <i className="ri-money-dollar-circle-line text-xl"></i>
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs">
            <span className="text-success flex items-center">
              <i className="ri-arrow-up-line mr-1"></i>
              18%
            </span>
            <span className="text-neutral-500 ml-2">vs. mês anterior</span>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-500 text-sm">Clínicas Atendidas</p>
              <p className="text-2xl font-semibold">{dentists?.length || 0}</p>
            </div>
            <div className="w-10 h-10 bg-secondary-500/20 rounded-full flex items-center justify-center text-secondary-500">
              <i className="ri-hospital-line text-xl"></i>
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs">
            <span className="text-success flex items-center">
              <i className="ri-arrow-up-line mr-1"></i>
              2
            </span>
            <span className="text-neutral-500 ml-2">novas neste mês</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
