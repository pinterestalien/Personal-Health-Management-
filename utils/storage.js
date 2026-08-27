// utils/storage.js — 本地数据持久化与示例数据

const util = require('./util.js');

const K = {
  RECORDS: 'health_records',
  EXERCISES: 'exercises',
  MEDS: 'medications',
  MEDLOG: 'med_log',
  PROFILE: 'profile',
  PERIOD: 'periods',
  SEEDED: 'seeded_v1'
};

/* ---------- 经期常量 ---------- */
const FLOW = { light: '量少', normal: '正常', heavy: '量多' };
const SYMPTOMS = ['痛经', '腰酸', '腹胀', '情绪波动', '乳房胀痛', '疲劳', '头痛', '痤疮', '失眠', '食欲变化'];
const DEFAULT_CYCLE = 28;   // 默认周期天数
const DEFAULT_PERIOD = 5;   // 默认行经期天数

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

  // 经期（近三个月）
  const today = new Date();
  const d1 = new Date(today); d1.setDate(today.getDate() - 58);
  const d2 = new Date(today); d2.setDate(today.getDate() - 30);
  const e1 = new Date(d1); e1.setDate(d1.getDate() + 5);
  const e2 = new Date(d2); e2.setDate(d2.getDate() + 6);
  addPeriod({ startDate: util.formatDate(d1), endDate: util.formatDate(e1), flow: 'normal', symptoms: ['痛经', '腰酸'], note: '第一天不适' });
  addPeriod({ startDate: util.formatDate(d2), endDate: util.formatDate(e2), flow: 'normal', symptoms: ['情绪波动', '疲劳'], note: '' });

  set(K.SEEDED, true);
}

/* ---------- 经期数据与周期计算 ---------- */

/** 日期加减天数，返回 YYYY-MM-DD */
function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return util.formatDate(d);
}

/** 两个日期相差天数（b - a，可为负） */
function dayDiff(a, b) {
  const da = new Date(a + 'T00:00:00').getTime();
  const db = new Date(b + 'T00:00:00').getTime();
  return Math.round((db - da) / 86400000);
}

function getPeriods() {
  return get(K.PERIOD, []).sort((a, b) => a.startDate.localeCompare(b.startDate));
}

function addPeriod(p) {
  const all = get(K.PERIOD, []);
  const item = Object.assign({ id: util.uid(), ts: util.now(), endDate: '', flow: 'normal', symptoms: [], note: '' }, p);
  all.push(item);
  set(K.PERIOD, all);
  return item;
}

function updatePeriod(id, patch) {
  const all = get(K.PERIOD, []).map(m => m.id === id ? Object.assign({}, m, patch) : m);
  set(K.PERIOD, all);
}

function deletePeriod(id) {
  set(K.PERIOD, get(K.PERIOD, []).filter(m => m.id !== id));
}

/** 最近一次经期（按开始日期） */
function lastPeriod() {
  const list = getPeriods();
  return list.length ? list[list.length - 1] : null;
}

/** 平均周期长度（天）；不足两次记录时返回默认值 */
function avgCycleLength() {
  const list = getPeriods();
  if (list.length < 2) return DEFAULT_CYCLE;
  const diffs = [];
  for (let i = 1; i < list.length; i++) {
    diffs.push(dayDiff(list[i - 1].startDate, list[i].startDate));
  }
  return Math.round(diffs.reduce((s, v) => s + v, 0) / diffs.length);
}

/** 预测下一次经期开始日期 */
function predictedNextStart() {
  const last = lastPeriod();
  if (!last) return null;
  return addDays(last.startDate, avgCycleLength());
}

/** 预测排卵日（下次经期前 14 天） */
function predictedOvulation() {
  const next = predictedNextStart();
  return next ? addDays(next, -14) : null;
}

/** 易孕窗口：排卵前 5 天 ~ 排卵后 1 天 */
function fertileWindow() {
  const ovu = predictedOvulation();
  if (!ovu) return null;
  return { start: addDays(ovu, -5), end: addDays(ovu, 1), ovulation: ovu };
}

/**
 * 当前经期状态
 * @param {string} today YYYY-MM-DD
 * @returns phase/cycleDay/nextStart/ovulation/periodLen/inPeriod
 */
function cycleStatus(today) {
  today = today || util.formatDate();
  const last = lastPeriod();
  const cycle = avgCycleLength();
  const next = last ? addDays(last.startDate, cycle) : null;
  const ovu = next ? addDays(next, -14) : null;
  const fertile = ovu ? { start: addDays(ovu, -5), end: addDays(ovu, 1) } : null;

  let phase = '安全期';
  let phaseKey = 'safe';
  let cycleDay = 0;
  let inPeriod = false;
  let periodLen = 0;

  if (last) {
    const periodEnd = last.endDate || addDays(last.startDate, DEFAULT_PERIOD - 1);
    periodLen = dayDiff(last.startDate, periodEnd) + 1;
    cycleDay = dayDiff(last.startDate, today) + 1;

    if (today < last.startDate) {
      phase = '预计经期'; phaseKey = 'safe';
    } else if (today <= periodEnd) {
      phase = '经期中'; phaseKey = 'period'; inPeriod = true;
    } else if (fertile && today >= fertile.start && today <= fertile.end) {
      phase = ovu && today === ovu ? '排卵日' : '易孕期';
      phaseKey = 'fertile';
    } else {
      const ovuDayOfCycle = cycle - 14;
      if (cycleDay < ovuDayOfCycle - 5) { phase = '卵泡期'; phaseKey = 'safe'; }
      else { phase = '黄体期'; phaseKey = 'luteal'; }
    }
  }

  // 距下次经期天数（已过则提示已推迟）
  let nextCountdown = next ? dayDiff(today, next) : null;

  return {
    hasData: !!last,
    phase, phaseKey,
    cycleDay, inPeriod, periodLen,
    cycleLen: cycle,
    nextStart: next,
    nextCountdown,
    ovulation: ovu,
    fertile
  };
}

/** 获取某月日历的经期标记（返回该月属于经期的日期集合） */
function periodDaysInRange(from, to) {
  const all = getPeriods();
  const set = {};
  all.forEach(p => {
    if (!p.startDate) return;
    const end = p.endDate || addDays(p.startDate, DEFAULT_PERIOD - 1);
    let cur = p.startDate;
    let guard = 0;
    while (cur <= end && cur <= to && cur >= from && guard < 30) {
      set[cur] = true;
      cur = addDays(cur, 1);
      guard++;
    }
  });
  return set;
}

/* ---------- 体重管理与饮食推荐 ---------- */

const MEAL_PLANS = {
  light: {
    breakfast: [
      { name: '全麦吐司配水煮蛋', cal: 320, items: '全麦吐司1片, 水煮蛋1个, 无糖黑咖啡1杯' },
      { name: '燕麦粥配草莓', cal: 280, items: '即食燕麦40g, 草莓5颗, 脱脂牛奶150ml' }
    ],
    lunch: [
      { name: '鸡胸肉沙拉碗', cal: 450, items: '煎鸡胸肉100g, 混合蔬菜150g, 油醋汁' },
      { name: '糙米饭配清蒸鱼', cal: 520, items: '糙米饭80g, 清蒸鲈鱼100g, 西兰花200g' }
    ],
    dinner: [
      { name: '豆腐蔬菜汤', cal: 200, items: '嫩豆腐100g, 菠菜100g, 虾皮少许' },
      { name: '水煮虾与凉拌黄瓜', cal: 250, items: '基围虾100g, 黄瓜150g, 蒜末醋汁' }
    ]
  },
  normal: {
    breakfast: [
      { name: '牛奶燕麦谷物碗', cal: 450, items: '燕麦50g, 牛奶250ml, 坚果15g, 蓝莓20g' },
      { name: '鸡蛋三明治', cal: 500, items: '全麦面包2片, 鸡蛋1个, 生菜番茄, 低脂沙拉酱' }
    ],
    lunch: [
      { name: '黑椒牛肉饭', cal: 650, items: '糙米饭100g, 黑椒牛柳120g, 时令蔬菜200g' },
      { name: '番茄意面', cal: 600, items: '全麦意面80g, 番茄酱100g, 肉末50g, 罗勒' }
    ],
    dinner: [
      { name: '三文鱼藜麦碗', cal: 550, items: '烤三文鱼100g, 藜麦50g, 烤蔬菜200g' },
      { name: '蒜蓉西兰花配鸡胸', cal: 480, items: '西兰花200g, 煎鸡胸80g, 蒜蓉, 米饭80g' }
    ]
  },
  heavy: {
    breakfast: [
      { name: '高蛋白能量碗', cal: 700, items: '燕麦60g, 牛奶300ml, 鸡蛋2个, 香蕉1根, 花生酱20g' },
      { name: '巨无霸三明治', cal: 750, items: '全麦面包3片, 鸡蛋2个, 鸡胸肉50g, 奶酪, 生菜番茄' }
    ],
    lunch: [
      { name: '双层牛肉堡', cal: 900, items: '全麦汉堡1个, 牛肉饼150g, 奶酪, 生菜番茄, 烤红薯1个' },
      { name: '大份铁板牛肉饭', cal: 850, items: '米饭200g, 铁板牛肉150g, 洋葱青椒, 味增汤' }
    ],
    dinner: [
      { name: '烤全鸡配土豆', cal: 750, items: '烤鸡腿2个, 烤土豆150g, 烤蔬菜200g' },
      { name: '三文鱼排配烩饭', cal: 700, items: '三文鱼排100g, 蘑菇烩饭150g, 芦笋' }
    ]
  }
};

function calcBMR(profile) {
  const { gender, age, height } = profile;
  const latestW = latestRecord('weight');
  const weight = latestW ? latestW.value : (profile.goals ? profile.goals.weight : 65);
  if (!weight || !height || !age) return 1500;
  if (gender === '女') {
    return Math.round(10 * weight + 6.25 * height - 5 * age - 161);
  } else {
    return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
  }
}

function recommendCalories(profile) {
  const bmr = calcBMR(profile);
  const tdee = Math.round(bmr * 1.375);
  const recent30 = trendByDay('weight', 30).filter(d => d.value !== null);
  let trend = 'stable';
  if (recent30.length >= 7) {
    const half = Math.floor(recent30.length / 2);
    const firstAvg = recent30.slice(0, half).reduce((s, d) => s + d.value, 0) / half;
    const lastAvg = recent30.slice(half).reduce((s, d) => s + d.value, 0) / (recent30.length - half);
    const diff = lastAvg - firstAvg;
    if (diff > 0.2) trend = 'gain';
    else if (diff < -0.2) trend = 'loss';
  }

  let target = tdee;
  let level = 'normal';
  if (trend === 'gain') {
    target = tdee - 500;
    level = 'light';
  } else if (trend === 'loss') {
    target = tdee + 200;
    level = 'heavy';
  }

  const status = cycleStatus();
  if (status.hasData && (status.inPeriod || status.phaseKey === 'luteal')) {
    target += 200;
    if (level === 'light') level = 'normal';
  }

  target = Math.max(1200, Math.min(3200, target));
  return { bmr, tdee, target, level, trend };
}

function getMealPlan(level) {
  const plan = MEAL_PLANS[level] || MEAL_PLANS.normal;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  return {
    breakfast: pick(plan.breakfast),
    lunch: pick(plan.lunch),
    dinner: pick(plan.dinner)
  };
}

module.exports = {
  K, METRICS, EXERCISE_TYPES,
  FLOW, SYMPTOMS, DEFAULT_CYCLE, DEFAULT_PERIOD,
  getRecords, addRecord, deleteRecord, latestRecord, recentRecords, trendByDay,
  getExercises, addExercise, deleteExercise,
  getMeds, addMed, updateMed, deleteMed,
  getMedLog, toggleMedTaken, isMedTaken,
  getPeriods, addPeriod, updatePeriod, deletePeriod, lastPeriod,
  avgCycleLength, predictedNextStart, predictedOvulation, fertileWindow,
  cycleStatus, periodDaysInRange, addDays, dayDiff,
  calcBMR, recommendCalories, getMealPlan, MEAL_PLANS,
  getProfile, setProfile, getGoals,
  todayExercise, todayWater, todaySteps,
  seedIfEmpty
};
