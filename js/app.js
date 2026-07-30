(function(){
'use strict';

const APP_VERSION = '20260730f';

// 自愈：版本号变了就清缓存 + 注销 SW + 强制刷新
(function(){
  const prev = localStorage.getItem('shedo_ver');
  if(prev !== APP_VERSION){
    localStorage.setItem('shedo_ver', APP_VERSION);
    if('caches' in window){
      caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k))))
        .then(()=>{
          if('serviceWorker' in navigator){
            navigator.serviceWorker.getRegistrations().then(regs=>{
              regs.forEach(r=>r.unregister());
            });
          }
          setTimeout(()=>location.reload(true), 300);
        });
    }
  }
})();

const STORAGE_KEY = 'wb_state_v2';

/* ===== 训练动作库 ===== */
const EXERCISE_LIBRARY = {
  back: [
    {name:'弹力带划船',detail:'弹力带固定于脚下或前方，身体前倾，拉至腹部，夹紧肩胛骨。3组×15次。',tags:['弹力带','膝盖友好','入门'],level:'beginner',video:'闫帅奇 弹力带背部训练',svg:`<svg viewBox='0 0 120 100'><circle cx='60' cy='30' r='12' fill='none' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='42' x2='60' y2='65' stroke='#4a9e6b' stroke-width='3'/><line x1='60' y1='50' x2='40' y2='55' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='50' x2='80' y2='55' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='65' x2='50' y2='90' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='65' x2='70' y2='90' stroke='#4a9e6b' stroke-width='2.5'/><line x1='80' y1='55' x2='90' y2='40' stroke='#6ecf8e' stroke-width='1.5' stroke-dasharray='4'/><path d='M88 42 L95 36' stroke='#6ecf8e' stroke-width='2' stroke-linecap='round'/><text x='98' y='38' font-size='9' fill='#6ecf8e'>→</text></svg>`},
    {name:'超人式',detail:'俯卧，同时抬起双臂双腿，顶峰保持2秒，缓慢放下。3组×10次。',tags:['零器械','零冲击','核心'],level:'beginner',video:'叔贵 核心训练 超人式',svg:`<svg viewBox='0 0 120 100'><circle cx='60' cy='55' r='10' fill='none' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='65' x2='60' y2='80' stroke='#4a9e6b' stroke-width='3'/><line x1='60' y1='72' x2='45' y2='62' stroke='#4a9e6b' stroke-width='2'/><line x1='60' y1='72' x2='75' y2='62' stroke='#4a9e6b' stroke-width='2'/><line x1='60' y1='80' x2='48' y2='95' stroke='#4a9e6b' stroke-width='2'/><line x1='60' y1='80' x2='72' y2='95' stroke='#4a9e6b' stroke-width='2'/><path d='M30 25 C45 20 40 35 30 25' stroke='#6ecf8e' stroke-width='1.5' fill='none'/><path d='M90 25 C75 20 80 35 90 25' stroke='#6ecf8e' stroke-width='1.5' fill='none'/></svg>`},
    {name:'俯身飞鸟',detail:'微屈膝俯身，双手持弹力带，双臂侧平举，挤压肩胛骨。3组×12次。',tags:['弹力带','膝盖友好'],level:'medium',video:'周六野 背部训练 哑铃飞鸟',svg:`<svg viewBox='0 0 120 100'><circle cx='60' cy='30' r='12' fill='none' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='42' x2='60' y2='65' stroke='#4a9e6b' stroke-width='3' stroke-dasharray='6,2'/><line x1='60' y1='65' x2='55' y2='90' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='65' x2='65' y2='90' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='52' x2='35' y2='45' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='52' x2='85' y2='45' stroke='#4a9e6b' stroke-width='2.5'/><path d='M25 40 L20 35 M95 40 L100 35' stroke='#6ecf8e' stroke-width='2' stroke-linecap='round'/></svg>`}
  ],
  chest: [
    {name:'跪姿俯卧撑',detail:'膝盖着地，双手略宽于肩，核心收紧，慢下快上。3组×力竭。',tags:['零器械','膝盖友好','入门'],level:'beginner',video:'周六野 上肢训练 俯卧撑',svg:`<svg viewBox='0 0 120 100'><circle cx='60' cy='30' r='10' fill='none' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='40' x2='60' y2='60' stroke='#4a9e6b' stroke-width='3'/><line x1='60' y1='48' x2='40' y2='40' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='48' x2='80' y2='40' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='60' x2='48' y2='85' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='60' x2='72' y2='85' stroke='#4a9e6b' stroke-width='2.5'/><path d='M44 82 L38 82 M76 82 L82 82' stroke='#6ecf8e' stroke-width='1.5'/><line x1='44' y1='82' x2='30' y2='92' stroke='#6ecf8e' stroke-width='1'/><line x1='76' y1='82' x2='90' y2='92' stroke='#6ecf8e' stroke-width='1'/></svg>`},
    {name:'弹力带推胸',detail:'弹力带绕过背部，双手握两端向前推。3组×15次。',tags:['弹力带','膝盖友好','入门'],level:'beginner',video:'闫帅奇 弹力带胸部',svg:`<svg viewBox='0 0 120 100'><circle cx='60' cy='40' r='12' fill='none' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='52' x2='60' y2='75' stroke='#4a9e6b' stroke-width='3'/><line x1='60' y1='60' x2='40' y2='52' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='60' x2='80' y2='52' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='75' x2='52' y2='95' stroke='#4a9e6b' stroke-width='2'/><line x1='60' y1='75' x2='68' y2='95' stroke='#4a9e6b' stroke-width='2'/><line x1='80' y1='52' x2='100' y2='45' stroke='#6ecf8e' stroke-width='2' stroke-linecap='round'/><line x1='40' y1='52' x2='20' y2='45' stroke='#6ecf8e' stroke-width='2' stroke-linecap='round'/></svg>`},
    {name:'弹力带夹胸',detail:'弹力带固定身后两侧，双手向前并拢。感受胸肌收缩。3组×12次。',tags:['弹力带','膝盖友好'],level:'medium',video:'帕梅拉 弹力带 胸',svg:`<svg viewBox='0 0 120 100'><circle cx='60' cy='35' r='11' fill='none' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='46' x2='60' y2='70' stroke='#4a9e6b' stroke-width='3'/><line x1='60' y1='55' x2='35' y2='45' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='55' x2='85' y2='45' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='70' x2='52' y2='95' stroke='#4a9e6b' stroke-width='2'/><line x1='60' y1='70' x2='68' y2='95' stroke='#4a9e6b' stroke-width='2'/><path d='M30 42 L20 35 M90 42 L100 35' stroke='#6ecf8e' stroke-width='1.5' stroke-linecap='round'/></svg>`}
  ],
  legs: [
    {name:'靠墙静蹲',detail:'背靠墙，大腿平行地面，膝盖不过脚尖。保持30-60秒×3组。',tags:['零器械','零冲击','护膝首选','入门'],level:'beginner',video:'叔贵 膝盖养护 靠墙静蹲',svg:`<svg viewBox='0 0 120 100'><line x1='20' y1='5' x2='20' y2='95' stroke='#888' stroke-width='3'/><circle cx='40' cy='35' r='11' fill='none' stroke='#4a9e6b' stroke-width='2.5'/><line x1='40' y1='46' x2='30' y2='60' stroke='#4a9e6b' stroke-width='3'/><line x1='30' y1='60' x2='22' y2='58' stroke='#4a9e6b' stroke-width='2'/><line x1='40' y1='55' x2='55' y2='55' stroke='#4a9e6b' stroke-width='2.5'/><line x1='30' y1='60' x2='28' y2='95' stroke='#4a9e6b' stroke-width='2.5'/><line x1='55' y1='55' x2='53' y2='82' stroke='#4a9e6b' stroke-width='2.5' stroke-dasharray='4,2'/><line x1='53' y1='82' x2='48' y2='95' stroke='#4a9e6b' stroke-width='2.5'/></svg>`},
    {name:'臀桥',detail:'仰卧屈膝，抬臀至肩-臀-膝呈直线，顶峰收缩2秒。3组×20次。',tags:['零器械','零冲击','臀腿'],level:'beginner',video:'周六野 臀部训练 臀桥',svg:`<svg viewBox='0 0 120 100'><circle cx='60' cy='50' r='10' fill='none' stroke='#4a9e6b' stroke-width='2.5'/><line x1='55' y1='55' x2='48' y2='80' stroke='#4a9e6b' stroke-width='3'/><line x1='65' y1='55' x2='72' y2='80' stroke='#4a9e6b' stroke-width='3'/><line x1='48' y1='80' x2='42' y2='95' stroke='#4a9e6b' stroke-width='2.5'/><line x1='72' y1='80' x2='78' y2='95' stroke='#4a9e6b' stroke-width='2.5'/><line x1='30' y1='60' x2='40' y2='65' stroke='#4a9e6b' stroke-width='2'/><line x1='90' y1='60' x2='80' y2='65' stroke='#4a9e6b' stroke-width='2'/></svg>`},
    {name:'弹力带侧走',detail:'弹力带套脚踝上方，半蹲侧向行走。左右各15步×3组。',tags:['弹力带','低冲击','臀中肌'],level:'beginner',video:'闫帅奇 弹力带臀腿',svg:`<svg viewBox='0 0 120 100'><circle cx='60' cy='30' r='11' fill='none' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='41' x2='60' y2='55' stroke='#4a9e6b' stroke-width='3'/><line x1='60' y1='55' x2='52' y2='75' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='55' x2='68' y2='75' stroke='#4a9e6b' stroke-width='2.5'/><line x1='52' y1='75' x2='45' y2='95' stroke='#4a9e6b' stroke-width='2'/><line x1='68' y1='75' x2='75' y2='95' stroke='#4a9e6b' stroke-width='2'/><line x1='60' y1='45' x2='35' y2='45' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='45' x2='85' y2='45' stroke='#4a9e6b' stroke-width='2.5'/><path d='M40 45 L35 30 M80 45 L85 30' stroke='#6ecf8e' stroke-width='1' stroke-dasharray='3'/></svg>`},
    {name:'无跳跃深蹲',detail:'缓慢下蹲至大腿平行地面，控制回起，全程不弹跳。3组×15次。',tags:['零器械','低冲击','控制'],level:'medium',video:'叔贵 膝盖友好 深蹲教学',svg:`<svg viewBox='0 0 120 100'><circle cx='60' cy='28' r='11' fill='none' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='39' x2='60' y2='55' stroke='#4a9e6b' stroke-width='3'/><line x1='60' y1='55' x2='50' y2='78' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='55' x2='70' y2='78' stroke='#4a9e6b' stroke-width='2.5'/><line x1='50' y1='78' x2='46' y2='95' stroke='#4a9e6b' stroke-width='2.5'/><line x1='70' y1='78' x2='74' y2='95' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='45' x2='35' y2='40' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='45' x2='85' y2='40' stroke='#4a9e6b' stroke-width='2.5'/></svg>`}
  ],
  jump: [
    {name:'站姿提踵',detail:'双脚与肩同宽，缓慢提踵至最高，顶峰停1秒，控制下落。3组×25次。',tags:['零器械','零冲击','小腿爆发'],level:'beginner',video:'闫帅奇 弹跳训练 提踵',svg:`<svg viewBox='0 0 120 100'><circle cx='60' cy='35' r='10' fill='none' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='45' x2='60' y2='70' stroke='#4a9e6b' stroke-width='3'/><line x1='60' y1='55' x2='40' y2='50' stroke='#4a9e6b' stroke-width='2'/><line x1='60' y1='55' x2='80' y2='50' stroke='#4a9e6b' stroke-width='2'/><line x1='60' y1='70' x2='52' y2='95' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='70' x2='68' y2='95' stroke='#4a9e6b' stroke-width='2.5'/><path d='M52 95 L50 92 M68 95 L70 92' stroke='#6ecf8e' stroke-width='1.5'/><polygon points='52,95 60,85 68,95' fill='none' stroke='#6ecf8e' stroke-width='1'/></svg>`},
    {name:'单腿平衡站立',detail:'单腿站立30-60秒，闭眼增加难度。每侧3组。',tags:['零器械','零冲击','踝膝稳定'],level:'beginner',video:'叔贵 踝关节 平衡训练',svg:`<svg viewBox='0 0 120 100'><circle cx='60' cy='30' r='10' fill='none' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='40' x2='60' y2='65' stroke='#4a9e6b' stroke-width='3'/><line x1='60' y1='50' x2='35' y2='45' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='50' x2='85' y2='45' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='65' x2='55' y2='95' stroke='#4a9e6b' stroke-width='3'/><line x1='55' y1='95' x2='50' y2='92' stroke='#4a9e6b' stroke-width='1'/><line x1='60' y1='65' x2='70' y2='85' stroke='#6ecf8e' stroke-width='1.5' stroke-dasharray='4'/></svg>`},
    {name:'弹力带摆臂跳',detail:'弹力带固定头顶，做完整跳跃摆臂动作但双脚不离地。3组×15次。',tags:['弹力带','低冲击','摆臂协调'],level:'medium',video:'帕梅拉 low impact 有氧',svg:`<svg viewBox='0 0 120 100'><circle cx='60' cy='25' r='10' fill='none' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='35' x2='60' y2='60' stroke='#4a9e6b' stroke-width='3'/><line x1='60' y1='45' x2='35' y2='30' stroke='#4a9e6b' stroke-width='2.5' stroke-dasharray='4,2'/><line x1='60' y1='45' x2='85' y2='30' stroke='#4a9e6b' stroke-width='2.5' stroke-dasharray='4,2'/><line x1='60' y1='60' x2='50' y2='90' stroke='#4a9e6b' stroke-width='2.5'/><line x1='60' y1='60' x2='70' y2='90' stroke='#4a9e6b' stroke-width='2.5'/><path d='M50 90 L48 87 M70 90 L72 87' stroke='#6ecf8e' stroke-width='1.5'/></svg>`}
  ]
};

/* ===== 推荐跟练博主 ===== */
const RECOMMENDED_CHANNELS = [
  {name:'闫帅奇',platform:'B站',url:'https://search.bilibili.com/all?keyword=',desc:'弹力带系列最全，动作讲解细腻，适合初学者'},
  {name:'叔贵',platform:'B站',url:'https://search.bilibili.com/all?keyword=',desc:'科学健身，关节保护讲解到位，膝盖友好首选'},
  {name:'周六野 Zoey',platform:'B站',url:'https://search.bilibili.com/all?keyword=',desc:'零器械训练多，时间适中，适合间隙跟练'},
  {name:'帕梅拉 Pamela Reif',platform:'B站',url:'https://search.bilibili.com/all?keyword=',desc:'低冲击版本适合膝盖保护，节奏感好'}
];

/* ===== 默认状态 ===== */
function defaultState(){
  return {
    thesis:{deadline:'',dailyGoal:1000,logs:{},minimalActions:{},difficulties:[]},
    exam:{type:'',region:'',startDate:'',stage:'基础',logs:{}},
    meal:{plan:{1:{text:''},2:{text:''},3:{text:''},4:{text:''},5:{text:''},6:{text:''},7:{text:''}},shopping:[],pantry:{}},
    fitness:{plan:{1:{text:''},2:{text:''},3:{text:''},4:{text:''},5:{text:''},6:{text:''},7:{text:''}},logs:{},jumpScores:{}},
    sewing:{projects:[],fabrics:[],wishlist:[]},
    dog:{name:'',vaccine:'',checklist:{}},
    video:{projects:[]},
    novel:{projects:[]},
    memo:{entries:{}},
    fontScale:2,
    meta:{createdAt:new Date().toISOString(),version:2}
  };
}

/* ===== 默认食材库存 ===== */
function defaultPantry(){
  return {
    eggs:{name:'鸡蛋',emoji:'🥚',stock:'ok',qty:''},
    rice:{name:'隔夜米饭',emoji:'🍚',stock:'ok',qty:''},
    ham:{name:'火腿肠',emoji:'🥓',stock:'ok',qty:''},
    peas:{name:'青豆/玉米粒',emoji:'🫛',stock:'ok',qty:''},
    carrot:{name:'胡萝卜',emoji:'🥕',stock:'ok',qty:''},
    scallion:{name:'葱花',emoji:'🧅',stock:'ok',qty:''},
    oil:{name:'食用油',emoji:'🫒',stock:'ok',qty:''},
    soy:{name:'生抽',emoji:'🫙',stock:'ok',qty:''},
    salt:{name:'盐',emoji:'🧂',stock:'ok',qty:''},
    pepper:{name:'白胡椒粉',emoji:'🌿',stock:'ok',qty:''},
    lunchbox:{name:'饭盒',emoji:'🍱',stock:'ok',qty:''},
    chickenLeg:{name:'鸡腿',emoji:'🍗',stock:'ok',qty:''},
    chickenWingRoot:{name:'鸡翅根',emoji:'🍗',stock:'ok',qty:''},
    chickenWing:{name:'鸡翅',emoji:'🍗',stock:'ok',qty:''},
    duckLeg:{name:'鸭腿',emoji:'🦆',stock:'ok',qty:''},
    meatSlice:{name:'肉片',emoji:'🥩',stock:'ok',qty:''},
    greens:{name:'青菜',emoji:'🥬',stock:'ok',qty:''},
    potato:{name:'土豆',emoji:'🥔',stock:'ok',qty:''}
  };
}

/* ===== 勇气语录 ===== */
const COURAGE_QUOTES = [
  '今天你敢于面对的，就是明天你不再害怕的。',
  '论文不是一天写完的，但每个字都在缩短你和终点的距离。',
  '写不出来的时候，允许自己写得烂——先有，再优。',
  '你逃避的不是论文，是"我不够好"的感觉。你够好，现在就开始。',
  '30分钟。只写30分钟。然后你爱干嘛干嘛。',
  '每一个完成论文的人，都经历过你现在这个阶段。你不是一个人。',
  '别跟完美主义做朋友，它是个只会说"再等等"的骗子。',
  '今天的最小行动，比明天的宏大计划更有力量。',
  '你选的创业方向，是你热爱的。热爱的东西，没有真正搞不定的。',
  '面对困难本身就是一种勇气。你已经比昨天的自己勇敢了。'
];

/* ===== 状态管理 ===== */
let state = defaultState();
let cookTimer = null;
let cookSeconds = 0;
let cookRunning = false;

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      state = deepMerge(defaultState(), parsed);
      // 合并默认食材：保留已有点库存状态，补充新增食材
      const dp = defaultPantry();
      if(!state.meal.pantry) state.meal.pantry = {};
      Object.entries(dp).forEach(([k,v])=>{
        if(!state.meal.pantry[k]) state.meal.pantry[k] = v;
      });
    }
  }catch(e){ state = defaultState(); }
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function deepMerge(target, source){
  const out = {};
  for(const k of Object.keys(target)) out[k] = target[k];
  for(const k of Object.keys(source)){
    if(source[k] && typeof source[k]==='object' && !Array.isArray(source[k]) && target[k] && typeof target[k]==='object' && !Array.isArray(target[k])){
      out[k] = deepMerge(target[k], source[k]);
    }else{
      out[k] = source[k];
    }
  }
  return out;
}

/* ===== 工具 ===== */
function today(){ const d=new Date(); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function pad(n){ return n<10?'0'+n:n; }
function daysBetween(a,b){ return Math.ceil((new Date(b)-new Date(a))/86400000); }
function weekDayName(i){ return ['日','一','二','三','四','五','六'][i]; }
function getDayIndex(){ const d=new Date().getDay(); return d===0?7:d; }
function nowDateString(){ const d=new Date(); return d.toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'short'}); }
function escapeHTML(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* ===== DOM 引用 ===== */
const $ = s=>document.querySelector(s);
const $$ = s=>document.querySelectorAll(s);

/* ===== 当前时间在哪个 slot ===== */
function getCurrentSlotIndex(){
  const h = new Date().getHours();
  if(h<6.5) return 0;  // 起床前
  if(h<7) return 1;     // 起床+炒饭 (6:30-7:00)
  if(h<7.5) return 2;   // 遛狗 (7:00-7:30)
  if(h<8) return 2;     // 过渡
  if(h<12) return 3;   // 学校上午
  if(h<17) return 4;   // 学校下午
  if(h<19) return 5;   // 回家晚饭遛狗
  return 6;             // 晚间
}

/* ===== 导航 ===== */
function setupNav(){
  const hamburger = $('#hamburger');
  const sidebar = $('#sidebar');
  const overlay = $('#overlay');

  hamburger.addEventListener('click',()=>{
    const open = sidebar.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    overlay.classList.toggle('open', open);
  });

  overlay.addEventListener('click',()=>{
    sidebar.classList.remove('open');
    hamburger.classList.remove('open');
    overlay.classList.remove('open');
  });

  sidebar.addEventListener('click',e=>{
    const item = e.target.closest('.nav-item');
    if(!item) return;
    const view = item.dataset.view;
    if(view) navigate(view);
    if(window.innerWidth<=768){
      sidebar.classList.remove('open');
      hamburger.classList.remove('open');
      overlay.classList.remove('open');
    }
  });
}

function navigate(view){
  localStorage.setItem('shedo_view', view);
  $$('.nav-item').forEach(n=>n.classList.remove('active'));
  const target = $(`.nav-item[data-view="${view}"]`);
  if(target) target.classList.add('active');
  $$('.view').forEach(v=>v.classList.remove('active'));
  const viewEl = $('#view-'+view);
  if(viewEl){ viewEl.classList.add('active'); renderView(view); }
}

function renderView(view){
  switch(view){
    case 'dashboard': renderDashboard(); break;
    case 'thesis': renderThesis(); break;
    case 'exam': renderExam(); break;
    case 'meal': renderMeal(); break;
    case 'fitness': renderFitness(); break;
    case 'dog': renderDog(); break;
    case 'sewing': renderSewing(); break;
    case 'video': renderVideo(); break;
    case 'novel': renderNovel(); break;
    case 'memo': renderMemo(); break;
    case 'settings': renderSettings(); break;
  }
}

/* ===== 看板 ===== */
function renderDashboard(){
  $('#dashboardDate').textContent = nowDateString();

  // 论文倒计时
  if(state.thesis.deadline && state.thesis.deadline > today()){
    const days = daysBetween(today(), state.thesis.deadline);
    $('#countdownDays').textContent = Math.max(0,days);
    $('#countdownLabel').textContent = '距交稿';
  }else if(state.thesis.deadline && state.thesis.deadline <= today()){
    $('#countdownDays').textContent = '0';
    $('#countdownLabel').textContent = '已过交稿日';
  }else{
    $('#countdownDays').textContent = '--';
    $('#countdownLabel').textContent = '设置交稿日期';
  }

  renderTimeline();
  renderHealthRings();
  renderDashboardChecklist();
}

/* ---- 时间线 ---- */
function renderTimeline(){
  const now = new Date();
  $('#timeNow').textContent = now.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
  const slotIdx = getCurrentSlotIndex();

  const slots = [
    {time:'06:30-07:00',title:'起床',detail:'灵活起床，不晚于7点。洗漱蓄力',icon:'🌅'},
    {time:'起床后30min',title:'晨间炒饭',detail:'快手炒饭 + 装盒，30分钟搞定',icon:'🍳',badge:'30min'},
    {time:'炒饭后',title:'喂狗 · 遛狗',detail:'喂食 + 早晨遛狗',icon:'🐕'},
    {time:'08:00-12:00',title:'学校 · 论文为主',detail:'每 30 分钟起身活动，每小时 10-20 分钟训练',icon:'📝',badge:'间隙训练'},
    {time:'12:00-17:00',title:'学校 · 论文+考公',detail:'下午切换刷题，继续间隙活动',icon:'📚',badge:'间隙训练'},
    {time:'17:00-19:00',title:'回家 · 晚饭 · 遛狗',detail:'晚饭 + 晚间遛狗',icon:'🏠'},
    {time:'19:00-22:00',title:'晚间自由',detail:'缝纫 / 其他活动 · 看心情',icon:'🧵',badge:'灵活'}
  ];

  let html = '';
  slots.forEach((s,i)=>{
    let cls = '';
    if(i < slotIdx) cls = 'past';
    else if(i === slotIdx) cls = 'active';
    html += `<div class="timeline-slot ${cls}">
      <div class="slot-time">${s.time}</div>
      <div class="slot-info">
        <div class="slot-title">${s.icon} ${s.title}${s.badge ? '<span class="slot-badge">'+s.badge+'</span>' : ''}</div>
        <div class="slot-detail">${s.detail}</div>
      </div>
    </div>`;
  });
  $('#timeline').innerHTML = html;
}

/* ---- 健康度环 ---- */
function createRingSVG(pct, label, color){
  const r=36,c=89.5;
  const pct0 = Math.min(100,Math.max(0,pct));
  const offset = c*(1-pct0/100);
  return `<svg width="80" height="80" viewBox="0 0 80 80">
    <g transform="rotate(-90,40,40)">
      <circle cx="40" cy="40" r="${r}" fill="none" stroke="var(--border)" stroke-width="6"/>
      <circle cx="40" cy="40" r="${r}" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${offset}"/>
    </g>
    <text x="40" y="40" text-anchor="middle" dominant-baseline="central" font-size="16" font-weight="700" fill="${color}">${pct0}%</text>
  </svg>`;
}

function renderHealthRings(){
  // 论文
  const tw = state.thesis.logs[today()] || 0;
  const tgoal = state.thesis.dailyGoal || 1000;
  const thesisPct = Math.min(100, Math.round(tw/tgoal*100));

  // 考公
  const elog = state.exam.logs[today()];
  const examCt = elog ? (elog.xingce||0)+(elog.shenlun||0) : 0;
  const examPct = Math.min(100, Math.round(examCt/50*100));

  // 健康: 训练+遛狗
  const flog = state.fitness.logs[today()];
  const fitDone = flog && flog.duration>0 ? 1 : 0;
  const key = 'dog_'+today();
  const dc = state.dog.checklist[key] || {};
  const dogDone = (dc.morningWalk&&dc.eveningWalk ? 1 : 0);
  const cookDone = (dc.cook ? 1 : 0);
  const healthPct = Math.round((fitDone+dogDone+cookDone)/3*100);

  $('#healthRings').innerHTML =
    '<div class="health-ring">'+createRingSVG(thesisPct,'论文', '#2e7d5b')+'<div class="ring-label">论文</div><div class="ring-value">'+thesisPct+'%</div></div>'+
    '<div class="health-ring">'+createRingSVG(examPct,'考公', '#6abf8e')+'<div class="ring-label">考公</div><div class="ring-value">'+examPct+'%</div></div>'+
    '<div class="health-ring">'+createRingSVG(healthPct,'健康', '#8cb89f')+'<div class="ring-label">健康</div><div class="ring-value">'+healthPct+'%</div></div>';
}

function renderDashboardChecklist(){
  const key = 'dc_'+today();
  const data = state.dog.checklist[key] || {};
  const items = [
    {k:'cook',label:'晨间炒饭 (06:30-07:00)'},
    {k:'feedDog',label:'喂狗 (炒饭后)'},
    {k:'walkAM',label:'早晨遛狗 (07:00-07:30)'},
    {k:'thesis',label:'论文写作'},
    {k:'exam',label:'考公刷题'},
    {k:'gapTrain',label:'间隙训练'},
    {k:'walkPM',label:'晚上遛狗 (17:00-19:00)'},
    {k:'sew',label:'缝纫时间'}
  ];
  let html = '';
  items.forEach(it=>{
    const checked = data[it.k] ? 'checked' : '';
    html += '<label><input type="checkbox" data-ckey="'+it.k+'" '+checked+'> '+it.label+'</label>';
  });
  $('#dailyChecklist').innerHTML = html;
}

function setupDashboardChecklist(){
  $('#dailyChecklist').addEventListener('change',e=>{
    if(e.target.matches('input[type=checkbox]')){
      const ckey = e.target.dataset.ckey;
      const key = 'dc_'+today();
      if(!state.dog.checklist[key]) state.dog.checklist[key] = {};
      state.dog.checklist[key][ckey] = e.target.checked;
      saveState();
      renderHealthRings();
    }
  });
}

/* ===== 论文 —— 勇气模式 ===== */
function renderThesis(){
  $('#thesisDeadline').value = state.thesis.deadline || '';
  $('#thesisDailyGoal').value = state.thesis.dailyGoal;
  $('#thesisGoalShow').textContent = state.thesis.dailyGoal;

  // 写作字数
  const td = state.thesis.logs[today()] || 0;
  $('#thesisTodayWords').textContent = td;

  const pct = Math.min(100, Math.round(td/state.thesis.dailyGoal*100));
  const r=46,c=133;
  const offset = c*(1-pct/100);
  $('#thesisRing').innerHTML = `<svg width="100" height="100" viewBox="0 0 100 100">
    <g transform="rotate(-90,50,50)">
      <circle cx="50" cy="50" r="46" fill="none" stroke="var(--border)" stroke-width="7"/>
      <circle cx="50" cy="50" r="46" fill="none" stroke="var(--primary)" stroke-width="7" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${offset}"/>
    </g>
    <text x="50" y="50" text-anchor="middle" dominant-baseline="central" font-size="18" font-weight="700" fill="var(--primary)">${pct}%</text>
  </svg>`;

  // 最小行动
  const ma = state.thesis.minimalActions[today()];
  if(ma){
    $('#minimalActionText').textContent = ma.text;
    $('#minimalActionDone').checked = ma.done || false;
    $('#minimalActionInput').style.display = 'none';
    $('#minimalActionSet').style.display = 'none';
  }else{
    $('#minimalActionText').textContent = '尚未设定今日最小行动';
    $('#minimalActionDone').checked = false;
    $('#minimalActionInput').style.display = '';
    $('#minimalActionSet').style.display = '';
  }

  // 困难拆解
  renderDifficulties();

  // 随机勇气语录
  const quote = COURAGE_QUOTES[Math.floor(Math.random()*COURAGE_QUOTES.length)];
  $('#courageQuote').textContent = quote;

  renderThesisLog();
}

function renderDifficulties(){
  if(!state.thesis.difficulties.length){
    $('#difficultyList').innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:8px 0">还没有记录困难。把困扰你的事情写下来，我们一起拆。</div>';
    return;
  }
  let html = '';
  state.thesis.difficulties.forEach((d,i)=>{
    const doneCount = (d.steps||[]).filter(s=>s.done).length;
    const totalCount = (d.steps||[]).length;
    html += `<div class="difficulty-item">
      <div class="diff-title">${escapeHTML(d.title)} ${totalCount>0?`<span style="font-size:11px;color:var(--text-muted);font-weight:400">(${doneCount}/${totalCount})</span>`:''}</div>
      <div class="diff-steps">${(d.steps||[]).map((s,j)=>{
        const cls = s.done?' class="diff-step-done"':'';
        return `<div${cls}><input type="checkbox" data-diff="${i}" data-step="${j}" ${s.done?'checked':''} style="margin-right:6px;accent-color:var(--primary)">${escapeHTML(s.text)}</div>`;
      }).join('')}</div>
      <div class="diff-actions">
        <button class="btn btn-sm btn-outline" data-diff-add="${i}">+ 加一步</button>
        <button class="btn btn-sm" style="color:var(--danger);background:none" data-diff-del="${i}">删除</button>
      </div>
    </div>`;
  });
  $('#difficultyList').innerHTML = html;
}

function setupThesis(){
  $('#thesisSaveSettings').addEventListener('click',()=>{
    state.thesis.deadline = $('#thesisDeadline').value;
    state.thesis.dailyGoal = parseInt($('#thesisDailyGoal').value) || 1000;
    saveState(); renderThesis();
  });
  $('#thesisAddWords').addEventListener('click',()=>{
    const w = parseInt($('#thesisWordInput').value) || 0;
    if(w<0) return;
    state.thesis.logs[today()] = (state.thesis.logs[today()]||0) + w;
    saveState();
    $('#thesisWordInput').value = '';
    renderThesis();
  });

  // 最小行动设置
  $('#minimalActionSet').addEventListener('click',()=>{
    const txt = $('#minimalActionInput').value.trim();
    if(!txt) return;
    state.thesis.minimalActions[today()] = {text:txt,done:false};
    saveState(); renderThesis();
  });
  $('#minimalActionDone').addEventListener('change',function(){
    const ma = state.thesis.minimalActions[today()];
    if(ma){
      ma.done = this.checked;
      saveState(); renderThesis();
    }
  });

  // 困难拆解
  $('#difficultyAdd').addEventListener('click',()=>{
    const txt = $('#difficultyInput').value.trim();
    if(!txt) return;
    state.thesis.difficulties.push({title:txt,steps:[]});
    saveState();
    $('#difficultyInput').value = '';
    renderDifficulties();
  });

  $('#difficultyList').addEventListener('click',e=>{
    // 添加步骤
    if(e.target.matches('[data-diff-add]')){
      const idx = parseInt(e.target.dataset.diffAdd);
      const txt = prompt('拆解：这一步要做什么？');
      if(txt && txt.trim()){
        state.thesis.difficulties[idx].steps.push({text:txt.trim(),done:false});
        saveState(); renderThesis();
      }
      return;
    }
    // 删除困难
    if(e.target.matches('[data-diff-del]')){
      const idx = parseInt(e.target.dataset.diffDel);
      if(confirm('确定删除这条困难记录？')){
        state.thesis.difficulties.splice(idx,1);
        saveState(); renderThesis();
      }
      return;
    }
    // 勾选步骤
    if(e.target.matches('input[type=checkbox]')){
      const diffIdx = parseInt(e.target.dataset.diff);
      const stepIdx = parseInt(e.target.dataset.step);
      state.thesis.difficulties[diffIdx].steps[stepIdx].done = e.target.checked;
      saveState(); renderThesis();
    }
  });

  // 换勇气语录
  $('#courageRefresh').addEventListener('click',()=>{
    const quote = COURAGE_QUOTES[Math.floor(Math.random()*COURAGE_QUOTES.length)];
    $('#courageQuote').textContent = quote;
  });
}

function renderThesisLog(){
  const entries = Object.entries(state.thesis.logs).sort().reverse().slice(0,14);
  if(!entries.length){ $('#thesisLog').innerHTML = '<div class="log-item"><span class="log-date">暂无记录</span></div>'; return; }
  let html = '';
  entries.forEach(([d,w])=>{
    const ds = new Date(d).toLocaleDateString('zh-CN',{month:'short',day:'numeric',weekday:'short'});
    html += '<div class="log-item"><span class="log-date">'+ds+'</span><span class="log-value">'+w+' 字</span></div>';
  });
  $('#thesisLog').innerHTML = html;
}

/* ===== 考公 ===== */
function renderExam(){
  $('#examType').value = state.exam.type || '';
  $('#examRegion').value = state.exam.region || '';
  $('#examStartDate').value = state.exam.startDate || '';

  $$('#view-exam .stage-item').forEach(el=>{
    el.classList.toggle('active', el.dataset.stage === state.exam.stage);
    el.style.cursor = 'pointer';
  });

  renderExamLog();
  renderMaterialLibrary();
}

function renderExamLog(){
  const entries = Object.entries(state.exam.logs).sort().reverse().slice(0,14);
  if(!entries.length){ $('#examLog').innerHTML = '<div class="log-item"><span class="log-date">暂无记录</span></div>'; return; }
  let html = '';
  entries.forEach(([d,r])=>{
    const ds = new Date(d).toLocaleDateString('zh-CN',{month:'short',day:'numeric',weekday:'short'});
    html += '<div class="log-item"><span class="log-date">'+ds+'</span><span class="log-value">行测 '+r.xingce+' · 申论 '+r.shenlun+' · 错 '+r.errors+'</span></div>';
  });
  $('#examLog').innerHTML = html;
}

/* ---- 素材库 ---- */
let materialDates = [];      // 有素材的日期列表
let currentMaterialDate = ''; // 当前查看的日期

function renderMaterialLibrary(){
  currentMaterialDate = today();
  // 先从缓存恢复历史日期列表
  const savedDates = localStorage.getItem('wb_material_dates');
  if(savedDates){
    try{ materialDates = JSON.parse(savedDates); }catch(e){ materialDates = []; }
  }
  // 尝试加载最近14天的素材文件
  loadAvailableDates().then(()=>{
    renderDateList();
    selectMaterialDate(currentMaterialDate);
  });
}

// 尝试 fetch 最近14天的 JSON，记录哪些存在
function loadAvailableDates(){
  const dates = [];
  const now = new Date();
  for(let i=0;i<14;i++){
    const d = new Date(now); d.setDate(d.getDate()-i);
    const ds = d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
    dates.push(ds);
  }
  return Promise.all(dates.map(ds=>{
    // 先看缓存
    const cached = localStorage.getItem('wb_material_'+ds);
    if(cached){
      if(!materialDates.includes(ds)) materialDates.push(ds);
      return Promise.resolve();
    }
    // 再试网络
    return fetch('data/daily-brief-'+ds+'.json')
      .then(r=>{ if(!r.ok) throw new Error('nf'); return r.json(); })
      .then(data=>{
        localStorage.setItem('wb_material_'+ds, JSON.stringify(data));
        if(!materialDates.includes(ds)) materialDates.push(ds);
      })
      .catch(()=>{});
  })).then(()=>{
    materialDates.sort().reverse();
    localStorage.setItem('wb_material_dates', JSON.stringify(materialDates));
  });
}

// 渲染日期列表
function renderDateList(){
  const container = $('#materialDateList');
  if(!container) return;
  // 生成最近14天的日期 pill
  const now = new Date();
  let html = '';
  for(let i=0;i<14;i++){
    const d = new Date(now); d.setDate(d.getDate()-i);
    const ds = d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
    const label = (d.getMonth()+1)+'/'+d.getDate();
    const hasData = materialDates.includes(ds);
    const active = ds === currentMaterialDate ? ' active' : '';
    const dataCls = hasData ? ' has-data' : '';
    html += '<span class="material-date-pill'+active+dataCls+'" data-mdate="'+ds+'">'+label+'</span>';
  }
  container.innerHTML = html;
  // 绑定点击
  container.querySelectorAll('.material-date-pill').forEach(el=>{
    el.addEventListener('click',()=>{
      const ds = el.dataset.mdate;
      if(ds) selectMaterialDate(ds);
    });
  });
}

// 加载指定日期的素材
function selectMaterialDate(ds){
  currentMaterialDate = ds;
  renderDateList();
  const d = new Date(ds);
  $('#materialDate').textContent = (d.getMonth()+1)+'月'+d.getDate()+'日';

  // 先从缓存取
  const cached = localStorage.getItem('wb_material_'+ds);
  if(cached){
    try{
      const data = JSON.parse(cached);
      renderMaterialContent(data);
      $('#materialUpdateTime').textContent = data.updatedAt || ds;
      return;
    }catch(e){}
  }
  // 缓存没有，试网络
  fetch('data/daily-brief-'+ds+'.json')
    .then(r=>{ if(!r.ok) throw new Error('nf'); return r.json(); })
    .then(data=>{
      localStorage.setItem('wb_material_'+ds, JSON.stringify(data));
      if(!materialDates.includes(ds)){
        materialDates.push(ds);
        materialDates.sort().reverse();
        localStorage.setItem('wb_material_dates', JSON.stringify(materialDates));
        renderDateList();
      }
      renderMaterialContent(data);
      $('#materialUpdateTime').textContent = data.updatedAt || ds;
    })
    .catch(()=>{
      if(ds === today()) showMaterialEmpty();
      else{
        $('#materialWordsContent').innerHTML = '<div class="material-empty">该日期暂无素材</div>';
        $('#materialCasesContent').innerHTML = '<div class="material-empty">该日期暂无素材</div>';
        $('#materialNewsContent').innerHTML = '<div class="material-empty">该日期暂无素材</div>';
        $('#materialUpdateTime').textContent = ds+' 无数据';
      }
    });
}

function sourceLinkHtml(source, url){
  if(url){
    return `—— <a href="${escapeHTML(url)}" target="_blank" rel="noopener" class="m-link">${escapeHTML(source)} ↗</a>`;
  }
  return `—— ${escapeHTML(source||'')}`;
}

function renderMaterialContent(data){
  // 好词好句
  let wordsHtml = '';
  if(data.words && data.words.length){
    data.words.forEach(w=>{
      wordsHtml += `<div class="m-item">${escapeHTML(w.text)}<div class="m-source">${sourceLinkHtml(w.source, w.url)}</div></div>`;
    });
  }else{ wordsHtml = '<div class="material-empty">等待今日素材推送</div>'; }
  $('#materialWordsContent').innerHTML = wordsHtml;

  // 案例素材
  let casesHtml = '';
  if(data.cases && data.cases.length){
    data.cases.forEach(c=>{
      casesHtml += `<div class="m-item"><strong>${escapeHTML(c.title)}</strong><br>${escapeHTML(c.desc)}<div class="m-source">${sourceLinkHtml(c.source, c.url)}</div></div>`;
    });
  }else{ casesHtml = '<div class="material-empty">等待今日素材推送</div>'; }
  $('#materialCasesContent').innerHTML = casesHtml;

  // 时政
  let newsHtml = '';
  if(data.news && data.news.length){
    data.news.forEach(n=>{
      newsHtml += `<div class="m-item">${escapeHTML(n.text)}<div class="m-source">${sourceLinkHtml(n.source, n.url)}${n.date ? ' · ' + escapeHTML(n.date) : ''}</div></div>`;
    });
  }else{ newsHtml = '<div class="material-empty">等待今日素材推送</div>'; }
  $('#materialNewsContent').innerHTML = newsHtml;
}

function showMaterialEmpty(){
  const empty = '<div class="material-empty">今日素材尚未推送。<br><small>靓女会每天自动搜索整理，<br>打开 WorkBuddy 对话获取最新素材。</small></div>';
  $('#materialWordsContent').innerHTML = empty;
  $('#materialCasesContent').innerHTML = empty;
  $('#materialNewsContent').innerHTML = empty;
  $('#materialUpdateTime').textContent = '暂无数据';
}

function saveMaterialCache(data){
  localStorage.setItem('wb_material_cache', JSON.stringify(data));
}

function setupExam(){
  $('#examSaveSettings').addEventListener('click',()=>{
    state.exam.type = $('#examType').value;
    state.exam.region = $('#examRegion').value;
    state.exam.startDate = $('#examStartDate').value;
    saveState(); renderExam();
  });
  $('#examAddRecord').addEventListener('click',()=>{
    const r = {
      xingce: parseInt($('#examXingce').value)||0,
      shenlun: parseInt($('#examShenlun').value)||0,
      errors: parseInt($('#examErrors').value)||0
    };
    state.exam.logs[today()] = r;
    saveState();
    $('#examXingce').value=0;$('#examShenlun').value=0;$('#examErrors').value=0;
    renderExam();
  });
  $('#examAdvance').addEventListener('click',()=>{
    const stages = ['基础','强化','冲刺','模考'];
    const idx = stages.indexOf(state.exam.stage);
    if(idx<stages.length-1){ state.exam.stage = stages[idx+1]; saveState(); renderExam(); }
  });

  // 阶段点击
  $$('#view-exam .stage-item').forEach(el=>{
    el.addEventListener('click',()=>{
      state.exam.stage = el.dataset.stage;
      saveState(); renderExam();
    });
  });

  // Tab 切换
  $('#examTabs').addEventListener('click',e=>{
    const btn = e.target.closest('.tab-btn');
    if(!btn) return;
    const tab = btn.dataset.tab;
    $$('#examTabs .tab-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    $$('#view-exam .tab-panel').forEach(p=>p.classList.remove('active'));
    const panel = $('#panel-'+tab);
    if(panel){
      panel.classList.add('active');
      if(tab==='exam-material') renderMaterialLibrary();
    }
  });
}

/* ===== 吃饭·带饭 ===== */
function renderMeal(){
  renderWeekPlan();
  renderPantry();
  renderShopping();
}

function renderWeekPlan(){
  const days = ['一','二','三','四','五','六','日'];
  const todayIdx = getDayIndex();
  let html = '';
  days.forEach((d,i)=>{
    const idx = i+1;
    const plan = state.meal.plan[idx]||{text:''};
    const isToday = idx===todayIdx;
    html += '<div class="week-day'+(isToday?' today':'')+'">'+
      '<div class="day-name">周'+d+'</div>'+
      '<div class="day-meal">'+escapeHTML(plan.text||'未计划')+'</div>'+
      '</div>';
  });
  $('#weekPlan').innerHTML = html;
}

function renderPantry(){
  const pantry = state.meal.pantry;
  if(!pantry || Object.keys(pantry).length===0) return;
  let html = '';
  Object.entries(pantry).forEach(([key,item])=>{
    html += `<div class="pantry-item" data-pantry="${key}">
      <span class="pantry-icon">${item.emoji||'📦'}</span>
      <span class="pantry-name">${escapeHTML(item.name)}</span>
      <span class="pantry-stock ${item.stock==='ok'?'ok':'low'}">${item.stock==='ok'?'有货':'缺货'}</span>
    </div>`;
  });
  $('#pantryGrid').innerHTML = html;
}

function renderShopping(){
  let html = '';
  state.meal.shopping.forEach((item,i)=>{
    html += '<li class="'+(item.done?'done':'')+'">'+
      '<span>'+escapeHTML(item.text)+'</span>'+
      '<button data-del="'+i+'" title="删除">&times;</button>'+
      '</li>';
  });
  if(!html) html = '<li style="color:var(--text-muted)">清单为空</li>';
  $('#shoppingList').innerHTML = html;
}

function setupMeal(){
  // 购物添加
  $('#shoppingAdd').addEventListener('click',()=>{
    const txt = $('#shoppingInput').value.trim();
    if(!txt) return;
    state.meal.shopping.push({text:txt,done:false});
    saveState(); $('#shoppingInput').value=''; renderMeal();
  });

  // 购物列表操作
  $('#shoppingList').addEventListener('click',e=>{
    if(e.target.matches('[data-del]')){
      state.meal.shopping.splice(parseInt(e.target.dataset.del),1);
      saveState(); renderMeal();
    }
    if(e.target.closest('li span')){
      const li = e.target.closest('li');
      const btn = li.querySelector('[data-del]');
      if(btn){
        const idx = parseInt(btn.dataset.del);
        state.meal.shopping[idx].done = !state.meal.shopping[idx].done;
        saveState(); renderMeal();
      }
    }
  });

  // 食谱编辑
  $('#weekPlan').addEventListener('click',e=>{
    const day = e.target.closest('.week-day');
    if(!day) return;
    const idx = Array.from(day.parentElement.children).indexOf(day) + 1;
    const current = state.meal.plan[idx].text || '';
    const txt = prompt('编辑周'+weekDayName(idx)+'的炒饭：', current);
    if(txt!==null){
      state.meal.plan[idx].text = txt;
      saveState(); renderMeal();
    }
  });

  // 食材库存点击切换
  $('#pantryGrid').addEventListener('click',e=>{
    const item = e.target.closest('.pantry-item');
    if(!item) return;
    const key = item.dataset.pantry;
    const current = state.meal.pantry[key];
    if(current){
      current.stock = current.stock==='ok'?'low':'ok';
      saveState(); renderPantry();
    }
  });

  // 缺货加入采购
  $('#pantryToShopping').addEventListener('click',()=>{
    const pantry = state.meal.pantry;
    let added = 0;
    Object.values(pantry).forEach(item=>{
      if(item.stock==='low'){
        const exists = state.meal.shopping.find(s=>s.text===item.name);
        if(!exists){
          state.meal.shopping.push({text:item.name,done:false});
          added++;
        }
      }
    });
    if(added>0){ saveState(); renderMeal(); }
    else{ alert('没有缺货的食材'); }
  });

  // ===== 炒饭计时器 =====
  setupCookTimer();

  // 初始渲染计时器环
  updateTimerRing(100);
}

/* ---- 炒饭计时器 ---- */
function setupCookTimer(){
  $('#timerStart').addEventListener('click',()=>{
    if(cookRunning) return;
    cookRunning = true;
    $('#timerStart').disabled = true;
    $('#timerPause').disabled = false;
    startCookTimer(cookSeconds || 0);
  });

  $('#timerPause').addEventListener('click',()=>{
    cookRunning = false;
    clearInterval(cookTimer);
    $('#timerStart').disabled = false;
    $('#timerStart').textContent = '继续';
    $('#timerPhase').textContent = '已暂停';
  });

  $('#timerReset').addEventListener('click',()=>{
    clearInterval(cookTimer);
    cookRunning = false;
    cookSeconds = 0;
    $('#timerStart').disabled = false;
    $('#timerStart').textContent = '开始炒饭';
    $('#timerPause').disabled = true;
    $('#timerPhase').textContent = '准备开始';
    updateTimerDisplay(30*60);
    updateTimerRing(100);
    updateTimerSteps(-1);
    // 同时打卡 checklist
    const key = 'dc_'+today();
    if(!state.dog.checklist[key]) state.dog.checklist[key] = {};
    state.dog.checklist[key].cook = true;
    saveState();
  });
}

function startCookTimer(fromSec){
  cookSeconds = fromSec;
  const TOTAL = 30*60; // 30 minutes

  cookTimer = setInterval(()=>{
    cookSeconds++;
    if(cookSeconds >= TOTAL){
      clearInterval(cookTimer);
      cookRunning = false;
      cookSeconds = TOTAL;
      updateTimerDisplay(0);
      updateTimerRing(0);
      updateTimerSteps(TOTAL);
      $('#timerPhase').textContent = '炒饭完成！装盒出发！🍱';
      $('#timerStart').disabled = false;
      $('#timerStart').textContent = '再来一次';
      $('#timerPause').disabled = true;
      // 震动/声音(通过振动API)
      if(navigator.vibrate) navigator.vibrate([200,100,200,100,500]);
      return;
    }
    const remaining = TOTAL - cookSeconds;
    updateTimerDisplay(remaining);
    updateTimerRing(remaining/TOTAL*100);
    updateTimerSteps(cookSeconds);
    updateTimerPhase(cookSeconds);
  }, 1000);
}

function updateTimerDisplay(remaining){
  const m = Math.floor(remaining/60);
  const s = remaining%60;
  $('#timerTime').textContent = pad(m)+':'+pad(s);
}

function updateTimerRing(pct){
  const c = 2*Math.PI*52; // circumference r=52
  const offset = c*(1-Math.min(100,pct)/100);
  const ring = $('#timerRingProgress');
  if(ring) ring.setAttribute('stroke-dasharray', c+' '+c);
  if(ring) ring.setAttribute('stroke-dashoffset', offset);
}

function updateTimerSteps(sec){
  const steps = $$('#timerSteps .timer-step');
  steps.forEach(step=>{
    const from = parseInt(step.dataset.from)*60;
    const to = parseInt(step.dataset.to)*60;
    step.classList.remove('active','done');
    if(sec < 0) return;
    if(sec >= to) step.classList.add('done');
    else if(sec >= from) step.classList.add('active');
  });
}

function updateTimerPhase(sec){
  const min = Math.floor(sec/60);
  if(min<5) $('#timerPhase').textContent = '点火热锅 · 打蛋备料 🔥';
  else if(min<15) $('#timerPhase').textContent = '炒蛋+配料+米饭下锅 🍳';
  else if(min<25) $('#timerPhase').textContent = '大火翻炒 · 调味 🧂';
  else $('#timerPhase').textContent = '装盒 · 清洁 🍱';
}

/* ===== 健身 · 排球向 ===== */
function renderFitness(){
  renderExerciseLibrary();
  renderCoachList();
  renderFitnessPlan();
  renderFitnessLog();
  // 弹跳评分
  const js = state.fitness.jumpScores[today()];
  if(js) $('#jumpScore').value = js;
}

function renderCoachList(){
  let html = '';
  RECOMMENDED_CHANNELS.forEach(c=>{
    html += `<a class="coach-card" href="${c.url}${encodeURIComponent(c.name)}" target="_blank" rel="noopener">
      <div class="coach-platform">${c.platform}</div>
      <div class="coach-name">${c.name}</div>
      <div class="coach-desc">${c.desc}</div>
    </a>`;
  });
  $('#coachList').innerHTML = html;
}

function renderExerciseLibrary(){
  const groups = {back:'exBack',chest:'exChest',legs:'exLegs',jump:'exJump'};
  Object.entries(groups).forEach(([group,containerId])=>{
    const exercises = EXERCISE_LIBRARY[group];
    if(!exercises) return;
    let html = '';
    exercises.forEach(ex=>{
      const tags = (ex.tags||[]).map(t=>{
        if(t==='入门') return '<span class="ex-tag beginner">入门</span>';
        if(t==='进阶') return '<span class="ex-tag medium">进阶</span>';
        return '<span class="ex-tag">'+t+'</span>';
      }).join('');
      const videoUrl = ex.video ? 'https://search.bilibili.com/all?keyword='+encodeURIComponent(ex.video) : '';
      html += `<div class="exercise-card">
        <div class="ex-top-row">
          <div class="ex-svg">${ex.svg||''}</div>
          <div class="ex-info">
            <div class="ex-name">${ex.name}</div>
            <div class="ex-detail">${ex.detail}</div>
            <div class="ex-tags">${tags}</div>
            ${videoUrl ? `<a class="ex-video-link" href="${videoUrl}" target="_blank" rel="noopener">🎬 B站搜：${ex.video}</a>` : ''}
          </div>
        </div>
      </div>`;
    });
    $('#'+containerId).innerHTML = html;
  });
}

function renderFitnessPlan(){
  const days = ['一','二','三','四','五','六','日'];
  const todayIdx = getDayIndex();
  const defaults = ['背+核心（间隙）','胸+弹跳（间隙）','腿+核心（间隙）','背+弹跳（间隙）','胸+腿（间隙）','排球实战 or 休息','主动恢复 · 拉伸'];
  let html = '';
  days.forEach((d,i)=>{
    const idx = i+1;
    const plan = state.fitness.plan[idx]||{text:defaults[i]};
    const isToday = idx===todayIdx;
    html += '<div class="week-day'+(isToday?' today':'')+'">'+
      '<div class="day-name">周'+d+'</div>'+
      '<div class="day-meal">'+escapeHTML(plan.text||'休息')+'</div>'+
      '</div>';
  });
  $('#fitnessPlan').innerHTML = html;
}

function renderFitnessLog(){
  const entries = Object.entries(state.fitness.logs).sort().reverse().slice(0,14);
  if(!entries.length){ $('#fitnessLog').innerHTML = '<div class="log-item"><span class="log-date">暂无记录</span></div>'; return; }
  let html = '';
  entries.forEach(([d,r])=>{
    const ds = new Date(d).toLocaleDateString('zh-CN',{month:'short',day:'numeric',weekday:'short'});
    html += '<div class="log-item"><span class="log-date">'+ds+'</span><span class="log-value">'+r.duration+'min'+(r.type?' · '+r.type:'')+(r.content?' · '+escapeHTML(r.content):'')+'</span></div>';
  });
  $('#fitnessLog').innerHTML = html;
}

function setupFitness(){
  $('#fitnessAddRecord').addEventListener('click',()=>{
    const d = parseInt($('#fitnessDuration').value)||0;
    const t = $('#fitnessType').value;
    const c = $('#fitnessContent').value.trim();
    state.fitness.logs[today()] = {duration:d,type:t,content:c};
    saveState(); renderFitness();
  });

  $('#jumpScoreSave').addEventListener('click',()=>{
    state.fitness.jumpScores[today()] = parseInt($('#jumpScore').value)||5;
    saveState();
    alert('弹跳自评已保存！每周记录一次，观察趋势。');
  });

  $('#fitnessPlan').addEventListener('click',e=>{
    const day = e.target.closest('.week-day');
    if(!day) return;
    const idx = Array.from(day.parentElement.children).indexOf(day) + 1;
    const current = state.fitness.plan[idx].text || '';
    const txt = prompt('编辑周'+weekDayName(idx)+'的训练：', current);
    if(txt!==null){
      state.fitness.plan[idx].text = txt;
      saveState(); renderFitness();
    }
  });
}

/* ===== 缝纫遛狗 ===== */
/* ===== 小狗 ===== */
function renderDog(){
  $('#dogName').value = state.dog.name || '';
  $('#dogVaccine').value = state.dog.vaccine || '';

  const key = 'dog_'+today();
  const ck = state.dog.checklist[key] || {};
  const checkItems = $$('#dogChecklist .check-item input');
  checkItems.forEach(cb=>{
    cb.checked = !!ck[cb.dataset.key];
  });
}

function setupDog(){
  $('#dogSaveInfo').addEventListener('click',()=>{
    state.dog.name = $('#dogName').value.trim();
    state.dog.vaccine = $('#dogVaccine').value;
    saveState();
  });
  $$('#dogChecklist .check-item input').forEach(cb=>{
    cb.addEventListener('change',()=>{
      const key = 'dog_'+today();
      if(!state.dog.checklist[key]) state.dog.checklist[key] = {};
      state.dog.checklist[key][cb.dataset.key] = cb.checked;
      saveState();
    });
  });
}

/* ===== 缝纫 ===== */
function renderSewing(){
  renderSewingList();
  renderFabricGrid();
  renderWishGrid();
}

function renderSewingList(){
  let html = '';
  state.sewing.projects.forEach((p,i)=>{
    html += '<div class="sewing-item">'+
      '<div><div class="sewing-name">'+escapeHTML(p.name)+'</div><div class="sewing-step">'+escapeHTML(p.step||'')+'</div></div>'+
      '<button data-sew-del="'+i+'" title="删除">&times;</button>'+
      '</div>';
  });
  if(!html) html = '<div class="empty-hint">暂无项目，开始缝点什么吧</div>';
  $('#sewingList').innerHTML = html;
}

// --- 图片压缩（localStorage 友好，max 50KB） ---
function compressImage(file, maxW=400, quality=0.6){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = ()=>{
      const img = new Image();
      img.onload = ()=>{
        const w = Math.min(img.width, maxW);
        const h = Math.round(img.height*(w/img.width));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img,0,0,w,h);
        resolve(canvas.toDataURL('image/jpeg',quality));
      };
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function showPreview(previewId, file){
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    const el = document.getElementById(previewId);
    if(el){
      el.innerHTML = '<img src="'+reader.result+'" alt="预览">';
      el.style.display = 'block';
    }
  };
  reader.readAsDataURL(file);
}

// --- 我的布料 ---
function renderFabricGrid(){
  if(!state.sewing.fabrics) state.sewing.fabrics = [];
  if(!state.sewing.fabrics.length){
    $('#fabricGrid').innerHTML = '<div class="empty-hint">还没有记录布料，拍一张吧</div>';
    return;
  }
  let html = '<div class="stitch-grid">';
  state.sewing.fabrics.forEach((f,i)=>{
    html += '<div class="stitch-card">'+
      (f.image ? '<div class="stitch-img"><img src="'+f.image+'" alt="'+escapeHTML(f.name)+'"></div>' : '<div class="stitch-img no-img">📷 无图片</div>')+
      '<div class="stitch-info">'+
        '<div class="stitch-title">'+escapeHTML(f.name)+'</div>'+
        (f.notes ? '<div class="stitch-note">'+escapeHTML(f.notes)+'</div>' : '')+
        '<div class="stitch-date">'+f.createdAt+'</div>'+
      '</div>'+
      '<button class="stitch-del" data-fab-del="'+i+'">&times;</button>'+
    '</div>';
  });
  html += '</div>';
  $('#fabricGrid').innerHTML = html;
}

// --- 想做的东西 ---
function renderWishGrid(){
  if(!state.sewing.wishlist) state.sewing.wishlist = [];
  if(!state.sewing.wishlist.length){
    $('#wishGrid').innerHTML = '<div class="empty-hint">还没想好做什么？存个灵感吧</div>';
    return;
  }
  let html = '<div class="stitch-grid">';
  state.sewing.wishlist.forEach((w,i)=>{
    html += '<div class="stitch-card">'+
      (w.image ? '<div class="stitch-img"><img src="'+w.image+'" alt="'+escapeHTML(w.title)+'"></div>' : '<div class="stitch-img no-img">📷 无图片</div>')+
      '<div class="stitch-info">'+
        '<div class="stitch-title">'+escapeHTML(w.title)+'</div>'+
        (w.desc ? '<div class="stitch-note">'+escapeHTML(w.desc)+'</div>' : '')+
        '<div class="stitch-date">'+w.createdAt+'</div>'+
      '</div>'+
      '<button class="stitch-del" data-wish-del="'+i+'">&times;</button>'+
    '</div>';
  });
  html += '</div>';
  $('#wishGrid').innerHTML = html;
}

function setupSewing(){
  $('#sewingAdd').addEventListener('click',()=>{
    const name = $('#sewingInput').value.trim();
    if(!name) return;
    state.sewing.projects.push({name:name,step:$('#sewingStep').value.trim()});
    saveState();
    $('#sewingInput').value='';$('#sewingStep').value='';
    renderSewing();
  });
  $('#sewingList').addEventListener('click',e=>{
    if(e.target.matches('[data-sew-del]')){
      state.sewing.projects.splice(parseInt(e.target.dataset.sewDel),1);
      saveState(); renderSewing();
    }
  });

  // --- 布料 ---
  $('#fabricPhoto').addEventListener('change',function(){
    if(this.files && this.files[0]) showPreview('fabricPreview',this.files[0]);
  });
  $('#fabricAdd').addEventListener('click',async function(){
    const name = $('#fabricName').value.trim();
    if(!name) return;
    const file = document.querySelector('#fabricPhoto').files[0];
    let image = '';
    if(file){ image = await compressImage(file); }
    state.sewing.fabrics.push({name,image,notes:$('#fabricNotes').value.trim(),createdAt:today()});
    saveState();
    $('#fabricName').value=''; $('#fabricPhoto').value=''; $('#fabricNotes').value='';
    const pv = document.getElementById('fabricPreview');
    if(pv){ pv.style.display='none'; pv.innerHTML=''; }
    renderSewing();
  });
  $('#fabricGrid').addEventListener('click',e=>{
    if(e.target.matches('[data-fab-del]')){
      state.sewing.fabrics.splice(parseInt(e.target.dataset.fabDel),1);
      saveState(); renderSewing();
    }
  });

  // --- 想做的东西 ---
  $('#wishPhoto').addEventListener('change',function(){
    if(this.files && this.files[0]) showPreview('wishPreview',this.files[0]);
  });
  $('#wishAdd').addEventListener('click',async function(){
    const title = $('#wishTitle').value.trim();
    if(!title) return;
    const file = document.querySelector('#wishPhoto').files[0];
    let image = '';
    if(file){ image = await compressImage(file); }
    state.sewing.wishlist.push({title,image,desc:$('#wishDesc').value.trim(),createdAt:today()});
    saveState();
    $('#wishTitle').value=''; $('#wishPhoto').value=''; $('#wishDesc').value='';
    const pv = document.getElementById('wishPreview');
    if(pv){ pv.style.display='none'; pv.innerHTML=''; }
    renderSewing();
  });
  $('#wishGrid').addEventListener('click',e=>{
    if(e.target.matches('[data-wish-del]')){
      state.sewing.wishlist.splice(parseInt(e.target.dataset.wishDel),1);
      saveState(); renderSewing();
    }
  });
}

/* ===== 短视频 ===== */
function renderVideo(){
  if(!state.video) state.video = {projects:[]};
  if(!state.video.projects) state.video.projects = [];
  let html = '';
  state.video.projects.forEach((p,i)=>{
    html += '<div class="sewing-item">'+
      '<div><div class="sewing-name">'+escapeHTML(p.name)+'</div>'+
      (p.topic ? '<div class="sewing-step">选题：'+escapeHTML(p.topic)+'</div>' : '')+
      (p.notes ? '<div class="sewing-step">'+escapeHTML(p.notes)+'</div>' : '')+
      '</div>'+
      '<button data-vid-del="'+i+'" title="删除">&times;</button>'+
      '</div>';
  });
  if(!html) html = '<div class="empty-hint">暂无视频项目，开始你的第一个创作吧</div>';
  $('#videoList').innerHTML = html;
}

function setupVideo(){
  $('#videoAdd').addEventListener('click',()=>{
    const name = $('#videoInput').value.trim();
    if(!name) return;
    if(!state.video) state.video = {projects:[]};
    state.video.projects.push({
      name, topic:$('#videoTopic').value.trim(),
      notes:$('#videoNotes').value.trim(), createdAt:today()
    });
    saveState();
    $('#videoInput').value=''; $('#videoTopic').value=''; $('#videoNotes').value='';
    renderVideo();
  });
  $('#videoList').addEventListener('click',e=>{
    if(e.target.matches('[data-vid-del]')){
      state.video.projects.splice(parseInt(e.target.dataset.vidDel),1);
      saveState(); renderVideo();
    }
  });
}

/* ===== 写小说 ===== */
function renderNovel(){
  if(!state.novel) state.novel = {projects:[]};
  if(!state.novel.projects) state.novel.projects = [];
  let html = '';
  state.novel.projects.forEach((p,i)=>{
    html += '<div class="sewing-item">'+
      '<div><div class="sewing-name">'+escapeHTML(p.name)+'</div>'+
      (p.genre ? '<div class="sewing-step">类型：'+escapeHTML(p.genre)+'</div>' : '')+
      (p.words || p.goal ? '<div class="sewing-step">字数：'+(p.words||'0')+' / '+(p.goal||'未设')+'</div>' : '')+
      (p.outline ? '<div class="sewing-step">大纲：'+escapeHTML(p.outline)+'</div>' : '')+
      '</div>'+
      '<button data-nov-del="'+i+'" title="删除">&times;</button>'+
      '</div>';
  });
  if(!html) html = '<div class="empty-hint">暂无小说项目，写下你的第一个故事吧</div>';
  $('#novelList').innerHTML = html;
}

function setupNovel(){
  $('#novelAdd').addEventListener('click',()=>{
    const name = $('#novelInput').value.trim();
    if(!name) return;
    if(!state.novel) state.novel = {projects:[]};
    state.novel.projects.push({
      name, genre:$('#novelGenre').value.trim(),
      words:$('#novelWords').value.trim(), goal:$('#novelGoal').value.trim(),
      outline:$('#novelOutline').value.trim(), createdAt:today()
    });
    saveState();
    $('#novelInput').value=''; $('#novelGenre').value=''; $('#novelWords').value='';
    $('#novelGoal').value=''; $('#novelOutline').value='';
    renderNovel();
  });
  $('#novelList').addEventListener('click',e=>{
    if(e.target.matches('[data-nov-del]')){
      state.novel.projects.splice(parseInt(e.target.dataset.novDel),1);
      saveState(); renderNovel();
    }
  });
}

/* ===== 随心记 ===== */
function renderMemo(){
  $('#memoDate').textContent = nowDateString();
  const td = today();
  if(!state.memo) state.memo = {entries:{}};
  const entry = state.memo.entries[td] || '';
  $('#memoInput').value = entry;
  $('#memoSaved').textContent = entry ? '已保存' : '';

  // 历史记录（除今天外）
  const dates = Object.keys(state.memo.entries).filter(d=>d!==td).sort().reverse();
  if(dates.length){
    let html = '';
    dates.forEach(d=>{
      const txt = (state.memo.entries[d]||'').trim();
      if(!txt) return;
      const preview = txt.replace(/\n/g,' ').substring(0,60)+(txt.length>60?'...':'');
      html += `<details class="memo-history-item">
        <summary>${d} · ${preview}</summary>
        <pre class="memo-preview">${escapeHTML(txt)}</pre>
      </details>`;
    });
    $('#memoHistory').innerHTML = html || '<div class="material-empty">还没有历史记录</div>';
  }else{
    $('#memoHistory').innerHTML = '<div class="material-empty">还没有历史记录</div>';
  }
}

let _memoDebounce = null;
function setupMemo(){
  $('#memoInput').addEventListener('input',()=>{
    $('#memoSaved').textContent = '保存中...';
    clearTimeout(_memoDebounce);
    _memoDebounce = setTimeout(()=>{
      if(!state.memo) state.memo = {entries:{}};
      const td = today();
      const val = $('#memoInput').value;
      if(val.trim()){
        state.memo.entries[td] = val;
      }else{
        delete state.memo.entries[td];
      }
      saveState();
      $('#memoSaved').textContent = '已保存';
      renderMemo(); // 刷新历史列表
    }, 600);
  });
}

/* ===== 设置 ===== */
function renderSettings(){}

/* 字体缩放 */
const FONT_SIZES = ['14px','15px','16px','18px','20px'];
const FONT_LABELS = ['小','偏小','标准','偏大','大'];

function applyFontScale(scale){
  document.documentElement.style.fontSize = FONT_SIZES[scale];
  state.fontScale = scale;
  saveState();
  // 更新控件状态
  const labelEl = $('#fontScaleLabel');
  const dots = document.querySelectorAll('#fontScaleDots .font-scale-dot');
  if(labelEl) labelEl.textContent = FONT_LABELS[scale];
  dots.forEach((d,i)=>d.classList.toggle('active', i===scale));
}

function setupSettings(){
  $('#exportData').addEventListener('click',()=>{
    const blob = new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'workbench-backup-'+today()+'.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  $('#importData').addEventListener('change',e=>{
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(){
      try{
        const data = JSON.parse(reader.result);
        if(!data.meta){ alert('无效的数据文件'); return; }
        if(!confirm('导入将覆盖当前所有数据，确认继续？')) return;
        state = deepMerge(defaultState(), data);
        saveState();
        alert('数据已导入，页面即将刷新。');
        location.reload();
      }catch(err){ alert('导入失败：'+err.message); }
    };
    reader.readAsText(file);
  });
  $('#resetData').addEventListener('click',()=>{
    if(!confirm('确认重置所有数据？此操作不可恢复！')) return;
    if(!confirm('再次确认：删除所有论文、考公、健身、食谱数据？')) return;
    state = defaultState();
    saveState();
    location.reload();
  });
  $('#refreshMaterial').addEventListener('click',()=>{
    localStorage.removeItem('wb_material_'+today());
    renderMaterialLibrary();
    alert('素材已刷新。');
  });
  // 素材面板内的刷新按钮
  const materialRefreshBtn = $('#materialRefreshBtn');
  if(materialRefreshBtn){
    materialRefreshBtn.addEventListener('click',()=>{
      localStorage.removeItem('wb_material_'+currentMaterialDate);
      selectMaterialDate(currentMaterialDate);
    });
  }
  // 字体缩放
  $('#fontScaleUp').addEventListener('click',()=>{
    if(state.fontScale < 4) applyFontScale(state.fontScale + 1);
  });
  $('#fontScaleDown').addEventListener('click',()=>{
    if(state.fontScale > 0) applyFontScale(state.fontScale - 1);
  });
  // 点击圆点直接跳档
  document.querySelectorAll('#fontScaleDots .font-scale-dot').forEach((dot,i)=>{
    dot.addEventListener('click',()=>applyFontScale(i));
    dot.style.cursor = 'pointer';
  });
}

/* ===== 每日清理 ===== */
function dailyCleanup(){
  const lastClean = localStorage.getItem('wb_last_clean');
  if(lastClean !== today()){
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    const cutoffStr = cutoff.getFullYear()+'-'+pad(cutoff.getMonth()+1)+'-'+pad(cutoff.getDate());
    const newDC = {};
    Object.keys(state.dog.checklist||{}).forEach(k=>{
      const d = k.replace('dog_','').replace('dc_','');
      if(d >= cutoffStr) newDC[k] = state.dog.checklist[k];
    });
    state.dog.checklist = newDC;
    localStorage.setItem('wb_last_clean', today());
    saveState();
  }
}

/* ===== 每30秒刷新看板时间线（让当前slot高亮变化） ===== */
function startTimeRefresh(){
  setInterval(()=>{
    if($('#view-dashboard') && $('#view-dashboard').classList.contains('active')){
      renderTimeline();
    }
  }, 30000);
}

/* ===== Service Worker ===== */
function registerSW(){
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
}

/* ===== PWA 安装 ===== */
let deferredPrompt;
let promptFired = false;

// 已安装（standalone 模式）则隐藏所有安装引导
if(window.matchMedia('(display-mode: standalone)').matches){
  document.getElementById('installGuide')?.remove();
  document.getElementById('installBanner')?.remove();
}

window.addEventListener('beforeinstallprompt',(e)=>{
  e.preventDefault();
  deferredPrompt = e;
  promptFired = true;
  if(!localStorage.getItem('shedo_install_dismissed')){
    setTimeout(()=>{
      const b = $('#installBanner'); if(b) b.classList.add('show');
    }, 1500);
  }
});

// 如果 beforeinstallprompt 超过 5 秒没触发，直接显示引导横幅
setTimeout(()=>{
  if(!promptFired && !localStorage.getItem('shedo_install_dismissed')){
    const b = $('#installBanner'); if(b) b.classList.add('show');
  }
}, 5000);

async function doInstall(){
  if(deferredPrompt){
    deferredPrompt.prompt();
    const {outcome} = await deferredPrompt.userChoice;
    if(outcome==='accepted'){
      localStorage.setItem('shedo_install_dismissed','1');
      const b = $('#installBanner'); if(b) b.classList.remove('show');
      const g = $('#installGuide'); if(g) g.remove();
    }
    deferredPrompt = null;
  } else {
    alert('请按下面的手动步骤操作：\n\n① 用 Chrome 浏览器打开\n② 点右上角 ⋮\n③ 选择「添加到主屏幕」\n④ 确认即可');
  }
}

const ib = $('#installBtn'); if(ib) ib.addEventListener('click', doInstall);
const mi = $('#manualInstall'); if(mi) mi.addEventListener('click', doInstall);

const id = $('#installDismiss'); if(id) id.addEventListener('click',()=>{
  const b = $('#installBanner'); if(b) b.classList.remove('show');
  localStorage.setItem('shedo_install_dismissed','1');
});

window.addEventListener('appinstalled',()=>{
  const b = $('#installBanner'); if(b) b.classList.remove('show');
  const g = $('#installGuide'); if(g) g.remove();
  localStorage.setItem('shedo_install_dismissed','1');
});

/* ===== 初始化 ===== */
function init(){
  loadState();
  applyFontScale(state.fontScale || 2);
  dailyCleanup();
  setupNav();
  setupThesis();
  setupExam();
  setupMeal();
  setupFitness();
  setupDog();
  setupSewing();
  setupVideo();
  setupNovel();
  setupMemo();
  setupSettings();
  setupDashboardChecklist();
  renderDashboard();
  registerSW();
  startTimeRefresh();
  // 恢复上次浏览的板块
  const lastView = localStorage.getItem('shedo_view');
  if(lastView && lastView !== 'dashboard') navigate(lastView);
  // 显示版本号
  const vt = document.getElementById('versionTag');
  if(vt) vt.textContent = 'v'+APP_VERSION;
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init);
}else{
  init();
}

})();
