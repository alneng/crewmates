import { useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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
    <div className="container mx-auto py-8">
      <button
        onClick={() => navigate("/")}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </button>

      <Card className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Create New Road Trip</h1>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Road Trip Name
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Summer Coast Trip 2025"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Road Trip"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default NewRoadTripPage;
