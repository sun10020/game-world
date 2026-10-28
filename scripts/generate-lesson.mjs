import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||"chrome",headless:true});
try{
  const page=await browser.newPage();
  const bytes=await page.evaluate(async()=>{
    const canvas=document.createElement("canvas");canvas.width=960;canvas.height=540;
    const context=canvas.getContext("2d");
    const stream=canvas.captureStream(20);
    const recorder=new MediaRecorder(stream,{mimeType:"video/webm;codecs=vp9",videoBitsPerSecond:900000});
    const chunks=[];
    const complete=new Promise(resolve=>{recorder.ondataavailable=event=>chunks.push(event.data);recorder.onstop=async()=>resolve(Array.from(new Uint8Array(await new Blob(chunks,{type:"video/webm"}).arrayBuffer())));});
    const names=["One","Two","Three","Four","Five"],colors=["#df8176","#e5bf5d","#78aa85","#83a5d1","#ab8dc3"];
    const start=performance.now();
    function draw(now){const elapsed=now-start,count=Math.min(5,Math.floor(elapsed/2400)+1);context.fillStyle="#edf2df";context.fillRect(0,0,960,540);context.textAlign="center";context.fillStyle="#527449";context.font="22px sans-serif";context.fillText("GAME WORLD  /  LITTLE DISCOVERIES",480,80);context.fillStyle="#315c46";context.font="bold 70px sans-serif";context.fillText(`${names[count-1]} ${count===1?"circle":"circles"}`,480,192);for(let index=0;index<count;index++){context.fillStyle=colors[index];context.beginPath();context.arc(480-(count-1)*67.5+index*135,315,45,0,Math.PI*2);context.fill();context.fillStyle="#ffffff";context.font="bold 30px sans-serif";context.fillText(String(index+1),480-(count-1)*67.5+index*135,325);}context.fillStyle="#527449";context.font="26px sans-serif";context.fillText(count===5?"Five! You counted every one.":"Count each colorful circle with me.",480,445);context.fillStyle="#b8ce9c";context.fillRect(120,487,720,5);context.fillStyle="#527449";context.fillRect(120,487,720*Math.min(elapsed/12000,1),5);if(elapsed<12000)requestAnimationFrame(draw);else{recorder.stop();stream.getTracks().forEach(track=>track.stop());}}
    recorder.start();requestAnimationFrame(draw);return await complete;
  });
  await writeFile(new URL("../public/counting.webm",import.meta.url),Buffer.from(bytes));
  console.log(`Generated counting.webm: ${bytes.length} bytes`);
}finally{await browser.close();}