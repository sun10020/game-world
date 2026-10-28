"use client";
import { useState } from "react";
import { ArrowDown, ArrowUp, Check, Flag, Lightbulb, Search, Square, Undo2, X } from "lucide-react";
import { shuffle, type Direction } from "@/lib/game-logic";
import { floodBoard, floodColors, guessNumber, matchesNonogram, mazeMove, mazePath, moveHanoi, newFlood, newHanoi, newMaze, newNumberMystery, nonogramClues, nonogramPatterns, numberBounds } from "@/lib/discovery-logic";
import { Dpad, keyDirection, Restart, Speaker, Stats, Status, tone, useGameKeys } from "./shared";

export function MazeRun() {
  const [maze, setMaze] = useState(() => newMaze());
  const [position, setPosition] = useState(maze.start);
  const [moves, setMoves] = useState(0);
  const [hint, setHint] = useState(false);
  const [message, setMessage] = useState("");
  const won = position === maze.exit;
  const route = hint ? mazePath(maze, position) : [];
  function move(direction: Direction) {
    const next = mazeMove(maze, position, direction);
    if (won) return;
    if (next === position) { setMessage("A wall blocks that way."); return; }
    setPosition(next); setMoves(moves + 1); setMessage(""); tone(next === maze.exit ? 880 : 330, .05);
  }
  useGameKeys(key => { const direction = keyDirection(key); if (direction) move(direction); });
  function reset() { const next = newMaze(); setMaze(next); setPosition(next.start); setMoves(0); setHint(false); setMessage(""); }
  return <div className="game-inner maze-game"><Stats label="Moves" score={moves}/><Status>{won ? "Exit found. Nicely navigated!" : message || "Destination: the flag"}</Status>
    <div className="maze-board" role="img" aria-label={`Maze, player at row ${Math.floor(position / maze.width) + 1}, column ${position % maze.width + 1}`} data-position={position} data-exit={maze.exit}>
      {maze.walls.map((wall, cell) => <span key={cell} data-wall={wall ? "true" : "false"} className={`${wall ? "maze-wall" : "maze-floor"} ${route.includes(cell) ? "maze-hint" : ""} ${position === cell ? "maze-player" : ""}`}>{cell === position ? <span/> : cell === maze.exit ? <Flag size={16}/> : null}</span>)}
    </div>
    <Dpad onMove={move}/><div className="game-actions"><button className="icon-button" onClick={() => setHint(!hint)} disabled={won} aria-label="Show route hint" title="Show route hint" aria-pressed={hint}><Lightbulb size={18}/></button><Restart onClick={reset}/></div>
  </div>;
}

export function TowerOfHanoi() {
  const [count, setCount] = useState(3);
  const [towers, setTowers] = useState(() => newHanoi());
  const [selected, setSelected] = useState<number | null>(null);
  const [history, setHistory] = useState<number[][][]>([]);
  const [message, setMessage] = useState("");
  const won = towers[2].length === count;
  function select(tower: number) {
    if (won) return;
    if (selected === null) { if (towers[tower].length) { setSelected(tower); setMessage(""); } else setMessage("That tower is empty."); return; }
    if (selected === tower) { setSelected(null); return; }
    const next = moveHanoi(towers, selected, tower);
    if (next === towers) { setMessage("A larger disc cannot sit on a smaller one."); return; }
    setHistory([...history, towers]); setTowers(next); setSelected(null); setMessage(""); tone(520);
  }
  function reset(discs = count) { setCount(discs); setTowers(newHanoi(discs)); setHistory([]); setSelected(null); setMessage(""); }
  function undo() { const previous = history.at(-1); if (previous) { setTowers(previous); setHistory(history.slice(0, -1)); setSelected(null); setMessage(""); } }
  return <div className="game-inner hanoi-game"><div className="hanoi-options"><label>Discs <select value={count} onChange={event => reset(Number(event.target.value))}><option value={3}>3 discs</option><option value={4}>4 discs</option></select></label><span>Target: {2 ** count - 1} moves</span></div>
    <Stats label="Moves" score={history.length}/><Status>{won ? `Tower complete in ${history.length} moves!` : message || (selected === null ? "Destination: tower 3" : `Disc from tower ${selected + 1} selected`)}</Status>
    <div className="hanoi-board">{towers.map((tower, index) => <button className="hanoi-tower" key={index} onClick={() => select(index)} disabled={won} aria-pressed={selected === index} aria-label={`Tower ${index + 1}, ${tower.length ? `discs ${tower.join(", ")}` : "empty"}`}>
      <span className="tower-label">{index + 1}</span>{tower.map(disc => <span className={`hanoi-disc disc-${disc}`} key={disc} style={{ width: `${30 + disc * 15}%` }}>{disc}</span>)}
    </button>)}</div>
    <div className="game-actions"><button className="icon-button" onClick={undo} disabled={!history.length} aria-label="Undo move" title="Undo move"><Undo2 size={18}/></button><Restart onClick={() => reset()}/></div>
  </div>;
}

export function FloodFill() {
  const [board, setBoard] = useState(newFlood);
  const [history, setHistory] = useState<number[][]>([]);
  const won = board.every(color => color === board[0]);
  function choose(color: number) { if (won) return; const next = floodBoard(board, color); if (next !== board) { setHistory([...history, board]); setBoard(next); tone(350 + color * 80); } }
  function undo() { const previous = history.at(-1); if (previous) { setBoard(previous); setHistory(history.slice(0, -1)); } }
  return <div className="game-inner flood-game"><Stats label="Moves" score={history.length}/><Status>{won ? `One color in ${history.length} moves!` : "One board. One color."}</Status>
    <div className="flood-board" role="group" aria-label="Flood board">{board.map((color, cell) => <span key={cell} role="img" data-color={color} className={`flood-cell flood-color-${color}`} aria-label={`Row ${Math.floor(cell / 6) + 1}, column ${cell % 6 + 1}: ${floodColors[color]}`}>{cell === 0 ? <Flag size={15}/> : color + 1}</span>)}</div>
    <div className="flood-swatches">{floodColors.map((color, index) => <button key={color} className={`flood-color-${index}`} disabled={won || index === board[0]} aria-pressed={index === board[0]} aria-label={`Flood ${color}`} title={color} onClick={() => choose(index)}>{index + 1}</button>)}</div>
    <div className="game-actions"><button className="icon-button" onClick={undo} disabled={!history.length} aria-label="Undo move" title="Undo move"><Undo2 size={18}/></button><Restart onClick={() => { setBoard(newFlood()); setHistory([]); }}/></div>
  </div>;
}

function nextNonogram() { return shuffle(nonogramPatterns)[0]; }
export function Nonogram() {
  const [solution, setSolution] = useState(nextNonogram);
  const [marks, setMarks] = useState(() => Array<number>(25).fill(0));
  const [mode, setMode] = useState(1);
  const [message, setMessage] = useState("");
  const [won, setWon] = useState(false);
  function mark(cell: number) { if (won) return; setMarks(marks.map((value, index) => index === cell ? value === mode ? 0 : mode : value)); setMessage(""); }
  function check() { const solved = matchesNonogram(solution, marks); setWon(solved); setMessage(solved ? "Picture complete!" : "Some clues don't match yet."); tone(solved ? 880 : 220); }
  return <div className="game-inner nonogram-game"><div className="nonogram-tools"><button className="icon-button" disabled={won} aria-label="Fill squares" title="Fill squares" aria-pressed={mode === 1} onClick={() => setMode(1)}><Square size={19} fill="currentColor"/></button><button className="icon-button" disabled={won} aria-label="Mark empty squares" title="Mark empty squares" aria-pressed={mode === 2} onClick={() => setMode(2)}><X size={20}/></button></div>
    <Status>{message || "A picture in the clues"}</Status><div className="nonogram-board"><span/>{Array.from({ length: 5 }, (_, column) => { const clues = nonogramClues(Array.from({ length: 5 }, (_, row) => solution[row * 5 + column])); return <span key={`column-${column}`} className="nonogram-column" role="img" aria-label={`Column ${column + 1} clue: ${clues.join(", ")}`}>{clues.map((clue, index) => <span key={index}>{clue}</span>)}</span>; })}
      {Array.from({ length: 5 }, (_, row) => { const clues = nonogramClues(solution.slice(row * 5, row * 5 + 5)); return [<span key={`row-${row}`} className="nonogram-row" role="img" aria-label={`Row ${row + 1} clue: ${clues.join(", ")}`}>{clues.join(" ")}</span>, ...Array.from({ length: 5 }, (_, column) => { const cell = row * 5 + column; return <button key={cell} disabled={won} className={marks[cell] === 1 ? "nonogram-filled" : ""} onClick={() => mark(cell)} aria-label={`Row ${row + 1} column ${column + 1}: ${marks[cell] === 1 ? "filled" : marks[cell] === 2 ? "marked empty" : "unknown"}`} aria-pressed={marks[cell] === 1}>{marks[cell] === 2 ? <X size={19}/> : null}</button>; })]; })}
    </div><div className="game-actions"><button className="primary-button" disabled={won} onClick={check}><Check size={16}/>Check puzzle</button><Restart onClick={() => { setSolution(nextNonogram()); setMarks(Array(25).fill(0)); setMode(1); setWon(false); setMessage(""); }}/></div>
  </div>;
}

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
function newAlphabet() { return shuffle(alphabet); }
export function AlphabetTrail() {
  const [letters, setLetters] = useState(newAlphabet);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const won = progress === 26;
  function choose(letter: string) { if (won) return; if (letter !== alphabet[progress]) { setMessage(`Try again. Next is ${alphabet[progress]}.`); return; } setProgress(progress + 1); setMessage(""); tone(400 + progress * 15); }
  return <div className="game-inner alphabet-game"><Stats label="Letters" score={progress}/><div className="alphabet-target"><strong>{won ? "A to Z" : alphabet[progress]}</strong><Speaker text={won ? "You know the alphabet. Well done!" : `The letter ${alphabet[progress]}`}/></div><Status>{won ? "A to Z. You found every letter!" : message || `Next: ${alphabet[progress]}`}</Status>
    <div className="alphabet-board">{letters.map(letter => { const found = alphabet.indexOf(letter) < progress; return <button key={letter} disabled={found || won} className={found ? "letter-found" : ""} onClick={() => choose(letter)} aria-label={`Letter ${letter}`}>{letter}</button>; })}</div>
    <Restart onClick={() => { setLetters(newAlphabet()); setProgress(0); setMessage(""); }}/>
  </div>;
}

export function NumberDetective() {
  const [mystery, setMystery] = useState(newNumberMystery);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const { low, high } = numberBounds(mystery);
  const won = mystery.guesses.includes(mystery.secret);
  const done = won || mystery.guesses.length >= 7;
  const last = mystery.guesses.at(-1);
  const status = won ? `Mystery solved! The number is ${mystery.secret}.` : done ? `The number was ${mystery.secret}. Try another mystery!` : message || (last === undefined ? "Seven guesses. One mystery." : `Go ${last < mystery.secret ? "higher" : "lower"} than ${last}.`);
  function submit(event: React.FormEvent) { event.preventDefault(); const next = guessNumber(mystery, Number(input)); if (!input.trim() || next === mystery) { setMessage(`Choose a whole number from ${low} to ${high}.`); return; } setMystery(next); setInput(""); setMessage(""); tone(next.guesses.at(-1) === mystery.secret ? 880 : 440); }
  return <div className="game-inner detective-game"><Stats label="Guesses" score={mystery.guesses.length}/><div className="mystery-range"><Search size={30}/><strong>{done ? mystery.secret : `${low} - ${high}`}</strong><Speaker text={done ? status : `${status} The number is between ${low} and ${high}.`}/></div><Status>{status}</Status>
    <form className="detective-form" onSubmit={submit}><label htmlFor="number-guess">Your guess</label><div><input id="number-guess" type="number" inputMode="numeric" min={low} max={high} step={1} required value={input} disabled={done} onChange={event => setInput(event.target.value)}/><button className="primary-button" disabled={done || !input.trim()} type="submit"><Check size={17}/>Check number</button></div></form>
    <ol className="detective-history">{mystery.guesses.map(guess => <li key={guess}><strong>{guess}</strong>{guess === mystery.secret ? <><Check size={16}/>Correct</> : guess < mystery.secret ? <><ArrowUp size={16}/>Higher</> : <><ArrowDown size={16}/>Lower</>}</li>)}</ol>
    <Restart onClick={() => { setMystery(newNumberMystery()); setInput(""); setMessage(""); }}/>
  </div>;
}