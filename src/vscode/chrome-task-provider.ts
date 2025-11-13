// https://code.visualstudio.com/api/references/contribution-points#contributes.taskDefinitions
// https://code.visualstudio.com/api/extension-guides/task-provider
// https://github.com/microsoft/vscode-extension-samples/tree/main/task-provider-sample

import { tmpdir } from 'node:os';
import { join, normalize } from 'node:path';
import * as vscode from 'vscode';
import { z } from 'zod';
import { styledBeginsPattern, styledEndsPattern } from '../npm/common';
import { findChromium, formatChromiumCommandLineArgs, getChromeDevtoolsProtocolEndpointFromApi, getChromeDevtoolsProtocolEndpointFromProcess, launchChromium } from './chrome-process';

const ChromeTaskDefination = z.object({
  executable: z.string().optional(),
  startingPage: z.string().optional(),
  switches: z.intersection(
    z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.union([z.string(), z.number()]).array()])),
    z.object({
      '--remote-debugging-port': z.int(),
      '--user-data-dir': z.string().optional(),
    }),
  ),
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
      console.log('resolveTask()', {
        definition: task.definition,
        scope: task.scope,
        name: task.name,
        source: task.source,
      });
    }
    return new vscode.Task(
      task.definition,
      task.scope ?? vscode.TaskScope.Global,
      task.name,
      task.definition.type,
      new vscode.CustomExecution(async (resolvedDefinition) => {
        const definition = ChromeTaskDefination.parse(resolvedDefinition);
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

    const remoteDebuggingPort = this.#defination.switches['--remote-debugging-port'];

    const wsURL = await getChromeDevtoolsProtocolEndpointFromApi(remoteDebuggingPort).then((wsURL) => {
      this.#didWrite.fire(`\r\n`);
      this.#didWrite.fire(`Chrome process already exists.\r\n`);
      this.#didWrite.fire(`\r\n`);
      this.#didWrite.fire(`remoteDebuggingPort: ${JSON.stringify(remoteDebuggingPort)}\r\n`);
      return wsURL;
    }).catch(async () => {
      const executable = this.#defination.executable || await findChromium();
      const userDataDir = normalize(this.#defination.switches['--user-data-dir'] || join(tmpdir(), `chrome-user-data-dir-${remoteDebuggingPort}`));
      const switches = { ...this.#defination.switches, '--user-data-dir': userDataDir };
      const startingPage = this.#defination.startingPage;
      this.#didWrite.fire(`\r\n`);
      this.#didWrite.fire(`Chrome process not exists, launching...\r\n`);
      this.#didWrite.fire(`\r\n`);
      this.#didWrite.fire(`${executable} ${formatChromiumCommandLineArgs(switches, startingPage).join(' ')}\r\n`);
      const chromeProcess = launchChromium({ executable, switches, startingPage });
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
