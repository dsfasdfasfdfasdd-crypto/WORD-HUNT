// ========================================================
// WORD HUNT .IO - KELİME VERİTABANI
// ========================================================

const WORD_DATABASE = {
  genel: [
    { word: "LABİRENT", hint: "Çıkışı zor olan karmaşık yollar bütünü" },
    { word: "PUSULA", hint: "Yön bulmaya yarayan manyetik araç" },
    { word: "KORSAN", hint: "Denizlerde yağma yapan haydut" },
    { word: "VOLKAN", hint: "Lav püskürten yanardağ" },
    { word: "KASIRGA", hint: "Çok şiddetli dönen rüzgâr fırtınası" },
    { word: "HAZİNE", hint: "Gömülü veya saklı değerli altın ve mücevherler" },
    { word: "PIRLANTA", hint: "En sert ve parlak değerli taş" },
    { word: "ASTRONOT", hint: "Uzay araştırmaları için uzaya giden kişi" },
    { word: "EFSANE", hint: "Dilden dile dolaşan olağanüstü hikaye" },
    { word: "MEŞALE", hint: "Ucu alevli aydınlatma sopası" },
    { word: "GÖKKUŞAĞI", hint: "Yağmur sonrası gökyüzünde beliren 7 renkli yay" },
    { word: "PİRAMİT", hint: "Eski Mısır krallarının anıt mezarları" },
    { word: "TELESKOP", hint: "Uzak yıldızları ve gök cisimlerini inceleyen araç" },
    { word: "ŞELALE", hint: "Yüksekten dökülen büyük su akıntısı" },
    { word: "MUCİZE", hint: "İnsan aklının açıklamakta zorlandığı harika olay" },
    { word: "MİMARİ", hint: "Yapı ve binaları tasarlama sanatı" },
    { word: "OKYANUS", hint: "Kıtaları ayıran devasa tuzlu su kütlesi" }
  ],
  teknoloji: [
    { word: "ALGORİTMA", hint: "Bir problemi çözmek için izlenen adımlar bütünü" },
    { word: "YAZILIM", hint: "Bilgisayarı çalıştıran program ve kodlar" },
    { word: "VERİTABANI", hint: "Bilgilerin düzenli saklandığı dijital sistem" },
    { word: "İNTERNET", hint: "Dünya çapındaki dev bilgisayar ağı" },
    { word: "SUNUCU", hint: "Ağ üzerindeki diğer cihazlara hizmet veren ana bilgisayar" },
    { word: "PİKSEL", hint: "Dijital ekrandaki en küçük renkli nokta" },
    { word: "ROBOTİK", hint: "Otomatik makineler ve yapay zeka bilimi" },
    { word: "KODLAMA", hint: "Bilgisayara komut yazma eylemi" },
    { word: "KLAVYE", hint: "Tuşlarla yazı yazmaya yarayan donanım" },
    { word: "MONİTÖR", hint: "Görüntü aktaran ekran donanımı" },
    { word: "GÜVENLİK", hint: "Siber saldırılara karşı koruma kalkanı" },
    { word: "KULAKLIK", hint: "Sesi sadece dinleyene ileten ses aygıtı" },
    { word: "GRAFİK", hint: "Görsel çizim ve oyun render bileşenleri" },
    { word: "BATARYA", hint: "Taşınabilir cihazların kimyasal enerji deposu" }
  ],
  populer: [
    { word: "BALATRO", hint: "Poker kartları ve jokerlerle oynanan roguelike hit" },
    { word: "SİNEMA", hint: "Beyaz perdeye yansıtılan film sanatı" },
    { word: "KONSOL", hint: "Televizyona bağlanan özel oyun cihazı" },
    { word: "MATRİX", hint: "Gerçekliğin bir simülasyon olduğunu anlatan kült film" },
    { word: "KARAKTER", hint: "Film veya oyundaki canlandırılan kişi" },
    { word: "SENARYO", hint: "Bir filmin yazılı kurgu ve diyalog metni" },
    { word: "JOYSTİCK", hint: "Oyunlarda yön kontrolü sağlayan kol" },
    { word: "ARCADE", hint: "Jetonla çalışan nostaljik atari salonu oyunları" },
    { word: "SÜPERKAHRAMAN", hint: "Özel güçleriyle dünyayı kurtaran çizgi roman figürü" },
    { word: "DİSKOTEK", hint: "Dans edilen neon ışıklı nostaljik kulüp" },
    { word: "FESTİVAL", hint: "Müzik ve eğlence dolu büyük kutlama etkinliği" }
  ],
  hayvanlar: [
    { word: "PENGUEN", hint: "Kutup soğuklarında yaşayan, uçamayan sevimli kuş" },
    { word: "TİMSAH", hint: "Nehirlerde pusu kuran zırhlı dev sürüngen" },
    { word: "JAGUAR", hint: "Güney Amerika'nın güçlü benekli yırtıcı kedisi" },
    { word: "KARTAL", hint: "Keskin gözlü, göklerin avcı hükümdarı" },
    { word: "BUKALEMUN", hint: "Bulunduğu ortama göre renk değiştiren kertenkele" },
    { word: "KANGURU", hint: "Yavrularını kesesinde taşıyan zıplayan Avustralya memelisi" },
    { word: "YUNUS", hint: "Denizlerin en zeki ve dost canlısı memelisi" },
    { word: "AHTAPOT", hint: "Sekiz kollu, mürekkep püskürten deniz canlısı" },
    { word: "LEOPAR", hint: "Ağaçlara tırmanabilen hızlı benekli büyük kedi" },
    { word: "PELİKAN", hint: "Gagasının altında dev balık kesesi olan su kuşu" }
  ],
  yemek: [
    { word: "LAHMACUN", hint: "İnce çıtır hamur üzerine kıymalı harçla fırınlanan lezzet" },
    { word: "BAKLAVA", hint: "Fıstıklı ya da cevizli kırk kat şerbetli tatlı" },
    { word: "DONDURMA", hint: "Yaz günlerinin serinletici külahlı lezzeti" },
    { word: "KÜNEFE", hint: "Peynirli, tel kadayıflı, sıcak sıcak yenen tatlı" },
    { word: "MAKARNA", hint: "İtalyan mutfağının vazgeçilmez soslu yemeği" },
    { word: "ÇİKOLATA", hint: "Kakaodan yapılan dünyanın en popüler tatlısı" },
    { word: "MENEMEN", hint: "Domates, biber ve yumurtayla yapılan kahvaltı klasiği" },
    { word: "İSKENDER", hint: "Pide üstüne döner, tereyağı ve yoğurtlu ziyafet" },
    { word: "KOKTEYL", hint: "Farklı aromalı içeceklerin karışımı" }
  ],
  kisa: [
    { word: "DANS", hint: "Müzik ritmine göre yapılan vücut hareketleri" },
    { word: "DİSKO", hint: "Ayna küreli, neon ışıklı dans mekanı" },
    { word: "ATEŞ", hint: "Isı ve ışık veren kızıl alev" },
    { word: "SKOR", hint: "Oyunda kazanılan toplam puan" },
    { word: "ZEKA", hint: "Akıl yürütme ve kavrama yeteneği" },
    { word: "PARI", hint: "Işıldama, parlama hali" },
    { word: "KART", hint: "Oyunlarda kullanılan destedeki parça" },
    { word: "ROKET", hint: "Uzaya fırlatılan itici araç" },
    { word: "YILDIZ", hint: "Geceleri gökte parıldayan gök cismi" }
  ]
};

// Belirli kategoriye veya karışık listeye göre kelime seçimi
function getRandomWord(category = 'genel', excludedWords = []) {
  let pool = [];
  if (category === 'all' || !WORD_DATABASE[category]) {
    // Tüm kategorileri birleştir
    Object.keys(WORD_DATABASE).forEach(cat => {
      pool = pool.concat(WORD_DATABASE[cat].map(item => ({ ...item, category: cat })));
    });
  } else {
    pool = WORD_DATABASE[category].map(item => ({ ...item, category }));
  }

  // Henüz sorulmamış kelimeleri filtrele
  const available = pool.filter(item => !excludedWords.includes(item.word));
  const selectionList = available.length > 0 ? available : pool;
  
  const chosen = selectionList[Math.floor(Math.random() * selectionList.length)];
  return chosen;
}

// Türkçe karakter uyumlu büyük harfe çevirme
function toTurkishUpper(str) {
  if (!str) return '';
  return str.toLocaleUpperCase('tr-TR').trim();
}
