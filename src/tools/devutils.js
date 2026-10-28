// Developer & Webmaster Suite: JWT Decoder, Cron Generator, Chmod Calculator, CIDR Calculator, CSS Generators, Markdown/HTML, and Color Contrast.
// 100% in-browser processing with zero server requests.

TOOLS.devutils = {
  opts() {
    const mode = (this.vars || {}).mode || 'jwt';
    if (mode === 'jwt') {
      return inp('jwttok', 'Paste JWT Token (Header.Payload.Signature)', 'text', '', 'placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."');
    }
    if (mode === 'cron') {
      return inp('cronexp', 'Cron Expression (5 fields)', 'text', '*/15 * * * *', 'placeholder="*/15 * * * *"');
    }
    if (mode === 'chmod') {
      return inp('chmodval', 'Permission Value (e.g. 755, 644, or rwxr-xr-x)', 'text', '755', 'placeholder="755"');
    }
    if (mode === 'cidr') {
      return inp('cidrip', 'IP Address with CIDR (e.g. 192.168.1.0/24)', 'text', '192.168.1.0/24', 'placeholder="192.168.1.0/24"');
    }
    if (mode === 'entities') {
      return sel('entmode', 'Mode', [['encode', 'Encode to HTML Entities (&amp;, &lt;)'], ['decode', 'Decode HTML Entities to Text']]) +
        inp('enttxt', 'Text', 'text', '<h1>Hello & Welcome!</h1>');
    }
    if (mode === 'contrast') {
      return `<div class="row2">${inp('colfg', 'Foreground / Text Color', 'color', '#000000')}${inp('colbg', 'Background Color', 'color', '#ffffff')}</div>`;
    }
    if (mode === 'boxshadow') {
      return `<div class="row2">${inp('bsx', 'X Offset (px)', 'number', '4')}${inp('bsy', 'Y Offset (px)', 'number', '8')}</div>` +
        `<div class="row2">${inp('bsblur', 'Blur (px)', 'number', '16')}${inp('bsspr', 'Spread (px)', 'number', '0')}</div>` +
        inp('bscol', 'Shadow Color', 'color', '#000000');
    }
    if (mode === 'gradient') {
      return `<div class="row2">${inp('gr1', 'Color 1', 'color', '#ff416c')}${inp('gr2', 'Color 2', 'color', '#ff4b2b')}</div>` +
        sel('grtype', 'Type & Direction', [
          ['to right', 'Linear: Left to Right'],
          ['to bottom', 'Linear: Top to Bottom'],
          ['135deg', 'Linear: 135° Diagonal'],
          ['circle', 'Radial: Circle from Center']
        ]);
    }
    if (mode === 'mdhtml') {
      return inp('mdtxt', 'Markdown Text', 'text', '# Welcome to Fileopia\n\nThis is **bold** and *italic* text.\n\n- Feature 1\n- Feature 2');
    }
    if (mode === 'sqlfmt') {
      return inp('sqlinp', 'SQL Query to Format', 'text', 'SELECT u.id, u.name, o.total FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE o.total > 100 ORDER BY o.total DESC;');
    }
    if (mode === 'ua') {
      return inp('uatxt', 'User-Agent String (Blank = Your Current Browser)', 'text', navigator.userAgent);
    }
    if (mode === 'pwgen') {
      return inp('pwlen', 'Password Length (Characters)', 'number', '16', 'min="6" max="64"') +
        chk('pwupper', 'Uppercase Letters (A-Z)', true) +
        chk('pwlower', 'Lowercase Letters (a-z)', true) +
        chk('pwnums', 'Numbers (0-9)', true) +
        chk('pwsyms', 'Symbols (!@#$%^&*...)', true) +
        chk('pwnoambig', 'Exclude Ambiguous Characters (l, 1, I, O, 0)', false) +
        inp('pwcount', 'How many passwords to generate', 'number', '5', 'min="1" max="50"');
    }
    return '';
  },

  async run(files, status) {
    const mode = (this.vars || {}).mode || 'jwt';
    status(T.working || 'Processing developer utility…');

    if (mode === 'jwt') {
      const raw = (v('jwttok') || '').trim();
      if (!raw) throw new Error('Please paste a JWT token to decode.');
      const parts = raw.split('.');
      if (parts.length < 2) throw new Error('Invalid JWT: must contain at least Header and Payload parts separated by dots.');
      const b64 = s => {
        let b = s.replace(/-/g, '+').replace(/_/g, '/');
        while (b.length % 4) b += '=';
        return decodeURIComponent(escape(atob(b)));
      };
      let header = {}, payload = {};
      try { header = JSON.parse(b64(parts[0])); } catch(e) { header = { error: 'Could not decode header' }; }
      try { payload = JSON.parse(b64(parts[1])); } catch(e) { payload = { error: 'Could not decode payload' }; }

      const expDate = payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'No expiration claim';
      const isExpired = payload.exp ? (Date.now() > payload.exp * 1000) : false;

      const html = `<div style="font-family:monospace;font-size:13px;background:var(--bg2,#f7f9fa);padding:14px;border-radius:10px;line-height:1.6">
        <div style="margin-bottom:8px"><b>Algorithm &amp; Token Type (Header):</b></div>
        <pre style="background:#222;color:#ff77aa;padding:10px;border-radius:6px;overflow-x:auto;margin:4px 0 12px">${esc(JSON.stringify(header, null, 2))}</pre>
        <div style="margin-bottom:8px"><b>Decoded Claims (Payload):</b></div>
        <pre style="background:#222;color:#66d9ef;padding:10px;border-radius:6px;overflow-x:auto;margin:4px 0 12px">${esc(JSON.stringify(payload, null, 2))}</pre>
        <div style="padding:8px 12px;background:#fff;border:1px solid #ddd;border-radius:6px">
          <b>Expiration Status:</b> ${isExpired ? '<span style="color:#e5322d;font-weight:700">Expired (' + expDate + ')</span>' : '<span style="color:#0f9d58;font-weight:700">Valid / Not Expired (' + expDate + ')</span>'}
        </div>
      </div>`;
      return {
        name: 'jwt-decoded.json',
        blob: new Blob([JSON.stringify({ header, payload }, null, 2)], { type: 'application/json' }),
        info: `JWT Decoded: ${header.alg || 'JWT'}`,
        view: html
      };
    }

    if (mode === 'cron') {
      const exp = (v('cronexp') || '*/15 * * * *').trim();
      const parts = exp.split(/\s+/);
      if (parts.length < 5) throw new Error('Cron expression requires 5 fields: minute, hour, day of month, month, day of week.');
      const [min, hr, dom, mon, dow] = parts;
      const explain = `Minute: ${min} | Hour: ${hr} | Day of Month: ${dom} | Month: ${mon} | Day of Week: ${dow}`;
      const html = `<div style="padding:14px;background:var(--bg2,#f7f9fa);border-radius:10px;font-size:14px;line-height:1.6">
        <div style="font-size:18px;font-weight:700;color:var(--r,#d32f29);margin-bottom:8px"><code>${esc(exp)}</code></div>
        <p style="margin:0 0 10px"><b>Schedule Explanation:</b></p>
        <ul style="margin:0;padding-left:20px">
          <li><b>Minute (${min}):</b> ${min === '*' ? 'Every minute' : min.startsWith('*/') ? 'Every ' + min.slice(2) + ' minutes' : 'At minute ' + min}</li>
          <li><b>Hour (${hr}):</b> ${hr === '*' ? 'Every hour' : hr.startsWith('*/') ? 'Every ' + hr.slice(2) + ' hours' : 'At ' + hr + ':00'}</li>
          <li><b>Day of Month (${dom}):</b> ${dom === '*' ? 'Every day of the month' : 'On day ' + dom}</li>
          <li><b>Month (${mon}):</b> ${mon === '*' ? 'Every month' : 'In month ' + mon}</li>
          <li><b>Day of Week (${dow}):</b> ${dow === '*' ? 'Every day of the week' : 'On day ' + dow + ' (0=Sun, 6=Sat)'}</li>
        </ul>
      </div>`;
      return {
        name: 'cron.txt',
        blob: new Blob([`${exp}\n${explain}`], { type: 'text/plain' }),
        info: `Cron: ${exp}`,
        view: html
      };
    }

    if (mode === 'chmod') {
      const val = (v('chmodval') || '755').trim();
      let num = 755;
      if (/^\d{3,4}$/.test(val)) num = parseInt(val.slice(-3), 10);
      const digits = String(num).padStart(3, '0').split('').map(Number);
      const permStr = (n) => ((n & 4 ? 'r' : '-') + (n & 2 ? 'w' : '-') + (n & 1 ? 'x' : '-'));
      const sym = permStr(digits[0]) + permStr(digits[1]) + permStr(digits[2]);

      const html = `<div style="padding:14px;background:var(--bg2,#f7f9fa);border-radius:10px;font-size:14px;line-height:1.6">
        <div style="font-size:22px;font-weight:700;color:var(--r,#d32f29);margin-bottom:8px"><code>chmod ${digits.join('')} (${sym})</code></div>
        <ul style="margin:0;padding-left:20px">
          <li><b>Owner (${digits[0]}):</b> ${digits[0] & 4 ? 'Read, ' : ''}${digits[0] & 2 ? 'Write, ' : ''}${digits[0] & 1 ? 'Execute' : 'No execution'}</li>
          <li><b>Group (${digits[1]}):</b> ${digits[1] & 4 ? 'Read, ' : ''}${digits[1] & 2 ? 'Write, ' : ''}${digits[1] & 1 ? 'Execute' : 'No execution'}</li>
          <li><b>Public / Others (${digits[2]}):</b> ${digits[2] & 4 ? 'Read, ' : ''}${digits[2] & 2 ? 'Write, ' : ''}${digits[2] & 1 ? 'Execute' : 'No execution'}</li>
        </ul>
      </div>`;
      return {
        name: 'chmod.txt',
        blob: new Blob([`chmod ${digits.join('')} file.txt # ${sym}`], { type: 'text/plain' }),
        info: `chmod ${digits.join('')} → ${sym}`,
        view: html
      };
    }

    if (mode === 'cidr') {
      const raw = (v('cidrip') || '192.168.1.0/24').trim();
      const [ip, maskStr] = raw.split('/');
      const mask = parseInt(maskStr || '24', 10);
      const totalHosts = Math.pow(2, 32 - mask);
      const usableHosts = mask >= 31 ? totalHosts : Math.max(0, totalHosts - 2);

      const html = `<div style="padding:14px;background:var(--bg2,#f7f9fa);border-radius:10px;font-size:14px;line-height:1.6">
        <div style="font-size:18px;font-weight:700;color:var(--r,#d32f29);margin-bottom:8px">CIDR Subnet: ${esc(raw)}</div>
        <ul style="margin:0;padding-left:20px">
          <li><b>Network IP:</b> ${esc(ip)}</li>
          <li><b>CIDR Mask:</b> /${mask}</li>
          <li><b>Total IP Addresses:</b> ${totalHosts.toLocaleString()}</li>
          <li><b>Usable Host Range:</b> ${usableHosts.toLocaleString()} available hosts</li>
        </ul>
      </div>`;
      return {
        name: 'subnet.txt',
        blob: new Blob([`CIDR: ${raw}\nTotal IPs: ${totalHosts}\nUsable: ${usableHosts}`], { type: 'text/plain' }),
        info: `${raw}: ${usableHosts.toLocaleString()} usable hosts`,
        view: html
      };
    }

    if (mode === 'entities') {
      const isEncode = (v('entmode') || 'encode') === 'encode';
      const input = v('enttxt') || '';
      let res = '';
      if (isEncode) {
        res = input.replace(/[\u00A0-\u9999<>&"]/g, c => `&#${c.charCodeAt(0)};`);
      } else {
        const doc = new DOMParser().parseFromString(input, 'text/html');
        res = doc.body.textContent || '';
      }
      return {
        name: 'entities.txt',
        blob: new Blob([res], { type: 'text/plain;charset=utf-8' }),
        info: isEncode ? 'Encoded to HTML entities' : 'Decoded to plain text',
        view: `<textarea readonly rows="5" style="width:100%;font-family:monospace;padding:8px">${esc(res)}</textarea>`
      };
    }

    if (mode === 'contrast') {
      const c1 = v('colfg') || '#000000';
      const c2 = v('colbg') || '#ffffff';
      const lum = hex => {
        const rgb = parseInt(hex.slice(1), 16);
        const r = (rgb >> 16) & 0xff, g = (rgb >> 8) & 0xff, b = rgb & 0xff;
        const a = [r, g, b].map(v => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
      };
      const l1 = lum(c1), l2 = lum(c2);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      const ratioFormatted = ratio.toFixed(2) + ':1';
      const passAA = ratio >= 4.5, passAAA = ratio >= 7.0;

      const html = `<div style="padding:16px;background:${esc(c2)};color:${esc(c1)};border:1px solid #ccc;border-radius:10px;text-align:center;margin:10px 0">
        <h3 style="margin:0 0 4px">Preview Sample Text</h3>
        <p style="margin:0">The quick brown fox jumps over the lazy dog.</p>
      </div>
      <div style="padding:12px;background:var(--bg2,#f7f9fa);border-radius:8px;font-size:14px;line-height:1.6">
        <div><b>Contrast Ratio:</b> <span style="font-size:18px;font-weight:700">${ratioFormatted}</span></div>
        <ul style="margin:6px 0 0;padding-left:20px">
          <li><b>WCAG AA Normal Text (≥ 4.5:1):</b> ${passAA ? '<span style="color:#0f9d58;font-weight:700">PASS ✓</span>' : '<span style="color:#d32f29;font-weight:700">FAIL ✕</span>'}</li>
          <li><b>WCAG AAA Normal Text (≥ 7.0:1):</b> ${passAAA ? '<span style="color:#0f9d58;font-weight:700">PASS ✓</span>' : '<span style="color:#d32f29;font-weight:700">FAIL ✕</span>'}</li>
        </ul>
      </div>`;
      return {
        name: 'contrast-report.txt',
        blob: new Blob([`Contrast: ${ratioFormatted}\nAA: ${passAA}\nAAA: ${passAAA}`], { type: 'text/plain' }),
        info: `Contrast Ratio: ${ratioFormatted}`,
        view: html
      };
    }

    if (mode === 'boxshadow') {
      const x = v('bsx') || '4', y = v('bsy') || '8', blur = v('bsblur') || '16', spread = v('bsspr') || '0', col = v('bscol') || '#000000';
      const css = `box-shadow: ${x}px ${y}px ${blur}px ${spread}px ${col}40;`;
      const html = `<div style="padding:30px;background:#f0f2f5;display:grid;place-items:center;border-radius:10px;margin:10px 0">
        <div style="width:160px;height:90px;background:#fff;border-radius:8px;box-shadow:${x}px ${y}px ${blur}px ${spread}px ${col}40;display:grid;place-items:center;font-weight:700">Card Preview</div>
      </div>
      <pre style="background:#222;color:#a6e22e;padding:10px;border-radius:6px;font-family:monospace">${esc(css)}</pre>`;
      return {
        name: 'shadow.css',
        blob: new Blob([css], { type: 'text/css' }),
        info: 'Generated CSS Box Shadow',
        view: html
      };
    }

    if (mode === 'gradient') {
      const c1 = v('gr1') || '#ff416c', c2 = v('gr2') || '#ff4b2b', type = v('grtype') || 'to right';
      const css = type === 'circle' ? `background: radial-gradient(circle, ${c1}, ${c2});` : `background: linear-gradient(${type}, ${c1}, ${c2});`;
      const html = `<div style="height:120px;border-radius:10px;${css}margin:10px 0;display:grid;place-items:center;color:#fff;font-weight:700;text-shadow:0 1px 3px #0004">Gradient Preview</div>
      <pre style="background:#222;color:#a6e22e;padding:10px;border-radius:6px;font-family:monospace">${esc(css)}</pre>`;
      return {
        name: 'gradient.css',
        blob: new Blob([css], { type: 'text/css' }),
        info: 'Generated CSS Gradient',
        view: html
      };
    }

    if (mode === 'mdhtml') {
      const md = v('mdtxt') || '';
      await load('marked.min.js');
      const html = window.marked ? window.marked.parse(md) : `<p>${esc(md)}</p>`;
      return {
        name: 'converted.html',
        blob: new Blob([html], { type: 'text/html;charset=utf-8' }),
        info: 'Converted Markdown to HTML',
        view: `<div style="padding:14px;background:#fff;border:1px solid #ddd;border-radius:8px;max-height:40vh;overflow:auto">${html}</div>`
      };
    }

    if (mode === 'sqlfmt') {
      let q = v('sqlinp') || '';
      const keywords = ['SELECT', 'FROM', 'WHERE', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'JOIN', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'UNION ALL', 'UNION'];
      for (const kw of keywords) {
        const re = new RegExp(`\\b${kw}\\b`, 'gi');
        q = q.replace(re, `\n${kw}`);
      }
      q = q.trim();
      return {
        name: 'formatted.sql',
        blob: new Blob([q], { type: 'text/plain;charset=utf-8' }),
        info: 'Formatted SQL Query',
        view: `<pre style="background:#222;color:#66d9ef;padding:12px;border-radius:8px;overflow-x:auto">${esc(q)}</pre>`
      };
    }

    if (mode === 'ua') {
      const ua = v('uatxt') || navigator.userAgent;
      const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
      const browser = /Edg\//.test(ua) ? 'Microsoft Edge' : /Chrome\//.test(ua) ? 'Google Chrome' : /Safari\//.test(ua) && !/Chrome/.test(ua) ? 'Apple Safari' : /Firefox\//.test(ua) ? 'Mozilla Firefox' : 'Web Browser';
      const os = /Windows NT 10/.test(ua) ? 'Windows 10/11' : /Macintosh/.test(ua) ? 'macOS' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Linux/.test(ua) ? 'Linux' : 'Operating System';

      const html = `<div style="padding:14px;background:var(--bg2,#f7f9fa);border-radius:10px;font-size:14px;line-height:1.6">
        <ul style="margin:0;padding-left:20px">
          <li><b>Detected Browser:</b> ${esc(browser)}</li>
          <li><b>Detected OS:</b> ${esc(os)}</li>
          <li><b>Device Form Factor:</b> ${isMobile ? 'Mobile / Tablet 📱' : 'Desktop / Laptop 💻'}</li>
        </ul>
        <pre style="margin-top:10px;background:#222;color:#fff;padding:8px;border-radius:6px;font-size:11px;overflow-x:auto">${esc(ua)}</pre>
      </div>`;
      return {
        name: 'user-agent.txt',
        blob: new Blob([`Browser: ${browser}\nOS: ${os}\nMobile: ${isMobile}\nUA: ${ua}`], { type: 'text/plain' }),
        info: `${browser} on ${os}`,
        view: html
      };
    }

    if (mode === 'pwgen') {
      const len = Math.max(6, Math.min(64, +v('pwlen') || 16));
      const count = Math.max(1, Math.min(50, +v('pwcount') || 5));
      const incUpper = vb('pwupper') !== false;
      const incLower = vb('pwlower') !== false;
      const incNums = vb('pwnums') !== false;
      const incSyms = vb('pwsyms') !== false;
      const noAmbig = vb('pwnoambig');

      let upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
      let lower = 'abcdefghijkmnopqrstuvwxyz';
      let nums = '23456789';
      let syms = '!@#$%^&*()_+-=[]{}|;:,.<>?';

      if (!noAmbig) {
        upper += 'IO';
        lower += 'l';
        nums += '01';
      }

      let charset = '';
      if (incUpper) charset += upper;
      if (incLower) charset += lower;
      if (incNums) charset += nums;
      if (incSyms) charset += syms;
      if (!charset) charset = lower + nums;

      const passwords = [];
      const cryptoObj = (typeof window !== 'undefined' && window.crypto) || (typeof crypto !== 'undefined' ? crypto : null);

      for (let p = 0; p < count; p++) {
        let pw = '';
        if (cryptoObj && cryptoObj.getRandomValues) {
          const randVals = new Uint32Array(len);
          cryptoObj.getRandomValues(randVals);
          for (let i = 0; i < len; i++) {
            pw += charset[randVals[i] % charset.length];
          }
        } else {
          for (let i = 0; i < len; i++) {
            pw += charset[Math.floor(Math.random() * charset.length)];
          }
        }
        passwords.push(pw);
      }

      const out = passwords.join('\n');
      const viewHtml = `
        <div style="background:var(--bg,#f8fafc);border:1px solid var(--border,#e2e8f0);border-radius:10px;padding:16px;margin-top:16px;text-align:left">
          <h3 style="margin-top:0">Generated Passwords (${len} chars, ${count} total):</h3>
          ${passwords.map(pw => `
            <div style="display:flex;align-items:center;justify-content:space-between;background:#fff;border:1px solid #cbd5e1;border-radius:6px;padding:8px 12px;margin-bottom:8px">
              <code style="font-size:1.1rem;font-weight:700;letter-spacing:1px;color:#0f172a">${esc(pw)}</code>
              <button type="button" class="btn ghost mini" onclick="navigator.clipboard.writeText('${esc(pw)}').then(()=>alert('Password copied!'))">📋 Copy</button>
            </div>
          `).join('')}
        </div>
      `;

      return {
        name: 'passwords.txt',
        blob: new Blob([out], { type: 'text/plain;charset=utf-8' }),
        info: `Generated ${count} strong passwords (${len} chars each)`,
        view: viewHtml
      };
    }

    throw new Error('Unsupported mode: ' + mode);
  }
};
