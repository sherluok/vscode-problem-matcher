import { type Compiler, type WebpackPluginInstance } from 'webpack';
import { beginsPattern, endsPattern } from './common';

export class VscodeTaskPlugin implements WebpackPluginInstance {
  apply(compiler: Compiler) {
    if (process.env.TERM_PROGRAM === 'vscode' && !compiler.isChild()) {
      const logger = compiler.getInfrastructureLogger('vscode-task-plugin');
      compiler.hooks.environment.tap('vscode-task-plugin', () => {
        logger.info('webpack running in vs code terminal');
      });
      compiler.hooks.run.tap('vscode-task-plugin', () => {
        console.log(beginsPattern);
      });
      compiler.hooks.watchRun.tap('vscode-task-plugin', () => {
        console.log(beginsPattern);
      });
      compiler.hooks.done.tap('vscode-task-plugin', () => {
        console.log(endsPattern);
      });
    }
  }
}
