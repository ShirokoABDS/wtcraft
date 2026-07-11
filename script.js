<script>
/* ============================================================
 *  Wtcaraft · 主页脚本
 *  连接信息（前端硬编码，玩家直连用）：
 *    Java版    zdy.wtstu.us.ci:10165
 *    基岩版    160.202.254.29:19132
 *  API（仅供状态展示，非玩家连接用）：
 *    INFO    = http://160.202.254.29:10158/open-api/info
 *    MONITOR = http://160.202.254.29:10158/open-api/monitor
 *    PLAYERS = http://160.202.254.29:10158/open-api/players
 * ============================================================ */

const JAVA_ADDR     = 'zdy.wtstu.us.ci:10165';
const BEDROCK_ADDR   = '160.202.254.29:19132';
const API_BASE       = 'http://160.202.254.29:10158' ;
const INFO_API       = API_BASE + '/open-api/info';
const MONITOR_API    = API_BASE + '/open-api/monitor';
const PLAYERS_API    = API_BASE + '/open-api/players';

/* ===== 主题 ===== */
const root = document.documentElement;
const stored = localStorage.getItem('wt-theme');
if (stored) root.setAttribute('data-theme', stored);
document.getElementById('themeToggle').addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('wt-theme', next);
});

/* ===== Toast ===== */
const toast = document.getElementById('toast');
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

/* ===== 复制地址 ===== */
function copyText(text, label) {
  const msg = label ? `已复制 · ${label}` : '已复制到剪贴板';
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast(msg + ' ' + text));
  } else {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); showToast(msg + ' ' + text); } catch(e) {}
    document.body.removeChild(ta);
  }
}
document.getElementById('copyIpJava').addEventListener('click', () => copyText(JAVA_ADDR, 'Java版地址'));
document.getElementById('copyIpBedrock').addEventListener('click', () => copyText(BEDROCK_ADDR, '基岩版地址'));
document.getElementById('navIp').addEventListener('click', e => { e.preventDefault(); copyText(JAVA_ADDR, 'Java版地址'); });

/* ===== IntersectionObserver ===== */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('is-in'); });
}, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('.fade-up, .hero, section').forEach(el => io.observe(el));

/* ===== Polaroid 旋转 ===== */
document.querySelectorAll('.polaroid').forEach(p => {
  const r = p.dataset.rotation || (Math.random() - 0.5) * 24;
  p.style.transform = `rotate(${r}deg)`;
});

/* ===== 工具函数 ===== */
function formatBytes(bytes) {
  if (bytes == null || isNaN(bytes)) return { value: '—', unit: 'B' };
  const units = ['B','KB','MB','GB','TB','PB'];
  let i = 0; let v = Number(bytes);
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return { value: v.toFixed(v >= 100 ? 0 : (v >= 10 ? 1 : 2)), unit: units[i] };
}

function formatIngameTime(ticks) {
  if (ticks == null || isNaN(ticks)) return '—';
  let t = ((ticks % 24000) + 24000) % 24000;
  const hours = (Math.floor(t / 1000) + 6) % 24;
  const mins = Math.floor((t % 1000) / 1000 * 60);
  const hh = String(hours).padStart(2,'0');
  const mm = String(mins).padStart(2,'0');
  const phase = (hours >= 6 && hours < 18) ? '白天' : '黑夜';
  return `${hh}:${mm} <span class="unit">${phase}</span>`;
}

function extractJavaVersion(s) {
  if (!s) return '—';
  const m = s.match(/(\d+(?:\.\d+)+)/);
  if (m) return 'Java ' + m[1];
  return s.length > 40 ? s.slice(0,40) + '…' : s;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text == null ? '—' : String(text);
}
function setHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

/* ===== 游戏内时间 · 实时刷新 ===== */
let ingameTimeBase = null;
let ingameTimeAt   = null;

function tickIngameClock() {
  if (ingameTimeBase == null || ingameTimeAt == null) return;
  const elapsedSec = (Date.now() - ingameTimeAt) / 1000;
  const advancedTicks = elapsedSec * 20;
  const currentTicks = ingameTimeBase + advancedTicks;
  setHTML('statIngameTime', formatIngameTime(currentTicks));
}
setInterval(tickIngameClock, 1000);

/* ===== info API ===== */
async function fetchInfo() {
  try {
    const res = await fetch(INFO_API, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    renderInfo(data);
    return true;
  } catch (err) {
    console.warn('[info] fetch failed:', err.message);
    renderInfoError();
    return false;
  }
}

function renderInfo(d) {
  const online = (d.uptime != null && d.uptime > 0);
  setHTML('statStatus', online
    ? '<span class="status-pill"><span class="pulse"></span>在线</span>'
    : '<span class="status-pill offline"><span class="pulse"></span>离线</span>');
  setText('statStatusSub', online ? 'service online · API reachable' : 'service offline');
  const navDot = document.getElementById('navStatusDot');
  if (navDot) navDot.classList.toggle('offline', !online);

  // port
  const port = d.port;
  setHTML('statPort', `${port == null ? '—' : port}<span class="unit">port</span>`);
  setText('statPortSub', `Java 游戏端口 · 基岩 19132`);

  // 游戏内时间
  if (d.ingameTime != null) {
    ingameTimeBase = d.ingameTime;
    ingameTimeAt = Date.now();
    tickIngameClock();
    const ts = new Date();
    const hh = String(ts.getHours()).padStart(2,'0');
    const mm = String(ts.getMinutes()).padStart(2,'0');
    setText('statIngameTimeSub', `last calibrated · ${hh}:${mm}`);
  }

  // ===== system =====
  const sys = d.system || {};
  setText('sysOs', sys.os || '—');
  setText('sysOsSub', 'os · version');
  setText('sysArch', sys.arch || '—');
  setText('sysArchSub', 'cpu architecture');
  const mem = formatBytes(sys.memory);
  setHTML('sysMem', `${mem.value}<span class="dim">${mem.unit}</span>`);
  setText('sysMemSub', 'total system memory');
  setText('sysJava', extractJavaVersion(sys.java));
  setText('sysJavaSub', 'jre version');

  window.__SYS_MEM = (sys.memory && sys.memory > 0) ? sys.memory : null;
}

function renderInfoError() {
  setHTML('statStatus', '<span class="api-err"><span class="dot"></span>API 不可达</span>');
  setText('statStatusSub', 'fetch /open-api/info failed');
  const navDot = document.getElementById('navStatusDot');
  if (navDot) navDot.classList.add('offline');
  if (ingameTimeBase == null) {
    setHTML('statIngameTime', '—');
    setText('statIngameTimeSub', '等待 API 校准');
  }
}

/* ===== monitor API ===== */
const HISTORY_LEN = 60;
const history = { tps: [], cpu: [], mem: [] };

async function fetchMonitor() {
  try {
    const res = await fetch(MONITOR_API, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    renderMonitor(data);
    return true;
  } catch (err) {
    console.warn('[monitor] fetch failed:', err.message);
    renderMonitorError();
    return false;
  }
}

function renderMonitor(d) {
  const now = new Date();
  const ts = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0') + ':' + String(now.getSeconds()).padStart(2,'0');

  // TPS
  const tps = (typeof d.tps === 'number') ? d.tps : null;
  const tpsPct = tps == null ? 0 : Math.max(0, Math.min(100, (tps / 20) * 100));
  setHTML('tpsBig', `${tps == null ? '—' : tps.toFixed(2)}<span class="unit">/ 20.0</span>`);
  setText('tpsMeta', `${ts} · 60s`);
  let tpsHint = '理想 20.0';
  if (tps != null) {
    if (tps >= 19.5) tpsHint = '极佳 · 服务流畅';
    else if (tps >= 18) tpsHint = '良好 · 轻微负载';
    else if (tps >= 15) tpsHint = '一般 · 建议排查';
    else tpsHint = '较差 · 需要处理';
  }
  setText('tpsSub', tpsHint);
  const tpsBar = document.getElementById('tpsBar');
  if (tpsBar) tpsBar.style.width = tpsPct + '%';

  // CPU 占用
  const cpu = (typeof d.cpu === 'number') ? d.cpu : null;
  const cpuPct = cpu == null ? 0 : Math.max(0, Math.min(100, cpu));
  setHTML('cpuBig', `${cpu == null ? '—' : cpu.toFixed(1)}<span class="unit">%</span>`);
  setText('cpuMeta', `${ts} · 60s`);
  let cpuHint = '所有核心平均';
  if (cpu != null) {
    if (cpu < 30) cpuHint = '空闲 · 负载低';
    else if (cpu < 60) cpuHint = '正常 · 负载适中';
    else if (cpu < 85) cpuHint = '偏忙 · 负载较高';
    else cpuHint = '紧张 · 负载很高';
  }
  setText('cpuSub', cpuHint);
  const cpuBar = document.getElementById('cpuBar');
  if (cpuBar) cpuBar.style.width = cpuPct + '%';

  // Memory
  let memPct = null;
  let memDisplay = '—';
  const memRaw = (typeof d.memory === 'number') ? d.memory : null;
  if (memRaw != null) {
    if (memRaw <= 100) {
      memPct = memRaw;
      memDisplay = memRaw.toFixed(1);
    } else {
      const sysMem = window.__SYS_MEM;
      if (sysMem && sysMem > 0) {
        memPct = (memRaw / sysMem) * 100;
        const used = formatBytes(memRaw);
        const total = formatBytes(sysMem);
        memDisplay = `${used.value}${used.unit} / ${total.value}${total.unit}`;
      } else {
        const used = formatBytes(memRaw);
        memDisplay = `${used.value}${used.unit}`;
        memPct = 50;
      }
    }
  }
  memPct = memPct == null ? 0 : Math.max(0, Math.min(100, memPct));
  setHTML('memBig', memRaw == null ? '—<span class="unit">%</span>' : (memRaw <= 100 ? `${memDisplay}<span class="unit">%</span>` : `${memDisplay}`));
  setText('memMeta', `${ts} · 60s`);
  let memHint = '已用 / 总量';
  if (memPct > 0) {
    if (memPct < 50) memHint = '充裕 · 余量充足';
    else if (memPct < 75) memHint = '正常 · 使用适中';
    else if (memPct < 90) memHint = '偏紧 · 需关注';
    else memHint = '紧张 · 需处理';
  }
  setText('memSub', memHint);
  const memBar = document.getElementById('memBar');
  if (memBar) memBar.style.width = memPct + '%';

  // 历史 + sparkline
  history.tps.push(tps == null ? 0 : (tps / 20) * 100);
  history.cpu.push(cpuPct);
  history.mem.push(memPct);
  if (history.tps.length > HISTORY_LEN) history.tps.shift();
  if (history.cpu.length > HISTORY_LEN) history.cpu.shift();
  if (history.mem.length > HISTORY_LEN) history.mem.shift();
  renderSpark('tpsSpark', history.tps);
  renderSpark('cpuSpark', history.cpu);
  renderSpark('memSpark', history.mem);
}

function renderMonitorError() {
  setHTML('tpsBig', '—<span class="unit">/ 20.0</span>');
  setText('tpsMeta', 'fetch failed');
  setText('tpsSub', 'API 不可达');
  setHTML('cpuBig', '—<span class="unit">%</span>');
  setText('cpuMeta', 'fetch failed');
  setText('cpuSub', 'API 不可达');
  setHTML('memBig', '—<span class="unit">%</span>');
  setText('memMeta', 'fetch failed');
  setText('memSub', 'API 不可达');
}

function renderSpark(svgId, data) {
  const svg = document.getElementById(svgId);
  if (!svg) return;
  const line = svg.querySelector('path.line');
  const area = svg.querySelector('path.area');
  if (!line) return;
  const W = 200, H = 48, pad = 4;
  if (data.length === 0) { line.setAttribute('d',''); if(area) area.setAttribute('d',''); return; }
  const step = data.length > 1 ? W / (data.length - 1) : 0;
  let d = '';
  data.forEach((v, i) => {
    const x = i * step;
    const y = H - pad - (Math.max(0, Math.min(100, v)) / 100) * (H - pad * 2);
    d += (i === 0 ? `M${x.toFixed(1)},${y.toFixed(1)}` : ` L${x.toFixed(1)},${y.toFixed(1)}`);
  });
  line.setAttribute('d', d);
  if (area) {
    const lastX = (data.length - 1) * step;
    area.setAttribute('d', d + ` L${lastX.toFixed(1)},${H} L0,${H} Z`);
  }
}

/* ===== players API（主页仅取统计数字 + 头像） ===== */
async function fetchPlayers() {
  try {
    const res = await fetch(PLAYERS_API, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const players = Array.isArray(data.players) ? data.players : [];
    const onlineList = players.filter(p => p.isOnline);
    const online = onlineList.length;
    const total = players.length;

    setHTML('peOnline', online > 0
      ? `<span class="accent">${online}</span>`
      : '<span class="placeholder">0</span>');
    setHTML('peTotal', total > 0 ? total : '<span class="placeholder">—</span>');

    // 今日峰值：localStorage 跨页共享，key 含日期，跨天清零
    const today = new Date().toISOString().slice(0, 10);
    const key = 'wt-peak-' + today;
    let peak = parseInt(localStorage.getItem(key) || '0', 10);
    if (online > peak) { peak = online; localStorage.setItem(key, String(peak)); }
    setHTML('pePeak', peak > 0 ? peak : '<span class="placeholder">—</span>');

    // 头像 stack：取在线玩家的真实皮肤头像（前5个）
    const avatars = ['heroAv1','heroAv2','heroAv3','heroAv4','heroAv5'];
    avatars.forEach((id, i) => {
      const img = document.getElementById(id);
      if (!img) return;
      const p = onlineList[i];
      if (p && p.uuid) {
        img.src = `https://mc-heads.net/avatar/${p.uuid}/240` ;
        img.onerror = function() {
          this.onerror = null;
          this.src = `https://crafatar.com/avatars/${p.uuid}?size=240&overlay` ;
        };
      }
    });
    return true;
  } catch (err) {
    console.warn('[players] fetch failed:', err.message);
    // 失败时保持占位符不变
    return false;
  }
}

/* ===== 启动 ===== */
fetchInfo();
fetchMonitor();
fetchPlayers();
setInterval(fetchInfo, 60000);
setInterval(fetchMonitor, 5000);
setInterval(fetchPlayers, 60000);   // 跟 info 同频，省一次请求

/* ============================================================
 *  反代方案（若 API 端无法开启 CORS）
 *  nginx:
 *  location /api/info    { proxy_pass http://160.202.254.29:10158/open-api/info ; }
 *  location /api/monitor { proxy_pass http://160.202.254.29:10158/open-api/monitor ; }
 *  location /api/players { proxy_pass http://160.202.254.29:10158/open-api/players ; }
 *  然后改常量：
 *    const INFO_API    = '/api/info';
 *    const MONITOR_API = '/api/monitor';
 *    const PLAYERS_API = '/api/players';
 * ============================================================ */
</script>