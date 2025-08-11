import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('../views/Home.vue')
    },
    {
      path: '/ai-chat',
      name: 'AIChat',
      component: () => import('../views/AIChat.vue')
    },
    {
      path: '/customer-service',
      name: 'CustomerService',
      component: () => import('../views/CustomerService.vue')
    },
    {
      path: '/chat-pdf',
      name: 'ChatPDF',
      component: () => import('../views/ChatPDF.vue')
    },
    {
      path: '/tour-agent',
      name: 'TourAgent',
      component: () => import('../views/TourAgent.vue')
    }
  ]
})

export default router
