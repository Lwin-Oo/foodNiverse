import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/SideBar/SideBar";
import HomeFeed from "./pages/HomeFeed/HomeFeed";
import CreateMemory from "./pages/CreateMemory/CreateMemory";
import Chat from "./pages/Chat/Chat";
import AuthPage from "./pages/Auth/AuthPage";
import ProfilePage from "./pages/Profile/ProfilePage";

function App() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const username = user?.name;


  return (
    <Router>
      <Routes>
        {/* ✅ Always show AI onboarding at /auth */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Public Profile View */}
        <Route
          path="/profile/:username"
          element={
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="flex-1 p-4">
                <ProfilePage />
              </div>
            </div>
          }
        />

        {/* ✅ Default route "/" → redirect to /auth or /[username]/feed */}
        <Route
          path="/"
          element={
            token && username
              ? <Navigate to={`/${username}/feed`} />
              : <Navigate to="/auth" />
          }
        />

        {/* ✅ Protected Routes using actual username */}
        {token && username && (
          <>
            <Route
              path={`/${username}/feed`}
              element={
                <div className="flex min-h-screen">
                  <Sidebar />
                  <div className="flex-1 p-4">
                    <HomeFeed />
                  </div>
                </div>
              }
            />
            <Route
              path={`/${username}/create`}
              element={
                <div className="flex min-h-screen">
                  <Sidebar />
                  <div className="flex-1 p-4">
                    <CreateMemory />
                  </div>
                </div>
              }
            />
            <Route
              path={`/${username}/chat`}
              element={
                <div className="flex min-h-screen">
                  <Sidebar />
                  <div className="flex-1 p-4">
                    <Chat />
                  </div>
                </div>
              }
            />
          </>
        )}

        {/* ✅ Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;