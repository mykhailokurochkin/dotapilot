import type { GsiPayload } from '../types/gsi.ts';

export interface CoachAlert {
  id: string;
  type: 'timer' | 'tip' | 'danger';
  title: string;
  message: string;
  timeRemaining?: number;
}

export class TimerEngine {
  private lastAlertedTimes: Set<string> = new Set();

  public evaluate(state: GsiPayload): CoachAlert[] {
    const alerts: CoachAlert[] = [];
    const clock = state.map?.clock_time;
    if (clock === undefined || state.map?.game_state !== 'DOTA_GAMETIME_STATE_PLAYING') {
      return alerts;
    }

    // 1. Wisdom Runes (every 7 mins: 7:00, 14:00, 21:00...)
    const nextWisdom = Math.ceil((clock + 1) / 420) * 420;
    const diffWisdom = nextWisdom - clock;
    if (diffWisdom <= 30 && diffWisdom >= 0) {
      alerts.push({
        id: `wisdom-${nextWisdom}`,
        type: 'timer',
        title: 'Руна Мудрості',
        message: `З'явиться через ${diffWisdom}с на кутах карти!`,
        timeRemaining: diffWisdom,
      });
    }

    // 2. Power Runes (every 2 mins starting at 6:00: 6:00, 8:00, 10:00...)
    if (clock >= 360) {
      const nextPower = Math.ceil((clock + 1) / 120) * 120;
      const diffPower = nextPower - clock;
      if (diffPower <= 25 && diffPower >= 0) {
        alerts.push({
          id: `power-${nextPower}`,
          type: 'timer',
          title: 'Активна руна',
          message: `Через ${diffPower}с руна на річці. Підготуй пляшку / контроль річки.`,
          timeRemaining: diffPower,
        });
      }
    }

    // 3. Lotus Pool (every 3 mins: 3:00, 6:00, 9:00...)
    const nextLotus = Math.ceil((clock + 1) / 180) * 180;
    const diffLotus = nextLotus - clock;
    if (diffLotus <= 20 && diffLotus >= 0) {
      alerts.push({
        id: `lotus-${nextLotus}`,
        type: 'timer',
        title: 'Лотос',
        message: `Новий лотос через ${diffLotus}с біля лінії ставка.`,
        timeRemaining: diffLotus,
      });
    }

    // 4. Stacking Reminder (every minute around xx:45 - xx:53)
    const secInMinute = ((clock % 60) + 60) % 60;
    if (secInMinute >= 45 && secInMinute <= 53) {
      alerts.push({
        id: `stack-${Math.floor(clock / 60)}`,
        type: 'tip',
        title: 'Час для стаку',
        message: `Удар по кріпах на 53-55с для стаку кемпу.`,
        timeRemaining: 54 - secInMinute,
      });
    }

    // 5. Tormentor (20:00)
    if (clock >= 1140 && clock <= 1200) {
      const diffTormentor = 1200 - clock;
      alerts.push({
        id: 'tormentor-20',
        type: 'timer',
        title: 'Терзатель',
        message: `З'явиться на 20:00 (через ${diffTormentor}с). Зберіть команду для Shard.`,
        timeRemaining: diffTormentor,
      });
    }

    // 6. Buyback check
    if (state.hero && state.hero.alive === false) {
      const bbCost = state.hero.buyback_cost || 0;
      const currentGold = state.player?.gold || 0;
      const bbCooldown = state.hero.buyback_cooldown || 0;

      if (bbCooldown > 0) {
        alerts.push({
          id: 'bb-cd',
          type: 'danger',
          title: 'Байбек на кд',
          message: `Кулдаун викупу: ще ${bbCooldown}с`,
        });
      } else if (currentGold >= bbCost) {
        alerts.push({
          id: 'bb-ready',
          type: 'tip',
          title: 'Байбек готовий',
          message: `Викуп доступний (${bbCost} золота). Зберігай для важливого захисту!`,
        });
      } else {
        alerts.push({
          id: 'bb-missing',
          type: 'danger',
          title: 'Немає байбеку',
          message: `Не вистачає ${bbCost - currentGold} золота до викупу!`,
        });
      }
    }

    return alerts;
  }
}
