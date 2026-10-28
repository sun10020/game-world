"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, Share2, RotateCcw, ChevronDown, LoaderCircle } from "lucide-react";
import type { Game } from "@/lib/games";
function Loading(){return <div className="game-loading"><LoaderCircle className="spinner" size={28}/><span>Getting your game ready...</span></div>;}
const players:Record<string,React.ComponentType>={
  "tic-tac-toe":dynamic(()=>import("./games/board-games").then(module=>module.TicTacToe),{ssr:false,loading:Loading}),
  chess:dynamic(()=>import("./games/board-games").then(module=>module.ChessGame),{ssr:false,loading:Loading}),
  "connect-four":dynamic(()=>import("./games/board-games").then(module=>module.ConnectFour),{ssr:false,loading:Loading}),
  ludo:dynamic(()=>import("./games/board-games").then(module=>module.Ludo),{ssr:false,loading:Loading}),
  sudoku:dynamic(()=>import("./games/puzzle-games").then(module=>module.Sudoku),{ssr:false,loading:Loading}),
  "2048":dynamic(()=>import("./games/puzzle-games").then(module=>module.Game2048),{ssr:false,loading:Loading}),
  minesweeper:dynamic(()=>import("./games/puzzle-games").then(module=>module.Minesweeper),{ssr:false,loading:Loading}),
  "sliding-puzzle":dynamic(()=>import("./games/puzzle-games").then(module=>module.SlidingPuzzle),{ssr:false,loading:Loading}),
  snake:dynamic(()=>import("./games/arcade-games").then(module=>module.Snake),{ssr:false,loading:Loading}),
  tetris:dynamic(()=>import("./games/arcade-games").then(module=>module.BlockDrop),{ssr:false,loading:Loading}),
  "whack-a-mole":dynamic(()=>import("./games/arcade-games").then(module=>module.MolePatrol),{ssr:false,loading:Loading}),
  memory:dynamic(()=>import("./games/learning-games").then(module=>module.MemoryMatch),{ssr:false,loading:Loading}),
  simon:dynamic(()=>import("./games/learning-games").then(module=>module.ColorEcho),{ssr:false,loading:Loading}),
  "math-quest":dynamic(()=>import("./games/learning-games").then(module=>module.MathQuest),{ssr:false,loading:Loading}),
  "word-scramble":dynamic(()=>import("./games/learning-games").then(module=>module.WordWonder),{ssr:false,loading:Loading}),
  "color-lab":dynamic(()=>import("./games/learning-games").then(module=>module.ColorLab),{ssr:false,loading:Loading}),
  "word-search":dynamic(()=>import("./games/bonus-puzzles").then(module=>module.WordSearchGame),{ssr:false,loading:Loading}),
  "lights-out":dynamic(()=>import("./games/bonus-puzzles").then(module=>module.LightsOut),{ssr:false,loading:Loading}),
  "code-breaker":dynamic(()=>import("./games/bonus-puzzles").then(module=>module.CodeBreaker),{ssr:false,loading:Loading}),
  "word-rescue":dynamic(()=>import("./games/bonus-puzzles").then(module=>module.WordRescue),{ssr:false,loading:Loading}),
  "dots-and-boxes":dynamic(()=>import("./games/bonus-games").then(module=>module.DotsAndBoxes),{ssr:false,loading:Loading}),
  "rock-paper-scissors":dynamic(()=>import("./games/bonus-games").then(module=>module.RockPaperScissors),{ssr:false,loading:Loading}),
  "number-trail":dynamic(()=>import("./games/bonus-games").then(module=>module.NumberTrail),{ssr:false,loading:Loading}),
  "reaction-time":dynamic(()=>import("./games/bonus-games").then(module=>module.ReactionTime),{ssr:false,loading:Loading}),
  "maze-run":dynamic(()=>import("./games/discovery-games").then(module=>module.MazeRun),{ssr:false,loading:Loading}),
  "tower-of-hanoi":dynamic(()=>import("./games/discovery-games").then(module=>module.TowerOfHanoi),{ssr:false,loading:Loading}),
  "flood-fill":dynamic(()=>import("./games/discovery-games").then(module=>module.FloodFill),{ssr:false,loading:Loading}),
  nonogram:dynamic(()=>import("./games/discovery-games").then(module=>module.Nonogram),{ssr:false,loading:Loading}),
  "alphabet-trail":dynamic(()=>import("./games/discovery-games").then(module=>module.AlphabetTrail),{ssr:false,loading:Loading}),
  "number-detective":dynamic(()=>import("./games/discovery-games").then(module=>module.NumberDetective),{ssr:false,loading:Loading}),
  "brick-breaker":dynamic(()=>import("./games/festival-arcade").then(module=>module.BrickBreaker),{ssr:false,loading:Loading}),
  "paddle-rally":dynamic(()=>import("./games/festival-arcade").then(module=>module.PaddleRally),{ssr:false,loading:Loading}),
  "mini-golf":dynamic(()=>import("./games/festival-arcade").then(module=>module.MiniGolf),{ssr:false,loading:Loading}),
  pinball:dynamic(()=>import("./games/festival-arcade").then(module=>module.Pinball),{ssr:false,loading:Loading}),
  "sky-stack":dynamic(()=>import("./games/festival-arcade").then(module=>module.SkyStack),{ssr:false,loading:Loading}),
  "bubble-pop":dynamic(()=>import("./games/festival-arcade").then(module=>module.BubblePop),{ssr:false,loading:Loading}),
  "chess-tactics":dynamic(()=>import("./games/festival-puzzles").then(module=>module.ChessTactics),{ssr:false,loading:Loading}),
  "queens-garden":dynamic(()=>import("./games/festival-puzzles").then(module=>module.QueensGarden),{ssr:false,loading:Loading}),
  "magic-square":dynamic(()=>import("./games/festival-puzzles").then(module=>module.MagicSquare),{ssr:false,loading:Loading}),
  "bridge-crossing":dynamic(()=>import("./games/festival-puzzles").then(module=>module.BridgeCrossing),{ssr:false,loading:Loading}),
  "word-builder":dynamic(()=>import("./games/festival-learning").then(module=>module.WordBuilder),{ssr:false,loading:Loading}),
  "word-ladder":dynamic(()=>import("./games/festival-learning").then(module=>module.WordLadder),{ssr:false,loading:Loading}),
  "missing-letter":dynamic(()=>import("./games/festival-learning").then(module=>module.MissingLetter),{ssr:false,loading:Loading}),
  "word-categories":dynamic(()=>import("./games/festival-learning").then(module=>module.WordCategories),{ssr:false,loading:Loading}),
  "clock-match":dynamic(()=>import("./games/festival-learning").then(module=>module.ClockMatch),{ssr:false,loading:Loading}),
  "fraction-match":dynamic(()=>import("./games/festival-learning").then(module=>module.FractionMatch),{ssr:false,loading:Loading}),
  "shape-sort":dynamic(()=>import("./games/festival-learning").then(module=>module.ShapeSort),{ssr:false,loading:Loading}),
  "odd-one-out":dynamic(()=>import("./games/festival-learning").then(module=>module.OddOneOut),{ssr:false,loading:Loading}),
  "spot-difference":dynamic(()=>import("./games/festival-learning").then(module=>module.SpotDifference),{ssr:false,loading:Loading}),
  "sequence-lab":dynamic(()=>import("./games/festival-learning").then(module=>module.SequenceLab),{ssr:false,loading:Loading}),
};
export function GamePlayer({game}:{game:Game}){const [version,setVersion]=useState(0);const [full,setFull]=useState(false);const [notice,setNotice]=useState("");const container=useRef<HTMLDivElement>(null);const Player=players[game.slug];useEffect(()=>{const listener=()=>setFull(!!document.fullscreenElement);document.addEventListener("fullscreenchange",listener);return()=>{document.removeEventListener("fullscreenchange",listener);if("speechSynthesis" in window)speechSynthesis.cancel();};},[]);
  async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else if(container.current?.requestFullscreen)await container.current.requestFullscreen();else setNotice("Fullscreen is not available in this browser.");}catch{setNotice("Fullscreen is not available in this browser.");}}
  async function share(){try{await navigator.clipboard.writeText(window.location.href);setNotice("Game link copied!");}catch{setNotice("Copy the page address to share this game.");}}
  return <><div className="game-stage" ref={container}><div className="stage-toolbar"><span className="stage-name"><span className="live-dot"/>{game.name}</span><div><button className="icon-button" onClick={()=>setVersion(version+1)} title="Restart game" aria-label="Restart game"><RotateCcw size={17}/></button><button className="icon-button" onClick={share} title="Copy game link" aria-label="Copy game link"><Share2 size={17}/></button><button className="icon-button" onClick={fullscreen} title={full?"Exit fullscreen":"Fullscreen"} aria-label={full?"Exit fullscreen":"Fullscreen"}>{full?<Minimize2 size={17}/>:<Maximize2 size={17}/>}</button></div></div>{notice&&<p className="player-notice" role="status">{notice}</p>}<div className="game-canvas"><Player key={version}/></div><div className="stage-bottom"><span>{game.players}</span><span>Take a break. Stay a little.</span></div></div><details className="game-rules"><summary>Game rules <ChevronDown size={18}/></summary><p>{game.instructions}</p></details>{game.category==="Kids corner"&&<section className="mini-lesson"><div><span className="section-kicker">A LITTLE EXTRA DISCOVERY</span><h2>Count along, one to five.</h2><p>A short, quiet counting adventure.</p></div><video controls playsInline preload="none" poster="/learning-poster.svg" aria-label="Count colorful shapes from one to five"><source src="/counting.webm" type="video/webm"/><track kind="captions" src="/counting.vtt" srcLang="en" label="English" default/></video></section>}</>;
}