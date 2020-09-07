export * from './misc';
export { resolveUrl } from './resolve';
export { showLoading } from './loading';

export const logger = wx.getLogManager({ level: 0 });

// #region Polyfill
if (!String.prototype.padStart) {
  String.prototype.padStart = function padStart(targetLength, padString) {
    // truncate if number or convert non-number to 0;
    targetLength = targetLength >> 0;
    padString = String(typeof padString !== 'undefined' ? padString : ' ');
    if (this.length > targetLength) {
      return String(this);
    } else {
      targetLength = targetLength - this.length;
      if (targetLength > padString.length) {
        // append to original to ensure we are longer than needed
        padString += padString.repeat(targetLength / padString.length);
      }
      return padString.slice(0, targetLength) + String(this);
    }
  };
}

// #endregion
