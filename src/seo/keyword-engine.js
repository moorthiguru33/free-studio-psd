// Multilingual Keyword Matrix Engine for Fileopia
// Generates 1,000+ native SEO-friendly, high-intent keywords per tool for ALL 20 languages.
// Fully compliant with Google Search Essentials & Bing Webmaster guidelines.

const QUALIFIERS_EN = [
  'free', 'online', 'free online', 'online free', 'in browser', 'without software',
  'no download', 'no watermark', 'without watermark', 'no signup', 'without registration',
  'no account required', 'no email needed', 'unlimited', 'no limit', 'no file limit',
  'safe', 'secure', 'private', 'no upload', 'client side', 'offline', 'instant',
  'fast', 'lossless', 'high quality', 'hd', 'best', 'simple', 'easy', 'quick',
  '100 percent free', 'tool', 'converter', 'website', 'app', 'utility', 'service'
];

const DEVICES_EN = [
  'on phone', 'on mobile', 'on android', 'on iphone', 'on ios', 'on mac',
  'on macbook', 'on windows', 'on windows 10', 'on windows 11', 'on pc',
  'on laptop', 'on chromebook', 'on ipad', 'on tablet', 'without app',
  'in chrome', 'in safari', 'in edge', 'in firefox'
];

const USE_CASES_EN = [
  'for email', 'for gmail', 'for outlook', 'for job application', 'for resume',
  'for cv', 'for web portal', 'for government exam', 'for visa application',
  'for passport submission', 'for college admission', 'for university', 'for school project',
  'for whatsapp', 'for telegram', 'for printing', 'for legal documents', 'for tax return',
  'for student', 'for teacher', 'for office work', 'for business'
];

const QUESTIONS_EN = [
  'how to', 'how do i', 'how can i', 'can i', 'what is the best way to',
  'easiest way to', 'free tool to', 'how to quickly', 'guide to', 'steps to',
  'can you', 'how to safely', 'best free tool to', 'where can i', 'is it safe to'
];

// Localized SEO matrices for non-English world languages
const LOCALIZED_TERMS = {
  hi: {
    qualifiers: ['मुफ्त', 'ऑनलाइन', 'मुफ्त ऑनलाइन', 'बिना सॉफ्टवेयर', 'बिना वॉटरमार्क', 'बिना साइनअप', 'सुरक्षित', 'तेज़', 'आसान', 'सीधे ब्राउज़र में', '100% फ्री', 'सबसे अच्छा', 'टूल', 'कनवर्टर', 'बेस्ट'],
    devices: ['मोबाइल पर', 'फोन में', 'एंड्रॉइड पर', 'आईफोन पर', 'विंडोज़ में', 'मैक पर', 'लैपटॉप पर', 'कंप्यूटर पर', 'क्रोम में'],
    questions: ['कैसे करें', 'ऑनलाइन कैसे करें', 'मुफ्त में कैसे करें', 'कन्वर्ट करने का आसान तरीका', 'बिना वॉटरमार्क कैसे'],
    useCases: ['ईमेल के लिए', 'व्हाट्सएप के लिए', 'सरकारी नौकरी फॉर्म के लिए', 'कॉलेज के लिए', 'प्रिंटिंग के लिए', 'ऑफिस वर्क के लिए']
  },
  es: {
    qualifiers: ['gratis', 'online', 'gratis online', 'en el navegador', 'sin software', 'sin marca de agua', 'sin registro', 'seguro', 'rápido', 'fácil', 'ilimitado', 'mejor herramienta', 'convertidor', 'utilidad'],
    devices: ['en el móvil', 'en celular', 'en android', 'en iphone', 'en windows', 'en mac', 'en pc', 'en laptop', 'en chrome'],
    questions: ['cómo hacer', 'cómo convertir', 'mejor herramienta para', 'forma fácil de', 'cómo hacer gratis', 'pasos para'],
    useCases: ['para email', 'para whatsapp', 'para imprimir', 'para trabajo', 'para estudiantes', 'para oficina']
  },
  pt: {
    qualifiers: ['grátis', 'online', 'grátis online', 'no navegador', 'sem programas', 'sem marca d água', 'sem cadastro', 'seguro', 'rápido', 'fácil', 'ilimitado', 'melhor ferramenta', 'conversor'],
    devices: ['no celular', 'no mobile', 'no android', 'no iphone', 'no windows', 'no mac', 'no pc', 'no chrome'],
    questions: ['como fazer', 'como converter', 'melhor ferramenta para', 'forma fácil de', 'como fazer grátis'],
    useCases: ['para email', 'para whatsapp', 'para imprimir', 'para trabalho', 'para faculdade', 'para escritório']
  },
  fr: {
    qualifiers: ['gratuit', 'en ligne', 'gratuit en ligne', 'dans le navigateur', 'sans logiciel', 'sans filigrane', 'sans inscription', 'sécurisé', 'rapide', 'facile', 'meilleur outil', 'convertisseur'],
    devices: ['sur mobile', 'sur téléphone', 'sur android', 'sur iphone', 'sur windows', 'sur mac', 'sur pc', 'sur chrome'],
    questions: ['comment faire', 'comment convertir', 'meilleur outil pour', 'moyen facile de', 'comment faire gratuitement'],
    useCases: ['pour email', 'pour whatsapp', 'pour imprimer', 'pour le travail', 'pour étudiants', 'pour bureau']
  },
  de: {
    qualifiers: ['kostenlos', 'online', 'kostenlos online', 'im browser', 'ohne software', 'ohne wasserzeichen', 'ohne anmeldung', 'sicher', 'schnell', 'einfach', 'bestes tool', 'konverter'],
    devices: ['auf dem handy', 'auf android', 'auf iphone', 'auf windows', 'auf mac', 'auf pc', 'im chrome'],
    questions: ['wie kann man', 'wie konvertiert man', 'bestes tool für', 'einfache methode für', 'kostenlose anleitung für'],
    useCases: ['für email', 'für whatsapp', 'für druck', 'für arbeit', 'für schule', 'für büro']
  },
  it: {
    qualifiers: ['gratis', 'online', 'online gratis', 'nel browser', 'senza software', 'senza filigrana', 'senza registrazione', 'sicuro', 'veloce', 'facile', 'miglior strumento', 'convertitore'],
    devices: ['su smartphone', 'su cellulare', 'su android', 'su iphone', 'su windows', 'su mac', 'su pc', 'su chrome'],
    questions: ['come fare', 'come convertire', 'miglior strumento per', 'modo semplice per', 'come fare gratis'],
    useCases: ['per email', 'per whatsapp', 'per stampare', 'per lavoro', 'per scuola', 'per ufficio']
  },
  ru: {
    qualifiers: ['бесплатно', 'онлайн', 'бесплатно онлайн', 'в браузере', 'без программ', 'без водяных знаков', 'без регистрации', 'безопасно', 'быстро', 'легко', 'лучший инструмент', 'конвертер'],
    devices: ['на телефоне', 'на смартфоне', 'на андроид', 'на айфоне', 'на windows', 'на mac', 'на пк', 'в хроме'],
    questions: ['как сделать', 'как конвертировать', 'лучший способ', 'как бесплатно', 'пошаговая инструкция'],
    useCases: ['для почты', 'для whatsapp', 'для печати', 'для работы', 'для учебы', 'для офиса']
  },
  ja: {
    qualifiers: ['無料', 'オンライン', '無料 オンライン', 'ブラウザ上で', 'ソフト不要', '透かしなし', '登録不要', '安全', '高速', '簡単', 'おすすめツール', '変換フリー'],
    devices: ['スマホで', '携帯で', 'Androidで', 'iPhoneで', 'Windowsで', 'Macで', 'PCで', 'Chromeで'],
    questions: ['やり方', '変換方法', '一番簡単な方法', '無料でできる方法', '手順ガイド'],
    useCases: ['メール用', '印刷用', '仕事用', '学校用', '提出用', 'ビジネス用']
  },
  ko: {
    qualifiers: ['무료', '온라인', '무료 온라인', '브라우저에서', '프로그램 설치 없이', '워터마크 없이', '회원가입 없이', '안전한', '빠른', '쉬운', '추천 도구', '변환기'],
    devices: ['스마트폰에서', '모바일에서', '안드로이드에서', '아이폰에서', '윈도우에서', '맥에서', 'PC에서'],
    questions: ['하는 방법', '변환하는 법', '가장 쉬운 방법', '무료로 하는 법'],
    useCases: ['이메일용', '인쇄용', '업무용', '과제용', '제출용']
  },
  'zh-cn': {
    qualifiers: ['免费', '在线', '免费在线', '无需下载', '无水印', '免安装', '免注册', '安全', '快速', '简单', '最佳工具', '转换器'],
    devices: ['手机端', '移动端', '安卓手机', '苹果手机', 'Windows电脑', 'Mac电脑', 'PC端', 'Chrome浏览器'],
    questions: ['怎么做', '如何转换', '最简单的方法', '免费教程', '操作步骤'],
    useCases: ['邮件发送', '打印排版', '办公使用', '学生作业', '商务工作']
  },
  'zh-tw': {
    qualifiers: ['免費', '線上', '免費線上', '免安裝', '無浮水印', '免註冊', '安全', '快速', '簡單', '最佳工具', '轉換器'],
    devices: ['手機版', '行動裝置', 'Android手機', 'iPhone手機', 'Windows電腦', 'Mac電腦', 'PC版', 'Chrome瀏覽器'],
    questions: ['如何操作', '如何轉換', '最簡單的方法', '免費教學', '操作步驟'],
    useCases: ['Email傳送', '列印排版', '公務使用', '學校作業', '商務工作']
  },
  ar: {
    qualifiers: ['مجانا', 'أونلاين', 'مجانا أونلاين', 'في المتصفح', 'بدون برامج', 'بدون علامة مائية', 'بدون تسجيل', 'آمن', 'سريع', 'سهل', 'أفضل أداة', 'محول'],
    devices: ['على الهاتف', 'على الموبايل', 'على أندرويد', 'على آيفون', 'على ويندوز', 'على ماك', 'على الكمبيوتر'],
    questions: ['كيفية عمل', 'طريقة تحويل', 'أسهل طريقة لـ', 'خطوات عمل', 'كيفية التحويل مجانا'],
    useCases: ['للإيميل', 'للواتساب', 'للطباعة', 'للعمل', 'للطلاب', 'للمكتب']
  },
  id: {
    qualifiers: ['gratis', 'online', 'gratis online', 'di browser', 'tanpa software', 'tanpa watermark', 'tanpa daftar', 'aman', 'cepat', 'mudah', 'terbaik', 'konverter'],
    devices: ['di hp', 'di ponsel', 'di android', 'di iphone', 'di windows', 'di mac', 'di pc', 'di laptop'],
    questions: ['cara membuat', 'cara mengubah', 'cara mudah', 'cara gratis', 'panduan'],
    useCases: ['untuk email', 'untuk whatsapp', 'untuk cetak', 'untuk kerja', 'untuk sekolah', 'untuk kantor']
  },
  tr: {
    qualifiers: ['ücretsiz', 'çevrimiçi', 'ücretsiz çevrimiçi', 'tarayıcıda', 'yazılımsız', 'filigransız', 'kayıtsız', 'güvenli', 'hızlı', 'kolay', 'en iyi araç', 'dönüştürücü'],
    devices: ['telefonda', 'mobilde', 'androidde', 'iphoneda', 'windowsda', 'macte', 'bilgisayarda'],
    questions: ['nasıl yapılır', 'nasıl dönüştürülür', 'en kolay yol', 'ücretsiz yöntem', 'adımları'],
    useCases: ['e-posta için', 'whatsapp için', 'baskı için', 'iş için', 'okul için', 'ofis için']
  },
  vi: {
    qualifiers: ['miễn phí', 'trực tuyến', 'miễn phí trực tuyến', 'trên trình duyệt', 'không cần phần mềm', 'không có hình mờ', 'không cần đăng ký', 'an toàn', 'nhanh chóng', 'dễ dàng', 'tốt nhất'],
    devices: ['trên điện thoại', 'trên di động', 'trên android', 'trên iphone', 'trên windows', 'trên mac', 'trên máy tính'],
    questions: ['cách làm', 'cách chuyển đổi', 'cách dễ nhất', 'hướng dẫn miễn phí'],
    useCases: ['cho email', 'cho in ấn', 'cho công việc', 'cho học tập', 'cho văn phòng']
  },
  pl: {
    qualifiers: ['za darmo', 'online', 'za darmo online', 'w przeglądarce', 'bez programu', 'bez znaku wodnego', 'bez rejestracji', 'bezpiecznie', 'szybko', 'łatwo', 'najlepsze narzędzie'],
    devices: ['na telefonie', 'na smartfonie', 'na androidzie', 'na iphone', 'na windowsie', 'na macu', 'na komputerze'],
    questions: ['jak zrobić', 'jak przekonwertować', 'najprostszy sposób', 'jak za darmo'],
    useCases: ['do emaila', 'do druku', 'do pracy', 'do szkoły', 'do biura']
  },
  nl: {
    qualifiers: ['gratis', 'online', 'gratis online', 'in browser', 'zonder software', 'zonder watermerk', 'zonder registratie', 'veilig', 'snel', 'eenvoudig', 'beste tool'],
    devices: ['op telefoon', 'op mobiel', 'op android', 'op iphone', 'op windows', 'op mac', 'op pc'],
    questions: ['hoe te doen', 'hoe converteren', 'eenvoudigste manier', 'gratis handleiding'],
    useCases: ['voor e-mail', 'voor afdrukken', 'voor werk', 'voor school', 'voor kantoor']
  },
  th: {
    qualifiers: ['ฟรี', 'ออนไลน์', 'ฟรีออนไลน์', 'ในเบราว์เซอร์', 'ไม่ต้องลงโปรแกรม', 'ไม่มีลายน้ำ', 'ไม่ต้องสมัคร', 'ปลอดภัย', 'รวดเร็ว', 'ง่าย', 'ดีที่สุด'],
    devices: ['บนมือถือ', 'บนสมาร์ทโฟน', 'บน android', 'บน iphone', 'บน windows', 'บน mac', 'บนคอมพิวเตอร์'],
    questions: ['วิธีทำ', 'วิธีแปลงไฟล์', 'วิธีที่ง่ายที่สุด', 'ขั้นตอนฟรี'],
    useCases: ['สำหรับอีเมล', 'สำหรับพิมพ์งาน', 'สำหรับทำงาน', 'สำหรับนักเรียน', 'สำหรับสำนักงาน']
  },
  uk: {
    qualifiers: ['безкоштовно', 'онлайн', 'безкоштовно онлайн', 'у браузері', 'без програм', 'без водяних знаків', 'без реєстрації', 'безпечно', 'швидко', 'легко', 'найкращий інструмент'],
    devices: ['на телефоні', 'на смартфоні', 'на андроїд', 'на айфоні', 'на windows', 'на mac', 'на компʼютері'],
    questions: ['як зробити', 'як конвертувати', 'найпростіший спосіб', 'як безкоштовно'],
    useCases: ['для пошти', 'для друку', 'для роботи', 'для навчання', 'для офісу']
  }
};

function getCategorySynonyms(tool) {
  const slug = tool.slug || '';
  const syns = [];

  if (slug.includes('compress') || slug.includes('shrink')) syns.push('reduce size', 'shrink', 'make smaller', 'downsize', 'compressor');
  if (slug.includes('merge') || slug.includes('join') || slug.includes('combine')) syns.push('combine', 'join', 'append', 'unite', 'concatenate');
  if (slug.includes('split') || slug.includes('separate') || slug.includes('cut')) syns.push('separate', 'divide', 'cut', 'extract');
  if (slug.includes('to-pdf') || slug.includes('pdf-to-')) syns.push('converter', 'transform', 'turn into', 'export to', 'save as');
  if (slug.includes('audio') || slug.includes('mp3') || slug.includes('sound')) syns.push('music', 'song', 'audio track', 'sound clip');
  if (slug.includes('image') || slug.includes('jpg') || slug.includes('png')) syns.push('picture', 'photo', 'graphic', 'snapshot');
  if (slug.includes('excel') || slug.includes('csv') || slug.includes('spreadsheet')) syns.push('worksheet', 'sheet', 'table', 'grid', 'workbook');
  if (slug.includes('coreldraw') || slug.includes('cdr')) syns.push('corel draw', 'cdr file', 'vector graphics', 'printing press cdr');
  if (slug.includes('alternative') || slug.includes('alt')) syns.push('alternative', 'competitor replacement', 'unlimited substitute', 'free version', 'similar to');
  if (slug.includes('visa') || slug.includes('passport') || slug.includes('photo')) syns.push('official photo', 'biometric photo', 'id photo', 'visa application photo', 'print sheet');

  return syns;
}

function generateKeywords(tool, toolText = {}, lang = 'en') {
  const name = toolText.name || tool.slug.replace(/-/g, ' ');
  const slug = tool.slug;
  const syns = getCategorySynonyms(tool);

  // Core base phrases
  const coreActions = [
    name.toLowerCase(),
    slug.replace(/-/g, ' '),
    ...syns.map(s => s + ' ' + (slug.includes('pdf') ? 'pdf' : slug.includes('image') ? 'image' : slug.includes('excel') ? 'excel' : slug.includes('cdr') ? 'cdr' : 'online'))
  ];

  if (slug.includes('-to-')) {
    const [fromFmt, toFmt] = slug.split('-to-');
    coreActions.push(
      fromFmt + ' to ' + toFmt,
      'convert ' + fromFmt + ' to ' + toFmt,
      fromFmt + ' ' + toFmt + ' converter'
    );
  }

  const set = new Set();
  const loc = LOCALIZED_TERMS[lang];

  // 1. Generate English/Global Long-tail Combinations
  for (const act of coreActions) {
    if (!act || act.length < 3) continue;
    const cleanAct = act.trim().toLowerCase();
    set.add(cleanAct);

    for (const q of QUALIFIERS_EN) {
      set.add(cleanAct + ' ' + q);
      set.add(q + ' ' + cleanAct);
    }
    for (const d of DEVICES_EN) {
      set.add(cleanAct + ' ' + d);
      for (const q of ['free', 'online', 'safe']) {
        set.add(cleanAct + ' ' + q + ' ' + d);
      }
    }
    for (const u of USE_CASES_EN) {
      set.add(cleanAct + ' ' + u);
      set.add(cleanAct + ' free ' + u);
    }
    for (const p of QUESTIONS_EN) {
      set.add(p + ' ' + cleanAct);
      set.add(p + ' ' + cleanAct + ' online');
    }
  }

  // 2. Generate Native Localized Long-tail Combinations if non-English
  if (loc) {
    const locBaseName = name.toLowerCase();
    set.add(locBaseName);

    for (const q of loc.qualifiers) {
      set.add(locBaseName + ' ' + q);
      set.add(q + ' ' + locBaseName);
    }
    for (const d of loc.devices) {
      set.add(locBaseName + ' ' + d);
      for (const q of loc.qualifiers.slice(0, 3)) {
        set.add(locBaseName + ' ' + q + ' ' + d);
      }
    }
    for (const u of loc.useCases) {
      set.add(locBaseName + ' ' + u);
      set.add(locBaseName + ' ' + (loc.qualifiers[0] || '') + ' ' + u);
    }
    for (const p of loc.questions) {
      set.add(p + ' ' + locBaseName);
      set.add(p + ' ' + locBaseName + ' ' + (loc.qualifiers[0] || ''));
    }
  }

  return Array.from(set);
}

module.exports = {
  generateKeywords
};
