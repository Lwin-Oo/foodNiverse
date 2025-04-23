import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaRobot, FaTimes } from "react-icons/fa";
import API from "../../utils/api"; // ✅ your custom axios instance

const AIAgentBubble = ({
  mode = "manual",           // "manual" or "triggered"
  partnerName = "",          // needed for "triggered"
  aiMessage = "",            // optional GPT message
  onConfirm = () => {},      // thread creation
  onClose = () => {}         // bubble close
}) => {
  const [open, setOpen] = useState(mode === "triggered");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (mode === "triggered" && partnerName) {
      setMessages([
        { sender: "ai", text: `Hey 👋 I noticed you and ${partnerName} have shared meaningful memories.` },
        { sender: "ai", text: aiMessage || `Would you like me to start a private thread for you two?` },
      ]);
    } else if (mode === "manual") {
      setMessages([
        { sender: "ai", text: "Hi there 🌙 I'm Lunr — your Foodniverse assistant. Ask me anything!" },
      ]);
    }
  }, [mode, partnerName, aiMessage]);

  const sendReply = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    try {
      const res = await API.post("/ai/chat", { prompt: input }); // ✅ uses API
      const aiReply = res.data.reply;
      setMessages(prev => [...prev, { sender: "ai", text: aiReply }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: "ai", text: "Something went wrong. Try again later." }]);
      console.error("❌ Lunr AI chat error:", err);
    }
  };

  const handleQuickReply = (reply) => {
    setMessages(prev => [...prev, { sender: "user", text: reply }]);
    if (reply.toLowerCase().includes("yes")) {
      setMessages(prev => [...prev, { sender: "ai", text: `Awesome 🌟 Creating the thread...` }]);
      setTimeout(() => onConfirm(), 1500);
    } else {
      setMessages(prev => [...prev, { sender: "ai", text: `No worries! Let me know if you change your mind.` }]);
      setTimeout(() => onClose(), 2000);
    }
  };

  return createPortal(
    <>
      {open ? (
        <div className="fixed bottom-5 right-5 w-80 bg-white shadow-2xl rounded-2xl border border-blue-200 z-[9999] flex flex-col overflow-hidden">
          <div className="bg-blue-600 text-white px-4 py-2 flex justify-between items-center">
            <span>Lunr 🌙</span>
            <FaTimes className="cursor-pointer" onClick={() => setOpen(false)} />
          </div>

          <div className="p-3 space-y-2 overflow-y-auto max-h-72">
            {messages.map((msg, i) => (
              <div key={i} className={`text-sm ${msg.sender === "ai" ? "text-gray-700" : "text-right text-blue-600 font-semibold"}`}>
                {msg.text}
              </div>
            ))}
          </div>

          {mode === "manual" ? (
            <div className="flex items-center p-2 border-t">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendReply()}
                placeholder="Ask something..."
                className="flex-1 text-sm px-3 py-2 border rounded-full"
              />
              <button
                onClick={sendReply}
                className="ml-2 text-sm bg-blue-500 text-white px-4 py-2 rounded-full"
              >
                Send
              </button>
            </div>
          ) : (
            <div className="p-2 flex justify-between border-t">
              <button onClick={() => handleQuickReply("Yes")} className="bg-blue-600 text-white px-4 py-2 rounded-full text-xs">
                Yes, create thread
              </button>
              <button onClick={() => handleQuickReply("No")} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-xs">
                No, thanks
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl z-[9999]"
          onClick={() => setOpen(true)}
        >
          <FaRobot size={20} />
        </button>
      )}
    </>,
    document.body
  );
};

export default AIAgentBubble;
