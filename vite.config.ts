import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'MyUniversalEditor',
            fileName: 'my-universal-editor',
            formats: ['es', 'umd']
        },
        rollupOptions: {
            // Make sure to externalize deps that shouldn't be bundled
            // into your library
            external: [
                'react',
                'react-dom',
                'lexical',
                '@lexical/react',
                '@lexical/rich-text',
                '@lexical/history',
                '@lexical/utils',
                '@lexical/list',
                '@lexical/clipboard',
                '@lexical/code',
                '@lexical/html',
                '@lexical/link',
                '@lexical/table',
                '@lexical/selection'
            ],
            output: {
                // Provide global variables to use in the UMD build
                // for externalized deps
                globals: {
                    'lexical': 'Lexical',
                    '@lexical/react': 'LexicalReact',
                    '@lexical/rich-text': 'LexicalRichText'
                }
            }
        }
    },
    plugins: [
        dts({
            insertTypesEntry: true,
        })
    ]
});
