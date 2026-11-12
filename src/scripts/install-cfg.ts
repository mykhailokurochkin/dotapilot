import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const cfgContent = `"DotaPilot Integration"
{
    "uri"           "http://127.0.0.1:3000/gsi"
    "timeout"       "5.0"
    "buffer"        "0.5"
    "throttle"      "3.0"
    "heartbeat"     "10.0"
    "data"
    {
        "provider"      "1"
        "map"           "1"
        "player"        "1"
        "hero"          "1"
        "abilities"     "1"
        "items"         "1"
        "draft"         "0"
        "wearables"     "0"
    }
}
`;

const fileName = 'gamestate_integration_dotapilot.cfg';
const localCfgPath = path.join(process.cwd(), fileName);

// 1. Write locally
fs.writeFileSync(localCfgPath, cfgContent, 'utf8');
console.log(`✅ Конфігураційний файл збережено в проєкті: ${localCfgPath}\n`);

// 2. Check platform-specific Dota 2 paths
const isMac = process.platform === 'darwin';
const isWin = process.platform === 'win32';
const isLinux = process.platform === 'linux';

let possiblePaths: string[] = [];
if (isMac) {
  possiblePaths.push(path.join(os.homedir(), 'Library/Application Support/Steam/steamapps/common/dota 2 beta/game/dota/cfg/gamestate_integration'));
} else if (isLinux) {
  possiblePaths.push(
    path.join(os.homedir(), '.steam/steam/steamapps/common/dota 2 beta/game/dota/cfg/gamestate_integration'),
    path.join(os.homedir(), '.local/share/Steam/steamapps/common/dota 2 beta/game/dota/cfg/gamestate_integration')
  );
} else if (isWin) {
  for (const drive of ['C:', 'D:', 'E:', 'F:']) {
    possiblePaths.push(path.join(drive, 'Program Files (x86)', 'Steam', 'steamapps', 'common', 'dota 2 beta', 'game', 'dota', 'cfg', 'gamestate_integration'));
    possiblePaths.push(path.join(drive, 'SteamLibrary', 'steamapps', 'common', 'dota 2 beta', 'game', 'dota', 'cfg', 'gamestate_integration'));
  }
}

let installedPath = null;
for (const p of possiblePaths) {
  try {
    const parentDir = path.dirname(p);
    if (fs.existsSync(parentDir)) {
      fs.mkdirSync(p, { recursive: true });
      fs.writeFileSync(path.join(p, fileName), cfgContent, 'utf8');
      installedPath = path.join(p, fileName);
      break;
    }
  } catch (e) {
    // skip
  }
}

if (installedPath) {
  console.log(`🎉 Файл автоматично встановлено прямо в папку Доти:`);
  console.log(`   ${installedPath}`);
} else {
  console.log(`👉 Щоб гра надсилала дані в DotaPilot:`);
  console.log(`   Скопіюйте файл "${fileName}" у папку:`);
  console.log(`   .../dota 2 beta/game/dota/cfg/gamestate_integration/\n`);
  console.log(`   (Якщо папки 'gamestate_integration' немає — просто створіть її).`);
}
