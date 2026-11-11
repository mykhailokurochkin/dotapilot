# DotaPilot 🛡️🚀

> **DotaPilot** — надлегкий персональний AI-коуч та HUD-асистент для Dota 2 у реальному часі на базі Game State Integration (GSI).

---

## ⚡ Швидкий старт (за 1 хвилину)

### 1. Запуск сервера:
```bash
cd dotapilot
pnpm start
# або node --experimental-strip-types src/index.ts
```
Сервер відкриє:
* **Дашборд:** [http://localhost:3000](http://localhost:3000)
* **GSI Приймач:** `http://localhost:3000/gsi`

### 2. Встановлення конфігу в Dota 2:
```bash
pnpm run install:cfg
```
Це згенерує `gamestate_integration_dotapilot.cfg` і спробує скопіювати його в папку Доти:
`dota 2 beta/game/dota/cfg/gamestate_integration/`

### 3. Тест без запуску Доти (симуляція):
В окремому терміналі:
```bash
pnpm run mock
```
Ви побачите, як у браузері на `http://localhost:3000` в реальному часі оновлюються HP, мана, нетворс, таймери рун та звучать голосові підказки!
