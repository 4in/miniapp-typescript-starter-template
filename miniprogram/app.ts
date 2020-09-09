import api from './api/index';
import * as utils from './utils/index';
import mta from './libs/mta_analysis';
import { IApp } from './typings';

/**
 * 含义：<页面ID, 回调函数>
 * Map 中的键值是有序的，而添加到对象中的键则不是。
 * 因此，当对它进行遍历时，Map 对象是按插入的顺序返回键值。
 */
const appReadyCbs = new Map<string, AnyFunction>();
// 是否已登录
let hasLoggedIn = false;
// 触发登录回调
function consumeReadyCbs() {
  const pages = getCurrentPages();
  for (const key of appReadyCbs.keys()) {
    // 如果page已经被销毁，则不再调用回调
    if (!~pages.findIndex((page) => key === page.getPageId())) continue;
    try {
      appReadyCbs.get(key)!();
    } catch (e) {}
  }
  // 清除回调函数引用，防止内存泄漏
  appReadyCbs.clear();
}

App<IApp>({
  isDebug: typeof __wxConfig === 'object' && __wxConfig.debug,
  api,
  utils,

  onLaunch() {
    // See https://mta.qq.com
    // mta.App.init({
    //   appID: 'XXXXXX',
    //   eventID: 'XXXXXX',
    //   autoReport: true,
    //   statParam: true,
    //   ignoreParams: [],
    //   statPullDownFresh: true,
    //   statShareApp: true,
    //   statReachBottom: true,
    // });

    // 登录逻辑
    // wx.login({
    //   async success({ code }) {
    //     hasLoggedIn = true;
    //     consumeReadyCbs();
    //   },
    // });
    hasLoggedIn = true;
    consumeReadyCbs();
  },

  /**
   * 统一调用分享函数
   */
  onShare(customParams) {
    return {
      path: '/pages/index/index',
      ...customParams,
    };
  },

  onError(error) {
    console.log('App onError', error);
    utils.logger.warn('App onError', error);
  },

  onUnhandledRejection({ reason }) {
    console.log('App onUnhandledRejection', reason);
    utils.logger.warn('App onUnhandledRejection', reason);
  },

  /**
   * 注册登录回调
   * @param cb
   */
  ready(cb: AnyFunction) {
    if (typeof cb !== 'function') return;
    // 若已ready，则立即执行，否则推入队列
    if (hasLoggedIn) {
      cb();
      return;
    }
    // 获取每个页面的ID作为ready的单一凭证
    const page = utils.getCurrentPage();
    appReadyCbs.set(page.getPageId(), cb);
  },
});
