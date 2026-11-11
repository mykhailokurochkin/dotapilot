import { GsiServer } from './gsi/server.ts';

const PORT = Number(process.env.PORT) || 3000;
const server = new GsiServer(PORT);

await server.start();
