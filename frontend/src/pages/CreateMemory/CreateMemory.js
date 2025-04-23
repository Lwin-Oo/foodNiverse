import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../../utils/api";
import GlobalHeader from "../../components/GlobalHeader/GlobalHeader";
import MemoryForm from "../../components/MemoryForm/MemoryForm";
import AIAgentBubble from "../../components/AIAgentBubble/AIAgentBubble";

const CreateMemory = () => {
  const [searchParams] = useSearchParams();
  const [memories, setMemories] = useState([]);
  const [sparkMemory, setSparkMemory] = useState(null);
  const [aiSuggestion, setAISuggestion] = useState(null); // ← GPT response
  const [showAI, setShowAI] = useState(false);

  const handleAddMemory = (memory) => {
    setMemories([memory, ...memories]);
  };

  const handleThreadSuggestion = (payload) => {
    setAISuggestion(payload); // { partner, message }
    setShowAI(true);
  };

  const handleAIAccept = async () => {
    const currentUser = JSON.parse(localStorage.getItem("user"));
    await API.post("/ai/threads/create", {
      userId: currentUser.uid,
      partnerId: aiSuggestion.partner.uid,
    });
    window.location.href = `/profile/${aiSuggestion.partner.name}`;
  };

  return (
    <>
      <GlobalHeader />
      <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Create a New Memory</h2>
        <MemoryForm onAddMemory={handleAddMemory} onThreadSuggestion={handleThreadSuggestion} />
      </div>

      {showAI && aiSuggestion && (
        <AIAgentBubble
          partnerName={aiSuggestion.partner.name}
          message={aiSuggestion.message}
          onConfirm={handleAIAccept}
          onClose={() => setShowAI(false)}
        />
      )}
    </>
  );
};

export default CreateMemory;
