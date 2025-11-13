import { type ChildProcessByStdio, spawn } from 'node:child_process';
import { accessSync, constants } from 'node:fs';
import { platform } from 'node:os';
import { join } from 'node:path';
import { type Readable, type Writable } from 'node:stream';
import { z } from 'zod';

export function findChromium(): string {
  switch (platform()) {
    case 'win32': {
      const paths: string[] = [];
      if (process.env['ProgramFiles']) {
        paths.push(join(process.env['ProgramFiles'], 'Google/Chrome/Application/chrome.exe'));
      }
      if (process.env['ProgramFiles(x86)']) {
        paths.push(join(process.env['ProgramFiles(x86)'], 'Google/Chrome/Application/chrome.exe'));
        paths.push(join(process.env['ProgramFiles(x86)'], 'Microsoft/Edge/Application/msedge.exe'));
      }
      if (process.env['LOCALAPPDATA']) {
        paths.push(join(process.env['LOCALAPPDATA'], 'Google/Chrome/Application/chrome.exe'));
      }
      for (const path of paths) {
        try {
          accessSync(path, constants.X_OK);
          return path;
        } catch { }
      }
      throw new Error(`Cannot find chromium!`);
    }
    default: {
      throw new Error(`Unsupported platform "${platform()}"!`);
    }
  }
}

export type ChromiumCommandLineSwitches = {
  [key: `--${string}`]: string | number | boolean | (string | number)[] | undefined;
  /**
   * Enables remote debug over HTTP on the specified port. [↪](https://peter.sh/experiments/chromium-command-line-switches/#remote-debugging-port)\
   * ❗From Chrome 136 `--remote-debugging-port` must be accompanied by the `--user-data-dir` switch to point to a non-standard directory. [↪](https://developer.chrome.com/blog/remote-debugging-port)
   */
  '--remote-debugging-port': number;
  /** Makes Content Shell use the given path for its data directory. [↪](https://peter.sh/experiments/chromium-command-line-switches/#user-data-dir) */
  '--user-data-dir': string;
  /** This flag makes Chrome auto-open DevTools window for each tab. It is intended to be used by developers and automation to not require user interaction for opening DevTools. [↪](https://peter.sh/experiments/chromium-command-line-switches/#auto-open-devtools-for-tabs) */
  '--auto-open-devtools-for-tabs'?: boolean;
};

export function formatChromiumCommandLineSwitches(switches: ChromiumCommandLineSwitches): string[] {
  const args: string[] = [];

  for (const [key, value] of Object.entries(switches)) {
    if (typeof value === 'boolean') {
      if (value) {
        args.push(`${key}`);
      }
    } else if (typeof value === 'number') {
      args.push(`${key}=${value}`);
    } else if (typeof value === 'string') {
      if (value) {
        args.push(`${key}=${value}`);
      }
    } else if (Array.isArray(value)) {
      const v = value.join(',');
      if (v) {
        args.push(`${key}=${v}`);
      }
    }
  }

  return args;
}

export function formatChromiumCommandLineArgs(switches: ChromiumCommandLineSwitches, startingPage?: string | URL): string[] {
  const args = formatChromiumCommandLineSwitches(switches);

  if (startingPage) {
    args.push(startingPage.toString());
  }

  return args;
}

export type ChromiumLaunchOptions = {
  /** File path to chromium executable, defaults to return value of {@link findChromium}. */
  executable: string;
  /** see [List of Chromium Command Line Switches](https://peter.sh/experiments/chromium-command-line-switches/#auto-open-devtools-for-tabs) */
  switches: ChromiumCommandLineSwitches;
  startingPage?: string | URL;
};

export function launchChromium(options: ChromiumLaunchOptions) {
  return spawn(options.executable, formatChromiumCommandLineArgs(options.switches, options.startingPage), {
    detached: true,
    stdio: ['ignore', 'ignore', 'pipe'],
  });
}

const JsonVersionApiResponse = z.object({
  webSocketDebuggerUrl: z.string(),
});

export function getChromeDevtoolsProtocolEndpointFromApi(remoteDebuggingPort: number): Promise<URL> {
  return fetch(`http://localhost:${remoteDebuggingPort}/json/version`).then(async (res) => {
    const json = await res.json();
    const data = JsonVersionApiResponse.parse(json);
    return new URL(data.webSocketDebuggerUrl);
  });
}

export function getChromeDevtoolsProtocolEndpointFromProcess(chromeProcess: ChildProcessByStdio<null | Writable, null | Readable, Readable>): Promise<URL> {
  return new Promise<URL>((fulfill, reject) => {
    const onStderr = (data: Buffer) => {
      const matchResult = data.toString().match(/DevTools listening on (ws:\/\/\S+)/);
      if (matchResult) {
        globalThis.clearTimeout(stderrTimeout);
        chromeProcess.stderr.off('data', onStderr);
        fulfill(new URL(matchResult[1]));
      }
    };

    const stderrTimeout = globalThis.setTimeout(() => {
      chromeProcess.stderr.off('data', onStderr);
      reject(new Error('Timeout waiting for stderr webSocket URL!'));
    }, 3000);

    chromeProcess.stderr.on('data', onStderr);
  }).finally(() => {
    // 关闭连接到子进程的 Stream，并取消对子进程的引用计数，否则 Node 程序将一直悬挂着不退出。
    chromeProcess.stderr.destroy();
    chromeProcess.unref();
  });
}

export function getChromeDevtoolsProtocolEndpoint(options: ChromiumLaunchOptions): Promise<URL> {
  return getChromeDevtoolsProtocolEndpointFromApi(options.switches['--remote-debugging-port']).catch(() => {
    return getChromeDevtoolsProtocolEndpointFromProcess(launchChromium(options));
  });
}
