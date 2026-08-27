// pages/profile-edit/profile-edit.js
const store = require('../../utils/storage.js');

Page({
  data: {
    name: '',
    genderList: ['未设置', '男', '女'],
    genderIndex: 0,
    age: '',
    height: '',
    steps: '',
    water: '',
    sleep: '',
    weight: ''
  },

  onLoad() {
    const p = store.getProfile();
    this.setData({
      name: p.name,
      genderIndex: Math.max(0, this.data.genderList.indexOf(p.gender)),
      age: p.age ? String(p.age) : '',
      height: p.height ? String(p.height) : '',
      steps: String(p.goals.steps),
      water: String(p.goals.water),
      sleep: String(p.goals.sleep),
      weight: String(p.goals.weight)
    });
  },

  onName(e) { this.setData({ name: e.detail.value }); },
  onGender(e) { this.setData({ genderIndex: e.detail.value }); },
  onAge(e) { this.setData({ age: e.detail.value }); },
  onHeight(e) { this.setData({ height: e.detail.value }); },
  onSteps(e) { this.setData({ steps: e.detail.value }); },
  onWater(e) { this.setData({ water: e.detail.value }); },
  onSleep(e) { this.setData({ sleep: e.detail.value }); },
  onWeight(e) { this.setData({ weight: e.detail.value }); },

  save() {
    const { name, genderList, genderIndex, age, height, steps, water, sleep, weight } = this.data;
    if (!name) { wx.showToast({ title: '请输入昵称', icon: 'none' }); return; }
    const app = getApp();
    store.setProfile({
      name,
      gender: genderList[genderIndex],
      age: age ? Number(age) : 0,
      height: height ? Number(height) : 0,
      goals: {
        steps: Number(steps) || 8000,
        water: Number(water) || 2000,
        sleep: Number(sleep) || 8,
        weight: Number(weight) || 65
      }
    });
    app.globalData.goals = store.getGoals();
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 700);
  }
});
