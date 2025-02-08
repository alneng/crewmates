import { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { X } from "lucide-react";

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
  const [suggestions, setSuggestions] = useState<
    Array<{ place_name: string; center: [number, number] }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const searchPlace = async (query: string) => {
    if (!query) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?` +
          new URLSearchParams({
            access_token: import.meta.env.VITE_MAPBOX_TOKEN,
            types: "place,address",
            limit: "5",
          })
      );
      const data = await response.json();
      setSuggestions(data.features);
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
    }
  };

  const handleInputChange = (inputValue: string) => {
    onChange(inputValue);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (inputValue.trim()) {
      timeoutRef.current = setTimeout(() => {
        searchPlace(inputValue);
        setShowSuggestions(true);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    onChange(suggestion.place_name, {
      lat: suggestion.center[1],
      lng: suggestion.center[0],
    });
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
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          className="bg-zinc-900 border-zinc-700 text-zinc-200"
          onFocus={() => value && setShowSuggestions(true)}
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
