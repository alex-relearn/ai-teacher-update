import React, { useState, useEffect } from 'react';

export const PromptBox = ({ 
    initialPrompt, 
    onUpdate,
    subjectList,
    setSubject,
    selectedSubject,
    showMessage,
}) => {
    const [prompt, setPrompt] = useState(initialPrompt);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedPrompt = localStorage.getItem('userPrompt');
            if (savedPrompt) {
                setPrompt(savedPrompt);
                onUpdate(savedPrompt); // Ensure onUpdate is called with the saved prompt if it exists
            }
        }
    }, [onUpdate]);

    const handleChange = (event) => {
        setPrompt(event.target.value);
    };

    const subjectChange = (event) => {
        const selectedId = parseInt(event.target.value, 10);
        const selectedSubject = subjectList.find(
          (subject) => subject.id == selectedId
        );
        if (selectedSubject.language == 1) {
          setCantonese(true);
          setEnglish(false);
        } else {
          setCantonese(false);
          setEnglish(true);
        }
        setSubject(selectedId);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (typeof window !== 'undefined') {
          localStorage.setItem('userPrompt', prompt); // Save the new prompt
        }
        onUpdate(prompt); // Update the state in the parent component
        toggleVisibility(); // Optionally toggle visibility
      };
      

    const toggleVisibility = () => { // Add this function
        setIsVisible(!isVisible);
    };

    return (
        // <div className="fixed top-7 left-4 right-4 md:bottom-4 md:right-1/4 z-20">
        <div className="fixed top-7 right-28 flex flex-col bg-gradient-to-tr from-slate-300/30 via-gray-400/30 to-slate-600-400/30 h-min backdrop-blur-md rounded-xl border-slate-100/30 border ml-[1rem]">
            <button
                onClick={toggleVisibility}
                className=" text-white font-bold py-2 px-2 rounded"
            >
                ⚙️
            </button>

            {isVisible && ( // Update this part
                <>
                    <div className="flex items-center gap-2 p-6 pt-0">
                        <label className="text-white font-normal text-xl">
                            Select a Subject:
                        </label>
                        
                        <select
                            className="focus:outline focus:outline-white/80 flex-grow bg-slate-800/60 p-2 px-4 rounded-full text-white placeholder:text-white/50 shadow-inner shadow-slate-900/60"
                            onChange={subjectChange}
                            value={selectedSubject ?? ""}
                        >
                            {subjectList.map((subject) => (
                                <option key={subject.id} value={subject.id}>
                                {subject.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-6 pt-0">
                        <button type="submit" className="bg-slate-100/20 p-2 px-6 rounded-full text-white">
                            Update
                        </button>
                        <input
                            type="text"
                            value={prompt}
                            onChange={handleChange}
                            placeholder="Enter your prompt"
                            className="focus:outline focus:outline-white/80 flex-grow bg-slate-800/60 p-2 px-4 rounded-full text-white placeholder:text-white/50 shadow-inner shadow-slate-900/60 w-[100%]"
                        />
                    </form>
                </>
            )}
        </div>
    );
};