// pages/period-add/period-add.js
const store = require('../../utils/storage.js');
const util = require('../../utils/util.js');

Page({
  data: {
    id: '',
    isEdit: false,
    startDate: '',
    endDate: '',
    ongoing: true,   // 是否进行中（结束日期为空）
    today: '',
    flow: 'normal',
    flowOptions: ['量少', '正常', '量多'],
    flowKeys: ['light', 'normal', 'heavy'],
    flowIndex: 1,
    symptomList: [],
    symptoms: [],     // 选中的下标集合
    note: ''
  },

  onLoad(options) {
    const today = util.formatDate();
    const symptomList = store.SYMPTOMS.map((s, i) => ({ idx: i, label: s }));
    let data = {
      today,
      symptomList,
      startDate: options.start || today,
      endDate: '',
      ongoing: true,
      flow: 'normal', flowIndex: 1,
      symptoms: [], note: ''
    };
    if (options.id) {
      const p = store.getPeriods().find(x => x.id === options.id);
      if (p) {
        const fIdx = Math.max(0, store.SYMPTOMS ? 0 : 0);
        // flow index
        const fKey = p.flow || 'normal';
        const fi = ['light', 'normal', 'heavy'].indexOf(fKey);
        const symIdx = (p.symptoms || []).map(s => store.SYMPTOMS.indexOf(s)).filter(i => i >= 0);
        data = Object.assign(data, {
          id: p.id,
          isEdit: true,
          startDate: p.startDate,
          endDate: p.endDate || '',
          ongoing: !p.endDate,
          flow: fKey,
          flowIndex: fi >= 0 ? fi : 1,
          symptoms: symIdx,
          note: p.note || ''
        });
      }
    }
    this.setData(data);
    wx.setNavigationBarTitle({ title: data.isEdit ? '编辑经期' : '记录经期' });
  },

  onStart(e) { this.setData({ startDate: e.detail.value }); },
  onEnd(e) { this.setData({ endDate: e.detail.value, ongoing: false }); },
  toggleOngoing() { this.setData({ ongoing: !this.data.ongoing, endDate: this.data.ongoing ? this.data.endDate : '' }); },
  onFlow(e) { this.setData({ flowIndex: e.detail.value, flow: this.data.flowKeys[e.detail.value] }); },
  onNote(e) { this.setData({ note: e.detail.value }); },

  toggleSymptom(e) {
    const idx = Number(e.currentTarget.dataset.idx);
    const arr = this.data.symptoms.slice();
    const pos = arr.indexOf(idx);
    if (pos >= 0) arr.splice(pos, 1); else arr.push(idx);
    this.setData({ symptoms: arr });
  },

  save() {
    const { id, isEdit, startDate, endDate, ongoing, flow, symptoms, symptomList, note } = this.data;
    if (!startDate) { wx.showToast({ title: '请选择开始日期', icon: 'none' }); return; }
    if (!ongoing && endDate && endDate < startDate) {
      wx.showToast({ title: '结束日期不能早于开始', icon: 'none' }); return;
    }
    const symNames = symptoms.map(i => symptomList[i].label);
    const payload = {
      startDate,
      endDate: ongoing ? '' : endDate,
      flow,
      symptoms: symNames,
      note
    };
    if (isEdit) {
      store.updatePeriod(id, payload);
    } else {
      store.addPeriod(payload);
    }
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 700);
  }
});
