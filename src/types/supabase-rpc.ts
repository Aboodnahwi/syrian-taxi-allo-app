
export interface CreateTripRequestParams {
  p_customer_id: string;
  p_from_location: string;
  p_to_location: string;
  p_from_coordinates: string;
  p_to_coordinates: string;
  p_vehicle_type: string;
  p_distance_km: number;
  p_price: number;
  p_scheduled_time?: string;
}
