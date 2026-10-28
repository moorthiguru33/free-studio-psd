// Finance & Money Calculators: Compound Interest, Simple Interest, Salary, Tip & Split Bill, Inflation, Sales Tax/VAT, and Profit Margin.
// 100% in-browser mathematical calculation.

TOOLS.financecalc = {
  opts() {
    const mode = (this.vars || {}).mode || 'compound';
    if (mode === 'compound') {
      return `<div class="row2">${inp('ciprinc', 'Initial Principal ($ / ₹)', 'number', '10000', 'min="1" step="100"')}${inp('cirate', 'Annual Interest Rate (%)', 'number', '8', 'min="0.1" step="0.1"')}</div>` +
        `<div class="row2">${inp('ciyears', 'Investment Period (Years)', 'number', '10', 'min="1" step="1"')}${sel('cifreq', 'Compounding Frequency', [['12', 'Monthly (12x/yr)'], ['1', 'Annually (1x/yr)'], ['4', 'Quarterly (4x/yr)'], ['365', 'Daily (365x/yr)']])}</div>` +
        inp('cimonthly', 'Additional Monthly Contribution', 'number', '500', 'min="0" step="50"');
    }
    if (mode === 'simple') {
      return `<div class="row2">${inp('siprinc', 'Principal Amount', 'number', '5000', 'min="1"')}${inp('sirate', 'Annual Interest Rate (%)', 'number', '6', 'min="0.1" step="0.1"')}</div>` +
        inp('sitime', 'Time Period (Years)', 'number', '3', 'min="0.5" step="0.5"');
    }
    if (mode === 'salary') {
      return `<div class="row2">${inp('salrate', 'Wage / Salary Amount', 'number', '25', 'min="1"')}${sel('salperiod', 'Per', [['hour', 'Per Hour'], ['month', 'Per Month'], ['year', 'Per Year']])}</div>` +
        `<div class="row2">${inp('salhrs', 'Hours per Week', 'number', '40', 'min="1" max="168"')}${inp('salwks', 'Weeks per Year', 'number', '52', 'min="1" max="52"')}</div>`;
    }
    if (mode === 'tip') {
      return `<div class="row2">${inp('tipbill', 'Bill Amount', 'number', '85.00', 'min="0.01" step="0.5"')}${sel('tippct', 'Tip Percentage', [['15', '15% · Standard'], ['18', '18% · Good'], ['20', '20% · Great'], ['25', '25% · Exceptional'], ['10', '10% · Modest']])}</div>` +
        inp('tipsplit', 'Split Between (People)', 'number', '2', 'min="1" max="50"');
    }
    if (mode === 'tax') {
      return `<div class="row2">${inp('taxamt', 'Amount', 'number', '100', 'min="0.01" step="1"')}${inp('taxrate', 'Tax / VAT Rate (%)', 'number', '18', 'min="0.1" step="0.1"')}</div>` +
        sel('taxmode', 'Calculation Type', [['add', 'Add Tax (Net → Gross)'], ['remove', 'Remove Tax (Gross → Net)']]);
    }
    if (mode === 'margin') {
      return `<div class="row2">${inp('mgcost', 'Cost of Item', 'number', '40', 'min="0.01"')}${inp('mgsell', 'Selling Price (Revenue)', 'number', '60', 'min="0.01"')}</div>`;
    }
    if (mode === 'pctchange') {
      return `<div class="row2">${inp('pctfrom', 'Starting Value', 'number', '50', 'step="any"')}${inp('pctto', 'New / Ending Value', 'number', '75', 'step="any"')}</div>`;
    }
    return '';
  },

  async run(files, status) {
    const mode = (this.vars || {}).mode || 'compound';
    status(T.working || 'Calculating finance figures…');

    if (mode === 'compound') {
      const P = +v('ciprinc') || 10000;
      const r = (+v('cirate') || 8) / 100;
      const t = +v('ciyears') || 10;
      const n = +v('cifreq') || 12;
      const PMT = +v('cimonthly') || 0;

      // Compound interest with monthly deposits formula
      const principalFuture = P * Math.pow(1 + r / n, n * t);
      const monthlyRate = r / 12;
      const totalMonths = t * 12;
      const contributionsFuture = PMT > 0 && monthlyRate > 0 ? PMT * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) : 0;
      const totalFuture = principalFuture + contributionsFuture;
      const totalInvested = P + (PMT * totalMonths);
      const totalInterest = Math.max(0, totalFuture - totalInvested);

      const html = `<div style="padding:16px;background:var(--bg2,#f7f9fa);border-radius:12px;font-size:14px;line-height:1.6">
        <div style="font-size:26px;font-weight:800;color:#0b7a43;margin-bottom:8px">$${Math.round(totalFuture).toLocaleString()}</div>
        <ul style="margin:0;padding-left:20px">
          <li><b>Total Future Value:</b> $${totalFuture.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</li>
          <li><b>Total Principal Invested:</b> $${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</li>
          <li><b>Total Interest Earned:</b> <span style="color:#0b7a43;font-weight:700">+$${totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></li>
        </ul>
      </div>`;
      return {
        name: 'compound-interest.txt',
        blob: new Blob([`Future Value: $${totalFuture.toFixed(2)}\nInvested: $${totalInvested.toFixed(2)}\nInterest Earned: $${totalInterest.toFixed(2)}`], { type: 'text/plain' }),
        info: `Future Balance: $${Math.round(totalFuture).toLocaleString()}`,
        view: html
      };
    }

    if (mode === 'simple') {
      const P = +v('siprinc') || 5000;
      const r = (+v('sirate') || 6) / 100;
      const t = +v('sitime') || 3;
      const interest = P * r * t;
      const total = P + interest;

      const html = `<div style="padding:16px;background:var(--bg2,#f7f9fa);border-radius:12px;font-size:14px;line-height:1.6">
        <div style="font-size:24px;font-weight:800;color:#0b7a43;margin-bottom:8px">Total: $${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <ul style="margin:0;padding-left:20px">
          <li><b>Principal:</b> $${P.toLocaleString()}</li>
          <li><b>Interest Earned:</b> +$${interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</li>
        </ul>
      </div>`;
      return {
        name: 'simple-interest.txt',
        blob: new Blob([`Total: $${total.toFixed(2)}\nInterest: $${interest.toFixed(2)}`], { type: 'text/plain' }),
        info: `Total: $${total.toLocaleString()}`,
        view: html
      };
    }

    if (mode === 'salary') {
      const amt = +v('salrate') || 25;
      const period = v('salperiod') || 'hour';
      const hrs = +v('salhrs') || 40;
      const wks = +v('salwks') || 52;

      let annual = 0;
      if (period === 'hour') annual = amt * hrs * wks;
      else if (period === 'month') annual = amt * 12;
      else annual = amt;

      const monthly = annual / 12;
      const biweekly = annual / 26;
      const weekly = annual / wks;
      const hourly = annual / (hrs * wks);

      const html = `<div style="padding:16px;background:var(--bg2,#f7f9fa);border-radius:12px;font-size:14px;line-height:1.6">
        <div style="font-size:24px;font-weight:800;color:var(--r,#d32f29);margin-bottom:8px">$${Math.round(annual).toLocaleString()} / Year</div>
        <ul style="margin:0;padding-left:20px">
          <li><b>Monthly Pay:</b> $${monthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</li>
          <li><b>Bi-Weekly (Every 2 Weeks):</b> $${biweekly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</li>
          <li><b>Weekly Pay:</b> $${weekly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</li>
          <li><b>Hourly Rate:</b> $${hourly.toFixed(2)} / hr</li>
        </ul>
      </div>`;
      return {
        name: 'salary-breakdown.txt',
        blob: new Blob([`Annual: $${annual.toFixed(2)}\nMonthly: $${monthly.toFixed(2)}\nHourly: $${hourly.toFixed(2)}`], { type: 'text/plain' }),
        info: `Annual: $${Math.round(annual).toLocaleString()}`,
        view: html
      };
    }

    if (mode === 'tip') {
      const bill = +v('tipbill') || 85;
      const pct = (+v('tippct') || 15) / 100;
      const people = +v('tipsplit') || 2;

      const tipAmt = bill * pct;
      const total = bill + tipAmt;
      const perPerson = total / people;
      const tipPerPerson = tipAmt / people;

      const html = `<div style="padding:16px;background:var(--bg2,#f7f9fa);border-radius:12px;font-size:14px;line-height:1.6">
        <div style="font-size:24px;font-weight:800;color:#0b7a43;margin-bottom:8px">$${perPerson.toFixed(2)} / Person</div>
        <ul style="margin:0;padding-left:20px">
          <li><b>Total Bill with Tip:</b> $${total.toFixed(2)}</li>
          <li><b>Tip Amount (${pct * 100}%):</b> $${tipAmt.toFixed(2)}</li>
          <li><b>Each Person Pays:</b> $${perPerson.toFixed(2)} (Bill: $${(bill / people).toFixed(2)} + Tip: $${tipPerPerson.toFixed(2)})</li>
        </ul>
      </div>`;
      return {
        name: 'bill-split.txt',
        blob: new Blob([`Total: $${total.toFixed(2)}\nPer Person: $${perPerson.toFixed(2)}`], { type: 'text/plain' }),
        info: `Per Person: $${perPerson.toFixed(2)}`,
        view: html
      };
    }

    if (mode === 'tax') {
      const amt = +v('taxamt') || 100;
      const rate = (+v('taxrate') || 18) / 100;
      const isAdd = (v('taxmode') || 'add') === 'add';

      let net = 0, tax = 0, gross = 0;
      if (isAdd) {
        net = amt;
        tax = net * rate;
        gross = net + tax;
      } else {
        gross = amt;
        net = gross / (1 + rate);
        tax = gross - net;
      }

      const html = `<div style="padding:16px;background:var(--bg2,#f7f9fa);border-radius:12px;font-size:14px;line-height:1.6">
        <div style="font-size:24px;font-weight:800;color:var(--r,#d32f29);margin-bottom:8px">Gross Total: $${gross.toFixed(2)}</div>
        <ul style="margin:0;padding-left:20px">
          <li><b>Net Amount (Before Tax):</b> $${net.toFixed(2)}</li>
          <li><b>Tax / VAT (${rate * 100}%):</b> $${tax.toFixed(2)}</li>
          <li><b>Gross Total (With Tax):</b> $${gross.toFixed(2)}</li>
        </ul>
      </div>`;
      return {
        name: 'tax-calculation.txt',
        blob: new Blob([`Net: $${net.toFixed(2)}\nTax: $${tax.toFixed(2)}\nGross: $${gross.toFixed(2)}`], { type: 'text/plain' }),
        info: `Gross: $${gross.toFixed(2)}`,
        view: html
      };
    }

    if (mode === 'margin') {
      const cost = +v('mgcost') || 40;
      const sell = +v('mgsell') || 60;
      const profit = sell - cost;
      const margin = (profit / sell) * 100;
      const markup = (profit / cost) * 100;

      const html = `<div style="padding:16px;background:var(--bg2,#f7f9fa);border-radius:12px;font-size:14px;line-height:1.6">
        <div style="font-size:24px;font-weight:800;color:#0b7a43;margin-bottom:8px">Profit Margin: ${margin.toFixed(2)}%</div>
        <ul style="margin:0;padding-left:20px">
          <li><b>Gross Profit:</b> +$${profit.toFixed(2)}</li>
          <li><b>Profit Margin:</b> ${margin.toFixed(2)}%</li>
          <li><b>Markup Percentage:</b> ${markup.toFixed(2)}%</li>
        </ul>
      </div>`;
      return {
        name: 'margin-markup.txt',
        blob: new Blob([`Profit: $${profit.toFixed(2)}\nMargin: ${margin.toFixed(2)}%\nMarkup: ${markup.toFixed(2)}%`], { type: 'text/plain' }),
        info: `Margin: ${margin.toFixed(1)}% | Markup: ${markup.toFixed(1)}%`,
        view: html
      };
    }

    if (mode === 'pctchange') {
      const from = +v('pctfrom') || 50;
      const to = +v('pctto') || 75;
      const diff = to - from;
      const pct = (diff / Math.abs(from)) * 100;
      const isUp = diff >= 0;

      const html = `<div style="padding:16px;background:var(--bg2,#f7f9fa);border-radius:12px;font-size:14px;line-height:1.6">
        <div style="font-size:24px;font-weight:800;color:${isUp ? '#0b7a43' : '#d32f29'};margin-bottom:8px">${isUp ? '+' : ''}${pct.toFixed(2)}% ${isUp ? 'Increase ↗' : 'Decrease ↘'}</div>
        <ul style="margin:0;padding-left:20px">
          <li><b>Initial Value:</b> ${from}</li>
          <li><b>Final Value:</b> ${to}</li>
          <li><b>Absolute Difference:</b> ${isUp ? '+' : ''}${diff.toFixed(2)}</li>
        </ul>
      </div>`;
      return {
        name: 'percentage-change.txt',
        blob: new Blob([`Change: ${pct.toFixed(2)}%\nDifference: ${diff.toFixed(2)}`], { type: 'text/plain' }),
        info: `${isUp ? '+' : ''}${pct.toFixed(1)}% ${isUp ? 'Increase' : 'Decrease'}`,
        view: html
      };
    }

    throw new Error('Unsupported mode: ' + mode);
  }
};
