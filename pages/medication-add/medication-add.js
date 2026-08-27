// pages/medication-add/medication-add.js
const store = require('../../utils/storage.js');

Page({
  data: {
    name: '',
    dosage: '',
    time: '08:00',
    frequencyList: ['每日一次', '每日两次', '每日三次', '隔日一次', '每周一次', '按需服用'],
    frequencyIndex: 0,
    note: ''
  },

  onName(e) { this.setData({ name: e.detail.value }); },
  onDosage(e) { this.setData({ dosage: e.detail.value }); },
  onTime(e) { this.setData({ time: e.detail.value }); },
  onFreq(e) { this.setData({ frequencyIndex: e.detail.value }); },
  onNote(e) { this.setData({ note: e.detail.value }); },

  save() {
    const { name, dosage, time, frequencyList, frequencyIndex, note } = this.data;
    if (!name) { wx.showToast({ title: '请输入药品名称', icon: 'none' }); return; }
    if (!dosage) { wx.showToast({ title: '请输入剂量', icon: 'none' }); return; }
    store.addMed({
      name, dosage, time,
      frequency: frequencyList[frequencyIndex],
      note
    });
    wx.showToast({ title: '已添加', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 700);
  }
});
