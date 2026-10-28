import WordSearch from "@blex41/word-search";

export function newWordSearch() {
  const puzzle = new WordSearch({
    cols: 8,
    rows: 8,
    dictionary: ["SUN", "MOON", "STAR", "SPACE", "EARTH", "COMET", "ORBIT", "MARS"],
    maxWords: 6,
    backwardsProbability: 0,
    disabledDirections: ["N", "W", "NW", "SW", "NE"],
    upperCase: true,
  });
  return {
    cells: puzzle.grid.flat(),
    words: puzzle.words.map(entry => entry.clean),
  };
}