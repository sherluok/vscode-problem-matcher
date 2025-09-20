import { type Compiler, type WebpackPluginInstance } from 'webpack';
import { logBeginsPattern, logEndsPattern } from './node';

export class VscodeTaskPlugin implements WebpackPluginInstance {
  apply(compiler: Compiler) {
    if (!compiler.isChild()) {
      const logger = compiler.getInfrastructureLogger('vscode-task-plugin');
      compiler.hooks.environment.tap('vscode-task-plugin', () => {
        logger.info('webpack running in vs code terminal');
      });
      compiler.hooks.run.tap('vscode-task-plugin', () => {
        logBeginsPattern();
      });
      compiler.hooks.watchRun.tap('vscode-task-plugin', () => {
        logBeginsPattern();
      });
      compiler.hooks.done.tap('vscode-task-plugin', () => {
        logEndsPattern();
      });
    }
  }
}
