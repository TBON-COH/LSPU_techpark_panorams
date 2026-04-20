import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

const SCENARIOS_DIR = path.join(__dirname, 'src', 'scenarios');

async function ensureScenariosDir() {
  try {
    await fs.access(SCENARIOS_DIR);
  } catch {
    await fs.mkdir(SCENARIOS_DIR, { recursive: true });
  }
}


//Этим запросом мы читаем список сценариев
app.get('/api/scenarios', async (req, res) => {
//используется в ScenarioService.getScenariosWithDetails() и в MainMenu.vue
  try {
    await ensureScenariosDir();
    const entries = await fs.readdir(SCENARIOS_DIR, { withFileTypes: true });
    
    const scenarios = [];
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        const configPath = path.join(SCENARIOS_DIR, entry.name, 'config.json');
        try {
          const configContent = await fs.readFile(configPath, 'utf-8');
          const config = JSON.parse(configContent);
          
          scenarios.push({
            name: entry.name,
            title: config.title || entry.name,
            description: config.description || `Сценарий ${entry.name}`,
            scenesCount: config.scenes?.length || 0,
            markersCount: countTotalMarkers(config),
            created: config.created || new Date().toISOString().split('T')[0],
            modified: config.modified || new Date().toISOString().split('T')[0]
          });
        } catch (error) {
          //Если config.json не найден, все равно лезем в лоб
          scenarios.push({
            name: entry.name,
            title: entry.name,
            description: `Сценарий ${entry.name}`,
            scenesCount: 0,
            markersCount: 0,
            created: new Date().toISOString().split('T')[0],
            modified: new Date().toISOString().split('T')[0]
          });
        }
      }
    }
    
    res.json({ scenarios });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Этим запросом мы загружаем конкретный сценарии
app.get('/api/scenarios/:name', async (req, res) => {
  //используется в ScenarioService.loadScenario();Editor.vue и Viewer.vue
  try {
    const scenarioName = req.params.name;
    const configPath = path.join(SCENARIOS_DIR, scenarioName, 'config.json');
    
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);
      res.json(config);
    } catch (error) {
      //Если файл не найден, возвращаем пустой сценарий, в точности как в res.json
      res.json({
        scenes: [],
        maps: [{
          id: 'new_map',
          name: 'Новая карта',
          image: ''
        }],
        warps: [],
        initialScene: '',
        initialMap: 'new_map'
      });
      //////////////
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Этим запросом совершается сохранение изменений определённого сценария
app.post('/api/scenarios/:name', async (req, res) => {
  //Используется в ScenarioService.saveScenario()
  try {
    const scenarioName = req.params.name;
    const scenarioData = req.body;
    
    //Если сохранение данного сценария впервые
    const scenarioDir = path.join(SCENARIOS_DIR, scenarioName);
    await fs.mkdir(scenarioDir, { recursive: true });
    const pResDir = path.join(scenarioDir, 'p_res');
    const mResDir = path.join(scenarioDir, 'm_res');
    await fs.mkdir(pResDir, { recursive: true });
    await fs.mkdir(mResDir, { recursive: true });
    ///////////////Если сохранение данного сценария впервые
    const configData = {
      ...scenarioData,
      title: scenarioData.title || scenarioName,
      description: scenarioData.description || `Сценарий ${scenarioName}`,
      modified: new Date().toISOString().split('T')[0],
      created: scenarioData.created || new Date().toISOString().split('T')[0]
    };
    const configPath = path.join(scenarioDir, 'config.json');
    await fs.writeFile(configPath, JSON.stringify(configData, null, 2), 'utf-8');
    
    res.json({ success: true, message: 'Сценарий успешно сохранен' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


//Здесь мы избавляемся от сценария
app.delete('/api/scenarios/:name', async (req, res) => {
  //используется в ScenarioService.deleteScenario()
  try {
    const scenarioName = req.params.name;
    
    if (scenarioName === 'default') {
      return res.status(400).json({ error: 'Default сценарии удалять нельзя' });
    }
    
    const scenarioDir = path.join(SCENARIOS_DIR, scenarioName);
    
    try {
      await fs.rm(scenarioDir, { recursive: true, force: true });
      res.json({ success: true, message: 'Сценарий успешно удален' });
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.status(404).json({ error: 'Сценарий не найден' });
      } else {
        throw error;
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


//Вспомогательная функция для подсчета маркеров панорам (Без учёта варпов)
function countTotalMarkers(scenario) {
  //Используется этим же кодом при чтений списка сценариев (app.get)
  let count = 0;
  if (scenario.scenes) {
    scenario.scenes.forEach(scene => {
      count += scene.markers ? scene.markers.length : 0;
    });
  }
  if (scenario.warps) {
    count += scenario.warps.length;
  }
  return count;
}

app.use('/src/scenarios', express.static(path.join(__dirname, 'src', 'scenarios')));
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  if (!req.url.startsWith('/api/') && !req.url.startsWith('/src/scenarios/')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
  console.log(`Запущен на порту ${PORT}`);
});
