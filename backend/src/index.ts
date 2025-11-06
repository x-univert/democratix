// IMPORTANT: Load environment variables BEFORE any other imports
// This ensures that all services (like MultiversXService) can access env vars during initialization
// Updated: 3 Nov 2025 - Added WebSocket support
import dotenv from 'dotenv';
dotenv.config();

import express, { Application } from 'express';
import cors from 'cors';
import http from 'http';
import { logger } from './utils/logger';
import electionRoutes from './routes/elections';
import voterRoutes from './routes/voters';
import voteRoutes from './routes/votes';
import cryptoRoutes from './routes/crypto';
import zkProofRoutes from './routes/zkProof';
import { zkVerifier } from './services/zkVerifierService';
import { websocketService } from './services/websocketService';

const app: Application = express();
const httpServer = http.createServer(app);
const PORT = process.env.API_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/elections', electionRoutes);
app.use('/api/voters', voterRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api/zk', zkProofRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Initialize services and start server
async function startServer() {
  try {
    // Initialiser le service zk-SNARK
    logger.info('🔐 Initializing zk-SNARK verifier...');
    await zkVerifier.initialize();
    logger.info('✅ zk-SNARK verifier initialized successfully');

    // Initialiser le service WebSocket
    logger.info('🔌 Initializing WebSocket service...');
    websocketService.initialize(httpServer);
    logger.info('✅ WebSocket service initialized successfully');

    // Démarrer le serveur HTTP + WebSocket
    httpServer.listen(PORT, () => {
      logger.info(`🚀 DEMOCRATIX Backend démarré sur le port ${PORT}`);
      logger.info(`📊 Environnement: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`⛓️  Réseau MultiversX: ${process.env.MULTIVERSX_NETWORK}`);
      logger.info(`🔐 zk-SNARK endpoints: /api/zk/*`);
      logger.info(`🔌 WebSocket available on ws://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
