// https://code.visualstudio.com/api/references/contribution-points#contributes.taskDefinitions
// https://code.visualstudio.com/api/extension-guides/task-provider
// https://github.com/microsoft/vscode-extension-samples/tree/main/task-provider-sample

import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as vscode from 'vscode';
import { z } from 'zod';
import { styledBeginsPattern, styledEndsPattern } from '../npm/common';
import { findChromium, getChromeDevtoolsProtocolEndpointFromApi, getChromeDevtoolsProtocolEndpointFromProcess, launchChromium } from './chrome-process';

const ChromeTaskDefination = z.object({
  executable: z.string().optional(),
  userDataDir: z.string().optional(),
  remoteDebuggingPort: z.number(),
  startingPage: z.string().optional(),
  additionalFlags: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.string().array()])).optional(),
});

type ChromeTaskDefination = z.infer<typeof ChromeTaskDefination>;

export class ChromeTaskProvider implements vscode.TaskProvider {
  async provideTasks(token: vscode.CancellationToken): Promise<vscode.Task[]> {
    if (MODE === 'development') {
      console.log('provideTasks()');
    }
    return [];
  }

  async resolveTask(task: vscode.Task, token: vscode.CancellationToken): Promise<vscode.Task> {
    if (MODE === 'development') {
      console.log('resolveTask()', task);
    }
    const definition = ChromeTaskDefination.parse(task.definition);
    return new vscode.Task(
      task.definition,
      task.scope ?? vscode.TaskScope.Global,
      task.name,
      task.definition.type,
      new vscode.CustomExecution(async () => {
        return new ChromeTaskTerminal(definition);
      }),
      '$common',
    );
  }
}

class ChromeTaskTerminal implements vscode.Pseudoterminal {
  #didWrite = new vscode.EventEmitter<string>();
  #didClose = new vscode.EventEmitter<number | void>();
  #didUserClose = new vscode.EventEmitter<void>();
  #defination: ChromeTaskDefination;

  onDidWrite = this.#didWrite.event;
  onDidClose = this.#didClose.event;

  constructor(defination: ChromeTaskDefination) {
    this.#defination = defination;
  }

  async open(initialDimensions: vscode.TerminalDimensions | undefined): Promise<void> {
    this.#didWrite.fire(`${styledBeginsPattern}\r\n`);

    const remoteDebuggingPort = this.#defination.remoteDebuggingPort;

    const wsURL = await getChromeDevtoolsProtocolEndpointFromApi(remoteDebuggingPort).then((wsURL) => {
      this.#didWrite.fire(`\r\n`);
      this.#didWrite.fire(`Chrome process already exists.\r\n`);
      this.#didWrite.fire(`\r\n`);
      this.#didWrite.fire(`remoteDebuggingPort: ${JSON.stringify(remoteDebuggingPort)}\r\n`);
      return wsURL;
    }).catch(async () => {
      const executable = this.#defination.executable || await findChromium();
      const userDataDir = this.#defination.userDataDir || join(tmpdir(), `chrome-user-data-dir-${remoteDebuggingPort}`);
      const startingPage = this.#defination.startingPage;
      const additionalFlags = this.#defination.additionalFlags;
      this.#didWrite.fire(`\r\n`);
      this.#didWrite.fire(`Chrome process not exists, launching...\r\n`);
      this.#didWrite.fire(`\r\n`);
      this.#didWrite.fire(`executable: ${JSON.stringify(executable)}\r\n`);
      this.#didWrite.fire(`userDataDir: ${JSON.stringify(userDataDir)}\r\n`);
      this.#didWrite.fire(`remoteDebuggingPort: ${JSON.stringify(remoteDebuggingPort)}\r\n`);
      this.#didWrite.fire(`startingPage: ${JSON.stringify(startingPage)}\r\n`);
      this.#didWrite.fire(`additionalFlags: ${JSON.stringify(additionalFlags)}\r\n`);
      const chromeProcess = launchChromium({
        executable: executable,
        userDataDir,
        remoteDebuggingPort,
        startingPage,
        additionalFlags,
      });
      this.#didUserClose.event(() => {
        console.log(`Closed by an act of the user...`);
        chromeProcess.kill();
      });
      const wsURL = await getChromeDevtoolsProtocolEndpointFromProcess(chromeProcess);
      return wsURL;
    });

    this.#didWrite.fire(`\r\n`);
    this.#didWrite.fire(`ws endpoint: ${JSON.stringify(wsURL.toString())}\r\n`);

    const wsClient = new WebSocket(wsURL);

    wsClient.addEventListener('open', () => {
      this.#didWrite.fire(`ws open.\r\n`);
      this.#didWrite.fire(`\r\n`);
      this.#didWrite.fire(`${styledEndsPattern}\r\n`);
    });
    wsClient.addEventListener('close', () => {
      this.#didWrite.fire(`ws close.\r\n`);
      this.#didClose.fire(0);
    });
    wsClient.addEventListener('error', () => {
      this.#didWrite.fire(`ws error!\r\n`);
      this.#didClose.fire(1);
    });
  }

  close(): void {
    this.#didUserClose.fire();
  }

  handleInput(data: string): void {
    this.#didWrite.fire(`handleInput(${JSON.stringify(data)})\r\n`);
    if (data === '\u0003') {
      this.#didUserClose.fire();
    }
  }
}
