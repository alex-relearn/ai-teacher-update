import React, { useState, useEffect } from "react";

export const ZoomSettings = ({ zoomIn, zoomOut }) => {
  return (
    <div className="fixed top-7 left-4 flex bg-gradient-to-tr from-slate-300/30 via-gray-400/30 to-slate-600-400/30 h-min backdrop-blur-md rounded-xl border-slate-100/30 border">
      <button
        onClick={zoomIn}
        className="text-white font-bold py-2 px-2 rounded"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="11"
            cy="11"
            r="7"
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.5"
          />
          <line
            x1="16.5"
            y1="16.5"
            x2="20.5"
            y2="20.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="11"
            y1="8"
            x2="11"
            y2="14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="8"
            y1="11"
            x2="14"
            y2="11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <button
        onClick={zoomOut}
        className="text-white font-bold py-2 px-2 rounded"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="11"
            cy="11"
            r="7"
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.5"
          />
          <line
            x1="16.5"
            y1="16.5"
            x2="20.5"
            y2="20.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="8"
            y1="11"
            x2="14"
            y2="11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
};
