/**
 * CrowdSense AI — Express + Socket.io Server
 * Handles real-time crowd data, gate control, and alert broadcasting.
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const PORT       = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || '*';
const STATIC_DIR = process.env.STATIC_DIR || null;

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app    = express();
const server = createServer(app);

// ── Socket.io setup ──────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  }
});

// ── Middleware ────────────────────────────────────────
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// ── Serve built React frontend (production) ───────────
if (STATIC_DIR) {
  app.use(express.static(STATIC_DIR));
}


// ── In-memory state ───────────────────────────────────
let currentState = {
  gates: [
    { id: 'Gate A', capacity: 200, queue: 45,  status: 'OPEN' },
    { id: 'Gate B', capacity: 200, queue: 110, status: 'OPEN' },
    { id: 'Gate C', capacity: 200, queue: 80,  status: 'OPEN' },
    { id: 'Gate D', capacity: 200, queue: 30,  status: 'OPEN' },
    { id: 'VIP',    capacity: 80,  queue: 8,   status: 'OPEN' },
  ],
  zones: [],
  alerts: [],
  totalAttendees: 3500,
  timestamp: Date.now(),
};

// ── REST API Routes ────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

// Get current state
app.get('/api/crowd', (req, res) => {
  res.json({ success: true, data: currentState });
});

// Update gate status (admin action)
app.patch('/api/gates/:gateId', (req, res) => {
  const { gateId } = req.params;
  const { status } = req.body;

  if (!['OPEN', 'CLOSED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Use OPEN or CLOSED.' });
  }

  currentState.gates = currentState.gates.map(g =>
    g.id === gateId ? { ...g, status, queue: status === 'CLOSED' ? 0 : g.queue } : g
  );

  io.emit('gate:updated', { gateId, status });
  io.emit('crowd:update', currentState);

  res.json({ success: true, gate: currentState.gates.find(g => g.id === gateId) });
});

// Broadcast an alert
app.post('/api/alerts', (req, res) => {
  const { text, type = 'INFO' } = req.body;

  if (!text) return res.status(400).json({ error: 'text is required.' });

  const alert = { id: `alert-${Date.now()}`, ts: Date.now(), type, text };
  currentState.alerts = [...currentState.alerts, alert].slice(-30);

  io.emit('alert:new', alert);
  io.emit('crowd:update', currentState);

  res.json({ success: true, alert });
});

// Get all alerts
app.get('/api/alerts', (req, res) => {
  res.json({ success: true, data: currentState.alerts });
});

// Emergency: trigger evacuation
app.post('/api/emergency/evacuate', (req, res) => {
  const alert = {
    id: `evac-${Date.now()}`,
    ts: Date.now(),
    type: 'EMERGENCY',
    text: '🚨 EVACUATION INITIATED. All attendees proceed to nearest exit. Security personnel are guiding you.',
  };

  currentState.alerts = [...currentState.alerts, alert].slice(-30);
  io.emit('emergency:evacuate', alert);
  io.emit('crowd:update', currentState);

  res.json({ success: true, message: 'Evacuation triggered.' });
});

// Receive simulation data (from simulation script)
app.post('/api/simulation/tick', (req, res) => {
  const { zones, gates, alerts, totalAttendees } = req.body;

  if (zones) currentState.zones = zones;
  if (gates) {
    // Merge — preserve manual gate overrides
    currentState.gates = gates.map(g => {
      const existing = currentState.gates.find(eg => eg.id === g.id);
      if (existing?.status === 'CLOSED') return existing; // preserve manual close
      return { ...g };
    });
  }
  if (alerts) currentState.alerts = [...currentState.alerts, ...alerts].slice(-30);
  if (totalAttendees) currentState.totalAttendees = totalAttendees;
  currentState.timestamp = Date.now();

  // Broadcast to all connected clients
  io.emit('crowd:update', currentState);
  res.json({ success: true });
});

// ── Socket.io Events ──────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Send current state to newly connected client
  socket.emit('crowd:update', currentState);

  socket.on('admin:gate:toggle', ({ gateId, status }) => {
    currentState.gates = currentState.gates.map(g =>
      g.id === gateId ? { ...g, status } : g
    );
    io.emit('crowd:update', currentState);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// ── Catch-all: serve React index.html for client-side routing ─────────────
if (STATIC_DIR) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(STATIC_DIR, 'index.html'));
  });
}

// ── Start server ───────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🟢 CrowdSense AI Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket ready for connections`);
  console.log(`🔗 Accepting clients from: ${CLIENT_URL}\n`);
  if (STATIC_DIR) {
    console.log(`📦 Serving static frontend from: ${STATIC_DIR}\n`);
  }
});
