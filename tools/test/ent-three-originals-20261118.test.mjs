import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const importer=fs.readFileSync('tim-ent-17nov-private-import.js','utf8');
const spanish=fs.readFileSync('espagnol-ent-exact.js','utf8');
const svt=fs.readFileSync('svt-pack.js','utf8');
const svtViewer=fs.readFileSync('svt-documents.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const expected=[
 {path:'pieces_ENT/10099_115426_11 Presente de indicativo LISTA 2.pdf',
  name:'11 Presente de indicativo LISTA 2.pdf',target:'ENTESP_2026',size:511949,
  hash:'1a7d9be5cb0bda99adb1a337795822f5295478bba7994ffcb0bb543bade816e3',kind:'pdf'},
 {path:'pieces_ENT/10099_115427_3D.pdf',name:'3D_original_ENT_17-11-2026.pdf',
  target:'ENTESP_2026',size:54288,kind:'pdf',
  hash:'9e6658b16436577febe7ee0e597c033496a8d82057258fcad9a475559e4a0215'},
 {path:"pieces_ENT/10099_115422_Capture d'écran 2026-11-17 102650.png",
  name:"Capture d'écran 2026-11-17 102650.png",target:'SVT_ENT_20261117',size:164054,
  hash:'d4d46ee96c3f22fedb0e1f6b42eabd2b837f6af0a1d4cd3b2f031524d11ecaf5',kind:'png'}
];
const hexBytes=hex=>Uint8Array.from(hex.match(/../g).map(x=>Number.parseInt(x,16)));
function harness(bad=false){
 const records=new Map();
 const old3D={fileName:'3D.pdf',sha256:'0'.repeat(64),size:1000};
 records.set('ENTESP_2026',[old3D]);
 const uploads=[],reads=[];
 const binaries=new Map();
 const byteToHash=new Map();
 for(let i=0;i<expected.length;i++){
  const row=expected[i],arr=new Uint8Array(row.size),marker=i+1;
  if(row.kind==='pdf'){
   arr.set([37,80,68,70,45],0);arr[5]=marker;
  }else{
   arr.set([137,80,78,71,13,10,26,10],0);arr[8]=marker;
  }
  binaries.set(row.path,arr);byteToHash.set(marker,row.hash);
 }
 class DummyNode{
  constructor(tag){this.tag=tag;this.children=[];this.style={};this.dataset={};this.disabled=false;this.textContent='';}
  append(...nodes){this.children.push(...nodes)}
  setAttribute(a,b){this[a]=b}
 }
 class DummyFile{
  constructor(parts,name,opts){this.bytes=parts[0];this.name=name;this.type=opts.type;this.size=this.bytes.byteLength;}
  async arrayBuffer(){return this.bytes.slice().buffer;}
 }
 const bridge={
  async list(kind,target){assert.equal(kind,'lesson');return records.get(target)||[];},
  async upload(kind,target,file,title,onProgress){
   assert.equal(kind,'lesson');assert.ok(target==='ENTESP_2026'||target==='SVT_ENT_20261117');
   const entry=expected.find(x=>x.name===file.name);
   assert.ok(entry,'Wrong file name uploaded');assert.equal(entry.target,target);assert.equal(entry.size,file.size);
   const meta={id:'upload-'+uploads.length,fileName:file.name,sha256:entry.hash,size:file.size};
   if(!records.has(target))records.set(target,[]);
   records.get(target).push(meta);uploads.push({kind,target,meta,title});
   binaries.set(meta.id,file.bytes);onProgress(100);
  },
  async read(meta){
   reads.push(meta.id);
   const data=binaries.get(meta.id);
   assert.ok(data,'Uploaded binary not in fake private store');
   return {size:data.byteLength,arrayBuffer:async()=>data.slice().buffer};
  }
 };
 const window={
  __TIM_PARENT:true,__TIM_GUEST:false,__TIM_BRIDGE:{attachments:bridge},
  confirm:()=>true,
  JSZip:{loadAsync:async()=>({
   file:path=>{
    if(bad&&path===expected[1].path)return null;
    const bytes=binaries.get(path);
    return bytes?{async:async kind=>{assert.equal(kind,'uint8array');return bytes;}}:null;
   }
  })}
 };
 const context={
  window,document:{createElement:tag=>new DummyNode(tag)},
  File:DummyFile,
  crypto:{subtle:{digest:async(_algo,bytes)=>{
   const arr=new Uint8Array(bytes),mark=arr[0]===37?arr[5]:arr[8];
   const hex=byteToHash.get(mark);assert.ok(hex,'Unexpected digest input');
   return hexBytes(hex).buffer;
  }}}
 };
 vm.runInNewContext(importer,context,{filename:'tim-ent-17nov-private-import.js'});
 return {window,records,uploads,reads};
}

test('les trois documents ont des chemins ENT fixes, des tailles et des SHA-256, sans données privées publiques',()=>{
 for(const e of expected){
  assert.ok(importer.includes(e.path));assert.ok(importer.includes(e.name));
  assert.ok(importer.includes(e.target));assert.ok(importer.includes(e.hash));
 }
 assert.ok(!importer.includes('setDoc('));assert.ok(!importer.includes('deleteDoc('));
 assert.ok(!importer.includes('submitTimExercise'));assert.ok(!importer.includes('xp='));
 assert.ok(!importer.includes('.remove('));
});

test('un seul import conserve 3D.pdf historique, charge les trois vrais fichiers et ne crée pas de doublons',async()=>{
 const {window,records,uploads,reads}=harness();
 const panel=window.TIM_ENT_17NOV_IMPORT.panel();
 const input=panel.children.find(x=>x.tag==='input');
 const button=panel.children.find(x=>x.tag==='button');
 const status=panel.children.find(x=>x.tag==='p'&&x.role==='status');
 input.files=[{size:2200000}];
 await input.onchange();assert.equal(button.disabled,false);
 await button.onclick();
 assert.equal(uploads.length,3);
 assert.ok(records.get('ENTESP_2026').some(x=>x.fileName==='3D.pdf'&&x.sha256==='0'.repeat(64)),
  'Le 3D.pdf historique doit rester intact');
 assert.ok(records.get('ENTESP_2026').some(x=>x.fileName==='3D_original_ENT_17-11-2026.pdf'));
 assert.ok(records.get('SVT_ENT_20261117').some(x=>x.fileName.includes('Capture')));
 assert.equal(reads.length,3,'Chaque fichier privé est relu et comparé à sa source');
 assert.match(status.textContent,/3\/3 documents conformes/);
 await button.onclick();
 assert.equal(uploads.length,3,'Relancer ne doit pas dupliquer les pièces');
});

test('une archive incomplète est refusée avant toute écriture',async()=>{
 const {window,uploads}=harness(true);
 const panel=window.TIM_ENT_17NOV_IMPORT.panel();
 const input=panel.children.find(x=>x.tag==='input');
 const button=panel.children.find(x=>x.tag==='button');
 input.files=[{size:1500000}];await input.onchange();
 assert.equal(button.disabled,true);
 assert.equal(uploads.length,0);
});

test('espagnol : 3D du 17 novembre identifié par empreinte, pas par seul nom',()=>{
 assert.match(spanish,/sha256\|\|''/);
 assert.ok(spanish.includes(expected[1].hash));
 assert.match(spanish,/await nov17OriginalsInline\(directFiles\)/);
 assert.match(spanish,/spanishNov17Panel\(false\)/);
});

test('SVT : capture du 17 novembre associée à la séance et affichée automatiquement',()=>{
 assert.ok(svt.includes(expected[2].hash));
 assert.ok(svt.includes('"target":"SVT_ENT_20261117"'));
 assert.ok(svtViewer.includes("if(target==='SVT_ENT_20261117')"));
 assert.ok(svtViewer.includes('auto:true'));
});

test('application : importeur privé branché et scripts cache-bustés',()=>{
 assert.ok(html.includes('tim-ent-17nov-private-import.js?v=originaux-17nov-20261118-v1'));
 for(const src of ['svt-pack.js','svt-documents.js','svt-parcours.js','espagnol-ent-exact.js'])
  assert.ok(html.includes(src+'?v=originaux-17nov-20261118-v1'));
});
