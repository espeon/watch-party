export default class ReconnectingWebSocket {
  constructor(url) {
    if (url instanceof URL) {
      this.url = url;
    } else {
      this.url = new URL(url);
    }
    this.connected = false;
    this._eventTarget = new EventTarget();
    this._backoff = 250; // milliseconds, doubled before use
    this._lastConnect = 0;
    this._socket = null;
    this._unsent = [];
    this._connect(true);
  }
  _connect(first) {
    if (this._socket)
      try {
        this._socket.close();
      } catch (e) {}
    try {
      this._socket = new WebSocket(this.url.href);
    } catch (e) {
      this._reconnecting = false;
      return this._reconnect();
    }
    this._socket.addEventListener("close", () => this._reconnect());
    this._socket.addEventListener("error", () => this._reconnect());
    this._socket.addEventListener("message", ({ data }) => {
      this._eventTarget.dispatchEvent(new MessageEvent("message", { data }));
    });
    this._socket.addEventListener("open", (e) => {
      if (first) this._eventTarget.dispatchEvent(new Event("open"));
      if (this._reconnecting)
        this._eventTarget.dispatchEvent(new Event("reconnected"));
      this._reconnecting = false;
      this._backoff = 250;
      this.connected = true;
      while (this._unsent.length > 0) this._socket.send(this._unsent.shift());
    });
  }
  _reconnect() {
    if (this._reconnecting) return;
    this._eventTarget.dispatchEvent(new Event("reconnecting"));
    this._reconnecting = true;
    this.connected = false;
    this._backoff *= 2; // exponential backoff
    setTimeout(() => {
      this._connect();
    }, Math.floor(this._backoff + Math.random() * this._backoff * 0.25 - this._backoff * 0.125));
  }
  send(message) {
    if (this.connected) {
      this._socket.send(message);
    } else {
      this._unsent.push(message);
    }
  }
  addEventListener(...a) {
    return this._eventTarget.addEventListener(...a);
  }
  removeEventListener(...a) {
    return this._eventTarget.removeEventListener(...a);
  }
}
