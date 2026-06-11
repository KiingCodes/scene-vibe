import Navbar from '@/components/Navbar';
import CommunityChat from '@/components/CommunityChat';

const ChatPage = () => {
  return (
    <div className="h-[100dvh] flex flex-col gradient-dark overflow-hidden">
      <Navbar />
      <main className="flex-1 min-h-0 pt-14 flex flex-col">
        <div className="flex-1 min-h-0 w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-3 flex flex-col">
          <CommunityChat />
        </div>
      </main>
    </div>
  );
};

export default ChatPage;
