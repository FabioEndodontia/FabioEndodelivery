import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import ProcedureReportView from "@/components/procedure-report";
import { ArrowLeft } from "lucide-react";

export default function ViewProcedure() {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const procedureId = parseInt(id);

  // Buscar dados do procedimento
  const { data: procedure, isLoading: isProcedureLoading } = useQuery({
    queryKey: [`/api/procedures/${procedureId}`],
    enabled: !!procedureId && !isNaN(procedureId),
  });

  // Estados para armazenar os dados do paciente e dentista
  const [patient, setPatient] = useState<any>(null);
  const [dentist, setDentist] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Quando o procedimento é carregado, busque o paciente e o dentista
    if (procedure) {
      const fetchRelatedData = async () => {
        try {
          // Buscar o paciente
          const patientResponse = await fetch(`/api/patients/${procedure.patientId}`);
          const patientData = await patientResponse.json();
          setPatient(patientData);

          // Buscar o dentista
          const dentistResponse = await fetch(`/api/dentists/${procedure.dentistId}`);
          const dentistData = await dentistResponse.json();
          setDentist(dentistData);

          setIsLoading(false);
        } catch (error) {
          console.error("Erro ao buscar dados relacionados:", error);
          setIsLoading(false);
        }
      };

      fetchRelatedData();
    }
  }, [procedure]);

  if (isProcedureLoading || isLoading) {
    return (
      <div className="container py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/procedures")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Procedimentos
          </Button>
        </div>
        <Skeleton className="w-full h-[600px] rounded-md" />
      </div>
    );
  }

  if (!procedure || !patient || !dentist) {
    return (
      <div className="container py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/procedures")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Procedimentos
          </Button>
        </div>
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Procedimento não encontrado ou dados incompletos.
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/procedures")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Procedimentos
        </Button>
      </div>
      
      <ProcedureReportView 
        procedure={procedure} 
        patient={patient} 
        dentist={dentist}
      />
    </div>
  );
}