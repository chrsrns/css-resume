import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildWebSocketUrl,
  createWebSocketConnection,
  createWebSocketWithReconnect,
} from "../js/websocket.js";

const createdSockets = [];

class MockCloseEvent extends Event {
  constructor(code = 1000, reason = "") {
    super("close");
    this.code = code;
    this.reason = reason;
  }
}

class MockWebSocket extends EventTarget {
  constructor(url) {
    super();
    this.url = url;
    this.sent = [];
    createdSockets.push(this);
  }

  send(data) {
    this.sent.push(data);
  }

  open() {
    this.dispatchEvent(new Event("open"));
  }

  close(code = 1000, reason = "") {
    this.dispatchEvent(new MockCloseEvent(code, reason));
  }
}

const stubBrowserGlobals = () => {
  vi.stubGlobal("window", {
    location: {
      protocol: "https:",
      host: "api.example.com",
    },
  });
  vi.stubGlobal("WebSocket", MockWebSocket);
};

const resetSockets = () => {
  createdSockets.length = 0;
};

describe("buildWebSocketUrl", () => {
  it("resolves path-only API_BASE_URL to same origin", () => {
    expect(buildWebSocketUrl("/api", "ws:", "localhost:8080")).toBe(
      "ws://localhost:8080/api/ws"
    );
  });

  it("resolves host-only API_BASE_URL", () => {
    expect(buildWebSocketUrl("api.example.com", "wss:", "unused")).toBe(
      "wss://api.example.com/ws"
    );
  });

  it("converts https full URL to wss", () => {
    expect(buildWebSocketUrl("https://api.example.com/api/", "ws:", "unused")).toBe(
      "wss://api.example.com/api/ws"
    );
  });

  it("converts http full URL to ws", () => {
    expect(buildWebSocketUrl("http://api.example.com/api", "wss:", "unused")).toBe(
      "ws://api.example.com/api/ws"
    );
  });
});

describe("createWebSocketConnection", () => {
  beforeEach(() => {
    resetSockets();
    stubBrowserGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends a subscribe message on open", () => {
    const ws = createWebSocketConnection("/api", 192);
    expect(ws.url).toBe("wss://api.example.com/api/ws");
    ws.open();
    expect(ws.sent).toHaveLength(1);
    expect(JSON.parse(ws.sent[0])).toEqual({
      type: "subscribe",
      resume_id: 192,
    });
  });

  it("includes auth token when provided", () => {
    const ws = createWebSocketConnection("/api", 192, "secret-token");
    ws.open();
    expect(JSON.parse(ws.sent[0])).toEqual({
      type: "subscribe",
      resume_id: 192,
      token: "secret-token",
    });
  });
});

describe("createWebSocketWithReconnect", () => {
  beforeEach(() => {
    resetSockets();
    stubBrowserGlobals();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("reconnects up to 5 times with linear backoff", () => {
    const messageHandler = vi.fn();
    createWebSocketWithReconnect("/api", 192, null, messageHandler);
    expect(createdSockets).toHaveLength(1);

    for (let i = 0; i < 5; i++) {
      createdSockets[createdSockets.length - 1].close();
      vi.advanceTimersByTime(1000 * (i + 1));
      expect(createdSockets.length).toBe(i + 2);
    }

    // Sixth close should not reconnect.
    createdSockets[createdSockets.length - 1].close();
    vi.advanceTimersByTime(10000);
    expect(createdSockets.length).toBe(6);
  });

  it("does not reconnect before the delay expires", () => {
    createWebSocketWithReconnect("/api", 192);
    createdSockets[0].close();
    vi.advanceTimersByTime(500);
    expect(createdSockets.length).toBe(1);
    vi.advanceTimersByTime(500);
    expect(createdSockets.length).toBe(2);
  });

  it("registers the message handler on each socket", () => {
    const messageHandler = vi.fn();
    createWebSocketWithReconnect("/api", 192, null, messageHandler);
    createdSockets[0].dispatchEvent(new MessageEvent("message", { data: "{}" }));
    expect(messageHandler).toHaveBeenCalledTimes(1);
  });
});
