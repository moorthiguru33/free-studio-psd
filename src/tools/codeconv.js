// Code & Structured Data Converter: JSON <-> YAML, XML <-> JSON, CSV -> SQL, and SVG Optimizer (SVGO).
// 100% in-browser processing with zero server dependencies.

function jsonToYaml(obj, indent = 0) {
  const pad = '  '.repeat(indent);
  if (obj === null || obj === undefined) return 'null\n';
  if (typeof obj === 'number' || typeof obj === 'boolean') return `${obj}\n`;
  if (typeof obj === 'string') {
    if (obj.includes('\n') || /[:#\[\]{},&*?|<>=!%@`]/.test(obj)) {
      return JSON.stringify(obj) + '\n';
    }
    return `${obj}\n`;
  }
  if (Array.isArray(obj)) {
    if (!obj.length) return '[]\n';
    let str = '';
    for (const item of obj) {
      if (typeof item === 'object' && item !== null) {
        const nested = jsonToYaml(item, indent + 1).trimStart();
        str += `${pad}- ${nested}`;
      } else {
        str += `${pad}- ${jsonToYaml(item, 0)}`;
      }
    }
    return str;
  }
  const keys = Object.keys(obj);
  if (!keys.length) return '{}\n';
  let str = '';
  for (const k of keys) {
    const val = obj[k];
    if (typeof val === 'object' && val !== null) {
      str += `${pad}${k}:\n${jsonToYaml(val, indent + 1)}`;
    } else {
      str += `${pad}${k}: ${jsonToYaml(val, 0)}`;
    }
  }
  return str;
}

function yamlToJson(yaml) {
  const lines = yaml.split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith('#'));
  // Lightweight key: value parser for common YAML configurations
  const root = {};
  for (const line of lines) {
    const m = line.match(/^(\s*)([\w.-]+)\s*:\s*(.*)$/);
    if (m) {
      const [, , key, rawVal] = m;
      let val = rawVal.trim();
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (val === 'null') val = null;
      else if (/^-?\d+(\.\d+)?$/.test(val)) val = parseFloat(val);
      else if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      root[key] = val;
    }
  }
  return root;
}

function xmlToJson(xml) {
  const dom = new DOMParser().parseFromString(xml, 'application/xml');
  if (dom.getElementsByTagName('parsererror').length) {
    throw new Error('Invalid XML document.');
  }

  function nodeToObj(node) {
    if (node.nodeType === 3) return node.textContent.trim();
    const obj = {};
    if (node.attributes && node.attributes.length) {
      obj['@attributes'] = {};
      for (const a of node.attributes) obj['@attributes'][a.name] = a.value;
    }
    for (const child of node.childNodes) {
      if (child.nodeType === 3) {
        const text = child.textContent.trim();
        if (text) {
          if (!Object.keys(obj).length) return text;
          obj['#text'] = text;
        }
      } else if (child.nodeType === 1) {
        const childName = child.nodeName;
        const childVal = nodeToObj(child);
        if (obj[childName] === undefined) {
          obj[childName] = childVal;
        } else {
          if (!Array.isArray(obj[childName])) obj[childName] = [obj[childName]];
          obj[childName].push(childVal);
        }
      }
    }
    return obj;
  }

  return { [dom.documentElement.nodeName]: nodeToObj(dom.documentElement) };
}

function jsonToXml(obj, rootName = 'root') {
  function objToXml(o, tag) {
    if (o === null || o === undefined) return `<${tag}/>`;
    if (typeof o !== 'object') return `<${tag}>${esc(String(o))}</${tag}>`;
    if (Array.isArray(o)) {
      return o.map(item => objToXml(item, tag)).join('\n');
    }
    let body = '';
    for (const [k, v] of Object.entries(o)) {
      if (k === '@attributes') continue;
      if (k === '#text') { body += esc(String(v)); continue; }
      body += objToXml(v, k);
    }
    let attrs = '';
    if (o['@attributes']) {
      attrs = Object.entries(o['@attributes']).map(([ak, av]) => ` ${ak}="${esc(String(av))}"`).join('');
    }
    return `<${tag}${attrs}>${body}</${tag}>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n${objToXml(obj, rootName)}`;
}

function csvToSql(csvText, tableName = 'my_table') {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) throw new Error('CSV is empty.');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').replace(/[^\w]/g, '_'));

  let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n  ` +
    headers.map(h => `\`${h}\` TEXT`).join(',\n  ') +
    `\n);\n\n`;

  const rows = lines.slice(1);
  for (const row of rows) {
    const cols = row.split(',').map(c => {
      let val = c.trim().replace(/^["']|["']$/g, '').replace(/'/g, "''");
      return `'${val}'`;
    });
    while (cols.length < headers.length) cols.push("''");
    sql += `INSERT INTO ${tableName} (\`${headers.join('`, `')}\`) VALUES (${cols.slice(0, headers.length).join(', ')});\n`;
  }
  return sql;
}

function parseCsvRows(text) {
  const rows = [];
  let row = [''];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (c === '"') {
        if (next === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        row[row.length - 1] += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push('');
      } else if (c === '\r') {
        // ignore
      } else if (c === '\n') {
        rows.push(row);
        row = [''];
      } else {
        row[row.length - 1] += c;
      }
    }
  }
  if (row.length > 1 || row[0] !== '') rows.push(row);
  return rows;
}

function csvToTsv(csvText) {
  const rows = parseCsvRows(csvText);
  return rows.map(r => r.map(c => c.replace(/\t/g, ' ')).join('\t')).join('\n');
}

function tsvToCsv(tsvText) {
  const lines = tsvText.split(/\r?\n/).filter(l => l.length > 0);
  return lines.map(line => {
    const cols = line.split('\t');
    return cols.map(c => {
      if (c.includes(',') || c.includes('"') || c.includes('\n')) {
        return '"' + c.replace(/"/g, '""') + '"';
      }
      return c;
    }).join(',');
  }).join('\n');
}

function optimizeSvg(svgText) {
  // SVG Minifier & Cleaner
  let svg = svgText
    .replace(/<!--[\s\S]*?-->/g, '') // remove comments
    .replace(/<\?xml[\s\S]*?\?>/i, '') // remove xml decl
    .replace(/<!DOCTYPE[\s\S]*?>/i, '') // remove doctype
    .replace(/\s+/g, ' ') // collapse whitespace
    .replace(/>\s+</g, '><') // remove whitespace between tags
    .replace(/\s*(xmlns:xlink="[^"]*")\s*/g, ' ')
    .replace(/\s*(version="[^"]*")\s*/g, ' ')
    .replace(/\s*(id="[a-zA-Z0-9_\-]*")\s*/g, ' ')
    .trim();
  return svg;
}

function htmlToMarkdown(html) {
  let cleaned = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '');

  if (typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(cleaned, 'text/html');
      if (doc && doc.body) {
        const md = walkNode(doc.body).trim();
        if (md) return md.replace(/\n{3,}/g, '\n\n');
      }
    } catch (e) {}
  }
  return regexHtmlToMd(cleaned);
}

function walkNode(node) {
  if (!node) return '';
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1) return '';

  const tag = node.tagName.toLowerCase();
  let inner = '';
  for (const child of node.childNodes) {
    inner += walkNode(child);
  }

  switch (tag) {
    case 'h1': return `\n\n# ${inner.trim()}\n\n`;
    case 'h2': return `\n\n## ${inner.trim()}\n\n`;
    case 'h3': return `\n\n### ${inner.trim()}\n\n`;
    case 'h4': return `\n\n#### ${inner.trim()}\n\n`;
    case 'h5': return `\n\n##### ${inner.trim()}\n\n`;
    case 'h6': return `\n\n###### ${inner.trim()}\n\n`;
    case 'strong':
    case 'b': return `**${inner.trim()}**`;
    case 'em':
    case 'i': return `*${inner.trim()}*`;
    case 'code':
      if (node.parentElement && node.parentElement.tagName.toLowerCase() === 'pre') return inner;
      return `\`${inner.trim()}\``;
    case 'pre': return `\n\n\`\`\`\n${inner.trim()}\n\`\`\`\n\n`;
    case 'blockquote': return `\n\n> ${inner.trim().replace(/\n/g, '\n> ')}\n\n`;
    case 'a': {
      const href = node.getAttribute('href') || '';
      return `[${inner.trim() || href}](${href})`;
    }
    case 'img': {
      const src = node.getAttribute('src') || '';
      const alt = node.getAttribute('alt') || 'image';
      return `![${alt}](${src})`;
    }
    case 'ul': return `\n\n${inner}\n\n`;
    case 'ol': {
      let idx = 1;
      let out = '\n\n';
      for (const li of node.children) {
        if (li.tagName && li.tagName.toLowerCase() === 'li') {
          out += `${idx++}. ${walkNode(li).trim()}\n`;
        }
      }
      return out + '\n';
    }
    case 'li': {
      if (node.parentElement && node.parentElement.tagName && node.parentElement.tagName.toLowerCase() === 'ol') {
        return inner;
      }
      return `- ${inner.trim()}\n`;
    }
    case 'hr': return '\n\n---\n\n';
    case 'br': return '\n';
    case 'p': return `\n\n${inner.trim()}\n\n`;
    default: return inner;
  }
}

function regexHtmlToMd(html) {
  return html
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n\n# $1\n\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n\n## $1\n\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n\n### $1\n\n')
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n\n#### $1\n\n')
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n\n$1\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function diffJson(obj1, obj2, path = '') {
  const diffs = [];

  function compare(val1, val2, currentPath) {
    if (val1 === val2) return;

    if (typeof val1 !== typeof val2 || val1 === null || val2 === null || Array.isArray(val1) !== Array.isArray(val2)) {
      diffs.push({ path: currentPath || 'root', type: 'changed', from: val1, to: val2 });
      return;
    }

    if (typeof val1 === 'object') {
      const keys1 = Object.keys(val1);
      const keys2 = Object.keys(val2);
      const allKeys = new Set([...keys1, ...keys2]);

      for (const k of allKeys) {
        const nextPath = currentPath ? `${currentPath}.${k}` : k;
        if (!(k in val2)) {
          diffs.push({ path: nextPath, type: 'removed', from: val1[k] });
        } else if (!(k in val1)) {
          diffs.push({ path: nextPath, type: 'added', to: val2[k] });
        } else {
          compare(val1[k], val2[k], nextPath);
        }
      }
      return;
    }

    diffs.push({ path: currentPath || 'root', type: 'changed', from: val1, to: val2 });
  }

  compare(obj1, obj2, path);
  return diffs;
}

TOOLS.codeconv = {
  opts() {
    const mode = (this.vars || {}).mode || 'json2yaml';
    if (mode === 'csv2sql') {
      return inp('sqltable', 'Database Table Name', 'text', 'records');
    }
    if (mode === 'svgopt') {
      return `<p class="hint">Clean metadata, comments, and collapse paths to minify SVG for web production.</p>`;
    }
    if (mode === 'html2md') {
      return `<p class="hint">Convert HTML markup into clean, readable Markdown syntax for documentation and notes.</p>`;
    }
    if (mode === 'jsondiff') {
      return `<p class="hint">Upload 2 JSON files to compare side-by-side (File 1 = Base/Original, File 2 = New/Modified).</p>`;
    }
    if (mode === 'csv2tsv') {
      return `<p class="hint">Convert Comma-Separated Values (CSV) to Tab-Separated Values (TSV) for spreadsheets and databases.</p>`;
    }
    if (mode === 'tsv2csv') {
      return `<p class="hint">Convert Tab-Separated Values (TSV) to standard Comma-Separated Values (CSV).</p>`;
    }
    if (mode === 'changedelimiter') {
      return sel('srcdelim', 'Source Delimiter', [
        ['auto', 'Auto-Detect Delimiter'],
        [',', 'Comma (,)'],
        [';', 'Semicolon (;)'],
        ['\t', 'Tab (\\t)'],
        ['|', 'Pipe (|)']
      ]) +
      sel('dstdelim', 'Target Delimiter', [
        [';', 'Semicolon (;)'],
        [',', 'Comma (,)'],
        ['\t', 'Tab (\\t)'],
        ['|', 'Pipe (|)']
      ]);
    }
    return '';
  },

  async run(files, status) {
    status(T.working || 'Processing code…');
    const mode = (this.vars || {}).mode || 'json2yaml';
    const file = files[0];
    const text = await file.text();
    const docName = base(file.name);

    if (mode === 'json2yaml') {
      const parsed = JSON.parse(text);
      const yaml = jsonToYaml(parsed);
      return {
        blob: new Blob([yaml], { type: 'text/yaml;charset=utf-8' }),
        name: docName + '.yaml',
        info: 'Converted JSON to YAML'
      };
    }

    if (mode === 'yaml2json') {
      const parsed = yamlToJson(text);
      const json = JSON.stringify(parsed, null, 2);
      return {
        blob: new Blob([json], { type: 'application/json;charset=utf-8' }),
        name: docName + '.json',
        info: 'Converted YAML to JSON'
      };
    }

    if (mode === 'xml2json') {
      const parsed = xmlToJson(text);
      const json = JSON.stringify(parsed, null, 2);
      return {
        blob: new Blob([json], { type: 'application/json;charset=utf-8' }),
        name: docName + '.json',
        info: 'Converted XML to JSON'
      };
    }

    if (mode === 'json2xml') {
      const parsed = JSON.parse(text);
      const xml = jsonToXml(parsed, docName);
      return {
        blob: new Blob([xml], { type: 'application/xml;charset=utf-8' }),
        name: docName + '.xml',
        info: 'Converted JSON to XML'
      };
    }

    if (mode === 'csv2sql') {
      const tbl = v('sqltable') || 'records';
      const sql = csvToSql(text, tbl);
      return {
        blob: new Blob([sql], { type: 'text/plain;charset=utf-8' }),
        name: docName + '.sql',
        info: `Generated SQL table and inserts for ${tbl}`
      };
    }

    if (mode === 'svgopt') {
      const optimized = optimizeSvg(text);
      const savings = Math.max(0, Math.round((1 - optimized.length / text.length) * 100));
      return {
        blob: new Blob([optimized], { type: 'image/svg+xml;charset=utf-8' }),
        name: docName + '_optimized.svg',
        info: `${savings}% size reduction (${fmtSize(text.length)} → ${fmtSize(optimized.length)})`
      };
    }

    if (mode === 'html2md') {
      const md = htmlToMarkdown(text);
      return {
        blob: new Blob([md], { type: 'text/markdown;charset=utf-8' }),
        name: docName + '.md',
        info: `Converted HTML to Markdown (${fmtSize(md.length)})`
      };
    }

    if (mode === 'jsondiff') {
      let json1, json2;
      let name1 = 'Original', name2 = 'Modified';
      if (files.length >= 2) {
        json1 = JSON.parse(await files[0].text());
        json2 = JSON.parse(await files[1].text());
        name1 = files[0].name;
        name2 = files[1].name;
      } else {
        const parsed = JSON.parse(text);
        if (parsed.original !== undefined && parsed.modified !== undefined) {
          json1 = parsed.original;
          json2 = parsed.modified;
        } else if (parsed.before !== undefined && parsed.after !== undefined) {
          json1 = parsed.before;
          json2 = parsed.after;
        } else {
          throw new Error('Please upload 2 JSON files to compare, or a JSON file with "original" and "modified" keys.');
        }
      }

      const diffs = diffJson(json1, json2);
      const added = diffs.filter(d => d.type === 'added');
      const removed = diffs.filter(d => d.type === 'removed');
      const changed = diffs.filter(d => d.type === 'changed');

      let report = `# JSON Difference Report\n\n`;
      report += `- **Original File:** ${name1}\n`;
      report += `- **Modified File:** ${name2}\n`;
      report += `- **Total Differences:** ${diffs.length} (${added.length} added, ${removed.length} removed, ${changed.length} changed)\n\n`;

      if (!diffs.length) {
        report += `### Result: Identical JSON\nBoth JSON files have exactly the same structure and values.\n`;
      } else {
        if (added.length) {
          report += `## 🟢 Added Keys (${added.length})\n`;
          for (const a of added) {
            report += `- \`${a.path}\`: \`${JSON.stringify(a.to)}\`\n`;
          }
          report += `\n`;
        }
        if (removed.length) {
          report += `## 🔴 Removed Keys (${removed.length})\n`;
          for (const r of removed) {
            report += `- \`${r.path}\`: \`${JSON.stringify(r.from)}\`\n`;
          }
          report += `\n`;
        }
        if (changed.length) {
          report += `## 🟡 Changed Values (${changed.length})\n`;
          for (const c of changed) {
            report += `- \`${c.path}\`:\n  - Old: \`${JSON.stringify(c.from)}\`\n  - New: \`${JSON.stringify(c.to)}\`\n`;
          }
          report += `\n`;
        }
      }

      const viewHtml = `
        <div style="background:var(--bg,#f8fafc);border:1px solid var(--border,#e2e8f0);border-radius:10px;padding:20px;margin-top:16px;text-align:left">
          <h3 style="margin-top:0">JSON Comparison Summary:</h3>
          <p>Differences found: <b>${diffs.length}</b> (🟢 ${added.length} added, 🔴 ${removed.length} removed, 🟡 ${changed.length} modified)</p>
          <pre style="max-height:300px;overflow:auto;background:#fff;padding:12px;border:1px solid #e2e8f0;border-radius:6px;font-size:0.9rem">${esc(report)}</pre>
        </div>
      `;

      return {
        blob: new Blob([report], { type: 'text/markdown;charset=utf-8' }),
        name: `${base(files[0].name)}_diff.md`,
        info: diffs.length ? `${diffs.length} differences detected` : 'JSON files are identical',
        view: viewHtml
      };
    }

    if (mode === 'csv2tsv') {
      const tsv = csvToTsv(text);
      return {
        blob: new Blob([tsv], { type: 'text/tab-separated-values;charset=utf-8' }),
        name: docName + '.tsv',
        info: `Converted CSV to TSV (${fmtSize(tsv.length)})`
      };
    }

    if (mode === 'tsv2csv') {
      const csv = tsvToCsv(text);
      return {
        blob: new Blob([csv], { type: 'text/csv;charset=utf-8' }),
        name: docName + '.csv',
        info: `Converted TSV to CSV (${fmtSize(csv.length)})`
      };
    }

    if (mode === 'changedelimiter') {
      let srcDelim = v('srcdelim') || 'auto';
      const dstDelim = v('dstdelim') || ';';

      if (srcDelim === 'auto') {
        const firstLine = text.split(/\r?\n/)[0] || '';
        const commas = (firstLine.match(/,/g) || []).length;
        const semis = (firstLine.match(/;/g) || []).length;
        const tabs = (firstLine.match(/\t/g) || []).length;
        const pipes = (firstLine.match(/\|/g) || []).length;
        const max = Math.max(commas, semis, tabs, pipes);
        if (max === semis && semis > 0) srcDelim = ';';
        else if (max === tabs && tabs > 0) srcDelim = '\t';
        else if (max === pipes && pipes > 0) srcDelim = '|';
        else srcDelim = ',';
      }

      let rows;
      if (typeof window !== 'undefined' && window.Papa) {
        rows = window.Papa.parse(text, { delimiter: srcDelim }).data;
      } else {
        rows = text.split(/\r?\n/).filter(Boolean).map(l => l.split(srcDelim));
      }

      const out = rows.map(r => r.map(c => {
        const str = String(c ?? '');
        if (str.includes(dstDelim) || str.includes(srcDelim) || str.includes('"') || str.includes('\n') || str.includes(',') || str.includes(';')) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      }).join(dstDelim)).join('\n');

      const ext = dstDelim === '\t' ? '.tsv' : '.csv';
      return {
        blob: new Blob([out], { type: 'text/csv;charset=utf-8' }),
        name: docName + '_converted' + ext,
        info: `Changed delimiter to "${dstDelim === '\t' ? '\\t' : dstDelim}" (${rows.length} rows)`,
        view: `<textarea readonly rows="8" style="width:100%;font-family:monospace;padding:8px">${esc(out.slice(0, 5000))}</textarea>`
      };
    }

    throw new Error('Unsupported mode: ' + mode);
  }
};
