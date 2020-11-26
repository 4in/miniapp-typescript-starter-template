const { src, dest, parallel, watch, series } = require('gulp');
const sass = require('gulp-dart-sass');
const ts = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');
const rename = require('gulp-rename');
const PluginError = require('plugin-error');
const through2 = require('through2');
const path = require('path');
const fs = require('fs');

const IS_WINDOWS = process.platform === 'win32';

/**
 * clean
 */
function clean() {
  return src(['miniprogram/**/*.{js,js.map,wxss}', '!miniprogram/miniprogram_npm/**/*']).pipe(
    through2.obj((file, _, cb) => {
      fs.unlink(file.path, () => {});
      cb(null, file);
    })
  );
}

/**
 * rpx2rem
 */
function gulpRpx2Rem() {
  return through2.obj(function (file, enc, cb) {
    if (file.isNull()) {
      this.push(file);
      return cb();
    }
    if (file.isStream()) {
      this.emit('error', new PluginError('rpx2rem', 'Streaming not supported'));
      return cb();
    }
    try {
      const content = file.contents.toString(enc);
      const ratio = 32; // 16 * 750 / 375
      file.contents = Buffer.from(
        content.replace(/(\d+(\.\d+)?)rpx/gi, (_, value) => {
          return `${value / ratio}rem`;
        })
      );
    } catch (err) {
      this.emit('error', new PluginError('rpx2rem', err));
    }
    this.push(file);
    return cb();
  });
}

/**
 * tsconfig paths resolver
 */
function tsPathsResolver(tsConfig) {
  // 将baseUrl转为绝对路径
  const baseUrl = path.join(__dirname, tsConfig.baseUrl);
  // 转换paths的格式: 取数组第一个值、去掉结尾的*
  const paths = Object.entries(tsConfig.paths).map((v) =>
    ((v[1] = v[1][0]), v).map((v) => v.replace(/\*$/g, ''))
  );
  return through2.obj(function (file, enc, cb) {
    if (file.isNull()) {
      this.push(file);
      return cb();
    }
    if (file.isStream()) {
      this.emit('error', new PluginError('tsPathsResolver', 'Streaming not supported'));
      return cb();
    }
    /**
     * 自动补全require path
     * @param {string} requireFile
     */
    const autoCompletePath = (requireFile) => {
      const baseDir = path.dirname(file.path);
      // 此处用.ts判断，因为此时可能.js文件还没生成
      if (!fs.existsSync(path.resolve(baseDir, `${requireFile}.ts`))) {
        // 引用的文件不存在，且同名目录下含有index.ts文件，则加上index
        if (fs.existsSync(path.resolve(baseDir, `${requireFile}/index.ts`))) {
          requireFile += '/index';
        }
      }
      return `${requireFile}${requireFile.endsWith('.js') ? '' : '.js'}`;
    };
    try {
      // 将文件流转为字符串
      const content = file.contents.toString(enc);
      file.contents = Buffer.from(
        // 匹配require语句
        content.replace(/require\(('|")(.+)\1\)/g, (match, quotation, requirePath) => {
          const matchedPath = paths.find((p) => requirePath.indexOf(p[0]) === 0);
          if (!matchedPath) {
            return /^[@a-zA-Z]/.test(requirePath) &&
              fs.existsSync(path.resolve('./miniprogram/miniprogram_npm', requirePath))
              ? `require(${quotation}${requirePath}${quotation})`
              : `require(${quotation}${autoCompletePath(requirePath)}${quotation})`;
          }
          // 获取两个文件的相对路径
          let relativePath = path.relative(
            // 引入的文件
            path.dirname(file.path),
            // 被引入的文件
            path.resolve(baseUrl, matchedPath[1], requirePath.replace(matchedPath[0], ''))
          );
          if (relativePath.charAt(0) !== '.') {
            relativePath = `./${relativePath}`;
          }
          if (process.platform === 'win32') {
            relativePath = relativePath.replace(/\\/g, '/');
          }
          return `require(${quotation}${autoCompletePath(relativePath)}${quotation})`;
        })
      );
    } catch (err) {
      this.emit('error', new PluginError('ts path resolver', err));
    }
    this.push(file);
    return cb();
  });
}

function compileScssToWxss(filepath) {
  let isDefault = false;
  if (!filepath) {
    isDefault = true;
    filepath = './miniprogram/**/*.scss';
  }
  return function scss2wxss() {
    return src(filepath)
      .pipe(
        sass({
          outputStyle: 'compressed',
        })
      )
      .pipe(gulpRpx2Rem())
      .pipe(rename({ extname: '.wxss' }))
      .pipe(dest(isDefault ? './miniprogram' : IS_WINDOWS ? '.' : path.dirname(filepath)));
  };
}

function compileTsToJs(filepath) {
  const tsProject = ts.createProject('./tsconfig.json');
  let isDefault = false;
  if (!filepath) {
    isDefault = true;
    filepath = './miniprogram/**/*.ts';
  }
  return function ts2js() {
    return src([filepath, './typings/**/*.ts', './node_modules/miniprogram-api-typings'], {
      base: './miniprogram',
    })
      .pipe(sourcemaps.init())
      .pipe(tsProject())
      .js.pipe(sourcemaps.write('./'))
      .on('error', function () {
        isDefault && process.exit(-1);
      })
      .pipe(tsPathsResolver(tsProject.config.compilerOptions))
      .pipe(dest('./miniprogram'));
  };
}

exports.clean = clean;

exports.css = compileScssToWxss();

exports.ts = compileTsToJs();

exports.default = series(exports.clean, parallel(exports.css, exports.ts));

exports.dev = () => {
  const scssRegx = /\.scss$/;
  const tsRegx = /\.ts$/;
  // 首次启动dev全量编译一次, change和add只进行增量编译
  exports.default();
  const watcher = watch('./miniprogram/**/*.{scss,ts}', {});
  watcher.on('change', (path) => {
    console.log(`${path} changed`);
    if (scssRegx.test(path)) compileScssToWxss(path)();
    if (tsRegx.test(path)) compileTsToJs(path)();
  });
  watcher.on('add', (path) => {
    console.log(`${path} added`);
    if (scssRegx.test(path)) compileScssToWxss(path)();
    if (tsRegx.test(path)) compileTsToJs(path)();
  });
  watcher.on('unlink', (path) => {
    console.log(`${path} deleted`);
    if (scssRegx.test(path)) {
      const wxssFilePath = path.replace(scssRegx, '.wxss');
      fs.existsSync(wxssFilePath) && fs.unlinkSync(wxssFilePath);
    } else if (tsRegx.test(path)) {
      const jsFilePath = path.replace(tsRegx, '.js');
      fs.existsSync(jsFilePath) && fs.unlinkSync(jsFilePath);
    }
  });
};
