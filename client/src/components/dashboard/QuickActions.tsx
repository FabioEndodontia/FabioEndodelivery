import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import NewTreatmentDialog from "@/components/NewTreatmentDialog";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function QuickActions() {
  const { toast } = useToast();
  const [treatmentDialogOpen, setTreatmentDialogOpen] = useState(false);
  
  const handleAction = (action: string) => {
    if (action === "new-treatment") {
      setTreatmentDialogOpen(true);
    } else {
      toast({
        title: "Em desenvolvimento",
        description: "Esta funcionalidade estará disponível em breve.",
        variant: "default"
      });
    }
  };
  
  return (
    <>
      <Card className="bg-white rounded-lg shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Ações Rápidas</CardTitle>
        </CardHeader>
        
        <CardContent className="pt-2">
          <div className="grid grid-cols-2 gap-3">
            <Link href="/pacientes">
              <Button 
                variant="ghost" 
                className="flex flex-col items-center justify-center p-3 h-auto bg-primary-50 hover:bg-primary-100 transition-colors w-full"
              >
                <i className="ri-user-add-line text-xl text-primary-600 mb-2"></i>
                <span className="text-sm font-medium text-primary-700">Novo Paciente</span>
              </Button>
            </Link>
            
            <Button 
              variant="ghost" 
              className="flex flex-col items-center justify-center p-3 h-auto bg-neutral-50 hover:bg-neutral-100 transition-colors"
              onClick={() => handleAction("new-treatment")}
            >
              <i className="ri-stethoscope-line text-xl text-neutral-700 mb-2"></i>
              <span className="text-sm font-medium">Novo Atendimento</span>
            </Button>
            
            <Button 
              variant="ghost" 
              className="flex flex-col items-center justify-center p-3 h-auto bg-neutral-50 hover:bg-neutral-100 transition-colors"
              onClick={() => handleAction("invoice")}
            >
              <i className="ri-bill-line text-xl text-neutral-700 mb-2"></i>
              <span className="text-sm font-medium">Emitir Nota</span>
            </Button>
            
            <Link href="/relatorios">
              <Button 
                variant="ghost" 
                className="flex flex-col items-center justify-center p-3 h-auto bg-neutral-50 hover:bg-neutral-100 transition-colors w-full"
              >
                <i className="ri-file-chart-line text-xl text-neutral-700 mb-2"></i>
                <span className="text-sm font-medium">Relatório</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      
      <NewTreatmentDialog 
        open={treatmentDialogOpen} 
        onOpenChange={setTreatmentDialogOpen} 
      />
    </>
  );
}
