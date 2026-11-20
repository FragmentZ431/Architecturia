import { create } from 'zustand';
export type ViewMode = '2d' | '3d';
export type ToolMode = 'select' | 'move' | 'wall' | 'door' | 'window' | 'furniture' | 'pipe';
export type RenderStyle = 'realistic' | 'modular';
export type CameraMode = 'edit' | 'navigate' | 'cinematic';
export type PlanItem = { id:string; type:Exclude<ToolMode,'select'|'move'>; x:number; y:number; x2?:number; y2?:number; angle:number; width:number; height:number; name:string; level:number };
type AppState = { view:ViewMode; tool:ToolMode; renderStyle:RenderStyle; cameraMode:CameraMode; items:PlanItem[]; selectedId:string|null; level:number; setView:(v:ViewMode)=>void; setTool:(t:ToolMode)=>void; toggleStyle:()=>void; setCameraMode:(m:CameraMode)=>void; addItem:(item:PlanItem)=>void; updateItem:(id:string,patch:Partial<PlanItem>)=>void; removeSelected:()=>void; select:(id:string|null)=>void; setLevel:(n:number)=>void; };
export const useAppStore=create<AppState>((set)=>({view:'2d',tool:'select',renderStyle:'realistic',cameraMode:'edit',items:[],selectedId:null,level:0,setView:(view)=>set({view}),setTool:(tool)=>set({tool}),toggleStyle:()=>set(s=>({renderStyle:s.renderStyle==='realistic'?'modular':'realistic'})),setCameraMode:(cameraMode)=>set({cameraMode}),addItem:(item)=>set(s=>({items:[...s.items,item],selectedId:item.id})),updateItem:(id,patch)=>set(s=>({items:s.items.map(i=>i.id===id?{...i,...patch}:i)})),removeSelected:()=>set(s=>({items:s.items.filter(i=>i.id!==s.selectedId),selectedId:null})),select:(selectedId)=>set({selectedId}),setLevel:(level)=>set({level})}));
