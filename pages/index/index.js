// pages/index/index.js
const app = getApp();
const store = require('../../utils/storage.js');
const util = require('../../utils/util.js');

Page({
  data: {
    greeting: '',
    dateText: '',
    profile: {},
    steps: 0,
    stepGoal: 8000,
    stepPct: 0,
    ringDeg: 0,
    water: 0,
    waterGoal: 2000,
    waterPct: 0,
    sleep: 0,
    sleepGoal: 8,
    exCal: 0,
    exDuration: 0,
    vitals: [],
    weightTrend: [],
    weightMax: 100,
    weightMin: 50,
    meds: []
  },

  onLoad() {
    this.refresh();
  },

  onShow() {
    this.refresh();
  },

  onPullDownRefresh() {
    this.refresh();
    wx.stopPullDownRefresh();
  },

  refresh() {
    const h = new Date().getHours();
    const greeting = h < 6 ? '凌晨好' : h < 11 ? '早上好' : h < 14 ? '中午好' : h < 18 ? '下午好' : '晚上好';
    const dateText = util.formatDate().replace(/-/g, '/');

    const profile = store.getProfile();
    const goals = profile.goals;

    const stepsRec = store.todaySteps();
    const steps = stepsRec ? stepsRec.value : 0;
    const stepGoal = goals.steps;
    const stepPct = Math.min(100, Math.round((steps / stepGoal) * 100));
    const ringDeg = Math.round((steps / stepGoal) * 360);

    const water = store.todayWater();
    const waterGoal = goals.water;
    const waterPct = Math.min(100, Math.round((water / waterGoal) * 100));

    const sleepRec = store.latestRecord('sleep');
    const sleep = sleepRec ? sleepRec.value : 0;

    const ex = store.todayExercise();

    // 最新关键指标
    const vitals = this.buildVitals();

    // 体重趋势（7天）
    const wt = store.trendByDay('weight', 7).map(d => ({
      date: d.date.slice(5).replace('-', '/'),
      value: d.value,
      label: d.date.slice(8)
    }));
    const vals = wt.map(w => w.value).filter(v => v !== null);
    const wmax = Math.max.apply(null, vals.concat([0])) + 0.6;
    const wmin = Math.min.apply(null, vals.concat([1000])) - 0.6;

    const meds = store.getMeds().map(m => Object.assign({}, m, {
      taken: store.isMedTaken(m.id)
    })).slice(0, 4);

    this.setData({
      greeting, dateText, profile,
      steps, stepGoal, stepPct, ringDeg,
      water, waterGoal, waterPct,
      sleep, sleepGoal,
      exCal: ex.calories, exDuration: ex.duration,
      vitals, weightTrend: wt, weightMax: wmax, weightMin: wmin,
      meds
    });
  },

  buildVitals() {
    const fmt = (r, label, unit, value, value2, level) => {
      if (!r) return { label, unit, value: '—', status: '无数据', cls: 'tag-mid' };
      let txt = value2 != null ? value + '/' + value2 : '' + value;
      return { label, unit, value: txt, status: level.text, cls: level.cls, sub: util.fromNow(r.ts) };
    };
    const bp = store.latestRecord('bloodPressure');
    const hr = store.latestRecord('heartRate');
    const wt = store.latestRecord('weight');
    const gl = store.latestRecord('glucose');

    return [
      fmt(wt, '体重', 'kg', wt ? wt.value : null, null, { text: wt ? '正常' : '无数据', cls: wt ? 'tag-good' : 'tag-mid' }),
      fmt(bp, '血压', 'mmHg', bp ? bp.value : null, bp ? bp.value2 : null, this.bpLevel(bp)),
      fmt(hr, '心率', 'bpm', hr ? hr.value : null, null, this.hrLevel(hr)),
      fmt(gl, '血糖', 'mmol/L', gl ? gl.value : null, null, this.glLevel(gl))
    ];
  },

  bpLevel(r) {
    if (!r) return { text: '无数据', cls: 'tag-mid' };
    const s = r.value, d = r.value2;
    if (s < 120 && d < 80) return { text: '理想', cls: 'tag-good' };
    if (s < 130 && d < 85) return { text: '正常', cls: 'tag-good' };
    if (s < 140 && d < 90) return { text: '偏高', cls: 'tag-mid' };
    return { text: '高血压', cls: 'tag-bad' };
  },
  hrLevel(r) {
    if (!r) return { text: '无数据', cls: 'tag-mid' };
    const v = r.value;
    if (v >= 60 && v <= 100) return { text: '正常', cls: 'tag-good' };
    if (v < 60) return { text: '偏慢', cls: 'tag-mid' };
    return { text: '偏快', cls: 'tag-mid' };
  },
  glLevel(r) {
    if (!r) return { text: '无数据', cls: 'tag-mid' };
    const v = r.value;
    if (v >= 3.9 && v <= 6.1) return { text: '正常', cls: 'tag-good' };
    if (v < 3.9) return { text: '偏低', cls: 'tag-bad' };
    return { text: '偏高', cls: 'tag-mid' };
  },

  goRecord(e) {
    const type = e.currentTarget.dataset.type;
    if (!type) {
      wx.switchTab({ url: '/pages/record/record' });
    } else {
      wx.navigateTo({ url: '/pages/record-add/record-add?type=' + type });
    }
  },

  goExercise() { wx.switchTab({ url: '/pages/exercise/exercise' }); },
  goMed() { wx.switchTab({ url: '/pages/medication/medication' }); },
  goReport() { wx.navigateTo({ url: '/pages/report/report' }); },

  tapMed(e) {
    const id = e.currentTarget.dataset.id;
    const taken = store.toggleMedTaken(id);
    wx.showToast({ title: taken ? '已记录服药' : '已取消', icon: 'none' });
    this.refresh();
  }
});
