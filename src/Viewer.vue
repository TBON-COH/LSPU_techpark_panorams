<!--Версия 23. На этот раз обновление небольшое. Просто сюда добавлю пару простых кнопок со ссылками-->
<!--По началу идея была использовать поисковик. Но так как масштаб слишком мал, чтобы что нибудь искать, пусть это будут кнопки выбора качества изображений-->
<template>
<div id="app" class="VueApp">
  <!-- Если на трубе, то перед панелькой надо добавить кнопочку -->
  <button v-if="ETOMobile" class="BURGER" :class="{ active: RPanelOpenOrNot }"@click="OpenCloseRPanel">
    <!--Я это точно забуду. SPAN ЭТО ПОЛОСКИ БУРГЕРА! Они нужны-->
    <span></span>
    <span></span>
    <span></span>
  </button>
  <div ref="PanoramaPlayer" class="viewer"></div>

  <div class="RigthPanel" :class="{ 'mobile-panel': ETOMobile,'panel-open': RPanelOpenOrNot }"><!--Версия 20. RigthPanel преображается. Bool переменные читаются на ходу, и не нуждаются в спецфункции для перехода состояния. Слава Vue3!-->
    <div class="SceneList">
      <!--<h3>Доступные переходы</h3>-->
      <div
        v-for="scene in visibleScenes"
        :key="scene.id"
        class="SceneExemplar"
        :class="{ active: scene.id === currentSceneId }"
        @click="handleSceneClick(scene.id)"
      >
        {{ scene.name }}
      </div>
      <!-- Версия 23. Новые кнопки после бургера будут здесь-->
    <h3>Качество</h3> 
     <div class="Quality">
     <button class="QBut" @click="ChangeScenario1">Быстр</button>
     <button class="QBut" @click="ChangeScenario2">Средн</button>
     <button class="QBut" @click="ChangeScenario3">Выс</button>
      </div>
      <!--Такое на постоянную основу не тянет. В итоге, лучше этот блок потом скоментировать-->
    </div>

    <div class="LayerPreview">
      <div class="MapPreview">
        <img
          v-if="currentMapImage"
          :src="currentMapImage"
          alt="map"
          class="MapImage"
          draggable="false"
        />
        <div
          v-for="marker in filteredMapMarkers"
          :key="marker.id"
          class="WarpPoint"
          :class="{ active: marker.sceneId === currentSceneId }"
          :style="{ left: marker.x + 'px', top: marker.y + 'px' }"
          @click="goToSceneFromMap(marker)"
          :title="getSceneName(marker.sceneId)"
        >
          <div class="WarpPointCenter"></div>
        </div>
      </div>
      <!--А давай спрячем это-->
        <!--<div class="LayerSelector">
          <div class="LayerList">
            <button
              v-for="map in maps"
              :key="map.id"
              :class="{ active: currentMapId === map.id }"
              @click="currentMapId = map.id"
              :title="map.name"
            >
              {{ map.name }}
            </button>
          </div>
        </div>-->
        <!--Может быть зря я это сделал. А может и нет. ХЗ-->
    </div>
  </div>
</div>
</template>

<script>
import { Viewer } from 'photo-sphere-viewer';
import { MarkersPlugin } from 'photo-sphere-viewer/dist/plugins/markers';
import 'photo-sphere-viewer/dist/photo-sphere-viewer.css';
import 'photo-sphere-viewer/dist/plugins/markers.css';
import ScenarioService from './services/ScenarioService';

export default {
  //Инициализируемся
  name: 'PanoramaViewer',
  props: {
    scenario: {
      type: String,
      default: 'default'
    }
  },
  data() {
    return {
      PanoramaPlayer: null,
      MarkersPlugin: null,
      scenarioService: null,

      globalCameraState: {
        longitude: 0,
        latitude: 0,
        zoomLvl: 50
      },

      currentSceneId: '',
      currentMapId: '',

      scenes: [],
      maps: [],
      warps: [],
      
      ETOMobile: false,  //Версия 20. Статус мобильного
      RPanelOpenOrNot: false,
      
      //Версия23. По хорошему сценарии не хотят переопределятья. Кажется придётся сделать несколько больше, чем просто кнопки
      //Копируем props-у!
      currentScenario: this.scenario
    };
  },
  //Заинициализировались
  //В computed ложим всё, что подлежит постоянному переприсвоению
    computed: {
    currentScene() {
      return this.scenes.find(s => s.id === this.currentSceneId);
    },
    currentMap() {
      return this.maps.find(m => m.id === this.currentMapId);
    },
    currentMapImage() {
      return this.currentMap?.image;
    },
    filteredMapMarkers() {
      if (!this.currentMap) return [];
      return this.warps.filter(w => w.mapId === this.currentMap.id);
    },
    warpPoints() {
      return this.scenes.map(s => ({ id: s.id, name: s.name }));
    },
    visibleScenes() {
      return this.scenes.filter(scene => scene.visible !== false);
    }
  },

  mounted() {
    this.CheckScreenSize();
    window.addEventListener('resize', this.CheckScreenSize);
    this.loadScenario(this.scenario).then(() => {
      this.$nextTick(() => this.InitPanoramaPlayer());
    });
  },

  watch: {    //Кажется это надо скрыть, но это не точно
    async scenario(newScenario) {
      await this.loadScenario(newScenario);
      this.DestroyPanoramaPlayer();
      this.$nextTick(() => this.InitPanoramaPlayer());
    }
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.CheckScreenSize);
    this.DestroyPanoramaPlayer();
  },

  methods: {
    CheckScreenSize() { // Версия20. Размеры определяют тип устройства
      this.ETOMobile = window.innerWidth <= 768;
      if (this.ETOMobile) {
        this.RPanelOpenOrNot = false;
      }
    },

    OpenCloseRPanel() {// Версия20. Здесь мы открываемся и закрываемся
      this.RPanelOpenOrNot = !this.RPanelOpenOrNot;
    },

    handleSceneClick(sceneId) {
      this.SwitchScene(sceneId);
      // Если на трубе тыкнул, то панель закрывается
      if (this.ETOMobile) {
        this.RPanelOpenOrNot = false;
      }
    },

    async loadScenario(scenarioName, NewInitionalScene, NewLon, NewLat, Zoom) {
      this.scenarioService = new ScenarioService();

      try {
        const scenario = await this.scenarioService.loadScenario(scenarioName);
        this.currentScenario = scenarioName; //Версия 23. Начинаем переобуваться здесь.
        //Остаётся верить, что это не сломает
        //Также переопределяем стартовую сцену
        if (NewInitionalScene) {
          scenario.initialScene = NewInitionalScene;
          scenario.initialCameraLongitude = NewLon;
          scenario.initialCameraLatitude = NewLat;
        }//////////////////
        else{
          Zoom = 50;
        }

        this.scenes = scenario.scenes || [];
        this.maps = scenario.maps || [];
        this.warps = scenario.warps || [];

        this.currentSceneId = scenario.initialScene || (this.scenes[0]?.id || '');
        this.currentMapId = scenario.initialMap || (this.maps[0]?.id || '');

        this.initialCameraLongitude = scenario.initialCameraLongitude ?? 0;
        this.initialCameraLatitude = scenario.initialCameraLatitude ?? 0;

        this.globalCameraState = {//До 20 версии не было GCS как в прогрузке между сцен. Теперь есть нужда ставить стартовую позицию
        longitude: this.initialCameraLongitude,
        latitude: this.initialCameraLatitude,
        zoomLvl: Zoom
        };

        this.scenes.forEach(scene => {
          if (!scene.markers) {
            scene.markers = [];
          } else {
            scene.markers.forEach(marker => {
              if (!marker.type) {
                if (marker.circle !== undefined) {
                  marker.type = 'circle';
                } else if (marker.html !== undefined) {
                  marker.type = 'html';
                }/*else if (marker.image !== undefined) {
                  marker.type = 'image';
                }*/
              }

              if (marker.type === 'circle' && !marker.svgStyle) {
                marker.svgStyle = {
                  fill: 'rgba(255, 0, 0, 0.3)',
                  stroke: '#ff0000',
                  strokeWidth: '3px'
                };
              }

              if (marker.type === 'html' && !marker.style) {
                marker.style = {
                  maxWidth: '30px',
                  color: 'white',
                  fontSize: '20px',
                  textShadow: '0 0 10px black'
                };
              }
              /*if (marker.type === 'image' && !marker.size) {
                marker.size = { width: 40, height: 40 };
              }*/
            });
          }
        });

      } catch (error) {
        await this.loadEmptyScenario();//Если что-то пойдёт не так, то запустить эту "тыкву". Всё же лучше чем пустая страница
      }
    },

    /*async loadDefaultScenario() { Заменено на loadEmptyScenario.
      this.scenes = [
        {
          id: 'scene1',
          panorama: '/scenarios/default/p_res/hata.jpg',
          name: 'Сцена 1 - Хата',
          markers: [
            {
              id: 'to-scene2',
              type: 'circle',
              tooltip: 'В ТЦ',
              circle: 25,
              svgStyle: {
                fill: 'rgba(0, 255, 0, 0.3)',
                stroke: '#00ff00',
                strokeWidth: '3px'
              },
              longitude: 4.0,
              latitude: -0.4,
              target: 'scene2'
            }
          ]
        }
      ];

      this.maps = [
        {
          id: 'default_map',
          name: 'Основная карта',
          type: 'floor',
          image: '/scenarios/default/m_res/test_map.png'
        }
      ];

      this.warps = [
        { id: 'm1', mapId: 'default_map', sceneId: 'scene1', x: 80, y: 120 }
      ];

      this.currentSceneId = 'scene1';
      this.currentMapId = 'default_map';
    },*/

    async loadEmptyScenario() {
      this.scenes = [];
      this.maps = [];
      this.warps = [];
      this.currentSceneId = '';
      this.currentMapId = '';
    },

    DestroyPanoramaPlayer() {
      if (this.PanoramaPlayer) {
        this.PanoramaPlayer.destroy();
        this.PanoramaPlayer = null;
      }
    },

    InitPanoramaPlayer() {
      const scene = this.currentScene;
      if (!scene) return;

      const { longitude, latitude, zoomLvl } = this.globalCameraState;

      this.PanoramaPlayer = new Viewer({
        container: this.$refs.PanoramaPlayer,
        panorama: scene.panorama,
        caption: scene.name,
        defaultLong: longitude,
        defaultLat: latitude,
        defaultZoomLvl: zoomLvl,
        //За отсутствие многопотока, очень заметно, как сцена грузится вперёд маркеров. Но выводить в два потока WEB JS VUE приложение... А может не надо?
        plugins: [[MarkersPlugin, { markers: this.PrepareMarkersForPPlayer() }]]
      });

      this.MarkersPlugin = this.PanoramaPlayer.getPlugin(MarkersPlugin);

      this.MarkersPlugin.on('select-marker', (e, marker) => {
        if (marker.config.target) {
          this.SwitchScene(marker.config.target);
        }
      });

      this.PanoramaPlayer.on('position-updated', this.updateGlobalCameraState);
      this.PanoramaPlayer.on('zoom-updated', this.updateGlobalCameraState);
    },

    PrepareMarkersForPPlayer() {
      if (!this.currentScene?.markers) return [];

      return this.currentScene.markers
        .filter(marker => marker && marker.id)
        .map(marker => {
          const baseConfig = {
            id: marker.id,
            longitude: marker.longitude || 0,
            latitude: marker.latitude || 0,
            target: marker.target || null
          };

          if (marker.tooltip && marker.tooltip.trim()) {
            baseConfig.tooltip = marker.tooltip.trim();
          }
          // Если маркер есть, но его детали не указаны
          let markerType = marker.type;
          if (!markerType) {
            if (marker.circle !== undefined) {
              markerType = 'circle';
            } else if (marker.html !== undefined) {
              markerType = 'html';
            } 
            /* else if (marker.image !== undefined) {
              markerType = 'image';
            }*/
              else {
              return null;
            }
          }

          switch (markerType) {
            case 'circle':
              return {
                ...baseConfig,
                circle: marker.circle || 25,
                svgStyle: marker.svgStyle || {
                  fill: 'rgba(255, 0, 0, 0.3)',
                  stroke: '#ff0000',
                  strokeWidth: '3px'
                }
              };

            case 'html':
              return {
                ...baseConfig,
                html: marker.html || '🗿',
                anchor: marker.anchor || 'bottom center',
                style: marker.style || {
                  maxWidth: '30px',
                  color: 'white',
                  fontSize: '20px',
                  textShadow: '0 0 10px black'
                }
              };

              /*case 'image':
              return {
                ...baseConfig,
                image: marker.image || '',
                anchor: marker.anchor || 'bottom center',
                size: marker.size || { width: 40, height: 40 }
              };*/
              
            default:
              return null;
          }
        })
        .filter(marker => marker !== null);
    },

    updateGlobalCameraState() {
      if (!this.PanoramaPlayer) return;
      const pos = this.PanoramaPlayer.getPosition();
      const zoom = this.PanoramaPlayer.getZoomLevel();
      this.globalCameraState = {
        longitude: pos.longitude,
        latitude: pos.latitude,
        zoomLvl: zoom
      };
    },

    /*SwitchScene(id) {//Давай попробуем новое. С 17 версии работаем с плавным переходом
      if (id === this.currentSceneId) return;

      this.updateGlobalCameraState();
      this.currentSceneId = id;

      this.DestroyPanoramaPlayer();
      this.$nextTick(() => this.InitPanoramaPlayer());
    },*/

    async SwitchScene(id) {
      if (id === this.currentSceneId) return;

      this.updateGlobalCameraState();

      const currentScene = this.currentScene;
      this.currentSceneId = id;
      const nextScene = this.currentScene;

      if (!this.PanoramaPlayer || !currentScene || !nextScene) return;

      try {//Пробуем по хорошему сделать плавный переход
        this.MarkersPlugin.setMarkers([]); //1! Пусть сначала маркеры исчезнут
        await this.PanoramaPlayer.setPanorama(nextScene.panorama, {//2! Потом сделаем переход
            //transitionDuration: 100, //Не красиво выходит. Словно не задержка перехода, а задержка в развитии
            transition: 500,
            caption: nextScene.name
         });
        if (this.MarkersPlugin) {//3! Затем загрузим новые маркеры
            //await new Promise(resolve => setTimeout(resolve, 100)); смотри коментарий на 6 строчек выше
            this.MarkersPlugin.setMarkers(this.PrepareMarkersForPPlayer(), {transition: 5000});
        }

        // После await. Чтобы маркеры не спешили вперёд паравоза
        // P.S. А х там! Это очень заметно и режет глаз. Пусть до await грузятся
        
      } catch (error) {
         // Если по хоролшему не хочет, то попробуем старый способ(до 17 версии)
         this.DestroyPanoramaPlayer();
         this.$nextTick(() => this.InitPanoramaPlayer());
      }
    },

    goToSceneFromMap(marker) {
      this.SwitchScene(marker.sceneId);
      if (this.ETOMobile) {
        this.RPanelOpenOrNot = false;
      }
    },

    getSceneName(id) {
      const s = this.scenes.find(x => x.id === id);
      return s ? s.name : id;
    },

    //Версия23. А может быть я зря так делаю?
    ChangeScenario1() {
        //this.$router.push('/viewer/techpark_lite');
        this.DestroyPanoramaPlayer();
        this.loadScenario("techpark_lite", this.currentSceneId, this.globalCameraState.longitude, this.globalCameraState.latitude, this.globalCameraState.zoomLvl).then(() => {
          this.$nextTick(() => this.InitPanoramaPlayer());
        });
    },
    ChangeScenario2() {
        //this.$router.push('/viewer/default');
        this.DestroyPanoramaPlayer();
        this.loadScenario("default", this.currentSceneId, this.globalCameraState.longitude, this.globalCameraState.latitude, this.globalCameraState.zoomLvl).then(() => {
          this.$nextTick(() => this.InitPanoramaPlayer());
        });
    },
    ChangeScenario3() {
        //this.$router.push('/viewer/techpark_8k');
        this.DestroyPanoramaPlayer();
        this.loadScenario("techpark_8k", this.currentSceneId, this.globalCameraState.longitude, this.globalCameraState.latitude, this.globalCameraState.zoomLvl).then(() => {
          this.$nextTick(() => this.InitPanoramaPlayer());
        });
    }
    
  }
};
</script>

<style scoped>
.VueApp {
  display: flex;
  height: 100vh;
  background: #0f0f0f;
  position: relative;
  overflow: hidden;
}

.viewer {
  flex: 1;
  height: 100%;
  background: #000;
}


.RigthPanel {
  width: 320px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #282c24 0%, #1e1e1e 30%);
  color: #d4d4d4;
  border-left: 1px solid #404040;
  overflow: hidden;
  transition: transform 0.3s ease;/*Время для перехода с ПК на мобайл*/
}

@media (max-width: 768px) {
  .RigthPanel.mobile-panel {
    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    width: 320px;
    min-width: 320px;  /*Почему то панель сжимается. Избегаем!*/
    transform: translateX(100%);
    z-index: 1000;
    
  }

  .RigthPanel.mobile-panel.panel-open {/*Vue3 умеет находу менять класс объекту. Сменив простой на .panel-open, мы меняем translateX не трогая его напрямую. Вернув класс на место, вернётся и translateX*/
    transform: translateX(0);
  }

  .BURGER {
    position: fixed;
    top: 16px;
    right: 16px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(45, 45, 45, 0.9);
    border: 1px solid #404040;
    backdrop-filter: blur(10px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    z-index: 1001;
    padding: 0;
    transition: all 0.3s ease;
  }

/*Реализация анимации перехода с гамбургера на крестик и обратно*/ 
  .BURGER span {
    display: block;
    width: 24px;
    height: 2px;
    background: #d4d4d4;
    transition: all 0.3s ease;
  }

  .BURGER.active span:nth-child(1) {
    transform: rotate(45deg) translate(6px, 6px);
  }

  .BURGER.active span:nth-child(2) {
    opacity: 0;
  }

  .BURGER.active span:nth-child(3) {
    transform: rotate(-45deg) translate(6px, -6px);
  }

  /*На некоторых экранах телефонах карта видна не вся(А для кого-то да). Пойду на жертву, сделав немного нижнего пространства пустым*/
  .LayerPreview{
    margin-bottom: 40px;
  }

}

.SceneList {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  border-bottom: 1px solid #404040;
}

.SceneList h3 {
  margin: 0 0 16px 0;
  font-size: 25px;
  font-weight: 500;
  color: #d4d4d4;
  text-align: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #404040;
  letter-spacing: 0.5px;
}

.SceneExemplar {
  padding: 10px 10px;
  border-radius: 0;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-left: 4px solid transparent;
  font-size: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.SceneExemplar:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateX(8px);
  border-left-color: #888;
  border-color: rgba(255, 255, 255, 0.1);
}

.SceneExemplar.active {
  background: rgb(255, 255, 255);
  color: #000000;
  border-color: #e6e6e6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border-color: rgba(233, 233, 233, 0.3);
}

.LayerPreview {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 10px;
  height: 320px;
  border-top: 1px solid #404040;
  background: rgba(0, 0, 0, 0.2);
}

.MapPreview {
  position: relative;
  width: 300px;
  height: 300px;
  background: #2d2d2d;
  border-radius: 0;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid #404040;
}

.MapImage {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.WarpPoint {
  position: absolute;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
  transform: translate(-150%, -50%);/* Эта гадость съехала! Корректируем */
}

.WarpPointCenter {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #000000;
  border: 3px solid #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;
  position: relative;
}

.WarpPointCenter::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  background: #fff;
  border-radius: 50%;
}

.WarpPoint.active .WarpPointCenter {
  background: #ff6b6b;
  transform: scale(1.2);
}

.WarpPoint:hover .WarpPointCenter {
  transform: scale(1.4);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
}

.Quality {
  padding:10px;
  border-radius:0;
  margin-bottom:8px;
  cursor:pointer;
  border-left:4px solid transparent;
  font-size:20px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;    
}
.QBut {
  min-width: 80px; 
  padding:10px;
  border-radius:0;
  margin-bottom:0;
  margin-left:0px;
  background:#ffffff08;
  color:#fff;
  cursor:pointer;
  transition:all .3s cubic-bezier(.4,0,.2,1);
  border-left:4px solid transparent;
  font-size:20px;
  -webkit-backdrop-filter:blur(10px);
  backdrop-filter:blur(10px);
  border:1px solid rgba(255,255,255,.05)
}
.QBut:hover{
  background: rgb(255, 255, 255);
  color: #000000;
  border-color: #e6e6e6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border-color: rgba(233, 233, 233, 0.3);
}

@media (max-width: 480px) {
  .RigthPanel.mobile-panel {
    width: 85%;
  }
}
</style>