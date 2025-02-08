import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router";
import { CollaborativeMap } from "@/components/CollaborativeMap";
import { WaypointList } from "@/components/WaypointList";
import { Button } from "@/components/ui/button";
import { Share2, ArrowLeft, Users, X } from "lucide-react";
import api from "@/lib/axios";
import { useSession } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";

interface RoadTrip {
  id: string;
  name: string;
  owner: { id: string; name: string };
  members: Array<{ id: string; name: string }>;
  waypoints: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    order: number;
  }>;
}

const RoadTripPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session");
  const navigate = useNavigate();
  const { data: session } = useSession();

  const [roadTrip, setRoadTrip] = useState<RoadTrip | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoadTrip = async () => {
      try {
        const response = await api.get(`/roadtrips/${id}`);
        setRoadTrip(response.data);
        setIsOwner(response.data.owner.id === session?.user?.id);
      } catch (error) {
        console.error("Failed to fetch road trip:", error);
        navigate("/");
      }
    };

    fetchRoadTrip();
  }, [id, session?.user?.id, navigate]);

  const handleUpdateWaypoint = async (
    waypointId: string,
    updates: Partial<RoadTrip["waypoints"][0]>
  ) => {
    if (!roadTrip) return;

    try {
      await api.put(
        `/roadtrips/${roadTrip.id}/waypoints/${waypointId}`,
        updates
      );

      // Update local state
      setRoadTrip((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          waypoints: prev.waypoints.map((w) =>
            w.id === waypointId ? { ...w, ...updates } : w
          ),
        };
      });
    } catch (error) {
      console.error("Failed to update waypoint:", error);
    }
  };

  const handleDeleteWaypoint = async (waypointId: string) => {
    if (!roadTrip) return;

    try {
      await api.delete(`/roadtrips/${roadTrip.id}/waypoints/${waypointId}`);

      // Update local state
      setRoadTrip((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          waypoints: prev.waypoints.filter((w) => w.id !== waypointId),
        };
      });
    } catch (error) {
      console.error("Failed to delete waypoint:", error);
    }
  };

  const handleShareSession = async () => {
    if (!sessionId) return;

    // Generate shareable link
    const shareLink = `${window.location.origin}/join/${sessionId}`;

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(shareLink);
      // You might want to show a toast notification here
      alert("Share link copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy share link:", error);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roadTrip || !inviteEmail.trim()) return;

    try {
      await api.post(`/roadtrips/${roadTrip.id}/members`, {
        email: inviteEmail.trim(),
      });

      // Refresh road trip data to get updated members list
      const response = await api.get(`/roadtrips/${id}`);
      setRoadTrip(response.data);

      // Reset form
      setInviteEmail("");
      setInviteError(null);
      setShowInvite(false);
    } catch (error: any) {
      setInviteError(error.response?.data?.error || "Failed to invite member");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!roadTrip || !isOwner) return;

    try {
      await api.delete(`/roadtrips/${roadTrip.id}/members/${userId}`);

      // Refresh road trip data
      const response = await api.get(`/roadtrips/${id}`);
      setRoadTrip(response.data);
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };

  if (!roadTrip || !sessionId) {
    return <div className="h-screen bg-zinc-900 text-zinc-200">Loading...</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-900 text-zinc-200">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center text-zinc-400 hover:text-zinc-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <h1 className="text-xl font-bold">{roadTrip.name}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInvite(!showInvite)}
            className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
          >
            <Users className="w-4 h-4 mr-2" />
            Invite
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShareSession}
            className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Link
          </Button>

          <div className="flex -space-x-2">
            {roadTrip.members.map((member) => (
              <div key={member.id} className="relative group">
                <div
                  className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-sm font-medium"
                  title={member.name}
                >
                  {member.name[0]}
                </div>
                {isOwner && member.id !== session?.user?.id && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="absolute -top-1 -right-1 hidden group-hover:flex w-4 h-4 bg-red-500 rounded-full items-center justify-center"
                    title="Remove member"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invite Form */}
      {showInvite && (
        <div className="p-4 border-b border-zinc-800 bg-zinc-800">
          <form onSubmit={handleInviteMember} className="flex gap-2 max-w-md">
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter email to invite"
              className="bg-zinc-900 border-zinc-700"
            />
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Invite
            </Button>
          </form>
          {inviteError && (
            <p className="mt-2 text-red-400 text-sm">{inviteError}</p>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 border-r border-zinc-800 bg-zinc-900 p-4">
          <WaypointList
            sessionId={sessionId}
            waypoints={roadTrip.waypoints}
            onUpdate={handleUpdateWaypoint}
            onDelete={handleDeleteWaypoint}
          />
        </div>

        {/* Map */}
        <div className="flex-1 bg-zinc-900">
          <CollaborativeMap
            sessionId={sessionId}
            waypoints={roadTrip.waypoints}
          />
        </div>
      </div>
    </div>
  );
};

export default RoadTripPage;
