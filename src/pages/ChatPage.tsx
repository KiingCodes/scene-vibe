import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import CommunityChat from "@/components/CommunityChat";

const ChatPage = () => {
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const viewport = window.visualViewport;
    if (!viewport) {
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }

    const updateKeyboardInset = () => {
      setKeyboardInset(
        Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop),
      );
    };
    updateKeyboardInset();
    viewport.addEventListener("resize", updateKeyboardInset);
    viewport.addEventListener("scroll", updateKeyboardInset);

    return () => {
      viewport.removeEventListener("resize", updateKeyboardInset);
      viewport.removeEventListener("scroll", updateKeyboardInset);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 flex h-dvh flex-col overflow-hidden gradient-dark">
      <Navbar />
      <main
        style={{
          bottom: `calc(4rem + env(safe-area-inset-bottom) + ${keyboardInset}px)`,
        }}
        className="fixed inset-x-0 top-14 flex min-h-0 flex-col overflow-hidden transition-[bottom] duration-150"
      >
        <div className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col px-0 sm:px-4 sm:py-3">
          <CommunityChat />
        </div>
      </main>
    </div>
  );
};

export default ChatPage;
