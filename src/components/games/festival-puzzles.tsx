"use client";
import { useState } from "react";
import { Chess, type Square as ChessSquare } from "chess.js";
import { ArrowLeftRight, ArrowRight, Check, Crown, Eraser, Flame, Lightbulb, PersonStanding, Undo2 } from "lucide-react";
import { bridgeTimes, crossBridge, magicComplete, matingMoves, newBridge, newMagicSquare, queenConflicts, tacticPuzzles, type BridgeState } from "@/lib/festival-logic";
import { Restart, Stats, Status, tone } from "./shared";

const pieceGlyphs: Record<string, string> = { wk: "\u2654", wq: "\u2655", wr: "\u2656", wb: "\u2657", wn: "\u2658", wp: "\u2659", bk: "\u265a", bq: "\u265b", br: "\u265c", bb: "\u265d", bn: "\u265e", bp: "\u265f" };
const pieceNames: Record<string, string> = { k: "king", q: "queen", r: "rook", b: "bishop", n: "knight", p: "pawn" };
export function ChessTactics() {
  const [round, setRound] = useState(0);
  const [board, setBoard] = useState(() => new Chess(tacticPuzzles[0].fen));
  const [selected, setSelected] = useState<ChessSquare | null>(null);
  const [hint, setHint] = useState<ChessSquare | null>(null);
  const [message, setMessage] = useState("");
  const [attempts, setAttempts] = useState(0);
  const won = board.isCheckmate();
  const complete = won && round === tacticPuzzles.length - 1;
  const destinations = selected && !won ? board.moves({ square: selected, verbose: true }).map(move => move.to) : [];
  function choose(square: ChessSquare) {
    if (won) return;
    const piece = board.get(square);
    if (piece?.color === "w") { setSelected(selected === square ? null : square); setMessage(""); return; }
    if (!selected || !destinations.includes(square)) { setMessage("Choose a white piece and a legal destination."); return; }
    const next = new Chess(board.fen());
    next.move({ from: selected, to: square, promotion: "q" });
    setAttempts(attempts + 1); setSelected(null); setHint(null);
    if (next.isCheckmate()) { setBoard(next); setMessage("Checkmate. Puzzle solved!"); tone(880); }
    else { setMessage("That move is legal, but it is not checkmate. Try again."); tone(230); }
  }
  function reset(index = 0) { setRound(index); setBoard(new Chess(tacticPuzzles[index].fen)); setSelected(null); setHint(null); setMessage(""); setAttempts(0); }
  return <div className="game-inner tactics-game"><div className="puzzle-heading"><span>Puzzle {round + 1} of {tacticPuzzles.length}</span><strong>{tacticPuzzles[round].name}</strong></div><Stats score={attempts} label="Attempts"/>
    <Status>{complete ? "Three checkmates. Challenge complete!" : message || "White to play. Checkmate in one."}</Status>
    <div className="tactics-board">{board.board().flat().map((piece, cell) => {
      const square = `${"abcdefgh"[cell % 8]}${8 - Math.floor(cell / 8)}` as ChessSquare;
      return <button key={square} disabled={won} className={`${(Math.floor(cell / 8) + cell % 8) % 2 ? "tactics-dark" : "tactics-light"} ${selected === square || hint === square ? "tactics-selected" : ""}`} aria-label={`${square}${piece ? ` ${piece.color === "w" ? "White" : "Black"} ${pieceNames[piece.type]}` : ""}`} onClick={() => choose(square)}>
        {piece ? <span className={`tactics-piece piece-${piece.color}`}>{pieceGlyphs[piece.color + piece.type]}</span> : null}{destinations.includes(square) ? <span className="tactics-destination"/> : null}<small>{square}</small>
      </button>;
    })}</div><div className="game-actions">{won && !complete ? <button className="primary-button" onClick={() => reset(round + 1)}>Next puzzle <ArrowRight size={16}/></button> : <button className="icon-button" disabled={won} title="Hint: show a piece" aria-label="Hint: show a piece" onClick={() => setHint(matingMoves(board.fen())[0]?.from ?? null)}><Lightbulb size={18}/></button>}<Restart onClick={() => reset()}/></div>
  </div>;
}

export function QueensGarden() {
  const [queens, setQueens] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const conflicts = queenConflicts(queens);
  const won = queens.length === 8 && conflicts.length === 0;
  function choose(cell: number) {
    if (won) return;
    if (queens.includes(cell)) setQueens(queens.filter(queen => queen !== cell));
    else if (queens.length < 8) setQueens([...queens, cell]);
    else { setMessage("All eight queens are placed. Remove one to reposition it."); return; }
    setMessage(""); tone(460, .06);
  }
  return <div className="game-inner queens-game"><Stats label="Queens" score={queens.length}/><Status>{won ? "Eight queens, perfectly at peace!" : message || (conflicts.length ? `${conflicts.length} queens share an attack line.` : "No shared rows, columns, or diagonals.")}</Status>
    <div className="queens-board">{Array.from({ length: 64 }, (_, cell) => <button key={cell} disabled={won} className={`${(Math.floor(cell / 8) + cell % 8) % 2 ? "queen-dark" : "queen-light"} ${conflicts.includes(cell) ? "queen-conflict" : ""}`} aria-label={`Row ${Math.floor(cell / 8) + 1} column ${cell % 8 + 1}${queens.includes(cell) ? ", queen" : ""}`} aria-pressed={queens.includes(cell)} onClick={() => choose(cell)}>{queens.includes(cell) ? <Crown size={25}/> : null}</button>)}</div>
    <Restart onClick={() => { setQueens([]); setMessage(""); }}/>
  </div>;
}

export function MagicSquare() {
  const [givens, setGivens] = useState(newMagicSquare);
  const [board, setBoard] = useState(givens);
  const [selected, setSelected] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [won, setWon] = useState(false);
  function enter(value: number) { if (selected === null || givens[selected] || won) return; setBoard(board.map((number, cell) => cell === selected ? value : number)); setMessage(""); }
  function reset() { const next = newMagicSquare(); setGivens(next); setBoard(next); setSelected(null); setMessage(""); setWon(false); }
  return <div className="game-inner magic-game"><div className="magic-target"><span>Every line</span><strong>15</strong></div><Status>{message || "Nine numbers. One perfect balance."}</Status>
    <div className="magic-board">{board.map((number, cell) => <button key={cell} disabled={!!givens[cell] || won} className={`${givens[cell] ? "magic-given" : ""} ${selected === cell ? "magic-selected" : ""}`} aria-label={`Cell ${cell + 1}: ${number || "empty"}${givens[cell] ? ", fixed" : ""}`} aria-pressed={selected === cell} onClick={() => setSelected(cell)}>{number || ""}</button>)}</div>
    <div className="magic-numbers">{Array.from({ length: 9 }, (_, index) => index + 1).map(number => <button key={number} disabled={won || selected === null || board.includes(number)} onClick={() => enter(number)} aria-label={`Place ${number}`}>{number}</button>)}</div>
    <div className="game-actions"><button className="icon-button" disabled={won || selected === null} title="Erase selected number" aria-label="Erase selected number" onClick={() => enter(0)}><Eraser size={18}/></button><button className="primary-button" disabled={won} onClick={() => { const complete = magicComplete(board); setWon(complete); setMessage(complete ? "Every line is 15. Magic!" : "Not quite. Check the rows, columns, and diagonals."); }}><Check size={16}/>Check square</button><Restart onClick={reset}/></div>
  </div>;
}

export function BridgeCrossing() {
  const [state, setState] = useState(newBridge);
  const [selected, setSelected] = useState<number[]>([]);
  const [history, setHistory] = useState<BridgeState[]>([]);
  const [message, setMessage] = useState("");
  const allAcross = state.across.every(Boolean);
  const won = allAcross && state.elapsed <= 17;
  const done = allAcross || state.elapsed > 17;
  function choose(traveler: number) { if (done || state.across[traveler] !== state.torch) return; if (selected.includes(traveler)) setSelected(selected.filter(index => index !== traveler)); else if (selected.length < 2) setSelected([...selected, traveler]); else setMessage("The bridge carries at most two people."); }
  function cross() { const next = crossBridge(state, selected); if (next === state) return; setHistory([...history, state]); setState(next); setSelected([]); setMessage(""); tone(510); }
  function undo() { const previous = history.at(-1); if (previous) { setState(previous); setHistory(history.slice(0, -1)); setSelected([]); setMessage(""); } }
  return <div className="game-inner bridge-game"><Stats label="Minutes" score={state.elapsed}/><Status>{won ? "Everyone across in 17 minutes. Well planned!" : done ? "Over 17 minutes. Undo and try another route." : message || `${state.torch ? "Far" : "Near"} side holds the lantern.`}</Status>
    <div className="bridge-scene"><div className="bridge-deck" aria-hidden="true"/><div className="bridge-banks">{[false, true].map(side => <section key={String(side)} className="bridge-bank"><h3>{side ? "Far side" : "Near side"}{state.torch === side ? <Flame size={20} aria-label="Lantern"/> : null}</h3><div>{bridgeTimes.map((minutes, traveler) => state.across[traveler] === side ? <button key={traveler} aria-label={`Traveler ${traveler + 1}, ${minutes} minutes`} disabled={done || state.torch !== side} aria-pressed={selected.includes(traveler)} onClick={() => choose(traveler)}><PersonStanding size={34}/><strong>{minutes}</strong><span>min</span></button> : null)}</div></section>)}</div></div>
    <div className="game-actions"><button className="primary-button" disabled={done || !selected.length} onClick={cross}><ArrowLeftRight size={18}/>Cross bridge</button><button className="icon-button" disabled={!history.length} title="Undo crossing" aria-label="Undo crossing" onClick={undo}><Undo2 size={18}/></button><Restart onClick={() => { setState(newBridge()); setSelected([]); setHistory([]); setMessage(""); }}/></div>
  </div>;
}