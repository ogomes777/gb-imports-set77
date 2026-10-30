/* GB IMPORTS — exact user-supplied PlushTile, embedded into the existing V43
 * static cinematic boot. Only app shell and performance tuning differ.
 */
import React from 'react';
import {createRoot} from 'react-dom/client';
import PlushTile from './PlushTileReference.tsx';
const api={current:null,rendered:false};
function mount(node){
 if(api.current)return;
 if(!node||!node.isConnected)return;
 const root=createRoot(node);
 const weak=innerWidth<720||!!navigator.connection?.saveData;
 root.render(React.createElement(PlushTile,{
   image:{src:'./assets/brand/gb-monograma-amarelo-preto.svg',alt:'GB'},
   background:'#050506',
   furColor:'#fffefa',
   scale:115,
   radius:49,
   puff:10,
   artwork:{fit:'contain',size:72,offsetY:0},
   fur:{density:weak?3.4:5,length:6,lift:5,frizz:6,flow:'art'},
   breeze:weak?5:8,
   entrance:{animate:true,delay:0.1,duration:1.5},
   response:{reach:5,parallax:4,strength:6},
   advanced:{glow:16,lens:20,seed:0,clump:28,crimp:20,
     sheen:25,bounce:9,emboss:50,shadow:47,tipFade:25,
     edgeFlow:75,rimLight:90,rimShare:26,hairWidth:.85,
     rootShade:60,undercoat:22,depthShade:45,
     keyFalloff:75,lightAngle:100,lightColor:'#FFF4E6',
     colorJitter:22,lightHeight:40}
 }));
 api.current={root,node};
 api.rendered=true;
 node.dataset.gbPlushMounted='true';
}
function finish(){
 if(api.current){api.current.root.unmount();api.current.node.textContent='';api.current=null;}
}
window.GBPlushV43={mount,finish,get mounted(){return api.rendered},get active(){return !!api.current}};
