<template>
  <!-- 원본 index.html 의 #auctionPage 레이아웃 그대로 → 스타일 재사용 -->
  <div id="auctionPage" class="page-container active">
    <!-- ───────────── 헤더 ───────────── -->
    <header class="page-header">
      <h1 class="page-title">경매 진행</h1>
      <div>
        <div class="header-right"></div>
        <div>
          <button
            id="goToMasterPageBtn"
            class="secondary-btn"
            style="margin-right: 10px"
            @click="router.push('/master')"
          >
            관리자 패널로 이동
          </button>
          <button id="logoutBtnAuction" class="btn logout" @click="logout">로그아웃</button>
        </div>
      </div>
    </header>

    <!-- ───────────── 본문 그리드 ───────────── -->
    <main class="auction-main-grid">
      <!-- 왼쪽: 팀 리스트 -->
      <section class="auction-panel team-list-area">
        <h2>참여 팀 현황</h2>
        <div id="teamListContainer" class="team-list-grid">
          <div v-for="team in store.teams" :key="team.id" class="team-item" :data-team-id="team.id">
            <div class="team-avatar" :style="{ backgroundImage: `url(${avatar(team.name)})` }"></div>
            <div class="team-info">
              <div class="team-name">{{ team.name }}</div>
              <div class="team-points">리더: {{ leaderName(team) }}</div>
              <div class="team-points">포인트: {{ team.points.toLocaleString() }}P</div>
            </div>
            <div class="team-slots">
              <div
                v-for="i in maxTeamItems"
                :key="i"
                class="slot-indicator"
                :class="{ filled: team.itemsWon.length >= i }"
              ></div>
            </div>
            <!-- 마스터 전용 +입찰 버튼 -->
            <div
              v-if="isMaster && store.auctionState.isAuctionRunning && !store.auctionState.isAuctionPaused"
              class="master-bid-btn-group"
            >
              <button
                v-for="inc in [100, 200, 500, 1000]"
                :key="inc"
                class="master-bid-btn"
                @click="masterBid(team.id, inc)"
              >
                +{{ inc }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 가운데: 현재 경매 아이템 -->
      <section class="auction-panel auction-item-area">
        <div class="auction-item-box">
          <p id="noItemMessage" class="no-item-message" v-show="!currentItem">현재 진행 중인 매물이 없습니다.</p>

          <div class="item-visual-area" v-if="currentItem">
            <img :src="currentItemImg" alt="경매 매물 이미지" class="auction-item-image" />
          </div>
          <div class="item-info-area" v-if="currentItem">
            <h2 id="currentItemName">{{ currentItemName }}</h2>
            <p id="currentItemDescription">{{ currentItem.description || '설명 없음' }}</p>
            <div id="currentBidInfo" class="bid-info" v-show="!store.auctionState.isAuctionPaused">
              <p>
                현재가: <span id="currentBidValue">{{ store.auctionState.currentBid.toLocaleString() }}</span> P
              </p>
              <p>
                최고 입찰 팀: <span id="currentBidTeam">{{ currentBidTeamName }}</span>
              </p>
              <p id="timeCount" class="time-count">남은 시간: {{ store.auctionState.timer }}</p>
            </div>
          </div>
        </div>

        <!-- 마스터 컨트롤 -->
        <div id="auctionPageMasterControls" class="auction-master-controls" v-if="isMaster">
          <div class="ctrl-row">
            <button class="control-btn green" @click="startAuction">경매 시작</button>
            <button class="control-btn blue" @click="nextItem">다음 매물</button>
            <button class="control-btn orange" @click="addTime">+10초</button>
          </div>
          <div class="ctrl-row">
            <button class="control-btn red" @click="stopAuction" :disabled="!store.auctionState.isAuctionRunning">
              경매 중지
            </button>
            <button class="control-btn red" @click="endAuction" :disabled="!store.auctionState.isAuctionRunning">
              경매 종료
            </button>
          </div>
          <div class="ctrl-row">
            <p class="message" :class="msgClass">{{ masterMsg }}</p>
          </div>
        </div>
      </section>

      <!-- 오른쪽: 참가자 그리드 -->
      <section class="auction-panel participant-grid-area">
        <h2>참여자 현황</h2>
        <div id="participantGrid" class="participant-grid">
          <div v-for="u in participants" :key="u.id" class="participant-container" :title="u.username">
            <div
              class="participant-avatar"
              :class="avatarClass(u)"
              :style="{ backgroundImage: `url(${avatarUser(u)})` }"
            ></div>
            <span class="participant-name">{{ u.username }}</span>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuctionStore } from '@/stores/auction';

const router = useRouter();
const store = useAuctionStore();

const maxTeamItems = 4;

/* ---------- computed helpers ---------- */
const isMaster = computed(() => store.currentUser?.role === 'master');
const currentItem = computed(() =>
  store.auctionState.currentAuctionItemIndex !== -1 ? store.items[store.auctionState.currentAuctionItemIndex] : null
);
const currentItemImg = computed(() =>
  currentItem.value ? currentItem.value.image || avatar(currentItem.value.name) : ''
);
const currentItemName = computed(() => {
  if (!currentItem.value) return '경매 대기 중';
  if (currentItem.value.participantId) {
    const u = store.users.find((x) => x.id === currentItem.value.participantId);
    return u ? u.username : currentItem.value.name;
  }
  return currentItem.value.name;
});
const currentBidTeamName = computed(() => {
  const t = store.teams.find((x) => x.id === store.auctionState.currentBidderTeamId);
  return t ? t.name : '없음';
});
const participants = computed(() =>
  store.users.filter((u) => u.role === 'general' && store.items.some((i) => i.participantId === u.id))
);

const masterMsg = ref('');
const msgClass = ref('');
const setMasterMsg = (m, c = 'green') => {
  masterMsg.value = m;
  msgClass.value = c;
  setTimeout(() => (masterMsg.value = ''), 2500);
};

/* ---------- utilities ---------- */
const avatar = (seed) => `https://api.dicebear.com/8.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
const avatarUser = (u) => u.image || avatar(u.username);
function leaderName(t) {
  const l = store.users.find((u) => u.id === t.leaderId);
  return l ? l.username : '없음';
}
function avatarClass(u) {
  const item = store.items.find((i) => i.participantId === u.id);
  const cls = [];
  if (item?.status === 'sold') cls.push('sold');
  if (item?.status === 'unsold') cls.push('unsold');
  if (currentItem.value?.participantId === u.id) cls.push('border-auction-item');
  return cls.join(' ');
}

/* ---------- master actions ---------- */
function startAuction() {
  store.auctionState.isAuctionRunning = true;
  store.auctionState.isAuctionPaused = true;
  setMasterMsg('경매 준비');
}
function nextItem() {
  store.$patch((s) => {
    s.auctionState.isAuctionPaused = false;
    store.nextItem();
  });
}
function addTime() {
  if (store.auctionState.isAuctionRunning && !store.auctionState.isAuctionPaused) store.auctionState.timer += 10;
}
function stopAuction() {
  store.auctionState.isAuctionRunning = false;
  store.auctionState.isAuctionPaused = true;
}
function endAuction() {
  stopAuction();
  setMasterMsg('경매 종료', 'orange');
}
function masterBid(teamId, inc) {
  // 1. 로직 처리
  store.masterBid(teamId, inc);
  // 2. 팀카드 강조효과 처리
}

function logout() {
  store.logout();
  router.push('/login');
}

/* ---------- local timer ---------- */
let interval = null;
function startLocalTimer() {
  clearInterval(interval);
  interval = setInterval(() => {
    if (store.auctionState.isAuctionPaused || store.auctionState.timer <= 0) return;
    store.auctionState.timer--;
  }, 1000);
}
onMounted(startLocalTimer);
onUnmounted(() => clearInterval(interval));
watch(() => store.auctionState.isAuctionPaused, startLocalTimer);
</script>
