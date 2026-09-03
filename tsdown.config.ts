import type { UserConfig } from 'tsdown'

const CLIENT_EXTERNALS = [
  'react',
  'react/jsx-runtime',
  'cordis',
]

const clientConfig: UserConfig = {
  entry: { client: 'src/client.tsx' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  dts: false,
  sourcemap: true,
  clean: false,
  external: CLIENT_EXTERNALS,
  outputOptions: {
    entryFileNames: 'client.js',
    codeSplitting: false,
    banner: 'window.__ModuleLoader__.load({ id: "dsh-web-agent", factory: (require) => {',
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
}

export default clientConfig
