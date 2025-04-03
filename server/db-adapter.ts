import { IStorage } from './storage';
import { DatabaseStorage } from './database-storage';
import { SQLiteDatabaseStorage } from './sqlite-database-storage';
import { closeDatabase } from './db-sqlite';
import { pool } from './db';

let storage: IStorage;

/**
 * Inicializa e retorna a interface de armazenamento apropriada
 * Automaticamente escolhe entre SQLite e PostgreSQL com base na disponibilidade
 */
export function initializeStorage(): IStorage {
  // Se já inicializamos o storage, retorne a instância existente
  if (storage) {
    return storage;
  }

  // Verifica se devemos usar SQLite baseado na variável de ambiente
  const useSQLite = process.env.USE_SQLITE === 'true';
  
  // Se temos a variável DATABASE_URL e não estamos forçando SQLite, use PostgreSQL
  if (process.env.DATABASE_URL && !useSQLite) {
    console.log('Inicializando armazenamento PostgreSQL');
    storage = new DatabaseStorage();
  } else {
    console.log('Inicializando armazenamento SQLite');
    storage = new SQLiteDatabaseStorage();
  }

  return storage;
}

/**
 * Inicializa o banco de dados e popula com dados iniciais se necessário
 */
export async function initializeDatabase() {
  const storageInstance = initializeStorage();
  
  try {
    if (storageInstance instanceof DatabaseStorage) {
      await (storageInstance as DatabaseStorage).seedInitialData();
    } else if (storageInstance instanceof SQLiteDatabaseStorage) {
      await (storageInstance as SQLiteDatabaseStorage).seedInitialData();
    }
    console.log('Banco de dados inicializado com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
  }
  
  return storageInstance;
}

// Configura manipulador para fechar o banco de dados ao encerrar
process.on('exit', () => {
  if (process.env.USE_SQLITE === 'true' || !process.env.DATABASE_URL) {
    closeDatabase();
  } else if (pool) {
    pool.end();
  }
});

// Inicializa o armazenamento
storage = initializeStorage();

// Exporta o storage para outros módulos
export { storage };