import { useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Car, Navigation, MapPinned } from "lucide-react";
import api from "@/lib/axios";

const NewRoadTripPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await api.post("/roadtrips", { name });
      const roadTripId = response.data.id;

      // Create a session automatically - Updated route
      const sessionResponse = await api.post(
        `/roadtrips/${roadTripId}/sessions`
      );
      const sessionId = sessionResponse.data.id;

      // Navigate to the road trip page with the session
      navigate(`/roadtrips/${roadTripId}?session=${sessionId}`);
    } catch (error) {
      console.error("Failed to create road trip:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1C1C1C] text-white">
      <div className="container mx-auto py-12 px-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center text-gray-400 hover:text-blue-500 transition-colors duration-200 mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="text-blue-500">
            <MapPinned className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-semibold">Plan Your Next Adventure</h1>
        </div>

        <Card className="max-w-xl mx-auto p-8 bg-[#242424] border-0 shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-blue-500/20 p-3 rounded-full">
              <Navigation className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Create New Road Trip
              </h2>
              <p className="text-gray-400 text-sm">
                Start planning your route and add waypoints
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm text-gray-400 mb-2"
                >
                  Give your trip a name
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Summer Coast Trip 2025"
                    className="pl-11 h-12 bg-[#2A2A2A] border-0 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-blue-500 hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  <>
                    <Car className="w-5 h-5" />
                    Start Your Journey
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default NewRoadTripPage;
