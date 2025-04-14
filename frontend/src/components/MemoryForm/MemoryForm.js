import React, { useState } from "react";
import API from "../../utils/api"; // ✅ make sure path is correct

const MemoryForm = ({ onAddMemory }) => {
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [journal, setJournal] = useState("");
  const [tags, setTags] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setImageFile(file);       // store the real file
      setImageUrl(localUrl);    // preview
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile || !journal) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result;

      const memory = {
        image: base64Image,
        journal,
        tags: tags.split(",").map(tag => tag.trim()),
      };

      try {
        const res = await API.post("/memories", memory);
        onAddMemory(res.data.memory);
        setImageFile(null);
        setImageUrl(null);
        setJournal("");
        setTags("");
      } catch (err) {
        console.error("❌ Failed to save memory:", err);
      }
    };

    reader.readAsDataURL(imageFile); // 🔥 converts to base64
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="text-sm font-medium">📸 Upload a photo</label>
      <input type="file" accept="image/*" onChange={handleImageChange} />

      {imageUrl && (
        <img src={imageUrl} alt="preview" className="rounded-lg max-h-64 object-contain border" />
      )}

      <textarea
        placeholder="Write your food story..."
        className="p-3 border border-gray-300 rounded-md text-sm"
        value={journal}
        onChange={(e) => setJournal(e.target.value)}
      />

      <input
        type="text"
        placeholder="Tag friends (comma-separated)"
        className="p-3 border border-gray-300 rounded-md text-sm"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />

      <button
        type="submit"
        className="bg-gradient-to-r from-pink-400 to-yellow-400 hover:from-pink-500 hover:to-yellow-500 text-white font-semibold py-2 px-4 rounded-full shadow-md text-sm w-fit mx-auto"
      >
        Save Memory
      </button>
    </form>
  );
};

export default MemoryForm;
