import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const cfgContent = `"DotaPilot Integration"
{
    "uri"           "http://127.0.0.1:3000/gsi"
    "timeout"       "5.0"
    "buffer"        "0.1"
    "throttle"      "0.1"
    "heartbeat"     "30.0"
    "data"
    {
        "provider"      "1"
        "map"           "1"
        "player"        "1"
        "hero"          "1"
        "abilities"     "1"
        "items"         "1"
        "draft"         "1"
        "wearables"     "1"
    }
}
`;

const fileName = 'gamestate_integration_dotapilot.cfg';
const localCfgPath = path.join(process.cwd(), fileName);

// 1. Write locally
fs.writeFileSync(localCfgPath, cfgContent, 'utf8');
console.log(`✅ Конфігураційний файл успішно згенеровано: ${localCfgPath}\n`);

// 2. Possible Steam Dota 2 cfg paths
const possiblePaths = [
  // macOS
  path.join(os.homedir(), 'Library/Application Support/Steam/steamapps/common/dota 2 beta/game/dota/cfg/gamestate_integration'),
  // Windows default (if running on Windows)
  'C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta\\game\\dota\\cfg\\gamestate_integration',
  'D:\\SteamLibrary\\steamapps\\common\\dota 2 beta\\game\\dota\\cfg\\gamestate_integration',
  'E:\\SteamLibrary\\steamapps\\common\\dota 2 beta\\game\\dota\\cfg\\gamestate_integration',
];

let installedPath = null;
for (const p of possiblePaths) {
  try {
    if (fs.existsSync(path.dirname(p))) {
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
  console.log(`👉 Щоб активувати GSI у Доти: скопіюйте цей файл у папку:`);
  console.log(`   dota 2 beta/game/dota/cfg/gamestate_integration/${fileName}`);
  console.log(`\n(Якщо папки 'gamestate_integration' ще немає — створіть її).`);
}
