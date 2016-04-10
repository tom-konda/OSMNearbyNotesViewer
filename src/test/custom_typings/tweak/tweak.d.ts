interface OSMConfig{
  oauth_consumer_key: String,
  oauth_secret: String,
}

interface coordinateCalc {
    EARTH_RADIUS: number;
    EARTH_POLAR_RADIUS: number;
    STRAIGHT_ANGLE: number;
    getLongitudeFromDistance(latitude: number, longitude: number, distance: number, isEastward: boolean): number;
    getLatitudeFromDistance(latitude: number, distance: number, isNorthward: boolean): number;
    getCoordinateArea(coordinate: {
        lat: string;
        lon: string;
    }, distance: number): {
        n: number;
        e: number;
        s: number;
        w: number;
    };
}
