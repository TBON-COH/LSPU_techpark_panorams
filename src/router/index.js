import { createRouter, createWebHistory } from 'vue-router'
import MainMenu from '../components/MainMenu.vue'
import Viewer from '../Viewer.vue'
import Editor from '../Editor.vue'

const routes = [
  {
    path: '/',
    redirect: '/viewer'
  },
  {
    path: '/main',
    name: 'MainMenu',
    component: MainMenu
  },
  {
    path: '/viewer',
    name: 'ViewerDefault',
    component: Viewer,
    props: { scenario: 'default' }
  },
  {
    path: '/viewer/:scenario',
    name: 'ViewerScenario',
    component: Viewer,
    props: true
  },
  {
    path: '/editor/:scenario',
    name: 'EditorScenario',
    component: Editor,
    props: true
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router