import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useSession } from "@/lib/auth-client";

export interface RoadTrip {
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

export interface WaypointInput {
  name: string;
  latitude: number;
  longitude: number;
}

// Query key factory
const roadTripKeys = {
  all: ["roadtrips"] as const,
  detail: (id: string) => [...roadTripKeys.all, id] as const,
  waypoints: (id: string) => [...roadTripKeys.detail(id), "waypoints"] as const,
  members: (id: string) => [...roadTripKeys.detail(id), "members"] as const,
};

// Fetch a single roadtrip
export const useRoadTrip = (id: string) => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: roadTripKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<RoadTrip>(`/roadtrips/${id}`);
      return response.data;
    },
    select: (data) => ({
      ...data,
      isOwner: data.owner.id === session?.user?.id,
    }),
  });
};

// Add waypoint mutation
export const useAddWaypoint = (roadTripId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (waypoint: WaypointInput) => {
      const response = await api.post(`/roadtrips/${roadTripId}/waypoints`, {
        ...waypoint,
        order:
          queryClient.getQueryData<RoadTrip>(roadTripKeys.detail(roadTripId))
            ?.waypoints.length ?? 0,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: roadTripKeys.detail(roadTripId),
      });
    },
  });
};

// Update waypoint mutation
export const useUpdateWaypoint = (roadTripId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      waypointId,
      updates,
    }: {
      waypointId: string;
      updates: Partial<RoadTrip["waypoints"][0]>;
    }) => {
      const response = await api.put(
        `/roadtrips/${roadTripId}/waypoints/${waypointId}`,
        updates
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: roadTripKeys.detail(roadTripId),
      });
    },
  });
};

// Delete waypoint mutation
export const useDeleteWaypoint = (roadTripId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (waypointId: string) => {
      await api.delete(`/roadtrips/${roadTripId}/waypoints/${waypointId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: roadTripKeys.detail(roadTripId),
      });
    },
  });
};

// Add member mutation
export const useInviteMember = (roadTripId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (email: string) => {
      const response = await api.post(`/roadtrips/${roadTripId}/members`, {
        email: email.trim(),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: roadTripKeys.detail(roadTripId),
      });
    },
  });
};

// Remove member mutation
export const useRemoveMember = (roadTripId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/roadtrips/${roadTripId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: roadTripKeys.detail(roadTripId),
      });
    },
  });
};
