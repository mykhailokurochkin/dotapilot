import { GsiServer } from './gsi/server.ts';

const PORT = Number(process.env.PORT) || 3000;
const server = new GsiServer(PORT);

process.on('SIGINT', async () => {
  console.log('\n🛑 Отримано сигнал зупинки (SIGINT), завершуємо роботу DotaPilot...');
  await server.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Отримано сигнал завершення (SIGTERM), закриваємо сервер...');
  await server.stop();
  process.exit(0);
});

await server.start();

