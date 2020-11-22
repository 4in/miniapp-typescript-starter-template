/**
 * 判断是否为URL
 * @param url
 */
export function isUrl(url: string): boolean {
  return /^https?/.test(url);
}
