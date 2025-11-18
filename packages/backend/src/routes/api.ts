import { Hono } from 'hono';

export const apiRoutes = new Hono();

// Info endpoint
apiRoutes.get('/info', (c) => {
  return c.json({
    name: 'Delobotomize API',
    version: '1.0.0',
    endpoints: {
      sessions: '/api/sessions',
      logs: '/api/logs',
      alerts: '/api/alerts',
      runs: '/api/runs'
    }
  });
});

// Sessions endpoints
apiRoutes.get('/sessions', (c) => {
  // TODO: Implement session listing using SessionStore
  return c.json({
    sessions: []
  });
});

apiRoutes.get('/sessions/:id', (c) => {
  const id = c.req.param('id');
  // TODO: Implement session details
  return c.json({
    sessionId: id,
    status: 'active',
    lastActivity: new Date().toISOString()
  });
});

// Proxy logs endpoints
apiRoutes.get('/logs', (c) => {
  // TODO: Implement log streaming
  return c.json({
    logs: []
  });
});

// Alerts endpoints
apiRoutes.get('/alerts', (c) => {
  // TODO: Implement alerts listing
  return c.json({
    alerts: []
  });
});

apiRoutes.post('/alerts/:id/acknowledge', async (c) => {
  const id = c.req.param('id');
  // TODO: Implement alert acknowledgment
  return c.json({
    acknowledged: true,
    alertId: id
  });
});

// Runs endpoints
apiRoutes.get('/runs', (c) => {
  // TODO: Implement runs listing using RunService
  return c.json({
    runs: []
  });
});

apiRoutes.get('/runs/:id', (c) => {
  const id = c.req.param('id');
  // TODO: Implement run details
  return c.json({
    runId: id,
    status: 'completed'
  });
});

apiRoutes.get('/runs/:id/manifest', (c) => {
  const id = c.req.param('id');
  // TODO: Implement manifest retrieval
  return c.json({
    runId: id,
    manifest: {}
  });
});
