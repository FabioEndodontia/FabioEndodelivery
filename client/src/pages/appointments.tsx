import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CalendarIcon, ClipboardEdit, Loader2, Plus, RefreshCw, Trash } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type Appointment = {
  id: number;
  patientId: number | null;
  dentistId: number | null;
  patientName?: string;
  dentistName?: string;
  appointmentDate: string;
  status: string;
  notes: string | null;
  toothNumber: number | null;
  procedureType: string | null;
  complexity: string | null;
  healthIssues: string | null;
  convertedToProcedure: boolean;
  procedureId: number | null;
};

type Patient = {
  id: number;
  name: string;
};

type Dentist = {
  id: number;
  name: string;
};

// Esquema de validação para o formulário de agendamento
const appointmentSchema = z.object({
  patientId: z.number().min(1, { message: "Paciente é obrigatório" }),
  dentistId: z.number().min(1, { message: "Dentista é obrigatório" }),
  appointmentDate: z.date({ 
    required_error: "Data do agendamento é obrigatória" 
  }),
  status: z.string({ required_error: "Status é obrigatório" }),
  notes: z.string().nullable().optional(),
  toothNumber: z.number().nullable().optional(),
  procedureType: z.string().nullable().optional(),
  complexity: z.string().nullable().optional(),
  healthIssues: z.string().nullable().optional(),
  appointmentTime: z.string(),
});

export default function Appointments() {
  const [openNewAppointmentDialog, setOpenNewAppointmentDialog] = useState(false);
  const [openCalendlyDialog, setOpenCalendlyDialog] = useState(false);
  const [calendlyToken, setCalendlyToken] = useState("");
  const [syncingCalendly, setSyncingCalendly] = useState(false);
  const { toast } = useToast();

  // Buscar lista de agendamentos
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ["/api/appointments"],
    select: (data: Appointment[]) => data.sort((a, b) => 
      new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
    )
  });

  // Buscar lista de pacientes para o formulário
  const { data: patients } = useQuery({
    queryKey: ["/api/patients"],
  });

  // Buscar lista de dentistas para o formulário
  const { data: dentists } = useQuery({
    queryKey: ["/api/dentists"],
  });

  // Mutation para criar novo agendamento
  const createAppointmentMutation = useMutation({
    mutationFn: (data: any) => {
      return apiRequest("/api/appointments", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Agendamento criado com sucesso",
        description: "O novo agendamento foi adicionado ao sistema",
      });
      setOpenNewAppointmentDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar agendamento",
        description: error.message || "Ocorreu um erro ao criar o agendamento",
        variant: "destructive",
      });
    },
  });

  // Mutation para converter agendamento em procedimento
  const convertToProcedureMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/appointments/${id}/convert`, "POST");
    },
    onSuccess: () => {
      toast({
        title: "Agendamento convertido",
        description: "O agendamento foi convertido em procedimento com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/procedures"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao converter agendamento",
        description: error.message || "Ocorreu um erro ao converter o agendamento",
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir um agendamento
  const deleteAppointmentMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/appointments/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Agendamento excluído",
        description: "O agendamento foi excluído com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir agendamento",
        description: error.message || "Ocorreu um erro ao excluir o agendamento",
        variant: "destructive",
      });
    },
  });

  // Mutation para sincronizar com Calendly
  const syncCalendlyMutation = useMutation({
    mutationFn: (token: string) => {
      return apiRequest("/api/calendly/sync", "POST", { accessToken: token });
    },
    onSuccess: (data) => {
      toast({
        title: "Sincronização com Calendly concluída",
        description: `Criados: ${data.created}, Atualizados: ${data.updated}, Erros: ${data.errors}`,
      });
      setOpenCalendlyDialog(false);
      setSyncingCalendly(false);
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na sincronização",
        description: error.message || "Ocorreu um erro ao sincronizar com Calendly",
        variant: "destructive",
      });
      setSyncingCalendly(false);
    },
  });

  // Formulário para novo agendamento
  const form = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientId: undefined,
      dentistId: undefined,
      status: "SCHEDULED",
      appointmentDate: undefined,
      notes: "",
      toothNumber: null,
      procedureType: null,
      complexity: null,
      healthIssues: null,
      appointmentTime: "09:00",
    },
  });

  function onSubmit(values: z.infer<typeof appointmentSchema>) {
    // Combinar data e hora
    const appointmentDate = new Date(values.appointmentDate);
    const [hours, minutes] = values.appointmentTime.split(':').map(Number);
    appointmentDate.setHours(hours, minutes);
    
    // Preparar os dados para envio
    const appointmentData = {
      ...values,
      appointmentDate,
    };
    
    // Remover o campo de hora separado
    delete appointmentData.appointmentTime;
    
    createAppointmentMutation.mutate(appointmentData);
  }

  function handleSyncCalendly() {
    setSyncingCalendly(true);
    syncCalendlyMutation.mutate(calendlyToken);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <div className="flex gap-2">
          <Dialog open={openCalendlyDialog} onOpenChange={setOpenCalendlyDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Sincronizar Calendly
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sincronizar com Calendly</DialogTitle>
                <DialogDescription>
                  Insira seu token de acesso da API do Calendly para sincronizar seus agendamentos.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="token" className="col-span-4">
                    Token de Acesso
                  </Label>
                  <Input
                    id="token"
                    placeholder="Seu token da API do Calendly"
                    className="col-span-4"
                    value={calendlyToken}
                    onChange={(e) => setCalendlyToken(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setOpenCalendlyDialog(false)} variant="outline">
                  Cancelar
                </Button>
                <Button onClick={handleSyncCalendly} disabled={!calendlyToken || syncingCalendly}>
                  {syncingCalendly && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sincronizar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={openNewAppointmentDialog} onOpenChange={setOpenNewAppointmentDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Agendamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Novo Agendamento</DialogTitle>
                <DialogDescription>
                  Crie um novo agendamento para um paciente.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="patientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Paciente</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um paciente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {patients?.map((patient: Patient) => (
                                <SelectItem key={patient.id} value={patient.id.toString()}>
                                  {patient.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="dentistId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dentista</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um dentista" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {dentists?.map((dentist: Dentist) => (
                                <SelectItem key={dentist.id} value={dentist.id.toString()}>
                                  {dentist.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="appointmentDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: ptBR })
                                  ) : (
                                    <span>Selecione uma data</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date(new Date().setHours(0, 0, 0, 0))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="appointmentTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horário</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="SCHEDULED">Agendado</SelectItem>
                              <SelectItem value="COMPLETED">Concluído</SelectItem>
                              <SelectItem value="CANCELLED">Cancelado</SelectItem>
                              <SelectItem value="RESCHEDULED">Reagendado</SelectItem>
                              <SelectItem value="NO_SHOW">Não compareceu</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="toothNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número do dente</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="48"
                              placeholder="Ex: 36"
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.value === "" ? null : parseInt(e.target.value))
                              }
                              value={field.value === null ? "" : field.value}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="procedureType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de procedimento</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Não definido</SelectItem>
                              <SelectItem value="TREATMENT">Tratamento</SelectItem>
                              <SelectItem value="RETREATMENT">Retratamento</SelectItem>
                              <SelectItem value="INSTRUMENT_REMOVAL">Remoção de instrumento</SelectItem>
                              <SelectItem value="OTHER">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="complexity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Complexidade</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a complexidade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Não definido</SelectItem>
                              <SelectItem value="LOW">Baixa</SelectItem>
                              <SelectItem value="MEDIUM">Média</SelectItem>
                              <SelectItem value="HIGH">Alta</SelectItem>
                              <SelectItem value="VERY_HIGH">Muito alta</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="healthIssues"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condições de saúde</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Condições de saúde relevantes do paciente"
                            className="resize-none"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Informe condições de saúde que possam ser relevantes para o procedimento.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Observações adicionais sobre o agendamento"
                            className="resize-none"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="submit" disabled={createAppointmentMutation.isPending}>
                      {createAppointmentMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Criar agendamento
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="upcoming">Próximos</TabsTrigger>
          <TabsTrigger value="completed">Concluídos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Todos os agendamentos</CardTitle>
              <CardDescription>Visualize todos os agendamentos do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAppointments ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : appointments && appointments.length > 0 ? (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Dentista</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Dente</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.map((appointment) => {
                        const appointmentDate = new Date(appointment.appointmentDate);
                        
                        return (
                          <TableRow key={appointment.id}>
                            <TableCell>
                              {format(appointmentDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell>{appointment.patientName}</TableCell>
                            <TableCell>{appointment.dentistName}</TableCell>
                            <TableCell>
                              <div className={`px-2 py-1 rounded-full text-xs inline-block
                                ${appointment.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' : ''}
                                ${appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : ''}
                                ${appointment.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : ''}
                                ${appointment.status === 'RESCHEDULED' ? 'bg-yellow-100 text-yellow-800' : ''}
                                ${appointment.status === 'NO_SHOW' ? 'bg-gray-100 text-gray-800' : ''}
                              `}>
                                {appointment.status === 'SCHEDULED' && 'Agendado'}
                                {appointment.status === 'COMPLETED' && 'Concluído'}
                                {appointment.status === 'CANCELLED' && 'Cancelado'}
                                {appointment.status === 'RESCHEDULED' && 'Reagendado'}
                                {appointment.status === 'NO_SHOW' && 'Não compareceu'}
                              </div>
                            </TableCell>
                            <TableCell>{appointment.toothNumber || '-'}</TableCell>
                            <TableCell>
                              {appointment.procedureType === 'TREATMENT' && 'Tratamento'}
                              {appointment.procedureType === 'RETREATMENT' && 'Retratamento'}
                              {appointment.procedureType === 'INSTRUMENT_REMOVAL' && 'Remoção de instrumento'}
                              {appointment.procedureType === 'OTHER' && 'Outro'}
                              {!appointment.procedureType && '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                {!appointment.convertedToProcedure && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => convertToProcedureMutation.mutate(appointment.id)}
                                    disabled={convertToProcedureMutation.isPending}
                                  >
                                    <ClipboardEdit className="h-4 w-4 mr-1" />
                                    Converter
                                  </Button>
                                )}
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => deleteAppointmentMutation.mutate(appointment.id)}
                                  disabled={deleteAppointmentMutation.isPending}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  Nenhum agendamento encontrado.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="upcoming" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Próximos agendamentos</CardTitle>
              <CardDescription>Visualize os agendamentos futuros</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAppointments ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : appointments ? (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Dentista</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Dente</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments
                        .filter(app => new Date(app.appointmentDate) >= new Date() && app.status !== 'CANCELLED')
                        .map((appointment) => {
                          const appointmentDate = new Date(appointment.appointmentDate);
                          
                          return (
                            <TableRow key={appointment.id}>
                              <TableCell>
                                {format(appointmentDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </TableCell>
                              <TableCell>{appointment.patientName}</TableCell>
                              <TableCell>{appointment.dentistName}</TableCell>
                              <TableCell>
                                <div className={`px-2 py-1 rounded-full text-xs inline-block
                                  ${appointment.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' : ''}
                                  ${appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : ''}
                                  ${appointment.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : ''}
                                  ${appointment.status === 'RESCHEDULED' ? 'bg-yellow-100 text-yellow-800' : ''}
                                  ${appointment.status === 'NO_SHOW' ? 'bg-gray-100 text-gray-800' : ''}
                                `}>
                                  {appointment.status === 'SCHEDULED' && 'Agendado'}
                                  {appointment.status === 'COMPLETED' && 'Concluído'}
                                  {appointment.status === 'CANCELLED' && 'Cancelado'}
                                  {appointment.status === 'RESCHEDULED' && 'Reagendado'}
                                  {appointment.status === 'NO_SHOW' && 'Não compareceu'}
                                </div>
                              </TableCell>
                              <TableCell>{appointment.toothNumber || '-'}</TableCell>
                              <TableCell>
                                {appointment.procedureType === 'TREATMENT' && 'Tratamento'}
                                {appointment.procedureType === 'RETREATMENT' && 'Retratamento'}
                                {appointment.procedureType === 'INSTRUMENT_REMOVAL' && 'Remoção de instrumento'}
                                {appointment.procedureType === 'OTHER' && 'Outro'}
                                {!appointment.procedureType && '-'}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  {!appointment.convertedToProcedure && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => convertToProcedureMutation.mutate(appointment.id)}
                                      disabled={convertToProcedureMutation.isPending}
                                    >
                                      <ClipboardEdit className="h-4 w-4 mr-1" />
                                      Converter
                                    </Button>
                                  )}
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => deleteAppointmentMutation.mutate(appointment.id)}
                                    disabled={deleteAppointmentMutation.isPending}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  Nenhum agendamento encontrado.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Agendamentos concluídos</CardTitle>
              <CardDescription>Visualize os agendamentos concluídos</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAppointments ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : appointments ? (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Dentista</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Dente</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments
                        .filter(app => app.status === 'COMPLETED')
                        .map((appointment) => {
                          const appointmentDate = new Date(appointment.appointmentDate);
                          
                          return (
                            <TableRow key={appointment.id}>
                              <TableCell>
                                {format(appointmentDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </TableCell>
                              <TableCell>{appointment.patientName}</TableCell>
                              <TableCell>{appointment.dentistName}</TableCell>
                              <TableCell>
                                <div className={`px-2 py-1 rounded-full text-xs inline-block
                                  ${appointment.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' : ''}
                                  ${appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : ''}
                                  ${appointment.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : ''}
                                  ${appointment.status === 'RESCHEDULED' ? 'bg-yellow-100 text-yellow-800' : ''}
                                  ${appointment.status === 'NO_SHOW' ? 'bg-gray-100 text-gray-800' : ''}
                                `}>
                                  {appointment.status === 'SCHEDULED' && 'Agendado'}
                                  {appointment.status === 'COMPLETED' && 'Concluído'}
                                  {appointment.status === 'CANCELLED' && 'Cancelado'}
                                  {appointment.status === 'RESCHEDULED' && 'Reagendado'}
                                  {appointment.status === 'NO_SHOW' && 'Não compareceu'}
                                </div>
                              </TableCell>
                              <TableCell>{appointment.toothNumber || '-'}</TableCell>
                              <TableCell>
                                {appointment.procedureType === 'TREATMENT' && 'Tratamento'}
                                {appointment.procedureType === 'RETREATMENT' && 'Retratamento'}
                                {appointment.procedureType === 'INSTRUMENT_REMOVAL' && 'Remoção de instrumento'}
                                {appointment.procedureType === 'OTHER' && 'Outro'}
                                {!appointment.procedureType && '-'}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  {!appointment.convertedToProcedure && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => convertToProcedureMutation.mutate(appointment.id)}
                                      disabled={convertToProcedureMutation.isPending}
                                    >
                                      <ClipboardEdit className="h-4 w-4 mr-1" />
                                      Converter
                                    </Button>
                                  )}
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => deleteAppointmentMutation.mutate(appointment.id)}
                                    disabled={deleteAppointmentMutation.isPending}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  Nenhum agendamento encontrado.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}