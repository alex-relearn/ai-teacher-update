import { isIOS } from "@/utils/Util";
import { teachers, useAITeacher } from "@/hooks/useAITeacher";
import { useRef } from "react";

export const BoardSettings = ({ scrollToPrev, scrollToNext }) => {
  const cantonese = useAITeacher((state) => state.cantonese);
  const setCantonese = useAITeacher((state) => state.setCantonese);

  const english = useAITeacher((state) => state.english);
  const setEnglish = useAITeacher((state) => state.setEnglish);

  // Logic to toggle languages while ensuring only one is active at a time
  const toggleCantonese = () => {
    setCantonese(!cantonese); // Toggle Cantonese state
    if (!cantonese && english) { // If enabling Cantonese and English is already enabled
      setEnglish(false); // Disable English
    }
  };

  const toggleEnglish = () => {
    setEnglish(!english); // Toggle English state
    if (!english && cantonese) { // If enabling English and Cantonese is already enabled
      setCantonese(false); // Disable Cantonese
    }
  };

  return (
    <>
      <div className="absolute right-0 top-full flex flex-row gap-2 mt-20">
        <button
          className={` ${
            cantonese
              ? "text-white bg-slate-900/40 "
              : "text-white/45 bg-slate-700/20 "
          } py-4 px-10 text-4xl rounded-full transition-colors duration-500 backdrop-blur-md`}
          onClick={toggleCantonese}
        >
          Cantonese
        </button>
        <button
          className={`${
            english
              ? "text-white bg-slate-900/40 "
              : "text-white/45 bg-slate-700/20 "
          } py-4 px-10 text-4xl rounded-full transition-colors duration-500 backdrop-blur-md`}
          onClick={toggleEnglish}
        >
          English
        </button>
        {
          isIOS() && (
            <>
              <button
                className="text-white bg-slate-900/40  py-4 px-10 text-4xl rounded-full transition-colors duration-500 backdrop-blur-md"
                onClick={() => scrollToPrev()}
              >
                Prev
              </button>
              <button
                className="text-white bg-slate-900/40  py-4 px-10 text-4xl rounded-full transition-colors duration-500 backdrop-blur-md"
                onClick={() => scrollToNext()}
              >
                Next
              </button>
            </>
          )
        }
      </div>
    </>
  );
};