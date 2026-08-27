// pages/weight/weight.js
const store = require('../../utils/storage.js');
const util = require('../../utils/util.js');

Page({
  data: {
    profile: {},
    currentWeight: null,
    targetWeight: 65,
    diff: null,
    recommend: {},
    mealPlan: { breakfast: {}, lunch: {}, dinner: {} },
    weightTrend: [],
    wMax: 1,
    wMin: 0,
    tips: []
  },

  onLoad() { this.load(); },
  onShow() { this.load(); },
  onPullDownRefresh() { this.load(); wx.stopPullDownRefresh(); },

  load() {
    const profile = store.getProfile();
    const latest = store.latestRecord('weight');
    const currentWeight = latest ? latest.value : null;
    const targetWeight = profile.goals.weight;
    const diff = currentWeight ? (currentWeight - targetWeight).toFixed(1) : null;

    const recommend = store.recommendCalories(profile);
    const mealPlan = store.getMealPlan(recommend.level);

    // 体重趋势
    const wt = store.trendByDay('weight', 7).map(d => ({
      date: d.date.slice(5).replace('-', '/'),
      value: d.value
    }));
    const vals = wt.map(w => w.value).filter(v => v !== null);
    const wmax = vals.length ? Math.max.apply(null, vals) + 0.5 : 100;
    const wmin = vals.length ? Math.min.apply(null, vals) - 0.5 : 50;

    // 根据趋势生成提示
    const tips = this.buildTips(recommend, currentWeight, targetWeight);

    this.setData({
      profile,
      currentWeight,
      targetWeight,
      diff,
      recommend,
      mealPlan,
      weightTrend: wt,
      wMax: wmax,
      wMin: wmin,
      tips
    });
  },

  buildTips(recommend, current, target) {
    const tips = [];
    const levelMap = { light: '减脂期', normal: '维持期', heavy: '增肌/恢复期' };
    const trendMap = { gain: '近期体重呈上升趋势', loss: '近期体重呈下降趋势', stable: '近期体重相对稳定' };

    if (!current) {
      tips.push({ icon: '⚠️', text: '暂无体重记录，点击右上角快速记录当前体重以启动分析。' });
      return tips;
    }

    tips.push({
      icon: '📊',
      text: trendMap[recommend.trend] + '，系统建议您处于【' + levelMap[recommend.level] + '】，每日热量目标 ' + recommend.target + ' kcal。'
    });

    if (current >= target) {
      tips.push({
        icon: '💡',
        text: '距离目标还有 ' + (current - target).toFixed(1) + ' kg，控制饮食 + 适度运动可加速达成目标。'
      });
    } else {
      tips.push({
        icon: '💪',
        text: '已低于目标体重 ' + (target - current).toFixed(1) + ' kg，请注意营养补充与力量训练。'
      });
    }

    tips.push({
      icon: '🍽️',
      text: '三餐建议已根据 ' + recommend.level + ' 热量等级生成，可根据个人口味调整。'
    });

    return tips;
  },

  goAddWeight() {
    wx.navigateTo({ url: '/pages/record-add/record-add?type=weight' });
  },

  refreshPlan() {
    const mealPlan = store.getMealPlan(this.data.recommend.level);
    this.setData({ mealPlan });
    wx.showToast({ title: '已为您生成新食谱', icon: 'none' });
  },

  goRecord(type) {
    wx.navigateTo({ url: '/pages/record-add/record-add?type=' + type });
  }
});
