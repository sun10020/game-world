"use client";
import { useSyncExternalStore } from "react";
export function readPreference(key:string,fallback=""){try{return localStorage.getItem(key)??fallback;}catch{return fallback;}}
export function writePreference(key:string,value:string){try{localStorage.setItem(key,value);window.dispatchEvent(new Event("gw-preferences"));}catch{}}
function subscribe(listener:()=>void){window.addEventListener("storage",listener);window.addEventListener("gw-preferences",listener);return()=>{window.removeEventListener("storage",listener);window.removeEventListener("gw-preferences",listener);};}
export function usePreference(key:string,fallback:string){const value=useSyncExternalStore(subscribe,()=>readPreference(key,fallback),()=>fallback);return[value,(next:string)=>writePreference(key,next)] as const;}
export function parseFavorites(value:string):string[]{try{const parsed:unknown=JSON.parse(value);return Array.isArray(parsed)?parsed.filter((item):item is string=>typeof item==="string"):[];}catch{return[];}}