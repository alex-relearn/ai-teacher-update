import React from "react";

export const ChatControl = ({
  question,
  onChange,
  onAsk,
  onEnterKey,
  onStart,
}) => {
  return (
    <div className="gap-3 flex justify-center">
      <input
        className="focus:outline focus:outline-white/80 flex-grow bg-slate-800/60 p-2 px-4 rounded-full text-white placeholder:text-white/50 shadow-inner shadow-slate-900/60 w-[100px]"
        placeholder="Have you ever been to Japan?"
        value={question}
        onChange={onChange}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onEnterKey();
          }
        }}
      />
      <button
        className="bg-slate-100/20 p-2 px-6 rounded-full text-white"
        onClick={onAsk}
      >
        Ask
      </button>
      <button
        className="bg-green-700/30 p-2 px-6 rounded-full text-white"
        onClick={onStart}
      >
        Record
      </button>
    </div>
  );
};
