(function (root) {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const pick = (n,rng=Math.random) => Math.floor(rng() * n);
  function bag(rng=Math.random) {
    let queue = [];
    return () => {
      if (!queue.length) {
        queue = [0, 1, 2, 3, 4, 5];
        for (let i = 5; i; i--) { const j = pick(i + 1,rng); [queue[i], queue[j]] = [queue[j], queue[i]]; }
      }
      return queue.pop();
    };
  }
  function adjacent(a, b) { return a !== b && Math.abs(a % 6 - b % 6) <= 1 && Math.abs(Math.floor(a / 6) - Math.floor(b / 6)) <= 1; }
  class Connect {
    constructor(frozen = 0,rng=Math.random) {
      this.pick=n=>pick(n,rng);
      this.cells = Array.from({ length: 36 }, () => ({ id: this.pick(6), tier: this.pick(3), ice: false }));
      const positions = [8, 10, 19, 22, 26, 28];
      positions.slice(0, frozen).forEach(i => { this.cells[i].ice = true; });
      this.ensureMove();
    }
    path() {
      const walk = chain => {
        if (chain.length === 3) return chain;
        const end = chain[chain.length - 1];
        for (let i = 0; i < 36; i++) if (!chain.includes(i) && !this.cells[i].ice && this.cells[i].id === this.cells[end].id && adjacent(i, end)) {
          const result = walk([...chain, i]); if (result) return result;
        }
        return null;
      };
      for (let i = 0; i < 36; i++) if (!this.cells[i].ice) { const p = walk([i]); if (p) return p; }
      return null;
    }
    ensureMove() {
      if (this.path()) return false;
      // Reserve a playable run without changing ice locations.
      for (let i = 0; i < 36; i++) {
        if (i % 6 > 3) continue;
        const run = [i, i + 1, i + 2];
        if (run.every(n => !this.cells[n].ice)) { const id = this.pick(6); run.forEach(n => { this.cells[n].id = id; }); return true; }
      }
      return false;
    }
    clear(chain) {
      if (chain.length < 3 || new Set(chain).size !== chain.length || chain.some((n, i) => !this.cells[n] || this.cells[n].ice || this.cells[n].id !== this.cells[chain[0]].id || (i && !adjacent(chain[i - 1], n)))) return null;
      const removed = new Set(chain), special = chain.length >= 5;
      if (special) for (let i = 0; i < 36; i++) if (adjacent(i, chain[chain.length - 1])) removed.add(i);
      let thawed = 0;
      this.cells.forEach((cell, i) => {
        if (cell.ice && [...removed].some(n => n === i || adjacent(n, i))) { cell.ice = false; thawed++; }
      });
      const score = chain.length * 20 + (special ? 100 : 0) + thawed * 30;
      for (let col = 0; col < 6; col++) {
        const left = [];
        for (let row = 5; row >= 0; row--) { const i = row * 6 + col; if (!removed.has(i)) left.push(this.cells[i]); }
        for (let row = 5; row >= 0; row--) this.cells[row * 6 + col] = left[5 - row] || { id: this.pick(6), tier: this.pick(3), ice: false };
      }
      const reshuffled = this.ensureMove();
      return { count: removed.size, score, thawed, special, reshuffled };
    }
  }
  class Merge {
    constructor(rng=Math.random) { this.items = []; this.score = 0; this.merges = 0; this.time = 0; this.cooldown = 0; this.danger = 0; this.over = false; this.nextId = bag(rng); this.next = this.nextId(); this.after = this.nextId(); this.events = []; }
    drop(x) {
      if (this.over || this.cooldown > 0) return false;
      this.items.push({ x: clamp(x, 65, 655), y: 100, vx: 0, vy: 0, r: 39, id: this.next, tier: 0, born: this.time });
      this.next = this.after; this.after = this.nextId(); this.cooldown = .65; return true;
    }
    step(dt) {
      if (this.over) return;
      this.time += dt; this.cooldown = Math.max(0, this.cooldown - dt);
      for (const p of this.items) {
        p.vy += 650 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(.45, dt);
        if (p.x < 26 + p.r) { p.x = 26 + p.r; p.vx = Math.abs(p.vx) * .35; }
        if (p.x > 694 - p.r) { p.x = 694 - p.r; p.vx = -Math.abs(p.vx) * .35; }
        if (p.y > 718 - p.r) { p.y = 718 - p.r; p.vy = -Math.abs(p.vy) * .18; }
      }
      const used = new Set(), born = [];
      for (let pass = 0; pass < 3; pass++) for (let i = 0; i < this.items.length; i++) for (let j = i + 1; j < this.items.length; j++) {
        const a = this.items[i], b = this.items[j];
        if (used.has(a) || used.has(b)) continue;
        const dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy), reach = a.r + b.r;
        if (dist >= reach) continue;
        if (a.id === b.id && a.tier === b.tier && this.time - Math.max(a.born, b.born) > .2) {
          used.add(a); used.add(b); this.merges++;
          const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
          this.score += [100, 250, 600][a.tier]; this.events.push({ x, y, tier: a.tier });
          if (a.tier < 2) born.push({ x, y, vx: 0, vy: -90, id: a.id, tier: a.tier + 1, r: 39 + 10 * (a.tier + 1), born: this.time });
          else this.items.forEach(p => { if (Math.hypot(p.x - x, p.y - y) < 135) used.add(p); });
          continue;
        }
        const nx = dist ? dx / dist : 1, ny = dist ? dy / dist : 0, gap = (reach - dist) / 2;
        a.x -= nx * gap; a.y -= ny * gap; b.x += nx * gap; b.y += ny * gap;
        const speed = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (speed < 0) { a.vx += speed * nx * .55; a.vy += speed * ny * .55; b.vx -= speed * nx * .55; b.vy -= speed * ny * .55; }
      }
      this.items = this.items.filter(p => !used.has(p)).concat(born);
      const high = this.items.some(p => p.y - p.r < 160 && this.time - p.born > 3 && Math.abs(p.vy) < 60);
      this.danger = high ? this.danger + dt : 0; if (this.danger > 2.5) this.over = true;
    }
    help() { this.items.sort((a, b) => a.y - b.y); this.items.splice(0, 3); this.danger = 0; }
  }
  class Bounce {
    constructor(difficulty = 0) { this.difficulty = difficulty; this.wave = 0; this.shots = 7; this.score = 0; this.rescued = 0; this.ball = null; this.events = []; this.time=0; this.combo=0; this.maxCombo=0; this.setup(); }
    setup() {
      this.wave++;
      this.targets = Array.from({ length: 3 + Math.min(3, this.difficulty) }, (_, i) => ({ x: 105 + i % 3 * 255, y: 150 + Math.floor(i / 3) * 130, r: 48, hp: this.difficulty > 1 ? 2 : 1, id: (i + this.wave - 1) % 6, tier: (i + this.wave) % 3 }));
      this.bumpers = [{ x: 220, y: 420, r: 40 }, { x: 500, y: 430, r: 40 }, { x: 360, y: 310, r: 26 }];
    }
    get gate() { return this.difficulty ? {x:360+Math.sin(this.time*.9)*145,y:365,w:138,h:16} : null; }
    launch(angle,power=.7) {
      if (this.ball || this.shots <= 0) return false;
      const speed=520+clamp(power,.2,1)*440;
      this.shots--; this.combo=0; this.ball = { x: 360, y: 650, vx: Math.sin(clamp(angle,-1.08,1.08))*speed, vy:-Math.cos(clamp(angle,-1.08,1.08))*speed, age:0, reflections:0, bumpers:[] }; return true;
    }
    step(dt) {
      this.time+=dt;
      const b = this.ball; if (!b) return;
      b.age += dt; b.vy+=145*dt; b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < 30 || b.x > 690) { b.x = clamp(b.x, 30, 690); b.vx *= -1; b.reflections=(b.reflections||0)+1; }
      if (b.y < 40) { b.y = 40; b.vy = Math.abs(b.vy); b.reflections=(b.reflections||0)+1; }
      const gate=this.gate;
      if(gate) {
        const px=clamp(b.x,gate.x-gate.w/2,gate.x+gate.w/2),py=clamp(b.y,gate.y-gate.h/2,gate.y+gate.h/2),dx=b.x-px,dy=b.y-py,d=Math.hypot(dx,dy);
        if(d<18) { const nx=d?dx/d:0,ny=d?dy/d:(b.vy<0?1:-1),dot=b.vx*nx+b.vy*ny;b.x=px+nx*19;b.y=py+ny*19;if(dot<0){b.vx-=2*dot*nx;b.vy-=2*dot*ny;b.reflections++;} }
      }
      for (const p of [...this.bumpers, ...this.targets.filter(t => t.hp > 0)]) {
        const dx = b.x - p.x, dy = b.y - p.y, d = Math.hypot(dx, dy), reach = p.r + 18;
        if (d >= reach) continue;
        const nx = dx / (d || 1), ny = dy / (d || 1), dot = b.vx * nx + b.vy * ny;
        b.x = p.x + nx * (reach + 1); b.y = p.y + ny * (reach + 1);
        if (dot < 0) {
          b.vx -= 2 * dot * nx; b.vy -= 2 * dot * ny;
          b.reflections=(b.reflections||0)+1;
          if (p.hp !== undefined) { p.hp--; this.score += p.hp ? 30 : 150; if (!p.hp) {this.rescued++;this.combo++;this.maxCombo=Math.max(this.maxCombo,this.combo);this.score+=25*(this.combo-1);} }
          else { b.bumpers ||= []; const key=this.bumpers.indexOf(p);if(!b.bumpers.includes(key)){this.score+=5;b.bumpers.push(key);} }
          this.events.push({ x: p.x, y: p.y, tier: 1 });
        }
      }
      if (this.cleared) this.score += this.shots * 25;
      if (b.y > 730 || b.age > 7 || this.cleared) this.ball = null;
    }
    preview(angle,power) {
      if(this.ball||this.shots<=0)return [];
      const trial=Object.assign(Object.create(Bounce.prototype),JSON.parse(JSON.stringify(this)));
      trial.events=[];trial.launch(angle,power);const points=[{x:360,y:650}];
      for(let i=0;i<240&&trial.ball;i++){trial.step(1/120);if(trial.ball&&(i%4===0||trial.ball.reflections>=2))points.push({x:trial.ball.x,y:trial.ball.y});if(trial.ball?.reflections>=2)break;}
      return points;
    }
    get cleared() { return this.targets.every(t => !t.hp); }
    get over() { return !this.ball && this.shots <= 0 && !this.cleared; }
  }
  const api = { clamp, pick, bag, adjacent, Connect, Merge, Bounce };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PocketEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
