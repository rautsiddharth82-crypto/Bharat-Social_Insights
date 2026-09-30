import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const host = '0.0.0.0';

app.use(express.json());

// Health check endpoint for Cloud Run container probes
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Resolve client dist path
const distPath = path.resolve(process.cwd(), 'dist');

if (fs.existsSync(distPath)) {
  // Serve static assets from dist
  app.use(express.static(distPath, { maxAge: '1h' }));

  // SPA fallback for HTML5 history API navigation
  app.get('*', (req, res, next) => {
    // If request has file extension (and wasn't handled by static), pass to 404
    if (path.extname(req.path)) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('*', (_req, res) => {
    res.status(503).send('Application build in progress or dist directory not found. Run npm run build.');
  });
}

// In Cloud Run or production deployment, process.env.PORT must be respected first.
// If process.env.PORT is not set, default to 3000 for standard dev / preview servers.
const port = parseInt(process.env.PORT || '3000', 10);

const server = app.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
});

server.on('error', (err: any) => {
  console.error(`Server error on port ${port}:`, err);
  if (err.code === 'EADDRINUSE') {
    const fallbackPort = port === 8080 ? 3000 : 8080;
    console.warn(`Port ${port} in use. Attempting one-time fallback to port ${fallbackPort}...`);
    const fallbackServer = app.listen(fallbackPort, host, () => {
      console.log(`Server listening on fallback port http://${host}:${fallbackPort}`);
    });
    fallbackServer.on('error', (fallbackErr: any) => {
      console.error(`Fallback server error on port ${fallbackPort}:`, fallbackErr);
    });
  }
});

const shutdown = () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
