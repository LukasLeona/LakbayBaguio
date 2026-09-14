export type PlaceKind = "park" | "restaurant" | "hotel";

export type Place = {
  id: string;
  name: string;
  kind: PlaceKind;
  area: string;
  description: string;
  tags: string[];
  lat: number;
  lng: number;
  duration: number;
  image?: string;
  gallery?: string[];
  highlights?: string[];
  address?: string;
  externalUrl?: string;
  externalLabel?: string;
  photoCredit?: {
    label: string;
    url: string;
  };
  popular?: boolean;
  price?: "Free" | "Budget" | "Mid-range" | "Premium";
};

export type ItineraryStop = Pick<
  Place,
  "id" | "name" | "area" | "lat" | "lng" | "duration" | "image"
> & {
  time: string;
};

export type SavedItinerary = {
  id: string;
  title: string;
  createdAt: string;
  days: number;
  pace: "relaxed" | "balanced" | "packed";
  interests: string[];
  stops: ItineraryStop[];
  status: "pending" | "completed";
};
