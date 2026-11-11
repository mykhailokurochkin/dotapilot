import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { GsiPayload } from '../types/gsi.ts';
import { TimerEngine, type CoachAlert } from '../rules/timers.ts';
import { AiAdvisor } from '../ai/advisor.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class GsiServer {
  private port: number;
  private server: http.Server | null = null;
  private currentState: GsiPayload = {};
  private timerEngine = new TimerEngine();
  private aiAdvisor = new AiAdvisor();
  private sseClients: Set<http.ServerResponse> = new Set();
  private currentAlerts: CoachAlert[] = [];
  private currentAdvice: string = 'AI-коуч готовий аналізувати твою гру. Натисни кнопку або чекай ключових моментів!';

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
          res.write(`data: ${JSON.stringify({
            state: this.currentState,
            alerts: this.currentAlerts,
            advice: this.currentAdvice,
          })}\n\n`);

          req.on('close', () => {
            this.sseClients.delete(res);
          });
          return;
        }

        // 3. Request on-demand AI Advice
        if (req.method === 'POST' && req.url === '/api/advice') {
          this.triggerAiAdvice().then((advice) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ advice }));
          }).catch(() => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'AI Error' }));
          });
          return;
        }

        // 4. GSI POST Endpoint
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
        console.log(`🛡️  DotaPilot GSI + AI Coach Сервер успішно запущено!`);
        console.log(`📊 Веб-дашборд:  http://localhost:${this.port}`);
        console.log(`🎮 GSI Ендпоінт: http://localhost:${this.port}/gsi`);
        console.log(`======================================================\n`);
        resolve();
      });
    });
  }

  public async triggerAiAdvice(): Promise<string> {
    const advice = await this.aiAdvisor.getAdvice(this.currentState);
    this.currentAdvice = advice;
    this.broadcast();
    return advice;
  }

  public updateState(newState: GsiPayload) {
    this.currentState = {
      ...this.currentState,
      ...newState,
      map: { ...this.currentState.map, ...newState.map },
      player: { ...this.currentState.player, ...newState.player },
      hero: { ...this.currentState.hero, ...newState.hero },
      items: { ...this.currentState.items, ...newState.items },
      abilities: { ...this.currentState.abilities, ...newState.abilities },
    };

    this.currentAlerts = this.timerEngine.evaluate(this.currentState);
    this.broadcast();
  }

  private broadcast() {
    const eventData = `data: ${JSON.stringify({
      state: this.currentState,
      alerts: this.currentAlerts,
      advice: this.currentAdvice,
    })}\n\n`;

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
