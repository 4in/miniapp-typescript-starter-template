/**
 * 显示 loading
 * TODO: 使用自定义组件美化
 * @param title 标题
 */
export const showLoading = (title: string = '加载中'): { hide: Function } => {
  wx.showLoading({
    title,
    mask: true,
  });
  return { hide: wx.hideLoading };
};
