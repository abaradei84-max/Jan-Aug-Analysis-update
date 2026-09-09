// Sales + Bonus combined analysis. Loaded after app.js so it extends the existing dashboard.
const _baseNormalizeRow = normalizeRow;
normalizeRow = function(r){
  const x = _baseNormalizeRow(r);
  x.soldQty = num(rowValue(r,['sold qty (invoiced)','sold qty','sold quantity']));
  x.soldAmountRaw = num(rowValue(r,['sold amount (invoiced)','sold amount','gross sales','gross amount']));
  x.netBonusQty = num(rowValue(r,['net bonus qty (invoiced)','net bonus qty','bonus net qty']));
  return x;
};

function bonusPriceMap(data){
  const m = new Map();
  data.forEach(r=>{
    if(!r.item || !Number.isFinite(r.soldQty) || !Number.isFinite(r.soldAmountRaw) || r.soldQty===0) return;
    const key=`${r.year}|||${r.item}`;
    if(!m.has(key)) m.set(key,{amount:0,qty:0});
    const v=m.get(key); v.amount+=r.soldAmountRaw; v.qty+=r.soldQty;
  });
  const out=new Map();
  m.forEach((v,k)=>out.set(k,v.qty!==0?v.amount/v.qty:0));
  return out;
}

function combinedRows(data){
  const prices=bonusPriceMap(data);
  return data.map(r=>{
    const price=prices.get(`${r.year}|||${r.item}`) || 0;
    const bonusMoney=(r.netBonusQty||0)*price;
    return {...r,bonusMoney,totalMoney:(r.sales||0)+bonusMoney,totalUnits:(r.netQty||0)+(r.netBonusQty||0)};
  });
}

function updateBonusKPIs(data){
  const d=combinedRows(data), y25=d.filter(r=>r.year===2025), y26=d.filter(r=>r.year===2026);
  const m25=sum(y25,'totalMoney'), m26=sum(y26,'totalMoney');
  const u25=sum(y25,'totalUnits'), u26=sum(y26,'totalUnits');
  const set=(id,val)=>{const el=$(id);if(el)el.textContent=val};
  set('kpiMoney2025',fmt(m25)); set('kpiMoney2026',fmt(m26)); set('kpiMoneyGrowth',m25!==0?pct((m26-m25)/m25*100):'—');
  set('kpiUnits2025',fmt(u25)); set('kpiUnits2026',fmt(u26)); set('kpiUnitsGrowth',u25!==0?pct((u26-u25)/u25*100):'—');
}

function updateBonusCharts(data){
  const d=combinedRows(data); const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'];
  const monthly=(year,key)=>Array.from({length:8},(_,i)=>d.filter(r=>r.year===year&&r.month===i+1).reduce((a,r)=>a+(r[key]||0),0));
  if($('monthlyMoneyChart')) plot('monthlyMoneyChart',[
    {x:months,y:monthly(2025,'totalMoney'),type:'scatter',mode:'lines+markers',name:'2025',line:{width:3}},
    {x:months,y:monthly(2026,'totalMoney'),type:'scatter',mode:'lines+markers',name:'2026',line:{width:3}}
  ]);
  if($('monthlyUnitsChart')) plot('monthlyUnitsChart',[
    {x:months,y:monthly(2025,'totalUnits'),type:'scatter',mode:'lines+markers',name:'2025',line:{width:3}},
    {x:months,y:monthly(2026,'totalUnits'),type:'scatter',mode:'lines+markers',name:'2026',line:{width:3}}
  ]);
  const itemMoney=[...groupSum(d,'item','totalMoney',2026)].sort((a,b)=>b[1]-a[1]).slice(0,15);
  const itemUnits=[...groupSum(d,'item','totalUnits',2026)].sort((a,b)=>b[1]-a[1]).slice(0,15);
  if($('itemMoneyChart')) plot('itemMoneyChart',[{x:itemMoney.map(x=>x[1]),y:itemMoney.map(x=>x[0]),type:'bar',orientation:'h'}],{showlegend:false,margin:{l:125,r:18,t:20,b:45}});
  if($('itemUnitsChart')) plot('itemUnitsChart',[{x:itemUnits.map(x=>x[1]),y:itemUnits.map(x=>x[0]),type:'bar',orientation:'h'}],{showlegend:false,margin:{l:125,r:18,t:20,b:45}});
}

const _baseUpdateKPIs=updateKPIs;
updateKPIs=function(data){_baseUpdateKPIs(data);updateBonusKPIs(data)};
const _baseUpdateCharts=updateCharts;
updateCharts=function(data){_baseUpdateCharts(data);updateBonusCharts(data)};
