import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { GsiPayload } from '../types/gsi.js';
import { TimerEngine, type CoachAlert } from '../rules/timers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class GsiServer {
  private port: number;
  private server: http.Server | null = null;
  private currentState: GsiPayload = {};
  private timerEngine = new TimerEngine();
  private sseClients: Set<http.ServerResponse> = new Set();
  private currentAlerts: CoachAlert[] = [];

  constructor(port = 3000) {
    this.port = port;
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = http.createServer((req, res) => {
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        // 1. Dashboard UI
        if (req.method === 'GET' && (req.url === '/' || req.url === '/dashboard')) {
          const htmlPath = path.join(__dirname, '../web/dashboard.html');
          fs.readFile(htmlPath, 'utf8', (err, content) => {
            if (err) {
              res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
              res.end('Помилка завантаження дашборду');
              return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(content);
          });
          return;
        }

        // 2. Server-Sent Events (SSE)
        if (req.method === 'GET' && req.url === '/events') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          });

          this.sseClients.add(res);

          // Send current state immediately
          res.write(`data: ${JSON.stringify({ state: this.currentState, alerts: this.currentAlerts })}\n\n`);

          req.on('close', () => {
            this.sseClients.delete(res);
          });
          return;
        }

        // 3. GSI POST Endpoint
        if (req.method === 'POST' && (req.url === '/' || req.url === '/gsi')) {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });

          req.on('end', () => {
            try {
              if (body) {
                const parsed = JSON.parse(body) as GsiPayload;
                this.updateState(parsed);
              }
              res.writeHead(200, { 'Content-Type': 'text/plain' });
              res.end('OK');
            } catch (e) {
              res.writeHead(400, { 'Content-Type': 'text/plain' });
              res.end('Bad Request');
            }
          });
          return;
        }

        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      });

      this.server.listen(this.port, '0.0.0.0', () => {
        console.log(`\n======================================================`);
        console.log(`🛡️  DotaPilot GSI Сервер успішно запущено!`);
        console.log(`📊 Веб-дашборд:  http://localhost:${this.port}`);
        console.log(`🎮 GSI Ендпоінт: http://localhost:${this.port}/gsi`);
        console.log(`======================================================\n`);
        resolve();
      });
    });
  }

  public updateState(newState: GsiPayload) {
    // Merge new state fields into currentState
    this.currentState = {
      ...this.currentState,
      ...newState,
      map: { ...this.currentState.map, ...newState.map },
      player: { ...this.currentState.player, ...newState.player },
      hero: { ...this.currentState.hero, ...newState.hero },
    };

    this.currentAlerts = this.timerEngine.evaluate(this.currentState);

    // Broadcast to all connected web clients
    const eventData = `data: ${JSON.stringify({ state: this.currentState, alerts: this.currentAlerts })}\n\n`;
    for (const client of this.sseClients) {
      client.write(eventData);
    }
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }
}
