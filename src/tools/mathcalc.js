// Math & Academic Suite: GPA / CGPA Calculator, Fraction Calculator, Statistics / Standard Deviation, and Quadratic Solver.
// 100% in-browser mathematical calculation.

TOOLS.mathcalc = {
  opts() {
    const mode = (this.vars || {}).mode || 'gpa';
    if (mode === 'gpa') {
      return inp('gpagrades', 'Enter Grades and Credits (e.g. A:3, B:4, A-:3 or 9:4, 8:3)', 'text', 'A:3, B+:4, A:3, A-:2, B:3');
    }
    if (mode === 'fraction') {
      return `<div class="row2">${inp('fr1', 'Fraction 1 (e.g. 3/4 or 1 1/2)', 'text', '3/4')}${inp('fr2', 'Fraction 2 (e.g. 2/3)', 'text', '2/3')}</div>` +
        sel('frop', 'Operation', [['+', 'Add (+)'], ['-', 'Subtract (-)'], ['*', 'Multiply (×)'], ['/', 'Divide (÷)']]);
    }
    if (mode === 'stats' || mode === 'sumavg') {
      return inp('statnums', 'Numbers (separated by commas, spaces, or lines)', 'text', '10, 25, 45, 80, 120, 300, 450');
    }
    if (mode === 'quadratic') {
      return `<div style="display:flex;gap:8px;align-items:center">${inp('qa', 'a', 'number', '1', 'style="width:70px"')}<span style="font-size:18px;font-weight:700">x² +</span>${inp('qb', 'b', 'number', '-5', 'style="width:70px"')}<span style="font-size:18px;font-weight:700">x +</span>${inp('qc', 'c', 'number', '6', 'style="width:70px"')}<span style="font-size:18px;font-weight:700">= 0</span></div>`;
    }
    return '';
  },

  async run(files, status) {
    const mode = (this.vars || {}).mode || 'gpa';
    status(T.working || 'Solving math calculation…');

    if (mode === 'gpa') {
      const input = v('gpagrades') || 'A:3, B+:4, A:3, A-:2, B:3';
      const scale = {
        'A+': 4.0, 'A': 4.0, 'A-': 3.7,
        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7,
        'D+': 1.3, 'D': 1.0, 'F': 0.0
      };
      const entries = input.split(/[,;\n]+/).filter(Boolean);
      let totalPoints = 0, totalCredits = 0;
      const rows = [];

      for (const e of entries) {
        const [gRaw, cRaw] = e.split(':').map(s => s?.trim());
        const grade = (gRaw || 'A').toUpperCase();
        const cred = parseFloat(cRaw || '3') || 3;
        const pts = scale[grade] !== undefined ? scale[grade] : parseFloat(grade) || 3.0;
        totalPoints += pts * cred;
        totalCredits += cred;
        rows.push({ grade, cred, pts });
      }

      const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
      const html = `<div style="padding:16px;background:var(--bg2,#f7f9fa);border-radius:12px;font-size:14px;line-height:1.6">
        <div style="font-size:26px;font-weight:800;color:var(--r,#d32f29);margin-bottom:8px">Cumulative GPA: ${gpa} / 4.00</div>
        <p style="margin:0 0 10px">Total Credit Hours: <b>${totalCredits}</b> | Total Grade Points: <b>${totalPoints.toFixed(1)}</b></p>
        <table class="dtab" style="width:100%;margin-top:8px">
          <thead><tr><th>Course</th><th>Grade</th><th>Credits</th><th>Grade Points</th></tr></thead>
          <tbody>
            ${rows.map((r, idx) => `<tr><td>Course ${idx + 1}</td><td>${r.grade}</td><td>${r.cred}</td><td>${(r.pts * r.cred).toFixed(1)}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>`;
      return {
        name: 'gpa-report.txt',
        blob: new Blob([`GPA: ${gpa}\nCredits: ${totalCredits}\nPoints: ${totalPoints}`], { type: 'text/plain' }),
        info: `Cumulative GPA: ${gpa}`,
        view: html
      };
    }

    if (mode === 'fraction') {
      const parseFr = s => {
        s = s.trim();
        if (s.includes(' ')) {
          const [whole, frac] = s.split(' ');
          const [n, d] = frac.split('/').map(Number);
          return (Number(whole) >= 0 ? 1 : -1) * (Math.abs(Number(whole)) * d + n) / d;
        }
        if (s.includes('/')) {
          const [n, d] = s.split('/').map(Number);
          return n / d;
        }
        return Number(s);
      };

      const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
      const decToFr = val => {
        let len = 100000;
        let num = Math.round(val * len);
        let g = Math.abs(gcd(num, len));
        let n = num / g, d = len / g;
        if (d === 1) return `${n}`;
        if (Math.abs(n) > d) {
          const w = Math.trunc(n / d);
          const rem = Math.abs(n % d);
          return `${w} ${rem}/${d} (${n}/${d})`;
        }
        return `${n}/${d}`;
      };

      const f1 = parseFr(v('fr1') || '3/4');
      const f2 = parseFr(v('fr2') || '2/3');
      const op = v('frop') || '+';

      let ans = 0;
      if (op === '+') ans = f1 + f2;
      else if (op === '-') ans = f1 - f2;
      else if (op === '*') ans = f1 * f2;
      else ans = f1 / f2;

      const fracStr = decToFr(ans);
      const html = `<div style="padding:16px;background:var(--bg2,#f7f9fa);border-radius:12px;font-size:14px;line-height:1.6">
        <div style="font-size:26px;font-weight:800;color:var(--r,#d32f29);margin-bottom:8px">Result: ${fracStr}</div>
        <p style="margin:0"><b>Decimal Equivalent:</b> ${ans.toFixed(4)}</p>
      </div>`;
      return {
        name: 'fraction-result.txt',
        blob: new Blob([`Fraction: ${fracStr}\nDecimal: ${ans}`], { type: 'text/plain' }),
        info: `Result: ${fracStr}`,
        view: html
      };
    }

    if (mode === 'stats' || mode === 'sumavg') {
      const raw = v('statnums') || '10, 25, 45, 80, 120, 300, 450';
      const nums = raw.split(/[,;\s]+/).map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
      if (!nums.length) throw new Error('Please enter valid numbers.');

      const n = nums.length;
      const sum = nums.reduce((a, b) => a + b, 0);
      const mean = sum / n;
      const median = n % 2 === 0 ? (nums[n / 2 - 1] + nums[n / 2]) / 2 : nums[Math.floor(n / 2)];
      const min = nums[0], max = nums[n - 1], range = max - min;
      const variance = nums.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / (n > 1 ? n - 1 : 1);
      const stdDev = Math.sqrt(variance);

      const html = `<div style="padding:16px;background:var(--bg2,#f7f9fa);border-radius:12px;font-size:14px;line-height:1.6">
        <div style="font-size:24px;font-weight:800;color:#0b7a43;margin-bottom:8px">Mean (Average): ${mean.toFixed(2)}</div>
        <ul style="margin:0;padding-left:20px">
          <li><b>Count (n):</b> ${n}</li>
          <li><b>Median:</b> ${median}</li>
          <li><b>Standard Deviation (s):</b> ${stdDev.toFixed(3)}</li>
          <li><b>Variance (s²):</b> ${variance.toFixed(3)}</li>
          <li><b>Min / Max / Range:</b> ${min} / ${max} (Range: ${range})</li>
          <li><b>Sum:</b> ${sum.toLocaleString()}</li>
        </ul>
      </div>`;
      return {
        name: 'statistics.txt',
        blob: new Blob([`Count: ${n}\nMean: ${mean}\nMedian: ${median}\nStdDev: ${stdDev}\nVariance: ${variance}`], { type: 'text/plain' }),
        info: `Mean: ${mean.toFixed(2)} | StdDev: ${stdDev.toFixed(2)}`,
        view: html
      };
    }

    if (mode === 'quadratic') {
      const a = +v('qa') || 1;
      const b = +v('qb') || -5;
      const c = +v('qc') || 6;
      if (a === 0) throw new Error('Coefficient "a" cannot be 0 in a quadratic equation.');

      const disc = b * b - 4 * a * c;
      let sol = '';
      if (disc > 0) {
        const x1 = (-b + Math.sqrt(disc)) / (2 * a);
        const x2 = (-b - Math.sqrt(disc)) / (2 * a);
        sol = `Two Real Roots: x₁ = ${x1.toFixed(3)}, x₂ = ${x2.toFixed(3)}`;
      } else if (disc === 0) {
        const x = -b / (2 * a);
        sol = `One Real Root: x = ${x.toFixed(3)}`;
      } else {
        const real = (-b / (2 * a)).toFixed(3);
        const imag = (Math.sqrt(-disc) / (2 * a)).toFixed(3);
        sol = `Complex Roots: x = ${real} ± ${imag}i`;
      }

      const html = `<div style="padding:16px;background:var(--bg2,#f7f9fa);border-radius:12px;font-size:14px;line-height:1.6">
        <div style="font-size:22px;font-weight:800;color:var(--r,#d32f29);margin-bottom:8px">${sol}</div>
        <p style="margin:0">Equation: <code>${a}x² + (${b})x + (${c}) = 0</code></p>
        <p style="margin:4px 0 0">Discriminant (b² - 4ac): <b>${disc}</b></p>
      </div>`;
      return {
        name: 'quadratic-solution.txt',
        blob: new Blob([`${sol}\nDiscriminant: ${disc}`], { type: 'text/plain' }),
        info: sol,
        view: html
      };
    }

    throw new Error('Unsupported mode: ' + mode);
  }
};
