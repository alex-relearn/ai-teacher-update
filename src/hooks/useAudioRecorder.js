import { upload } from '@vercel/blob/client';
import { useState, useRef, useEffect } from "react";
import Recorder from "recorder-js";

const useAudioRecorder = () => {
  const [isRecorderAvailable, setIsRecorderAvailable] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recorder, setRecorder] = useState(null);
  const [audioContext, setAudioContext] = useState(null);
  const [error, setError] = useState("");
  const inputFileRef = useRef(null);
  const [blob, setBlob] = useState(null);
  
  const setUpRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const recorder = new Recorder(audioCtx, { numChannels: 1 });
      recorder.init(stream);

      setRecorder(recorder);
      setAudioContext(audioCtx);
      setIsRecorderAvailable(true);
    } catch (error) {
      setIsRecorderAvailable(false);
      console.error(error);
      setError(error.toString());
    }
  };
  const startRecording = () => {
    if (recorder && isRecorderAvailable) {
      recorder.start().then(() => {
        setHasAudio(false);
        setIsRecording(true);
      });
    } else {
      alert("Audio Recording is not supported on your device!");
    }
  };

  const stopRecording = () => {
    if (recorder) {
      recorder.stop().then(({ blob }) => {
        setAudioBlob(blob);
        setHasAudio(true);
        setIsRecording(false);
      });
    }
  };

  const playAudio = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      // Revoke the object URL after the audio is done playing
      audio.onended = () => URL.revokeObjectURL(audioUrl);
    }
  };

  const deleteAudio = () => {
    if (audioBlob) {
      URL.revokeObjectURL(audioBlob);
    }
    setAudioBlob(null);
    setIsRecording(false);
    setHasAudio(false);
  };

  const cleanupResources = () => {
    deleteAudio();
    if (audioContext) {
      audioContext.close();
    }
    if (recorder) {
      recorder.stream.getTracks().forEach(track => track.stop());
    }
    setRecorder(null);
    setAudioContext(null);
  };

  const speechToText = async () => {
    if (!audioBlob) return null;

    return new Promise(async (resolve, reject) => {
      try {
        const mimeType = audioBlob.type || "audio/wav";
        const fileType = mimeType.split("/").pop();

        const formData = new FormData();
        const file = new File([audioBlob], `recording.${fileType}`, {
          type: audioBlob.type,
          lastModified: Date.now(),
        });

        console.log(file.size);
        
        const newBlob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/voice_upload', // Adjust this as needed
        });
  
        if (!newBlob?.url) {
          return reject({ error: "Failed to upload file to Vercel Blob" });
        }
  
        // Send the uploaded file URL to the speech-to-text API
        const response = await fetch("/api/speechToText", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileUrl: newBlob.url }),
        });
  
        if (!response.ok) {
          return reject({ error: `Request failed with status ${response.status}` });
        }
  
        const data = await response.json();
        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  };

  useEffect(() => {
    if (navigator.mediaDevices) {
      setUpRecorder();
    } else {
      setIsRecorderAvailable(false);
      alert("Audio Recording is not supported on your device!");
    }
  }, []);

  return {
    isRecording,
    hasAudio,
    error,
    startRecording,
    stopRecording,
    playAudio,
    deleteAudio,
    speechToText,
    setUpRecorder,
    cleanupResources, // Exposing cleanup function for manual cleanup if needed
  };
};

export default useAudioRecorder;
