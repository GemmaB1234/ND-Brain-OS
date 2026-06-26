const { useState, useEffect, useRef, useCallback } = React;



// ─── SUPABASE CLIENT ──────────────────────────────────────────────────────────

const SUPABASE_URL = 'https://ahhgssocxiemxotqcqzz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_eM1hDvbQNB6Ip_hktigGRw_5_CJrQU7';

async function supabase(method, path, body, token) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token || SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    console.error('Supabase error:', err);
  }
  try { return await res.json(); } catch { return null; }
}

async function sbAuth(action, email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${action}`, {
    method: 'POST',
    headers: { 
      'apikey': SUPABASE_KEY, 
      'Content-Type': 'application/json',
      'X-Client-Info': 'steady-app'
    },
    body: JSON.stringify({ email, password, gotrue_meta_security: {} }),
  });
  const data = await res.json();
  console.log('Auth response:', JSON.stringify(data));
  return data;
}

async function sbSignOut(token) {
  await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` },
  });
}

// Steady — Wired & Well Ltd
// Complete single-file React app

// ─── MODULE-LEVEL HELPERS ────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

const AI_ENABLED = false; // Set to true when API key is secured server-side

async function callClaudeJSON(prompt, systemPrompt) {
  if (!AI_ENABLED) return { __coming_soon: true };
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt || "You are a compassionate neurodivergence support assistant. Always respond with valid JSON only, no markdown fences, no preamble.",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  const text = data.content?.map(i => i.text || "").join("") || "{}";
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return {};
  }
}

// ─── THEMES ──────────────────────────────────────────────────────────────────

const THEMES = {
  dark: {
    id: "dark", label: "🌑 Dark",
    bg: "#07070d", card: "#0e0e1a", border: "#1e1e30",
    text: "#e8e8f0", muted: "#8888aa",
    teal: "#00ffcc", pink: "#ff6ef7", blue: "#7eb8ff",
    yellow: "#ffe566", green: "#a8ff78", orange: "#ff9966", purple: "#a78bfa",
    b1: "#00ffcc22", b2: "#ff6ef722", b3: "#7eb8ff22",
  },
  softdark: {
    id: "softdark", label: "🌙 Soft",
    bg: "#13111e", card: "#1a1830", border: "#2a2845",
    text: "#ddddf5", muted: "#7070a0",
    teal: "#5ee8cc", pink: "#e87ef0", blue: "#8ec8ff",
    yellow: "#f5d870", green: "#90e868", orange: "#f0a080", purple: "#c0a0f8",
    b1: "#5ee8cc18", b2: "#e87ef018", b3: "#8ec8ff18",
  },
  dusk: {
    id: "dusk", label: "🌆 Dusk",
    bg: "#0f0a00", card: "#1a1200", border: "#2e2000",
    text: "#f0e0c0", muted: "#887050",
    teal: "#ffb830", pink: "#ff8c42", blue: "#ffd080",
    yellow: "#ffe599", green: "#c8e060", orange: "#ff6020", purple: "#e0a060",
    b1: "#ffb83022", b2: "#ff8c4222", b3: "#ffd08018",
  },
  light: {
    id: "light", label: "☀️ Light",
    bg: "#f8f7ff", card: "#ffffff", border: "#e0dff5",
    text: "#1a1830", muted: "#6060a0",
    teal: "#009980", pink: "#cc22cc", blue: "#2266cc",
    yellow: "#cc9900", green: "#228844", orange: "#cc5500", purple: "#6633cc",
    b1: "#009980" + "18", b2: "#cc22cc18", b3: "#2266cc18",
  },
  moss: {
    id: "moss", label: "🌿 Moss",
    bg: "#080f0a", card: "#0d1a10", border: "#1a2e1c",
    text: "#c8e8c0", muted: "#608060",
    teal: "#40ffaa", pink: "#88ff88", blue: "#aaffcc",
    yellow: "#d8ff80", green: "#60ff40", orange: "#a0e060", purple: "#80c880",
    b1: "#40ffaa22", b2: "#88ff8822", b3: "#aaffcc18",
  },
};

// Welcome screen uses dark theme hardcoded
const WC = THEMES.dark;

// ─── DATA CONSTANTS ───────────────────────────────────────────────────────────

const RSD_SCENARIOS = [
  { id: "thumbsup", icon: "👍", label: "They sent just a thumbs up", desc: "That minimal response probably means nothing — most people use thumbs up as an easy acknowledge." },
  { id: "readreceipt", icon: "📖", label: "Read receipt, no reply", desc: "They read it and are processing, busy, or just forgot to reply. It rarely means what your brain says." },
  { id: "oneword", icon: "💬", label: "One-word reply", desc: "Short replies often mean they're distracted or just not big texters — not that something is wrong." },
  { id: "rescheduled", icon: "📅", label: "They rescheduled on you", desc: "Life happens. Rescheduling shows they still want to meet — they could have just cancelled." },
  { id: "quietmeeting", icon: "🤫", label: "Quiet in a meeting", desc: "People go quiet for a hundred reasons — tiredness, their own thoughts, other worries. It's rarely about you." },
  { id: "noreaction", icon: "😐", label: "No reaction to what you said", desc: "They may have been distracted, not heard clearly, or simply have a flat affect. Silence isn't rejection." },
  { id: "formalemail", icon: "📧", label: "Unusually formal email", desc: "Formal emails are often just someone's default style or they're under pressure themselves." },
  { id: "bodylanguage", icon: "🙄", label: "Their body language seemed off", desc: "Body language is easily misread, especially with RSD. They could be tired, cold, or thinking about lunch." },
  { id: "custom", icon: "✏️", label: "Something else", desc: "Describe your situation and get a personalised reality check." },
];

const AFFIRMATIONS = [
  "Your sensitivity is not a flaw. It's a superpower that also exhausts you sometimes, and both things are true.",
  "You process more information in one minute than most people process in an hour. Of course you're tired.",
  "Rejection feels physical because for you, it is. That's neurobiology, not weakness.",
  "You are not 'too much'. You are exactly the right amount for the right people.",
  "Your brain notices everything. That's why music moves you, art stops you, and kindness makes you cry.",
  "The people who truly see you will never make you feel like a burden for being yourself.",
  "You've survived 100% of your hardest days so far. That's not nothing. That's everything.",
  "Being misunderstood your whole life and still showing up? That takes extraordinary courage.",
];

const MOOD_OPTIONS = [
  { id: "overwhelmed", icon: "🌊", label: "Overwhelmed", color: "#7eb8ff", desc: "Everything is too much right now", needs: ["Step away from screens for 5 mins", "Put headphones on with calming sound", "Ground yourself: name 5 things you can see", "Tell someone you need space — that's okay"], links: [{ label: "→ Sensory Check", tab: "sensory" }, { label: "→ Breathing", tab: "toolkit" }] },
  { id: "flat", icon: "🪨", label: "Flat/Numb", color: "#a78bfa", desc: "Low motivation, disconnected, flatlined", needs: ["Movement — even just standing up and stretching", "Change your environment (go outside briefly)", "Eat or drink something — check the basics first", "Try one tiny task to restart the engine"], links: [{ label: "→ Dopamine Fixes", tab: "dopamine" }, { label: "→ Tasks", tab: "tasks" }] },
  { id: "anxious", icon: "⚡", label: "Anxious", color: "#ffe566", desc: "Heart racing, mind spiralling, on edge", needs: ["4-4-6 breathing exercise right now", "Write down exactly what you're worried about", "Physical movement to discharge the adrenaline", "Remind yourself: you have survived every hard moment so far"], links: [{ label: "→ Breathing", tab: "toolkit" }, { label: "→ Brain Dump", tab: "braindump" }] },
  { id: "frustrated", icon: "🔥", label: "Frustrated", color: "#ff9966", desc: "Angry, irritated, at the limit", needs: ["Physical release: walk, shake, stamp your feet", "Identify the real source — often it's overload not the trigger", "Give yourself permission to feel this fully for 2 mins", "Then decide: act or release"], links: [{ label: "→ RSD Check", tab: "rsd" }, { label: "→ Toolkit", tab: "toolkit" }] },
  { id: "okay", icon: "🌤️", label: "Okay Actually", color: "#a8ff78", desc: "Neutral, managing, getting by", needs: ["This is a good moment to do one thing off your list", "Check in on your basics: food, water, movement?", "Can you do something kind for tomorrow-you?", "Notice this moment — okay is underrated"], links: [{ label: "→ Tasks", tab: "tasks" }, { label: "→ Life Stuff", tab: "habits" }] },
  { id: "good", icon: "✨", label: "Pretty Good", color: "#00ffcc", desc: "Genuinely okay, energy available", needs: ["Ride this window — do the thing you've been avoiding", "Connect with someone you care about", "Do something creative while you have the fuel", "Bank some wins for later"], links: [{ label: "→ Tasks", tab: "tasks" }, { label: "→ Dopamine", tab: "dopamine" }] },
  { id: "hyperfocus", icon: "🎯", label: "In Hyperfocus", color: "#ff6ef7", desc: "Locked in, time-blind, deep in it", needs: ["Set a timer NOW so you remember to eat/drink", "Tell someone nearby so they can check on you", "The thing you're doing: is it what needs doing?", "Plan your exit — hyperfocus ends suddenly"], links: [{ label: "→ Body Double", tab: "toolkit" }, { label: "→ Tasks", tab: "tasks" }] },
  { id: "shutdown", icon: "🔋", label: "Shutdown Mode", color: "#8888aa", desc: "Can't talk, can't think, system offline", needs: ["This is your nervous system protecting you — honour it", "Find somewhere quiet and dim if possible", "You don't have to explain this to anyone right now", "Rest. Not as a reward. Just because you need it."], links: [{ label: "→ Sensory", tab: "sensory" }, { label: "→ Toolkit", tab: "toolkit" }] },
];

const DOPAMINE_SCIENCE = [
  { title: "What dopamine actually is", icon: "🧬", body: "Dopamine isn't just the 'pleasure chemical' — it's the motivation, curiosity, and seeking chemical. It fires when you anticipate reward, not just when you receive it. That's why scrolling feels good even when it leaves you empty." },
  { title: "ADHD & dopamine deficit", icon: "🧠", body: "ADHD brains have fewer dopamine receptors and less efficient dopamine transport. This means you need more stimulation to reach the same baseline as a neurotypical brain. You're not lazy — you're running on a harder difficulty setting." },
  { title: "The seeking loop", icon: "🔄", body: "When dopamine is low, the brain enters seeking mode — looking for anything that might provide a hit. This is why you open your phone without knowing why, or start five things and finish none. The loop is neurological, not moral." },
  { title: "Why ND brains burn out", icon: "🔥", body: "Constant effort to compensate for dopamine dysregulation is exhausting. Masking, stimming suppression, and hyperfocusing to meet deadlines all drain the same limited resource. Burnout isn't failure — it's a fuel gauge hitting zero." },
];

const DOPAMINE_FIXES = [
  { icon: "🏃", title: "Movement snack", desc: "Even 2 mins of movement spikes dopamine. Walk to the window. Dance to one song. Shake your hands out.", time: "2–5 min" },
  { icon: "🎵", title: "One song", desc: "Put on something you love and actually listen. Don't multitask. Let it do its thing.", time: "3–4 min" },
  { icon: "💧", title: "Cold water on face", desc: "Activates the dive reflex — instantly lowers heart rate and cortisol. Surprisingly effective.", time: "30 sec" },
  { icon: "✅", title: "Complete one tiny thing", desc: "Wash one cup. Reply to one message. The brain rewards task completion — stack that win.", time: "5 min" },
  { icon: "☀️", title: "Natural light", desc: "Step outside or sit by a window. Light regulates dopamine and serotonin production.", time: "5–10 min" },
  { icon: "🎨", title: "Make something", desc: "Draw, write, cook, build — the creative act produces dopamine from the making itself.", time: "Any" },
  { icon: "🫗", title: "Drink water", desc: "Dehydration tanks dopamine. Before anything else — have you had a glass of water today?", time: "Now" },
  { icon: "🚿", title: "Cold shower burst", desc: "30 seconds of cold at the end of a shower. Shocking but genuinely effective for mood reset.", time: "30 sec" },
  { icon: "😂", title: "Watch something funny", desc: "Laughter is a real dopamine spike. Go to your reliable funny thing — not scroll for funny.", time: "5–10 min" },
];

const DOPAMINE_TRAPS = [
  { icon: "📱", title: "Doomscrolling", why: "Triggers the seeking loop without ever resolving it. Every scroll is a dopamine tease.", swap: "Set a 5-min timer. When it goes off, close the app." },
  { icon: "🍬", title: "Sugar bingeing", why: "Fast spike followed by a crash that leaves you lower than before.", swap: "Pair something sweet with protein to slow the crash." },
  { icon: "🛒", title: "Impulse buying", why: "The dopamine hit comes from browsing and buying — not from having the thing.", swap: "Add to a wishlist. Wait 48 hours. Usually the urge passes." },
  { icon: "😡", title: "Rage-watching", why: "Outrage content hacks the seeking system — feels stimulating but drains you.", swap: "Notice when you're watching something that makes you angry. Ask: is this helping?" },
  { icon: "🌙", title: "Late night screens", why: "Blue light + engagement loops suppress melatonin and delay the sleep that restores dopamine.", swap: "Hard stop 30 mins before bed. Even dim mode doesn't fully help." },
  { icon: "☕", title: "Too much caffeine", why: "Works by blocking adenosine receptors, not adding dopamine — crash is real and hard.", swap: "One coffee before noon. Switch to water or herbal in the afternoon." },
];

const SENSORY_SENSES = [
  { id: "sound", icon: "🔊", label: "Sound", levels: ["WAY too much", "A bit too much", "Just right", "Not enough", "Really need more"], advice: ["Find silence or use ear defenders. Cancel plans if needed. This is real sensory overload.", "Lower the source if possible. Background noise apps can help mask unpredictable sounds.", "You're calibrated. Note what's working for next time.", "Try putting music on, especially familiar tracks. Your nervous system wants input.", "Put on something immersive — full album, spatial audio. Let sound fill the room."] },
  { id: "light", icon: "💡", label: "Light", levels: ["WAY too much", "A bit too much", "Just right", "Not enough", "Really need more"], advice: ["Sunglasses indoors are valid. Dim everything. Avoid fluorescents.", "Adjust screens to warm tone. Turn off overhead lights, use lamp instead.", "Good. Your environment is supporting you right now.", "Turn more lights on or move toward a window. Dim lighting can feed the flatness.", "Get outside, or sit directly in front of a bright lamp. Light is mood regulation."] },
  { id: "touch", icon: "👐", label: "Touch", levels: ["WAY too much", "A bit too much", "Just right", "Not enough", "Really need more"], advice: ["No physical contact right now is a valid need. Wear soft, loose clothing. Remove tags.", "Check your clothing — synthetic fabrics often irritate. Give yourself space from others.", "Your tactile system is comfortable.", "Weighted blanket, textured object, or ask someone for a hug if that feels right.", "Weighted blanket on lap. Fidget toy. Self-massage. You need physical grounding input."] },
  { id: "social", icon: "👥", label: "Social", levels: ["WAY too much", "A bit too much", "Just right", "Not enough", "Really need more"], advice: ["Exit if you can. You're socially saturated. Even 10 minutes alone will help.", "Reduce the number of people. One-on-one is much lower demand than groups.", "You're socially balanced right now.", "Reach out to one person you feel safe with. A text counts.", "Call someone, make plans, or go somewhere with background human presence (café, library)."] },
  { id: "internal", icon: "🫀", label: "Internal / Body", levels: ["WAY too much", "A bit too much", "Just right", "Not enough", "Really need more"], advice: ["You're highly interoceptive right now. Grounding: slow your breathing, feel your feet on floor.", "Reduce internal stimulants: caffeine, sugar, stressors. Your nervous system is elevated.", "Your body awareness is calibrated.", "Check basics: hungry? thirsty? tired? Sometimes numbness is dissociation — be gentle.", "Movement, temperature change, or deep pressure. Your body needs to feel itself."] },
];

const REWARD_MESSAGES = [
  "That required executive function AND you did it anyway. 🏆",
  "Your past self would be proud of that. 🌟",
  "Genuinely not a small thing. You did that. ✨",
  "Task complete. Dopamine earned. 🎯",
  "One more win in the bag. Keep going. 💪",
  "Your brain worked hard for that. Well done. 🧠",
  "That counts. All of it counts. 💜",
  "You're building something good here. 🌱",
];

const REWARD_TIERS = [
  { min: 0, icon: "🌱", name: "Getting started", next: 50 },
  { min: 50, icon: "⚡", name: "Building momentum", next: 150 },
  { min: 150, icon: "🔥", name: "On a roll", next: 300 },
  { min: 300, icon: "💫", name: "Unstoppable", next: 500 },
  { min: 500, icon: "🏆", name: "Legend", next: 750 },
  { min: 750, icon: "🌟", name: "Brain OS Master", next: null },
];

const ND_WORDS = ["ADHD", "Autism", "Dyslexia", "Hyperfocus", "RSD", "Masking", "Stimming", "PDA", "Dyscalculia", "Dyspraxia", "Burnout", "Sensory", "Neurodivergent", "Executive Function", "Time Blindness", "Rejection", "Dopamine", "Pattern", "Flow State", "Special Interest"];

const TIPS = [
  "Time blindness is a real neurological difference, not laziness.",
  "Masking is exhausting. You don't owe anyone your mask.",
  "RSD feels like rejection but is often a misread.",
  "Hyperfocus is a superpower — and it needs breaks.",
  "'Just do it' advice wasn't designed for your brain.",
  "Stimming is self-regulation, not a problem to fix.",
  "Your brain works best with external structure and support.",
  "PDA means autonomy is a safety need, not defiance.",
];

// ─── GAME COMPONENTS (module level) ──────────────────────────────────────────

function SnakeGame({ C, onComplete }) {
  const GRID = 16;
  const CELL = 16;
  const [state, setState] = React.useState({ snake: [[8,8],[8,9]], dir: [0,-1], food: [4,4], score: 0, best: 0, running: false, dead: false });
  const ref = React.useRef(state);
  ref.current = state;
  const intervalRef = React.useRef(null);

  function randFood(snake) {
    let f;
    do { f = [Math.floor(Math.random()*GRID), Math.floor(Math.random()*GRID)]; }
    while (snake.some(s => s[0]===f[0] && s[1]===f[1]));
    return f;
  }

  function startGame() {
    const snake = [[8,8],[8,9]];
    setState(s => ({ snake, dir: [0,-1], food: randFood(snake), score: 0, best: s.best, running: true, dead: false }));
  }

  React.useEffect(() => {
    if (!state.running) return;
    intervalRef.current = setInterval(() => {
      const s = ref.current;
      const head = [s.snake[0][0]+s.dir[0], s.snake[0][1]+s.dir[1]];
      if (head[0]<0||head[0]>=GRID||head[1]<0||head[1]>=GRID||s.snake.some(c=>c[0]===head[0]&&c[1]===head[1])) {
        setState(p => ({ ...p, running: false, dead: true, best: Math.max(p.best, p.score) }));
        return;
      }
      const ate = head[0]===s.food[0] && head[1]===s.food[1];
      const newSnake = [head, ...s.snake.slice(0, ate ? undefined : -1)];
      setState(p => ({ ...p, snake: newSnake, food: ate ? randFood(newSnake) : p.food, score: ate ? p.score+1 : p.score }));
    }, 150);
    return () => clearInterval(intervalRef.current);
  }, [state.running]);

  React.useEffect(() => {
    function onKey(e) {
      const map = { ArrowUp:[-1,0], ArrowDown:[1,0], ArrowLeft:[0,-1], ArrowRight:[0,1] };
      if (map[e.key]) { e.preventDefault(); const d=map[e.key]; setState(s=>({ ...s, dir: (s.dir[0]+d[0]===0&&s.dir[1]+d[1]===0)?s.dir:d })); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function changeDir(d) { setState(s => ({ ...s, dir: (s.dir[0]+d[0]===0&&s.dir[1]+d[1]===0)?s.dir:d })); }

  const cells = [];
  for (let r=0;r<GRID;r++) for (let c=0;c<GRID;c++) {
    const isHead = state.snake[0]&&state.snake[0][0]===r&&state.snake[0][1]===c;
    const isBody = state.snake.slice(1).some(s=>s[0]===r&&s[1]===c);
    const isFood = state.food[0]===r&&state.food[1]===c;
    cells.push(
      React.createElement('div', { key: r+','+c, style: { width:CELL, height:CELL, background: isHead?'#00ff88':isBody?'#00cc66':isFood?C.pink:'transparent', borderRadius: isHead?3:isBody?2:isFood?'50%':0, boxShadow: isHead?'0 0 8px #00ff88':isFood?`0 0 8px ${C.pink}`:'none', transition:'background 0.05s' } })
    );
  }

  const dpadBtn = (label, dir, color, rotation) => React.createElement('button', {
    onMouseDown: (e) => { e.preventDefault(); changeDir(dir); },
    onTouchStart: (e) => { e.preventDefault(); changeDir(dir); },
    style: { width:72,height:72,background:color+'22',border:`2px solid ${color}`,borderRadius:12,fontSize:28,cursor:'pointer',color,boxShadow:`0 0 12px ${color}66`,transform:`rotate(${rotation})`,display:'flex',alignItems:'center',justifyContent:'center',userSelect:'none',touchAction:'none' }
  }, '▶');

  return React.createElement('div', { style:{display:'flex',flexDirection:'column',alignItems:'center',gap:12} },
    React.createElement('div', { style:{display:'flex',justifyContent:'space-between',width:GRID*CELL,marginBottom:4} },
      React.createElement('span',{style:{color:C.teal,fontFamily:'Nunito',fontSize:14}},'Score: '+state.score),
      React.createElement('span',{style:{color:C.yellow,fontFamily:'Nunito',fontSize:14}},'Best: '+state.best)
    ),
    React.createElement('div', { style:{display:'grid',gridTemplateColumns:`repeat(${GRID},${CELL}px)`,background:'#001100',border:`2px solid ${C.teal}44`,borderRadius:8,boxShadow:`0 0 20px ${C.teal}22`} }, cells),
    !state.running && React.createElement('div',{style:{textAlign:'center',marginTop:8}},
      React.createElement('p',{style:{color:state.dead?C.pink:C.teal,fontFamily:'Nunito',marginBottom:8,fontSize:14}},state.dead?`Game over! Score: ${state.score}`:'Use d-pad or arrow keys'),
      React.createElement('button',{onClick:startGame,style:{background:C.teal,color:'#000',border:'none',borderRadius:20,padding:'8px 24px',fontFamily:'Nunito',fontWeight:700,cursor:'pointer',fontSize:14}},'▶ Start')
    ),
    React.createElement('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gridTemplateRows:'1fr 1fr 1fr',gap:4,marginTop:8}},
      React.createElement('div',null),
      dpadBtn('▲',[-1,0],C.teal,'-90deg'),
      React.createElement('div',null),
      dpadBtn('◄',[0,-1],C.yellow,'180deg'),
      React.createElement('div',{style:{width:72,height:72}}),
      dpadBtn('►',[0,1],C.blue,'0deg'),
      React.createElement('div',null),
      dpadBtn('▼',[1,0],C.pink,'90deg'),
      React.createElement('div',null)
    )
  );
}

function BlockDropGame({ C }) {
  const COLS=10, ROWS=18, CELL=26;
  const PIECES = [
    { shape:[[1,1,1,1]], color:'#00ffff' },
    { shape:[[1,1],[1,1]], color:'#ffff00' },
    { shape:[[0,1,1],[1,1,0]], color:'#66ff66' },
    { shape:[[1,1,0],[0,1,1]], color:'#ff5555' },
    { shape:[[1,0,0],[1,1,1]], color:'#ff9933' },
    { shape:[[0,0,1],[1,1,1]], color:'#6699ff' },
    { shape:[[0,1,0],[1,1,1]], color:'#dd66ff' },
  ];
  const LINE_POINTS = [0,100,300,600,1000];

  function emptyBoard(){ return Array(ROWS).fill(null).map(()=>Array(COLS).fill(0)); }
  function randPiece(){ const p=PIECES[Math.floor(Math.random()*PIECES.length)]; return { shape:p.shape, color:p.color, x:3, y:0 }; }
  function rotate(sh){ return sh[0].map((_,i)=>sh.map(r=>r[i]).reverse()); }
  function fits(sh,x,y,b){
    for(let r=0;r<sh.length;r++) for(let c=0;c<sh[r].length;c++){
      if(!sh[r][c]) continue;
      if(y+r>=ROWS||x+c<0||x+c>=COLS||b[y+r]?.[x+c]) return false;
    }
    return true;
  }
  function getGhostY(sh,x,y,b){ let gy=y; while(fits(sh,x,gy+1,b)) gy++; return gy; }

  const [board,setBoard]=React.useState(emptyBoard());
  const [piece,setPiece]=React.useState(null);
  const [nextPiece,setNextPiece]=React.useState(null);
  const [score,setScore]=React.useState(0);
  const [lines,setLines]=React.useState(0);
  const [level,setLevel]=React.useState(1);
  const [best,setBest]=React.useState(0);
  const [running,setRunning]=React.useState(false);
  const [over,setOver]=React.useState(false);
  const [flashRows,setFlashRows]=React.useState([]);
  const bRef=React.useRef(board);
  const pRef=React.useRef(piece);
  const levelRef=React.useRef(level);
  bRef.current=board; pRef.current=piece; levelRef.current=level;

  function merge(sh,x,y,col,b){
    const nb=b.map(r=>[...r]);
    for(let r=0;r<sh.length;r++) for(let c=0;c<sh[r].length;c++){
      if(sh[r][c]) nb[y+r][x+c]=col;
    }
    return nb;
  }
  function clearLines(b){
    const fullRows=b.map((r,i)=>r.every(c=>c)?i:-1).filter(i=>i>=0);
    if(fullRows.length===0) return{nb:b,cleared:0};
    const kept=b.filter(r=>r.some(c=>!c));
    const nb=[...Array(ROWS-kept.length).fill(null).map(()=>Array(COLS).fill(0)),...kept];
    return{nb,cleared:fullRows.length,fullRows};
  }

  function lock(p,b){
    const nb=merge(p.shape,p.x,p.y,p.color,b);
    const{nb:fb,cleared,fullRows}=clearLines(nb);
    if(cleared>0){
      setFlashRows(fullRows||[]);
      setTimeout(()=>setFlashRows([]),300);
    }
    const pts=LINE_POINTS[cleared]*(levelRef.current);
    setScore(s=>{const ns=s+pts; setBest(be=>Math.max(be,ns)); return ns;});
    setLines(l=>{
      const nl=l+cleared;
      setLevel(Math.floor(nl/10)+1);
      return nl;
    });
    setBoard(fb);
    const np=randPiece();
    if(!fits(np.shape,np.x,np.y,fb)){ setRunning(false); setOver(true); setPiece(null); return; }
    setPiece(nextPiece||np);
    setNextPiece(randPiece());
  }

  React.useEffect(()=>{
    if(!running||!piece) return;
    const speed=Math.max(80,500-level*40);
    const t=setInterval(()=>{
      const p=pRef.current; const b=bRef.current;
      if(!p) return;
      if(fits(p.shape,p.x,p.y+1,b)) setPiece(pp=>({...pp,y:pp.y+1}));
      else lock(p,b);
    },speed);
    return()=>clearInterval(t);
  },[running,level,piece?.color]);

  React.useEffect(()=>{
    function onKey(e){
      const p=pRef.current; const b=bRef.current;
      if(!running||!p) return;
      if(e.key==='ArrowLeft'){e.preventDefault();if(fits(p.shape,p.x-1,p.y,b))setPiece(pp=>({...pp,x:pp.x-1}));}
      if(e.key==='ArrowRight'){e.preventDefault();if(fits(p.shape,p.x+1,p.y,b))setPiece(pp=>({...pp,x:pp.x+1}));}
      if(e.key==='ArrowDown'){e.preventDefault();if(fits(p.shape,p.x,p.y+1,b))setPiece(pp=>({...pp,y:pp.y+1})); else lock(p,b);}
      if(e.key==='ArrowUp'){e.preventDefault();const r=rotate(p.shape);if(fits(r,p.x,p.y,b))setPiece(pp=>({...pp,shape:r}));}
      if(e.key===' '){e.preventDefault();let y=p.y;while(fits(p.shape,p.x,y+1,b))y++;lock({...p,y},b);}
    }
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  },[running]);

  function startGame(){
    const np=randPiece();
    setBoard(emptyBoard()); setPiece(np); setNextPiece(randPiece());
    setScore(0); setLines(0); setLevel(1); setRunning(true); setOver(false); setFlashRows([]);
  }
  function move(dx,dy){ const p=pRef.current; const b=bRef.current; if(!p||!running) return; if(fits(p.shape,p.x+dx,p.y+dy,b)) setPiece(pp=>({...pp,x:pp.x+dx,y:pp.y+dy})); else if(dy>0) lock(p,b); }
  function rotatePiece(){ const p=pRef.current; const b=bRef.current; if(!p||!running) return; const r=rotate(p.shape); if(fits(r,p.x,p.y,b)) setPiece(pp=>({...pp,shape:r})); }
  function hardDrop(){ const p=pRef.current; const b=bRef.current; if(!p||!running) return; let y=p.y; while(fits(p.shape,p.x,y+1,b)) y++; lock({...p,y},b); }

  // Build display grid with ghost + active piece
  const display=board.map(r=>r.map(c=>({color:c,ghost:false})));
  if(piece){
    const gy=getGhostY(piece.shape,piece.x,piece.y,board);
    for(let r=0;r<piece.shape.length;r++) for(let c=0;c<piece.shape[r].length;c++){
      if(!piece.shape[r][c]) continue;
      const gr=gy+r, gc=piece.x+c;
      if(gr>=0&&gr<ROWS&&gc>=0&&gc<COLS&&!display[gr][gc].color) display[gr][gc]={color:piece.color,ghost:true};
    }
    for(let r=0;r<piece.shape.length;r++) for(let c=0;c<piece.shape[r].length;c++){
      if(!piece.shape[r][c]) continue;
      const pr=piece.y+r, pc=piece.x+c;
      if(pr>=0&&pr<ROWS&&pc>=0&&pc<COLS) display[pr][pc]={color:piece.color,ghost:false};
    }
  }

  const cells=[];
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
    const {color,ghost}=display[r][c];
    const isFlash=flashRows.includes(r);
    cells.push(React.createElement('div',{key:r+','+c,style:{
      width:CELL,height:CELL,
      background:isFlash?'#ffffff':ghost?color+'33':color||'#0a0a0a',
      border:`1px solid ${color&&!ghost?color+'66':'#1a1a1a'}`,
      boxShadow:color&&!ghost?`inset 0 0 4px ${color}44`:'none',
      transition:isFlash?'none':'background 0.05s'
    }}));
  }

  // Next piece preview
  const nextCells=nextPiece?React.createElement('div',{style:{display:'inline-block',marginLeft:12}},
    React.createElement('p',{style:{color:C.muted,fontFamily:'Nunito',fontSize:11,margin:'0 0 4px',textAlign:'center'}},'NEXT'),
    React.createElement('div',{style:{background:'#0a0a0a',border:`1px solid #1a1a1a`,padding:4,display:'inline-block'}},
      React.createElement('div',{style:{display:'grid',gridTemplateColumns:`repeat(${nextPiece.shape[0].length},16px)`}},
        nextPiece.shape.flatMap((row,r)=>row.map((cell,c)=>React.createElement('div',{key:r+','+c,style:{width:16,height:16,background:cell?nextPiece.color:'transparent',border:cell?`1px solid ${nextPiece.color}66`:'none',boxShadow:cell?`inset 0 0 3px ${nextPiece.color}44`:'none'}})))
      )
    )
  ):null;

  const ctrlBtn=(label,action,color,size)=>React.createElement('button',{
    onClick:action,
    onTouchStart:(e)=>{e.preventDefault();action();},
    style:{flex:1,background:color+'22',border:`2px solid ${color}`,borderRadius:10,padding:size==='lg'?'14px 4px':'10px 4px',color,fontFamily:'Nunito',fontWeight:700,cursor:'pointer',fontSize:size==='lg'?20:16,boxShadow:`0 0 8px ${color}44`,userSelect:'none',touchAction:'none'}
  },label);

  const levelColor=level>=5?C.pink:level>=3?C.yellow:C.teal;

  return React.createElement('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',gap:8}},
    React.createElement('div',{style:{display:'flex',alignItems:'flex-start',gap:0}},
      React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:6,marginRight:10}},
        React.createElement('div',{style:{background:'#0a0a1a',border:`1px solid #1a1a2a`,borderRadius:8,padding:'8px 10px',minWidth:72}},
          React.createElement('p',{style:{color:C.muted,fontFamily:'Nunito',fontSize:10,margin:'0 0 2px',textTransform:'uppercase',letterSpacing:1}},'Score'),
          React.createElement('p',{style:{color:C.teal,fontFamily:'Nunito',fontWeight:800,fontSize:15,margin:0}}),
          React.createElement('p',{style:{color:C.teal,fontFamily:'Nunito',fontWeight:800,fontSize:15,margin:0}},score)
        ),
        React.createElement('div',{style:{background:'#0a0a1a',border:`1px solid #1a1a2a`,borderRadius:8,padding:'8px 10px'}},
          React.createElement('p',{style:{color:C.muted,fontFamily:'Nunito',fontSize:10,margin:'0 0 2px',textTransform:'uppercase',letterSpacing:1}},'Lines'),
          React.createElement('p',{style:{color:C.pink,fontFamily:'Nunito',fontWeight:800,fontSize:15,margin:0}},lines)
        ),
        React.createElement('div',{style:{background:'#0a0a1a',border:`1px solid #1a1a2a`,borderRadius:8,padding:'8px 10px'}},
          React.createElement('p',{style:{color:C.muted,fontFamily:'Nunito',fontSize:10,margin:'0 0 2px',textTransform:'uppercase',letterSpacing:1}},'Level'),
          React.createElement('p',{style:{color:levelColor,fontFamily:'Nunito',fontWeight:800,fontSize:15,margin:0}},level)
        ),
        React.createElement('div',{style:{background:'#0a0a1a',border:`1px solid #1a1a2a`,borderRadius:8,padding:'8px 10px'}},
          React.createElement('p',{style:{color:C.muted,fontFamily:'Nunito',fontSize:10,margin:'0 0 2px',textTransform:'uppercase',letterSpacing:1}},'Best'),
          React.createElement('p',{style:{color:C.yellow,fontFamily:'Nunito',fontWeight:800,fontSize:15,margin:0}},best)
        )
      ),
      React.createElement('div',{style:{position:'relative'}},
        React.createElement('div',{style:{display:'grid',gridTemplateColumns:`repeat(${COLS},${CELL}px)`,border:`2px solid #1a1a2a`,borderRadius:4,background:'#050508'}},cells),
        !running&&React.createElement('div',{style:{position:'absolute',inset:0,background:'rgba(5,5,8,0.88)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderRadius:4}},
          React.createElement('p',{style:{color:over?C.pink:C.purple,fontFamily:'Nunito',fontWeight:800,fontSize:over?18:15,textAlign:'center',margin:'0 0 4px'}},(over?'Game over':'Block Drop')),
          over&&React.createElement('p',{style:{color:C.muted,fontFamily:'Nunito',fontSize:13,margin:'0 0 12px'}},'Score: '+score),
          !over&&React.createElement('p',{style:{color:C.muted,fontFamily:'Nunito Sans',fontSize:12,textAlign:'center',margin:'0 0 12px',lineHeight:1.5}},'Arrow keys or buttons below'),
          React.createElement('button',{onClick:startGame,style:{background:C.purple,color:'#fff',border:'none',borderRadius:20,padding:'8px 24px',fontFamily:'Nunito',fontWeight:700,cursor:'pointer',fontSize:14}},'▶ Start')
        )
      ),
      nextCells
    ),
    running&&React.createElement('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gridTemplateRows:'1fr 1fr',gap:6,width:'100%',maxWidth:COLS*CELL+100}},
      ctrlBtn('↺',rotatePiece,C.teal,'lg'),
      ctrlBtn('▲',()=>hardDrop(),C.pink,'lg'),
      ctrlBtn('⬇',()=>move(0,1),C.yellow,'lg'),
      ctrlBtn('←',()=>move(-1,0),C.blue,'lg'),
      React.createElement('div',{style:{flex:1}}),
      ctrlBtn('→',()=>move(1,0),C.orange,'lg')
    )
  );
}

function NonogramGame({ C }) {
  const PUZZLES = [
    { name:'Heart', size:5,
      rows:[[1],[3],[5],[3],[1]], cols:[[1],[2,1],[5],[2,1],[1]],
      solution:[[0,1,0,1,0],[1,1,1,1,1],[1,1,1,1,1],[0,1,1,1,0],[0,0,1,0,0]] },
    { name:'Star', size:5,
      rows:[[1],[3],[5],[1,1],[3]], cols:[[1,1],[1,1],[5],[1,1],[1,1]],
      solution:[[0,0,1,0,0],[0,1,1,1,0],[1,1,1,1,1],[0,0,1,0,0],[0,1,0,1,0]] },
    { name:'House', size:5,
      rows:[[1],[3],[5],[5],[4]], cols:[[3],[4],[5],[4],[3]],
      solution:[[0,0,1,0,0],[0,1,1,1,0],[1,1,1,1,1],[1,1,1,1,1],[0,1,1,1,0]] },
    { name:'Diamond', size:5,
      rows:[[1],[3],[5],[3],[1]], cols:[[1],[3],[5],[3],[1]],
      solution:[[0,0,1,0,0],[0,1,1,1,0],[1,1,1,1,1],[0,1,1,1,0],[0,0,1,0,0]] },
    { name:'Arrow', size:5,
      rows:[[1],[2],[5],[2],[1]], cols:[[1],[2],[5],[2],[1]],
      solution:[[0,0,1,0,0],[0,0,1,1,0],[1,1,1,1,1],[0,0,1,1,0],[0,0,1,0,0]] },
    { name:'Letter T', size:5,
      rows:[[5],[1],[1],[1],[1]], cols:[[0],[1],[5],[1],[0]],
      solution:[[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]] },
    { name:'Boat', size:6,
      rows:[[1],[3],[5],[6],[2],[2]], cols:[[2],[3],[4],[4],[3],[2]],
      solution:[[0,0,1,0,0,0],[0,1,1,1,0,0],[1,1,1,1,1,0],[1,1,1,1,1,1],[0,1,0,0,1,0],[0,1,0,0,1,0]] },
    { name:'Rocket', size:6,
      rows:[[1],[3],[5],[5],[3],[3]], cols:[[1,1],[1,1],[6],[6],[1,1],[1,1]],
      solution:[[0,0,1,1,0,0],[0,1,1,1,1,0],[1,1,1,1,1,1],[1,1,1,1,1,1],[0,1,0,0,1,0],[0,1,0,0,1,0]] },
  ];

  function cluesFromRow(row){ const res=[]; let c=0; for(let i=0;i<row.length;i++){if(row[i])c++;else if(c>0){res.push(c);c=0;}} if(c>0)res.push(c); return res.length?res:[0]; }
  function cluesMatch(a,b){ if(a.length!==b.length)return false; return a.every((v,i)=>v===b[i]); }

  const [pIdx,setPIdx]=React.useState(0);
  const puz=PUZZLES[pIdx];
  const SIZE=puz.size;
  const [grid,setGrid]=React.useState(Array(SIZE).fill(null).map(()=>Array(SIZE).fill(0)));
  const [won,setWon]=React.useState(false);
  const [drag,setDrag]=React.useState(null);
  const [mistakes,setMistakes]=React.useState(0);
  const [showErrors,setShowErrors]=React.useState(false);

  function selectPuzzle(i){ setPIdx(i); setGrid(Array(PUZZLES[i].size).fill(null).map(()=>Array(PUZZLES[i].size).fill(0))); setWon(false); setShowErrors(false); setMistakes(0); }
  function resetPuzzle(){ setGrid(Array(SIZE).fill(null).map(()=>Array(SIZE).fill(0))); setWon(false); setShowErrors(false); }
  function check(g){ return puz.solution.every((row,r)=>row.every((c,ci)=>!!g[r][ci]===!!c)); }
  function checkErrors(g){ let errs=0; g.forEach((row,r)=>row.forEach((cell,c)=>{ if(cell&&!puz.solution[r][c])errs++; })); return errs; }

  function toggle(r,c,val){
    setGrid(g=>{
      const ng=g.map(row=>[...row]);
      ng[r][c]=val!==undefined?val:ng[r][c]?0:1;
      if(check(ng)){ setWon(true); setShowErrors(false); }
      return ng;
    });
  }

  function handleCheck(){
    const errs=checkErrors(grid);
    setMistakes(errs);
    setShowErrors(true);
    if(errs===0&&check(grid)) setWon(true);
  }

  const CELL=SIZE===6?34:40;
  const CLUE_W=SIZE===6?50:56;

  // Row clue check: is this row's current fill matching the clue?
  function rowCorrect(r){ return cluesMatch(cluesFromRow(grid[r]),puz.rows[r]); }
  function colCorrect(c){ return cluesMatch(cluesFromRow(grid.map(r=>r[c])),puz.cols[c]); }

  return React.createElement('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',gap:10,userSelect:'none'}},
    // Puzzle selector
    React.createElement('div',{style:{display:'flex',gap:6,flexWrap:'wrap',justifyContent:'center',marginBottom:4}},
      PUZZLES.map((p,i)=>React.createElement('button',{key:i,onClick:()=>selectPuzzle(i),style:{
        background:i===pIdx?C.teal+'44':'transparent',
        border:`2px solid ${i===pIdx?C.teal:C.border}`,
        borderRadius:16,padding:'4px 10px',
        color:i===pIdx?C.teal:C.muted,
        fontFamily:'Nunito',cursor:'pointer',fontSize:12,
        fontWeight:i===pIdx?700:400
      }},p.name))
    ),

    // Win banner
    won&&React.createElement('div',{style:{background:C.teal+'22',border:`2px solid ${C.teal}`,borderRadius:12,padding:'12px 20px',textAlign:'center',width:'100%'}},
      React.createElement('p',{style:{color:C.teal,fontFamily:'Nunito',fontWeight:700,fontSize:16,margin:'0 0 4px'}},'🎉 '+puz.name+' solved!'),
      React.createElement('p',{style:{color:C.muted,fontFamily:'Nunito Sans',fontSize:12,margin:'0 0 10px'}},(mistakes===0?'Perfect — no errors!':'Solved with '+mistakes+' error'+(mistakes===1?'':'s'))),
      React.createElement('div',{style:{display:'flex',gap:8,justifyContent:'center'}},
        React.createElement('button',{onClick:resetPuzzle,style:{background:'transparent',border:`1px solid ${C.muted}`,borderRadius:16,padding:'5px 14px',color:C.muted,fontFamily:'Nunito',cursor:'pointer',fontSize:13}},'↺ Replay'),
        pIdx<PUZZLES.length-1&&React.createElement('button',{onClick:()=>selectPuzzle(pIdx+1),style:{background:C.teal,color:'#000',border:'none',borderRadius:16,padding:'5px 16px',fontFamily:'Nunito',fontWeight:700,cursor:'pointer',fontSize:13}},'Next →')
      )
    ),

    // Grid area
    React.createElement('div',{style:{display:'flex',flexDirection:'column'}},
      // Column clues row
      React.createElement('div',{style:{display:'flex'}},
        React.createElement('div',{style:{width:CLUE_W}}),
        puz.cols.map((clue,c)=>React.createElement('div',{key:c,style:{
          width:CELL,textAlign:'center',
          color:colCorrect(c)?C.teal:C.muted,
          fontFamily:'Nunito',fontSize:12,fontWeight:colCorrect(c)?700:400,
          display:'flex',flexDirection:'column',justifyContent:'flex-end',
          paddingBottom:6,height:clue.length*16+8,
          transition:'color 0.2s'
        }},
          clue.map((n,i)=>React.createElement('div',{key:i,style:{lineHeight:'16px'}},n))
        ))
      ),
      // Rows
      puz.rows.map((clue,r)=>React.createElement('div',{key:r,style:{display:'flex',alignItems:'center'}},
        // Row clue
        React.createElement('div',{style:{
          width:CLUE_W,textAlign:'right',paddingRight:10,
          color:rowCorrect(r)?C.teal:C.muted,
          fontFamily:'Nunito',fontSize:13,fontWeight:rowCorrect(r)?700:400,
          transition:'color 0.2s'
        }},clue.join(' ')),
        // Cells
        puz.cols.map((_,c)=>{
          const filled=grid[r][c];
          const isError=showErrors&&filled&&!puz.solution[r][c];
          return React.createElement('div',{key:c,
            onMouseDown:(e)=>{e.preventDefault();const v=grid[r][c]?0:1;setDrag(v);toggle(r,c,v);},
            onMouseEnter:(e)=>{e.preventDefault();if(drag!==null)toggle(r,c,drag);},
            onMouseUp:()=>setDrag(null),
            onTouchStart:(e)=>{e.preventDefault();const v=grid[r][c]?0:1;setDrag(v);toggle(r,c,v);},
            onTouchMove:(e)=>{
              e.preventDefault();
              const touch=e.touches[0];
              const el=document.elementFromPoint(touch.clientX,touch.clientY);
              if(el&&el.dataset.row&&el.dataset.col) toggle(parseInt(el.dataset.row),parseInt(el.dataset.col),drag);
            },
            'data-row':r,'data-col':c,
            style:{
              width:CELL,height:CELL,
              background:isError?C.pink+'88':filled?C.teal:'transparent',
              border:`1px solid ${C.border}`,
              cursor:'pointer',
              transition:'background 0.08s',
              boxShadow:filled&&!isError?`0 0 6px ${C.teal}66`:'none',
            }
          });
        })
      ))
    ),

    // Action buttons
    React.createElement('div',{style:{display:'flex',gap:8,marginTop:4}},
      React.createElement('button',{onClick:resetPuzzle,style:{background:'transparent',border:`1px solid ${C.muted}`,borderRadius:16,padding:'5px 16px',color:C.muted,fontFamily:'Nunito',cursor:'pointer',fontSize:13}},'↺ Reset'),
      !won&&React.createElement('button',{onClick:handleCheck,style:{background:C.yellow+'22',border:`2px solid ${C.yellow}`,borderRadius:16,padding:'5px 16px',color:C.yellow,fontFamily:'Nunito',fontWeight:700,cursor:'pointer',fontSize:13}},'✓ Check')
    ),
    showErrors&&!won&&React.createElement('p',{style:{color:mistakes===0?C.teal:C.pink,fontFamily:'Nunito',fontSize:13,margin:0}},
      mistakes===0?'No errors — keep going!':mistakes+' wrong cell'+(mistakes===1?'':'s')+' highlighted'
    ),
    React.createElement('p',{style:{color:C.muted,fontFamily:'Nunito Sans',fontSize:11,margin:'4px 0 0',textAlign:'center'}},'Click or drag to fill · Row/col clues turn teal when correct')
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

function App() {
  // ── Auth state ─────────────────────────────────────────────────────────────
  const [authScreen, setAuthScreen] = useState("login"); // login | signup
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [accountScreen, setAccountScreen] = useState(false); // show account settings
  const [changePwOld, setChangePwOld] = useState("");
  const [changePwNew, setChangePwNew] = useState("");
  const [changePwMsg, setChangePwMsg] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // ── State ──────────────────────────────────────────────────────────────────
  const [themeId, setThemeId] = useState("dark");
  const C = THEMES[themeId];
  const [themePanelOpen, setThemePanelOpen] = useState(false);
  const [plainLanguage, setPlainLanguage] = useState(false);
  const [needsWizard, setNeedsWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardAnswer, setWizardAnswer] = useState(null);
  const [screen, setScreen] = useState("welcome"); // welcome | home | section
  const [welcomeSlide, setWelcomeSlide] = useState(0);
  const [section, setSection] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [bottomNav, setBottomNav] = useState('checkin'); // checkin | helpme | mystuff | people | more
  const [points, setPoints] = useState(0);
  const [toast, setToast] = useState(null);
  const [toastMsgIdx, setToastMsgIdx] = useState(0);
  const [tierUpModal, setTierUpModal] = useState(null); // { tier } when unlocked
  const [tipIdx, setTipIdx] = useState(0);

  // RSD state
  const [rsdScenario, setRsdScenario] = useState(null);
  const [rsdCustomText, setRsdCustomText] = useState("");
  const [rsdBreathing, setRsdBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState("ready");
  const [breathCount, setBreathCount] = useState(0);
  const [breathCycle, setBreathCycle] = useState(0);
  const [breathCountdown, setBreathCountdown] = useState(0);
  const [rsdAIResult, setRsdAIResult] = useState(null);
  const [rsdLoading, setRsdLoading] = useState(false);
  const [rsdView, setRsdView] = useState("home"); // home | now | understand | skills
  const [affirmIdx, setAffirmIdx] = useState(0);

  // Translate state
  const [translateMode, setTranslateMode] = useState("nt2nd");
  const [translateInput, setTranslateInput] = useState("");
  const [translateResult, setTranslateResult] = useState(null);
  const [translateLoading, setTranslateLoading] = useState(false);
  const [translateHistory, setTranslateHistory] = useState([]);

  // Decode state
  const [decodeContext, setDecodeContext] = useState("work_email");
  const [decodeSituation, setDecodeSituation] = useState("");
  const [decodeQuestion, setDecodeQuestion] = useState("");
  const [decodeResult, setDecodeResult] = useState(null);
  const [decodeLoading, setDecodeLoading] = useState(false);

  // PDA state
  const [pdaSection, setPdaSection] = useState("what");
  const [pdaExpanded, setPdaExpanded] = useState({});
  const [pdaView, setPdaView] = useState("home"); // home | understand | self | others

  // Tasks state
  const [tasks, setTasks] = useState([
    { id: uid(), text: "Reply to that email", tier: "now", done: false, steps: null },
    { id: uid(), text: "Book dentist appointment", tier: "week", done: false, steps: null },
    { id: uid(), text: "Sort through old files", tier: "eventually", done: false, steps: null },
  ]);
  const [taskInput, setTaskInput] = useState("");
  const [taskTier, setTaskTier] = useState("now");
  const [taskLoading, setTaskLoading] = useState(null);

  // Brain Dump state
  const [dumpMode, setDumpMode] = useState("sort");
  const [dumpText, setDumpText] = useState("");
  const [dumpResult, setDumpResult] = useState(null);
  const [dumpLoading, setDumpLoading] = useState(false);

  // Life Stuff state
  const [habits, setHabits] = useState([
    { id: uid(), emoji: "🧺", text: "Put washing on", done: false, lastDone: null },
    { id: uid(), emoji: "👕", text: "Move washing to dryer", done: false, lastDone: null },
    { id: uid(), emoji: "🗑️", text: "Empty bins", done: false, lastDone: null },
    { id: uid(), emoji: "💊", text: "Take medication", done: false, lastDone: null },
    { id: uid(), emoji: "💧", text: "Drink water", done: false, lastDone: null },
    { id: uid(), emoji: "🍽️", text: "Eat something", done: false, lastDone: null },
  ]);
  const [habitEmoji, setHabitEmoji] = useState("⭐");
  const [habitText, setHabitText] = useState("");
  const [editingHabitId, setEditingHabitId] = useState(null);
  const HABIT_EMOJIS = ["⭐","🌟","💪","🧘","🏃","🌿","✏️","🎯","🔑","🧹","📖","🎨"];

  // Mood state
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodNote, setMoodNote] = useState("");
  const [moodHistory, setMoodHistory] = useState([]);

  // Sensory state
  const [sensoryRatings, setSensoryRatings] = useState({});

  // Dopamine sub-nav
  const [dopamineTab, setDopamineTab] = useState("science");
  const [gameTimer, setGameTimer] = useState(null);
  const [gameTimerMins, setGameTimerMins] = useState(null);
  const [gameTimerLeft, setGameTimerLeft] = useState(0);
  const [gameTimerUp, setGameTimerUp] = useState(false);
  const [activeGame, setActiveGame] = useState(null);
  const gameTimerRef = useRef(null);

  // Toolkit state
  const [openTool, setOpenTool] = useState(null);
  const [pinnedTools, setPinnedTools] = useState([]); // [{section, tab, icon, label, color}]
  const [lastUsed, setLastUsed] = useState(null); // {section, tab, icon, label, color}
  const [showAllSections, setShowAllSections] = useState(false);
  const [bodyDoubleTime, setBodyDoubleTime] = useState(25);
  const [bodyDoubleRunning, setBodyDoubleRunning] = useState(false);
  const [bodyDoubleLeft, setBodyDoubleLeft] = useState(0);
  const bodyDoubleRef = useRef(null);
  const [groundingStep, setGroundingStep] = useState(0);
  const [groundingActive, setGroundingActive] = useState(false);
  const [shutdownStep, setShutdownStep] = useState(0);
  const [toolkitBreathing, setToolkitBreathing] = useState(false);
  const [toolkitBreathPhase, setToolkitBreathPhase] = useState("ready");
  const [toolkitBreathCount, setToolkitBreathCount] = useState(0);
  const [toolkitBreathCycle, setToolkitBreathCycle] = useState(0);
  const [toolkitBreathCountdown, setToolkitBreathCountdown] = useState(0);
  const toolkitBreathCountdownRef = useRef(null);
  const [sighPhase, setSighPhase] = useState("ready"); // ready | inhale1 | inhale2 | exhale | done
  const [sighCount, setSighCount] = useState(0);
  const [sighCycle, setSighCycle] = useState(0);
  const [sighRunning, setSighRunning] = useState(false);
  const [tippStep, setTippStep] = useState(0);
  const [haveningStep, setHaveningStep] = useState(0);

  // Disclosure state
  const [disclosureExpanded, setDisclosureExpanded] = useState({});
  const [discDiag, setDiscDiag] = useState("");
  const [discTo, setDiscTo] = useState("");
  const [discTone, setDiscTone] = useState("warm");
  const [discContext, setDiscContext] = useState("");
  const [discResult, setDiscResult] = useState(null);
  const [discLoading, setDiscLoading] = useState(false);

  // Safety plan state
  const [safetyPlanSaved, setSafetyPlanSaved] = useState(false);
  const [safetyPlanEditing, setSafetyPlanEditing] = useState(true);
  const [safetyPlan, setSafetyPlan] = useState({
    warningSign1: "", warningSign2: "", warningSign3: "",
    helpsMe1: "", helpsMe2: "", helpsMe3: "",
    avoidsMe1: "", avoidsMe2: "",
    contact1Name: "", contact1How: "",
    contact2Name: "", contact2How: "",
    safePlace: "", safeObject: "", safePhrase: "",
  });

  // ── localStorage persistence ───────────────────────────────────────────────

  // Load saved session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ndbrainos_session');
      if (saved) {
        const { token, userData } = JSON.parse(saved);
        setAuthToken(token);
        setUser(userData);
        loadUserData(token);
      }
    } catch(e) {}
    setAuthChecked(true);
  }, []);

  // Save session to localStorage when auth changes
  useEffect(() => {
    if (user && authToken) {
      localStorage.setItem('ndbrainos_session', JSON.stringify({ token: authToken, userData: user }));
    } else {
      localStorage.removeItem('ndbrainos_session');
    }
  }, [user, authToken]);

  async function loadUserData(token) {
    try {
      const profile = await supabase('GET', `profiles?id=eq.${user?.id || ''}&select=*`, null, token);
      if (profile && profile[0]) {
        if (profile[0].theme_id) setThemeId(profile[0].theme_id);
        if (profile[0].plain_language !== undefined) setPlainLanguage(profile[0].plain_language);
        if (profile[0].points) setPoints(profile[0].points);
        if (profile[0].screen && profile[0].screen !== 'welcome') setScreen(profile[0].screen);
      }
      const taskData = await supabase('GET', `tasks?user_id=eq.${user?.id || ''}&order=created_at`, null, token);
      if (taskData && taskData.length) setTasks(taskData.map(t => ({ id: t.id, text: t.text, tier: t.tier, done: t.done, steps: t.steps })));
      const habitData = await supabase('GET', `habits?user_id=eq.${user?.id || ''}&order=created_at`, null, token);
      if (habitData && habitData.length) setHabits(habitData.map(h => ({ id: h.id, emoji: h.emoji, text: h.text, done: h.done, lastDone: h.last_done })));
      const moodData = await supabase('GET', `mood_history?user_id=eq.${user?.id || ''}&order=created_at.desc&limit=30`, null, token);
      if (moodData && moodData.length) setMoodHistory(moodData.map(m => ({ mood: m.mood, note: m.note, date: m.created_at })));
      const spData = await supabase('GET', `safety_plans?user_id=eq.${user?.id || ''}&select=*`, null, token);
      if (spData && spData[0]) { setSafetyPlan(spData[0].plan); setSafetyPlanSaved(spData[0].saved); setSafetyPlanEditing(!spData[0].saved); }
    } catch(e) { console.log('Load error', e); }
  }

  async function handleSignUp() {
    setAuthLoading(true); setAuthError(null);
    try {
      const res = await sbAuth('signup', authEmail, authPassword);
      if (res.error) { setAuthError(res.error.message || 'Sign up failed — please try again'); setAuthLoading(false); return; }
      if (res.access_token) {
        setAuthToken(res.access_token); setUser(res.user); setScreen('welcome');
      } else {
        setAuthError('Could not create account — please try again');
      }
    } catch(e) {
      setAuthError('Could not connect — please check your internet connection');
    }
    setAuthLoading(false);
  }

  async function handleLogin() {
    setAuthLoading(true); setAuthError(null);
    try {
      const res = await sbAuth('token?grant_type=password', authEmail, authPassword);
      if (res.error) { setAuthError(res.error.message || res.msg || 'Login failed — please check your email and password'); setAuthLoading(false); return; }
      if (res.access_token) {
        setAuthToken(res.access_token);
        setUser(res.user);
        try { await loadUserData(res.access_token); } catch(e) { console.log('Load data error', e); }
        setScreen('home');
      } else {
        setAuthError('Something went wrong — please try again');
      }
    } catch(e) {
      setAuthError('Could not connect — please check your internet connection');
    }
    setAuthLoading(false);
  }

  async function handleSignOut() {
    if (authToken) await sbSignOut(authToken);
    setUser(null); setAuthToken(null); setScreen('welcome');
    localStorage.removeItem('ndbrainos_session');
  }

  // Auto-save to Supabase when key data changes
  useEffect(() => {
    if (!user || !authToken) return;
    const t = setTimeout(async () => {
      try {
        await supabase('PATCH', `profiles?id=eq.${user.id}`, { theme_id: themeId, plain_language: plainLanguage, points, screen }, authToken);
      } catch(e) {}
    }, 1000);
    return () => clearTimeout(t);
  }, [themeId, plainLanguage, points, screen, user, authToken]);

  function navigateTo(sectionId, tabId) {
    const sec = SECTIONS[sectionId];
    const tab = sec?.tabs.find(t => t.id === tabId);
    if (tab) setLastUsed({ section: sectionId, tab: tabId, icon: tab.icon, label: tab.name, color: sec.color });
    setSection(sectionId);
    setActiveTab(tabId);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  // Plain style helpers — NO JSX
  const cs = (base, extra) => ({ ...base, ...extra });
  const gt = (c1, c2, dir) => `linear-gradient(${dir||135}deg, ${c1}, ${c2})`;

  function getCurrentTier() {
    for (let i = REWARD_TIERS.length - 1; i >= 0; i--) {
      if (points >= REWARD_TIERS[i].min) return REWARD_TIERS[i];
    }
    return REWARD_TIERS[0];
  }

  function awardPoints(pts, msg) {
    setPoints(p => {
      const oldTier = REWARD_TIERS.slice().reverse().find(t => p >= t.min);
      const newTotal = p + pts;
      const newTier = REWARD_TIERS.slice().reverse().find(t => newTotal >= t.min);
      if (newTier && oldTier && newTier.min > oldTier.min) {
        setTimeout(() => setTierUpModal(newTier), 400);
      }
      return newTotal;
    });
    const m = msg || REWARD_MESSAGES[toastMsgIdx % REWARD_MESSAGES.length];
    setToastMsgIdx(i => i + 1);
    setToast(m);
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    const t = setInterval(() => setTipIdx(i => (i + 1) % TIPS.length), 6000);
    return () => clearInterval(t);
  }, []);

  // Breathing for RSD tab
  useEffect(() => {
    if (!rsdBreathing) return;
    const phases = [
      { name: "in", dur: 4000, secs: 4 },
      { name: "hold", dur: 4000, secs: 4 },
      { name: "out", dur: 6000, secs: 6 },
    ];
    let phaseIdx = 0;
    let cycle = 0;
    let cdInterval;
    function startCountdown(secs) {
      clearInterval(cdInterval);
      setBreathCountdown(secs);
      cdInterval = setInterval(() => setBreathCountdown(n => n > 1 ? n - 1 : n), 1000);
    }
    setBreathPhase("in"); setBreathCount(0); setBreathCycle(0);
    startCountdown(phases[0].secs);
    let t;
    function nextPhase() {
      phaseIdx++;
      if (phaseIdx >= phases.length) { phaseIdx = 0; cycle++; }
      if (cycle >= 3) {
        clearInterval(cdInterval);
        setRsdBreathing(false); setBreathPhase("done"); handleRsdAI(); return;
      }
      setBreathPhase(phases[phaseIdx].name);
      setBreathCycle(cycle); setBreathCount(phaseIdx);
      startCountdown(phases[phaseIdx].secs);
      t = setTimeout(nextPhase, phases[phaseIdx].dur);
    }
    t = setTimeout(nextPhase, phases[0].dur);
    return () => { clearTimeout(t); clearInterval(cdInterval); };
  }, [rsdBreathing]);

  // Breathing for toolkit
  useEffect(() => {
    if (!toolkitBreathing) return;
    const phases = ["in","hold","out"];
    const durs =  [4000, 4000, 6000];
    const secs =  [4,    4,    6];
    let pi=0, cy=0;
    setToolkitBreathPhase("in"); setToolkitBreathCount(0); setToolkitBreathCycle(0);
    clearInterval(toolkitBreathCountdownRef.current);
    setToolkitBreathCountdown(secs[0]);
    toolkitBreathCountdownRef.current = setInterval(() => setToolkitBreathCountdown(n => n > 1 ? n - 1 : n), 1000);
    let t;
    function next() {
      pi++; if(pi>=3){pi=0;cy++;}
      if(cy>=3){
        clearInterval(toolkitBreathCountdownRef.current);
        setToolkitBreathing(false); setToolkitBreathPhase("done"); return;
      }
      setToolkitBreathPhase(phases[pi]); setToolkitBreathCount(pi); setToolkitBreathCycle(cy);
      clearInterval(toolkitBreathCountdownRef.current);
      setToolkitBreathCountdown(secs[pi]);
      toolkitBreathCountdownRef.current = setInterval(() => setToolkitBreathCountdown(n => n > 1 ? n - 1 : n), 1000);
      t=setTimeout(next,durs[pi]);
    }
    t=setTimeout(next,durs[0]);
    return()=>{ clearTimeout(t); clearInterval(toolkitBreathCountdownRef.current); };
  },[toolkitBreathing]);

  // Physiological sigh timer
  useEffect(() => {
    if (!sighRunning) return;
    // phases: inhale1 (4s), inhale2 sniff (1s), exhale long (8s) — repeat 5 times
    const SEQ = [
      { phase: "inhale1", dur: 4000 },
      { phase: "inhale2", dur: 1000 },
      { phase: "exhale",  dur: 8000 },
    ];
    let pi = 0, cy = 0;
    setSighPhase(SEQ[0].phase); setSighCycle(0);
    let t;
    function next() {
      pi++;
      if (pi >= SEQ.length) { pi = 0; cy++; }
      if (cy >= 5) { setSighRunning(false); setSighPhase("done"); return; }
      setSighPhase(SEQ[pi].phase); setSighCycle(cy);
      t = setTimeout(next, SEQ[pi].dur);
    }
    t = setTimeout(next, SEQ[0].dur);
    return () => clearTimeout(t);
  }, [sighRunning]);

  // Game timer
  useEffect(() => {
    if (!gameTimer) return;
    clearInterval(gameTimerRef.current);
    gameTimerRef.current = setInterval(() => {
      setGameTimerLeft(l => {
        if (l <= 1) {
          clearInterval(gameTimerRef.current);
          setGameTimerUp(true);
          setActiveGame(null);
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(gameTimerRef.current);
  }, [gameTimer]);

  // Body double timer
  useEffect(() => {
    if (!bodyDoubleRunning) return;
    clearInterval(bodyDoubleRef.current);
    bodyDoubleRef.current = setInterval(() => {
      setBodyDoubleLeft(l => {
        if (l <= 1) { clearInterval(bodyDoubleRef.current); setBodyDoubleRunning(false); return 0; }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(bodyDoubleRef.current);
  }, [bodyDoubleRunning]);

  async function handleRsdAI() {
    const sc = rsdScenario;
    if (!sc) return;
    setRsdLoading(true);
    const situation = sc.id === "custom" ? rsdCustomText : sc.label;
    const result = await callClaudeJSON(
      `Someone with RSD (Rejection Sensitive Dysphoria) is upset about: "${situation}". Provide compassionate support as JSON with fields: validation (1 sentence empathising), reality_check (1-2 sentences with evidence it's probably not rejection), evidence_test (one gentle question to test the thought), grounding_phrase (short, poetic, 6-10 words), what_to_do_now (2-3 concrete small steps).`,
      "You are a warm, neurodivergence-informed therapist. Respond with valid JSON only."
    );
    setRsdAIResult(result);
    setRsdLoading(false);
  }

  async function handleTranslate() {
    if (!translateInput.trim()) return;
    setTranslateLoading(true);
    let prompt, fields;
    if (translateMode === "nt2nd") {
      prompt = `Translate this neurotypical communication for a neurodivergent person: "${translateInput}". JSON: { what_they_said, what_they_likely_meant, what_they_expect_next, hidden_subtext, nd_friendly_version }`;
    } else if (translateMode === "nd2nt") {
      prompt = `Help package this honest neurodivergent communication for a neurotypical audience: "${translateInput}". JSON: { your_core_message, nt_friendly_version, what_to_leave_out, tone_tip, example_opener }`;
    } else {
      prompt = `Explain this unwritten social rule for a neurodivergent person: "${translateInput}". JSON: { the_rule, why_it_exists, what_happens_if_broken, nd_perspective, how_to_navigate }`;
    }
    const result = await callClaudeJSON(prompt, "Respond with valid JSON only. Be warm, direct, neurodivergence-affirming.");
    setTranslateResult(result);
    setTranslateHistory(h => [{ mode: translateMode, input: translateInput, result, id: uid() }, ...h.slice(0, 7)]);
    setTranslateLoading(false);
  }

  async function handleDecode() {
    if (!decodeSituation.trim()) return;
    setDecodeLoading(true);
    let prompt;
    if (decodeContext === "body_language") {
      prompt = `Decode this body language situation for a neurodivergent person: "${decodeSituation}". JSON: { what_you_observed, common_nd_misread, likely_reality, cultural_note, what_to_do }`;
    } else {
      prompt = `Decode this social situation for a neurodivergent person. Context type: ${decodeContext}. Situation: "${decodeSituation}". Question: "${decodeQuestion}". JSON: { literal_meaning, intended_meaning, emotional_subtext, what_they_expect_next, how_to_respond }`;
    }
    const result = await callClaudeJSON(prompt, "You are a social interpreter for neurodivergent people. Respond with valid JSON only.");
    setDecodeResult(result);
    setDecodeLoading(false);
  }

  async function handleTaskBreakdown(taskId) {
    setTaskLoading(taskId);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const result = await callClaudeJSON(
      `Break down this task for someone with ADHD into 4-5 tiny concrete steps. Task: "${task.text}". Return a JSON array of step strings only, no other text. Example: ["Open the email app","Find the email","Click reply","Type one sentence","Press send"]`,
      "Return ONLY a valid JSON array of step strings. No other text."
    );
    const steps = Array.isArray(result) ? result : [];
    setTasks(ts => ts.map(t => t.id === taskId ? { ...t, steps } : t));
    setTaskLoading(null);
  }

  async function handleBrainDump() {
    if (!dumpText.trim()) return;
    setDumpLoading(true);
    let prompt;
    if (dumpMode === "sort") {
      prompt = `Sort this brain dump into categories. Text: "${dumpText}". JSON: { categories: [{name, items:[...]}], key_insight, one_thing_to_start }`;
    } else if (dumpMode === "whatfirst") {
      prompt = `Help prioritise this brain dump. Text: "${dumpText}". JSON: { the_one_thing, why_this_first, tiny_first_step, everything_else }`;
    } else {
      prompt = `Respond to this emotional brain dump with compassion. Text: "${dumpText}". JSON: { what_i_hear, validation, gentle_reframe, one_kind_thought }`;
    }
    const result = await callClaudeJSON(prompt, "You are a compassionate ADHD coach. Valid JSON only.");
    setDumpResult(result);
    setDumpLoading(false);
  }

  async function handleDisclosure() {
    setDiscLoading(true);
    const result = await callClaudeJSON(
      `Generate a personalised disclosure script. Diagnosis: ${discDiag}. Disclosing to: ${discTo}. Tone: ${discTone}. Extra context: "${discContext}". JSON: { script, key_points: [...], anticipate: [...], your_rights }`,
      "You are a neurodivergence advocate. Valid JSON only. Script should be warm, clear, and under 200 words."
    );
    setDiscResult(result);
    setDiscLoading(false);
  }

  function startGameWithTimer(mins) {
    setGameTimerMins(mins);
    setGameTimerLeft(mins * 60);
    setGameTimerUp(false);
    setGameTimer(Date.now());
  }

  function fmtTime(s) { return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; }

  // ── Style primitives ───────────────────────────────────────────────────────
  const card = (extra) => ({ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, ...extra });
  const shimmerStyle = { background: gt(C.teal, C.pink), WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' };
  const btn = (color, extra) => ({ background: color + '22', border: `2px solid ${color}`, borderRadius: 20, padding: '8px 18px', color, fontFamily: 'Nunito', fontWeight: 700, cursor: 'pointer', fontSize: 14, transition: 'all 0.2s', ...extra });
  const pill = (active, color) => ({ background: active ? color + '33' : 'transparent', border: `1.5px solid ${active ? color : C.border}`, borderRadius: 20, padding: '6px 14px', color: active ? color : C.muted, fontFamily: 'Nunito', fontSize: 13, cursor: 'pointer', fontWeight: active ? 700 : 400, transition: 'all 0.2s' });
  const input = (extra) => ({ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '10px 14px', color: C.text, fontFamily: 'Nunito Sans', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', ...extra });
  const textareaStyle = (extra) => ({ ...input(), resize: 'vertical', ...extra });

  // Breathing orb
  function BreathOrb({ phase, countdown }) {
    const scale = phase === "in" ? 1.6 : phase === "hold" ? 1.6 : 1;
    const transDur = phase === "in" ? "4s" : phase === "hold" ? "0.3s" : "6s";
    const color = phase === "in" ? C.teal : phase === "hold" ? C.blue : C.pink;
    const label = phase === "in" ? "Breathe IN" : phase === "hold" ? "Hold..." : phase === "out" ? "Breathe OUT" : phase === "done" ? "✓ Done" : "Ready";
    return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '20px 0' } },
      React.createElement('div', { style: { width: 100, height: 100, borderRadius: '50%', background: color + '33', border: `3px solid ${color}`, transform: `scale(${scale})`, transition: `transform ${transDur} ease-in-out, background 1s, border-color 1s`, boxShadow: `0 0 40px ${color}66, 0 0 80px ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
        countdown > 0 && phase !== "done" && phase !== "ready"
          ? React.createElement('span', { style: { color, fontFamily: 'Nunito', fontWeight: 900, fontSize: 28, lineHeight: 1 } }, countdown)
          : React.createElement('div', { style: { width: 40, height: 40, borderRadius: '50%', background: color, opacity: 0.7 } })
      ),
      React.createElement('p', { style: { color, fontFamily: 'Nunito', fontWeight: 700, fontSize: 18, margin: 0, marginTop: 16 } }, label)
    );
  }

  // AI result block
  function AIBlock({ label, value, color }) {
    if (!value) return null;
    return React.createElement('div', { style: { background: (color || C.teal) + '18', border: `1px solid ${(color || C.teal)}44`, borderRadius: 12, padding: 14, marginBottom: 10 } },
      React.createElement('p', { style: { color: color || C.teal, fontFamily: 'Nunito', fontWeight: 700, fontSize: 12, margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: 1 } }, label),
      React.createElement('p', { style: { color: C.text, fontFamily: 'Nunito Sans', fontSize: 14, margin: 0, lineHeight: 1.6 } }, typeof value === 'string' ? value : Array.isArray(value) ? value.join(' • ') : JSON.stringify(value))
    );
  }

  // ── Section definitions ────────────────────────────────────────────────────
  const SECTIONS = {
    communication: {
      label: "💬 Communication", color: C.pink,
      tabs: [
        { id: "rsd", icon: "🛡️", name: plainLanguage ? "Everyone hates me" : "RSD", desc: plainLanguage ? "When you're convinced someone is angry with you or hates you" : "Spiralling about how someone responded? Start here" },
        { id: "translate", icon: "💬", name: plainLanguage ? "Help me understand" : "Translate", desc: plainLanguage ? "Work out what someone meant, or say something clearly" : "Decode what they meant, or phrase things for a NT audience" },
        { id: "decode", icon: "🔍", name: plainLanguage ? "What did that mean?" : "Decode", desc: plainLanguage ? "Make sense of something confusing that just happened" : "Make sense of a specific situation or interaction" },
        { id: "pda", icon: "🌊", name: plainLanguage ? "Why I avoid things" : "PDA", desc: plainLanguage ? "When you can't make yourself do things even when you want to" : "Understand demand avoidance and work with it" },
      ]
    },
    mybrain: {
      label: "🧠 My Brain", color: C.teal,
      tabs: [
        { id: "tasks", icon: "✦", name: plainLanguage ? "What do I need to do?" : "Tasks", desc: plainLanguage ? "Write down what needs doing and break it into small steps" : "Capture what needs doing and break it into steps" },
        { id: "braindump", icon: "🧠", name: plainLanguage ? "Empty my head" : "Brain Dump", desc: plainLanguage ? "Get everything out of your brain — we'll help you sort it" : "Empty your head — sort it, prioritise it, or just feel heard" },
        { id: "habits", icon: "🔁", name: plainLanguage ? "Daily life stuff" : "Life Stuff", desc: plainLanguage ? "The everyday things that are easy to forget" : "The daily life stuff that's easy to lose track of" },
      ]
    },
    regulate: {
      label: "⚡ Regulate", color: C.yellow,
      tabs: [
        { id: "mood", icon: "🌡️", name: plainLanguage ? "How am I feeling?" : "Mood", desc: plainLanguage ? "Check in with yourself and get what you need" : "Name how you're feeling and get what you need" },
        { id: "sensory", icon: "👁️", name: plainLanguage ? "Is my body overwhelmed?" : "Sensory", desc: plainLanguage ? "Check if sound, light or touch is too much right now" : "Check your sensory levels across sound, light, touch and more" },
        { id: "dopamine", icon: "⚡", name: plainLanguage ? "Brain needs a boost" : "Dopamine", desc: plainLanguage ? "Quick, healthy things to help your brain feel better" : "Understand your brain chemistry — and get quick, healthy hits" },
        { id: "toolkit", icon: "🧰", name: plainLanguage ? "Help me calm down" : "Toolkit", desc: plainLanguage ? "Breathing, grounding and calming tools that actually work" : "Breathing, grounding, body double, and regulation tools" },
      ]
    },
    aboutme: {
      label: "💙 About Me", color: C.blue,
      tabs: [
        { id: "disclosure", icon: "💙", name: plainLanguage ? "How do I explain myself?" : "Disclosure", desc: plainLanguage ? "Scripts for telling people about your diagnosis" : "Scripts for telling people about your diagnosis — in your own words" },
      ]
    },
    safetyplan: {
      label: "🛟 Safety Plan", color: C.purple,
      tabs: [
        { id: "safetyplan", icon: "🛟", name: plainLanguage ? "My crisis plan" : "My Safety Plan", desc: plainLanguage ? "Your plan for when everything gets too much" : "Your personal plan for meltdown and overwhelm — written by you, for you" },
      ]
    },
  };

  const HOME_CARDS = [
    { id: "communication", icon: "💬", label: "Communication", tagline: plainLanguage ? "When people are hard to understand — or you're hard to understand" : "When people are confusing or you're struggling to be understood", tags: plainLanguage ? ["Everyone hates me", "Help me understand", "What did that mean?", "Why I avoid things"] : ["RSD", "Translate", "Decode", "PDA"], color: C.pink },
    { id: "mybrain", icon: "🧠", label: "My Brain", tagline: plainLanguage ? "Get things out of your head and work out what to do" : "Capture thoughts, break down tasks and stay on top of the basics", tags: plainLanguage ? ["What do I need to do?", "Empty my head", "Daily life stuff"] : ["Tasks", "Brain Dump", "Life Stuff"], color: C.teal },
    { id: "regulate", icon: "⚡", label: "Regulate", tagline: plainLanguage ? "When your body or brain feels too much right now" : "When your nervous system needs support right now", tags: plainLanguage ? ["How am I feeling?", "Is my body overwhelmed?", "Brain needs a boost", "Help me calm down"] : ["Mood", "Sensory", "Dopamine", "Toolkit"], color: C.yellow },
    { id: "aboutme", icon: "💙", label: "About Me", tagline: plainLanguage ? "How to explain yourself to other people" : "Scripts and language to explain yourself to others — on your terms", tags: plainLanguage ? ["How do I explain myself?"] : ["Disclosure"], color: C.blue },
    { id: "safetyplan", icon: "🛟", label: "Safety Plan", tagline: plainLanguage ? "Your personal plan for when things get really hard" : "Build your personal crisis plan when you're calm — so it's there when you're not", tags: plainLanguage ? ["Meltdown", "Too much", "Crisis"] : ["Meltdown", "Overwhelm", "Crisis"], color: C.purple },
  ];

  // Plain language substitutions
  const PL = plainLanguage ? {
    rsd: "the 'everyone hates me' feeling",
    pda: "demand avoidance",
    rsdTab: "When everyone seems to hate me",
    translateTab: "Help me understand people",
    decodeTab: "What did that mean?",
    pdaTab: "Why I avoid things",
    tasksTab: "What do I need to do?",
    brainDumpTab: "Empty my head",
    habitsTab: "Daily life stuff",
    moodTab: "How am I feeling?",
    sensoryTab: "Is my body overwhelmed?",
    dopamineTab: "My brain needs a boost",
    toolkitTab: "Help me calm down",
    disclosureTab: "How do I explain myself?",
    safetyPlanTab: "My crisis plan",
  } : {};

  // Wizard flow — "What do I need right now?"
  const WIZARD_STEPS = [
    {
      q: "How are you feeling right now?",
      options: [
        { label: "😰 Anxious or overwhelmed", next: "overwhelmed" },
        { label: "😢 Hurt or rejected", next: "rejected" },
        { label: "😶 Numb or shut down", next: "shutdown" },
        { label: "😤 Frustrated or angry", next: "frustrated" },
        { label: "😵 Can't think straight", next: "foggy" },
        { label: "😐 Okay but need to get stuff done", next: "tasks" },
      ]
    }
  ];
  const WIZARD_ROUTES = {
    overwhelmed: { icon: "⚡", label: "Try the Toolkit", desc: "Breathing, grounding and calming tools", section: "regulate", tab: "toolkit" },
    rejected: { icon: "🛡️", label: plainLanguage ? "The 'everyone hates me' feeling" : "RSD support", desc: "Reality checks and breathing for rejection spirals", section: "communication", tab: "rsd" },
    shutdown: { icon: "🔋", label: "Shutdown support", desc: "Step-by-step guide for meltdown and shutdown", section: "regulate", tab: "toolkit", openTool: "shutdown" },
    frustrated: { icon: "🌊", label: "Regulate your body first", desc: "Physical techniques to bring your nervous system down", section: "regulate", tab: "toolkit" },
    foggy: { icon: "🧠", label: "Brain Dump", desc: "Get everything out of your head — we'll sort it", section: "mybrain", tab: "braindump" },
    tasks: { icon: "✦", label: "Tasks", desc: "Capture what needs doing and break it down", section: "mybrain", tab: "tasks" },
  };

  const tier = getCurrentTier();
  const nextTier = REWARD_TIERS[REWARD_TIERS.indexOf(tier) + 1];
  const tierPct = nextTier ? ((points - tier.min) / (nextTier.min - tier.min)) * 100 : 100;

  // ── Welcome Screen ─────────────────────────────────────────────────────────
  if (screen === "welcome") {
    const slides = [
      {
        icon: "🧠", title: "Steady",
        sub: "Built for brains that work differently",
        body: "This isn't a productivity app. It's a support system — for the hard days, the confusing moments, and everything in between. Made specifically for neurodivergent people, by people who get it.",
      },
      {
        icon: "💬", title: "Communication",
        sub: "When people are hard to read — or you're hard to understand",
        body: "Decode what someone actually meant. Translate your thoughts for a neurotypical audience. Get a reality check when your brain is telling you someone hates you. Understand your PDA profile.",
      },
      {
        icon: "🧠", title: "My Brain",
        sub: "Capture, organise, and actually follow through",
        body: "Quick-capture tasks and sort them by urgency. Brain dump everything cluttering your head and let AI sort it. Track the invisible life stuff that neurotypical people somehow just do.",
      },
      {
        icon: "⚡", title: "Regulate",
        sub: "For when your nervous system needs help right now",
        body: "Check in on your mood and get what you need. Monitor your sensory levels. Learn your dopamine patterns. Access breathing, grounding, havening, and other evidence-based regulation tools.",
      },
      {
        icon: "💙", title: "About Me",
        sub: "Your story, on your terms",
        body: "Scripts for disclosing your diagnosis — to your manager, your partner, or anyone who says 'everyone's a bit like that'. Written for real situations, not textbook ones.",
      },
      {
        icon: "🛟", title: "Safety Plan",
        sub: "Your personal crisis plan — written when you're calm",
        body: "Build a plan for overwhelm and meltdown before you need it. Your warning signs, what helps, what makes it worse, who to call. There when your brain can't access any of this.",
      },
      {
        icon: "💜", title: "You're not broken",
        sub: null, disclaimer: true,
      },
    ];
    const sl = slides[welcomeSlide];

    return React.createElement('div', {
      style: { minHeight: '100vh', background: WC.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', fontFamily: 'Nunito, sans-serif' }
    },
      // Floating words
      React.createElement('style', null, `
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Nunito+Sans:wght@400;500;600;700&display=swap');
        @keyframes floatWord { 0%{opacity:0;transform:translateY(0) translateX(0);} 20%{opacity:0.06;} 80%{opacity:0.03;} 100%{opacity:0;transform:translateY(-120px) translateX(30px);} }
        @keyframes shimmer { 0%{background-position:0% 50%;} 50%{background-position:100% 50%;} 100%{background-position:0% 50%;} }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }
        @keyframes blobFloat { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(20px,-20px) scale(1.1);} }
      `),
      ND_WORDS.map((w, i) => React.createElement('div', { key: w, style: { position: 'absolute', left: `${5 + (i * 17) % 90}%`, top: `${10 + (i * 23) % 80}%`, color: WC.teal, fontSize: 11 + (i % 4) * 3, opacity: 0.04, fontFamily: 'Nunito', fontWeight: 700, pointerEvents: 'none', animation: `floatWord ${6 + i % 5}s ease-in-out ${i * 0.5}s infinite`, whiteSpace: 'nowrap' } }, w)),
      // Blobs
      React.createElement('div', { style: { position: 'absolute', top: '10%', left: '5%', width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, ${WC.b1}, transparent 70%)`, animation: 'blobFloat 8s ease-in-out infinite', pointerEvents: 'none' } }),
      React.createElement('div', { style: { position: 'absolute', bottom: '10%', right: '5%', width: 250, height: 250, borderRadius: '50%', background: `radial-gradient(circle, ${WC.b2}, transparent 70%)`, animation: 'blobFloat 10s ease-in-out 2s infinite', pointerEvents: 'none' } }),

      React.createElement('div', { style: { textAlign: 'center', zIndex: 10, padding: '0 24px', maxWidth: 480 } },
        React.createElement('div', { style: { fontSize: 56, marginBottom: 12 } }, sl.icon),
        React.createElement('h1', { style: { fontSize: 30, fontWeight: 900, margin: '0 0 8px', background: `linear-gradient(135deg, ${WC.teal}, ${WC.pink}, ${WC.blue})`, backgroundSize: '200% 200%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'shimmer 3s ease infinite' } }, sl.title),
        sl.sub && React.createElement('p', { style: { color: WC.teal, fontSize: 14, fontFamily: 'Nunito', fontWeight: 700, margin: '0 0 12px', opacity: 0.9 } }, sl.sub),
        sl.body && React.createElement('p', { style: { color: WC.muted, fontSize: 14, fontFamily: 'Nunito Sans', margin: '0 0 20px', lineHeight: 1.7 } }, sl.body),
        sl.disclaimer && React.createElement('div', { style: { background: WC.card, border: `1px solid ${WC.border}`, borderRadius: 12, padding: 16, marginBottom: 20, textAlign: 'left' } },
          React.createElement('p', { style: { color: WC.muted, fontSize: 12, fontFamily: 'Nunito Sans', margin: 0, lineHeight: 1.6 } }, "This app is for informational and self-support purposes only. It is not a substitute for professional medical or mental health advice."),
          React.createElement('button', { onClick: () => setScreen("home"), style: { marginTop: 16, width: '100%', background: `linear-gradient(135deg, ${WC.teal}, ${WC.pink})`, border: 'none', borderRadius: 20, padding: '14px', color: '#000', fontFamily: 'Nunito', fontWeight: 800, fontSize: 18, cursor: 'pointer' } }, "Enter Steady →")
        ),

        // Dot progress
        React.createElement('div', { style: { display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 } },
          slides.map((_, i) => React.createElement('div', { key: i, style: { width: i === welcomeSlide ? 20 : 8, height: 8, borderRadius: 4, background: i === welcomeSlide ? WC.teal : WC.border, transition: 'all 0.3s' } }))
        ),

        !sl.disclaimer && React.createElement('div', { style: { display: 'flex', gap: 12, justifyContent: 'center' } },
          React.createElement('button', { onClick: () => setWelcomeSlide(Math.max(0, welcomeSlide - 1)), style: { ...btn(WC.muted, { opacity: welcomeSlide === 0 ? 0.3 : 1 }) } }, '← Back'),
          React.createElement('button', { onClick: () => setWelcomeSlide(Math.min(slides.length - 1, welcomeSlide + 1)), style: btn(WC.teal) }, 'Next →'),
          React.createElement('button', { onClick: () => setWelcomeSlide(slides.length - 1), style: btn(WC.muted) }, 'Skip'),
        )
      )
    );
  }

  // ── Tab Renderers ──────────────────────────────────────────────────────────

  function renderRSD() {
    const GROUNDING = ["5 things you can see", "4 things you can touch", "3 things you can hear", "2 things you can smell", "1 thing you can taste"];

    function backBtn() {
      return React.createElement('button', {
        onClick: () => { setRsdView("home"); setRsdScenario(null); setRsdAIResult(null); setBreathPhase("ready"); setRsdBreathing(false); },
        style: { ...btn(C.muted, { marginBottom: 16, fontSize: 12 }) }
      }, '← Back');
    }

    // ── HOME VIEW ─────────────────────────────────────────────────────────────
    if (rsdView === "home") return React.createElement('div', { style: { padding: '0 4px' } },
      React.createElement('div', { style: { background: C.pink + '0e', border: `1.5px solid ${C.pink}33`, borderRadius: 16, padding: '16px', marginBottom: 20 } },
        React.createElement('p', { style: { color: C.pink, fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, margin: '0 0 6px' } }, '🛡️ Rejection Sensitive Dysphoria'),
        React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, margin: 0, lineHeight: 1.6 } }, 'The sudden, overwhelming feeling that someone is angry with you, that you\'ve ruined everything, or that everyone secretly hates you. It is neurobiological — not a personality flaw. And there are real ways through it.')
      ),
      [
        { id: "now", icon: "🚨", label: "I'm spiralling right now", desc: "Get an immediate reality check, breathing, and AI support", color: C.pink },
        { id: "understand", icon: "🧠", label: "Understand my RSD", desc: "What it is, why it happens, and how to recognise your patterns", color: C.purple },
        { id: "skills", icon: "🛠️", label: "Skills & tactics", desc: "Practical techniques to interrupt and soften the spiral", color: C.teal },
        { id: "resources", icon: "📚", label: "Helpful resources", desc: "Links to articles, videos, worksheets and support directories", color: C.blue },
      ].map(v => React.createElement('button', {
        key: v.id, onClick: () => setRsdView(v.id),
        style: {
          display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left',
          background: v.color + '0e', border: `1.5px solid ${v.color}33`,
          borderRadius: 16, padding: '16px', marginBottom: 10, cursor: 'pointer',
        }
      },
        React.createElement('div', { style: { width: 46, height: 46, borderRadius: 12, background: v.color + '22', border: `1.5px solid ${v.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 } }, v.icon),
        React.createElement('div', { style: { flex: 1 } },
          React.createElement('div', { style: { color: v.color, fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, marginBottom: 3 } }, v.label),
          React.createElement('div', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 12, lineHeight: 1.4 } }, v.desc)
        ),
        React.createElement('span', { style: { color: C.muted, fontSize: 16, opacity: 0.5 } }, '›')
      ))
    );

    // ── SPIRALLING NOW VIEW ───────────────────────────────────────────────────
    if (rsdView === "now") return React.createElement('div', { style: { padding: '0 4px' } },
      backBtn(),
      !rsdScenario && !rsdBreathing && breathPhase !== "done" && !rsdAIResult && React.createElement('div', null,
        React.createElement('h3', { style: { color: C.pink, fontFamily: 'Nunito', margin: '0 0 6px', fontSize: 17 } }, '🚨 What triggered the spiral?'),
        React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, margin: '0 0 16px', lineHeight: 1.5 } }, 'Pick the closest match — we\'ll work through it together.'),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } },
          RSD_SCENARIOS.map(sc => React.createElement('button', { key: sc.id, onClick: () => setRsdScenario(sc), style: { background: C.pink + '11', border: `1.5px solid ${C.pink}44`, borderRadius: 14, padding: 14, textAlign: 'left', cursor: 'pointer', color: C.text, fontFamily: 'Nunito' } },
            React.createElement('div', { style: { fontSize: 20, marginBottom: 4 } }, sc.icon),
            React.createElement('div', { style: { fontSize: 12, fontWeight: 700, color: C.pink } }, sc.label)
          ))
        )
      ),
      rsdScenario && !rsdBreathing && breathPhase !== "done" && !rsdAIResult && React.createElement('div', null,
        React.createElement('button', { onClick: () => setRsdScenario(null), style: { ...btn(C.muted, { marginBottom: 16, fontSize: 12 }) } }, '← Triggers'),
        rsdScenario.id === "custom" && React.createElement('textarea', { value: rsdCustomText, onChange: e => setRsdCustomText(e.target.value), placeholder: "Describe what happened...", style: { ...textareaStyle({ marginBottom: 12 }), height: 80 } }),
        React.createElement('div', { style: { ...card({ background: C.pink + '11', borderColor: C.pink + '44', marginBottom: 16 }) } },
          React.createElement('p', { style: { color: C.pink, fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, margin: '0 0 8px' } }, '💭 First — a reality check'),
          React.createElement('p', { style: { color: C.text, fontFamily: 'Nunito Sans', fontSize: 14, margin: 0, lineHeight: 1.6 } }, rsdScenario.desc)
        ),
        React.createElement('button', { onClick: () => setRsdBreathing(true), style: { ...btn(C.teal, { width: '100%', padding: 14, fontSize: 15, marginBottom: 12 }) } }, '🌬️ Breathe first, then get my reality check'),
        React.createElement('div', { style: { background: C.teal + '0d', border: `1px solid ${C.teal}33`, borderRadius: 12, padding: '10px 14px', marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center' } },
          React.createElement('span', { style: { fontSize: 14 } }, '🤖'),
          React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 12, margin: 0, lineHeight: 1.5 } }, 'The AI reality check after breathing is coming soon — the breathing exercise works now and will soon be followed by a personalised response.')
        ),
        React.createElement('div', { style: card({ cursor: 'pointer', background: C.purple + '18', borderColor: C.purple + '44' }), onClick: () => setAffirmIdx(i => (i + 1) % AFFIRMATIONS.length) },
          React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito', fontSize: 11, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 1 } }, 'Affirmation'),
          React.createElement('p', { style: { color: C.text, fontFamily: 'Nunito Sans', fontSize: 14, lineHeight: 1.7, margin: 0 } }, AFFIRMATIONS[affirmIdx]),
          React.createElement('p', { style: { color: C.muted, fontSize: 11, margin: '8px 0 0', textAlign: 'right' } }, 'tap for next →')
        )
      ),
      rsdBreathing && React.createElement('div', { style: { textAlign: 'center' } },
        React.createElement(BreathOrb, { phase: breathPhase, countdown: breathCountdown }),
        React.createElement('div', { style: { display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 } },
          [0,1,2].map(i => React.createElement('div', { key: i, style: { width: 10, height: 10, borderRadius: '50%', background: i <= breathCycle ? C.teal : C.border, transition: 'background 0.3s' } }))
        ),
        React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 12, marginTop: 8 } }, '4-4-6 breathing · 3 cycles')
      ),
      breathPhase === "done" && rsdLoading && React.createElement('div', { style: { textAlign: 'center', padding: 40 } },
        React.createElement('div', { style: { color: C.teal, fontSize: 32, animation: 'pulse 1s infinite' } }, '🧠'),
        React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito' } }, 'Getting your reality check...')
      ),
      rsdAIResult && rsdAIResult.__coming_soon && renderComingSoon("reality checks"),
      rsdAIResult && !rsdAIResult.__coming_soon && React.createElement('div', null,
        rsdAIResult.grounding_phrase && React.createElement('div', { style: { background: gt(C.teal + '33', C.pink + '33'), border: `2px solid ${C.teal}44`, borderRadius: 20, padding: 20, textAlign: 'center', marginBottom: 16 } },
          React.createElement('p', { style: { fontSize: 20, fontFamily: 'Nunito', fontWeight: 800, color: C.text, margin: 0 } }, '"' + rsdAIResult.grounding_phrase + '"')
        ),
        React.createElement(AIBlock, { label: "I hear you", value: rsdAIResult.validation, color: C.purple }),
        React.createElement(AIBlock, { label: "Reality check", value: rsdAIResult.reality_check, color: C.teal }),
        React.createElement(AIBlock, { label: "Test this thought", value: rsdAIResult.evidence_test, color: C.blue }),
        rsdAIResult.what_to_do_now && React.createElement(AIBlock, { label: "What to do now", value: rsdAIResult.what_to_do_now, color: C.pink }),
        React.createElement('button', { onClick: () => { awardPoints(10); setRsdView("home"); setRsdScenario(null); setRsdAIResult(null); setBreathPhase("ready"); setRsdBreathing(false); }, style: { ...btn(C.teal, { width: '100%', padding: 12, fontSize: 15, marginTop: 8 }) } }, 'I feel more grounded ✓')
      )
    );

    // ── UNDERSTAND VIEW ───────────────────────────────────────────────────────
    if (rsdView === "understand") return React.createElement('div', { style: { padding: '0 4px' } },
      backBtn(),
      [
        {
          icon: "🧬", title: "What is RSD?", color: C.pink,
          body: "Rejection Sensitive Dysphoria is an extreme emotional sensitivity to perceived rejection, failure, or criticism. The key word is perceived — it doesn't have to be real. A late reply, a short text, a colleague's flat tone, someone walking past without smiling. Your brain detects threat where there may be none, and responds with full-force emotional pain."
        },
        {
          icon: "⚡", title: "Why does it happen?", color: C.purple,
          body: "RSD is neurobiological — it's rooted in differences in how ADHD and autistic brains regulate emotion and process social information. The amygdala (threat detection) fires intensely. The prefrontal cortex (reasoning) goes offline. You literally cannot think your way out of it in the moment — the thinking part of your brain is temporarily overwhelmed."
        },
        {
          icon: "😶", title: "What it feels like", color: C.blue,
          body: "A sudden drop in the stomach. Certainty that someone is angry with you. Replaying the interaction on loop. Convinced you've ruined the relationship. Feeling worthless, humiliated, or like you want to disappear. It can feel completely indistinguishable from real rejection — even when it isn't."
        },
        {
          icon: "🔁", title: "Common RSD patterns", color: C.teal,
          items: [
            "Reading hostility into neutral messages ('K.' must mean they're angry)",
            "Assuming silence means rejection ('They haven't replied in 2 hours — they hate me')",
            "Catastrophising after minor criticism ('I'm terrible at my job')",
            "Avoiding asking for things to pre-empt rejection",
            "People-pleasing to prevent the pain of disapproval",
            "Withdrawing entirely to protect yourself from perceived threats",
          ]
        },
        {
          icon: "💡", title: "What makes it harder", color: C.orange,
          body: "Fatigue, sensory overload, hormonal changes, and existing anxiety all lower your RSD threshold. It's not random — it's cumulative. A day where you're already overwhelmed means the same neutral message will hit much harder than it would on a regulated day."
        },
        {
          icon: "🫶", title: "What you need to know", color: C.green,
          items: [
            "You are not too sensitive. Your nervous system is wired differently.",
            "The pain is real — it's not 'just' your imagination.",
            "It is not a character flaw. It is not immaturity. It is neurobiology.",
            "It does get more manageable with the right strategies.",
            "Most people with ADHD and autism experience some form of RSD.",
            "The fact that you recognise it puts you ahead of most.",
          ]
        },
      ].map((s, i) => React.createElement('div', { key: i, style: { ...card({ marginBottom: 12, borderColor: s.color + '44' }) } },
        React.createElement('div', { style: { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 } },
          React.createElement('span', { style: { fontSize: 20 } }, s.icon),
          React.createElement('span', { style: { color: s.color, fontFamily: 'Nunito', fontWeight: 800, fontSize: 15 } }, s.title)
        ),
        s.body && React.createElement('p', { style: { color: C.text, fontFamily: 'Nunito Sans', fontSize: 13, margin: 0, lineHeight: 1.7 } }, s.body),
        s.items && React.createElement('div', null,
          s.items.map((item, j) => React.createElement('div', { key: j, style: { display: 'flex', gap: 10, marginBottom: 6 } },
            React.createElement('span', { style: { color: s.color, flexShrink: 0, marginTop: 2 } }, '◆'),
            React.createElement('span', { style: { color: C.text, fontFamily: 'Nunito Sans', fontSize: 13, lineHeight: 1.6 } }, item)
          ))
        )
      ))
    );

    // ── SKILLS VIEW ───────────────────────────────────────────────────────────
    if (rsdView === "skills") return React.createElement('div', { style: { padding: '0 4px' } },
      backBtn(),
      React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, margin: '0 0 16px', lineHeight: 1.6 } }, 'These won\'t stop RSD from happening — but they can shorten how long it lasts and reduce how much it derails you.'),
      [
        {
          icon: "⏱️", title: "The 24-hour rule", color: C.teal,
          body: "Commit to not responding, not confronting, and not concluding anything for 24 hours after a spike. RSD certainty feels absolute — but it is almost never accurate. Give your nervous system time to come down before you act on it."
        },
        {
          icon: "🔍", title: "Evidence check", color: C.blue,
          body: "When the thought is 'they hate me' or 'I've ruined this', ask: what is the actual evidence? Not the feeling — the evidence. What do I know for certain? What am I assuming? What are three other explanations for their behaviour?",
          items: ["What do I actually know happened?", "What am I adding that isn't in the evidence?", "What would I tell a friend who thought this?", "Has this person given me evidence they care about me before?"]
        },
        {
          icon: "🏷️", title: "Name it to tame it", color: C.purple,
          body: "When you notice the spike, say — out loud or in your head — 'This is RSD. My brain is doing the thing.' Labelling the experience activates your prefrontal cortex and creates a tiny bit of distance between you and the feeling. You become the observer, not the thought."
        },
        {
          icon: "🧊", title: "Physiological interrupt", color: C.blue,
          body: "Cold water on the face or wrists, a physiological sigh, or 60 seconds of intense movement. These work directly on your nervous system — they don't require thinking your way through anything. Get the body calm first, then address the thought."
        },
        {
          icon: "📝", title: "Externalise the spiral", color: C.pink,
          body: "Write down exactly what your brain is saying, as if you're quoting it. 'My brain is telling me that...' Then write what you actually know. The act of writing moves the spiral from inside your body to outside — where you can look at it more clearly."
        },
        {
          icon: "🗣️", title: "Request reassurance intentionally", color: C.green,
          body: "If you need reassurance, ask for it explicitly rather than seeking it indirectly or withdrawing. 'I'm having an RSD moment — can you just tell me we\'re okay?' is a skill, not a weakness. It reduces the spiral faster than waiting and interpreting."
        },
        {
          icon: "🗓️", title: "Track your threshold", color: C.orange,
          body: "Notice what makes RSD worse on a given day — poor sleep, overstimulation, hunger, hormonal cycle, high demand. When your threshold is low, the same message will hit harder. Pre-emptive self-care is a legitimate RSD management strategy."
        },
        {
          icon: "💬", title: "Scripts for the aftermath", color: C.teal,
          items: [
            '"I think I misread that — I\'m sorry if I went quiet."',
            '"My brain sometimes catastrophises — I know that wasn\'t your intention."',
            '"I have RSD, which means I can take things very personally. It wasn\'t about you."',
            '"Can I just check in — are we okay? I sometimes assume the worst."',
          ]
        },
      ].map((s, i) => React.createElement('div', { key: i, style: { ...card({ marginBottom: 12, borderColor: s.color + '44' }) } },
        React.createElement('div', { style: { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 } },
          React.createElement('span', { style: { fontSize: 20 } }, s.icon),
          React.createElement('span', { style: { color: s.color, fontFamily: 'Nunito', fontWeight: 800, fontSize: 15 } }, s.title)
        ),
        s.body && React.createElement('p', { style: { color: C.text, fontFamily: 'Nunito Sans', fontSize: 13, margin: s.items ? '0 0 10px' : 0, lineHeight: 1.7 } }, s.body),
        s.items && React.createElement('div', null,
          s.items.map((item, j) => React.createElement('div', { key: j, style: { display: 'flex', gap: 10, marginBottom: 6 } },
            React.createElement('span', { style: { color: s.color, flexShrink: 0, marginTop: 2 } }, '◆'),
            React.createElement('span', { style: { color: C.text, fontFamily: 'Nunito Sans', fontSize: 13, lineHeight: 1.6, fontStyle: item.startsWith('"') ? 'italic' : 'normal' } }, item)
          ))
        )
      ))
    );

    // ── RESOURCES VIEW ────────────────────────────────────────────────────────
    if (rsdView === "resources") return React.createElement('div', { style: { padding: '0 4px' } },
      backBtn(),
      [
        { label: "ADHD UK — RSD deep dive", desc: "Podcast episode with consultant psychiatrist Dr Shyamal Mashru on RSD", url: "https://adhduk.co.uk/deep-dives/https-adhduk-co-uk-deep-dives-episode-4-deep-dive-into-rejection-sensitivity-dysphoria-with-henry-shelford-and-dr-shyamal-mashru/", tag: "Podcast" },
        { label: "ADDitude Magazine — RSD explainer", desc: "In-depth articles on RSD symptoms, triggers and management", url: "https://www.additudemag.com/rejection-sensitive-dysphoria-and-adhd/", tag: "Article" },
        { label: "Understood.org — RSD and ADHD", desc: "Accessible guide to why rejection hits harder with ADHD", url: "https://www.understood.org/en/articles/adhd-and-coping-with-rejection", tag: "Website" },
        { label: "How to ADHD — RSD video", desc: "Jessica McCabe explains RSD in a warm, relatable way", url: "https://www.youtube.com/watch?v=jM3azhiOy5E", tag: "Video" },
        { label: "Therapist Aid — DBT emotion regulation", desc: "Free DBT worksheets for managing intense emotional responses", url: "https://www.therapistaid.com/therapy-worksheets/dbt/none", tag: "Free tools" },
        { label: "Psychology Today — Find a therapist", desc: "Search for therapists specialising in ADHD and emotional dysregulation", url: "https://www.psychologytoday.com/gb/therapists", tag: "Directory" },
      ].map((r, i) => React.createElement('a', {
        key: i, href: r.url, target: '_blank', rel: 'noopener noreferrer',
        style: { display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', padding: '13px 14px', marginBottom: 10, background: C.blue + '0d', border: `1.5px solid ${C.border}`, borderRadius: 14 }
      },
        React.createElement('div', { style: { flex: 1 } },
          React.createElement('div', { style: { color: C.blue, fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, marginBottom: 3 } }, r.label),
          React.createElement('div', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 12, lineHeight: 1.4 } }, r.desc)
        ),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 } },
          React.createElement('span', { style: { background: C.blue + '22', color: C.blue, fontFamily: 'Nunito', fontWeight: 700, fontSize: 10, borderRadius: 20, padding: '2px 8px', whiteSpace: 'nowrap' } }, r.tag),
          React.createElement('span', { style: { color: C.muted, fontSize: 14 } }, '↗')
        )
      ))
    );

    return null;
  }

  function renderTranslate() {
    const modes = [{ id: "nt2nd", label: "NT → ND" }, { id: "nd2nt", label: "ND → NT" }, { id: "rules", label: "Unwritten Rules" }];
    const examples = {
      nt2nd: ["Let me know if you have any questions", "We should catch up sometime", "That's an interesting idea", "It's fine"],
      nd2nt: ["I need 3 days to do this properly", "I don't understand why we do it this way", "Can we just be direct?", "I finished early"],
      rules: ["Why do people say fine when they don't mean it?", "When to reply to emails", "Why eye contact matters", "Reading the room"],
    };
    return React.createElement('div', null,
      React.createElement(AIComingBanner, { desc: "This tab uses AI to decode neurotypical communication, translate your words for an NT audience, and explain unwritten social rules — with real nuance and context." }),
      React.createElement('div', { style: { display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto' } },
        modes.map(m => React.createElement('button', { key: m.id, onClick: () => setTranslateMode(m.id), style: pill(translateMode === m.id, C.pink) }, m.label))
      ),
      React.createElement('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 } },
        examples[translateMode].map(e => React.createElement('button', { key: e, onClick: () => setTranslateInput(e), style: { background: C.pink + '11', border: `1px solid ${C.pink}33`, borderRadius: 20, padding: '4px 10px', color: C.muted, fontSize: 12, cursor: 'pointer', fontFamily: 'Nunito' } }, e))
      ),
      React.createElement('textarea', { value: translateInput, onChange: e => setTranslateInput(e.target.value), placeholder: "Type or select example above...", style: { ...textareaStyle({ height: 80, marginBottom: 10 }) }, onKeyDown: e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleTranslate(); } }),
      React.createElement('button', { onClick: handleTranslate, disabled: translateLoading || !translateInput.trim(), style: { ...btn(C.pink, { width: '100%', padding: 12, opacity: translateLoading ? 0.7 : 1 }) } }, translateLoading ? '🤔 Translating...' : '💬 Translate'),
      translateResult && React.createElement('div', { style: { marginTop: 16 } },
        Object.entries(translateResult).map(([k, v]) => React.createElement(AIBlock, { key: k, label: k.replace(/_/g, ' '), value: v, color: C.pink }))
      ),
      translateHistory.length > 0 && React.createElement('details', { style: { marginTop: 16 } },
        React.createElement('summary', { style: { color: C.muted, fontFamily: 'Nunito', fontSize: 13, cursor: 'pointer', padding: '8px 0' } }, `📚 History (${translateHistory.length})`),
        translateHistory.map(h => React.createElement('div', { key: h.id, style: { ...card({ marginTop: 8, padding: 10 }) } },
          React.createElement('p', { style: { color: C.muted, fontSize: 11, margin: '0 0 4px' } }, h.mode + ' • ' + h.input.slice(0, 60) + '...')
        ))
      )
    );
  }

  function renderDecode() {
    const contexts = [
      { id: "work_email", label: "📧 Work email" }, { id: "text_message", label: "💬 Text message" },
      { id: "in_person", label: "🗣️ In-person" }, { id: "body_language", label: "🙄 Body language" },
      { id: "i_said", label: "😬 I said something" }, { id: "unwritten_rule", label: "📜 Unwritten rule" },
    ];
    const BL_TABLE = [
      { signal: "Arms crossed", misread: "Defensive/angry", reality: "Often just comfortable or cold" },
      { signal: "Avoiding eye contact", misread: "Dishonest or uninterested", reality: "Processing, anxious, or ND" },
      { signal: "Short replies", misread: "Upset with you", reality: "Tired, distracted, or just concise" },
      { signal: "Not smiling", misread: "Unhappy", reality: "Resting face — means nothing" },
      { signal: "Looking away mid-convo", misread: "Bored", reality: "Thinking — eye contact blocks focus" },
      { signal: "Fidgeting", misread: "Impatient", reality: "Nervous, focused, or self-regulating" },
      { signal: "Quiet in group", misread: "Unhappy or excluded", reality: "Overwhelmed, processing, or introverted" },
    ];
    return React.createElement('div', null,
      React.createElement(AIComingBanner, { desc: "This tab uses AI to decode a specific situation — a confusing email, something someone said, or body language you couldn't read. Paste it in and get a clear, honest breakdown." }),
      React.createElement('div', { style: { display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 } },
        contexts.map(c => React.createElement('button', { key: c.id, onClick: () => setDecodeContext(c.id), style: { ...pill(decodeContext === c.id, C.teal), whiteSpace: 'nowrap' } }, c.label))
      ),
      decodeContext === "body_language" && React.createElement('div', { style: { ...card({ marginBottom: 16 }) } },
        React.createElement('p', { style: { color: C.teal, fontFamily: 'Nunito', fontWeight: 700, fontSize: 13, margin: '0 0 10px' } }, '🔍 Quick reference: common misreads'),
        React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'Nunito Sans' } },
          React.createElement('thead', null,
            React.createElement('tr', null,
              ['Signal', 'Often misread as', 'Likely reality'].map(h => React.createElement('th', { key: h, style: { color: C.muted, textAlign: 'left', padding: '4px 6px', borderBottom: `1px solid ${C.border}` } }, h))
            )
          ),
          React.createElement('tbody', null,
            BL_TABLE.map((r, i) => React.createElement('tr', { key: i },
              [r.signal, r.misread, r.reality].map((v, j) => React.createElement('td', { key: j, style: { color: j === 2 ? C.teal : C.text, padding: '5px 6px', borderBottom: `1px solid ${C.border}22` } }, v))
            ))
          )
        )
      ),
      React.createElement('textarea', { value: decodeSituation, onChange: e => setDecodeSituation(e.target.value), placeholder: "What happened? Describe the situation...", style: { ...textareaStyle({ height: 80, marginBottom: 10 }) } }),
      React.createElement('input', { value: decodeQuestion, onChange: e => setDecodeQuestion(e.target.value), placeholder: "Specific question? (optional)", style: { ...input({ marginBottom: 10 }) } }),
      React.createElement('button', { onClick: handleDecode, disabled: decodeLoading || !decodeSituation.trim(), style: { ...btn(C.teal, { width: '100%', padding: 12, opacity: decodeLoading ? 0.7 : 1 }) } }, decodeLoading ? '🔍 Decoding...' : '🔍 Decode this'),
      decodeResult && React.createElement('div', { style: { marginTop: 16 } },
        Object.entries(decodeResult).map(([k, v]) => React.createElement(AIBlock, { key: k, label: k.replace(/_/g, ' '), value: v, color: C.teal }))
      )
    );
  }

  function renderPDA() {
    function backBtn() {
      return React.createElement('button', { onClick: () => setPdaView("home"), style: { ...btn(C.muted, { marginBottom: 16, fontSize: 12 }) } }, '← Back');
    }
    function infoCard(icon, title, color, body, items) {
      return React.createElement('div', { style: { ...card({ marginBottom: 12, borderColor: color + '44' }) } },
        React.createElement('div', { style: { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 } },
          React.createElement('span', { style: { fontSize: 20 } }, icon),
          React.createElement('span', { style: { color, fontFamily: 'Nunito', fontWeight: 800, fontSize: 15 } }, title)
        ),
        body && React.createElement('p', { style: { color: C.text, fontFamily: 'Nunito Sans', fontSize: 13, margin: items ? '0 0 10px' : 0, lineHeight: 1.7 } }, body),
        items && React.createElement('div', null, items.map((item, j) => React.createElement('div', { key: j, style: { display: 'flex', gap: 10, marginBottom: 6 } },
          React.createElement('span', { style: { color, flexShrink: 0, marginTop: 2 } }, '◆'),
          React.createElement('span', { style: { color: C.text, fontFamily: 'Nunito Sans', fontSize: 13, lineHeight: 1.6, fontStyle: item.startsWith('"') ? 'italic' : 'normal' } }, item)
        )))
      );
    }

    // ── HOME ─────────────────────────────────────────────────────────────────
    if (pdaView === "home") return React.createElement('div', { style: { padding: '0 4px' } },
      React.createElement('div', { style: { background: C.blue + '0e', border: `1.5px solid ${C.blue}33`, borderRadius: 16, padding: '16px', marginBottom: 20 } },
        React.createElement('p', { style: { color: C.blue, fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, margin: '0 0 6px' } }, '🌊 Persistent Drive for Autonomy'),
        React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, margin: 0, lineHeight: 1.6 } }, 'PDA is a profile where the nervous system experiences demands — even wanted, enjoyable ones — as threats to safety. It\'s not stubbornness, manipulation, or bad parenting. It\'s a fundamentally different relationship with autonomy and control.')
      ),
      [
        { id: "understand", icon: "🧠", label: "Understand PDA", desc: "What it is, why it happens, what it feels like from the inside", color: C.blue },
        { id: "self", icon: "🛠️", label: "Managing it yourself", desc: "Strategies, reframes, and ways to work with your nervous system", color: C.teal },
        { id: "others", icon: "🤝", label: "For people around you", desc: "How partners, family, employers and parents of PDA children can help", color: C.purple },
      ].map(v => React.createElement('button', {
        key: v.id, onClick: () => setPdaView(v.id),
        style: { display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', background: v.color + '0e', border: `1.5px solid ${v.color}33`, borderRadius: 16, padding: '16px', marginBottom: 10, cursor: 'pointer' }
      },
        React.createElement('div', { style: { width: 46, height: 46, borderRadius: 12, background: v.color + '22', border: `1.5px solid ${v.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 } }, v.icon),
        React.createElement('div', { style: { flex: 1 } },
          React.createElement('div', { style: { color: v.color, fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, marginBottom: 3 } }, v.label),
          React.createElement('div', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 12, lineHeight: 1.4 } }, v.desc)
        ),
        React.createElement('span', { style: { color: C.muted, fontSize: 16, opacity: 0.5 } }, '›')
      ))
    );

    // ── UNDERSTAND ───────────────────────────────────────────────────────────
    if (pdaView === "understand") return React.createElement('div', { style: { padding: '0 4px' } },
      backBtn(),
      infoCard("🌊", "What is PDA?", C.blue,
        "PDA (Persistent Drive for Autonomy, previously called Pathological Demand Avoidance) is a profile that sits within the autism spectrum, though it can also occur alongside ADHD. The core feature is that the nervous system experiences perceived demands as genuine threats — activating a fight, flight or freeze response even when the demand is something the person wants to do.\n\nIt is not a choice. It is not manipulation. It is not the result of poor boundaries or bad parenting. It is a nervous system difference."
      ),
      infoCard("⚡", "Why demands feel like threats", C.purple,
        "In a typical nervous system, a request or expectation is processed as neutral information. In a PDA nervous system, it triggers the threat-detection pathway — the same one that activates when you're in physical danger. The body prepares to fight, flee, or freeze. Compliance feels physically impossible, not just emotionally difficult.",
        ["The person isn't 'choosing' not to comply — their body won't let them", "The more the demand is pushed, the stronger the threat response becomes", "Even self-imposed demands (own plans, own goals) can trigger avoidance", "The intensity is completely disproportionate to the actual demand — because it's not about the demand"]
      ),
      infoCard("😶", "What it feels like from the inside", C.pink,
        "Imagine someone telling you to jump off a building. That visceral 'absolutely not' response — the physical resistance, the panic, the inability to move toward it — that's what PDA can feel like in response to 'please tidy your room' or 'it's time to start work.'",
        ["A sudden wall of 'no' with no logical reason attached", "Extreme anxiety when freedom or choice is removed", "The ability to do something one day and complete inability the next", "Relief and calm when demands are removed — even temporarily", "Exhaustion from fighting the avoidance response all day"]
      ),
      infoCard("🔁", "How it's different from general demand avoidance", C.teal,
        "Everyone avoids demands sometimes. PDA is different in key ways:",
        ["It's pervasive — affects all areas of life, not just disliked tasks", "It includes demands the person wants to fulfil and has agreed to", "It's driven by anxiety, not preference or defiance", "It often increases under pressure rather than resolving", "The avoidance strategies are often creative, social and indirect"]
      ),
      infoCard("🎭", "PDA masking and the social profile", C.orange,
        "Many PDA individuals are socially skilled and may appear to be coping well — especially in short bursts. This can make the PDA profile harder to identify, because the person can often engage, negotiate, and hold conversations with apparent ease. The collapse or avoidance often happens later, in private, or at home.",
        ["High masking in public means the home environment absorbs the most", "Teachers or employers may not see the extent of the difficulty", "The person themselves may not understand why they can't 'just do it'", "Burnout is common after sustained periods of masking compliance"]
      ),
      infoCard("💡", "Common misunderstandings", C.yellow, null,
        ["'They're just being controlling' — No. Control is the coping strategy, not the goal", "'They can do it when they want to' — Motivation and capacity are different things in PDA", "'If you give them what they want, they'll just demand more' — Reducing threat reduces avoidance", "'It's the parents' fault' — PDA is neurodevelopmental, not caused by parenting style", "'They were fine yesterday' — Variable capacity is part of the profile, not inconsistency"]
      )
    );

    // ── MANAGING YOURSELF ─────────────────────────────────────────────────────
    if (pdaView === "self") return React.createElement('div', { style: { padding: '0 4px' } },
      backBtn(),
      React.createElement('div', { style: { background: C.teal + '11', border: `1px solid ${C.teal}33`, borderRadius: 12, padding: '12px 14px', marginBottom: 16 } },
        React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, margin: 0, lineHeight: 1.6 } }, 'The goal isn\'t to eliminate avoidance — it\'s to reduce the threat response enough that you can move. Working with your nervous system, not against it.')
      ),
      infoCard("🔄", "Reframe demands as choices", C.teal,
        "Your nervous system responds to the word 'have to' with threat. Changing the language genuinely changes the response — not because you're tricking yourself, but because autonomy is the actual need.",
        ['"I have to write this report" → "I\'m choosing to write this because I want to keep my job"', '"I need to eat something" → "I could make toast, or I could order something, or I could eat cereal"', '"I should call them back" → "I\'ll call them when I\'m ready"', "Remove the deadline where possible. Flexible completion reduces threat."]
      ),
      infoCard("🚪", "The indirect approach", C.pink,
        "If you can't approach the thing directly, approach it sideways. PDA brains often respond better to arriving at a task accidentally than heading toward it intentionally.",
        ["Start something adjacent to the task and let yourself drift into it", "Set up the environment without committing to the task ('I\'ll just open the document')", "Do it in disguise — call it something else, frame it differently", "Let someone else initiate it so the demand doesn't come from you"]
      ),
      infoCard("🎚️", "Reduce the stakes", C.yellow,
        "High stakes amplify the threat response. The more it matters, the harder PDA makes it.",
        ["Tell yourself you only have to do 10% of it, badly, for 5 minutes", '"I\'m just going to look at it — I don\'t have to do anything"', "Remove the idea of quality. Getting it done at all is enough.", "Do it in a low-stakes version first — a draft, a rough attempt, a sketch"]
      ),
      infoCard("⏰", "Work with your windows", C.orange,
        "PDA capacity fluctuates — often unpredictably. Trying to force things outside of a window is rarely effective and often counterproductive. Learning to recognise your windows is a skill worth developing.",
        ["Notice when demand tolerance is naturally higher (certain times of day, certain environments)", "When a window opens, use it without overthinking", "When capacity is low, reduce demands rather than push through", "Rest and recovery time expands future windows — it's not wasted time"]
      ),
      infoCard("🏷️", "Name it in the moment", C.purple,
        "When avoidance spikes, try saying to yourself: 'This is PDA. My nervous system is detecting a threat that isn't real. I don't have to fight this feeling.' Naming what's happening activates the reasoning brain and creates a small amount of distance between you and the response."
      ),
      infoCard("📝", "Scripts for yourself", C.blue, null,
        ['"My body is saying no. That\'s information, not a final answer."', '"I can do this differently. I don\'t have to do it their way."', '"I\'m choosing not to right now. That\'s allowed."', '"The resistance will ease when the threat response calms. I can wait."', '"I\'m not lazy. I\'m dysregulated. These are different things."']
      ),
      infoCard("🗣️", "Explaining yourself to others", C.pink, null,
        ['"I have PDA — my brain experiences demands as threats, even when I want to comply."', '"I work much better with options than instructions. Can we frame this as a choice?"', '"I need to feel like I\'m choosing this, not being told to do it."', '"If I go quiet or seem resistant, I\'m not being difficult — my nervous system is overwhelmed."', '"The more you push, the harder it gets. Less pressure genuinely helps."']
      )
    );

    // ── FOR OTHERS ────────────────────────────────────────────────────────────
    if (pdaView === "others") return React.createElement('div', { style: { padding: '0 4px' } },
      backBtn(),

      // Adults section
      React.createElement('div', { style: { background: C.purple + '11', border: `1px solid ${C.purple}33`, borderRadius: 12, padding: '12px 14px', marginBottom: 16 } },
        React.createElement('p', { style: { color: C.purple, fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, margin: '0 0 4px' } }, 'For partners, family members and employers'),
        React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, margin: 0, lineHeight: 1.6 } }, 'PDA is not about you. The avoidance isn\'t personal, the resistance isn\'t defiance, and more pressure almost never helps. Here\'s what does.')
      ),
      infoCard("💬", "Change how you frame requests", C.purple,
        "The way a request is delivered matters enormously. Direct instructions trigger threat. Collaborative framing reduces it.",
        ['"You need to do X by Y" → "What would work best for you to get X done?"', '"Can you just..." → "Would it be possible to..." or "I\'d love it if..."', 'Offer two options instead of one instruction', 'Ask rather than tell, even for things that feel non-negotiable', 'Give advance notice of changes — surprise demands hit harder']
      ),
      infoCard("🚫", "What makes it worse", C.pink, null,
        ["Repeating the demand when there\'s no response — this amplifies the threat", "Threats, ultimatums, or consequences framed as punishment", "Comparing them to others ('Why can\'t you just...')", "Taking the avoidance personally or as a reflection of your relationship", "Removing all choice to 'force' compliance — this usually causes shutdown or meltdown"]
      ),
      infoCard("🤝", "What actually helps", C.teal, null,
        ["Collaborative problem-solving — 'How can we make this work?'", "Giving genuine choice and respecting the answer", "Reducing non-essential demands during high-stress periods", "Staying calm when avoidance happens — anxiety is contagious", "Validating the difficulty without removing all expectations", "Finding indirect routes to the same outcome"]
      ),
      infoCard("🏢", "In the workplace", C.blue,
        "PDA employees often have very high capability — but standard workplace structures can make it extremely hard to access that capability.",
        ["Flexible working arrangements reduce demand pressure significantly", "Asynchronous communication (email, messages) over real-time demands", "Autonomy over how tasks are completed, not just what is completed", "Clear written expectations rather than verbal instructions in the moment", "Regular check-ins framed as collaboration, not performance monitoring", "Understanding that variable output isn\'t unreliability — it\'s capacity fluctuation"]
      ),

      // Divider
      React.createElement('div', { style: { borderTop: `1px solid ${C.border}`, margin: '20px 0 16px', position: 'relative' } },
        React.createElement('span', { style: { position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: C.bg, padding: '0 12px', color: C.purple, fontFamily: 'Nunito', fontWeight: 700, fontSize: 13 } }, '🧒 For parents of PDA children')
      ),

      React.createElement('div', { style: { background: C.purple + '11', border: `1px solid ${C.purple}33`, borderRadius: 12, padding: '12px 14px', marginBottom: 16 } },
        React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, margin: 0, lineHeight: 1.6 } }, 'PDA in children is often missed or misdiagnosed because the child is sociable, articulate, and can appear to be choosing not to comply. The meltdowns, school refusal, and exhaustion after "being good" all day are signs of a nervous system under enormous strain — not a discipline problem.')
      ),
      infoCard("🔍", "Recognising PDA in children", C.purple,
        "PDA children often don't match the stereotype of autism. They may be chatty, imaginative, and socially engaged — which can make the PDA invisible until the cracks appear.",
        ["Resists and avoids ordinary demands of daily life", "Uses social strategies to avoid — distraction, negotiation, fantasy, excuses", "Appears comfortable in one-to-one but struggles in group or structured settings", "Extreme meltdowns that seem disproportionate to the trigger", "School refusal or collapse at home after school", "Works well when given control; shuts down when control is removed", "Anxiety-driven behaviour that looks like defiance"]
      ),
      infoCard("🏠", "At home — what helps", C.teal, null,
        ["Reduce the number of demands in a day — prioritise essential ones only", "Offer choices rather than instructions wherever possible", "'Would you like breakfast before or after getting dressed?' not 'Get dressed now'", "Use indirect language: 'I wonder if...' or 'Some people find it helps to...'", "Build flexibility into routines — rigid structures often backfire", "Give genuine autonomy over small things to build trust in their safety", "Avoid power struggles — the threat response will always win in the short term", "Let them decompress after school before any demands or conversations"]
      ),
      infoCard("🏫", "At school — what helps", C.blue,
        "Standard school behaviour management systems are usually counterproductive for PDA children. Most reward/consequence systems increase anxiety rather than compliance.",
        ["Low-demand, collaborative approach rather than rules-based management", "Flexibility over uniform, seating, transitions and sensory environment", "Avoid public praise or public consequences — both increase demand pressure", "Let the child have some control over their day where possible", "Reduced timetable or alternative provision during high-anxiety periods", "Written or visual communication rather than verbal demands mid-task", "A trusted adult who can de-escalate without increasing demands", "Understand that school refusal is communication, not manipulation"]
      ),
      infoCard("💛", "Reframing for parents", C.yellow, null,
        ["Your child\'s avoidance is not a rejection of you", "Compliance is not the goal — reducing their anxiety is the goal", "They are not manipulating you. The strategies are unconscious and anxiety-driven", "The fact that they can do it sometimes doesn\'t mean they\'re choosing not to other times", "Traditional parenting approaches don\'t fail because you\'re bad at parenting — they fail because they weren\'t designed for this brain", "You are not alone. PDA is increasingly recognised and there is a growing community of parents who understand this exactly"]
      ),
      React.createElement('div', { style: { ...card({ marginBottom: 12, borderColor: C.blue + '44' }) } },
        React.createElement('div', { style: { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 } },
          React.createElement('span', { style: { fontSize: 20 } }, '📚'),
          React.createElement('span', { style: { color: C.blue, fontFamily: 'Nunito', fontWeight: 800, fontSize: 15 } }, 'Helpful resources')
        ),
        [
          { label: "PDA Society", desc: "The leading UK resource for PDA individuals and families", url: "https://www.pdasociety.org.uk", tag: "Website" },
          { label: "The PDA Space", desc: "Community, resources and lived experience for PDA people and parents", url: "https://www.thepdaspace.com", tag: "Website" },
          { label: "SEND Local Offer", desc: "Find PDA-informed support through your local authority", url: "https://www.gov.uk/children-with-special-educational-needs", tag: "Gov UK" },
          { label: "The Explosive Child — Ross W. Greene", desc: "Collaborative problem-solving approach — highly effective for PDA", url: "https://www.livesinthebalance.org", tag: "Book" },
          { label: "Pathological Demand Avoidance Syndrome — Phil Christie et al.", desc: "One of the key clinical texts on PDA", url: "https://www.jkp.com/catalogue/book/9781849052559", tag: "Book" },
          { label: "EHCP — Education, Health and Care Plan", desc: "Can include PDA-specific provisions — apply through your local authority", url: "https://www.gov.uk/children-with-special-educational-needs/education-health-care-plans", tag: "Gov UK" },
        ].map((r, i) => React.createElement('a', {
          key: i, href: r.url, target: '_blank', rel: 'noopener noreferrer',
          style: { display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', padding: '11px 12px', marginBottom: 8, background: C.blue + '0d', border: `1px solid ${C.border}`, borderRadius: 12 }
        },
          React.createElement('div', { style: { flex: 1 } },
            React.createElement('div', { style: { color: C.blue, fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, marginBottom: 2 } }, r.label),
            React.createElement('div', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 12, lineHeight: 1.4 } }, r.desc)
          ),
          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 } },
            React.createElement('span', { style: { background: C.blue + '22', color: C.blue, fontFamily: 'Nunito', fontWeight: 700, fontSize: 10, borderRadius: 20, padding: '2px 8px', whiteSpace: 'nowrap' } }, r.tag),
            React.createElement('span', { style: { color: C.muted, fontSize: 14 } }, '↗')
          )
        ))
      ),
    );

    return null;
  }

  function renderTasks() {
    const tiers = [
      { id: "now", label: "⚡ Right now", color: C.teal },
      { id: "week", label: "📅 This week", color: C.pink },
      { id: "eventually", label: "🌙 Eventually", color: C.yellow },
    ];
    function addTask() {
      if (!taskInput.trim()) return;
      setTasks(ts => [...ts, { id: uid(), text: taskInput.trim(), tier: taskTier, done: false, steps: null }]);
      setTaskInput("");
    }
    function toggleTask(id) {
      const task = tasks.find(t => t.id === id);
      if (!task.done) awardPoints(10);
      setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));
    }
    function moveTier(id, dir) {
      const tOrder = ["now", "week", "eventually"];
      setTasks(ts => ts.map(t => {
        if (t.id !== id) return t;
        const i = tOrder.indexOf(t.tier);
        return { ...t, tier: tOrder[Math.max(0, Math.min(2, i + dir))] };
      }));
    }
    return React.createElement('div', null,
      React.createElement('div', { style: { background: C.teal + '0d', border: `1px solid ${C.teal}33`, borderRadius: 12, padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center' } },
        React.createElement('span', { style: { fontSize: 16 } }, '🤖'),
        React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 12, margin: 0, lineHeight: 1.5 } }, 'The "Break it down" AI button is coming soon — tasks and capture work now, AI step breakdowns are on the way.')
      ),
      React.createElement('div', { style: { display: 'flex', gap: 8, marginBottom: 12 } },
        React.createElement('input', { value: taskInput, onChange: e => setTaskInput(e.target.value), onKeyDown: e => e.key === 'Enter' && addTask(), placeholder: "Quick capture...", style: input({ flex: 1 }) }),
        React.createElement('button', { onClick: addTask, style: { ...btn(C.teal, { padding: '10px 16px' }) } }, '+')
      ),
      React.createElement('div', { style: { display: 'flex', gap: 6, marginBottom: 16 } },
        tiers.map(t => React.createElement('button', { key: t.id, onClick: () => setTaskTier(t.id), style: pill(taskTier === t.id, t.color) }, t.label.split(' ').slice(1).join(' ')))
      ),
      tiers.map(tier => {
        const tierTasks = tasks.filter(t => t.tier === tier.id && !t.done);
        const doneTasks = tasks.filter(t => t.tier === tier.id && t.done);
        return React.createElement('div', { key: tier.id, style: { marginBottom: 20 } },
          React.createElement('h4', { style: { color: tier.color, fontFamily: 'Nunito', margin: '0 0 10px', fontSize: 15 } }, tier.label),
          [...tierTasks, ...doneTasks].map(task => React.createElement('div', { key: task.id, style: { ...card({ marginBottom: 8, padding: 12 }), opacity: task.done ? 0.6 : 1 } },
            React.createElement('div', { style: { display: 'flex', gap: 10, alignItems: 'flex-start' } },
              React.createElement('button', { onClick: () => toggleTask(task.id), style: { width: 22, height: 22, borderRadius: '50%', border: `2px solid ${tier.color}`, background: task.done ? tier.color : 'transparent', cursor: 'pointer', flexShrink: 0, marginTop: 1 } }),
              React.createElement('div', { style: { flex: 1 } },
                React.createElement('p', { style: { color: C.text, fontFamily: 'Nunito', fontSize: 14, margin: 0, textDecoration: task.done ? 'line-through' : 'none' } }, task.text),
                task.steps && React.createElement('div', { style: { marginTop: 8 } },
                  task.steps.map((s, i) => React.createElement('div', { key: i, style: { display: 'flex', gap: 8, marginBottom: 4 } },
                    React.createElement('span', { style: { color: tier.color, fontSize: 11, fontWeight: 700 } }, i + 1 + '.'),
                    React.createElement('span', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 12 } }, s)
                  ))
                )
              ),
              !task.done && React.createElement('div', { style: { display: 'flex', gap: 4 } },
                React.createElement('button', { onClick: () => handleTaskBreakdown(task.id), disabled: taskLoading === task.id, style: { background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, padding: '4px 8px', color: C.muted, cursor: 'pointer', fontSize: 12 } }, taskLoading === task.id ? '...' : '🤖'),
                React.createElement('button', { onClick: () => moveTier(task.id, -1), style: { background: 'transparent', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 14, padding: '4px' } }, '↑'),
                React.createElement('button', { onClick: () => moveTier(task.id, 1), style: { background: 'transparent', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 14, padding: '4px' } }, '↓'),
                React.createElement('button', { onClick: () => setTasks(ts => ts.filter(t => t.id !== task.id)), style: { background: 'transparent', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 14, padding: '4px' } }, '✕')
              )
            )
          ))
        );
      })
    );
  }

  function renderBrainDump() {
    const modes = [{ id: "sort", label: "📂 Sort it out" }, { id: "whatfirst", label: "🎯 What first?" }, { id: "feelings", label: "💙 Feelings first" }];
    return React.createElement('div', null,
      React.createElement(AIComingBanner, { desc: "Brain Dump uses AI to take everything cluttering your head and sort it, prioritise it, or just hear you out. Type freely — it will make sense of it." }),
      React.createElement('div', { style: { display: 'flex', gap: 8, marginBottom: 16 } },
      ),
      React.createElement('textarea', { value: dumpText, onChange: e => setDumpText(e.target.value), placeholder: "Dump everything that's in your head right now...", style: { ...textareaStyle({ height: 160, marginBottom: 8 }) } }),
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 12 } },
        React.createElement('span', { style: { color: C.muted, fontSize: 12, fontFamily: 'Nunito' } }, dumpText.split(' ').filter(Boolean).length + ' words'),
        React.createElement('button', { onClick: () => { setDumpText(''); setDumpResult(null); }, style: { background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 12 } }, '🗑 Clear')
      ),
      React.createElement('button', { onClick: handleBrainDump, disabled: dumpLoading || !dumpText.trim(), style: { ...btn(C.teal, { width: '100%', padding: 12, opacity: dumpLoading ? 0.7 : 1 }) } }, dumpLoading ? '🧠 Processing...' : '🧠 Process this'),
      dumpResult && React.createElement('div', { style: { marginTop: 16 } },
        dumpResult.categories && React.createElement('div', { style: { marginBottom: 12 } },
          dumpResult.categories.map((cat, i) => React.createElement(AIBlock, { key: i, label: cat.name, value: cat.items ? cat.items.join(' · ') : '', color: [C.teal, C.pink, C.yellow, C.blue, C.purple][i % 5] }))
        ),
        Object.entries(dumpResult).filter(([k]) => k !== 'categories').map(([k, v]) => React.createElement(AIBlock, { key: k, label: k.replace(/_/g, ' '), value: v, color: C.teal }))
      )
    );
  }

  function renderHabits() {
    function completeHabit(id) {
      setHabits(hs => hs.map(h => h.id === id ? { ...h, done: true, lastDone: Date.now() } : h));
      awardPoints(5, "Done! That's the invisible work, stacked up. 💙");
    }
    function daysAgo(ts) {
      if (!ts) return null;
      const d = Math.floor((Date.now() - ts) / 86400000);
      return d === 0 ? 'today' : d === 1 ? '1d ago' : d + 'd ago';
    }
    function addHabit() {
      if (!habitText.trim()) return;
      setHabits(hs => [...hs, { id: uid(), emoji: habitEmoji, text: habitText.trim(), done: false, lastDone: null }]);
      setHabitText('');
    }
    const active = habits.filter(h => !h.done);
    const done = habits.filter(h => h.done);
    return React.createElement('div', null,
      React.createElement('div', { style: { background: gt(C.teal + '22', C.pink + '22'), border: `1px solid ${C.teal}33`, borderRadius: 16, padding: 16, marginBottom: 16 } },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } },
          React.createElement('span', { style: { color: C.text, fontFamily: 'Nunito', fontWeight: 700 } }, tier.icon + ' ' + tier.name),
          React.createElement('span', { style: { color: C.teal, fontFamily: 'Nunito', fontSize: 18, fontWeight: 800 } }, points + ' pts')
        ),
        React.createElement('div', { style: { background: C.border, borderRadius: 10, height: 8, overflow: 'hidden' } },
          React.createElement('div', { style: { height: '100%', width: tierPct + '%', background: gt(C.teal, C.pink), borderRadius: 10, transition: 'width 0.5s' } })
        ),
        nextTier && React.createElement('p', { style: { color: C.muted, fontSize: 11, fontFamily: 'Nunito', margin: '6px 0 0', textAlign: 'right' } }, nextTier.min - points + ' pts to ' + nextTier.icon + ' ' + nextTier.name)
      ),
      React.createElement('h4', { style: { color: C.teal, fontFamily: 'Nunito', margin: '0 0 12px' } }, '🔁 Life Stuff'),
      active.map(h => React.createElement('div', { key: h.id, style: { ...card({ marginBottom: 8, padding: 12 }) } },
        editingHabitId === h.id
          ? React.createElement('div', null,
              React.createElement('div', { style: { display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 } },
                HABIT_EMOJIS.concat(["🧺","👕","🗑️","💊","💧","🍽️"]).filter((e,i,a)=>a.indexOf(e)===i).map(e =>
                  React.createElement('button', { key: e, onClick: () => setHabits(hs => hs.map(hab => hab.id === h.id ? { ...hab, emoji: e } : hab)), style: { background: e === h.emoji ? C.teal + '33' : 'transparent', border: `1px solid ${e === h.emoji ? C.teal : C.border}`, borderRadius: 6, padding: '3px 6px', cursor: 'pointer', fontSize: 15 } }, e)
                )
              ),
              React.createElement('div', { style: { display: 'flex', gap: 8 } },
                React.createElement('span', { style: { fontSize: 22, lineHeight: '38px' } }, h.emoji),
                React.createElement('input', {
                  autoFocus: true,
                  value: h.text,
                  onChange: e => setHabits(hs => hs.map(hab => hab.id === h.id ? { ...hab, text: e.target.value } : hab)),
                  onKeyDown: e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingHabitId(null); },
                  style: { ...input({ flex: 1 }), fontSize: 14 }
                }),
                React.createElement('button', { onClick: () => setEditingHabitId(null), style: { ...btn(C.teal, { padding: '8px 14px', fontSize: 13, whiteSpace: 'nowrap' }) } }, '✓ Save')
              )
            )
          : React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
              React.createElement('span', { style: { fontSize: 22 } }, h.emoji),
              React.createElement('div', { style: { flex: 1 } },
                React.createElement('p', { style: { color: C.text, fontFamily: 'Nunito', fontSize: 14, margin: 0 } }, h.text),
                h.lastDone && React.createElement('p', { style: { color: C.muted, fontSize: 11, margin: 0 } }, 'Last: ' + daysAgo(h.lastDone))
              ),
              React.createElement('button', { onClick: () => completeHabit(h.id), style: { background: C.teal + '22', border: `2px solid ${C.teal}`, borderRadius: 20, padding: '6px 12px', color: C.teal, fontFamily: 'Nunito', fontWeight: 700, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' } }, 'Done ✓'),
              React.createElement('button', { onClick: () => setEditingHabitId(h.id), style: { background: 'transparent', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 16, padding: '4px 6px' }, title: 'Edit' }, '✏️'),
              React.createElement('button', { onClick: () => setHabits(hs => hs.filter(hab => hab.id !== h.id)), style: { background: 'transparent', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 16, padding: '4px 6px' }, title: 'Delete' }, '✕')
            )
      )),
      done.length > 0 && React.createElement('div', { style: { marginTop: 8 } },
        React.createElement('p', { style: { color: C.muted, fontSize: 12, fontFamily: 'Nunito', marginBottom: 8 } }, '✓ Done today'),
        done.map(h => React.createElement('div', { key: h.id, style: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 4, opacity: 0.6 } },
          React.createElement('span', { style: { fontSize: 18 } }, h.emoji),
          React.createElement('span', { style: { color: C.muted, fontFamily: 'Nunito', fontSize: 13, textDecoration: 'line-through', flex: 1 } }, h.text),
          React.createElement('button', { onClick: () => setHabits(hs => hs.map(hab => hab.id === h.id ? { ...hab, done: false } : hab)), style: { background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 12 } }, 'undo')
        ))
      ),
      React.createElement('div', { style: { ...card({ marginTop: 16 }) } },
        React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito', fontSize: 13, margin: '0 0 8px' } }, '+ Add habit'),
        React.createElement('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 } },
          HABIT_EMOJIS.map(e => React.createElement('button', { key: e, onClick: () => setHabitEmoji(e), style: { background: e === habitEmoji ? C.teal + '33' : 'transparent', border: `1px solid ${e === habitEmoji ? C.teal : C.border}`, borderRadius: 8, padding: '4px 6px', cursor: 'pointer', fontSize: 16 } }, e))
        ),
        React.createElement('div', { style: { display: 'flex', gap: 8 } },
          React.createElement('input', { value: habitText, onChange: e => setHabitText(e.target.value), onKeyDown: e => e.key === 'Enter' && addHabit(), placeholder: "Add something...", style: input({ flex: 1 }) }),
          React.createElement('button', { onClick: addHabit, style: btn(C.teal) }, '+')
        )
      ),
      React.createElement('div', { style: { marginTop: 20 } },
        React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito', fontSize: 13, margin: '0 0 8px', fontWeight: 700 } }, '🏆 Reward tiers'),
        REWARD_TIERS.map(t => React.createElement('div', { key: t.min, style: { display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: `1px solid ${C.border}22` } },
          React.createElement('span', { style: { fontSize: 18, width: 28 } }, t.icon),
          React.createElement('span', { style: { color: points >= t.min ? C.text : C.muted, fontFamily: 'Nunito', fontSize: 13, flex: 1 } }, t.name),
          React.createElement('span', { style: { color: C.muted, fontSize: 11 } }, t.min + ' pts')
        ))
      )
    );
  }

  function renderMood() {
    return React.createElement('div', null,
      !selectedMood && React.createElement('div', null,
        React.createElement('h3', { style: { color: C.pink, fontFamily: 'Nunito', margin: '0 0 16px', fontSize: 18 } }, '🌡️ How are you right now?'),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } },
          MOOD_OPTIONS.map(m => React.createElement('button', { key: m.id, onClick: () => setSelectedMood(m), style: { background: m.color + '15', border: `1.5px solid ${m.color}44`, borderRadius: 14, padding: 14, textAlign: 'left', cursor: 'pointer' } },
            React.createElement('div', { style: { fontSize: 24, marginBottom: 6 } }, m.icon),
            React.createElement('div', { style: { color: m.color, fontFamily: 'Nunito', fontWeight: 700, fontSize: 13 } }, m.label),
            React.createElement('div', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 11, marginTop: 2 } }, m.desc)
          ))
        )
      ),
      selectedMood && React.createElement('div', null,
        React.createElement('button', { onClick: () => setSelectedMood(null), style: { ...btn(C.muted, { marginBottom: 16, fontSize: 12 }) } }, '← Back'),
        React.createElement('div', { style: { background: selectedMood.color + '22', border: `2px solid ${selectedMood.color}`, borderRadius: 16, padding: 16, marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' } },
          React.createElement('span', { style: { fontSize: 36 } }, selectedMood.icon),
          React.createElement('div', null,
            React.createElement('h3', { style: { color: selectedMood.color, fontFamily: 'Nunito', margin: 0, fontSize: 20 } }, selectedMood.label),
            React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, margin: 0 } }, selectedMood.desc)
          )
        ),
        React.createElement('div', { style: card({ marginBottom: 16 }) },
          React.createElement('p', { style: { color: selectedMood.color, fontFamily: 'Nunito', fontWeight: 700, margin: '0 0 10px', fontSize: 14 } }, '💜 What you need right now'),
          selectedMood.needs.map((n, i) => React.createElement('div', { key: i, style: { display: 'flex', gap: 10, marginBottom: 8 } },
            React.createElement('span', { style: { color: selectedMood.color, fontSize: 14, flexShrink: 0 } }, ['✦', '◆', '●', '◉'][i]),
            React.createElement('span', { style: { color: C.text, fontFamily: 'Nunito Sans', fontSize: 13, lineHeight: 1.5 } }, n)
          ))
        ),
        React.createElement('div', { style: { display: 'flex', gap: 8, marginBottom: 16 } },
          selectedMood.links.map(l => React.createElement('button', { key: l.tab, onClick: () => { setActiveTab(l.tab); setSelectedMood(null); }, style: { ...btn(selectedMood.color, { flex: 1 }) } }, l.label))
        ),
        React.createElement('textarea', { value: moodNote, onChange: e => setMoodNote(e.target.value), placeholder: "Optional note about how you're feeling...", style: { ...textareaStyle({ height: 60, marginBottom: 10 }) } }),
        React.createElement('button', { onClick: () => { setMoodHistory(h => [{ mood: selectedMood, note: moodNote, ts: Date.now(), id: uid() }, ...h.slice(0, 9)]); setMoodNote(''); setSelectedMood(null); }, style: { ...btn(C.blue, { width: '100%' }) } }, '💾 Save check-in')
      ),
      moodHistory.length > 0 && React.createElement('div', { style: { marginTop: 16 } },
        React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito', fontSize: 13, margin: '0 0 8px', fontWeight: 700 } }, '📋 Recent check-ins'),
        moodHistory.slice(0, 5).map(h => React.createElement('div', { key: h.id, style: { display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.border}33` } },
          React.createElement('span', { style: { fontSize: 20 } }, h.mood.icon),
          React.createElement('span', { style: { color: h.mood.color, fontFamily: 'Nunito', fontSize: 13, flex: 1 } }, h.mood.label),
          React.createElement('span', { style: { color: C.muted, fontSize: 11 } }, new Date(h.ts).toLocaleDateString())
        ))
      )
    );
  }

  function renderSensory() {
    const allRated = SENSORY_SENSES.every(s => sensoryRatings[s.id] !== undefined);

    // Score: 0 = "just right", higher = more overloaded or under-loaded
    // WAY too much (0) = 3pts, A bit too much (1) = 1pt, Just right (2) = 0, Not enough (3) = 1pt, Really need more (4) = 2pts
    const overloadScore = (id) => { const r = sensoryRatings[id]; if (r === undefined) return 0; return [3,1,0,1,2][r]; };
    const totalScore = SENSORY_SENSES.reduce((sum, s) => sum + overloadScore(s.id), 0);
    const maxScore = SENSORY_SENSES.length * 3;
    const overloadPct = allRated ? Math.round((totalScore / maxScore) * 100) : 0;

    // Which senses are critically high (WAY too much = level 0)
    const critical = allRated ? SENSORY_SENSES.filter(s => sensoryRatings[s.id] === 0) : [];
    // Which are elevated (A bit too much = level 1)
    const elevated = allRated ? SENSORY_SENSES.filter(s => sensoryRatings[s.id] === 1) : [];
    // Needing more input
    const underloaded = allRated ? SENSORY_SENSES.filter(s => sensoryRatings[s.id] >= 3) : [];

    const severity = !allRated ? null : totalScore >= 9 ? "crisis" : totalScore >= 5 ? "high" : totalScore >= 2 ? "moderate" : "okay";

    const SEVERITY_CONFIG = {
      crisis: { color: C.pink, label: "You're in serious overload", icon: "🚨", bg: C.pink },
      high: { color: C.orange, label: "You're quite overloaded", icon: "⚠️", bg: C.orange },
      moderate: { color: C.yellow, label: "Some things need attention", icon: "💛", bg: C.yellow },
      okay: { color: C.teal, label: "You're pretty well regulated", icon: "✓", bg: C.teal },
    };

    // Per-trigger action suggestions
    const ACTIONS = {
      sound_0: { icon: "🎧", label: "Put noise-cancelling headphones or ear defenders on right now", urgent: true },
      sound_1: { icon: "🔉", label: "Turn down or move away from the sound source" },
      light_0: { icon: "🕶️", label: "Dim all lights, pull blinds, or put sunglasses on indoors", urgent: true },
      light_1: { icon: "🌅", label: "Switch to warm lighting, turn off overhead lights" },
      touch_0: { icon: "👕", label: "Change into soft loose clothing and remove anything scratchy", urgent: true },
      touch_1: { icon: "🧥", label: "Check for irritating fabrics or seams — remove or change them" },
      social_0: { icon: "🚪", label: "Leave the room or space — even 10 minutes alone is essential", urgent: true },
      social_1: { icon: "👤", label: "Reduce to one-on-one if possible, or step back from the group" },
      internal_0: { icon: "🌬️", label: "Stop, slow your breathing, feel your feet flat on the floor", urgent: true },
      internal_1: { icon: "☕", label: "Reduce caffeine/sugar, sit somewhere quieter" },
    };

    const urgentActions = allRated ? SENSORY_SENSES.flatMap(s => {
      const key = `${s.id}_${sensoryRatings[s.id]}`;
      return ACTIONS[key] ? [{ ...ACTIONS[key], sense: s.label }] : [];
    }) : [];

    // Break/walk prompts based on what's elevated
    const BREAK_SUGGESTIONS = allRated ? [
      critical.some(s => s.id === "sound" || s.id === "light") && { icon: "🚶", label: "Step outside for 5 minutes", desc: "Natural light and open space will reduce sound and light load immediately" },
      critical.some(s => s.id === "social") && { icon: "🔕", label: "Take a screen break now", desc: "Put your phone face down, step away from screens for at least 10 minutes" },
      severity === "crisis" || severity === "high" ? { icon: "📵", label: "Screen break — right now", desc: "Close tabs, put phone down. You need to reduce input, not add to it." } : null,
      (severity === "high" || severity === "crisis") && { icon: "🚶", label: "Walk somewhere with less input", desc: "Outside, a quiet corridor, the bathroom — anywhere with fewer demands on your senses" },
      critical.some(s => s.id === "internal") && { icon: "💧", label: "Drink water and sit down", desc: "Your body is signalling overwhelm — basic physical care first" },
    ].filter(Boolean) : [];

    return React.createElement('div', null,
      React.createElement('h3', { style: { color: C.yellow, fontFamily: 'Nunito', margin: '0 0 4px', fontSize: 18 } }, '👁️ Sensory Check-in'),
      React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, margin: '0 0 16px', lineHeight: 1.5 } }, 'Rate each sense — then we\'ll build your plan.'),

      SENSORY_SENSES.map(sense => React.createElement('div', { key: sense.id, style: { ...card({ marginBottom: 10 }) } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 } },
          React.createElement('span', { style: { fontSize: 20 } }, sense.icon),
          React.createElement('span', { style: { color: C.text, fontFamily: 'Nunito', fontWeight: 700, fontSize: 15 } }, sense.label),
          sensoryRatings[sense.id] === 0 && React.createElement('span', { style: { background: C.pink + '33', color: C.pink, fontFamily: 'Nunito', fontWeight: 700, fontSize: 11, borderRadius: 20, padding: '2px 8px', marginLeft: 'auto' } }, '🚨 Critical'),
          sensoryRatings[sense.id] === 1 && React.createElement('span', { style: { background: C.orange + '33', color: C.orange, fontFamily: 'Nunito', fontWeight: 700, fontSize: 11, borderRadius: 20, padding: '2px 8px', marginLeft: 'auto' } }, '⚠️ Elevated'),
          sensoryRatings[sense.id] === 2 && React.createElement('span', { style: { background: C.teal + '22', color: C.teal, fontFamily: 'Nunito', fontWeight: 700, fontSize: 11, borderRadius: 20, padding: '2px 8px', marginLeft: 'auto' } }, '✓ OK'),
        ),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 5 } },
          sense.levels.map((level, i) => React.createElement('button', {
            key: i, onClick: () => setSensoryRatings(r => ({ ...r, [sense.id]: i })),
            style: {
              background: sensoryRatings[sense.id] === i ? (i === 0 ? C.pink + '33' : i === 1 ? C.orange + '22' : i === 2 ? C.teal + '22' : C.blue + '22') : 'transparent',
              border: `1.5px solid ${sensoryRatings[sense.id] === i ? (i === 0 ? C.pink : i === 1 ? C.orange : i === 2 ? C.teal : C.blue) : C.border}`,
              borderRadius: 10, padding: '9px 12px',
              color: sensoryRatings[sense.id] === i ? (i === 0 ? C.pink : i === 1 ? C.orange : i === 2 ? C.teal : C.blue) : C.muted,
              fontFamily: 'Nunito', cursor: 'pointer', textAlign: 'left', fontSize: 13, transition: 'all 0.15s',
            }
          }, level))
        )
      )),

      // ── PLAN ─────────────────────────────────────────────────────────────
      allRated && React.createElement('div', null,

        // Overall score banner
        React.createElement('div', { style: { background: gt(SEVERITY_CONFIG[severity].bg + '22', SEVERITY_CONFIG[severity].bg + '0a', 135), border: `2px solid ${SEVERITY_CONFIG[severity].color}55`, borderRadius: 18, padding: '18px 16px', marginBottom: 16, textAlign: 'center' } },
          React.createElement('div', { style: { fontSize: 36, marginBottom: 6 } }, SEVERITY_CONFIG[severity].icon),
          React.createElement('p', { style: { color: SEVERITY_CONFIG[severity].color, fontFamily: 'Nunito', fontWeight: 900, fontSize: 18, margin: '0 0 4px' } }, SEVERITY_CONFIG[severity].label),
          React.createElement('div', { style: { display: 'flex', gap: 4, justifyContent: 'center', margin: '10px 0 4px' } },
            [...Array(maxScore)].map((_, i) => React.createElement('div', { key: i, style: { width: 8, height: 8, borderRadius: '50%', background: i < totalScore ? SEVERITY_CONFIG[severity].color : C.border, transition: 'background 0.3s' } }))
          ),
          React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 12, margin: 0 } }, critical.length > 0 ? critical.map(s => s.label).join(', ') + ` at critical level` : elevated.length > 0 ? elevated.map(s => s.label).join(', ') + ` elevated` : 'All senses within range')
        ),

        // Crisis — immediate alert + safety plan link
        severity === "crisis" && React.createElement('div', { style: { background: C.pink + '15', border: `2px solid ${C.pink}`, borderRadius: 16, padding: '16px', marginBottom: 16 } },
          React.createElement('p', { style: { color: C.pink, fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, margin: '0 0 8px' } }, '🚨 This is serious overload'),
          React.createElement('p', { style: { color: C.text, fontFamily: 'Nunito Sans', fontSize: 13, margin: '0 0 14px', lineHeight: 1.6 } }, 'Your sensory system is critically overwhelmed. Right now, reducing input is the only priority. Everything else can wait.'),
          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
            React.createElement('button', {
              onClick: () => { setSection('safetyplan'); setActiveTab('safetyplan'); },
              style: { ...btn(C.pink, { width: '100%', padding: 14, fontSize: 15 }) }
            }, '🛟 Open my Safety Plan'),
            React.createElement('button', {
              onClick: () => { setSection('regulate'); setActiveTab('toolkit'); setOpenTool('shutdown'); },
              style: { ...btn(C.purple, { width: '100%', padding: 12, fontSize: 14 }) }
            }, '🔋 Shutdown / Meltdown support')
          )
        ),

        // Break / walk / screen suggestions
        BREAK_SUGGESTIONS.length > 0 && React.createElement('div', { style: { ...card({ marginBottom: 16, borderColor: C.orange + '44' }) } },
          React.createElement('p', { style: { color: C.orange, fontFamily: 'Nunito', fontWeight: 800, fontSize: 14, margin: '0 0 12px' } }, '⏸️ Do this now'),
          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
            BREAK_SUGGESTIONS.map((s, i) => React.createElement('div', { key: i, style: { display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 12px', background: C.orange + '0d', border: `1px solid ${C.orange}33`, borderRadius: 12 } },
              React.createElement('span', { style: { fontSize: 22, flexShrink: 0 } }, s.icon),
              React.createElement('div', null,
                React.createElement('div', { style: { color: C.text, fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, marginBottom: 2 } }, s.label),
                React.createElement('div', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 12, lineHeight: 1.4 } }, s.desc)
              )
            ))
          )
        ),

        // Urgent per-sense actions
        urgentActions.length > 0 && React.createElement('div', { style: { ...card({ marginBottom: 16, borderColor: C.yellow + '44' }) } },
          React.createElement('p', { style: { color: C.yellow, fontFamily: 'Nunito', fontWeight: 800, fontSize: 14, margin: '0 0 12px' } }, '🎯 Your sensory action plan'),
          urgentActions.map((a, i) => React.createElement('div', { key: i, style: { display: 'flex', gap: 12, alignItems: 'flex-start', padding: '9px 0', borderBottom: i < urgentActions.length - 1 ? `1px solid ${C.border}22` : 'none' } },
            React.createElement('span', { style: { fontSize: 20, flexShrink: 0 } }, a.icon),
            React.createElement('div', null,
              React.createElement('div', { style: { color: a.urgent ? C.pink : C.text, fontFamily: 'Nunito', fontWeight: 700, fontSize: 13, marginBottom: 1 } }, a.label),
              React.createElement('div', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 11 } }, a.sense)
            )
          ))
        ),

        // Under-loaded input suggestions
        underloaded.length > 0 && React.createElement('div', { style: { ...card({ marginBottom: 16, borderColor: C.blue + '44' }) } },
          React.createElement('p', { style: { color: C.blue, fontFamily: 'Nunito', fontWeight: 800, fontSize: 14, margin: '0 0 12px' } }, '📶 Your senses need more input'),
          underloaded.map((s, i) => React.createElement('div', { key: i, style: { padding: '9px 0', borderBottom: i < underloaded.length - 1 ? `1px solid ${C.border}22` : 'none' } },
            React.createElement('div', { style: { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 } },
              React.createElement('span', null, s.icon),
              React.createElement('span', { style: { color: C.blue, fontFamily: 'Nunito', fontWeight: 700, fontSize: 13 } }, s.label)
            ),
            React.createElement('p', { style: { color: C.text, fontFamily: 'Nunito Sans', fontSize: 13, margin: 0, lineHeight: 1.5, paddingLeft: 30 } }, s.advice[sensoryRatings[s.id]])
          ))
        ),

        // Toolkit shortcut
        (severity === "high" || severity === "moderate") && React.createElement('button', {
          onClick: () => { setSection('regulate'); setActiveTab('toolkit'); },
          style: { ...btn(C.teal, { width: '100%', padding: 14, fontSize: 15, marginBottom: 12 }) }
        }, '🧰 Open regulation toolkit'),

        // Reset
        React.createElement('button', { onClick: () => setSensoryRatings({}), style: { ...btn(C.muted, { width: '100%' }) } }, '↺ Check again')
      ),

      !allRated && SENSORY_SENSES.some(s => sensoryRatings[s.id] !== undefined) && React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito', fontSize: 12, textAlign: 'center', marginTop: 8 } }, `${Object.keys(sensoryRatings).length} of ${SENSORY_SENSES.length} rated — rate all to see your plan`)
    );
  }

  function renderDopamine() {
    const tabs = [
      { id: "science", label: "🧬 Science" }, { id: "fixes", label: "💚 Good fixes" },
      { id: "traps", label: "🚨 Traps" }, { id: "games", label: "🎮 Distraction" }
    ];
    return React.createElement('div', null,
      React.createElement('div', { style: { display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto' } },
        tabs.map(t => React.createElement('button', { key: t.id, onClick: () => setDopamineTab(t.id), style: { ...pill(dopamineTab === t.id, C.yellow), whiteSpace: 'nowrap' } }, t.label))
      ),
      dopamineTab === "science" && React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
        DOPAMINE_SCIENCE.map((s, i) => React.createElement('div', { key: i, style: card() },
          React.createElement('div', { style: { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 } },
            React.createElement('span', { style: { fontSize: 24 } }, s.icon),
            React.createElement('h4', { style: { color: C.yellow, fontFamily: 'Nunito', margin: 0 } }, s.title)
          ),
          React.createElement('p', { style: { color: C.text, fontFamily: 'Nunito Sans', fontSize: 13, lineHeight: 1.7, margin: 0 } }, s.body)
        ))
      ),
      dopamineTab === "fixes" && React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } },
        DOPAMINE_FIXES.map((f, i) => React.createElement('div', { key: i, style: { background: C.green + '11', border: `1px solid ${C.green}33`, borderRadius: 14, padding: 14 } },
          React.createElement('div', { style: { fontSize: 24, marginBottom: 6 } }, f.icon),
          React.createElement('h4', { style: { color: C.green, fontFamily: 'Nunito', margin: '0 0 4px', fontSize: 14 } }, f.title),
          React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 12, lineHeight: 1.5, margin: '0 0 6px' } }, f.desc),
          React.createElement('span', { style: { color: C.yellow, fontFamily: 'Nunito', fontSize: 11, fontWeight: 700 } }, '⏱ ' + f.time)
        ))
      ),
      dopamineTab === "traps" && React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
        DOPAMINE_TRAPS.map((t, i) => React.createElement('div', { key: i, style: card() },
          React.createElement('div', { style: { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 } },
            React.createElement('span', { style: { fontSize: 24 } }, t.icon),
            React.createElement('h4', { style: { color: C.orange, fontFamily: 'Nunito', margin: 0 } }, t.title)
          ),
          React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, margin: '0 0 8px' } }, t.why),
          React.createElement('div', { style: { background: C.green + '11', border: `1px solid ${C.green}33`, borderRadius: 10, padding: 10 } },
            React.createElement('p', { style: { color: C.green, fontFamily: 'Nunito', fontSize: 12, fontWeight: 700, margin: '0 0 2px' } }, '✓ Instead:'),
            React.createElement('p', { style: { color: C.text, fontFamily: 'Nunito Sans', fontSize: 13, margin: 0 } }, t.swap)
          )
        ))
      ),
      dopamineTab === "games" && React.createElement('div', null,
        gameTimerUp && React.createElement('div', { style: { position: 'fixed', inset: 0, background: C.bg, zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 } },
          React.createElement('div', { style: { fontSize: 64, marginBottom: 16 } }, '⏰'),
          React.createElement('h2', { style: { color: C.teal, fontFamily: 'Nunito', fontWeight: 800, fontSize: 28, textAlign: 'center', margin: '0 0 12px' } }, "Time's up!"),
          React.createElement('p', { style: { color: C.text, fontFamily: 'Nunito Sans', fontSize: 16, textAlign: 'center', lineHeight: 1.7, margin: '0 0 24px', maxWidth: 380 } }, "You chose to rest. That was the right call. Now — one thing from your task list?"),
          React.createElement('button', { onClick: () => { setGameTimerUp(false); setActiveTab('tasks'); }, style: { ...btn(C.teal, { fontSize: 16, padding: '12px 24px' }) } }, '→ Go to tasks'),
          React.createElement('button', { onClick: () => setGameTimerUp(false), style: { ...btn(C.muted, { marginTop: 10 }) } }, 'Back to games')
        ),
        !gameTimer && !activeGame && React.createElement('div', null,
          React.createElement('h4', { style: { color: C.yellow, fontFamily: 'Nunito', margin: '0 0 12px' } }, '⏱ Set your timer first'),
          React.createElement('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 } },
            [5,10,15,20,30].map(m => React.createElement('button', { key: m, onClick: () => { startGameWithTimer(m); }, style: { ...btn(C.yellow, { fontSize: 15, padding: '10px 18px' }) } }, m + ' min'))
          ),
          React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13 } }, 'Choose a time limit, then pick your game. When time is up, you\'ll be prompted to check your tasks.')
        ),
        gameTimer && !activeGame && React.createElement('div', null,
          React.createElement('div', { style: { ...card({ background: C.yellow + '11', borderColor: C.yellow + '44', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }) } },
            React.createElement('span', { style: { color: C.yellow, fontFamily: 'Nunito', fontWeight: 700, fontSize: 15 } }, '⏱ ' + fmtTime(gameTimerLeft)),
            React.createElement('span', { style: { color: C.muted, fontSize: 13 } }, gameTimerMins + ' min session'),
            React.createElement('button', { onClick: () => { setGameTimer(null); clearInterval(gameTimerRef.current); }, style: { ...btn(C.muted, { fontSize: 12, padding: '6px 10px' }) } }, 'Cancel')
          ),
          React.createElement('div', { style: { display: 'flex', gap: 10 } },
            [{ id:'snake',label:'🐍 Snake'},{id:'blockdrop',label:'🧱 Block Drop'},{id:'nonogram',label:'🟦 Nonogram'}].map(g => React.createElement('button', { key: g.id, onClick: () => setActiveGame(g.id), style: { ...btn(C.teal, { flex: 1, padding: 12 }) } }, g.label))
          )
        ),
        gameTimer && activeGame && React.createElement('div', null,
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } },
            React.createElement('span', { style: { color: gameTimerLeft < 60 ? C.pink : C.yellow, fontFamily: 'Nunito', fontWeight: 800, fontSize: 18 } }, '⏱ ' + fmtTime(gameTimerLeft)),
            React.createElement('button', { onClick: () => setActiveGame(null), style: { ...btn(C.muted, { fontSize: 12 }) } }, '← Games')
          ),
          activeGame === 'snake' && React.createElement(SnakeGame, { C }),
          activeGame === 'blockdrop' && React.createElement(BlockDropGame, { C }),
          activeGame === 'nonogram' && React.createElement(NonogramGame, { C })
        )
      )
    );
  }

  function renderToolkit() {
    const GROUNDING_PROMPTS = [
      { n: 5, label: "5 things you can SEE", hint: "Look around and name 5 specific things", icon: "👁️" },
      { n: 4, label: "4 things you can TOUCH", hint: "Notice textures, temperatures, surfaces", icon: "✋" },
      { n: 3, label: "3 things you can HEAR", hint: "Close your eyes and listen carefully", icon: "👂" },
      { n: 2, label: "2 things you can SMELL", hint: "What scents are in your space?", icon: "👃" },
      { n: 1, label: "1 thing you can TASTE", hint: "Focus on the taste in your mouth right now", icon: "👅" },
    ];
    const SHUTDOWN_STEPS = [
      { icon: "🛑", title: "Stop and acknowledge", desc: "You are not broken. Your nervous system is overwhelmed. This is real, this is physical, and this is valid." },
      { icon: "🔕", title: "Reduce input", desc: "Lower lights. Turn off sound. Remove yourself from social demands if possible. You need less input right now." },
      { icon: "🧸", title: "Find something safe", desc: "A soft object, a weighted blanket, a familiar smell, your pet. Something that signals safety to your body." },
      { icon: "💧", title: "Basic care only", desc: "Water if possible. Stay warm. You don't need to do anything else. This is enough right now." },
      { icon: "⏳", title: "Wait it out", desc: "Shutdown ends. You will come back. Don't try to force yourself out of it — that extends it. Just wait." },
    ];
    const RESOURCES = [
      { cat: "📚 Focus & Tasks", items: [{ label: "Focusmate", url: "https://focusmate.com", desc: "Body doubling with real people" }, { label: "Goblin Tools", url: "https://goblin.tools", desc: "Task breakdown AI" }, { label: "Todoist", url: "https://todoist.com", desc: "Flexible task management" }, { label: "Forest", url: "https://forestapp.cc", desc: "Phone-free focus timer" }] },
      { cat: "🧠 Understanding", items: [{ label: "How to ADHD", url: "https://howtoadhd.com", desc: "YouTube channel by Jessica McCabe" }, { label: "ADHD UK", url: "https://adhduk.co.uk", desc: "UK-focused support and info" }, { label: "Understood.org", url: "https://understood.org", desc: "LD and ADHD resources" }] },
      { cat: "⚖️ Workplace", items: [{ label: "Access to Work", url: "https://gov.uk/access-to-work", desc: "UK government workplace support" }, { label: "ACAS", url: "https://acas.org.uk", desc: "Workplace rights and advice" }, { label: "Otter.ai", url: "https://otter.ai", desc: "AI transcription and notes" }] },
    ];

    function toggleTool(id) { setOpenTool(o => o === id ? null : id); }

    function toolRow(id, icon, label, color, badge, ...children) {
      const isOpen = openTool === id;
      return React.createElement('div', { key: id, style: { marginBottom: 8 } },
        React.createElement('button', {
          onClick: () => toggleTool(id),
          style: {
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            background: isOpen ? color + '18' : C.card,
            border: `1.5px solid ${isOpen ? color : C.border}`,
            borderRadius: isOpen ? '14px 14px 0 0' : 14,
            padding: '14px 16px', cursor: 'pointer',
            transition: 'all 0.2s',
          }
        },
          React.createElement('span', { style: { fontSize: 20, lineHeight: 1 } }, icon),
          React.createElement('span', { style: { flex: 1, color: isOpen ? color : C.text, fontFamily: 'Nunito', fontWeight: 700, fontSize: 15, textAlign: 'left' } }, label),
          badge && React.createElement('span', { style: { background: color + '33', color, fontFamily: 'Nunito', fontWeight: 700, fontSize: 12, borderRadius: 20, padding: '2px 10px' } }, badge),
          React.createElement('span', { style: { color: C.muted, fontSize: 13, display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' } }, '▾')
        ),
        isOpen && React.createElement('div', {
          style: {
            background: C.card, border: `1.5px solid ${color}`,
            borderTop: 'none', borderRadius: '0 0 14px 14px',
            padding: '16px 16px 20px',
          }
        }, ...children)
      );
    }

    return React.createElement('div', null,

      toolRow("bodydouble", "🧑‍🤝‍🧑", "Body Double Timer", C.teal, bodyDoubleRunning ? fmtTime(bodyDoubleLeft) : null,
        !bodyDoubleRunning
          ? React.createElement('div', null,
              React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, margin: '0 0 12px', lineHeight: 1.6 } }, 'Work alongside a silent presence. Set your time and start — the timer keeps you company.'),
              React.createElement('div', { style: { display: 'flex', gap: 8, marginBottom: 12 } },
                [15, 25, 50].map(m => React.createElement('button', { key: m, onClick: () => setBodyDoubleTime(m), style: pill(bodyDoubleTime === m, C.teal) }, m + ' min'))
              ),
              React.createElement('button', { onClick: () => { setBodyDoubleLeft(bodyDoubleTime * 60); setBodyDoubleRunning(true); }, style: { ...btn(C.teal, { width: '100%', padding: 12 }) } }, '▶ Start body double session')
            )
          : React.createElement('div', { style: { textAlign: 'center', padding: '8px 0' } },
              React.createElement('div', { style: { fontSize: 48, fontWeight: 900, color: bodyDoubleLeft < 300 ? C.pink : C.teal, fontFamily: 'Nunito', letterSpacing: 2 } }, fmtTime(bodyDoubleLeft)),
              React.createElement('p', { style: { color: C.muted, fontSize: 13, fontFamily: 'Nunito', margin: '4px 0 16px' } }, 'Working alongside you 🫶'),
              React.createElement('div', { style: { background: C.border + '44', borderRadius: 8, height: 4, overflow: 'hidden', marginBottom: 16 } },
                React.createElement('div', { style: { height: '100%', width: (bodyDoubleLeft / (bodyDoubleTime * 60) * 100) + '%', background: gt(C.teal, C.blue), borderRadius: 8, transition: 'width 1s linear' } })
              ),
              React.createElement('button', { onClick: () => { setBodyDoubleRunning(false); clearInterval(bodyDoubleRef.current); }, style: { ...btn(C.muted, { padding: '8px 20px' }) } }, '■ Stop')
            )
      ),

      toolRow("breathing", "💨", "4-4-6 Breathing", C.blue, toolkitBreathing ? "active" : null,
        React.createElement('div', null,
          React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, margin: '0 0 14px', lineHeight: 1.6 } }, 'Breathe in for 4 · hold for 4 · breathe out for 6. Three cycles to calm your nervous system.'),
          !toolkitBreathing && toolkitBreathPhase !== "done" &&
            React.createElement('button', { onClick: () => setToolkitBreathing(true), style: { ...btn(C.blue, { width: '100%', padding: 12 }) } }, '▶ Start breathing'),
          (toolkitBreathing || toolkitBreathPhase === "done") &&
            React.createElement(BreathOrb, { phase: toolkitBreathPhase, countdown: toolkitBreathCountdown }),
          toolkitBreathPhase === "done" &&
            React.createElement('button', { onClick: () => setToolkitBreathPhase("ready"), style: { ...btn(C.muted, { width: '100%', marginTop: 12 }) } }, '↺ Go again')
        )
      ),

      toolRow("sigh", "😮‍💨", "Physiological Sigh", C.teal, sighRunning ? "active" : null,
        React.createElement('div', null,
          React.createElement('div', { style: { background: C.teal + '11', border: `1px solid ${C.teal}33`, borderRadius: 10, padding: '10px 14px', marginBottom: 14 } },
            React.createElement('p', { style: { color: C.teal, fontFamily: 'Nunito', fontWeight: 700, fontSize: 12, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 } }, 'The science'),
            React.createElement('p', { style: { color: C.text, fontFamily: 'Nunito Sans', fontSize: 13, margin: 0, lineHeight: 1.6 } }, 'Researched at Stanford (Huberman Lab). The double inhale re-inflates collapsed lung sacs, allowing maximum CO₂ offload on the long exhale. Shown to be the single fastest way to reduce physiological stress — works in one breath.')
          ),
          React.createElement('div', { style: { marginBottom: 16 } },
            [
              { icon: "👃", label: "Inhale fully through your nose", sub: "Fill your lungs completely — 4 seconds" },
              { icon: "👃", label: "Sniff again at the top", sub: "A short sharp sniff to pack in more air — 1 second" },
              { icon: "💨", label: "Long slow exhale through mouth", sub: "Twice as long as the inhale — 8 seconds" },
            ].map((s, i) => React.createElement('div', { key: i, style: { display: 'flex', gap: 12, alignItems: 'flex-start', padding: '8px 0', borderBottom: `1px solid ${C.border}22` } },
              React.createElement('span', { style: { fontSize: 20, marginTop: 2 } }, s.icon),
              React.createElement('div', null,
                React.createElement('p', { style: { color: C.text, fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, margin: '0 0 2px' } }, s.label),
                React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 12, margin: 0 } }, s.sub)
              )
            ))
          ),
          sighPhase === "ready" || sighPhase === "done"
            ? React.createElement('div', null,
                sighPhase === "done" && React.createElement('p', { style: { color: C.teal, fontFamily: 'Nunito', fontWeight: 700, textAlign: 'center', margin: '0 0 12px' } }, '✓ Done — 5 sighs complete. Notice the difference.'),
                React.createElement('button', { onClick: () => { setSighPhase("ready"); setSighCycle(0); setSighRunning(true); }, style: { ...btn(C.teal, { width: '100%', padding: 12 }) } }, sighPhase === "done" ? '↺ Again' : '▶ Guide me through 5 sighs')
              )
            : React.createElement('div', { style: { textAlign: 'center', padding: '8px 0' } },
                React.createElement('div', { style: { display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 16 } },
                  [0,1,2,3,4].map(i => React.createElement('div', { key: i, style: { width: 10, height: 10, borderRadius: '50%', background: i < sighCycle ? C.teal : i === sighCycle ? C.teal : C.border, opacity: i === sighCycle ? 1 : i < sighCycle ? 0.5 : 0.3 } }))
                ),
                React.createElement('div', { style: {
                  width: 110, height: 110, borderRadius: '50%', margin: '0 auto 16px',
                  background: sighPhase === "exhale" ? C.blue + '33' : C.teal + '33',
                  border: `3px solid ${sighPhase === "exhale" ? C.blue : C.teal}`,
                  transform: sighPhase === "exhale" ? 'scale(1)' : sighPhase === "inhale2" ? 'scale(1.7)' : 'scale(1.5)',
                  transition: sighPhase === "inhale1" ? 'transform 4s ease-in' : sighPhase === "inhale2" ? 'transform 1s ease-in' : 'transform 8s ease-out',
                  boxShadow: `0 0 40px ${sighPhase === "exhale" ? C.blue : C.teal}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                } },
                  React.createElement('span', { style: { fontSize: 28 } }, sighPhase === "exhale" ? "💨" : "👃")
                ),
                React.createElement('p', { style: { color: sighPhase === "exhale" ? C.blue : C.teal, fontFamily: 'Nunito', fontWeight: 800, fontSize: 18, margin: '0 0 4px' } },
                  sighPhase === "inhale1" ? "Breathe IN" : sighPhase === "inhale2" ? "Sniff again!" : "Exhale slowly..."
                ),
                React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, margin: 0 } },
                  `Sigh ${sighCycle + 1} of 5`
                ),
                React.createElement('button', { onClick: () => { setSighRunning(false); setSighPhase("ready"); }, style: { ...btn(C.muted, { marginTop: 16, fontSize: 12, padding: '6px 16px' }) } }, '■ Stop')
              )
        )
      ),

      toolRow("coldwater", "🧊", "Cold Water Reset", C.blue, null,
        React.createElement('div', null,
          React.createElement('div', { style: { background: C.blue + '11', border: `1px solid ${C.blue}33`, borderRadius: 10, padding: '10px 14px', marginBottom: 14 } },
            React.createElement('p', { style: { color: C.blue, fontFamily: 'Nunito', fontWeight: 700, fontSize: 12, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 } }, 'The science'),
            React.createElement('p', { style: { color: C.text, fontFamily: 'Nunito Sans', fontSize: 13, margin: 0, lineHeight: 1.6 } }, 'Cold water on the face activates the dive reflex — your heart rate drops almost immediately, cortisol reduces, and the nervous system shifts toward calm. Used in DBT (TIPP skill) for acute emotional dysregulation.')
          ),
          [
            { icon: "🚿", title: "Face in cold water", desc: "Fill a bowl or sink with cold water. Hold your face in it for 30 seconds while holding your breath. Immediately activates the dive reflex.", color: C.blue },
            { icon: "🧊", title: "Ice pack on face / wrists", desc: "Hold ice or a cold pack to your cheeks, forehead, or inner wrists for 30 seconds. Gentler than submersion but still effective.", color: C.teal },
            { icon: "💦", title: "Cold water on neck", desc: "Run cold water on the back of your neck and down your wrists. Good for when you're out in public or can't submerge.", color: C.blue },
            { icon: "🌬️", title: "Splash and breathe", desc: "Splash cold water on your face and then take one slow breath through your nose. Pairs the dive reflex with the breath reset.", color: C.purple },
          ].map((item, i) => React.createElement('div', { key: i, style: { display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderBottom: i < 3 ? `1px solid ${C.border}22` : 'none' } },
            React.createElement('span', { style: { fontSize: 22, marginTop: 2 } }, item.icon),
            React.createElement('div', null,
              React.createElement('p', { style: { color: item.color, fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, margin: '0 0 2px' } }, item.title),
              React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 12, margin: 0, lineHeight: 1.5 } }, item.desc)
            )
          ))
        )
      ),

      toolRow("havening", "🤲", "Havening", C.purple, null,
        React.createElement('div', null,
          React.createElement('div', { style: { background: C.purple + '11', border: `1px solid ${C.purple}33`, borderRadius: 10, padding: '10px 14px', marginBottom: 14 } },
            React.createElement('p', { style: { color: C.purple, fontFamily: 'Nunito', fontWeight: 700, fontSize: 12, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 } }, 'The science'),
            React.createElement('p', { style: { color: C.text, fontFamily: 'Nunito Sans', fontSize: 13, margin: 0, lineHeight: 1.6 } }, 'Havening uses gentle, repetitive touch to generate delta waves in the brain, which detach emotional charge from distressing memories. Developed by Dr Ronald Ruden. Widely used in trauma therapy and with ND individuals — it works through the touch receptors in the skin, not cognitive processing.')
          ),
          [
            { step: 1, icon: "🤲", title: "Stroke your arms", desc: "Use both hands to slowly stroke from your shoulders down to your elbows, alternating sides. Like you're comforting yourself. Repeat 10–15 times." },
            { step: 2, icon: "😌", title: "Stroke your face", desc: "With your fingertips, gently stroke from your forehead down your cheeks and to your chin. Slow, gentle, deliberate. Repeat 10–15 times." },
            { step: 3, icon: "✋", title: "Stroke the backs of your hands", desc: "Use your opposite palm to slowly stroke across the back of each hand in turn. This activates a particularly dense cluster of delta-wave receptors." },
            { step: 4, icon: "🧘", title: "Hum as you go", desc: "Quietly hum a simple tune while stroking — any tune. This occupies your working memory, allowing the distress pathway to decouple." },
          ].map((s, i) => React.createElement('div', { key: i, style: { display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderBottom: i < 3 ? `1px solid ${C.border}22` : 'none' } },
            React.createElement('div', { style: { width: 28, height: 28, borderRadius: '50%', background: C.purple + '33', border: `1.5px solid ${C.purple}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } },
              React.createElement('span', { style: { color: C.purple, fontFamily: 'Nunito', fontWeight: 800, fontSize: 13 } }, s.step)
            ),
            React.createElement('div', null,
              React.createElement('p', { style: { color: C.purple, fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, margin: '0 0 2px' } }, s.title),
              React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 12, margin: 0, lineHeight: 1.5 } }, s.desc)
            )
          )),
          React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 11, margin: '14px 0 0', lineHeight: 1.5, fontStyle: 'italic' } }, 'You can do all of these or just one. There is no wrong way to haven. Even 60 seconds makes a measurable difference.')
        )
      ),

      toolRow("tipp", "🌡️", "TIPP — Emergency Regulation", C.orange, null,
        React.createElement('div', null,
          React.createElement('div', { style: { background: C.orange + '11', border: `1px solid ${C.orange}33`, borderRadius: 10, padding: '10px 14px', marginBottom: 14 } },
            React.createElement('p', { style: { color: C.orange, fontFamily: 'Nunito', fontWeight: 700, fontSize: 12, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 } }, 'From DBT — for high emotional arousal'),
            React.createElement('p', { style: { color: C.text, fontFamily: 'Nunito Sans', fontSize: 13, margin: 0, lineHeight: 1.6 } }, 'TIPP (Temperature · Intense exercise · Paced breathing · Progressive relaxation) is a Dialectical Behaviour Therapy skill for when your emotion brain has taken over and you cannot think clearly. It works on your body, not your thoughts — bypassing the cognitive blocks that come with dysregulation.')
          ),
          [
            { letter: "T", title: "Temperature", color: C.blue, icon: "🧊", desc: "Cold water on your face or wrists. Activates the dive reflex — heart rate drops fast. Even 30 seconds works. (See Cold Water Reset above for options.)" },
            { letter: "I", title: "Intense exercise", color: C.pink, icon: "🏃", desc: "Run up and down stairs, do 20 jumping jacks, sprint on the spot for 60 seconds. Intense exercise burns off the adrenaline that's keeping you dysregulated." },
            { letter: "P", title: "Paced breathing", color: C.teal, icon: "💨", desc: "Breathe out longer than you breathe in. Try 4 in, 6 out — or use the Physiological Sigh above. The extended exhale activates your parasympathetic nervous system." },
            { letter: "P", title: "Progressive relaxation", color: C.purple, icon: "🧘", desc: "Tense each muscle group hard for 5 seconds, then release completely. Start at your feet, work upward. The contrast between tension and release signals safety to your nervous system." },
          ].map((item, i) => React.createElement('div', { key: i, style: { display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderBottom: i < 3 ? `1px solid ${C.border}22` : 'none' } },
            React.createElement('div', { style: { width: 32, height: 32, borderRadius: 8, background: item.color + '33', border: `1.5px solid ${item.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 } },
              React.createElement('span', { style: { color: item.color, fontFamily: 'Nunito', fontWeight: 900, fontSize: 15 } }, item.letter)
            ),
            React.createElement('div', null,
              React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 } },
                React.createElement('span', { style: { fontSize: 16 } }, item.icon),
                React.createElement('p', { style: { color: item.color, fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, margin: 0 } }, item.title)
              ),
              React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 12, margin: 0, lineHeight: 1.5 } }, item.desc)
            )
          )),
          React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 11, margin: '14px 0 0', lineHeight: 1.5, fontStyle: 'italic' } }, 'Use TIPP when you\'re too activated to think. Get the body calm first — then problem-solve.')
        )
      ),

      toolRow("grounding", "🌿", "5-4-3-2-1 Grounding", C.green, groundingActive ? (groundingStep + 1) + "/5" : null,
        React.createElement('div', null,
          React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, margin: '0 0 14px', lineHeight: 1.6 } }, 'Anchor yourself to the present moment using your senses. Takes about 2 minutes.'),
          !groundingActive
            ? React.createElement('button', { onClick: () => { setGroundingActive(true); setGroundingStep(0); }, style: { ...btn(C.green, { width: '100%', padding: 12 }) } }, '▶ Start grounding')
            : React.createElement('div', null,
                React.createElement('div', { style: { display: 'flex', gap: 6, marginBottom: 16 } },
                  GROUNDING_PROMPTS.map((_, i) => React.createElement('div', { key: i, style: { flex: 1, height: 4, borderRadius: 4, background: i <= groundingStep ? C.green : C.border, transition: 'background 0.3s' } }))
                ),
                React.createElement('div', { style: { textAlign: 'center', padding: '8px 0 16px' } },
                  React.createElement('div', { style: { fontSize: 40, marginBottom: 10 } }, GROUNDING_PROMPTS[groundingStep].icon),
                  React.createElement('p', { style: { color: C.green, fontFamily: 'Nunito', fontWeight: 800, fontSize: 17, margin: '0 0 6px' } }, GROUNDING_PROMPTS[groundingStep].label),
                  React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, margin: 0, lineHeight: 1.5 } }, GROUNDING_PROMPTS[groundingStep].hint)
                ),
                groundingStep < 4
                  ? React.createElement('button', { onClick: () => setGroundingStep(s => s + 1), style: { ...btn(C.green, { width: '100%', padding: 12 }) } }, 'Done → Next sense')
                  : React.createElement('button', { onClick: () => setGroundingActive(false), style: { ...btn(C.teal, { width: '100%', padding: 12 }) } }, '✓ Complete — well done')
              )
        )
      ),

      toolRow("shutdown", "🔋", "Shutdown / Meltdown", C.purple, null,
        React.createElement('div', null,
          React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, margin: '0 0 14px', lineHeight: 1.6 } }, 'Your nervous system is overwhelmed. Step through this gently, at your own pace.'),
          React.createElement('div', { style: { display: 'flex', gap: 6, marginBottom: 16 } },
            SHUTDOWN_STEPS.map((_, i) => React.createElement('div', { key: i, style: { flex: 1, height: 4, borderRadius: 4, background: i <= shutdownStep ? C.purple : C.border, transition: 'background 0.3s' } }))
          ),
          React.createElement('div', { style: { background: C.purple + '11', border: `1px solid ${C.purple}33`, borderRadius: 12, padding: '16px', marginBottom: 14, textAlign: 'center' } },
            React.createElement('div', { style: { fontSize: 36, marginBottom: 8 } }, SHUTDOWN_STEPS[shutdownStep].icon),
            React.createElement('p', { style: { color: C.purple, fontFamily: 'Nunito', fontWeight: 700, fontSize: 15, margin: '0 0 6px' } }, SHUTDOWN_STEPS[shutdownStep].title),
            React.createElement('p', { style: { color: C.text, fontFamily: 'Nunito Sans', fontSize: 13, lineHeight: 1.6, margin: 0 } }, SHUTDOWN_STEPS[shutdownStep].desc)
          ),
          shutdownStep < 4
            ? React.createElement('button', { onClick: () => setShutdownStep(s => s + 1), style: { ...btn(C.purple, { width: '100%', padding: 12 }) } }, 'Next →')
            : React.createElement('button', { onClick: () => setShutdownStep(0), style: { ...btn(C.muted, { width: '100%', padding: 12 }) } }, '↺ Start again')
        )
      ),

      toolRow("stim", "🌊", "Stim Space", C.pink, null,
        React.createElement('div', null,
          React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, margin: '0 0 14px', lineHeight: 1.6 } }, 'Visual and sensory stimming content. Opens in your browser.'),
          [
            { label: "Calm.com visuals", url: "https://calm.com", desc: "Gentle nature scenes and soundscapes" },
            { label: "Silk — interactive art", url: "http://weavesilk.com", desc: "Draw fluid, glowing silk patterns" },
            { label: "WebGL Fluid simulation", url: "https://paveldogreat.github.io/WebGL-Fluid-Simulation/", desc: "Swirl colours with your finger" },
          ].map((l, i) => React.createElement('a', { key: i, href: l.url, target: '_blank', rel: 'noopener noreferrer', style: { display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', padding: '10px 12px', marginBottom: 8, background: C.pink + '11', border: `1px solid ${C.pink}33`, borderRadius: 10 } },
            React.createElement('div', { style: { flex: 1 } },
              React.createElement('div', { style: { color: C.pink, fontFamily: 'Nunito', fontWeight: 700, fontSize: 14 } }, l.label),
              React.createElement('div', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 12, marginTop: 2 } }, l.desc)
            ),
            React.createElement('span', { style: { color: C.muted, fontSize: 14 } }, '↗')
          ))
        )
      ),

      toolRow("sounds", "🎵", "Focus Sounds", C.orange, null,
        React.createElement('div', null,
          React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, margin: '0 0 14px', lineHeight: 1.6 } }, 'Background sound to support focus, calm, or sleep. Opens in your browser.'),
          [
            { label: "Brown noise", url: "https://mynoise.net/NoiseMachines/brownNoiseGenerator.php", desc: "Warm, deep background noise" },
            { label: "Binaural beats", url: "https://mynoise.net/NoiseMachines/binauralBrainwaveGenerator.php", desc: "Brainwave entrainment tones" },
            { label: "Lo-fi hip hop radio", url: "https://lofi.cafe", desc: "Chill beats to study and relax to" },
          ].map((l, i) => React.createElement('a', { key: i, href: l.url, target: '_blank', rel: 'noopener noreferrer', style: { display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', padding: '10px 12px', marginBottom: 8, background: C.orange + '11', border: `1px solid ${C.orange}33`, borderRadius: 10 } },
            React.createElement('div', { style: { flex: 1 } },
              React.createElement('div', { style: { color: C.orange, fontFamily: 'Nunito', fontWeight: 700, fontSize: 14 } }, l.label),
              React.createElement('div', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 12, marginTop: 2 } }, l.desc)
            ),
            React.createElement('span', { style: { color: C.muted, fontSize: 14 } }, '↗')
          ))
        )
      ),

      toolRow("resources", "🔗", "Helpful Resources", C.blue, null,
        React.createElement('div', null,
          React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, margin: '0 0 14px', lineHeight: 1.6 } }, 'Trusted tools and organisations for neurodivergent people.'),
          RESOURCES.map((r, i) => React.createElement('div', { key: i, style: { marginBottom: 16 } },
            React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' } }, r.cat),
            r.items.map((item, j) => React.createElement('a', { key: j, href: item.url, target: '_blank', rel: 'noopener noreferrer', style: { display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', padding: '9px 12px', marginBottom: 6, background: C.blue + '0d', border: `1px solid ${C.border}`, borderRadius: 10 } },
              React.createElement('div', { style: { flex: 1 } },
                React.createElement('div', { style: { color: C.blue, fontFamily: 'Nunito', fontWeight: 700, fontSize: 14 } }, item.label),
                React.createElement('div', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 12, marginTop: 2 } }, item.desc)
              ),
              React.createElement('span', { style: { color: C.muted, fontSize: 14 } }, '↗')
            ))
          ))
        )
      )
    );
  }

  function renderDisclosure() {
    const SCRIPTS = [
      {
        id: "manager", title: "Telling your manager",
        script: "I'd like to share something that I think will help us work better together. I have [diagnosis], which affects how I process information and manage certain tasks. I'm not looking for sympathy — I just want to be upfront so we can set me up to do my best work. Some things that genuinely help me include [specific accommodations]. I'm happy to talk through this in more detail whenever works for you.",
        tips: ["Have specific accommodation requests ready before the conversation", "Frame it around work performance, not personal struggle", "You have legal rights — in the UK, reasonable adjustments are required under the Equality Act 2010"]
      },
      {
        id: "adhd_everyone", title: '"Everyone\'s a bit ADHD" response',
        script: "I appreciate the thought, but ADHD is a neurodevelopmental condition diagnosed through clinical assessment — it's not a personality trait everyone has a bit of. When someone says that, it can accidentally minimise what's actually quite a significant difference in how my brain works. I know you're not trying to do that — and now you know that framing can sting a bit.",
        tips: ["Saying this calmly is much more effective than defensively", "You don't have to explain the science fully — keep it brief", "It's okay to set this limit — you're educating someone, not attacking them"]
      },
      {
        id: "excuse", title: '"It\'s just an excuse" response',
        script: "I understand why it might look that way. I spent years thinking the same thing about myself. The difference between an excuse and an explanation is that an explanation points toward solutions — and that's what I'm trying to do. I want to do this well. I'm asking for what I need to do it well. I'd much rather we find a way forward than I continue struggling silently.",
        tips: ["Don't get defensive — stay grounded and matter-of-fact", "Name what you're trying to achieve (do this well) not what you're avoiding", "You don't owe anyone a detailed neurological justification"]
      },
      {
        id: "personal", title: "Telling a close friend or partner",
        script: "There's something I want to share with you that I've been sitting on for a while. I have [diagnosis]. I didn't tell you sooner because... honestly, I wasn't sure how to. What this means for me is [brief description]. It explains some things about how I behave that might have been confusing. I'm not asking you to change everything — I just wanted you to know, and to talk about it.",
        tips: ["Choose a calm moment — not in the middle of conflict", "It's okay to feel vulnerable — this is a vulnerable thing to share", "Give them time to ask questions without flooding them with information upfront"]
      },
    ];
    return React.createElement('div', null,
      React.createElement('h3', { style: { color: C.blue, fontFamily: 'Nunito', margin: '0 0 16px', fontSize: 18 } }, '💙 Disclosure Scripts'),
      SCRIPTS.map(sc => React.createElement('div', { key: sc.id, style: card({ marginBottom: 12 }) },
        React.createElement('button', { onClick: () => setDisclosureExpanded(e => ({ ...e, [sc.id]: !e[sc.id] })), style: { background: 'transparent', border: 'none', cursor: 'pointer', color: C.text, fontFamily: 'Nunito', fontWeight: 700, fontSize: 15, padding: 0, display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left' } },
          React.createElement('span', { style: { color: C.blue } }, disclosureExpanded[sc.id] ? '▼' : '▶'),
          sc.title
        ),
        disclosureExpanded[sc.id] && React.createElement('div', { style: { marginTop: 12 } },
          React.createElement('div', { style: { background: C.blue + '11', border: `1px solid ${C.blue}33`, borderRadius: 10, padding: 12, marginBottom: 10 } },
            React.createElement('p', { style: { color: C.text, fontFamily: 'Nunito Sans', fontSize: 13, lineHeight: 1.7, margin: 0 } }, sc.script)
          ),
          sc.tips.map((t, i) => React.createElement('div', { key: i, style: { display: 'flex', gap: 8, marginBottom: 6 } },
            React.createElement('span', { style: { color: C.blue } }, '•'),
            React.createElement('span', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 12, lineHeight: 1.5 } }, t)
          ))
        )
      )),

      React.createElement('div', { style: card({ marginTop: 8 }) },
        React.createElement('h4', { style: { color: C.blue, fontFamily: 'Nunito', margin: '0 0 12px' } }, '🤖 AI Script Generator'),
        React.createElement(AIComingBanner, { desc: "The AI script generator will create a personalised disclosure script based on your diagnosis, who you're telling, and the tone you want. It will also prepare you for common responses and remind you of your rights." }),
      ),

      React.createElement('div', { style: { textAlign: 'center', marginTop: 16, padding: '12px 0' } },
        React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito', fontSize: 13, fontStyle: 'italic' } }, '💜 You never have to explain yourself. Disclosure is always your choice.')
      )
    );
  }

  function renderSafetyPlan() {
    const sp = safetyPlan;
    const spField = (key, placeholder, multiline) => {
      const style = multiline
        ? { ...textareaStyle({ marginBottom: 8, height: 56 }) }
        : { ...input({ marginBottom: 8 }) };
      return multiline
        ? React.createElement('textarea', { value: sp[key], onChange: e => setSafetyPlan(p => ({ ...p, [key]: e.target.value })), placeholder, style })
        : React.createElement('input', { value: sp[key], onChange: e => setSafetyPlan(p => ({ ...p, [key]: e.target.value })), placeholder, style });
    };

    const Section = (icon, title, color, children) =>
      React.createElement('div', { style: { ...card({ marginBottom: 14, borderColor: color + '44' }) } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } },
          React.createElement('span', { style: { fontSize: 18 } }, icon),
          React.createElement('span', { style: { color, fontFamily: 'Nunito', fontWeight: 800, fontSize: 15 } }, title)
        ),
        ...children
      );

    // Emergency card view (when saved and not editing)
    if (safetyPlanSaved && !safetyPlanEditing) {
      const hasAnyWarning = sp.warningSign1 || sp.warningSign2 || sp.warningSign3;
      const hasAnyHelps = sp.helpsMe1 || sp.helpsMe2 || sp.helpsMe3;
      const hasAnyAvoid = sp.avoidsMe1 || sp.avoidsMe2;
      const hasContact = sp.contact1Name || sp.contact2Name;
      return React.createElement('div', null,
        // Header card
        React.createElement('div', { style: { background: gt(C.blue + '22', C.purple + '22'), border: `2px solid ${C.blue}44`, borderRadius: 18, padding: '18px 16px', marginBottom: 14, textAlign: 'center' } },
          React.createElement('div', { style: { fontSize: 36, marginBottom: 6 } }, '🛟'),
          React.createElement('h3', { style: { color: C.blue, fontFamily: 'Nunito', fontWeight: 900, fontSize: 20, margin: '0 0 6px' } }, 'Your Safety Plan'),
          React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, margin: 0, lineHeight: 1.5 } }, 'Written by you, for the moments when your brain needs reminding what helps.')
        ),

        hasAnyWarning && Section("⚠️", "I'm heading for overwhelm when...", C.yellow, [
          [sp.warningSign1, sp.warningSign2, sp.warningSign3].filter(Boolean).map((s, i) =>
            React.createElement('div', { key: i, style: { display: 'flex', gap: 10, marginBottom: 8 } },
              React.createElement('span', { style: { color: C.yellow, fontSize: 14, flexShrink: 0, marginTop: 2 } }, '◆'),
              React.createElement('span', { style: { color: C.text, fontFamily: 'Nunito Sans', fontSize: 14, lineHeight: 1.5 } }, s)
            )
          )
        ]),

        hasAnyHelps && Section("💚", "What helps me", C.green, [
          [sp.helpsMe1, sp.helpsMe2, sp.helpsMe3].filter(Boolean).map((s, i) =>
            React.createElement('div', { key: i, style: { display: 'flex', gap: 10, marginBottom: 8 } },
              React.createElement('span', { style: { color: C.green, fontSize: 14, flexShrink: 0, marginTop: 2 } }, '✦'),
              React.createElement('span', { style: { color: C.text, fontFamily: 'Nunito Sans', fontSize: 14, lineHeight: 1.5 } }, s)
            )
          )
        ]),

        hasAnyAvoid && Section("🚫", "What makes it worse — please don't", C.pink, [
          [sp.avoidsMe1, sp.avoidsMe2].filter(Boolean).map((s, i) =>
            React.createElement('div', { key: i, style: { display: 'flex', gap: 10, marginBottom: 8 } },
              React.createElement('span', { style: { color: C.pink, fontSize: 14, flexShrink: 0, marginTop: 2 } }, '✕'),
              React.createElement('span', { style: { color: C.text, fontFamily: 'Nunito Sans', fontSize: 14, lineHeight: 1.5 } }, s)
            )
          )
        ]),

        (sp.safePlace || sp.safeObject || sp.safePhrase) && Section("🧸", "What grounds me", C.teal, [
          sp.safePlace && React.createElement('div', { style: { display: 'flex', gap: 10, marginBottom: 8 } },
            React.createElement('span', { style: { color: C.muted, fontFamily: 'Nunito', fontSize: 12, fontWeight: 700, width: 70, flexShrink: 0, paddingTop: 2 } }, 'PLACE'),
            React.createElement('span', { style: { color: C.text, fontFamily: 'Nunito Sans', fontSize: 14 } }, sp.safePlace)
          ),
          sp.safeObject && React.createElement('div', { style: { display: 'flex', gap: 10, marginBottom: 8 } },
            React.createElement('span', { style: { color: C.muted, fontFamily: 'Nunito', fontSize: 12, fontWeight: 700, width: 70, flexShrink: 0, paddingTop: 2 } }, 'OBJECT'),
            React.createElement('span', { style: { color: C.text, fontFamily: 'Nunito Sans', fontSize: 14 } }, sp.safeObject)
          ),
          sp.safePhrase && React.createElement('div', { style: { background: C.teal + '11', border: `1px solid ${C.teal}33`, borderRadius: 10, padding: '10px 14px', marginTop: 4 } },
            React.createElement('p', { style: { color: C.teal, fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, margin: 0, lineHeight: 1.5, fontStyle: 'italic' } }, '"' + sp.safePhrase + '"')
          )
        ]),

        hasContact && Section("📞", "People I can contact", C.blue, [
          [{ name: sp.contact1Name, how: sp.contact1How }, { name: sp.contact2Name, how: sp.contact2How }]
            .filter(c => c.name)
            .map((c, i) => React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i === 0 ? `1px solid ${C.border}22` : 'none' } },
              React.createElement('div', { style: { width: 36, height: 36, borderRadius: '50%', background: C.blue + '22', border: `1.5px solid ${C.blue}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 } }, '👤'),
              React.createElement('div', null,
                React.createElement('div', { style: { color: C.text, fontFamily: 'Nunito', fontWeight: 700, fontSize: 14 } }, c.name),
                c.how && React.createElement('div', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 12 } }, c.how)
              )
            ))
        ]),

        React.createElement('button', {
          onClick: () => setSafetyPlanEditing(true),
          style: { ...btn(C.muted, { width: '100%', marginTop: 8 }) }
        }, '✏️ Edit my plan')
      );
    }

    // Edit / build view
    return React.createElement('div', null,
      // Full explanation block — always shown at top of edit view
      React.createElement('div', { style: { background: gt(C.purple + '18', C.blue + '12', 135), border: `1.5px solid ${C.purple}44`, borderRadius: 16, padding: '18px 16px', marginBottom: 18 } },
        React.createElement('div', { style: { fontSize: 32, marginBottom: 10 } }, '🛟'),
        React.createElement('h3', { style: { color: C.purple, fontFamily: 'Nunito', fontWeight: 900, fontSize: 18, margin: '0 0 10px' } }, 'What is a Safety Plan?'),
        React.createElement('p', { style: { color: C.text, fontFamily: 'Nunito Sans', fontSize: 14, margin: '0 0 10px', lineHeight: 1.7 } },
          'A Safety Plan is a document you write about yourself, for yourself — and for the people around you. It describes what happens when you approach overwhelm or meltdown, what actually helps, and what makes things worse.'
        ),
        React.createElement('p', { style: { color: C.text, fontFamily: 'Nunito Sans', fontSize: 14, margin: '0 0 10px', lineHeight: 1.7 } },
          'The most important thing: you fill it in when you\'re calm, so it\'s there when you\'re not. In a crisis, your brain can\'t access this information — but this page can.'
        ),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 } },
          [
            "You can share it with a partner, parent, or support worker",
            "It can be shown to professionals during a crisis",
            "It reminds you what works — because you already know",
            "It tells others how to help without making things worse",
          ].map((s, i) => React.createElement('div', { key: i, style: { display: 'flex', gap: 10, alignItems: 'flex-start' } },
            React.createElement('span', { style: { color: C.purple, fontSize: 13, flexShrink: 0, marginTop: 2 } }, '✦'),
            React.createElement('span', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, lineHeight: 1.5 } }, s)
          ))
        ),
        React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito', fontSize: 12, margin: 0, fontStyle: 'italic', lineHeight: 1.5 } },
          'Take your time. There are no right answers. Even one or two completed sections is more than most people have.'
        )
      ),

      Section("⚠️", "Warning signs — I\'m heading for overwhelm when...", C.yellow, [
        React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 12, margin: '0 0 8px' } }, 'What do you notice in your body, thoughts or behaviour before a meltdown?'),
        spField("warningSign1", "e.g. I go very quiet and stop responding"),
        spField("warningSign2", "e.g. Everything feels too loud or bright"),
        spField("warningSign3", "e.g. I start snapping at small things"),
      ]),

      Section("💚", "What helps me", C.green, [
        React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 12, margin: '0 0 8px' } }, 'What actually works for you — sensory, physical, environmental?'),
        spField("helpsMe1", "e.g. Being in a dark quiet room with a weighted blanket"),
        spField("helpsMe2", "e.g. Someone sitting nearby without talking"),
        spField("helpsMe3", "e.g. Cold water on my face and hands"),
      ]),

      Section("🚫", "What makes it worse — please don\'t", C.pink, [
        React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 12, margin: '0 0 8px' } }, 'What do people do that escalates things, even with good intentions?'),
        spField("avoidsMe1", "e.g. Talk to me or ask questions"),
        spField("avoidsMe2", "e.g. Touch me without asking first"),
      ]),

      Section("🧸", "What grounds me", C.teal, [
        React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 12, margin: '0 0 8px' } }, 'A safe place, a safe object, and a phrase that reminds you this will pass.'),
        spField("safePlace", "Safe place (e.g. my bedroom floor, the bathroom)"),
        spField("safeObject", "Safe object (e.g. my weighted blanket, my headphones)"),
        spField("safePhrase", "A phrase that helps (e.g. This is temporary. I am safe.)"),
      ]),

      Section("📞", "People I can contact", C.blue, [
        React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 12, margin: '0 0 8px' } }, 'Who can you reach out to, and how do they prefer to be contacted?'),
        React.createElement('div', { style: { display: 'flex', gap: 8, marginBottom: 8 } },
          spField("contact1Name", "Name"),
          spField("contact1How", "How (e.g. text only)")
        ),
        React.createElement('div', { style: { display: 'flex', gap: 8 } },
          spField("contact2Name", "Name"),
          spField("contact2How", "How (e.g. call me)")
        ),
      ]),

      React.createElement('button', {
        onClick: () => { setSafetyPlanSaved(true); setSafetyPlanEditing(false); awardPoints(20, "Safety plan saved. That took courage and self-knowledge. 🛟"); },
        style: { ...btn(C.blue, { width: '100%', padding: 14, fontSize: 15, marginTop: 4 }) }
      }, '💾 Save my safety plan')
    );
  }

  function renderComingSoon(feature) {
    return React.createElement('div', { style: { background: C.teal + '11', border: `1.5px solid ${C.teal}33`, borderRadius: 14, padding: '20px 16px', textAlign: 'center', margin: '12px 0' } },
      React.createElement('div', { style: { fontSize: 32, marginBottom: 8 } }, '🚀'),
      React.createElement('p', { style: { color: C.teal, fontFamily: 'Nunito', fontWeight: 800, fontSize: 16, margin: '0 0 6px' } }, 'Coming soon'),
      React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, margin: 0, lineHeight: 1.6 } }, `AI-powered ${feature} is coming in the next update of Steady. We're building it properly so it's secure and reliable for everyone.`)
    );
  }

  function AIComingBanner({ feature, desc }) {
    return React.createElement('div', { style: { background: `linear-gradient(135deg, ${C.teal}15, ${C.purple}10)`, border: `1.5px solid ${C.teal}44`, borderRadius: 16, padding: '18px 16px', marginBottom: 20 } },
      React.createElement('div', { style: { display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 } },
        React.createElement('div', { style: { fontSize: 28, flexShrink: 0 } }, '🤖'),
        React.createElement('div', null,
          React.createElement('p', { style: { color: C.teal, fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, margin: '0 0 4px' } }, 'AI feature — coming soon'),
          React.createElement('p', { style: { color: C.text, fontFamily: 'Nunito Sans', fontSize: 13, margin: 0, lineHeight: 1.6 } }, desc)
        )
      ),
      React.createElement('div', { style: { background: C.card, borderRadius: 10, padding: '10px 12px' } },
        React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' } }, 'Why the wait?'),
        React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 12, margin: 0, lineHeight: 1.6 } }, "We're building a secure backend so your conversations with the AI are private and protected. We don't want to rush it — this handles sensitive stuff and it needs to be done properly. Thank you for your patience 💙")
      )
    );
  }

  function renderAccount() {
    return React.createElement('div', { style: { padding: 16, maxWidth: 480, margin: '0 auto' } },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 } },
        React.createElement('button', { onClick: () => setAccountScreen(false), style: { background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 20, padding: '6px 14px', color: C.muted, cursor: 'pointer', fontFamily: 'Nunito', fontSize: 13 } }, '← Back'),
        React.createElement('h2', { style: { color: C.text, fontFamily: 'Nunito', fontWeight: 800, fontSize: 18, margin: 0 } }, 'Account')
      ),

      // User info
      React.createElement('div', { style: { ...card({ marginBottom: 16 }) } },
        React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' } }, 'Signed in as'),
        React.createElement('p', { style: { color: C.text, fontFamily: 'Nunito', fontWeight: 700, fontSize: 15, margin: 0 } }, user?.email)
      ),

      // Change password
      React.createElement('div', { style: { ...card({ marginBottom: 16 }) } },
        React.createElement('p', { style: { color: C.teal, fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, margin: '0 0 14px' } }, '🔑 Change password'),
        React.createElement('input', { type: 'password', placeholder: 'New password', value: changePwNew, onChange: e => setChangePwNew(e.target.value), style: { ...input({ marginBottom: 10 }) } }),
        changePwMsg && React.createElement('p', { style: { color: changePwMsg.ok ? C.teal : C.pink, fontFamily: 'Nunito Sans', fontSize: 13, margin: '0 0 10px' } }, changePwMsg.text),
        React.createElement('button', {
          onClick: async () => {
            if (!changePwNew || changePwNew.length < 6) { setChangePwMsg({ ok: false, text: 'Password must be at least 6 characters' }); return; }
            const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, { method: 'PUT', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ password: changePwNew }) });
            if (res.ok) { setChangePwMsg({ ok: true, text: 'Password updated ✓' }); setChangePwNew(""); }
            else { setChangePwMsg({ ok: false, text: 'Could not update password — please try again' }); }
          },
          style: { ...btn(C.teal, { width: '100%' }) }
        }, 'Update password')
      ),

      // Privacy policy link
      React.createElement('div', { style: { ...card({ marginBottom: 16 }) } },
        React.createElement('p', { style: { color: C.blue, fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, margin: '0 0 8px' } }, '📋 Privacy & data'),
        React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, margin: '0 0 12px', lineHeight: 1.5 } }, 'Your data is stored securely in Supabase (EU servers). We never sell or share your data.'),
        React.createElement('button', { onClick: () => { setAccountScreen('privacy'); }, style: { ...btn(C.blue, { width: '100%' }) } }, 'Read our Privacy Policy')
      ),

      // Feedback
      React.createElement('div', { style: { ...card({ marginBottom: 16 }) } },
        React.createElement('p', { style: { color: C.purple, fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, margin: '0 0 8px' } }, '💬 Feedback'),
        React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, margin: '0 0 12px' } }, 'Steady is in beta. We\'d love to hear what you think.'),
        React.createElement('a', { href: 'mailto:hello@wiredandwell.co.uk', style: { ...btn(C.purple, { width: '100%', display: 'block', textAlign: 'center', textDecoration: 'none' }) } }, 'Send feedback →')
      ),

      // Sign out
      React.createElement('button', { onClick: handleSignOut, style: { ...btn(C.muted, { width: '100%', marginBottom: 16 }) } }, '→ Sign out'),

      // Delete account
      !deleteConfirm
        ? React.createElement('button', { onClick: () => setDeleteConfirm(true), style: { background: 'transparent', border: `1px solid ${C.pink}44`, borderRadius: 12, padding: '10px', width: '100%', color: C.pink, fontFamily: 'Nunito', fontSize: 13, cursor: 'pointer' } }, 'Delete my account')
        : React.createElement('div', { style: { background: C.pink + '11', border: `1.5px solid ${C.pink}`, borderRadius: 14, padding: 16 } },
            React.createElement('p', { style: { color: C.pink, fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, margin: '0 0 8px' } }, 'Are you sure?'),
            React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, margin: '0 0 14px', lineHeight: 1.5 } }, 'This will permanently delete your account and all your data. This cannot be undone.'),
            React.createElement('div', { style: { display: 'flex', gap: 8 } },
              React.createElement('button', { onClick: () => setDeleteConfirm(false), style: { ...btn(C.muted, { flex: 1 }) } }, 'Cancel'),
              React.createElement('button', {
                onClick: async () => {
                  await fetch(`${SUPABASE_URL}/auth/v1/user`, { method: 'DELETE', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${authToken}` } });
                  handleSignOut();
                },
                style: { ...btn(C.pink, { flex: 1 }) }
              }, 'Yes, delete')
            )
          ),

      React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 11, textAlign: 'center', margin: '20px 0 0', lineHeight: 1.5 } }, 'Steady · Wired & Well Ltd · v1.0 beta')
    );
  }

  function renderPrivacy() {
    const section = (title, body) => React.createElement('div', { style: { marginBottom: 18 } },
      React.createElement('p', { style: { color: C.teal, fontFamily: 'Nunito', fontWeight: 800, fontSize: 14, margin: '0 0 6px' } }, title),
      React.createElement('p', { style: { color: C.text, fontFamily: 'Nunito Sans', fontSize: 13, margin: 0, lineHeight: 1.7 } }, body)
    );
    return React.createElement('div', { style: { padding: 16, maxWidth: 480, margin: '0 auto' } },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 } },
        React.createElement('button', { onClick: () => setAccountScreen('account'), style: { background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 20, padding: '6px 14px', color: C.muted, cursor: 'pointer', fontFamily: 'Nunito', fontSize: 13 } }, '← Back'),
        React.createElement('h2', { style: { color: C.text, fontFamily: 'Nunito', fontWeight: 800, fontSize: 18, margin: 0 } }, 'Privacy Policy')
      ),
      React.createElement('div', { style: card() },
        React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 12, margin: '0 0 20px' } }, 'Last updated: June 2026 · Wired & Well Ltd'),
        section("Who we are", "Steady is a product of Wired & Well Ltd. We build tools to support neurodivergent people. If you have questions about this policy, contact us at hello@wiredandwell.co.uk."),
        section("What data we collect", "We collect your email address when you create an account. We store the data you enter into the app — including tasks, habits, mood check-ins, sensory ratings, and your safety plan. We do not collect any data you do not actively enter."),
        section("How we use your data", "Your data is used solely to power your personal experience in Steady. We do not analyse, sell, share, or use your data for advertising. Your safety plan and mood data are private to you."),
        section("Where your data is stored", "Your data is stored securely on Supabase servers located in the EU (Ireland). Supabase is GDPR compliant. Data is encrypted at rest and in transit."),
        section("Who can see your data", "Only you can see your data. We use Row Level Security — meaning the database enforces that your data is only accessible with your account credentials. Wired & Well staff do not routinely access user data."),
        section("AI features", "When AI features are enabled, the text you submit is sent to Anthropic's Claude API to generate a response. Anthropic's privacy policy applies to this data. We do not store the content of AI interactions beyond your session."),
        section("Your rights", "You have the right to access, export, or delete your data at any time. You can delete your account from the Account screen — this permanently removes all your data. For data requests, contact hello@wiredandwell.co.uk."),
        section("Cookies and tracking", "We do not use advertising cookies or third-party tracking. We may use anonymous analytics to understand how the app is used, but this data is never linked to your identity."),
        section("Children", "Steady is intended for users aged 13 and over. If you are under 18, please ensure a parent or guardian has reviewed this policy."),
        section("Changes to this policy", "We will notify users of significant changes to this policy by email or in-app notice. Continued use of the app after changes constitutes acceptance of the updated policy."),
        React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 12, marginTop: 20, lineHeight: 1.5 } }, 'Questions? Email hello@wiredandwell.co.uk')
      )
    );
  }

  function renderTab(tabId) {
    const map = {
      rsd: renderRSD,
      translate: renderTranslate,
      decode: renderDecode,
      pda: renderPDA,
      tasks: renderTasks,
      braindump: renderBrainDump,
      habits: renderHabits,
      mood: renderMood,
      sensory: renderSensory,
      dopamine: renderDopamine,
      toolkit: renderToolkit,
      disclosure: renderDisclosure,
      safetyplan: renderSafetyPlan,
    };
    return map[tabId] ? map[tabId]() : null;
  }

  // ── Main App render ────────────────────────────────────────────────────────
  const currentSection = section ? SECTIONS[section] : null;
  const currentSectionTabs = currentSection ? currentSection.tabs : [];

  // Show account or privacy screen
  if (accountScreen === 'account') return React.createElement('div', { style: { background: C.bg, minHeight: '100vh' } }, renderAccount());
  if (accountScreen === 'privacy') return React.createElement('div', { style: { background: C.bg, minHeight: '100vh' } }, renderPrivacy());

  // Show loading while checking session
  if (!authChecked) return React.createElement('div', { style: { background: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
    React.createElement('p', { style: { color: '#666', fontFamily: 'Nunito', fontSize: 16 } }, 'Loading...')
  );

  // Show login/signup if not authenticated
  if (!user) return React.createElement('div', { style: { background: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 } },
    React.createElement('div', { style: { width: '100%', maxWidth: 380 } },
      React.createElement('div', { style: { textAlign: 'center', marginBottom: 32 } },
        React.createElement('h1', { style: { fontFamily: 'Nunito', fontWeight: 900, fontSize: 28, background: 'linear-gradient(135deg, #00e5cc, #ff6b9d, #6c8eff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: '0 0 8px' } }, 'Steady'),
        React.createElement('p', { style: { color: '#666', fontFamily: 'Nunito Sans', fontSize: 14 } }, 'Your neurodivergent support system')
      ),
      React.createElement('div', { style: { background: '#111118', border: '1.5px solid #1a1a2a', borderRadius: 20, padding: 28 } },
        React.createElement('div', { style: { display: 'flex', gap: 8, marginBottom: 24 } },
          ['login', 'signup'].map(s => React.createElement('button', {
            key: s, onClick: () => { setAuthScreen(s); setAuthError(null); },
            style: { flex: 1, background: authScreen === s ? '#00e5cc22' : 'transparent', border: `1.5px solid ${authScreen === s ? '#00e5cc' : '#1a1a2a'}`, borderRadius: 12, padding: '10px', color: authScreen === s ? '#00e5cc' : '#666', fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, cursor: 'pointer' }
          }, s === 'login' ? 'Log in' : 'Sign up'))
        ),
        React.createElement('input', { type: 'email', placeholder: 'Email address', value: authEmail, onChange: e => setAuthEmail(e.target.value), style: { width: '100%', background: '#0a0a0f', border: '1.5px solid #1a1a2a', borderRadius: 12, padding: '12px 16px', color: '#fff', fontFamily: 'Nunito', fontSize: 14, marginBottom: 12, outline: 'none' } }),
        React.createElement('input', { type: 'password', placeholder: 'Password', value: authPassword, onChange: e => setAuthPassword(e.target.value), onKeyDown: e => e.key === 'Enter' && (authScreen === 'login' ? handleLogin() : handleSignUp()), style: { width: '100%', background: '#0a0a0f', border: '1.5px solid #1a1a2a', borderRadius: 12, padding: '12px 16px', color: '#fff', fontFamily: 'Nunito', fontSize: 14, marginBottom: 16, outline: 'none' } }),
        authError && React.createElement('p', { style: { color: '#ff6b9d', fontFamily: 'Nunito Sans', fontSize: 13, marginBottom: 12, lineHeight: 1.4 } }, authError),
        React.createElement('button', {
          onClick: authScreen === 'login' ? handleLogin : handleSignUp,
          disabled: authLoading || !authEmail || !authPassword,
          style: { width: '100%', background: authLoading ? '#1a1a2a' : 'linear-gradient(135deg, #00e5cc, #6c8eff)', border: 'none', borderRadius: 12, padding: 14, color: authLoading ? '#666' : '#000', fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, cursor: authLoading ? 'not-allowed' : 'pointer' }
        }, authLoading ? 'Please wait...' : authScreen === 'login' ? 'Log in →' : 'Create account →'),
        authScreen === 'signup' && React.createElement('p', { style: { color: '#444', fontFamily: 'Nunito Sans', fontSize: 11, textAlign: 'center', marginTop: 12, lineHeight: 1.5 } }, 'By signing up you agree to our terms. Your data is stored securely and never shared.')
      )
    )
  );

  return React.createElement('div', {
    style: { minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'Nunito Sans, sans-serif', position: 'relative', overflow: 'hidden' }
  },
    // Fonts
    React.createElement('style', null, `
      @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Nunito+Sans:wght@400;500;600;700&display=swap');
      @keyframes shimmer { 0%{background-position:0% 50%;} 50%{background-position:100% 50%;} 100%{background-position:0% 50%;} }
      @keyframes floatWord { 0%{opacity:0;transform:translateY(0);} 20%{opacity:0.12;} 80%{opacity:0.06;} 100%{opacity:0;transform:translateY(-80px);} }
      @keyframes blobFloat { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(15px,-15px) scale(1.08);} }
      @keyframes toastIn { from{transform:translateX(-50%) translateY(-20px);opacity:0;} to{transform:translateX(-50%) translateY(0);opacity:1;} }
      @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
      @keyframes confetti { 0%{transform:translateY(0) rotate(0deg);opacity:1;} 100%{transform:translateY(120px) rotate(720deg);opacity:0;} }
      @keyframes tierPop { 0%{transform:translateX(-50%) translateY(-50%) scale(0.5);opacity:0;} 60%{transform:translateX(-50%) translateY(-50%) scale(1.08);opacity:1;} 100%{transform:translateX(-50%) translateY(-50%) scale(1);opacity:1;} }
      * { box-sizing: border-box; }
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
    `),

    // Background blobs
    React.createElement('div', { style: { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 } },
      React.createElement('div', { style: { position: 'absolute', top: '5%', left: '0%', width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, ${C.b1}, transparent 70%)`, animation: 'blobFloat 10s ease-in-out infinite' } }),
      React.createElement('div', { style: { position: 'absolute', bottom: '10%', right: '0%', width: 350, height: 350, borderRadius: '50%', background: `radial-gradient(circle, ${C.b2}, transparent 70%)`, animation: 'blobFloat 12s ease-in-out 3s infinite' } }),
      React.createElement('div', { style: { position: 'absolute', top: '50%', right: '20%', width: 250, height: 250, borderRadius: '50%', background: `radial-gradient(circle, ${C.b3}, transparent 70%)`, animation: 'blobFloat 14s ease-in-out 6s infinite' } })
    ),

    // Floating ND words — removed to keep text readable

    // Toast notification
    toast && React.createElement('div', { style: { position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', background: C.teal, color: '#000', padding: '10px 20px', borderRadius: 20, fontFamily: 'Nunito', fontWeight: 700, fontSize: 13, zIndex: 9999, animation: 'toastIn 0.3s ease', whiteSpace: 'nowrap', maxWidth: '90vw', boxShadow: `0 0 30px ${C.teal}66` } }, toast),

    // Tier-up celebration modal
    tierUpModal && React.createElement('div', {
      onClick: () => setTierUpModal(null),
      style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }
    },
      // Confetti dots
      [...Array(24)].map((_, i) => React.createElement('div', { key: i, style: {
        position: 'absolute',
        left: `${5 + (i * 23 + 11) % 90}%`,
        top: `${5 + (i * 17 + 7) % 40}%`,
        width: 8 + (i % 4) * 4, height: 8 + (i % 3) * 4,
        borderRadius: i % 3 === 0 ? '50%' : 3,
        background: [C.teal, C.pink, C.yellow, C.blue, C.purple, C.orange][i % 6],
        animation: `confetti ${1.2 + (i % 4) * 0.3}s ease-out ${i * 0.05}s forwards`,
        pointerEvents: 'none',
      } })),
      React.createElement('div', {
        onClick: e => e.stopPropagation(),
        style: {
          position: 'relative', background: C.card, borderRadius: 28,
          padding: '40px 32px', textAlign: 'center', maxWidth: 320, width: '90vw',
          border: `2px solid ${C.teal}`,
          boxShadow: `0 0 60px ${C.teal}44`,
          animation: 'tierPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
          transform: 'translateX(-50%) translateY(-50%)',
        }
      },
        React.createElement('div', { style: { fontSize: 72, marginBottom: 8, lineHeight: 1 } }, tierUpModal.icon),
        React.createElement('h2', { style: { color: C.teal, fontFamily: 'Nunito', fontWeight: 900, fontSize: 26, margin: '0 0 8px' } }, 'Level up!'),
        React.createElement('p', { style: { color: C.text, fontFamily: 'Nunito', fontWeight: 700, fontSize: 20, margin: '0 0 12px' } }, tierUpModal.name),
        React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 } }, tierUpModal.min === 50 ? 'You\'re using your tools. That\'s not nothing — that\'s everything.' : tierUpModal.min === 150 ? 'You\'re building real momentum. Your brain is working with you now.' : tierUpModal.min === 300 ? 'You\'re unstoppable. Look how far you\'ve come.' : tierUpModal.min === 500 ? 'You\'re a legend. Genuinely. This takes so much.' : 'Brain OS Master. You\'ve shown up for yourself, again and again. 💜'),
        React.createElement('button', {
          onClick: () => setTierUpModal(null),
          style: { ...btn(C.teal, { width: '100%', padding: 14, fontSize: 16 }) }
        }, '🎉 Let\'s keep going')
      )
    ),

    // Main content
    React.createElement('div', { style: { position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', paddingBottom: 80 } },

      // ── HEADER ─────────────────────────────────────────────────────────────
      React.createElement('div', { style: { padding: '14px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
        React.createElement('h1', { style: { fontFamily: 'Nunito', fontWeight: 900, fontSize: 20, margin: 0, background: `linear-gradient(135deg, ${C.teal}, ${C.pink}, ${C.blue})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' } }, 'Steady'),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 } },
            React.createElement('button', { onClick: () => setThemePanelOpen(o => !o), style: { width: 22, height: 22, borderRadius: '50%', border: `1.5px solid ${C.border}`, background: `conic-gradient(${C.teal} 0deg 90deg, ${C.pink} 90deg 180deg, ${C.yellow} 180deg 270deg, ${C.blue} 270deg 360deg)`, cursor: 'pointer', padding: 0, boxShadow: themePanelOpen ? `0 0 0 2px ${C.teal}` : 'none' } }),
            React.createElement('span', { style: { color: C.muted, fontFamily: 'Nunito', fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 } }, 'Theme')
          ),
          React.createElement('button', { onClick: () => setAccountScreen('account'), style: { background: 'transparent', border: `1.5px solid ${C.border}`, borderRadius: 20, padding: '5px 10px', color: C.muted, cursor: 'pointer', fontFamily: 'Nunito', fontSize: 12, fontWeight: 600 } }, '👤 Account')
        )
      ),

      // Theme panel
      themePanelOpen && React.createElement('div', { style: { padding: '0 16px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' } },
        Object.values(THEMES).map(t => React.createElement('button', { key: t.id, onClick: () => { setThemeId(t.id); setThemePanelOpen(false); }, style: { background: themeId === t.id ? C.teal + '22' : C.card, border: `1.5px solid ${themeId === t.id ? C.teal : C.border}`, borderRadius: 20, padding: '5px 12px', cursor: 'pointer', color: themeId === t.id ? C.teal : C.muted, fontFamily: 'Nunito', fontWeight: themeId === t.id ? 700 : 400, fontSize: 12 } }, t.label))
      ),

      // ── TAB CONTENT ────────────────────────────────────────────────────────
      React.createElement('div', { style: { padding: '0 16px' } },

        // ── CHECK IN ─────────────────────────────────────────────────────────
        bottomNav === 'checkin' && React.createElement('div', null,
          React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito', fontSize: 12, margin: '0 0 6px' } }, '💡 ' + TIPS[tipIdx]),
          // Wizard as check-in
          !needsWizard && !wizardAnswer && React.createElement('div', { style: { background: gt(C.teal + '22', C.pink + '18', 135), border: `2px solid ${C.teal}55`, borderRadius: 20, padding: '20px', marginBottom: 16 } },
            React.createElement('p', { style: { color: C.teal, fontFamily: 'Nunito', fontWeight: 900, fontSize: 20, margin: '0 0 6px' } }, 'How are you right now?'),
            React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, margin: '0 0 16px' } }, 'Tap how you\'re feeling and we\'ll take you straight to the right tool'),
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
              WIZARD_STEPS[0].options.map(o => React.createElement('button', {
                key: o.next, onClick: () => setWizardAnswer(o.next),
                style: { display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: '16px', cursor: 'pointer', fontFamily: 'Nunito', fontWeight: 700, fontSize: 16, color: C.text, transition: 'all 0.15s' }
              }, o.label))
            )
          ),
          wizardAnswer && React.createElement('div', { style: { ...card({ marginBottom: 16, borderColor: C.teal + '55', background: gt(C.teal + '12', C.pink + '08', 135) }) } },
            React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito', fontSize: 12, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 1 } }, '✦ We think you need'),
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 } },
              React.createElement('div', { style: { fontSize: 40 } }, WIZARD_ROUTES[wizardAnswer].icon),
              React.createElement('div', null,
                React.createElement('div', { style: { color: C.teal, fontFamily: 'Nunito', fontWeight: 900, fontSize: 18, marginBottom: 4 } }, WIZARD_ROUTES[wizardAnswer].label),
                React.createElement('div', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, lineHeight: 1.5 } }, WIZARD_ROUTES[wizardAnswer].desc)
              )
            ),
            React.createElement('div', { style: { display: 'flex', gap: 8 } },
              React.createElement('button', {
                onClick: () => {
                  const r = WIZARD_ROUTES[wizardAnswer];
                  navigateTo(r.section, r.tab);
                  if (r.openTool) setOpenTool(r.openTool);
                  setWizardAnswer(null);
                  setBottomNav(r.section === 'regulate' ? 'helpme' : r.section === 'mybrain' ? 'mystuff' : r.section === 'communication' ? 'people' : 'helpme');
                },
                style: { ...btn(C.teal, { flex: 1, padding: 14, fontSize: 15 }) }
              }, 'Take me there →'),
              React.createElement('button', { onClick: () => setWizardAnswer(null), style: { ...btn(C.muted, { padding: '14px 16px' }) } }, '← Back')
            )
          ),
          // Mood + sensory quick access
          !wizardAnswer && React.createElement('div', null,
            React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, margin: '16px 0 10px' } }, 'Or jump straight to'),
            React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } },
              [
                { icon: '🌡️', label: 'Mood check-in', section: 'regulate', tab: 'mood', color: C.yellow },
                { icon: '👁️', label: 'Sensory check', section: 'regulate', tab: 'sensory', color: C.blue },
                { icon: '🔁', label: 'Life stuff', section: 'mybrain', tab: 'habits', color: C.teal },
                { icon: '🛟', label: 'Safety plan', section: 'safetyplan', tab: 'safetyplan', color: C.purple },
              ].map(item => React.createElement('button', {
                key: item.tab, onClick: () => { navigateTo(item.section, item.tab); setBottomNav(item.section === 'regulate' ? 'helpme' : item.section === 'mybrain' ? 'mystuff' : item.section === 'communication' ? 'people' : 'more'); },
                style: { display: 'flex', alignItems: 'center', gap: 10, background: item.color + '0e', border: `1.5px solid ${item.color}33`, borderRadius: 14, padding: '14px', cursor: 'pointer', textAlign: 'left' }
              },
                React.createElement('span', { style: { fontSize: 22 } }, item.icon),
                React.createElement('span', { style: { color: item.color, fontFamily: 'Nunito', fontWeight: 700, fontSize: 13 } }, item.label)
              ))
            )
          )
        ),

        // ── HELP ME (Regulate) ────────────────────────────────────────────────
        bottomNav === 'helpme' && React.createElement('div', null,
          activeTab && section === 'regulate'
            ? React.createElement('div', null,
                React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 } },
                  React.createElement('button', { onClick: () => { setActiveTab(null); setSection(null); }, style: { background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 20, padding: '6px 14px', color: C.muted, cursor: 'pointer', fontFamily: 'Nunito', fontSize: 13 } }, '← Back'),
                  React.createElement('h3', { style: { color: C.yellow, fontFamily: 'Nunito', fontWeight: 800, fontSize: 16, margin: 0 } }, SECTIONS.regulate.tabs.find(t => t.id === activeTab)?.icon + ' ' + SECTIONS.regulate.tabs.find(t => t.id === activeTab)?.name)
                ),
                renderTab(activeTab)
              )
            : React.createElement('div', null,
                React.createElement('h2', { style: { color: C.yellow, fontFamily: 'Nunito', fontWeight: 900, fontSize: 22, margin: '0 0 4px' } }, '⚡ Help me'),
                React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, margin: '0 0 20px' } }, 'Tools to calm your body and mind'),
                SECTIONS.regulate.tabs.map(tab => React.createElement('button', {
                  key: tab.id, onClick: () => navigateTo('regulate', tab.id),
                  style: { display: 'flex', alignItems: 'center', gap: 16, width: '100%', background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 18, padding: '18px', marginBottom: 10, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }
                },
                  React.createElement('div', { style: { width: 50, height: 50, borderRadius: 14, background: C.yellow + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 } }, tab.icon),
                  React.createElement('div', null,
                    React.createElement('div', { style: { color: C.text, fontFamily: 'Nunito', fontWeight: 800, fontSize: 16, marginBottom: 4 } }, tab.name),
                    React.createElement('div', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, lineHeight: 1.4 } }, tab.desc)
                  )
                ))
              )
        ),

        // ── MY STUFF (My Brain) ───────────────────────────────────────────────
        bottomNav === 'mystuff' && React.createElement('div', null,
          activeTab && section === 'mybrain'
            ? React.createElement('div', null,
                React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 } },
                  React.createElement('button', { onClick: () => { setActiveTab(null); setSection(null); }, style: { background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 20, padding: '6px 14px', color: C.muted, cursor: 'pointer', fontFamily: 'Nunito', fontSize: 13 } }, '← Back'),
                  React.createElement('h3', { style: { color: C.teal, fontFamily: 'Nunito', fontWeight: 800, fontSize: 16, margin: 0 } }, SECTIONS.mybrain.tabs.find(t => t.id === activeTab)?.icon + ' ' + SECTIONS.mybrain.tabs.find(t => t.id === activeTab)?.name)
                ),
                renderTab(activeTab)
              )
            : React.createElement('div', null,
                React.createElement('h2', { style: { color: C.teal, fontFamily: 'Nunito', fontWeight: 900, fontSize: 22, margin: '0 0 4px' } }, '🧠 My stuff'),
                React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, margin: '0 0 20px' } }, 'Tasks, thoughts and life stuff'),
                SECTIONS.mybrain.tabs.map(tab => React.createElement('button', {
                  key: tab.id, onClick: () => navigateTo('mybrain', tab.id),
                  style: { display: 'flex', alignItems: 'center', gap: 16, width: '100%', background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 18, padding: '18px', marginBottom: 10, cursor: 'pointer', textAlign: 'left' }
                },
                  React.createElement('div', { style: { width: 50, height: 50, borderRadius: 14, background: C.teal + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 } }, tab.icon),
                  React.createElement('div', null,
                    React.createElement('div', { style: { color: C.text, fontFamily: 'Nunito', fontWeight: 800, fontSize: 16, marginBottom: 4 } }, tab.name),
                    React.createElement('div', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, lineHeight: 1.4 } }, tab.desc)
                  )
                ))
              )
        ),

        // ── PEOPLE (Communication) ────────────────────────────────────────────
        bottomNav === 'people' && React.createElement('div', null,
          activeTab && section === 'communication'
            ? React.createElement('div', null,
                React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 } },
                  React.createElement('button', { onClick: () => { setActiveTab(null); setSection(null); }, style: { background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 20, padding: '6px 14px', color: C.muted, cursor: 'pointer', fontFamily: 'Nunito', fontSize: 13 } }, '← Back'),
                  React.createElement('h3', { style: { color: C.pink, fontFamily: 'Nunito', fontWeight: 800, fontSize: 16, margin: 0 } }, SECTIONS.communication.tabs.find(t => t.id === activeTab)?.icon + ' ' + SECTIONS.communication.tabs.find(t => t.id === activeTab)?.name)
                ),
                renderTab(activeTab)
              )
            : React.createElement('div', null,
                React.createElement('h2', { style: { color: C.pink, fontFamily: 'Nunito', fontWeight: 900, fontSize: 22, margin: '0 0 4px' } }, '💬 People'),
                React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, margin: '0 0 20px' } }, 'When people are hard, or you\'re hard to understand'),
                SECTIONS.communication.tabs.map(tab => React.createElement('button', {
                  key: tab.id, onClick: () => navigateTo('communication', tab.id),
                  style: { display: 'flex', alignItems: 'center', gap: 16, width: '100%', background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 18, padding: '18px', marginBottom: 10, cursor: 'pointer', textAlign: 'left' }
                },
                  React.createElement('div', { style: { width: 50, height: 50, borderRadius: 14, background: C.pink + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 } }, tab.icon),
                  React.createElement('div', null,
                    React.createElement('div', { style: { color: C.text, fontFamily: 'Nunito', fontWeight: 800, fontSize: 16, marginBottom: 4 } }, tab.name),
                    React.createElement('div', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, lineHeight: 1.4 } }, tab.desc)
                  )
                ))
              )
        ),

        // ── MORE ──────────────────────────────────────────────────────────────
        bottomNav === 'more' && React.createElement('div', null,
          activeTab && (section === 'aboutme' || section === 'safetyplan')
            ? React.createElement('div', null,
                React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 } },
                  React.createElement('button', { onClick: () => { setActiveTab(null); setSection(null); }, style: { background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 20, padding: '6px 14px', color: C.muted, cursor: 'pointer', fontFamily: 'Nunito', fontSize: 13 } }, '← Back'),
                ),
                renderTab(activeTab)
              )
            : React.createElement('div', null,
                React.createElement('h2', { style: { color: C.purple, fontFamily: 'Nunito', fontWeight: 900, fontSize: 22, margin: '0 0 4px' } }, '☰ More'),
                React.createElement('p', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, margin: '0 0 20px' } }, 'Safety plan, about me, and games'),
                [
                  { icon: '🛟', label: 'Safety Plan', desc: 'Your personal crisis plan — written when you\'re calm', section: 'safetyplan', tab: 'safetyplan', color: C.purple },
                  { icon: '💙', label: 'About Me', desc: 'Scripts to explain yourself to others', section: 'aboutme', tab: 'disclosure', color: C.blue },
                  { icon: '🎮', label: 'Games', desc: 'Snake, Block Drop, Nonogram — dopamine the fun way', section: 'regulate', tab: 'dopamine', color: C.pink },
                ].map(item => React.createElement('button', {
                  key: item.tab, onClick: () => { navigateTo(item.section, item.tab); if (item.section === 'regulate') setBottomNav('helpme'); },
                  style: { display: 'flex', alignItems: 'center', gap: 16, width: '100%', background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 18, padding: '18px', marginBottom: 10, cursor: 'pointer', textAlign: 'left' }
                },
                  React.createElement('div', { style: { width: 50, height: 50, borderRadius: 14, background: item.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 } }, item.icon),
                  React.createElement('div', null,
                    React.createElement('div', { style: { color: C.text, fontFamily: 'Nunito', fontWeight: 800, fontSize: 16, marginBottom: 4 } }, item.label),
                    React.createElement('div', { style: { color: C.muted, fontFamily: 'Nunito Sans', fontSize: 13, lineHeight: 1.4 } }, item.desc)
                  )
                ))
              )
        )
      ),

      // ── BOTTOM NAV BAR ──────────────────────────────────────────────────────
      React.createElement('div', { style: { position: 'fixed', bottom: 0, left: 0, right: 0, background: C.bg, borderTop: `1px solid ${C.border}`, display: 'flex', zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom, 0px)', maxWidth: 480, margin: '0 auto' } },
        [
          { id: 'checkin', icon: '✨', label: 'Check In' },
          { id: 'helpme', icon: '⚡', label: 'Help Me' },
          { id: 'mystuff', icon: '🧠', label: 'My Stuff' },
          { id: 'people', icon: '💬', label: 'People' },
          { id: 'more', icon: '☰', label: 'More' },
        ].map(tab => React.createElement('button', {
          key: tab.id,
          onClick: () => { setBottomNav(tab.id); setActiveTab(null); setSection(null); },
          style: {
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '10px 0 12px', background: 'transparent', border: 'none', cursor: 'pointer',
            borderTop: `2px solid ${bottomNav === tab.id ? C.teal : 'transparent'}`,
            transition: 'all 0.15s',
          }
        },
          React.createElement('span', { style: { fontSize: 20, marginBottom: 3 } }, tab.icon),
          React.createElement('span', { style: { color: bottomNav === tab.id ? C.teal : C.muted, fontFamily: 'Nunito', fontWeight: bottomNav === tab.id ? 700 : 400, fontSize: 10 } }, tab.label)
        ))
      )
    )
  );
}


ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
