import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Card } from "@/components/ui/card";
import api from "@/lib/axios";

const JoinSessionPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const joinSession = async () => {
      try {
        // Verify the session exists and get the associated road trip
        const response = await api.get(`/sessions/${sessionId}`);
        const roadTripId = response.data.roadTrip.id;

        // Navigate to the road trip page with the session ID
        navigate(`/roadtrips/${roadTripId}?session=${sessionId}`);
      } catch (error: any) {
        if (error.response?.status === 404) {
          setError("This session has expired or does not exist.");
        } else if (error.response?.status === 403) {
          setError("You do not have permission to join this session.");
        } else {
          setError("An error occurred while joining the session.");
        }
      }
    };

    joinSession();
  }, [sessionId, navigate]);

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Unable to Join Session</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="text-blue-500 hover:text-blue-600"
          >
            Return to Dashboard
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Joining Session...</h1>
        <p className="text-gray-600">
          Please wait while we connect you to the session.
        </p>
      </Card>
    </div>
  );
};

export default JoinSessionPage;
