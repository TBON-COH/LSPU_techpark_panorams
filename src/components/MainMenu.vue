<template>
  <div class="mode-selector">
    <div class="MainMenu">
      <h1>Информационный навигатор технопарка ЛГПУ</h1>

      <div class="CreateScenario">
        <input 
          v-model="newScenarioName" 
          placeholder="Название нового сценария"
          @keyup.enter="createNewScenario"
        >
        <button @click="createNewScenario" class="BtnBasicPattern">
          Создать новый сценарий
        </button>
      </div>


      <div class="ScenarioList">
        <h3>Список сценариев:</h3>
        <div 
          v-for="scenario in availableScenarios" 
          :key="scenario.name"
          class="scenario-item"
        >
          <div class="ScenarioInfo">
            <strong>{{ scenario.name }}</strong>
            <span class="ScenarioMeta">
              {{ scenario.scenesCount }} сцен, {{ scenario.markersCount }} маркеров
            </span>
          </div>
          <div class="ScenarioActions">
            <button 
              @click="viewScenario(scenario.name)"
              class="BtnBasicPattern"
              title="Просмотреть"
            >
              Просмотр
            </button>
            <button 
              @click="editScenario(scenario.name)"
              class="BtnBasicPattern"
              title="Редактировать"
            >
              Редактировать
            </button>
            <button 
              v-if="scenario.name !== 'default'"
              @click="deleteScenario(scenario.name)"
              class="btn-delete"
              title="Удалить"
            >
              Удалить
            </button>
          </div>
        </div>
        
        <div v-if="availableScenarios.length === 0" class="NoScenarios">
          Список сценариев не загрузился. А может быть список взаправду пуст.
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ScenarioService from '../services/ScenarioService'

export default {
  name: 'MainMenu',
  data() {
    return {
      newScenarioName: '',
      availableScenarios: [],
      scenarioService: null
    }
  },
  async mounted() {
    this.scenarioService = new ScenarioService()
    await this.loadScenarios()
  },
  methods: {
    async loadScenarios() {
  try {
    //Используем API
    this.availableScenarios = await this.scenarioService.getScenariosWithDetails();
  } catch (error) {
    console.error('Ошибка загрузки списка сценариев:', error);
    
    //Fallback: базовый список (Потом как нибудь убрать бы аккуратно этот рудимент)
    this.availableScenarios = [
      {
        name: 'default',
        title: 'Сценарий по умолчанию', 
        description: 'Основной сценарий',
        scenesCount: 0,
        markersCount: 0
      }
    ];
  }
},
    
    countTotalMarkers(scenario) {
      let count = 0
      if (scenario.scenes) {
        scenario.scenes.forEach(scene => {
          count += scene.markers ? scene.markers.length : 0
        })
      }
      count += scenario.mapMarkers ? scenario.mapMarkers.length : 0
      return count
    },
    
    async createNewScenario() {
  if (!this.newScenarioName.trim()) {
    alert('Введите название сценария');
    return;
  }
  
  if (this.availableScenarios.find(s => s.name === this.newScenarioName)) {
    alert('Сценарий с таким названием уже существует');
    return;
  }
  
  try {
    const emptyScenario = {
      scenes: [],
      maps: [
        {
          id: 'default_map',
          name: 'Основная карта',
          image: ''
        }
      ],
      warps: [],
      initialScene: '',
      initialMap: 'default_map'
    };
    
    await this.scenarioService.saveScenario(this.newScenarioName, emptyScenario);
    await this.loadScenarios();
    
    const scenarioNameToEdit = this.newScenarioName;
    this.newScenarioName = '';
    
    this.editScenario(scenarioNameToEdit);
  } catch (error) {
    alert('Ошибка создания сценария: ' + error.message);
  }
},
    
    viewScenario(scenarioName) {
      if (scenarioName === 'default') {
        this.$router.push('/viewer')
      } else {
        this.$router.push(`/viewer/${scenarioName}`)
      }
    },
    
    editScenario(scenarioName) {
      this.$router.push(`/editor/${scenarioName}`)
    },
    
    async deleteScenario(scenarioName) {
      if (!confirm(`Удалить сценарий "${scenarioName}"?`)) {
        return
      }
      
      try {
        await this.scenarioService.deleteScenario(scenarioName)
        await this.loadScenarios()
      } catch (error) {
        alert('Ошибка удаления сценария: ' + error.message)
      }
    }
  }
}
</script>

<style scoped>
.mode-selector {
  display:flex;
  justify-content:center;
  align-items:flex-start;
  min-height:100vh;
}

.MainMenu {
  background:#fff;
  padding:50px;
  min-height:100vh;
  box-shadow:0 10px 30px #0003;
  width:100%;
  max-width:800px
}

.CreateScenario {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.CreateScenario input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
}

.ScenarioList {
  overflow-y: auto;
}

.scenario-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  margin-bottom: 10px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.ScenarioInfo {
  flex: 1;
}

.ScenarioInfo strong {
  display: block;
  font-size: 16px;
  margin-bottom: 5px;
}

.ScenarioMeta {
  font-size: 12px;
  color: #6c757d;
}

.ScenarioActions {
  display: flex;
  gap: 8px;
}

.BtnBasicPattern {
  background: #000000;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.btn-view {
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-edit {
  background: #ffc107;
  color: black;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-delete {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.NoScenarios {
  text-align: center;
  padding: 40px;
  color: #6c757d;
  font-style: italic;
}

.BtnBasicPattern:hover { background: #0056b3; }
.btn-view:hover { background: #1e7e34; }
.btn-edit:hover { background: #e0a800; }
.btn-delete:hover { background: #c82333; }
</style>