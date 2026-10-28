import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { games } from "../src/lib/games";
import { selectionLine, toggleLights } from "../src/lib/bonus-logic";
import { readFile } from "node:fs/promises";
import { floodBoard, floodColors, mazePath, nonogramPatterns, nonogramClues } from "../src/lib/discovery-logic";
import { ladderPath, magicSolutions, matingMoves, spellingWords, tacticPuzzles, wordGroups, wordKits } from "../src/lib/festival-logic";

test("catalog search, categories, favorites and persistent themes",async({page},testInfo)=>{
  const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
  await page.goto("/");await expect(page.locator(".game-card")).toHaveCount(games.length);
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:`artifacts/home-${testInfo.project.name}-light.png`,fullPage:true});
  await page.getByLabel("Search games").fill("sudoku");await expect(page.locator(".game-card")).toHaveCount(1);
  await page.getByLabel("Clear search").click();
  await page.getByLabel("Add Snake to favorites").click();await page.locator(".favorites-filter").click();await expect(page.locator(".game-card")).toHaveCount(1);await expect(page.locator(".card-info h3")).toContainText("Snake");
  await page.goto("/?category=Kids%20corner");await expect(page.locator(".game-card")).toHaveCount(games.filter(game=>game.category==="Kids corner").length);
  await page.goto("/");await page.getByRole("button",{name:"Switch to dark mode"}).click();await expect(page.locator("html")).toHaveAttribute("data-theme","dark");
  await page.reload();await expect(page.locator("html")).toHaveAttribute("data-theme","dark");
  await page.screenshot({path:`artifacts/home-${testInfo.project.name}-dark.png`,fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

for(const game of games)test(`${game.name} loads, restarts and fits viewport`,async({page},testInfo)=>{
  const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
  const response=await page.goto(`/games/${game.slug}`);expect(response?.status()).toBe(200);
  await expect(page.locator(".game-inner")).toBeVisible();await expect(page).toHaveTitle(new RegExp(game.name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
  await page.getByLabel("Restart game",{exact:true}).click();await expect(page.locator(".game-inner")).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator(".game-stage").screenshot({path:`artifacts/${game.slug}-${testInfo.project.name}-light.png`});
  await page.getByRole("button",{name:"Switch to dark mode"}).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme","dark");
  await page.locator(".game-stage").screenshot({path:`artifacts/${game.slug}-${testInfo.project.name}-dark.png`});
  await page.locator(".game-rules summary").click();await expect(page.locator(".game-rules p")).toBeVisible();
  expect(errors).toEqual([]);
});

test("tic tac toe local win and reset",async({page})=>{await page.goto("/games/tic-tac-toe");await page.getByRole("button",{name:"2 players",exact:true}).click();for(const cell of [1,4,2,5,3])await page.getByRole("button",{name:`Cell ${cell}`,exact:true}).click();await expect(page.locator(".game-status")).toHaveText("X wins!");await page.getByRole("button",{name:"New game",exact:true}).click();await expect(page.locator(".game-status")).toHaveText("X's turn");});
test("computer responds to tic tac toe move",async({page})=>{await page.goto("/games/tic-tac-toe");await page.getByRole("button",{name:"Cell 1",exact:true}).click();await expect(page.getByRole("button",{name:"Cell 5: O",exact:true})).toBeVisible();});
test("connect four detects vertical winner",async({page})=>{await page.goto("/games/connect-four");for(const column of [1,2,1,2,1,2,1])await page.getByLabel(`Drop in column ${column}`).click();await expect(page.locator(".game-status")).toHaveText("Red wins!");});
test("chess enforces turns and supports undo",async({page})=>{await page.goto("/games/chess");await page.getByLabel("e2 White pawn",{exact:true}).click();await expect(page.locator(".legal-dot")).toHaveCount(2);await page.getByLabel("e4",{exact:true}).click();await expect(page.locator(".game-status")).toContainText("Black to move");await page.getByRole("button",{name:"Undo",exact:true}).click();await expect(page.getByLabel("e2 White pawn",{exact:true})).toBeVisible();});
test("ludo releases a token on six and moves it",async({page})=>{await page.addInitScript(()=>{Math.random=()=>.99;});await page.goto("/games/ludo");await page.getByRole("button",{name:"Roll dice",exact:true}).last().click();await expect(page.locator(".game-status")).toContainText("rolled 6");await page.getByLabel("Red yard token 1",{exact:true}).click();await expect(page.getByLabel("Red token 1",{exact:true})).toBeVisible();await page.getByRole("button",{name:"Roll dice",exact:true}).last().click();await page.getByLabel("Red token 1",{exact:true}).click();await expect(page.locator(".game-status")).toContainText("Roll again");});
test("snake runs, pauses and restarts",async({page})=>{await page.goto("/games/snake");await page.getByRole("button",{name:"Start game",exact:true}).click();await expect.poll(()=>page.locator('.snake-board svg > rect').nth(1).getAttribute("x")).not.toBe("161");await page.getByLabel("Pause",{exact:true}).click();await expect(page.locator(".board-overlay")).toContainText("On a little break");await page.getByRole("button",{name:"New game",exact:true}).click();await expect(page.getByRole("button",{name:"Start game",exact:true})).toBeVisible();});
test("falling blocks drops and scores",async({page})=>{await page.goto("/games/tetris");await page.getByRole("button",{name:"Start game",exact:true}).click();await page.getByLabel("Rotate piece",{exact:true}).click();await page.getByLabel("Hard drop",{exact:true}).click();await expect.poll(async()=>Number(await page.locator(".game-stats strong").first().textContent())).toBeGreaterThan(0);await expect.poll(()=>page.locator(".block-cell.filled").count()).toBeGreaterThanOrEqual(8);await page.getByRole("button",{name:"Pause",exact:true}).click();await expect(page.locator(".board-overlay")).toContainText("And breathe.");});
test("2048 arrows change the board",async({page})=>{await page.goto("/games/2048");await expect(page.locator(".number-tile")).toHaveCount(16);const before=await page.locator(".number-board").innerText();await page.getByLabel("Move left",{exact:true}).click();await page.getByLabel("Move down",{exact:true}).click();await expect(page.locator(".number-board")).not.toHaveText(before);});
test("minesweeper first reveal is safe and flag toggles",async({page})=>{await page.goto("/games/minesweeper");await page.getByLabel("Square 28",{exact:true}).click();await expect(page.locator(".mine-board .revealed").first()).toBeVisible();await expect(page.locator(".exploded")).toHaveCount(0);await page.getByRole("button",{name:"Flag mode",exact:true}).click();const hidden=page.locator(".mine-board button:not(.revealed)").first();await hidden.click();await expect(page.locator(".mine-counter")).toContainText("9 remaining");await hidden.click();await expect(page.locator(".mine-counter")).toContainText("10 remaining");});
test("sliding puzzle moves adjacent tile",async({page})=>{await page.goto("/games/sliding-puzzle");await expect(page.locator(".sliding-board button")).toHaveCount(16);const empty=await page.locator(".sliding-board button").evaluateAll(buttons=>buttons.findIndex(button=>!button.textContent));const neighbor=empty>=4?empty-4:empty+4;await page.locator(".sliding-board button").nth(neighbor).click();await expect(page.locator(".game-stats strong")).toHaveText("1");});
test("memory flips a pair and counts a move",async({page})=>{await page.goto("/games/memory");await page.getByLabel("Card 1",{exact:true}).click();await page.getByLabel("Card 2",{exact:true}).click();await expect(page.locator(".game-stats strong")).toHaveText("1");await expect(page.locator(".memory-board button.face-up")).toHaveCount(2);});
test("color echo plays a sequence and accepts it",async({page})=>{await page.addInitScript(()=>{Math.random=()=>0;});await page.goto("/games/simon");await expect(page.getByRole("button",{name:"Start game",exact:true})).toBeVisible();await page.clock.install({time:new Date("2026-01-01T00:00:00Z")});await page.clock.pauseAt(new Date("2026-01-01T00:01:00Z"));await page.getByRole("button",{name:"Start game",exact:true}).click();await page.clock.runFor(400);await expect(page.getByLabel("Rose pad")).toHaveClass(/lit/);await page.clock.runFor(800);await expect(page.locator(".game-status")).toContainText("Your turn");await page.getByLabel("Rose pad").click();await expect(page.locator(".game-stats strong").first()).toHaveText("1");});
test("math round can be completed",async({page})=>{await page.goto("/games/math-quest");for(let round=0;round<10;round++){const text=await page.locator(".math-question>span").innerText();const match=text.match(/(\d+) ([+−]) (\d+)/)!;const answer=match[2]==="+"?Number(match[1])+Number(match[3]):Number(match[1])-Number(match[3]);await page.locator(".answer-grid").getByRole("button",{name:String(answer),exact:true}).click();await page.getByRole("button",{name:round===9?"Finish":"Next question",exact:true}).click();}await expect(page.locator(".game-status")).toHaveText("You earned 10 of 10 stars!");});
test("color round can be completed",async({page})=>{await page.goto("/games/color-lab");for(let round=0;round<10;round++){const name=(await page.locator(".color-question h3").innerText()).replace("Find ","");await page.getByLabel(new RegExp(`^${name} swatch$`,"i")).click();await page.getByRole("button",{name:round===9?"Finish":"Next color",exact:true}).click();}await expect(page.locator(".game-status")).toContainText("whole rainbow");});
test("word scramble accepts the solution",async({page})=>{await page.goto("/games/word-scramble");const dictionary=["APPLE","OCEAN","MUSIC","PLANT","HOUSE","TRAIN","CLOUD","SMILE","EARTH","LIGHT"];const letters=(await page.locator(".word-letters").innerText()).replace(/\s/g,"").split("").sort().join("");const answer=dictionary.find(word=>word.split("").sort().join("")===letters)!;await page.getByLabel("Your word",{exact:true}).fill(answer);await page.getByRole("button",{name:"Check",exact:true}).click();await expect(page.locator(".game-status")).toContainText("Wonderful");await page.getByRole("button",{name:"Next word",exact:true}).click();await expect(page.locator(".game-stats strong")).toHaveText("1");});
test("mole patrol registers a hit",async({page})=>{await page.goto("/games/whack-a-mole");await page.getByRole("button",{name:"Start game",exact:true}).click();await page.getByRole("button",{name:/Hole \d+, mole/}).click();await expect(page.locator(".game-stats strong").first()).toHaveText("1");await page.getByRole("button",{name:"Pause",exact:true}).click();await expect(page.locator(".game-status")).toContainText("Garden break");});
test("Sudoku input, check and erase",async({page})=>{await page.goto("/games/sudoku");const cell=page.getByRole("button",{name:/Row \d+ column \d+: empty/}).first();const label=await cell.getAttribute("aria-label");await cell.click();await page.locator(".number-pad").getByRole("button",{name:"1",exact:true}).click();await expect(page.getByLabel(label!.replace("empty","1"),{exact:true})).toHaveText("1");await page.getByLabel("Erase selected cell").click();await expect(page.getByLabel(label!,{exact:true})).toBeEmpty();await page.getByRole("button",{name:"Check",exact:true}).click();await expect(page.locator(".game-status")).toContainText("Looking good");});
test("local lesson video loads and plays",async({page})=>{await page.goto("/games/math-quest");const video=page.locator("video");await video.evaluate(async element=>{const media=element as HTMLVideoElement;media.muted=true;await media.play();});await expect.poll(()=>video.evaluate(element=>(element as HTMLVideoElement).currentTime)).toBeGreaterThan(0);expect(await video.evaluate(element=>(element as HTMLVideoElement).videoWidth)).toBe(960);await video.evaluate(element=>(element as HTMLVideoElement).pause());});
test("SEO endpoints and server-rendered game links",async({request})=>{const home=await request.get("/");const html=await home.text();expect(html).toContain('href="/games/snake"');expect(html).toContain('rel="canonical"');const map=await request.get("/sitemap.xml");expect(await map.text()).toContain("/games/color-lab");const robots=await request.get("/robots.txt");expect(await robots.text()).toContain("sitemap.xml");for(const route of ["/about","/privacy","/terms"]){expect((await request.get(route)).status()).toBe(200);}expect((await request.get("/games/not-a-game")).status()).toBe(404);});

test("word search can be solved in either direction", async ({ page }) => {
  await page.goto("/games/word-search");
  await expect(page.locator(".word-search-board button")).toHaveCount(64);
  const cells = await page.locator(".word-search-board button").allTextContents();
  const words = await page.locator(".word-search-list li span").allTextContents();
  for (const word of words) {
    let found: number[] = [];
    for (let start = 0; start < 64 && !found.length; start++) {
      for (let end = 0; end < 64; end++) {
        const line = selectionLine(start, end, 8);
        if (line.map(index => cells[index]).join("") === word) { found = line; break; }
      }
    }
    expect(found.length).toBe(word.length);
    await page.locator(".word-search-board button").nth(found.at(-1)!).click();
    await page.locator(".word-search-board button").nth(found[0]).click();
  }
  await expect(page.locator(".game-status")).toContainText("Every word discovered");
  await expect(page.locator(".word-search-list .discovered")).toHaveCount(words.length);
});

test("Lights Out can be solved and restarted", async ({ page }) => {
  await page.goto("/games/lights-out");
  await expect(page.locator(".lights-board button")).toHaveCount(25);
  const initial = await page.locator(".lights-board button").evaluateAll(buttons => buttons.map(button => button.getAttribute("aria-pressed") === "true"));
  let solution: number[] | null = null;
  for (let mask = 0; mask < 32; mask++) {
    let board = [...initial];
    const presses: number[] = [];
    for (let column = 0; column < 5; column++) if (mask & (1 << column)) { board = toggleLights(board, column); presses.push(column); }
    for (let row = 1; row < 5; row++) for (let column = 0; column < 5; column++) {
      if (board[(row - 1) * 5 + column]) { const cell = row * 5 + column; board = toggleLights(board, cell); presses.push(cell); }
    }
    if (board.every(lit => !lit)) { solution = presses; break; }
  }
  expect(solution).not.toBeNull();
  for (const cell of solution!) await page.locator(".lights-board button").nth(cell).click();
  await expect(page.locator(".game-status")).toContainText("All lights out");
  await page.getByRole("button", { name: "New game", exact: true }).click();
  await expect(page.locator(".light-on").first()).toBeVisible();
  await expect(page.locator(".game-stats strong")).toHaveText("0");
});

test("Code Breaker wins with duplicate colors and blocks incomplete guesses", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto("/games/code-breaker");
  await expect(page.getByRole("button", { name: "Check code", exact: true })).toBeDisabled();
  for (let index = 0; index < 4; index++) await page.getByLabel("Coral code color").click();
  await page.getByRole("button", { name: "Check code", exact: true }).click();
  await expect(page.locator(".game-status")).toHaveText("Code cracked in 1 try!");
  await expect(page.locator(".code-feedback")).toContainText("4 exact");
});

test("Code Breaker reveals the secret after eight misses", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto("/games/code-breaker");
  for (let attempt = 0; attempt < 8; attempt++) {
    for (let index = 0; index < 4; index++) await page.getByLabel("Blue code color").click();
    await page.getByRole("button", { name: "Check code", exact: true }).click();
  }
  await expect(page.locator(".code-history li")).toHaveCount(8);
  await expect(page.locator(".game-status")).toContainText("secret is revealed");
  await expect(page.locator(".code-secret span")).toHaveCount(4);
});

test("Dots and Boxes awards a box, retains turn and finishes", async ({ page }) => {
  await page.goto("/games/dots-and-boxes");
  for (const edge of ["horizontal edge 1", "horizontal edge 4", "vertical edge 1", "vertical edge 2"]) await page.getByLabel(edge, { exact: true }).click();
  await expect(page.getByLabel("Blue box", { exact: true })).toBeVisible();
  await expect(page.locator(".game-status")).toHaveText("Blue's turn");
  while (await page.locator(".dot-edge:not(:disabled)").count()) await page.locator(".dot-edge:not(:disabled)").first().click();
  await expect(page.locator(".dot-box.owned")).toHaveCount(9);
  await expect(page.locator(".game-status")).toContainText("wins!");
});

test("Rock Paper Scissors reaches a three-point match win", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto("/games/rock-paper-scissors");
  for (let round = 0; round < 3; round++) {
    await page.getByLabel("Choose paper").click();
    await expect(page.getByLabel("Choose paper")).toBeDisabled();
    if (round < 2) await page.getByRole("button", { name: "Next round", exact: true }).click();
  }
  await expect(page.locator(".game-status")).toHaveText("You won the match!");
  await expect(page.locator(".game-stats strong").first()).toHaveText("3");
});

test("Number Trail rejects out-of-order choices and completes", async ({ page }) => {
  await page.goto("/games/number-trail");
  await page.getByLabel("Number 4", { exact: true }).click();
  await expect(page.locator(".game-status")).toContainText("Look for 1");
  for (let number = 1; number <= 16; number++) await page.getByLabel(`Number ${number}`, { exact: true }).click();
  await expect(page.locator(".game-status")).toContainText("A perfect trail");
  await expect(page.locator(".trail-done")).toHaveCount(16);
});

test("Word Rescue wins and locks the alphabet", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto("/games/word-rescue");
  for (const letter of "RAINBOW") await page.getByLabel(`Guess ${letter}`, { exact: true }).click();
  await expect(page.locator(".game-status")).toContainText("Word rescued");
  await expect(page.locator(".letter-keyboard button:enabled")).toHaveCount(0);
});

test("Word Rescue uses only six distinct misses and reveals answer", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto("/games/word-rescue");
  for (const letter of "CDEFHJ") await page.getByLabel(`Guess ${letter}`, { exact: true }).click();
  await expect(page.locator(".game-status")).toContainText("The word was RAINBOW");
  await expect(page.locator(".chance-used")).toHaveCount(6);
});

test("Reaction Time handles early taps and saves a valid result", async ({ page }) => {
  await page.goto("/games/reaction-time");
  await page.getByLabel("Start reaction test").click();
  await page.getByLabel("Wait for green").click();
  await expect(page.locator(".game-status")).toContainText("too soon");
  await page.getByLabel("Try again", { exact: true }).click();
  await page.getByLabel("Tap now", { exact: true }).click();
  await expect(page.locator(".game-status")).toContainText("ms.");
  const best = Number(await page.locator(".game-stats strong").last().innerText());
  expect(best).toBeGreaterThan(0);
  await page.reload();
  await expect(page.locator(".game-stats strong").last()).toHaveText(String(best));
});

test("spoken hints use the current prompt and sound preference persists", async ({ page }) => {
  await page.goto("/games/number-trail");
  await page.evaluate(() => {
    speechSynthesis.speak = (utterance: SpeechSynthesisUtterance) => { document.body.dataset.spoken = utterance.text; };
  });
  await page.getByLabel("Read aloud", { exact: true }).click();
  await expect(page.locator("body")).toHaveAttribute("data-spoken", "Find the number 1");
  await page.getByLabel("Enable sound", { exact: true }).click();
  await page.reload();
  await expect(page.getByLabel("Mute sound", { exact: true })).toBeVisible();
});

test("invalid stored preferences do not break catalog or theme", async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("gw-favorites", "{invalid"); localStorage.setItem("gw-theme", "unknown"); });
  await page.goto("/");
  await expect(page.locator(".game-card")).toHaveCount(games.length);
  await page.locator(".favorites-filter").click();
  await expect(page.locator(".empty-state")).toBeVisible();
});

test("catalog keyboard access, sorting and all category counts", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.getByLabel("Sort games").selectOption("az");
  const names = await page.locator(".card-info h3").allTextContents();
  expect(names).toEqual([...names].sort((first, second) => first.localeCompare(second)));
  for (const category of new Set(games.map(game => game.category))) {
    await page.goto(`/?category=${encodeURIComponent(category)}`);
    await expect(page.locator(".game-card")).toHaveCount(games.filter(game => game.category === category).length);
  }
});

test("all game metadata and security headers are present", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const game of games) {
    const response = await request.get(`/games/${game.slug}`);
    const html = await response.text();
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(html).toContain('application/ld+json');
    expect(html).toContain('rel="canonical"');
    expect(html).toContain('property="og:title"');
    expect(sitemap).toContain(`/games/${game.slug}`);
  }
});

for (const route of ["/", "/about", "/privacy", "/terms", "/not-a-page", ...games.map(game => `/games/${game.slug}`)]) {
  test(`accessibility and typography ${route}`, async ({ page }, testInfo) => {
    await page.goto(route);
    await expect(page.locator(route.startsWith("/games/") ? ".game-inner" : "main").first()).toBeVisible();
    if (process.env.TEST_SOURCE_STYLES === "1") {
      for (const file of ["globals.css", "games.css", "bonus-games.css", "festival-games.css"]) await page.addStyleTag({ content: await readFile(`src/app/${file}`, "utf8") });
    }
    await page.evaluate(() => document.fonts.ready);
    for (const theme of ["light", "dark"]) {
      if (theme === "dark") await page.getByLabel("Switch to dark mode", { exact: true }).click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      expect(await page.evaluate(() => {
        const bodyFont = getComputedStyle(document.body).fontFamily;
        const headingFont = getComputedStyle(document.querySelector("h1")!).fontFamily;
        return document.fonts.status === "loaded" && bodyFont.includes("Jakarta") && headingFont.includes("Outfit");
      })).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const clipped = await page.locator("main h1, main h2, main h3, main p, main button, main label, .card-info").evaluateAll(elements => elements.filter(element => {
        const style = getComputedStyle(element);
        if (!element.getClientRects().length || style.visibility === "hidden" || !element.textContent?.trim()) return false;
        if (!element.clientWidth || element.scrollWidth <= element.clientWidth + 3 && element.scrollHeight <= element.clientHeight + 3) return false;
        const bounds = element.getBoundingClientRect();
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (!node.textContent?.trim() || node.parentElement?.closest("svg")) continue;
          const range = document.createRange(); range.selectNodeContents(node);
          for (const text of range.getClientRects()) if (text.width > 0 && (text.left < bounds.left - 3 || text.right > bounds.right + 3 || text.top < bounds.top - 3 || text.bottom > bounds.bottom + 3)) return true;
        }
        return false;
      }).map(element => `${element.tagName}.${element.className}: ${element.textContent?.trim().slice(0, 70)}`));
      expect(clipped, `${route} ${theme}: clipped text`).toEqual([]);
      const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect.soft(result.violations.map(violation => ({ theme, rule: violation.id, nodes: violation.nodes.slice(0, 6).map(node => `${node.target.join(" ")}: ${node.failureSummary}`) }))).toEqual([]);
      await page.screenshot({ path: `artifacts/pages/${route.replaceAll("/", "_") || "home"}-${testInfo.project.name}-${theme}.png`, fullPage: true, animations: "disabled" });
    }
  });
}

test("narrow and tablet layouts have no horizontal overflow", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Additional viewports are covered once");
  for (const width of [320, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    for (const slug of ["", "rock-paper-scissors", "word-rescue", "word-search", "dots-and-boxes", "code-breaker", "bridge-crossing", "spot-difference", "clock-match", "brick-breaker", "number-detective", "nonogram"]) {
      await page.goto(slug ? `/games/${slug}` : "/");
      await expect(page.locator(slug ? ".game-inner" : ".game-card").first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${slug || "home"} at ${width}px`).toBe(true);
    }
  }
});

test("maze can be solved with walls blocked and route hint", async ({ page }) => {
  await page.goto("/games/maze-run");
  const board = page.locator(".maze-board");
  await expect(board.locator(":scope > span")).toHaveCount(225);
  const walls = await board.locator(":scope > span").evaluateAll(cells => cells.map(cell => cell.getAttribute("data-wall") === "true"));
  const start = Number(await board.getAttribute("data-position"));
  const exit = Number(await board.getAttribute("data-exit"));
  await page.getByLabel("Move up", { exact: true }).click();
  await expect(board).toHaveAttribute("data-position", String(start));
  await page.getByLabel("Show route hint").click();
  await expect(page.locator(".maze-hint").first()).toBeVisible();
  const route = mazePath({ width: 15, walls, start, exit });
  for (let index = 1; index < route.length; index++) {
    const delta = route[index] - route[index - 1];
    await page.getByLabel(`Move ${delta === 1 ? "right" : delta === -1 ? "left" : delta > 0 ? "down" : "up"}`, { exact: true }).click();
  }
  await expect(page.locator(".game-status")).toContainText("Exit found");
});

test("Hanoi solves, undoes and switches difficulty", async ({ page }) => {
  await page.goto("/games/tower-of-hanoi");
  for (const [from, to] of [[0, 2], [0, 1], [2, 1], [0, 2], [1, 0], [1, 2], [0, 2]]) {
    await page.locator(".hanoi-tower").nth(from).click(); await page.locator(".hanoi-tower").nth(to).click();
  }
  await expect(page.locator(".game-status")).toContainText("Tower complete in 7 moves");
  await page.getByLabel("Undo move").click(); await expect(page.locator(".game-stats strong")).toHaveText("6");
  await page.getByRole("combobox", { name: /Discs/ }).selectOption("4"); await expect(page.locator(".hanoi-disc")).toHaveCount(4);
  await expect(page.locator(".game-stats strong")).toHaveText("0");
});

test("Flood Fill absorbs connected regions, undoes and wins", async ({ page }) => {
  await page.goto("/games/flood-fill");
  await expect(page.locator(".flood-cell")).toHaveCount(36);
  const original = await page.locator(".flood-cell").evaluateAll(cells => cells.map(cell => Number(cell.getAttribute("data-color"))));
  let board = [...original];
  await page.getByLabel(`Flood ${floodColors[(board[0] + 1) % 5]}`).click();
  await page.getByLabel("Undo move").click();
  expect(await page.locator(".flood-cell").evaluateAll(cells => cells.map(cell => Number(cell.getAttribute("data-color"))))).toEqual(original);
  for (let step = 0; step < 50 && !board.every(color => color === board[0]); step++) {
    const choices = floodColors.map((_, color) => {
      const next = floodBoard(board, color);
      const connected = floodBoard(next, (color + 1) % 5).filter((value, cell) => value !== next[cell]).length;
      return { color, next, connected: color === board[0] ? -1 : connected };
    }).sort((first, second) => second.connected - first.connected);
    await page.getByLabel(`Flood ${floodColors[choices[0].color]}`).click(); board = choices[0].next;
  }
  await expect(page.locator(".game-status")).toContainText("One color in");
});

test("Nonogram checks clues, supports empty marks and completes", async ({ page }) => {
  await page.goto("/games/nonogram");
  await page.getByRole("button", { name: "Check puzzle", exact: true }).click();
  await expect(page.locator(".game-status")).toContainText("don't match");
  const clues = await page.locator(".nonogram-row").allTextContents();
  const solution = nonogramPatterns.find(pattern => clues.every((clue, row) => nonogramClues(pattern.slice(row * 5, row * 5 + 5)).join(" ") === clue))!;
  expect(solution).toBeTruthy();
  const empty = solution.indexOf(false);
  await page.getByLabel("Mark empty squares").click(); await page.locator(".nonogram-board button").nth(empty).click();
  await expect(page.locator(".nonogram-board button").nth(empty)).toHaveAttribute("aria-label", /marked empty/);
  await page.getByLabel("Fill squares").click();
  for (let cell = 0; cell < 25; cell++) if (solution[cell]) await page.locator(".nonogram-board button").nth(cell).click();
  await page.getByRole("button", { name: "Check puzzle", exact: true }).click();
  await expect(page.locator(".game-status")).toHaveText("Picture complete!");
});

test("Alphabet Trail rejects out-of-order letters and finishes A to Z", async ({ page }) => {
  await page.goto("/games/alphabet-trail");
  await page.getByLabel("Letter Z", { exact: true }).click(); await expect(page.locator(".game-stats strong")).toHaveText("0");
  for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") await page.getByLabel(`Letter ${letter}`, { exact: true }).click();
  await expect(page.locator(".game-status")).toContainText("every letter");
});

test("Number Detective validates guesses, wins and reveals exhausted rounds", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => .41; });
  await page.goto("/games/number-detective");
  const input = page.getByLabel("Your guess", { exact: true });
  await input.fill("0"); await page.getByRole("button", { name: "Check number" }).click();
  await expect(page.locator(".game-stats strong")).toHaveText("0");
  await input.fill("50"); await page.getByRole("button", { name: "Check number" }).click();
  await expect(page.locator(".game-status")).toContainText("lower");
  await input.fill("42"); await page.getByRole("button", { name: "Check number" }).click();
  await expect(page.locator(".game-status")).toContainText("Mystery solved");
  await page.getByRole("button", { name: "New game", exact: true }).click();
  for (let guess = 1; guess <= 7; guess++) { await input.fill(String(guess)); await page.getByRole("button", { name: "Check number" }).click(); }
  await expect(page.locator(".game-status")).toContainText("The number was 42");
});

test("Chess Tactics accepts legal mates through all three puzzles", async ({ page }) => {
  await page.goto("/games/chess-tactics");
  for (let round = 0; round < tacticPuzzles.length; round++) {
    const move = matingMoves(tacticPuzzles[round].fen)[0];
    await page.getByLabel("Hint: show a piece").click();
    await expect(page.locator(".tactics-selected")).toHaveCount(1);
    await page.getByRole("button", { name: new RegExp(`^${move.from} White`) }).click();
    await page.getByRole("button", { name: new RegExp(`^${move.to}( |$)`) }).click();
    if (round < 2) await page.getByRole("button", { name: "Next puzzle" }).click();
  }
  await expect(page.locator(".game-status")).toContainText("Three checkmates");
});

test("Queens Garden detects attacks and accepts eight peaceful queens", async ({ page }) => {
  await page.goto("/games/queens-garden");
  await page.locator(".queens-board button").nth(0).click(); await page.locator(".queens-board button").nth(1).click();
  await expect(page.locator(".queen-conflict")).toHaveCount(2);
  await page.getByRole("button", { name: "New game", exact: true }).click();
  for (const [row, column] of [0, 4, 7, 5, 2, 6, 1, 3].entries()) await page.locator(".queens-board button").nth(row * 8 + column).click();
  await expect(page.locator(".game-status")).toContainText("Eight queens");
});

test("Magic Square preserves givens and completes every fifteen-sum line", async ({ page }) => {
  await page.goto("/games/magic-square");
  await expect(page.locator(".magic-given")).toHaveCount(3);
  const numbers = (await page.locator(".magic-board button").allTextContents()).map(Number);
  const solution = magicSolutions.find(candidate => numbers.every((value, cell) => !value || value === candidate[cell]))!;
  for (let cell = 0; cell < 9; cell++) if (!numbers[cell]) { await page.locator(".magic-board button").nth(cell).click(); await page.getByLabel(`Place ${solution[cell]}`, { exact: true }).click(); }
  await page.getByRole("button", { name: "Check square" }).click();
  await expect(page.locator(".game-status")).toContainText("Every line is 15");
});

test("Bridge Crossing completes in seventeen minutes and supports undo", async ({ page }) => {
  await page.goto("/games/bridge-crossing");
  for (const travelers of [[1, 2], [1], [3, 4], [2], [1, 2]]) {
    for (const traveler of travelers) await page.getByRole("button", { name: new RegExp(`^Traveler ${traveler},`) }).click();
    await page.getByRole("button", { name: "Cross bridge" }).click();
  }
  await expect(page.locator(".game-status")).toContainText("Everyone across");
  await expect(page.locator(".game-stats strong")).toHaveText("17");
  await page.getByLabel("Undo crossing").click(); await expect(page.locator(".game-stats strong")).toHaveText("15");
});

test("Word Builder validates vocabulary and completes eight words", async ({ page }) => {
  await page.goto("/games/word-builder");
  await expect(page.locator(".builder-letters button")).toHaveCount(6);
  const letters = (await page.locator(".builder-letters button").allTextContents()).sort().join("");
  const kit = wordKits.find(candidate => candidate.letters.split("").sort().join("") === letters)!;
  const input = page.getByLabel("Your word", { exact: true });
  await input.fill("ZZZ"); await page.getByRole("button", { name: "Add word" }).click();
  await expect(page.locator(".game-stats strong")).toHaveText("0");
  for (const word of kit.words.slice(0, 8)) { await input.fill(word); await page.getByRole("button", { name: "Add word" }).click(); }
  await expect(page.locator(".game-status")).toContainText("Eight words discovered");
});

test("Word Ladder rejects unchanged words and reaches the target", async ({ page }) => {
  await page.goto("/games/word-ladder");
  const start = await page.locator(".ladder-goal span").innerText(), target = await page.locator(".ladder-goal strong").innerText();
  await page.getByLabel("Next word", { exact: true }).fill(start); await page.getByRole("button", { name: "Take step" }).click();
  await expect(page.locator(".game-status")).toContainText("exactly one");
  for (const word of ladderPath(start, target).slice(1)) { await page.getByLabel("Next word", { exact: true }).fill(word); await page.getByRole("button", { name: "Take step" }).click(); }
  await expect(page.locator(".game-status")).toHaveText("Word ladder complete!");
});

for (const slug of ["missing-letter", "word-categories", "clock-match", "fraction-match", "shape-sort", "sequence-lab"]) test(`${slug} completes five correct learning questions`, async ({ page }) => {
  await page.goto(`/games/${slug}`);
  for (let round = 0; round < 5; round++) {
    await expect(page.locator(".learning-options button").first()).toBeEnabled();
    let answer = "";
    if (slug === "missing-letter") { const shown = await page.locator(".missing-word").innerText(); const entry = spellingWords.find(entry => entry.word.length === shown.length && entry.word.split("").every((letter, index) => shown[index] === "_" || shown[index] === letter))!; answer = entry.word[shown.indexOf("_")]; }
    if (slug === "word-categories") { const word = await page.locator(".learning-word").innerText(); answer = wordGroups.find(group => group.words.includes(word))!.name; }
    if (slug === "clock-match") answer = (await page.locator(".learning-clock").getAttribute("aria-label"))!.replace("Clock showing ", "");
    if (slug === "fraction-match") answer = `${await page.locator(".fraction-shaded").count()}/${await page.locator(".fraction-art>span").count()}`;
    if (slug === "shape-sort") answer = (await page.locator(".shape-stage svg").getAttribute("aria-label"))!;
    if (slug === "sequence-lab") { const values = (await page.locator(".sequence-track span").allTextContents()).map(Number); answer = String(values[2] - values[1] === values[1] - values[0] ? values[3] + values[1] - values[0] : values[3] * 2); }
    await page.locator(".learning-options").getByRole("button", { name: answer, exact: true }).click();
    await expect(page.locator(".game-status")).toHaveText("That's right!");
    await page.getByRole("button", { name: round === 4 ? "Finish round" : "Next question", exact: true }).click();
  }
  await expect(page.locator(".game-status")).toContainText("5 of 5 correct");
});

test("Odd One Out completes five changing boards", async ({ page }) => {
  await page.goto("/games/odd-one-out");
  await expect(page.locator(".odd-board button")).toHaveCount(12);
  for (let round = 0; round < 5; round++) {
    await expect(page.locator(".learning-progress")).toContainText(`${round} of 5 found`);
    const names = await page.locator(".odd-board svg").evaluateAll(elements => elements.map(element => element.getAttribute("aria-label")));
    const odd = names.findIndex(name => names.filter(other => other === name).length === 1);
    await page.locator(".odd-board button").nth(odd).click();
    await expect(page.locator(".learning-progress")).toContainText(`${round + 1} of 5 found`);
  }
  await expect(page.locator(".game-status")).toContainText("Five differences spotted");
});

test("Spot the Difference identifies all three changed tiles", async ({ page }) => {
  await page.goto("/games/spot-difference");
  await expect(page.locator(".difference-board .learning-shape")).toHaveCount(32);
  const original = await page.locator(".difference-board").first().locator(".learning-shape").evaluateAll(elements => elements.map(element => element.getAttribute("aria-label")));
  const changed = await page.locator(".difference-board").last().locator(".learning-shape").evaluateAll(elements => elements.map(element => element.getAttribute("aria-label")));
  for (let cell = 0; cell < 16; cell++) if (original[cell] !== changed[cell]) await page.locator(".difference-board button").nth(cell).click();
  await expect(page.locator(".game-status")).toContainText("All three differences found");
});

for (const slug of ["brick-breaker", "paddle-rally", "mini-golf", "pinball"]) test(`${slug} renders moving physics and supports pause and restart`, async ({ page }) => {
  await page.goto(`/games/${slug}`);
  const canvas = page.locator(".physics-canvas");
  await expect(canvas).toBeVisible();
  expect(await canvas.evaluate(element => { const context = (element as HTMLCanvasElement).getContext("2d")!; const pixels = context.getImageData(0, 0, 420, 500).data; return new Set(Array.from(pixels).filter((_, index) => index % 4 !== 3)).size; })).toBeGreaterThan(20);
  const before = await canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL());
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  if (slug === "mini-golf") await page.getByRole("button", { name: "Putt", exact: true }).click();
  await expect.poll(() => canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL())).not.toBe(before);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.locator(".physics-game")).toHaveAttribute("data-phase", "paused");
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.getByRole("button", { name: "New game", exact: true }).click();
  await expect(page.locator(".physics-game")).toHaveAttribute("data-phase", "ready");
});

test("Sky Stack places a floor, pauses and restarts", async ({ page }) => {
  await page.goto("/games/sky-stack");
  await page.getByLabel("Start game", { exact: true }).click();
  await expect.poll(async () => Number(await page.locator(".moving-stack-block").getAttribute("x"))).toBeGreaterThan(85);
  await page.getByRole("button", { name: "Drop block" }).click();
  await expect(page.locator(".game-stats strong").first()).toHaveText("1");
  await page.getByLabel("Pause", { exact: true }).click();
  await expect(page.locator(".sky-stack-game")).toHaveAttribute("data-phase", "paused");
  await page.getByRole("button", { name: "New game", exact: true }).click();
  await expect(page.locator(".game-stats strong").first()).toHaveText("0");
});

test("Bubble Pop completes five target-color rounds", async ({ page }) => {
  await page.goto("/games/bubble-pop");
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  for (let round = 0; round < 5; round++) {
    const target = await page.locator(".bubble-target strong").innerText();
    for (let bubble = 0; bubble < 3; bubble++) await page.getByRole("button", { name: new RegExp(`^Bubble \\d+, ${target}$`) }).and(page.locator(":enabled")).first().click();
  }
  await expect(page.locator(".game-status")).toContainText("Five rounds popped");
  await expect(page.locator(".game-stats strong").first()).toHaveText("150");
});