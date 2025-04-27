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
  const [showMemory, setShowMemory] = useState(false);
  const [memoryData, setMemoryData] = useState([]);

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
        const res = await API.post("/ai/taste-profiler/chat", { text: userInput });

        if (res.data.done) {
          const profile = res.data.profile;

          const summary = `
🌟 Here's your Taste Passport:

- Flavors: ${Object.entries(profile.flavors).map(([k, v]) => `${k}: ${v}`).join(", ")}
- Aromas: ${Object.entries(profile.aromas).map(([k, v]) => `${k}: ${v}`).join(", ")}
- Textures: ${Object.entries(profile.textures).map(([k, v]) => `${k}: ${v}`).join(", ")}
- Temperatures: ${Object.entries(profile.temperatures).map(([k, v]) => `${k}: ${v}`).join(", ")}
- Cultural Focus: ${profile.culturalFocus}
- Exploration Tendency: ${profile.explorationTendency}
- Dietary Restrictions: ${profile.dietaryRestrictions.length ? profile.dietaryRestrictions.join(", ") : "None"}

🎯 You're ready to discover amazing food!
          `.trim();

          setChatSessionMode("normal");

          setMessages(prev => [
            ...prev,
            { sender: "ai", text: "🎉 Done! Your Taste Passport is ready! Let's explore flavors perfect for you." },
            { sender: "ai", text: summary }
          ]);
        } else {
          setMessages(prev => [
            ...prev,
            { sender: "ai", text: res.data.nextQuestion }
          ]);
        }

      } else {
        if (userInput.toLowerCase().includes("start my taste journey")) {
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

  const fetchTasteMemory = async () => {
    try {
      const res = await API.get("/ai/taste-profiler/memory");
      setMemoryData(res.data.memory);
      setShowMemory(true);
    } catch (err) {
      console.error("❌ Failed to fetch Taste Memory:", err);
      setMessages(prev => [...prev, { sender: "ai", text: "Oops. Could not load your Taste Journey." }]);
    }
  };

  const handleQuickReply = async (reply) => {
    setMessages(prev => [...prev, { sender: "user", text: reply }]);
    if (reply.toLowerCase().includes("yes")) {
      setMessages(prev => [...prev, { sender: "ai", text: `Awesome 🌟 Creating the thread...` }]);
      setTimeout(() => onConfirm(), 1500);
    } else {
      setMessages(prev => [...prev, { sender: "ai", text: `No worries! I'm here whenever you need me.` }]);
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

            {/* 🚀 Taste Journey Timeline */}
            {showMemory && (
              <div className="mt-4 border-t pt-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">📜 Your Taste Journey:</h3>
                {memoryData.map((step, idx) => (
                  <div key={idx} className="mb-3">
                    <p className="text-xs text-gray-700">
                      <b>Step {step.step}:</b> <br />
                      <i>AI asked:</i> {step.aiQuestion} <br />
                      <i>You replied:</i> {step.userAnswer}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      <i>Reasoning:</i> {step.reasoning.join("; ")}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      <i>Updated Taste:</i> {JSON.stringify(step.profileUpdate)}
                    </p>
                    <hr className="my-2" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {mode === "manual" || chatSessionMode === "tasteProfiler" ? (
            <div className="flex flex-col p-2 border-t">
              <div className="flex items-center">
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
              <button
                onClick={fetchTasteMemory}
                className="mt-2 text-xs text-blue-500 hover:underline"
              >
                📜 View My Full Taste Journey
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
