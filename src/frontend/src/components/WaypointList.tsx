import { useCallback, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useSocket } from "../hooks/socket.hooks";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { WaypointInput } from "./WaypointInput";
import { GripVertical, Plus } from "lucide-react";

interface Waypoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  order: number;
}

interface Props {
  sessionId: string;
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
  sessionId,
  waypoints,
  onUpdate,
  onDelete,
  onAdd,
}: Props) => {
  const socket = useSocket(sessionId);
  const [startPoint, setStartPoint] = useState("");
  const [endPoint, setEndPoint] = useState("");
  const [stops, setStops] = useState<Array<{ id: string; name: string }>>([]);

  const handleDragEnd = useCallback(
    async (result: any) => {
      if (!result.destination) return;

      const newOrder = result.destination.index;
      const waypointId = result.draggableId;

      await onUpdate(waypointId, { order: newOrder });
      socket?.emit("waypoint-update", { id: waypointId, order: newOrder });
    },
    [onUpdate, socket]
  );

  const handleAddStop = () => {
    const newStop = { id: Math.random().toString(), name: "" };
    setStops([...stops, newStop]);
  };

  const handleLocationSelect = async (
    value: string,
    coordinates: { lat: number; lng: number } | undefined,
    type: "start" | "end" | string
  ) => {
    if (!coordinates) return;

    if (type === "start") {
      setStartPoint(value);
      await onAdd({
        name: value,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
      });
    } else if (type === "end") {
      setEndPoint(value);
      await onAdd({
        name: value,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
      });
    } else {
      setStops(
        stops.map((stop) =>
          stop.id === type ? { ...stop, name: value } : stop
        )
      );
      await onAdd({
        name: value,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
      });
    }
  };

  return (
    <Card className="h-full overflow-hidden flex flex-col bg-zinc-800 border-zinc-700">
      <div className="font-semibold p-4 border-b border-zinc-700 text-zinc-200">
        Trip Destinations
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Starting Point */}
        <WaypointInput
          placeholder="Choose starting point"
          value={startPoint}
          onChange={(value, coords) =>
            handleLocationSelect(value, coords, "start")
          }
          showRemove={false}
        />

        {/* Stops */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="waypoints">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {stops.map((stop, index) => (
                  <Draggable key={stop.id} draggableId={stop.id} index={index}>
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
                          placeholder={`Stop ${index + 1}`}
                          value={stop.name}
                          onChange={(value, coords) =>
                            handleLocationSelect(value, coords, stop.id)
                          }
                          onRemove={() =>
                            setStops(stops.filter((s) => s.id !== stop.id))
                          }
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

        {/* End Point */}
        <WaypointInput
          placeholder="Choose destination"
          value={endPoint}
          onChange={(value, coords) =>
            handleLocationSelect(value, coords, "end")
          }
          showRemove={false}
        />

        {/* Add Stop Button */}
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
