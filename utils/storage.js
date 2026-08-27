// utils/storage.js — 本地数据持久化与示例数据

const util = require('./util.js');

const K = {
  RECORDS: 'health_records',
  EXERCISES: 'exercises',
  MEDS: 'medications',
  MEDLOG: 'med_log',
  PROFILE: 'profile',
  SEEDED: 'seeded_v1'
};

function get(key, fallback) {
  try {
    const v = wx.getStorageSync(key);
    return v === '' || v === undefined ? fallback : v;
  } catch (e) {
    return fallback;
  }
}

function set(key, value) {
  try {
    wx.setStorageSync(key, value);
  } catch (e) {
    console.error('storage set failed', key, e);
  }
}

/* ---------- 健康指标记录 ---------- */

// 指标类型定义
const METRICS = {
  weight:        { label: '体重',    unit: 'kg',   icon: '⚖️',  field: 'value' },
  bloodPressure: { label: '血压',    unit: 'mmHg', icon: '❤️',  field: 'value2' },
  heartRate:     { label: '心率',    unit: 'bpm',  icon: '💓',  field: 'value' },
  sleep:         { label: '睡眠',    unit: 'h',    icon: '😴',  field: 'value' },
  steps:         { label: '步数',    unit: '步',   icon: '🏃',  field: 'value' },
  glucose:       { label: '血糖',    unit: 'mmol/L', icon: '🩸', field: 'value' },
  water:         { label: '饮水',    unit: 'ml',   icon: '💧',  field: 'value' },
  temperature:   { label: '体温',    unit: '°C',   icon: '🌡️',  field: 'value' }
};

function getRecords(type) {
  const all = get(K.RECORDS, []);
  return type ? all.filter(r => r.type === type) : all;
}

function addRecord(rec) {
  const all = get(K.RECORDS, []);
  const item = Object.assign({ id: util.uid(), ts: util.now(), date: util.formatDate() }, rec);
  all.push(item);
  set(K.RECORDS, all);
  return item;
}

function deleteRecord(id) {
  const all = get(K.RECORDS, []).filter(r => r.id !== id);
  set(K.RECORDS, all);
}

/** 取某指标最新一条 */
function latestRecord(type) {
  const list = getRecords(type).sort((a, b) => b.ts - a.ts);
  return list[0] || null;
}

/** 取某指标最近 n 条（按时间倒序） */
function recentRecords(type, n) {
  const list = getRecords(type).sort((a, b) => b.ts - a.ts);
  return n ? list.slice(0, n) : list;
}

/** 取某指标最近 n 天每天最新值，用于趋势图 */
function trendByDay(type, days) {
  const days7 = util.recentDays(days);
  const recs = getRecords(type);
  return days7.map(date => {
    const dayRecs = recs.filter(r => r.date === date).sort((a, b) => b.ts - a.ts);
    return { date, value: dayRecs[0] ? dayRecs[0].value : null };
  });
}

/* ---------- 运动记录 ---------- */

const EXERCISE_TYPES = {
  run: '跑步',
  walk: '步行',
  cycle: '骑行',
  swim: '游泳',
  yoga: '瑜伽',
  gym: '力量训练',
  ball: '球类',
  other: '其他'
};

function getExercises() {
  return get(K.EXERCISES, []).sort((a, b) => b.ts - a.ts);
}

function addExercise(ex) {
  const all = get(K.EXERCISES, []);
  const item = Object.assign({ id: util.uid(), ts: util.now(), date: util.formatDate() }, ex);
  all.push(item);
  set(K.EXERCISES, all);
  return item;
}

function deleteExercise(id) {
  set(K.EXERCISES, get(K.EXERCISES, []).filter(e => e.id !== id));
}

/* ---------- 用药提醒 ---------- */

function getMeds() {
  return get(K.MEDS, []).sort((a, b) => b.ts - a.ts);
}

function addMed(med) {
  const all = get(K.MEDS, []);
  const item = Object.assign({ id: util.uid(), ts: util.now(), enabled: true }, med);
  all.push(item);
  set(K.MEDS, all);
  return item;
}

function updateMed(id, patch) {
  const all = get(K.MEDS, []).map(m => m.id === id ? Object.assign({}, m, patch) : m);
  set(K.MEDS, all);
}

function deleteMed(id) {
  set(K.MEDS, get(K.MEDS, []).filter(m => m.id !== id));
}

/** 当日服药打卡记录 */
function getMedLog() {
  return get(K.MEDLOG, []);
}

function toggleMedTaken(medId, date) {
  date = date || util.formatDate();
  const log = get(K.MEDLOG, []);
  const idx = log.findIndex(l => l.medId === medId && l.date === date);
  if (idx >= 0) {
    log.splice(idx, 1);
  } else {
    log.push({ id: util.uid(), medId, date, ts: util.now() });
  }
  set(K.MEDLOG, log);
  return idx < 0; // 返回当前是否已服
}

function isMedTaken(medId, date) {
  date = date || util.formatDate();
  return get(K.MEDLOG, []).some(l => l.medId === medId && l.date === date);
}

/* ---------- 个人资料与目标 ---------- */

function getProfile() {
  return get(K.PROFILE, {
    name: '健康用户',
    gender: '未设置',
    age: 30,
    height: 170,
    goals: { steps: 8000, water: 2000, sleep: 8, weight: 65 }
  });
}

function setProfile(patch) {
  const cur = getProfile();
  set(K.PROFILE, Object.assign({}, cur, patch));
}

function getGoals() {
  return getProfile().goals;
}

/* ---------- 汇总统计 ---------- */

/** 今日运动时长与卡路里 */
function todayExercise() {
  const today = util.formatDate();
  const list = get(K.EXERCISES, []).filter(e => e.date === today);
  const duration = list.reduce((s, e) => s + (e.duration || 0), 0);
  const calories = list.reduce((s, e) => s + (e.calories || 0), 0);
  return { count: list.length, duration, calories };
}

/** 今日饮水总量 */
function todayWater() {
  const today = util.formatDate();
  return getRecords('water').filter(r => r.date === today).reduce((s, r) => s + (r.value || 0), 0);
}

/** 今日步数（取最新） */
function todaySteps() {
  return latestRecord('steps');
}

/* ---------- 示例数据 ---------- */

function seedIfEmpty() {
  if (get(K.SEEDED, false)) return;

  const today = new Date();
  const days7 = util.recentDays(7);

  // 体重趋势
  const weightBase = 66.2;
  days7.forEach((date, i) => {
    addRecord({
      type: 'weight', value: +(weightBase - i * 0.15 + (Math.random() - 0.5) * 0.2).toFixed(1),
      note: '', date
    });
  });

  // 血压
  addRecord({ type: 'bloodPressure', value: 122, value2: 80, note: '晨起测量' });
  addRecord({ type: 'bloodPressure', value: 128, value2: 82, note: '傍晚测量', ts: util.now() - 43200000 });

  // 心率
  addRecord({ type: 'heartRate', value: 72, note: '静息心率' });
  addRecord({ type: 'heartRate', value: 88, note: '运动后', ts: util.now() - 86400000 });

  // 睡眠
  days7.forEach((date) => {
    addRecord({ type: 'sleep', value: +(6.5 + Math.random() * 2).toFixed(1), note: '', date });
  });

  // 步数
  days7.forEach((date) => {
    addRecord({ type: 'steps', value: Math.floor(4500 + Math.random() * 6000), note: '', date });
  });

  // 饮水
  addRecord({ type: 'water', value: 250, note: '早晨' });
  addRecord({ type: 'water', value: 350, note: '上午' });
  addRecord({ type: 'water', value: 500, note: '午餐后' });

  // 血糖
  addRecord({ type: 'glucose', value: 5.4, note: '空腹' });

  // 运动
  addExercise({ type: 'walk', duration: 35, intensity: '中', calories: 130, note: '公园快走' });
  addExercise({ type: 'gym', duration: 50, intensity: '高', calories: 280, note: '上肢训练', ts: util.now() - 86400000 });
  addExercise({ type: 'run', duration: 40, intensity: '高', calories: 360, note: '晨跑 5km', ts: util.now() - 172800000 });

  // 用药
  addMed({ name: '维生素D', dosage: '1粒', time: '08:00', frequency: '每日一次', note: '餐后服用' });
  addMed({ name: '鱼油', dosage: '2粒', time: '20:00', frequency: '每日一次', note: '随餐' });

  set(K.SEEDED, true);
}

module.exports = {
  K, METRICS, EXERCISE_TYPES,
  getRecords, addRecord, deleteRecord, latestRecord, recentRecords, trendByDay,
  getExercises, addExercise, deleteExercise,
  getMeds, addMed, updateMed, deleteMed,
  getMedLog, toggleMedTaken, isMedTaken,
  getProfile, setProfile, getGoals,
  todayExercise, todayWater, todaySteps,
  seedIfEmpty
};
