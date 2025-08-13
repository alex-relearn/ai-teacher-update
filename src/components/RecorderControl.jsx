import React from "react";

export const RecorderControl = ({
  isRecording,
  onPlay,
  onSend,
  onDelete,
  onStop,
}) => {
  return isRecording ? (
    <button
      className="bg-red-500/30 p-2 px-6 rounded-full text-white"
      onClick={onStop}
    >
      Stop Recording
    </button>
  ) : (
    <div className="gap-3 flex justify-center">
      <button
        className="bg-blue-500/30 p-2 px-6 rounded-full text-white"
        onClick={onPlay}
      >
        Play Audio
      </button>
      <button
        className="bg-green-800/30 p-2 px-6 rounded-full text-white"
        onClick={onSend}
      >
        Send
      </button>

      <button
        className="bg-red-500/30 p-2 px-6 rounded-full text-white"
        onClick={onDelete}
      >
        Delete
      </button>
    </div>
  );
};
