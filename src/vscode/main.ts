import * as vscode from 'vscode';
import { ChromeTaskProvider } from './chrome-task-provider';

export function activate(ctx: vscode.ExtensionContext) {
  if (MODE === 'development') {
    console.log('activate');
    vscode.window.showInformationMessage('activate');
  }

  ctx.subscriptions.push(
    vscode.tasks.registerTaskProvider('chrome', new ChromeTaskProvider()),
  );
}
