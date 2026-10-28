// Audio FX & Sound Suite: BPM Tap Counter, Metronome, Frequency Tone Generator, White Noise, and 432Hz Audio Pitch Converter.
// Utilizes Web Audio API with zero external servers.

TOOLS.audiofx = {
  opts() {
    const mode = (this.vars || {}).mode || 'bpm';
    if (mode === 'bpm') {
      return `<p class="hint">Tap the button repeatedly to the beat of any song to calculate its exact BPM (Beats Per Minute).</p>` +
        `<div style="text-align:center;margin:16px 0"><button type="button" class="btn big" id="tapbtn" style="min-width:180px;font-size:1.4rem;padding:20px 40px">🎵 TAP BEAT</button></div>`;
    }
    if (mode === 'tone') {
      return inp('tonefreq', 'Tone Frequency (Hz)', 'number', '440', 'min="20" max="20000" step="1"') +
        sel('tonewave', 'Waveform Type', [
          ['sine', 'Sine Wave (Pure Smooth Tone)'],
          ['triangle', 'Triangle Wave (Soft Warm Tone)'],
          ['square', 'Square Wave (Hollow Digital Tone)'],
          ['sawtooth', 'Sawtooth Wave (Buzzy Synth Tone)']
        ]) +
        inp('tonedur', 'Duration (Seconds)', 'number', '5', 'min="1" max="60"');
    }
    if (mode === 'noise') {
      return sel('noisetype', 'Noise Color', [
        ['white', 'White Noise (Equal energy per frequency - focus & mask sounds)'],
        ['pink', 'Pink Noise (Deeper, soothing rain/waterfall sound)'],
        ['brown', 'Brown Noise (Deepest rumble, ideal for deep sleep)']
      ]) +
      inp('noisedur', 'Duration (Seconds)', 'number', '10', 'min="1" max="60"');
    }
    if (mode === 'pitch432') {
      return `<p class="hint">Convert music from standard 440Hz concert pitch to 432Hz harmonic Solfeggio frequency (-31.766 cents pitch adjustment).</p>`;
    }
    if (mode === 'reverse') {
      return `<p class="hint">Reverses the audio track so it plays backwards from end to beginning.</p>`;
    }
    if (mode === 'karaoke') {
      return `<p class="hint">Cancels centered lead vocals using stereo phase inversion to create an instrumental karaoke track.</p>`;
    }
    if (mode === 'nightcore') {
      return sel('ncspeed', 'Nightcore Speed & Pitch Boost', [
        ['1.25', 'Standard Nightcore (+25% Speed & Pitch)'],
        ['1.20', 'Mild Nightcore (+20%)'],
        ['1.30', 'Fast Nightcore (+30%)'],
        ['1.15', 'Subtle (+15%)']
      ]);
    }
    return '';
  },

  setup() {
    const mode = (this.vars || {}).mode || 'bpm';
    if (mode === 'bpm') {
      const box = $('.custom', work);
      if (!box) return;
      let taps = [];
      const tapBtn = $('#tapbtn', work);
      const display = document.createElement('div');
      display.style.cssText = 'text-align:center;font-size:36px;font-weight:800;color:var(--r,#d32f29);margin:10px 0';
      display.textContent = '-- BPM';
      box.appendChild(display);

      if (tapBtn) {
        tapBtn.onclick = () => {
          const now = Date.now();
          if (taps.length && (now - taps[taps.length - 1] > 3000)) taps = [];
          taps.push(now);
          if (taps.length > 1) {
            const diffs = [];
            for (let i = 1; i < taps.length; i++) diffs.push(taps[i] - taps[i - 1]);
            const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
            const bpm = Math.round(60000 / avgDiff);
            display.textContent = `${bpm} BPM`;
          }
        };
      }
    }
  },

  async run([file], status) {
    const mode = (this.vars || {}).mode || 'bpm';
    status(T.working || 'Generating sound…');

    if (mode === 'tone') {
      const freq = +v('tonefreq') || 440;
      const wave = v('tonewave') || 'sine';
      const dur = Math.min(60, Math.max(1, +v('tonedur') || 5));
      const sRate = 44100;
      const numSamples = sRate * dur;

      const actx = new (window.AudioContext || window.webkitAudioContext)();
      const abuf = actx.createBuffer(1, numSamples, sRate);
      const data = abuf.getChannelData(0);

      for (let i = 0; i < numSamples; i++) {
        const t = (i / sRate) * freq;
        if (wave === 'sine') data[i] = Math.sin(2 * Math.PI * t);
        else if (wave === 'square') data[i] = Math.sin(2 * Math.PI * t) >= 0 ? 0.7 : -0.7;
        else if (wave === 'sawtooth') data[i] = 2 * (t - Math.floor(t + 0.5));
        else if (wave === 'triangle') data[i] = 2 * Math.abs(2 * (t - Math.floor(t + 0.5))) - 1;
      }

      const wavBlob = encodeWav(abuf);
      return {
        name: `tone_${freq}Hz_${wave}.wav`,
        blob: wavBlob,
        info: `Generated ${freq} Hz ${wave} tone (${dur}s)`,
        view: `<audio controls src="${URL.createObjectURL(wavBlob)}" style="width:100%;margin-top:10px"></audio>`
      };
    }

    if (mode === 'noise') {
      const ntype = v('noisetype') || 'white';
      const dur = Math.min(60, Math.max(1, +v('noisedur') || 10));
      const sRate = 44100;
      const numSamples = sRate * dur;

      const actx = new (window.AudioContext || window.webkitAudioContext)();
      const abuf = actx.createBuffer(1, numSamples, sRate);
      const data = abuf.getChannelData(0);

      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      let lastOut = 0.0;

      for (let i = 0; i < numSamples; i++) {
        const white = Math.random() * 2 - 1;
        if (ntype === 'white') {
          data[i] = white * 0.3;
        } else if (ntype === 'pink') {
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
          b6 = white * 0.115926;
        } else {
          // Brown noise
          data[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = data[i];
          data[i] *= 1.8;
        }
      }

      const wavBlob = encodeWav(abuf);
      return {
        name: `${ntype}_noise_${dur}s.wav`,
        blob: wavBlob,
        info: `Generated ${ntype} noise (${dur}s)`,
        view: `<audio controls src="${URL.createObjectURL(wavBlob)}" style="width:100%;margin-top:10px"></audio>`
      };
    }

    if (mode === 'pitch432') {
      if (!file) throw new Error('Please select an audio file to convert to 432Hz.');
      const actx = new (window.AudioContext || window.webkitAudioContext)();
      const ab = await file.arrayBuffer();
      const decoded = await actx.decodeAudioData(ab);
      const ratio = 432 / 440; // ~0.981818

      const offline = new OfflineAudioContext(decoded.numberOfChannels, Math.round(decoded.length / ratio), decoded.sampleRate);
      const srcNode = offline.createBufferSource();
      srcNode.buffer = decoded;
      srcNode.playbackRate.value = ratio;
      srcNode.connect(offline.destination);
      srcNode.start();

      const rendered = await offline.startRendering();
      const wavBlob = encodeWav(rendered);
      return {
        name: `${base(file.name)}_432Hz.wav`,
        blob: wavBlob,
        info: `Tuned to 432Hz (${fmtSize(wavBlob.size)})`,
        view: `<audio controls src="${URL.createObjectURL(wavBlob)}" style="width:100%;margin-top:10px"></audio>`
      };
    }

    if (mode === 'reverse') {
      if (!file) throw new Error('Please select an audio file to reverse.');
      const actx = new (window.AudioContext || window.webkitAudioContext)();
      const ab = await file.arrayBuffer();
      const decoded = await actx.decodeAudioData(ab);
      const numChannels = decoded.numberOfChannels;
      const numSamples = decoded.length;
      const outBuf = actx.createBuffer(numChannels, numSamples, decoded.sampleRate);
      for (let ch = 0; ch < numChannels; ch++) {
        const srcData = decoded.getChannelData(ch);
        const dstData = outBuf.getChannelData(ch);
        for (let i = 0; i < numSamples; i++) {
          dstData[i] = srcData[numSamples - 1 - i];
        }
      }
      const wavBlob = encodeWav(outBuf);
      return {
        name: `${base(file.name)}_reversed.wav`,
        blob: wavBlob,
        info: `Reversed audio (${fmtSize(wavBlob.size)})`,
        view: `<audio controls src="${URL.createObjectURL(wavBlob)}" style="width:100%;margin-top:10px"></audio>`
      };
    }

    if (mode === 'karaoke') {
      if (!file) throw new Error('Please select an audio file for karaoke extraction.');
      const actx = new (window.AudioContext || window.webkitAudioContext)();
      const ab = await file.arrayBuffer();
      const decoded = await actx.decodeAudioData(ab);
      const numSamples = decoded.length;
      const numChannels = decoded.numberOfChannels;
      const outBuf = actx.createBuffer(2, numSamples, decoded.sampleRate);
      const outL = outBuf.getChannelData(0);
      const outR = outBuf.getChannelData(1);
      if (numChannels >= 2) {
        const inL = decoded.getChannelData(0);
        const inR = decoded.getChannelData(1);
        for (let i = 0; i < numSamples; i++) {
          const diff = (inL[i] - inR[i]) * 0.707;
          outL[i] = diff;
          outR[i] = -diff;
        }
      } else {
        const inM = decoded.getChannelData(0);
        for (let i = 0; i < numSamples; i++) {
          outL[i] = inM[i];
          outR[i] = inM[i];
        }
      }
      const wavBlob = encodeWav(outBuf);
      return {
        name: `${base(file.name)}_karaoke_instrumental.wav`,
        blob: wavBlob,
        info: `Karaoke track created (${fmtSize(wavBlob.size)})`,
        view: `<audio controls src="${URL.createObjectURL(wavBlob)}" style="width:100%;margin-top:10px"></audio>`
      };
    }

    if (mode === 'nightcore') {
      if (!file) throw new Error('Please select an audio file for nightcore boost.');
      const actx = new (window.AudioContext || window.webkitAudioContext)();
      const ab = await file.arrayBuffer();
      const decoded = await actx.decodeAudioData(ab);
      const speed = Math.max(1.05, Math.min(2.0, +v('ncspeed') || 1.25));

      const offline = new OfflineAudioContext(decoded.numberOfChannels, Math.round(decoded.length / speed), decoded.sampleRate);
      const srcNode = offline.createBufferSource();
      srcNode.buffer = decoded;
      srcNode.playbackRate.value = speed;
      srcNode.connect(offline.destination);
      srcNode.start();

      const rendered = await offline.startRendering();
      const wavBlob = encodeWav(rendered);
      return {
        name: `${base(file.name)}_nightcore.wav`,
        blob: wavBlob,
        info: `Nightcore remix (${Math.round(speed * 100)}% speed, ${fmtSize(wavBlob.size)})`,
        view: `<audio controls src="${URL.createObjectURL(wavBlob)}" style="width:100%;margin-top:10px"></audio>`
      };
    }

    return {
      name: 'bpm-info.txt',
      blob: new Blob(['Tap BPM tool active in browser.'], { type: 'text/plain' }),
      info: 'Tap tempo active above'
    };
  }
};

function encodeWav(abuf) {
  const numChannels = abuf.numberOfChannels;
  const sampleRate = abuf.sampleRate;
  const length = abuf.length * numChannels * 2;
  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);

  function writeString(offset, str) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true); // 16-bit
  writeString(36, 'data');
  view.setUint32(40, length, true);

  let offset = 44;
  for (let i = 0; i < abuf.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = Math.max(-1, Math.min(1, abuf.getChannelData(ch)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  return new Blob([buffer], { type: 'audio/wav' });
}
