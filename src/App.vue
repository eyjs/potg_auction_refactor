<template>
  <div class="app-container">
    <header class="global-header">
      <router-link to="/" class="logo">Auction&nbsp;System</router-link>
      <nav class="nav">
        <router-link to="/login" v-if="!store.currentUser">로그인</router-link>
        <router-link v-if="isMaster" to="/master">마스터</router-link>
        <router-link v-if="loggedIn" to="/auction">경매</router-link>
      </nav>
    </header>

    <router-view />
    <!-- 페이지 스위치 -->
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuctionStore } from '@/stores/auction';
const store = useAuctionStore();
const loggedIn = computed(() => !!store.currentUser);
const isMaster = computed(() => store.currentUser?.role === 'master');
console.log(store.currentUser);
</script>

<style>
/* 매우 간단한 전역 헤더 스타일 */
.global-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 28px;
  background: #222831;
  border-bottom: 1px solid #4a4f57;
}
.logo {
  font-weight: bold;
  color: #00adb5;
  text-decoration: none;
}
.nav a {
  margin-left: 18px;
  color: #eeeeee;
  text-decoration: none;
}
.nav a.router-link-active {
  color: #00adb5;
}
</style>
