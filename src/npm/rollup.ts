import { OutputBundle, OutputPlugin, type Plugin } from 'rollup';
import { bufferCount, Subject, Subscription, tap } from 'rxjs';
import { logBeginsPattern, logEndsPattern } from './node';

// https://rollupjs.org/plugin-development
// https://rollupjs.org/plugin-development/#build-hooks
// https://rollupjs.org/plugin-development/#output-generation-hooks

type Options = {
  /** Called at the begining of build, refers to Rollup [`buildStart`](https://rollupjs.org/plugin-development/#buildstart) hook. */
  buildStart?(): void;
  /** Called at the end of every output (multiple outputs will call this multiple times), refers to Rollup [`writebundle`](https://rollupjs.org/plugin-development/#writebundle) hook. */
  writeBundle?(bundle: OutputBundle): void;
};

export function vscodeTaskPlugin(options?: Options): Plugin {
  return {
    name: 'vscode-task-problem-matcher',
    buildStart: {
      order: 'pre',
      handler() {
        options?.buildStart?.();
        logBeginsPattern();
      },
    },
    writeBundle: {
      order: 'post',
      handler(_, bundle) {
        options?.writeBundle?.(bundle);
        logEndsPattern();
      },
    },
  };
}

type MultiConfigOptions = {
  /** Called at the begining of first build, refers to Rollup [`buildStart`](https://rollupjs.org/plugin-development/#buildstart) hook. */
  buildStart?(): void;
  /** Called at the end of last output, refers to Rollup [`writebundle`](https://rollupjs.org/plugin-development/#writebundle) hook. */
  writeBundle?(bundles: OutputBundle[]): void;
};

/** For multiple Rollup configs. */
export class SharedVscodeTaskPluginFactory {
  #options?: MultiConfigOptions;

  constructor(options?: MultiConfigOptions) {
    this.#options = options;
  }

  #buildStart$ = new Subject<void>();
  #buildStartBufferSize = 0;
  #buildStartSubscription?: Subscription;

  buildPlugin(): Plugin {
    this.#buildStartBufferSize += 1;
    this.#buildStartSubscription?.unsubscribe();
    this.#buildStartSubscription = this.#buildStart$.pipe(bufferCount(this.#buildStartBufferSize), tap(() => {
      logBeginsPattern();
      this.#options?.buildStart?.();
    })).subscribe();

    // Make buffered #buildStart$ emit at first buildStart event.
    for (let i = 0; i < this.#buildStartBufferSize - 1; i += 1) {
      this.#buildStart$.next();
    }

    return {
      name: 'vscode-task-problem-matcher',
      buildStart: {
        order: 'pre',
        handler: () => {
          this.#buildStart$.next();
        },
      },
    };
  }

  #writeBundle$ = new Subject<OutputBundle>();
  #writeBundleBufferSize = 0;
  #writeBundleSubscription?: Subscription;

  outputPlugin(): OutputPlugin {
    this.#writeBundleBufferSize += 1;
    this.#writeBundleSubscription?.unsubscribe();
    this.#writeBundleSubscription = this.#writeBundle$.pipe(bufferCount(this.#writeBundleBufferSize), tap((bundles) => {
      this.#options?.writeBundle?.(bundles);
      logEndsPattern();
    })).subscribe();

    return {
      name: 'vscode-task-problem-matcher',
      writeBundle: {
        order: 'post',
        handler: (_, bundle) => {
          this.#writeBundle$.next(bundle);
        },
      },
    };
  }
}

