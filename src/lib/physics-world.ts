import { Bodies, Body, Composite, Engine, Events, type IEventCollision } from "matter-js";

export type PhysicsMode = "brick-breaker" | "paddle-rally" | "mini-golf" | "pinball";
export type PhysicsPhase = "ready" | "playing" | "paused" | "won" | "over";
export const fieldWidth = 420;
export const fieldHeight = 500;

export class PhysicsWorld {
  readonly engine = Engine.create();
  readonly mode: PhysicsMode;
  ball!: Body;
  paddle?: Body;
  rival?: Body;
  flippers: Body[] = [];
  activeFlippers = [false, false];
  bricks = new Set<number>();
  phase: PhysicsPhase = "ready";
  score = 0;
  opponent = 0;
  lives = 3;
  hole = 1;
  strokes = 0;
  frames = 0;
  cup = { x: 210, y: 78 };

  constructor(mode: PhysicsMode) {
    this.mode = mode;
    this.engine.gravity.y = mode === "pinball" ? .7 : 0;
    this.build();
    Events.on(this.engine, "collisionStart", this.collide);
  }

  private rectangle(x: number, y: number, width: number, height: number, label: string, color: string, angle = 0) {
    const body = Bodies.rectangle(x, y, width, height, { isStatic: true, restitution: 1, friction: 0, label, angle, render: { fillStyle: color } });
    Composite.add(this.engine.world, body);
    return body;
  }

  private build() {
    Composite.clear(this.engine.world, false);
    this.bricks.clear();
    this.flippers = [];
    this.paddle = undefined;
    this.rival = undefined;
    const wall = "#668a7a";
    this.rectangle(210, -5, 440, 20, "wall", wall);
    if (this.mode === "paddle-rally") {
      this.rectangle(210, 505, 440, 20, "wall", wall);
      this.paddle = this.rectangle(22, 250, 13, 90, "paddle", "#e4ac62");
      this.rival = this.rectangle(398, 250, 13, 90, "rival", "#829dc7");
    } else {
      this.rectangle(-5, 250, 20, 520, "wall", wall);
      this.rectangle(425, 250, 20, 520, "wall", wall);
    }
    if (this.mode === "brick-breaker") {
      this.paddle = this.rectangle(210, 462, 94, 13, "paddle", "#497968");
      for (let row = 0; row < 3; row++) for (let column = 0; column < 8; column++) {
        const brick = this.rectangle(42 + column * 48, 55 + row * 27, 42, 19, "brick", ["#e99e88", "#e8c56d", "#8dbacb"][row]);
        this.bricks.add(brick.id);
      }
    }
    if (this.mode === "mini-golf") {
      this.rectangle(210, 505, 440, 20, "wall", wall);
      this.cup = [{ x: 210, y: 78 }, { x: 330, y: 90 }, { x: 95, y: 76 }][this.hole - 1];
      if (this.hole === 2) this.rectangle(230, 250, 180, 16, "obstacle", "#bf9263");
      if (this.hole === 3) this.rectangle(180, 250, 16, 190, "obstacle", "#bf9263");
    }
    if (this.mode === "pinball") {
      for (const [column, row] of [[125, 158], [290, 158], [210, 265]]) Composite.add(this.engine.world, Bodies.circle(column, row, 28, { isStatic: true, restitution: 1.25, label: "bumper", render: { fillStyle: row === 265 ? "#e8c56d" : "#d5899d" } }));
      this.rectangle(56, 370, 90, 13, "ramp", "#88b6c4", .6);
      this.rectangle(364, 370, 90, 13, "ramp", "#88b6c4", -.6);
      this.flippers = [this.rectangle(148, 436, 100, 16, "flipper-0", "#e3a773", .28), this.rectangle(272, 436, 100, 16, "flipper-1", "#e3a773", -.28)];
      this.rectangle(390, 449, 8, 94, "rail", wall);
    }
    const start = this.startPosition();
    this.ball = Bodies.circle(start.x, start.y, this.mode === "mini-golf" ? 8 : 7, { label: "ball", restitution: this.mode === "mini-golf" ? .68 : 1, friction: 0, frictionStatic: 0, frictionAir: this.mode === "mini-golf" ? .028 : this.mode === "pinball" ? .0018 : 0, render: { fillStyle: "#fff8de" } });
    Composite.add(this.engine.world, this.ball);
  }

  private startPosition() {
    if (this.mode === "paddle-rally") return { x: 210, y: 250 };
    if (this.mode === "pinball") return { x: 365, y: 320 };
    if (this.mode === "mini-golf") return { x: [210, 85, 315][this.hole - 1], y: 425 };
    return { x: this.paddle?.position.x ?? 210, y: 440 };
  }

  private collide = (event: IEventCollision<Engine>) => {
    for (const pair of event.pairs) {
      if (pair.bodyA !== this.ball && pair.bodyB !== this.ball) continue;
      const obstacle = pair.bodyA === this.ball ? pair.bodyB : pair.bodyA;
      if (this.bricks.has(obstacle.id)) { this.bricks.delete(obstacle.id); Composite.remove(this.engine.world, obstacle); this.score += 10; }
      if (this.mode === "brick-breaker" && obstacle === this.paddle) {
        const offset = (this.ball.position.x - obstacle.position.x) / 47;
        Body.setVelocity(this.ball, { x: Math.max(-4.8, Math.min(4.8, offset * 5)), y: -5 });
      }
      if (obstacle.label === "bumper") {
        this.score += 50;
        const offsetX = this.ball.position.x - obstacle.position.x, offsetY = this.ball.position.y - obstacle.position.y;
        const length = Math.max(1, Math.hypot(offsetX, offsetY));
        Body.setVelocity(this.ball, { x: offsetX / length * 9, y: offsetY / length * 9 - 2 });
      }
      const flipper = this.flippers.indexOf(obstacle);
      if (flipper >= 0 && this.activeFlippers[flipper]) Body.setVelocity(this.ball, { x: flipper === 0 ? 4 : -4, y: -12 });
    }
  };

  start() {
    if (this.phase === "paused") { this.phase = "playing"; return; }
    if (this.phase !== "ready") return;
    this.phase = "playing";
    if (this.mode !== "mini-golf") Body.setVelocity(this.ball, this.mode === "pinball" ? { x: -3, y: -14 } : this.mode === "paddle-rally" ? { x: this.frames % 2 ? -4.4 : 4.4, y: 2.8 } : { x: 2.7, y: -5 });
  }
  pause() { if (this.phase === "playing") this.phase = "paused"; this.activeFlippers = [false, false]; }
  movePaddle(value: number) {
    if (!this.paddle || this.phase === "won" || this.phase === "over") return;
    if (this.mode === "paddle-rally") Body.setPosition(this.paddle, { x: 22, y: Math.max(56, Math.min(444, value)) });
    else Body.setPosition(this.paddle, { x: Math.max(58, Math.min(362, value)), y: 462 });
    if (this.phase === "ready") Body.setPosition(this.ball, this.startPosition());
  }
  canShoot() { return this.mode === "mini-golf" && this.phase === "playing" && this.ball.speed < .18; }
  shoot(angle: number, power: number) {
    if (!this.canShoot() || !Number.isFinite(angle) || !Number.isFinite(power)) return;
    const radians = (Math.max(-180, Math.min(180, angle)) - 90) * Math.PI / 180;
    const speed = Math.max(10, Math.min(100, power)) / 8;
    Body.setVelocity(this.ball, { x: Math.cos(radians) * speed, y: Math.sin(radians) * speed });
    this.strokes++;
  }
  setFlipper(index: number, pressed: boolean) { if (index === 0 || index === 1) this.activeFlippers[index] = this.phase === "playing" && pressed; }
  private resetBall() { Body.setPosition(this.ball, this.startPosition()); Body.setVelocity(this.ball, { x: 0, y: 0 }); this.phase = "ready"; }

  step() {
    if (this.phase !== "playing") return;
    this.frames++;
    if (this.rival) {
      const destination = this.ball.position.y + Math.sin(this.frames * .035) * 45;
      const change = Math.max(-2.35, Math.min(2.35, destination - this.rival.position.y));
      Body.setPosition(this.rival, { x: 398, y: Math.max(56, Math.min(444, this.rival.position.y + change)) });
    }
    this.flippers.forEach((flipper, index) => Body.setAngle(flipper, (index === 0 ? 1 : -1) * (this.activeFlippers[index] ? -.42 : .28)));
    Engine.update(this.engine, 1000 / 60);
    if (this.mode === "paddle-rally") {
      if (this.ball.position.x < -12 || this.ball.position.x > 432) {
        if (this.ball.position.x > 432) this.score++; else this.opponent++;
        this.resetBall();
        if (this.score >= 5) this.phase = "won";
        else if (this.opponent >= 5) this.phase = "over";
      }
    } else if (this.mode === "mini-golf") {
      if (Math.hypot(this.ball.position.x - this.cup.x, this.ball.position.y - this.cup.y) < 16 && this.ball.speed < 3) {
        this.score++;
        if (this.hole === 3) { this.phase = "won"; Body.setVelocity(this.ball, { x: 0, y: 0 }); }
        else { this.hole++; this.build(); this.phase = "ready"; }
      }
    } else if (this.ball.position.y > 520) {
      this.lives--; this.resetBall();
      if (!this.lives) this.phase = "over";
    }
    if (this.mode === "brick-breaker" && !this.bricks.size) this.phase = "won";
    if ((this.mode === "brick-breaker" || this.mode === "paddle-rally") && this.phase === "playing") {
      const velocity = this.ball.velocity;
      const horizontal = Math.abs(velocity.x) < 1 ? (velocity.x < 0 ? -1 : 1) : velocity.x;
      const vertical = Math.abs(velocity.y) < 1.3 ? (velocity.y < 0 ? -1.3 : 1.3) : velocity.y;
      const speed = Math.hypot(horizontal, vertical);
      Body.setVelocity(this.ball, { x: horizontal / speed * 5.7, y: vertical / speed * 5.7 });
    }
  }
  snapshot() { return { phase: this.phase, score: this.score, opponent: this.opponent, lives: this.lives, hole: this.hole, strokes: this.strokes, remaining: this.bricks.size, canShoot: this.canShoot() }; }
  dispose() { Events.off(this.engine, "collisionStart", this.collide); Composite.clear(this.engine.world, false); Engine.clear(this.engine); }
}