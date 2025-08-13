const { create } = require("zustand");
const { franc } = require('franc');
const { isIOS } = require('@/utils/Util');

export const teachers = ["Nanami", "Naoki"];

export const useAITeacher = create((set, get) => ({
    messages: [],
    currentMessage: null,
    teacher: teachers[0],
    audioGenerated: false,
    messageId: 0,
    scrollHeight: 0,
    setMessages: (data) => {
        set(() => ({
            messages: data
        }))
    },
    setScrollHeight: (data) => {
        set(() => ({
            scrollHeight: data,
        }))
    },
    setTeacher: (teacher) => {
        set(() => ({
            teacher,
            messages: get().messages.map((message) => {
                message.audioPlayer = null;
                return message;
            }),
        }));
    },
    classroom: "default",
    setClassroom: (classroom) => {
        set(() => ({
            classroom,
        }));
    },
    loading: false,
    cantonese: false,
    setCantonese: (cantonese) => {
        set(() => ({
            cantonese,
        }));
    },
    english: true,
    setEnglish: (english) => {
        set(() => ({
            english,
        }));
    },
    speech: "answer",
    setSpeech: (speech) => {
        set(() => ({
            speech,
        }));
    },
    STT: async (audioblob) => {
        console.log("Received audio blob")
        console.log(audioblob)

        const formData = new FormData();
        formData.append("audio", audioblob, "audio_file.ogg");

        const audi_res = await fetch("/api/stt", {
            method: 'POST',
            body: formData
        });
        const data = audi_res.json();
        console.log("Data is ")
        console.log(data)
    },
    askAI: async (question, cantonese, prompt) => {
        if (!question) {
            return;
        }
        const message = {
            question,
            id: get().messages.length,
        };
        set(() => ({
            loading: true,
        }));

        const speech = get().speech;
        const messages = get().messages;
        const history = [];
        messages.forEach(element => {
            history.push({
                question: element.question,
                answer: element.answer
            })
        });
        // Ask AI
        const params = {
            speech: speech,
            question: question,
            prompt: prompt,
            history: history,
            cantonese: cantonese,
        }
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/openai/ask_origin`,{
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify(params)
        });
        if (res.ok) {
            const data = await res.json();
            let answer = data.answer.replace(/(\[\d+\]|\*\*)/g, '');
            answer = answer.replace(/\\\[\s*\n\s*/g, '\\[').replace(/\s*\n\s*\\\]/g, '\\]');
            message.answer = answer;
            message.speech = speech;

            // const langCode = franc(answer);
            // if(langCode == 'eng') {
            //     cantonese = false;
            // } else {
            //     cantonese = true;
            // }
            set(() => ({
                currentMessage: message,
            }));

            set((state) => ({
                messages: [...state.messages, message],
                loading: false,
            }));
            get().playMessage(message, cantonese);
        } else {
            set(() => ({
                loading: false
            }));
            if (res.status == 401) {
                return 'expired';
            }
            alert("Please try again!");
        }
        return true;
    },
    playMessage: async (message, cantonese) => {
        const { messages, stopMessage } = get();
        messages.forEach(message => {
            if (message.audioPlayer) {
                stopMessage(message);
            }
        });
        set(() => ({
            currentMessage: message,
            audioGenerated: false,
            messageId: 0,
        }));

        if (!message.audioPlayer) {
            set(() => ({
                loading: true,
            }));
            // const audioRes = await fetch(`/api/tts?text=${answer}&language=${cantonese ? "cantonese" : "english"}`);
            const audioRes = await fetch('/api/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: message.answer,
                    language: cantonese ? "cantonese" : "english",
                }),
            });
            const audio = await audioRes.blob();

            const visemes = JSON.parse(await audioRes.headers.get("visemes"));
            const audioUrl = URL.createObjectURL(audio);
            const audioPlayer = new Audio(audioUrl);

            message.visemes = visemes;
            message.audioPlayer = audioPlayer;
            message.audioPlayer.onended = () => {
                set(() => ({
                    currentMessage: null,
                }));
            };
            set(() => ({
                loading: false,
                messages: get().messages.map((m) => {
                    if (m.id === message.id) {
                        return message;
                    }
                    return m;
                }),
            }));
            if(isIOS()) {
                set(() => ({
                    currentMessage: null,
                    audioGenerated: true,
                    messageId: message.id
                }));
                return;
            }
        }
        message.audioPlayer.currentTime = 0;
        message.audioPlayer.play();
    },
    playAudio: (cantonese) => {
        const { messageId } = get();
        const message = get().messages.find((message) => message.id === messageId);
        get().playMessage(message, cantonese);
    },
    stopMessage: (message) => {
        message.audioPlayer.pause();
        set(() => ({
            currentMessage: null,
        }));
    },
}));
