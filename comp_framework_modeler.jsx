import React, { Fragment, useState, useMemo, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, Legend } from "recharts";

/* ═══════════════════ DATA ═══════════════════
   NOTE: Partner point columns below are pre-normalized placeholder values
   on a 0–200 scale. They are NOT raw billable hours, committee counts, etc.
   The compute() function additionally normalizes each column to a 0–100
   index before weighting so that dimensions with different real-world
   magnitudes remain commensurable. See compute() for details.
*/
const FAMILIES = [
  { id: "production", label: "Production", color: "#c9a84c" },
  { id: "leadership", label: "Leadership & Governance", color: "#5b8ec9" },
  { id: "building", label: "Firm Building", color: "#6abf8a" },
];
const PROVISIONS = [
  { id: "billable", label: "Billable Hours Generated", family: "production", desc: "Volume of billable work product — rewards output and utilization." },
  { id: "working", label: "Working Attorney Credits", family: "production", desc: "Credit for substantive legal work performed on matters — rewards hands-on execution." },
  { id: "supervision", label: "Matter Supervision", family: "production", desc: "Oversight of matters and junior attorneys — rewards quality control and delegation." },
  { id: "collection", label: "Collection Realization", family: "production", desc: "Effectiveness in collecting billed fees — rewards billing discipline and client management." },
  { id: "exec", label: "Exec Committee Membership", family: "leadership", desc: "Service on the firm's executive committee — rewards strategic governance participation." },
  { id: "pgLeader", label: "Practice Group Leadership", family: "leadership", desc: "Leading a practice group — rewards organizational leadership and group development." },
  { id: "omp", label: "Office Managing Partner", family: "leadership", desc: "Managing a firm office — rewards local leadership, culture, and operational responsibility." },
  { id: "chair", label: "Committee Chairmanships", family: "leadership", desc: "Chairing firm committees — rewards institutional service and governance investment." },
  { id: "strategic", label: "Strategic Initiatives", family: "building", desc: "Participation in firm-wide strategic projects — rewards forward-looking investment in the firm." },
  { id: "mentorship", label: "Mentorship Program Leadership", family: "building", desc: "Leading mentorship and talent development — rewards investment in the firm's next generation." },
];
// Placeholder partner roster. Point columns are pre-normalized 0–200 scores.
const PARTNERS = [
  { id:1,name:"Quinn Zimmerman",own:21,yrs:25,billable:35,working:55,supervision:198,collection:190,exec:116,pgLeader:108,omp:14,chair:125,strategic:45,mentorship:199 },
  { id:2,name:"Emerson Ingram",own:21,yrs:5,billable:175,working:163,supervision:127,collection:83,exec:144,pgLeader:163,omp:66,chair:186,strategic:25,mentorship:32 },
  { id:3,name:"Emerson Lewis",own:3.8,yrs:25,billable:91,working:63,supervision:90,collection:100,exec:59,pgLeader:98,omp:112,chair:24,strategic:136,mentorship:185 },
  { id:4,name:"Casey Carter",own:3.9,yrs:8,billable:20,working:104,supervision:43,collection:87,exec:179,pgLeader:174,omp:69,chair:14,strategic:83,mentorship:71 },
  { id:5,name:"Shawn White",own:5.2,yrs:21,billable:146,working:100,supervision:118,collection:63,exec:111,pgLeader:196,omp:188,chair:116,strategic:84,mentorship:89 },
  { id:6,name:"Skyler Carter",own:3.3,yrs:2,billable:169,working:133,supervision:39,collection:70,exec:83,pgLeader:85,omp:10,chair:14,strategic:170,mentorship:98 },
  { id:7,name:"Riley King",own:6.2,yrs:10,billable:166,working:148,supervision:112,collection:192,exec:191,pgLeader:87,omp:157,chair:155,strategic:32,mentorship:189 },
  { id:8,name:"Peyton Anderson",own:3,yrs:16,billable:180,working:56,supervision:24,collection:85,exec:15,pgLeader:192,omp:25,chair:194,strategic:43,mentorship:96 },
  { id:9,name:"Morgan Hughes",own:0.5,yrs:11,billable:86,working:46,supervision:178,collection:115,exec:200,pgLeader:172,omp:189,chair:73,strategic:23,mentorship:117 },
  { id:10,name:"Skyler Nelson",own:4,yrs:18,billable:168,working:189,supervision:157,collection:64,exec:141,pgLeader:47,omp:147,chair:49,strategic:137,mentorship:139 },
  { id:11,name:"Morgan Stevens",own:4.3,yrs:13,billable:45,working:193,supervision:43,collection:105,exec:153,pgLeader:125,omp:78,chair:60,strategic:194,mentorship:44 },
  { id:12,name:"Adrian Owens",own:0.5,yrs:10,billable:197,working:15,supervision:54,collection:140,exec:176,pgLeader:173,omp:163,chair:150,strategic:21,mentorship:144 },
  { id:13,name:"Kendall Zimmerman",own:3.2,yrs:4,billable:179,working:199,supervision:98,collection:192,exec:80,pgLeader:134,omp:43,chair:51,strategic:104,mentorship:81 },
  { id:14,name:"Casey Mitchell",own:1.2,yrs:11,billable:63,working:135,supervision:53,collection:200,exec:142,pgLeader:84,omp:160,chair:161,strategic:107,mentorship:152 },
  { id:15,name:"Harper Zimmerman",own:2.4,yrs:21,billable:127,working:139,supervision:84,collection:162,exec:186,pgLeader:119,omp:139,chair:79,strategic:169,mentorship:20 },
  { id:16,name:"Jamie Carter",own:5.8,yrs:25,billable:44,working:105,supervision:58,collection:123,exec:48,pgLeader:57,omp:37,chair:139,strategic:190,mentorship:44 },
  { id:17,name:"Micah Zimmerman",own:1.3,yrs:21,billable:133,working:33,supervision:119,collection:48,exec:22,pgLeader:160,omp:199,chair:44,strategic:37,mentorship:64 },
  { id:18,name:"Morgan White",own:4.2,yrs:23,billable:74,working:42,supervision:154,collection:51,exec:16,pgLeader:153,omp:151,chair:65,strategic:135,mentorship:102 },
  { id:19,name:"Shawn Foster",own:4.2,yrs:8,billable:31,working:148,supervision:152,collection:102,exec:11,pgLeader:95,omp:75,chair:23,strategic:91,mentorship:125 },
  { id:20,name:"Casey Zimmerman",own:0.5,yrs:12,billable:53,working:162,supervision:135,collection:152,exec:168,pgLeader:105,omp:190,chair:144,strategic:87,mentorship:133 },
  { id:21,name:"Reese Turner",own:0.5,yrs:25,billable:78,working:65,supervision:45,collection:66,exec:65,pgLeader:133,omp:164,chair:36,strategic:10,mentorship:116 },
];
const OFFICES = [
  { state: "Indiana", count: 3 }, { state: "Alabama", count: 1 }, { state: "Colorado", count: 1 },
  { state: "Alaska", count: 2 }, { state: "Nevada", count: 1 }, { state: "South Carolina", count: 1 },
  { state: "Georgia", count: 1 }, { state: "New Mexico", count: 1 }, { state: "North Dakota", count: 3 },
  { state: "Mississippi", count: 1 }, { state: "Tennessee", count: 1 },
];
const TOTAL_OFFICES = OFFICES.reduce((s, o) => s + o.count, 0);
const PRESETS = [
  { id: "current", name: "Current System", desc: "Equal weight across all 10 categories — replicates the existing point-based allocation.", locked: true, familyW: { production: 34, leadership: 33, building: 33 }, provW: Object.fromEntries(PROVISIONS.map(p => [p.id, 2])) },
  { id: "ewyk", name: "Eat What You Kill", desc: "Heavy production emphasis. Rewards billable output and collections above institutional contribution.", locked: false, familyW: { production: 65, leadership: 15, building: 20 }, provW: { billable:4, working:4, supervision:3, collection:4, exec:1, pgLeader:1, omp:1, chair:1, strategic:2, mentorship:1 } },
  { id: "balanced", name: "Balanced Hybrid", desc: "Equal emphasis across production, leadership, and firm building. Rewards well-rounded partners.", locked: false, familyW: { production: 40, leadership: 35, building: 25 }, provW: { billable:3, working:3, supervision:3, collection:3, exec:3, pgLeader:3, omp:3, chair:2, strategic:3, mentorship:3 } },
  { id: "institutional", name: "Institutional Builder", desc: "Elevated leadership and firm-building credit. Rewards governance, mentorship, and strategic investment.", locked: false, familyW: { production: 25, leadership: 40, building: 35 }, provW: { billable:2, working:2, supervision:2, collection:1, exec:4, pgLeader:4, omp:3, chair:3, strategic:4, mentorship:4 } },
  { id: "rainmaker", name: "Rainmaker Premium", desc: "Collections and supervision dominant. Rewards partners who bring in and manage revenue.", locked: false, familyW: { production: 55, leadership: 25, building: 20 }, provW: { billable:3, working:2, supervision:4, collection:4, exec:2, pgLeader:2, omp:2, chair:1, strategic:2, mentorship:2 } },
];
const WL = ["Off","Low","Moderate","High","Dominant"];
const WV = [0, 10, 25, 40, 60];
// Lightened C.dim for WCAG AA; kept rest of palette intact.
const C = { bg:"#080c12", surface:"#0e1420", card:"#141c2a", border:"#1e2a3c", borderHi:"#2a3a52", accent:"#c9a84c", accentDim:"#997d30", text:"#e4e7eb", muted:"#8090a5", dim:"#6b7d94", green:"#3daa6a", red:"#d04848", blue:"#5b8ec9" };
const fmt = n => "$" + Math.round(n).toLocaleString();

/* ═══════════════════ ENGINE ═══════════════════ */
// Per-column max across the roster — used to normalize each dimension to 0–100.
const COL_MAX = Object.fromEntries(
  PROVISIONS.map(pr => [pr.id, Math.max(...PARTNERS.map(p => p[pr.id] || 0)) || 1])
);
const normPoint = (partner, provId) => (partner[provId] || 0) / COL_MAX[provId] * 100;

function compute(partners, familyW, provW, pool) {
  const totalFW = Object.values(familyW).reduce((s,v)=>s+v,0) || 1;
  // Identify "live" families: those with at least one active provision AND nonzero family weight.
  const liveFamilies = FAMILIES.filter(f =>
    (familyW[f.id] || 0) > 0 &&
    PROVISIONS.some(p => p.family === f.id && provW[p.id] > 0)
  );
  const liveFW = liveFamilies.reduce((s,f) => s + (familyW[f.id]||0), 0) || 1;
  const scores = partners.map(p => {
    let score = 0;
    liveFamilies.forEach(fam => {
      const famShare = (familyW[fam.id]||0) / liveFW;
      const sibs = PROVISIONS.filter(x => x.family===fam.id && provW[x.id]>0);
      const sibTotal = sibs.reduce((s,x) => s + WV[provW[x.id]], 0) || 1;
      sibs.forEach(pr => {
        const provShare = WV[provW[pr.id]] / sibTotal;
        score += normPoint(p, pr.id) * famShare * provShare;
      });
    });
    return score;
  });
  const totalScore = scores.reduce((s,v)=>s+v,0);
  return partners.map((p,i) => {
    const share = totalScore > 0 ? scores[i]/totalScore : 0;
    const comp = share * pool;
    return { ...p, comp, share, score: scores[i] };
  });
}
function gini(vals) {
  const s = [...vals].sort((a,b)=>a-b); const n=s.length; if(!n) return 0;
  const m = s.reduce((a,v)=>a+v,0)/n; if(!m) return 0;
  let sum=0; s.forEach((v,i)=>{sum+=(2*(i+1)-n-1)*v;}); return sum/(n*n*m);
}
function rankShift(baseRes, newRes) {
  const baseRank = [...baseRes].sort((a,b)=>b.comp-a.comp).map((p,i)=>({id:p.id,rank:i+1}));
  const newRank = [...newRes].sort((a,b)=>b.comp-a.comp).map((p,i)=>({id:p.id,rank:i+1}));
  return baseRes.map(p => {
    const br = baseRank.find(x=>x.id===p.id)?.rank||0;
    const nr = newRank.find(x=>x.id===p.id)?.rank||0;
    return { id:p.id, name:p.name, baseRank:br, newRank:nr, shift:br-nr };
  });
}
// Delta helpers — computed against the canonical baseline (Current System) rather
// than a stored per-partner currentComp, so the baseline itself always shows $0 deltas.
const deltaVs = (comp, baseComp) => ({
  delta: comp - baseComp,
  deltaPct: baseComp > 0 ? (comp - baseComp) / baseComp : 0,
});

/* ═══════════════════ COMPONENTS ═══════════════════ */
const Tip = ({text, show, id}) => {
  const [o,setO]=useState(false);
  if(!show) return null;
  return (
    <span style={{position:"relative",display:"inline-block",marginLeft:6}}>
      <button
        type="button"
        aria-label="More information"
        aria-expanded={o}
        aria-controls={id}
        onClick={()=>setO(!o)}
        onBlur={()=>setO(false)}
        style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:15,height:15,borderRadius:"50%",background:C.border,color:C.muted,fontSize:9,fontWeight:700,border:"none",cursor:"pointer",padding:0}}
      >?</button>
      {o && (
        <span id={id} role="tooltip" style={{position:"absolute",bottom:20,left:-100,width:240,padding:"10px 12px",background:C.card,border:`1px solid ${C.borderHi}`,borderRadius:6,fontSize:12,lineHeight:1.5,color:C.muted,zIndex:100,boxShadow:"0 8px 24px rgba(0,0,0,.5)"}}>{text}</span>
      )}
    </span>
  );
};
const Alert = ({type,children}) => {
  const s = {warn:{bg:"#1e1a0e",bd:"#4a3e18",c:C.accent,i:"⚠"},danger:{bg:"#1e0e0e",bd:"#4a1818",c:C.red,i:"⛔"},info:{bg:"#0e141e",bd:"#1a2a4a",c:C.blue,i:"ℹ"}};
  const v=s[type]||s.info;
  return (
    <div role={type==="danger"?"alert":"status"} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 14px",background:v.bg,border:`1px solid ${v.bd}`,borderRadius:6,fontSize:12.5,lineHeight:1.5,color:v.c,marginBottom:6}}>
      <span aria-hidden="true" style={{flexShrink:0}}>{v.i}</span><span>{children}</span>
    </div>
  );
};
const DeltaCell = ({delta}) => {
  const up = delta >= 0;
  const arrow = up ? "▲" : "▼";
  const label = `${up ? "increase" : "decrease"} of ${fmt(Math.abs(delta))}`;
  return (
    <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:up?C.green:C.red}}>
      <span aria-hidden="true">{arrow} </span>
      <span className="sr-only" style={{position:"absolute",width:1,height:1,overflow:"hidden",clip:"rect(0 0 0 0)"}}>{label}</span>
      <span aria-hidden="true">{up?"+":""}{fmt(delta)}</span>
    </span>
  );
};

/* ═══════════════════ MAIN ═══════════════════ */
export default function App() {
  const [tab,setTab]=useState("configure");
  const [help,setHelp]=useState(true);
  const [wizard,setWizard]=useState(true);
  const [pool,setPool]=useState(5000000);
  const [poolDraft,setPoolDraft]=useState("5.0");
  useEffect(()=>{ setPoolDraft((pool/1e6).toFixed(1)); },[pool]);
  const [scenarios,setScenarios]=useState([
    {id:1,name:"Current System",familyW:{production:34,leadership:33,building:33},provW:Object.fromEntries(PROVISIONS.map(p=>[p.id,2])),locked:true,preset:"current"},
    {id:2,name:"Scenario B",familyW:{production:40,leadership:35,building:25},provW:Object.fromEntries(PROVISIONS.map(p=>[p.id,0])),locked:false,preset:null},
  ]);
  const [active,setActive]=useState(1);
  const [cmp,setCmp]=useState([0,1]);
  const [detailId,setDetailId]=useState(null);
  const sc = scenarios[active];

  const setFW = (fam,v) => { if(sc.locked) return; setScenarios(p=>p.map((s,i)=>i===active?{...s,familyW:{...s.familyW,[fam]:v},preset:null}:s)); };
  const setPW = (prov,v) => { if(sc.locked) return; setScenarios(p=>p.map((s,i)=>i===active?{...s,provW:{...s.provW,[prov]:v},preset:null}:s)); };
  const applyPreset = pr => { setScenarios(p=>p.map((s,i)=>i===active?{...s,familyW:{...pr.familyW},provW:{...pr.provW},preset:pr.id,locked:pr.locked,name:pr.locked?pr.name:s.name}:s)); };

  // Compute all scenarios and attach deltas against the canonical baseline (scenario index 0).
  const results = useMemo(()=>{
    const raw = scenarios.map(s=>compute(PARTNERS,s.familyW,s.provW,pool));
    const baselineById = Object.fromEntries(raw[0].map(p=>[p.id,p.comp]));
    return raw.map((r)=> r.map(p => ({ ...p, ...deltaVs(p.comp, baselineById[p.id]||0) })));
  },[scenarios,pool]);

  const guardrails = useMemo(()=>{
    const g=[]; const r=results[active]; const s=sc;
    const totalFW = Object.values(s.familyW).reduce((a,v)=>a+v,0);
    if(totalFW===0){ g.push({type:"danger",text:"All family weights are zero. The model cannot allocate any compensation."}); return g; }
    const activeProvs = PROVISIONS.filter(pr=>s.provW[pr.id]>0);
    if(activeProvs.length===0){ g.push({type:"danger",text:"No provisions are active. Toggle at least one credit category on to generate modeled compensation."}); return g; }
    FAMILIES.forEach(f=>{
      const share = s.familyW[f.id]/totalFW;
      if(share>0.65) g.push({type:"warn",text:`${f.label} accounts for ${Math.round(share*100)}% of total weight — may undervalue contributions in other areas.`});
      const famActive = activeProvs.some(pr=>pr.family===f.id);
      if((s.familyW[f.id]||0)>0 && !famActive) g.push({type:"warn",text:`${f.label} is weighted at ${Math.round(share*100)}% but has no active provisions — that weight is ignored and will not affect compensation.`});
    });
    if(active!==0){
      const belowBase = r.filter(p=>p.delta < 0);
      if(belowBase.length>0) g.push({type:"warn",text:`${belowBase.length} partner${belowBase.length>1?"s":""} would receive less than the Current System baseline under this framework.`});
      const highOwn = r.filter(p=>p.own>=10 && p.deltaPct<-0.1);
      if(highOwn.length>0) g.push({type:"warn",text:`Senior ownership partners impacted: ${highOwn.map(p=>p.name+" ("+p.own+"% owner)").join(", ")} would see >10% reduction vs baseline. Expect political friction.`});
    }
    return g;
  },[results,active,sc]);

  const narrative = (idx) => {
    const s=scenarios[idx]; const r=results[idx];
    const totalFW = Object.values(s.familyW).reduce((a,v)=>a+v,0)||1;
    const famStr = FAMILIES.map(f=>`${f.label} ${Math.round((s.familyW[f.id]/totalFW)*100)}%`).join(", ");
    const comps = r.map(p=>p.comp);
    if(comps.every(c=>c===0)) return `"${s.name}" has no active provisions or zero family weight, so no compensation is allocated. Enable at least one credit category and assign family weight to see results.`;
    const g = gini(comps);
    const top = [...r].sort((a,b)=>b.comp-a.comp)[0];
    const bot = [...r].sort((a,b)=>a.comp-b.comp)[0];
    return `Under "${s.name}", the model allocates across three families: ${famStr}. This produces a compensation range of ${fmt(Math.min(...comps))}–${fmt(Math.max(...comps))} across ${r.length} partners (Gini: ${g.toFixed(2)}). Highest: ${top.name} at ${fmt(top.comp)}; lowest: ${bot.name} at ${fmt(bot.comp)}.`;
  };

  /* ── WIZARD ── */
  if(wizard) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Libre Franklin',sans-serif",padding:20}}>
      <link href="https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <div style={{maxWidth:540,width:"100%",textAlign:"center"}}>
        <div style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:C.accent,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10}}>Compensation Framework Modeler v3</div>
        <h1 style={{fontSize:24,fontWeight:700,color:C.text,margin:"0 0 6px"}}>What framework are you evaluating?</h1>
        <p style={{fontSize:13,color:C.muted,lineHeight:1.6,margin:"0 0 8px"}}>21 equity partners · 10 credit categories · {TOTAL_OFFICES} offices across {OFFICES.length} states</p>
        <p style={{fontSize:12,color:C.dim,margin:"0 0 28px"}}>Placeholder roster — point columns are normalized 0–100 internally. The Current System is always available as a comparison baseline.</p>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {PRESETS.filter(p=>!p.locked).map(p=>(
            <button key={p.id} onClick={()=>{applyPreset(p);setWizard(false);}}
              style={{display:"flex",flexDirection:"column",gap:3,padding:"14px 18px",background:C.card,border:`1px solid ${C.border}`,borderRadius:8,cursor:"pointer",textAlign:"left",transition:"border-color 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}
              onFocus={e=>e.currentTarget.style.borderColor=C.accent} onBlur={e=>e.currentTarget.style.borderColor=C.border}>
              <span style={{fontSize:14,fontWeight:600,color:C.text}}>{p.name}</span>
              <span style={{fontSize:12,color:C.muted,lineHeight:1.5}}>{p.desc}</span>
            </button>
          ))}
          <button onClick={()=>setWizard(false)} style={{padding:"12px 18px",background:"transparent",border:`1px dashed ${C.borderHi}`,borderRadius:8,cursor:"pointer",color:C.dim,fontSize:13,marginTop:4}}>Start from blank canvas</button>
        </div>
      </div>
    </div>
  );

  const TB = ({id,label})=>(
    <button
      role="tab"
      aria-selected={tab===id}
      aria-controls={`panel-${id}`}
      id={`tab-${id}`}
      onClick={()=>setTab(id)}
      style={{padding:"9px 18px",background:tab===id?C.card:"transparent",border:`1px solid ${tab===id?C.accent:C.border}`,borderBottom:tab===id?`2px solid ${C.accent}`:`1px solid ${C.border}`,borderRadius:"6px 6px 0 0",color:tab===id?C.accent:C.muted,fontSize:12,fontWeight:tab===id?600:400,cursor:"pointer",fontFamily:"'DM Mono',monospace",letterSpacing:"0.03em"}}
    >{label}</button>
  );
  const SC = ["#c9a84c","#5b8ec9","#c96b5b"];

  const commitPool = () => {
    const v = parseFloat(poolDraft.replace(/[^0-9.]/g,""));
    if(!isNaN(v) && v>0) setPool(v*1e6);
    else setPoolDraft((pool/1e6).toFixed(1));
  };

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Libre Franklin',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <header style={{padding:"14px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:C.accent,letterSpacing:"0.12em",textTransform:"uppercase"}}>Illustrative — Confidential</div>
          <h1 style={{margin:"3px 0 0",fontSize:17,fontWeight:700}}>Compensation Framework Modeler</h1>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          <label htmlFor="pool-input" style={{fontSize:11,color:C.dim,fontFamily:"'DM Mono',monospace"}}>Pool ($M):</label>
          <input
            id="pool-input"
            type="text"
            inputMode="decimal"
            value={poolDraft}
            onChange={e=>setPoolDraft(e.target.value)}
            onBlur={commitPool}
            onKeyDown={e=>{ if(e.key==="Enter") e.currentTarget.blur(); }}
            style={{width:60,padding:"5px 8px",background:C.card,border:`1px solid ${C.border}`,borderRadius:4,color:C.accent,fontSize:12,fontFamily:"'DM Mono',monospace",textAlign:"center",outline:"none"}}
          />
          <button
            onClick={()=>setHelp(!help)}
            aria-pressed={help}
            style={{padding:"5px 10px",background:help?C.accent+"22":"transparent",border:`1px solid ${help?C.accent:C.border}`,borderRadius:4,color:help?C.accent:C.muted,fontSize:10,cursor:"pointer",fontFamily:"'DM Mono',monospace"}}
          >{help?"Help On":"Help Off"}</button>
        </div>
      </header>
      <nav role="tablist" aria-label="Workflow steps" style={{display:"flex",gap:0,padding:"12px 20px 0",borderBottom:`1px solid ${C.border}`}}>
        <TB id="configure" label="1 · Configure"/><TB id="compare" label="2 · Compare"/><TB id="detail" label="3 · Detail"/>
      </nav>
      <div style={{maxWidth:940,margin:"0 auto",padding:"20px 16px 60px"}}>

        {/* ════════ CONFIGURE ════════ */}
        {tab==="configure"&&(<div role="tabpanel" id="panel-configure" aria-labelledby="tab-configure">
          <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
            {scenarios.map((s,i)=>(
              <button key={s.id} onClick={()=>setActive(i)} aria-pressed={active===i}
                style={{padding:"7px 14px",background:active===i?C.accent+"22":C.card,border:`1px solid ${active===i?C.accent:C.border}`,borderRadius:6,color:active===i?C.accent:C.muted,fontSize:12,fontWeight:500,cursor:"pointer"}}>
                {s.name}{s.locked?" (locked)":""}
              </button>
            ))}
            {scenarios.length<3&&<button onClick={()=>setScenarios(p=>[...p,{id:Date.now(),name:`Scenario ${String.fromCharCode(65+p.length)}`,familyW:{production:34,leadership:33,building:33},provW:Object.fromEntries(PROVISIONS.map(pr=>[pr.id,0])),locked:false,preset:null}])} style={{padding:"7px 12px",background:"transparent",border:`1px dashed ${C.borderHi}`,borderRadius:6,color:C.dim,fontSize:11,cursor:"pointer"}}>+ Add</button>}
          </div>
          {sc.locked&&<Alert type="info">This is the baseline (Current System) scenario. It cannot be edited and serves as the $0-delta reference point for every other scenario.</Alert>}
          {!sc.locked&&<>
            <div style={{marginBottom:16}}>
              <label htmlFor="scenario-name" style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Scenario Name</label>
              <input id="scenario-name" value={sc.name} onChange={e=>setScenarios(p=>p.map((s,i)=>i===active?{...s,name:e.target.value}:s))} style={{display:"block",marginTop:5,padding:"7px 10px",background:C.card,border:`1px solid ${C.border}`,borderRadius:4,color:C.text,fontSize:13,width:"100%",maxWidth:280,outline:"none",fontFamily:"inherit"}}/>
            </div>
            <div style={{marginBottom:22}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                <span style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Quick Preset</span>
                <Tip id="tip-preset" show={help} text="Apply a preset to instantly set all weights. You can fine-tune after."/>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {PRESETS.filter(p=>!p.locked).map(p=>(<button key={p.id} onClick={()=>applyPreset(p)} aria-pressed={sc.preset===p.id} style={{padding:"6px 12px",background:sc.preset===p.id?C.accent+"22":C.card,border:`1px solid ${sc.preset===p.id?C.accent:C.border}`,borderRadius:6,color:sc.preset===p.id?C.accent:C.muted,fontSize:11,cursor:"pointer"}}>{p.name}</button>))}
              </div>
            </div>
          </>}
          {/* Family weights */}
          <div style={{marginBottom:22}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
              <span style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Family Weights (Macro Split)</span>
              <Tip id="tip-family" show={help} text="Set the high-level allocation across Production, Leadership, and Firm Building. Sliders are relative; the displayed percentage normalizes to 100%."/>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {FAMILIES.map(f=>{
                const total = Object.values(sc.familyW).reduce((a,v)=>a+v,0)||1;
                const pctVal = Math.round((sc.familyW[f.id]/total)*100);
                const sliderId = `fw-${f.id}`;
                return (
                  <div key={f.id} style={{flex:"1 1 160px",padding:"12px 14px",background:C.card,border:`1px solid ${C.border}`,borderRadius:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <label htmlFor={sliderId} style={{fontSize:12,fontWeight:600,color:f.color}}>{f.label}</label>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:700,color:C.text}}>{pctVal}%</span>
                    </div>
                    <input
                      id={sliderId}
                      type="range" min={0} max={80} value={sc.familyW[f.id]}
                      onChange={e=>setFW(f.id,Number(e.target.value))}
                      disabled={sc.locked}
                      aria-label={`${f.label} relative weight — ${pctVal} percent of total`}
                      aria-valuetext={`${pctVal}%`}
                      style={{width:"100%",accentColor:f.color,cursor:sc.locked?"not-allowed":"pointer"}}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          {/* Individual provisions by family */}
          {FAMILIES.map(fam=>{
            const provs = PROVISIONS.filter(p=>p.family===fam.id);
            return (
              <div key={fam.id} style={{marginBottom:18}}>
                <div style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:fam.color,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8,paddingBottom:6,borderBottom:`1px solid ${C.border}`}}>{fam.label} Provisions</div>
                {provs.map(p=>{
                  const w = sc.provW[p.id]; const isOn = w>0;
                  return (
                    <div key={p.id} style={{padding:"10px 14px",marginBottom:4,background:C.card,border:`1px solid ${C.border}`,borderRadius:6,opacity:isOn?1:0.55,transition:"opacity 0.15s"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <button
                          role="switch"
                          aria-checked={isOn}
                          aria-label={`${p.label} — ${isOn?"enabled":"disabled"}`}
                          onClick={()=>!sc.locked&&setPW(p.id,isOn?0:2)}
                          disabled={sc.locked}
                          style={{width:36,height:20,borderRadius:10,border:"none",background:isOn?fam.color:C.border,cursor:sc.locked?"not-allowed":"pointer",position:"relative",flexShrink:0,transition:"background 0.15s"}}
                        >
                          <span aria-hidden="true" style={{display:"block",width:14,height:14,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:isOn?19:3,transition:"left 0.15s"}}/>
                        </button>
                        <div style={{flex:1,minWidth:0}}>
                          <span style={{fontSize:13,fontWeight:600,color:C.text}}>{p.label}</span>
                          <span style={{fontSize:11,color:C.muted,marginLeft:8}}>{p.desc}</span>
                        </div>
                        <span aria-live="polite" style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:isOn?fam.color:C.dim,minWidth:54,textAlign:"right"}}>{isOn?WL[w]:"Off"}</span>
                      </div>
                      {isOn&&!sc.locked&&(
                        <div role="radiogroup" aria-label={`${p.label} intensity`} style={{display:"flex",gap:6,marginTop:8,paddingLeft:46}}>
                          {[1,2,3,4].map(v=>(
                            <button
                              key={v}
                              role="radio"
                              aria-checked={w===v}
                              onClick={()=>setPW(p.id,v)}
                              style={{padding:"4px 10px",background:w===v?fam.color+"33":"transparent",border:`1px solid ${w===v?fam.color:C.border}`,borderRadius:4,color:w===v?fam.color:C.muted,fontSize:10,cursor:"pointer",fontFamily:"'DM Mono',monospace"}}
                            >{WL[v]}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
          {guardrails.length>0&&<div style={{marginBottom:20}}><div style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Advisory Notices</div>{guardrails.map((g,i)=><Alert key={i} type={g.type}>{g.text}</Alert>)}</div>}
          <div aria-live="polite" style={{padding:14,background:C.card,border:`1px solid ${C.border}`,borderRadius:8,marginBottom:16}}>
            <div style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Live Narrative — {sc.name}</div>
            <p style={{fontSize:12.5,lineHeight:1.6,color:C.muted,margin:0}}>{narrative(active)}</p>
          </div>
          <button onClick={()=>setTab("compare")} style={{padding:"10px 24px",background:C.accent,border:"none",borderRadius:6,color:C.bg,fontSize:13,fontWeight:600,cursor:"pointer"}}>Proceed to Compare →</button>
        </div>)}

        {/* ════════ COMPARE ════════ */}
        {tab==="compare"&&(<div role="tabpanel" id="panel-compare" aria-labelledby="tab-compare">
          <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
            <span style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:C.dim,textTransform:"uppercase"}}>Comparing:</span>
            {cmp.map((ci,idx)=>(
              <label key={idx} style={{display:"flex",alignItems:"center",gap:4}}>
                <span className="sr-only" style={{position:"absolute",width:1,height:1,overflow:"hidden",clip:"rect(0 0 0 0)"}}>{idx===0?"Baseline scenario":"Comparison scenario"}</span>
                <select value={ci} onChange={e=>{const n=[...cmp];n[idx]=Number(e.target.value);setCmp(n);}} style={{padding:"5px 8px",background:C.card,border:`1px solid ${C.border}`,borderRadius:4,color:SC[idx],fontSize:12,fontFamily:"'DM Mono',monospace",outline:"none"}}>{scenarios.map((s,si)=><option key={si} value={si}>{s.name}</option>)}</select>
              </label>
            ))}
            <span style={{fontSize:10,color:C.dim}}>(left = reference for rank shifts and deltas)</span>
          </div>
          {cmp.map((ci,idx)=>(<div key={idx} style={{padding:12,background:C.card,border:`1px solid ${C.border}`,borderRadius:8,marginBottom:6}}>
            <div style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:SC[idx],textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5}}>{scenarios[ci].name}</div>
            <p style={{fontSize:12,lineHeight:1.6,color:C.muted,margin:0}}>{narrative(ci)}</p>
          </div>))}
          {cmp.length>=2&&(()=>{
            const c0=results[cmp[0]].map(p=>p.comp); const c1=results[cmp[1]].map(p=>p.comp);
            if(c0.every(v=>v===0)||c1.every(v=>v===0)) return null;
            const g0=gini(c0); const g1=gini(c1);
            const spread0=Math.max(...c0)-Math.min(...c0); const spread1=Math.max(...c1)-Math.min(...c1);
            const diff=spread0-spread1;
            return <div style={{padding:12,background:C.surface,border:`1px solid ${C.accent}33`,borderRadius:8,marginBottom:20}}>
              <div style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:C.accent,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5}}>Comparative Analysis</div>
              <p style={{fontSize:12,lineHeight:1.6,color:C.muted,margin:0}}>"{scenarios[cmp[1]].name}" {g1<g0?"distributes compensation more evenly":"concentrates compensation more heavily"} than "{scenarios[cmp[0]].name}" (Gini {g0.toFixed(2)} vs {g1.toFixed(2)}). The gap between highest and lowest {diff>0?"narrows":"widens"} by {fmt(Math.abs(diff))}.</p>
            </div>;
          })()}
          <div style={{marginBottom:24}}>
            <div style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Compensation by Partner</div>
            <div role="img" aria-label={`Bar chart comparing modeled compensation across ${cmp.length} scenarios for ${PARTNERS.length} partners.`} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"14px 6px 6px",overflowX:"auto"}}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={PARTNERS.map(p=>{const row={name:p.name.split(" ")[1]};cmp.forEach((ci,idx)=>{const r=results[ci].find(x=>x.id===p.id);row[`s${idx}`]=r?Math.round(r.comp):0;});return row;})}>
                  <XAxis dataKey="name" tick={{fill:C.dim,fontSize:9}} axisLine={{stroke:C.border}} tickLine={false} interval={0} angle={-35} textAnchor="end" height={50}/>
                  <YAxis tick={{fill:C.dim,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>"$"+(v/1000)+"k"}/>
                  <RTooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,fontSize:11,color:C.text}} formatter={v=>fmt(v)}/>
                  <Legend formatter={(v)=>scenarios[cmp[parseInt(v.replace("s",""))]].name} wrapperStyle={{fontSize:10}}/>
                  {cmp.map((_,idx)=><Bar key={idx} dataKey={`s${idx}`} fill={SC[idx]} radius={[2,2,0,0]}/>)}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
            {cmp.map((ci,idx)=>{const g=gini(results[ci].map(p=>p.comp)); return (
              <div key={idx} style={{flex:"1 1 140px",padding:12,background:C.card,border:`1px solid ${C.border}`,borderRadius:8,textAlign:"center"}}>
                <div style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:SC[idx],textTransform:"uppercase",marginBottom:4}}>{scenarios[ci].name}</div>
                <div style={{fontSize:24,fontWeight:700,fontFamily:"'DM Mono',monospace",color:C.text}}>{g.toFixed(2)}</div>
                <div style={{fontSize:10,color:C.dim}}>Gini coefficient</div>
              </div>
            );})}
          </div>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Per-Partner Impact (Δ vs Current System baseline)<Tip id="tip-impact" show={help} text="Deltas compare each scenario against the Current System baseline — NOT against each partner's real-world compensation. Ownership % shown for political context."/></div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <caption style={{position:"absolute",width:1,height:1,overflow:"hidden",clip:"rect(0 0 0 0)"}}>Per-partner modeled compensation and delta from baseline, for each selected scenario.</caption>
                <thead>
                  <tr style={{borderBottom:`1px solid ${C.border}`}}>
                    <th scope="col" rowSpan={2} style={{textAlign:"left",padding:"6px 8px",color:C.muted,fontWeight:500,fontSize:10,fontFamily:"'DM Mono',monospace"}}>Partner</th>
                    <th scope="col" rowSpan={2} style={{textAlign:"right",padding:"6px 8px",color:C.muted,fontWeight:500,fontSize:10,fontFamily:"'DM Mono',monospace"}}>Own%</th>
                    <th scope="col" rowSpan={2} style={{textAlign:"right",padding:"6px 8px",color:C.muted,fontWeight:500,fontSize:10,fontFamily:"'DM Mono',monospace"}}>Yrs</th>
                    {cmp.map((ci,idx)=><th key={idx} scope="colgroup" colSpan={2} style={{textAlign:"center",padding:"6px 8px",color:SC[idx],fontWeight:500,fontSize:10,fontFamily:"'DM Mono',monospace",borderLeft:`1px solid ${C.border}`}}>{scenarios[ci].name}</th>)}
                  </tr>
                  <tr style={{borderBottom:`1px solid ${C.border}`}}>
                    {cmp.map((_,idx)=>(<Fragment key={idx}>
                      <th scope="col" style={{textAlign:"right",padding:"4px 8px",color:C.dim,fontWeight:400,fontSize:9,fontFamily:"'DM Mono',monospace",borderLeft:`1px solid ${C.border}`}}>Comp</th>
                      <th scope="col" style={{textAlign:"right",padding:"4px 8px",color:C.dim,fontWeight:400,fontSize:9,fontFamily:"'DM Mono',monospace"}}>Δ vs base</th>
                    </Fragment>))}
                  </tr>
                </thead>
                <tbody>{PARTNERS.map(p=>{
                  const rows=cmp.map(ci=>results[ci].find(x=>x.id===p.id));
                  return <tr key={p.id} style={{borderBottom:`1px solid ${C.border}22`}}>
                    <th scope="row" style={{textAlign:"left",padding:"6px 8px",color:C.text,fontWeight:500,fontSize:12,whiteSpace:"nowrap"}}>{p.name}</th>
                    <td style={{textAlign:"right",padding:"6px 8px",fontFamily:"'DM Mono',monospace",color:p.own>=10?C.accent:C.muted,fontSize:11}}>{p.own}%</td>
                    <td style={{textAlign:"right",padding:"6px 8px",fontFamily:"'DM Mono',monospace",color:C.muted,fontSize:11}}>{p.yrs}</td>
                    {rows.map((r,idx)=>(<Fragment key={idx}>
                      <td style={{textAlign:"right",padding:"6px 4px",fontFamily:"'DM Mono',monospace",color:C.text,fontSize:11,borderLeft:`1px solid ${C.border}`}}>{r?fmt(r.comp):"—"}</td>
                      <td style={{textAlign:"right",padding:"6px 8px"}}>{r?<DeltaCell delta={r.delta}/>:"—"}</td>
                    </Fragment>))}
                  </tr>;
                })}</tbody>
              </table>
            </div>
          </div>
          {cmp.length>=2&&cmp[0]!==cmp[1]&&(()=>{
            const shifts = rankShift(results[cmp[0]], results[cmp[1]]);
            const bigShifts = shifts.filter(s=>Math.abs(s.shift)>=3);
            return bigShifts.length>0&&<Alert type="info">Rank shifts of 3+ positions from "{scenarios[cmp[0]].name}" to "{scenarios[cmp[1]].name}": {bigShifts.map(s=>`${s.name} (${s.shift>0?"+"+s.shift:s.shift})`).join(", ")}. Positive = moved up in the compensation ranking.</Alert>;
          })()}
          <button onClick={()=>setTab("detail")} style={{marginTop:12,padding:"10px 24px",background:C.accent,border:"none",borderRadius:6,color:C.bg,fontSize:13,fontWeight:600,cursor:"pointer"}}>View Detail Roster →</button>
        </div>)}

        {/* ════════ DETAIL ════════ */}
        {tab==="detail"&&(<div role="tabpanel" id="panel-detail" aria-labelledby="tab-detail">
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,flexWrap:"wrap"}}>
            <label htmlFor="detail-scenario" style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:C.dim,textTransform:"uppercase"}}>Viewing:</label>
            <select id="detail-scenario" value={active} onChange={e=>setActive(Number(e.target.value))} style={{padding:"5px 8px",background:C.card,border:`1px solid ${C.border}`,borderRadius:4,color:C.accent,fontSize:12,fontFamily:"'DM Mono',monospace",outline:"none"}}>{scenarios.map((s,si)=><option key={si} value={si}>{s.name}</option>)}</select>
          </div>
          <div aria-live="polite" style={{fontSize:12,color:C.muted,lineHeight:1.6,padding:12,background:C.card,border:`1px solid ${C.border}`,borderRadius:8,marginBottom:20}}>{narrative(active)}</div>
          <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
            <div style={{flex:"1 1 120px",padding:"10px 12px",background:C.card,border:`1px solid ${C.border}`,borderRadius:6,textAlign:"center"}}>
              <div style={{fontSize:20,fontWeight:700,fontFamily:"'DM Mono',monospace",color:C.text}}>{PARTNERS.length}</div>
              <div style={{fontSize:10,color:C.muted}}>Equity Partners</div>
            </div>
            <div style={{flex:"1 1 120px",padding:"10px 12px",background:C.card,border:`1px solid ${C.border}`,borderRadius:6,textAlign:"center"}}>
              <div style={{fontSize:20,fontWeight:700,fontFamily:"'DM Mono',monospace",color:C.text}}>{OFFICES.length}</div>
              <div style={{fontSize:10,color:C.muted}}>States</div>
            </div>
            <div style={{flex:"1 1 120px",padding:"10px 12px",background:C.card,border:`1px solid ${C.border}`,borderRadius:6,textAlign:"center"}}>
              <div style={{fontSize:20,fontWeight:700,fontFamily:"'DM Mono',monospace",color:C.text}}>{TOTAL_OFFICES}</div>
              <div style={{fontSize:10,color:C.muted}}>Total Offices</div>
            </div>
            <div style={{flex:"1 1 120px",padding:"10px 12px",background:C.card,border:`1px solid ${C.border}`,borderRadius:6,textAlign:"center"}}>
              <div style={{fontSize:20,fontWeight:700,fontFamily:"'DM Mono',monospace",color:C.accent}}>{fmt(pool)}</div>
              <div style={{fontSize:10,color:C.muted}}>Pool Size</div>
            </div>
          </div>
          {[...results[active]].sort((a,b)=>b.comp-a.comp).map((p,rank)=>{
            const isExp = detailId===p.id;
            const totalFW = Object.values(sc.familyW).reduce((a,v)=>a+v,0)||1;
            return (
              <div key={p.id} style={{padding:"12px 14px",background:C.card,border:`1px solid ${C.border}`,borderRadius:8,marginBottom:5}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:C.muted,width:24,textAlign:"right"}}>#{rank+1}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <span style={{fontSize:13,fontWeight:600,color:C.text}}>{p.name}</span>
                    <span style={{fontSize:10,color:C.muted,marginLeft:8}}>{p.own}% owner · {p.yrs} yrs</span>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:600,color:C.text}}>{fmt(p.comp)}</div>
                    {active!==0 && <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:p.delta>=0?C.green:C.red}}><span aria-hidden="true">{p.delta>=0?"▲ +":"▼ "}</span>{fmt(p.delta)} ({p.deltaPct>=0?"+":""}{Math.round(p.deltaPct*100)}% vs base)</div>}
                  </div>
                  <button
                    aria-expanded={isExp}
                    aria-label={isExp?`Collapse details for ${p.name}`:`Expand details for ${p.name}`}
                    onClick={()=>setDetailId(isExp?null:p.id)}
                    style={{background:"none",border:`1px solid ${C.border}`,borderRadius:4,padding:"3px 8px",color:C.muted,fontSize:10,cursor:"pointer",fontFamily:"'DM Mono',monospace"}}
                  >{isExp?"−":"+"}</button>
                </div>
                {isExp&&(
                  <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
                    <table style={{width:"100%",fontSize:11,borderCollapse:"collapse"}}>
                      <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
                        <th scope="col" style={{textAlign:"left",padding:"5px 6px",color:C.muted,fontWeight:500}}>Provision</th>
                        <th scope="col" style={{textAlign:"right",padding:"5px 6px",color:C.muted,fontWeight:500}}>Raw Pts</th>
                        <th scope="col" style={{textAlign:"right",padding:"5px 6px",color:C.muted,fontWeight:500}}>Normalized</th>
                        <th scope="col" style={{textAlign:"right",padding:"5px 6px",color:C.muted,fontWeight:500}}>Family Wt</th>
                        <th scope="col" style={{textAlign:"right",padding:"5px 6px",color:C.muted,fontWeight:500}}>Prov Wt</th>
                      </tr></thead>
                      <tbody>{PROVISIONS.filter(pr=>sc.provW[pr.id]>0).map(pr=>{
                        const fam=FAMILIES.find(f=>f.id===pr.family);
                        const famPct=Math.round((sc.familyW[fam.id]/totalFW)*100);
                        const sibs=PROVISIONS.filter(x=>x.family===pr.family&&sc.provW[x.id]>0);
                        const sibT=sibs.reduce((s,x)=>s+WV[sc.provW[x.id]],0)||1;
                        const provPct=Math.round((WV[sc.provW[pr.id]]/sibT)*100);
                        return <tr key={pr.id} style={{borderBottom:`1px solid ${C.border}22`}}>
                          <th scope="row" style={{textAlign:"left",padding:"5px 6px",color:C.text,fontWeight:400}}>{pr.label}</th>
                          <td style={{textAlign:"right",padding:"5px 6px",fontFamily:"'DM Mono',monospace",color:C.muted}}>{p[pr.id]}</td>
                          <td style={{textAlign:"right",padding:"5px 6px",fontFamily:"'DM Mono',monospace",color:C.muted}}>{Math.round(normPoint(p,pr.id))}</td>
                          <td style={{textAlign:"right",padding:"5px 6px",fontFamily:"'DM Mono',monospace",color:fam.color}}>{famPct}%</td>
                          <td style={{textAlign:"right",padding:"5px 6px",fontFamily:"'DM Mono',monospace",color:C.accent}}>{provPct}%</td>
                        </tr>;
                      })}</tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
          <div style={{display:"flex",gap:10,marginTop:16,flexWrap:"wrap"}}>
            <button onClick={()=>setTab("configure")} style={{padding:"8px 20px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:6,color:C.muted,fontSize:12,cursor:"pointer"}}>← Configure</button>
            <button onClick={()=>setTab("compare")} style={{padding:"8px 20px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:6,color:C.muted,fontSize:12,cursor:"pointer"}}>← Compare</button>
          </div>
        </div>)}
      </div>
      <div style={{textAlign:"center",padding:"20px 0",fontSize:9,fontFamily:"'DM Mono',monospace",color:C.dim}}>Confidential — For Executive Committee Discussion Only · Illustrative placeholder data</div>
    </div>
  );
}
