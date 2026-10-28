import { shuffle } from "./game-logic";

export function toggleLights(board: boolean[], cell: number) {
  const width = 5;
  if (!Number.isInteger(cell) || cell < 0 || cell >= board.length) return board;
  const row = Math.floor(cell / width);
  const column = cell % width;
  return board.map((value, index) =>
    Math.abs(Math.floor(index / width) - row) + Math.abs(index % width - column) <= 1
      ? !value
      : value,
  );
}

export function newLights() {
  const solution = shuffle(Array.from({ length: 25 }, (_, index) => index)).slice(0, 7);
  let board = Array<boolean>(25).fill(false);
  for (const cell of solution) board = toggleLights(board, cell);
  if (!board.some(Boolean)) {
    board = toggleLights(board, 0);
    solution.push(0);
  }
  return { board, solution };
}

export function gradeCode(secret: number[], guess: number[]) {
  if (secret.length !== guess.length) throw new Error("Code lengths must match");
  let exact = 0;
  let misplaced = 0;
  const remaining = new Map<number, number>();
  secret.forEach((color, index) => {
    if (color === guess[index]) exact++;
    else remaining.set(color, (remaining.get(color) || 0) + 1);
  });
  guess.forEach((color, index) => {
    if (color === secret[index]) return;
    const available = remaining.get(color) || 0;
    if (available > 0) {
      misplaced++;
      remaining.set(color, available - 1);
    }
  });
  return { exact, misplaced };
}

export type DotGame = {
  horizontal: boolean[];
  vertical: boolean[];
  owners: (number | null)[];
  turn: number;
};

export function newDots(): DotGame {
  return {
    horizontal: Array(12).fill(false),
    vertical: Array(12).fill(false),
    owners: Array(9).fill(null),
    turn: 0,
  };
}

export function claimEdge(state: DotGame, axis: "horizontal" | "vertical", edge: number): DotGame {
  if (edge < 0 || edge >= 12 || !Number.isInteger(edge) || state[axis][edge] || state.owners.every(owner => owner !== null)) return state;
  const next = { ...state, [axis]: state[axis].map((value, index) => index === edge || value) };
  let claimed = 0;
  next.owners = state.owners.map((owner, index) => {
    if (owner !== null) return owner;
    const row = Math.floor(index / 3);
    const column = index % 3;
    if (next.horizontal[row * 3 + column] && next.horizontal[(row + 1) * 3 + column]
      && next.vertical[row * 4 + column] && next.vertical[row * 4 + column + 1]) {
      claimed++;
      return state.turn;
    }
    return null;
  });
  next.turn = claimed ? state.turn : 1 - state.turn;
  return next;
}

export const gestures = ["rock", "paper", "scissors"] as const;
export type Gesture = typeof gestures[number];
export function gestureResult(player: Gesture, computer: Gesture) {
  if (player === computer) return "draw";
  return (gestures.indexOf(player) - gestures.indexOf(computer) + 3) % 3 === 1 ? "win" : "lose";
}

export const rescueWords = [
  { word: "RAINBOW", clue: "A colorful arc that can appear after rain." },
  { word: "GARDEN", clue: "A place to grow flowers and vegetables." },
  { word: "PLANET", clue: "A large round world that travels around a star." },
  { word: "ROCKET", clue: "A vehicle that can travel into space." },
  { word: "PENCIL", clue: "A tool for writing that you can erase." },
  { word: "PUZZLE", clue: "A challenge with pieces or clues to solve." },
  { word: "BALLOON", clue: "Fill it with air and it becomes round." },
  { word: "SUNSHINE", clue: "Light and warmth from our nearest star." },
];

export function rescueResult(word: string, guesses: string[]) {
  const unique = [...new Set(guesses.map(letter => letter.toUpperCase()))];
  const mistakes = unique.filter(letter => !word.includes(letter)).length;
  const won = word.split("").every(letter => unique.includes(letter));
  return { mistakes, won, lost: !won && mistakes >= 6 };
}

export function selectionLine(start: number, end: number, width: number) {
  const startRow = Math.floor(start / width), startColumn = start % width;
  const rowDistance = Math.floor(end / width) - startRow;
  const columnDistance = end % width - startColumn;
  if (rowDistance !== 0 && columnDistance !== 0 && Math.abs(rowDistance) !== Math.abs(columnDistance)) return [];
  return Array.from({ length: Math.max(Math.abs(rowDistance), Math.abs(columnDistance)) + 1 }, (_, offset) =>
    (startRow + offset * Math.sign(rowDistance)) * width + startColumn + offset * Math.sign(columnDistance),
  );
}