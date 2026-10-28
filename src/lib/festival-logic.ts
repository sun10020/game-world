import { Chess, type Square } from "chess.js";
import { shuffle } from "./game-logic";

export const tacticPuzzles = [
  { name: "Queen and king", fen: "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1" },
  { name: "The last rank", fen: "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1" },
  { name: "A closer look", fen: "7k/8/5K2/6Q1/8/8/8/8 w - - 0 1" },
];

export function matingMoves(fen: string) {
  const board = new Chess(fen);
  return board.moves({ verbose: true }).filter(move => {
    const trial = new Chess(fen);
    trial.move(move);
    return trial.isCheckmate();
  });
}

export function queenConflicts(queens: number[]): number[] {
  const board = new Chess();
  board.clear();
  const square = (cell: number) => `${"abcdefgh"[cell % 8]}${8 - Math.floor(cell / 8)}` as Square;
  for (const cell of queens) board.put({ type: "q", color: "w" }, square(cell));
  return queens.filter(cell => board.isAttacked(square(cell), "w"));
}

const magicBase = [8, 1, 6, 3, 5, 7, 4, 9, 2];
export const magicSolutions: number[][] = [];
let magicRotation = magicBase;
for (let turn = 0; turn < 4; turn++) {
  magicSolutions.push(magicRotation, [...magicRotation.slice(0, 3).reverse(), ...magicRotation.slice(3, 6).reverse(), ...magicRotation.slice(6).reverse()]);
  magicRotation = Array.from({ length: 9 }, (_, cell) => magicRotation[(2 - cell % 3) * 3 + Math.floor(cell / 3)]);
}
export function newMagicSquare() {
  const solution = shuffle(magicSolutions)[0];
  return solution.map((value, cell) => [0, 4, 8].includes(cell) ? value : 0);
}
export function magicComplete(board: number[]): boolean {
  if (board.length !== 9 || new Set(board).size !== 9 || board.some(value => !Number.isInteger(value) || value < 1 || value > 9)) return false;
  const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  return lines.every(line => line.reduce((sum, cell) => sum + board[cell], 0) === 15);
}

export const bridgeTimes = [1, 2, 5, 10];
export type BridgeState = { across: boolean[]; torch: boolean; elapsed: number };
export function newBridge(): BridgeState { return { across: [false, false, false, false], torch: false, elapsed: 0 }; }
export function crossBridge(state: BridgeState, travelers: number[]): BridgeState {
  if (state.across.every(Boolean) || state.elapsed > 17 || travelers.length < 1 || travelers.length > 2 || new Set(travelers).size !== travelers.length) return state;
  if (travelers.some(index => !Number.isInteger(index) || index < 0 || index > 3 || state.across[index] !== state.torch)) return state;
  return { across: state.across.map((across, index) => travelers.includes(index) ? !across : across), torch: !state.torch, elapsed: state.elapsed + Math.max(...travelers.map(index => bridgeTimes[index])) };
}

export const wordKits = [
  { letters: "PLANET", words: ["PLANET", "PLANE", "PLANT", "PLATE", "PANEL", "PETAL", "LATE", "TALE", "TEAL", "LANE", "LEAN", "NEAT", "PALE", "LEAP", "PANE", "PLAN", "PANT", "TAPE", "PELT", "APE", "ATE", "EAT", "TEA", "TEN", "NET", "PEN", "PAN", "NAP", "TAP", "PAT", "PET", "LET", "ANT"] },
  { letters: "STREAM", words: ["STREAM", "MASTER", "TAMER", "TEAMS", "STEAM", "SMART", "STARE", "RATES", "TAME", "TEAM", "MEAT", "MATE", "RATE", "TEAR", "STAR", "MARE", "REST", "SEAT", "EAST", "EATS", "TEAS", "EAT", "ATE", "TEA", "SEA", "ARM", "ART", "RAT", "TAR", "MAT", "MET", "SET"] },
  { letters: "GARDEN", words: ["GARDEN", "DANGER", "RANGE", "ANGER", "GRADE", "GRAND", "GEAR", "DEAR", "DARE", "READ", "DEAN", "NEAR", "EARN", "RAGE", "AGED", "DRAG", "DARN", "RAN", "RAG", "AGE", "ARE", "EAR", "ERA", "RED", "DEN", "END"] },
];
export function canBuildWord(letters: string, word: string): boolean {
  const available = letters.split("");
  for (const letter of word) { const position = available.indexOf(letter); if (position < 0) return false; available.splice(position, 1); }
  return word.length >= 3;
}

export const ladderWords = ["COLD", "CORD", "CARD", "WARD", "WARM", "WORD", "WORM", "WORK", "FORK", "FORM", "FARM", "HARD", "HARE", "HATE", "LATE", "LANE", "LAND", "SAND", "SEND", "TEND", "TENT", "TINT", "TILT", "TILL", "TALL", "TAIL", "HEAD", "HEAL", "TEAL", "TELL", "SHIP", "SHOP", "SHOT", "SPOT", "SOOT", "SOON", "MOON", "MOOD", "GOOD", "FOOD", "FOOT", "BOOT", "BOOK", "COOK", "COOL", "POOL", "POLL", "POLE", "PALE", "SALE", "SAME", "GAME", "GATE", "DATE", "DAME", "DINE", "DONE", "TONE", "CONE", "BONE"];
export const ladderPairs = [["COLD", "WARM"], ["HEAD", "TAIL"], ["SHIP", "MOON"]];
export function oneLetterApart(first: string, second: string): boolean { return first.length === second.length && first.split("").filter((letter, index) => letter !== second[index]).length === 1; }
export function ladderPath(start: string, target: string): string[] {
  const queue = [[start]];
  const visited = new Set([start]);
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const path = queue[cursor];
    const last = path.at(-1)!;
    if (last === target) return path;
    for (const word of ladderWords) if (!visited.has(word) && oneLetterApart(last, word)) { visited.add(word); queue.push([...path, word]); }
  }
  return [];
}

export const spellingWords = [
  { word: "APPLE", clue: "A crunchy fruit" }, { word: "HOUSE", clue: "A place to live" },
  { word: "TRAIN", clue: "A vehicle on rails" }, { word: "CLOUD", clue: "It floats across the sky" },
  { word: "MUSIC", clue: "Melodies and rhythms" }, { word: "PLANT", clue: "It grows from a seed" },
  { word: "LIGHT", clue: "It helps you see" }, { word: "SMILE", clue: "A happy expression" },
  { word: "WATER", clue: "A drink we all need" }, { word: "BREAD", clue: "A sandwich starts with this" },
];
export const wordGroups = [
  { name: "Fruit", words: ["APPLE", "PEAR", "MANGO", "GRAPE", "PEACH"] },
  { name: "Colors", words: ["BLUE", "RED", "GREEN", "YELLOW", "PINK"] },
  { name: "Transport", words: ["TRAIN", "BUS", "BOAT", "TRUCK", "TAXI"] },
  { name: "Shapes", words: ["CIRCLE", "SQUARE", "TRIANGLE", "OVAL", "HEXAGON"] },
];
export const shapeNames = ["Circle", "Square", "Triangle", "Pentagon", "Hexagon"];
export type LearningKind = "missing-letter" | "word-categories" | "clock-match" | "fraction-match" | "shape-sort" | "sequence-lab";
export type LearningQuestion = { prompt: string; spoken: string; answer: string; options: string[]; display: string; values: number[] };
export function learningQuestion(kind: LearningKind): LearningQuestion {
  const pick = <Value,>(values: Value[]): Value => shuffle(values)[0];
  const options = (answer: string, alternatives: string[]) => shuffle([answer, ...shuffle([...new Set(alternatives.filter(value => value !== answer))]).slice(0, 3)]);
  if (kind === "missing-letter") {
    const entry = pick(spellingWords);
    const missing = Math.floor(Math.random() * entry.word.length);
    const answer = entry.word[missing];
    return { prompt: entry.clue, spoken: `Complete the word ${entry.word}`, answer, options: options(answer, "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")), display: entry.word.slice(0, missing) + "_" + entry.word.slice(missing + 1), values: [missing] };
  }
  if (kind === "word-categories") {
    const group = pick(wordGroups);
    const word = pick(group.words);
    return { prompt: "Which group?", spoken: `Which group does ${word} belong to?`, answer: group.name, options: shuffle(wordGroups.map(entry => entry.name)), display: word, values: [] };
  }
  if (kind === "clock-match") {
    const hour = 1 + Math.floor(Math.random() * 12), minute = pick([0, 15, 30, 45]);
    const answer = `${hour}:${String(minute).padStart(2, "0")}`;
    const times = Array.from({ length: 48 }, (_, index) => `${Math.floor(index / 4) + 1}:${String(index % 4 * 15).padStart(2, "0")}`);
    return { prompt: "What time is it?", spoken: "Match the clock to the time", answer, options: options(answer, times), display: "", values: [hour, minute] };
  }
  if (kind === "fraction-match") {
    const denominator = pick([3, 4, 5, 6]), numerator = 1 + Math.floor(Math.random() * (denominator - 1));
    const answer = `${numerator}/${denominator}`;
    const fractions = Array.from({ length: denominator }, (_, index) => `${index + 1}/${denominator}`);
    if (fractions.length < 4) fractions.push("0/3");
    return { prompt: "Which fraction is shaded?", spoken: "Count the shaded parts and all the equal parts", answer, options: options(answer, fractions), display: "", values: [numerator, denominator] };
  }
  if (kind === "shape-sort") {
    const answer = pick(shapeNames);
    return { prompt: "Name the shape", spoken: "Choose the name of this shape", answer, options: options(answer, shapeNames), display: answer, values: [] };
  }
  const step = pick([2, 3, 4, 5, 10]), start = 1 + Math.floor(Math.random() * 12);
  const multiply = Math.random() > .6;
  const values = Array.from({ length: 4 }, (_, index) => multiply ? start * 2 ** index : start + step * index);
  const next = multiply ? start * 16 : start + step * 4;
  const answer = String(next);
  return { prompt: "What comes next?", spoken: `What comes after ${values.join(", ")}?`, answer, options: options(answer, [next - 1, next + 1, next + step, next - step, next + 2].map(String)), display: "", values };
}

export type DifferencePuzzle = { original: number[]; changed: number[]; differences: number[] };
export function newDifferences(): DifferencePuzzle {
  const original = Array.from({ length: 16 }, () => Math.floor(Math.random() * shapeNames.length));
  const differences = shuffle(Array.from({ length: 16 }, (_, index) => index)).slice(0, 3);
  return { original, changed: original.map((shape, cell) => differences.includes(cell) ? (shape + 1 + Math.floor(Math.random() * 4)) % shapeNames.length : shape), differences };
}
export function newOddRound() {
  const common = Math.floor(Math.random() * shapeNames.length);
  const odd = Math.floor(Math.random() * 12);
  const different = (common + 1 + Math.floor(Math.random() * 4)) % shapeNames.length;
  return { tiles: Array.from({ length: 12 }, (_, index) => index === odd ? different : common), odd };
}

export type StackLayer = { left: number; width: number };
export function stackOverlap(previous: StackLayer, current: StackLayer): StackLayer | null {
  const left = Math.max(previous.left, current.left), right = Math.min(previous.left + previous.width, current.left + current.width);
  return right - left >= 2 ? { left, width: right - left } : null;
}
export const bubbleColors = ["Blue", "Coral", "Gold", "Green"];
export function newBubbleRound() {
  const colors = shuffle(Array.from({ length: 12 }, (_, index) => index % 4));
  return { colors, target: Math.floor(Math.random() * 4) };
}