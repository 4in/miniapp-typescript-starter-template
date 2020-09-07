/**
 * 判断是否为URL
 * @param url
 */
export function isUrl(url: string): boolean {
  return /^https?/.test(url);
}

/**
 * 获取当前页面对象
 */
export function getCurrentPage() {
  const pages = getCurrentPages();
  return pages[pages.length - 1];
}

/**
 * 深拷贝
 * @param value
 */
export function cloneDeep<T = any>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

/**
 * 打开webview或page页面
 * @param url
 */
export function openUrl(url: string, params?: Record<string, any>) {
  console.log('openUrl', url, params);
  if (!url) return;
  if (isUrl(url)) {
    const kv = [`url=${encodeURIComponent(url)}`];
    if (typeof params !== 'undefined') {
      Object.keys(params).forEach((k) => kv.push(`${k}=${encodeURIComponent(params[k])}`));
    }
    wx.navigateTo({
      url: `/pages/web/index?${kv.join('&')}`,
    });
  } else {
    wx.navigateTo({
      url,
    });
  }
}
