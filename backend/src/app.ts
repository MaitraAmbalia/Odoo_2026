import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import apiRoutes from './routes/index';

const app = express();

// ── Core middleware ──────────────────────────────────────
app.use(cors({
  origin: env.CLIENT_ORIGIN,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Static file serving (uploads) ────────────────────────
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));

// ── API routes ───────────────────────────────────────────
app.use('/api/v1', apiRoutes);

// ── Error handling ───────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
