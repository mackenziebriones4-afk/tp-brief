/* Terminal Paradigm Brief: night map engine with a tilted, slowly turning camera.
   One canvas per country. The scene is three flat planes seen through one perspective camera:
     below  - tactical grid and contour rings, under the land
     ground - land, coast, town lights, cities, level glow, pin
     above  - haze, over the land
   Because the planes sit at different heights, panning, zooming and turning the camera
   shifts them against each other. That is the depth. Plain vector drawing, no live blur. */
(function () {
  "use strict";
  var GEO = window.TP_GEO;
  var RGB = { g: "53,208,127", y: "242,199,68", r: "255,77,77" };
  var BG = "#00040B", LAND = "#0F1622", EDGE = "#020409";
  var REDUCE = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FLY_MS = 1700;
  var PITCH = { rest: 0.72, center: 0.34, city: 0.92 };   /* radians: about 41, 19 and 53 degrees */
  var TURN = 0.11, TURN_RATE = 0.00015;                    /* idle sway: about 6 degrees each way, one cycle in 42 s */

  function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function sprite(size, stops) {
    var c = document.createElement("canvas"); c.width = c.height = size;
    var x = c.getContext("2d"), g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(function (s) { g.addColorStop(s[0], s[1]); });
    x.fillStyle = g; x.fillRect(0, 0, size, size); return c;
  }
  var GLOW = null, HAZE = null;

  /* ---- national flag, laid flat on the ground and later clipped to the land ----
     Built once in world units with the flag's real proportions and colours.
     Each part is one fill; holes are cut so translucent colours never stack. */
  function arcPts(cx, cy, r, a0, a1, n, out) { for (var i = 0; i <= n; i++) { var a = a0 + (a1 - a0) * i / n; out.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } }
  function starPts(cx, cy, R, rot) { var o = []; for (var i = 0; i < 10; i++) { var a = rot + i * Math.PI / 5, r = i % 2 ? R * 0.382 : R; o.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } return o; }
  function F32(a) { return new Float32Array(a); }
  function buildFlag(key, b) {
    var fx, fy, cy;
    if (key === "tk") {
      /* 2:3 field. Crescent and star placed by the official construction, in units of the flag height G. */
      var G = Math.max(b.h, b.w / 1.5), fw = 1.5 * G; fx = b.cx - fw / 2; fy = b.cy - G / 2; cy = fy + G / 2;
      var t1 = Math.atan2(0.1336, 0.2113), t2 = Math.atan2(0.1336, 0.1488), cr = [];
      arcPts(fx + 0.5 * G, cy, 0.25 * G, t1, 2 * Math.PI - t1, 44, cr);
      arcPts(fx + 0.5625 * G, cy, 0.2 * G, 2 * Math.PI - t2, t2, 36, cr);
      var st = starPts(fx + 0.8208 * G, cy, 0.125 * G, Math.PI);
      return { parts: [
        { c: "#E30A17", eo: true, rings: [F32([fx, fy, fx + fw, fy, fx + fw, fy + G, fx, fy + G]), F32(cr), F32(st)] },
        { c: "#FFFFFF", eo: false, rings: [F32(cr), F32(st)] }
      ], lines: [F32(cr), F32(st)] };
    }
    /* Philippines, 1:2. Blue over red, white triangle at the hoist with the sun and three stars.
       Shifted sideways so the sun falls on land in the middle of the country. */
    var H = Math.max(b.h, b.w / 2), w2 = 2 * H, tri = 0.866 * H; fx = b.x0 + 3.4 - tri / 3; fy = b.cy - H / 2; cy = fy + H / 2;
    var sx = fx + tri / 3, sun = [], k, a;
    for (k = 0; k < 8; k++) {
      a = k * Math.PI / 4;
      sun.push(sx + Math.cos(a - 0.2) * 0.075 * H, cy + Math.sin(a - 0.2) * 0.075 * H, sx + Math.cos(a) * 0.17 * H, cy + Math.sin(a) * 0.17 * H,
               sx + Math.cos(a + 0.2) * 0.075 * H, cy + Math.sin(a + 0.2) * 0.075 * H, sx + Math.cos(a + Math.PI / 8) * 0.075 * H, cy + Math.sin(a + Math.PI / 8) * 0.075 * H);
    }
    var stars = [[fx, fy], [fx, fy + H], [fx + tri, cy]].map(function (c) {
      var px = c[0] + (sx - c[0]) * 0.24, py = c[1] + (cy - c[1]) * 0.24;
      return F32(starPts(px, py, 0.045 * H, Math.atan2(c[1] - py, c[0] - px)));
    });
    var gold = [F32(sun)].concat(stars);
    return { parts: [
      { c: "#0038A8", eo: false, rings: [F32([fx, fy, fx + w2, fy, fx + w2, cy, fx + tri, cy])] },
      { c: "#CE1126", eo: false, rings: [F32([fx, fy + H, fx + tri, cy, fx + w2, cy, fx + w2, fy + H])] },
      { c: "#FFFFFF", eo: true, rings: [F32([fx, fy, fx + tri, cy, fx, fy + H])].concat(gold) },
      { c: "#FCD116", eo: false, rings: gold }
    ], lines: gold.concat([F32([fx, fy, fx + tri, cy, fx, fy + H]), F32([fx + tri, cy, fx + w2, cy, fx + w2, cy + 0.001, fx + tri, cy + 0.001])]) };
  }

  /* Light flag texture: fine hairlines across the flag, as plain line segments [x0,y0,x1,y1,...] in world units. */
  function buildSplice(b) {
    var per = Math.max(b.w, b.h) / 72, lines = [], y;
    for (y = b.y0 + per / 2; y < b.y1; y += per) lines.push(b.x0 - 0.5, y, b.x1 + 0.5, y);
    return { lines: new Float32Array(lines) };
  }
  var IDLE_MS = 700, FULL_MAP = 1.2;   /* the flag belongs to the full map: hidden once zoomed past 1.2x the resting view */

  function TPMap(key, canvas, opts) {
    var g = GEO[key], self = this;
    this.key = key; this.g = g; this.cv = canvas; this.ctx = canvas.getContext("2d");
    this.opts = opts || {}; this.level = this.opts.level || "g";
    this.k = Math.cos(g.lat0 * Math.PI / 180);
    this.W = 0; this.H = 0; this.D = 800; this.dpr = 1;
    this.cam = { x: 0, y: 0, z: 10, p: PITCH.rest, b: 0 }; this.view = "rest"; this.tween = null;
    this.cb = 1; this.sb = 0; this.cp = 1; this.sp = 0;
    this.pin = null; this.target = null; this.hudAt = 0; this.o = [0, 0, 1];
    if (!GLOW) {
      GLOW = sprite(64, [[0, "rgba(255,226,170,.95)"], [0.18, "rgba(255,206,140,.55)"], [0.5, "rgba(255,190,120,.12)"], [1, "rgba(255,190,120,0)"]]);
      HAZE = sprite(128, [[0, "rgba(170,190,225,.5)"], [0.6, "rgba(170,190,225,.14)"], [1, "rgba(170,190,225,0)"]]);
    }

    /* ---- geometry in flat world units, built once ---- */
    var minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
    function flat(ring, grow) {
      var a = new Float32Array(ring.length * 2);
      ring.forEach(function (p, i) {
        var q = self.P(p[0], p[1]); a[i * 2] = q[0]; a[i * 2 + 1] = q[1];
        if (grow) { if (q[0] < minx) minx = q[0]; if (q[0] > maxx) maxx = q[0]; if (q[1] < miny) miny = q[1]; if (q[1] > maxy) maxy = q[1]; }
      });
      return a;
    }
    this.land = g.land.map(function (r) { return flat(r, true); });
    this.water = g.water.map(function (r) { return flat(r, false); });
    var b = this.box = { x0: minx, y0: miny, x1: maxx, y1: maxy, w: maxx - minx, h: maxy - miny, cx: (minx + maxx) / 2, cy: (miny + maxy) / 2 };
    var size = Math.max(b.w, b.h), v, seg;
    this.below = -size * 0.075; this.above = size * 0.05;

    seg = [];                                                /* graticule on the land */
    for (v = Math.ceil(b.x0); v <= b.x1; v += 1) seg.push(v, b.y0 - 0.5, v, b.y1 + 0.5);
    for (v = Math.ceil(b.y0); v <= b.y1; v += 1) seg.push(b.x0 - 0.5, v, b.x1 + 0.5, v);
    this.grat = new Float32Array(seg);

    seg = [];                                                /* wide grid on the plane below */
    var m = size * 0.9, sp = size / 11;
    for (v = b.cx - m; v <= b.cx + m + 0.01; v += sp) seg.push(v, b.cy - m, v, b.cy + m);
    for (v = b.cy - m; v <= b.cy + m + 0.01; v += sp) seg.push(b.cx - m, v, b.cx + m, v);
    this.grid = new Float32Array(seg);

    this.rings = [];
    for (var i = 0; i < 5; i++) {
      var rx = b.w * (0.34 + i * 0.16), ry = b.h * (0.34 + i * 0.16), ring = new Float32Array(128);
      for (var a = 0; a < 64; a++) {
        var t = a / 64 * Math.PI * 2, wob = 1 + 0.07 * Math.sin(3 * t + i) + 0.05 * Math.sin(5 * t + i * 2.1);
        ring[a * 2] = b.cx + Math.cos(t) * rx * wob; ring[a * 2 + 1] = b.cy + Math.sin(t) * ry * wob;
      }
      this.rings.push(ring);
    }

    this.cities = g.cities.map(function (c, idx) {
      var p = self.P(c.lon, c.lat);
      return { n: c.n, label: c.n.toLocaleUpperCase(g.locale), x: p[0], y: p[1], t: c.t, w: c.w, side: idx % 2 ? 1 : -1, sx: -999, sy: -999, s: 1 };
    });

    /* town lights: clustered around cities, plus a thin scatter, all on land */
    var rnd = rng(key === "tk" ? 90210 : 63110), L = [];
    function gauss() { return (rnd() + rnd() + rnd() + rnd() - 2) * 0.9; }
    g.cities.forEach(function (c) {
      var n = Math.round(10 + c.w * 46), s = 0.16 + c.w * 0.3;
      for (var j = 0; j < n; j++) {
        var lon = c.lon + gauss() * s / self.k, lat = c.lat + gauss() * s;
        if (GEO.onLand(g, lon, lat)) { var p = self.P(lon, lat); L.push(p[0], p[1], rnd() < 0.3 ? 2 : rnd() < 0.5 ? 1 : 0); }
      }
    });
    var tries = 0, want = L.length / 3 + 150;
    while (L.length / 3 < want && tries++ < 4000) {
      var lo = (b.cx + (rnd() - 0.5) * b.w) / self.k + g.lon0, la = g.lat0 - (b.cy + (rnd() - 0.5) * b.h);
      if (GEO.onLand(g, lo, la)) { var q = self.P(lo, la); L.push(q[0], q[1], 0); }
    }
    this.lights = new Float32Array(L);
    this.haze = [[b.x0 + b.w * 0.2, b.y0 + b.h * 0.25, 1.1], [b.x0 + b.w * 0.75, b.y0 + b.h * 0.6, 1.4], [b.x0 + b.w * 0.4, b.y0 + b.h * 0.9, 0.9]];

    /* flag state: shown while the map is idle, hidden while it is touched or flying */
    this.flag = buildFlag(key, b); this.splice = buildSplice(b); this.flagA = 1; this.lastAct = -1e9; this.lastDraw = 0; this.active = 0;

    this.bindGestures();
  }

  TPMap.prototype.P = function (lon, lat) { return [(lon - this.g.lon0) * this.k, this.g.lat0 - lat]; };

  /* ---- camera ---- */
  TPMap.prototype.aim = function (now) {
    var c = this.cam, th = c.b + (REDUCE ? 0 : Math.sin(now * TURN_RATE) * TURN);
    this.th = th; this.cb = Math.cos(th); this.sb = Math.sin(th); this.cp = Math.cos(c.p); this.sp = Math.sin(c.p);
  };
  /* world point at height h (world units) to screen. out = [x, y, scale] */
  TPMap.prototype.proj = function (wx, wy, h, out) {
    var c = this.cam, dx = (wx - c.x) * c.z, dy = (wy - c.y) * c.z, hz = h * c.z;
    var rx = dx * this.cb - dy * this.sb, ry = dx * this.sb + dy * this.cb;
    var w = this.D - ry * this.sp - hz * this.cp; if (w < this.D * 0.12) return false;
    var s = this.D / w; out[0] = this.W / 2 + rx * s; out[1] = this.H / 2 + (ry * this.cp - hz * this.sp) * s; out[2] = s; return true;
  };
  /* ground offset, in pixels at the target's scale, that shows up at screen point (sx, sy) */
  function groundOffset(W, H, D, p, b, sx, sy) {
    var X = sx - W / 2, Y = sy - H / 2, cp = Math.cos(p), sp = Math.sin(p), den = D * cp + Y * sp;
    if (den < D * 0.15) den = D * 0.15;
    var ry = Y * D / den, rx = X * (D - ry * sp) / D, cb = Math.cos(b), sb = Math.sin(b);
    return [rx * cb + ry * sb, -rx * sb + ry * cb];
  }
  TPMap.prototype.unproj = function (sx, sy) {
    var o = groundOffset(this.W, this.H, this.D, this.cam.p, this.th, sx, sy);
    return [this.cam.x + o[0] / this.cam.z, this.cam.y + o[1] / this.cam.z];
  };

  /* closed ring to a screen path, cut where it would pass behind the camera */
  TPMap.prototype.ringTo = function (path, R, h) {
    var c = this.cam, z = c.z, cb = this.cb, sb = this.sb, cp = this.cp, sp = this.sp, D = this.D, W2 = this.W / 2, H2 = this.H / 2;
    var hz = h * z, lim = sp > 0.02 ? (D * 0.86 - hz * cp) / sp : 1e12, n = R.length / 2, on = false;
    var i, dx, dy, rx, ry, cin, t, s;
    dx = (R[2 * n - 2] - c.x) * z; dy = (R[2 * n - 1] - c.y) * z;
    var prx = dx * cb - dy * sb, pry = dx * sb + dy * cb, pin = pry <= lim;
    function put(x, y) {
      s = D / (D - y * sp - hz * cp);
      if (on) path.lineTo(W2 + x * s, H2 + (y * cp - hz * sp) * s); else { path.moveTo(W2 + x * s, H2 + (y * cp - hz * sp) * s); on = true; }
    }
    for (i = 0; i < n; i++) {
      dx = (R[2 * i] - c.x) * z; dy = (R[2 * i + 1] - c.y) * z; rx = dx * cb - dy * sb; ry = dx * sb + dy * cb; cin = ry <= lim;
      if (cin !== pin) { t = (lim - pry) / (ry - pry); put(prx + (rx - prx) * t, lim); }
      if (cin) put(rx, ry);
      prx = rx; pry = ry; pin = cin;
    }
    if (on) path.closePath();
  };
  /* line segments [x0,y0,x1,y1,...] to a screen path, cut the same way */
  TPMap.prototype.segsTo = function (path, S, h) {
    var c = this.cam, z = c.z, cb = this.cb, sb = this.sb, cp = this.cp, sp = this.sp, D = this.D, W2 = this.W / 2, H2 = this.H / 2;
    var hz = h * z, lim = sp > 0.02 ? (D * 0.86 - hz * cp) / sp : 1e12, i, dx, dy, ax, ay, bx, by, t, s;
    for (i = 0; i < S.length; i += 4) {
      dx = (S[i] - c.x) * z; dy = (S[i + 1] - c.y) * z; ax = dx * cb - dy * sb; ay = dx * sb + dy * cb;
      dx = (S[i + 2] - c.x) * z; dy = (S[i + 3] - c.y) * z; bx = dx * cb - dy * sb; by = dx * sb + dy * cb;
      if (ay > lim && by > lim) continue;
      if (ay > lim) { t = (lim - by) / (ay - by); ax = bx + (ax - bx) * t; ay = lim; }
      else if (by > lim) { t = (lim - ay) / (by - ay); bx = ax + (bx - ax) * t; by = lim; }
      s = D / (D - ay * sp - hz * cp); path.moveTo(W2 + ax * s, H2 + (ay * cp - hz * sp) * s);
      s = D / (D - by * sp - hz * cp); path.lineTo(W2 + bx * s, H2 + (by * cp - hz * sp) * s);
    }
  };

  /* ---- views ---- */
  TPMap.prototype.viewCam = function (name) {
    var b = this.box, W = this.W, H = this.H, r = this.g.rest;
    var fit = Math.min(W * 0.92 / b.w, H * 0.8 / b.h);
    if (name === "center") return { x: b.cx, y: b.cy + b.h * 0.03, z: fit * 1.05, p: PITCH.center, b: 0 };
    var z = fit * r.zf, f = this.P(r.lon, r.lat), o = groundOffset(W, H, this.D, PITCH.rest, r.b, r.ax * W, r.ay * H);
    return { x: f[0] - o[0] / z, y: f[1] - o[1] / z, z: z, p: PITCH.rest, b: r.b };
  };
  TPMap.prototype.cityCam = function (c) { return { x: c.x, y: c.y, z: this.W / 2.3, p: PITCH.city, b: 0.2 * c.side }; };
  TPMap.prototype.city = function (name) {
    for (var i = 0; i < this.cities.length; i++) if (this.cities[i].n === name) return this.cities[i];
    return null;
  };
  TPMap.prototype.setView = function (v) {
    if (this.view === v) return;
    this.view = v; if (this.opts.onView) this.opts.onView(this.key, v);
  };

  TPMap.prototype.resize = function () {
    var r = this.cv.getBoundingClientRect(); if (!r.width || !r.height) return;
    this.W = r.width; this.H = r.height; this.D = this.H * 1.45; this.dpr = Math.min(window.devicePixelRatio || 1, 3);
    this.cv.width = Math.round(this.W * this.dpr); this.cv.height = Math.round(this.H * this.dpr);
    this.restZ = this.viewCam("rest").z;
    if (this.view === "rest" || this.view === "center") { this.tween = null; this.cam = this.viewCam(this.view); }
    this.draw(performance.now());
  };

  TPMap.prototype.snap = function (v) { this.tween = null; this.target = null; this.cam = this.viewCam(v); this.setView(v); };
  TPMap.prototype.fly = function (to, view) {
    this.setView(view); this.lastAct = performance.now();
    if (REDUCE || !this.W) { this.cam = to; this.tween = null; return; }
    var c = this.cam;
    this.tween = { a: { x: c.x, y: c.y, z: c.z, p: c.p, b: c.b }, b: to, t0: performance.now() };
  };
  TPMap.prototype.flyView = function (v) { this.target = null; this.fly(this.viewCam(v), v); };
  TPMap.prototype.flyCity = function (name) {
    var c = this.city(name); if (!c) { this.flyView("center"); return; }
    this.target = c; this.fly(this.cityCam(c), "city");
  };
  TPMap.prototype.toggleCenter = function () { this.flyView(this.view === "center" ? "rest" : "center"); };
  TPMap.prototype.setPin = function (name, lvl) { var c = name && this.city(name); this.pin = c ? { c: c, lvl: lvl || "g" } : null; };
  TPMap.prototype.randomCity = function () { return this.cities[Math.floor(Math.random() * this.cities.length)].n; };

  TPMap.prototype.step = function (now) {
    var tw = this.tween; if (!tw) return;
    var p = clamp((now - tw.t0) / FLY_MS, 0, 1), e = ease(p), a = tw.a, b = tw.b, z, s;
    var lr = Math.log(b.z / a.z);
    if (Math.abs(lr) > 0.03) {
      /* zoom in log space, and move the target so the place being approached glides in steadily */
      z = a.z * Math.exp(lr * e); s = (1 - a.z / z) / (1 - a.z / b.z);
    } else {
      /* same zoom: pull back a little mid-flight */
      var dist = Math.hypot(b.x - a.x, b.y - a.y) * a.z;
      z = a.z * (1 - Math.min(0.32, dist / 900) * Math.sin(Math.PI * e)); s = e;
    }
    this.cam = { x: a.x + (b.x - a.x) * s, y: a.y + (b.y - a.y) * s, z: z, p: a.p + (b.p - a.p) * e, b: a.b + (b.b - a.b) * e };
    if (p >= 1) { this.cam = { x: b.x, y: b.y, z: b.z, p: b.p, b: b.b }; this.tween = null; }
  };

  /* ---- drawing ---- */
  TPMap.prototype.draw = function (now) {
    if (!this.W) return;
    this.step(now); this.aim(now);
    var dt = Math.min(100, Math.max(0, now - (this.lastDraw || now))); this.lastDraw = now;
    if (this.tween || this.active > 0) this.lastAct = now;
    var want = (now - this.lastAct > IDLE_MS && this.cam.z <= this.restZ * FULL_MAP) ? 1 : 0;
    this.flagA = REDUCE ? want : clamp(this.flagA + clamp(want - this.flagA, -dt / 220, dt / 650), 0, 1);
    var x = this.ctx, d = this.dpr, W = this.W, H = this.H, c = this.cam, b = this.box, rgb = RGB[this.level], o = this.o;
    var rel = c.z / this.restZ, i, path;

    x.setTransform(d, 0, 0, d, 0, 0);
    x.globalAlpha = 1; x.globalCompositeOperation = "source-over"; x.lineJoin = "round";
    x.fillStyle = BG; x.fillRect(0, 0, W, H);

    /* plane below: grid and contour rings */
    path = new Path2D(); this.segsTo(path, this.grid, this.below);
    x.strokeStyle = "rgba(165,180,205,.07)"; x.lineWidth = 1; x.stroke(path);
    path = new Path2D(); for (i = 0; i < this.rings.length; i++) this.ringTo(path, this.rings[i], this.below);
    x.strokeStyle = "rgba(165,180,205,.085)"; x.stroke(path);

    /* level glow, lying on the ground */
    if (this.proj(b.cx, b.cy, 0, o)) {
      var gr = Math.max(b.w, b.h) * c.z * 0.72 * o[2];
      x.save(); x.translate(o[0], o[1]); x.scale(1, Math.max(0.5, this.cp));
      var grad = x.createRadialGradient(0, 0, 0, 0, 0, gr);
      grad.addColorStop(0, "rgba(" + rgb + ",.20)"); grad.addColorStop(0.55, "rgba(" + rgb + ",.07)"); grad.addColorStop(1, "rgba(" + rgb + ",0)");
      x.fillStyle = grad; x.beginPath(); x.arc(0, 0, gr, 0, 6.2832); x.fill(); x.restore();
    }

    /* land: a dark slab underneath, then the top face */
    var land = new Path2D(); for (i = 0; i < this.land.length; i++) this.ringTo(land, this.land[i], 0);
    var lift = clamp(2 + rel * 1.6 + this.sp * 5, 4, 10);
    x.save(); x.translate(0, lift);
    x.fillStyle = EDGE; x.fill(land); x.strokeStyle = "rgba(" + rgb + ",.22)"; x.lineWidth = 1; x.stroke(land);
    x.restore();
    x.fillStyle = LAND; x.fill(land);
    x.save(); x.clip(land);
    if (this.flagA > 0.01) {
      var fa = this.flagA, F = this.flag, fp, fr, part, fi;
      var paint = function (self) {
        for (fi = 0; fi < F.parts.length; fi++) {
          part = F.parts[fi]; fp = new Path2D();
          for (fr = 0; fr < part.rings.length; fr++) self.ringTo(fp, part.rings[fr], 0);
          x.fillStyle = part.c; x.fill(fp, part.eo ? "evenodd" : "nonzero");
        }
      };
      x.globalAlpha = 0.4 * fa; paint(this);                        /* one soft, faded layer of colour */
      x.strokeStyle = LAND;                                         /* texture: the map showing through in fine lines */
      fp = new Path2D(); this.segsTo(fp, this.splice.lines, 0); x.globalAlpha = 0.45 * fa; x.lineWidth = 0.6; x.stroke(fp);
      fp = new Path2D(); for (fr = 0; fr < F.lines.length; fr++) this.ringTo(fp, F.lines[fr], 0);
      x.globalAlpha = 0.3 * fa; x.strokeStyle = "#FFFFFF"; x.lineWidth = 0.7; x.stroke(fp);
      /* fade the flag out toward the far edge of the country */
      var yTop = 1e9, yBot = -1e9, cx4 = [b.x0, b.x1, b.x1, b.x0], cy4 = [b.y0, b.y0, b.y1, b.y1];
      for (fi = 0; fi < 4; fi++) if (this.proj(cx4[fi], cy4[fi], 0, o)) { if (o[1] < yTop) yTop = o[1]; if (o[1] > yBot) yBot = o[1]; }
      if (yBot > yTop) {
        var fg = x.createLinearGradient(0, yTop, 0, yTop + (yBot - yTop) * 0.6);
        fg.addColorStop(0, "rgba(15,22,34,.62)"); fg.addColorStop(1, "rgba(15,22,34,0)");
        x.globalAlpha = fa; x.fillStyle = fg; x.fillRect(0, yTop - 2, W, (yBot - yTop) * 0.6 + 4);
      }
      x.globalAlpha = 1;
    }
    path = new Path2D(); this.segsTo(path, this.grat, 0);
    x.strokeStyle = "rgba(165,180,205,.075)"; x.lineWidth = 1; x.stroke(path);
    x.restore();
    var water = null;
    if (this.water.length) { water = new Path2D(); for (i = 0; i < this.water.length; i++) this.ringTo(water, this.water[i], 0); x.fillStyle = BG; x.fill(water); }
    x.strokeStyle = "rgba(" + rgb + ",.62)"; x.lineWidth = 1.25; x.stroke(land); if (water) x.stroke(water);

    /* town lights */
    var L = this.lights, n = Math.min(L.length / 3, Math.round(L.length / 3 * clamp(0.35 + rel * 0.35, 0.35, 1)));
    var base = clamp(0.9 + rel * 0.3, 1.1, 2.4), al = ["rgba(255,206,140,.38)", "rgba(255,214,160,.62)", "rgba(255,232,196,.95)"], px, bk;
    for (bk = 0; bk < 3; bk++) {
      x.fillStyle = al[bk];
      for (i = 0; i < n; i++) {
        if (L[i * 3 + 2] !== bk || !this.proj(L[i * 3], L[i * 3 + 1], 0, o)) continue;
        if (o[0] < -4 || o[1] < -4 || o[0] > W + 4 || o[1] > H + 4) continue;
        px = base * Math.min(o[2], 2.2); x.fillRect(o[0] - px / 2, o[1] - px / 2, px, px);
      }
    }

    /* cities: glow and upright labels */
    var C = this.cities, zoomK = clamp(Math.sqrt(rel), 0.85, 2.2), showAll = rel > 1.9, ct;
    x.globalCompositeOperation = "lighter";
    for (i = 0; i < C.length; i++) {
      ct = C[i];
      if (!this.proj(ct.x, ct.y, 0, o)) { ct.sx = ct.sy = -999; continue; }
      ct.sx = o[0]; ct.sy = o[1]; ct.s = o[2];
      if (ct.sx < -40 || ct.sy < -40 || ct.sx > W + 40 || ct.sy > H + 40) continue;
      var gs = (16 + 26 * ct.w) * zoomK * Math.min(ct.s, 1.8); x.globalAlpha = 0.55 + 0.4 * ct.w;
      x.drawImage(GLOW, ct.sx - gs / 2, ct.sy - gs / 2, gs, gs);
    }
    x.globalCompositeOperation = "source-over"; x.globalAlpha = 1;
    x.font = "600 9.5px 'Red Hat Mono', ui-monospace, monospace"; x.textBaseline = "middle";
    for (i = 0; i < C.length; i++) {
      ct = C[i]; var isT = this.target === ct, isP = this.pin && this.pin.c === ct;
      if (ct.sx < -40 || ct.sy < -40 || ct.sx > W + 40 || ct.sy > H + 40) continue;
      if (!(ct.t === 1 || showAll || isT || isP)) continue;
      if (!isT && !isP && (ct.sy < H * 0.29 || ct.sy > H - 92)) continue;   /* keep labels clear of the headline and the story card */
      var lx = ct.sx + 9, tw2 = x.measureText(ct.label).width;
      if (lx + tw2 > W - 4) lx = ct.sx - 9 - tw2;
      x.lineWidth = 3; x.strokeStyle = "rgba(0,4,11,.9)"; x.strokeText(ct.label, lx, ct.sy);
      x.fillStyle = isT || isP ? "#FFFFFF" : "rgba(237,242,251,.78)"; x.fillText(ct.label, lx, ct.sy);
    }

    /* pin: rings lying on the ground, and a short upright marker */
    if (this.pin && this.pin.c.sx > -900) {
      var pc = this.pin.c, prgb = RGB[this.pin.lvl], ph = REDUCE ? 0.4 : (now % 1800) / 1800, sq = Math.max(0.42, this.cp), ps = Math.min(pc.s, 1.6);
      x.strokeStyle = "rgba(" + prgb + ",.95)"; x.lineWidth = 1.4;
      x.beginPath(); x.ellipse(pc.sx, pc.sy, 7 * ps, 7 * ps * sq, 0, 0, 6.2832); x.stroke();
      x.strokeStyle = "rgba(" + prgb + "," + (0.7 * (1 - ph)).toFixed(3) + ")"; x.lineWidth = 1.2;
      x.beginPath(); x.ellipse(pc.sx, pc.sy, (7 + 20 * ph) * ps, (7 + 20 * ph) * ps * sq, 0, 0, 6.2832); x.stroke();
      var top = pc.sy - (10 + 22 * this.sp) * ps;
      x.strokeStyle = "rgba(" + prgb + ",.9)"; x.lineWidth = 1.2; x.beginPath(); x.moveTo(pc.sx, pc.sy); x.lineTo(pc.sx, top); x.stroke();
      x.fillStyle = "rgb(" + prgb + ")"; x.beginPath(); x.moveTo(pc.sx, top - 4); x.lineTo(pc.sx + 3.5, top); x.lineTo(pc.sx, top + 4); x.lineTo(pc.sx - 3.5, top); x.closePath(); x.fill();
    }

    /* plane above: haze. Then the hatch, which turns with the camera */
    x.globalAlpha = 0.07;
    for (i = 0; i < this.haze.length; i++) {
      var hz = this.haze[i];
      if (!this.proj(hz[0], hz[1], this.above, o)) continue;
      var hs = Math.max(b.w, b.h) * 0.42 * hz[2] * c.z * Math.min(o[2], 2);
      x.drawImage(HAZE, o[0] - hs / 2, o[1] - hs * 0.35, hs, hs * 0.7);
    }
    x.globalAlpha = 1;
    var gap = 58, off = (((this.th * 260 - c.x * c.z * 0.25) % gap) + gap) % gap, v;
    x.beginPath();
    for (v = -H * 0.55 + off - gap; v < W + gap; v += gap) { x.moveTo(v, H); x.lineTo(v + H * 0.55, 0); }
    x.strokeStyle = "rgba(165,180,205,.04)"; x.lineWidth = 5; x.stroke();

    if (this.opts.onHud && now - this.hudAt > 220) {
      this.hudAt = now;
      this.opts.onHud(this.key, this.g.lat0 - c.y, c.x / this.k + this.g.lon0, rel);
    }
  };

  /* ---- touch: drag to pan, pinch to zoom, tap a city light to fly there ---- */
  TPMap.prototype.bindGestures = function () {
    var self = this, cv = this.cv, pts = {}, count = 0, moved = 0, t0 = 0, lastD = 0, lastM = null;
    function pos(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function keepIn() {
      var b = self.box, c = self.cam;
      c.x = clamp(c.x, b.x0 - b.w * 0.15, b.x1 + b.w * 0.15); c.y = clamp(c.y, b.y0 - b.h * 0.15, b.y1 + b.h * 0.15);
    }
    function mid() {
      var k = Object.keys(pts), a = pts[k[0]], b2 = pts[k[1]];
      return { x: (a.x + b2.x) / 2, y: (a.y + b2.y) / 2, d: Math.hypot(a.x - b2.x, a.y - b2.y) };
    }
    /* keep the ground point that was under `from` under `to` */
    function drag(from, to) {
      var a = self.unproj(from.x, from.y), b2 = self.unproj(to.x, to.y);
      self.cam.x += a[0] - b2[0]; self.cam.y += a[1] - b2[1];
    }
    cv.addEventListener("pointerdown", function (e) {
      try { cv.setPointerCapture(e.pointerId); } catch (err) {}
      pts[e.pointerId] = pos(e); count = Object.keys(pts).length; self.active = count; self.lastAct = performance.now();
      if (count === 1) { moved = 0; t0 = performance.now(); }
      if (count === 2) { var m = mid(); lastD = m.d; lastM = m; moved = 99; }
    });
    cv.addEventListener("pointermove", function (e) {
      var p0 = pts[e.pointerId]; if (!p0) return;
      var p = pos(e); pts[e.pointerId] = p; self.lastAct = performance.now();
      if (count === 1) {
        moved += Math.abs(p.x - p0.x) + Math.abs(p.y - p0.y);
        if (moved > 8) { self.tween = null; drag(p0, p); keepIn(); self.setView("free"); }
      } else if (count === 2) {
        var m = mid(), c = self.cam, fit = Math.min(self.W * 0.92 / self.box.w, self.H * 0.8 / self.box.h);
        self.tween = null;
        var g0 = self.unproj(lastM.x, lastM.y);
        c.z = clamp(c.z * (m.d / (lastD || m.d)), fit * 0.8, self.W / 1.1);
        var g1 = self.unproj(m.x, m.y);
        c.x += g0[0] - g1[0]; c.y += g0[1] - g1[1]; keepIn();
        lastD = m.d; lastM = m; self.setView("free");
      }
    });
    function up(e) {
      var p = pts[e.pointerId]; if (!p) return;
      delete pts[e.pointerId]; count = Object.keys(pts).length; self.active = count; self.lastAct = performance.now();
      if (count === 0 && moved <= 8 && performance.now() - t0 < 400 && e.type === "pointerup") {
        var best = null, bd = 26;
        self.cities.forEach(function (c) { var dd = Math.hypot(c.sx - p.x, c.sy - p.y); if (dd < bd) { bd = dd; best = c; } });
        if (best) { self.flyCity(best.n); if (self.opts.onCity) self.opts.onCity(self.key, best.n); }
      }
    }
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  };

  window.TPMap = TPMap;
})();
