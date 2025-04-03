import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { setupConnectivityListeners, syncPendingProcedures } from '@/utils/indexedDB';
import { useToast } from '@/hooks/use-toast';

export default function ConnectivityStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    // Função para lidar com o evento 'online'
    const handleOnline = async () => {
      setIsOnline(true);
      toast({
        title: 'Conexão restaurada',
        description: 'Você está online novamente. Sincronizando dados...',
        variant: 'default',
      });
      
      // Inicia a sincronização
      setIsSyncing(true);
      try {
        const syncedCount = await syncPendingProcedures();
        if (syncedCount > 0) {
          toast({
            title: 'Sincronização concluída',
            description: `${syncedCount} procedimento(s) sincronizado(s) com sucesso.`,
            variant: 'default',
          });
          setPendingSyncCount(prev => Math.max(0, prev - syncedCount));
        }
      } catch (error) {
        console.error('Erro durante a sincronização:', error);
        toast({
          title: 'Erro de sincronização',
          description: 'Não foi possível sincronizar todos os dados. Tente novamente mais tarde.',
          variant: 'destructive',
        });
      } finally {
        setIsSyncing(false);
      }
    };

    // Função para lidar com o evento 'offline'
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'Sem conexão',
        description: 'Você está offline. Os dados serão salvos localmente e sincronizados quando a conexão for restaurada.',
        variant: 'destructive',
      });
    };

    // Configura os listeners para eventos de conectividade
    const cleanupListeners = setupConnectivityListeners(handleOnline, handleOffline);

    // Limpa os listeners ao desmontar o componente
    return cleanupListeners;
  }, [toast]);

  // Registra um listener para a mensagem de sincronização do service worker
  useEffect(() => {
    const handleSyncMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SYNC_COMPLETED') {
        toast({
          title: 'Sincronização concluída',
          description: event.data.message,
          variant: 'default',
        });
        // Atualiza o contador de pendências
        setPendingSyncCount(0);
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleSyncMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleSyncMessage);
    };
  }, [toast]);

  // Estilização do indicador de status
  const statusStyle = isOnline
    ? 'bg-green-600 text-white'
    : 'bg-red-600 text-white';

  return (
    <div className={`fixed bottom-4 right-4 flex items-center gap-2 py-1 px-3 rounded-full shadow-md ${statusStyle}`}>
      {isOnline ? (
        <Wifi size={16} />
      ) : (
        <WifiOff size={16} />
      )}
      <span className="text-sm font-medium">
        {isOnline ? 'Online' : 'Offline'}
      </span>
      {pendingSyncCount > 0 && (
        <span className="ml-1 text-xs bg-white text-gray-800 rounded-full py-0.5 px-2">
          {pendingSyncCount}
        </span>
      )}
      {isSyncing && (
        <span className="ml-1 h-2 w-2 rounded-full bg-white animate-pulse"></span>
      )}
    </div>
  );
}