"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { usePreference } from "@/lib/preferences";
import { Gamepad2, Grid2X2, Joystick, Puzzle, Dices, Brain, Sparkles, Heart, Sun, Moon, Volume2, VolumeX, ArrowUpRight } from "lucide-react";
const nav = [{name:"All games",icon:Grid2X2},{name:"Arcade",icon:Joystick},{name:"Puzzle",icon:Puzzle},{name:"Board games",icon:Dices},{name:"Brain training",icon:Brain},{name:"Kids corner",icon:Sparkles}];
export function Shell({children}:{children:React.ReactNode}) {
  const [theme,setTheme]=usePreference("gw-theme","light");
  const [soundPreference,setSoundPreference]=usePreference("gw-sound","off");
  const dark=theme==="dark",sound=soundPreference==="on";
  const pathname=usePathname();
  useEffect(()=>{document.documentElement.dataset.theme=theme;},[theme]);
  function toggleTheme(){setTheme(dark?"light":"dark");}
  function toggleSound(){setSoundPreference(sound?"off":"on");if(sound&&"speechSynthesis" in window)speechSynthesis.cancel();}
  return <><aside className="sidebar"><Link href="/" className="brand" aria-label="Game World home"><span className="brand-icon"><Gamepad2 size={26}/></span><span>game<span className="brand-world">world<span className="brand-dot">.</span></span></span></Link><div className="nav-label">LET THE GOOD TIMES PLAY</div><nav>{nav.map(({name,icon:Icon})=><Link href={name==="All games"?"/":`/?category=${encodeURIComponent(name)}`} key={name} aria-label={name} title={name} className={`nav-link ${name==="All games"&&pathname==="/"?"nav-home":""}`}><Icon size={19}/><span>{name}</span>{name==="Kids corner"&&<span className="tiny-dot"/>}</Link>)}<div className="nav-divider"/><Link className="nav-link" href="/?favorites=1" aria-label="My favorites" title="My favorites"><Heart size={19}/><span>My favorites</span></Link></nav><div className="sidebar-bottom"><div className="little-note"><span className="note-stars">✧</span><strong>A little play.<br/>A better day.</strong><p>Your next happy break<br/>is right here.</p></div><div className="sidebar-settings"><button onClick={toggleTheme} aria-label={dark?"Switch to light mode":"Switch to dark mode"} title={dark?"Light mode":"Dark mode"}>{dark?<Sun size={18}/>:<Moon size={18}/>}<span>{dark?"Light mode":"Dark mode"}</span></button><button onClick={toggleSound} aria-label={sound?"Mute sound":"Enable sound"} title={sound?"Mute sound":"Enable sound"}>{sound?<Volume2 size={18}/>:<VolumeX size={18}/>}</button></div><span className="sidebar-caption">Made for your playtime.</span></div></aside><div className="main-shell">{children}<footer><Link href="/" className="footer-brand"><Gamepad2 size={19}/> gameworld.</Link><span>A little escape. A lot of fun.</span><div><Link href="/about">About <ArrowUpRight size={12}/></Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div><small>© {new Date().getFullYear()} Game World</small></footer></div></>;
}