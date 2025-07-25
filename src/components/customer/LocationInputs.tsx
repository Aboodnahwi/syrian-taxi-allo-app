
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Search, MousePointerSquareDashed } from "lucide-react";

interface LocationInputsProps {
  fromLocation: string;
  toLocation: string;
  setFromLocation: (v: string) => void;
  setToLocation: (v: string) => void;
  onSearchLocation: (query: string, type: "from" | "to") => void;
  onSelectLocation: (suggestion: any, type: "from" | "to") => void;
  fromSuggestions: any[];
  toSuggestions: any[];
  showFromSuggestions: boolean;
  showToSuggestions: boolean;
  useCurrentLocation: () => void;
  setShowFromSuggestions: (v: boolean) => void;
  setShowToSuggestions: (v: boolean) => void;
  onManualFromPin: () => void; // جديد: زر تعيين مكان الانطلاق يدويًا
  onManualToPin: () => void;   // جديد: زر تعيين مكان الوجهة يدويًا
}

const LocationInputs = ({
  fromLocation,
  toLocation,
  setFromLocation,
  setToLocation,
  onSearchLocation,
  onSelectLocation,
  fromSuggestions,
  toSuggestions,
  showFromSuggestions,
  showToSuggestions,
  useCurrentLocation,
  setShowFromSuggestions,
  setShowToSuggestions,
  onManualFromPin,
  onManualToPin
}: LocationInputsProps) => {
  return (
    <div className="space-y-3">
      {/* البحث عن نقطة الانطلاق */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              placeholder="من أين تريد أن تنطلق؟"
              value={fromLocation}
              onChange={(e) => {
                setFromLocation(e.target.value);
                onSearchLocation(e.target.value, "from");
              }}
              className="bg-white/95 backdrop-blur-sm border-0 text-slate-800 placeholder:text-slate-500 font-tajawal pl-10"
            />
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
          </div>
          <Button
            onClick={useCurrentLocation}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-3"
            title="موقعي الحالي"
          >
            <Navigation className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            onClick={onManualFromPin}
            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 border"
            title="تعيين مكان الانطلاق يدويًا"
          >
            <MousePointerSquareDashed className="w-4 h-4" />
            <span className="ml-1 hidden sm:inline">تعيين يدوي</span>
          </Button>
        </div>
        {showFromSuggestions && fromSuggestions.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-lg border max-h-60 overflow-y-auto z-40">
            {fromSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                onClick={() => onSelectLocation(suggestion, "from")}
                className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0 font-tajawal"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-800">{suggestion.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* البحث عن الوجهة */}
      <div className="relative flex gap-2">
        <div className="flex-1 relative">
          <Input
            placeholder="إلى أين تريد أن تذهب؟"
            value={toLocation}
            onChange={(e) => {
              setToLocation(e.target.value);
              onSearchLocation(e.target.value, "to");
            }}
            className="bg-white/95 backdrop-blur-sm border-0 text-slate-800 placeholder:text-slate-500 font-tajawal pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
        </div>
        <Button
          type="button"
          onClick={onManualToPin}
          className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 border"
          title="تعيين الوجهة يدويًا"
        >
          <MousePointerSquareDashed className="w-4 h-4" />
          <span className="ml-1 hidden sm:inline">تعيين يدوي</span>
        </Button>
      </div>
      {showToSuggestions && toSuggestions.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-lg border max-h-60 overflow-y-auto z-40">
          {toSuggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              onClick={() => onSelectLocation(suggestion, "to")}
              className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0 font-tajawal"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-800">{suggestion.name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationInputs;
