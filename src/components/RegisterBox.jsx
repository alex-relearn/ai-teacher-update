import { useState } from "react";

export const RegisterBox = ({ signup, setPage, groupList }) => {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    class_id: 0,
    role: 3,
  });
  const [selectedGroup, setSelectedGroup] = useState(groupList[0].id);
  const handleInputChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };
  return (
    <div className="z-[100000001] fixed top-0 w-[100%] h-[100%] flex space-y-6 flex-col bg-gradient-to-tr  from-slate-300/30 via-gray-400/30 to-slate-600-400/30 p-4  backdrop-blur-md">
      <div className="m-auto">
        <h2 className="text-white font-bold text-4xl justify-center flex">
          Sign Up
        </h2>
        <h2 className="text-white font-bold text-xl mt-[20px]">Name</h2>
        <input
          className="focus:outline focus:outline-white/80 flex-grow bg-slate-800/60 p-2 px-4 rounded-full text-white placeholder:text-white/50 shadow-inner shadow-slate-900/60 w-[400px]"
          type="text"
          placeholder="Enter Name"
          name="name"
          onChange={handleInputChange}
        />
        <h2 className="text-white font-bold text-xl mt-[20px]">Email</h2>
        <input
          className="focus:outline focus:outline-white/80 flex-grow bg-slate-800/60 p-2 px-4 rounded-full text-white placeholder:text-white/50 shadow-inner shadow-slate-900/60 w-[400px]"
          type="email"
          placeholder="Enter Email"
          name="email"
          onChange={handleInputChange}
        />
        <h2 className="text-white font-bold text-xl mt-[20px]">Password</h2>
        <input
          className="focus:outline focus:outline-white/80 flex-grow bg-slate-800/60 p-2 px-4 rounded-full text-white placeholder:text-white/50 shadow-inner shadow-slate-900/60 w-[400px]"
          type="password"
          placeholder="Enter Password"
          name="password"
          onChange={handleInputChange}
        />
        <div className="flex mt-[40px] items-center">
          <h2 className="text-white font-bold text-xl mr-5">Class</h2>
          <select
            className="focus:outline focus:outline-white/80 flex-grow bg-slate-800/60 p-2 px-4 rounded-full text-white placeholder:text-white/50 shadow-inner shadow-slate-900/60"
            onChange={(e) => setCredentials({ ...credentials, class_id: parseInt(e.target.value,10)})}
            value={credentials.class_id ?? ""}
          >
            {groupList.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
        <br />
        <button
          className="bg-slate-100/20 p-2 px-6 rounded-full text-white w-[400px] mt-[20px]"
          onClick={() => signup(credentials)}
        >
          Sign Up
        </button>
        <h2 className="text-white font-bold text-xl mt-[20px] justify-center flex">
          Already have an account ?{" "}
          <button
            className="ml-[20px] underline"
            onClick={() => setPage(false)}
          >
            Sign In
          </button>
        </h2>
      </div>
    </div>
  );
};
