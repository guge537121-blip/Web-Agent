import type { UserConfig } from 'tsdown'

const CLIENT_EXTERNALS = [
  'react',
  'react/jsx-runtime',
  '@deepseek-ai/cordis',
]

const clientConfig: UserConfig = {
  name: 'dsh-web-agent/client',
  entry: { client: 'src/client.tsx' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  dts: false,
  sourcemap: true,
  clean: false,
  external: CLIENT_EXTERNALS,
  noExternal: (id: string) => (CLIENT_EXTERNALS.includes(id) ? undefined : true),
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
  },
  outputOptions: {
    entryFileNames: 'client.js',
    codeSplitting: false,
    banner: 'window.__ModuleLoader__.load({ id: "dsh-web-agent", factory: (require) => {',
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
}

export default clientConfig
