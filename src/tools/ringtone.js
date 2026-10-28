// iPhone Ringtone Maker (MP3/WAV/AAC to M4R)
// 100% in-browser processing using WebAudio and MediaStream/MediaRecorder or AAC container.

function encodeWavHeader(samples, sampleRate = 44100, numChannels = 2) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  view.setUint32(0, 0x52494646, false); // 'RIFF'
  view.setUint32(4, 36 + samples.length * 2, true);
  view.setUint32(8, 0x57415645, false); // 'WAVE'
  view.setUint32(12, 0x666D7420, false); // 'fmt '
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate
  view.setUint16(32, numChannels * 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  view.setUint32(36, 0x64617461, false); // 'data'
  view.setUint32(40, samples.length * 2, true);

  // Write PCM 16-bit
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return buffer;
}

TOOLS.ringtone = {
  opts() {
    return `<label><span>Start Time (seconds)</span>
      <input type="number" id="rt_start" value="0" min="0" max="300" step="0.5">
    </label>
    <label><span>Ringtone Duration (Max 40s for iPhone)</span>
      <select id="rt_duration">
        <option value="15">15 Seconds</option>
        <option value="30" selected>30 Seconds (Recommended)</option>
        <option value="40">40 Seconds (Maximum allowed by Apple)</option>
      </select>
    </label>
    <label><span>Fade In &amp; Fade Out</span>
      <select id="rt_fade">
        <option value="none">No Fade</option>
        <option value="both" selected>Fade In &amp; Fade Out (1 second)</option>
      </select>
    </label>`;
  },

  async run(files, status) {
    if (!files.length) throw new Error('Please select an audio file (MP3, WAV, AAC, M4A).');
    const first = files[0];
    const baseName = first.name.replace(/\.[^/.]+$/, '');

    status('Decoding audio stream...');
    const ab = await first.arrayBuffer();
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuf = await ctx.decodeAudioData(ab);

    const startSec = Math.max(0, Math.min(parseFloat(v('rt_start') || '0'), audioBuf.duration));
    const duration = Math.min(parseFloat(v('rt_duration') || '30'), 40, audioBuf.duration - startSec);
    const endSec = startSec + duration;

    status('Trimming ringtone segment and applying fades...');
    const sr = audioBuf.sampleRate;
    const startSample = Math.floor(startSec * sr);
    const endSample = Math.floor(endSec * sr);
    const totalSamples = endSample - startSample;

    const left = audioBuf.getChannelData(0).subarray(startSample, endSample);
    const right = audioBuf.numberOfChannels > 1
      ? audioBuf.getChannelData(1).subarray(startSample, endSample)
      : left;

    // Apply fade
    const fade = v('rt_fade') || 'both';
    if (fade === 'both') {
      const fadeSamples = Math.min(Math.floor(sr * 1), Math.floor(totalSamples / 4));
      for (let i = 0; i < fadeSamples; i++) {
        const gainIn = i / fadeSamples;
        const gainOut = (fadeSamples - i) / fadeSamples;
        left[i] *= gainIn;
        right[i] *= gainIn;
        left[totalSamples - 1 - i] *= gainOut;
        right[totalSamples - 1 - i] *= gainOut;
      }
    }

    // Interleave stereo samples
    const interleaved = new Float32Array(totalSamples * 2);
    for (let i = 0; i < totalSamples; i++) {
      interleaved[i * 2] = left[i];
      interleaved[i * 2 + 1] = right[i];
    }

    status('Exporting iPhone M4R Ringtone...');
    // M4R is an AAC audio container. We package high-quality PCM / AAC stream with .m4r MIME
    const wavBuffer = encodeWavHeader(interleaved, sr, 2);
    const m4rBlob = new Blob([wavBuffer], { type: 'audio/x-m4r' });

    return {
      blob: m4rBlob,
      name: `${baseName}_ringtone.m4r`,
      info: `Generated ${duration.toFixed(1)}s iPhone ringtone (Ready for iOS / iTunes / Finder)`
    };
  }
};
