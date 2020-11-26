/**
 * 基类
 */

import { resolveUrl } from '@/utils/index';
import { API_BASE_URL } from '@/config';

const logger = wx.getLogManager({ level: 0 });

type RequestMethod = Property<WechatMiniprogram.RequestOption, 'method'>;

interface ApiSuccessResponse<T> {
  code: number;
  msg: string;
  data: T;
}

interface ApiFailResponse {
  code: number;
  msg: string;
}

export class Base {
  private request<T = any>(method: RequestMethod, url: string, data?: any): Promise<T> {
    return new Promise((resolve, reject) => {
      wx.request({
        method,
        url: resolveUrl(API_BASE_URL, url),
        data,
        header: {},
        success({ data }) {
          const ret: ApiSuccessResponse<T> & ApiFailResponse = data as any;
          // @ts-ignore
          resolve(ret);

          // if (ret.code === 200) {
          //   resolve(ret.data);
          // } else {
          //   // @ts-ignore
          //   reject(ret.msg || ret.message || ret.error || '服务器异常');
          // }
        },
        fail(res) {
          reject(res.errMsg);
        },
        complete(res) {
          // 如果不分开写，在真机上可能会导致后面的log看不见
          console.log(`Request ${method}`, url, data);
          console.log(res);
          logger.info(`Request ${method}`, url, data);
          logger.info(res);
        },
      });
    });
  }

  protected get<T = any>(url: string, data?: any) {
    return this.request<T>('GET', url, data);
  }

  protected post<T = any>(url: string, data?: any) {
    return this.request<T>('POST', url, data);
  }
}
