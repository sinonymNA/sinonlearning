// @ts-nocheck
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { ArcadeService } from "@/../arcade-server/game.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const state = globalThis as typeof globalThis & { arcadeRuntime?: { service: InstanceType<typeof ArcadeService>; sessions: Map<string, any> } };
const runtime = state.arcadeRuntime ??= { service: new ArcadeService(), sessions: new Map() };

function snapshot(room, session) {
  room.tick();
  const messages = [room.publicState()];
  if (session.playerId) messages.push(room.privateState(session.playerId));
  return messages;
}

export async function POST(request: Request) {
  try {
    const { sessionId, message } = await request.json();
    if (!message || typeof message.type !== "string" || JSON.stringify(message).length > 16000) throw new Error("Malformed message");
    if (message.type === "create") {
      const room = runtime.service.create({ game: message.game === "hot_potato" ? "hot_potato" : "hot_potato", playlist: Array.isArray(message.playlist) ? message.playlist.slice(0, 5) : ["hot_potato"] });
      const id = crypto.randomUUID(); runtime.sessions.set(id, { room, isHost: true });
      return NextResponse.json({ sessionId: id, messages: [{ type: "created", code: room.code, hostToken: room.hostToken }, room.publicState()] });
    }
    if (message.type === "join") {
      const room = runtime.service.get(message.code);
      if (!room) throw new Error("Room not found");
      const player = room.addPlayer(message);
      const id = crypto.randomUUID(); runtime.sessions.set(id, { room, playerId: player.id });
      return NextResponse.json({ sessionId: id, messages: [{ type: "joined", code: room.code, playerId: player.id, reconnectToken: player.reconnectToken }, ...snapshot(room, { playerId: player.id })] });
    }
    const session = runtime.sessions.get(sessionId);
    if (!session) throw new Error("Session ended; reconnect to the room");
    const room = session.room;
    if (message.type === "start") { if (!session.isHost || !room.host(message.hostToken)) throw new Error("Teacher authorization required"); room.start(); }
    else if (message.type === "word") room.submitWord(session.playerId, message.word);
    else if (message.type === "remove") { if (!session.isHost || !room.host(message.hostToken)) throw new Error("Teacher authorization required"); room.remove(message.playerId); }
    else if (message.type !== "poll") throw new Error("Unknown action");
    return NextResponse.json({ sessionId, messages: snapshot(room, session) });
  } catch (error) {
    return NextResponse.json({ messages: [{ type: "error", message: error instanceof Error ? error.message : "Request failed" }] }, { status: 400 });
  }
}
