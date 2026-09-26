// ========================================================
// WORD HUNT .IO - NETWORKING & MULTIPLAYER ENGINE (P2P + BOTS)
// ========================================================

class NetworkManager {
  constructor() {
    this.peer = null;
    this.connections = []; // Host: all connected clients. Client: connection to host
    this.hostConn = null;
    this.isHost = false;
    this.roomCode = null;
    this.myId = null;
    this.localPlayer = {
      id: null,
      name: 'Oyuncu',
      avatar: '🪩',
      color: '#ff007f',
      score: 0,
      streak: 0,
      isHost: false,
      isReady: true,
      isBot: false,
      status: 'Hazır'
    };

    this.players = []; // List of all players in current room
    this.roomSettings = {
      category: 'genel',
      rounds: 5,
      revealSpeed: 3, // seconds
      maxPlayers: 8,
      isPublic: true
    };

    this.currentRound = 0;
    this.currentWordData = null; // Host only knows raw word
    this.revealedLetters = [];
    this.roundTimer = 0;
    this.roundInterval = null;
    this.letterRevealInterval = null;
    this.secondsToNextLetter = 3;
    this.isSinglePlayer = false;
    this.botIntervals = [];

    // Callbacks to UI
    this.onPlayerListUpdate = null;
    this.onGameStateUpdate = null;
    this.onLetterRevealed = null;
    this.onCorrectGuess = null;
    this.onRoundTimeout = null;
    this.onGameOver = null;
    this.onReactionReceived = null;
    this.onChatMessage = null;
    this.onStatusMessage = null;
  }

  // --- ODA KODU OLUŞTURMA ---
  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'WH-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  getPeerIdForRoom(roomCode) {
    const clean = roomCode.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
    return `whunt-v2-${clean}`;
  }

  // --- HOST: ODA KURMA ---
  createRoom(customSettings = {}) {
    this.isHost = true;
    this.isSinglePlayer = false;
    this.roomSettings = { ...this.roomSettings, ...customSettings };
    this.roomCode = this.generateRoomCode();
    this.myId = 'host_' + Math.random().toString(36).substr(2, 6);
    this.localPlayer.id = this.myId;
    this.localPlayer.isHost = true;
    this.localPlayer.score = 0;
    this.localPlayer.streak = 0;
    this.players = [{ ...this.localPlayer }];

    if (this.onStatusMessage) this.onStatusMessage(`Oda oluşturuluyor (${this.roomCode})...`);

    // PeerJS bağlantısı kur
    const peerId = this.getPeerIdForRoom(this.roomCode);
    try {
      this.peer = new Peer(peerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      this.peer.on('open', (id) => {
        console.log('[Host] Peer açıldı. Room Code:', this.roomCode, 'Peer ID:', id);
        if (this.onStatusMessage) this.onStatusMessage(`Oda hazır! Kod: ${this.roomCode}`);
        this.broadcastLobbyUpdate();
      });

      this.peer.on('connection', (conn) => {
        this.handleClientConnect(conn);
      });

      this.peer.on('error', (err) => {
        console.warn('[Host Peer Warning]', err);
        // Eğer ID çakışması olursa yeni kod dene
        if (err.type === 'unavailable-id') {
          console.log('ID çakıştı, tekrar deneniyor...');
          this.createRoom(customSettings);
        }
      });
    } catch (e) {
      console.error('[PeerJS Exception]', e);
    }

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
    this.localPlayer.score = 0;
    this.localPlayer.streak = 0;
    this.players = [{ ...this.localPlayer }];

    // Akıllı Botları Ekle
    const botArchetypes = [
      { name: 'Kaan (Pro)', avatar: '👑', color: '#f1c40f', iq: 0.8 },
      { name: 'Zeynep_JS', avatar: '🐱‍💻', color: '#00e5ff', iq: 0.65 },
      { name: 'PikselBot', avatar: '👾', color: '#9d4edd', iq: 0.5 },
      { name: 'AlevliKurt', avatar: '🔥', color: '#ff6b00', iq: 0.6 }
    ];

    for (let i = 0; i < Math.min(botCount, botArchetypes.length); i++) {
      const b = botArchetypes[i];
      this.players.push({
        id: 'bot_' + i,
        name: b.name,
        avatar: b.avatar,
        color: b.color,
        score: 0,
        streak: 0,
        isHost: false,
        isReady: true,
        isBot: true,
        iq: b.iq,
        status: 'Hazır'
      });
    }

    if (this.onPlayerListUpdate) this.onPlayerListUpdate(this.players);
    return this.roomCode;
  }

  // --- BOT EKLE (Host multiplayer lobisindeyken de bot ekleyebilir) ---
  addBotToRoom() {
    if (!this.isHost) return;
    if (this.players.length >= this.roomSettings.maxPlayers) return;

    const botArchetypes = [
      { name: 'Siber_Bot', avatar: '🤖', color: '#0070dd', iq: 0.6 },
      { name: 'Balatro_AI', avatar: '🪩', color: '#ff007f', iq: 0.75 },
      { name: 'Matrix_Neo', avatar: '⚡', color: '#2ecc71', iq: 0.65 },
      { name: 'TurboKelime', avatar: '🚀', color: '#e63946', iq: 0.7 }
    ];

    const available = botArchetypes.filter(b => !this.players.some(p => p.name === b.name));
    const chosen = available.length > 0 ? available[0] : {
      name: 'Bot_' + Math.floor(Math.random() * 100),
      avatar: '🤖',
      color: '#ffaa00',
      iq: 0.6
    };

    const newBot = {
      id: 'bot_' + Date.now(),
      name: chosen.name,
      avatar: chosen.avatar,
      color: chosen.color,
      score: 0,
      streak: 0,
      isHost: false,
      isReady: true,
      isBot: true,
      iq: chosen.iq,
      status: 'Hazır'
    };

    this.players.push(newBot);
    this.broadcastLobbyUpdate();
  }

  // --- CLIENT: ODAYA KATILMA ---
  joinRoom(targetCode, playerInfo = {}) {
    this.isHost = false;
    this.isSinglePlayer = false;
    this.roomCode = targetCode.toUpperCase().trim();
    if (!this.roomCode.startsWith('WH-')) {
      this.roomCode = 'WH-' + this.roomCode.replace(/[^A-Za-z0-9]/g, '');
    }

    this.myId = 'client_' + Math.random().toString(36).substr(2, 6);
    this.localPlayer.id = this.myId;
    this.localPlayer = { ...this.localPlayer, ...playerInfo };

    if (this.onStatusMessage) this.onStatusMessage(`Odaya bağlanılıyor: ${this.roomCode}...`);

    const hostPeerId = this.getPeerIdForRoom(this.roomCode);
    const myClientPeerId = `whunt-cl-${Math.random().toString(36).substr(2, 8)}`;

    try {
      this.peer = new Peer(myClientPeerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      this.peer.on('open', () => {
        console.log('[Client] Host bağlanılıyor:', hostPeerId);
        this.hostConn = this.peer.connect(hostPeerId, { reliable: true });

        this.hostConn.on('open', () => {
          console.log('[Client] Host ile bağlantı kuruldu!');
          if (this.onStatusMessage) this.onStatusMessage('Odaya katıldın! Hoş geldin.');
          // Kendini Host'a tanıt
          this.hostConn.send({
            type: 'PLAYER_JOIN',
            player: this.localPlayer
          });
        });

        this.hostConn.on('data', (data) => {
          this.handleHostMessage(data);
        });

        this.hostConn.on('close', () => {
          if (this.onStatusMessage) this.onStatusMessage('Oda bağlantısı kesildi.');
        });

        this.hostConn.on('error', (err) => {
          console.error('[HostConn Error]', err);
          if (this.onStatusMessage) this.onStatusMessage('Bağlantı hatası: ' + err);
        });
      });

      this.peer.on('error', (err) => {
        console.error('[Client Peer Error]', err);
        if (this.onStatusMessage) this.onStatusMessage('Oda bulunamadı veya bağlantı kurulamadı!');
      });
    } catch (e) {
      console.error('[Join Exception]', e);
    }
  }

  // --- HOST: İSTEMCİ BAĞLANTISI GELDİĞİNDE ---
  handleClientConnect(conn) {
    this.connections.push(conn);

    conn.on('data', (data) => {
      this.handleClientMessage(conn, data);
    });

    conn.on('close', () => {
      // Oyuncuyu çıkart
      this.players = this.players.filter(p => p.connId !== conn.peer);
      this.connections = this.connections.filter(c => c !== conn);
      this.broadcastLobbyUpdate();
      this.broadcastChat({
        from: 'SİSTEM',
        text: 'Bir oyuncu odadan ayrıldı.',
        color: '#ff4d4d'
      });
    });
  }

  // --- HOST: İSTEMCİDEN GELEN MESAJLAR ---
  handleClientMessage(conn, data) {
    if (!data || !data.type) return;

    switch (data.type) {
      case 'PLAYER_JOIN': {
        const p = data.player;
        p.connId = conn.peer;
        p.score = 0;
        p.streak = 0;
        p.isReady = true;
        p.status = 'Hazır';

        // İsmi aynı olan varsa sonuna numara ekle
        let name = p.name;
        let count = 1;
        while (this.players.some(x => x.name === name)) {
          name = `${p.name} (${++count})`;
        }
        p.name = name;

        this.players.push(p);
        this.broadcastLobbyUpdate();
        this.broadcastChat({
          from: 'SİSTEM',
          text: `${p.name} odaya katıldı!`,
          color: '#2ecc71'
        });
        break;
      }

      case 'SUBMIT_GUESS': {
        this.processGuess(data.playerId, data.guess);
        break;
      }

      case 'SEND_REACTION': {
        this.broadcastReaction(data.emoji, data.playerId);
        break;
      }

      case 'SEND_CHAT': {
        const sender = this.players.find(p => p.id === data.playerId);
        if (sender) {
          this.broadcastChat({
            from: sender.name,
            avatar: sender.avatar,
            text: data.text,
            color: sender.color
          });
        }
        break;
      }
    }
  }

  // --- CLIENT: HOST'TAN GELEN MESAJLAR ---
  handleHostMessage(data) {
    if (!data || !data.type) return;

    switch (data.type) {
      case 'LOBBY_UPDATE':
        this.players = data.players;
        this.roomSettings = data.settings;
        if (this.onPlayerListUpdate) this.onPlayerListUpdate(this.players);
        break;

      case 'START_GAME':
        if (this.onGameStateUpdate) this.onGameStateUpdate('PLAYING');
        break;

      case 'NEW_ROUND':
        this.currentRound = data.round;
        this.revealedLetters = data.revealedLetters;
        if (this.onGameStateUpdate) {
          this.onGameStateUpdate('NEW_ROUND', {
            round: data.round,
            totalRounds: data.totalRounds,
            category: data.category,
            hint: data.hint,
            wordLength: data.wordLength,
            revealedLetters: data.revealedLetters,
            timer: data.timer
          });
        }
        break;

      case 'LETTER_REVEAL':
        this.revealedLetters = data.revealedLetters;
        if (this.onLetterRevealed) {
          this.onLetterRevealed(data.index, data.letter, data.revealedLetters);
        }
        break;

      case 'TIMER_TICK':
        if (this.onGameStateUpdate) {
          this.onGameStateUpdate('TIMER_TICK', {
            roundTimer: data.roundTimer,
            nextLetterIn: data.nextLetterIn
          });
        }
        break;

      case 'CORRECT_GUESS':
        this.players = data.players;
        if (this.onCorrectGuess) {
          this.onCorrectGuess(data.winner, data.word, data.points, data.players);
        }
        break;

      case 'ROUND_TIMEOUT':
        this.players = data.players;
        if (this.onRoundTimeout) {
          this.onRoundTimeout(data.word, data.players);
        }
        break;

      case 'GAME_OVER':
        this.players = data.players;
        if (this.onGameOver) {
          this.onGameOver(data.leaderboard);
        }
        break;

      case 'REACTION':
        if (this.onReactionReceived) {
          this.onReactionReceived(data.emoji, data.player);
        }
        break;

      case 'CHAT':
        if (this.onChatMessage) {
          this.onChatMessage(data.message);
        }
        break;
    }
  }

  // --- HOST YAYIN FONKSİYONLARI ---
  broadcast(data) {
    this.connections.forEach(conn => {
      if (conn && conn.open) {
        conn.send(data);
      }
    });
  }

  broadcastLobbyUpdate() {
    const payload = {
      type: 'LOBBY_UPDATE',
      players: this.players,
      settings: this.roomSettings
    };
    this.broadcast(payload);
    if (this.onPlayerListUpdate) this.onPlayerListUpdate(this.players);
  }

  broadcastChat(message) {
    const payload = { type: 'CHAT', message };
    this.broadcast(payload);
    if (this.onChatMessage) this.onChatMessage(message);
  }

  broadcastReaction(emoji, playerId) {
    const player = this.players.find(p => p.id === playerId);
    const payload = { type: 'REACTION', emoji, player };
    this.broadcast(payload);
    if (this.onReactionReceived) this.onReactionReceived(emoji, player);
  }

  // --- OYUN AKIŞI YÖNETİMİ (HOST AUTHORITY) ---
  startGame() {
    if (!this.isHost) return;
    this.currentRound = 0;
    this.players.forEach(p => { p.score = 0; p.streak = 0; p.status = 'Düşünüyor...'; });
    this.broadcast({ type: 'START_GAME' });
    if (this.onGameStateUpdate) this.onGameStateUpdate('PLAYING');

    this.nextRound();
  }

  nextRound() {
    this.clearRoundTimers();
    this.currentRound++;

    if (this.currentRound > this.roomSettings.rounds) {
      this.endGame();
      return;
    }

    // Kelime seç
    const category = this.roomSettings.category || 'genel';
    this.currentWordData = getRandomWord(category);
    const targetWord = toTurkishUpper(this.currentWordData.word);
    this.targetWord = targetWord;

    this.revealedLetters = Array(targetWord.length).fill(null);
    this.secondsToNextLetter = this.roomSettings.revealSpeed || 3;
    this.roundTimer = targetWord.length * this.secondsToNextLetter + 5; // Toplam süre

    // İlk rastgele harfi hemen aç
    const firstIdx = Math.floor(Math.random() * targetWord.length);
    this.revealedLetters[firstIdx] = targetWord[firstIdx];

    this.players.forEach(p => { p.status = 'Düşünüyor...'; });

    const roundData = {
      type: 'NEW_ROUND',
      round: this.currentRound,
      totalRounds: this.roomSettings.rounds,
      category: this.currentWordData.category || category,
      hint: this.currentWordData.hint,
      wordLength: targetWord.length,
      revealedLetters: [...this.revealedLetters],
      timer: this.secondsToNextLetter
    };

    this.broadcast(roundData);
    if (this.onGameStateUpdate) {
      this.onGameStateUpdate('NEW_ROUND', {
        ...roundData,
        targetWord: this.isSinglePlayer ? this.targetWord : null
      });
    }

    // Harf açılma & Geri sayım döngüsü
    this.startRoundTicker();

    // Bot simülasyonunu başlat
    this.scheduleBotGuesses();
  }

  startRoundTicker() {
    let nextLetterCounter = this.secondsToNextLetter;

    this.roundInterval = setInterval(() => {
      nextLetterCounter--;

      if (nextLetterCounter <= 0) {
        // Yeni bir harf aç
        const unrevealed = [];
        for (let i = 0; i < this.targetWord.length; i++) {
          if (!this.revealedLetters[i]) unrevealed.push(i);
        }

        if (unrevealed.length > 0) {
          const randIdx = unrevealed[Math.floor(Math.random() * unrevealed.length)];
          this.revealedLetters[randIdx] = this.targetWord[randIdx];

          const revealMsg = {
            type: 'LETTER_REVEAL',
            index: randIdx,
            letter: this.targetWord[randIdx],
            revealedLetters: [...this.revealedLetters]
          };
          this.broadcast(revealMsg);
          if (this.onLetterRevealed) {
            this.onLetterRevealed(randIdx, this.targetWord[randIdx], this.revealedLetters);
          }
        }

        nextLetterCounter = this.secondsToNextLetter;
      }

      this.roundTimer--;

      const tickMsg = {
        type: 'TIMER_TICK',
        roundTimer: this.roundTimer,
        nextLetterIn: nextLetterCounter
      };
      this.broadcast(tickMsg);
      if (this.onGameStateUpdate) this.onGameStateUpdate('TIMER_TICK', tickMsg);

      // Süre bitti mi veya tüm harfler açıldı mı?
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
      // Botun tahmin yapma olasılığı ve gecikmesi
      const minDelay = 2500 + Math.random() * 3000;
      const maxDelay = (this.targetWord.length * this.secondsToNextLetter * 1000) - 2000;
      const delay = Math.max(minDelay, Math.random() * maxDelay);

      const timeout = setTimeout(() => {
        // Harf açılma oranına göre bot bilme ihtimali
        const revealedCount = this.revealedLetters.filter(x => x !== null).length;
        const ratio = revealedCount / this.targetWord.length;
        const chance = (bot.iq || 0.6) * (0.3 + ratio * 0.7);

        if (Math.random() < chance) {
          // Bot doğru tahmin etti!
          this.processGuess(bot.id, this.targetWord);
          // Bot sevinç emojisi atsın
          setTimeout(() => {
            const emojis = ['🔥', '😎', '🧠', '💯', '👑'];
            this.broadcastReaction(emojis[Math.floor(Math.random() * emojis.length)], bot.id);
          }, 400);
        }
      }, delay);

      this.botIntervals.push(timeout);
    });
  }

  // --- TAHMİN KONTROLÜ (AUTHORITATIVE) ---
  processGuess(playerId, rawGuess) {
    if (!this.targetWord) return;
    const guess = toTurkishUpper(rawGuess);
    const player = this.players.find(p => p.id === playerId);
    if (!player) return;

    if (guess === this.targetWord) {
      // DOĞRU TAHMİN!
      this.clearRoundTimers();

      // Puan hesaplama: Ne kadar az harf açıldıysa ve ne kadar hızlıysa o kadar çok puan!
      const unrevealedCount = this.revealedLetters.filter(l => l === null).length;
      player.streak++;
      const multiplier = player.streak >= 4 ? 2.5 : (player.streak >= 2 ? 1.5 : 1.0);
      const basePoints = 200 + (unrevealedCount * 80) + Math.max(0, this.roundTimer * 10);
      const totalPoints = Math.round(basePoints * multiplier);

      player.score += totalPoints;
      player.status = `🎯 BİLDİ! (+${totalPoints})`;

      // Diğer oyuncuların serisini sıfırla
      this.players.forEach(p => {
        if (p.id !== playerId) {
          p.streak = 0;
          p.status = 'Kaçırdı!';
        }
      });

      const correctMsg = {
        type: 'CORRECT_GUESS',
        winner: player,
        word: this.targetWord,
        points: totalPoints,
        players: this.players
      };
      this.broadcast(correctMsg);
      if (this.onCorrectGuess) {
        this.onCorrectGuess(player, this.targetWord, totalPoints, this.players);
      }

      // 3.5 saniye sonra yeni tura geç
      setTimeout(() => {
        this.nextRound();
      }, 3500);

    } else {
      // YANLIŞ TAHMİN
      player.status = '❌ Yanlış!';
      this.broadcastLobbyUpdate();
    }
  }

  handleRoundTimeout() {
    this.clearRoundTimers();
    this.players.forEach(p => {
      p.streak = 0;
      p.status = 'Süre Bitti!';
    });

    const timeoutMsg = {
      type: 'ROUND_TIMEOUT',
      word: this.targetWord,
      players: this.players
    };
    this.broadcast(timeoutMsg);
    if (this.onRoundTimeout) {
      this.onRoundTimeout(this.targetWord, this.players);
    }

    setTimeout(() => {
      this.nextRound();
    }, 3500);
  }

  endGame() {
    this.clearRoundTimers();
    // Sıralamayı puana göre yap
    const sorted = [...this.players].sort((a, b) => b.score - a.score);

    const gameOverMsg = {
      type: 'GAME_OVER',
      leaderboard: sorted,
      players: this.players
    };
    this.broadcast(gameOverMsg);
    if (this.onGameOver) {
      this.onGameOver(sorted);
    }
  }

  clearRoundTimers() {
    clearInterval(this.roundInterval);
    this.roundInterval = null;
    this.botIntervals.forEach(t => clearTimeout(t));
    this.botIntervals = [];
  }

  // --- İSTEMCİ EYLEMLERİ ---
  sendGuess(guessText) {
    if (this.isHost) {
      this.processGuess(this.myId, guessText);
    } else if (this.hostConn && this.hostConn.open) {
      this.hostConn.send({
        type: 'SUBMIT_GUESS',
        playerId: this.myId,
        guess: guessText
      });
    }
  }

  sendReaction(emoji) {
    if (this.isHost) {
      this.broadcastReaction(emoji, this.myId);
    } else if (this.hostConn && this.hostConn.open) {
      this.hostConn.send({
        type: 'SEND_REACTION',
        playerId: this.myId,
        emoji
      });
    }
  }

  sendChatMessage(text) {
    if (!text.trim()) return;
    if (this.isHost) {
      this.broadcastChat({
        from: this.localPlayer.name,
        avatar: this.localPlayer.avatar,
        text: text.trim(),
        color: this.localPlayer.color
      });
    } else if (this.hostConn && this.hostConn.open) {
      this.hostConn.send({
        type: 'SEND_CHAT',
        playerId: this.myId,
        text: text.trim()
      });
    }
  }
}

// Global ağ yöneticisi
const network = new NetworkManager();
