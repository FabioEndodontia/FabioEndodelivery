import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, getDaysUntilDate } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface PendingPayment {
  dentist: string;
  count: number;
  total: number;
  dueDate?: string;
}

interface PendingPaymentsProps {
  payments: PendingPayment[];
  isLoading: boolean;
}

const PendingPayments: React.FC<PendingPaymentsProps> = ({ payments, isLoading }) => {
  if (isLoading) {
    return <PendingPaymentsSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recebimentos Pendentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {payments.length > 0 ? (
            <>
              {payments.map((payment, index) => (
                <div 
                  key={`${payment.dentist}-${index}`}
                  className="border-b border-neutral-200 py-3 last:border-0"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{payment.dentist}</p>
                      <p className="text-xs text-neutral-800">
                        {payment.count} procedimento{payment.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-error">{formatCurrency(payment.total)}</p>
                      {payment.dueDate && (
                        <StatusText dueDate={payment.dueDate} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-4">
                <Button className="w-full" variant="default">
                  Enviar lembretes
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              Não há pagamentos pendentes
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const StatusText = ({ dueDate }: { dueDate: string }) => {
  const daysUntil = getDaysUntilDate(dueDate);
  
  if (daysUntil === null) return null;
  
  if (daysUntil < 0) {
    return (
      <p className="text-xs text-error flex items-center">
        <AlertCircle className="h-3 w-3 mr-1" />
        Atrasado ({Math.abs(daysUntil)} dias)
      </p>
    );
  }
  
  return (
    <p className="text-xs text-neutral-800">
      Vence em {daysUntil} dias
    </p>
  );
};

const PendingPaymentsSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-[200px]" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-3 w-[80px]" />
              </div>
              <div className="space-y-2 text-right">
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-3 w-[100px]" />
              </div>
            </div>
          ))}
          <Skeleton className="h-9 w-full mt-4" />
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingPayments;
