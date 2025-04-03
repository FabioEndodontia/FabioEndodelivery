import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, PlusCircle, Trophy, Target, Award, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTitle } from "@/components/ui/page-title";
import { DatePicker } from "@/components/ui/date-picker";

const goalFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  goalType: z.string(),
  targetValue: z.coerce.number().min(1, "Valor da meta deve ser pelo menos 1"),
  startDate: z.date(),
  endDate: z.date(),
  frequency: z.string(),
  difficulty: z.string(),
  dentistId: z.number().optional().nullable(),
  procedureType: z.string().optional().nullable(),
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

interface Goal {
  id: number;
  name: string;
  description: string | null;
  goalType: string;
  targetValue: number;
  currentValue: number;
  startDate: string;
  endDate: string;
  frequency: string;
  difficulty: string;
  dentistId: number | null;
  procedureType: string | null;
  isActive: boolean;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
}

const GoalItem: React.FC<{ goal: Goal }> = ({ goal }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [manualProgress, setManualProgress] = React.useState<number | "">("");

  const percentComplete = Math.min(
    Math.round((goal.currentValue / goal.targetValue) * 100),
    100
  );

  const updateProgressMutation = useMutation({
    mutationFn: async (value: number) => {
      return apiRequest(`/api/financial-goals/${goal.id}/progress`, {
        method: "POST",
        body: JSON.stringify({ value }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-goals/active"] });
      toast({
        title: "Progresso atualizado",
        description: "O progresso da meta foi atualizado com sucesso",
      });
      setManualProgress("");
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o progresso",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  const handleProgressUpdate = () => {
    if (manualProgress !== "") {
      updateProgressMutation.mutate(Number(manualProgress));
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "bg-green-100 text-green-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "HARD":
        return "bg-orange-100 text-orange-800";
      case "VERY_HARD":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getGoalTypeText = (type: string) => {
    switch (type) {
      case "REVENUE":
        return "Receita";
      case "PROCEDURE_COUNT":
        return "Número de Procedimentos";
      case "NEW_PATIENTS":
        return "Novos Pacientes";
      case "SPECIFIC_DENTIST":
        return "Receita por Dentista";
      case "SPECIFIC_PROCEDURE":
        return "Procedimentos Específicos";
      default:
        return type;
    }
  };

  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case "DAILY":
        return "Diária";
      case "WEEKLY":
        return "Semanal";
      case "MONTHLY":
        return "Mensal";
      case "QUARTERLY":
        return "Trimestral";
      case "YEARLY":
        return "Anual";
      case "CUSTOM":
        return "Personalizada";
      default:
        return frequency;
    }
  };

  return (
    <Card className={goal.isCompleted ? "border-green-500" : ""}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">{goal.name}</CardTitle>
          {goal.isCompleted && (
            <Badge className="bg-green-500">
              <Trophy className="h-3 w-3 mr-1" /> Concluída
            </Badge>
          )}
        </div>
        <CardDescription className="flex gap-2">
          <Badge variant="outline">{getGoalTypeText(goal.goalType)}</Badge>
          <Badge className={getDifficultyColor(goal.difficulty)}>
            {goal.difficulty === "EASY" && "Fácil"}
            {goal.difficulty === "MEDIUM" && "Média"}
            {goal.difficulty === "HARD" && "Difícil"}
            {goal.difficulty === "VERY_HARD" && "Muito Difícil"}
          </Badge>
          <Badge variant="outline">{getFrequencyText(goal.frequency)}</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {goal.description && <p className="text-sm mb-3">{goal.description}</p>}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>
              Período: {formatDate(goal.startDate)} - {formatDate(goal.endDate)}
            </span>
            <span className="font-semibold">
              {goal.currentValue} / {goal.targetValue}{" "}
              {goal.goalType === "REVENUE" && "R$"}
            </span>
          </div>
          <Progress value={percentComplete} />
          {goal.isCompleted && goal.completedAt && (
            <div className="text-sm text-green-600">
              Concluída em {formatDate(goal.completedAt)}
            </div>
          )}
          {!goal.isCompleted && (
            <div className="flex gap-2 pt-2">
              <Input
                type="number"
                placeholder="Atualizar valor manualmente"
                value={manualProgress}
                onChange={(e) => setManualProgress(e.target.value ? Number(e.target.value) : "")}
                min={0}
                max={goal.targetValue}
              />
              <Button
                size="sm"
                onClick={handleProgressUpdate}
                disabled={manualProgress === "" || updateProgressMutation.isPending}
              >
                Atualizar
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function Goals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isNewGoalOpen, setIsNewGoalOpen] = React.useState(false);
  const [selectedTab, setSelectedTab] = React.useState("active");

  const activeGoalsQuery = useQuery({
    queryKey: ["/api/financial-goals/active"],
    enabled: selectedTab === "active",
  });

  const allGoalsQuery = useQuery({
    queryKey: ["/api/financial-goals"],
    enabled: selectedTab === "all",
  });

  const dentistsQuery = useQuery({
    queryKey: ["/api/dentists"],
  });

  const goalsQuery = selectedTab === "active" ? activeGoalsQuery : allGoalsQuery;

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      name: "",
      description: "",
      goalType: "REVENUE",
      targetValue: 0,
      frequency: "MONTHLY",
      difficulty: "MEDIUM",
      dentistId: null,
      procedureType: null,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (values: GoalFormValues) => {
      return apiRequest("/api/financial-goals", {
        method: "POST",
        body: JSON.stringify(values),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-goals/active"] });
      toast({
        title: "Meta criada",
        description: "A meta financeira foi criada com sucesso",
      });
      form.reset();
      setIsNewGoalOpen(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar a meta financeira",
        variant: "destructive",
      });
    },
  });

  const checkGoalsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/financial-goals/check-progress", {
        method: "POST",
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-goals/active"] });
      const { updatedGoals, completedGoals } = data;
      
      if (updatedGoals > 0 || completedGoals > 0) {
        toast({
          title: "Metas atualizadas",
          description: `${updatedGoals} metas foram atualizadas e ${completedGoals} foram concluídas.`,
        });
      } else {
        toast({
          title: "Metas verificadas",
          description: "Nenhuma atualização foi necessária.",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível verificar o progresso das metas",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: GoalFormValues) => {
    createGoalMutation.mutate(values);
  };

  const goalTypeField = form.watch("goalType");

  React.useEffect(() => {
    // Limpa campos relacionados ao tipo de meta quando muda
    if (goalTypeField !== "SPECIFIC_DENTIST") {
      form.setValue("dentistId", null);
    }
    if (goalTypeField !== "SPECIFIC_PROCEDURE") {
      form.setValue("procedureType", null);
    }
  }, [goalTypeField, form]);

  return (
    <div className="container py-6">
      <PageTitle>Metas Financeiras e Conquistas</PageTitle>
      
      <div className="flex justify-between mb-6">
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsNewGoalOpen(true)}
            className="gap-1"
          >
            <PlusCircle className="h-4 w-4" /> 
            Nova Meta
          </Button>
          <Button 
            variant="outline" 
            onClick={() => checkGoalsMutation.mutate()}
            disabled={checkGoalsMutation.isPending}
          >
            <Target className="h-4 w-4 mr-1" /> 
            Verificar Progresso
          </Button>
        </div>
        <Button variant="outline" onClick={() => window.location.href = '/conquistas'}>
          <Award className="h-4 w-4 mr-1" /> 
          Minhas Conquistas
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" className="relative">
            Metas Ativas
            {activeGoalsQuery.data && activeGoalsQuery.data.length > 0 && (
              <Badge className="ml-2 absolute -top-2 -right-2">{activeGoalsQuery.data.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">Todas as Metas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          {activeGoalsQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-2 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activeGoalsQuery.data?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Target className="h-12 w-12 text-slate-300 mb-2" />
                <p className="text-center text-slate-500">
                  Nenhuma meta ativa. Crie uma nova meta para acompanhar seu progresso.
                </p>
                <Button className="mt-4" onClick={() => setIsNewGoalOpen(true)}>
                  Criar Meta
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeGoalsQuery.data?.map((goal: Goal) => (
                <GoalItem key={goal.id} goal={goal} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="all" className="space-y-4">
          {allGoalsQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-2 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : allGoalsQuery.data?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Target className="h-12 w-12 text-slate-300 mb-2" />
                <p className="text-center text-slate-500">
                  Nenhuma meta encontrada. Crie sua primeira meta financeira.
                </p>
                <Button className="mt-4" onClick={() => setIsNewGoalOpen(true)}>
                  Criar Meta
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allGoalsQuery.data?.map((goal: Goal) => (
                <GoalItem key={goal.id} goal={goal} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isNewGoalOpen} onOpenChange={setIsNewGoalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Meta Financeira</DialogTitle>
            <DialogDescription>
              Crie uma nova meta para acompanhar seu progresso financeiro ou de trabalho.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Meta</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Faturamento Mensal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Detalhes sobre esta meta..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="goalType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Meta</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="REVENUE">Receita</SelectItem>
                          <SelectItem value="PROCEDURE_COUNT">Número de Procedimentos</SelectItem>
                          <SelectItem value="NEW_PATIENTS">Novos Pacientes</SelectItem>
                          <SelectItem value="SPECIFIC_DENTIST">Receita por Dentista</SelectItem>
                          <SelectItem value="SPECIFIC_PROCEDURE">Procedimentos Específicos</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="targetValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Alvo</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder={form.watch("goalType") === "REVENUE" ? "R$" : "Quantidade"}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data Inicial</FormLabel>
                      <DatePicker date={field.value} setDate={field.onChange} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data Final</FormLabel>
                      <DatePicker date={field.value} setDate={field.onChange} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequência</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar frequência" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DAILY">Diária</SelectItem>
                          <SelectItem value="WEEKLY">Semanal</SelectItem>
                          <SelectItem value="MONTHLY">Mensal</SelectItem>
                          <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                          <SelectItem value="YEARLY">Anual</SelectItem>
                          <SelectItem value="CUSTOM">Personalizada</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dificuldade</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar dificuldade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="EASY">Fácil</SelectItem>
                          <SelectItem value="MEDIUM">Média</SelectItem>
                          <SelectItem value="HARD">Difícil</SelectItem>
                          <SelectItem value="VERY_HARD">Muito Difícil</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {form.watch("goalType") === "SPECIFIC_DENTIST" && (
                <FormField
                  control={form.control}
                  name="dentistId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dentista</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar dentista" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {dentistsQuery.data?.map((dentist: any) => (
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
              )}
              
              {form.watch("goalType") === "SPECIFIC_PROCEDURE" && (
                <FormField
                  control={form.control}
                  name="procedureType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Procedimento</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar tipo de procedimento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="TREATMENT">Tratamento</SelectItem>
                          <SelectItem value="RETREATMENT">Retratamento</SelectItem>
                          <SelectItem value="INSTRUMENT_REMOVAL">Remoção de Instrumento</SelectItem>
                          <SelectItem value="OTHER">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createGoalMutation.isPending}
                >
                  {createGoalMutation.isPending ? "Criando..." : "Criar Meta"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}