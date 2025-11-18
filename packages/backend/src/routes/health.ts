import { Hono } from 'hono';

export const healthRoutes = new Hono();

healthRoutes.get('/', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

healthRoutes.get('/ready', (c) => {
  // Check if services are ready
  const ready = true; // TODO: Implement actual readiness checks

  return c.json({
    ready,
    timestamp: new Date().toISOString()
  }, ready ? 200 : 503);
});

healthRoutes.get('/live', (c) => {
  return c.json({
    alive: true,
    timestamp: new Date().toISOString()
  });
});
