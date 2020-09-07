/* -------------------------------------------------------------------------- */
/*              此文件放全局的类型定义 不要使用 import / export                    */
/* -------------------------------------------------------------------------- */

type Dataset = Record<string, any>;

interface TapEvent<T = Record<string, any>> {
  currentTarget: { dataset: Dataset };
  target: { dataset: Dataset };
  detail: T;
}

interface AnyEvent<T = Record<string, any>> {
  type?: string;
  detail: T;
  [key: string]: any;
}

declare const __wxConfig: {
  debug: boolean;
  // ...
};
