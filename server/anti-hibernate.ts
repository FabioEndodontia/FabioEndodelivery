import express from 'express';
import os from 'os';

// Formatação de tempo de atividade para exibir em formato legível
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (3600 * 24));
  seconds %= 3600 * 24;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;
  seconds = Math.floor(seconds);
  
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

/**
 * Configura um endpoint para manter o servidor ativo
 * Este endpoint pode ser usado para manter o aplicativo no Replit ativo
 * usando um serviço como UptimeRobot para enviar pings periódicos
 */
export function setupAntiHibernate(app: express.Express) {
  // Armazena o tempo de início do servidor
  const startTime = Date.now();
  
  // Endpoint de status para verificar a saúde do servidor
  app.get('/api/status', (req, res) => {
    const uptime = (Date.now() - startTime) / 1000; // Em segundos
    
    // Informações do sistema para diagnóstico
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: Math.round(os.totalmem() / (1024 * 1024)) + 'MB',
      freeMemory: Math.round(os.freemem() / (1024 * 1024)) + 'MB',
      loadAvg: os.loadavg(),
    };
    
    // Responde com informações de status do servidor
    res.json({
      status: 'online',
      message: 'Endodelivery API está funcionando corretamente',
      uptime: formatUptime(uptime),
      uptimeRaw: uptime,
      startedAt: new Date(startTime).toISOString(),
      currentTime: new Date().toISOString(),
      systemInfo
    });
  });
  
  // Endpoint simplificado para serviços de ping
  app.get('/ping', (req, res) => {
    res.status(200).send('pong');
  });
  
  // Registrar uma mensagem mostrando que o anti-hibernação foi configurado
  console.log('Rotas de anti-hibernação configuradas. Use /ping para manter o aplicativo ativo.');
}