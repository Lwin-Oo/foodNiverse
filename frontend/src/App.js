import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/SideBar/SideBar";
import HomeFeed from "./pages/HomeFeed/HomeFeed";
import CreateMemory from "./pages/CreateMemory/CreateMemory";
import Chat from "./pages/Chat/Chat";

function App() {
  return (
    <Router>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 p-4">
          <Routes>
            <Route path="/" element={<HomeFeed />} />
            <Route path="/create" element={<CreateMemory />} />
            <Route path="/chat" element={<Chat />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;