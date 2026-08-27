// pages/report/report.js
const store = require('../../utils/storage.js');
const util = require('../../utils/util.js');

Page({
  data: {
    period: '近7天',
    avgWeight: 0,
    avgSteps: 0,
    avgSleep: 0,
    weightTrend: [],
    stepsTrend: [],
    sleepTrend: [],
    wMax: 1, wMin: 0,
    sMax: 1, sMin: 0,
    slMax: 1, slMin: 0,
    exCount: 0,
    exDuration: 0,
    exCalories: 0,
    tips: []
  },

  onLoad() { this.load(); },

  load() {
    const days7 = util.recentDays(7);

    // 各指标趋势（按天，取当天最新）
    const buildTrend = (type) => {
      const recs = store.getRecords(type);
      return days7.map(date => {
        const dr = recs.filter(r => r.date === date).sort((a, b) => b.ts - a.ts)[0];
        return { date: date.slice(5).replace('-', '/'), value: dr ? dr.value : null };
      });
    };

    const weightTrend = buildTrend('weight');
    const stepsTrend = buildTrend('steps');
    const sleepTrend = buildTrend('sleep');

    const avg = (arr) => {
      const vals = arr.map(d => d.value).filter(v => v != null);
      return vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length * 10) / 10 : 0;
    };

    const range = (arr) => {
      const vals = arr.map(d => d.value).filter(v => v != null);
      if (!vals.length) return [0, 1];
      let mx = Math.max.apply(null, vals);
      let mn = Math.min.apply(null, vals);
      const span = mx - mn || mx * 0.1 || 1;
      return [mx + span * 0.15, mn - span * 0.15];
    };

    const [wMax, wMin] = range(weightTrend);
    const [sMax, sMin] = range(stepsTrend);
    const [slMax, slMin] = range(sleepTrend);

    // 近7天运动
    const exList = store.getExercises().filter(e => days7.indexOf(e.date) >= 0);
    const exDuration = exList.reduce((s, e) => s + (e.duration || 0), 0);
    const exCalories = exList.reduce((s, e) => s + (e.calories || 0), 0);

    this.setData({
      avgWeight: avg(weightTrend),
      avgSteps: avg(stepsTrend),
      avgSleep: avg(sleepTrend),
      weightTrend, stepsTrend, sleepTrend,
      wMax, wMin, sMax, sMin, slMax, slMin,
      exCount: exList.length, exDuration, exCalories,
      tips: this.buildTips(avg(weightTrend), avg(stepsTrend), avg(sleepTrend), exList.length)
    });
  },

  buildTips(w, s, sl, ex) {
    const tips = [];
    if (s < 6000) tips.push({ icon: '🏃', text: '步数偏少，建议每日步行 6000 步以上，可改善心肺功能。' });
    else tips.push({ icon: '✅', text: '步数达标，保持规律运动有助于维持健康体重。' });
    if (sl < 7) tips.push({ icon: '😴', text: '睡眠不足 7 小时，建议调整作息，保证 7-9 小时睡眠。' });
    else tips.push({ icon: '✅', text: '睡眠时长充足，规律作息有助于身体恢复。' });
    if (ex < 3) tips.push({ icon: '💪', text: '本周运动次数偏少，建议每周至少 3 次中等强度运动。' });
    else tips.push({ icon: '✅', text: '运动频率良好，注意热身与拉伸以防受伤。' });
    if (w) tips.push({ icon: '⚖️', text: '近期平均体重 ' + w + ' kg，结合身高可评估 BMI 是否在正常区间。' });
    tips.push({ icon: '💧', text: '记得少量多次饮水，每日 1500-2000ml 为宜。' });
    return tips;
  }
});
