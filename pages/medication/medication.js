// pages/medication/medication.js
const store = require('../../utils/storage.js');

Page({
  data: {
    meds: [],
    takenCount: 0,
    totalCount: 0,
    pct: 0
  },

  onShow() { this.load(); },
  onPullDownRefresh() { this.load(); wx.stopPullDownRefresh(); },

  load() {
    const meds = store.getMeds().map(m => Object.assign({}, m, {
      taken: store.isMedTaken(m.id)
    }));
    const active = meds.filter(m => m.enabled);
    const taken = active.filter(m => m.taken).length;
    const total = active.length;
    this.setData({
      meds,
      takenCount: taken,
      totalCount: total,
      pct: total ? Math.round((taken / total) * 100) : 0
    });
  },

  toggle(e) {
    const id = e.currentTarget.dataset.id;
    const taken = store.toggleMedTaken(id);
    wx.showToast({ title: taken ? '已记录服药' : '已取消', icon: 'none' });
    this.load();
  },

  switchMed(e) {
    const id = e.currentTarget.dataset.id;
    const med = this.data.meds.find(m => m.id === id);
    store.updateMed(id, { enabled: !med.enabled });
    this.load();
  },

  del(e) {
    const id = e.currentTarget.dataset.id;
    const med = this.data.meds.find(m => m.id === id);
    wx.showModal({
      title: '删除药品',
      content: '确认删除「' + med.name + '」？',
      success: (res) => {
        if (res.confirm) {
          store.deleteMed(id);
          this.load();
          wx.showToast({ title: '已删除', icon: 'none' });
        }
      }
    });
  },

  goAdd() { wx.navigateTo({ url: '/pages/medication-add/medication-add' }); }
});
