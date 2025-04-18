const DreamLayerTest = () => {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 overflow-hidden flex items-center justify-center">
        {/* Twinkling Stars */}
        <div className="absolute inset-0 pointer-events-none z-0">
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={`star-${i}`}
              className="absolute w-[2px] h-[2px] bg-white rounded-full animate-twinkle"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
  
        {/* Floating Bubbles */}
        <div className="absolute inset-0 pointer-events-none z-0">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={`bubble-${i}`}
              className="absolute rounded-full bg-white/10 blur-md animate-floatSlow"
              style={{
                width: `${10 + Math.random() * 30}px`,
                height: `${10 + Math.random() * 30}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>
  
        {/* Dreamy Centerpiece */}
        <div className="relative z-10 bg-white/10 text-white px-12 py-8 rounded-3xl backdrop-blur-2xl shadow-xl text-xl font-light">
          🪐 Welcome to Dream Mode
        </div>
      </div>
    );
  };
  
  export default DreamLayerTest;
  