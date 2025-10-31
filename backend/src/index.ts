import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import electionRoutes from './routes/elections';
import voterRoutes from './routes/voters';
import voteRoutes from './routes/votes';
import cryptoRoutes from './routes/crypto';
import zkProofRoutes from './routes/zkProof';
import { zkVerifier } from './services/zkVerifierService';

dotenv.config();

const app: Application = express();
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

// Initialize zkVerifier and start server
async function startServer() {
  try {
    // Initialiser le service zk-SNARK
    logger.info('🔐 Initializing zk-SNARK verifier...');
    await zkVerifier.initialize();
    logger.info('✅ zk-SNARK verifier initialized successfully');

    // Démarrer le serveur
    app.listen(PORT, () => {
      logger.info(`🚀 DEMOCRATIX Backend démarré sur le port ${PORT}`);
      logger.info(`📊 Environnement: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`⛓️  Réseau MultiversX: ${process.env.MULTIVERSX_NETWORK}`);
      logger.info(`🔐 zk-SNARK endpoints: /api/zk/*`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
