import type { GsiPayload } from '../types/gsi.ts';

const PORT = process.env.PORT || 3000;
const URL = `http://127.0.0.1:${PORT}/gsi`;

console.log(`🚀 Надсилаємо тестові GSI-дані на ${URL}...`);

let clock = 100; // 1:40 in-game
let hp = 950;
let gold = 1200;
let lastHits = 14;

async function sendState(state: GsiPayload) {
  try {
    const res = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
    if (!res.ok) console.error(`Failed with status: ${res.status}`);
  } catch (err: any) {
    console.error(`Connection error (переконайтеся, що сервер запущено):`, err.message);
  }
}

// Simulate a ticking game every 1 second
const interval = setInterval(async () => {
  clock += 1;
  gold += 2;
  if (clock % 10 === 0) lastHits += 1;

  const mockPayload: GsiPayload = {
    provider: { name: 'Dota 2', appid: 570, version: 160 },
    map: {
      name: 'dota',
      matchid: '7891234567',
      game_time: clock + 90,
      clock_time: clock,
      daytime: clock < 300,
      game_state: 'DOTA_GAMETIME_STATE_PLAYING',
    },
    player: {
      name: 'Player',
      activity: 'playing',
      kills: 2,
      deaths: 0,
      assists: 1,
      last_hits: lastHits,
      denies: 4,
      gold: gold,
      net_worth: gold + 2400,
      gold_per_min: 480,
      xp_per_min: 520,
    },
    hero: {
      name: 'npc_dota_hero_antimage',
      level: 6,
      alive: true,
      health: hp,
      max_health: 1050,
      mana: 380,
      max_mana: 540,
      buyback_cost: 320,
      buyback_cooldown: 0,
    },
  };

  await sendState(mockPayload);
  const m = Math.floor(clock / 60);
  const s = clock % 60;
  console.log(`[Час ${m}:${s < 10 ? '0' : ''}${s}] Дані надіслано: HP ${hp}/1050, Золото ${gold}`);

  if (clock >= 135) { // simulate 2:15 to test lotus / rune alert
    clearInterval(interval);
    console.log(`\n🎉 Тестову симуляцію завершено!`);
    process.exit(0);
  }
}, 1000);
