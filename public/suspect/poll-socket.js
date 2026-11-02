class SuspectSocket {
  static OPEN = 1;
  constructor() { this.readyState = SuspectSocket.OPEN; this.sessionId = null; this.busy = false; setTimeout(() => this.onopen?.({}), 0); this.timer = setInterval(() => this.request({ type: "poll" }, true), 200); }
  async request(message, quiet = false) {
    if (this.busy || (quiet && !this.sessionId)) return;
    this.busy = true;
    try { const response = await fetch("/api/suspect", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId: this.sessionId, message }) }); const data = await response.json(); if (data.sessionId) this.sessionId = data.sessionId; for (const item of data.messages || []) this.onmessage?.({ data: JSON.stringify(item) }); }
    catch { if (!quiet) this.onmessage?.({ data: JSON.stringify({ type: "error", message: "Network request failed" }) }); }
    finally { this.busy = false; }
  }
  send(raw) { this.request(JSON.parse(raw)); }
  close() { clearInterval(this.timer); this.readyState = 3; this.onclose?.({}); }
}
window.WebSocket = SuspectSocket;

