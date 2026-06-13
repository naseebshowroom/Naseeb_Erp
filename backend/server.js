import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';
import routes from './routes/index.js';

// ── Load environment variables ─────────────────────────────────────────────
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/naseeb_erp';
const isProduction = process.env.NODE_ENV === 'production';

// ── Security Headers ────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow Cloudinary images
}));

// ── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173', // Vite dev server
  'http://localhost:4173', // Vite preview server
  'http://localhost:5174', // Vite fallback
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://naseeb-erp.vercel.app', // Production frontend
  process.env.FRONTEND_URL,        // Injected via Railway/env config
  process.env.CLIENT_URL,          // Legacy fallback
].filter(Boolean)

const isAllowedOrigin = (origin) => {
  if (!origin) return true // Allow Postman, curl, mobile apps (no origin header)
  if (allowedOrigins.includes(origin)) return true
  // Allow local network IPs for mobile testing (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  if (/^http:\/\/(192\.168\.\d+\.\d+|172\.16\.\d+\.\d+|10\.\d+\.\d+\.\d+):\d+$/.test(origin)) return true
  return false
}

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS policy blocked origin: ${origin}`))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Handle OPTIONS preflight before any route
app.options('*', cors())

// ── Response Compression ────────────────────────────────────────────────────
app.use(compression());

// ── Request Logging ─────────────────────────────────────────────────────────
app.use(morgan(isProduction ? 'combined' : 'dev'));

// ── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Rate Limiting ───────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
  // In dev use a very high ceiling; production defaults to 500 per window
  max: parseInt(process.env.RATE_LIMIT_MAX) || (process.env.NODE_ENV === 'production' ? 500 : 10000),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down and try again later.' },
  // Skip rate-limiting for:
  // 1. Health checks (used by uptime monitors)
  // 2. Any request that already carries a valid Bearer token (authenticated ERP users)
  skip: (req) => {
    if (req.path === '/api/health') return true;
    if (req.headers.authorization?.startsWith('Bearer ')) return true;
    return false;
  },
});
app.use('/api', limiter);

// ── Health Check Endpoint ───────────────────────────────────────────────────
// Render pings this to verify the service is alive. Keep it lightweight.
app.get('/api/health', (req, res) => {
  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const memoryUsage = process.memoryUsage();
  res.status(200).json({
    success: true,
    status: 'healthy',
    environment: process.env.NODE_ENV,
    database: dbState[mongoose.connection.readyState] || 'unknown',
    uptime: Math.floor(process.uptime()) + 's',
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
      external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB'
    },
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, err.message);
  if (!isProduction) console.error(err.stack);

  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    success: false,
    message: isProduction && status === 500
      ? 'Internal server error. Please contact support.'
      : err.message || 'Internal Server Error',
  });
});

// ── MongoDB Connection & Server Start ─────────────────────────────────────────
const connectDB = async () => {
  try {
    // BUG 2 FIX: Railway cold-starts and Atlas shared-tier can take 10-20 s.
    // serverSelectionTimeoutMS: 5000 (old) was too short — upgraded to 30 s.
    // maxPoolSize: 10 prevents connection exhaustion under concurrent load.
    // retryWrites: true lets MongoDB driver retry failed write ops automatically.
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

// Mongoose connection event handlers
mongoose.connection.on('error', (err) => {
  console.error(`MongoDB runtime error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
});

// BUG 2 FIX: Added missing 'reconnected' handler so reconnects are visible in logs.
mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected successfully.');
});

// Start server after DB connects
const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Naseeb ERP API running in [${process.env.NODE_ENV}] mode on port ${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
  });

  // ── Graceful Shutdown (SIGTERM from Render/Docker/PM2) ─────────────────────
  const shutdown = (signal) => {
    console.log(`\n${signal} received. Closing server gracefully...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      await mongoose.connection.close();
      console.log('MongoDB connection closed. Process exiting.');
      process.exit(0);
    });

    // Force-exit if graceful shutdown takes too long
    setTimeout(() => {
      console.error('Forced exit after 10s timeout.');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
};

// ── Unhandled Error Safety Nets ───────────────────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
  // Don't crash — log and continue. In production, alert via monitoring service.
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  // Uncaught exceptions corrupt process state — restart is required.
  process.exit(1);
});

startServer();
