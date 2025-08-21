import { useEffect, useState } from "react";
import { useAITeacher } from "@/hooks/useAITeacher";
import { ChatControl } from "./ChatControl";
import { RecorderControl } from "./RecorderControl";
import useStreamingSTT from "@/hooks/useStreamingSTT";

export const TypingBox = ({prompt, subject, logout, resetQuestion, credit, reduceCredit}) => {
  const askAI = useAITeacher((state) => state.askAI);
  const loading = useAITeacher((state) => state.loading);
  const cantonese = useAITeacher((state) => state.cantonese);
  // console.log(cantonese)
  const [isTranscribing, setIsTranscribing] = useState(false);

  useEffect(() => {
    // Auto connect on mount for faster UX; optional
    if (!isTranscribing) {
      // best-effort connect; ignore failures, user can retry via start
      try { /* fire and forget */ } finally { /* no-op */ }
    }
  }, []);

  const stt = useStreamingSTT({ wsUrl: 'wss://llms.relearn.chat/ws/transcribe?api_key=fM4bxQ9yTl1CZ~t8,JS6|77' });

  const {
    isConnected,
    isRecording,
    transcript,
    words,
    connectAndWait,
    error,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    clearTranscript,
    lastAudioUrl,
    waitForFinalText,
    waitForFinalTranscript,
  } = stt;

  const [question, setQuestion] = useState("");
  const [hasRecording, setHasRecording] = useState(false);

  const ask = async () => {
    console.log(`\nPrompt-1: ${prompt}`)
    const res = await askAI(question, cantonese, prompt);
    if(res == 'expired') {
      logout();
    }
    setQuestion("");
  };
  
  const convertSpeechToText = async () => {
    let text = (transcript || '').trim();
    if (!text) {
      // wait briefly for final text if server finishes right after Stop
      text = await waitForFinalTranscript(2000);
      if (!text) {
        text = await waitForFinalText(1000);
      }
    }
    console.log("text: ", text);
    if (!text) return;
    setIsTranscribing(true);
    const res = await askAI(text, cantonese, prompt);
    setIsTranscribing(false);
    if (res === 'expired') {
      logout();
      return;
    }
    setHasRecording(false);
    clearTranscript();
  };

  useEffect(() => {
    if(resetQuestion) {
      setQuestion('');
    }
  },[resetQuestion])

  return (
    <div className="z-10 max-w-[600px] flex space-y-6 flex-col bg-gradient-to-tr  from-slate-300/30 via-gray-400/30 to-slate-600-400/30 p-4  backdrop-blur-md rounded-xl border-slate-100/30 border">
      <div>
        <h2 className="text-white font-bold text-xl">Ask AI teacher about your studies!</h2>
        <p className="text-white/65">Ask any question related to your studies and AI teacher will answer that</p>
      </div>

      {loading || isTranscribing ? (
        <div className="flex justify-center items-center">
          <span className="relative flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
          </span>
        </div>
      ) : (isRecording || hasRecording) ? (
        RecorderControl({
          isRecording: isRecording,
          onPlay: async () => {
            let url = lastAudioUrl || stt.localAudioUrl;
            if (!url) {
              // wait up to 1500ms for local URL to be ready right after stop
              const start = Date.now();
              while (!url && Date.now() - start < 1500) {
                await new Promise(r => setTimeout(r, 100));
                url = lastAudioUrl || stt.localAudioUrl;
              }
            }
            console.log('Play URL:', url);
            if (!url) return;
            try {
              const audio = new Audio();
              audio.src = url;
              await audio.play();
            } catch (e) {
              console.error('Audio play failed:', e);
            }
          },
          onSend: convertSpeechToText,
          onDelete: () => { clearTranscript(); disconnect(); setHasRecording(false); },
          onStop: async () => {
            await stopRecording(cantonese ? 'zh' : 'en');
            setHasRecording(true);
          },
        })
      ) : (
        ChatControl({
          question: question,
          onChange: (e) => setQuestion(e.target.value),
          onAsk: ask,
          onEnterKey: ask,
          onStart: async () => {
            try {
              await connectAndWait(2000);
              startRecording();
            } catch (e) {
              console.error('Failed to connect STT WebSocket:', e);
            }
          },
        })
      )}
    </div>
  );
};