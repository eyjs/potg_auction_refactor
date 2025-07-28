<template>
  <div class="page-container active">
    <!-- ───── 헤더 ───── -->
    <header class="page-header">
      <h1 class="page-title">마스터 페이지</h1>
      <div class="header-right">
        <button class="secondary-btn" style="margin-right: 10px" @click="router.push('/auction')">
          경매 페이지로 이동
        </button>
        <button class="btn logout" style="margin-right: 10px" @click="confirmReset">❗ 데이터 리셋</button>
        <button class="btn logout" @click="logout">로그아웃</button>
      </div>
    </header>

    <!-- ───── 본문 ───── -->
    <main class="master-main-grid">
      <!-- 사용자 관리 -->
      <section class="master-section user-management">
        <h2>사용자 관리</h2>
        <!-- 단일 등록 -->
        <div class="input-group">
          <input v-model="regUsername" placeholder="새 사용자 이름" />
          <input v-model="regPassword" type="password" placeholder="비밀번호" />
        </div>
        <div class="input-group" style="margin-top: 10px">
          <input v-model="regImage" placeholder="이미지 URL(선택)" style="width: 100%" />
        </div>
        <button class="primary-btn full-width" @click="registerUser">사용자 등록</button>
        <p class="message" :class="regClass">{{ regMsg }}</p>

        <!-- 일괄 업로드 -->
        <h3 style="margin-top: 25px">사용자 일괄 등록(JSON)</h3>
        <div class="input-group">
          <label class="secondary-btn" style="flex: 1; text-align: center; cursor: pointer"
            >JSON 파일 선택<input ref="userFile" type="file" accept="application/json" hidden
          /></label>
          <button class="primary-btn" style="flex: 1" @click="bulkUsers">업로드</button>
        </div>
        <button class="secondary-btn full-width" style="margin-top: 10px" @click="downloadSample('sample.json')">
          샘플 파일 다운로드
        </button>
        <p class="message" :class="bulkUserClass">{{ bulkUserMsg }}</p>

        <h3 style="margin-top: 25px">전체 사용자</h3>
        <ul class="list-display" style="max-height: 220px; overflow-y: auto">
          <li v-for="u in usersList" :key="u.id">{{ u.username }} ({{ u.role }})</li>
        </ul>
      </section>

      <!-- 팀 관리 -->
      <section class="master-section team-management">
        <h2>팀 관리</h2>
        <div class="input-group">
          <input v-model="teamName" placeholder="팀 이름" /><button class="primary-btn" @click="createTeam">
            팀 생성
          </button>
        </div>
        <p class="message" :class="teamClass">{{ teamMsg }}</p>

        <!-- 팀장 배정 -->
        <h3>팀장 배정(DnD)</h3>
        <div class="dnd-container">
          <!-- 사용자 리스트 -->
          <div class="dnd-list-box">
            <h3>사용 가능 사용자</h3>
            <ul class="dnd-list">
              <li
                v-for="u in availableUsers"
                :key="u.id"
                draggable="true"
                class="draggable-user"
                @dragstart="dragged = u.id"
              >
                {{ u.username }}
              </li>
            </ul>
          </div>
          <!-- 팀 리스트 -->
          <div class="dnd-list-box">
            <h3>팀 목록</h3>
            <ul class="dnd-list">
              <li
                v-for="t in store.teams"
                :key="t.id"
                class="dnd-team-item"
                @dragover.prevent
                @drop="assignLeader(t.id)"
              >
                <strong>{{ t.name }}</strong> - 팀장: {{ leaderName(t) }}
              </li>
            </ul>
          </div>
        </div>
        <p class="message" :class="dndClass">{{ dndMsg }}</p>

        <h3 style="margin-top: 25px">생성된 팀</h3>
        <ul class="list-display">
          <li v-for="t in store.teams" :key="t.id">
            <span>{{ t.name }} (팀장: {{ leaderName(t) }})</span
            ><button class="delete" @click="deleteTeam(t.id)">삭제</button>
          </li>
        </ul>
      </section>

      <!-- 매물 관리 -->
      <section class="master-section item-management">
        <h2>매물 관리</h2>
        <div class="input-group">
          <input v-model="itemName" placeholder="매물 이름" /><input v-model="itemDesc" placeholder="매물 설명(선택)" />
        </div>
        <div class="input-group" style="margin-top: 10px">
          <input v-model="itemImage" placeholder="매물 이미지 URL(선택)" style="width: 100%" />
        </div>
        <button class="primary-btn full-width" @click="addItem">매물 추가</button>
        <p class="message" :class="itemClass">{{ itemMsg }}</p>

        <!-- 일괄 업로드 -->
        <h3 style="margin-top: 25px">매물(참여자) 일괄 등록(JSON)</h3>
        <div class="input-group">
          <label class="secondary-btn" style="flex: 1; text-align: center; cursor: pointer"
            >JSON 파일 선택<input ref="itemFile" type="file" accept="application/json" hidden /></label
          ><button class="primary-btn" style="flex: 1" @click="bulkItems">업로드</button>
        </div>
        <button class="secondary-btn full-width" style="margin-top: 10px" @click="downloadSample('sample.json')">
          샘플 파일 다운로드
        </button>
        <p class="message" :class="bulkItemClass">{{ bulkItemMsg }}</p>

        <h3>등록된 매물</h3>
        <ul class="list-display">
          <li v-for="it in store.items" :key="it.id">
            <span>{{ it.name }} ({{ it.status }})</span><button class="delete" @click="deleteItem(it.id)">삭제</button>
          </li>
        </ul>
      </section>

      <!-- 설정 & 스캐폴드 -->
      <section class="master-section">
        <h2>변수값 설정</h2>
        <div class="input-group" style="flex-direction: column">
          <label>기본 경매 시간(초)</label><input v-model.number="duration" type="number" min="5" />
        </div>
        <div class="input-group" style="flex-direction: column; margin-top: 15px">
          <label>입찰 시 추가 시간(초)</label><input v-model.number="extraTime" type="number" min="1" />
        </div>
        <button class="primary-btn full-width" style="margin-top: 20px" @click="saveSettings">설정 저장</button>
        <p class="message" :class="setClass">{{ setMsg }}</p>
        <button class="secondary-btn full-width" style="margin-top: 25px" @click="scaffold">
          초기 데이터 스캐폴드
        </button>
        <p class="message" :class="scfClass">{{ scfMsg }}</p>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuctionStore } from '@/stores/auction';

const router = useRouter();
const store = useAuctionStore();

/* util */
const makeMsg =
  (mRef, cRef) =>
  (m, c = 'green') => {
    mRef.value = m;
    cRef.value = c;
    setTimeout(() => (mRef.value = ''), 2500);
  };

/* 헤더 */
function logout() {
  store.logout();
  router.push('/login');
}
function confirmReset() {
  if (confirm('모든 데이터를 초기화합니다.')) {
    store.resetAllData();
    alert('리셋 완료');
  }
}

/* 사용자 */
const regUsername = ref('');
const regPassword = ref('');
const regImage = ref('');
const regMsg = ref('');
const regClass = ref('');
const msgReg = makeMsg(regMsg, regClass);
function registerUser() {
  if (!regUsername.value || !regPassword.value) return msgReg('필수 입력', 'red');
  if (store.users.some((u) => u.username === regUsername.value)) return msgReg('중복 사용자', 'red');
  const newUser = {
    id: `user_${Date.now()}`,
    username: regUsername.value,
    password: regPassword.value,
    image: regImage.value || null,
    role: 'general',
    teamId: null,
    points: 10000,
  };
  store.users.push(newUser);

  store.items.push({
    id: `item_${newUser.id}`,
    name: newUser.username,
    description: `참가자 ${newUser.username}`,
    image: newUser.image || null,
    status: 'pending',
    participantId: newUser.id,
    bidPrice: 0,
    bidderTeamId: null,
  });
  regUsername.value = regPassword.value = regImage.value = '';
  msgReg('등록 완료', 'green');
  this.saveData();
}

/* bulk user */
const userFile = ref(null);
const bulkUserMsg = ref('');
const bulkUserClass = ref('');
const msgBulkUser = makeMsg(bulkUserMsg, bulkUserClass);
function bulkUsers() {
  const f = userFile.value?.files?.[0];
  if (!f) return msgBulkUser('파일 선택', 'red');
  const r = new FileReader();
  r.onload = (e) => {
    try {
      const arr = JSON.parse(e.target.result);
      let add = 0,
        skip = 0;
      arr.forEach((u) => {
        if (!(u.username && u.password)) return;
        if (store.users.some((x) => x.username === u.username)) {
          skip++;
          return;
        }
        const userObj = {
          id: `user_${Date.now()}_${u.username}`,
          username: u.username,
          password: u.password,
          image: u.image || null,
          role: 'general',
          teamId: null,
          points: 10000,
        };
        store.users.push(userObj);
        store.items.push({
          id: `item_${userObj.id}`,
          name: userObj.username,
          description: `참가자 ${userObj.username}`,
          image: userObj.image || null,
          status: 'pending',
          participantId: userObj.id,
          bidPrice: 0,
          bidderTeamId: null,
        });
        add++;
      });
      store.saveData();
      msgBulkUser(`${add}명 추가, ${skip}명 건너뜀`);
      userFile.value.value = '';
    } catch {
      msgBulkUser('JSON 오류', 'red');
    }
  };
  r.readAsText(f);
}
function downloadSample(n) {
  const a = document.createElement('a');
  a.href = `/${n}`;
  a.download = n;
  a.click();
}

/* 팀 */
const teamName = ref('');
const teamMsg = ref('');
const teamClass = ref('');
const msgTeam = makeMsg(teamMsg, teamClass);
function createTeam() {
  if (!teamName.value) return msgTeam('팀 이름 입력', 'red');
  if (store.teams.some((t) => t.name === teamName.value)) return msgTeam('중복 팀', 'red');
  store.teams.push({ id: `team_${Date.now()}`, name: teamName.value, leaderId: null, points: 10000, itemsWon: [] });
  store.saveData();
  teamName.value = '';
  msgTeam('생성됨');
}
function deleteTeam(id) {
  if (confirm('팀 삭제?')) {
    store.teams = store.teams.filter((t) => t.id !== id);
    store.saveData();
  }
}
function leaderName(t) {
  const l = store.users.find((u) => u.id === t.leaderId);
  return l ? l.username : '없음';
}
const dragged = ref(null);
const dndMsg = ref('');
const dndClass = ref('');
const msgDnd = makeMsg(dndMsg, dndClass);
function onDragStart(id) {
  dragged.value = id;
}
function assignLeader(teamId) {
  const uid = dragged.value;
  if (!uid) return;
  const user = store.users.find((u) => u.id === uid);
  const team = store.teams.find((t) => t.id === teamId);
  if (!user || !team) return;
  const prevT = store.teams.find((t) => t.leaderId === uid);
  if (prevT) prevT.leaderId = null;
  const oldLeader = store.users.find((u) => u.id === team.leaderId);
  if (oldLeader) oldLeader.role = 'general';
  team.leaderId = uid;
  user.role = 'teamLeader';
  user.teamId = teamId;
  store.saveData();
  msgDnd(`${user.username} 팀장 지정`);
  dragged.value = null;
}
const availableUsers = computed(() => store.users.filter((u) => u.role === 'general' && !u.teamId));

/* 매물 */
const itemName = ref('');
const itemDesc = ref('');
const itemImage = ref('');
const itemMsg = ref('');
const itemClass = ref('');
const msgItem = makeMsg(itemMsg, itemClass);
function addItem() {
  if (!itemName.value) return msgItem('매물 이름 입력', 'red');
  if (store.items.some((i) => i.name === itemName.value)) return msgItem('중복 매물', 'red');
  store.items.push({
    id: `item_${Date.now()}`,
    name: itemName.value,
    description: itemDesc.value,
    image: itemImage.value || null,
    bidPrice: 0,
    bidderTeamId: null,
    status: 'pending',
    participantId: null,
  });
  store.saveData();
  msgItem('추가됨');
  itemName.value = itemDesc.value = itemImage.value = '';
}
function deleteItem(id) {
  if (confirm('매물 삭제?')) {
    store.items = store.items.filter((i) => i.id !== id);
    store.saveData();
  }
}

/* bulk items */
const itemFile = ref(null);
const bulkItemMsg = ref('');
const bulkItemClass = ref('');
const msgBulkItem = makeMsg(bulkItemMsg, bulkItemClass);
function bulkItems() {
  const f = itemFile.value?.files?.[0];
  if (!f) return msgBulkItem('파일 선택', 'red');
  const r = new FileReader();
  r.onload = (e) => {
    try {
      const names = JSON.parse(e.target.result);
      let add = 0,
        skip = 0;
      names.forEach((n) => {
        const u = store.users.find((x) => x.username === n && x.role === 'general');
        if (!u || store.items.some((i) => i.participantId === u.id)) {
          skip++;
          return;
        }
        store.items.push({
          id: `item_${u.id}`,
          name: u.username,
          description: `참가자 ${u.username}`,
          image: u.image || null,
          status: 'pending',
          participantId: u.id,
        });
        add++;
      });
      store.saveData();
      msgBulkItem(`${add}개 추가, ${skip}개 건너뜀`);
      itemFile.value.value = '';
    } catch {
      msgBulkItem('JSON 오류', 'red');
    }
  };
  r.readAsText(f);
}

/* 설정 */
const duration = ref(store.auctionState.auctionDuration);
const extraTime = ref(store.auctionState.bidExtraTime);
const setMsg = ref('');
const setClass = ref('');
const msgSet = makeMsg(setMsg, setClass);
function saveSettings() {
  if (duration.value <= 0 || extraTime.value <= 0) return msgSet('양수 입력', 'red');
  store.auctionState.auctionDuration = duration.value;
  store.auctionState.bidExtraTime = extraTime.value;
  store.saveData();
  msgSet('저장됨');
}

/* 스캐폴드 */
const scfMsg = ref('');
const scfClass = ref('');
const msgScf = makeMsg(scfMsg, scfClass);
function scaffold() {
  store.scaffold();
  msgScf('완료');
}

/* computed */
const usersList = computed(() => store.users.filter((u) => u.role !== 'master'));
</script>
