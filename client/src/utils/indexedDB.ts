// Definindo o nome do banco de dados e versão
const DB_NAME = 'fsf-endodontia-db';
const DB_VERSION = 1;

// Interface para o objeto de procedimento
interface PendingProcedure {
  id: string; // ID temporário para operações offline
  patientId: number;
  dentistId: number;
  toothNumber: number;
  procedureType: string;
  complexity: string;
  procedureDate: string;
  value: number;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentDate?: string;
  diagnosis?: string;
  prognosis?: string;
  canalMeasurements?: string;
  initialXrayUrl?: string;
  finalXrayUrl?: string;
  thirdXrayUrl?: string;
  notes?: string;
}

// Função para abrir a conexão com o IndexedDB
export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      reject('Erro ao abrir o banco de dados.');
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Cria o object store para procedimentos pendentes
      if (!db.objectStoreNames.contains('pending_procedures')) {
        db.createObjectStore('pending_procedures', { keyPath: 'id' });
      }
    };
  });
};

// Função para salvar um procedimento pendente no IndexedDB
export const savePendingProcedure = async (procedure: PendingProcedure): Promise<string> => {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('pending_procedures', 'readwrite');
      const store = transaction.objectStore('pending_procedures');
      
      // Gera um ID temporário se não existir
      if (!procedure.id) {
        procedure.id = 'temp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      }
      
      const request = store.add(procedure);
      
      request.onerror = () => {
        reject('Erro ao salvar procedimento offline.');
      };
      
      request.onsuccess = () => {
        resolve(procedure.id);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Erro ao salvar procedimento offline:', error);
    throw error;
  }
};

// Função para obter todos os procedimentos pendentes
export const getPendingProcedures = async (): Promise<PendingProcedure[]> => {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('pending_procedures', 'readonly');
      const store = transaction.objectStore('pending_procedures');
      const request = store.getAll();
      
      request.onerror = () => {
        reject('Erro ao recuperar procedimentos pendentes.');
      };
      
      request.onsuccess = (event) => {
        resolve(request.result);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Erro ao recuperar procedimentos pendentes:', error);
    return [];
  }
};

// Função para remover um procedimento pendente após sincronização
export const removePendingProcedure = async (id: string): Promise<boolean> => {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('pending_procedures', 'readwrite');
      const store = transaction.objectStore('pending_procedures');
      const request = store.delete(id);
      
      request.onerror = () => {
        reject(false);
      };
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Erro ao remover procedimento pendente:', error);
    return false;
  }
};

// Verificar se há conexão com a internet
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Função para registrar listener para eventos de conexão
export const setupConnectivityListeners = (
  onlineCallback: () => void,
  offlineCallback: () => void
) => {
  window.addEventListener('online', onlineCallback);
  window.addEventListener('offline', offlineCallback);
  
  // Retorna uma função para remover os listeners quando necessário
  return () => {
    window.removeEventListener('online', onlineCallback);
    window.removeEventListener('offline', offlineCallback);
  };
};

// Função para sincronizar procedimentos pendentes quando online
export const syncPendingProcedures = async (): Promise<number> => {
  // Verifica se está online
  if (!isOnline()) {
    return 0;
  }
  
  try {
    // Obtém todos os procedimentos pendentes
    const pendingProcedures = await getPendingProcedures();
    let syncCount = 0;
    
    // Para cada procedimento pendente
    for (const procedure of pendingProcedures) {
      try {
        // Envia para o servidor
        const response = await fetch('/api/procedures', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(procedure),
        });
        
        if (response.ok) {
          // Remove do indexedDB após sincronizar com sucesso
          await removePendingProcedure(procedure.id);
          syncCount++;
        }
      } catch (error) {
        console.error(`Erro ao sincronizar procedimento ${procedure.id}:`, error);
      }
    }
    
    return syncCount;
  } catch (error) {
    console.error('Erro durante a sincronização:', error);
    return 0;
  }
};

// Registra uma solicitação de sincronização com o service worker
export const requestSync = async (): Promise<boolean> => {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      // Verificar se a API de sincronização está disponível no registro
      if ('sync' in registration) {
        await (registration as any).sync.register('sync-procedures');
        return true;
      }
    } catch (error) {
      console.error('Erro ao registrar sincronização:', error);
    }
  }
  
  // Fallback para sincronização imediata se a Background Sync API não for suportada
  const syncedCount = await syncPendingProcedures();
  return syncedCount > 0;
};