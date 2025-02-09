import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, Share2, Users, Copy } from "lucide-react";
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

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
          {/* Invite Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="bg-zinc-800 hover:bg-zinc-700 focus:outline-none"
              >
                <Users className="w-4 h-4 mr-2" />
                Invite
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 text-zinc-200 sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Invite a Member</DialogTitle>
                <DialogDescription>
                  Invite someone to collaborate on this road trip.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInviteMember}>
                <div className="flex items-center space-x-2">
                  <div className="grid flex-1 gap-2">
                    <Label htmlFor="email" className="sr-only">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Enter email to invite"
                      className="bg-zinc-900 border-zinc-700"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 focus:outline-none"
                    disabled={inviteMember.isPending}
                  >
                    {inviteMember.isPending ? "Inviting..." : "Invite"}
                  </Button>
                </div>
                {inviteMember.error && (
                  <p className="mt-2 text-red-400 text-sm">
                    {inviteMember.error.message || "Failed to invite member"}
                  </p>
                )}
              </form>
              <DialogFooter className="sm:justify-start">
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    className="bg-zinc-300 hover:bg-zinc-700"
                  >
                    Close
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Share Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="bg-zinc-800 hover:bg-zinc-700 focus:outline-none"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 text-zinc-200 sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Share link</DialogTitle>
                <DialogDescription>
                  Anyone with this link can join this road trip planning
                  session.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center space-x-2">
                <div className="grid flex-1 gap-2">
                  <Label htmlFor="link" className="sr-only">
                    Link
                  </Label>
                  <Input
                    id="link"
                    defaultValue={`${window.location.origin}/roadtrips/${id}?session=${sessionId}`}
                    readOnly
                    className="bg-zinc-900 border-zinc-700"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="px-3 bg-zinc-800 hover:bg-zinc-700 focus:outline-none"
                  onClick={handleShareSession}
                >
                  <span className="sr-only">Copy</span>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <DialogFooter className="sm:justify-start">
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    className="bg-zinc-300 hover:bg-zinc-700"
                  >
                    Close
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
              activeCollaborators={Array.from(collaborators.keys())}
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
