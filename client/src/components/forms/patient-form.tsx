import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { insertPatientSchema, InsertPatient } from "@shared/schema";
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
  const { data: patientData, isLoading } = useQuery({
    queryKey: [patientId ? `/api/patients/${patientId}` : null],
    enabled: isEditing,
  });

  const form = useForm<InsertPatient>({
    resolver: zodResolver(insertPatientSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      notes: "",
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="exemplo@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações adicionais sobre o paciente" 
                      {...field} 
                    />
                  </FormControl>
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
