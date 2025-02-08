import { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { mapbox } from "@/lib/axios";

interface WaypointInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string, coordinates?: { lat: number; lng: number }) => void;
  onRemove?: () => void;
  showRemove?: boolean;
}

export const WaypointInput = ({
  placeholder,
  value,
  onChange,
  onRemove,
  showRemove = true,
}: WaypointInputProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<
    Array<{ place_name: string; center: [number, number] }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const searchPlace = async (query: string) => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    try {
      const params = new URLSearchParams({
        types: "address",
        proximity: "-71.0589,42.3601", // Default center on Boston area
        limit: "5",
      });
      const response = await mapbox.get(
        `/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
          params
      );
      const data = response.data;
      setSuggestions(data.features);
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
    }
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue); // Pass the value up without coordinates

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (newValue.trim()) {
      timeoutRef.current = setTimeout(() => {
        searchPlace(newValue);
        setShowSuggestions(true);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: {
    place_name: string;
    center: [number, number];
  }) => {
    const newValue = suggestion.place_name;
    setInputValue(newValue);

    // Mapbox returns coordinates as [longitude, latitude]
    const [lng, lat] = suggestion.center;
    onChange(newValue, { lat, lng });

    setSuggestions([]);
    setShowSuggestions(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          className="bg-zinc-900 border-zinc-700 text-zinc-200"
          onFocus={() => inputValue && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        {showRemove && onRemove && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="hover:bg-zinc-700"
          >
            <X className="h-4 w-4 text-zinc-400" />
          </Button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="w-full px-4 py-2 text-left text-zinc-200 hover:bg-zinc-700 first:rounded-t-md last:rounded-b-md"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion.place_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
