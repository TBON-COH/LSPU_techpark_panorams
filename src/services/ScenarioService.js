class ScenarioService {
  constructor() {
    this.apiBase = '/api';
    this.basePath = '/scenarios';  // Старый путь (fallback, больше не используется)
  }


  async loadScenario(scenarioName) {
      // Основной метод загрузки. Через API
      try {
        const response = await fetch(`${this.apiBase}/scenarios/${scenarioName}`);
        if (response.ok) {
          const data = await response.json();
          return data;
        }
      // Старый метод. Прямой подход к папке через fallback. Больше не используется, но используется как запасной вариант
      try {
        const response = await fetch(`${this.basePath}/${scenarioName}/config.json`);
        if (response.ok) {
          return await response.json();
        }
      } 
      catch (error) {//Да-да. Один Catch на 2 try. Даже не знаю, грешу ли я или нет. Просто не делал такого ранее
      }////Весь блок старого метода можно спокойно закоментировать
      
      // Если ничего не вышло
      return this.getEmptyScenario();
      
    } catch (error) {
      return this.getEmptyScenario();
    }
  }

  async saveScenario(scenarioName, scenarioData) {
    try {
      
      // Это валидация данных
      if (!scenarioData) {
        throw new Error('Пусто! Нет данных для сохранения');
      }/////
      
      const response = await fetch(`${this.apiBase}/scenarios/${scenarioName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scenarioData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка сохранения');
      }
      
      const result = await response.json();
      return result;
      
    } catch (error) {
      throw error;
    }
  }


  async getAvailableScenarios() {
    try {
      // Загружаем через API
      const response = await fetch(`${this.apiBase}/scenarios`);
      if (response.ok) {
        const data = await response.json();
        return data.scenarios.map(s => s.name);
      }
      
      // Fallback: пробуем загрузить из list.json
      try {
        const response = await fetch(`${this.basePath}/list.json`);
        if (response.ok) {
          const listData = await response.json();
          return listData.scenarios.map(s => s.name);
        }
      } catch (error) {
      }
      
      return ['default'];
      
    } catch (error) {
      return ['default'];
    }
  }

  async getScenariosWithDetails() {
    try {
      // Загружаем через API
      const response = await fetch(`${this.apiBase}/scenarios`);
      if (response.ok) {
        const data = await response.json();
        return data.scenarios;
      }
      
      // Fallback: пробуем загрузить из list.json
      try {
        const response = await fetch(`${this.basePath}/list.json`);
        if (response.ok) {
          const listData = await response.json();
          return listData.scenarios;
        }
      } catch (error) {
      }
      
      // Fallback: создаем базовую информацию из доступных сценариев
      const scenarioNames = await this.getAvailableScenarios();
      return await Promise.all(
        scenarioNames.map(async (name) => {
          try {
            const scenario = await this.loadScenario(name);
            return {
              name: name,
              title: name === 'default' ? 'Сценарий по умолчанию' : name,
              description: `Сценарий ${name}`,
              scenesCount: scenario.scenes?.length || 0,
              markersCount: this.countTotalMarkers(scenario),
              created: new Date().toISOString().split('T')[0],
              modified: new Date().toISOString().split('T')[0]
            };
          } catch (error) {
            return {
              name: name,
              title: name,
              description: 'Ошибка загрузки',
              scenesCount: 0,
              markersCount: 0,
              error: true
            };
          }
        })
      );
      
    } catch (error) {
      return [];
    }
  }

  countTotalMarkers(scenario) {
    //дубликат подсчёта маркеров для клиентской части
    let count = 0;
    if (scenario.scenes) {
      scenario.scenes.forEach(scene => {
        count += scene.markers ? scene.markers.length : 0;
      });
    }
    // Добавляем варпы с карт
    if (scenario.warps) {
      count += scenario.warps.length;
    } else if (scenario.mapMarkers) {
      count += scenario.mapMarkers.length;
    }
    return count;
  }

  async deleteScenario(scenarioName) {
    try {
      if (scenarioName === 'default') {
        throw new Error('Default сценарии удалять нельзя');
      }
      
      // Удаляем через API
      const response = await fetch(`${this.apiBase}/scenarios/${scenarioName}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка удаления');
      }
      
      const result = await response.json();
      return result;
      
    } catch (error) {
      throw error;
    }
  }

  getEmptyScenario() {
    return {
      scenes: [],
      maps: [
        {
          id: 'new_map',
          name: 'Новая карта',
          image: ''
        }
      ],
      warps: [],
      initialScene: '',
      initialMap: 'new_map'
    };
  }
}

export default ScenarioService;