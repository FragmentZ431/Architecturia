import { useMemo, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { PlanItem, ToolMode, useAppStore } from '../store';
const W=1200,H=800,SNAP=10;
const snap=(v:number)=>Math.round(v/SNAP)*SNAP;
export default function Plan2D(){
 const {items,tool,selectedId,addItem,updateItem,select,level}=useAppStore();
 const svg=useRef<SVGSVGElement>(null); const [draft,setDraft]=useState<{x:number;y:number}|null>(null); const [cursor,setCursor]=useState({x:0,y:0});
 const visible=useMemo(()=>items.filter(i=>i.level===level),[items,level]);
 const point=(e:PointerEvent<SVGSVGElement>)=>{const r=svg.current!.getBoundingClientRect();return {x:snap((e.clientX-r.left)*W/r.width),y:snap((e.clientY-r.top)*H/r.height)}};
 const down=(e:PointerEvent<SVGSVGElement>)=>{if(e.button!==0)return; const p=point(e);setCursor(p);
  if(tool==='wall'){setDraft(p);svg.current?.setPointerCapture(e.pointerId);return;}
  if(tool==='door'||tool==='window'||tool==='furniture'||tool==='pipe'){
   const sizes={door:[85,12],window:[90,10],furniture:[55,42],pipe:[100,8]} as const;const [width,height]=sizes[tool];
   addItem({id:crypto.randomUUID(),type:tool,x:p.x,y:p.y,angle:0,width,height,name:tool==='door'?'Porte':tool==='window'?'Fenêtre':tool==='pipe'?'Canalisation':'Mobilier',level});return;
  }
  if(tool==='select'||tool==='move'){
   const target=[...visible].reverse().find(i=>hit(i,p.x,p.y));select(target?.id??null);
   if(target){setDrag({id:target.id,start:p,origin:{x:target.x,y:target.y}});svg.current?.setPointerCapture(e.pointerId);} }
 };
 const [drag,setDrag]=useState<{id:string;start:{x:number;y:number};origin:{x:number;y:number}}|null>(null);
 const hit=(i:PlanItem,x:number,y:number)=>{if(i.type==='wall'){const x2=i.x2??i.x,y2=i.y2??i.y;const dx=x2-i.x,dy=y2-i.y,t=Math.max(0,Math.min(1,((x-i.x)*dx+(y-i.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-(i.x+t*dx),y-(i.y+t*dy))<16;}return Math.abs(x-i.x)<Math.max(i.width/2,18)&&Math.abs(y-i.y)<Math.max(i.height/2,18)};
 const move=(e:PointerEvent<SVGSVGElement>)=>{const p=point(e);setCursor(p);if(draft)return;if(drag){updateItem(drag.id,{x:drag.origin.x+p.x-drag.start.x,y:drag.origin.y+p.y-drag.start.y});}};
 const up=(e:PointerEvent<SVGSVGElement>)=>{if(draft){const p=point(e);if(Math.hypot(p.x-draft.x,p.y-draft.y)>8)addItem({id:crypto.randomUUID(),type:'wall',x:draft.x,y:draft.y,x2:p.x,y2:p.y,angle:Math.atan2(p.y-draft.y,p.x-draft.x)*180/Math.PI,width:18,height:18,name:'Mur',level});setDraft(null);}setDrag(null);};
 const angle=(i:PlanItem)=>Math.atan2((i.y2??i.y)-i.y,(i.x2??i.x)-i.x)*180/Math.PI;
 return <div className="plan-stage"><div className="plan-meta">Grille 0,25 m · coordonnées en unités de plan · niveau {level+1}</div><svg ref={svg} className="interactive-plan" viewBox={`0 0 ${W} ${H}`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={()=>{setDraft(null);setDrag(null)}}>
  <defs><pattern id="minorGrid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="#303944" strokeWidth=".7"/></pattern><pattern id="majorGrid" width="50" height="50" patternUnits="userSpaceOnUse"><rect width="50" height="50" fill="url(#minorGrid)"/><path d="M 50 0 L 0 0 0 50" fill="none" stroke="#46515f" strokeWidth="1.2"/></pattern></defs>
  <rect width={W} height={H} fill="url(#majorGrid)"/>
  {visible.map(i=>{const selected=i.id===selectedId;const common={stroke:selected?'#f0b4b8':'#c4ccd6',strokeWidth:selected?15:12,strokeLinecap:'square' as const};return <g key={i.id} onPointerDown={e=>{if(tool==='select'||tool==='move'){e.stopPropagation();select(i.id);setDrag({id:i.id,start:point(e as any),origin:{x:i.x,y:i.y}});svg.current?.setPointerCapture(e.pointerId)}}} style={{cursor:tool==='select'||tool==='move'?'move':'crosshair'}}>
   {i.type==='wall'?<line x1={i.x} y1={i.y} x2={i.x2??i.x} y2={i.y2??i.y} {...common}/>:<g transform={`translate(${i.x} ${i.y}) rotate(${i.angle})`}><rect x={-i.width/2} y={-i.height/2} width={i.width} height={i.height} rx={i.type==='pipe'?4:1} fill={i.type==='door'?'#a84d53':i.type==='window'?'#6b9dbb':i.type==='pipe'?'#b38b53':'#7d8b9b'} stroke={selected?'#fff':'#202832'} strokeWidth={selected?4:2}/>{i.type==='door'&&<path d={`M ${-i.width/2} 0 A ${i.width} ${i.width} 0 0 1 ${i.width/2} ${-i.height}`} fill="none" stroke="#f0c1c4" strokeWidth="2"/>}</g>}
   {selected&&<circle cx={i.x} cy={i.y} r="7" fill="#f05c65" stroke="#fff" strokeWidth="2"/>}
  </g>})}
  {draft&&<line x1={draft.x} y1={draft.y} x2={cursor.x} y2={cursor.y} stroke="#ef6068" strokeWidth="10" strokeDasharray="12 6"/>}
 </svg><div className="canvas-hint">{tool==='wall'?'Clique-glisse pour tracer un mur':tool==='select'||tool==='move'?'Clique un objet pour le sélectionner, puis glisse pour le déplacer':'Clique dans le plan pour placer : '+tool}</div></div>;
}
