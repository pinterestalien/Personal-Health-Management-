// app.js
App({
  globalData: {
    userInfo: null,
    // 健康目标默认值
    goals: {
      steps: 8000,
      water: 2000,
      sleep: 8,
      weight: 65
    }
  },

  onLaunch() {
    // 初始化默认健康数据（首次启动写入示例数据）
    const store = require('./utils/storage.js');
    store.seedIfEmpty();
  }
});
