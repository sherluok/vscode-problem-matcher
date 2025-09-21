import { type Compiler, type WebpackPluginInstance } from 'webpack';
import { isVscodeTerminal, logBeginsPattern, logEndsPattern } from './node';

export class VscodeTaskPlugin implements WebpackPluginInstance {
  apply(compiler: Compiler) {
    if (!compiler.isChild()) {
      const logger = compiler.getInfrastructureLogger('vscode-task-plugin');
      compiler.hooks.environment.tap('vscode-task-plugin', () => {
        if (isVscodeTerminal()) {
          logger.info('Webpack running in VS Code terminal');
        }
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
