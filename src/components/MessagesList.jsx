import { useAITeacher } from "@/hooks/useAITeacher";
import { isIOS } from "@/utils/Util";
import { useEffect, useRef } from "react";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

export const MessagesList = ({ currentPosition, copyAnswer}) => {
  const messages = useAITeacher((state) => state.messages);
  const stopMessage = useAITeacher((state) => state.stopMessage);
  const playMessage = useAITeacher((state) => state.playMessage);
  const setScrollHeight = useAITeacher((state) => state.setScrollHeight);
  const { currentMessage } = useAITeacher();

  const english = useAITeacher((state) => state.english);
  const cantonese = useAITeacher((state) => state.cantonese);
  const classroom = useAITeacher((state) => state.classroom);

  const container = useRef();

  useEffect(() => {
    const containerElement = container.current;
    if (currentPosition > containerElement.scrollHeight) {
      containerElement.scrollTo({
        top: containerElement.scrollHeight,
        behavior: "smooth",
      });
    } else {
      containerElement.scrollTo({
        top: currentPosition,
        behavior: "smooth",
      });
    }
  }, [currentPosition]);

  useEffect(() => {
    const containerElement = container.current;
    setScrollHeight(containerElement.scrollHeight);
  }, [messages.length])
  const processTextWithLatex = (text) => {
    // Updated regex to match both \\( ... \\) and \\[ ... \\]
    // text = text.replace(/\n/g, " ");
    const regex = /\\(\(|\[)(.*?)(\\\)|\\\])/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Push the text before the formula
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      parts.push(<InlineMath key={match.index}>{match[2]}</InlineMath>);
      lastIndex = regex.lastIndex;
    }

    // Push any remaining text after the last formula
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  const renderEnglish = (englishText) => (
    <>
      {/* <p className="text-4xl inline-block px-2 rounded-sm font-bold bg-clip-text text-transparent bg-gradient-to-br from-blue-300/90 to-white/90"> */}
      <p className="text-4xl inline-block px-2 rounded-sm font-bold bg-clip-text text-white/80 whitespace-pre-wrap">
        {processTextWithLatex(englishText)}
      </p>
    </>
  );

  return (
    <div
      className={`${
        classroom === "default"
          ? "w-[1288px] h-[676px]"
          : "w-[2528px] h-[856px]"
      } p-8 overflow-y-scroll flex flex-col space-y-8 bg-gradient-to-tr from-slate-900/60 via-slate-800/60 to-slate-900/60 backdrop-blur-md rounded-xl border-slate-100/30 border`}
      ref={container}
      style={isIOS() ? { pointerEvents: "none" } : {}}
    >
      {messages.map((message, i) => (
        <div key={i}>
          <div className="flex">
            <div className="flex-grow">
              <div className="flex items-center gap-3">
                <span
                  className={`text-white/90 text-2xl font-bold uppercase px-3 py-1 rounded-full  ${
                    message.speech === "answer"
                      ? "bg-indigo-600"
                      : "bg-teal-600"
                  }`}
                >
                  {message.speech}
                </span>
                {renderEnglish(message.answer)}
              </div>
            </div>
            <div className="self-center">
              <button
                className="text-white/65"
                onClick={() => copyAnswer(message)}
                style={isIOS() ? { pointerEvents: "auto" } : {}} // Apply style conditionally
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16">
                  <path d="M20.3116 12.6473L20.8293 10.7154C21.4335 8.46034 21.7356 7.3328 21.5081 6.35703C21.3285 5.58657 20.9244 4.88668 20.347 4.34587C19.6157 3.66095 18.4881 3.35883 16.2331 2.75458C13.978 2.15033 12.8504 1.84821 11.8747 2.07573C11.1042 2.25537 10.4043 2.65945 9.86351 3.23687C9.27709 3.86298 8.97128 4.77957 8.51621 6.44561C8.43979 6.7254 8.35915 7.02633 8.27227 7.35057L8.27222 7.35077L7.75458 9.28263C7.15033 11.5377 6.84821 12.6652 7.07573 13.641C7.25537 14.4115 7.65945 15.1114 8.23687 15.6522C8.96815 16.3371 10.0957 16.6392 12.3508 17.2435L12.3508 17.2435C14.3834 17.7881 15.4999 18.0873 16.415 17.9744C16.5152 17.9621 16.6129 17.9448 16.7092 17.9223C17.4796 17.7427 18.1795 17.3386 18.7203 16.7612C19.4052 16.0299 19.7074 14.9024 20.3116 12.6473Z" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M16.415 17.9741C16.2065 18.6126 15.8399 19.1902 15.347 19.6519C14.6157 20.3368 13.4881 20.6389 11.2331 21.2432C8.97798 21.8474 7.85044 22.1495 6.87466 21.922C6.10421 21.7424 5.40432 21.3383 4.86351 20.7609C4.17859 20.0296 3.87647 18.9021 3.27222 16.647L2.75458 14.7151C2.15033 12.46 1.84821 11.3325 2.07573 10.3567C2.25537 9.58627 2.65945 8.88638 3.23687 8.34557C3.96815 7.66065 5.09569 7.35853 7.35077 6.75428C7.77741 6.63996 8.16368 6.53646 8.51621 6.44531" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M11.7769 10L16.6065 11.2941" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M11 12.8975L13.8978 13.6739" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="self-center">
              {currentMessage === message ? (
                <button
                  className="text-white/65"
                  onClick={() => stopMessage(message)}
                  style={isIOS() ? { pointerEvents: "auto" } : {}} // Apply style conditionally
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16" >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.564A.562.562 0 0 1 9 14.437V9.564Z" />
                  </svg>
                </button>
              ) : (
                <button
                  className="text-white/65"
                  onClick={() => playMessage(message, cantonese)}
                  style={isIOS() ? { pointerEvents: "auto" } : {}}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16" >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
