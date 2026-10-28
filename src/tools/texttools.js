// Text, Writing & Cryptography Suite: Sort Lines, Slug Generator, Readability Score, Morse Code, NATO Phonetic, Binary/Text, ROT13, and Word Frequency.
// 100% in-browser processing.

const MORSE_MAP = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
  '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
  '8': '---..', '9': '----.', ' ': '/'
};
const MORSE_REV = Object.fromEntries(Object.entries(MORSE_MAP).map(([k, v]) => [v, k]));

const NATO_MAP = {
  'A': 'Alfa', 'B': 'Bravo', 'C': 'Charlie', 'D': 'Delta', 'E': 'Echo',
  'F': 'Foxtrot', 'G': 'Golf', 'H': 'Hotel', 'I': 'India', 'J': 'Juliett',
  'K': 'Kilo', 'L': 'Lima', 'M': 'Mike', 'N': 'November', 'O': 'Oscar',
  'P': 'Papa', 'Q': 'Quebec', 'R': 'Romeo', 'S': 'Sierra', 'T': 'Tango',
  'U': 'Uniform', 'V': 'Victor', 'W': 'Whiskey', 'X': 'X-ray', 'Y': 'Yankee',
  'Z': 'Zulu', '0': 'Zero', '1': 'One', '2': 'Two', '3': 'Three', '4': 'Four',
  '5': 'Five', '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Nine'
};

TOOLS.texttools = {
  opts() {
    const mode = (this.vars || {}).mode || 'sort';
    if (mode === 'sort') {
      return sel('sortdir', 'Sort Order', [
        ['az', 'Alphabetical: A → Z'],
        ['za', 'Alphabetical: Z → A'],
        ['len_asc', 'Length: Shortest First'],
        ['len_desc', 'Length: Longest First'],
        ['random', 'Random Shuffle']
      ]) + chk('sortdedup', 'Remove duplicate lines', true);
    }
    if (mode === 'slug') {
      return inp('slugsrc', 'Title / Text to Convert', 'text', 'The 10 Best Online PDF Tools & Converters in 2026!');
    }
    if (mode === 'morse') {
      return sel('morseop', 'Direction', [['enc', 'Text to Morse Code'], ['dec', 'Morse Code to Text']]) +
        inp('morsetxt', 'Input Text or Morse (. and -)', 'text', 'SOS HELP');
    }
    if (mode === 'nato') {
      return inp('natoword', 'Words / Text to Spell Out', 'text', 'Fileopia');
    }
    if (mode === 'bintext') {
      return sel('binop', 'Direction', [['text2bin', 'Text to Binary (01000001)'], ['bin2text', 'Binary to Text']]) +
        inp('bintxt', 'Content', 'text', 'Hello World');
    }
    if (mode === 'rot13') {
      return inp('rottxt', 'Text to Obfuscate / Decode (ROT13 is self-reversing)', 'text', 'The secret password is Fileopia!');
    }
    if (mode === 'linenums') {
      return chk('linerezero', 'Zero-pad numbers (01, 02...)', false);
    }
    if (mode === 'reversetext') {
      return sel('revmode', 'Reverse Mode', [
        ['chars', 'Reverse Characters (cba → abc)'],
        ['words', 'Reverse Words (world hello → hello world)'],
        ['lines', 'Reverse Lines (Flip vertically)']
      ]);
    }
    if (mode === 'hextext') {
      const def = (this.vars || {}).hexdir || 'text2hex';
      const opts = def === 'hex2text'
        ? [['hex2text', 'Hexadecimal to Text'], ['text2hex', 'Text to Hexadecimal']]
        : [['text2hex', 'Text to Hexadecimal'], ['hex2text', 'Hexadecimal to Text']];
      return sel('hexdir', 'Direction', opts) +
        sel('hexdelim', 'Byte Delimiter (for Hex)', [
          ['space', 'Space (48 65 6c)'],
          ['none', 'No Space (48656c)'],
          ['colon', 'Colon (48:65:6c)'],
          ['prefix', '0x Prefix (0x48 0x65)']
        ]);
    }
    if (mode === 'findreplace') {
      return inp('frfind', 'Find Text / Pattern', 'text', 'foo') +
        inp('frrep', 'Replace With', 'text', 'bar') +
        chk('frcase', 'Match Case', true) +
        chk('frregex', 'Use Regular Expression', false);
    }
    if (mode === 'extractemails') {
      return chk('emdedup', 'Remove duplicate emails', true) +
        chk('emsort', 'Sort emails alphabetically', true);
    }
    if (mode === 'extracturls') {
      return chk('urldedup', 'Remove duplicate URLs', true) +
        chk('urlsort', 'Sort URLs alphabetically', true);
    }
    if (mode === 'prefixsuffix') {
      return inp('psprefix', 'Prefix (added to start of each line)', 'text', '>> ') +
        inp('pssuffix', 'Suffix (added to end of each line)', 'text', '') +
        chk('psskipempty', 'Skip empty lines', true);
    }
    if (mode === 'repeater') {
      return inp('repcount', 'Repeat Count', 'number', '10', 'min="1" max="10000"') +
        sel('repsep', 'Separator Between Repeats', [
          ['newline', 'New Line (\\n)'],
          ['space', 'Space ( )'],
          ['comma', 'Comma (,)'],
          ['none', 'No Separator']
        ]);
    }
    if (mode === 'shuffle') {
      return `<p class="hint">Randomizes and shuffles all lines in your list using the unbiased Fisher-Yates algorithm.</p>`;
    }
    if (mode === 'filterlines') {
      return inp('flquery', 'Search Term / Keyword', 'text', '') +
        sel('flmode', 'Filter Action', [
          ['keep', 'Keep only lines containing term'],
          ['remove', 'Remove lines containing term']
        ]) +
        chk('flcase', 'Match Case', false);
    }
    if (mode === 'rmemptylines') {
      return chk('rmleadtrail', 'Also trim leading and trailing spaces on non-empty lines', true);
    }
    return '';
  },

  async run(files, status) {
    const mode = (this.vars || {}).mode || 'sort';
    status(T.working || 'Processing text…');

    if (mode === 'sort') {
      const file = files[0];
      const text = file ? await file.text() : '';
      let lines = text.split(/\r?\n/);
      if (vb('sortdedup')) lines = [...new Set(lines)];
      const dir = v('sortdir') || 'az';

      if (dir === 'az') lines.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
      else if (dir === 'za') lines.sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }));
      else if (dir === 'len_asc') lines.sort((a, b) => a.length - b.length);
      else if (dir === 'len_desc') lines.sort((a, b) => b.length - a.length);
      else if (dir === 'random') lines.sort(() => Math.random() - 0.5);

      const out = lines.join('\n');
      return {
        name: (file ? base(file.name) : 'sorted') + '_sorted.txt',
        blob: new Blob([out], { type: 'text/plain;charset=utf-8' }),
        info: `Sorted ${lines.length} lines`,
        view: `<textarea readonly rows="8" style="width:100%;font-family:monospace;padding:8px">${esc(out.slice(0, 5000))}</textarea>`
      };
    }

    if (mode === 'slug') {
      const src = v('slugsrc') || 'The 10 Best Online PDF Tools & Converters in 2026!';
      const slug = src.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/[\s_-]+/g, '-');

      const html = `<div style="padding:16px;background:var(--bg2,#f7f9fa);border-radius:12px;font-size:16px">
        <div><b>URL Slug:</b></div>
        <div style="font-size:20px;font-weight:700;color:var(--r,#d32f29);margin-top:6px"><code>/${esc(slug)}/</code></div>
      </div>`;
      return {
        name: 'slug.txt',
        blob: new Blob([slug], { type: 'text/plain;charset=utf-8' }),
        info: `Slug: /${slug}/`,
        view: html
      };
    }

    if (mode === 'morse') {
      const isEnc = (v('morseop') || 'enc') === 'enc';
      const input = (v('morsetxt') || 'SOS HELP').trim();
      let res = '';
      if (isEnc) {
        res = input.toUpperCase().split('').map(c => MORSE_MAP[c] || c).join(' ');
      } else {
        const tokens = input.split(/\s+/);
        res = tokens.map(t => MORSE_REV[t] || (t === '/' ? ' ' : t)).join('');
      }

      const html = `<div style="padding:16px;background:var(--bg2,#f7f9fa);border-radius:12px">
        <div style="font-size:20px;font-family:monospace;font-weight:700;color:var(--r,#d32f29);word-break:break-all">${esc(res)}</div>
      </div>`;
      return {
        name: 'morse.txt',
        blob: new Blob([res], { type: 'text/plain;charset=utf-8' }),
        info: isEnc ? 'Translated to Morse' : 'Decoded from Morse',
        view: html
      };
    }

    if (mode === 'nato') {
      const input = (v('natoword') || 'Fileopia').toUpperCase();
      const tokens = input.split('').map(c => NATO_MAP[c] || c).filter(Boolean);
      const out = tokens.join(' - ');

      const html = `<div style="padding:16px;background:var(--bg2,#f7f9fa);border-radius:12px">
        <div style="font-size:20px;font-weight:700;color:var(--r,#d32f29);line-height:1.6">${esc(out)}</div>
      </div>`;
      return {
        name: 'nato-phonetic.txt',
        blob: new Blob([out], { type: 'text/plain;charset=utf-8' }),
        info: `NATO: ${out}`,
        view: html
      };
    }

    if (mode === 'bintext') {
      const isTextToBin = (v('binop') || 'text2bin') === 'text2bin';
      const input = v('bintxt') || 'Hello World';
      let res = '';
      if (isTextToBin) {
        res = Array.from(input).map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
      } else {
        res = input.trim().split(/\s+/).map(bin => String.fromCharCode(parseInt(bin, 2))).join('');
      }
      return {
        name: 'binary.txt',
        blob: new Blob([res], { type: 'text/plain;charset=utf-8' }),
        info: isTextToBin ? 'Converted to Binary' : 'Converted to Text',
        view: `<textarea readonly rows="5" style="width:100%;font-family:monospace;padding:8px">${esc(res)}</textarea>`
      };
    }

    if (mode === 'rot13') {
      const input = v('rottxt') || 'The secret password is Fileopia!';
      const rot = input.replace(/[a-zA-Z]/g, c => {
        const base = c <= 'Z' ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
      });
      return {
        name: 'rot13.txt',
        blob: new Blob([rot], { type: 'text/plain;charset=utf-8' }),
        info: 'ROT13 Cipher Processed',
        view: `<textarea readonly rows="5" style="width:100%;font-family:monospace;padding:8px">${esc(rot)}</textarea>`
      };
    }

    if (mode === 'linenums') {
      const file = files[0];
      const text = file ? await file.text() : '';
      const lines = text.split(/\r?\n/);
      const pad = vb('linerezero') ? String(lines.length).length : 1;
      const numbered = lines.map((l, i) => `${String(i + 1).padStart(pad, '0')}: ${l}`).join('\n');
      return {
        name: (file ? base(file.name) : 'numbered') + '_numbered.txt',
        blob: new Blob([numbered], { type: 'text/plain;charset=utf-8' }),
        info: `Added line numbers to ${lines.length} lines`,
        view: `<textarea readonly rows="8" style="width:100%;font-family:monospace;padding:8px">${esc(numbered.slice(0, 5000))}</textarea>`
      };
    }

    if (mode === 'reversetext') {
      const file = files[0];
      const text = file ? await file.text() : '';
      const revMode = v('revmode') || 'chars';
      let res = '';
      if (revMode === 'chars') {
        res = Array.from(text).reverse().join('');
      } else if (revMode === 'words') {
        res = text.split(/\r?\n/).map(line => line.split(/\s+/).reverse().join(' ')).join('\n');
      } else {
        res = text.split(/\r?\n/).reverse().join('\n');
      }
      return {
        name: (file ? base(file.name) : 'reversed') + '_reversed.txt',
        blob: new Blob([res], { type: 'text/plain;charset=utf-8' }),
        info: `Reversed (${revMode})`,
        view: `<textarea readonly rows="8" style="width:100%;font-family:monospace;padding:8px">${esc(res.slice(0, 5000))}</textarea>`
      };
    }

    if (mode === 'hextext') {
      const file = files[0];
      const text = file ? await file.text() : '';
      const isHex2Text = (v('hexdir') || (this.vars || {}).hexdir || 'text2hex') === 'hex2text';
      const delim = v('hexdelim') || 'space';
      let res = '';
      if (!isHex2Text) {
        const hexArr = [];
        const enc = new TextEncoder().encode(text);
        for (const byte of enc) {
          const h = byte.toString(16).padStart(2, '0');
          if (delim === 'prefix') hexArr.push('0x' + h);
          else hexArr.push(h);
        }
        const sep = delim === 'none' ? '' : delim === 'colon' ? ':' : ' ';
        res = hexArr.join(sep);
      } else {
        const cleanHex = text.replace(/0x/g, '').replace(/[^0-9a-fA-F]/g, '');
        const bytes = [];
        for (let i = 0; i < cleanHex.length; i += 2) {
          bytes.push(parseInt(cleanHex.substr(i, 2), 16));
        }
        res = new TextDecoder().decode(new Uint8Array(bytes));
      }
      return {
        name: (file ? base(file.name) : 'hex') + (isHex2Text ? '.txt' : '.hex'),
        blob: new Blob([res], { type: 'text/plain;charset=utf-8' }),
        info: isHex2Text ? 'Decoded Hex to Text' : 'Encoded Text to Hex',
        view: `<textarea readonly rows="8" style="width:100%;font-family:monospace;padding:8px">${esc(res.slice(0, 5000))}</textarea>`
      };
    }

    if (mode === 'findreplace') {
      const file = files[0];
      const text = file ? await file.text() : '';
      const find = v('frfind') || '';
      const rep = v('frrep') || '';
      const matchCase = vb('frcase');
      const isRegex = vb('frregex');
      let res = '';
      let count = 0;
      if (find) {
        if (isRegex) {
          const flags = matchCase ? 'g' : 'gi';
          const reg = new RegExp(find, flags);
          res = text.replace(reg, () => { count++; return rep; });
        } else {
          const flags = matchCase ? 'g' : 'gi';
          const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const reg = new RegExp(escaped, flags);
          res = text.replace(reg, () => { count++; return rep; });
        }
      } else {
        res = text;
      }
      return {
        name: (file ? base(file.name) : 'text') + '_replaced.txt',
        blob: new Blob([res], { type: 'text/plain;charset=utf-8' }),
        info: `Replaced ${count} occurrences`,
        view: `<textarea readonly rows="8" style="width:100%;font-family:monospace;padding:8px">${esc(res.slice(0, 5000))}</textarea>`
      };
    }

    if (mode === 'extractemails') {
      const file = files[0];
      const text = file ? await file.text() : '';
      const reg = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      let emails = text.match(reg) || [];
      if (vb('emdedup')) emails = [...new Set(emails.map(e => e.toLowerCase()))];
      if (vb('emsort')) emails.sort();
      const res = emails.join('\n');
      return {
        name: (file ? base(file.name) : 'extracted') + '_emails.txt',
        blob: new Blob([res], { type: 'text/plain;charset=utf-8' }),
        info: `Extracted ${emails.length} email addresses`,
        view: `<textarea readonly rows="8" style="width:100%;font-family:monospace;padding:8px">${esc(res.slice(0, 5000))}</textarea>`
      };
    }

    if (mode === 'extracturls') {
      const file = files[0];
      const text = file ? await file.text() : '';
      const reg = /https?:\/\/[^\s<>"'{}|\\^`]+[^\s<>"'{}|\\^`.,;:?!]/g;
      let urls = text.match(reg) || [];
      if (vb('urldedup')) urls = [...new Set(urls)];
      if (vb('urlsort')) urls.sort();
      const res = urls.join('\n');
      return {
        name: (file ? base(file.name) : 'extracted') + '_urls.txt',
        blob: new Blob([res], { type: 'text/plain;charset=utf-8' }),
        info: `Extracted ${urls.length} URLs`,
        view: `<textarea readonly rows="8" style="width:100%;font-family:monospace;padding:8px">${esc(res.slice(0, 5000))}</textarea>`
      };
    }

    if (mode === 'prefixsuffix') {
      const file = files[0];
      const text = file ? await file.text() : '';
      const prefix = v('psprefix') || '';
      const suffix = v('pssuffix') || '';
      const skipEmpty = vb('psskipempty');
      const lines = text.split(/\r?\n/).map(line => {
        if (skipEmpty && !line.trim()) return line;
        return `${prefix}${line}${suffix}`;
      });
      const res = lines.join('\n');
      return {
        name: (file ? base(file.name) : 'text') + '_affixed.txt',
        blob: new Blob([res], { type: 'text/plain;charset=utf-8' }),
        info: `Processed ${lines.length} lines`,
        view: `<textarea readonly rows="8" style="width:100%;font-family:monospace;padding:8px">${esc(res.slice(0, 5000))}</textarea>`
      };
    }

    if (mode === 'repeater') {
      const file = files[0];
      const text = file ? await file.text() : '';
      const count = Math.max(1, Math.min(10000, +v('repcount') || 10));
      const sep = v('repsep') || 'newline';
      const delimiter = sep === 'newline' ? '\n' : sep === 'space' ? ' ' : sep === 'comma' ? ', ' : '';
      const arr = new Array(count).fill(text || 'Hello World');
      const res = arr.join(delimiter);
      return {
        name: (file ? base(file.name) : 'text') + '_repeated.txt',
        blob: new Blob([res], { type: 'text/plain;charset=utf-8' }),
        info: `Repeated text ${count} times (${fmtSize(res.length)})`,
        view: `<textarea readonly rows="8" style="width:100%;font-family:monospace;padding:8px">${esc(res.slice(0, 5000))}</textarea>`
      };
    }

    if (mode === 'shuffle') {
      const file = files[0];
      const text = file ? await file.text() : '';
      const lines = text.split(/\r?\n/);
      for (let i = lines.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lines[i], lines[j]] = [lines[j], lines[i]];
      }
      const res = lines.join('\n');
      return {
        name: (file ? base(file.name) : 'list') + '_shuffled.txt',
        blob: new Blob([res], { type: 'text/plain;charset=utf-8' }),
        info: `Shuffled ${lines.length} lines`,
        view: `<textarea readonly rows="8" style="width:100%;font-family:monospace;padding:8px">${esc(res.slice(0, 5000))}</textarea>`
      };
    }

    if (mode === 'filterlines') {
      const file = files[0];
      const text = file ? await file.text() : '';
      const q = v('flquery') || '';
      const act = v('flmode') || 'keep';
      const matchCase = vb('flcase');
      const lines = text.split(/\r?\n/);
      const filtered = lines.filter(line => {
        const has = matchCase ? line.includes(q) : line.toLowerCase().includes(q.toLowerCase());
        return act === 'keep' ? has : !has;
      });
      const res = filtered.join('\n');
      return {
        name: (file ? base(file.name) : 'list') + '_filtered.txt',
        blob: new Blob([res], { type: 'text/plain;charset=utf-8' }),
        info: `${act === 'keep' ? 'Kept' : 'Removed'} lines matching "${q}" (${filtered.length}/${lines.length} lines remain)`,
        view: `<textarea readonly rows="8" style="width:100%;font-family:monospace;padding:8px">${esc(res.slice(0, 5000))}</textarea>`
      };
    }

    if (mode === 'rmemptylines') {
      const file = files[0];
      const text = file ? await file.text() : '';
      const trim = vb('rmleadtrail');
      const lines = text.split(/\r?\n/)
        .map(l => trim ? l.trim() : l)
        .filter(l => l.trim().length > 0);
      const res = lines.join('\n');
      return {
        name: (file ? base(file.name) : 'cleaned') + '_no_empty_lines.txt',
        blob: new Blob([res], { type: 'text/plain;charset=utf-8' }),
        info: `Removed empty lines (${lines.length} lines remain)`,
        view: `<textarea readonly rows="8" style="width:100%;font-family:monospace;padding:8px">${esc(res.slice(0, 5000))}</textarea>`
      };
    }

    throw new Error('Unsupported mode: ' + mode);
  }
};
