import { Configuration } from '@nuxt/types';

export default <Configuration> {
    buildDir: './dist/app/',
    generate: {
        dir: './docs/'
    },
    // Modules that process the source code
    buildModules: [
        '@nuxt/typescript-build',
        '@nuxtjs/vuetify',
    ],

    modules: [
        '@nuxtjs/pwa',
    ],

    head: {
        title: 'CoH2 Tactical Map Icon Renderer',
    }
}