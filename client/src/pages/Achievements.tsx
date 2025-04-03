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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Trophy, Award, Star, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTitle } from "@/components/ui/page-title";
import { Link } from "wouter";

const achievementFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  description: z.string().min(5, "Descrição deve ter pelo menos 5 caracteres"),
  imageUrl: z.string().url("URL de imagem inválida").optional().or(z.literal("")),
  pointValue: z.coerce.number().min(1, "Valor de pontos deve ser pelo menos 1"),
  achievementType: z.string(),
});

type AchievementFormValues = z.infer<typeof achievementFormSchema>;

interface Achievement {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
  pointValue: number;
  achievementType: string;
  createdAt: string;
  earnedDate?: string; // Para conquistas do usuário
}

const AchievementItem: React.FC<{ achievement: Achievement; isAdmin?: boolean; isEarned?: boolean }> = ({ 
  achievement, 
  isAdmin = false,
  isEarned = false
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const awardMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/achievements/${achievement.id}/award`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/achievements/user"] });
      toast({
        title: "Conquista concedida",
        description: "A conquista foi concedida com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível conceder a conquista",
        variant: "destructive",
      });
    },
  });

  const handleAward = () => {
    awardMutation.mutate();
  };

  const getAchievementTypeText = (type: string) => {
    switch (type) {
      case "MILESTONE":
        return "Marco";
      case "PERFORMANCE":
        return "Desempenho";
      case "MASTERY":
        return "Maestria";
      case "CONSISTENCY":
        return "Consistência";
      case "SPECIAL":
        return "Especial";
      default:
        return type;
    }
  };

  const getAchievementTypeColor = (type: string) => {
    switch (type) {
      case "MILESTONE":
        return "bg-blue-100 text-blue-800";
      case "PERFORMANCE":
        return "bg-green-100 text-green-800";
      case "MASTERY":
        return "bg-purple-100 text-purple-800";
      case "CONSISTENCY":
        return "bg-amber-100 text-amber-800";
      case "SPECIAL":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <Card className={isEarned ? "border-amber-500" : ""}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              {achievement.name}
              {isEarned && <Trophy className="h-4 w-4 text-amber-500" />}
            </CardTitle>
            <CardDescription className="flex gap-2 mt-1">
              <Badge className={getAchievementTypeColor(achievement.achievementType)}>
                {getAchievementTypeText(achievement.achievementType)}
              </Badge>
              <Badge variant="outline">{achievement.pointValue} pontos</Badge>
            </CardDescription>
          </div>
          {achievement.imageUrl && (
            <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden">
              <img 
                src={achievement.imageUrl} 
                alt={achievement.name} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {!achievement.imageUrl && (
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <Award className="h-6 w-6 text-slate-500" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-4">{achievement.description}</p>
        
        {isEarned && achievement.earnedDate && (
          <p className="text-sm text-amber-600 font-medium">
            <Star className="h-3 w-3 inline mr-1" />
            Conquistado em {formatDate(achievement.earnedDate)}
          </p>
        )}
        
        {isAdmin && !isEarned && (
          <Button 
            size="sm" 
            onClick={handleAward} 
            disabled={awardMutation.isPending}
            className="mt-2"
          >
            <Trophy className="h-4 w-4 mr-1" />
            Conceder Conquista
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default function Achievements() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isNewAchievementOpen, setIsNewAchievementOpen] = React.useState(false);
  const [selectedTab, setSelectedTab] = React.useState("earned");
  const [isAdmin, setIsAdmin] = React.useState(true); // Temporário, deve vir de autenticação

  const earnedAchievementsQuery = useQuery({
    queryKey: ["/api/achievements/user"],
    enabled: selectedTab === "earned",
  });

  const allAchievementsQuery = useQuery({
    queryKey: ["/api/achievements"],
    enabled: selectedTab === "all" || selectedTab === "available",
  });

  const form = useForm<AchievementFormValues>({
    resolver: zodResolver(achievementFormSchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
      pointValue: 10,
      achievementType: "MILESTONE",
    },
  });

  const createAchievementMutation = useMutation({
    mutationFn: async (values: AchievementFormValues) => {
      return apiRequest("/api/achievements", {
        method: "POST",
        body: JSON.stringify(values),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      toast({
        title: "Conquista criada",
        description: "A conquista foi criada com sucesso",
      });
      form.reset();
      setIsNewAchievementOpen(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar a conquista",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: AchievementFormValues) => {
    // Trata campo opcional
    if (values.imageUrl === "") {
      values.imageUrl = undefined;
    }
    
    createAchievementMutation.mutate(values);
  };

  // Filtra conquistas disponíveis (todas menos as já conquistadas)
  const availableAchievements = React.useMemo(() => {
    if (!allAchievementsQuery.data || !earnedAchievementsQuery.data) return [];
    
    const earnedIds = earnedAchievementsQuery.data.map((a: Achievement) => a.id);
    return allAchievementsQuery.data.filter((a: Achievement) => !earnedIds.includes(a.id));
  }, [allAchievementsQuery.data, earnedAchievementsQuery.data]);

  // Exibe conquistas baseado na tab selecionada
  const displayAchievements = React.useMemo(() => {
    switch (selectedTab) {
      case "earned":
        return earnedAchievementsQuery.data || [];
      case "available":
        return availableAchievements;
      case "all":
        return allAchievementsQuery.data || [];
      default:
        return [];
    }
  }, [selectedTab, earnedAchievementsQuery.data, availableAchievements, allAchievementsQuery.data]);

  const isLoading = (selectedTab === "earned" && earnedAchievementsQuery.isLoading) ||
                    ((selectedTab === "all" || selectedTab === "available") && allAchievementsQuery.isLoading);

  return (
    <div className="container py-6">
      <PageTitle>Conquistas</PageTitle>
      
      <div className="flex justify-between mb-6">
        <Button variant="outline" onClick={() => window.history.back()}>
          Voltar
        </Button>
        
        {isAdmin && (
          <Button onClick={() => setIsNewAchievementOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-1" /> 
            Nova Conquista
          </Button>
        )}
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="earned">
            Minhas Conquistas
            {earnedAchievementsQuery.data && earnedAchievementsQuery.data.length > 0 && (
              <Badge className="ml-2">{earnedAchievementsQuery.data.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="available">Disponíveis</TabsTrigger>
          {isAdmin && <TabsTrigger value="all">Todas</TabsTrigger>}
        </TabsList>
        
        <TabsContent value={selectedTab} className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <Skeleton className="h-6 w-40" />
                      <Skeleton className="h-4 w-24 mt-2" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-full" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : displayAchievements.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Award className="h-12 w-12 text-slate-300 mb-2" />
                {selectedTab === "earned" ? (
                  <p className="text-center text-slate-500">
                    Você ainda não conquistou nenhuma conquista. Continue trabalhando em suas metas!
                  </p>
                ) : selectedTab === "available" ? (
                  <p className="text-center text-slate-500">
                    Não há conquistas disponíveis para desbloquear no momento.
                  </p>
                ) : (
                  <p className="text-center text-slate-500">
                    Nenhuma conquista foi criada ainda. Crie a primeira!
                  </p>
                )}
                {isAdmin && selectedTab === "all" && (
                  <Button className="mt-4" onClick={() => setIsNewAchievementOpen(true)}>
                    Criar Conquista
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayAchievements.map((achievement: Achievement) => (
                <AchievementItem 
                  key={achievement.id} 
                  achievement={achievement} 
                  isAdmin={isAdmin && selectedTab === "all"}
                  isEarned={selectedTab === "earned"}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isNewAchievementOpen} onOpenChange={setIsNewAchievementOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Conquista</DialogTitle>
            <DialogDescription>
              Crie uma nova conquista para motivar e reconhecer realizações.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Conquista</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Especialista em Tratamentos" {...field} />
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
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Como conquistar esta realização..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="achievementType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Conquista</FormLabel>
                      <FormControl>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="MILESTONE">Marco</option>
                          <option value="PERFORMANCE">Desempenho</option>
                          <option value="MASTERY">Maestria</option>
                          <option value="CONSISTENCY">Consistência</option>
                          <option value="SPECIAL">Especial</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="pointValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor em Pontos</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da Imagem (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://exemplo.com/imagem.png" {...field} />
                    </FormControl>
                    <FormDescription>
                      Deixe em branco para usar o ícone padrão.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createAchievementMutation.isPending}
                >
                  {createAchievementMutation.isPending ? "Criando..." : "Criar Conquista"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}