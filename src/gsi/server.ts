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

  // Live Dota 2 GSI sync mode
  public isSimulationMode: boolean = false;

  // Performance telemetry
  private lastBroadcastTime: number = 0;
  private lastClockTime: number = -999;
  private gsiPacketsReceived: number = 0;
  private gsiPacketsPerSecond: number = 0;
  private statsTimer: NodeJS.Timeout | null = null;

  constructor(port = 3000) {
    this.port = port;
  }

  public start(): Promise<void> {
    // Watch web assets for live auto-reload
    try {
      const webDir = path.join(__dirname, '../web');
      fs.watch(webDir, (eventType, filename) => {
        if (filename && (filename.endsWith('.html') || filename.endsWith('.css') || filename.endsWith('.js'))) {
          console.log(`🔄 Зміна файлу ${filename} — оновлюємо сторінки оверлею та дашборду...`);
          this.broadcastReload();
        }
      });
    } catch (e) {
      // Ignore watch errors if unsupported
    }

    // 1-second interval to compute incoming packet rate
    this.statsTimer = setInterval(() => {
      this.gsiPacketsPerSecond = this.gsiPacketsReceived;
      this.gsiPacketsReceived = 0;
    }, 1000);

    return new Promise((resolve) => {
      this.server = http.createServer((req, res) => {
        // Instant response for CORS preflight
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          });
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

        // 2. HUD Overlay UI
        if (req.method === 'GET' && req.url === '/overlay') {
          const htmlPath = path.join(__dirname, '../web/overlay.html');
          fs.readFile(htmlPath, 'utf8', (err, content) => {
            if (err) {
              res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
              res.end('Помилка завантаження оверлею');
              return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(content);
          });
          return;
        }

        // 3. Server-Sent Events (SSE) stream
        if (req.method === 'GET' && req.url === '/events') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          });

          this.sseClients.add(res);

          // Send current state immediately on connect
          res.write(`data: ${JSON.stringify(this.buildPayload())}\n\n`);

          req.on('close', () => {
            this.sseClients.delete(res);
          });
          return;
        }

        // 4. Request on-demand AI Advice (non-blocking)
        if (req.method === 'POST' && req.url === '/api/advice') {
          this.triggerAiAdvice().then((advice) => {
            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            });
            res.end(JSON.stringify({ advice }));
          }).catch(() => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'AI Error' }));
          });
          return;
        }

        // 5. GSI POST Endpoint (Ultra-fast non-blocking return)
        if (req.method === 'POST' && (req.url === '/' || req.url?.startsWith('/gsi'))) {
          this.gsiPacketsReceived++;
          const isMock = req.url.includes('mock=1') || req.headers['x-mock'] === 'true';

          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
            if (body.length > 5 * 1024 * 1024) { // 5MB safety limit
              req.destroy();
            }
          });

          req.on('end', () => {
            // Reply immediately to Dota 2 so its network thread never waits
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('OK');

            // If in simulation mode, only accept mock payloads
            if (this.isSimulationMode && !isMock) {
              return; // Ignore live Dota packets safely
            }

            // Parse and process asynchronously
            if (body) {
              try {
                const parsed = JSON.parse(body) as GsiPayload;
                this.updateState(parsed);
              } catch {
                // Ignore malformed chunks
              }
            }
          });
          return;
        }

        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      });

      this.server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`\n❌ Помилка: Порт ${this.port} вже використовується іншою програмою!`);
          console.error(`👉 Запустіть з іншим портом: PORT=3001 pnpm start або зупиніть старий процес: pnpm run stop\n`);
          process.exit(1);
        } else {
          console.error('Помилка сервера:', err);
        }
      });

      this.server.listen(this.port, '0.0.0.0', () => {
        console.log(`\n======================================================`);
        console.log(`🛡️  DotaPilot GSI Engine (Zero-Lag Optimized) запущено!`);
        console.log(`📊 Веб-дашборд:  http://localhost:${this.port}`);
        console.log(`🪟 HUD Оверлей:   http://localhost:${this.port}/overlay`);
        console.log(`🎮 GSI Ендпоінт:  http://localhost:${this.port}/gsi`);
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

    const clock = this.currentState.map?.clock_time;
    const now = Date.now();

    // Check alerts
    this.currentAlerts = this.timerEngine.evaluate(this.currentState);

    // Throttle SSE broadcasts: broadcast only if game clock changed or at least 500ms passed
    if (clock !== this.lastClockTime || (now - this.lastBroadcastTime >= 500)) {
      this.lastClockTime = clock ?? -999;
      this.lastBroadcastTime = now;
      this.broadcast();
    }
  }

  private buildPayload() {
    const mem = process.memoryUsage();
    return {
      state: this.currentState,
      alerts: this.currentAlerts,
      advice: this.currentAdvice,
      perf: {
        rssMb: Math.round(mem.rss / (1024 * 1024)),
        heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
        gsiRate: this.gsiPacketsPerSecond,
      },
    };
  }

  private broadcast() {
    if (this.sseClients.size === 0) return;

    const eventData = `data: ${JSON.stringify(this.buildPayload())}\n\n`;
    for (const client of this.sseClients) {
      client.write(eventData);
    }
  }

  public broadcastReload() {
    if (this.sseClients.size === 0) return;
    const msg = `data: ${JSON.stringify({ type: 'reload' })}\n\n`;
    for (const client of this.sseClients) {
      client.write(msg);
    }
  }

  public stop(): Promise<void> {
    if (this.statsTimer) {
      clearInterval(this.statsTimer);
      this.statsTimer = null;
    }
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }
}
