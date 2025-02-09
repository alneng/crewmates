import { FC, useEffect, useState } from "react";
import { Users, MapPin, FileText, UserPlus, Compass } from "lucide-react";

const HomePage: FC = () => {
  // Trigger entrance animations on mount
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="bg-zinc-900">
      {/* Header */}
      <header className="fixed w-full top-0 z-30 bg-zinc-900 bg-opacity-90 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-400"> Crewmates </div>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <a
                  href="#hero"
                  className="text-zinc-300 hover:text-blue-400 transition"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  className="text-zinc-300 hover:text-blue-400 transition"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="/dashboard"
                  className="text-zinc-300 hover:text-blue-400 transition"
                >
                  Dashboard
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <section
        id="hero"
        className="relative h-screen w-full overflow-hidden flex items-center justify-center"
      >
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)),
            url('https://images.pexels.com/photos/1844332/pexels-photo-1844332.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        ></div>

        <div
          className={`relative z-10 text-center px-4 transition-all duration-700 ease-out ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <h1 className="text-4xl md:text-6xl font-bold text-zinc-100 drop-shadow-xl">
            Your Next Adventure Awaits
          </h1>
          <p className="mt-4 text-lg md:text-2xl text-zinc-300 drop-shadow-md">
            Plan the perfect road trip together with friends and family. Map
            your route, share destinations, and create unforgettable memories.
          </p>
          <a
            href="/dashboard"
            className="mt-8 inline-block bg-blue-500 hover:bg-blue-600 text-zinc-900 text-xl font-semibold px-8 py-4 rounded-lg transition transform hover:scale-105 shadow-lg"
          >
            Start Planning
          </a>
        </div>

        {/* Scroll Down Indicator */}
        <div className="absolute bottom-10 w-full flex justify-center z-20">
          <svg
            className="w-8 h-8 text-zinc-100 animate-bounce"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-zinc-100 mb-12">
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-zinc-800 p-6 rounded-lg shadow-lg text-center">
              <Users className="mx-auto mb-4 w-12 h-12 text-blue-500" />
              <h3 className="text-xl font-semibold mb-2 text-zinc-100">
                Collaborative Planning
              </h3>
              <p className="text-zinc-400">
                Plan trips together seamlessly with your friends and family.
              </p>
            </div>
            <div className="bg-zinc-800 p-6 rounded-lg shadow-lg text-center">
              <MapPin className="mx-auto mb-4 w-12 h-12 text-blue-500" />
              <h3 className="text-xl font-semibold mb-2 text-zinc-100">
                Interactive Maps
              </h3>
              <p className="text-zinc-400">
                Visualize your routes with a dynamic and interactive interface.
              </p>
            </div>
            <div className="bg-zinc-800 p-6 rounded-lg shadow-lg text-center">
              <FileText className="mx-auto mb-4 w-12 h-12 text-blue-500" />
              <h3 className="text-xl font-semibold mb-2 text-zinc-100">
                Custom Itineraries
              </h3>
              <p className="text-zinc-400">
                Personalize your travel plans to create unique journeys.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section id="cta" className="py-20 bg-blue-700">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-zinc-100 mb-6">
            Ready to Start Your Adventure?
          </h2>
          <a
            href="/dashboard"
            className="inline-block bg-white text-blue-700 font-semibold px-8 py-4 rounded-lg transition transform hover:scale-105"
          >
            Get Started
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 text-center text-zinc-400">
          <p>
            &copy; {new Date().getFullYear()} Crewmates. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
