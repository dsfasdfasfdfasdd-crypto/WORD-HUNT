// ========================================================
// WORD HUNT .IO - MASTER GAME CONTROLLER
// ========================================================

class GameController {
  constructor() {
    this.currentView = 'menu';
    this.avatars = [
      'assets/avatars/gamergirl.jpg',
      'assets/avatars/coolcat.jpg',
      'assets/avatars/wizard.jpg',
      'assets/avatars/pirate.jpg',
      'assets/avatars/shadow.jpg',
      'assets/avatars/jester.jpg',
      '👑', '👽', '🐶', '🧙‍♀️', '🎯', '🪩'
    ];
    this.selectedAvatar = 'assets/avatars/gamergirl.jpg';
    this.avatarScrollPos = 0;
    this.selectedColor = '#ff007f';
    this.isCrtEnabled = true;
    this.isSfxEnabled = true;
    this.bgSpeed = 0.016;

    this.nicknameSuggestions = [
      'BalatroKralı', 'SiberYolcu', 'PikselAvcısı', 'KelimeUstası',
      'NeonGölge', 'TurboZeka', 'KozmikKurt', 'AlevliDahi',
      'MatrixNeo', 'RetroDancer', 'DiskoYıldızı', 'HızlıParmak'
    ];

    this.init();
  }

  init() {
    this.initBackgroundCanvas();
    this.initProfile();
    this.initNetworkHooks();
    this.checkUrlForRoomCode();

    // Klavye dinleyicisi (Enter tuşu ile tahmin)
    const guessInput = document.getElementById('game-guess-input');
    if (guessInput) {
      guessInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.submitGuess();
        }
      });
    }

    const joinCodeInput = document.getElementById('join-code-input');
    if (joinCodeInput) {
      joinCodeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.submitJoinRoom();
        }
      });
    }
  }

  // --- CANLI BALATRO ARKA PLAN KANVASI ---
  initBackgroundCanvas() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = Math.ceil(window.innerWidth / 4);
      canvas.height = Math.ceil(window.innerHeight / 4);
    };
    resize();
    window.addEventListener('resize', resize);

    let time = 0;
    const render = () => {
      time += this.bgSpeed;
      const w = canvas.width;
      const h = canvas.height;
      const imgData = ctx.createImageData(w, h);
      const data = imgData.data;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const u = (x / w) * 2 - 1;
          const v = (y / h) * 2 - 1;

          const v1 = Math.sin(u * 3 + time);
          const v2 = Math.cos(v * 3 + time * 1.5);
          const v3 = Math.sin((u + v) * 3 + time * 0.8);
          const v4 = Math.sin(Math.sqrt(u * u + v * v) * 4 - time * 2);

          const value = Math.sin(v1 + v2 + v3 + v4);

          const r = Math.floor(140 + 115 * Math.sin(value * Math.PI));
          const g = Math.floor(10 + 45 * Math.cos(value * Math.PI));
          const b = Math.floor(125 + 130 * Math.cos(value * Math.PI + 1));

          const index = (y * w + x) * 4;
          data[index] = r;
          data[index + 1] = g;
          data[index + 2] = b;
          data[index + 3] = 255;
        }
      }

      ctx.putImageData(imgData, 0, 0);
      requestAnimationFrame(render);
    };
    render();
  }

  // --- PROFİL VE AVATAR YÖNETİMİ ---
  initProfile() {
    const savedName = localStorage.getItem('wh_nickname');
    const savedAvatar = localStorage.getItem('wh_avatar');

    const nameInput = document.getElementById('nickname-input');
    if (savedName && nameInput) {
      nameInput.value = savedName;
      network.localPlayer.name = savedName;
    } else {
      this.randomizeNickname();
    }

    if (savedAvatar) {
      this.selectedAvatar = savedAvatar;
      network.localPlayer.avatar = savedAvatar;
    }

    // Avatar carousel doldur
    const track = document.getElementById('avatar-track');
    if (track) {
      track.innerHTML = '';
      this.avatars.forEach(av => {
        const item = document.createElement('div');
        item.className = `avatar-item ${av === this.selectedAvatar ? 'selected' : ''}`;
        item.innerHTML = this.renderAvatarHTML(av);
        item.onclick = () => this.selectAvatar(av);
        track.appendChild(item);
      });
    }

    if (nameInput) {
      nameInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (val) {
          localStorage.setItem('wh_nickname', val);
          network.localPlayer.name = val;
        }
      });
    }
  }

  selectAvatar(av) {
    this.selectedAvatar = av;
    localStorage.setItem('wh_avatar', av);
    network.localPlayer.avatar = av;

    const track = document.getElementById('avatar-track');
    if (track) {
      Array.from(track.children).forEach((child, idx) => {
        child.classList.toggle('selected', this.avatars[idx] === av);
      });
    }

    sound.playTileFlip(2);
  }

  renderAvatarHTML(av) {
    if (av.includes('.jpg') || av.includes('.png')) {
      return `<img src="${av}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
    }
    return av;
  }

  scrollAvatars(dir) {
    const track = document.getElementById('avatar-track');
    if (!track) return;
    
    // Each item is ~75px wide with gap
    this.avatarScrollPos += dir * 150;
    
    // Bounds check
    const maxScroll = Math.max(0, track.scrollWidth - track.parentElement.clientWidth);
    if (this.avatarScrollPos < 0) this.avatarScrollPos = 0;
    if (this.avatarScrollPos > maxScroll) this.avatarScrollPos = maxScroll;

    gsap.to(track, { x: -this.avatarScrollPos, duration: 0.3, ease: 'power2.out' });
    sound.playTileFlip(0);
  }

  randomizeNickname() {
    const name = this.nicknameSuggestions[Math.floor(Math.random() * this.nicknameSuggestions.length)];
    const input = document.getElementById('nickname-input');
    if (input) {
      input.value = name;
      localStorage.setItem('wh_nickname', name);
      network.localPlayer.name = name;
      gsap.fromTo(input, { scale: 0.95 }, { scale: 1, duration: 0.2 });
    }
    sound.playTileFlip(1);
  }

  // --- EKRAN GEÇİŞLERİ ---
  showView(viewName) {
    const views = ['menu', 'create-room', 'join-room', 'lobby', 'game', 'victory'];
    views.forEach(v => {
      const el = document.getElementById(`view-${v}`);
      if (el) {
        if (v === viewName) {
          el.classList.add('active');
          gsap.fromTo(el, { opacity: 0, scale: 0.92, y: 15 }, { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'power2.out' });
        } else {
          el.classList.remove('active');
        }
      }
    });

    this.currentView = viewName;
    sound.playTileFlip(0);

    // Eğer oyun görünümüne geçildiyse inputa odaklan
    if (viewName === 'game') {
      setTimeout(() => {
        const input = document.getElementById('game-guess-input');
        if (input) input.focus();
      }, 400);
    }
  }

  // --- OYUN MODU BAŞLATMA ---
  startSinglePlayer() {
    this.syncPlayerProfile();
    const roomCode = network.startSinglePlayer(3, { rounds: 6, revealSpeed: 3 });
    this.showToast(`Tek Oyunculu mod başladı! Rakipler: Akıllı Botlar`);
    this.renderLobbyUI();
    this.showView('lobby');
  }

  submitCreateRoom() {
    this.syncPlayerProfile();
    const category = document.getElementById('room-category').value;
    const rounds = parseInt(document.getElementById('room-rounds').value) || 8;
    const revealSpeed = parseInt(document.getElementById('room-speed').value) || 3;

    const roomCode = network.createRoom({ category, rounds, revealSpeed });
    this.renderLobbyUI();
    this.showView('lobby');
    this.showToast(`Oda Kuruldu: ${roomCode}`);
  }

  submitJoinRoom() {
    this.syncPlayerProfile();
    const input = document.getElementById('join-code-input');
    const code = input ? input.value.trim().toUpperCase() : '';
    if (!code) {
      this.showToast('Lütfen bir oda kodu gir!');
      return;
    }

    network.joinRoom(code, network.localPlayer);
    this.renderLobbyUI();
    this.showView('lobby');
  }

  syncPlayerProfile() {
    const nameInput = document.getElementById('nickname-input');
    if (nameInput && nameInput.value.trim()) {
      network.localPlayer.name = nameInput.value.trim().toUpperCase();
    }
    network.localPlayer.avatar = this.selectedAvatar;
  }

  // --- LOBİ ARAYÜZÜNÜ ÇİZ ---
  renderLobbyUI() {
    const codeEl = document.getElementById('lobby-room-code');
    if (codeEl) codeEl.innerText = network.roomCode || 'WH-0000';

    const countEl = document.getElementById('lobby-player-count');
    if (countEl) countEl.innerText = network.players.length;

    const grid = document.getElementById('lobby-players-grid');
    if (grid) {
      grid.innerHTML = '';
      network.players.forEach(p => {
        const card = document.createElement('div');
        card.className = `player-lobby-card ${p.isHost ? 'is-host' : ''}`;
        card.innerHTML = `
          ${p.isHost ? '<span class="host-crown">👑</span>' : ''}
          <div class="player-lobby-avatar">${game.renderAvatarHTML(p.avatar)}</div>
          <div class="player-lobby-name">${p.name}</div>
          <span class="player-lobby-tag ${p.isReady ? 'ready' : ''}">${p.isBot ? '🤖 BOT' : (p.isHost ? 'ODA SAHİBİ' : 'HAZIR')}</span>
        `;
        grid.appendChild(card);
      });
    }

    // Alt butonlar
    const actions = document.getElementById('lobby-action-buttons');
    if (actions) {
      if (network.isHost) {
        actions.innerHTML = `
          <button class="action-btn btn-single" onclick="network.startGame()">
            <span>🎮</span>
            <span>OYUNU BAŞLAT</span>
          </button>
          <button class="action-btn" style="background:#21262d; border:1px solid #30363d;" onclick="game.showView('menu')">
            <span>Lobiden Ayrıl</span>
          </button>
        `;
      } else {
        actions.innerHTML = `
          <div style="font-size:14px; color:var(--accent-gold); font-weight:700; padding:12px;">
            ⏳ Oda sahibinin oyunu başlatması bekleniyor...
          </div>
          <button class="action-btn" style="background:#21262d; border:1px solid #30363d;" onclick="game.showView('menu')">
            <span>Lobiden Ayrıl</span>
          </button>
        `;
      }
    }
  }

  // --- NETWORK CALLBACK'LERİ ---
  initNetworkHooks() {
    network.onPlayerListUpdate = (players) => {
      this.renderLobbyUI();
      this.renderLeaderboard(players);
    };

    network.onGameStateUpdate = (type, data) => {
      if (type === 'PLAYING') {
        this.showView('game');
      } else if (type === 'NEW_ROUND') {
        this.setupNewRound(data);
      } else if (type === 'TIMER_TICK') {
        this.updateRoundTimer(data);
      }
    };

    network.onLetterRevealed = (index, letter, revealedLetters) => {
      this.revealLetterTile(index, letter, revealedLetters);
    };

    network.onCorrectGuess = (winner, word, points, players) => {
      this.handleCorrectGuessUI(winner, word, points, players);
    };

    network.onRoundTimeout = (word, players) => {
      this.handleRoundTimeoutUI(word, players);
    };

    network.onGameOver = (leaderboard) => {
      this.handleGameOverUI(leaderboard);
    };

    network.onReactionReceived = (emoji, player) => {
      this.spawnFloatingReaction(emoji);
      sound.playReaction();
    };

    network.onStatusMessage = (msg) => {
      this.showToast(msg);
    };
  }

  // --- OYUN TURU BAŞLANGICI ---
  setupNewRound(data) {
    const roundPill = document.getElementById('game-round-pill');
    if (roundPill) roundPill.innerText = `TUR ${data.round}/${data.totalRounds}`;

    const catPill = document.getElementById('game-category-pill');
    if (catPill) catPill.innerText = (data.category || 'GENEL').toUpperCase();

    const hintBanner = document.getElementById('word-hint-banner');
    if (hintBanner) {
      hintBanner.innerHTML = `İpucu: <span>${data.hint || 'Bu kelimeyi tahmin et!'}</span>`;
    }

    const timerPill = document.getElementById('game-timer-pill');
    if (timerPill) timerPill.innerText = `${data.timer}s`;

    // Kelime kartlarını çiz
    const container = document.getElementById('cards-container');
    if (container) {
      container.innerHTML = '';
      for (let i = 0; i < data.wordLength; i++) {
        const card = document.createElement('div');
        card.className = 'word-card';
        card.id = `card-${i}`;
        const letter = data.revealedLetters[i];
        if (letter) {
          card.classList.add('revealed');
          card.innerText = letter;
        } else {
          card.innerText = '?';
        }
        container.appendChild(card);
      }
    }

    // Inputu temizle ve odakla
    const guessInput = document.getElementById('game-guess-input');
    if (guessInput) {
      guessInput.value = '';
      guessInput.disabled = false;
      guessInput.focus();
    }

    this.updateFeverBar(network.localPlayer.streak || 0);
    this.renderLeaderboard(network.players);
    sound.playTileFlip(1);
  }

  // --- HARF AÇILMA ANİMASYONU ---
  revealLetterTile(index, letter, revealedLetters) {
    const card = document.getElementById(`card-${index}`);
    if (!card) return;

    card.innerText = letter;
    card.classList.add('revealed');

    if (network.localPlayer.streak >= 2) {
      card.classList.add('fever');
    }

    sound.playTileFlip(index);

    gsap.fromTo(card, 
      { scale: 0.3, rotateY: 180, y: -25 }, 
      { scale: 1, rotateY: 0, y: -4, duration: 0.45, ease: 'back.out(2)' }
    );
  }

  updateRoundTimer(data) {
    const timerPill = document.getElementById('game-timer-pill');
    if (timerPill) {
      timerPill.innerText = `${data.nextLetterIn}s`;
      if (data.nextLetterIn <= 1) {
        sound.playWarningTick();
        gsap.fromTo(timerPill, { scale: 1.2 }, { scale: 1, duration: 0.2 });
      } else {
        sound.playTick();
      }
    }
  }

  // --- DOĞRU TAHMİN KUTLAMASI ---
  handleCorrectGuessUI(winner, word, points, players) {
    const isMe = winner.id === network.localPlayer.id;

    // Kartların tamamını göster
    for (let i = 0; i < word.length; i++) {
      const card = document.getElementById(`card-${i}`);
      if (card) {
        card.innerText = word[i];
        card.classList.add('revealed');
        if (winner.streak >= 2) card.classList.add('fever');

        gsap.to(card, {
          y: -30,
          scale: 1.15,
          duration: 0.25,
          delay: i * 0.05,
          yoyo: true,
          repeat: 1
        });
      }
    }

    if (isMe) {
      sound.playCorrectGuess(winner.streak);
      this.showToast(`🔥 HARİKA! Kelimeyi bildin: +${points} Puan!`);
      this.triggerConfetti(0.4);
    } else {
      sound.playTileFlip(3);
      this.showToast(`🎯 ${winner.name} kelimeyi bildi! (${word})`);
    }

    if (winner.streak >= 2) {
      this.bgSpeed = 0.035;
      sound.playComboFever();
    }

    this.updateFeverBar(network.localPlayer.streak || 0);
    this.renderLeaderboard(players);
  }

  // --- TUR ZAMAN AŞIMI ---
  handleRoundTimeoutUI(word, players) {
    sound.playWrongGuess();
    this.showToast(`⏳ Süre Doldu! Kelime: ${word}`);

    for (let i = 0; i < word.length; i++) {
      const card = document.getElementById(`card-${i}`);
      if (card) {
        card.innerText = word[i];
        card.classList.add('revealed');
      }
    }

    this.bgSpeed = 0.016;
    this.updateFeverBar(0);
    this.renderLeaderboard(players);
  }

  // --- OYUN SONU VE ŞAMPİYONLUK KÜRSÜSÜ ---
  handleGameOverUI(leaderboard) {
    this.showView('victory');
    sound.playVictory();
    this.triggerConfetti(1.5);

    const podium = document.getElementById('podium-container');
    if (!podium) return;

    podium.innerHTML = '';
    const top3 = leaderboard.slice(0, 3);

    // Kürsü sıralaması: 2. sıra, 1. sıra, 3. sıra (Görsel hiyerarşi)
    const displayOrder = [
      top3[1] || null, // 2. sıra
      top3[0] || null, // 1. sıra
      top3[2] || null  // 3. sıra
    ];

    displayOrder.forEach((player, idx) => {
      if (!player) return;
      const rank = idx === 1 ? 1 : (idx === 0 ? 2 : 3);
      const slot = document.createElement('div');
      slot.className = 'podium-slot';
      slot.innerHTML = `
        <div class="podium-avatar">
          ${rank === 1 ? '<span class="podium-crown">👑</span>' : ''}
          ${game.renderAvatarHTML(player.avatar)}
        </div>
        <div class="podium-name">${player.name}</div>
        <div class="podium-pillar rank-${rank}">
          <span>#${rank}</span>
          <div class="podium-score">${player.score} P</div>
        </div>
      `;
      podium.appendChild(slot);

      gsap.fromTo(slot, 
        { y: 60, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.6, delay: idx * 0.2, ease: 'back.out(1.8)' }
      );
    });
  }

  playAgain() {
    if (network.isHost) {
      this.showView('lobby');
    } else {
      this.showView('menu');
    }
  }

  // --- TAHMİN GÖNDERME ---
  submitGuess() {
    const input = document.getElementById('game-guess-input');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;

    network.sendGuess(val);
    input.value = '';
    input.focus();
  }

  // --- REAKSİYON GÖNDERME & UÇURMA ---
  sendReaction(emoji) {
    network.sendReaction(emoji);
    this.spawnFloatingReaction(emoji);
    sound.playReaction();
  }

  spawnFloatingReaction(emoji) {
    const arena = document.getElementById('word-arena');
    if (!arena) return;

    const el = document.createElement('div');
    el.className = 'floating-reaction';
    el.innerText = emoji;

    // Rastgele yatay pozisyon
    const rect = arena.getBoundingClientRect();
    const x = rect.left + 50 + Math.random() * (rect.width - 100);
    const y = rect.bottom - 40;

    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    document.body.appendChild(el);

    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 2500);
  }

  // --- LİDERLİK TABLOSUNU ÇİZ ---
  renderLeaderboard(players) {
    const list = document.getElementById('game-leaderboard-list');
    if (!list) return;

    // Skora göre sırala
    const sorted = [...players].sort((a, b) => b.score - a.score);
    list.innerHTML = '';

    sorted.forEach((p, idx) => {
      const isMe = p.id === network.localPlayer.id;
      const rankClass = idx === 0 ? 'gold' : (idx === 1 ? 'silver' : (idx === 2 ? 'bronze' : ''));
      const item = document.createElement('div');
      item.className = `lb-player-item ${isMe ? 'is-me' : ''}`;
      item.innerHTML = `
        <div class="lb-left">
          <span class="lb-rank ${rankClass}">#${idx + 1}</span>
          <span class="lb-avatar">${game.renderAvatarHTML(p.avatar)}</span>
          <span class="lb-name" title="${p.name}">${p.name}</span>
        </div>
        <div class="lb-right">
          <span class="lb-score">${p.score}</span>
          <span class="lb-status">${p.status || ''}</span>
        </div>
      `;
      list.appendChild(item);
    });
  }

  // --- FEVER / COMBO GÖSTERGESİ ---
  updateFeverBar(streak) {
    const fill = document.getElementById('fever-meter-fill');
    const label = document.getElementById('fever-multiplier-tag');
    if (!fill || !label) return;

    let pct = 0;
    let text = 'DISCO 1.0X';

    if (streak === 1) {
      pct = 35;
      text = 'COMBO 1.2X';
    } else if (streak === 2) {
      pct = 70;
      text = 'FEVER 1.5X 🔥';
    } else if (streak >= 3) {
      pct = 100;
      text = `BALATRO ${streak >= 4 ? '2.5X' : '2.0X'} 🪩`;
    }

    fill.style.width = `${pct}%`;
    label.innerText = text;
  }

  // --- SES VE GÖRÜNTÜ AYARLARI ---
  toggleCRT() {
    this.isCrtEnabled = !this.isCrtEnabled;
    const overlay = document.getElementById('crt-overlay');
    const btn = document.getElementById('crt-btn');
    if (overlay) overlay.style.display = this.isCrtEnabled ? 'block' : 'none';
    if (btn) btn.innerText = this.isCrtEnabled ? '📺 CRT: AÇIK' : '📺 CRT: KAPALI';
  }

  toggleSFX() {
    this.isSfxEnabled = !sound.toggleMute();
    const btn = document.getElementById('sfx-btn');
    if (btn) btn.innerText = this.isSfxEnabled ? '🔊 SES: AÇIK' : '🔇 SES: KAPALI';
  }

  toggleMusic() {
    const isPlaying = sound.toggleMusic();
    const btn = document.getElementById('music-btn');
    if (btn) {
      btn.innerText = isPlaying ? '🎵 DISCO: AÇIK' : '🎵 DISCO: KAPALI';
      btn.classList.toggle('active', isPlaying);
    }
  }

  toggleHowToPlay() {
    const modal = document.getElementById('how-to-play-modal');
    if (modal) {
      modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
    }
  }

  // --- KOPYALAMA İŞLEMLERİ ---
  copyRoomCode() {
    if (!network.roomCode) return;
    navigator.clipboard.writeText(network.roomCode).then(() => {
      this.showToast(`Oda Kodu Kopyalandı: ${network.roomCode}`);
    });
  }

  copyRoomLink() {
    if (!network.roomCode) return;
    const url = new URL(window.location.href);
    url.searchParams.set('room', network.roomCode);
    navigator.clipboard.writeText(url.toString()).then(() => {
      this.showToast(`Davet Bağlantısı Kopyalandı!`);
    });
  }

  checkUrlForRoomCode() {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      const input = document.getElementById('join-code-input');
      if (input) input.value = room.toUpperCase();
      this.showView('join-room');
      this.showToast(`Davet bulundu: ${room}`);
    }
  }

  // --- YARDIMCI GÖRSEL EFEKTLER ---
  triggerConfetti(durationSeconds = 1.0) {
    if (typeof confetti !== 'function') return;
    const end = Date.now() + (durationSeconds * 1000);
    const interval = setInterval(() => {
      if (Date.now() > end) return clearInterval(interval);
      confetti({
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: { x: Math.random(), y: Math.random() - 0.2 }
      });
    }, 200);
  }

  showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.innerText = message;
    container.appendChild(toast);

    setTimeout(() => {
      gsap.to(toast, {
        opacity: 0,
        x: 60,
        duration: 0.3,
        onComplete: () => {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }
      });
    }, 3200);
  }
}

// Global oyun nesnesi
let game = null;
window.addEventListener('DOMContentLoaded', () => {
  game = new GameController();
});
