"use client";

import { useEffect, useRef, useState } from "react";
import { Circle, File, Hand, Play, Scissors, Timer, Trophy, Zap } from "lucide-react";
import { claimEdge, gestureResult, gestures, newDots, type Gesture } from "@/lib/bonus-logic";
import { shuffle } from "@/lib/game-logic";
import { usePreference } from "@/lib/preferences";
import { Restart, Speaker, Status, tone, useAutoPause, useTicker } from "./shared";

export function DotsAndBoxes() {
  const [state, setState] = useState(newDots);
  const scores = [0, 1].map(player => state.owners.filter(owner => owner === player).length);
  const done = state.owners.every(owner => owner !== null);
  const names = ["Coral", "Blue"];
  return <div className="game-inner">
    <div className="game-stats team-scores">{names.map((name, index) => <div key={name} className={`team-${index}`}><span>{name}</span><strong>{scores[index]}</strong></div>)}</div>
    <Status>{done ? scores[0] === scores[1] ? "A perfectly even draw!" : `${names[scores[0] > scores[1] ? 0 : 1]} wins!` : `${names[state.turn]}'s turn`}</Status>
    <div className="dots-board">{Array.from({ length: 49 }, (_, index) => {
      const row = Math.floor(index / 7), column = index % 7;
      if (row % 2 === 0 && column % 2 === 0) return <span className="board-dot" key={index} />;
      if (row % 2 === 1 && column % 2 === 1) {
        const owner = state.owners[Math.floor(row / 2) * 3 + Math.floor(column / 2)];
        return <span key={index} role="img" className={`dot-box ${owner === null ? "" : `owned team-${owner}`}`} aria-label={owner === null ? "Unclaimed box" : `${names[owner]} box`}>{owner !== null ? <span>{owner + 1}</span> : null}</span>;
      }
      const axis = row % 2 === 0 ? "horizontal" : "vertical";
      const edge = axis === "horizontal" ? row / 2 * 3 + Math.floor(column / 2) : Math.floor(row / 2) * 4 + column / 2;
      return <button key={index} className={`dot-edge edge-${axis} ${state[axis][edge] ? "claimed" : ""}`} disabled={state[axis][edge] || done}
        aria-label={`${axis} edge ${edge + 1}`} onClick={() => { setState(current => claimEdge(current, axis, edge)); tone(430); }}><span /></button>;
    })}</div>
    <Restart onClick={() => setState(newDots())} />
  </div>;
}

const gestureIcons = { rock: Circle, paper: File, scissors: Scissors };
type GestureRound = { player: Gesture; computer: Gesture; result: ReturnType<typeof gestureResult> };
function randomGesture() { return gestures[Math.floor(Math.random() * gestures.length)]; }

export function RockPaperScissors() {
  const [round, setRound] = useState<GestureRound | null>(null);
  const [score, setScore] = useState({ player: 0, computer: 0 });
  const done = score.player === 3 || score.computer === 3;
  function play(player: Gesture) {
    if (done || round) return;
    const computer = randomGesture();
    const result = gestureResult(player, computer);
    setRound({ player, computer, result });
    setScore(current => ({ player: current.player + Number(result === "win"), computer: current.computer + Number(result === "lose") }));
    tone(result === "win" ? 650 : 330);
  }
  return <div className="game-inner">
    <div className="game-stats"><div><span>You</span><strong>{score.player}</strong></div><div><span>Computer</span><strong>{score.computer}</strong></div></div>
    <Status>{done ? score.player === 3 ? "You won the match!" : "Computer wins this match. Another round?" : round ? round.result === "draw" ? "A draw! Great minds think alike." : round.result === "win" ? "This round is yours!" : "The computer takes this round." : "First to three. Make your choice."}</Status>
    <div className="gesture-arena">{round ? [round.player, round.computer].map((gesture, index) => { const Icon = gestureIcons[gesture]; return <div key={index}><Icon size={48} /><strong>{gesture}</strong><span>{index === 0 ? "You" : "Computer"}</span></div>; }) : <Hand size={72} strokeWidth={1.4} />}</div>
    <div className="gesture-choices">{gestures.map(gesture => { const Icon = gestureIcons[gesture]; return <button key={gesture} onClick={() => play(gesture)} disabled={done || !!round} aria-label={`Choose ${gesture}`}><Icon size={28} /><span>{gesture}</span></button>; })}</div>
    {round && !done && <button className="primary-button" onClick={() => setRound(null)}><Play size={15} />Next round</button>}
    <Restart onClick={() => { setRound(null); setScore({ player: 0, computer: 0 }); }} />
  </div>;
}

export function NumberTrail() {
  const [numbers, setNumbers] = useState(() => shuffle(Array.from({ length: 16 }, (_, index) => index + 1)));
  const [next, setNext] = useState(1);
  const [seconds, setSeconds] = useState(0);
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState("Every adventure begins with one.");
  const won = next === 17;
  useTicker(() => setSeconds(current => current + 1), active && !won ? 1000 : null);
  useAutoPause(() => setActive(false));
  function choose(value: number) {
    if (won || value < next) return;
    if (value !== next) { setMessage(`Look for ${next}. You've got this.`); return; }
    setActive(true);
    setNext(next + 1);
    setMessage(`Lovely! Now find ${next + 1}.`);
    tone(280 + value * 28);
  }
  return <div className="game-inner learning-inner">
    <div className="game-stats"><div><span>Found</span><strong>{next - 1}/16</strong></div><div><span>Seconds</span><strong>{seconds}</strong></div></div>
    <Status>{won ? `A perfect trail in ${seconds} seconds!` : message}</Status>
    <div className="trail-target"><span>Find <strong>{Math.min(next, 16)}</strong></span>{!won && <Speaker text={`Find the number ${next}`} />}</div>
    <div className="number-trail-board">{numbers.map(value => <button key={value} className={value < next ? "trail-done" : ""} onClick={() => choose(value)} disabled={value < next || won} aria-label={`Number ${value}`}>{value}</button>)}</div>
    <Restart onClick={() => { setNumbers(shuffle(Array.from({ length: 16 }, (_, index) => index + 1))); setNext(1); setSeconds(0); setActive(false); setMessage("Every adventure begins with one."); }} />
  </div>;
}

type ReactionPhase = "ready" | "waiting" | "go" | "early" | "result";
export function ReactionTime() {
  const [phase, setPhase] = useState<ReactionPhase>("ready");
  const [result, setResult] = useState(0);
  const [stored, saveBest] = usePreference("gw-reaction-best", "0");
  const best = Number(stored) || 0;
  const started = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useAutoPause(() => {
    if (timer.current) clearTimeout(timer.current);
    if (phase === "waiting" || phase === "go") setPhase("ready");
  });
  function press() {
    if (phase === "waiting") {
      if (timer.current) clearTimeout(timer.current);
      setPhase("early");
      return;
    }
    if (phase === "go") {
      const elapsed = Math.max(1, Math.round(performance.now() - started.current));
      setResult(elapsed);
      if (!best || elapsed < best) saveBest(String(elapsed));
      setPhase("result");
      tone(650);
      return;
    }
    setPhase("waiting");
    timer.current = setTimeout(() => {
      started.current = performance.now();
      setPhase("go");
    }, 1600 + Math.random() * 2400);
  }
  return <div className="game-inner">
    <div className="game-stats"><div><span>Last, ms</span><strong>{result || "-"}</strong></div><div><span><Trophy size={12} />Best, ms</span><strong>{best || "-"}</strong></div></div>
    <Status>{phase === "early" ? "A little too soon. Try again!" : phase === "result" ? `${result} ms. A moment well caught.` : phase === "waiting" ? "Wait for green..." : phase === "go" ? "Now!" : "Ready when you are."}</Status>
    <button className={`reaction-pad reaction-${phase}`} onClick={press} aria-label={phase === "go" ? "Tap now" : phase === "waiting" ? "Wait for green" : phase === "ready" ? "Start reaction test" : "Try again"}>
      {phase === "go" ? <Zap size={48} /> : <Timer size={48} />}
      <strong>{phase === "go" ? "Now!" : phase === "waiting" ? "Wait for green" : phase === "early" ? "Too soon!" : phase === "result" ? `${result} ms` : "Ready, steady..."}</strong>
      <span>{phase === "ready" ? "Start" : phase === "result" || phase === "early" ? "Try again" : ""}</span>
    </button>
    <Restart onClick={() => { if (timer.current) clearTimeout(timer.current); setPhase("ready"); setResult(0); }} />
  </div>;
}