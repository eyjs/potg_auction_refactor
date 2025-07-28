import { defineStore } from 'pinia';

/* ------------------------------------------------------------------ */
/* helpers                                                            */
/* ------------------------------------------------------------------ */
function safeParse(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}
function diceBear(seed) {
  return `https://api.dicebear.com/8.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
}
const MAX_TEAM_ITEMS = 4;

/* ------------------------------------------------------------------ */
/* Pinia store                                                        */
/* ------------------------------------------------------------------ */
export const useAuctionStore = defineStore('auction', {
  /* ---------------- state ---------------- */
  state: () => {
    /* 1) 로컬스토리지에서 로드 */
    const users = safeParse('users', []);
    const teams = safeParse('teams', []);
    const items = safeParse('items', []);
    const state = safeParse('auctionState', {
      currentAuctionItemIndex: -1,
      timer: 30,
      currentBid: 0,
      currentBidderTeamId: null,
      isAuctionRunning: false,
      isAuctionPaused: true,
      auctionDuration: 30,
      bidExtraTime: 10,
    });

    /* 2) master / master 계정 보장 */
    if (!users.some((u) => u.username === 'master')) {
      users.push({
        id: 'master',
        username: 'master',
        password: 'master',
        role: 'master',
        image: null,
        teamId: null,
        points: 0,
      });
    }

    return {
      users,
      teams,
      items,
      auctionState: state,
      currentUser: null, // 세션 로그인 사용자
    };
  },

  /* ---------------- getters ---------------- */
  getters: {
    /** 현재 경매 중인 아이템 객체 (없으면 null) */
    currentItem(s) {
      return s.auctionState.currentAuctionItemIndex !== -1 ? s.items[s.auctionState.currentAuctionItemIndex] : null;
    },
  },

  /* ---------------- actions ---------------- */
  actions: {
    login(username, password) {
      const user = this.users.find((u) => u.username === username && u.password === password);
      if (!user) return false;
      this.currentUser = user;
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    },
    /** 페이지 새로고침 시 세션 복원 */
    restoreSession() {
      const cached = sessionStorage.getItem('currentUser');
      if (cached) this.currentUser = JSON.parse(cached);
    },
    logout() {
      this.currentUser = null;
      sessionStorage.removeItem('currentUser');
    },
    /* ----- 공통 ----- */
    saveData() {
      localStorage.setItem('users', JSON.stringify(this.users));
      localStorage.setItem('teams', JSON.stringify(this.teams));
      localStorage.setItem('items', JSON.stringify(this.items));
      localStorage.setItem('auctionState', JSON.stringify(this.auctionState));
    },
    resetAllData() {
      ['users', 'teams', 'items', 'auctionState'].forEach((k) => localStorage.removeItem(k));
      location.reload();
    },

    /* 마스터페이지 */
    scaffold() {
      /* 1) master만 남기고 나머지 초기화 */
      this.users = this.users.filter((u) => u.role === 'master');
      this.teams = [];
      this.items = [];
      Object.assign(this.auctionState, {
        currentAuctionItemIndex: -1,
        timer: this.auctionState.auctionDuration,
        currentBid: 0,
        currentBidderTeamId: null,
        isAuctionRunning: false,
        isAuctionPaused: true,
      });

      /* 2) 샘플 사용자 + 매물 생성 */
      for (let i = 1; i <= SAMPLE_USER_COUNT; i++) {
        const uid = `user_${Date.now()}_${i}`;
        this.users.push({
          id: uid,
          username: `user_${i}`,
          password: 'pw',
          image: null,
          role: 'general',
          teamId: null,
          points: 10000,
        });
        this.items.push({
          id: `item_${uid}`,
          name: `user_${i}`,
          description: `참가자 user_${i}`,
          image: null,
          status: 'pending',
          participantId: uid,
          bidPrice: 0,
          bidderTeamId: null,
        });
      }
      this.saveData();
    },
    /* ----- 경매 흐름 ----- */
    /** “경매 시작” 버튼 */
    startAuction() {
      if (this.auctionState.isAuctionRunning) return;
      Object.assign(this.auctionState, {
        isAuctionRunning: true,
        isAuctionPaused: true,
        currentAuctionItemIndex: -1,
        currentBid: 0,
        currentBidderTeamId: null,
        timer: this.auctionState.auctionDuration,
      });
      this.saveData();
    },

    /** “다음 매물” 버튼 */
    nextItem() {
      if (!this.auctionState.isAuctionRunning) return;

      // 대기(pending) 아이템 탐색
      const start = (this.auctionState.currentAuctionItemIndex + 1) % this.items.length;
      let found = -1;
      for (let i = 0; i < this.items.length; i++) {
        const idx = (start + i) % this.items.length;
        if (this.items[idx].status === 'pending') {
          found = idx;
          break;
        }
      }

      if (found === -1) return this.endAuction(); // 끝

      Object.assign(this.auctionState, {
        currentAuctionItemIndex: found,
        currentBid: 0,
        currentBidderTeamId: null,
        timer: this.auctionState.auctionDuration,
        isAuctionPaused: false,
        currentAuctionStartTime: Date.now(),
      });
      this.saveData();
    },

    /** “+10초” 버튼 (마스터) */
    addExtraTime() {
      this.auctionState.timer += this.auctionState.bidExtraTime;
    },

    stopAuction() {
      this.auctionState.isAuctionRunning = false;
      this.auctionState.isAuctionPaused = true;
      this.saveData();
    },

    endAuction() {
      this.stopAuction();
      this.items.forEach((it) => {
        if (it.status === 'pending') it.status = 'unsold';
      });
      this.saveData();
    },

    /* ----- 입찰 ----- */
    masterBid(teamId, inc) {
      const st = this.auctionState;
      if (!st.isAuctionRunning || st.isAuctionPaused || st.timer <= 0) return;

      const team = this.teams.find((t) => t.id === teamId);
      if (!team || team.itemsWon.length >= MAX_TEAM_ITEMS) return;

      const newBid = st.currentBid + inc;
      if (team.points < newBid) return;

      st.currentBid = newBid;
      st.currentBidderTeamId = team.id;
      st.currentAuctionStartTime = Date.now();

      // 막판 연장
      if (st.timer <= 10) this.addExtraTime();
      this.saveData();
    },

    /* ----- 라운드 종료 처리 (timer 0) ----- */
    handleRoundEnd() {
      const item = this.currentItem;
      if (!item) return;

      const { currentBid, currentBidderTeamId } = this.auctionState;
      if (currentBid > 0 && currentBidderTeamId) {
        const team = this.teams.find((t) => t.id === currentBidderTeamId);
        if (team && team.itemsWon.length < MAX_TEAM_ITEMS) {
          // 낙찰
          Object.assign(item, {
            status: 'sold',
            bidPrice: currentBid,
            bidderTeamId: team.id,
          });
          team.points -= currentBid;
          team.itemsWon.push(item.id);

          // 참가자면 팀 배정
          if (item.participantId) {
            const user = this.users.find((u) => u.id === item.participantId);
            if (user) user.teamId = team.id;
          }
        } else {
          item.status = 'unsold';
        }
      } else {
        item.status = 'unsold';
      }

      this.saveData();
    },
  },
});
