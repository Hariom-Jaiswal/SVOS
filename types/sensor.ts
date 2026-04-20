export interface LocationUpdate {
  uid: string;
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
  zone: string;
}

export interface QueueUpdate {
  vendorId: string;
  peopleAhead: number;
  serviceRate: number;
  timestamp: number;
}

export interface SensorReading {
  zoneId: string;
  deviceCount: number;
  cameraCount?: number;
  timestamp: number;
}
