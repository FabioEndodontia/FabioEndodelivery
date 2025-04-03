import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency, getInitials } from "@/lib/utils";
import { Link } from "wouter";

export default function TopPractices() {
  const { data: topDentists, isLoading } = useQuery({
    queryKey: ["/api/stats/top-dentists"],
  });
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Principais Clínicas</CardTitle>
      </CardHeader>
      
      <CardContent className="pt-2">
        {isLoading ? (
          <div className="text-center py-4">Carregando...</div>
        ) : topDentists && topDentists.length > 0 ? (
          <div className="space-y-3">
            {topDentists.map((item: any) => (
              <div key={item.dentist.id} className="flex items-center border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                <Avatar className="w-10 h-10 mr-3">
                  <AvatarFallback className="text-xs font-semibold">
                    {getInitials(item.dentist.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{item.dentist.name}</p>
                  <p className="text-xs text-neutral-500">{item.treatmentCount} atendimentos</p>
                </div>
                <span className="text-sm font-medium text-success">
                  {formatCurrency(item.totalValue)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-neutral-500">Nenhuma clínica encontrada</p>
          </div>
        )}
        
        <Link href="/dentistas">
          <Button 
            variant="ghost" 
            className="w-full mt-4 py-2 text-sm text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg font-medium"
          >
            Ver todas as clínicas
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
