import React from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { UserX, Shield, User } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useRemoveMember } from "@/hooks/roadtrip.hooks";

interface Member {
  id: string;
  name: string;
}

interface Props {
  roadTripId: string;
  owner: Member;
  members: Member[];
  activeCollaborators: string[];
}

const ActiveIndicator: React.FC = () => {
  return <div className="w-2 h-2 rounded-full animate-pulse bg-green-800" />;
};

export const MemberList: React.FC<Props> = ({
  roadTripId,
  owner,
  members,
  activeCollaborators,
}) => {
  const { data: session } = useSession();
  const removeMemberMutation = useRemoveMember(roadTripId);
  const isOwner = session?.user?.id === owner.id;

  // Filter out owner from members list to prevent duplication
  const filteredMembers = members.filter((member) => member.id !== owner.id);

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeMemberMutation.mutateAsync(userId);
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };

  return (
    <Card className="h-auto bg-zinc-800 border-zinc-700">
      <div className="font-semibold p-4 border-b border-zinc-700 text-zinc-200">
        Trip Members
      </div>
      <div className="p-4 space-y-3">
        {/* Owner */}
        <div className="flex items-center justify-between text-zinc-200">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-500" />
            {activeCollaborators.some((c) => c === owner.id) && (
              <ActiveIndicator />
            )}
            <span>{owner.name}</span>
            {session?.user?.id === owner.id && (
              <span className="text-xs text-zinc-400">(You)</span>
            )}
          </div>
          <span className="text-xs text-blue-500">Owner</span>
        </div>

        {/* Members (excluding owner) */}
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between text-zinc-200"
          >
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-zinc-400" />
              {activeCollaborators.some((c) => c === member.id) && (
                <ActiveIndicator />
              )}
              <span>{member.name}</span>
              {session?.user?.id === member.id && (
                <span className="text-xs text-zinc-400">(You)</span>
              )}
            </div>
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 hover:bg-zinc-700"
                onClick={() => handleRemoveMember(member.id)}
              >
                <UserX className="h-4 w-4 text-zinc-400 hover:text-red-400" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default MemberList;
