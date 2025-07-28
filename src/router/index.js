import { createRouter, createWebHistory } from 'vue-router';

// (1) 페이지 컴포넌트 import
import LoginPage from '@/components/LoginPage.vue';
import AuctionPage from '@/components/AuctionPage.vue';
import MasterPage from '@/components/MasterPage.vue';

// (2) 라우트 배열
const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginPage },
  { path: '/master', component: MasterPage, meta: { requiresAuth: true, role: 'master' } },
  { path: '/auction', component: AuctionPage, meta: { requiresAuth: true } },

  { path: '/:pathMatch(.*)*', redirect: '/login' }, // 그 외 경로 로그인 페이지로 리다이렉트
];

// (3) Router 인스턴스 생성
export const router = createRouter({
  history: createWebHistory(),
  routes,
});

import { useAuctionStore } from '@/stores/auction';

// (4) 내비게이션 가드
router.beforeEach((to) => {
  const store = useAuctionStore();
  const { currentUser } = store;

  // 인증이 필요 없는 페이지는 그대로 접근 허용
  if (!to.meta.requiresAuth) {
    return true;
  }
  // 미로그인 -> 로그인 페이지로 리다이렉트
  if (!currentUser) {
    return '/login';
  }
  // 마스터가 아닌 경우 경매 페이지로 리다이렉트
  if (to.meta.role === 'master' && currentUser.role !== 'master') {
    return '/auction';
  }

  if (to.meta.role && currentUser.role !== 'master') {
    return '/action';
  }

  return true;
});
