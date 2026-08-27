// pages/exercise/exercise.js
const store = require('../../utils/storage.js');
const util = require('../../utils/util.js');

Page({
  data: {
    filter: 'all',
    typeOptions: [],
    list: [],
    totalDuration: 0,
    totalCalories: 0,
    totalTimes: 0
  },

  onLoad() {
    const typeOptions = [{ key: 'all', label: '全部' }].concat(
      Object.keys(store.EXERCISE_TYPES).map(k => ({ key: k, label: store.EXERCISE_TYPES[k] }))
    );
    this.setData({ typeOptions });
    this.load();
  },

  onShow() { this.load(); },
  onPullDownRefresh() { this.load(); wx.stopPullDownRefresh(); },

  load() {
    let list = store.getExercises();
    if (this.data.filter !== 'all') {
      list = list.filter(e => e.type === this.data.filter);
    }
    list = list.map(e => Object.assign({}, e, {
      typeLabel: store.EXERCISE_TYPES[e.type] || e.type,
      timeText: util.fromNow(e.ts),
      dateText: e.date
    }));
    const totalDuration = list.reduce((s, e) => s + (e.duration || 0), 0);
    const totalCalories = list.reduce((s, e) => s + (e.calories || 0), 0);
    this.setData({
      list, totalDuration, totalCalories, totalTimes: list.length
    });
  },

  switchFilter(e) {
    this.setData({ filter: e.currentTarget.dataset.key });
    this.load();
  },

  goAdd() { wx.navigateTo({ url: '/pages/exercise-add/exercise-add' }); },

  del(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除记录', content: '确认删除该条运动记录？',
      success: (res) => {
        if (res.confirm) {
          store.deleteExercise(id);
          this.load();
          wx.showToast({ title: '已删除', icon: 'none' });
        }
      }
    });
  }
});
