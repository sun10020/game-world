import { Map as MazeMap, Path } from "rot-js";
import { shuffle, type Direction } from "./game-logic";

export type MazePuzzle = { width: number; walls: boolean[]; start: number; exit: number };

export function newMaze(width = 15): MazePuzzle {
  const walls = Array<boolean>(width * width).fill(true);
  new MazeMap.EllerMaze(width, width).create((column, row, wall) => { walls[row * width + column] = wall === 1; });
  return { width, walls, start: width + 1, exit: (width - 2) * width + width - 2 };
}

export function mazePath(maze: MazePuzzle, start = maze.start): number[] {
  const route: number[] = [];
  const passable = (column: number, row: number) => column >= 0 && row >= 0 && column < maze.width && row < maze.width && !maze.walls[row * maze.width + column];
  new Path.AStar(maze.exit % maze.width, Math.floor(maze.exit / maze.width), passable, { topology: 4 })
    .compute(start % maze.width, Math.floor(start / maze.width), (column, row) => route.push(row * maze.width + column));
  return route;
}

export function mazeMove(maze: MazePuzzle, position: number, direction: Direction): number {
  if (position === maze.exit) return position;
  const offsets = { up: -maze.width, down: maze.width, left: -1, right: 1 };
  const next = position + offsets[direction];
  if (next < 0 || next >= maze.walls.length || maze.walls[next]) return position;
  if (Math.abs(next % maze.width - position % maze.width) + Math.abs(Math.floor(next / maze.width) - Math.floor(position / maze.width)) !== 1) return position;
  return next;
}

export function newHanoi(count = 3): number[][] {
  return [Array.from({ length: count }, (_, index) => count - index), [], []];
}

export function moveHanoi(towers: number[][], from: number, to: number): number[][] {
  if (from === to || !towers[from]?.length || !towers[to]) return towers;
  const disc = towers[from].at(-1)!;
  const top = towers[to].at(-1);
  if (top !== undefined && top < disc) return towers;
  return towers.map((tower, index) => index === from ? tower.slice(0, -1) : index === to ? [...tower, disc] : tower);
}

export const floodColors = ["Blue", "Coral", "Gold", "Green", "Violet"];

export function newFlood(): number[] {
  return shuffle(Array.from({ length: 36 }, (_, index) => index % floodColors.length));
}

export function floodBoard(board: number[], color: number, width = 6): number[] {
  if (!Number.isInteger(color) || color < 0 || color >= floodColors.length || color === board[0]) return board;
  const result = [...board];
  const original = board[0];
  const queue = [0];
  const visited = new Set<number>(queue);
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const cell = queue[cursor];
    result[cell] = color;
    for (const neighbor of [cell - width, cell + width, ...(cell % width > 0 ? [cell - 1] : []), ...(cell % width < width - 1 ? [cell + 1] : [])]) {
      if (neighbor >= 0 && neighbor < board.length && board[neighbor] === original && !visited.has(neighbor)) { visited.add(neighbor); queue.push(neighbor); }
    }
  }
  return result;
}

export const nonogramPatterns = [
  ["01110", "11111", "11111", "01110", "00100"],
  ["00100", "01110", "11111", "01110", "00100"],
  ["00100", "01110", "11111", "10101", "11111"],
  ["11111", "10001", "10101", "10001", "11111"],
  ["10001", "01010", "00100", "01010", "10001"],
  ["01100", "01100", "01111", "01111", "11111"],
].map(rows => rows.join("").split("").map(cell => cell === "1"));

export function nonogramClues(cells: boolean[]): number[] {
  const clues: number[] = [];
  let run = 0;
  for (const filled of [...cells, false]) {
    if (filled) run++;
    else if (run) { clues.push(run); run = 0; }
  }
  return clues.length ? clues : [0];
}

export function matchesNonogram(solution: boolean[], marks: number[]): boolean {
  if (marks.length !== 25 || solution.length !== 25) return false;
  for (let index = 0; index < 5; index++) {
    const row = Array.from({ length: 5 }, (_, column) => index * 5 + column);
    const column = Array.from({ length: 5 }, (_, rowIndex) => rowIndex * 5 + index);
    for (const line of [row, column]) {
      if (nonogramClues(line.map(cell => solution[cell])).join(",") !== nonogramClues(line.map(cell => marks[cell] === 1)).join(",")) return false;
    }
  }
  return true;
}

export type NumberMystery = { secret: number; guesses: number[] };
export function newNumberMystery(): NumberMystery { return { secret: 1 + Math.floor(Math.random() * 100), guesses: [] }; }
export function numberBounds(mystery: NumberMystery): { low: number; high: number } {
  return {
    low: Math.max(1, ...mystery.guesses.filter(guess => guess < mystery.secret).map(guess => guess + 1)),
    high: Math.min(100, ...mystery.guesses.filter(guess => guess > mystery.secret).map(guess => guess - 1)),
  };
}
export function guessNumber(mystery: NumberMystery, guess: number): NumberMystery {
  const { low, high } = numberBounds(mystery);
  if (!Number.isInteger(guess) || guess < low || guess > high || mystery.guesses.includes(guess) || mystery.guesses.includes(mystery.secret) || mystery.guesses.length >= 7) return mystery;
  return { ...mystery, guesses: [...mystery.guesses, guess] };
}