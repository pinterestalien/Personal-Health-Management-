// pages/record/record.js
const store = require('../../utils/storage.js');
const util = require('../../utils/util.js');

Page({
  data: {
    tabs: [],
    active: 'weight',
    metric: {},
    records: [],
    trend: [],
    trendMax: 1,
    trendMin: 0
  },

  onLoad() {
    const tabs = Object.keys(store.METRICS).map(k => ({
      key: k,
      label: store.METRICS[k].label,
      icon: store.METRICS[k].icon
    }));
    this.setData({ tabs });
    this.load(this.data.active);
  },

  onShow() { this.load(this.data.active); },
  onPullDownRefresh() { this.load(this.data.active); wx.stopPullDownRefresh(); },

  load(type) {
    const metric = store.METRICS[type];
    const all = store.getRecords(type).sort((a, b) => b.ts - a.ts);
    const recs = all.map(r => Object.assign({}, r, {
      timeText: util.fromNow(r.ts),
      valueText: r.value2 != null ? r.value + '/' + r.value2 : '' + r.value,
      dateText: r.date
    }));

    // 趋势：最近 7 条按时间正序
    const trend7 = all.slice(0, 7).reverse().map(r => ({
      value: r.value,
      label: r.date.slice(5).replace('-', '/')
    }));
    const vals = trend7.map(t => t.value).filter(v => v != null);
    let tmax = Math.max.apply(null, vals.concat([0]));
    let tmin = Math.min.apply(null, vals.concat([tmax]));
    const span = tmax - tmin || 1;
    tmax += span * 0.15; tmin -= span * 0.15;

    this.setData({
      active: type, metric, records: recs,
      trend: trend7, trendMax: tmax, trendMin: tmin
    });
  },

  switchTab(e) {
    const key = e.currentTarget.dataset.key;
    this.load(key);
  },

  goAdd() {
    wx.navigateTo({ url: '/pages/record-add/record-add?type=' + this.data.active });
  },

  delRecord(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除记录', content: '确认删除该条记录？',
      success: (res) => {
        if (res.confirm) {
          store.deleteRecord(id);
          this.load(this.data.active);
          wx.showToast({ title: '已删除', icon: 'none' });
        }
      }
    });
  }
});
