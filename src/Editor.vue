<!--Версия 23.2. Испправление багов. И ещё я решил добавить поисковую строку-->
<template>
  <div id="app" class="VueApp">
    <!--Проигрыватель панорамы-->
    <div ref="PanoramaPlayer" class="editor">
      <div class="EditorToolBar">
        <div class="toolbar">
          <button @click="AddSceneMarker" class="ToolBarButtons">
          Добавить маркер
          </button>
          <button @click="SaveScenario" class="ToolBarButtons save-btn">
          Сохранить
          </button>
          <button @click="ExitEditor" class="ToolBarButtons exit-btn">
            ← Выйти
          </button>
        </div>
        
        <!--Редактор маркеров-->
        <div v-if="OnEditingMarker" class="MarkerEditor">
          <h4>Редактирование маркера</h4>

          <!--Выбор типа маркера-->
          <div class="MarkerEditorParameters">
            <label>Тип маркера:</label>
            <select v-model="OnEditingMarker.type" @change="OnMarkerTypeChange">
              <option v-for="type in markerTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
          </div>

          <!--Общие параметры-->
          <div class="MarkerEditorParameters">
            <label>ID маркера:</label>
            <input v-model="OnEditingMarker.id" type="text">
          </div>

          <div class="MarkerEditorParameters">
            <label>Подсказка при наведений:</label>
            <input v-model="OnEditingMarker.tooltip" type="text">
          </div>

          <div class="MarkerEditorParameters">
            <label>Координаты:</label>
            <div class="Coords">
              <input v-model.number="OnEditingMarker.longitude" type="number" step="0.1" placeholder="Долгота">
              <input v-model.number="OnEditingMarker.latitude" type="number" step="0.1" placeholder="Широта">
            </div>
          </div>

          <div class="MarkerEditorParameters">
            <label>Переход к сцене:</label>
            <select v-model="OnEditingMarker.target">
              <option value="">-- Без перехода --</option>
              <option v-for="scene in scenes" :key="scene.id" :value="scene.id">
                {{ scene.name }}
              </option>
            </select>
          </div>

          <!--Параметры для кругового маркера-->
          <div v-if="OnEditingMarker.type === 'circle'" class="MarkerEditorDiffTypeParameters">
            <h5>Параметры круга</h5>
            <div class="MarkerEditorParameters">
              <label>Радиус:</label>
              <input v-model.number="OnEditingMarker.circle" type="number" min="1" max="100">
            </div>
            <div class="MarkerEditorParameters">
              <label>Цвет заливки:</label>
              <input v-model="OnEditingMarker.svgStyle.fill" type="color">
              <input v-model="OnEditingMarker.svgStyle.fill" type="text" placeholder="RGBA">
            </div>
            <div class="MarkerEditorParameters">
              <label>Цвет обводки:</label>
              <input v-model="OnEditingMarker.svgStyle.stroke" type="color">
              <input v-model="OnEditingMarker.svgStyle.stroke" type="text" placeholder="#hex">
            </div>
            <div class="MarkerEditorParameters">
              <label>Толщина обводки:</label>
              <input v-model="OnEditingMarker.svgStyle.strokeWidth" type="text" placeholder="3px">
            </div>
          </div>

          <!--Параметры для HTML маркера-->
          <div v-if="OnEditingMarker.type === 'html'" class="MarkerEditorDiffTypeParameters">
            <h5>Параметры маркера со смайликом</h5>
            <div class="MarkerEditorParameters">
              <label>HTML эмодзи:</label>
              <input v-model="OnEditingMarker.html" type="text" placeholder="🖼️, ℹ️, ⭐, 🗿">
            </div>
            <div class="MarkerEditorParameters">
              <label>Размер шрифта (Если помимо HTML смайла есть текст):</label>
              <input v-model="OnEditingMarker.style.fontSize" type="text" placeholder="20px">
            </div>
            <div class="MarkerEditorParameters">
              <label>Расзмер эмодзи:</label>
              <input v-model="OnEditingMarker.style.maxWidth" type="text" placeholder="30px">
            </div>
          </div>

          <!--Кнопки управления-->
          <div class="EditorFunctions">
            <button @click="UpdateMarkerPosition" class="BtnBasicPattern">
            Обновить позицию
            </button>
            <button @click="SaveMarker" class="BtnGreenPattern">Сохранить маркер</button>
            <button @click="DeleteMarker" class="BtnRedPattern">Удалить</button>
            <button @click="CancelEdit" class="BtnBasicPattern">Отмена</button>
          </div>
        </div>

        <!--Панель управления камерой для позиционирования-->
        <div v-if="OnSetPosition" class="EditorSetBaseCameraPosition">
          <h4>Позиционирование маркера</h4>
          <p>Используйте прицел для установки позиции маркера</p>
          <div class="coord-display">
            Долгота: {{ currentCameraPosition.longitude?.toFixed(2) }}<br>
            Широта: {{ currentCameraPosition.latitude?.toFixed(2) }}
          </div>
          <button @click="SyncPosFromCameraNOW" class="BtnGreenPattern">
            Установить текущую позицию
          </button>
          <button @click="OnSetPosition = false" class="BtnBasicPattern">
            Отмена
          </button>
        </div>

        
      </div>

    <!-- Прицел  -->
        <div v-if="OnSetPosition" class="CrosshairOverlay">
          <div class="Crosshair">
            <div class="Crosshair-line Crosshair-vertical"></div>
            <div class="Crosshair-line Crosshair-horizontal"></div>
            <div class="Crosshair-center-point"></div>
          </div>
        </div>

    </div>

    <!--Правая панель редактора-->
    <div class="RigthPanel">
      <!--Управление сценами-->
      <div class="SceneManager">
        <h3>Управление сценами</h3>
        <button @click="AddNewScene" class="BtnGreenPattern">+ Добавить сцену</button>
        
         <!--Версия 23.2. Поиск сцены-->
        <div class="SceneSearch">
              <label>Поиск сцены из списка:</label>
              <input type="text" placeholder="Название сцены" v-model="sceneSearchQuery"> <!--Поиск сцены по совпадению scene.name -->
            </div>

        <div class="SceneList">
          <!-- До 23.2. вместо "filteredScenes" было "scenes"-->
          <div
            v-for="scene in filteredScenes" 
            :key="scene.id"
            class="SceneExemplar"
            :class="{ active: scene.id === currentSceneId }"
            @click="SelectScene(scene.id)"
          >
            <span>{{ scene.name }}</span>
            <div class="SceneMarkersCount">
              {{ scene.markers?.length || 0 }} маркеров
            </div>
            <button @click.stop="EditScene(scene)" class="BtnImmersivePattern">изменить</button>
            <button @click.stop="DeleteScene(scene.id)" class="BtnImmersivePattern">🗑️</button>
          </div>
        </div>
        <div class="Starter">
        <label for="StartScene">Стартовая сцена:</label>
        <select
        id="StartScene"
        v-model="StartSceneId"
        @change="onStartSceneChange"
        >
        <option value="">--Оставить это судьбе--</option>
        <option v-for="scene in scenes" :key="scene.id" :value="scene.id">
          {{ scene.name }}
        </option>
      </select>
      <!--С версии 20 я добавляю стартовую позицию-->
      <div class="CameraInitialPosition"> 
        <h4>Начальная позиция камеры</h4>
        <div class="CameraControls">
         <div class="CameraInput">
          <label>Долгота (радианы):</label>
           <input 
            v-model.number="initialCameraLongitude" 
            type="number" 
            placeholder="0"
           >
      </div>
      <div class="CameraInput">
        <label>Широта (радианы):</label>
        <input 
          v-model.number="initialCameraLatitude" 
          type="number" 
          placeholder="0"
        >
      </div>
      <button @click="CatchCameraPosition" class="BtnBasicPattern">
        Применить текущую позицию
      </button>
    </div>
  </div>

    </div>
      </div>

      <!--Список маркеров текущей сцены-->
      <div v-if="currentScene" class="MarkersList">
        <h3>Маркеры текущей сцены</h3>
        <div 
          v-for="marker in currentScene.markers" 
          :key="marker.id"
          class="MarkerExemplar"
          :class="{ editing: OnEditingMarker?.id === marker.id }"
          @click="EditExistingMarker(marker)"
        >
          <div class="MarkerInfo">
            <strong>{{ marker.id }}</strong>
            <div class="MarkerTPAdres">
              <span v-if="marker.tooltip">{{ marker.tooltip }} → </span>
              <span v-if="marker.target">{{ GetSceneName(marker.target) }}</span>
              <span v-else>без перехода</span>
            </div>
          </div>
          <button @click.stop="DeleteMarkerById(marker.id)" class="BtnImmersivePattern">🗑️</button>
        </div>
        <div v-if="!currentScene.markers || currentScene.markers.length === 0" class="NullMarkers">
          Нет маркеров
        </div>
      </div>

      <!--Редактор карты-->
      <div class="MapManager">
        <div class="MapManagerMainMenu">
          <h3>Редактор карты</h3>
          <button @click="AddNewMap" class="BtnGreenPattern">Новый слой карты</button>
        </div>
        
        <!--Список слоёв-->
        <div class="MapLayers">
          <div
            v-for="map in maps"
            :key="map.id"
            class="MapLayersExemplar"
            :class="{ active: currentMap?.id === map.id }"
            @click="SelectMap(map.id)"
          >
            <div class="MapName">
              <strong>{{ map.name }}</strong>
            </div>
            <div class="MapWarpsCount">
              {{ GetWarpsCount(map.id) }} варпов
            </div>
            <div class="MapETC">
              <button @click.stop="EditMap(map)" class="BtnImmersivePattern">изменить</button>
              <button @click.stop="DeleteMap(map.id)" class="BtnImmersivePattern">🗑️</button>
            </div>
          </div>
        </div>

        <!--Управление текущим слоем-->
        <div v-if="currentMap" class="MapLayerEditor">
          <h4>Текущий слой: {{ currentMap.name }}</h4>
          
          <div class="LayerEditorMain">
            <div class="MarkerEditorParameters">
              <label>Название карты:</label>
              <input v-model="currentMap.name" type="text" placeholder="Например: 1 этаж, Кабинет 101, Улица">
            </div>
            
            <div class="MarkerEditorParameters">
              <label>Изображение карты:</label>
              <input v-model="currentMap.image" type="text" placeholder="/src/scenarios/default/m_res/map.png">
              <!--<button @click="TestMapImage" class="BtnBasicPattern">Проверить</button>--><!--Автоматизировано-->
            </div>
          </div>

          <!--Варпы на карте-->
          <div class="LayerEditorWarps">
            <div class="LayerEditorWarpMain">
              <h5>Варпы на карте</h5>
              <button @click="AddWarpToMap" class="BtnBasicPattern">Добавить варп</button>
            </div>
            
            <div class="WarpList">
              <div
                v-for="warp in currentMapWarps"
                :key="warp.id"
                class="WarpExemplar"
                :class="{ editing: editingWarp?.id === warp.id }"
                @click="EditWarp(warp)"
              >
                
                <div class="WarpInfo">
                  <strong>{{ warp.id }}</strong>
                  <div class="WarpTPAdres">
                    Позиция: {{ warp.x }}, {{ warp.y }} → 
                    <span v-if="warp.sceneId">{{ GetSceneName(warp.sceneId) }}</span>
                    <span v-else>не назначено</span>
                  </div>
                </div>
                <button @click.stop="DeleteWarp(warp.id)" class="BtnImmersivePattern">🗑️</button>
              </div>
              <div v-if="currentMapWarps.length === 0" class="NullWarps">
                Нет варпов на этой карте
              </div>
            </div>
          </div>

          <!--Область предпросмотра карты-->
          <div class="LayerEditorPreview">
            <h5>Предпросмотр карты</h5>
            <div class="MapPreview editable" @click="OnMapClick">
              <img
                v-if="currentMap.image"
                :src="currentMap.image"
                alt="map"
                class="MapImage"
                draggable="false"
                @load="OnMapImageLoad"
                @error="onMapImageError"
              />
              <div v-else class="NullMapImage">
                ! Изображение не загружено !
              </div>
              
              <!--Варпы на карте-->
              <div
                v-for="warp in currentMapWarps"
                :key="warp.id"
                class="WarpPoint"
                :class="{ active: warp.sceneId === currentSceneId, editing: editingWarp?.id === warp.id }"
                :style="{ left: warp.x + 'px', top: warp.y + 'px' }"
                @click.stop="EditWarp(warp)"
              >
                <div class="WarpPointCenter"></div>
                <div class="WarpNameID">{{ GetSceneName(warp.sceneId) || '?' }}</div>
              </div>
            </div>
            
            <div class="MapName">
              Размер: {{ mapDimensions.width }} × {{ mapDimensions.height }}px
              <span v-if="addingWarp" class="WarpAddMode">Режим добавления варпа - кликните на карту</span>
            </div>
          </div>
        </div>

        <!--Редактор варпа-->
        <div v-if="editingWarp" class="WarpEditor">
          <h4>Редактирование варпа</h4>
          
          <div class="MarkerEditorParameters">
            <label>ID варпа:</label>
            <input v-model="editingWarp.id" type="text">
          </div>

          <div class="MarkerEditorParameters">
            <label>Позиция:</label>
            <div class="Coords">
              <input v-model.number="editingWarp.x" type="number" placeholder="X">
              <input v-model.number="editingWarp.y" type="number" placeholder="Y">
            </div>
          </div>

          <div class="MarkerEditorParameters">
            <label>Сцена назначения:</label>
            <select v-model="editingWarp.sceneId">
              <option value="">-- Не назначено --</option>
              <option v-for="scene in scenes" :key="scene.id" :value="scene.id">
                {{ scene.name }}
              </option>
            </select>
          </div>

          <div class="EditorFunctions">
            <button @click="UpdateWarpPosition" class="BtnBasicPattern">
             Обновить позицию
            </button>
            <button @click="SaveWarp" class="BtnGreenPattern">Сохранить варп</button>
            <button @click="DeleteEditingWarp" class="BtnRedPattern">Удалить</button>
            <button @click="CancelWarpEdit" class="BtnBasicPattern">Отмена</button>
          </div>
        </div>
      </div>
    </div>

    <!--Модальное окно редактирования карты-->
    <div v-if="editingMapModal" class="ModalOverlay">
      <div class="modal">
        <h3>{{ editingMapModal.id ? 'Редактирование' : 'Добавление' }} слоя карты</h3>
        
        <div class="MarkerEditorParameters">
          <label>ID карты:</label>
          <input v-model="editingMapData.id" type="text" :disabled="!!editingMapModal.id">
        </div>
        
        <div class="MarkerEditorParameters">
          <label>Название карты:</label>
          <input v-model="editingMapData.name" type="text" placeholder="Например: 1 этаж, Кабинет 101, двор у ворот">
        </div>
        
        <div class="MarkerEditorParameters">
          <label>место изображения:</label>
          <input v-model="editingMapData.image" type="text" placeholder="/src/scenarios/default/m_res/map.png">
        </div>
        
        <div class="ModalFunctions">
          <button @click="SaveMap" class="BtnGreenPattern">Сохранить</button>
          <button @click="CancelMapEdit" class="BtnBasicPattern">Отмена</button>
        </div>
      </div>
    </div>

    <!--Всплывающее окно редактирования сцены-->
    <div v-if="editingScene" class="ModalOverlay">
      <div class="modal">
        <h3>{{ editingScene.id ? 'Редактирование' : 'Добавление' }} сцены</h3>
        <label>ID сцены:
          <input v-model="editingSceneData.id" type="text" :disabled="!!editingScene.id">
        </label>
        <label>Название:
          <input v-model="editingSceneData.name" type="text">
        </label>
        <label>Панорама:
          <input v-model="editingSceneData.panorama" type="text">
        </label>
        <label>Отображать в списке:
        <input class ="checkbox" v-model="editingSceneData.visible" type="checkbox">
        </label>
        <div class="ModalFunctions">
          <button @click="SaveScene" class="BtnGreenPattern">Сохранить</button>
          <button @click="NULLSceneEdit" class="BtnBasicPattern">Отмена</button>
        </div>
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
  name: 'PanoramaEditor',
  props: {
    scenario: {
      type: String,
      required: true
    }
  },

  data() {
    return {
      PanoramaPlayer: null,
      MarkersPlugin: null,
      scenarioService: null,
      NowScenarioName: '',

      //Основные данные
      scenes: [],
      maps: [],
      warps: [],

      StartSceneId: '',
      currentSceneId: '',
      currentMapId: '',

      //Переменные для редактора маркеров
      newMarkerType: 'circle',
      OnEditingMarker: null,
      OnSetPosition: false,
      currentCameraPosition: { longitude: 0, latitude: 0 },

      //Переменные для редактора карт
      editingMapModal: null,
      editingMapData: null,
      editingWarp: null,
      addingWarp: false,
      mapDimensions: { width: 0, height: 0 },

      //Типы маркеров
      markerTypes: [
        { value: 'circle', label: 'Круг'},
        { value: 'html', label: 'смайлик'},
       //{ value: 'image', label: 'Изображение' } Теперь это исключено! Фото на панораму теперь ломают программу
      ],
      //Пармаетры камеры
      globalCameraState: {
      longitude: Math.PI / 2,
      latitude: 0,
      zoomLvl: 50
      },

      editingScene: null,      //Состояние всплывающего окна поверх всех элементов
      editingSceneData: null,  //Структура переменных для всплывающего окна
      lastMarkerConfig: null,  //Структура, запоминающая ненадолго последний пресет маркера, чтобы каждый раз не заполнять заново форму
      
      //Переменные для началного положения камеры
      initialCameraLongitude: 0,
      initialCameraLatitude: 0,

      sceneSearchQuery: ''   // Версия 23.2 строка поиска сцен
    };
  },

  computed: {
    currentScene() {
      return this.scenes.find(s => s.id === this.currentSceneId);
    },
    StartScene() {
    return this.scenes.find(s => s.id === this.StartSceneId) || null;
    },
    currentMap() {
      return this.maps.find(m => m.id === this.currentMapId);
    },
    currentMapWarps() {
      return this.warps.filter(w => w.mapId === this.currentMapId);
    },
    filteredScenes() { //Версия 23.2
    if (!this.sceneSearchQuery.trim()) {
      return this.scenes; // если строка пустая – показываем все сцены
    }
    const query = this.sceneSearchQuery.toLowerCase().trim();
    return this.scenes.filter(scene => 
      scene.name && scene.name.toLowerCase().includes(query)
    );
  },
  },

  async mounted() { //Vue начинает работу алгоритма здесь
  this.NowScenarioName = this.scenario; // Запоминаем имя сценария
  await this.loadScenario(this.NowScenarioName); //Вызывваем запрос с сервисного файла
  this.$nextTick(() => this.InitPanoramaPlayer()); //После запроса, когда всё загрузили, инициализируем кадр и сцену
},

  methods: {
    async loadScenario(scenarioName) {
      this.scenarioService = new ScenarioService();
      
      try {
        const scenario = await this.scenarioService.loadScenario(scenarioName); // Я постоянно забываю с какого момента массивы становятся уже определёнными. Напоминаю себе, ЧТО ЭТО ЗДЕСЬ! загрузил scenario и на этом проблемы заканчиваются
        
        this.scenes = scenario.scenes || [];
        this.maps = scenario.maps || [];
        this.warps = scenario.warps || [];
        
        //*this.currentSceneId = scenario.initialScene || (this.scenes[0]?.id || '');*/
        this.StartSceneId = scenario.initialScene ?? (this.scenes[0]?.id ?? '');
        this.currentSceneId = this.StartSceneId;
        this.currentMapId = scenario.initialMap || (this.maps[0]?.id || '');

        this.initialCameraLongitude = scenario.initialCameraLongitude ?? 0;
        this.initialCameraLatitude = scenario.initialCameraLatitude ?? 0;

        this.globalCameraState = {//До 20 версии не было GCS как в прогрузке между сцен. Теперь есть нужда ставить стартовую позицию
        longitude: this.initialCameraLongitude,
        latitude: this.initialCameraLatitude,
        zoomLvl: 50
        };
        
        //Загружаем маркеры для каждой сцены если их нет
        //И убеждаемся, что все маркеры имеют необходимые свойства
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
                } 
                //▶️🎵🎵New Jeans Jersey Remix - Slowed Reverb🎵🎵
                //▶️🎵🎵Michael Jackson - His eyes were like mine - Billie Jean Remix🎵🎵
              }
              if (scene.visible === undefined) {
               scene.visible = true; // C 19 версии я добавляю параметр. Это строки единовременной адаптации. И ещё сойдёт на постоянную основу
              }
              // То, что упущено в редакторе, будет доделано здесь. Стандартные пресеты редактора маркеров
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
            });
          }
        });
        
      } catch (error) {
        await this.loadEmptyScenario();//Если что-то пойдёт не так, то запустить эту "тыкву". Всё же лучше чем пустая страница
      }
    },

    async loadEmptyScenario() {
      this.scenes = [];
      this.maps = [];
      this.warps = [];
      this.currentSceneId = '';
      this.currentMapId = '';
    },

    DestroyPanoramaPlayer() {                 //В самых первых версиях переключение между сценами было реализовано через пересборку плера с новой сценой. Переходы теперь работают по другому, но пересборку сцены я так и не исключил(При изменений в редакторе например)
      if (this.PanoramaPlayer) {
        this.PanoramaPlayer.destroy();
        this.PanoramaPlayer = null;
      }
    },

    InitPanoramaPlayer() {
      if (!this.StartScene) return;

      const { longitude, latitude, zoomLvl } = this.globalCameraState;

      this.PanoramaPlayer = new Viewer({
       container: this.$refs.PanoramaPlayer,
       panorama: this.StartScene.panorama,   //Панорама стартовой сцены. Я не понял, по какой логике выбиралась первая сцена без этого
       caption: this.StartScene.name,        //Хотелось бы сделать попроще, но переменные после двоеточия - это часть Viewer из библиотеки, так что caption, long и lat не переименовать по своему
       defaultLong: longitude,
       defaultLat: latitude,
       defaultZoomLvl: zoomLvl,
       plugins: [[MarkersPlugin, { markers: this.PrepareMarkersForPPlayer() }]]
      });

      this.MarkersPlugin = this.PanoramaPlayer.getPlugin(MarkersPlugin);
      // Клик по маркеру - вызов редактирования, вместо перехода
      this.MarkersPlugin.on('select-marker', (e, marker) => {
        this.EditExistingMarker(marker.config);
      });

      this.PanoramaPlayer.on('position-updated', this.UpdateGlobalCameraState);
      this.PanoramaPlayer.on('zoom-updated', this.UpdateGlobalCameraState);
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

          let markerType = marker.type;
          if (!markerType) {
            if (marker.circle !== undefined) {
              markerType = 'circle';
            } else if (marker.html !== undefined) {
              markerType = 'html';
            } else {
              // То с этого хватит. Пропуск
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
            
            default:
              return null;
          }
        })
        .filter(marker => marker !== null);
    },

    UpdateGlobalCameraState() {
      if (!this.PanoramaPlayer) return;
      const pos = this.PanoramaPlayer.getPosition();
      const zoom = this.PanoramaPlayer.getZoomLevel();
      this.globalCameraState = {
        longitude: pos.longitude,
        latitude: pos.latitude,
        zoomLvl: zoom
      };
    },

    /*SwitchScene(id) { с 17 версии переходы переделываются.
      if (id === this.currentSceneId) return;

      this.UpdateGlobalCameraState();
      this.currentSceneId = id;

      this.DestroyPanoramaPlayer();
      this.$nextTick(() => this.InitPanoramaPlayer());
    },*/
    async SwitchScene(id) {
    if (id === this.currentSceneId) return;

    this.UpdateGlobalCameraState();
    this.currentSceneId = id;
    const nextScene = this.currentScene;

    if (!this.PanoramaPlayer || !nextScene) return;

    try { 
        if (this.MarkersPlugin) {
            this.MarkersPlugin.setMarkers(this.PrepareMarkersForPPlayer());
        }
        
        await this.PanoramaPlayer.setPanorama(nextScene.panorama, {
            transition: true,
            transitionDuration: 1000,
            caption: nextScene.name
        });

        
    } catch (error) {
        //Старый метод в край случая
        this.DestroyPanoramaPlayer();
        this.$nextTick(() => this.InitPanoramaPlayer());
    }
},

    RefreshPanoramaPlayer() {
      this.DestroyPanoramaPlayer();
      this.$nextTick(() => this.InitPanoramaPlayer());
    },

  async SaveScenario() {
  try {
    const scenarioData = {
      scenes: this.scenes,
      maps: this.maps,
      warps: this.warps,
      initialScene: this.StartSceneId, 
      initialMap: this.currentMapId,
      initialCameraLongitude: this.initialCameraLongitude,
      initialCameraLatitude: this.initialCameraLatitude
    };

    await this.scenarioService.saveScenario(this.NowScenarioName, scenarioData);
    alert('Сценарий успешно сохранен!');
    
  } catch (error) {
    alert('Ошибка сохранения сценария: ' + error.message);
  }
  },
    CatchCameraPosition() {
    if (this.PanoramaPlayer) {
      const pos = this.PanoramaPlayer.getPosition();
      const zoom = this.PanoramaPlayer.getZoomLevel();
      this.initialCameraLongitude = pos.longitude;
      this.initialCameraLatitude = pos.latitude;
      this.initialCameraZoom = zoom;
      
      this.globalCameraState = {
        longitude: pos.longitude,
        latitude: pos.latitude,
        zoomLvl: zoom
      };
    }
  },

    ExitEditor() {
      if (confirm('Выйти из редактора?')) {
        this.$router.push('/');
      }
    },

    AddNewScene() {
      this.editingScene = {};
      this.editingSceneData = {
        id: `scene_${Date.now()}`,
        name: 'Новая сцена',
        panorama: '',
        markers: [],
        visible: true
      };
    },

    EditScene(scene) {
      this.editingScene = scene;            
      this.editingSceneData = { ...scene };
    },

    SaveScene() {
      if (this.editingScene.id) {
        const index = this.scenes.findIndex(s => s.id === this.editingScene.id);
        this.scenes.splice(index, 1, this.editingSceneData);
      } else {
        this.scenes.push(this.editingSceneData);
        this.currentSceneId = this.editingSceneData.id;
      }
      this.NULLSceneEdit();
      this.RefreshPanoramaPlayer();
    },

    DeleteScene(sceneId) {
      if (confirm('Удалить эту сцену?')) {
        this.scenes = this.scenes.filter(s => s.id !== sceneId);
        this.warps = this.warps.filter(w => w.sceneId !== sceneId);
        
        if (this.currentSceneId === sceneId) {
          this.currentSceneId = this.scenes[0]?.id || '';
        }
        this.RefreshPanoramaPlayer();
      }
    },

    NULLSceneEdit() {
      this.editingScene = null;
      this.editingSceneData = null;
    },

    //SelectScene(sceneId) {
    //  this.currentSceneId = sceneId;
    //  this.RefreshPanoramaPlayer();
    //}, с 17 версии переделано
    SelectScene(sceneId) {
    this.SwitchScene(sceneId);
    },

    SetMarkerType(type) {
      this.newMarkerType = type;
    },

    AddSceneMarker() {
      if (!this.PanoramaPlayer || !this.currentScene) return;

      let baseMarker;
      if (this.lastMarkerConfig && this.lastMarkerConfig.type === this.newMarkerType) {
        baseMarker = {
          ...this.lastMarkerConfig,
          id: `marker_${Date.now()}`,
          longitude: 0,
          latitude: 0
        };
      } else {
        baseMarker = {
          id: `marker_${Date.now()}`,
          tooltip: 'Новый маркер',
          longitude: 0,
          latitude: 0,
          target: '',
          type: this.newMarkerType
        };

        switch (this.newMarkerType) {
          case 'circle':
            baseMarker.circle = 25;
            baseMarker.svgStyle = {
              fill: 'rgba(255, 0, 0, 0.3)',
              stroke: '#ff0000',
              strokeWidth: '3px'
            };
            break;
          
          case 'html':
            baseMarker.html = '🖼️';
            baseMarker.anchor = 'bottom center';
            baseMarker.style = {
              maxWidth: '30px',
              color: 'white',
              fontSize: '20px',
              textShadow: '0 0 10px black'
            };
            break;
        }
      }

      this.OnEditingMarker = baseMarker;
      this.OnSetPosition = true;
    },

    EditExistingMarker(marker) {
      this.OnEditingMarker = JSON.parse(JSON.stringify(marker));
      
      //Убеждаемся
      if (!this.OnEditingMarker.type) {
        if (this.OnEditingMarker.circle !== undefined) {
          this.OnEditingMarker.type = 'circle';
        } else if (this.OnEditingMarker.html !== undefined) {
          this.OnEditingMarker.type = 'html';
        }
      }
      
      //Фикс бага. Иногда параметр "подсказка" присваивал "[object] [object]". Программа ломалась, если сохранить маркер с таким параметром
      if (this.OnEditingMarker.tooltip && typeof this.OnEditingMarker.tooltip === 'object') {
        // Если параметр "подсказка" это объект, извлекаем текстовое содержимое
        if (this.OnEditingMarker.tooltip.content) {
          this.OnEditingMarker.tooltip = this.OnEditingMarker.tooltip.content;
        } else {
          //Если не можем извлечь содержимое, устанавливаем пустую строку
          this.OnEditingMarker.tooltip = '';
        }
      }
      //И все довольны и счастливы
      
      if (this.OnEditingMarker.type === 'circle' && !this.OnEditingMarker.svgStyle) {
        this.OnEditingMarker.svgStyle = {
          fill: 'rgba(255, 0, 0, 0.3)',
          stroke: '#ff0000',
          strokeWidth: '3px'
        };
      }
      
      if (this.OnEditingMarker.type === 'html' && !this.OnEditingMarker.style) {
        this.OnEditingMarker.style = {
          maxWidth: '30px',
          color: 'white',
          fontSize: '20px',
          textShadow: '0 0 10px black'
        };
      }
      
      if (this.OnEditingMarker.type === 'image' && !this.OnEditingMarker.size) {
        this.OnEditingMarker.size = { width: 40, height: 40 };
      }
    },

    OnMarkerTypeChange() {
      if (!this.OnEditingMarker) return;

      const commonProps = {
        id: this.OnEditingMarker.id,
        tooltip: this.OnEditingMarker.tooltip,
        longitude: this.OnEditingMarker.longitude,
        latitude: this.OnEditingMarker.latitude,
        target: this.OnEditingMarker.target,
        type: this.OnEditingMarker.type
      };

      switch (this.OnEditingMarker.type) {
        case 'circle':
          this.OnEditingMarker = {
            ...commonProps,
            circle: this.OnEditingMarker.circle || 25,
            svgStyle: this.OnEditingMarker.svgStyle || {
              fill: 'rgba(255, 0, 0, 0.3)',
              stroke: '#ff0000',
              strokeWidth: '3px'
            }
          };
          break;
        
        case 'html':
          this.OnEditingMarker = {
            ...commonProps,
            html: this.OnEditingMarker.html || '🗿',
            anchor: this.OnEditingMarker.anchor || 'bottom center',
            style: this.OnEditingMarker.style || {
              maxWidth: '30px',
              color: 'white',
              fontSize: '20px',
              textShadow: '0 0 10px black'
            }
          };
          break;
      }
    },

    SyncPosFromCameraNOW() {
      if (this.OnEditingMarker && this.PanoramaPlayer) {
        const position = this.PanoramaPlayer.getPosition();
        this.OnEditingMarker.longitude = position.longitude;
        this.OnEditingMarker.latitude = position.latitude;
        this.OnSetPosition = false;
      }
    },

    UpdateMarkerPosition() {
      this.OnSetPosition = true;
    },

    SaveMarker() {
      if (!this.OnEditingMarker || !this.currentScene) return;

      if (!this.OnEditingMarker.id || !this.OnEditingMarker.id.trim()) {
        alert('Введите ID маркера');
        return;
      }

      if (!this.currentScene.markers) {
        this.currentScene.markers = [];
      }

      const markerToSave = JSON.parse(JSON.stringify(this.OnEditingMarker));
      const { id, longitude, latitude, ...configWithoutIdAndPosition } = markerToSave;
      this.lastMarkerConfig = configWithoutIdAndPosition;
      
      if (!markerToSave.type) {
        if (markerToSave.circle !== undefined) {
          markerToSave.type = 'circle';
        } else if (markerToSave.html !== undefined) {
          markerToSave.type = 'html';
        }
      }

      const existingIndex = this.currentScene.markers.findIndex(m => m.id === markerToSave.id);

      if (existingIndex >= 0) {
        this.currentScene.markers.splice(existingIndex, 1, markerToSave);
      } else {
        this.currentScene.markers.push(markerToSave);
      }

      this.OnEditingMarker = null;
      this.OnSetPosition = false;
      this.temp_id = this.currentSceneId;
      //Версия 23.2. Проблема заключалась здесь. RefreshPanoramaPlayer() раскоментирован, перемещён. SwitchScene(this.StartSceneId) закоментирован.
      this.RefreshPanoramaPlayer();
      //this.SwitchScene(this.StartSceneId);
      this.SwitchScene(this.temp_id);
    },

    DeleteMarker() {
      if (!this.OnEditingMarker || !this.currentScene?.markers) return;

      if (confirm('Удалить этот маркер?')) {
        this.currentScene.markers = this.currentScene.markers.filter(m => m.id !== this.OnEditingMarker.id);
        this.OnEditingMarker = null;
        this.OnSetPosition = false;
        this.temp_id = this.currentSceneId;
        //Версия 23.2. Для удаления это тоже касается
        //this.SwitchScene(this.StartSceneId); 
        this.RefreshPanoramaPlayer();
        this.SwitchScene(this.temp_id);
      }
    },

    DeleteMarkerById(markerId) {
      if (!this.currentScene?.markers) return;

      if (confirm('Удалить этот маркер?')) {
        this.currentScene.markers = this.currentScene.markers.filter(m => m.id !== markerId);
        this.RefreshPanoramaPlayer();
      }
    },

    CancelEdit() {
      this.OnEditingMarker = null;
      this.OnSetPosition = false;
    },

    AddNewMap() {
      this.editingMapModal = {};
      this.editingMapData = {
        id: `map_${Date.now()}`,
        name: 'Новая карта',
        image: ''
      };
    },

    EditMap(map) {
      this.editingMapModal = map;
      this.editingMapData = { ...map };
    },

    SaveMap() {
      if (!this.editingMapData.name.trim()) {
        alert('Введите название карты');
        return;
      }

      if (this.editingMapModal.id) {
        const index = this.maps.findIndex(m => m.id === this.editingMapModal.id);
        this.maps.splice(index, 1, this.editingMapData);
      } else {
        this.maps.push(this.editingMapData);
        this.currentMapId = this.editingMapData.id;
      }
      
      this.CancelMapEdit();
    },

    DeleteMap(mapId) {
      if (confirm('Удалить эту карту? Все варпы на ней также будут удалены.')) {
        this.maps = this.maps.filter(m => m.id !== mapId);
        this.warps = this.warps.filter(w => w.mapId !== mapId);
        
        if (this.currentMapId === mapId) {
          this.currentMapId = this.maps[0]?.id || '';
        }
      }
    },

    SelectMap(mapId) {
      this.currentMapId = mapId;
    },

    CancelMapEdit() {
      this.editingMapModal = null;
      this.editingMapData = null;
    },

    GetWarpsCount(mapId) {
      return this.warps.filter(w => w.mapId === mapId).length;
    },

    AddWarpToMap() {
      if (!this.currentMap) return;
      this.addingWarp = true; //Метод методом, а state будем менять по прежнему через bool-ы
    },

    OnMapClick(event) {   
      if (!this.addingWarp || !this.currentMap) return;//Будет работать только после срабатывания AddWarpToMap

      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const newWarp = {
        id: `warp_${Date.now()}`,
        mapId: this.currentMap.id,
        sceneId: this.currentSceneId || '',
        x: Math.round(x),
        y: Math.round(y)
      };

      this.warps.push(newWarp);
      this.addingWarp = false;
      this.editingWarp = { ...newWarp };
    },

    EditWarp(warp) {
      this.editingWarp = { ...warp };
      this.addingWarp = false;
    },

    UpdateWarpPosition() {
      this.addingWarp = true;
    },

    SaveWarp() {
      if (!this.editingWarp) return;

      const index = this.warps.findIndex(w => w.id === this.editingWarp.id);
      if (index >= 0) {
        this.warps.splice(index, 1, { ...this.editingWarp });
      }

      this.CancelWarpEdit();
    },

    DeleteWarp(warpId) {
      if (confirm('Удалить этот варп?')) {
        this.warps = this.warps.filter(w => w.id !== warpId);
        if (this.editingWarp?.id === warpId) {
          this.CancelWarpEdit();
        }
      }
    },

    DeleteEditingWarp() {
      if (this.editingWarp) {
        this.DeleteWarp(this.editingWarp.id);
      }
    },

    CancelWarpEdit() {
      this.editingWarp = null;
      this.addingWarp = false;
    },

    OnMapImageLoad(event) {
      const img = event.target;
      this.mapDimensions = {
        width: img.naturalWidth,
        height: img.naturalHeight
      };
    },

    onMapImageError() {
      alert('Ошибка загрузки изображения карты');
      this.mapDimensions = { width: 0, height: 0 };
    },

    TestMapImage() {
      if (!this.currentMap?.image) {
        alert('Введите адрес изображения');
        return;
      }

      const img = new Image();
      img.onload = () => {
        alert(`Изображение загружено успешно\nРазмер: ${img.naturalWidth} × ${img.naturalHeight}px`);
      };
      img.onerror = () => {
        alert('Ошибка загрузки изображения. Проверьте адрес.');
      };
      img.src = this.currentMap.image;
    },

    GetSceneName(id) {
      const scene = this.scenes.find(s => s.id === id);
      return scene ? scene.name : id;
    },
  }
};
</script>

<style scoped>
.VueApp {
  display: flex;
  height: 100vh;
}

.editor {
  flex: 1;
  height: 100%;
  position: relative;
}

.EditorToolBar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  pointer-events: none;
}

.toolbar {
  background: rgba(0, 0, 0, 0.7);
  /*padding: 10px;*/
  display: flex;
  /*gap: 10px;*/
  pointer-events: auto;
}

.ToolBarButtons {
  padding: 8px 16px;
  border: none;
  background: #6c757d;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

.save-btn {
  background: #28a745;
  color: white;
}

.exit-btn {
  background: #6c757d;
  color: white;
}

.marker-type-selector {
  display: flex;
  gap: 5px;
  margin-right: 10px;
}

.marker-type-selector .ToolBarButtons {
  padding: 5px 10px;
  font-size: 12px;
}

.marker-type-selector .ToolBarButtons.active {
  background: #000000;
  color: white;
}

.MarkerEditor {
  position: absolute;
  top: 60px;
  left: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  pointer-events: auto;
  min-width: 300px;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
}

.EditorSetBaseCameraPosition {
  position: absolute;
  top: 60px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: rgb(119, 119, 119);
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  pointer-events: auto;
  max-width: 250px;
}

.RigthPanel {
  width: 400px;
  height: 100vh;
    background: rgba(124, 124, 124, 0.7);
  color: rgb(0, 0, 0);
  border-left: 1px solid #dee2e6;
  overflow-y: auto;
  padding: 15px;
}

.SceneManager, .MarkersList, .MapManager {
  margin-bottom: 20px;
}

.SceneList, .MapLayers {
  margin-top: 10px;
  max-height: 200px;
  overflow-y: auto;
}

.SceneExemplar, .MapLayersExemplar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  margin: 4px 0;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.SceneExemplar.active, .MapLayersExemplar.active {
  background: #15ff00;
  color: white;
}

.BtnImmersivePattern {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
}

.MarkersList {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #dee2e6;
}

.MarkerExemplar {
  display: flex;
  align-items: center;
  padding: 8px;
  margin-bottom: 5px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e9ecef;
  cursor: pointer;
}

.MarkerExemplar:hover {
  background: #f8f9fa;
}

.MarkerExemplar.editing {
  border-color:  #01cf0b;
  background: #000000;
  color: white
}

.marker-icon {
  margin-right: 10px;
  font-size: 16px;
}

.MarkerInfo {
  flex: 1;
}

.MarkerInfo strong {
  display: block;
  font-size: 12px;
}

.MarkerTPAdres {
  font-size: 11px;
  color: #6c757d;
}

.SceneMarkersCount, .MapWarpsCount {
  font-size: 11px;
  color: #6c757d;
  margin: 0 10px;
}

.NullMarkers {
  text-align: center;
  padding: 20px;
  color: #6c757d;
  font-style: italic;
}


.MapManagerMainMenu {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.MapName {
  flex: 1;
}

.MapName strong {
  display: block;
  font-size: 14px;
}

.MapLayerEditor {
  background: white;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.LayerEditorMain {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-bottom: 15px;
}

.LayerEditorWarps {
  margin: 20px 0;
}

.LayerEditorWarpMain {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.WarpList {
  max-height: 200px;
  overflow-y: auto;
}

.WarpExemplar {
  display: flex;
  align-items: center;
  padding: 8px;
  margin-bottom: 5px;
  background: #f8f9fa;
  border-radius: 4px;
  cursor: pointer;
}

.WarpExemplar:hover {
  background: #e9ecef;
}

.WarpExemplar.editing {
  background: #e7f3ff;
  border: 1px solid #000000;
}

.warp-icon {
  margin-right: 10px;
  font-size: 16px;
}

.WarpInfo {
  flex: 1;
}

.WarpInfo strong {
  display: block;
  font-size: 12px;
}

.WarpTPAdres {
  font-size: 11px;
  color: #6c757d;
}

.LayerEditorPreview {
  margin-top: 20px;
}

.MapPreview {
  position: relative;
  width: 100%;
  height: 300px;
  background: #f8f9fa;
  border-radius: 8px;
  overflow: auto;
  border: 2px dashed #dee2e6;
}

.MapImage {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.NullMapImage {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #6c757d;
  font-style: italic;
}

.WarpPoint {
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: pointer;
}

.WarpPointCenter {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #000000;
  border: 3px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.WarpPoint.active .WarpPointCenter {
  background: #28a745;
}

.WarpPoint.editing .WarpPointCenter {
  background: #ffc107;
  animation: pulse 1s infinite;
}

.WarpNameID {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: none;
}

.WarpPoint:hover .WarpNameID {
  display: block;
}

.MapName {
  margin-top: 10px;
  font-size: 12px;
  color: #6c757d;
  text-align: center;
}

.WarpAddMode {
  color: #dc3545;
  font-weight: bold;
}

.WarpEditor {
  background: white;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  margin-top: 15px;
}

.BtnGreenPattern {
  background: #01cf0b;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.BtnBasicPattern {
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.BtnRedPattern {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.MarkerEditorParameters {
  margin-bottom: 10px;
}

.MarkerEditorParameters label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  font-size: 12px;
}

.MarkerEditorParameters input, .MarkerEditorParameters select {
  width: 100%;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
}

.Coords {
  display: flex;
  gap: 5px;
}

.Coords input {
  flex: 1;
}

.MarkerEditorDiffTypeParameters {
  border-left: 3px solid #ffffff;
  padding-left: 10px;
  margin: 10px 0;
}

.MarkerEditorDiffTypeParameters h5 {
  margin: 0 0 10px 0;
  color: #ffffff;
}

.coord-display {
  background: #f8f9fa;
  padding: 8px;
  border-radius: 4px;
  margin: 10px 0;
  font-family: monospace;
  font-size: 12px;
}

.ModalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal {
  background: white;
  padding: 20px;
  border-radius: 8px;
  min-width: 400px;
}

.ModalFunctions {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}

.EditorFunctions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

label {
  display: block;
  margin-bottom: 8px;
}

input, select {
  width: 100%;
  padding: 6px;
  margin-top: 4px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.checkbox{
  width: auto;
}

@keyframes pulse {
  0% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.1); }
  100% { transform: translate(-50%, -50%) scale(1); }
}

.CrosshairOverlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  pointer-events: none;
}

.Crosshair {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.Crosshair-line {
  position: absolute;
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.5);
}

.Crosshair-vertical {
  width: 2px;
  height: 40px;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.Crosshair-horizontal {
  width: 40px;
  height: 2px;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.Crosshair-center-point {
  position: absolute;
  width: 6px;
  height: 6px;
  background-color: #ff4444;
  border: 2px solid white;
  border-radius: 50%;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.7);
}
</style>