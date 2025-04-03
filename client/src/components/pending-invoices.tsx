import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PendingInvoice {
  dentist: string;
  count: number;
  total: number;
}

interface PendingInvoicesProps {
  invoices: PendingInvoice[];
  isLoading: boolean;
}

const PendingInvoices: React.FC<PendingInvoicesProps> = ({ invoices, isLoading }) => {
  if (isLoading) {
    return <PendingInvoicesSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Notas Fiscais Pendentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {invoices.length > 0 ? (
            invoices.map((invoice, index) => (
              <div 
                key={`${invoice.dentist}-${index}`}
                className="border-b border-neutral-200 py-3 last:border-0"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{invoice.dentist}</p>
                    <p className="text-xs text-neutral-800">
                      Procedimentos: {invoice.count}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(invoice.total)}</p>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="h-auto p-0 text-xs text-primary"
                    >
                      Emitir nota
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              Não há notas fiscais pendentes
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const PendingInvoicesSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-[220px]" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-3 w-[100px]" />
              </div>
              <div className="space-y-2 text-right">
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-3 w-[60px]" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingInvoices;
