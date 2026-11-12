import type { GsiPayload } from '../types/gsi.ts';

const URL = 'http://127.0.0.1:3000/gsi?mock=1';

async function send(state: GsiPayload, advice?: string) {
  try {
    await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-mock': 'true',
      },
      body: JSON.stringify(state),
    });

    if (advice) {
      // Also broadcast custom advice if needed
    }
  } catch (e: any) {
    console.error('Send error:', e.message);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runScenario() {
  console.log('🚀 Старт ізольованого сценарію на 60 секунд (кожні 5 секунд)...');

  // 00s: Живий герой фармить
  console.log('[00s] Старт: живий герой на карті.');
  await send({
    provider: { name: 'Dota 2', appid: 570, version: 160 },
    map: { clock_time: 600, game_time: 690, game_state: 'DOTA_GAMETIME_STATE_PLAYING', paused: false },
    player: { name: 'Player', kills: 4, deaths: 1, assists: 3, gold: 1800, net_worth: 5400 },
    hero: { name: 'npc_dota_hero_juggernaut', level: 9, alive: true, health: 1100, max_health: 1150, buyback_cost: 380, buyback_cooldown: 0 },
  });
  await sleep(5000);

  // 05s: Сповіщення про зникнення ворогів
  console.log('[05s] AI: Вороги зникли з карти.');
  await send({
    provider: { name: 'Dota 2', appid: 570, version: 160 },
    map: { clock_time: 605, game_time: 695, game_state: 'DOTA_GAMETIME_STATE_PLAYING', paused: false },
    player: { name: 'Player', kills: 4, deaths: 1, assists: 3, gold: 1950, net_worth: 5550 },
    hero: { name: 'npc_dota_hero_juggernaut', level: 9, alive: true, health: 1150, max_health: 1150, buyback_cost: 390, buyback_cooldown: 0 },
  });
  await sleep(5000);

  // 10s: Сповіщення про новий предмет ворога
  console.log('[10s] AI: У ворога Orchid.');
  await send({
    provider: { name: 'Dota 2', appid: 570, version: 160 },
    map: { clock_time: 610, game_time: 700, game_state: 'DOTA_GAMETIME_STATE_PLAYING', paused: false },
    player: { name: 'Player', kills: 4, deaths: 1, assists: 3, gold: 2100, net_worth: 5700 },
    hero: { name: 'npc_dota_hero_juggernaut', level: 10, alive: true, health: 1200, max_health: 1200, buyback_cost: 410, buyback_cooldown: 0 },
  });
  await sleep(5000);

  // 15s: Сповіщення про макро-можливість
  console.log('[15s] AI: Вороги на боті — час пушити топ.');
  await send({
    provider: { name: 'Dota 2', appid: 570, version: 160 },
    map: { clock_time: 615, game_time: 705, game_state: 'DOTA_GAMETIME_STATE_PLAYING', paused: false },
    player: { name: 'Player', kills: 4, deaths: 1, assists: 3, gold: 2300, net_worth: 5900 },
    hero: { name: 'npc_dota_hero_juggernaut', level: 10, alive: true, health: 1200, max_health: 1200, buyback_cost: 420, buyback_cooldown: 0 },
  });
  await sleep(5000);

  // 20s: Смерть у файті -> Таверна відкривається на 30с
  console.log('[20s] Смерть героя -> розгортання картки Таверни!');
  await send({
    provider: { name: 'Dota 2', appid: 570, version: 160 },
    map: { clock_time: 620, game_time: 710, game_state: 'DOTA_GAMETIME_STATE_PLAYING', paused: false },
    player: { name: 'Player', kills: 4, deaths: 2, assists: 4, gold: 1950, net_worth: 6100 },
    hero: { name: 'npc_dota_hero_juggernaut', level: 10, alive: false, respawn_seconds: 30, health: 0, max_health: 1200, buyback_cost: 430, buyback_cooldown: 0 },
  });
  await sleep(5000);

  // 25s: Відлік таверни (25с)
  console.log('[25s] Таверна: відлік 25с...');
  await send({
    provider: { name: 'Dota 2', appid: 570, version: 160 },
    map: { clock_time: 625, game_time: 715, game_state: 'DOTA_GAMETIME_STATE_PLAYING', paused: false },
    player: { name: 'Player', kills: 4, deaths: 2, assists: 4, gold: 2020, net_worth: 6170 },
    hero: { name: 'npc_dota_hero_juggernaut', level: 10, alive: false, respawn_seconds: 25, health: 0, max_health: 1200, buyback_cost: 430, buyback_cooldown: 0 },
  });
  await sleep(5000);

  // 30s: Порада по контр-білду всередині таверни
  console.log('[30s] Таверна: аналіз білда під BKB ворогів.');
  await send({
    provider: { name: 'Dota 2', appid: 570, version: 160 },
    map: { clock_time: 630, game_time: 720, game_state: 'DOTA_GAMETIME_STATE_PLAYING', paused: false },
    player: { name: 'Player', kills: 4, deaths: 2, assists: 4, gold: 2100, net_worth: 6250 },
    hero: { name: 'npc_dota_hero_juggernaut', level: 10, alive: false, respawn_seconds: 20, health: 0, max_health: 1200, buyback_cost: 440, buyback_cooldown: 0 },
  });
  await sleep(5000);

  // 35s: Відлік таверни (15с)
  console.log('[35s] Таверна: відлік 15с...');
  await send({
    provider: { name: 'Dota 2', appid: 570, version: 160 },
    map: { clock_time: 635, game_time: 725, game_state: 'DOTA_GAMETIME_STATE_PLAYING', paused: false },
    player: { name: 'Player', kills: 4, deaths: 2, assists: 4, gold: 2180, net_worth: 6330 },
    hero: { name: 'npc_dota_hero_juggernaut', level: 10, alive: false, respawn_seconds: 15, health: 0, max_health: 1200, buyback_cost: 440, buyback_cooldown: 0 },
  });
  await sleep(5000);

  // 40s: Тактичний план перед виходом
  console.log('[40s] Таверна: тактичний план після респавну.');
  await send({
    provider: { name: 'Dota 2', appid: 570, version: 160 },
    map: { clock_time: 640, game_time: 730, game_state: 'DOTA_GAMETIME_STATE_PLAYING', paused: false },
    player: { name: 'Player', kills: 4, deaths: 2, assists: 4, gold: 2260, net_worth: 6410 },
    hero: { name: 'npc_dota_hero_juggernaut', level: 10, alive: false, respawn_seconds: 10, health: 0, max_health: 1200, buyback_cost: 450, buyback_cooldown: 0 },
  });
  await sleep(5000);

  // 45s: Останні 5с таверни
  console.log('[45s] Таверна: відлік 5с...');
  await send({
    provider: { name: 'Dota 2', appid: 570, version: 160 },
    map: { clock_time: 645, game_time: 735, game_state: 'DOTA_GAMETIME_STATE_PLAYING', paused: false },
    player: { name: 'Player', kills: 4, deaths: 2, assists: 4, gold: 2340, net_worth: 6490 },
    hero: { name: 'npc_dota_hero_juggernaut', level: 10, alive: false, respawn_seconds: 5, health: 0, max_health: 1200, buyback_cost: 450, buyback_cooldown: 0 },
  });
  await sleep(5000);

  // 50s: Респавн -> тихе закриття Таверни
  console.log('[50s] Респавн -> тихе плавне закриття Таверни.');
  await send({
    provider: { name: 'Dota 2', appid: 570, version: 160 },
    map: { clock_time: 650, game_time: 740, game_state: 'DOTA_GAMETIME_STATE_PLAYING', paused: false },
    player: { name: 'Player', kills: 4, deaths: 2, assists: 4, gold: 2420, net_worth: 6570 },
    hero: { name: 'npc_dota_hero_juggernaut', level: 10, alive: true, health: 1200, max_health: 1200, buyback_cost: 460, buyback_cooldown: 0 },
  });

  console.log('🎉 60-секундну симуляцію завершено!');
}

runScenario();
