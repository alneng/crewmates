import { useCallback, useEffect, useState } from "react";
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
  const [orderedWaypoints, setOrderedWaypoints] = useState<
    Array<{
      id: string;
      name: string;
      isEndpoint: boolean;
    }>
  >([]);

  useEffect(() => {
    // Initialize ordered waypoints from props
    const sorted = [...waypoints].sort((a, b) => a.order - b.order);
    const mapped = sorted.map((wp, index) => ({
      id: wp.id,
      name: wp.name,
      isEndpoint: index === 0 || index === sorted.length - 1,
    }));

    // Ensure at least 2 waypoints
    if (mapped.length < 2) {
      const defaults = [
        { id: "start", name: "", isEndpoint: true },
        { id: "end", name: "", isEndpoint: true },
      ];
      setOrderedWaypoints(defaults);
    } else {
      setOrderedWaypoints(mapped);
    }
  }, [waypoints]);

  // Listen for waypoint updates from other users
  useEffect(() => {
    if (!socket) return;

    const handleWaypointUpdated = (data: {
      id: string;
      order?: number;
      name?: string;
    }) => {
      if (data.order !== undefined) {
        setOrderedWaypoints((prev) => {
          const reordered = [...prev];
          const sourceIndex = reordered.findIndex((wp) => wp.id === data.id);
          if (sourceIndex === -1) return prev;

          const [movedItem] = reordered.splice(sourceIndex, 1);
          reordered.splice(data.order ?? 0, 0, movedItem);

          return reordered.map((wp, index) => ({
            ...wp,
            isEndpoint: index === 0 || index === reordered.length - 1,
          }));
        });
      }
    };

    socket.on("waypoint-updated", handleWaypointUpdated);
    return () => {
      socket.off("waypoint-updated", handleWaypointUpdated);
    };
  }, [socket]);

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      if (!result.destination) return;

      const reorderedWaypoints = Array.from(orderedWaypoints);
      const [reorderedItem] = reorderedWaypoints.splice(result.source.index, 1);
      reorderedWaypoints.splice(result.destination.index, 0, reorderedItem);

      // Update isEndpoint flags
      const updatedWaypoints = reorderedWaypoints.map((wp, index) => ({
        ...wp,
        isEndpoint: index === 0 || index === reorderedWaypoints.length - 1,
      }));

      setOrderedWaypoints(updatedWaypoints);

      // Update backend
      const waypointId = result.draggableId;
      await onUpdate(waypointId, { order: result.destination.index });
    },
    [orderedWaypoints, onUpdate]
  );

  const handleAddStop = () => {
    const newWaypoint = {
      id: Math.random().toString(),
      name: "",
      isEndpoint: false,
    };

    // Insert the new waypoint before the last waypoint
    const newWaypoints = [...orderedWaypoints];
    newWaypoints.splice(orderedWaypoints.length - 1, 0, newWaypoint);
    setOrderedWaypoints(newWaypoints);
  };

  const handleLocationSelect = async (
    value: string,
    coordinates: { lat: number; lng: number } | undefined,
    waypointId: string
  ) => {
    // Update local state immediately for responsive UI
    setOrderedWaypoints(
      orderedWaypoints.map((wp) =>
        wp.id === waypointId ? { ...wp, name: value } : wp
      )
    );

    if (!coordinates) return; // Only update backend when coordinates are available

    try {
      await onAdd({
        name: value,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
      });
    } catch (error) {
      console.error("Failed to add waypoint:", error);
    }
  };

  const handleRemoveStop = async (waypointId: string) => {
    // Don't allow removing if we only have 2 waypoints
    if (orderedWaypoints.length <= 2) return;

    // Don't allow removing endpoints
    const waypoint = orderedWaypoints.find((wp) => wp.id === waypointId);
    if (waypoint?.isEndpoint) return;

    await onDelete(waypointId);

    setOrderedWaypoints(orderedWaypoints.filter((wp) => wp.id !== waypointId));
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
              className="w-full mb-3 border border-dashed border-zinc-800 hover:bg-zinc-800/50 text-zinc-400 h-10 group transition-all duration-200 hover:border-indigo-500/50"
            >
              <Plus className="h-4 w-4 mr-2 group-hover:text-indigo-400" />
              <span className="group-hover:text-zinc-300">
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
                            className={`
                              relative flex items-center gap-3 p-3 rounded-lg
                              ${
                                snapshot.isDragging
                                  ? "bg-zinc-800 shadow-lg ring-1 ring-indigo-500/20"
                                  : "bg-zinc-900/50"
                              }
                              ${
                                waypoint.isEndpoint
                                  ? "border border-zinc-800"
                                  : "hover:bg-zinc-800/50"
                              }
                              transition-all duration-200 group
                            `}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                {...provided.dragHandleProps}
                                className={`
                                  p-1.5 rounded-md hover:bg-zinc-700/50 transition-colors
                                  ${snapshot.isDragging ? "bg-zinc-700/50" : ""}
                                `}
                              >
                                <GripVertical className="h-4 w-4 text-zinc-400 group-hover:text-zinc-300" />
                              </div>
                              <div className="flex-shrink-0">
                                {index === 0 ? (
                                  <div className="relative">
                                    <MapPin className="h-5 w-5 text-emerald-500" />
                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                  </div>
                                ) : index === orderedWaypoints.length - 1 ? (
                                  <div className="relative">
                                    <Flag className="h-5 w-5 text-rose-500" />
                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full" />
                                  </div>
                                ) : (
                                  <div className="relative">
                                    <CircleDot className="h-5 w-5 text-indigo-500" />
                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full" />
                                  </div>
                                )}
                              </div>
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
          </div>
        </div>
      </div>
    </Card>
  );
};

export default WaypointList;
