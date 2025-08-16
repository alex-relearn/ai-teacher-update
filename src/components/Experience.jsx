"use client";

import { useAITeacher } from "@/hooks/useAITeacher";
import {
  CameraControls,
  Environment,
  Float,
  Gltf,
  Html,
  Loader,
  useGLTF,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva, button, useControls } from "leva";
import { Suspense, useEffect, useRef, useState } from "react";
import { degToRad } from "three/src/math/MathUtils";
import { BoardSettings } from "./BoardSettings";
import { MessagesList } from "./MessagesList";
import { Teacher } from "./Teacher";
import { TypingBox } from "./TypingBox";
import { Logo } from "./Logo";
import { LoginBox } from "./LoginBox";
import { RegisterBox } from "./RegisterBox";
import { PromptBox } from "./PromptBox";
import { ZoomSettings } from "./ZoomSettings";
import { getDeviceType, isIOS } from "@/utils/Util";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import Notification, { notify } from "./Notification";
import Dialog from "@mui/material/Dialog";
import axios from "axios";
import Image from "next/image";
export const Experience = () => {
  const messages = useAITeacher((state) => state.messages);
  const setMessages = useAITeacher((state) => state.setMessages);
  const teacher = useAITeacher((state) => state.teacher);
  const classroom = useAITeacher((state) => state.classroom);
  const setCantonese = useAITeacher((state) => state.setCantonese);
  const setEnglish = useAITeacher((state) => state.setEnglish);
  const audioGenerated = useAITeacher((state) => state.audioGenerated);
  const playAudio = useAITeacher((state) => state.playAudio);
  const cantonese = useAITeacher((state) => state.cantonese);
  const scrollHeight = useAITeacher((state) => state.scrollHeight);
  const [subjectList, setSubjectList] = useState([]);
  const [groupList, setGroupList] = useState([]);
  const [subject, setSubject] = useState(null);
  const [user, setUser] = useState("first");
  const [email, setEmail] = useState("");
  const [page, setPage] = useState(false);
  const [credit, setCredit] = useState(0);
  const [resetQuestion, setResetQuestion] = useState(false);
  const [cameraControlsRef, setCameraControlsRef] = useState(null);
  const [prompt, setPrompt] = useState(
    "You are an AI teacher, you should answer every question of student related to studies with pretending like a teacher."
  );
  const [deviceType, setDeviceType] = useState("");
  const [currentPosition, setCurrentPosition] = useState(0);
  const itemPlacement = {
    default: {
      classroom: {
        position: [0.2, -1.7, -2],
      },
      teacher: {
        position: [-0.7, -1.7, -2.7],
      },
      board: {
        position: [1.5, 0.382, -6],
      },
    },
    alternative: {
      classroom: {
        position: [0.3, -1.7, -1.5],
        scale: 0.4,
      },
      teacher: { position: [-0.7, -1.7, -3] },
      board: { position: [1.7, 0.84, -8] },
    },
  };

  const itemPlacementForiOS = {
    default: {
      classroom: {
        position: [0.2, -1.7, -2],
      },
      teacher: {
        position: [-0.7, -1.7, -3],
      },
      board: {
        position: [0.75, 0.73, -6],
      },
    },
    alternative: {
      classroom: {
        position: [0.3, -1.7, -1.5],
        scale: 0.4,
      },
      teacher: { position: [-0.7, -1.7, -3] },
      board: { position: [1.7, 0.84, -8] },
    },
  };

  // useEffect(() => {
  //   setCurrentPosition(messages.length - 1);
  // }, [messages.length]);

  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/student/authenticate`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUser(response.data.name);
        setEmail(response.data.email);
      } catch (error) {
        setUser('');
        setEmail('');
        localStorage.removeItem("token");
      }
    } else {
      setUser('');
      setEmail('');
    }
  };

  const reloadData = () => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/student/subject`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => {
        // Check if the response is OK (status code 200-299)
        return response.json();
      })
      .then((response) => {
        console.log(response);
        setSubjectList(response.subjects);
        setCredit(response.credit);
        if (response.subjects[0]) {
          setSubject(response.subjects[0].id);
          if (response.subjects[0].language == 1) {
            setCantonese(true);
            setEnglish(false);
          } else {
            setCantonese(false);
            setEnglish(true);
          }
        } else {
          setSubject(0);
        }
      })
      .catch((error) => {
        // Handle network error
        console.error(error.message);
      });
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/group/list`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => {
        // Check if the response is OK (status code 200-299)
        return response.json();
      })
      .then((response) => {
        setGroupList(response);
        console.log(response);
      })
      .catch((error) => {
        // Handle network error
        showMessage(error.message, "error");
      });
  };

  const showMessage = (message, status) => {
    notify(message, status);
  }

  useEffect(() => {
    setDeviceType(getDeviceType());
    if (typeof window !== "undefined") {
      const savedPrompt = localStorage.getItem("userPrompt");
      if (savedPrompt && savedPrompt !== prompt) {
        setPrompt(savedPrompt);
      }
    }
    // fetchUser();
    // reloadData();
  }, []);

  useEffect(() => {
    setCurrentPosition(scrollHeight - 630);
  }, [scrollHeight])

  const scrollToPrev = () => {
    if(currentPosition < 630) {
      setCurrentPosition(0);
    }
    else {
      setCurrentPosition(currentPosition - 630);
    }
  };

  const scrollToNext = () => {
    if(currentPosition > scrollHeight - 630) {
      setCurrentPosition(scrollHeight -630);
    }
    else {
      setCurrentPosition(currentPosition + 630);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/student/login`,
        credentials
      );
      const { access_token, name, credit } = response.data;

      localStorage.setItem("token", access_token);
      setUser(name);
      setEmail(credentials.email);
      setResetQuestion(false);
      reloadData();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          notify(error.response.data.message, false);
        } else {
          notify("Login Failed", false);
        }
      }
    }
  };

  const signup = async (credentials) => {
    if (!credentials.name || !credentials.password || !credentials.email) {
      console.error("All params required");
      return;
    }
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/student/signup`,
        credentials
      );
      setPage(false);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          notify(error.response.data.message, false);
        } else {
          notify("Signup Failed", false);
        }
      }
    }
  };

  const reduceCredit = async () => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/student/reduce-credit`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => {
        // Check if the response is OK (status code 200-299)
        return response.json();
      })
      .then((response) => {
        console.log(response);
        setCredit(response);
      })
      .catch((error) => {
        // Handle network error
        console.error(error.message);
      });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setResetQuestion(true);
    setMessages([]);
    setUser(null);
    setEmail(null);
  };

  const handleCloseDialog = () => {
    console.log("close");
  };

  const play = () => {
    console.log("play");
    playAudio(cantonese);
  };
  const formatToDoc = (data) => {
    const doc = new Document({
      sections: [
        {
          children: data
            .map((msg) => [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Q: ${msg.question}`,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                text: "",
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `A: ${msg.answer}`,
                  }),
                ],
              }),
              // Add an empty paragraph for spacing between Q&A pairs
              new Paragraph({
                text: "",
              }),
            ])
            .flat(),
        },
      ],
    });

    return doc;
  };

  const downloadHistory = () => {
    const doc = formatToDoc(messages);

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, "history.docx");
    });
  };

  const copyAnswer = (message) => {
    navigator.clipboard.writeText(message.answer).then(
      () => {
        notify("Copied to clipboard", true);
      },
      (err) => {
        notify("Failed to copy: " + err, false);
      }
    );
  };

  const zoomIn = () => {
    if (cameraControlsRef.current) {
      const zoomLevel = cameraControlsRef.current.camera.zoom;
      cameraControlsRef.current.zoomTo(zoomLevel * 1.2, true); // Increase zoom
    }
  };

  const zoomOut = () => {
    if (cameraControlsRef.current) {
      const zoomLevel = cameraControlsRef.current.camera.zoom;
      cameraControlsRef.current.zoomTo(zoomLevel / 1.2, true); // Decrease zoom
    }
  };
  
  const handleUpdatePrompt = (newPrompt) => {
    setPrompt(newPrompt);
    if (typeof window !== 'undefined') {
      localStorage.setItem('userPrompt', newPrompt); // Save the new prompt
    }
  };

  return (
    <>
      <div className="z-[100000000] fixed bottom-4 left-4 right-4 flex gap-3 flex-wrap justify-stretch experience">
        <ZoomSettings zoomIn={zoomIn} zoomOut={zoomOut}/>
        <Logo />
        <PromptBox 
          initialPrompt={prompt} 
          onUpdate={handleUpdatePrompt} 
          subjectList={subjectList}
          setSubject={setSubject}
          selectedSubject={subject}
          showMessage={showMessage}
        />

        <div className="fixed top-7 right-16 flex flex-col bg-gradient-to-tr from-slate-300/30 via-gray-400/30 to-slate-600-400/30 h-min backdrop-blur-md rounded-xl border-slate-100/30 border">
          <button
            className="text-white font-bold py-2 px-2 rounded"
            onClick={downloadHistory}
          >
            <svg
              width="22"
              height="23"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                opacity="0.5"
                d="M3 15C3 17.8284 3 19.2426 3.87868 20.1213C4.75736 21 6.17157 21 9 21H15C17.8284 21 19.2426 21 20.1213 20.1213C21 19.2426 21 17.8284 21 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
              <path
                d="M12 3V16M12 16L16 11.625M12 16L8 11.625"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
          </button>
        </div>

        <div className="fixed top-7 right-4 flex flex-col bg-gradient-to-tr from-slate-300/30 via-gray-400/30 to-slate-600-400/30 h-min backdrop-blur-md rounded-xl border-slate-100/30 border">
          <button
            className="text-white font-bold py-2 px-2 rounded"
            onClick={logout}
          >
            <svg
              className="ltr:mr-2 rtl:ml-2 rotate-90"
              width="22"
              height="23"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                opacity="0.5"
                d="M17 9.00195C19.175 9.01406 20.3529 9.11051 21.1213 9.8789C22 10.7576 22 12.1718 22 15.0002V16.0002C22 18.8286 22 20.2429 21.1213 21.1215C20.2426 22.0002 18.8284 22.0002 16 22.0002H8C5.17157 22.0002 3.75736 22.0002 2.87868 21.1215C2 20.2429 2 18.8286 2 16.0002L2 15.0002C2 12.1718 2 10.7576 2.87868 9.87889C3.64706 9.11051 4.82497 9.01406 7 9.00195"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M12 15L12 2M12 2L15 5.5M12 2L9 5.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <TypingBox
          prompt={prompt}
          subject={subject}
          logout={logout}
          resetQuestion={resetQuestion}
          credit={credit}
          reduceCredit={reduceCredit}
        />
      </div>
      <Leva hidden />
      <Loader />
      <Canvas
        camera={{
          position: [0, 0, 0.0001],
        }}
      >
        <CameraManager setCameraControlsRef={setCameraControlsRef} />

        <Suspense>
          <Float speed={0.5} floatIntensity={0.2} rotationIntensity={0.1}>
            <Html
              transform
              // {...(isIOS() ? itemPlacementForiOS[classroom].board : itemPlacement[classroom].board)}
              {...itemPlacement[classroom].board}
              distanceFactor={1}
            >
              {deviceType == "iPhone" && (
                <head>
                  <meta
                    name="viewport"
                    content="width=device-width, initial-scale=0.9996"
                  />
                </head>
              )}
              {deviceType == "iPad" && (
                <head>
                  <meta
                    name="viewport"
                    content="width=device-width, initial-scale=0.999996"
                  />
                </head>
              )}
              {user && (
                <>
                  <MessagesList
                    currentPosition={currentPosition}
                    copyAnswer={copyAnswer}
                  />
                  <BoardSettings
                    scrollToPrev={scrollToPrev}
                    scrollToNext={scrollToNext}
                  />
                </>
              )}
            </Html>
            <Environment preset="sunset" />
            <ambientLight intensity={0.8} color="pink" />

            <Gltf
              src={`/models/classroom_${classroom}.glb`}
              {...itemPlacement[classroom].classroom}
            />
            <Teacher
              teacher={teacher}
              key={teacher}
              {...itemPlacement[classroom].teacher}
              scale={1.5}
              rotation-y={degToRad(20)}
            />
          </Float>
        </Suspense>
      </Canvas>

      {!user && page == 0 && <LoginBox login={login} setPage={setPage} />}
      
      <Dialog
        open={audioGenerated}
        onClose={handleCloseDialog}
        className="z-[100000010]"
        PaperProps={{
          sx: {
            backgroundColor: "transparent", // Transparent background
            boxShadow: "none", // Remove shadow
          },
        }}
        BackdropProps={{
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.5)", // Optional: semi-transparent backdrop
          },
        }}
      >
        <div className="z-10 max-w-[600px] flex space-y-6 flex-col bg-gradient-to-tr  from-slate-300/30 via-gray-400/30 to-slate-600-400/30 p-4  backdrop-blur-md rounded-xl border-slate-100/30 border">
          <div className="text-center">
            <div className="flex mb-3">
              <Image
                src="/notification.png"
                alt="notification"
                width={28}
                height={28}
                className="mr-2"
              />
              <h2 className="text-white font-bold text-xl">New Message!</h2>
            </div>
            <button
              className="bg-slate-100/20 p-2 px-6 rounded-full text-white"
              onClick={play}
            >
              OK
            </button>
          </div>
        </div>
      </Dialog>
      <Notification />
    </>
  );
};

const CAMERA_POSITIONS = {
  default: [0, 6.123233995736766e-21, 0.0001],
  loading: [
    0.00002621880610890309, 0.00000515037441056466, 0.00009636414192870058,
  ],
  speaking: [0, -1.6481333940859815e-7, 0.00009999846226827279],
};

const CAMERA_ZOOMS = {
  default: 1,
  loading: 1.3,
  speaking: 2.1204819420055387,
};

const CameraManager = ({ setCameraControlsRef }) => {
  const controls = useRef();
  const loading = useAITeacher((state) => state.loading);
  const currentMessage = useAITeacher((state) => state.currentMessage);

  useEffect(() => {
    if (loading) {
      controls.current?.setPosition(...CAMERA_POSITIONS.loading, true);
      controls.current?.zoomTo(CAMERA_ZOOMS.loading, true);
    } else if (currentMessage) {
      controls.current?.setPosition(...CAMERA_POSITIONS.speaking, true);
      controls.current?.zoomTo(CAMERA_ZOOMS.speaking, true);
    }
  }, [loading]);

  useEffect(() => {
    // Expose the controls to the parent component
    setCameraControlsRef(controls);
  }, []);

  useControls("Helper", {
    getCameraPosition: button(() => {
      const position = controls.current.getPosition();
      const zoom = controls.current.camera.zoom;
      console.log([...position], zoom);
    }),
  });

  return (
    <>
      <CameraControls
        ref={controls}
        minZoom={1}
        maxZoom={3}
        polarRotateSpeed={-0.3} // REVERSE FOR NATURAL EFFECT
        azimuthRotateSpeed={-0.3} // REVERSE FOR NATURAL EFFECT
        mouseButtons={{
          left: 1, //ACTION.ROTATE
          wheel: 16, //ACTION.ZOOM
        }}
        touches={{
          one: 32, //ACTION.TOUCH_ROTATE
          two: 512, //ACTION.TOUCH_ZOOM
        }}
      />
    </>
  );
};

useGLTF.preload("/models/classroom_default.glb");
useGLTF.preload("/models/classroom_alternative.glb");
