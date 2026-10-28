"use client";
import { useState } from "react";
import { ArrowRight, Check, Circle, Hexagon, Lightbulb, Pentagon, Shuffle, Square, Triangle, Undo2, X } from "lucide-react";
import { shuffle } from "@/lib/game-logic";
import { canBuildWord, ladderPairs, ladderPath, ladderWords, learningQuestion, newDifferences, newOddRound, oneLetterApart, shapeNames, wordKits, type LearningKind, type LearningQuestion } from "@/lib/festival-logic";
import { Restart, Speaker, Stats, Status, tone } from "./shared";

const shapeIcons = [Circle, Square, Triangle, Pentagon, Hexagon];
export function LearningShape({ shape, size = 46 }: { shape: number; size?: number }) {
  const Icon = shapeIcons[shape];
  return <Icon size={size} strokeWidth={1.8} className={`learning-shape shape-${shape}`} role="img" aria-label={shapeNames[shape]}/>;
}
function ClockFace({ hour, minute }: { hour: number; minute: number }) {
  return <svg className="learning-clock" viewBox="0 0 220 220" role="img" aria-label={`Clock showing ${hour}:${String(minute).padStart(2, "0")}`}>
    <circle cx="110" cy="110" r="102" fill="var(--surface)" stroke="var(--green)" strokeWidth="6"/>
    {Array.from({ length: 12 }, (_, index) => index + 1).map(number => { const angle = (number * 30 - 90) * Math.PI / 180; return <text key={number} x={110 + Math.cos(angle) * 80} y={116 + Math.sin(angle) * 80} textAnchor="middle" fill="var(--text)" fontSize="17" fontWeight="600">{number}</text>; })}
    <line x1="110" y1="110" x2="110" y2="59" transform={`rotate(${hour % 12 * 30 + minute / 2} 110 110)`} stroke="var(--text)" strokeWidth="7" strokeLinecap="round"/>
    <line x1="110" y1="110" x2="110" y2="38" transform={`rotate(${minute * 6} 110 110)`} stroke="var(--green)" strokeWidth="4" strokeLinecap="round"/><circle cx="110" cy="110" r="7" fill="var(--text)"/>
  </svg>;
}
function QuestionArt({ kind, question }: { kind: LearningKind; question: LearningQuestion }) {
  if (kind === "clock-match") return <ClockFace hour={question.values[0]} minute={question.values[1]}/>;
  if (kind === "fraction-match") return <div className="fraction-art" role="img" aria-label={`${question.values[0]} of ${question.values[1]} equal parts shaded`}>{Array.from({ length: question.values[1] }, (_, index) => <span key={index} className={index < question.values[0] ? "fraction-shaded" : ""}>{index < question.values[0] ? <Check size={20}/> : null}</span>)}</div>;
  if (kind === "shape-sort") return <div className="shape-stage"><LearningShape shape={shapeNames.indexOf(question.display)} size={115}/></div>;
  if (kind === "sequence-lab") return <div className="sequence-track">{question.values.map((value, index) => <span key={index}>{value}</span>)}<strong>?</strong></div>;
  return <div className={`learning-word ${kind === "missing-letter" ? "missing-word" : ""}`}>{question.display}</div>;
}
function LearningRound({ kind }: { kind: LearningKind }) {
  const [question, setQuestion] = useState(() => learningQuestion(kind));
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const done = round === 5;
  function choose(answer: string) { if (choice !== null || done) return; setChoice(answer); if (answer === question.answer) { setScore(score + 1); tone(660); } else tone(240); }
  function next() { setRound(round + 1); setChoice(null); if (round < 4) setQuestion(learningQuestion(kind)); }
  function reset() { setQuestion(learningQuestion(kind)); setRound(0); setScore(0); setChoice(null); }
  return <div className={`game-inner learning-round ${kind}-game`}><div className="learning-progress"><span>Round {Math.min(5, round + 1)} of 5</span><span>{score} correct</span></div>
    <Status>{done ? `Round complete! ${score} of 5 correct.` : choice === null ? question.prompt : choice === question.answer ? "That's right!" : `Good try. The answer is ${question.answer}.`}</Status>
    {!done ? <><QuestionArt kind={kind} question={question}/><Speaker text={question.spoken}/><div className={`learning-options ${kind === "missing-letter" ? "letter-options" : ""}`}>{question.options.map(option => <button key={option} disabled={choice !== null} onClick={() => choose(option)} className={choice !== null && option === question.answer ? "answer-correct" : choice === option ? "answer-incorrect" : ""}>{option}{choice !== null && option === question.answer ? <Check size={17}/> : choice === option ? <X size={17}/> : null}</button>)}</div>{choice !== null ? <button className="primary-button" onClick={next}>{round === 4 ? "Finish round" : "Next question"}<ArrowRight size={17}/></button> : null}</> : <div className="learning-finish"><Check size={52}/><strong>{score}/5</strong></div>}
    <Restart onClick={reset}/>
  </div>;
}
export function MissingLetter() { return <LearningRound kind="missing-letter"/>; }
export function WordCategories() { return <LearningRound kind="word-categories"/>; }
export function ClockMatch() { return <LearningRound kind="clock-match"/>; }
export function FractionMatch() { return <LearningRound kind="fraction-match"/>; }
export function ShapeSort() { return <LearningRound kind="shape-sort"/>; }
export function SequenceLab() { return <LearningRound kind="sequence-lab"/>; }

function newWordKit() { return shuffle(wordKits)[0]; }
export function WordBuilder() {
  const [kit, setKit] = useState(newWordKit);
  const [letters, setLetters] = useState(() => shuffle(kit.letters.split("")));
  const [input, setInput] = useState("");
  const [found, setFound] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const done = found.length >= 8;
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const word = input.trim().toUpperCase();
    if (done) return;
    if (!canBuildWord(kit.letters, word)) { setMessage("Use these letters to make a word of at least three letters."); return; }
    if (!kit.words.includes(word)) { setMessage("That word is not in this round's word list."); return; }
    if (found.includes(word)) { setMessage("You already found that word."); return; }
    setFound([...found, word]); setInput(""); setMessage("Word discovered!"); tone(650);
  }
  function reset() { const next = newWordKit(); setKit(next); setLetters(shuffle(next.letters.split(""))); setInput(""); setFound([]); setMessage(""); }
  return <div className="game-inner builder-game"><Stats label="Words" score={found.length}/><Status>{done ? "Eight words discovered. Brilliant building!" : message || "Six letters. Eight words to find."}</Status>
    <div className="builder-letters">{letters.map((letter, index) => <button key={index} disabled={done || input.length >= 6 || input.split(letter).length >= kit.letters.split(letter).length} onClick={() => setInput(input + letter)} aria-label={`Add letter ${letter}`}>{letter}</button>)}</div>
    <form className="word-entry-form" onSubmit={submit}><label htmlFor="builder-word">Your word</label><div><input id="builder-word" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={6} disabled={done} value={input} onChange={event => setInput(event.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}/><button className="primary-button" type="submit" disabled={done || input.length < 3}><Check size={17}/>Add word</button></div></form>
    <ul className="builder-found">{found.map(word => <li key={word}><Check size={14}/>{word}</li>)}</ul><div className="game-actions"><button className="icon-button" disabled={done} aria-label="Shuffle letters" title="Shuffle letters" onClick={() => setLetters(shuffle(letters))}><Shuffle size={18}/></button><button className="icon-button" disabled={!input || done} aria-label="Remove last letter" title="Remove last letter" onClick={() => setInput(input.slice(0, -1))}><Undo2 size={18}/></button><Restart onClick={reset}/></div>
  </div>;
}

function newLadder() { return shuffle(ladderPairs)[0]; }
export function WordLadder() {
  const [pair, setPair] = useState(newLadder);
  const [path, setPath] = useState([pair[0]]);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const done = path.at(-1) === pair[1];
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const word = input.toUpperCase();
    if (done) return;
    if (!oneLetterApart(path.at(-1)!, word)) { setMessage("Change exactly one letter."); return; }
    if (!ladderWords.includes(word)) { setMessage("That word is not in this ladder's word list."); return; }
    if (path.includes(word)) { setMessage("That step is already in your ladder."); return; }
    setPath([...path, word]); setInput(""); setMessage(""); tone(560);
  }
  return <div className="game-inner ladder-game"><div className="ladder-goal"><span>{pair[0]}</span><ArrowRight size={20}/><strong>{pair[1]}</strong></div><Stats label="Steps" score={path.length - 1}/><Status>{done ? "Word ladder complete!" : message || "One letter changes each step."}</Status>
    <ol className="ladder-path">{path.map(word => <li key={word}>{word}</li>)}</ol>
    <form className="word-entry-form" onSubmit={submit}><label htmlFor="ladder-word">Next word</label><div><input id="ladder-word" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={4} disabled={done} value={input} onChange={event => setInput(event.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}/><button className="primary-button" type="submit" disabled={done || input.length !== 4}><ArrowRight size={17}/>Take step</button></div></form>
    <div className="game-actions"><button className="icon-button" aria-label="Hint: next word" title="Hint: next word" disabled={done} onClick={() => { const route = ladderPath(path.at(-1)!, pair[1]); setMessage(route[1] ? `A possible next word: ${route[1]}.` : "Undo a step to try another route."); }}><Lightbulb size={18}/></button><button className="icon-button" disabled={path.length < 2} aria-label="Undo word" title="Undo word" onClick={() => { setPath(path.slice(0, -1)); setMessage(""); }}><Undo2 size={18}/></button><Restart onClick={() => { const next = newLadder(); setPair(next); setPath([next[0]]); setInput(""); setMessage(""); }}/></div>
  </div>;
}

export function SpotDifference() {
  const [puzzle, setPuzzle] = useState(newDifferences);
  const [guesses, setGuesses] = useState<number[]>([]);
  const found = guesses.filter(cell => puzzle.differences.includes(cell));
  const mistakes = guesses.length - found.length;
  const won = found.length === 3, done = won || mistakes === 3;
  function choose(cell: number) { if (done || guesses.includes(cell)) return; setGuesses([...guesses, cell]); tone(puzzle.differences.includes(cell) ? 650 : 230); }
  return <div className="game-inner differences-game"><div className="learning-progress"><span>{found.length} of 3 found</span><span>{3 - mistakes} chances</span></div><Status>{won ? "All three differences found!" : done ? "Three chances used. Try a fresh pair." : "Three shapes have changed."}</Status>
    <div className="difference-pair"><section><h3>Original</h3><div className="difference-board">{puzzle.original.map((shape, cell) => <span key={cell}><LearningShape shape={shape} size={35}/></span>)}</div></section><section><h3>Find the changes</h3><div className="difference-board">{puzzle.changed.map((shape, cell) => <button key={cell} aria-label={`Tile ${cell + 1}, ${shapeNames[shape]}`} disabled={done || guesses.includes(cell)} className={found.includes(cell) ? "difference-found" : guesses.includes(cell) ? "difference-miss" : ""} onClick={() => choose(cell)}><LearningShape shape={shape} size={35}/>{found.includes(cell) ? <Check className="difference-mark" size={14}/> : null}</button>)}</div></section></div>
    <Restart onClick={() => { setPuzzle(newDifferences()); setGuesses([]); }}/>
  </div>;
}

export function OddOneOut() {
  const [puzzle, setPuzzle] = useState(newOddRound);
  const [round, setRound] = useState(0);
  const [missed, setMissed] = useState<number[]>([]);
  const [lives, setLives] = useState(3);
  const [message, setMessage] = useState("");
  const won = round === 5, done = won || lives === 0;
  function choose(cell: number) {
    if (done || missed.includes(cell)) return;
    if (cell === puzzle.odd) { setRound(round + 1); setPuzzle(newOddRound()); setMissed([]); setMessage(""); tone(700); }
    else { setMissed([...missed, cell]); setLives(lives - 1); setMessage("Look for the different shape."); tone(230); }
  }
  return <div className="game-inner odd-game"><div className="learning-progress"><span>{round} of 5 found</span><span>{lives} chances</span></div><Status>{won ? "Five differences spotted. Sharp eyes!" : done ? "Out of chances. A fresh set is waiting." : message || "One shape is not like the others."}</Status>
    <div className="odd-board">{puzzle.tiles.map((shape, cell) => <button key={cell} disabled={done || missed.includes(cell)} aria-label={`Tile ${cell + 1}, ${shapeNames[shape]}`} onClick={() => choose(cell)}><LearningShape shape={shape} size={44}/></button>)}</div><Restart onClick={() => { setPuzzle(newOddRound()); setRound(0); setLives(3); setMissed([]); setMessage(""); }}/>
  </div>;
}