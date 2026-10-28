"use client";
import { useEffect, useRef, useState } from "react";
import { Composite } from "matter-js";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Flag, Hand, Pause, Play } from "lucide-react";
import { PhysicsWorld, fieldHeight, fieldWidth, type PhysicsMode } from "@/lib/physics-world";
import { bubbleColors, newBubbleRound, stackOverlap, type StackLayer } from "@/lib/festival-logic";
import { Restart, Stats, Status, tone, useAutoPause, useBest, useGameKeys, useTicker } from "./shared";

function drawWorld(context: CanvasRenderingContext2D, world: PhysicsWorld, dark: boolean, aim: number) {
  context.clearRect(0, 0, fieldWidth, fieldHeight);
  context.fillStyle = world.mode === "mini-golf" ? dark ? "#294738" : "#c7dfbb" : dark ? "#273d35" : "#eaf0df";
  context.fillRect(0, 0, fieldWidth, fieldHeight);
  context.strokeStyle = dark ? "#ffffff0b" : "#264b2810";
  context.lineWidth = 1;
  for (let column = 20; column < fieldWidth; column += 25) { context.beginPath(); context.moveTo(column, 0); context.lineTo(column, fieldHeight); context.stroke(); }
  for (let row = 20; row < fieldHeight; row += 25) { context.beginPath(); context.moveTo(0, row); context.lineTo(fieldWidth, row); context.stroke(); }
  if (world.mode === "paddle-rally") { context.setLineDash([9, 12]); context.strokeStyle = dark ? "#adbfaa" : "#799074"; context.beginPath(); context.moveTo(210, 15); context.lineTo(210, 485); context.stroke(); context.setLineDash([]); }
  if (world.mode === "mini-golf") {
    context.beginPath(); context.arc(world.cup.x, world.cup.y, 16, 0, Math.PI * 2); context.fillStyle = "#243c2d"; context.fill();
    context.strokeStyle = "#e8d6a5"; context.lineWidth = 3; context.beginPath(); context.moveTo(world.cup.x, world.cup.y); context.lineTo(world.cup.x, world.cup.y - 42); context.stroke();
    context.beginPath(); context.moveTo(world.cup.x, world.cup.y - 42); context.lineTo(world.cup.x + 27, world.cup.y - 32); context.lineTo(world.cup.x, world.cup.y - 22); context.fillStyle = "#c76b59"; context.fill();
    if (world.canShoot()) { const angle = (aim - 90) * Math.PI / 180; context.setLineDash([4, 6]); context.strokeStyle = dark ? "#f5e5ae" : "#3e6650"; context.lineWidth = 2; context.beginPath(); context.moveTo(world.ball.position.x, world.ball.position.y); context.lineTo(world.ball.position.x + Math.cos(angle) * 65, world.ball.position.y + Math.sin(angle) * 65); context.stroke(); context.setLineDash([]); }
  }
  for (const body of Composite.allBodies(world.engine.world)) {
    context.fillStyle = body.render.fillStyle || "#769f89";
    context.beginPath();
    if (body.circleRadius) context.arc(body.position.x, body.position.y, body.circleRadius, 0, Math.PI * 2);
    else { body.vertices.forEach((vertex, index) => index ? context.lineTo(vertex.x, vertex.y) : context.moveTo(vertex.x, vertex.y)); context.closePath(); }
    context.fill();
    context.strokeStyle = body === world.ball ? "#416251" : "#ffffff44"; context.lineWidth = body === world.ball ? 2 : 1; context.stroke();
    if (body.label === "bumper") { context.fillStyle = "#35483b"; context.font = "bold 17px sans-serif"; context.textAlign = "center"; context.fillText("50", body.position.x, body.position.y + 6); }
  }
}

function PhysicsGame({ mode }: { mode: PhysicsMode }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useRef<PhysicsWorld | null>(null);
  const aim = useRef(0);
  const [angle, setAngle] = useState(0);
  const [power, setPower] = useState(65);
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ phase: "ready", score: 0, opponent: 0, lives: 3, hole: 1, strokes: 0, remaining: 24, canShoot: false } as ReturnType<PhysicsWorld["snapshot"]>);
  const best = useBest(mode, state.score);
  useEffect(() => {
    const game = new PhysicsWorld(mode);
    world.current = game;
    let frame = 0, previous = 0, accumulated = 0, snapshot = "";
    const context = canvas.current?.getContext("2d");
    const render = (now: number) => {
      accumulated += Math.min(80, previous ? now - previous : 0); previous = now;
      while (accumulated >= 1000 / 60) { game.step(); accumulated -= 1000 / 60; }
      if (context) drawWorld(context, game, document.documentElement.dataset.theme === "dark", aim.current);
      const next = game.snapshot();
      const serialized = JSON.stringify(next);
      if (serialized !== snapshot) { setState(next); snapshot = serialized; }
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(frame); game.dispose(); world.current = null; };
  }, [mode, version]);
  useAutoPause(() => world.current?.pause());
  function move(direction: number) { const game = world.current; if (!game?.paddle) return; game.movePaddle((mode === "paddle-rally" ? game.paddle.position.y : game.paddle.position.x) + direction * 28); }
  function toggle() { if (world.current?.phase === "playing") world.current.pause(); else world.current?.start(); }
  useGameKeys(key => {
    if (key === " ") { if (mode === "mini-golf" && world.current?.canShoot()) world.current.shoot(angle, power); else toggle(); }
    if (mode === "pinball") { if (["ArrowLeft", "a"].includes(key)) world.current?.setFlipper(0, true); if (["ArrowRight", "d"].includes(key)) world.current?.setFlipper(1, true); }
    else if (mode === "paddle-rally") { if (["ArrowUp", "w"].includes(key)) move(-1); if (["ArrowDown", "s"].includes(key)) move(1); }
    else if (mode === "brick-breaker") { if (["ArrowLeft", "a"].includes(key)) move(-1); if (["ArrowRight", "d"].includes(key)) move(1); }
  });
  useEffect(() => {
    const release = (event: KeyboardEvent) => { if (["ArrowLeft", "a"].includes(event.key)) world.current?.setFlipper(0, false); if (["ArrowRight", "d"].includes(event.key)) world.current?.setFlipper(1, false); };
    const blur = () => world.current?.pause();
    window.addEventListener("keyup", release); window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keyup", release); window.removeEventListener("blur", blur); };
  }, []);
  const done = state.phase === "won" || state.phase === "over";
  const message = state.phase === "won" ? mode === "mini-golf" ? `Three holes complete in ${state.strokes} strokes!` : mode === "paddle-rally" ? "Five points. You win!" : "Every brick cleared!" : state.phase === "over" ? mode === "paddle-rally" ? "Computer wins. Ready for a rematch?" : `Round finished. ${state.score} points.` : state.phase === "paused" ? "Paused. Take your time." : state.phase === "ready" ? mode === "mini-golf" ? `Hole ${state.hole} of 3` : "Ready for the next ball?" : mode === "brick-breaker" ? `${state.remaining} bricks left. ${state.lives} balls.` : mode === "paddle-rally" ? `You ${state.score} : ${state.opponent} Computer` : mode === "mini-golf" ? state.canShoot ? "Line up your next shot." : "Ball in motion." : `${state.lives} balls left. Keep it in play.`;
  return <div className={`game-inner physics-game ${mode}-game`} data-phase={state.phase}><Stats label={mode === "mini-golf" ? "Strokes" : "Score"} score={mode === "mini-golf" ? state.strokes : state.score} best={mode === "brick-breaker" || mode === "pinball" ? best : undefined}/><Status>{message}</Status>
    <canvas ref={canvas} className="physics-canvas" width={fieldWidth} height={fieldHeight} role="img" aria-label={`${mode.replaceAll("-", " ")} playfield`} onPointerMove={event => { const bounds = event.currentTarget.getBoundingClientRect(); if (mode === "brick-breaker") world.current?.movePaddle((event.clientX - bounds.left) / bounds.width * fieldWidth); if (mode === "paddle-rally") world.current?.movePaddle((event.clientY - bounds.top) / bounds.height * fieldHeight); }} onPointerDown={event => event.currentTarget.setPointerCapture(event.pointerId)}/>
    {mode === "mini-golf" ? <div className="golf-controls"><label>Aim <output>{angle}&deg;</output><input aria-label="Aim angle" type="range" min="-180" max="180" value={angle} disabled={done} onChange={event => { setAngle(Number(event.target.value)); aim.current = Number(event.target.value); }}/></label><label>Power <output>{power}%</output><input aria-label="Shot power" type="range" min="10" max="100" value={power} disabled={done} onChange={event => setPower(Number(event.target.value))}/></label><button className="primary-button" disabled={!state.canShoot} onClick={() => world.current?.shoot(angle, power)}><Flag size={17}/>Putt</button></div> : mode === "pinball" ? <div className="flipper-controls">{[0, 1].map(index => <button key={index} className="secondary-button" disabled={state.phase !== "playing"} aria-label={`${index === 0 ? "Left" : "Right"} flipper`} onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); world.current?.setFlipper(index, true); }} onPointerUp={() => world.current?.setFlipper(index, false)} onPointerCancel={() => world.current?.setFlipper(index, false)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); world.current?.setFlipper(index, true); } }} onKeyUp={() => world.current?.setFlipper(index, false)}>{index === 0 ? <ArrowLeft size={20}/> : <ArrowRight size={20}/>}Flipper</button>)}</div> : <div className="paddle-controls"><button className="icon-button" disabled={done} title={mode === "paddle-rally" ? "Move up" : "Move left"} aria-label={mode === "paddle-rally" ? "Move up" : "Move left"} onClick={() => move(-1)}>{mode === "paddle-rally" ? <ArrowUp size={21}/> : <ArrowLeft size={21}/>}</button><button className="icon-button" disabled={done} title={mode === "paddle-rally" ? "Move down" : "Move right"} aria-label={mode === "paddle-rally" ? "Move down" : "Move right"} onClick={() => move(1)}>{mode === "paddle-rally" ? <ArrowDown size={21}/> : <ArrowRight size={21}/>}</button></div>}
    <div className="game-actions"><button className="primary-button" disabled={done} onClick={toggle}>{state.phase === "playing" ? <Pause size={17}/> : <Play size={17}/>} {state.phase === "playing" ? "Pause" : state.phase === "paused" ? "Resume" : "Start game"}</button><Restart onClick={() => { setVersion(version + 1); setAngle(0); aim.current = 0; setPower(65); }}/></div>
  </div>;
}
export function BrickBreaker() { return <PhysicsGame mode="brick-breaker"/>; }
export function PaddleRally() { return <PhysicsGame mode="paddle-rally"/>; }
export function MiniGolf() { return <PhysicsGame mode="mini-golf"/>; }
export function Pinball() { return <PhysicsGame mode="pinball"/>; }

type StackState = { layers: StackLayer[]; left: number; direction: number; phase: "ready" | "playing" | "paused" | "won" | "over" };
function newStack(): StackState { return { layers: [{ left: 100, width: 200 }], left: 0, direction: 1, phase: "ready" }; }
export function SkyStack() {
  const [state, setState] = useState(newStack);
  const top = state.layers.at(-1)!;
  const best = useBest("sky-stack", state.layers.length - 1);
  useTicker(() => setState(previous => {
    const width = previous.layers.at(-1)!.width;
    const next = previous.left + previous.direction * (4 + previous.layers.length * .65);
    return { ...previous, left: Math.max(0, Math.min(400 - width, next)), direction: next <= 0 ? 1 : next >= 400 - width ? -1 : previous.direction };
  }), state.phase === "playing" ? 40 : null);
  useAutoPause(() => setState(previous => previous.phase === "playing" ? { ...previous, phase: "paused" } : previous));
  function drop() {
    if (state.phase !== "playing") return;
    const overlap = stackOverlap(top, { left: state.left, width: top.width });
    if (!overlap) { setState({ ...state, phase: "over" }); tone(200); return; }
    const layers = [...state.layers, overlap];
    setState({ layers, left: state.direction > 0 ? 400 - overlap.width : 0, direction: -state.direction, phase: layers.length === 12 ? "won" : "playing" }); tone(400 + layers.length * 30);
  }
  useGameKeys(key => { if (key === " ") { if (state.phase === "playing") drop(); else if (state.phase === "ready" || state.phase === "paused") setState({ ...state, phase: "playing" }); } });
  const done = state.phase === "won" || state.phase === "over";
  return <div className="game-inner sky-stack-game" data-phase={state.phase}><Stats label="Floors" score={state.layers.length - 1} best={best}/><Status>{state.phase === "won" ? "Eleven floors. A perfect little skyline!" : state.phase === "over" ? "The block missed. Build again?" : state.phase === "paused" ? "Construction paused." : "Eleven floors to the sky."}</Status>
    <svg className="stack-scene" viewBox="0 0 400 390" role="img" aria-label={`Tower with ${state.layers.length - 1} floors`}><rect width="400" height="390" fill="var(--soft)"/><path d="M0 355h35v-36h28v36h24v-65h32v65h164v-43h32v43h30v-72h28v72h27v35H0Z" fill="var(--line)"/>{state.layers.map((layer, index) => <g key={index}><rect x={layer.left} y={350 - index * 26} width={layer.width} height="24" rx="3" fill={["#77a891", "#e0af78", "#85acc9", "#cb90a6"][index % 4]}/>{layer.width > 35 ? <path d={`M${layer.left + 10} ${359 - index * 26}h${Math.max(8, layer.width - 20)}`} stroke="#ffffff66" strokeWidth="3" strokeDasharray="6 7"/> : null}</g>)}{!done ? <rect className="moving-stack-block" x={state.left} y={350 - state.layers.length * 26} width={top.width} height="24" rx="3" fill="#ba7265"/> : null}</svg>
    <div className="game-actions"><button className="primary-button" disabled={state.phase !== "playing"} onClick={drop}><ArrowDown size={18}/>Drop block</button><button className="icon-button" disabled={done} title={state.phase === "playing" ? "Pause" : "Start game"} aria-label={state.phase === "playing" ? "Pause" : state.phase === "paused" ? "Resume" : "Start game"} onClick={() => setState({ ...state, phase: state.phase === "playing" ? "paused" : "playing" })}>{state.phase === "playing" ? <Pause size={18}/> : <Play size={18}/>}</button><Restart onClick={() => setState(newStack())}/></div>
  </div>;
}

export function BubblePop() {
  const [puzzle, setPuzzle] = useState(newBubbleRound);
  const [popped, setPopped] = useState<number[]>([]);
  const [round, setRound] = useState(0);
  const [seconds, setSeconds] = useState(45);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<"ready" | "playing" | "paused" | "won" | "over">("ready");
  const [message, setMessage] = useState("");
  const best = useBest("bubble-pop", score);
  useTicker(() => { if (seconds <= 1) { setSeconds(0); setPhase("over"); } else setSeconds(seconds - 1); }, phase === "playing" ? 1000 : null);
  useAutoPause(() => { if (phase === "playing") setPhase("paused"); });
  function pop(cell: number) {
    if (phase !== "playing" || popped.includes(cell)) return;
    if (puzzle.colors[cell] !== puzzle.target) { setMessage("Choose the target color."); setScore(Math.max(0, score - 5)); tone(200); return; }
    const next = [...popped, cell]; setPopped(next); setScore(score + 10); setMessage(""); tone(500 + next.length * 100);
    if (next.length === 3) { setRound(round + 1); if (round === 4) setPhase("won"); else { setPuzzle(newBubbleRound()); setPopped([]); } }
  }
  function reset() { setPuzzle(newBubbleRound()); setPopped([]); setRound(0); setSeconds(45); setScore(0); setPhase("ready"); setMessage(""); }
  return <div className="game-inner bubble-game" data-phase={phase}><Stats score={score} best={best}/><div className="bubble-target"><span className={`bubble-color-${puzzle.target}`}>{puzzle.target + 1}</span><strong>{bubbleColors[puzzle.target]}</strong><span>{seconds}s</span></div><Status>{phase === "won" ? "Five rounds popped. A colorful finish!" : phase === "over" ? "Time is up. Ready for another round?" : phase === "paused" ? "Bubbles on a break." : message || `Round ${Math.min(5, round + 1)} of 5`}</Status>
    <div className="bubble-board">{puzzle.colors.map((color, cell) => <button key={`${round}-${cell}`} className={`bubble-color-${color} ${popped.includes(cell) ? "bubble-popped" : ""}`} disabled={phase !== "playing" || popped.includes(cell)} aria-label={`Bubble ${cell + 1}, ${bubbleColors[color]}`} onClick={() => pop(cell)}>{popped.includes(cell) ? <Hand size={26}/> : <><span className="bubble-glint"/>{color + 1}</>}</button>)}</div><div className="game-actions"><button className="primary-button" disabled={phase === "won" || phase === "over"} onClick={() => setPhase(phase === "playing" ? "paused" : "playing")}>{phase === "playing" ? <Pause size={16}/> : <Play size={16}/>} {phase === "playing" ? "Pause" : phase === "paused" ? "Resume" : "Start game"}</button><Restart onClick={reset}/></div>
  </div>;
}