import express from 'express';
import fs from 'fs';
import path from 'path';
import { closeDatabase, backupDatabase as backupSQLiteDatabase } from './db-sqlite';
import { pool } from './db';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const uploadsDir = path.join(process.cwd(), 'uploads');

// Garante que o diretório de uploads existe
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Cria um backup do banco de dados atual
 * Suporta tanto SQLite quanto PostgreSQL
 */
export function backupDatabase(): string {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const backupFilename = `backup_${timestamp}`;
  
  // Se estamos usando SQLite
  if (process.env.USE_SQLITE === 'true' || !process.env.DATABASE_URL) {
    const backupPath = path.join(uploadsDir, `${backupFilename}.sqlite`);
    backupSQLiteDatabase(backupPath);
    return backupPath;
  } 
  // Se estamos usando PostgreSQL
  else {
    const backupPath = path.join(uploadsDir, `${backupFilename}.sql`);
    // O backup real será feito assincronamente ao responder a requisição
    return backupPath;
  }
}

/**
 * Realiza backup do PostgreSQL usando pg_dump
 */
async function backupPostgresDatabase(backupPath: string): Promise<void> {
  try {
    // Extrai parâmetros de conexão do DATABASE_URL
    const connectionString = process.env.DATABASE_URL;
    
    // Executa pg_dump
    await execAsync(`pg_dump "${connectionString}" > "${backupPath}"`);
    console.log(`Backup do PostgreSQL criado com sucesso em ${backupPath}`);
  } catch (error) {
    console.error('Erro ao criar backup do PostgreSQL:', error);
    throw error;
  }
}

/**
 * Configura rotas de backup do banco de dados
 */
export function setupBackupRoutes(app: express.Express) {
  // Rota para criar backup manual do banco de dados
  app.get('/api/backup/database', async (req, res) => {
    try {
      const backupPath = backupDatabase();
      
      // Se estamos usando PostgreSQL, cria o backup assincronamente
      if (process.env.DATABASE_URL && process.env.USE_SQLITE !== 'true') {
        await backupPostgresDatabase(backupPath);
      }
      
      const filename = path.basename(backupPath);
      
      res.json({
        success: true,
        message: 'Backup do banco de dados criado com sucesso',
        filename,
        downloadUrl: `/api/backup/download/${filename}`
      });
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar backup do banco de dados'
      });
    }
  });
  
  // Rota para baixar um backup
  app.get('/api/backup/download/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo de backup não encontrado'
      });
    }
    
    res.download(filePath);
  });
  
  // Rota para listar todos os backups disponíveis
  app.get('/api/backup/list', (req, res) => {
    try {
      const files = fs.readdirSync(uploadsDir)
        .filter(file => file.startsWith('backup_'))
        .map(file => ({
          filename: file,
          path: path.join(uploadsDir, file),
          size: fs.statSync(path.join(uploadsDir, file)).size,
          created: fs.statSync(path.join(uploadsDir, file)).birthtime,
          downloadUrl: `/api/backup/download/${file}`
        }))
        .sort((a, b) => b.created.getTime() - a.created.getTime());
      
      res.json({
        success: true,
        backups: files
      });
    } catch (error) {
      console.error('Erro ao listar backups:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao listar backups disponíveis'
      });
    }
  });
  
  // Rota para excluir um backup
  app.delete('/api/backup/delete/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);
    
    try {
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Arquivo de backup não encontrado'
        });
      }
      
      fs.unlinkSync(filePath);
      
      res.json({
        success: true,
        message: `Backup ${filename} excluído com sucesso`
      });
    } catch (error) {
      console.error('Erro ao excluir backup:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao excluir arquivo de backup'
      });
    }
  });
  
  // Registrar informação de que as rotas de backup foram configuradas
  console.log('Rotas de backup do banco de dados configuradas.');
}