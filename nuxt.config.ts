import { Configuration } from '@nuxt/types';
import * as path from 'path';
import uuid4 from 'uuid/v4';

const baseUrl = '/coh2-tactical-map-icons-renderer/';

const META = {
    title: 'CoH2 Tactical Map Icons renderer',
    shortTitle: 'COH2 Tacmap Icons Renderer',
    description: 'Generates a tactical map preview image with starting position and strategic point icons from <map>_mm_preview.tga / <map>_mm_high.tga and <map>.info files.',
    themeColor: '#000000',
    startUrl: baseUrl,
    loadingBarColor: '#000000',
};

export default <Configuration> {
    buildDir: './dist/app/',
    generate: {
        dir: './docs/'
    },

    env: {
        version: require('./package.json').version,
    },

    // Modules that process the source code
    buildModules: [
        '@nuxt/typescript-build',
        '@nuxtjs/vuetify',
    ],

    modules: [
        '@nuxtjs/pwa',
    ],

    head: { title: META.title },
    loading: { color: META.loadingBarColor },

    router: {
        base: baseUrl,
    },

    pwa: {
        workbox: {
            // disable default generated entry
            offline: false,
            // preCaching: [
            //     { 
            //         url: baseUrl, 
            //         revision: uuid4()
            //     }
            // ],
            runtimeCaching: [
                {
                    urlPattern: '/.*', 
                    handler: 'networkFirst', 
                    strategyOptions: {
                        cacheableResponse: {statuses: [0, 200]}
                    }
                },
            ]
        },
        icon: {
            iconSrc: path.resolve('./assets/logo.png'),
        },
        manifest: {
            name: META.title,
            short_name: META.shortTitle,
            description: META.description,
            theme_color: META.themeColor,
            start_url: META.startUrl,
        },
        meta: {
            favicon: true,
            name: META.title,
            description: META.description,
            theme_color: META.themeColor,
        }
    },

    plugins: [
        { src: '~/plugins/add-to-homescreen.ts' }
    ],
    
    vuetify: <any> {
        defaultAssets: false,
        theme: {
            // remove when https://github.com/nuxt-community/vuetify-module/issues/208 is fixed
            disable: true,
        }
    },

    css: [
        'roboto-fontface/css/roboto/sass/roboto-fontface.scss',
        '@mdi/font/scss/materialdesignicons.scss',
        // remove when https://github.com/nuxt-community/vuetify-module/issues/208 is fixed
        'vuetify/dist/vuetify.css',
    ],
}