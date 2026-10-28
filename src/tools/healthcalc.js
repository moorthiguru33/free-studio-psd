// Health, Fitness & Lifestyle Calculators: Calorie / TDEE, Water Intake, Body Fat %, Ideal Weight, Sleep Cycles, Heart Rate Zones, and Pet Age.
// 100% in-browser mathematical calculation.

TOOLS.healthcalc = {
  opts() {
    const mode = (this.vars || {}).mode || 'calorie';
    if (mode === 'calorie') {
      return `<div class="row2">${sel('calgender', 'Gender', [['m', 'Male'], ['f', 'Female']])}${inp('calage', 'Age', 'number', '28', 'min="10" max="100"')}</div>` +
        `<div class="row2">${inp('calwt', 'Weight (kg)', 'number', '70', 'min="30" max="300"')}${inp('calht', 'Height (cm)', 'number', '175', 'min="100" max="250"')}</div>` +
        sel('calact', 'Activity Level', [
          ['1.2', 'Sedentary (Little or no exercise)'],
          ['1.375', 'Lightly Active (Exercise 1-3 days/week)'],
          ['1.55', 'Moderately Active (Exercise 3-5 days/week)'],
          ['1.725', 'Very Active (Hard exercise 6-7 days/week)'],
          ['1.9', 'Extra Active (Physical labor or athlete)']
        ]);
    }
    if (mode === 'water') {
      return `<div class="row2">${inp('watwt', 'Body Weight (kg)', 'number', '70', 'min="30" max="300"')}${inp('watact', 'Daily Exercise (Minutes)', 'number', '30', 'min="0" max="300"')}</div>` +
        sel('watcli', 'Climate', [['normal', 'Moderate Climate'], ['hot', 'Hot / Humid Weather (Need extra water)']]);
    }
    if (mode === 'bodyfat') {
      return `<div class="row2">${sel('bfgender', 'Gender', [['m', 'Male'], ['f', 'Female']])}${inp('bfht', 'Height (cm)', 'number', '175')}</div>` +
        `<div class="row2">${inp('bfneck', 'Neck Circumference (cm)', 'number', '38')}${inp('bfwaist', 'Waist Circumference (cm)', 'number', '82')}</div>` +
        inp('bfhip', 'Hip Circumference (cm - Females only)', 'number', '92');
    }
    if (mode === 'sleep') {
      return sel('sleeptype', 'I want to know...', [
        ['wake', 'When to go to bed if I need to wake up at:'],
        ['sleep', 'When to wake up if I go to sleep now']
      ]) +
      inp('sleeptime', 'Target Wake-Up Time', 'time', '07:00');
    }
    if (mode === 'petage') {
      return sel('pettype', 'Pet Type', [
        ['dog_s', 'Dog: Small Breed (< 10 kg)'],
        ['dog_m', 'Dog: Medium Breed (10-25 kg)'],
        ['dog_l', 'Dog: Large Breed (> 25 kg)'],
        ['cat', 'Cat']
      ]) +
      inp('petageyrs', 'Pet Age (Calendar Years)', 'number', '4', 'min="0.5" max="30" step="0.5"');
    }
    return '';
  },

  async run(files, status) {
    const mode = (this.vars || {}).mode || 'calorie';
    status(T.working || 'Calculating health metrics…');

    if (mode === 'calorie') {
      const isMale = (v('calgender') || 'm') === 'm';
      const age = +v('calage') || 28;
      const wt = +v('calwt') || 70;
      const ht = +v('calht') || 175;
      const act = +v('calact') || 1.2;

      // Mifflin-St Jeor Equation
      const bmr = (10 * wt) + (6.25 * ht) - (5 * age) + (isMale ? 5 : -161);
      const tdee = Math.round(bmr * act);
      const cut = Math.round(tdee - 500);
      const bulk = Math.round(tdee + 300);

      const html = `<div style="padding:16px;background:var(--bg2,#f7f9fa);border-radius:12px;font-size:14px;line-height:1.6">
        <div style="font-size:26px;font-weight:800;color:var(--r,#d32f29);margin-bottom:8px">${tdee.toLocaleString()} Calories / Day</div>
        <p style="margin:0 0 10px">Your Basal Metabolic Rate (BMR): <b>${Math.round(bmr)} cal/day</b></p>
        <ul style="margin:0;padding-left:20px">
          <li><b>Weight Maintenance:</b> ${tdee.toLocaleString()} cal/day</li>
          <li><b>Healthy Weight Loss (0.5 kg/week):</b> <span style="color:#0b7a43;font-weight:700">${cut.toLocaleString()} cal/day</span></li>
          <li><b>Muscle Building / Lean Bulk:</b> <span style="color:#e07b00;font-weight:700">${bulk.toLocaleString()} cal/day</span></li>
        </ul>
      </div>`;
      return {
        name: 'calorie-target.txt',
        blob: new Blob([`TDEE: ${tdee} kcal\nBMR: ${Math.round(bmr)} kcal\nWeight Loss: ${cut} kcal\nWeight Gain: ${bulk} kcal`], { type: 'text/plain' }),
        info: `Maintenance: ${tdee.toLocaleString()} kcal`,
        view: html
      };
    }

    if (mode === 'water') {
      const wt = +v('watwt') || 70;
      const exerciseMins = +v('watact') || 30;
      const isHot = (v('watcli') || 'normal') === 'hot';

      // Base: 35ml per kg + 350ml per 30 mins exercise
      let ml = wt * 35 + (exerciseMins / 30) * 350;
      if (isHot) ml += 500;
      const liters = (ml / 1000).toFixed(1);
      const glasses = Math.round(ml / 250);

      const html = `<div style="padding:16px;background:var(--bg2,#f7f9fa);border-radius:12px;font-size:14px;line-height:1.6">
        <div style="font-size:26px;font-weight:800;color:#00727d;margin-bottom:8px">💧 ${liters} Liters / Day</div>
        <p style="margin:0">Approximately <b>${glasses} glasses</b> of water (250ml each).</p>
      </div>`;
      return {
        name: 'water-target.txt',
        blob: new Blob([`Water Target: ${liters} L (${glasses} glasses)`], { type: 'text/plain' }),
        info: `Daily Water: ${liters} L`,
        view: html
      };
    }

    if (mode === 'bodyfat') {
      const isMale = (v('bfgender') || 'm') === 'm';
      const ht = +v('bfht') || 175;
      const neck = +v('bfneck') || 38;
      const waist = +v('bfwaist') || 82;
      const hip = +v('bfhip') || 92;

      let bf = 0;
      if (isMale) {
        bf = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(ht)) - 450;
      } else {
        bf = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(ht)) - 450;
      }
      bf = Math.max(3, Math.min(60, bf));

      const category = isMale ? (bf < 10 ? 'Essential Fat' : bf < 18 ? 'Athletic / Fitness' : bf < 25 ? 'Normal / Healthy' : 'Above Average') : (bf < 18 ? 'Essential Fat' : bf < 25 ? 'Athletic / Fitness' : bf < 32 ? 'Normal / Healthy' : 'Above Average');

      const html = `<div style="padding:16px;background:var(--bg2,#f7f9fa);border-radius:12px;font-size:14px;line-height:1.6">
        <div style="font-size:26px;font-weight:800;color:#0b7a43;margin-bottom:8px">${bf.toFixed(1)}% Body Fat</div>
        <p style="margin:0">Category: <b>${category}</b> (US Navy Method)</p>
      </div>`;
      return {
        name: 'body-fat.txt',
        blob: new Blob([`Body Fat: ${bf.toFixed(1)}%\nCategory: ${category}`], { type: 'text/plain' }),
        info: `Body Fat: ${bf.toFixed(1)}% (${category})`,
        view: html
      };
    }

    if (mode === 'sleep') {
      const isWake = (v('sleeptype') || 'wake') === 'wake';
      const targetTime = v('sleeptime') || '07:00';
      const [th, tm] = targetTime.split(':').map(Number);
      const ref = new Date();
      ref.setHours(th, tm, 0, 0);

      const cycles = [6, 5, 4, 3]; // 9h, 7.5h, 6h, 4.5h
      const times = cycles.map(c => {
        const d = new Date(ref.getTime());
        if (isWake) d.setMinutes(d.getMinutes() - (c * 90 + 14)); // subtract 14 mins to fall asleep
        else d.setMinutes(d.getMinutes() + (c * 90 + 14));
        return {
          cycles: c,
          hours: (c * 1.5).toFixed(1),
          timeStr: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      });

      const html = `<div style="padding:16px;background:var(--bg2,#f7f9fa);border-radius:12px;font-size:14px;line-height:1.6">
        <p style="margin:0 0 10px">To wake up refreshed at <b>${targetTime}</b>, fall asleep at one of these 90-minute REM cycle intervals:</p>
        <ul style="margin:0;padding-left:20px">
          ${times.map(t => `<li><b style="font-size:16px;color:var(--r,#d32f29)">${t.timeStr}</b> (${t.cycles} sleep cycles · ${t.hours} hours of sleep)</li>`).join('')}
        </ul>
      </div>`;
      return {
        name: 'sleep-cycles.txt',
        blob: new Blob([times.map(t => `${t.timeStr} (${t.hours} hrs)`).join('\n')], { type: 'text/plain' }),
        info: `Recommended Bedtime: ${times[1].timeStr} (7.5 hrs)`,
        view: html
      };
    }

    if (mode === 'petage') {
      const ptype = v('pettype') || 'dog_m';
      const yrs = +v('petageyrs') || 4;
      let humanYrs = 0;

      if (ptype === 'cat') {
        humanYrs = yrs <= 1 ? 15 : yrs <= 2 ? 24 : 24 + (yrs - 2) * 4;
      } else if (ptype === 'dog_s') {
        humanYrs = yrs <= 1 ? 15 : yrs <= 2 ? 24 : 24 + (yrs - 2) * 4;
      } else if (ptype === 'dog_m') {
        humanYrs = yrs <= 1 ? 15 : yrs <= 2 ? 24 : 24 + (yrs - 2) * 5;
      } else {
        // Large dog
        humanYrs = yrs <= 1 ? 15 : yrs <= 2 ? 24 : 24 + (yrs - 2) * 7;
      }

      const html = `<div style="padding:16px;background:var(--bg2,#f7f9fa);border-radius:12px;font-size:14px;line-height:1.6">
        <div style="font-size:26px;font-weight:800;color:var(--r,#d32f29);margin-bottom:8px">Equivalent to ${Math.round(humanYrs)} Human Years</div>
        <p style="margin:0">Actual Pet Age: <b>${yrs} Calendar Years</b></p>
      </div>`;
      return {
        name: 'pet-age.txt',
        blob: new Blob([`Pet: ${yrs} yrs = ${Math.round(humanYrs)} human years`], { type: 'text/plain' }),
        info: `${yrs} pet yrs = ${Math.round(humanYrs)} human yrs`,
        view: html
      };
    }

    throw new Error('Unsupported mode: ' + mode);
  }
};
