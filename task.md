## 목표

1. **Node/Express + Socket.IO** 백엔드와 통신
2. **팀장 전용 베팅**·**실시간 채팅**
3. 유지 · 확장성, 테스트 편의성 확보

---

## 단계별 마이그레이션 요약

1. Vue 3 + Pinia → 로컬 데이터만
2. REST 로그인 · JWT → Pinia user 스토어
3. Socket.IO: 채팅부터
4. `bid`, `timer` 실시간 이벤트 이관
5. LocalStorage 제거 → 모든 데이터 Source of Truth = 서버
6. 다중 인스턴스 대응 (nginx sticky / Redis adapter)

---

### ✅ 핵심 이득

- **Composition API + Pinia** → 반응형 상태 관리 단순화
- **socket.io 플러그인** → 실시간 채팅/베팅 브로드캐스트
- 점진적 이전으로 **리스크 최소화**,
