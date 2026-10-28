"use client";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
export default function ErrorPage({reset}:{error:Error&{digest?:string};reset:()=>void}){return <main id="main" className="page-content text-page"><h1>Let&apos;s try that again.</h1><p>This game took an unexpected break. Your saved favorites and scores are still on your device.</p><div className="game-actions"><button className="primary-button" onClick={reset}><RotateCcw size={17}/>Try again</button><Link className="secondary-button" href="/">All games</Link></div></main>;}