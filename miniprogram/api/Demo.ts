/**
 * 通知相关
 */

import { Base } from './Base';

interface TestResponse {
  args: Record<string, string>;
  headers: Record<string, string>;
  origin: string;
  url: string;
}

export class Demo extends Base {
  test(data: any) {
    return this.get<TestResponse>('/get', data);
  }
}
