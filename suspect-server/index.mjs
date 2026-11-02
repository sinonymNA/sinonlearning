import http from "node:http";
import next from "next";
import { WebSocketServer } from "ws";
import { GameService } from "./game.mjs";

const port = Number(process.env.PORT) || 3000;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const service = new GameService();

await app.prepare();
const server = http.createServer((req, res) => {
  if (req.url === "/suspect" || req.url === "/suspect/") req.url = "/suspect/index.html";
  handle(req, res);
});
const wss = new WebSocketServer({ server, path: "/suspect-ws", maxPayload: 16384 });
const send = (ws, data) => ws.readyState === 1 && ws.send(JSON.stringify(data));
const broadcast = room => { const state = room.publicState(); for (const ws of wss.clients) if (ws.room === room) send(ws, state); };
const privateAll = room => { for (const ws of wss.clients) if (ws.room === room && ws.playerId) send(ws, room.privateState(ws.playerId)); };

function act(ws, message) {
  const room = ws.room;
  if (!room) throw Error("Join a room first");
  const host = () => { if (!ws.isHost) throw Error("Teacher authorization required"); };
  switch (message.type) {
    case "ready": room.players.get(ws.playerId).ready = !!message.ready; break;
    case "color": room.players.get(ws.playerId).color = String(message.color).slice(0, 12); break;
    case "move": room.move(ws.playerId, message); return;
    case "task": room.submitTask(ws.playerId, message); send(ws, { type: "toast", message: "Mission complete!" }); break;
    case "kill": room.kill(ws.playerId, message.targetId); break;
    case "report": room.report(ws.playerId, message.bodyId); break;
    case "meeting": room.callMeeting("Emergency meeting", ws.playerId); break;
    case "vote": room.vote(ws.playerId, message.target); break;
    case "sabotage": room.sabotageStart(ws.playerId, message.sabotage); break;
    case "repair": room.repair(ws.playerId, message.stationId); break;
    case "start": host(); room.start(); privateAll(room); break;
    case "pause": host(); room.phase = message.paused ? "paused" : "playing"; break;
    case "end": host(); room.end("teacher", "Round ended by teacher"); break;
    case "rematch": host(); room.phase = "lobby"; room.resetRound(); for (const player of room.players.values()) player.ready = false; break;
    case "settings": host(); if (room.phase !== "lobby") throw Error("Settings lock after start"); Object.assign(room.settings, message.settings); break;
    case "kick": host(); room.players.delete(message.playerId); break;
    case "questions": host(); if (!Array.isArray(message.questions) || !message.questions.length || message.questions.length > 200) throw Error("Invalid question bank"); room.questions = message.questions; break;
    default: throw Error("Unknown action");
  }
  broadcast(room); privateAll(room);
}

wss.on("connection", ws => {
  ws.count = 0; ws.window = Date.now(); send(ws, { type: "hello" });
  ws.on("message", raw => {
    try {
      if (Date.now() - ws.window > 1000) { ws.window = Date.now(); ws.count = 0; }
      if (++ws.count > 35) throw Error("Rate limit exceeded");
      const message = JSON.parse(raw);
      if (!message || typeof message.type !== "string") throw Error("Malformed message");
      if (message.type === "create") { const { room, token } = service.create(message.settings); ws.room = room; ws.isHost = true; send(ws, { type: "created", code: room.code, hostToken: token }); broadcast(room); return; }
      if (message.type === "host") { const room = service.get(message.code); if (!room || !room.host(message.hostToken)) throw Error("Teacher credential invalid"); ws.room = room; ws.isHost = true; send(ws, { type: "hosted", code: room.code }); broadcast(room); return; }
      if (message.type === "join") { const room = service.get(message.code); if (!room) throw Error("Room not found"); const player = message.reconnectToken ? room.reconnect(message.reconnectToken) : room.addPlayer(message); ws.room = room; ws.playerId = player.id; send(ws, { type: "joined", id: player.id, reconnectToken: player.reconnectToken, code: room.code }); send(ws, room.privateState(player.id)); broadcast(room); return; }
      act(ws, message);
    } catch (error) { send(ws, { type: "error", message: error.message }); }
  });
  ws.on("close", () => { if (ws.room && ws.playerId) { ws.room.remove(ws.playerId); broadcast(ws.room); } });
});

setInterval(() => { for (const room of service.rooms.values()) { room.tick(); broadcast(room); } }, 100);
server.listen(port, "0.0.0.0", () => console.log(`Sinon Learning + SUSPECT ready on port ${port}`));

