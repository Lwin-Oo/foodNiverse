import React, { useState } from "react";
import MemoryForm from "../../components/MemoryForm/MemoryForm";

const CreateMemory = () => {
  const [memories, setMemories] = useState([]);

  const handleAddMemory = (memory) => {
    setMemories([memory, ...memories]);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">📷 Create a New Memory</h2>
      <MemoryForm onAddMemory={handleAddMemory} />
    </div>
  );
};

export default CreateMemory;
