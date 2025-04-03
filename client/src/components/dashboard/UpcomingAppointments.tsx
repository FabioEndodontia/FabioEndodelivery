import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateMonth } from "@/lib/utils";

export default function UpcomingAppointments() {
  const { data: appointments, isLoading, refetch } = useQuery({
    queryKey: ["/api/appointments/upcoming"],
  });
  
  return (
    <Card>
      <CardHeader className="p-4 border-b border-neutral-200 flex flex-row justify-between items-center">
        <CardTitle className="text-base font-semibold">Próximos Atendimentos</CardTitle>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" className="text-neutral-500 hover:text-primary-600 p-1">
            <i className="ri-calendar-line"></i>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-neutral-500 hover:text-primary-600 p-1"
            onClick={() => refetch()}
          >
            <i className="ri-refresh-line"></i>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {isLoading ? (
          <div className="text-center py-4">Carregando...</div>
        ) : appointments && appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.slice(0, 3).map((appointment: any) => {
              const { month, day } = formatDateMonth(appointment.date);
              return (
                <div key={appointment.id} className="flex items-center border-b border-neutral-100 pb-4 last:border-0 last:pb-0">
                  <div className="w-14 h-14 flex flex-col items-center justify-center bg-primary-50 rounded-lg mr-4">
                    <span className="text-primary-700 text-xs font-semibold">{month}</span>
                    <span className="text-primary-700 text-lg font-bold">{day}</span>
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-medium">{appointment.dentist.name}</p>
                    <div className="flex items-center text-sm text-neutral-500">
                      <i className="ri-time-line mr-1"></i>
                      <span>{appointment.startTime} - {appointment.endTime}</span>
                      <i className="ri-user-line ml-3 mr-1"></i>
                      <span>{appointment.estimatedPatients || 0} pacientes</span>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="text-primary-600 hover:text-primary-700 border-primary-600 hover:bg-primary-50"
                  >
                    Ver detalhes
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-neutral-500">Nenhum atendimento agendado</p>
            <Button variant="outline" className="mt-2">
              <i className="ri-calendar-line mr-2"></i>
              Agendar novo atendimento
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
