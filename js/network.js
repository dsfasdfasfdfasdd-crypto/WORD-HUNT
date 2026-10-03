// ========================================================
// WORD HUNT .IO - NETWORKING & MULTIPLAYER ENGINE (FIREBASE)
// ========================================================

// ⚠️ DİKKAT: MULTIPLAYER'IN ÇALIŞMASI İÇİN KENDİ FIREBASE BİLGİLERİNİ BURAYA GİRMELİSİN ⚠️
// 1. firebase.google.com adresine git ve ücretsiz bir proje oluştur.
// 2. Realtime Database oluştur (Test modunda).
// 3. Proje ayarlarından "Web Uygulaması" ekle ve sana verilen Config nesnesini aşağıya yapıştır!
const firebaseConfig = {
  apiKey: "AIzaSyBkXj7oYHgDFnEuXvHKmTFiMDGQSZ1ueJk",
  authDomain: "word-hunter-dc231.firebaseapp.com",
  databaseURL: "https://word-hunter-dc231-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "word-hunter-dc231",
  storageBucket: "word-hunter-dc231.firebasestorage.app",
  messagingSenderId: "929019408802",
  appId: "1:929019408802:web:5d65dca7fafd61824642fb",
  measurementId: "G-P885W0QM3Z"
};

// Config kontrolü
const isFirebaseConfigured = !firebaseConfig.apiKey.includes("BURAYA");

if (isFirebaseConfigured) {
  firebase.initializeApp(firebaseConfig);
}

const db = isFirebaseConfigured ? firebase.database() : null;

class NetworkManager {
  constructor() {
    this.roomCode = null;
    this.myId = null;
    this.isHost = false;
    this.isSinglePlayer = false;
    
    this.localPlayer = {
      id: null,
      name: 'Oyuncu',
      avatar: '🎯',
      color: '#ff007f',
      score: 0,
      streak: 0,
      isHost: false,
      isReady: true,
      isBot: false,
      status: 'Hazır'
    };

    this.players = [];
    this.roomSettings = {
      category: 'genel',
      rounds: 5,
      revealSpeed: 3
    };

    this.currentRound = 0;
    this.targetWord = null;
    this.currentWordData = null;
    this.revealedLetters = [];
    this.roundTimer = 0;
    this.roundInterval = null;
    this.secondsToNextLetter = 3;
    this.botIntervals = [];

    // Callbacks
    this.onPlayerListUpdate = null;
    this.onGameStateUpdate = null;
    this.onLetterRevealed = null;
    this.onCorrectGuess = null;
    this.onRoundTimeout = null;
    this.onGameOver = null;
    this.onReactionReceived = null;
    this.onChatMessage = null;
    this.onStatusMessage = null;

    // Listeners
    this.stateRef = null;
    this.actionsRef = null;
    this.eventsRef = null;
  }

  // --- FIREBASE UYARISI ---
  checkFirebase() {
    if (!isFirebaseConfigured) {
      alert("🚨 DİKKAT: Multiplayer aktif değil!\n\n1. js/network.js dosyasını açın.\n2. En üstteki 'firebaseConfig' ayarlarını kendi Firebase projenizle değiştirin.\n\nSadece Tek Oyunculu (Botlarla) mod şu an çalışır.");
      if (this.onStatusMessage) this.onStatusMessage("Sunucu ayarları eksik. Sadece botlarla oynayabilirsiniz.");
      return false;
    }
    return true;
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'WH-';
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  }

  // --- HOST: ODA KURMA ---
  createRoom(customSettings = {}) {
    this.isHost = true;
    this.isSinglePlayer = false;
    this.roomSettings = { ...this.roomSettings, ...customSettings };
    
    if (!this.checkFirebase()) return "HATA";

    this.roomCode = this.generateRoomCode();
    this.myId = 'host_' + Math.random().toString(36).substr(2, 6);
    this.localPlayer.id = this.myId;
    this.localPlayer.isHost = true;
    
    this.players = [{ ...this.localPlayer }];

    // DB Referansları
    this.stateRef = db.ref(`rooms/${this.roomCode}/state`);
    this.actionsRef = db.ref(`rooms/${this.roomCode}/actions`);
    this.eventsRef = db.ref(`rooms/${this.roomCode}/events`);

    // İlk durumu yaz
    this.stateRef.set({
      players: this.players,
      settings: this.roomSettings,
      gameState: 'LOBBY'
    });

    // İstemcilerden gelen aksiyonları dinle (Host otoritesi)
    this.actionsRef.on('child_added', (snapshot) => {
      const action = snapshot.val();
      this.handleClientAction(action, snapshot.key);
    });

    // Odayı kapatma
    window.addEventListener('beforeunload', () => {
      db.ref(`rooms/${this.roomCode}`).remove();
    });

    if (this.onStatusMessage) this.onStatusMessage(`Oda hazır! Kod: ${this.roomCode}`);
    return this.roomCode;
  }

  // --- TEK OYUNCULU MOD (BOTLARLA) ---
  startSinglePlayer(botCount = 2, settings = {}) {
    this.isHost = true;
    this.isSinglePlayer = true;
    this.roomSettings = { ...this.roomSettings, ...settings, rounds: settings.rounds || 5 };
    this.roomCode = 'SOLO-' + Math.floor(1000 + Math.random() * 9000);
    this.myId = 'solo_player';
    this.localPlayer.id = this.myId;
    this.localPlayer.isHost = true;
    this.players = [{ ...this.localPlayer }];

    const botArchetypes = [
      { name: 'Kaan (Pro)', avatar: 'assets/avatars/wizard.jpg', color: '#f1c40f', iq: 0.8 },
      { name: 'Zeynep_JS', avatar: 'assets/avatars/gamergirl.jpg', color: '#00e5ff', iq: 0.65 },
      { name: 'PikselBot', avatar: 'assets/avatars/jester.jpg', color: '#9d4edd', iq: 0.5 },
      { name: 'AlevliKurt', avatar: 'assets/avatars/coolcat.jpg', color: '#ff6b00', iq: 0.6 }
    ];

    for (let i = 0; i < Math.min(botCount, botArchetypes.length); i++) {
      const b = botArchetypes[i];
      this.players.push({
        id: 'bot_' + i, name: b.name, avatar: b.avatar, color: b.color,
        score: 0, streak: 0, isHost: false, isReady: true, isBot: true, iq: b.iq, status: 'Hazır'
      });
    }

    if (this.onPlayerListUpdate) this.onPlayerListUpdate(this.players);
    return this.roomCode;
  }

  addBotToRoom() {
    if (!this.isHost) return;
    if (this.players.length >= 8) return;

    const b = { name: 'SiberBot', avatar: 'assets/avatars/shadow.jpg', color: '#0070dd', iq: 0.6 };
    const newBot = {
      id: 'bot_' + Date.now(), name: b.name + Math.floor(Math.random()*10), avatar: b.avatar, color: b.color,
      score: 0, streak: 0, isHost: false, isReady: true, isBot: true, iq: b.iq, status: 'Hazır'
    };

    this.players.push(newBot);
    this.updateState({ players: this.players });
  }

  // --- CLIENT: ODAYA KATILMA ---
  joinRoom(targetCode, playerInfo = {}) {
    if (!this.checkFirebase()) return;
    
    this.isHost = false;
    this.isSinglePlayer = false;
    this.roomCode = targetCode.toUpperCase().trim();
    if (!this.roomCode.startsWith('WH-')) this.roomCode = 'WH-' + this.roomCode;

    this.myId = 'client_' + Math.random().toString(36).substr(2, 6);
    this.localPlayer.id = this.myId;
    this.localPlayer = { ...this.localPlayer, ...playerInfo };

    if (this.onStatusMessage) this.onStatusMessage(`Bağlanılıyor: ${this.roomCode}...`);

    this.stateRef = db.ref(`rooms/${this.roomCode}/state`);
    this.actionsRef = db.ref(`rooms/${this.roomCode}/actions`);
    this.eventsRef = db.ref(`rooms/${this.roomCode}/events`);

    // Oda var mı kontrol et
    this.stateRef.once('value', snapshot => {
      if (!snapshot.exists()) {
        if (this.onStatusMessage) this.onStatusMessage('Oda bulunamadı!');
        return;
      }

      if (this.onStatusMessage) this.onStatusMessage('Odaya katıldın!');
      
      // Katılma isteğini Host'a gönder
      this.actionsRef.push({
        type: 'PLAYER_JOIN',
        player: this.localPlayer
      });

      // Durum değişikliklerini dinle
      this.stateRef.on('value', snap => {
        const state = snap.val();
        if (state) this.handleStateUpdate(state);
      });

      // Olayları (Event) dinle
      this.eventsRef.on('child_added', snap => {
        const event = snap.val();
        this.handleEvent(event);
      });
    });
  }

  // --- HOST: İSTEMCİ AKSİYONLARINI YÖNETME ---
  handleClientAction(action, actionKey) {
    if (!this.isHost) return;
    
    switch (action.type) {
      case 'PLAYER_JOIN': {
        const p = action.player;
        p.score = 0; p.streak = 0; p.isReady = true; p.status = 'Hazır';
        
        let name = p.name;
        let count = 1;
        while (this.players.some(x => x.name === name)) {
          name = `${p.name} (${++count})`;
        }
        p.name = name;

        this.players.push(p);
        this.updateState({ players: this.players });
        
        this.emitEvent('CHAT', {
          message: { from: 'SİSTEM', text: `${p.name} odaya katıldı!`, color: '#2ecc71' }
        });
        break;
      }
      case 'SUBMIT_GUESS':
        this.processGuess(action.playerId, action.guess);
        break;
      case 'SEND_REACTION':
        this.emitEvent('REACTION', { emoji: action.emoji, playerId: action.playerId });
        break;
      case 'SEND_CHAT': {
        const sender = this.players.find(p => p.id === action.playerId);
        if (sender) {
          this.emitEvent('CHAT', {
            message: { from: sender.name, avatar: sender.avatar, text: action.text, color: sender.color }
          });
        }
        break;
      }
    }
    
    // Aksiyon işlendikten sonra sil
    if (this.actionsRef) this.actionsRef.child(actionKey).remove();
  }

  // --- DEVLET VE OLAY YÖNETİMİ ---
  updateState(updates) {
    if (this.isSinglePlayer) {
      this.handleStateUpdate({ ...this.lastState, ...updates });
      return;
    }
    if (this.stateRef) this.stateRef.update(updates);
  }

  emitEvent(type, payload) {
    if (this.isSinglePlayer) {
      this.handleEvent({ type, ...payload });
      return;
    }
    if (this.eventsRef) {
      this.eventsRef.push({ type, ...payload, timestamp: Date.now() });
    }
  }

  handleStateUpdate(state) {
    this.lastState = state;
    if (state.players) {
      this.players = state.players;
      if (this.onPlayerListUpdate) this.onPlayerListUpdate(this.players);
    }
    if (state.settings) this.roomSettings = state.settings;
    
    if (state.gameState === 'PLAYING' && this.onGameStateUpdate) {
      this.onGameStateUpdate('PLAYING');
    }
  }

  handleEvent(event) {
    switch (event.type) {
      case 'NEW_ROUND':
        this.currentRound = event.round;
        this.revealedLetters = event.revealedLetters;
        if (this.onGameStateUpdate) {
          this.onGameStateUpdate('NEW_ROUND', event);
        }
        break;
      case 'LETTER_REVEAL':
        this.revealedLetters = event.revealedLetters;
        if (this.onLetterRevealed) {
          this.onLetterRevealed(event.index, event.letter, event.revealedLetters);
        }
        break;
      case 'TIMER_TICK':
        if (this.onGameStateUpdate) this.onGameStateUpdate('TIMER_TICK', event);
        break;
      case 'CORRECT_GUESS':
        if (this.onCorrectGuess) this.onCorrectGuess(event.winner, event.word, event.points, event.players);
        break;
      case 'ROUND_TIMEOUT':
        if (this.onRoundTimeout) this.onRoundTimeout(event.word, event.players);
        break;
      case 'GAME_OVER':
        if (this.onGameOver) this.onGameOver(event.leaderboard);
        break;
      case 'REACTION':
        const player = this.players.find(p => p.id === event.playerId);
        if (this.onReactionReceived && player) this.onReactionReceived(event.emoji, player);
        break;
      case 'CHAT':
        if (this.onChatMessage) this.onChatMessage(event.message);
        break;
    }
  }

  // --- OYUN AKIŞI (SADECE HOST) ---
  startGame() {
    if (!this.isHost) return;
    this.currentRound = 0;
    this.players.forEach(p => { p.score = 0; p.streak = 0; p.status = 'Düşünüyor...'; });
    this.updateState({ gameState: 'PLAYING', players: this.players });
    this.nextRound();
  }

  nextRound() {
    this.clearRoundTimers();
    this.currentRound++;

    if (this.currentRound > this.roomSettings.rounds) {
      this.endGame();
      return;
    }

    const category = this.roomSettings.category || 'genel';
    this.currentWordData = getRandomWord(category);
    this.targetWord = toTurkishUpper(this.currentWordData.word);

    this.revealedLetters = Array(this.targetWord.length).fill(null);
    this.secondsToNextLetter = this.roomSettings.revealSpeed || 3;
    this.roundTimer = this.targetWord.length * this.secondsToNextLetter + 5;

    const firstIdx = Math.floor(Math.random() * this.targetWord.length);
    this.revealedLetters[firstIdx] = this.targetWord[firstIdx];
    this.players.forEach(p => { p.status = 'Düşünüyor...'; });

    this.updateState({ players: this.players });
    
    this.emitEvent('NEW_ROUND', {
      round: this.currentRound,
      totalRounds: this.roomSettings.rounds,
      category: this.currentWordData.category || category,
      hint: this.currentWordData.hint,
      wordLength: this.targetWord.length,
      revealedLetters: this.revealedLetters,
      timer: this.secondsToNextLetter
    });

    this.startRoundTicker();
    this.scheduleBotGuesses();
  }

  startRoundTicker() {
    let nextLetterCounter = this.secondsToNextLetter;

    this.roundInterval = setInterval(() => {
      nextLetterCounter--;

      if (nextLetterCounter <= 0) {
        const unrevealed = [];
        for (let i = 0; i < this.targetWord.length; i++) {
          if (!this.revealedLetters[i]) unrevealed.push(i);
        }

        if (unrevealed.length > 0) {
          const randIdx = unrevealed[Math.floor(Math.random() * unrevealed.length)];
          this.revealedLetters[randIdx] = this.targetWord[randIdx];

          this.emitEvent('LETTER_REVEAL', {
            index: randIdx,
            letter: this.targetWord[randIdx],
            revealedLetters: this.revealedLetters
          });
        }
        nextLetterCounter = this.secondsToNextLetter;
      }

      this.roundTimer--;
      this.emitEvent('TIMER_TICK', { roundTimer: this.roundTimer, nextLetterIn: nextLetterCounter });

      const allRevealed = this.revealedLetters.every(l => l !== null);
      if (this.roundTimer <= 0 || (allRevealed && nextLetterCounter <= 1)) {
        this.handleRoundTimeout();
      }
    }, 1000);
  }

  scheduleBotGuesses() {
    this.botIntervals.forEach(t => clearTimeout(t));
    this.botIntervals = [];

    const bots = this.players.filter(p => p.isBot);
    bots.forEach(bot => {
      const minDelay = 2500 + Math.random() * 3000;
      const maxDelay = (this.targetWord.length * this.secondsToNextLetter * 1000) - 2000;
      const delay = Math.max(minDelay, Math.random() * maxDelay);

      const timeout = setTimeout(() => {
        const revealedCount = this.revealedLetters.filter(x => x !== null).length;
        const ratio = revealedCount / this.targetWord.length;
        const chance = (bot.iq || 0.6) * (0.3 + ratio * 0.7);

        if (Math.random() < chance) {
          this.processGuess(bot.id, this.targetWord);
          setTimeout(() => {
            const emojis = ['🔥', '😎', '🧠', '💯', '👑'];
            this.emitEvent('REACTION', { emoji: emojis[Math.floor(Math.random() * emojis.length)], playerId: bot.id });
          }, 400);
        }
      }, delay);
      this.botIntervals.push(timeout);
    });
  }

  processGuess(playerId, rawGuess) {
    if (!this.targetWord) return;
    const guess = toTurkishUpper(rawGuess);
    const player = this.players.find(p => p.id === playerId);
    if (!player) return;

    if (guess === this.targetWord) {
      this.clearRoundTimers();

      const unrevealedCount = this.revealedLetters.filter(l => l === null).length;
      player.streak++;
      const multiplier = player.streak >= 4 ? 2.5 : (player.streak >= 2 ? 1.5 : 1.0);
      const basePoints = 200 + (unrevealedCount * 80) + Math.max(0, this.roundTimer * 10);
      const totalPoints = Math.round(basePoints * multiplier);

      player.score += totalPoints;
      player.status = `🎯 BİLDİ! (+${totalPoints})`;

      this.players.forEach(p => {
        if (p.id !== playerId) {
          p.streak = 0;
          p.status = 'Kaçırdı!';
        }
      });

      this.updateState({ players: this.players });
      this.emitEvent('CORRECT_GUESS', { winner: player, word: this.targetWord, points: totalPoints, players: this.players });

      setTimeout(() => this.nextRound(), 3500);
    } else {
      player.status = '❌ Yanlış!';
      this.updateState({ players: this.players });
    }
  }

  handleRoundTimeout() {
    this.clearRoundTimers();
    this.players.forEach(p => { p.streak = 0; p.status = 'Süre Bitti!'; });
    this.updateState({ players: this.players });
    this.emitEvent('ROUND_TIMEOUT', { word: this.targetWord, players: this.players });
    setTimeout(() => this.nextRound(), 3500);
  }

  endGame() {
    this.clearRoundTimers();
    const sorted = [...this.players].sort((a, b) => b.score - a.score);
    this.emitEvent('GAME_OVER', { leaderboard: sorted });
  }

  clearRoundTimers() {
    clearInterval(this.roundInterval);
    this.roundInterval = null;
    this.botIntervals.forEach(t => clearTimeout(t));
    this.botIntervals = [];
  }

  // --- İSTEMCİ GÖNDERİMLERİ ---
  sendGuess(guessText) {
    if (this.isHost) this.processGuess(this.myId, guessText);
    else if (this.actionsRef) this.actionsRef.push({ type: 'SUBMIT_GUESS', playerId: this.myId, guess: guessText });
  }

  sendReaction(emoji) {
    if (this.isHost) this.emitEvent('REACTION', { emoji, playerId: this.myId });
    else if (this.actionsRef) this.actionsRef.push({ type: 'SEND_REACTION', playerId: this.myId, emoji });
  }

  sendChatMessage(text) {
    if (!text.trim()) return;
    if (this.isHost) {
      this.emitEvent('CHAT', {
        message: { from: this.localPlayer.name, avatar: this.localPlayer.avatar, text: text.trim(), color: this.localPlayer.color }
      });
    } else if (this.actionsRef) {
      this.actionsRef.push({ type: 'SEND_CHAT', playerId: this.myId, text: text.trim() });
    }
  }
}

const network = new NetworkManager();
