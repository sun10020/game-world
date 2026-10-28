export function shuffle<T>(items:T[]):T[]{const result=[...items];for(let index=result.length-1;index>0;index--){const other=Math.floor(Math.random()*(index+1));[result[index],result[other]]=[result[other],result[index]];}return result;}
export function lineWinner(board:string[],width:number,height:number,length:number):string|null{
  for(let row=0;row<height;row++)for(let col=0;col<width;col++){
    const token=board[row*width+col];if(!token)continue;
    for(const [deltaX,deltaY] of [[1,0],[0,1],[1,1],[-1,1]]){
      if(Array.from({length},(_,offset)=>{const nextX=col+offset*deltaX,nextY=row+offset*deltaY;return nextX>=0&&nextX<width&&nextY>=0&&nextY<height&&board[nextY*width+nextX]===token;}).every(Boolean))return token;
    }
  }return null;
}
export function bestTicMove(board:string[]):number{
  function evaluate(cells:string[],turn:string):number{const winner=lineWinner(cells,3,3,3);if(winner)return winner==="O"?10:-10;if(cells.every(Boolean))return 0;const scores=cells.flatMap((value,index)=>{if(value)return [];const next=[...cells];next[index]=turn;return [evaluate(next,turn==="O"?"X":"O")];});return turn==="O"?Math.max(...scores):Math.min(...scores);}
  let best=-Infinity,move=-1;for(const index of [4,0,2,6,8,1,3,5,7]){if(board[index])continue;const next=[...board];next[index]="O";const score=evaluate(next,"X");if(score>best){best=score;move=index;}}return move;
}
export type Direction="up"|"down"|"left"|"right";
export function slide2048(board:number[],direction:Direction){const next=Array<number>(16).fill(0);let score=0;
  for(let line=0;line<4;line++){const indices=Array.from({length:4},(_,offset)=>direction==="left"?line*4+offset:direction==="right"?line*4+3-offset:direction==="up"?offset*4+line:(3-offset)*4+line);const values=indices.map(index=>board[index]).filter(Boolean);const merged:number[]=[];
    for(let index=0;index<values.length;index++){if(values[index]===values[index+1]){merged.push(values[index]*2);score+=values[index]*2;index++;}else merged.push(values[index]);}indices.forEach((index,offset)=>next[index]=merged[offset]||0);
  }return {board:next,score,moved:next.some((value,index)=>value!==board[index])};
}
export function add2048Tile(board:number[]){const next=[...board];const empty=next.flatMap((value,index)=>value===0?[index]:[]);if(empty.length)next[empty[Math.floor(Math.random()*empty.length)]]=Math.random()<.9?2:4;return next;}
export function canMove2048(board:number[]){return (["up","down","left","right"] as Direction[]).some(direction=>slide2048(board,direction).moved);}
export function neighbors(index:number,width:number,height:number){const row=Math.floor(index/width),col=index%width;const result:number[]=[];for(let deltaY=-1;deltaY<=1;deltaY++)for(let deltaX=-1;deltaX<=1;deltaX++){const nextX=col+deltaX,nextY=row+deltaY;if((deltaX||deltaY)&&nextX>=0&&nextX<width&&nextY>=0&&nextY<height)result.push(nextY*width+nextX);}return result;}
export function makeSlidingPuzzle(){const board=Array.from({length:16},(_,index)=>(index+1)%16);let empty=15;let previous=-1;for(let step=0;step<180;step++){const options=[empty-4,empty+4,empty%4>0?empty-1:-1,empty%4<3?empty+1:-1].filter(index=>index>=0&&index<16&&index!==previous);const chosen=options[Math.floor(Math.random()*options.length)];[board[empty],board[chosen]]=[board[chosen],board[empty]];previous=empty;empty=chosen;}return board;}
export const ludoTrack=Array.from({length:40},(_,index)=>index<10?[index,0]:index<20?[10,index-10]:index<30?[30-index,10]:[0,40-index]);
export function ludoPosition(progress:number,player:number){return (progress+player*20)%40;}
export function ludoLegal(progress:number,roll:number){return progress===-1?roll===6:progress<44&&progress+roll<=44;}