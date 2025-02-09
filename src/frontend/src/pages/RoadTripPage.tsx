import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, Share2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WaypointList } from "@/components/WaypointList";
import { CollaborativeMap } from "@/components/CollaborativeMap";
import { MemberList } from "@/components/MemberList";
import { useSocket } from "@/hooks/socket.hooks";
import { useCollaborators, useWaypointSync } from "@/hooks/collaborator.hooks";
import {
  useRoadTrip,
  useAddWaypoint,
  useUpdateWaypoint,
  useDeleteWaypoint,
  useInviteMember,
} from "@/hooks/roadtrip.hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

export const RoadTripPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  // Socket and collaborators
  const socket = useSocket(sessionId);
  const collaborators = useCollaborators(socket);
  useWaypointSync(socket);

  // Road trip data and mutations
  const { data: roadTrip, isLoading } = useRoadTrip(id!);
  const addWaypoint = useAddWaypoint(id!, socket);
  const updateWaypoint = useUpdateWaypoint(id!, socket);
  const deleteWaypoint = useDeleteWaypoint(id!, socket);
  const inviteMember = useInviteMember(id!);

  if (isLoading || !roadTrip) {
    return <div>Loading...</div>;
  }

  const handleAddWaypoint = async (waypoint: {
    name: string;
    latitude: number;
    longitude: number;
  }) => {
    await addWaypoint.mutateAsync(waypoint);
    socket?.emit("waypoint-update");
  };

  const handleUpdateWaypoint = async (
    waypointId: string,
    updates: { name?: string; order?: number }
  ) => {
    await updateWaypoint.mutateAsync({ waypointId, updates });
    socket?.emit("waypoint-update");
  };

  const handleDeleteWaypoint = async (waypointId: string) => {
    await deleteWaypoint.mutateAsync(waypointId);
    socket?.emit("waypoint-update");
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

  const handleShareSession = async () => {
    const shareUrl = `${window.location.origin}/roadtrips/${id}?session=${sessionId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast("Link copied to clipboard");
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  return (
    <div className="h-screen grow-0 flex flex-col bg-zinc-900 text-zinc-200">
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
          {/* Active collaborators */}
          <div className="flex -space-x-2">
            {Array.from(collaborators.values()).map((collaborator) => (
              <Avatar className="w-8 h-8" key={collaborator.userId}>
                <AvatarImage src={collaborator.image} />
                <AvatarFallback className="bg-purple-600 border-2 border-zinc-700 text-sm">
                  {collaborator.name[0]}
                </AvatarFallback>
              </Avatar>
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
        <div className="w-80 border-r border-zinc-800 bg-zinc-900 flex flex-col">
          <div className="flex-1 flex flex-col">
            <WaypointList
              sessionId={sessionId!}
              waypoints={roadTrip.waypoints}
              onUpdate={handleUpdateWaypoint}
              onDelete={handleDeleteWaypoint}
              onAdd={handleAddWaypoint}
              socket={socket}
            />
          </div>
          <div className="flex-shrink-0">
            <MemberList
              roadTripId={id!}
              owner={roadTrip.owner}
              members={roadTrip.members}
            />
          </div>
        </div>

        {/* Map */}
        <div className="flex-1">
          <CollaborativeMap
            sessionId={sessionId!}
            waypoints={roadTrip.waypoints}
            socket={socket}
          />
        </div>
      </div>
    </div>
  );
};

export default RoadTripPage;
