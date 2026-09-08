const FILTERS = [
  ['zone','Zone'],['state','State'],['name','Customer Name'],['line','Line Name'],['item','Item Name'],['returns','Sales Return Value']
];
let rawData = [];
let selections = Object.fromEntries(FILTERS.map(([k])=>[k,new Set()]));

const $ = id => document.getElementById(id);
const fmt = n => Number.isFinite(n) ? n.toLocaleString(undefined,{maximumFractionDigits:0}) : '—';
const pct = n => Number.isFinite(n) ? `${n>=0?'+':''}${n.toFixed(1)}%` : '—';
const num = v => { const x = parseFloat(String(v??'').replace(/,/g,'').replace(/[^0-9.-]/g,'')); return Number.isFinite(x)?x:0; };
const norm = s => String(s??'').trim().toLowerCase().replace(/[_-]+/g,' ').replace(/\s+/g,' ');

function rowValue(row, aliases){
  const keys = Object.keys(row);
  const target = keys.find(k=>aliases.includes(norm(k)));
  return target ? row[target] : '';
}
function normalizeRow(r){
  const dateRaw=rowValue(r,['date','invoice date','sales date','order date']);
  const yearRaw=rowValue(r,['year','sales year']);
  const monthRaw=rowValue(r,['month','month no','month number']);
  let d=dateRaw?new Date(dateRaw):null;
  let year = yearRaw ? parseInt(yearRaw) : (d && !isNaN(d) ? d.getFullYear() : null);
  let month = monthRaw ? parseInt(monthRaw) : (d && !isNaN(d) ? d.getMonth()+1 : null);
  return {
    year, month,
    zone:String(rowValue(r,['zone','sales zone','region'])||'Unknown').trim(),
    state:String(rowValue(r,['state','sales state','province'])||'Unknown').trim(),
    name:String(rowValue(r,['name','customer name','customer','client name'])||'Unknown').trim(),
    line:String(rowValue(r,['line name','line','product line'])||'Unknown').trim(),
    item:String(rowValue(r,['item name','item','product name','sku name'])||'Unknown').trim(),
    sales:num(rowValue(r,['sales value','sales','net sales','sales amount','amount'])),
    returns:num(rowValue(r,['sales return value','return value','returns','sales returns','return amount']))
  };
}

function initFilters(){
  $('filters').innerHTML='';
  FILTERS.forEach(([key,label])=>{
    const box=document.createElement('div'); box.className='filter-box';
    box.innerHTML=`<label>${label}</label><select id="f-${key}" multiple></select>`;
    $('filters').appendChild(box);
    box.querySelector('select').addEventListener('change',e=>{
      selections[key]=new Set([...e.target.selectedOptions].map(o=>o.value));
      updateAll(key);
    });
  });
}

function valueForFilter(r,key){ return key==='returns'?String(r.returns):String(r[key]); }
function passes(r,excludeKey=null){
  return FILTERS.every(([k])=> k===excludeKey || selections[k].size===0 || selections[k].has(valueForFilter(r,k)));
}
function refreshFilterOptions(changedKey){
  FILTERS.forEach(([key])=>{
    const sel=$(`f-${key}`); const keep=selections[key];
    const vals=[...new Set(rawData.filter(r=>passes(r,key)).map(r=>valueForFilter(r,key)))];
    vals.sort((a,b)=>key==='returns'?Number(a)-Number(b):a.localeCompare(b));
    sel.innerHTML=vals.map(v=>`<option value="${escapeHtml(v)}" ${keep.has(v)?'selected':''}>${escapeHtml(v)}</option>`).join('');
    selections[key]=new Set([...keep].filter(v=>vals.includes(v)));
  });
}
function escapeHtml(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function filtered(){return rawData.filter(r=>passes(r));}

function sum(arr,key){return arr.reduce((a,r)=>a+(r[key]||0),0)}
function groupSum(data,key,metric='sales',year=null){
  const m=new Map(); data.filter(r=>year===null||r.year===year).forEach(r=>m.set(r[key],(m.get(r[key])||0)+r[metric])); return m;
}
function plot(id,data,layout={}){
  Plotly.react(id,data,{paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',font:{color:'#b7c3df',family:'Inter'},margin:{l:48,r:18,t:20,b:48},legend:{orientation:'h',y:1.12},xaxis:{gridcolor:'rgba(255,255,255,.06)',zerolinecolor:'rgba(255,255,255,.08)'},yaxis:{gridcolor:'rgba(255,255,255,.06)',zerolinecolor:'rgba(255,255,255,.08)'},...layout},{responsive:true,displaylogo:false});
}

function customerStats(data){
  const m=new Map();
  data.forEach(r=>{const k=`${r.state}|||${r.name}|||${r.zone}`; if(!m.has(k))m.set(k,{state:r.state,name:r.name,zone:r.zone,y25:0,y26:0,ret26:0}); const x=m.get(k); if(r.year===2025)x.y25+=r.sales; if(r.year===2026){x.y26+=r.sales;x.ret26+=r.returns;}});
  return [...m.values()].map(x=>({...x,growth:x.y25>0?((x.y26-x.y25)/x.y25)*100:null,returnRate:x.y26>0?(x.ret26/x.y26)*100:null}));
}

function updateKPIs(data){
  const y25=data.filter(r=>r.year===2025), y26=data.filter(r=>r.year===2026);
  const s25=sum(y25,'sales'),s26=sum(y26,'sales'),ret=sum(y26,'returns');
  $('kpi2025').textContent=fmt(s25); $('kpi2026').textContent=fmt(s26);
  $('kpiGrowth').textContent=s25>0?pct((s26-s25)/s25*100):'—';
  $('kpiReturns').textContent=fmt(ret); $('kpiReturnRate').textContent=s26>0?`${(ret/s26*100).toFixed(2)}%`:'—';
  $('kpi10k').textContent=fmt(customerStats(data).filter(x=>x.y26>=10000).length);
}

function updateCharts(data){
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthly=year=>Array.from({length:12},(_,i)=>data.filter(r=>r.year===year&&r.month===i+1).reduce((a,r)=>a+r.sales,0));
  plot('monthlyChart',[{x:months,y:monthly(2025),type:'scatter',mode:'lines+markers',name:'2025',line:{width:3}},{x:months,y:monthly(2026),type:'scatter',mode:'lines+markers',name:'2026',line:{width:3}}]);

  const zone26=[...groupSum(data,'zone','sales',2026)].sort((a,b)=>b[1]-a[1]);
  plot('zoneChart',[{x:zone26.map(x=>x[0]),y:zone26.map(x=>x[1]),type:'bar',marker:{line:{width:0}}}],{showlegend:false});
  const state26=[...groupSum(data,'state','sales',2026)].sort((a,b)=>b[1]-a[1]).slice(0,20);
  plot('stateChart',[{x:state26.map(x=>x[1]),y:state26.map(x=>x[0]),type:'bar',orientation:'h'}],{showlegend:false,margin:{l:90,r:18,t:20,b:45}});
  const item26=[...groupSum(data,'item','sales',2026)].sort((a,b)=>b[1]-a[1]).slice(0,15);
  plot('itemChart',[{x:item26.map(x=>x[1]),y:item26.map(x=>x[0]),type:'bar',orientation:'h'}],{showlegend:false,margin:{l:125,r:18,t:20,b:45}});

  const zones=[...new Set(data.map(r=>r.zone))];
  const rr=zones.map(z=>{const d=data.filter(r=>r.zone===z&&r.year===2026);const s=sum(d,'sales');return [z,s?sum(d,'returns')/s*100:0]}).sort((a,b)=>b[1]-a[1]);
  plot('returnZoneChart',[{x:rr.map(x=>x[0]),y:rr.map(x=>x[1]),type:'bar'}],{showlegend:false,yaxis:{ticksuffix:'%',gridcolor:'rgba(255,255,255,.06)'}});
}

function stateOptions(stats){
  const states=[...new Set(stats.map(x=>x.state))].sort();
  ['growthState','declineState'].forEach(id=>{
    const old=$(id).value; $(id).innerHTML=['All States',...states].map(s=>`<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
    if([...$(id).options].some(o=>o.value===old))$(id).value=old;
  });
}
function renderGrowthTables(stats){
  stateOptions(stats);
  const render=(id,state,kind)=>{
    let arr=stats.filter(x=>state==='All States'||x.state===state).filter(x=>x.growth!==null);
    if(kind==='growth')arr=arr.filter(x=>x.growth>=10).sort((a,b)=>b.growth-a.growth).slice(0,10);
    else arr=arr.filter(x=>x.growth<=-10).sort((a,b)=>a.growth-b.growth).slice(0,10);
    $(id).innerHTML=arr.length?arr.map((x,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(x.name)}</td><td>${fmt(x.y25)}</td><td>${fmt(x.y26)}</td><td class="${kind==='growth'?'pos':'neg'}">${pct(x.growth)}</td></tr>`).join(''):`<tr><td colspan="5">No matching customers</td></tr>`;
  };
  render('growthTable',$('growthState').value,'growth'); render('declineTable',$('declineState').value,'decline');
}
function render10k(stats){
  const arr=stats.filter(x=>x.y26>=10000).sort((a,b)=>b.y26-a.y26);
  $('tenKCount').textContent=`${arr.length} customers`;
  $('tenKTable').innerHTML=arr.length?arr.map((x,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(x.name)}</td><td>${escapeHtml(x.state)}</td><td>${escapeHtml(x.zone)}</td><td>${fmt(x.y25)}</td><td>${fmt(x.y26)}</td><td class="${(x.growth??0)>=0?'pos':'neg'}">${pct(x.growth)}</td><td>${fmt(x.ret26)}</td><td>${x.returnRate!==null?x.returnRate.toFixed(2)+'%':'—'}</td></tr>`).join(''):`<tr><td colspan="9">No customers at or above 10,000</td></tr>`;
}
function updateAll(changedKey=null){
  if(!rawData.length)return;
  refreshFilterOptions(changedKey); const data=filtered();
  updateKPIs(data); updateCharts(data); const stats=customerStats(data); renderGrowthTables(stats); render10k(stats);
  $('dataStatus').textContent=`${data.length.toLocaleString()} / ${rawData.length.toLocaleString()} rows`;
  $('emptyState').classList.add('hidden');
}
function loadRows(rows,source){
  rawData=rows.map(normalizeRow).filter(r=>[2025,2026].includes(r.year));
  selections=Object.fromEntries(FILTERS.map(([k])=>[k,new Set()]));
  if(!rawData.length){$('dataStatus').textContent='No valid 2025/2026 rows';return;}
  $('dataStatus').textContent=`${source} • ${rawData.length.toLocaleString()} rows`; updateAll();
}

$('csvFile').addEventListener('change',e=>{const f=e.target.files[0]; if(!f)return; Papa.parse(f,{header:true,skipEmptyLines:true,complete:r=>loadRows(r.data,f.name)});});
$('resetFilters').addEventListener('click',()=>{selections=Object.fromEntries(FILTERS.map(([k])=>[k,new Set()]));updateAll();});
$('growthState').addEventListener('change',()=>renderGrowthTables(customerStats(filtered())));
$('declineState').addEventListener('change',()=>renderGrowthTables(customerStats(filtered())));

initFilters();
fetch('data/sales.csv').then(r=>{if(!r.ok)throw new Error();return r.text()}).then(t=>Papa.parse(t,{header:true,skipEmptyLines:true,complete:r=>loadRows(r.data,'data/sales.csv')})).catch(()=>{
  fetch('data/sample-sales.csv').then(r=>r.ok?r.text():Promise.reject()).then(t=>Papa.parse(t,{header:true,skipEmptyLines:true,complete:r=>{loadRows(r.data,'Demo data');$('dataStatus').textContent='Demo data • upload your CSV';}})).catch(()=>{});
});
