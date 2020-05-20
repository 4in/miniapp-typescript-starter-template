const { src, dest, parallel, watch } = require('gulp');
const sass = require('gulp-sass');
const rename = require('gulp-rename');
const PluginError = require('plugin-error');
const through = require('through2');

function gulpRpx2Rem() {
  return through.obj(function (file, enc, cb) {
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
        content.replace(/(\d+)rpx/gi, (_, value) => {
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

function css() {
  return (
    src('./miniprogram/**/*.scss')
      .pipe(
        sass({
          outputStyle: 'compressed',
        })
      )
      // .pipe(gulpRpx2Rem())
      .pipe(rename({ extname: '.wxss' }))
      .pipe(dest('./miniprogram'))
  );
}

exports.css = css;

exports.dev = () => {
  watch('./miniprogram/**/*.scss', {}, parallel(css));
};

exports.default = parallel(css);
