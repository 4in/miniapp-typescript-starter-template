const fs = require('fs');
const path = require('path');
const glob = require('glob');

const sourceCodeRoot = path.resolve(__dirname, '../miniprogram');
const npmPackRoot = path.resolve(__dirname, '../miniprogram/miniprogram_npm');

const files = glob.sync(path.resolve(sourceCodeRoot, '**/*.{js,wxss}'));

try {
  files.forEach((file) => {
    if (file.indexOf(npmPackRoot) === -1) {
      fs.unlinkSync(file);
    }
  });
} catch (e) {
  console.warn(e);
}
