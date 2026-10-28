import { test, expect } from "@playwright/test";
import { bestTicMove, canMove2048, lineWinner, ludoLegal, makeSlidingPuzzle, slide2048 } from "../src/lib/game-logic";
import { blockFits, moveBlock, newBlocks, newSnake, rotateShape, stepSnake, turnSnake } from "../src/lib/arcade-logic";
import { getSudoku } from "sudoku-gen";
import { claimEdge, gestureResult, gestures, gradeCode, newDots, newLights, rescueResult, selectionLine, toggleLights } from "../src/lib/bonus-logic";
import { newWordSearch } from "../src/lib/word-search";
import { floodBoard, guessNumber, matchesNonogram, mazeMove, mazePath, moveHanoi, newFlood, newHanoi, newMaze, newNumberMystery, nonogramClues, nonogramPatterns, numberBounds } from "../src/lib/discovery-logic";
import { canBuildWord, crossBridge, ladderPairs, ladderPath, learningQuestion, magicComplete, magicSolutions, matingMoves, newBridge, newBubbleRound, newDifferences, newMagicSquare, newOddRound, oneLetterApart, queenConflicts, stackOverlap, tacticPuzzles, wordKits, type LearningKind } from "../src/lib/festival-logic";
import { PhysicsWorld, type PhysicsMode } from "../src/lib/physics-world";
import { Body } from "matter-js";
test("2048 merges only once per move and scores correctly",()=>{const result=slide2048([2,2,2,2,...Array(12).fill(0)],"left");expect(result.board.slice(0,4)).toEqual([4,4,0,0]);expect(result.score).toBe(8);expect(slide2048([2,2,4,0,...Array(12).fill(0)],"left").board.slice(0,4)).toEqual([4,4,0,0]);});
test("2048 detects a locked board",()=>{expect(canMove2048([2,4,2,4,4,2,4,2,2,4,2,4,4,2,4,2])).toBe(false);});
test("winner detection does not wrap rows",()=>{expect(lineWinner(["","","X","X","X","","","",""],3,3,3)).toBeNull();expect(lineWinner(["X","","","","X","","","","X"],3,3,3)).toBe("X");});
test("tic tac toe computer wins and blocks",()=>{expect(bestTicMove(["O","O","","X","X","","","",""])).toBe(2);expect(bestTicMove(["X","X","","","O","","","",""])).toBe(2);});
test("sliding puzzles always have solvable parity",()=>{for(let sample=0;sample<30;sample++){const board=makeSlidingPuzzle();const values=board.filter(Boolean);const inversions=values.reduce((total,value,index)=>total+values.slice(index+1).filter(other=>value>other).length,0);const emptyRow=4-Math.floor(board.indexOf(0)/4);expect((inversions+emptyRow)%2).toBe(1);expect(new Set(board).size).toBe(16);}});
test("snake prevents reversal and detects walls",()=>{const state={...newSnake(),status:"playing" as const};expect(turnSnake(state,"left").queued).toBe("right");expect(stepSnake({...state,body:[{x:19,y:10},{x:18,y:10}]}).status).toBe("over");});
test("snake may enter the vacating tail square",()=>{const state={...newSnake(),status:"playing" as const,body:[{x:2,y:2},{x:2,y:3},{x:1,y:3},{x:1,y:2}],direction:"up" as const,queued:"left" as const,food:{x:9,y:9}};expect(stepSnake(state).status).toBe("playing");});
test("falling blocks rotate and cannot leave the board",()=>{const state=newBlocks();expect(rotateShape([[1,1,1,1]])).toEqual([[1],[1],[1],[1]]);expect(blockFits(state.board,[[1]],-1,0)).toBe(false);const dropped=moveBlock({...state,status:"playing"},"drop");expect(dropped.board.flat().filter(Boolean)).toHaveLength(4);expect(dropped.score).toBeGreaterThan(0);});
test("ludo needs six to leave and exact roll to finish",()=>{expect(ludoLegal(-1,6)).toBe(true);expect(ludoLegal(-1,5)).toBe(false);expect(ludoLegal(42,2)).toBe(true);expect(ludoLegal(42,3)).toBe(false);expect(ludoLegal(44,1)).toBe(false);});
test("generated Sudoku solutions contain every digit per row and column",()=>{const puzzle=getSudoku("easy");for(let index=0;index<9;index++){expect(new Set(puzzle.solution.slice(index*9,index*9+9)).size).toBe(9);expect(new Set(Array.from({length:9},(_,row)=>puzzle.solution[row*9+index])).size).toBe(9);}expect(puzzle.puzzle).toHaveLength(81);});

test("Lights Out touches only orthogonal neighbors and is reversible", () => {
	const empty = Array<boolean>(25).fill(false);
	const board = toggleLights(empty, 4);
	expect(board.flatMap((lit, index) => lit ? [index] : [])).toEqual([3, 4, 9]);
	expect(toggleLights(board, 4)).toEqual(empty);
	expect(toggleLights(empty, -1)).toBe(empty);
});

test("every generated Lights Out board has a solution", () => {
	for (let sample = 0; sample < 40; sample++) {
		const puzzle = newLights();
		expect(puzzle.board.some(Boolean)).toBe(true);
		const solved = puzzle.solution.reduce(toggleLights, puzzle.board);
		expect(solved.every(lit => !lit)).toBe(true);
	}
});

test("Code Breaker accounts for duplicates without double counting", () => {
	expect(gradeCode([0, 0, 1, 2], [0, 1, 0, 0])).toEqual({ exact: 1, misplaced: 2 });
	expect(gradeCode([0, 0, 1, 2], [3, 3, 3, 3])).toEqual({ exact: 0, misplaced: 0 });
	expect(gradeCode([0, 1, 2, 3], [0, 1, 2, 3])).toEqual({ exact: 4, misplaced: 0 });
	expect(() => gradeCode([0], [0, 1])).toThrow("Code lengths must match");
});

test("Dots and Boxes awards a closed box and retains the turn", () => {
	let board = newDots();
	board = claimEdge(board, "horizontal", 0);
	expect(board.turn).toBe(1);
	board = claimEdge(board, "horizontal", 3);
	board = claimEdge(board, "vertical", 0);
	const player = board.turn;
	board = claimEdge(board, "vertical", 1);
	expect(board.owners[0]).toBe(player);
	expect(board.turn).toBe(player);
	expect(claimEdge(board, "vertical", 1)).toBe(board);
});

test("one edge can close two boxes and completed boards cannot change", () => {
	let board = newDots();
	for (const edge of [0, 1, 3, 4]) board = claimEdge(board, "horizontal", edge);
	for (const edge of [0, 2]) board = claimEdge(board, "vertical", edge);
	const player = board.turn;
	board = claimEdge(board, "vertical", 1);
	expect(board.owners.slice(0, 2)).toEqual([player, player]);
	for (let edge = 0; edge < 12; edge++) {
		board = claimEdge(board, "horizontal", edge);
		board = claimEdge(board, "vertical", edge);
	}
	expect(board.owners.filter(owner => owner !== null)).toHaveLength(9);
	expect(claimEdge(board, "horizontal", 0)).toBe(board);
});

test("rock paper scissors covers all nine outcomes", () => {
	const results = gestures.flatMap(player => gestures.map(computer => gestureResult(player, computer)));
	expect(results.filter(result => result === "win")).toHaveLength(3);
	expect(results.filter(result => result === "lose")).toHaveLength(3);
	expect(results.filter(result => result === "draw")).toHaveLength(3);
	expect(gestureResult("rock", "scissors")).toBe("win");
});

test("word rescue handles repeated letters and six distinct mistakes", () => {
	expect(rescueResult("BALLOON", ["B", "A", "L", "O", "N"]).won).toBe(true);
	expect(rescueResult("BALLOON", ["X", "X"]).mistakes).toBe(1);
	expect(rescueResult("BALLOON", ["C", "D", "E", "F", "G", "H"]).lost).toBe(true);
});

test("word selection accepts straight lines in either direction", () => {
	expect(selectionLine(0, 27, 8)).toEqual([0, 9, 18, 27]);
	expect(selectionLine(27, 0, 8)).toEqual([27, 18, 9, 0]);
	expect(selectionLine(1, 19, 8)).toEqual([1, 10, 19]);
	expect(selectionLine(0, 10, 8)).toEqual([]);
});

test("word-search generator places every advertised word in the grid", () => {
	for (let sample = 0; sample < 15; sample++) {
		const puzzle = newWordSearch();
		expect(puzzle.cells).toHaveLength(64);
		expect(puzzle.words.length).toBeGreaterThanOrEqual(4);
		for (const word of puzzle.words) {
			const present = puzzle.cells.some((_, start) => puzzle.cells.some((_, end) => {
				const letters = selectionLine(start, end, 8).map(index => puzzle.cells[index]).join("");
				return letters === word || letters.split("").reverse().join("") === word;
			}));
			expect(present, word).toBe(true);
		}
	}
});

test("generated mazes have walkable solutions and block walls and exit movement", () => {
	for (let sample = 0; sample < 30; sample++) {
		const maze = newMaze();
		const route = mazePath(maze);
		expect(route[0]).toBe(maze.start);
		expect(route.at(-1)).toBe(maze.exit);
		expect(mazeMove(maze, maze.start, "up")).toBe(maze.start);
		for (let index = 1; index < route.length; index++) {
			const delta = route[index] - route[index - 1];
			const direction = delta === 1 ? "right" : delta === -1 ? "left" : delta > 0 ? "down" : "up";
			expect(mazeMove(maze, route[index - 1], direction)).toBe(route[index]);
		}
		expect(mazeMove(maze, maze.exit, "up")).toBe(maze.exit);
	}
});

test("Hanoi rejects larger discs and solves in seven moves without mutating the start", () => {
	const initial = newHanoi();
	let towers = moveHanoi(initial, 0, 2);
	expect(moveHanoi(towers, 0, 2)).toBe(towers);
	expect(moveHanoi(towers, 1, 2)).toBe(towers);
	for (const [from, to] of [[0, 1], [2, 1], [0, 2], [1, 0], [1, 2], [0, 2]]) towers = moveHanoi(towers, from, to);
	expect(towers).toEqual([[], [], [3, 2, 1]]);
	expect(initial).toEqual([[3, 2, 1], [], []]);
});

test("flood filling changes only the connected region without wrapping rows", () => {
	const board = [0, 0, 1, 0, 1, 1, 2, 2, 0];
	expect(floodBoard(board, 2, 3)).toEqual([2, 2, 1, 2, 1, 1, 2, 2, 0]);
	expect(floodBoard(board, 0, 3)).toBe(board);
	expect(floodBoard(board, -1, 3)).toBe(board);
	expect(new Set(newFlood()).size).toBe(5);
	expect(newFlood()).toHaveLength(36);
});

test("nonogram clues distinguish runs and accept every matching solution", () => {
	expect(nonogramClues([true, true, false, true, false])).toEqual([2, 1]);
	expect(nonogramClues([false, false])).toEqual([0]);
	for (const solution of nonogramPatterns) {
		expect(solution).toHaveLength(25);
		expect(matchesNonogram(solution, solution.map(cell => cell ? 1 : 2))).toBe(true);
		expect(matchesNonogram(solution, Array(25).fill(0))).toBe(false);
	}
	const diagonal = Array.from({ length: 25 }, (_, cell) => Math.floor(cell / 5) === cell % 5);
	const reverse = Array.from({ length: 25 }, (_, cell) => Math.floor(cell / 5) + cell % 5 === 4 ? 1 : 0);
	expect(matchesNonogram(diagonal, reverse)).toBe(true);
});

test("number mystery tightens bounds, rejects invalid guesses and freezes completed rounds", () => {
	const initial = { secret: 42, guesses: [] };
	const state = guessNumber(guessNumber(initial, 20), 60);
	expect(numberBounds(state)).toEqual({ low: 21, high: 59 });
	for (const invalid of [0, 101, 20, 60, 4.2, NaN]) expect(guessNumber(state, invalid)).toBe(state);
	const won = guessNumber(state, 42);
	expect(guessNumber(won, 30)).toBe(won);
	const lost = { secret: 100, guesses: [1, 2, 3, 4, 5, 6, 7] };
	expect(guessNumber(lost, 100)).toBe(lost);
	for (let sample = 0; sample < 30; sample++) {
		expect(newNumberMystery().secret).toBeGreaterThanOrEqual(1);
		expect(newNumberMystery().secret).toBeLessThanOrEqual(100);
	}
});

test("every chess tactic has a legal checkmate in one", () => {
	for (const puzzle of tacticPuzzles) expect(matingMoves(puzzle.fen).length, puzzle.name).toBeGreaterThan(0);
});
test("queen conflicts use chess attacks and accept eight nonattacking queens", () => {
	expect(queenConflicts([0, 7])).toEqual([0, 7]);
	expect(queenConflicts([0, 9])).toEqual([0, 9]);
	expect(queenConflicts([0, 4, 7, 5, 2, 6, 1, 3].map((column, row) => row * 8 + column))).toEqual([]);
});
test("magic square clues admit solutions and all lines must total fifteen", () => {
	for (const solution of magicSolutions) expect(magicComplete(solution)).toBe(true);
	expect(magicComplete(Array(9).fill(5))).toBe(false);
	expect(magicComplete([1, 2, 3, 4, 5, 6, 7, 8, 9])).toBe(false);
	for (let sample = 0; sample < 20; sample++) {
		const board = newMagicSquare();
		expect(board.filter(Boolean)).toHaveLength(3);
		expect(magicSolutions.some(solution => board.every((value, index) => !value || solution[index] === value))).toBe(true);
	}
});
test("bridge enforces torch capacity and solves in seventeen minutes", () => {
	const initial = newBridge();
	expect(crossBridge(initial, [])).toBe(initial);
	expect(crossBridge(initial, [0, 0])).toBe(initial);
	expect(crossBridge(initial, [0, 1, 2])).toBe(initial);
	let state = crossBridge(initial, [0, 1]);
	expect(crossBridge(state, [3])).toBe(state);
	for (const travelers of [[0], [2, 3], [1], [0, 1]]) state = crossBridge(state, travelers);
	expect(state.elapsed).toBe(17);
	expect(state.across.every(Boolean)).toBe(true);
	expect(crossBridge(state, [0])).toBe(state);
});
test("word-builder vocabulary respects letter multiplicity and ladder routes are valid", () => {
	for (const kit of wordKits) for (const word of kit.words) expect(canBuildWord(kit.letters, word), word).toBe(true);
	expect(canBuildWord("PLANET", "APPLE")).toBe(false);
	expect(canBuildWord("PLANET", "AN")).toBe(false);
	expect(oneLetterApart("COLD", "COLD")).toBe(false);
	for (const [start, target] of ladderPairs) {
		const route = ladderPath(start, target);
		expect(route.at(-1)).toBe(target);
		for (let index = 1; index < route.length; index++) expect(oneLetterApart(route[index - 1], route[index])).toBe(true);
	}
});
test("learning questions have four unique choices and exactly one correct option", () => {
	const kinds: LearningKind[] = ["missing-letter", "word-categories", "clock-match", "fraction-match", "shape-sort", "sequence-lab"];
	for (const kind of kinds) for (let sample = 0; sample < 40; sample++) {
		const question = learningQuestion(kind);
		expect(new Set(question.options).size, kind).toBe(4);
		expect(question.options.filter(option => option === question.answer)).toHaveLength(1);
	}
});
test("observation boards always have their advertised differences and targets", () => {
	for (let sample = 0; sample < 40; sample++) {
		const puzzle = newDifferences();
		expect(puzzle.original.flatMap((shape, index) => puzzle.changed[index] !== shape ? [index] : []).sort()).toEqual([...puzzle.differences].sort());
		expect(puzzle.differences).toHaveLength(3);
		const odd = newOddRound();
		expect(odd.tiles.filter(shape => shape === odd.tiles[odd.odd])).toHaveLength(1);
		const bubbles = newBubbleRound();
		expect(bubbles.colors.filter(color => color === bubbles.target)).toHaveLength(3);
	}
});
test("stacking trims the overhang and ends on a miss", () => {
	expect(stackOverlap({ left: 100, width: 150 }, { left: 120, width: 150 })).toEqual({ left: 120, width: 130 });
	expect(stackOverlap({ left: 100, width: 150 }, { left: 0, width: 99 })).toBeNull();
	expect(stackOverlap({ left: 100, width: 150 }, { left: 100, width: 150 })).toEqual({ left: 100, width: 150 });
});

test("physics games start, move, pause, clamp controls and clean up", () => {
	for (const mode of ["brick-breaker", "paddle-rally", "mini-golf", "pinball"] as PhysicsMode[]) {
		const world = new PhysicsWorld(mode);
		world.start();
		if (mode === "mini-golf") world.shoot(0, 60);
		const before = { ...world.ball.position };
		for (let frame = 0; frame < 12; frame++) world.step();
		expect(world.ball.position).not.toEqual(before);
		world.pause();
		const paused = { ...world.ball.position };
		world.step();
		expect(world.ball.position).toEqual(paused);
		world.movePaddle(-1000);
		if (world.paddle) expect(mode === "paddle-rally" ? world.paddle.position.y : world.paddle.position.x).toBeGreaterThan(0);
		world.dispose();
		expect(world.engine.world.bodies).toHaveLength(0);
	}
});
test("brick collisions score once and three lost balls end a round", () => {
	const world = new PhysicsWorld("brick-breaker");
	world.start();
	Body.setPosition(world.ball, { x: 42, y: 135 });
	Body.setVelocity(world.ball, { x: 0, y: -5 });
	for (let frame = 0; frame < 8; frame++) world.step();
	expect(world.score).toBeGreaterThan(0);
	expect(world.bricks.size).toBeLessThan(24);
	for (let ball = 0; ball < 3; ball++) { world.start(); Body.setPosition(world.ball, { x: 200, y: 530 }); world.step(); }
	expect(world.phase).toBe("over");
	expect(world.lives).toBe(0);
	world.dispose();
});
test("paddle rally scores goals and golf advances through three holes", () => {
	const rally = new PhysicsWorld("paddle-rally");
	for (let point = 0; point < 5; point++) { rally.start(); Body.setPosition(rally.ball, { x: 450, y: 200 }); rally.step(); }
	expect(rally.score).toBe(5);
	expect(rally.phase).toBe("won");
	rally.dispose();
	const golf = new PhysicsWorld("mini-golf");
	for (let hole = 0; hole < 3; hole++) { golf.start(); Body.setPosition(golf.ball, golf.cup); Body.setVelocity(golf.ball, { x: 0, y: 0 }); golf.step(); }
	expect(golf.score).toBe(3);
	expect(golf.phase).toBe("won");
	golf.dispose();
});
test("pinball launches into the table without draining behind the ramp", () => {
	const world = new PhysicsWorld("pinball");
	let highestPoint = world.ball.position.y;
	world.start();
	for (let frame = 0; frame < 60; frame++) {
		world.step();
		highestPoint = Math.min(highestPoint, world.ball.position.y);
	}
	expect(highestPoint).toBeLessThan(265);
	expect(world.lives).toBe(3);
	expect(world.phase).toBe("playing");
	world.dispose();
});

test("pinball bumper contacts earn points and active flippers change angle", () => {
	const world = new PhysicsWorld("pinball");
	world.start();
	Body.setPosition(world.ball, { x: 125, y: 193 });
	Body.setVelocity(world.ball, { x: 0, y: -4 });
	world.setFlipper(0, true);
	for (let frame = 0; frame < 5; frame++) world.step();
	expect(world.score).toBeGreaterThanOrEqual(50);
	expect(world.flippers[0].angle).toBeCloseTo(-.42);
	world.pause();
	expect(world.activeFlippers).toEqual([false, false]);
	world.dispose();
});