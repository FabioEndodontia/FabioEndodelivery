import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatCurrency, getInitials } from "@/lib/utils";
import { Link } from "wouter";

export default function RecentActivity() {
  const [timeFrame, setTimeFrame] = useState("today");
  
  const { data: treatments, isLoading } = useQuery({
    queryKey: ["/api/treatments"],
  });
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-success/10 text-success";
      case "pending":
        return "bg-warning/10 text-warning";
      case "late":
        return "bg-error/10 text-error";
      default:
        return "bg-neutral-100 text-neutral-600";
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return "ri-checkbox-circle-fill";
      case "pending":
        return "ri-time-line";
      case "late":
        return "ri-error-warning-fill";
      default:
        return "ri-question-line";
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Pago";
      case "pending":
        return "Pendente";
      case "late":
        return "Atrasado";
      default:
        return status;
    }
  };
  
  return (
    <Card className="mb-6">
      <CardHeader className="border-b border-neutral-200 p-4 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Atividade Recente</CardTitle>
        <div className="flex items-center space-x-2">
          <Select defaultValue={timeFrame} onValueChange={setTimeFrame}>
            <SelectTrigger className="w-[140px] text-sm h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="text-neutral-500 hover:text-primary-600">
            <i className="ri-more-2-fill"></i>
          </Button>
        </div>
      </CardHeader>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-neutral-500 text-sm bg-neutral-50">
              <th className="py-3 px-4 font-medium">Paciente</th>
              <th className="py-3 px-4 font-medium">Dentista/Clínica</th>
              <th className="py-3 px-4 font-medium">Procedimento</th>
              <th className="py-3 px-4 font-medium">Valor</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium sr-only">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-4 text-center">Carregando...</td>
              </tr>
            ) : treatments && treatments.length > 0 ? (
              treatments.slice(0, 4).map((treatment: any) => (
                <tr key={treatment.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar className="w-8 h-8 mr-2">
                        <AvatarFallback className="text-xs font-semibold">
                          {getInitials(treatment.patient.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{treatment.patient.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">{treatment.dentist.name}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center">
                      {treatment.treatmentType === 'treatment' ? 'Tratamento' : 'Retratamento'} 
                      <span className="ml-1 text-xs bg-primary-50 text-primary-700 rounded px-1">
                        Dente {treatment.toothNumber}
                      </span>
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-medium">
                    {formatCurrency(treatment.value)}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-full ${getStatusBadgeClass(treatment.paymentStatus)}`}>
                      <i className={`${getStatusIcon(treatment.paymentStatus)} mr-1`}></i> 
                      {getStatusText(treatment.paymentStatus)}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-right">
                    <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-primary-600">
                      <i className="ri-more-2-fill"></i>
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-4 text-center">Nenhum atendimento encontrado</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <CardContent className="p-4 border-t border-neutral-200 flex justify-between items-center">
        <p className="text-sm text-neutral-500">
          {treatments ? `Mostrando ${Math.min(4, treatments.length)} de ${treatments.length} resultados` : "Carregando..."}
        </p>
        <Link href="/atendimentos">
          <a className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center">
            Ver todos <i className="ri-arrow-right-line ml-1"></i>
          </a>
        </Link>
      </CardContent>
    </Card>
  );
}
