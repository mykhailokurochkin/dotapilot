import type { GsiPayload } from '../types/gsi.ts';
import fs from 'node:fs';
import path from 'node:path';

export class AiAdvisor {
  private apiKey: string = '';
  private lastAdvice: string = '';
  private lastAdviceTime: number = 0;

  constructor() {
    this.loadApiKey();
  }

  private loadApiKey() {
    if (process.env.GEMINI_API_KEY) {
      this.apiKey = process.env.GEMINI_API_KEY.trim();
      return;
    }
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/GEMINI_API_KEY=([^\r\n]+)/);
      if (match) {
        this.apiKey = match[1].trim();
      }
    }
  }

  public async getAdvice(state: GsiPayload): Promise<string> {
    if (!this.apiKey) {
      this.loadApiKey();
    }
    if (!this.apiKey) {
      return 'API ключ Gemini не знайдено у .env файлі.';
    }

    // Rate-limit: at most one advice every 10 seconds
    const now = Date.now();
    if (now - this.lastAdviceTime < 10000 && this.lastAdvice) {
      return this.lastAdvice;
    }

    const heroName = state.hero?.name?.replace('npc_dota_hero_', '') || 'Unknown';
    const heroLvl = state.hero?.level || 1;
    const kills = state.player?.kills || 0;
    const deaths = state.player?.deaths || 0;
    const assists = state.player?.assists || 0;
    const clock = state.map?.clock_time || 0;
    const clockMin = Math.floor(clock / 60);
    const clockSec = clock % 60;
    const timeStr = `${clockMin}:${clockSec < 10 ? '0' : ''}${clockSec}`;
    const gold = state.player?.gold || 0;
    const networth = state.player?.net_worth || state.player?.gold || 0;

    const items: string[] = [];
    if (state.items) {
      for (const [key, item] of Object.entries(state.items)) {
        if (key.startsWith('slot') && item.name && item.name !== 'empty') {
          items.push(item.name.replace('item_', ''));
        }
      }
    }

    const prompt = `Ти — топовий про-тренер з Dota 2 (ранг Immortal).
Поточна ситуація гравця:
- Герой: ${heroName} (рівень ${heroLvl})
- Рахунок гравця (K/D/A): ${kills}/${deaths}/${assists}
- Нетворс: ${networth}, поточне золото: ${gold}
- Наявні предмети: ${items.join(', ') || 'немає'}
- Ігровий час: ${timeStr}

Дай гравцеві чітку, ультра-лаконічну тактичну пораду (максимум 2 короткі речення) українською мовою:
1. Який наступний артефакт купити або загрейдити під цю хвилину.
2. Головний фокус позиціонки у файті.`;

    const models = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 150,
            },
          }),
        });

        if (res.ok) {
          const data = await res.json() as any;
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            this.lastAdvice = text.trim();
            this.lastAdviceTime = now;
            return this.lastAdvice;
          }
        } else {
          console.error(`Gemini API (${model}) failed with status:`, res.status);
        }
      } catch (e: any) {
        console.error(`AiAdvisor error on ${model}:`, e.message);
      }
    }

    return 'Тримай правильну позицію та контролюй віжн.';
  }
}
