// @ts-nocheck
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { GameService } from "../../../suspect-server/game.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const shared = globalThis as typeof globalThis & { suspectRuntime?: { service: GameService; sessions: Map<string, any> } };
const runtimeState = shared.suspectRuntime ??= { service: new GameService(), sessions: new Map() };

function payload(room, session) {
  room.tick();
  const messages = [room.publicState()];
  if (session.playerId && room.players.has(session.playerId)) messages.push(room.privateState(session.playerId));
  return messages;
}

function action(session, message) {
  const room = session.room;
  if (!room) throw Error("Join a room first");
  const host = () => { if (!session.isHost) throw Error("Teacher authorization required"); };
  switch (message.type) {
    case "poll": break;
    case "ready": room.players.get(session.playerId).ready = !!message.ready; break;
    case "color": room.players.get(session.playerId).color = String(message.color).slice(0, 12); break;
    case "move": room.move(session.playerId, message); break;
    case "task": room.submitTask(session.playerId, message); break;
    case "kill": room.kill(session.playerId, message.targetId); break;
    case "report": room.report(session.playerId, message.bodyId); break;
    case "meeting": room.callMeeting("Emergency meeting", session.playerId); break;
    case "vote": room.vote(session.playerId, message.target); break;
    case "sabotage": room.sabotageStart(session.playerId, message.sabotage); break;
    case "repair": room.repair(session.playerId, message.stationId); break;
    case "start": host(); room.start(); break;
    case "pause": host(); room.phase = message.paused ? "paused" : "playing"; break;
    case "end": host(); room.end("teacher", "Round ended by teacher"); break;
    case "rematch": host(); room.phase = "lobby"; room.resetRound(); for (const player of room.players.values()) player.ready = false; break;
    case "settings": host(); if (room.phase !== "lobby") throw Error("Settings lock after start"); Object.assign(room.settings, message.settings); break;
    case "kick": host(); room.players.delete(message.playerId); break;
    case "questions": host(); if (!Array.isArray(message.questions) || !message.questions.length || message.questions.length > 200) throw Error("Invalid question bank"); room.questions = message.questions; break;
    default: throw Error("Unknown action");
  }
  return payload(room, session);
}

export async function POST(request: Request) {
  try {
    const { sessionId, message } = await request.json();
    if (!message || typeof message.type !== "string") throw Error("Malformed message");
    if (JSON.stringify(message).length > 16384) throw Error("Message too large");
    if (message.type === "create") {
      const { room, token } = runtimeState.service.create(message.settings);
      const id = crypto.randomUUID(); runtimeState.sessions.set(id, { room, isHost: true });
      return NextResponse.json({ sessionId: id, messages: [{ type: "created", code: room.code, hostToken: token }, room.publicState()] });
    }
    if (message.type === "solo") {
      const { room } = runtimeState.service.create({ devMode: true, killCooldown: 9, discussion: 5, voting: 12, taskCount: 3, mode: message.mode === "classic" ? "classic" : "questions" });
      const player = room.addPlayer({ nickname: message.nickname, color: message.color });
      player.ready = true;
      ["ORION", "LYRA", "COMET", "VEGA", "PIXEL"].forEach(name => room.addBot(name));
      room.start();
      const id = crypto.randomUUID(); const session = { room, playerId: player.id, isHost: true }; runtimeState.sessions.set(id, session);
      return NextResponse.json({ sessionId: id, messages: [{ type: "joined", id: player.id, reconnectToken: player.reconnectToken, code: room.code, solo: true }, ...payload(room, session)] });
    }
    if (message.type === "host") {
      const room = runtimeState.service.get(message.code);
      if (!room || !room.host(message.hostToken)) throw Error("Teacher credential invalid");
      const id = crypto.randomUUID(); runtimeState.sessions.set(id, { room, isHost: true });
      return NextResponse.json({ sessionId: id, messages: [{ type: "hosted", code: room.code }, room.publicState()] });
    }
    if (message.type === "join") {
      const room = runtimeState.service.get(message.code); if (!room) throw Error("Room not found");
      const player = message.reconnectToken ? room.reconnect(message.reconnectToken) : room.addPlayer(message);
      const id = crypto.randomUUID(); const session = { room, playerId: player.id }; runtimeState.sessions.set(id, session);
      return NextResponse.json({ sessionId: id, messages: [{ type: "joined", id: player.id, reconnectToken: player.reconnectToken, code: room.code }, ...payload(room, session)] });
    }
    const session = runtimeState.sessions.get(sessionId); if (!session) throw Error("Session ended; reconnect to the room");
    return NextResponse.json({ sessionId, messages: action(session, message) });
  } catch (error) {
    return NextResponse.json({ messages: [{ type: "error", message: error instanceof Error ? error.message : "Request failed" }] });
  }
}

