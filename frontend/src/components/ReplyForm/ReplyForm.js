import React, { useState } from "react";
import API from "../../utils/api";

const ReplyForm = ({ replyingTo, onAddReply, onClose }) => {
  const [text, setText] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const res = await API.post(
        `/sparks/${replyingTo}/replies`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onAddReply(res.data.reply, replyingTo);
      setText("");
      onClose();
    } catch (err) {
      console.error("❌ Failed to post reply:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <textarea
        className="w-full p-2 border border-gray-300 rounded text-sm"
        rows="3"
        placeholder="Write your reply..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 text-sm hover:underline"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-1 rounded-md text-sm hover:bg-indigo-700"
        >
          Reply
        </button>
      </div>
    </form>
  );
};

export default ReplyForm;
