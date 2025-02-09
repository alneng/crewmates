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
import { GripVertical, Plus } from "lucide-react";
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
    <Card className="h-full overflow-hidden flex flex-col bg-zinc-800 border-zinc-700">
      <div className="font-semibold p-4 border-b border-zinc-700 text-zinc-200">
        Trip Destinations
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="waypoints">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {orderedWaypoints.map((waypoint, index) => (
                  <Draggable
                    key={waypoint.id}
                    draggableId={waypoint.id}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex items-center gap-2"
                      >
                        <div {...provided.dragHandleProps}>
                          <GripVertical className="h-5 w-5 text-zinc-400" />
                        </div>
                        <WaypointInput
                          placeholder={
                            index === 0
                              ? "Choose starting point"
                              : index === orderedWaypoints.length - 1
                              ? "Choose destination"
                              : `Stop ${index}`
                          }
                          value={waypoint.name}
                          onChange={(value, coords) =>
                            handleLocationSelect(value, coords, waypoint.id)
                          }
                          onRemove={
                            waypoint.isEndpoint
                              ? undefined
                              : () => handleRemoveStop(waypoint.id)
                          }
                          showRemove={!waypoint.isEndpoint}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <Button
          variant="ghost"
          onClick={handleAddStop}
          className="w-full border border-dashed border-zinc-700 hover:bg-zinc-700 text-zinc-400"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add another stop
        </Button>
      </div>
    </Card>
  );
};

export default WaypointList;
