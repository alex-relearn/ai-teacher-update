import Image from "next/image";

export const Logo = () => {

  return (
    <>
      <div className="fixed top-4 left-24">
        <Image
            src="/Relearn.png"
            alt="Relearn Logo"
            width={200}
            height={30}
            className="mr-2"
        />
      </div>
    </>
  );
};