/**
 * Delobotomize Monitoring Server
 *
 * Inspired by: multi-agent-workflow by Apolo Pena
 * https://github.com/apolopena/multi-agent-workflow
 *
 * A simple event collection and storage server for Claude Code sessions.
 */

import Database from 'bun:sqlite';
import { serve } from 'bun';

const PORT = parseInt(process.env.PORT || '4000');
const DB_PATH = process.env.DB_PATH || '.delobotomize/monitoring.db';

// Initialize SQLite database
const db = new Database(DB_PATH, { create: true });

// Create events table
db.run(`
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    session_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    context TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create index for faster queries
db.run(`CREATE INDEX IF NOT EXISTS idx_session_id ON events(session_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_project_id ON events(project_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_timestamp ON events(timestamp)`);

console.log('📊 Delobotomize Monitoring Server');
console.log('   Inspired by multi-agent-workflow by Apolo Pena\n');
console.log(`   Database: ${DB_PATH}`);
console.log(`   Port: ${PORT}\n`);

// Prepared statements for performance
const insertEvent = db.prepare(`
  INSERT INTO events (id, type, timestamp, session_id, project_id, context)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const server = serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);

    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    // Handle OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    // Health check
    if (url.pathname === '/healthz') {
      return new Response(JSON.stringify({ status: 'ok' }), { headers });
    }

    // POST /api/events - Store event
    if (url.pathname === '/api/events' && req.method === 'POST') {
      return req.json().then(event => {
        try {
          // Validate event structure
          if (!event.id || !event.type || !event.timestamp || !event.session_id || !event.project_id) {
            return new Response(
              JSON.stringify({ error: 'Missing required fields' }),
              { status: 400, headers }
            );
          }

          // Insert into database
          insertEvent.run(
            event.id,
            event.type,
            event.timestamp,
            event.session_id,
            event.project_id,
            JSON.stringify(event.context || {})
          );

          console.log(`✓ Event: ${event.type} (${event.session_id.slice(0, 8)}...)`);

          return new Response(
            JSON.stringify({ success: true, id: event.id }),
            { headers }
          );
        } catch (error: any) {
          console.error('Error storing event:', error.message);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers }
          );
        }
      });
    }

    // GET /api/events - Query events
    if (url.pathname === '/api/events' && req.method === 'GET') {
      try {
        const sessionId = url.searchParams.get('session_id');
        const projectId = url.searchParams.get('project_id');
        const limit = parseInt(url.searchParams.get('limit') || '100');

        let query = 'SELECT * FROM events WHERE 1=1';
        const params: any[] = [];

        if (sessionId) {
          query += ' AND session_id = ?';
          params.push(sessionId);
        }

        if (projectId) {
          query += ' AND project_id = ?';
          params.push(projectId);
        }

        query += ' ORDER BY created_at DESC LIMIT ?';
        params.push(limit);

        const stmt = db.prepare(query);
        const events = stmt.all(...params);

        // Parse context JSON
        const parsedEvents = events.map((e: any) => ({
          ...e,
          context: JSON.parse(e.context)
        }));

        return new Response(
          JSON.stringify({ events: parsedEvents, count: parsedEvents.length }),
          { headers }
        );
      } catch (error: any) {
        console.error('Error querying events:', error.message);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers }
        );
      }
    }

    // GET /api/stats - Get statistics
    if (url.pathname === '/api/stats' && req.method === 'GET') {
      try {
        const stats = db.prepare(`
          SELECT
            COUNT(*) as total_events,
            COUNT(DISTINCT session_id) as total_sessions,
            COUNT(DISTINCT project_id) as total_projects,
            type,
            COUNT(*) as count
          FROM events
          GROUP BY type
        `).all();

        return new Response(JSON.stringify({ stats }), { headers });
      } catch (error: any) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers }
        );
      }
    }

    // 404
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers }
    );
  }
});

console.log(`🚀 Server running at http://localhost:${PORT}`);
console.log('\nEndpoints:');
console.log('  POST   /api/events  - Store event');
console.log('  GET    /api/events  - Query events');
console.log('  GET    /api/stats   - Get statistics');
console.log('  GET    /healthz     - Health check\n');
