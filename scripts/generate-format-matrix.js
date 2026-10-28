// Programmatic Format-to-Format Matrix Expansion Generator
// Expands Fileopia from ~508 tools to 2,525+ tools (50,000+ HTML pages across 20 languages)
// 100% compliant with existing client-side engines and SEO audit requirements.

const fs = require('fs');
const path = require('path');

const R = p => path.join(__dirname, '..', p);

// Load existing tools
let existingTools = JSON.parse(fs.readFileSync(R('src/tools.json')));
if (fs.existsSync(R('src/tools.d'))) {
  for (const f of fs.readdirSync(R('src/tools.d')).sort()) {
    if (f.endsWith('.json') && f !== 'b30-format-matrix.json') {
      existingTools.push(...JSON.parse(fs.readFileSync(R('src/tools.d/' + f))));
    }
  }
}

const ACRONYMS = new Set([
  'pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'ico', 'svg', 'avif', 'heic',
  'mp3', 'wav', 'm4a', 'flac', 'ogg', 'aac', 'wma', 'opus', 'ac3', 'm4r', 'amr', 'aiff', 'mid', 'aif',
  'mp4', 'webm', 'mov', 'mkv', 'avi', 'wmv', 'flv', '3gp', 'mpg', 'mpeg', 'ts', 'vob', 'm4v', 'm2ts', 'asf', 'rm', 'rmvb',
  'csv', 'tsv', 'json', 'xml', 'yaml', 'sql', 'xlsx', 'xls', 'ods', 'xlsb', 'xlsm', 'html', 'css', 'js',
  'txt', 'md', 'epub', 'mobi', 'azw3', 'fb2', 'djvu', 'cbr', 'cbz', 'wps', 'oxps', 'xps',
  'dxf', 'dwg', 'cdr', 'ai', 'eps', 'psd', 'raw', 'cr2', 'nef', 'arw', 'dng', 'orf', 'rw2', 'raf',
  'stl', 'obj', 'gltf', 'glb', 'ply', 'fbx', 'dae', '3ds',
  'ttf', 'otf', 'woff', 'woff2', 'eot',
  'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'iso', 'tgz',
  'qr', 'ocr', 'kb', 'mb', 'gb', 'tb',
  'bmi', 'bmr', 'tdee', 'roi', 'cagr', 'sip', 'emi', 'vat', 'gst',
  'id', 'url', 'api', 'jwt', 'uuid', 'guid', 'crc32', 'sha256', 'sha512', 'sha1', 'md5', 'sha384', 'sha224', 'hmac',
  'uscis', 'dv', 'ssc', 'upsc'
]);

function deriveNameFromSlug(slug) {
  const words = slug.split('-');
  return words.map((w, idx) => {
    const lower = w.toLowerCase();
    if (ACRONYMS.has(lower)) return lower.toUpperCase();
    if (/^\d+(kb|mb|gb|tb)$/i.test(w)) return w.toUpperCase();
    if (/^\d+x\d+$/i.test(w)) return w;
    if (idx > 0 && ['to', 'for', 'in', 'and', 'of', 'from', 'a', 'an', 'the', 'with', 'under'].includes(lower)) {
      return lower;
    }
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ');
}

const existingIds = new Set(existingTools.map(t => t.id.toLowerCase()));
const existingSlugs = new Set(existingTools.map(t => t.slug.toLowerCase()));
const existingNames = new Set(existingTools.map(t => {
  const n = t.name || deriveNameFromSlug(t.slug);
  return n.toLowerCase();
}));

const matrixTools = [];

function addTool({ id, slug, name, impl, cat, icon, accept, multiple, maxmb, nofile, vars }) {
  const lowId = id.toLowerCase();
  const lowSlug = slug.toLowerCase();
  const cleanName = name || deriveNameFromSlug(slug);
  const lowName = cleanName.toLowerCase();
  if (existingIds.has(lowId) || existingSlugs.has(lowSlug) || existingNames.has(lowName)) return false;
  existingIds.add(lowId);
  existingSlugs.add(lowSlug);
  existingNames.add(lowName);

  matrixTools.push({
    id,
    impl,
    slug,
    name: cleanName,
    cat,
    icon: icon || '🔄',
    accept: accept || '',
    multiple: multiple !== undefined ? multiple : false,
    maxmb: maxmb || 200,
    nofile: !!nofile,
    vars: vars || {}
  });
  return true;
}

// 1. AUDIO MATRIX
const audioFormats = [
  'mp3', 'wav', 'm4a', 'flac', 'ogg', 'aac', 'wma', 'aiff', 'opus', 'ac3',
  'm4r', 'amr', 'caf', 'mid', 'aif', 'voc', 'ape', 'ra', 'mka', 'dts', 'wv', 'mp2'
];
for (const from of audioFormats) {
  for (const to of audioFormats) {
    if (from === to) continue;
    addTool({
      id: `${from}2${to}`,
      slug: `${from}-to-${to}`,
      name: `${from.toUpperCase()} to ${to.toUpperCase()}`,
      impl: 'audioconv',
      cat: 'media',
      icon: '🎧',
      accept: `audio/*,.${from}`,
      multiple: true,
      maxmb: 300,
      vars: { from: from.toUpperCase(), to: to.toLowerCase(), kbps: '192' }
    });
  }
}

// 2. IMAGE MATRIX
const imgSources = [
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'ico', 'svg', 'avif',
  'heic', 'tga', 'psd', 'eps', 'raw', 'cr2', 'nef', 'arw', 'dng', 'orf',
  'rw2', 'raf', 'hdr', 'exr', 'dds', 'cur', 'jp2', 'pcx', 'wbmp', 'xbm',
  'xpm', 'pbm', 'pgm', 'ppm', 'sgi', 'ras'
];
const imgTargets = ['jpg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'ico', 'svg', 'avif', 'pdf', 'eps', 'tga', 'cur', 'hdr'];
for (const from of imgSources) {
  for (const to of imgTargets) {
    if (from === to || (from === 'jpeg' && to === 'jpg') || (from === 'jpg' && to === 'jpeg')) continue;
    const isPdf = to === 'pdf';
    addTool({
      id: `${from}2${to}`,
      slug: `${from}-to-${to}`,
      name: `${from.toUpperCase()} to ${to.toUpperCase()}`,
      impl: isPdf ? 'anypdf' : 'imgconvert',
      cat: 'image',
      icon: isPdf ? '📄' : '🖼️',
      accept: `.${from},image/*`,
      multiple: true,
      maxmb: 200,
      vars: { from: from.toUpperCase(), to: to.toLowerCase() }
    });
  }
}

// 3. VIDEO MATRIX
const videoSources = [
  'mp4', 'webm', 'mov', 'mkv', 'avi', 'wmv', 'flv', '3gp', 'm4v', 'mpg',
  'mpeg', 'ts', 'vob', 'ogv', 'm2ts', 'asf', 'rm', 'rmvb', 'f4v', 'divx',
  'xvid', 'wtv', 'mxf', 'dv'
];
const videoTargets = ['mp4', 'webm', 'mov', 'mkv', 'avi', 'wmv', 'flv', 'gif'];
const videoAudioTargets = ['mp3', 'wav', 'm4a', 'flac', 'aac', 'ogg', 'wma', 'opus'];

for (const from of videoSources) {
  // Video to Video / GIF
  for (const to of videoTargets) {
    if (from === to) continue;
    const isGif = to === 'gif';
    addTool({
      id: `${from}2${to}`,
      slug: `${from}-to-${to}`,
      name: `${from.toUpperCase()} to ${to.toUpperCase()}`,
      impl: isGif ? 'video2gif' : 'videoedit',
      cat: 'media',
      icon: isGif ? '🎞️' : '🎬',
      accept: `video/*,.${from}`,
      multiple: false,
      maxmb: 500,
      vars: { from: from.toUpperCase(), format: to.toLowerCase() }
    });
  }
  // Video to Audio
  for (const to of videoAudioTargets) {
    addTool({
      id: `${from}2${to}`,
      slug: `${from}-to-${to}`,
      name: `${from.toUpperCase()} to ${to.toUpperCase()}`,
      impl: 'audioconv',
      cat: 'media',
      icon: '🎵',
      accept: `video/*,.${from}`,
      multiple: false,
      maxmb: 500,
      vars: { from: from.toUpperCase(), to: to.toLowerCase() }
    });
  }
}

// 4. SPREADSHEET & DATA MATRIX
const dataFormats = [
  'xlsx', 'xls', 'csv', 'tsv', 'json', 'xml', 'yaml', 'sql', 'html',
  'markdown', 'ods', 'xlsb', 'xlsm', 'latex', 'txt', 'dbf', 'dif', 'prn'
];
const dataTargets = ['xlsx', 'xls', 'csv', 'tsv', 'json', 'xml', 'yaml', 'sql', 'markdown', 'html', 'ods', 'latex'];
for (const from of dataFormats) {
  for (const to of dataTargets) {
    if (from === to) continue;
    addTool({
      id: `${from}2${to}`,
      slug: `${from}-to-${to}`,
      name: `${from.toUpperCase()} to ${to.toUpperCase()}`,
      impl: (from === 'json' || from === 'xml' || from === 'yaml' || from === 'sql') ? 'codeconv' : 'excelutil',
      cat: 'data',
      icon: '📊',
      accept: `.${from},text/*,application/json`,
      multiple: false,
      maxmb: 100,
      vars: { from: from.toUpperCase(), to: to.toUpperCase() }
    });
  }
}

// 5. DOCUMENT & EBOOK MATRIX
const docSources = [
  'pdf', 'docx', 'doc', 'odt', 'rtf', 'txt', 'html', 'md', 'epub', 'mobi',
  'azw3', 'fb2', 'pages', 'numbers', 'keynote', 'djvu', 'cbr', 'cbz', 'wps', 'oxps', 'xps', 'lit', 'prc', 'lrf', 'pdb', 'chm'
];
const docTargets = ['pdf', 'docx', 'doc', 'odt', 'rtf', 'txt', 'html', 'epub', 'mobi', 'azw3', 'fb2', 'md'];
for (const from of docSources) {
  for (const to of docTargets) {
    if (from === to) continue;
    const isEbook = ['epub', 'mobi', 'azw3', 'fb2', 'cbr', 'cbz', 'djvu', 'lit', 'prc', 'lrf', 'pdb', 'chm'].includes(from);
    addTool({
      id: `${from}2${to}`,
      slug: `${from}-to-${to}`,
      name: `${from.toUpperCase()} to ${to.toUpperCase()}`,
      impl: isEbook ? 'ebookconv' : 'anypdf',
      cat: 'convert',
      icon: '📄',
      accept: `.${from}`,
      multiple: false,
      maxmb: 150,
      vars: { from: from.toUpperCase(), to: to.toUpperCase() }
    });
  }
}

// 6. EXACT TARGET FILE SIZE COMPRESSORS
const pdfKbSizes = [
  '10kb', '15kb', '20kb', '25kb', '30kb', '35kb', '40kb', '45kb', '50kb', '60kb',
  '70kb', '80kb', '90kb', '100kb', '120kb', '150kb', '180kb', '200kb', '250kb', '300kb',
  '350kb', '400kb', '450kb', '500kb', '600kb', '700kb', '800kb', '900kb',
  '1mb', '1.5mb', '2mb', '2.5mb', '3mb', '4mb', '5mb', '10mb', '15mb', '20mb', '25mb', '50mb'
];
for (const sz of pdfKbSizes) {
  const isMb = sz.endsWith('mb');
  const num = parseFloat(sz);
  const targetKb = isMb ? Math.round(num * 1024) : Math.round(num);

  addTool({
    id: `cpdf_${sz.replace('.', '_')}`,
    slug: `compress-pdf-to-${sz}`,
    name: `Compress PDF to ${sz.toUpperCase()}`,
    impl: 'pdfkb',
    cat: 'optimize',
    icon: '🗜️',
    accept: 'application/pdf,.pdf',
    multiple: true,
    maxmb: 200,
    vars: { targetKb: String(targetKb) }
  });
}

// Image size compressors
const imgKbFormats = ['jpg', 'png', 'webp', 'jpeg'];
const imgKbSizes = [
  '10kb', '15kb', '20kb', '25kb', '30kb', '40kb', '50kb', '60kb', '70kb', '80kb', '90kb',
  '100kb', '150kb', '200kb', '250kb', '300kb', '400kb', '500kb', '1mb', '2mb'
];
for (const fmt of imgKbFormats) {
  for (const sz of imgKbSizes) {
    const isMb = sz.endsWith('mb');
    const num = parseFloat(sz);
    const targetKb = isMb ? Math.round(num * 1024) : Math.round(num);

    addTool({
      id: `c${fmt}_${sz.replace('.', '_')}`,
      slug: `compress-${fmt}-to-${sz}`,
      name: `Compress ${fmt.toUpperCase()} to ${sz.toUpperCase()}`,
      impl: 'imgkb',
      cat: 'optimize',
      icon: '🗜️',
      accept: `image/*,.${fmt}`,
      multiple: true,
      maxmb: 100,
      vars: { format: fmt, targetKb: String(targetKb) }
    });
  }
}

// 7. SPECIFIC EXAM & PORTAL PDF COMPRESSORS
const portalCompressors = [
  { slug: 'compress-pdf-for-ssc-cgl', name: 'Compress PDF for SSC CGL Exam', kb: '100' },
  { slug: 'compress-pdf-for-upsc-exam', name: 'Compress PDF for UPSC Application', kb: '200' },
  { slug: 'compress-pdf-for-uscis', name: 'Compress PDF for USCIS Submission', kb: '1000' },
  { slug: 'compress-pdf-for-dv-lottery-entry', name: 'Compress PDF for DV Lottery', kb: '240' },
  { slug: 'compress-pdf-for-email-attachment', name: 'Compress PDF for Email Attachment', kb: '5000' },
  { slug: 'compress-pdf-for-gmail', name: 'Compress PDF for Gmail Attachment', kb: '20000' },
  { slug: 'compress-pdf-for-outlook', name: 'Compress PDF for Outlook Attachment', kb: '10000' },
  { slug: 'compress-pdf-for-job-portal', name: 'Compress PDF for Job Portal Upload', kb: '500' },
  { slug: 'compress-pdf-for-university-admission', name: 'Compress PDF for University Admission', kb: '1000' },
  { slug: 'compress-pdf-for-government-portal', name: 'Compress PDF for Government Portal', kb: '200' },
  { slug: 'compress-pdf-for-whatsapp-sharing', name: 'Compress PDF for WhatsApp Sharing', kb: '2000' },
  { slug: 'compress-pdf-for-passport-application', name: 'Compress PDF for Passport Application', kb: '300' },
  { slug: 'compress-pdf-for-visa-upload', name: 'Compress PDF for Visa Upload', kb: '500' },
  { slug: 'compress-pdf-for-tax-filing', name: 'Compress PDF for Tax Filing', kb: '2000' }
];
for (const p of portalCompressors) {
  addTool({
    id: p.slug.replace(/-/g, '_'),
    slug: p.slug,
    name: p.name,
    impl: 'pdfkb',
    cat: 'optimize',
    icon: '🗜️',
    accept: 'application/pdf,.pdf',
    multiple: true,
    maxmb: 200,
    vars: { targetKb: p.kb }
  });
}

// 8. SOCIAL MEDIA & DISPLAY DIMENSION RESIZERS
const displayResizes = [
  '1920x1080', '1280x720', '1080x1920', '3840x2160', '2560x1440', '1024x768', '800x600',
  '640x480', '500x500', '400x400', '300x300', '200x200', '150x150', '100x100',
  '1600x900', '1366x768', '1440x900', '1200x630', '1200x675', '1080x1080', '1080x1350',
  '851x315', '1500x500', '1600x400', '1280x800', '1920x1200', '2048x1536'
];
for (const dim of displayResizes) {
  addTool({
    id: `res_${dim}`,
    slug: `resize-image-to-${dim}`,
    name: `Resize Image to ${dim}`,
    impl: 'imgresize',
    cat: 'image',
    icon: '📐',
    accept: 'image/*',
    multiple: true,
    maxmb: 100,
    vars: { dimensions: dim }
  });
}

const socialResizes = [
  { slug: 'instagram-story-resizer', name: 'Instagram Story Resizer', dim: '1080x1920' },
  { slug: 'instagram-portrait-resizer', name: 'Instagram Portrait Resizer', dim: '1080x1350' },
  { slug: 'instagram-square-resizer', name: 'Instagram Square Post Resizer', dim: '1080x1080' },
  { slug: 'instagram-landscape-resizer', name: 'Instagram Landscape Resizer', dim: '1080x566' },
  { slug: 'instagram-reel-cover-resizer', name: 'Instagram Reel Cover Resizer', dim: '1080x1920' },
  { slug: 'instagram-profile-photo-resizer', name: 'Instagram Profile Photo Resizer', dim: '320x320' },
  { slug: 'youtube-thumbnail-resizer', name: 'YouTube Thumbnail Resizer', dim: '1280x720' },
  { slug: 'youtube-banner-resizer', name: 'YouTube Banner Resizer', dim: '2560x1440' },
  { slug: 'youtube-channel-logo-resizer', name: 'YouTube Channel Logo Resizer', dim: '800x800' },
  { slug: 'youtube-shorts-resizer', name: 'YouTube Shorts Resizer', dim: '1080x1920' },
  { slug: 'tiktok-video-resizer', name: 'TikTok Video Resizer', dim: '1080x1920' },
  { slug: 'tiktok-profile-photo-resizer', name: 'TikTok Profile Photo Resizer', dim: '200x200' },
  { slug: 'facebook-cover-photo-resizer', name: 'Facebook Cover Photo Resizer', dim: '820x312' },
  { slug: 'facebook-post-image-resizer', name: 'Facebook Post Image Resizer', dim: '1200x630' },
  { slug: 'facebook-profile-photo-resizer', name: 'Facebook Profile Photo Resizer', dim: '170x170' },
  { slug: 'facebook-event-banner-resizer', name: 'Facebook Event Banner Resizer', dim: '1920x1005' },
  { slug: 'twitter-header-banner-resizer', name: 'Twitter Header Banner Resizer', dim: '1500x500' },
  { slug: 'twitter-profile-photo-resizer', name: 'Twitter Profile Photo Resizer', dim: '400x400' },
  { slug: 'twitter-post-image-resizer', name: 'Twitter Post Image Resizer', dim: '1200x675' },
  { slug: 'linkedin-profile-banner-resizer', name: 'LinkedIn Profile Banner Resizer', dim: '1584x396' },
  { slug: 'linkedin-profile-photo-resizer', name: 'LinkedIn Profile Photo Resizer', dim: '400x400' },
  { slug: 'linkedin-company-banner-resizer', name: 'LinkedIn Company Banner Resizer', dim: '1128x191' },
  { slug: 'linkedin-post-image-resizer', name: 'LinkedIn Post Image Resizer', dim: '1200x627' },
  { slug: 'pinterest-pin-resizer', name: 'Pinterest Pin Resizer', dim: '1000x1500' },
  { slug: 'pinterest-board-cover-resizer', name: 'Pinterest Board Cover Resizer', dim: '600x600' },
  { slug: 'twitch-banner-resizer', name: 'Twitch Banner Resizer', dim: '1200x480' },
  { slug: 'twitch-avatar-resizer', name: 'Twitch Avatar Resizer', dim: '256x256' },
  { slug: 'discord-avatar-resizer', name: 'Discord Avatar Resizer', dim: '128x128' },
  { slug: 'discord-banner-resizer', name: 'Discord Banner Resizer', dim: '600x240' },
  { slug: 'discord-server-icon-resizer', name: 'Discord Server Icon Resizer', dim: '512x512' },
  { slug: 'shopify-product-image-resizer', name: 'Shopify Product Image Resizer', dim: '2048x2048' },
  { slug: 'etsy-banner-resizer', name: 'Etsy Banner Resizer', dim: '1200x300' },
  { slug: 'etsy-shop-icon-resizer', name: 'Etsy Shop Icon Resizer', dim: '500x500' },
  { slug: 'amazon-product-photo-resizer', name: 'Amazon Product Photo Resizer', dim: '2000x2000' }
];
for (const s of socialResizes) {
  addTool({
    id: s.slug.replace(/-/g, '_'),
    slug: s.slug,
    name: s.name,
    impl: 'social',
    cat: 'image',
    icon: '📐',
    accept: 'image/*',
    multiple: false,
    maxmb: 50,
    vars: { dimensions: s.dim }
  });
}

// 9. GLOBAL VISA & PASSPORT PHOTO MATRIX
const passportCountries = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Schengen Area', 'Germany',
  'France', 'Italy', 'Spain', 'India', 'Japan', 'China', 'Singapore', 'New Zealand',
  'Ireland', 'United Arab Emirates', 'Saudi Arabia', 'Brazil', 'Mexico', 'South Africa',
  'South Korea', 'Philippines', 'Malaysia', 'Thailand', 'Indonesia', 'Turkey',
  'Netherlands', 'Switzerland', 'Sweden', 'Poland', 'Vietnam', 'Pakistan', 'Nigeria',
  'Egypt', 'Argentina', 'Colombia', 'Portugal', 'Greece', 'Austria', 'Belgium',
  'Norway', 'Denmark', 'Finland'
];
const existingVisaCountries = new Set(['united-states', 'united-kingdom', 'canada', 'australia', 'schengen-area']);

for (const c of passportCountries) {
  const cSlug = c.toLowerCase().replace(/\s+/g, '-');
  addTool({
    id: `${cSlug}_passport_photo`,
    slug: `${cSlug}-passport-photo-tool`,
    name: `${c} Passport Photo Tool`,
    impl: 'passport',
    cat: 'image',
    icon: '🛂',
    accept: 'image/*',
    multiple: false,
    maxmb: 50,
    vars: { country: c }
  });
  if (!existingVisaCountries.has(cSlug)) {
    addTool({
      id: `${cSlug}_visa_photo`,
      slug: `${cSlug}-visa-photo-tool`,
      name: `${c} Visa Photo Tool`,
      impl: 'passport',
      cat: 'image',
      icon: '🛂',
      accept: 'image/*',
      multiple: false,
      maxmb: 50,
      vars: { country: c }
    });
  }
}

// 10. ARCHIVE MATRIX
const archiveFormats = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'iso', 'tgz', 'tbz2'];
for (const from of archiveFormats) {
  for (const to of ['zip', '7z', 'tar']) {
    if (from === to) continue;
    addTool({
      id: `${from}2${to}`,
      slug: `${from}-to-${to}`,
      name: `${from.toUpperCase()} to ${to.toUpperCase()}`,
      impl: 'archive',
      cat: 'more',
      icon: '📦',
      accept: `.${from},application/zip,application/x-rar-compressed,application/x-7z-compressed`,
      multiple: false,
      maxmb: 500,
      vars: { from: from.toUpperCase(), to: to.toUpperCase() }
    });
  }
}

// 11. DEVELOPER, HASH & CODE MATRIX
const hashAlgos = [
  'SHA256', 'SHA512', 'SHA1', 'MD5', 'SHA384', 'SHA224', 'Keccak256', 'CRC32',
  'HMAC-SHA256', 'HMAC-SHA512', 'HMAC-MD5', 'Bcrypt'
];
for (const algo of hashAlgos) {
  const aSlug = algo.toLowerCase().replace(/[^a-z0-9]/g, '-');
  addTool({
    id: `${aSlug}_hash_gen`,
    slug: `${aSlug}-hash-generator`,
    name: `${algo} Hash Generator`,
    impl: 'devutils',
    cat: 'dev',
    icon: '🔒',
    nofile: true,
    vars: { algo }
  });
}

const devCodeTools = [
  { slug: 'base64-to-image', name: 'Base64 to Image Decoder', impl: 'base64', nofile: true },
  { slug: 'image-to-base64', name: 'Image to Base64 Converter', impl: 'base64', accept: 'image/*' },
  { slug: 'base64-to-pdf', name: 'Base64 to PDF Decoder', impl: 'base64', nofile: true },
  { slug: 'pdf-to-base64', name: 'PDF to Base64 Converter', impl: 'base64', accept: 'application/pdf,.pdf' },
  { slug: 'base64-to-text', name: 'Base64 to Text Decoder', impl: 'base64', nofile: true },
  { slug: 'text-to-base64', name: 'Text to Base64 Encoder', impl: 'base64', nofile: true },
  { slug: 'hex-to-ascii-converter', name: 'Hex to ASCII Converter', impl: 'devutils', nofile: true },
  { slug: 'ascii-to-hex-converter', name: 'ASCII to Hex Converter', impl: 'devutils', nofile: true },
  { slug: 'binary-to-text-converter', name: 'Binary to Text Converter', impl: 'devutils', nofile: true },
  { slug: 'text-to-binary-converter', name: 'Text to Binary Converter', impl: 'devutils', nofile: true },
  { slug: 'octal-to-decimal-converter', name: 'Octal to Decimal Converter', impl: 'devutils', nofile: true },
  { slug: 'decimal-to-octal-converter', name: 'Decimal to Octal Converter', impl: 'devutils', nofile: true },
  { slug: 'hex-to-binary-converter', name: 'Hex to Binary Converter', impl: 'devutils', nofile: true },
  { slug: 'binary-to-hex-converter', name: 'Binary to Hex Converter', impl: 'devutils', nofile: true },
  { slug: 'base32-encoder', name: 'Base32 Encoder', impl: 'devutils', nofile: true },
  { slug: 'base32-decoder', name: 'Base32 Decoder', impl: 'devutils', nofile: true },
  { slug: 'base58-encoder', name: 'Base58 Encoder', impl: 'devutils', nofile: true },
  { slug: 'base58-decoder', name: 'Base58 Decoder', impl: 'devutils', nofile: true },
  { slug: 'jwt-token-decoder', name: 'JWT Token Decoder', impl: 'devutils', nofile: true },
  { slug: 'jwt-token-encoder', name: 'JWT Token Encoder', impl: 'devutils', nofile: true },
  { slug: 'url-encode-online', name: 'URL Encode Online', impl: 'devutils', nofile: true },
  { slug: 'url-decode-online', name: 'URL Decode Online', impl: 'devutils', nofile: true },
  { slug: 'html-entity-encoder', name: 'HTML Entity Encoder', impl: 'devutils', nofile: true },
  { slug: 'html-entity-decoder', name: 'HTML Entity Decoder', impl: 'devutils', nofile: true },
  { slug: 'rot13-cipher-encoder', name: 'ROT13 Cipher Encoder', impl: 'devutils', nofile: true },
  { slug: 'morse-code-generator', name: 'Morse Code Generator', impl: 'devutils', nofile: true },
  { slug: 'morse-code-decoder', name: 'Morse Code Decoder', impl: 'devutils', nofile: true },
  { slug: 'json-formatter-beautifier', name: 'JSON Formatter Beautifier', impl: 'devutils', nofile: true },
  { slug: 'json-minifier-online', name: 'JSON Minifier Online', impl: 'devutils', nofile: true },
  { slug: 'json-validator-online', name: 'JSON Validator Online', impl: 'devutils', nofile: true },
  { slug: 'xml-formatter-beautifier', name: 'XML Formatter Beautifier', impl: 'devutils', nofile: true },
  { slug: 'xml-minifier-online', name: 'XML Minifier Online', impl: 'devutils', nofile: true },
  { slug: 'xml-validator-online', name: 'XML Validator Online', impl: 'devutils', nofile: true },
  { slug: 'sql-formatter-beautifier', name: 'SQL Formatter Beautifier', impl: 'devutils', nofile: true },
  { slug: 'html-formatter-beautifier', name: 'HTML Formatter Beautifier', impl: 'devutils', nofile: true },
  { slug: 'html-minifier-online', name: 'HTML Minifier Online', impl: 'devutils', nofile: true },
  { slug: 'css-formatter-beautifier', name: 'CSS Formatter Beautifier', impl: 'devutils', nofile: true },
  { slug: 'css-minifier-online', name: 'CSS Minifier Online', impl: 'devutils', nofile: true },
  { slug: 'js-formatter-beautifier', name: 'JavaScript Formatter Beautifier', impl: 'devutils', nofile: true },
  { slug: 'js-minifier-online', name: 'JavaScript Minifier Online', impl: 'devutils', nofile: true },
  { slug: 'yaml-formatter-beautifier', name: 'YAML Formatter Beautifier', impl: 'devutils', nofile: true },
  { slug: 'yaml-validator-online', name: 'YAML Validator Online', impl: 'devutils', nofile: true },
  { slug: 'toml-to-json-converter', name: 'TOML to JSON Converter', impl: 'devutils', nofile: true },
  { slug: 'json-to-toml-converter', name: 'JSON to TOML Converter', impl: 'devutils', nofile: true },
  { slug: 'uuid-v1-generator', name: 'UUID v1 Generator', impl: 'devutils', nofile: true },
  { slug: 'uuid-v4-generator', name: 'UUID v4 Generator', impl: 'devutils', nofile: true },
  { slug: 'guid-generator-online', name: 'GUID Generator Online', impl: 'devutils', nofile: true },
  { slug: 'nanoid-generator-online', name: 'NanoID Generator Online', impl: 'devutils', nofile: true },
  { slug: 'cron-expression-generator', name: 'Cron Expression Generator', impl: 'devutils', nofile: true },
  { slug: 'regex-tester-online', name: 'Regex Tester Online', impl: 'devutils', nofile: true }
];
for (const d of devCodeTools) {
  addTool({
    id: d.slug.replace(/-/g, '_'),
    slug: d.slug,
    name: d.name,
    impl: d.impl || 'devutils',
    cat: 'dev',
    icon: '💻',
    accept: d.accept || '',
    nofile: !!d.nofile,
    vars: {}
  });
}

// 12. GLOBAL CALCULATORS MATRIX
const calculators = [
  // Finance
  { slug: 'compound-interest-calculator', name: 'Compound Interest Calculator', impl: 'financecalc' },
  { slug: 'simple-interest-calculator', name: 'Simple Interest Calculator', impl: 'financecalc' },
  { slug: 'mortgage-calculator', name: 'Mortgage Calculator', impl: 'financecalc' },
  { slug: 'car-loan-calculator', name: 'Car Loan Calculator', impl: 'financecalc' },
  { slug: 'personal-loan-calculator', name: 'Personal Loan Calculator', impl: 'financecalc' },
  { slug: 'emi-calculator', name: 'EMI Calculator', impl: 'financecalc' },
  { slug: 'amortization-calculator', name: 'Amortization Calculator', impl: 'financecalc' },
  { slug: 'investment-return-calculator', name: 'Investment Return Calculator', impl: 'financecalc' },
  { slug: 'roi-calculator', name: 'ROI Calculator', impl: 'financecalc' },
  { slug: 'cagr-calculator', name: 'CAGR Calculator', impl: 'financecalc' },
  { slug: 'sip-calculator', name: 'SIP Calculator', impl: 'financecalc' },
  { slug: 'lump-sum-investment-calculator', name: 'Lump Sum Investment Calculator', impl: 'financecalc' },
  { slug: 'inflation-calculator', name: 'Inflation Calculator', impl: 'financecalc' },
  { slug: 'future-value-calculator', name: 'Future Value Calculator', impl: 'financecalc' },
  { slug: 'present-value-calculator', name: 'Present Value Calculator', impl: 'financecalc' },
  { slug: 'retirement-savings-calculator', name: 'Retirement Savings Calculator', impl: 'financecalc' },
  { slug: 'credit-card-payoff-calculator', name: 'Credit Card Payoff Calculator', impl: 'financecalc' },
  { slug: 'salary-to-hourly-calculator', name: 'Salary to Hourly Calculator', impl: 'financecalc' },
  { slug: 'hourly-to-salary-calculator', name: 'Hourly to Salary Calculator', impl: 'financecalc' },
  { slug: 'vat-tax-calculator', name: 'VAT Tax Calculator', impl: 'financecalc' },
  { slug: 'gst-tax-calculator', name: 'GST Tax Calculator', impl: 'financecalc' },
  { slug: 'sales-tax-calculator', name: 'Sales Tax Calculator', impl: 'financecalc' },
  { slug: 'margin-markup-calculator', name: 'Margin Markup Calculator', impl: 'financecalc' },
  { slug: 'break-even-calculator', name: 'Break Even Calculator', impl: 'financecalc' },
  { slug: 'crypto-profit-calculator', name: 'Crypto Profit Calculator', impl: 'financecalc' },
  { slug: 'stock-profit-calculator', name: 'Stock Profit Calculator', impl: 'financecalc' },
  { slug: 'dividend-yield-calculator', name: 'Dividend Yield Calculator', impl: 'financecalc' },
  { slug: 'tip-calculator-online', name: 'Tip Calculator Online', impl: 'financecalc' },
  { slug: 'discount-percent-calculator', name: 'Discount Percent Calculator', impl: 'financecalc' },
  { slug: 'percentage-increase-calculator', name: 'Percentage Increase Calculator', impl: 'financecalc' },
  { slug: 'percentage-decrease-calculator', name: 'Percentage Decrease Calculator', impl: 'financecalc' },
  { slug: 'percentage-difference-calculator', name: 'Percentage Difference Calculator', impl: 'financecalc' },

  // Math
  { slug: 'fraction-to-decimal-calculator', name: 'Fraction to Decimal Calculator', impl: 'mathcalc' },
  { slug: 'decimal-to-fraction-calculator', name: 'Decimal to Fraction Calculator', impl: 'mathcalc' },
  { slug: 'scientific-calculator-online', name: 'Scientific Calculator Online', impl: 'mathcalc' },
  { slug: 'square-root-calculator', name: 'Square Root Calculator', impl: 'mathcalc' },
  { slug: 'cube-root-calculator', name: 'Cube Root Calculator', impl: 'mathcalc' },
  { slug: 'exponent-calculator', name: 'Exponent Calculator', impl: 'mathcalc' },
  { slug: 'logarithm-calculator', name: 'Logarithm Calculator', impl: 'mathcalc' },
  { slug: 'factor-calculator', name: 'Factor Calculator', impl: 'mathcalc' },
  { slug: 'greatest-common-factor-calculator', name: 'Greatest Common Factor Calculator', impl: 'mathcalc' },
  { slug: 'least-common-multiple-calculator', name: 'Least Common Multiple Calculator', impl: 'mathcalc' },
  { slug: 'prime-number-checker', name: 'Prime Number Checker', impl: 'mathcalc' },
  { slug: 'random-number-generator-online', name: 'Random Number Generator Online', impl: 'mathcalc' },
  { slug: 'standard-deviation-calculator', name: 'Standard Deviation Calculator', impl: 'mathcalc' },
  { slug: 'mean-median-mode-calculator', name: 'Mean Median Mode Calculator', impl: 'mathcalc' },
  { slug: 'probability-calculator', name: 'Probability Calculator', impl: 'mathcalc' },
  { slug: 'ratio-calculator-online', name: 'Ratio Calculator Online', impl: 'mathcalc' },
  { slug: 'circle-area-calculator', name: 'Circle Area Calculator', impl: 'mathcalc' },
  { slug: 'triangle-area-calculator', name: 'Triangle Area Calculator', impl: 'mathcalc' },

  // Health
  { slug: 'bmr-calculator-online', name: 'BMR Calculator Online', impl: 'healthcalc' },
  { slug: 'tdee-calculator-online', name: 'TDEE Calculator Online', impl: 'healthcalc' },
  { slug: 'calorie-deficit-calculator', name: 'Calorie Deficit Calculator', impl: 'healthcalc' },
  { slug: 'body-fat-percentage-calculator', name: 'Body Fat Percentage Calculator', impl: 'healthcalc' },
  { slug: 'ideal-body-weight-calculator', name: 'Ideal Body Weight Calculator', impl: 'healthcalc' },
  { slug: 'water-intake-calculator', name: 'Water Intake Calculator', impl: 'healthcalc' },
  { slug: 'target-heart-rate-calculator', name: 'Target Heart Rate Calculator', impl: 'healthcalc' },
  { slug: 'macro-nutrient-calculator', name: 'Macro Nutrient Calculator', impl: 'healthcalc' },
  { slug: 'keto-calculator-online', name: 'Keto Calculator Online', impl: 'healthcalc' },
  { slug: 'pregnancy-due-date-calculator', name: 'Pregnancy Due Date Calculator', impl: 'healthcalc' },
  { slug: 'ovulation-calculator-online', name: 'Ovulation Calculator Online', impl: 'healthcalc' },
  { slug: 'sleep-cycle-calculator', name: 'Sleep Cycle Calculator', impl: 'healthcalc' },
  { slug: 'blood-alcohol-content-calculator', name: 'Blood Alcohol Content Calculator', impl: 'healthcalc' },
  { slug: 'running-pace-calculator', name: 'Running Pace Calculator', impl: 'healthcalc' },

  // Date / Time
  { slug: 'days-between-dates-calculator', name: 'Days Between Dates Calculator', impl: 'datediff' },
  { slug: 'business-days-calculator', name: 'Business Days Calculator', impl: 'datediff' },
  { slug: 'age-calculator-in-months-and-days', name: 'Age Calculator in Months and Days', impl: 'age' },
  { slug: 'time-until-date-calculator', name: 'Time Until Date Calculator', impl: 'datediff' },
  { slug: 'hours-calculator-between-times', name: 'Hours Calculator Between Times', impl: 'datediff' },
  { slug: 'minutes-to-hours-calculator', name: 'Minutes to Hours Calculator', impl: 'units' },
  { slug: 'seconds-to-hours-calculator', name: 'Seconds to Hours Calculator', impl: 'units' },
  { slug: 'unix-timestamp-to-date', name: 'Unix Timestamp to Date', impl: 'devutils' },
  { slug: 'date-to-unix-timestamp', name: 'Date to Unix Timestamp', impl: 'devutils' },
  { slug: 'world-clock-difference-calculator', name: 'World Clock Difference Calculator', impl: 'timezone' },
  { slug: 'leap-year-checker-online', name: 'Leap Year Checker Online', impl: 'devutils' }
];

for (const c of calculators) {
  addTool({
    id: c.slug.replace(/-/g, '_'),
    slug: c.slug,
    name: c.name,
    impl: c.impl,
    cat: 'calc',
    icon: '🧮',
    nofile: true,
    vars: {}
  });
}

// 13. UNITS MATRIX
const unitPairs = [
  { slug: 'meters-to-feet', name: 'Meters to Feet', u1: 'm', u2: 'ft' },
  { slug: 'feet-to-meters', name: 'Feet to Meters', u1: 'ft', u2: 'm' },
  { slug: 'inches-to-cm', name: 'Inches to CM', u1: 'in', u2: 'cm' },
  { slug: 'cm-to-inches', name: 'CM to Inches', u1: 'cm', u2: 'in' },
  { slug: 'km-to-miles', name: 'KM to Miles', u1: 'km', u2: 'mi' },
  { slug: 'miles-to-km', name: 'Miles to KM', u1: 'mi', u2: 'km' },
  { slug: 'yards-to-meters', name: 'Yards to Meters', u1: 'yd', u2: 'm' },
  { slug: 'meters-to-yards', name: 'Meters to Yards', u1: 'm', u2: 'yd' },
  { slug: 'mm-to-inches', name: 'MM to Inches', u1: 'mm', u2: 'in' },
  { slug: 'inches-to-mm', name: 'Inches to MM', u1: 'in', u2: 'mm' },
  { slug: 'kg-to-lbs', name: 'KG to LBS', u1: 'kg', u2: 'lb' },
  { slug: 'lbs-to-kg', name: 'LBS to KG', u1: 'lb', u2: 'kg' },
  { slug: 'grams-to-ounces', name: 'Grams to Ounces', u1: 'g', u2: 'oz' },
  { slug: 'ounces-to-grams', name: 'Ounces to Grams', u1: 'oz', u2: 'g' },
  { slug: 'kg-to-stones', name: 'KG to Stones', u1: 'kg', u2: 'st' },
  { slug: 'stones-to-kg', name: 'Stones to KG', u1: 'st', u2: 'kg' },
  { slug: 'celsius-to-fahrenheit', name: 'Celsius to Fahrenheit', u1: 'c', u2: 'f' },
  { slug: 'fahrenheit-to-celsius', name: 'Fahrenheit to Celsius', u1: 'f', u2: 'c' },
  { slug: 'celsius-to-kelvin', name: 'Celsius to Kelvin', u1: 'c', u2: 'k' },
  { slug: 'kelvin-to-celsius', name: 'Kelvin to Celsius', u1: 'k', u2: 'c' },
  { slug: 'fahrenheit-to-kelvin', name: 'Fahrenheit to Kelvin', u1: 'f', u2: 'k' },
  { slug: 'kelvin-to-fahrenheit', name: 'Kelvin to Fahrenheit', u1: 'k', u2: 'f' },
  { slug: 'sq-meters-to-sq-feet', name: 'Sq Meters to Sq Feet', u1: 'm2', u2: 'ft2' },
  { slug: 'sq-feet-to-sq-meters', name: 'Sq Feet to Sq Meters', u1: 'ft2', u2: 'm2' },
  { slug: 'acres-to-sq-feet', name: 'Acres to Sq Feet', u1: 'ac', u2: 'ft2' },
  { slug: 'sq-feet-to-acres', name: 'Sq Feet to Acres', u1: 'ft2', u2: 'ac' },
  { slug: 'hectares-to-acres', name: 'Hectares to Acres', u1: 'ha', u2: 'ac' },
  { slug: 'acres-to-hectares', name: 'Acres to Hectares', u1: 'ac', u2: 'ha' },
  { slug: 'liters-to-gallons', name: 'Liters to Gallons', u1: 'l', u2: 'gal' },
  { slug: 'gallons-to-liters', name: 'Gallons to Liters', u1: 'gal', u2: 'l' },
  { slug: 'ml-to-fluid-oz', name: 'ML to Fluid OZ', u1: 'ml', u2: 'floz' },
  { slug: 'fluid-oz-to-ml', name: 'Fluid OZ to ML', u1: 'floz', u2: 'ml' },
  { slug: 'cups-to-ml', name: 'Cups to ML', u1: 'cup', u2: 'ml' },
  { slug: 'ml-to-cups', name: 'ML to Cups', u1: 'ml', u2: 'cup' },
  { slug: 'kmh-to-mph', name: 'KMH to MPH', u1: 'kmh', u2: 'mph' },
  { slug: 'mph-to-kmh', name: 'MPH to KMH', u1: 'mph', u2: 'kmh' },
  { slug: 'knots-to-mph', name: 'Knots to MPH', u1: 'kn', u2: 'mph' },
  { slug: 'psi-to-bar', name: 'PSI to Bar', u1: 'psi', u2: 'bar' },
  { slug: 'bar-to-psi', name: 'Bar to PSI', u1: 'bar', u2: 'psi' },
  { slug: 'joules-to-calories', name: 'Joules to Calories', u1: 'j', u2: 'cal' },
  { slug: 'calories-to-joules', name: 'Calories to Joules', u1: 'cal', u2: 'j' },
  { slug: 'watts-to-horsepower', name: 'Watts to Horsepower', u1: 'w', u2: 'hp' },
  { slug: 'horsepower-to-watts', name: 'Horsepower to Watts', u1: 'hp', u2: 'w' },
  { slug: 'bytes-to-kb', name: 'Bytes to KB', u1: 'b', u2: 'kb' },
  { slug: 'kb-to-mb', name: 'KB to MB', u1: 'kb', u2: 'mb' },
  { slug: 'mb-to-gb', name: 'MB to GB', u1: 'mb', u2: 'gb' },
  { slug: 'gb-to-tb', name: 'GB to TB', u1: 'gb', u2: 'tb' },
  { slug: 'tb-to-gb', name: 'TB to GB', u1: 'tb', u2: 'gb' },
  { slug: 'mbps-to-mbs', name: 'Mbps to MB/s', u1: 'mbps', u2: 'mbs' },
  { slug: 'mbs-to-mbps', name: 'MB/s to Mbps', u1: 'mbs', u2: 'mbps' }
];
for (const u of unitPairs) {
  addTool({
    id: u.slug.replace(/-/g, '_'),
    slug: u.slug,
    name: u.name,
    impl: 'units',
    cat: 'units',
    icon: '⚖️',
    nofile: true,
    vars: { from: u.u1, to: u.u2 }
  });
}

// 14. FONT MATRIX
const fontFormats = ['ttf', 'otf', 'woff', 'woff2', 'eot', 'svg'];
for (const from of fontFormats) {
  for (const to of fontFormats) {
    if (from === to) continue;
    addTool({
      id: `${from}2${to}`,
      slug: `${from}-to-${to}`,
      name: `${from.toUpperCase()} to ${to.toUpperCase()}`,
      impl: 'fontconv',
      cat: 'more',
      icon: '🔤',
      accept: `.${from},font/*`,
      multiple: true,
      maxmb: 50,
      vars: { from: from.toUpperCase(), to: to.toUpperCase() }
    });
  }
}

// 15. 3D MODEL MATRIX
const threeDFormats = ['stl', 'obj', 'gltf', 'glb', 'ply', 'dae', '3ds', 'fbx'];
for (const from of threeDFormats) {
  for (const to of ['stl', 'obj', 'gltf', 'glb', 'ply']) {
    if (from === to) continue;
    addTool({
      id: `${from}2${to}`,
      slug: `${from}-to-${to}`,
      name: `${from.toUpperCase()} to ${to.toUpperCase()}`,
      impl: 'threed',
      cat: 'media',
      icon: '🧊',
      accept: `.${from}`,
      multiple: false,
      maxmb: 150,
      vars: { from: from.toUpperCase(), to: to.toUpperCase() }
    });
  }
}

// 16. CAD & VECTOR MATRIX
const cadFormats = ['dxf', 'dwg', 'cdr', 'ai', 'eps', 'svg'];
for (const from of cadFormats) {
  for (const to of ['dxf', 'svg', 'pdf', 'png', 'eps']) {
    if (from === to) continue;
    addTool({
      id: `${from}2${to}`,
      slug: `${from}-to-${to}`,
      name: `${from.toUpperCase()} to ${to.toUpperCase()}`,
      impl: from === 'cdr' ? 'cdr' : from === 'eps' || from === 'ai' ? 'epsconv' : 'dxf',
      cat: 'convert',
      icon: '📐',
      accept: `.${from}`,
      multiple: false,
      maxmb: 100,
      vars: { from: from.toUpperCase(), to: to.toUpperCase() }
    });
  }
}

// 17. TEXT & STRING PRODUCTIVITY
const textTools = [
  { slug: 'uppercase-to-lowercase-converter', name: 'Uppercase to Lowercase Converter' },
  { slug: 'lowercase-to-uppercase-converter', name: 'Lowercase to Uppercase Converter' },
  { slug: 'title-case-text-converter', name: 'Title Case Text Converter' },
  { slug: 'sentence-case-text-converter', name: 'Sentence Case Text Converter' },
  { slug: 'camelcase-text-converter', name: 'CamelCase Text Converter' },
  { slug: 'kebab-case-text-converter', name: 'Kebab Case Text Converter' },
  { slug: 'snake-case-text-converter', name: 'Snake Case Text Converter' },
  { slug: 'pascal-case-text-converter', name: 'Pascal Case Text Converter' },
  { slug: 'constant-case-text-converter', name: 'Constant Case Text Converter' },
  { slug: 'dot-case-text-converter', name: 'Dot Case Text Converter' },
  { slug: 'toggle-case-text-converter', name: 'Toggle Case Text Converter' },
  { slug: 'alternating-case-text-converter', name: 'Alternating Case Text Converter' },
  { slug: 'word-counter-online-tool', name: 'Word Counter Online Tool' },
  { slug: 'character-counter-online-tool', name: 'Character Counter Online Tool' },
  { slug: 'sentence-counter-online-tool', name: 'Sentence Counter Online Tool' },
  { slug: 'paragraph-counter-online-tool', name: 'Paragraph Counter Online Tool' },
  { slug: 'reading-time-calculator-online', name: 'Reading Time Calculator Online' },
  { slug: 'speaking-time-calculator-online', name: 'Speaking Time Calculator Online' },
  { slug: 'remove-line-breaks-from-text', name: 'Remove Line Breaks from Text' },
  { slug: 'remove-duplicate-lines-from-text', name: 'Remove Duplicate Lines from Text' },
  { slug: 'sort-lines-alphabetically-online', name: 'Sort Lines Alphabetically Online' },
  { slug: 'reverse-lines-order-online', name: 'Reverse Lines Order Online' },
  { slug: 'find-and-replace-text-online', name: 'Find and Replace Text Online' },
  { slug: 'diff-checker-text-online', name: 'Diff Checker Text Online' },
  { slug: 'strip-html-tags-from-text', name: 'Strip HTML Tags from Text' },
  { slug: 'add-prefix-suffix-to-lines', name: 'Add Prefix Suffix to Lines' },
  { slug: 'extract-urls-from-text', name: 'Extract URLs from Text' },
  { slug: 'extract-phone-numbers-from-text', name: 'Extract Phone Numbers from Text' },
  { slug: 'reverse-text-generator-online', name: 'Reverse Text Generator Online' },
  { slug: 'upside-down-text-generator', name: 'Upside Down Text Generator' },
  { slug: 'bubble-text-generator-online', name: 'Bubble Text Generator Online' },
  { slug: 'strikethrough-text-generator', name: 'Strikethrough Text Generator' },
  { slug: 'underline-text-generator-online', name: 'Underline Text Generator Online' },
  { slug: 'zalgo-glitch-text-generator', name: 'Zalgo Glitch Text Generator' },
  { slug: 'unicode-text-styler-online', name: 'Unicode Text Styler Online' },
  { slug: 'nato-phonetic-alphabet-translator', name: 'NATO Phonetic Alphabet Translator' }
];
for (const t of textTools) {
  addTool({
    id: t.slug.replace(/-/g, '_'),
    slug: t.slug,
    name: t.name,
    impl: 'texttools',
    cat: 'text',
    icon: '📝',
    nofile: true,
    vars: {}
  });
}

console.log(`Generated ${matrixTools.length} new format-to-format matrix tools!`);
const totalTools = existingTools.length + matrixTools.length;
console.log(`Total tools in Fileopia: ${totalTools}`);
console.log(`Estimated pages across 20 languages: ${totalTools * 20} + hubs & home = ${totalTools * 20 + 400}+`);

const outPath = R('src/tools.d/b30-format-matrix.json');
fs.writeFileSync(outPath, JSON.stringify(matrixTools, null, 2), 'utf8');
console.log(`Saved matrix tools -> ${outPath}`);
