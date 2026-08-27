// pages/exercise-add/exercise-add.js
const store = require('../../utils/storage.js');

Page({
  data: {
    typeKeys: [],
    typeLabels: [],
    typeIndex: 0,
    intensityList: ['低', '中', '高'],
    intensityIndex: 1,
    duration: '',
    calories: '',
    note: ''
  },

  onLoad() {
    const keys = Object.keys(store.EXERCISE_TYPES);
    const labels = keys.map(k => store.EXERCISE_TYPES[k]);
    this.setData({ typeKeys: keys, typeLabels: labels });
  },

  onType(e) { this.setData({ typeIndex: e.detail.value }); },
  onIntensity(e) { this.setData({ intensityIndex: e.detail.value }); },
  onDuration(e) { this.setData({ duration: e.detail.value }); },
  onCalories(e) { this.setData({ calories: e.detail.value }); },
  onNote(e) { this.setData({ note: e.detail.value }); },

  save() {
    const { typeKeys, typeLabels, typeIndex, intensityList, intensityIndex, duration, calories, note } = this.data;
    if (!duration) { wx.showToast({ title: '请输入运动时长', icon: 'none' }); return; }
    const ex = {
      type: typeKeys[typeIndex],
      duration: Number(duration),
      intensity: intensityList[intensityIndex],
      calories: calories ? Number(calories) : 0,
      note
    };
    store.addExercise(ex);
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 700);
  }
});
