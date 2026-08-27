// pages/period/period.js
const store = require('../../utils/storage.js');
const util = require('../../utils/util.js');

Page({
  data: {
    status: {},
    last: null,
    nextStart: '',
    ovulation: '',
    fertileStart: '',
    fertileEnd: '',
    cycleLen: 28,
    // 日历
    calTitle: '',
    calCells: [],   // {day, date, isPeriod, isFertile, isOvulation, isToday, inMonth}
    // 历史
    history: [],
    weekday: ['日', '一', '二', '三', '四', '五', '六'],
    // 当前查看的月份
    viewYear: 0,
    viewMonth: 0
  },

  onLoad() {
    const now = new Date();
    this.setData({ viewYear: now.getFullYear(), viewMonth: now.getMonth() });
    this.load();
  },

  onShow() { this.load(); },
  onPullDownRefresh() { this.load(); wx.stopPullDownRefresh(); },

  load() {
    const today = util.formatDate();
    const status = store.cycleStatus(today);
    const last = store.lastPeriod();
    const nextStart = store.predictedNextStart();
    const ovulation = store.predictedOvulation();
    const fertile = store.fertileWindow();

    // 历史倒序
    const all = store.getPeriods();
    const history = all.slice().reverse().map((p, i, arr) => {
      const periodEnd = p.endDate || store.addDays(p.startDate, store.DEFAULT_PERIOD - 1);
      const len = store.dayDiff(p.startDate, periodEnd) + 1;
      // 周期 = 下一次开始 - 本次开始（取正序下一条）
      let cycle = '';
      const next = all[all.length - 1 - i + 1]; // 倒序索引对应正序的下一个
      // 用正序方式计算更稳妥
      return {
        id: p.id,
        startDate: p.startDate,
        endDate: p.endDate || '进行中',
        flow: store.FLOW[p.flow] || '正常',
        symptoms: (p.symptoms || []).join('、') || '无',
        note: p.note,
        lenText: len + '天'
      };
    });
    // 周期长度补充
    const seq = all; // 正序
    history.forEach((h, idx) => {
      const pos = all.length - 1 - idx; // 正序位置
      if (pos + 1 < all.length) {
        h.cycleText = store.dayDiff(all[pos].startDate, all[pos + 1].startDate) + '天';
      } else {
        h.cycleText = '—';
      }
    });

    this.setData({
      status,
      last,
      nextStart,
      ovulation,
      fertileStart: fertile ? fertile.start : '',
      fertileEnd: fertile ? fertile.end : '',
      cycleLen: status.cycleLen,
      history
    });
    this.buildCalendar();
  },

  buildCalendar() {
    const { viewYear, viewMonth } = this.data;
    const today = util.formatDate();
    const first = new Date(viewYear, viewMonth, 1);
    const firstDay = first.getDay(); // 0=周日
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    // 标记范围：本月 1 号 ~ 月末
    const from = util.formatDate(first);
    const last = new Date(viewYear, viewMonth, daysInMonth);
    const to = util.formatDate(last);
    const periodMarks = store.periodDaysInRange(from, to);

    // 易孕期与排卵日标记（本月内）
    const fertile = store.fertileWindow();
    const ovu = store.predictedOvulation();

    const cells = [];
    // 前置空白
    for (let i = 0; i < firstDay; i++) cells.push({ day: '', inMonth: false });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = util.formatDate(new Date(viewYear, viewMonth, d));
      cells.push({
        day: d,
        date,
        inMonth: true,
        isToday: date === today,
        isPeriod: !!periodMarks[date],
        isFertile: fertile ? (date >= fertile.start && date <= fertile.end) : false,
        isOvulation: ovu ? date === ovu : false
      });
    }

    this.setData({
      calTitle: viewYear + '年' + (viewMonth + 1) + '月',
      calCells: cells
    });
  },

  prevMonth() {
    let { viewYear, viewMonth } = this.data;
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    this.setData({ viewYear: viewYear, viewMonth: viewMonth });
    this.buildCalendar();
  },

  nextMonth() {
    let { viewYear, viewMonth } = this.data;
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    this.setData({ viewYear: viewYear, viewMonth: viewMonth });
    this.buildCalendar();
  },

  goAdd() {
    // 若当前正在经期中，则跳转到编辑本次结束日期；否则新增
    const last = store.lastPeriod();
    if (last && !last.endDate) {
      wx.navigateTo({ url: '/pages/period-add/period-add?id=' + last.id + '&start=' + last.startDate });
    } else {
      wx.navigateTo({ url: '/pages/period-add/period-add?start=' + util.formatDate() });
    }
  },

  editHistory(e) {
    const id = e.currentTarget.dataset.id;
    const p = store.getPeriods().find(x => x.id === id);
    if (!p) return;
    wx.navigateTo({ url: '/pages/period-add/period-add?id=' + id + '&start=' + p.startDate });
  },

  del(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除记录', content: '确认删除该次经期记录？',
      success: (res) => {
        if (res.confirm) {
          store.deletePeriod(id);
          this.load();
          wx.showToast({ title: '已删除', icon: 'none' });
        }
      }
    });
  }
});
