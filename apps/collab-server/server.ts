import { Server } from "@hocuspocus/server";

const server = new Server({
  port: 1234,
});

server.listen();

console.log("🚀 Hocuspocus server kører på ws://localhost:1234");