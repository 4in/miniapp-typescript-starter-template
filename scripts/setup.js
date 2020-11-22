#!/usr/bin/env node

/* -------------------------------------------------------------------------- */
/*                         Automate Install Extensions                        */
/* -------------------------------------------------------------------------- */

const child_process = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const chalk = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[91m${text}\x1b[0m`,
  gray: (text) => `\x1b[1;30m${text}\x1b[0m`,
  greenBgWhite: (text) => `\x1b[42;37m${text}\x1b[0m`,
};

/**
 * spawn with log
 * @param {string} command
 * @param {string[]} args
 * @param {import('child_process').SpawnOptionsWithoutStdio} options
 */
const spawnWithLog = (command, args, options = {}) => {
  return new Promise((resolve, reject) => {
    const sp = child_process.spawn(command, args, options);
    sp.on('close', (code) => (code === 0 ? resolve() : reject()));
    sp.stdout.on('data', (chunk) => {
      console.log(chalk.gray(chunk.toString('utf-8').trim()));
    });
    sp.stderr.on('data', (chunk) => {
      console.log(chalk.red(chunk.toString('utf-8').trim()));
    });
  });
};

class Adapter {
  /**
   * Get installed VSCode extensions
   * @returns {{id: string, version: string}[]}
   */
  getVSCodeExtensions() {}

  /**
   * Install extension by id
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  installExtension(id) {}

  /**
   * Uninstall extension by id
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  uninstallExtension(id) {}

  /**
   * Get Wechat DevTools Extension Dirs
   * @returns {{config: string, dir: string}[]}
   */
  getWechatDevToolsExtensionDirs() {}

  /**
   * Copy Extension
   * @param {{id: string, version: string}} extension
   * @param {{config: string, dir: string}} extensionDirs
   */
  copyExtension(extension, extensionDirs) {}
}

class MacAdapter extends Adapter {
  constructor() {
    super();
    const path = '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code';
    if (!fs.existsSync(path)) throw Error('Please install VSCode first');
    this.path = path;
  }

  getVSCodeExtensions() {
    return child_process
      .execSync(`"${this.path}" --list-extensions --show-versions`)
      .toString('utf-8')
      .trim()
      .split('\n')
      .map((ext) => {
        const info = ext.split('@');
        return {
          id: info[0],
          version: info[1],
        };
      });
  }

  installExtension(id) {
    return spawnWithLog('/bin/bash', ['-c', `"${this.path}" --install-extension ${id}`]);
  }

  uninstallExtension(id) {
    return spawnWithLog('/bin/bash', ['-c', `"${this.path}" --uninstall-extension ${id}`]);
  }

  getWechatDevToolsExtensionDirs() {
    const dataDir = `${os.homedir()}/Library/Application Support/微信开发者工具`;
    const paths = fs.readdirSync(dataDir);
    const regExp = /[a-z0-9]{32}/;
    return paths
      .filter((path) => regExp.test(path))
      .map((p) => ({
        config: path.join(dataDir, p, 'Default/Editor/User/_extensionmanage'),
        dir: path.join(dataDir, p, 'Default/Editor/User/extensions'),
      }));
  }

  async copyExtension(extension, extensionDirs) {
    for (const extDir of extensionDirs) {
      console.log('Coping', chalk.green(`${extension.id}@${extension.version}`));
      await spawnWithLog('cp', [
        '-R',
        path.join(`${os.homedir}/.vscode/extensions`, `${extension.id}-${extension.version}`),
        extDir.dir,
      ]);
      try {
        let config;
        eval(`config = ${fs.readFileSync(extDir.config).toString('utf-8')}`);
        config.push(extension.id);
        config = [...new Set(config)];
        fs.writeFileSync(extDir.config, JSON.stringify(config.sort(), null, 2));
      } catch (e) {
        console.log(chalk.red(`自动启用 ${extension.id} 失败`));
      }
    }
  }
}

class WindowsAdapter extends Adapter {
  constructor() {
    super();
    try {
      const regPath = child_process
        .execSync(
          `for /f "tokens=3*" %a in ('REG QUERY "HKEY_CURRENT_USER\\Software\\Classes\\Applications\\Code.exe\\shell\\open\\command"') do echo %a %b`
        )
        .toString('utf-8')
        .trim()
        .split('\r\n')[1];
      const executablePath = regPath.replace(' "%1"', '').replace(/^\"/, '').replace(/\"$/, '');
      this.path = path.resolve(executablePath, '../bin/code.cmd');
    } catch (e) {
      throw Error('Please install VSCode first');
    }
  }

  getVSCodeExtensions() {
    return child_process
      .execSync(`"${this.path}" --list-extensions --show-versions`)
      .toString('utf-8')
      .trim()
      .split('\n')
      .map((ext) => {
        const info = ext.split('@');
        return {
          id: info[0],
          version: info[1],
        };
      });
  }

  installExtension(id) {
    return spawnWithLog(
      'cmd.exe',
      ['/c', `"${path.basename(this.path)}" --install-extension ${id}`],
      {
        windowsVerbatimArguments: true,
        cwd: path.dirname(this.path),
      }
    );
  }

  uninstallExtension(id) {
    return spawnWithLog(
      'cmd.exe',
      ['/c', `"${path.basename(this.path)}" --uninstall-extension ${id}`],
      {
        windowsVerbatimArguments: true,
        cwd: path.dirname(this.path),
      }
    );
  }

  getWechatDevToolsExtensionDirs() {
    const dataDir = path.resolve(os.homedir(), './AppData/Local/微信开发者工具/User Data');
    const paths = fs.readdirSync(dataDir);
    const regExp = /[a-z0-9]{32}/;
    return paths
      .filter((path) => regExp.test(path))
      .map((p) => ({
        config: path.join(dataDir, p, 'Default/Editor/User/_extensionmanage'),
        dir: path.join(dataDir, p, 'Default/Editor/User/extensions'),
      }));
  }

  async copyExtension(extension, extensionDirs) {
    function CopyDirectory(src, dest) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest);
      }
      if (!fs.existsSync(src)) return false;
      const dirs = fs.readdirSync(src);
      dirs.forEach((item) => {
        const itemPath = path.join(src, item);
        const temp = fs.statSync(itemPath);
        if (temp.isFile()) {
          fs.copyFileSync(itemPath, path.join(dest, item));
        } else if (temp.isDirectory()) {
          CopyDirectory(itemPath, path.join(dest, item));
        }
      });
    }
    for (const extDir of extensionDirs) {
      console.log('Coping', chalk.green(`${extension.id}@${extension.version}`));
      CopyDirectory(
        path.join(os.homedir(), '.vscode/extensions', `${extension.id}-${extension.version}`),
        path.join(extDir.dir, `${extension.id}-${extension.version}`)
      );
      try {
        let config;
        eval(`config = ${fs.readFileSync(extDir.config).toString('utf-8')}`);
        config.push(extension.id);
        config = [...new Set(config)];
        fs.writeFileSync(extDir.config, JSON.stringify(config.sort(), null, 2));
      } catch (e) {
        console.log(chalk.red(`自动启用 ${extension.id} 失败`));
      }
    }
  }
}

/**
 *
 * @param {string[]} ensureInstalledExtensions
 */
const setup = async (ensureInstalledExtensions) => {
  let adapter;
  const platform = process.platform;
  if (platform === 'darwin') {
    adapter = new MacAdapter();
  } else if (platform === 'win32') {
    adapter = new WindowsAdapter();
  } else {
    console.log(chalk.red(`${process.platform} is not supported yet.`));
    process.exit(-1);
  }
  const installedExtensions = adapter.getVSCodeExtensions();
  const needToBeUninstalledExtensions = [];
  for (const ext of ensureInstalledExtensions) {
    if (~installedExtensions.findIndex((e) => e.id === ext)) continue;
    try {
      await adapter.installExtension(ext);
      needToBeUninstalledExtensions.push(ext);
    } catch (e) {
      console.log(chalk.red(`Install ${ext} failed`));
    }
  }
  const currentExtensions = adapter.getVSCodeExtensions();
  const wechatDevToolsExtensionDirs = adapter.getWechatDevToolsExtensionDirs();
  for (const ext of ensureInstalledExtensions) {
    const extension = currentExtensions.find((e) => e.id === ext);
    if (!extension) continue;
    await adapter.copyExtension(extension, wechatDevToolsExtensionDirs);
  }
  for (const ext of needToBeUninstalledExtensions) {
    try {
      await adapter.uninstallExtension(ext);
    } catch (e) {
      console.log(chalk.red(`Uninstall ${ext} failed`));
    }
  }
};

setup([
  'eamodio.gitlens',
  'esbenp.prettier-vscode',
  'mrmlnc.vscode-scss',
  'wayou.vscode-todo-highlight',
  'jock.svg',
  'streetsidesoftware.code-spell-checker',
]).then(() => {
  console.log(chalk.greenBgWhite(' Setup Finished 🎉 '));
});
