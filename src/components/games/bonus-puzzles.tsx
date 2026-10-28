"use client";

import { useState } from "react";
import { Check, Flower2, Lightbulb, Search, X } from "lucide-react";
import { gradeCode, newLights, rescueResult, rescueWords, selectionLine, toggleLights } from "@/lib/bonus-logic";
import { newWordSearch } from "@/lib/word-search";
import { Restart, Speaker, Stats, Status, tone } from "./shared";

export function LightsOut() {
  const [puzzle, setPuzzle] = useState(newLights);
  const [moves, setMoves] = useState(0);
  const won = puzzle.board.every(lit => !lit);
  function press(cell: number) {
    if (won) return;
    setPuzzle(current => ({ ...current, board: toggleLights(current.board, cell) }));
    setMoves(current => current + 1);
    tone(300 + cell * 15);
  }
  return <div className="game-inner">
    <Stats score={moves} label="Moves" />
    <Status>{won ? `All lights out in ${moves} moves!` : `${puzzle.board.filter(Boolean).length} lights to turn off`}</Status>
    <div className="lights-board">{puzzle.board.map((lit, index) => <button key={index}
      aria-label={`Light ${index + 1}, ${lit ? "on" : "off"}`} aria-pressed={lit}
      className={lit ? "light-on" : "light-off"} disabled={won} onClick={() => press(index)}>
      <Lightbulb size={25} fill={lit ? "currentColor" : "none"} />
    </button>)}</div>
    <Restart onClick={() => { setPuzzle(newLights()); setMoves(0); }} />
  </div>;
}

const codeColors = [
  { name: "Coral", hex: "#d76c68" }, { name: "Blue", hex: "#6591bd" },
  { name: "Gold", hex: "#d1ab40" }, { name: "Green", hex: "#619c77" },
  { name: "Violet", hex: "#9474b5" }, { name: "Pink", hex: "#ce84a3" },
];
type Attempt = { guess: number[]; exact: number; misplaced: number };
function newCode() { return Array.from({ length: 4 }, () => Math.floor(Math.random() * codeColors.length)); }

export function CodeBreaker() {
  const [secret, setSecret] = useState(newCode);
  const [guess, setGuess] = useState([-1, -1, -1, -1]);
  const [slot, setSlot] = useState(0);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const won = attempts.at(-1)?.exact === 4;
  const done = won || attempts.length === 8;
  function choose(color: number) {
    if (done) return;
    const next = guess.map((value, index) => index === slot ? color : value);
    setGuess(next);
    const empty = next.findIndex((value, index) => index > slot && value === -1);
    setSlot(empty >= 0 ? empty : Math.min(slot + 1, 3));
    tone(300 + color * 60);
  }
  function submit() {
    if (done || guess.includes(-1)) return;
    setAttempts([...attempts, { guess: [...guess], ...gradeCode(secret, guess) }]);
    setGuess([-1, -1, -1, -1]);
    setSlot(0);
  }
  return <div className="game-inner">
    <Status>{won ? `Code cracked in ${attempts.length} ${attempts.length === 1 ? "try" : "tries"}!` : done ? "The secret is revealed. Try a fresh code?" : `Attempt ${attempts.length + 1} of 8`}</Status>
    <ol className="code-history" aria-label="Previous guesses">{attempts.map((attempt, index) => <li key={index}>
      <span className="attempt-number">{index + 1}</span>
      <div className="code-pegs">{attempt.guess.map((color, position) => <span key={position} role="img" style={{ background: codeColors[color].hex }} aria-label={codeColors[color].name}>{color + 1}</span>)}</div>
      <span className="code-feedback"><strong>{attempt.exact} exact</strong><span>{attempt.misplaced} misplaced</span></span>
    </li>)}</ol>
    {done ? <div className="code-secret" role="group" aria-label="Secret code">{secret.map((color, index) => <span key={index} role="img" style={{ background: codeColors[color].hex }} aria-label={codeColors[color].name}>{color + 1}</span>)}</div> : <>
      <div className="code-entry" role="group" aria-label="Current guess">{guess.map((color, index) => <button key={index} onClick={() => setSlot(index)}
        aria-label={`Code slot ${index + 1}${color < 0 ? ", empty" : `, ${codeColors[color].name}`}`} aria-pressed={slot === index}
        style={color >= 0 ? { background: codeColors[color].hex, color: "#fff" } : undefined}>{color < 0 ? "?" : color + 1}</button>)}</div>
      <div className="code-palette">{codeColors.map((color, index) => <button key={color.name} onClick={() => choose(index)}
        style={{ background: color.hex }} aria-label={`${color.name} code color`} title={color.name}>{index + 1}</button>)}</div>
      <button className="primary-button" disabled={guess.includes(-1)} onClick={submit}><Check size={17} />Check code</button>
    </>}
    <Restart onClick={() => { setSecret(newCode()); setGuess([-1, -1, -1, -1]); setSlot(0); setAttempts([]); }} />
  </div>;
}

export function WordSearchGame() {
  const [puzzle, setPuzzle] = useState(newWordSearch);
  const [start, setStart] = useState<number | null>(null);
  const [found, setFound] = useState<{ word: string; cells: number[] }[]>([]);
  const [message, setMessage] = useState("A small universe of hidden words.");
  const won = found.length === puzzle.words.length;
  const foundCells = new Set(found.flatMap(entry => entry.cells));
  function select(index: number) {
    if (won) return;
    if (start === null) { setStart(index); setMessage("Choose the last letter."); return; }
    const cells = selectionLine(start, index, 8);
    const word = cells.map(cell => puzzle.cells[cell]).join("");
    const reverse = word.split("").reverse().join("");
    const answer = puzzle.words.find(candidate => candidate === word || candidate === reverse);
    if (answer && !found.some(entry => entry.word === answer)) {
      setFound([...found, { word: answer, cells }]);
      setMessage(`${answer} discovered!`);
      tone(650);
    } else setMessage(answer ? "You already found that one." : "Not a hidden word. Try another line.");
    setStart(null);
  }
  return <div className="game-inner">
    <Stats score={found.length} label={`Of ${puzzle.words.length} words`} />
    <Status>{won ? "Every word discovered. Stellar work!" : message}</Status>
    <div className="word-search-board">{puzzle.cells.map((letter, index) => <button key={index} onClick={() => select(index)} disabled={won}
      aria-label={`Letter ${letter}, row ${Math.floor(index / 8) + 1}, column ${index % 8 + 1}`} aria-pressed={start === index}
      className={`${foundCells.has(index) ? "word-found" : ""} ${start === index ? "word-start" : ""}`}>{letter}</button>)}</div>
    <ul className="word-search-list">{puzzle.words.map(word => <li key={word} className={found.some(entry => entry.word === word) ? "discovered" : ""}>
      {found.some(entry => entry.word === word) ? <Check size={13} /> : <Search size={13} />}<span>{word}</span>
    </li>)}</ul>
    <div className="game-actions">{start !== null && <button className="secondary-button" onClick={() => { setStart(null); setMessage("A small universe of hidden words."); }}><X size={15} />Clear selection</button>}
      <Restart onClick={() => { setPuzzle(newWordSearch()); setStart(null); setFound([]); setMessage("A small universe of hidden words."); }} /></div>
  </div>;
}

function newRescueWord() { return rescueWords[Math.floor(Math.random() * rescueWords.length)]; }

export function WordRescue() {
  const [puzzle, setPuzzle] = useState(newRescueWord);
  const [guesses, setGuesses] = useState<string[]>([]);
  const result = rescueResult(puzzle.word, guesses);
  const done = result.won || result.lost;
  function guess(letter: string) {
    if (done || guesses.includes(letter)) return;
    setGuesses([...guesses, letter]);
    tone(puzzle.word.includes(letter) ? 600 : 240);
  }
  return <div className="game-inner learning-inner">
    <div className="rescue-chances" role="img" aria-label={`${6 - result.mistakes} chances left`}>{Array.from({ length: 6 }, (_, index) => <Flower2 key={index} className={index < 6 - result.mistakes ? "chance-left" : "chance-used"} size={26} />)}</div>
    <Status>{result.won ? "Word rescued! Beautiful thinking." : result.lost ? `The word was ${puzzle.word}. A new discovery!` : `${6 - result.mistakes} chances left`}</Status>
    <div className="rescue-word" role="group" aria-label="Hidden word">{puzzle.word.split("").map((letter, index) => <span key={index} className={guesses.includes(letter) ? "revealed-letter" : ""}>{guesses.includes(letter) || done ? letter : "_"}</span>)}</div>
    <div className="word-clue"><p>{puzzle.clue}</p><Speaker text={puzzle.clue} /></div>
    <div className="letter-keyboard">{"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(letter => <button key={letter} onClick={() => guess(letter)} disabled={done || guesses.includes(letter)}
      aria-label={`Guess ${letter}`} className={guesses.includes(letter) ? puzzle.word.includes(letter) ? "letter-correct" : "letter-wrong" : ""}>{letter}</button>)}</div>
    <Restart onClick={() => { setPuzzle(newRescueWord()); setGuesses([]); }} />
  </div>;
}