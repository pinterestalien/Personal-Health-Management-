// pages/profile/profile.js
const store = require('../../utils/storage.js');

Page({
  data: {
    profile: {},
    weight: null,
    bmi: 0,
    bmiText: '',
    bmiCls: '',
    recordCount: 0,
    exerciseCount: 0,
    medCount: 0,
    goals: {}
  },

  onShow() { this.load(); },
  onPullDownRefresh() { this.load(); wx.stopPullDownRefresh(); },

  load() {
    const profile = store.getProfile();
    const weight = store.latestRecord('weight');
    let bmi = 0, bmiText = '暂无体重', bmiCls = 'tag-mid';
    if (weight && profile.height) {
      const h = profile.height / 100;
      bmi = (weight.value / (h * h)).toFixed(1);
      const n = Number(bmi);
      if (n < 18.5) { bmiText = '偏瘦'; bmiCls = 'tag-mid'; }
      else if (n < 24) { bmiText = '正常'; bmiCls = 'tag-good'; }
      else if (n < 28) { bmiText = '超重'; bmiCls = 'tag-mid'; }
      else { bmiText = '肥胖'; bmiCls = 'tag-bad'; }
    }
    this.setData({
      profile, weight, bmi, bmiText, bmiCls,
      recordCount: store.getRecords().length,
      exerciseCount: store.getExercises().length,
      medCount: store.getMeds().length,
      goals: profile.goals
    });
  },

  goEdit() { wx.navigateTo({ url: '/pages/profile-edit/profile-edit' }); },
  goReport() { wx.navigateTo({ url: '/pages/report/report' }); },

  clearData() {
    wx.showModal({
      title: '清空数据',
      content: '将删除全部记录、用药与资料，且不可恢复，确认继续？',
      confirmColor: '#E8604D',
      success: (res) => {
        if (!res.confirm) return;
        try {
          wx.clearStorageSync();
          wx.showToast({ title: '已清空', icon: 'success' });
          store.seedIfEmpty();
          setTimeout(() => this.load(), 600);
        } catch (e) {
          wx.showToast({ title: '清空失败', icon: 'none' });
        }
      }
    });
  },

  about() {
    wx.showModal({
      title: '关于健康管家',
      content: '一款轻量个人健康管理小程序，本地记录体重、血压、心率、睡眠、运动与用药，所有数据仅保存在本机。\n\n版本 v1.0.0',
      showCancel: false
    });
  }
});
