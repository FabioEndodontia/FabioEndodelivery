import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../shared/schema-sqlite';
import path from 'path';
import fs from 'fs';

// Configura o caminho do banco de dados SQLite
const dbPath = path.join(process.cwd(), 'endodelivery.sqlite');

// Inicializa o banco de dados SQLite
const sqlite = new Database(dbPath);

// Configurações para melhorar a performance
sqlite.pragma('journal_mode = WAL');  // Write-Ahead Logging para melhorar concorrência
sqlite.pragma('synchronous = NORMAL'); // Sincronização menos restritiva para melhor performance

// Exporta a conexão drizzle para uso em outros módulos
export const db = drizzle(sqlite, { schema });

// Função para fechar a conexão com o banco de dados com segurança
export function closeDatabase() {
  try {
    if (sqlite) {
      sqlite.close();
      console.log('Conexão SQLite fechada com sucesso');
    }
  } catch (err) {
    console.error('Erro ao fechar conexão SQLite:', err);
  }
}

// Função para realizar backup do banco de dados SQLite
export function backupDatabase(backupPath: string) {
  try {
    // Garante que todas as transações estão confirmadas
    sqlite.pragma('wal_checkpoint(FULL)');
    
    // Realizamos o backup completo copiando o arquivo diretamente
    fs.copyFileSync(dbPath, backupPath);
    
    // Se houver arquivo WAL (Write-Ahead Log), copie-o também
    const walPath = `${dbPath}-wal`;
    if (fs.existsSync(walPath)) {
      fs.copyFileSync(walPath, `${backupPath}-wal`);
    }
    
    // Se houver arquivo SHM (Shared Memory), copie-o também
    const shmPath = `${dbPath}-shm`;
    if (fs.existsSync(shmPath)) {
      fs.copyFileSync(shmPath, `${backupPath}-shm`);
    }
    
    console.log(`Backup do SQLite criado com sucesso em ${backupPath}`);
  } catch (error) {
    console.error('Erro ao criar backup do SQLite:', error);
    throw error;
  }
}

// Configurar handler para fechar o banco ao encerrar
process.on('exit', closeDatabase);
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});