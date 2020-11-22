const wxLogger = wx.getLogManager({ level: 0 });

type LogLevel = 'debug' | 'info' | 'log' | 'warn';
const logger = {} as Record<LogLevel, (...args: any[]) => void>;

(['debug', 'info', 'log', 'warn'] as LogLevel[]).forEach((logLevel: LogLevel) => {
  logger[logLevel] = (...args: any[]) => {
    wxLogger[logLevel](...args);
    console[logLevel](...args);
  };
});

export {
  /**
   * wx logger
   */
  wxLogger,
  /**
   * wx logger + console logger
   */
  logger,
};
