import { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router";
import { CollaborativeMap } from "@/components/CollaborativeMap";
import { WaypointList } from "@/components/WaypointList";
import { Button } from "@/components/ui/button";
import { Share2, ArrowLeft, Users, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  useRoadTrip,
  useAddWaypoint,
  useUpdateWaypoint,
  useDeleteWaypoint,
  useInviteMember,
  useRemoveMember,
  type WaypointInput,
} from "@/hooks/roadtrip.hooks";
import { useSession } from "@/lib/auth-client";

const RoadTripPage = () => {
  const { id = "" } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session");
  const navigate = useNavigate();
  const { data: session } = useSession();

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  // Queries and Mutations
  const { data: roadTrip, isLoading } = useRoadTrip(id);
  const addWaypoint = useAddWaypoint(id);
  const updateWaypoint = useUpdateWaypoint(id);
  const deleteWaypoint = useDeleteWaypoint(id);
  const inviteMember = useInviteMember(id);
  const removeMember = useRemoveMember(id);

  const handleAddWaypoint = async (waypoint: WaypointInput) => {
    try {
      await addWaypoint.mutateAsync(waypoint);
    } catch (error) {
      console.error("Failed to add waypoint:", error);
    }
  };

  const handleUpdateWaypoint = async (
    waypointId: string,
    updates: Partial<WaypointInput>
  ) => {
    try {
      await updateWaypoint.mutateAsync({ waypointId, updates });
    } catch (error) {
      console.error("Failed to update waypoint:", error);
    }
  };

  const handleDeleteWaypoint = async (waypointId: string) => {
    try {
      await deleteWaypoint.mutateAsync(waypointId);
    } catch (error) {
      console.error("Failed to delete waypoint:", error);
    }
  };

  const handleShareSession = async () => {
    if (!sessionId) return;
    const shareLink = `${window.location.origin}/join/${sessionId}`;
    try {
      await navigator.clipboard.writeText(shareLink);
      alert("Share link copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy share link:", error);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      await inviteMember.mutateAsync(inviteEmail);
      setInviteEmail("");
      setShowInvite(false);
    } catch (error) {
      console.error("Failed to invite member:", error);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!roadTrip?.isOwner) return;

    try {
      await removeMember.mutateAsync(userId);
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };

  if (isLoading || !roadTrip || !sessionId) {
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
                {roadTrip.isOwner && member.id !== session?.user?.id && (
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
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={inviteMember.isPending}
            >
              {inviteMember.isPending ? "Inviting..." : "Invite"}
            </Button>
          </form>
          {inviteMember.error && (
            <p className="mt-2 text-red-400 text-sm">
              {inviteMember.error.message || "Failed to invite member"}
            </p>
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
            onAdd={handleAddWaypoint}
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
