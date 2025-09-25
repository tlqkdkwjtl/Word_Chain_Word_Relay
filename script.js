let totalPlayers = 0;
let players = [];
let originalPlayers = []; // ✅ 참가자 원본 저장용
let eliminated = [];
let currentTurn = 0;
let words = [];
let lastWord = "";

// 타이머 관련
let timer = null;
let timeLimit = 10; // 제한 시간 (초)

// 참가자 수 입력 버튼
document.getElementById("setPlayersBtn").addEventListener("click", setPlayerCount);

// 참가자 수 입력창 엔터 처리
document.getElementById("playerCount").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    setPlayerCount();
  }
});

function setPlayerCount() {
  totalPlayers = parseInt(document.getElementById("playerCount").value);
  if (isNaN(totalPlayers) || totalPlayers < 2) {
    alert("2명 이상 입력하세요.");
    return;
  }
  document.getElementById("setup").style.display = "none";
  document.getElementById("nameInputArea").style.display = "block";
  document.getElementById("namePrompt").innerText = `1번째 참가자 이름을 입력하세요.`;
  document.getElementById("playerNameInput").focus();
}

// 안내 박스 표시 함수
function showNotice(msg, duration = 4000) {
  const banner = document.getElementById("noticeBanner");
  banner.innerText = msg;
  banner.style.display = "block";
  setTimeout(() => {
    banner.style.display = "none";
  }, duration);
}

// 이름 입력창 포커스 시 안내 (한 번만)
let noticeShown = false;
const nameInput = document.getElementById("playerNameInput");
nameInput.addEventListener("focus", () => {
  if (!noticeShown) {
    showNotice("입력한 것이 한국어가 아닐 수 있어요. 한/영 키를 눌러 확인하세요.", 7000);
    noticeShown = true;
  }
});

// 참가자 이름 입력 버튼
document.getElementById("addPlayerBtn").addEventListener("click", addPlayer);

// 참가자 이름 입력창 엔터 처리
document.getElementById("playerNameInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addPlayer();
  }
});

function addPlayer() {
  const name = document.getElementById("playerNameInput").value.trim();
  if (!name) return;

  if (players.includes(name)) {
    alert("이미 존재하는 이름입니다. 다시 입력하세요.");
    return;
  }

  players.push(name);
  document.getElementById("playerNameInput").value = "";

  if (players.length < totalPlayers) {
    document.getElementById("namePrompt").innerText = `${players.length + 1}번째 참가자 이름을 입력하세요.`;
    document.getElementById("playerNameInput").focus();
  } else {
    originalPlayers = [...players]; // ✅ 원본 저장
    document.getElementById("nameInputArea").style.display = "none";
    startGame();
  }
}

// 배열 섞기
function shufflePlayers() {
  for (let i = players.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [players[i], players[j]] = [players[j], players[i]];
  }
}

// 게임 시작
function startGame() {
  shufflePlayers();
  document.getElementById("gameArea").style.display = "flex";
  updateTurnInfo();
  updateOrder(); // ✅ 순서 표시
  document.getElementById("wordInput").focus();
  if (lastWord !== "") startTimer(); // 첫 제시어는 타이머 없음
}

// 턴 정보 업데이트
function updateTurnInfo() {
  document.getElementById("turnInfo").innerText = `${players[currentTurn]}님의 차례입니다.`;
  document.getElementById("lastWord").innerText = lastWord ? `마지막 단어: ${lastWord}` : "첫 단어를 입력하세요.";
  document.getElementById("errorMsg").innerText = "";
}

// 순서 리스트 업데이트
function updateOrder() {
  const list = document.getElementById("orderList");
  list.innerHTML = "";
  players.forEach((p, i) => {
    const li = document.createElement("li");
    li.innerText = (i === currentTurn) ? `👉 ${p}` : p;
    list.appendChild(li);
  });
  document.getElementById("orderArea").style.display = "block";
}

// 단어 제출 버튼
document.getElementById("submitWordBtn").addEventListener("click", submitWord);

// 단어 입력창 엔터 처리
document.getElementById("wordInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    submitWord();
  }
});

// 단어 기록 추가 함수
function addWordToHistory(word) {
  document.getElementById("wordHistoryArea").style.display = "block";
  const li = document.createElement("li");
  li.innerText = word;
  document.getElementById("wordHistory").appendChild(li);
}

function submitWord() {
  const input = document.getElementById("wordInput").value.trim();
  if (!input) return;

  if (input.length < 2) {
    document.getElementById("errorMsg").innerText = "두 글자 이상 입력해야 합니다!";
    return;
  }

  stopTimer();

  // ✅ 탈락자 이후 새 제시어 중복 검사 먼저
  if (lastWord === "" && words.length > 0 && words.includes(input)) {
    showNotice("이미 입력된 단어입니다!", 3000);
    clearInput();
    return;
  }

  if (words.length === 0) {
    // 게임 시작 첫 단어
    words.push(input);
    lastWord = input;
    addWordToHistory(input);
    nextTurn();
    return;
  }

  if (lastWord === "" && words.length > 0) {
    // 탈락자 이후 새 제시어
    words.push(input);
    lastWord = input;
    addWordToHistory(input);
    nextTurn();
    return;
  }

  // 끝말잇기 규칙 확인
  if (input[0] !== lastWord[lastWord.length - 1]) {
    eliminatePlayer(players[currentTurn]);
    return;
  }

  // 일반 상황 중복 단어 → 탈락
  if (words.includes(input)) {
    eliminatePlayer(players[currentTurn]);
    return;
  }

  words.push(input);
  lastWord = input;
  addWordToHistory(input);
  nextTurn();
}

function eliminatePlayer(name) {
  stopTimer();
  document.getElementById("timerArea").style.display = "none"; 
  document.getElementById("errorMsg").innerText = `${name}님 탈락!`;
  eliminated.push(name);

  document.getElementById("eliminatedArea").style.display = "block";
  const li = document.createElement("li");
  li.innerText = name;
  document.getElementById("eliminatedList").appendChild(li);

  players.splice(currentTurn, 1);

  lastWord = "";
  document.getElementById("lastWord").innerText = "";

  if (players.length === 1) {
    endGame(players[0]);
    return;
  }

  shufflePlayers();
  currentTurn = 0;

  clearInput();
  updateTurnInfo();
  updateOrder();

  // ✅ 순서 변경 안내창
  alert("순서가 변경되었습니다! 새로운 순서를 확인하세요.");
}

function nextTurn() {
  currentTurn++;
  if (currentTurn >= players.length) currentTurn = 0;
  clearInput();
  updateTurnInfo();
  updateOrder();

  if (lastWord !== "") {
    startTimer();
  }
}

function clearInput() {
  document.getElementById("wordInput").value = "";
  document.getElementById("wordInput").focus();
}

function startTimer() {
  let timeLeft = timeLimit;
  document.getElementById("timerArea").style.display = "block";
  document.getElementById("timerText").innerText = `⏱ ${timeLeft}초 남음`;
  document.getElementById("timerBar").style.width = "100%";
  document.getElementById("timerBar").style.backgroundColor = "rgb(76, 175, 80)";

  timer = setInterval(() => {
    timeLeft--;
    document.getElementById("timerText").innerText = `⏱ ${timeLeft}초 남음`;

    const percent = (timeLeft / timeLimit) * 100;
    document.getElementById("timerBar").style.width = percent + "%";

    const r = Math.min(255, Math.floor(255 - (timeLeft / timeLimit) * 255));
    const g = Math.min(255, Math.floor((timeLeft / timeLimit) * 255));
    document.getElementById("timerBar").style.backgroundColor = `rgb(${r}, ${g}, 0)`;

    if (timeLeft <= 0) {
      clearInterval(timer);
      eliminatePlayer(players[currentTurn]);
    }
  }, 1000);
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

// ✅ 승리자 모달 관련
let lastWinner = null;

function endGame(winner) {
  stopTimer();
  document.getElementById("timerArea").style.display = "none";

  lastWinner = winner;
  document.getElementById("winnerMsg").innerText = `🎉 승자는 ${winner}님입니다! 🎉`;
  document.getElementById("winnerModal").style.display = "block";
}

function resetGame() {
  stopTimer();

  totalPlayers = 0;
  players = [];
  originalPlayers = []; // ✅ 원본도 초기화
  eliminated = [];
  currentTurn = 0;
  words = [];
  lastWord = "";
  lastWinner = null;

  document.getElementById("winnerModal").style.display = "none";
  document.getElementById("setup").style.display = "block";
  document.getElementById("nameInputArea").style.display = "none";
  document.getElementById("gameArea").style.display = "none";
  document.getElementById("orderArea").style.display = "none";
  document.getElementById("eliminatedArea").style.display = "none";
  document.getElementById("wordHistoryArea").style.display = "none";
  document.getElementById("timerArea").style.display = "none";

  document.getElementById("orderList").innerHTML = "";
  document.getElementById("eliminatedList").innerHTML = "";
  document.getElementById("wordHistory").innerHTML = "";
  document.getElementById("turnInfo").innerText = "";
  document.getElementById("lastWord").innerText = "";
  document.getElementById("errorMsg").innerText = "";
  document.getElementById("timerText").innerText = "";

  document.getElementById("playerCount").value = "";
  document.getElementById("playerNameInput").value = "";
  document.getElementById("wordInput").value = "";

  noticeShown = false;
}

function restartWithSamePlayers() {
  stopTimer();
  document.getElementById("winnerModal").style.display = "none";

  // ✅ 원본 참가자 복원
  players = [...originalPlayers];

  if (lastWinner) {
    players = players.map(p =>
      p === lastWinner ? `${lastWinner} (우승자)` : p
    );
  }

  // ✅ 참가자 제외 전부 초기화
  eliminated = [];
  words = [];
  lastWord = "";
  currentTurn = 0;

  document.getElementById("wordInput").value = "";
  document.getElementById("eliminatedList").innerHTML = "";
  document.getElementById("wordHistory").innerHTML = "";
  document.getElementById("errorMsg").innerText = "";
  document.getElementById("lastWord").innerText = "";
  document.getElementById("timerArea").style.display = "none";
  document.getElementById("timerText").innerText = "";
  document.getElementById("orderList").innerHTML = "";

  shufflePlayers();
  document.getElementById("gameArea").style.display = "flex";
  updateTurnInfo();
  updateOrder();
  document.getElementById("wordInput").focus();
}