import { Plugin } from '@nuxt/types';
import Vue from 'vue';

const addToHomeScreen = new Vue({
    data: {
        event: null,
        isAvailable: false,
        isInstalling: false,
        isInstalled: false,
    },
    methods: {
        addEventListeners() {
            if (process.server) {
                return;
            }

            window.addEventListener('beforeinstallprompt', (e) => {
                addToHomeScreen.event = e;
                addToHomeScreen.isAvailable = true;
            });
            
            window.addEventListener('appinstalled', (e) => {
                addToHomeScreen.isInstalling = false;
                addToHomeScreen.isAvailable = false;
                addToHomeScreen.isInstalled = true;
                console.log(`isInstalled = true by "appinstalled" event`);
            });
        },
        checkStatus() {
            if (process.server) {
                return;
            }

            // https://developers.google.com/web/fundamentals/app-install-banners#safari
            if ((window.navigator as any).standalone === true) {
                addToHomeScreen.isInstalled = true;
                console.log(`isInstalled = true by window.navigator.standalone === true`);
            // https://developers.google.com/web/fundamentals/app-install-banners#detect-mode
            } else if (window.matchMedia('(display-mode: standalone)').matches) {
                addToHomeScreen.isInstalled = true;
                console.log(`isInstalled = true by window.matchMedia('(display-mode: standalone)').matches`);
            }
        },
        async install() {
            addToHomeScreen.isInstalling = true;
            addToHomeScreen.event.prompt();
            try {
                const choiceResult = await addToHomeScreen.event.userChoice;
                if (choiceResult.outcome === 'accepted') {
                  addToHomeScreen.isAvailable = false;
                  console.log('User accepted the A2HS prompt');
                } else {
                    addToHomeScreen.isAvailable = true;
                    console.log('User dismissed the A2HS prompt');
                }
            } catch {
                addToHomeScreen.isAvailable = true;
                addToHomeScreen.isInstalling = false;
            }
            
            addToHomeScreen.checkStatus();
        }
    }
});

const plugin: Plugin = (context, inject) => {
    addToHomeScreen.checkStatus();
    addToHomeScreen.addEventListeners();

    inject('a2hs', addToHomeScreen);
};

export default plugin;
