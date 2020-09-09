import API from './api/index';
import * as utils from './utils/index';

export interface IApp {
  /**
   * 是否为调试模式
   */
  isDebug: boolean;

  /**
   * API
   */
  api: typeof API;

  /**
   * 工具函数
   */
  utils: typeof utils;

  /**
   * 注册待登录后被调用的函数
   * @param cb
   */
  ready(cb: AnyFunction): void;

  /**
   * 分享函数
   */
  onShare(
    options: Partial<WechatMiniprogram.Page.IShareAppMessageOption> &
      Partial<WechatMiniprogram.Page.ICustomShareContent>
  ): WechatMiniprogram.Page.ICustomShareContent;
}
