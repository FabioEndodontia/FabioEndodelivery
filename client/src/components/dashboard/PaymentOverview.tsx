import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function PaymentOverview() {
  const { data: financialStats, isLoading } = useQuery({
    queryKey: ["/api/stats/financial"],
  });
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Visão Financeira</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Carregando...</div>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate percentages
  const total = 
    (financialStats?.totalReceived || 0) + 
    (financialStats?.totalPending || 0) + 
    (financialStats?.totalLate || 0);
  
  const receivedPercentage = total > 0 ? Math.round((financialStats?.totalReceived / total) * 100) : 0;
  const pendingPercentage = total > 0 ? Math.round((financialStats?.totalPending / total) * 100) : 0;
  const latePercentage = total > 0 ? Math.round((financialStats?.totalLate / total) * 100) : 0;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Visão Financeira</CardTitle>
      </CardHeader>
      
      <CardContent className="pt-2">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-neutral-600">Recebido</span>
              <span className="text-sm font-medium">{receivedPercentage}%</span>
            </div>
            <Progress value={receivedPercentage} className="h-2 bg-neutral-200" indicatorClassName="bg-success" />
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-neutral-600">Pendente</span>
              <span className="text-sm font-medium">{pendingPercentage}%</span>
            </div>
            <Progress value={pendingPercentage} className="h-2 bg-neutral-200" indicatorClassName="bg-warning" />
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-neutral-600">Atrasado</span>
              <span className="text-sm font-medium">{latePercentage}%</span>
            </div>
            <Progress value={latePercentage} className="h-2 bg-neutral-200" indicatorClassName="bg-error" />
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <h4 className="font-medium mb-2">Formas de Pagamento</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2">
                  <i className="ri-bank-card-line"></i>
                </div>
                <span className="text-sm">Transferência/PIX</span>
              </div>
              <span className="text-sm font-medium">{financialStats?.paymentMethodBreakdown.transfer_pix || 0}%</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-2">
                  <i className="ri-money-dollar-circle-line"></i>
                </div>
                <span className="text-sm">Dinheiro</span>
              </div>
              <span className="text-sm font-medium">{financialStats?.paymentMethodBreakdown.cash || 0}%</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mr-2">
                  <i className="ri-bank-card-line"></i>
                </div>
                <span className="text-sm">Cartão de Crédito</span>
              </div>
              <span className="text-sm font-medium">{financialStats?.paymentMethodBreakdown.credit_card || 0}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
