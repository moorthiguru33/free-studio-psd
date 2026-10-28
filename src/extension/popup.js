// Fileopia Chrome Extension – Popup Controller

const POPULAR_TOOLS = [
  { slug: "compress-pdf", name: "Compress PDF", icon: "🗜️", cat: "pdf", short: "Reduce PDF file size locally" },
  { slug: "merge-pdf", name: "Merge PDF", icon: "📑", cat: "pdf", short: "Combine multiple PDFs into one" },
  { slug: "split-pdf", name: "Split PDF", icon: "✂️", cat: "pdf", short: "Extract pages from PDF" },
  { slug: "pdf-to-word", name: "PDF to Word", icon: "📄", cat: "pdf", short: "Convert PDF to editable DOCX" },
  { slug: "word-to-pdf", name: "Word to PDF", icon: "📄", cat: "pdf", short: "Convert DOCX to clean PDF" },
  { slug: "jpg-to-pdf", name: "JPG to PDF", icon: "🖼️", cat: "pdf", short: "Convert images to PDF document" },
  { slug: "sign-pdf", name: "Sign PDF", icon: "✍️", cat: "pdf", short: "Add signature to PDF online" },
  { slug: "protect-pdf", name: "Protect PDF", icon: "🔒", cat: "pdf", short: "Add password encryption" },
  { slug: "compress-image", name: "Compress Image", icon: "🗜️", cat: "image", short: "Compress JPG, PNG, WebP" },
  { slug: "resize-image", name: "Resize Image", icon: "📐", cat: "image", short: "Resize dimensions in pixels" },
  { slug: "crop-image", name: "Crop Image", icon: "✂️", cat: "image", short: "Crop photos and pictures" },
  { slug: "passport-photo-maker", name: "Passport Photo Maker", icon: "🛂", cat: "image", short: "Official size photo maker" },
  { slug: "flac-to-mp3", name: "FLAC to MP3", icon: "🎧", cat: "media", short: "Convert audio to MP3" },
  { slug: "wav-to-mp3", name: "WAV to MP3", icon: "🎧", cat: "media", short: "High quality audio conversion" },
  { slug: "mp4-to-mp3", name: "MP4 to MP3", icon: "🎵", cat: "media", short: "Extract audio from video" },
  { slug: "video-to-gif", name: "Video to GIF", icon: "🎞️", cat: "media", short: "Convert MP4 video into GIF" },
  { slug: "excel-to-pdf", name: "Excel to PDF", icon: "📊", cat: "convert", short: "Convert spreadsheets to PDF" },
  { slug: "csv-to-xlsx", name: "CSV to XLSX", icon: "📈", cat: "convert", short: "Convert CSV to Excel" },
  { slug: "compound-interest-calculator", name: "Compound Interest", icon: "🧮", cat: "calc", short: "Calculate investment returns" },
  { slug: "mortgage-calculator", name: "Mortgage Calculator", icon: "🏠", cat: "calc", short: "Calculate monthly payments" }
];

const listEl = document.getElementById("list");
const srchEl = document.getElementById("srch");
const tabsEl = document.getElementById("tabs");

let currentCat = "all";

function render(items) {
  listEl.innerHTML = "";
  if (!items.length) {
    listEl.innerHTML = `<p style="padding:20px;text-align:center;color:#64748b;font-size:0.85rem">No tools found. <a href="https://fileopia.com/search/" target="_blank" style="color:#e5322d">Search all 2,780+ tools on Fileopia →</a></p>`;
    return;
  }

  for (const t of items) {
    const a = document.createElement("a");
    a.href = `https://fileopia.com/${t.slug}/`;
    a.className = "tool-link";
    a.target = "_blank";
    a.innerHTML = `
      <span class="tool-icon">${t.icon || "•"}</span>
      <div class="tool-info">
        <b>${t.name}</b>
        <small>${t.short || ""}</small>
      </div>
    `;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      if (chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url: a.href });
      } else {
        window.open(a.href, "_blank");
      }
    });
    listEl.appendChild(a);
  }
}

function filter() {
  const q = srchEl.value.trim().toLowerCase();
  let items = POPULAR_TOOLS;

  if (currentCat !== "all") {
    items = items.filter(t => t.cat === currentCat);
  }

  if (q) {
    items = POPULAR_TOOLS.filter(t => 
      t.name.toLowerCase().includes(q) || 
      (t.short && t.short.toLowerCase().includes(q)) ||
      t.slug.toLowerCase().includes(q)
    );
  }

  render(items);
}

srchEl.addEventListener("input", filter);

tabsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  tabsEl.querySelectorAll("button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  currentCat = btn.dataset.cat;
  srchEl.value = "";
  filter();
});

render(POPULAR_TOOLS);
