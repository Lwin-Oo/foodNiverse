import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../utils/api";

const AuthPage = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [aiPrompt, setAiPrompt] = useState("Hi there 👋 I'm Lunr, your flavor guide. Can I get your email to get started?");
  const [inputValue, setInputValue] = useState("");
  const [userData, setUserData] = useState({});
  const [isExistingUser, setIsExistingUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const prompts = [
    "What should I call you?",
    "What's your vibe when it comes to food? (e.g. cozy, adventurous, spicy)",
    "Where are you based? (City)",
    "And your country?",
    "Create a password you'll remember 🗝️",
  ];

  const handleSubmit = async () => {
    if (step === 0) {
      const email = inputValue.trim().toLowerCase();
      if (!email.includes("@")) return alert("Please enter a valid email");
      setUserData({ email });
      setLoading(true);
      try {
        const res = await API.post("/auth/check", { email });
        setIsExistingUser(res.data.exists);
        setUserData((prev) => ({ ...prev, name: res.data.name }));
        setAiPrompt(res.data.exists
          ? `Welcome back, ${res.data.name}! 👋 Just enter your password to continue`
          : prompts[0]
        );

        setStep(1);
      } catch (err) {
        console.error(err);
        alert("Error checking user");
      } finally {
        setLoading(false);
      }
    }

    else if (isExistingUser && step === 1) {
      // LOGIN FLOW
      setLoading(true);
      try {
        const res = await API.post("/auth/login", {
          email: userData.email,
          password: inputValue,
        });
    
        // ✅ Store full user data locally
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify({
          uid: res.data.uid,
          email: res.data.email,
          name: res.data.username,
        }));
    
        navigate(`/${res.data.username}/feed`, { replace: true });

      } catch (err) {
        alert("Incorrect password");
      } finally {
        setLoading(false);
      }
    }
    

    else {
      // SIGNUP FLOW
      const keys = ["name", "vibe", "city", "country", "password"];
      const key = keys[step - 1];
      const newUserData = { ...userData, [key]: inputValue };
      setUserData(newUserData);
      const nextStep = step + 1;

      if (nextStep <= keys.length) {
        const isNameStep = key === "name";
        setAiPrompt(
          isNameStep
            ? `Nice to meet you, ${inputValue.trim()}! ${prompts[step]}`
            : prompts[step]
          );
        setStep(nextStep);
        setInputValue("");
      } else {
        // FINALIZE SIGNUP
        setLoading(true);
        try {
          const res = await API.post("/auth/register", newUserData);
          alert("✅ Account created! Log in now.");
          window.location.reload();
        } catch (err) {
          alert("Something went wrong");
        } finally {
          setLoading(false);
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 px-6">
      <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-xl max-w-xl w-full p-10 relative">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 animate-fadeInSlow">
          {aiPrompt}
        </h2>

        <input
          type={step === 5 || (isExistingUser && step === 1) ? "password" : "text"}
          className="w-full p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 text-lg shadow-sm"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          disabled={loading}
          autoFocus
        />

        <button
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all"
          onClick={handleSubmit}
          disabled={loading || !inputValue.trim()}
        >
          {loading ? "Please wait..." : "Next"}
        </button>
      </div>
    </div>
  );
};

export default AuthPage;
