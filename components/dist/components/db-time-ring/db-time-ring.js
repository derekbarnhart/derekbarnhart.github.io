const NS = 'http://www.w3.org/2000/svg';

function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }
function fmtTime(totalSeconds) {
  totalSeconds = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}

class DBTimeRing extends HTMLElement {
  static get observedAttributes() {
    return [
      'duration', 'mode', 'start-time', 'end-time', 'chunk-size',
      'major-step', 'minor-step', 'pulse-on-chunk', 'warn-threshold',
      'danger-threshold', 'label', 'autoplay', 'paused', 'reduced-motion'
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._running = false;
    this._reduced = false;
    this._raf = null;
    this._lastChunkIndex = null;
    this._pauseStart = null;
    this._offset = 0; // accumulated pause offset in ms when anchored
    this._baseStart = null; // ms
    this._baseEnd = null; // ms

    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: inline-block;
        --ring-size: 160px;
        --ring-thickness: 10px;
        --ring-bg: color-mix(in hsl, Canvas, CanvasText 12%);
        --ring-fg: #16a34a;
        --ring-warn: #ca8a04;
        --ring-danger: #dc2626;
        --tick-color: color-mix(in hsl, CanvasText, Canvas 20%);
        --label-color: currentColor;
        --pulse-scale: 1.06;
        --transition-duration: 50ms;
        position: relative;
        inline-size: var(--ring-size);
        block-size: var(--ring-size);
      }
      .wrap { inline-size: 100%; block-size: 100%; position: relative; }
      svg { display: block; inline-size: 100%; block-size: 100%; }
      .label { position: absolute; inset: 0; display: grid; place-items: center; color: var(--label-color); font: 600 0.95rem/1.1 system-ui, -apple-system, Segoe UI, Roboto, sans-serif; text-align: center; }
      .pulse { transform-origin: 50% 50%; }
      :host(.do-pulse) .pulse { animation: pulse 250ms ease-out; }
      @keyframes pulse { from { transform: scale(1); } to { transform: scale(var(--pulse-scale)); } }
      :host([danger]) .fg { stroke: var(--ring-danger); }
      :host([warn]):not([danger]) .fg { stroke: var(--ring-warn); }
      .ticks line { stroke: var(--tick-color); }
    `;

    // Build SVG structure
    const wrap = document.createElement('div');
    wrap.className = 'wrap';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('part', 'svg');

    const gTicks = document.createElementNS(NS, 'g');
    gTicks.setAttribute('class', 'ticks');
    svg.appendChild(gTicks);

    const bg = document.createElementNS(NS, 'circle');
    bg.setAttribute('class', 'bg');
    bg.setAttribute('cx', '50');
    bg.setAttribute('cy', '50');
    bg.setAttribute('r', '42');
    bg.setAttribute('fill', 'none');
    bg.setAttribute('stroke', 'var(--ring-bg)');
    bg.setAttribute('stroke-width', 'var(--ring-thickness)');
    bg.setAttribute('stroke-linecap', 'round');

    const fg = document.createElementNS(NS, 'circle');
    fg.setAttribute('class', 'fg pulse');
    fg.setAttribute('cx', '50');
    fg.setAttribute('cy', '50');
    fg.setAttribute('r', '42');
    fg.setAttribute('fill', 'none');
    fg.setAttribute('stroke', 'var(--ring-fg)');
    fg.setAttribute('stroke-width', 'var(--ring-thickness)');
    fg.setAttribute('stroke-linecap', 'round');
    fg.setAttribute('transform', 'rotate(-90 50 50)');

    const perim = 2 * Math.PI * 42;
    fg.setAttribute('stroke-dasharray', `${perim}`);
    fg.setAttribute('stroke-dashoffset', `${perim}`);

    svg.append(bg, fg);

    const label = document.createElement('div');
    label.className = 'label';
    label.setAttribute('part', 'label');
    label.textContent = '';

    wrap.append(svg, label);
    this.shadowRoot.append(style, wrap);

    // store references
    this._svg = svg;
    this._ticks = gTicks;
    this._fg = fg;
    this._labelEl = label;
    this._perim = perim;
  }

  connectedCallback() {
    this._applyReducedMotion();
    this._recalcAnchors();
    this._drawTicks();
    // initial paint
    this._render(0);
    // Anchored timers should reflect wall clock immediately; otherwise opt-in via autoplay
    const anchored = this._isAnchored();
    const shouldAuto = this.hasAttribute('autoplay') || anchored;
    if (shouldAuto && !this.hasAttribute('paused')) this.start();
    this._updateAria();
  }

  disconnectedCallback() { this._stopLoop(); }

  attributeChangedCallback(name, oldV, newV) {
    if (oldV === newV) return;
    if (name === 'paused') {
      if (this.hasAttribute('paused')) this.pause(); else this.start();
      return;
    }
    if (name === 'reduced-motion') {
      this._applyReducedMotion();
    }
    if (name === 'duration' || name === 'start-time' || name === 'end-time') {
      this._recalcAnchors();
    }
    if (name === 'chunk-size' || name === 'major-step' || name === 'minor-step') {
      this._drawTicks();
    }
    if (name === 'warn-threshold' || name === 'danger-threshold') {
      this._applyWarnDanger(this.progress);
    }
    // label/mode changes reflected on next update
    this._updateAria();
  }

  // Properties
  get duration() { return Number(this.getAttribute('duration') || 0); }
  set duration(v) { if (v == null) this.removeAttribute('duration'); else this.setAttribute('duration', String(v)); }
  get mode() { return (this.getAttribute('mode') || 'countdown'); }
  set mode(v) { this.setAttribute('mode', v); }
  get startTime() { return this.getAttribute('start-time'); }
  set startTime(v) { if (v == null) this.removeAttribute('start-time'); else this.setAttribute('start-time', String(v)); }
  get endTime() { return this.getAttribute('end-time'); }
  set endTime(v) { if (v == null) this.removeAttribute('end-time'); else this.setAttribute('end-time', String(v)); }
  get chunkSize() { return Number(this.getAttribute('chunk-size') || 0); }
  set chunkSize(v) { if (!v) this.removeAttribute('chunk-size'); else this.setAttribute('chunk-size', String(v)); }
  get majorStep() { return Number(this.getAttribute('major-step') || 0); }
  set majorStep(v) { if (!v) this.removeAttribute('major-step'); else this.setAttribute('major-step', String(v)); }
  get minorStep() { return Number(this.getAttribute('minor-step') || 0); }
  set minorStep(v) { if (!v) this.removeAttribute('minor-step'); else this.setAttribute('minor-step', String(v)); }
  get pulseOnChunk() { return this.hasAttribute('pulse-on-chunk'); }
  set pulseOnChunk(v) { v ? this.setAttribute('pulse-on-chunk','') : this.removeAttribute('pulse-on-chunk'); }
  get warnThreshold() { return Number(this.getAttribute('warn-threshold') ?? 0.2); }
  set warnThreshold(v) { this.setAttribute('warn-threshold', String(v)); }
  get dangerThreshold() { return Number(this.getAttribute('danger-threshold') ?? 0.1); }
  set dangerThreshold(v) { this.setAttribute('danger-threshold', String(v)); }
  get labelMode() { return this.getAttribute('label') || 'none'; }
  set labelMode(v) { this.setAttribute('label', v); }
  get autoplay() { return this.hasAttribute('autoplay'); }
  set autoplay(v) { v ? this.setAttribute('autoplay','') : this.removeAttribute('autoplay'); }
  get paused() { return this.hasAttribute('paused'); }
  set paused(v) { v ? this.setAttribute('paused','') : this.removeAttribute('paused'); }
  get reducedMotion() { return this.hasAttribute('reduced-motion') || this._prefersReduced; }
  set reducedMotion(v) { v ? this.setAttribute('reduced-motion','') : this.removeAttribute('reduced-motion'); }

  get running() { return this._running; }
  get progress() { return this._progress || 0; }
  get elapsed() { return this._elapsedSec || 0; }
  get remaining() { return Math.max(0, (this.duration || 0) - (this._elapsedSec || 0)); }

  // Methods
  start() {
    if (this._running) return;
    // Establish anchors if none
    this._recalcAnchors();
    if (this._pauseStart != null) {
      const delta = Date.now() - this._pauseStart;
      this._pauseStart = null;
      // shift anchors by pause duration
      if (this._baseStart != null) this._baseStart += delta;
      if (this._baseEnd != null) this._baseEnd += delta;
    }
    this._running = true;
    this.removeAttribute('paused');
    this.dispatchEvent(new CustomEvent('db-start'));
    this._startLoop();
  }

  pause() {
    if (!this._running) return;
    this._running = false;
    this._pauseStart = Date.now();
    this.setAttribute('paused','');
    this.dispatchEvent(new CustomEvent('db-pause'));
    this._stopLoop();
    this._render();
  }

  reset(opts = {}) {
    this._running = false;
    this._pauseStart = null;
    this._offset = 0;
    if (opts.hard) { this._baseStart = null; this._baseEnd = null; }
    this._stopLoop();
    this._lastChunkIndex = null;
    this.removeAttribute('warn');
    this.removeAttribute('danger');
    this.dispatchEvent(new CustomEvent('db-reset'));
    this._render(0);
  }

  seek(arg) {
    const dur = this.duration || 0;
    if (!dur) return;
    let newElapsed;
    if (arg <= 1) newElapsed = clamp(arg, 0, 1) * dur;
    else newElapsed = clamp(arg, 0, dur);
    const now = Date.now();
    // adjust anchors so that elapsed becomes newElapsed
    if (this._baseStart != null) {
      this._baseStart = now - newElapsed * 1000;
      if (this._baseEnd != null && this.mode === 'countdown') {
        this._baseEnd = this._baseStart + dur * 1000;
      }
    }
    this._render();
  }

  sync(now = Date.now()) {
    // No-op except to force a render using provided now
    this._render(undefined, now);
  }

  // Internals
  _isAnchored() {
    return !!(this.getAttribute('end-time') || this.getAttribute('start-time'));
  }

  _parseTimeAttr(val) {
    if (val == null) return null;
    if (/^\d{10,}$/.test(String(val))) return Number(val);
    const d = new Date(val);
    if (!isNaN(d)) return d.getTime();
    const n = Number(val);
    return isNaN(n) ? null : n;
  }

  _recalcAnchors() {
    const dur = (this.duration || 0) * 1000;
    const st = this._parseTimeAttr(this.getAttribute('start-time'));
    const et = this._parseTimeAttr(this.getAttribute('end-time'));
    if (et && dur) {
      this._baseEnd = et;
      this._baseStart = et - dur;
    } else if (st && dur) {
      this._baseStart = st;
      this._baseEnd = st + dur;
    } else {
      // non-anchored: define start when actually running
      if (this._running) {
        if (!this._baseStart) this._baseStart = Date.now();
        if (!this._baseEnd && dur) this._baseEnd = this._baseStart + dur;
      }
    }
  }

  _applyReducedMotion() {
    this._prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this._reduced = this.reducedMotion;
  }

  _startLoop() {
    if (this._raf) return;
    const step = (t) => {
      this._raf = null;
      this._render();
      // cadencing: 15Hz for smooth arc, 1Hz when reduced
      const delay = this._reduced ? 1000 : 66;
      this._raf = setTimeout(() => requestAnimationFrame(step), delay);
    };
    requestAnimationFrame(step);
  }

  _stopLoop() {
    if (this._raf) { clearTimeout(this._raf); this._raf = null; }
  }

  _drawTicks() {
    const dur = this.duration || 0;
    const chunk = this.chunkSize || (dur >= 900 ? 300 : 60);
    const major = this.majorStep || chunk * 3; // default: every 3 chunks as major
    const minor = this.minorStep || chunk;     // default: chunk as minor
    this._ticks.textContent = '';
    if (!dur) return;
    const addTick = (angle, len, cls='') => {
      const rad = (angle - 90) * Math.PI / 180;
      const rOuter = 42 + (parseFloat(getComputedStyle(this).getPropertyValue('--ring-thickness')) || 10) / 10;
      const rInner = 42 - len;
      const x1 = 50 + rInner * Math.cos(rad);
      const y1 = 50 + rInner * Math.sin(rad);
      const x2 = 50 + rOuter * Math.cos(rad);
      const y2 = 50 + rOuter * Math.sin(rad);
      const line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', x1.toFixed(2));
      line.setAttribute('y1', y1.toFixed(2));
      line.setAttribute('x2', x2.toFixed(2));
      line.setAttribute('y2', y2.toFixed(2));
      if (cls) line.setAttribute('class', cls);
      this._ticks.appendChild(line);
    };
    // draw minor ticks
    for (let t = 0; t <= dur; t += minor) {
      const angle = 360 * (t / dur);
      addTick(angle, 4, 'minor');
    }
    // draw major ticks
    for (let t = 0; t <= dur; t += major) {
      const angle = 360 * (t / dur);
      addTick(angle, 7, 'major');
    }
  }

  _applyWarnDanger(progress) {
    // progress: 0..1 elapsed fraction
    const dur = this.duration || 0;
    if (!dur) { this.removeAttribute('warn'); this.removeAttribute('danger'); return; }
    let remainingFrac = 1 - progress;
    if (this.mode === 'elapsed') remainingFrac = 1 - progress; // same
    const warn = Number(this.getAttribute('warn-threshold') ?? 0.2);
    const danger = Number(this.getAttribute('danger-threshold') ?? 0.1);
    if (remainingFrac <= danger) { this.setAttribute('danger',''); this.removeAttribute('warn'); }
    else if (remainingFrac <= warn) { this.setAttribute('warn',''); this.removeAttribute('danger'); }
    else { this.removeAttribute('warn'); this.removeAttribute('danger'); }
  }

  _updateAria() {
    const dur = this.duration || 0;
    const mode = this.mode || 'countdown';
    if (mode === 'countdown') this.setAttribute('role','timer');
    else this.setAttribute('role','progressbar');
    this.setAttribute('aria-valuemin', '0');
    this.setAttribute('aria-valuemax', String(dur));
    this.setAttribute('aria-valuenow', String(this.elapsed));
    const text = mode === 'countdown' ? `${fmtTime(this.remaining)} remaining` : `${fmtTime(this.elapsed)} elapsed`;
    this.setAttribute('aria-valuetext', text);
  }

  _render(forceProgress, nowMs) {
    const now = nowMs ?? Date.now();
    const dur = (this.duration || 0);
    let elapsedSec = 0;
    if (forceProgress != null) {
      elapsedSec = dur * forceProgress;
    } else if (this._baseStart != null) {
      let end = this._baseEnd;
      let start = this._baseStart;
      if (this._pauseStart != null) {
        // frozen
        elapsedSec = (this._pauseStart - start) / 1000;
      } else {
        elapsedSec = (now - start) / 1000;
      }
      if (dur) elapsedSec = clamp(elapsedSec, 0, dur);
    }

    const progress = dur ? clamp(elapsedSec / dur, 0, 1) : 0;
    this._progress = progress;
    this._elapsedSec = elapsedSec;

    // dash offset for foreground arc
    const remainingFrac = (this.mode === 'countdown') ? 1 - progress : progress;
    const dash = this._perim * (1 - remainingFrac);
    // Dashoffset equals the portion not drawn; with dasharray = perim, offset = perim*(1 - arcFraction)
    this._fg.setAttribute('stroke-dashoffset', String(dash));

    // label rendering
    const labelMode = this.labelMode;
    if (labelMode && labelMode !== 'none') {
      const parts = [];
      if (labelMode === 'remaining' || labelMode === 'both') parts.push(fmtTime(dur - elapsedSec));
      if (labelMode === 'elapsed' || labelMode === 'both') parts.push(fmtTime(elapsedSec));
      this._labelEl.textContent = parts.join(' • ');
    } else {
      this._labelEl.textContent = '';
    }

    // events and pulses at chunk boundaries
    const chunk = this.chunkSize || (dur >= 900 ? 300 : 60);
    if (chunk && dur) {
      const chunkIndex = Math.floor(elapsedSec / chunk);
      if (this._lastChunkIndex == null) this._lastChunkIndex = chunkIndex;
      if (chunkIndex !== this._lastChunkIndex) {
        this._lastChunkIndex = chunkIndex;
        this.dispatchEvent(new CustomEvent('db-chunk', { detail: { elapsed: elapsedSec, remaining: dur - elapsedSec, chunkIndex } }));
        if (this.pulseOnChunk && !this._reduced) {
          this.classList.remove('do-pulse');
          // force reflow for restart
          void this.offsetWidth;
          this.classList.add('do-pulse');
          setTimeout(() => this.classList.remove('do-pulse'), 260);
        }
      }
    }

    this.dispatchEvent(new CustomEvent('db-tick', { detail: { elapsed: elapsedSec, remaining: dur - elapsedSec, progress } }));
    this._applyWarnDanger(progress);
    this._updateAria();

    // finish
    if (dur && progress >= 1) {
      if (this._running) {
        this._running = false;
        this._stopLoop();
        this.dispatchEvent(new CustomEvent('db-finish'));
      }
    }
  }
}

if (!customElements.get('db-time-ring')) {
  customElements.define('db-time-ring', DBTimeRing);
}

export { DBTimeRing };
