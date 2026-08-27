// utils/util.js — 时间与通用工具

const pad = (n) => (n < 10 ? '0' + n : '' + n);

/** 格式化 Date 为 YYYY-MM-DD */
function formatDate(d) {
  d = d || new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

/** 格式化为 HH:mm */
function formatTime(d) {
  d = d || new Date();
  return pad(d.getHours()) + ':' + pad(d.getMinutes());
}

/** 当前时间戳 */
function now() {
  return Date.now();
}

/** 友好的相对时间：刚刚 / x分钟前 / HH:mm / MM-DD */
function fromNow(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  const d = new Date(ts);
  if (m < 1) return '刚刚';
  if (m < 60) return m + '分钟前';
  if (h < 24) return pad(d.getHours()) + ':' + pad(d.getMinutes());
  if (day < 7) return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  return formatDate(d);
}

/** 获取最近 n 天的日期数组（YYYY-MM-DD），含今天 */
function recentDays(n) {
  const arr = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    arr.push(formatDate(d));
  }
  return arr;
}

/** 简单 GUID */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

module.exports = {
  formatDate,
  formatTime,
  now,
  fromNow,
  recentDays,
  uid,
  pad
};
