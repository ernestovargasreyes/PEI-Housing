'use strict';
/*
 * Sliding-window counters held in memory.
 *
 * This is a best-effort brake on spam and runaway retries, not a security boundary:
 * each Functions instance keeps its own counts and they reset on a cold start. The
 * per-phone limit (5 an hour, decisions.md) is also enforced in the form itself.
 * The per-address limit is generous because a whole crew can share one apartment
 * complex's Wi-Fi.
 */
class RateLimiter {
  constructor({ limit, windowMs, now = () => Date.now() }) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.now = now;
    this.hits = new Map();
  }
  _recent(key) {
    const cut = this.now() - this.windowMs;
    const list = (this.hits.get(key) || []).filter((t) => t > cut);
    if (list.length) this.hits.set(key, list); else this.hits.delete(key);
    return list;
  }
  /* True if one more hit is allowed. Does not record it. */
  check(key) { return !key || this._recent(key).length < this.limit; }
  record(key) { if (key) { const l = this._recent(key); l.push(this.now()); this.hits.set(key, l); } }
  /* Drop empty keys so the map cannot grow without bound. */
  sweep() { for (const k of [...this.hits.keys()]) this._recent(k); }
}

module.exports = { RateLimiter };
