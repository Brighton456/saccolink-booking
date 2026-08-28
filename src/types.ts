export interface Station {
  id: string;
  name: string;
}

export interface RouteRow {
  id: string;
  name: string;
  standard_fare: number;
  origin: string;
  destination: string;
  active?: boolean;
}

export interface Vehicle {
  id: string;
  plate: string;
  capacity: number;
}

export interface Driver {
  id: string;
  full_name: string;
}

export interface SaccoRow {
  id: string;
  name: string;
}

export interface TripRow {
  id: string;
  scheduled_at: string;
  status: string;
  station_id: string;
  route_id: string;
  vehicle_id: string;
  driver_id: string;
  sacco_id?: string | null;
  routes?: RouteRow;
  vehicles?: Vehicle;
  drivers?: Driver;
  saccos?: SaccoRow;
}

export interface TicketRow {
  id: string;
  trip_id: string;
  seat_no: number;
  passenger_name: string;
  passenger_phone: string | null;
  fare: number;
  payment_method: string;
  receipt_code: string;
  created_at: string;
  boarding_station_id?: string | null;
  destination_station_id?: string | null;
}

export interface RouteStop {
  id: string;
  route_id: string;
  station_id: string;
  sequence_no: number;
  segment_fare: number;
  cumulative_fare: number;
  stations?: Station;
}

export interface SearchResult {
  trip: TripRow;
  departure: string;
  arrival: string;
  availableSeats: number;
  vehicleType: string;
  plate: string;
  saccoName: string;
  price: number;
  routePasses: boolean;
}

export interface SearchParams {
  origin: string;
  destination: string;
  date: string;
}
