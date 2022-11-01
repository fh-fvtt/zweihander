// import path from 'path';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import styles from 'rollup-plugin-styles';
import autoprefixer from 'autoprefixer';
import reporter from 'postcss-reporter';
import { viteStaticCopy } from 'vite-plugin-static-copy';
const path = require('path');

const fvttHandlebarsHML = () => ({
  name: 'vite-plugin-fvtt-handlebars-hml',
  handleHotUpdate({ file, read, server, modules }) {
    if (file.endsWith('.hbs')) {
      console.log(file);
      read().then((content) =>
        server.ws.send({
          type: 'custom',
          event: 'handlebars-update',
          data: {
            file: 'systems/zweihander/templates/' + file.split('/templates/')[1],
            content,
          },
        })
      );
      return [];
    }
    return modules;
  },
});

/** @type {import('vite').UserConfig} */
const config = {
  root: 'src/',
  base: '/systems/zweihander/',
  publicDir: path.resolve(__dirname, 'public'),
  assetsInclude: ['**/*.hbs'],
  server: {
    port: 40001,
    open: false,
    proxy: {
      '^(?!/systems/zweihander)': 'http://localhost:40000/',
      '/socket.io': {
        target: 'ws://localhost:40000',
        ws: true,
      },
    },
  },
  resolve: {
    alias: [
      {
        find: './runtimeConfig',
        replacement: './runtimeConfig.browser',
      },
    ],
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
    reportCompressedSize: true,
    // minify: 'terser',
    // terserOptions: {
    //   mangle: false,
    //   keep_classnames: true,
    //   keep_fnames: true,
    // },
    lib: {
      name: 'zweihander',
      entry: path.resolve(__dirname, 'src/index.js'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      output: {
        entryFileNames: 'index.js',
      },
    },
  },
  plugins: [
    fvttHandlebarsHML(),
    nodeResolve(),
    commonjs(),
    styles({
      mode: 'emit',
      // sourceMap: { content: true },
      use: ['sass'],
      plugins: [
        require('colorguard'),
        autoprefixer(),
        // doiuse({browsers: ['> 1.5% and last 3 versions']}),
        reporter({ clearReportedMessages: true }),
      ],
    }),
    viteStaticCopy({
      targets: [
        {
          src: [path.resolve(__dirname, 'src/templates/app/*.hbs')],
          dest: path.resolve(__dirname, 'dist/templates/app/'),
        },
        {
          src: [path.resolve(__dirname, 'src/templates/character/*.hbs')],
          dest: path.resolve(__dirname, 'dist/templates/character/'),
        },
        {
          src: [path.resolve(__dirname, 'src/templates/chat/*.hbs')],
          dest: path.resolve(__dirname, 'dist/templates/chat/'),
        },
        {
          src: [path.resolve(__dirname, 'src/templates/combat/*.hbs')],
          dest: path.resolve(__dirname, 'dist/templates/combat/'),
        },
        {
          src: [path.resolve(__dirname, 'src/templates/creature/*.hbs')],
          dest: path.resolve(__dirname, 'dist/templates/creature/'),
        },
        {
          src: [path.resolve(__dirname, 'src/templates/help/*.hbs')],
          dest: path.resolve(__dirname, 'dist/templates/help/'),
        },
        {
          src: [path.resolve(__dirname, 'src/templates/item/*.hbs')],
          dest: path.resolve(__dirname, 'dist/templates/item/'),
        },
        {
          src: [path.resolve(__dirname, 'src/templates/item-card/*.hbs')],
          dest: path.resolve(__dirname, 'dist/templates/item-card/'),
        },
        {
          src: [path.resolve(__dirname, 'src/templates/item-summary/*.hbs')],
          dest: path.resolve(__dirname, 'dist/templates/item-summary/'),
        },
        {
          src: [path.resolve(__dirname, 'src/templates/partials/*.hbs')],
          dest: path.resolve(__dirname, 'dist/templates/partials/'),
        },
      ],
    }),
  ],
};

export default config;
