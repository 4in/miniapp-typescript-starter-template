import { IApp } from '@/typings';

const app = getApp<IApp>();

Page({
  handleSendRequest() {
    app.api.demo.test({ from: 'miniapp' }).then((data) => {
      console.log(data);
    });
  },
});
