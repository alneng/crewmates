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
  // For now we're not using dynamic route info data so no need for state

  const orderedWaypoints = useMemo(() => {
    const sorted = [...waypoints].sort((a, b) => a.order - b.order);
    const mapped = sorted.map((wp, index) => ({
      id: wp.id,
      name: wp.name,
      isEndpoint: index === 0 || index === sorted.length - 1,
    }));

    // If there are fewer than 2 points, use dummy endpoints.
    if (mapped.length < 2) {
      return [
        { id: "start", name: "", isEndpoint: true },
        { id: "end", name: "", isEndpoint: true },
      ];
    }
    return mapped;
  }, [waypoints]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || result.destination.index === result.source.index)
      return;

    const newOrder = result.destination.index;
    try {
      // Optimistic reordering of waypoints
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
                      <div key={`waypoint-container-${waypoint.id}`}>
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
                                // Added border unconditionally to give every card an outline
                                "relative p-3 rounded-lg transition-all duration-200 group border border-zinc-800",
                                {
                                  "bg-zinc-800 shadow-lg ring-1 ring-indigo-500/20":
                                    snapshot.isDragging,
                                  "bg-zinc-900/50": !snapshot.isDragging,
                                  "hover:bg-zinc-800/50": !snapshot.isDragging,
                                }
                              )}
                            >
                              {/* Single row layout for all cards */}
                              <div className="flex items-center gap-1">
                                <div
                                  {...provided.dragHandleProps}
                                  className="p-1.5 rounded-md hover:bg-zinc-700/50 transition-colors"
                                >
                                  <GripVertical className="h-4 w-4 text-zinc-400" />
                                </div>
                                {index === 0 ? (
                                  <MapPin className="h-5 w-5 text-emerald-500" />
                                ) : index === orderedWaypoints.length - 1 ? (
                                  <Flag className="h-5 w-5 text-rose-500" />
                                ) : (
                                  <CircleDot className="h-5 w-5 text-indigo-500" />
                                )}
                                <div className="flex-grow ml-1">
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
                            </div>
                          )}
                        </Draggable>
                        {/* Render centered route info separator between cards */}
                        {index < orderedWaypoints.length - 1 && (
                          <div className="flex justify-center items-center my-1 text-xs text-zinc-400">
                            <span>4.2 mi</span>
                            <span className="mx-1">|</span>
                            <span>5 min</span>
                          </div>
                        )}
                      </div>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {/* Total Summary Section */}
            <div className="mt-4 p-4 border-t border-zinc-800 text-xs text-zinc-400">
              <div className="flex justify-between">
                <span>Total Distance:</span>
                <span>8.4 mi</span>
              </div>
              <div className="flex justify-between">
                <span>Total Duration:</span>
                <span>10 min</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default WaypointList;
