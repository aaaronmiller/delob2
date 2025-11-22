import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { healthRoutes } from './routes/health.js';
import { apiRoutes } from './routes/api.js';
import type { Context } from 'hono';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Routes
app.route('/health', healthRoutes);
app.route('/api', apiRoutes);

// Root
app.get('/', (c) => {
  return c.json({
    name: 'Delobotomize Backend',
    version: '1.0.0',
    status: 'running'
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

const port = process.env.PORT || 4000;

console.log(`🚀 Delobotomize backend starting on port ${port}`);

interface ServerExport {
  port: number;
  fetch: (request: Request) => Response | Promise<Response>;
}

const serverExport: ServerExport = {
  port: Number(port),
  fetch: app.fetch.bind(app),
};

export default serverExport;
