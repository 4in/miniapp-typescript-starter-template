#!/usr/bin/env node

/* -------------------------------------------------------------------------- */
/*               Continuous Integration & Continuous Deployment               */
/* -------------------------------------------------------------------------- */

const path = require('path');
const os = require('os');
const fs = require('fs');
const child_process = require('child_process');
const CI = require('miniprogram-ci');
const package = require('../package.json');
const projectConfig = require('../project.config.json');

const deploy = async () => {
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  if (!PRIVATE_KEY) {
    console.error('private key 不存在');
    process.exit(-1);
  }
  const tempFilePath = path.join(os.tmpdir(), 'private_key.key');
  fs.writeFileSync(tempFilePath, PRIVATE_KEY.replace(/\\n/g, '\n'));

  try {
    const packResult = await CI.packNpmManually({
      packageJsonPath: path.resolve(__dirname, '../package.json'),
      miniprogramNpmDistDir: path.resolve(__dirname, '../miniprogram/'),
    });
    console.log('Pack npm done, pack result:', packResult);

    let desc = `构建时间: ${new Date().toLocaleString('zh')}`;
    try {
      desc = child_process.execSync('git show -s --format="%s (%aN)"').toString('utf-8');
    } catch (e) {}
    const uploadResult = await CI.upload({
      project: new CI.Project({
        appid: projectConfig.appid,
        type: 'miniProgram',
        projectPath: path.resolve(__dirname, '..'),
        privateKeyPath: tempFilePath,
        ignores: ['node_modules/**/*'],
      }),
      version: package.version,
      desc,
      robot: 1,
      onProgressUpdate: (task) => {
        if (typeof task === 'string') {
          console.log(task);
        } else {
          console.log(`[${task.status}]`.padStart(10), task.message);
        }
      },
    });
    console.log(uploadResult);
  } catch (e) {
    console.error(e);
    process.exit(-1);
  }
};

deploy();
