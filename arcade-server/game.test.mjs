import test from 'node:test';
import assert from 'node:assert/strict';
import { ArcadeService } from './game.mjs';

test('room capacity, reconnect identity, and private token redaction', () => {
  const room = new ArcadeService().create();
  const players = Array.from({length: 40}, (_, i) => room.addPlayer({nickname: `Player ${i}`}));
  assert.match(room.code, /^[A-F0-9]{6}$/);
  assert.throws(() => room.addPlayer({nickname: 'Overflow'}), /full/);
  assert.equal(room.reconnect(players[0].reconnectToken).id, players[0].id);
  assert.equal(room.players.size, 40);
  assert.ok(room.publicState().players.every(p => !('reconnectToken' in p)));
});

test('expired potato cannot accept a late word', () => {
  const room = new ArcadeService().create();
  room.addPlayer({nickname: 'One'}); room.addPlayer({nickname: 'Two'});
  room.start(); room.sequence = 'TION';
  const holder = room.potato.holderId;
  room.potato.expiresAt = Date.now() - 1;
  assert.throws(() => room.submitWord(holder, 'action'), /expired/);
});
