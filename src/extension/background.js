// Fileopia Chrome & Edge Extension – Service Worker (Manifest V3)

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "fp_home",
    title: "Fileopia: 100% Free File Tools",
    contexts: ["all"]
  });

  chrome.contextMenus.create({
    id: "fp_compress_pdf",
    parentId: "fp_home",
    title: "🗜️ Compress PDF (Local & Private)",
    contexts: ["all"]
  });

  chrome.contextMenus.create({
    id: "fp_merge_pdf",
    parentId: "fp_home",
    title: "📑 Merge PDFs",
    contexts: ["all"]
  });

  chrome.contextMenus.create({
    id: "fp_jpg_to_pdf",
    parentId: "fp_home",
    title: "🖼️ Image to PDF",
    contexts: ["all"]
  });

  chrome.contextMenus.create({
    id: "fp_pdf_to_word",
    parentId: "fp_home",
    title: "📄 PDF to Word (Editable)",
    contexts: ["all"]
  });

  chrome.contextMenus.create({
    id: "fp_search",
    parentId: "fp_home",
    title: "🔍 Search all 2,780+ Free Tools",
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  const routes = {
    fp_home: "https://fileopia.com/",
    fp_compress_pdf: "https://fileopia.com/compress-pdf/",
    fp_merge_pdf: "https://fileopia.com/merge-pdf/",
    fp_jpg_to_pdf: "https://fileopia.com/jpg-to-pdf/",
    fp_pdf_to_word: "https://fileopia.com/pdf-to-word/",
    fp_search: "https://fileopia.com/search/"
  };

  const target = routes[info.menuItemId] || "https://fileopia.com/";
  chrome.tabs.create({ url: target });
});
