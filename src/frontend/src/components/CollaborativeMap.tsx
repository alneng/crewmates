import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./CollaborativeMap.css";
import { useCollaborators } from "../hooks/collaborator.hooks";
import { useSession } from "@/lib/auth-client";
import { mapbox } from "@/lib/axios";
import { Socket } from "socket.io-client";
import { MapMarkerPin } from "@/assets/MapMarkerPin";

export type RouteLeg = { distance: number; duration: number };

interface Props {
  sessionId: string;
  socket: Socket | null;
  waypoints: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    order: number;
  }>;
  setWaypointLegs: React.Dispatch<React.SetStateAction<RouteLeg[]>>;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export const CollaborativeMap: React.FC<Props> = ({
  socket,
  waypoints,
  setWaypointLegs,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const cursorMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const waypointMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const collaborators = useCollaborators(socket);
  const { data: session } = useSession();

  const updateWaypointMarkers = useCallback(
    (map: mapboxgl.Map) => {
      // Remove markers for deleted waypoints
      waypointMarkersRef.current.forEach((marker, waypointId) => {
        if (!waypoints.find((wp) => wp.id === waypointId)) {
          marker.remove();
          waypointMarkersRef.current.delete(waypointId);
        }
      });

      // Update or add markers for current waypoints
      waypoints.forEach((waypoint) => {
        let marker = waypointMarkersRef.current.get(waypoint.id);
        if (!marker) {
          marker = new mapboxgl.Marker({
            element: MapMarkerPin(),
            anchor: "bottom",
          });
          waypointMarkersRef.current.set(waypoint.id, marker);
        }
        // Update marker position
        marker.setLngLat([waypoint.longitude, waypoint.latitude]).addTo(map);
      });
    },
    [waypoints]
  );

  const handleWaypointsUpdate = useCallback(
    async (map: mapboxgl.Map, waypoints: Props["waypoints"]) => {
      // Clear existing route
      if (map.getLayer("route")) map.removeLayer("route");
      if (map.getSource("route")) map.removeSource("route");

      // Sort waypoints
      const sortedWaypoints = [...waypoints].sort((a, b) => a.order - b.order);

      // Update markers
      updateWaypointMarkers(map);

      // Update viewport if we have waypoints
      if (sortedWaypoints.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        sortedWaypoints.forEach((waypoint) => {
          bounds.extend([waypoint.longitude, waypoint.latitude]);
        });

        map.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 350, right: 50 },
          maxZoom: 15,
        });

        // Add driving route for 2+ waypoints
        if (sortedWaypoints.length >= 2) {
          try {
            const coordinates = sortedWaypoints
              .map((wp) => `${wp.longitude},${wp.latitude}`)
              .join(";");

            const response = await mapbox.get(
              `/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&overview=full&annotations=distance,duration`
            );
            const data = response.data;

            if (data.routes && data.routes[0]) {
              // Extract leg information
              const legs: Array<RouteLeg> = data.routes[0].legs || [];
              const routeInfo = legs.map((leg: RouteLeg) => ({
                distance: leg.distance,
                duration: leg.duration,
              }));
              setWaypointLegs(routeInfo);

              map.addSource("route", {
                type: "geojson",
                data: {
                  type: "Feature",
                  properties: {},
                  geometry: data.routes[0].geometry,
                },
              });

              map.addLayer({
                id: "route",
                type: "line",
                source: "route",
                layout: {
                  "line-join": "round",
                  "line-cap": "round",
                },
                paint: {
                  "line-color": "#0f52fe",
                  "line-width": 5,
                  "line-opacity": 0.8,
                },
              });
            }
          } catch (error) {
            console.error("Error fetching/adding route:", error);
          }
        }
      }
    },
    [setWaypointLegs, updateWaypointMarkers]
  );

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    mapInstance.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/standard",
      center: [-71.0589, 42.3601], // Boston center
      zoom: 12,
    });

    const map = mapInstance.current;
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      handleWaypointsUpdate(map, waypoints);
    });

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [handleWaypointsUpdate, waypoints]);

  // Update route when waypoints change
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    if (!map.isStyleLoaded()) {
      map.once("style.load", () => handleWaypointsUpdate(map, waypoints));
    } else {
      handleWaypointsUpdate(map, waypoints);
    }
  }, [handleWaypointsUpdate, waypoints]);

  // Handle cursor movement
  const handleMouseMove = useCallback(
    (e: mapboxgl.MapMouseEvent & { lngLat: mapboxgl.LngLat }) => {
      if (!socket || !session?.user) return;
      socket.emit("cursor-move", {
        latitude: e.lngLat.lat,
        longitude: e.lngLat.lng,
      });
    },
    [socket, session?.user]
  );

  // Setup mouse move handler
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    map.on("mousemove", handleMouseMove);
    return () => {
      map.off("mousemove", handleMouseMove);
    };
  }, [handleMouseMove]);

  // Update collaborator cursors
  const updateCollaboratorCursors = useCallback(() => {
    const map = mapInstance.current;
    if (!map) return;

    // Remove markers for disconnected users
    cursorMarkersRef.current.forEach((marker, userId) => {
      if (!collaborators.has(userId)) {
        marker.remove();
        cursorMarkersRef.current.delete(userId);
      }
    });

    collaborators.forEach((collaborator, userId) => {
      if (userId === session?.user?.id) return;

      if (collaborator.cursor) {
        let marker = cursorMarkersRef.current.get(userId);

        if (!marker) {
          const el = document.createElement("div");
          el.className = "collaborator-cursor";
          el.innerHTML = `
            <div class="label">${collaborator.name}</div>
            <div class="cursor"></div>
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
          .addTo(map);
      }
    });
  }, [collaborators, session?.user?.id]);

  useEffect(() => {
    updateCollaboratorCursors();
  }, [updateCollaboratorCursors]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full rounded-lg overflow-hidden"
    />
  );
};
