import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { insertDentistSchema, InsertDentist } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface DentistFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  dentistId?: number;
}

const DentistForm: React.FC<DentistFormProps> = ({ onSuccess, onCancel, dentistId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!dentistId;

  // Fetch dentist data if editing
  const { data: dentistData, isLoading } = useQuery({
    queryKey: [dentistId ? `/api/dentists/${dentistId}` : null],
    enabled: isEditing,
  });

  const form = useForm<InsertDentist>({
    resolver: zodResolver(insertDentistSchema),
    defaultValues: {
      name: "",
      clinic: "",
      address: "",
      phone: "",
      email: "",
      notes: "",
    },
  });

  // Initialize form with dentist data when available
  useEffect(() => {
    if (dentistData && isEditing) {
      form.reset(dentistData);
    }
  }, [dentistData, form, isEditing]);

  const onSubmit = async (data: InsertDentist) => {
    try {
      if (isEditing) {
        await apiRequest('PUT', `/api/dentists/${dentistId}`, data);
        toast({
          title: "Dentista/Clínica atualizado",
          description: "O dentista ou clínica foi atualizado com sucesso.",
        });
      } else {
        await apiRequest('POST', '/api/dentists', data);
        toast({
          title: "Dentista/Clínica registrado",
          description: "O dentista ou clínica foi registrado com sucesso.",
        });
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: ['/api/dentists'],
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o dentista/clínica.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Dentista/Clínica</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clinic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Clínica</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da clínica (se aplicável)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Endereço completo" {...field} />
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
                      placeholder="Observações adicionais sobre o dentista/clínica" 
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
                {isEditing ? "Atualizar" : "Salvar"} Dentista/Clínica
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default DentistForm;
