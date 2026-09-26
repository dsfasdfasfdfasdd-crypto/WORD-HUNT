# 🪩 Word Hunt .IO - Çok Oyunculu Kelime Savaşı

Modern, Balatro & Cyberpunk Disco Synthwave temalı, gerçek zamanlı çok oyunculu kelime bulmaca oyunu.

---

## 🚀 Öne Çıkan Özellikler

1. **Çok Oyunculu (Online Multiplayer)**:
   - **Oda Kurma (Create Room)**: 6 haneli özel oda kodu üretir (örn: `WH-7A92`).
   - **Kod İle Katılma (Join Room)**: Arkadaşının verdiği kodu girerek veya tek tıkla paylaşılabilir davet linkiyle (`?room=WH-XXXX`) anında aynı odaya bağlanma.
   - **WebRTC / PeerJS Motoru**: Sunucu maliyeti olmadan doğrudan tarayıcılar arası gerçek zamanlı veri senkronizasyonu.
2. **Tek Oyunculu (Singleplayer / Solo)**:
   - Gerçekçi tepki sürelerine, değişken zeka seviyelerine ve eğlenceli emojilere sahip **akıllı yapay zeka botları** (Kaan, Zeynep, PikselBot, vb.).
3. **.IO Oyun Seviyesinde Canlı Arayüz & Görseller**:
   - Balatro tarzı 3D gölgeli kartlar, harf açılma ve kart takla animasyonları.
   - Gerçek zamanlı **Canlı Liderlik Tablosu** (Skorlar, durumlar, 🥇, 🥈, 🥉 madalyaları).
   - **Disco Fever Kombo Çarpanı** (1.5x, 2.0x, 2.5x Balatro Ateşi).
   - **Uçan Emoji Reaksiyonları** (Herkesin ekranında yükselen yüzen emojiler).
   - Maç sonu **3 Boyutlu Şampiyonluk Kürsüsü** ve konfeti yağmuru.
4. **16-Bit Synthwave Disco Müzik & Ses Motoru**:
   - Web Audio API ile sıfır harici dosya bağımlılığı; bas, kick, snare, hi-hat ve synth akorları üreten canlı müzik ve retro ses efektleri.
5. **Kapsamlı Türkçe Kelime Haznesi**:
   - Genel, Teknoloji & Yazılım, Popüler Sinema & Oyun, Hayvanlar & Doğa, Yemekler ve Hızlı Kelimeler olmak üzere 6 farklı temada ipuçlarıyla hazırlanmış zengin kelime veritabanı.

---

## 📁 Proje Dosya Yapısı

```
word-hunt-io/
│
├── index.html            # Ana HTML ve tüm arayüz ekranları
├── style.css             # Cyberpunk/Balatro .io tasarım sistemi
├── vercel.json           # Vercel statik dağıtım konfigürasyonu
├── package.json          # Yerel geliştirme ve paket bilgisi
│
└── js/
    ├── words.js          # Türkçe kelime ve ipucu veritabanı
    ├── audio.js          # Web Audio synthwave disco & retro ses efektleri
    ├── network.js        # PeerJS P2P oda kurma, katılma ve bot yöneticisi
    └── game.js           # Ana oyun döngüsü, animasyonlar ve kontroller
```

---

## 🌐 GitHub & Vercel Dağıtımı (Deployment)

Bu proje sıfır harici derleme adımı gerektirir; %100 statik ve WebRTC tabanlı olduğu için **Vercel, Netlify veya GitHub Pages** üzerinde ücretsiz ve anında çalışır.

### Vercel ile 1-Tık Dağıtım:
1. Projeyi bir GitHub deposuna yükleyin (`git push`).
2. [vercel.com](https://vercel.com) adresine gidin.
3. GitHub deponuzu seçip **Deploy** butonuna basın.
4. Oyununuz tüm dünyadaki arkadaşlarınızla anında canlı link üzerinden oynanabilir!
