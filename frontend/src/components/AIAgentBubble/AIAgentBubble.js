import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaRobot, FaTimes } from "react-icons/fa";
import API from "../../utils/api";

const AIAgentBubble = ({
  mode = "manual",           // "manual" or "triggered"
  partnerName = "",          // for triggered thread
  aiMessage = "",            // optional GPT message
  onConfirm = () => {},      // thread creation callback
  onClose = () => {}         // close bubble callback
}) => {
  const [open, setOpen] = useState(mode === "triggered");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chatSessionMode, setChatSessionMode] = useState("normal"); // normal | tasteProfiler

  useEffect(() => {
    if (mode === "triggered" && partnerName) {
      setMessages([
        { sender: "ai", text: `Hey 👋 I noticed you and ${partnerName} have shared meaningful memories.` },
        { sender: "ai", text: aiMessage || `Would you like me to start a private thread for you two?` },
      ]);
    } else if (mode === "manual") {
      setMessages([
        { sender: "ai", text: "Hi there 🌙 I'm Lunr — your Foodniverse assistant. Ask me anything!" },
        { sender: "ai", text: "Or if you're ready, type **Start my Taste Journey** to begin building your unique Foodie Passport! 🍴" },
      ]);
    }
  }, [mode, partnerName, aiMessage]);

  const sendReply = async () => {
    if (!input.trim()) return;
    const userInput = input.trim();
    const userMsg = { sender: "user", text: userInput };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    try {
      if (chatSessionMode === "tasteProfiler") {
        // 🚀 Taste Profiling Mode
        const res = await API.post("/ai/taste-profiler/chat", { text: userInput });

        if (res.data.done) {
          setChatSessionMode("normal");
          setMessages(prev => [
            ...prev,
            { sender: "ai", text: "🎉 Done! Your Taste Passport is ready! Let's explore flavors perfect for you." }
          ]);
        } else {
          setMessages(prev => [
            ...prev,
            { sender: "ai", text: res.data.nextQuestion }
          ]);
        }
      } else {
        // 🧠 Normal Chat Mode
        if (userInput.toLowerCase().includes("start my taste journey")) {
          // Start taste profiling
          await API.post("/ai/taste-profiler/start");
          setChatSessionMode("tasteProfiler");

          setMessages(prev => [
            ...prev,
            { sender: "ai", text: "Awesome! Let's craft your unique Food Profile... 🍽️💬" }
          ]);

          const startQuestion = await API.post("/ai/taste-profiler/chat", { text: "start" });
          setMessages(prev => [
            ...prev,
            { sender: "ai", text: startQuestion.data.nextQuestion }
          ]);
        } else {
          const res = await API.post("/ai/chat", { prompt: userInput });
          setMessages(prev => [...prev, { sender: "ai", text: res.data.reply }]);
        }
      }
    } catch (err) {
      console.error("❌ Lunr AI chat error:", err);
      setMessages(prev => [...prev, { sender: "ai", text: "Oops. Something went wrong, try again later." }]);
    }
  };

  const handleQuickReply = async (reply) => {
    setMessages(prev => [...prev, { sender: "user", text: reply }]);

    if (reply.toLowerCase().includes("yes")) {
      setMessages(prev => [...prev, { sender: "ai", text: `Awesome 🌟 Creating the thread...` }]);
      setTimeout(() => onConfirm(), 1500); // ✅ create thread
    } else {
      setMessages(prev => [...prev, { sender: "ai", text: `No worries! I'm here whenever you need me.` }]);
      setTimeout(() => onClose(), 2000);   // ✅ close bubble
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

          {mode === "manual" || chatSessionMode === "tasteProfiler" ? (
            <div className="flex items-center p-2 border-t">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendReply()}
                placeholder="Type your message..."
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
