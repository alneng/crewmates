import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useSocket } from "../hooks/socket.hooks";
import { useCollaborators } from "../hooks/collaborator.hooks";
import { useSession } from "@/lib/auth-client";

interface Props {
  sessionId: string;
  waypoints: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    order: number;
  }>;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export const CollaborativeMap = ({ sessionId, waypoints }: Props) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const cursorMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const socket = useSocket(sessionId);
  const collaborators = useCollaborators(socket);
  const { data: session } = useSession();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-74.5, 40],
      zoom: 9,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Handle cursor movement
  const handleMouseMove = useCallback(
    (e: mapboxgl.MapMouseEvent & { lngLat: mapboxgl.LngLat }) => {
      if (!socket || !session?.user) return;

      socket.emit("cursor-move", {
        latitude: e.lngLat.lat,
        longitude: e.lngLat.lng,
      });
    },
    [socket, session]
  );

  // Setup mouse move handler
  useEffect(() => {
    if (!map.current) return;

    map.current.on("mousemove", handleMouseMove);
    return () => {
      map.current?.off("mousemove", handleMouseMove);
    };
  }, [handleMouseMove]);

  // Update waypoint markers
  useEffect(() => {
    if (!map.current) return;

    // Remove old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    // Add new markers
    waypoints.forEach((waypoint) => {
      const el = document.createElement("div");
      el.className = "waypoint-marker";
      el.innerHTML = `
        <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
          ${waypoint.order + 1}
        </div>
      `;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([waypoint.longitude, waypoint.latitude])
        .addTo(map.current!);

      markersRef.current.set(waypoint.id, marker);
    });

    // Fit bounds if we have waypoints
    if (waypoints.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      waypoints.forEach((waypoint) => {
        bounds.extend([waypoint.longitude, waypoint.latitude]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [waypoints]);

  // Update collaborator cursors
  useEffect(() => {
    if (!map.current) return;

    // Remove cursors for disconnected users
    cursorMarkersRef.current.forEach((marker, userId) => {
      if (!collaborators.has(userId)) {
        marker.remove();
        cursorMarkersRef.current.delete(userId);
      }
    });

    // Update cursor positions
    collaborators.forEach((collaborator, userId) => {
      if (userId === session?.user?.id) return; // Don't show own cursor

      if (collaborator.cursor) {
        let marker = cursorMarkersRef.current.get(userId);

        if (!marker) {
          const el = document.createElement("div");
          el.className = "collaborator-cursor";
          el.innerHTML = `
            <div class="flex flex-col items-center">
              <div class="w-4 h-4 transform rotate-45 bg-purple-500"></div>
              <div class="px-2 py-1 -mt-1 bg-purple-500 rounded text-white text-xs">
                ${collaborator.userId}
              </div>
            </div>
          `;

          marker = new mapboxgl.Marker({
            element: el,
            anchor: "bottom",
          });
          cursorMarkersRef.current.set(userId, marker);
        }

        marker
          .setLngLat([
            collaborator.cursor.longitude,
            collaborator.cursor.latitude,
          ])
          .addTo(map.current);
      }
    });
  }, [collaborators, session]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full rounded-lg overflow-hidden"
    />
  );
};
