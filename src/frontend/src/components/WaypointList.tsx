import { useCallback, useMemo, useEffect, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { WaypointInput } from "./WaypointInput";
import { GripVertical, Plus, MapPin, Flag, CircleDot } from "lucide-react";
import { Socket } from "socket.io-client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Waypoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  order: number;
}

interface RouteInfo {
  distance: number;
  duration: number;
}

interface Props {
  sessionId: string;
  socket: Socket | null;
  waypoints: Waypoint[];
  onUpdate: (waypointId: string, updates: Partial<Waypoint>) => Promise<void>;
  onDelete: (waypointId: string) => Promise<void>;
  onAdd: (waypoint: {
    name: string;
    latitude: number;
    longitude: number;
  }) => Promise<void>;
}

export const WaypointList = ({
  socket,
  waypoints,
  onUpdate,
  onDelete,
  onAdd,
}: Props) => {
  const [routeInfo, setRouteInfo] = useState<RouteInfo[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleRouteUpdate = (info: RouteInfo[]) => {
      console.log("Received route update:", info);
      setRouteInfo(info);
    };

    socket.on("route-update", handleRouteUpdate);
    return () => {
      socket.off("route-update", handleRouteUpdate);
    };
  }, [socket]);

  const orderedWaypoints = useMemo(() => {
    const sorted = [...waypoints].sort((a, b) => a.order - b.order);
    const mapped = sorted.map((wp, index) => ({
      id: wp.id,
      name: wp.name,
      isEndpoint: index === 0 || index === sorted.length - 1,
    }));

    if (mapped.length < 2) {
      return [
        { id: "start", name: "", isEndpoint: true },
        { id: "end", name: "", isEndpoint: true },
      ];
    }

    return mapped;
  }, [waypoints]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDistance = (meters: number) => {
    const miles = meters / 1609.34;
    return `${miles.toFixed(1)} mi`;
  };

  // Calculate total distance and duration from all route legs.
  const totalDistance = routeInfo.reduce((acc, leg) => acc + leg.distance, 0);
  const totalDuration = routeInfo.reduce((acc, leg) => acc + leg.duration, 0);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || result.destination.index === result.source.index)
      return;

    const newOrder = result.destination.index;

    try {
      // Optimistically update the UI
      const newWaypoints = Array.from(orderedWaypoints);
      const [removed] = newWaypoints.splice(result.source.index, 1);
      newWaypoints.splice(result.destination.index, 0, removed);
      await onUpdate(result.draggableId, { order: newOrder });
    } catch (error) {
      console.error("Failed to reorder waypoint:", error);
      toast.error("Failed to reorder waypoint. Please try again.");
    }
  };

  const handleAddStop = useCallback(() => {
    onAdd({
      name: "",
      latitude: waypoints[0].latitude,
      longitude: waypoints[0].longitude,
    });
  }, [onAdd, waypoints]);

  const handleLocationSelect = async (
    value: string,
    coordinates: { lat: number; lng: number } | undefined,
    waypointId: string
  ) => {
    if (!coordinates) return;

    try {
      if (waypointId === "start" || waypointId === "end") {
        await onAdd({
          name: value,
          latitude: coordinates.lat,
          longitude: coordinates.lng,
        });
      } else {
        await onUpdate(waypointId, {
          name: value,
          latitude: coordinates.lat,
          longitude: coordinates.lng,
        });
      }
    } catch (error) {
      console.error("Failed to update waypoint:", error);
    }
  };

  const handleRemoveStop = async (waypointId: string) => {
    if (orderedWaypoints.length <= 2) return;
    const waypoint = orderedWaypoints.find((wp) => wp.id === waypointId);
    if (waypoint?.isEndpoint) return;

    await onDelete(waypointId);
  };

  return (
    <Card className="h-80 sticky top-0 flex-grow flex flex-col bg-zinc-900 border-zinc-800 overflow-hidden">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-indigo-500" />
          <span className="font-semibold text-zinc-200">Trip Route</span>
        </div>
        <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-full">
          {orderedWaypoints.length - 2} stops
        </span>
      </div>

      <div className="flex-1 min-h-0">
        <div className="h-full overflow-y-auto">
          <div className="p-4">
            <Button
              variant="ghost"
              onClick={handleAddStop}
              className="w-full mb-3 border border-dashed border-zinc-800 hover:bg-zinc-800/50 text-zinc-400 h-10 group transition-colors duration-200 hover:border-indigo-500/50"
            >
              <Plus className="h-4 w-4 mr-2 group-hover:text-indigo-400 transition-colors" />
              <span className="group-hover:text-zinc-300 transition-colors">
                Add another stop
              </span>
            </Button>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="waypoints">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3"
                  >
                    {orderedWaypoints.map((waypoint, index) => (
                      <Draggable
                        key={waypoint.id}
                        draggableId={waypoint.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "relative flex flex-col gap-1 p-3 rounded-lg transition-all duration-200 group",
                              {
                                "bg-zinc-800 shadow-lg ring-1 ring-indigo-500/20":
                                  snapshot.isDragging,
                                "bg-zinc-900/50": !snapshot.isDragging,
                                "border border-zinc-800": waypoint.isEndpoint,
                                "hover:bg-zinc-800/50": !waypoint.isEndpoint,
                              }
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                {...provided.dragHandleProps}
                                className={cn(
                                  "p-1.5 rounded-md hover:bg-zinc-700/50 transition-colors",
                                  {
                                    "bg-zinc-700/50": snapshot.isDragging,
                                  }
                                )}
                              >
                                <GripVertical className="h-4 w-4 text-zinc-400" />
                              </div>

                              <div className="flex-shrink-0">
                                {index === 0 ? (
                                  <MapPin className="h-5 w-5 text-emerald-500" />
                                ) : index === orderedWaypoints.length - 1 ? (
                                  <Flag className="h-5 w-5 text-rose-500" />
                                ) : (
                                  <CircleDot className="h-5 w-5 text-indigo-500" />
                                )}
                              </div>

                              <div className="flex-1">
                                <WaypointInput
                                  placeholder={
                                    index === 0
                                      ? "Starting point"
                                      : index === orderedWaypoints.length - 1
                                      ? "Final destination"
                                      : `Stop ${index}`
                                  }
                                  value={waypoint.name}
                                  onChange={(value, coords) =>
                                    handleLocationSelect(
                                      value,
                                      coords,
                                      waypoint.id
                                    )
                                  }
                                  onRemove={
                                    waypoint.isEndpoint
                                      ? undefined
                                      : () => handleRemoveStop(waypoint.id)
                                  }
                                  showRemove={!waypoint.isEndpoint}
                                />
                              </div>
                            </div>

                            {/* Display individual leg info (for stops after the first one) */}
                            {index > 0 && routeInfo[index - 1] && (
                              <div className="flex items-center gap-1.5 pl-12 text-[11px] text-zinc-500">
                                <span>
                                  {formatDistance(
                                    routeInfo[index - 1].distance
                                  )}
                                </span>
                                <span>•</span>
                                <span>
                                  {formatDuration(
                                    routeInfo[index - 1].duration
                                  )}
                                </span>
                              </div>
                            )}

                            {!waypoint.isEndpoint && (
                              <div className="absolute -left-2 -top-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-xs font-semibold shadow-lg">
                                {index}
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {/* Total summary block inserted after the list */}
            {routeInfo.length > 0 && (
              <div className="mt-4 p-4 border-t border-zinc-800 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Total Distance:</span>
                  <span>{formatDistance(totalDistance)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Duration:</span>
                  <span>{formatDuration(totalDuration)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default WaypointList;
