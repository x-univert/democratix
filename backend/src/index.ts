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
// DEMOCRATIX V2.0 Routes
import ricRoutes from './routes/ric';
import petitionRoutes from './routes/petitions';
import institutionRoutes from './routes/institutions';
import pollRoutes from './routes/polls';
import { zkVerifier } from './services/zkVerifierService';
import { websocketService } from './services/websocketService';

const app: Application = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || process.env.API_PORT || 3003;

// CORS Configuration
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'https://localhost:3000',
  'https://localhost:3001',
  'https://localhost:3002',
].filter(Boolean);

logger.info(`🔒 CORS enabled for origins: ${allowedOrigins.join(', ')}`);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`❌ CORS blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
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

// V1.0 Routes (Élections)
app.use('/api/elections', electionRoutes);
app.use('/api/voters', voterRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api/zk', zkProofRoutes);

// V2.0 Routes (Participation citoyenne)
app.use('/api/ric', ricRoutes);
app.use('/api/petitions', petitionRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/polls', pollRoutes);

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
    // Initialiser le service zk-SNARK (optionnel en production)
    logger.info('🔐 Initializing zk-SNARK verifier...');
    try {
      await zkVerifier.initialize();
      logger.info('✅ zk-SNARK verifier initialized successfully');
    } catch (zkError: any) {
      logger.warn('⚠️  zk-SNARK verifier not available (circuits not found)');
      logger.warn('⚠️  Private voting with zk-proofs will be disabled');
      logger.warn(`⚠️  Error: ${zkError.message}`);
      // Continue server startup without zk-SNARK
    }

    // Initialiser le service WebSocket
    logger.info('🔌 Initializing WebSocket service...');
    websocketService.initialize(httpServer);
    logger.info('✅ WebSocket service initialized successfully');

    // Démarrer le serveur HTTP + WebSocket
    httpServer.listen(PORT, () => {
      logger.info(`🚀 DEMOCRATIX Backend démarré sur le port ${PORT}`);
      logger.info(`📊 Environnement: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`⛓️  Réseau MultiversX: ${process.env.MULTIVERSX_NETWORK}`);
      logger.info(`🔐 zk-SNARK endpoints: /api/zk/* (may be disabled)`);
      logger.info(`🔌 WebSocket available on ws://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
// Force restart
