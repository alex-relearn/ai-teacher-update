import { useCallback, useEffect, useRef, useState } from "react";

// Simple PCM16 conversion from Float32Array [-1,1]
function floatTo16BitPCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Uint8Array(buffer);
}

// Build a WAV container from PCM16 byte chunks
function buildWavFromPCM16(chunks, sampleRate) {
  let totalBytes = 0;
  for (const c of chunks) totalBytes += c.byteLength;
  const headerSize = 44;
  const buffer = new ArrayBuffer(headerSize + totalBytes);
  const view = new DataView(buffer);

  // RIFF identifier 'RIFF'
  writeString(view, 0, 'RIFF');
  // file length minus RIFF identifier length and file description length
  view.setUint32(4, 36 + totalBytes, true);
  // RIFF type 'WAVE'
  writeString(view, 8, 'WAVE');
  // format chunk identifier 'fmt '
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true); // PCM
  // sample format (raw)
  view.setUint16(20, 1, true); // PCM = 1
  // channel count
  view.setUint16(22, 1, true); // mono
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  const byteRate = sampleRate * 2; // mono 16-bit
  view.setUint32(28, byteRate, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier 'data'
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, totalBytes, true);

  // write PCM data
  let offset = headerSize;
  for (const c of chunks) {
    new Uint8Array(buffer, offset, c.byteLength).set(c);
    offset += c.byteLength;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Check if browser can play a given mime type
function canPlay(mime) {
  try {
    if (!mime) return false;
    const a = document.createElement('audio');
    const v = a.canPlayType(mime);
    return v === 'probably' || v === 'maybe';
  } catch { return false; }
}

// Optional: downsample Float32 PCM to target sample rate (simple linear interpolation)
function downsampleBuffer(buffer, inputSampleRate, targetSampleRate) {
  if (targetSampleRate === inputSampleRate) return buffer;
  const sampleRateRatio = inputSampleRate / targetSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    // average to reduce aliasing
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = accum / (count || 1);
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

const DEFAULT_WS_URL = process.env.NEXT_PUBLIC_STT_WS_URL || "";
const DEFAULT_TARGET_SAMPLE_RATE = 16000;

export default function useStreamingSTT(options = {}) {
  const wsUrl = options.wsUrl || DEFAULT_WS_URL;
  const targetSampleRate = options.targetSampleRate || DEFAULT_TARGET_SAMPLE_RATE;

  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const processorNodeRef = useRef(null);
  const wsRef = useRef(null);
  // Local recording for playback
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  // PCM fallback chunks
  const pcmChunksRef = useRef([]);
  // Track latest STT payload
  const lastSttRef = useRef({ text: "", wordsCount: 0 });
  // Debug counters
  const chunksSentRef = useRef(0);
  const bytesSentRef = useRef(0);
  const messagesReceivedRef = useRef(0);
  // Recording ref to avoid stale closure
  const isRecordingRef = useRef(false);
  // Stop guard to prevent repeated stops
  const hasStoppedRef = useRef(false);

  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [words, setWords] = useState([]);
  const [lastAudioUrl, setLastAudioUrl] = useState("");
  const [localAudioUrl, setLocalAudioUrl] = useState("");
  const [error, setError] = useState("");
  const [isRecorderAvailable, setIsRecorderAvailable] = useState(false);

  const checkDeviceSupport = useCallback(async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      setIsRecorderAvailable(false);
      alert("Audio Recording is not supported on your device!");
      return false;
    }
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      const host = location.hostname;
      const allowed = ["localhost", "127.0.0.1", "::1"];
      if (!allowed.includes(host)) {
        setIsRecorderAvailable(false);
        alert("Microphone requires HTTPS or localhost/127.0.0.1 (::1) in modern browsers.");
        return false;
      }
    }
    setIsRecorderAvailable(true);
    return true;
  }, []);

  // helper to process a message text
  const processMessageText = useCallback((text) => {
    try {
      const json = JSON.parse(text);
      if (messagesReceivedRef.current <= 5) {
        try {
          console.log('[STT] WS message keys:', Object.keys(json));
          const preview = JSON.stringify(json).slice(0, 200);
          console.log('[STT] WS message preview:', preview + (preview.length === 200 ? '…' : ''));
        } catch {}
      }
      if (json?.audio_files?.original) {
        setLastAudioUrl(json.audio_files.original);
      }
      const possibleText = [
        json?.text,
        json?.transcript,
        json?.transcription,
        json?.final,
        json?.final_text,
      ].map(v => (typeof v === 'string' ? v.trim() : '')).find(v => v);

      let incomingWords = null;
      if (Array.isArray(json?.words)) incomingWords = json.words;
      else if (Array.isArray(json?.segments)) {
        try { incomingWords = json.segments.map(s => ({ word: s.word || s.text || '' })); } catch {}
      }

      if (incomingWords && incomingWords.length > 0) {
        setWords(prev => (incomingWords.length >= (prev?.length || 0) ? incomingWords : prev));
      }

      if (possibleText && possibleText.length > 0) {
        setTranscript(possibleText);
        lastSttRef.current = { text: possibleText, wordsCount: Array.isArray(incomingWords) ? incomingWords.length : (Array.isArray(json?.words) ? json.words.length : 0) };
      } else if (incomingWords && incomingWords.length > 0) {
        const joined = incomingWords.map(w => (typeof w === 'string' ? w : (w.word || ''))).join(' ').trim();
        if (joined) {
          setTranscript(joined);
          lastSttRef.current = { text: joined, wordsCount: incomingWords.length };
        }
      }
      try {
        console.log('[STT] Parsed text:', lastSttRef.current.text || '(none)', 'words:', lastSttRef.current.wordsCount || 0);
      } catch {}
    } catch (e) {
      try { console.warn('[STT] Non-JSON message or parse error', e); } catch {}
    }
  }, []);

  // connect WS
  const connect = useCallback(() => {
    if (!wsUrl) {
      const err = new Error("Missing STT WebSocket URL. Set NEXT_PUBLIC_STT_WS_URL or pass wsUrl option.");
      setError(err.message);
      throw err;
    }
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        try { console.log('[STT] WS open'); } catch {}
        setIsConnected(true);
        setError("");
      };

      ws.onerror = (evt) => {
        const msg = (evt && evt.message) || "WebSocket error";
        try { console.error('[STT] WS error:', msg); } catch {}
        setError(msg);
      };

      ws.onclose = () => {
        try { console.log('[STT] WS close. Messages received:', messagesReceivedRef.current); } catch {}
        setIsConnected(false);
      };

      ws.onmessage = (evt) => {
        messagesReceivedRef.current += 1;
        const data = evt.data;
        if (typeof data === "string") {
          if (data.includes("ERROR:")) {
            setError(data);
            return;
          }
          if (data.includes("CHUNK_RECEIVED") || data.includes("Recording started")) {
            return;
          }
          processMessageText(data);
        } else if (data instanceof Blob) {
          // read blob as text
          const reader = new FileReader();
          reader.onload = () => {
            const text = typeof reader.result === 'string' ? reader.result : '';
            if (text) processMessageText(text);
          };
          try { reader.readAsText(data); } catch (e) { try { console.warn('[STT] Failed to read blob message', e); } catch {} }
        } else {
          // binary control message? ignore
        }
      };
      return ws;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err.message);
      throw err;
    }
  }, [wsUrl, processMessageText]);

  const connectAndWait = useCallback((timeoutMs = 1000) => {
    return new Promise((resolve, reject) => {
      // already open
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        setIsConnected(true);
        return resolve();
      }
      // if not created or closed, create and capture returned ws
      if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
        try {
          const ws = connect();
          if (ws) wsRef.current = ws;
        } catch (e) {
          return reject(e);
        }
      }
      const ws = wsRef.current;
      if (!ws) {
        return reject(new Error("WebSocket not initialized"));
      }
      if (ws.readyState === WebSocket.OPEN) {
        setIsConnected(true);
        return resolve();
      }
      const onOpen = () => {
        ws.removeEventListener('open', onOpen);
        ws.removeEventListener('error', onError);
        clearTimeout(timer);
        setIsConnected(true);
        resolve();
      };
      const onError = (evt) => {
        ws.removeEventListener('open', onOpen);
        ws.removeEventListener('error', onError);
        clearTimeout(timer);
        reject(evt instanceof Error ? evt : new Error("WebSocket connection error"));
      };
      const timer = setTimeout(() => {
        ws.removeEventListener('open', onOpen);
        ws.removeEventListener('error', onError);
        reject(new Error('WebSocket connection timed out'));
      }, timeoutMs);
      ws.addEventListener('open', onOpen);
      ws.addEventListener('error', onError);
    });
  }, [connect]);

  const disconnect = useCallback(() => {
    try {
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        wsRef.current.close();
      }
    } catch (_e) {}
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  const cleanupAudioGraph = useCallback(async () => {
    try {
      if (processorNodeRef.current) {
        processorNodeRef.current.disconnect();
      }
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
      }
      if (audioContextRef.current) {
        await audioContextRef.current.close();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
    } catch (_e) {}
    processorNodeRef.current = null;
    sourceNodeRef.current = null;
    audioContextRef.current = null;
    mediaStreamRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    console.log("startRecording", wsUrl);
    if (!isRecorderAvailable) {
      alert("Audio Recording is not supported on your device!");
      return;
    }
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError("WebSocket not connected. Call connect() first.");
      return;
    }
    try {
      hasStoppedRef.current = false;
      // Request mic only after user gesture and after WS is open
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      try { await audioContext.resume(); } catch {}
      const source = audioContext.createMediaStreamSource(stream);
      // ScriptProcessor is deprecated, but widely supported. Worklet is better if available.
      const bufferSize = 2048;
      const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);

      // reset PCM fallback buffer and last STT and debug counters
      pcmChunksRef.current = [];
      lastSttRef.current = { text: "", wordsCount: 0 };
      chunksSentRef.current = 0;
      bytesSentRef.current = 0;
      messagesReceivedRef.current = 0;

      // mark recording true BEFORE wiring processor to avoid stale false
      isRecordingRef.current = true;
      setIsRecording(true);

      // Collect PCM only for WAV fallback; do NOT send raw PCM to server
      processor.onaudioprocess = (e) => {
        if (!isRecordingRef.current) return;
        const input = e.inputBuffer.getChannelData(0);
        const down = downsampleBuffer(input, audioContext.sampleRate, targetSampleRate);
        const pcm16 = floatTo16BitPCM(down);
        try { pcmChunksRef.current.push(pcm16); } catch {}
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      mediaStreamRef.current = stream;
      audioContextRef.current = audioContext;
      sourceNodeRef.current = source;
      processorNodeRef.current = processor;

      // Also start local MediaRecorder for playback and streaming to server
      try {
        recordedChunksRef.current = [];
        const options = (() => {
          const preferred = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
          ];
          for (const type of preferred) {
            if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) {
              return { mimeType: type };
            }
          }
          return undefined;
        })();
        const mr = options ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
        mr.ondataavailable = async (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
            try {
              const buf = await e.data.arrayBuffer();
              if (isRecordingRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(buf);
                chunksSentRef.current += 1;
                bytesSentRef.current += buf.byteLength;
                if (chunksSentRef.current % 10 === 0) {
                  try { console.log('[STT] Sent chunks:', chunksSentRef.current, 'bytes:', bytesSentRef.current); } catch {}
                }
              }
            } catch {}
          }
        };
        mr.onstart = () => {
          try { console.log('[STT] MediaRecorder started', mr.mimeType); } catch {}
        };
        mr.onstop = () => {
          try { console.log('[STT] MediaRecorder stopped. Chunks:', recordedChunksRef.current.length); } catch {}
        };
        mediaRecorderRef.current = mr;
        mr.start(250);
      } catch (_e) {
        try { console.warn('[STT] MediaRecorder unavailable', _e); } catch {}
      }

      // Signal start
      try {
        wsRef.current.send("START_RECORDING");
        try { console.log('[STT] START_RECORDING sent'); } catch {}
      } catch (_e) {}

      // Reset playback URLs
      if (localAudioUrl) {
        try { URL.revokeObjectURL(localAudioUrl); } catch {}
      }
      setLocalAudioUrl("");
      setLastAudioUrl("");

      setTranscript("");
      setWords([]);
    } catch (e) {
      setError(e?.message || String(e));
    }
  }, [isRecorderAvailable, wsUrl, localAudioUrl, targetSampleRate]);

  const stopRecording = useCallback(async (language = "en") => {
    if (hasStoppedRef.current) return;
    hasStoppedRef.current = true;
    isRecordingRef.current = false;
    setIsRecording(false);
    // Stop local recorder first to capture final chunk
    let candidateUrl = "";
    let candidateMime = "";
    try {
      const mr = mediaRecorderRef.current;
      if (mr && mr.state !== 'inactive') {
        await new Promise((resolve) => {
          const onStop = () => { mr.removeEventListener('stop', onStop); resolve(); };
          mr.addEventListener('stop', onStop);
          try { mr.stop(); } catch { resolve(); }
          // Fallback safety in case 'stop' never fires
          setTimeout(resolve, 1000);
        });
      }
      if (recordedChunksRef.current && recordedChunksRef.current.length > 0) {
        try {
          candidateMime = (mediaRecorderRef.current && mediaRecorderRef.current.mimeType) || 'audio/webm';
          const blob = new Blob(recordedChunksRef.current, { type: candidateMime });
          const arrayBuf = await blob.arrayBuffer();
          // Optionally send last buffered chunk again to ensure tail delivery
          try {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(arrayBuf);
            }
          } catch {}
          candidateUrl = URL.createObjectURL(blob);
          try { console.log('[STT] Local audio URL set:', candidateUrl, 'mime:', candidateMime); } catch {}
        } catch (e) {
          try { console.warn('[STT] Failed to build local blob', e); } catch {}
        }
      }
      // If we don't have a playable media-recorder format, fallback to WAV
      const preferWav = !candidateUrl || !canPlay(candidateMime);
      if (preferWav && pcmChunksRef.current.length > 0) {
        try {
          if (candidateUrl) { try { URL.revokeObjectURL(candidateUrl); } catch {} }
          const wavBlob = buildWavFromPCM16(pcmChunksRef.current, targetSampleRate);
          candidateUrl = URL.createObjectURL(wavBlob);
          candidateMime = 'audio/wav';
          try { console.log('[STT] Using WAV fallback for playback'); } catch {}
        } catch (e) {
          try { console.warn('[STT] Failed to build WAV fallback', e); } catch {}
        }
      }
      if (candidateUrl) setLocalAudioUrl(candidateUrl);
      else {
        try { console.warn('[STT] No chunks captured for local playback'); } catch {}
      }
    } catch {}
    mediaRecorderRef.current = null;
    recordedChunksRef.current = [];

    // Signal stop with language code, like server expects
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const stopCommand = { command: "STOP_RECORDING", language };
        wsRef.current.send(JSON.stringify(stopCommand));
        try { console.log('[STT] STOP_RECORDING sent with', stopCommand); } catch {}
      }
    } catch (_e) {}

    try { console.log('[STT] Sent chunks total:', chunksSentRef.current, 'bytes:', bytesSentRef.current); } catch {}

    await cleanupAudioGraph();
  }, [cleanupAudioGraph, targetSampleRate]);

  useEffect(() => {
    // mirror old logic: prompt for mic and set availability
    checkDeviceSupport();
    return () => {
      // cleanup on unmount
      isRecordingRef.current = false;
      hasStoppedRef.current = true;
      disconnect();
    };
  }, [checkDeviceSupport, disconnect]);

  const clearTranscript = () => {
    setTranscript("");
    setWords([]);
    setLastAudioUrl("");
    if (localAudioUrl) {
      try { URL.revokeObjectURL(localAudioUrl); } catch {}
    }
    setLocalAudioUrl("");
  };

  // Wait for final transcript like Unity logic: require text and some words to exist
  const waitForFinalTranscript = useCallback((timeoutMs = 2500) => {
    console.log('[STT] waitForFinalTranscript start, timeoutMs:', timeoutMs);
    return new Promise((resolve) => {
      const start = Date.now();
      const ready = () => {
        const t = (lastSttRef.current.text || "").trim();
        const w = lastSttRef.current.wordsCount || 0;
        if (t && w > 0) return t;
        // fallback to current state
        const tt = (transcript || "").trim();
        if (tt && Array.isArray(words) && words.length > 0) return tt;
        return "";
      };
      const immediate = ready();
      if (immediate) {
        console.log('[STT] waitForFinalTranscript immediate result:', immediate);
        return resolve(immediate);
      }
      const timer = setInterval(() => {
        const t = ready();
        if (t || Date.now() - start >= timeoutMs) {
          clearInterval(timer);
          console.log('[STT] waitForFinalTranscript done. result:', t || '(empty)', 'elapsedMs:', Date.now() - start);
          resolve(t);
        }
      }, 100);
    });
  }, [transcript, words]);

  const waitForFinalText = useCallback((timeoutMs = 2000) => {
    console.log('[STT] waitForFinalText start, timeoutMs:', timeoutMs);
    return new Promise((resolve) => {
      const start = Date.now();
      const buildText = () => {
        const t = (transcript || "").trim();
        if (t) return t;
        if (Array.isArray(words) && words.length > 0) {
          try {
            return words.map(w => (typeof w === 'string' ? w : (w.word || ''))).join(' ').trim();
          } catch {}
        }
        return "";
      };
      const immediate = buildText();
      if (immediate) {
        console.log('[STT] waitForFinalText immediate result:', immediate);
        return resolve(immediate);
      }
      const timer = setInterval(() => {
        const txt = buildText();
        if (txt || Date.now() - start >= timeoutMs) {
          clearInterval(timer);
          console.log('[STT] waitForFinalText done. result:', txt || '(empty)', 'elapsedMs:', Date.now() - start);
          resolve(txt);
        }
      }, 100);
    });
  }, [transcript, words]);

  return {
    // state
    isConnected,
    isRecording,
    transcript,
    words,
    lastAudioUrl,
    localAudioUrl,
    error,
    isRecorderAvailable,
    // controls
    connect,
    connectAndWait,
    disconnect,
    startRecording,
    stopRecording,
    clearTranscript,
    checkDeviceSupport,
    waitForFinalText,
    waitForFinalTranscript,
  };
} 