import { default as typescript } from '@rollup/plugin-typescript';
import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { rollup as rollupBuild, watch as rollupWatch, type InputOptions, type OutputOptions, type RollupBuild } from 'rollup';

// https://rollupjs.org/javascript-api/
// https://github.com/rollup/plugins/tree/master/packages/typescript

const inputOptions: InputOptions = {
  input: [
    './src/common.ts',
    './src/node.ts',
    './src/webpack.ts',
  ],
  plugins: [
    typescript({
      compilerOptions: {
        noEmit: false,
        emitDeclarationOnly: true,
        target: 'es2022',
        declaration: true,
        rootDir: './src',
        declarationDir: './out',
        declarationMap: true,
      },
    }),
  ],
};

const outputOptionsList: OutputOptions[] = [
  {
    dir: 'out',
    format: 'cjs',
    entryFileNames: '[name].cjs',
    sourcemap: true,
  },
  {
    dir: 'out',
    format: 'esm',
    entryFileNames: '[name].mjs',
    sourcemap: true,
  },
];

async function build() {
  const bundle = await rollupBuild(inputOptions);
  await cleanOutputs(bundle);
  await writeOutputs(bundle);
  await bundle.close();
  process.exit(0);
}

async function watch() {
  const watcher = await rollupWatch({
    ...inputOptions,
    output: outputOptionsList,
  });
  watcher.on('event', (e) => {
    console.log('[Rollup Event]', e.code);
    if (e.code === 'BUNDLE_END') {
      e.result.close();
    }
  });
}

async function cleanOutputs(bundle: RollupBuild) {
  await rm(resolve('out'), {
    recursive: true,
    force: true,
  });
}

async function writeOutputs(bundle: RollupBuild) {
  for (const outputOptions of outputOptionsList) {
    await bundle.write(outputOptions);
  }
}

if (require.main === module) {
  if (process.argv[2] === '--watch') {
    watch();
  } else {
    build();
  }
}
