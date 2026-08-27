// pages/record-add/record-add.js
const store = require('../../utils/storage.js');
const util = require('../../utils/util.js');

Page({
  data: {
    type: 'weight',
    metric: {},
    value: '',
    value2: '',
    note: '',
    date: '',
    today: ''
  },

  onLoad(options) {
    const type = options.type || 'weight';
    const metric = store.METRICS[type];
    this.setData({
      type, metric,
      date: util.formatDate(),
      today: util.formatDate()
    });
    wx.setNavigationBarTitle({ title: '添加' + metric.label });
  },

  onVal(e) { this.setData({ value: e.detail.value }); },
  onVal2(e) { this.setData({ value2: e.detail.value }); },
  onNote(e) { this.setData({ note: e.detail.value }); },
  onDate(e) { this.setData({ date: e.detail.value }); },

  save() {
    const { type, metric, value, value2, note, date } = this.data;
    if (value === '') {
      wx.showToast({ title: '请输入' + metric.label, icon: 'none' });
      return;
    }
    const rec = { type, value: Number(value), note, date };
    if (type === 'bloodPressure') {
      if (value2 === '') { wx.showToast({ title: '请输入舒张压', icon: 'none' }); return; }
      rec.value = Number(value);
      rec.value2 = Number(value2);
    }
    store.addRecord(rec);
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 700);
  }
});
