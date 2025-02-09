import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CarIcon, PlusCircle, Share2 } from "lucide-react";
import api from "@/lib/axios";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

interface RoadTrip {
  id: string;
  name: string;
  owner: { id: string; name: string };
  members: Array<{ id: string; name: string }>;
  createdAt: string;
}

interface ActiveSession {
  id: string;
  roadTripId: string;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [roadTrips, setRoadTrips] = useState<RoadTrip[]>([]);
  const [activeSessionIds, setActiveSessionIds] = useState<Map<string, string>>(
    new Map()
  );

  // Handle sorting option change
  const handleSortOption = (option: string) => {
    if (option === "Sort by oldest") {
      sortByOldest(roadTrips);
    } else if (option === "Sort by recent") {
      sortByRecent(roadTrips);
    }
  };

  // Sort the data by oldest (ascending)
  const sortByOldest = (roadTrips: RoadTrip[]) => {
    const sortedRoadTrips = [...roadTrips].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    setRoadTrips(sortedRoadTrips);
  };

  // Sort the data by recent (descending)
  const sortByRecent = (roadTrips: RoadTrip[]) => {
    const sortedRoadTrips = [...roadTrips].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setRoadTrips(sortedRoadTrips);
  };

  useEffect(() => {
    const fetchRoadTrips = async () => {
      const response = await api.get("/roadtrips");
      setRoadTrips(response.data);

      const sessionResponse = await api.get("/sessions/user/active");
      // Create a Map instead of a Set to store sessionId
      const activeSessionMap = new Map<string, string>(
        sessionResponse.data.map((s: ActiveSession) => [s.roadTripId, s.id])
      );
      setActiveSessionIds(activeSessionMap);
    };

    fetchRoadTrips();
  }, []);

  const handleCreateSession = async (roadTripId: string) => {
    try {
      const response = await api.post(`/roadtrips/${roadTripId}/sessions`);
      const sessionId = response.data.id;

      const shareLink = `${window.location.origin}/join/${sessionId}`;
      await navigator.clipboard.writeText(shareLink);

      navigate(`/roadtrips/${roadTripId}?session=${sessionId}`);
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-200">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold mr-2">My Road Trips</h1>
            <CarIcon />
          </div>
          <Link to="/roadtrips/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="w-4 h-4 mr-2" />
              New Road Trip
            </Button>
          </Link>
        </div>
        <div className="mb-5">
          {roadTrips.length > 0 ? (
            <div>
              {
                <DropdownMenu>
                  <DropdownMenuTrigger className="bg-blue-700 rounded-md p-2">
                    Sort by
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-zinc-800" align="start">
                    <DropdownMenuItem
                      className="text-white focus:bg-zinc-700 focus:text-white"
                      onClick={() => handleSortOption("Sort by recent")}
                    >
                      Recent
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-white  focus:bg-zinc-700 focus:text-white"
                      onClick={() => handleSortOption("Sort by oldest")}
                    >
                      Oldest
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            </div>
          ) : (
            ""
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roadTrips.length > 0 ? (
            roadTrips.map((trip) => (
              <Card key={trip.id} className="p-4 bg-zinc-800 border-zinc-700">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-100">
                      {trip.name}
                    </h2>
                    <div className="flex justify-center text-sm text-zinc-400">
                      Created by
                      {
                        <span className="font-extrabold mx-1">
                          {trip.owner.name}
                        </span>
                      }
                      on{" "}
                      {new Date(trip.createdAt)
                        .toLocaleString()
                        .substring(0, 8)}
                    </div>
                  </div>
                  {!activeSessionIds.has(trip.id) ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateSession(trip.id)}
                      className="border-zinc-600 bg-zinc-700 hover:bg-zinc-600"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  ) : (
                    <Link
                      to={`/roadtrips/${trip.id}?session=${activeSessionIds.get(
                        trip.id
                      )}`}
                    >
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-blue-700 hover:bg-blue-800"
                      >
                        Join Session
                      </Button>
                    </Link>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {trip.members.map((member) => (
                    <div
                      key={member.id}
                      className="px-2 py-1 bg-zinc-700 rounded-full text-sm text-zinc-200"
                    >
                      {member.name}
                    </div>
                  ))}
                </div>
              </Card>
            ))
          ) : (
            <div className="text-white place-items-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-5 bg-blue-600 rounded-md">
              <div>
                <div className="flex justify-between">
                  No road trips have been created.{" "}
                </div>
                <div>
                  Get started on your journey by creating one{" "}
                  {<b className="text-yellow-200">now!</b>}
                </div>
                <div className="flex items-center p-3">
                  <CarIcon className="" />
                  .................
                  <CarIcon className="" />
                  ..........................
                  <CarIcon className="" />
                  ..................
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
