/**
 * 获取当前页面对象
 */
export function getCurrentPage() {
  const pages = getCurrentPages();
  return pages[pages.length - 1];
}
