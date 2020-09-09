# 微信小程序 TypeScript Starter Template

- [x] TypeScript
- [x] Gulp
- [x] SCSS
- [x] Prettier
- [x] Husky Lint
- [x] rpx 转 rem
- [x] Git Commit Message Lint
- [x] TS Paths
- [x] npm support
- [x] CI/CD
- [x] 自动安装推荐插件

## 使用方式

```bash
# 安装依赖
$ yarn  # npm i

# 开发   如果在编译前预处理写，会把整个项目进行编译，其实是没有必要的。
$ yarn dev

# 预览/上传 前的预处理   微信开发者工具会自动帮我们做这件事 ;)
$ yarn compile

# 格式化文件
$ yarn format

# 清理文件
$ yarn clean
```

## 建议安装的拓展

`node ./scripts/setup.js`一键安装

[手动安装方式](https://developers.weixin.qq.com/miniprogram/dev/devtools/editorextensions.html)

- `eamodio.gitlens` Git 相关，甩锅神器
- `esbenp.prettier-vscode` 代码格式化
- `mrmlnc.vscode-scss` SCSS 智能提示
- `wayou.vscode-todo-highlight` 高亮 TODO、FIXME 等注释中的关键字
- `jock.svg` SVG 相关，预览、压缩、导出等

## Troubleshooting

### 打开项目报错

初始化项目时会因为对应 js 不存在报错，需要使用 `yarn dev` 或 `yarn compile` 生成 js、wxss 文件

### /bin/sh npm not found

npm/node 不在 sh 的环境变量中

```bash
ln -s $(which npm) /usr/local/bin/npm
ln -s $(which node) /usr/local/bin/node
```

### PowerShell 提示“yarn : 无法加载文件”

以管理员权限运行 PowerShell，输入 `set-ExecutionPolicy RemoteSigned` 并选择 `Y`

### 开发者工具正常运行，真机预览页面空白

暂时关闭「启用自定义处理命令」，并手动执行一下 `yarn compile`，然后点击预览。
