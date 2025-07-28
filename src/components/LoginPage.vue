<template id="loginPage" class="page-container active" style="background: transparent">
  <div class="login-box">
    <h2>경매 시스템</h2>
    <input v-model="username" placeholder="사용자 이름" value="master" />
    <input v-model="password" type="password" placeholder="비밀번호" value="master" />
    <button @click="handleLogin">로그인</button>
    <p :class="['message', loginError ? 'red' : '']">{{ message }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuctionStore } from '@/stores/auction';

const router = useRouter();
const store = useAuctionStore();
const username = ref('master');
const password = ref('master');
const message = ref('');
const loginError = ref(false);

function handleLogin() {
  if (store.login(username.value, password.value)) {
    const path = store.currentUser.role == 'master' ? '/master' : '/auction';
    router.push(path);
    loginError.value = false;
    // Redirect or perform further actions after successful login
  } else {
    message.value = '잘못된 사용자 이름 또는 비밀번호입니다.';
    loginError.value = true;
  }
}
</script>
