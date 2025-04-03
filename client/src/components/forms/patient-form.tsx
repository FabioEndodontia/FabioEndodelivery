import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { insertPatientSchema, InsertPatient, Dentist } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface PatientFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  patientId?: number;
}

const PatientForm: React.FC<PatientFormProps> = ({ onSuccess, onCancel, patientId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!patientId;

  // Fetch patient data if editing
  const { data: patientData, isLoading: isLoadingPatient } = useQuery({
    queryKey: [patientId ? `/api/patients/${patientId}` : null],
    enabled: isEditing,
  });

  // Fetch dentists for select dropdown
  const { data: dentists, isLoading: isLoadingDentists } = useQuery<Dentist[]>({
    queryKey: ['/api/dentists'],
  });

  const form = useForm<InsertPatient>({
    resolver: zodResolver(insertPatientSchema.extend({
      dentistId: insertPatientSchema.shape.dentistId.refine(val => val > 0, {
        message: "Selecione um dentista responsável"
      })
    })),
    defaultValues: {
      name: "",
      dentistId: undefined,
    },
  });

  // Initialize form with patient data when available
  useEffect(() => {
    if (patientData && isEditing) {
      form.reset(patientData);
    }
  }, [patientData, form, isEditing]);

  const onSubmit = async (data: InsertPatient) => {
    try {
      if (isEditing) {
        await apiRequest('PUT', `/api/patients/${patientId}`, data);
        toast({
          title: "Paciente atualizado",
          description: "O paciente foi atualizado com sucesso.",
        });
      } else {
        await apiRequest('POST', '/api/patients', data);
        toast({
          title: "Paciente registrado",
          description: "O paciente foi registrado com sucesso.",
        });
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: ['/api/patients'],
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o paciente.",
        variant: "destructive",
      });
    }
  };

  const isLoading = isLoadingPatient || isLoadingDentists;

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Paciente</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dentistId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dentista Responsável</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value ? String(field.value) : undefined}
                    required
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o dentista responsável" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.isArray(dentists) && dentists.length > 0 ? (
                        dentists.map((dentist) => (
                          <SelectItem key={dentist.id} value={String(dentist.id)}>
                            {dentist.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="0" disabled>
                          Nenhum dentista cadastrado
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isEditing ? "Atualizar" : "Salvar"} Paciente
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default PatientForm;
