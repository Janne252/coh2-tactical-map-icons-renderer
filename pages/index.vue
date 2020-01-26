<template>
    <v-app>
        <v-content>
            <v-container class="fill-height justify-center" fluid>
                <v-card class="elevation-12">
                    <v-toolbar color="primary" dark flat>
                        <v-toolbar-title>CoH2 Tactical Map Icon Renderer</v-toolbar-title>
                    </v-toolbar>
                    <v-card-text class="pt-0 pl-0 pr-0">
                        <v-row align="center" justify="center" class="ml-0 mr-0">
                            <v-col cols="12" md="6" class="pa-0">
                                <div id="canvas-container" class="d-flex justify-center align-center" ref="canvasContainer">
                                    <canvas id="canvas" ref="canvas" width="768" height="768"></canvas>
                                </div>
                            </v-col>
                            <v-col cols="12" md="6">
                                <div class="options-container">
                                    <v-file-input 
                                        label="Tactical map *.tga file" 
                                        messages="&lt;map&gt;_mm_preview.tga or &lt;map&gt;_mm_high.tga file"
                                        class="mb-4"
                                        accept="image/tga" 
                                        prepend-icon="mdi-image"
                                        v-model="tgaFile" 
                                        @change="tgaFileSelected" 
                                        outlined
                                    >
                                    </v-file-input>
                                    <v-file-input 
                                        label="Map *.info file" 
                                        messages="&lt;map&gt;.info file"
                                        class="mb-4"
                                        accept="*" 
                                        prepend-icon="mdi-file-code"
                                        v-model="infoFile" 
                                        @change="infoFileSelected" 
                                        outlined 
                                    />
                                    
                                    <v-text-field 
                                        type="number" 
                                        label="Icon overlay scale" 
                                        messages="Controls the scale of the icons overlay. Automatically calculated value is usually correct. Adjust if the icons are misaligned."
                                        class="mb-4"
                                        prepend-icon="mdi-resize"
                                        step="0.05" 
                                        v-model="iconScale" 
                                        :disabled="isLoading || !areFilesLoaded" outlined
                                    >
                                        <template v-slot:append>
                                            <v-btn title="Auto-calculate" tile @click="calculateIconScale" class="mt-n1" icon><v-icon>mdi-calculator</v-icon></v-btn>                                            
                                        </template>
                                    </v-text-field>
                                     
                                </div>
                            </v-col>
                        </v-row>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn type="button" color="primary" :disabled="!canDownload || isLoading" @click="download" :class="{'is-loading': isLoading}">
                            <v-icon>mdi-download</v-icon>
                            <span>Download as *.png</span>
                        </v-btn>
                        <v-spacer />
                        <v-btn type="button" :disabled="!canReset || isLoading" @click="reset">
                            <v-icon>mdi-delete</v-icon>
                            <span>Reset</span>
                        </v-btn>  
                    </v-card-actions>
                </v-card>
            </v-container>
        </v-content>
        <v-snackbar v-model="showInvalidTgaFileWarning">
            Please choose a valid .tga file
            <v-btn color="red" text @click="tgaFile = null; showInvalidTgaFileWarning = false">OK</v-btn>
        </v-snackbar>
        <v-snackbar v-model="showInvalidInfoFileWarning">
            Please choose a valid .info file
            <v-btn color="red" text @click="infoFile = null; showInvalidInfoFileWarning = false">OK</v-btn>
        </v-snackbar>
    </v-app>
</template>

<script lang="ts">
    import Vue from 'vue';
    import {Component, Watch} from 'nuxt-property-decorator';
    import { loadImage, downloadBlob, fileToByteArray, fileToText } from '@/utils';
    import TGALoader from 'tga-js';
    import luaparse from 'luaparse';

    @Component
    export default class IndexPage extends Vue {
        $refs: Vue['$refs'] & {
            canvas: HTMLCanvasElement;
            canvasContainer: HTMLElement;
        }

        showInvalidTgaFileWarning = false;
        tgaFile: File = null;
        showInvalidInfoFileWarning = false;
        infoFile: File = null;

        tgaFileName: string = null;
        infoFilename: string = null;
        ctx: CanvasRenderingContext2D;
        tga: TGALoader = null;
        mapData: {mapsize: number[], point_positions: {x: number, y: number, owner_id: number, ebp_name: string}[]} = null;
        iconImages: {[key: string]: HTMLImageElement} = {};
        iconScale: number = 0;

        canDownload = false;
        canReset = false;

        isTgaFileLoaded = false;
        isInfoFileLoaded = false;
        isLoading = false;

        get areFilesLoaded() {
            return this.isTgaFileLoaded && this.isInfoFileLoaded;
        }

        get mapWidth() {
            return this.mapData.mapsize[0];
        }

        get mapHeight() {
            return this.mapData.mapsize[1];
        }

        readonly tgaFileRules = [
            (file: File) => (file && file.name.endsWith('.tga')) || 'Not a valid .tga file'
        ];

        readonly infoFileRules = [
            (file: File) => (file && file.name.endsWith('.info')) || 'Not a valid .info file',
        ];

        mounted() {
            const canvas = this.$refs.canvas;
            this.ctx = canvas.getContext('2d');
            this.resizeCanvas();

            window.addEventListener('resize', () => {
            }); 
        }

        @Watch('isTgaFileLoaded')
        @Watch('isInfoFileLoaded')
        updateCanDownload() {
            this.canDownload = this.isTgaFileLoaded && this.isInfoFileLoaded;
        }

        resizeCanvas() {
            const canvas = this.$refs.canvas;

            //const copyCanvas = document.createElement('canvas');
            //copyCanvas.width = canvas.width;
            //copyCanvas.height = canvas.height;
            //copyCanvas.getContext('2d').drawImage(canvas, 0, 0);


            const canvasContainer = this.$refs.canvasContainer;
            const containerStyle = getComputedStyle(canvasContainer);

            this.$refs.canvas.width = Math.min(768, this.$refs.canvas.parentElement.offsetWidth - parseFloat(containerStyle.paddingLeft) - parseFloat(containerStyle.paddingRight));
            this.$refs.canvas.height = this.$refs.canvas.width;

            //this.ctx.drawImage(copyCanvas, 0, 0);
        }
        
        async tgaFileSelected(e: Event) {
            if (this.tgaFile) {
                if (!this.tgaFile.name.endsWith('.tga')) {
                    this.showInvalidTgaFileWarning = true;
                } else {
                    this.showInvalidTgaFileWarning = false;
                    this.isLoading = true;
                    const filepath = this.tgaFile.name.replace(/\\/g, '/');
                    const parts = filepath.split('/');
                    this.tgaFileName = parts[parts.length - 1];

                    this.tga = new TGALoader();
                    this.tga.load(await fileToByteArray(this.tgaFile));
                    this.$refs.canvas.width = this.tga.header.width;
                    this.$refs.canvas.height = this.tga.header.height;

                    this.calculateIconScale();
                    this.draw();
                    this.canReset = true;
                    this.isTgaFileLoaded = true;
                    this.isLoading = false;
                }
            } else {
                this.reset();
            }
        }

        clearInfoFile() {
            this.infoFile = null;
            this.infoFilename = null;
            this.canDownload = false;
            this.isInfoFileLoaded = false;
        }

        clearCanvas() {
            this.ctx.clearRect(0, 0, this.$refs.canvas.width, this.$refs.canvas.height);
        }

        reset() {
            this.tga = null;
            this.mapData = null;
            this.tgaFile = null;
            this.infoFile = null;
            this.tgaFileName = null;
            this.infoFilename = null;
            this.canReset = false;
            this.isTgaFileLoaded = false;
            this.isInfoFileLoaded = false;
            this.clearCanvas();
        }

        download() {
            this.isLoading = true;
            this.$refs.canvas.toBlob((result) => {
                downloadBlob(result, this.tgaFileName.replace(/.tga$/g, '.png'))
            }, 'image/png');
            
            window.setTimeout(() => {
                this.isLoading = false;
            }, 1000);
        }

        async infoFileSelected(e: Event) {
            if (this.infoFile) {
                if (!this.infoFile.name.endsWith('.info')) {
                    this.showInvalidInfoFileWarning = true;
                } else {
                    this.showInvalidInfoFileWarning = false;
                    this.isLoading = true;

                    const filepath = this.infoFile.name.replace(/\\/g, '/');
                    const parts = filepath.split('/');
                    this.infoFilename = parts[parts.length - 1];
                    const text = await fileToText(this.infoFile);

                    const ast = luaparse.parse(text);
                    const tableEntries = (ast as any).body[0].init[0].fields;

                    this.mapData = {
                        mapsize: [],
                        point_positions: []
                    }
                    
                    for (const entry of tableEntries) {
                        if (entry.key.name === 'mapsize') {
                            this.mapData.mapsize = entry.value.fields.map(o => o.value.value);
                        } else if (entry.key.name === 'point_positions') {
                            for (const pointEntry of entry.value.fields) {
                                const point = {};
                                for (const prop of pointEntry.value.fields) {
                                    point[prop.key.name] = prop.value.value != null ? prop.value.value : parseFloat(prop.value.operator + prop.value.argument.value);
                                }

                                this.mapData.point_positions.push(point as any);
                            }
                        }
                    }
                    for (const point of this.mapData.point_positions) {
                        const name = point.ebp_name + (point.owner_id > 0 ? '__' + point.owner_id : '');

                        if (!(name in this.iconImages)) {
                            const ebpImageName = ebpIconMap[name];
                            this.iconImages[name] = await loadImage(require(`~/assets/coh2/${ebpImageName}.png`));
                        }
                    }
                    
                    this.canReset = true;
                    this.isInfoFileLoaded = true;
                    this.isLoading = false;
                    this.calculateIconScale();
                    this.draw();
                }
            } else {
                this.reset();
            }          
        }

        calculateIconScale() {
            if (!this.mapData) {
                return;
            }

            this.iconScale = this.$refs.canvas.width / Math.max(this.mapWidth, this.mapHeight);
        }

        @Watch('iconScale')
        onIconScaleChanged() {
            this.draw();
        }

        draw() {
            this.clearCanvas();

            if (this.tga) {
                const imageData = this.ctx.createImageData(this.tga.header.width, this.tga.header.height);
                this.ctx.putImageData(this.tga.getImageData(imageData), 0, 0);
            }

            if (this.mapData) {
                this.ctx.save();
                this.ctx.translate(this.$refs.canvas.width / 2, this.$refs.canvas.height / 2);
                
                this.ctx.scale(this.iconScale, this.iconScale);
                const flip = (number: number) => number < 0 ? Math.abs(number) : 0 - number;

                for (const point of this.mapData.point_positions) { 
                    const name = point.ebp_name + (point.owner_id > 0 ? '__' + point.owner_id : '');
                    const icon = this.iconImages[name];
                    let x = (point.x) - icon.naturalWidth / 2;
                    let y = (flip(point.y)) - icon.naturalHeight / 2;
                    
                    this.ctx.drawImage(icon, x, y);
                }

                this.ctx.restore();
            }
        }
    }

    const ebpIconMap: any = {
        ['territory_point']: 'Icons_symbols_flag_null_symbol',
        ['territory_point_mp']: 'Icons_symbols_flag_null_symbol',
        ['starting_position_shared_territory__1000']: 'Icons_minimap_mm_starting_point_1',
        ['starting_position_shared_territory__1001']: 'Icons_minimap_mm_starting_point_2',
        ['starting_position_shared_territory__1002']: 'Icons_minimap_mm_starting_point_3',
        ['starting_position_shared_territory__1003']: 'Icons_minimap_mm_starting_point_4',
        ['starting_position_shared_territory__1004']: 'Icons_minimap_mm_starting_point_5',
        ['starting_position_shared_territory__1005']: 'Icons_minimap_mm_starting_point_6',
        ['starting_position_shared_territory__1006']: 'Icons_minimap_mm_starting_point_7',
        ['starting_position_shared_territory__1007']: 'Icons_minimap_mm_starting_point_8',
        ['victory_point']: 'Icons_symbols_flag_victory_symbol',
        ['territory_munitions_point']: 'Icons_symbols_building_common_munitions_symbol',
        ['territory_munitions_point_mp']: 'Icons_symbols_building_common_munitions_symbol',
        ['territory_fuel_point']: 'Icons_symbols_flag_fuel_symbol',
        ['territory_fuel_point_mp']: 'Icons_symbols_flag_fuel_symbol', 
        ['support_bay']: 'Icons_symbols_building_common_support_bay_symbol', 
        ['watchtower']: 'Icons_symbols_building_common_guard_tower_symbol', 
    };
</script>

<style lang="scss">
    @import '~vuetify/src/styles/settings/_index.sass';

    body {
        font-family: $body-font-family;
    }

    #canvas {
        max-width: 100%;
    }

    #canvas-container {
        background-image: url('~assets/backgrounds/squares.png');
        background-repeat: repeat;
        padding: 8px;
    }
</style>
