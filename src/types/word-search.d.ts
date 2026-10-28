declare module "@blex41/word-search" {
  export default class WordSearch {
    constructor(options: { cols: number; rows: number; dictionary: string[]; maxWords: number; disabledDirections?: string[]; backwardsProbability?: number; upperCase?: boolean });
    readonly grid: string[][];
    readonly words: { word: string; clean: string; path: { x: number; y: number }[] }[];
  }
}