export interface GsiPlayer {
  steamid?: string;
  name?: string;
  activity?: string;
  kills?: number;
  deaths?: number;
  assists?: number;
  last_hits?: number;
  denies?: number;
  kill_streak?: number;
  commands_issued?: number;
  kill_list?: Record<string, number>;
  team_name?: string;
  gold?: number;
  gold_reliable?: number;
  gold_unreliable?: number;
  gold_per_min?: number;
  xp_per_min?: number;
  net_worth?: number;
  hero_damage?: number;
  hero_healing?: number;
  tower_damage?: number;
  wards_purchased?: number;
  wards_placed?: number;
  wards_destroyed?: number;
}

export interface GsiHero {
  id?: number;
  name?: string;
  level?: number;
  experience?: number;
  alive?: boolean;
  respawn_seconds?: number;
  buyback_cost?: number;
  buyback_cooldown?: number;
  health?: number;
  max_health?: number;
  health_percent?: number;
  mana?: number;
  max_mana?: number;
  mana_percent?: number;
  silenced?: boolean;
  stunned?: boolean;
  hexed?: boolean;
  muted?: boolean;
  break?: boolean;
  has_debuff?: boolean;
  talent_1?: boolean;
  talent_2?: boolean;
  talent_3?: boolean;
  talent_4?: boolean;
  talent_5?: boolean;
  talent_6?: boolean;
  talent_7?: boolean;
  talent_8?: boolean;
  aghanims_scepter?: boolean;
  aghanims_shard?: boolean;
  xpos?: number;
  ypos?: number;
}

export interface GsiItem {
  name: string;
  purchaser?: number;
  can_cast?: boolean;
  cooldown?: number;
  passive?: boolean;
  charges?: number;
}

export interface GsiMap {
  name?: string;
  matchid?: string;
  game_time?: number;
  clock_time?: number;
  daytime?: boolean;
  nightstalker_night?: boolean;
  game_state?: string;
  paused?: boolean;
  win_team?: string;
  customgamename?: string;
  ward_purchase_cooldown?: number;
  radiant_ward_cooldown?: number;
  dire_ward_cooldown?: number;
  roshan_state?: string;
  roshan_state_end_time?: number;
}

export interface GsiPayload {
  provider?: {
    name?: string;
    appid?: number;
    version?: number;
    timestamp?: number;
  };
  map?: GsiMap;
  player?: GsiPlayer;
  hero?: GsiHero;
  abilities?: Record<string, {
    name?: string;
    level?: number;
    can_cast?: boolean;
    passive?: boolean;
    ability_active?: boolean;
    cooldown?: number;
    ultimate?: boolean;
  }>;
  items?: Record<string, GsiItem>;
  draft?: {
    activeteam?: number;
    pick?: boolean;
    activeteam_time_remaining?: number;
    radiant_bonus_time?: number;
    dire_bonus_time?: number;
  };
}
