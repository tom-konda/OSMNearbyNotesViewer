namespace coordinateCalc {
  'use strict'
  export const EARTH_RADIUS = 6378.137;
  export const EARTH_POLAR_RADIUS = 6356.752;
  export const STRAIGHT_ANGLE = 180;
  
  export function getLongitudeFromDistance(latitude:number, longitude:number, distance:number, isEastward:boolean):number{
    if (isEastward) {
      return longitude + distance * STRAIGHT_ANGLE /
        (EARTH_RADIUS * Math.PI * Math.cos(latitude / STRAIGHT_ANGLE * Math.PI));
    }
    else {
      return longitude - distance * STRAIGHT_ANGLE /
        (EARTH_RADIUS * Math.PI * Math.cos(latitude / STRAIGHT_ANGLE * Math.PI));
    }
  }
  
  export function getLatitudeFromDistance(latitude:number, distance:number, isNorthward:boolean):number{
    let calculatedLatitude:number;
    const MAX_LATITUDE_ABSOLUTE_VALUE = 90;
    if (isNorthward) {
      calculatedLatitude = latitude + distance * STRAIGHT_ANGLE / (EARTH_POLAR_RADIUS * Math.PI);
      return calculatedLatitude > MAX_LATITUDE_ABSOLUTE_VALUE ? MAX_LATITUDE_ABSOLUTE_VALUE : calculatedLatitude;
    }
    else {
      calculatedLatitude = latitude - distance * STRAIGHT_ANGLE / (EARTH_POLAR_RADIUS * Math.PI);
      return calculatedLatitude < -MAX_LATITUDE_ABSOLUTE_VALUE ? -MAX_LATITUDE_ABSOLUTE_VALUE : calculatedLatitude;
    }
  }
  
  export function getCoordinateArea(coordinate:{lat : string, lon : string}, distance:number):{n : number, e : number, s : number, w : number} {
    let latitude = parseFloat(coordinate.lat);
    let longitude = parseFloat(coordinate.lon);
    let edgeCoordinate:{
      n : number,
      e : number,
      s : number,
      w : number,
    };
    const MIN_LONGITUDE = -180;
    const CARRY_LONGITUDE = 360

    /*
      南北 θ = (d * 180) / (PI * R)
      東西 θ = (d * 180) / (PI * r')
      d = 指定POIからの距離
      R = 地球の極半径
      r' = R'cos(指定POIの緯度)
      R' = 地球の赤道半径
    */
    edgeCoordinate.n = getLatitudeFromDistance(latitude, distance, true);
    edgeCoordinate.s = getLatitudeFromDistance(latitude, distance, false);
    edgeCoordinate.w = getLongitudeFromDistance(latitude, longitude, distance, false);
    if (edgeCoordinate.w >= MIN_LONGITUDE) {
      edgeCoordinate.e = getLongitudeFromDistance(latitude, longitude, distance, true);
    }
    else {
      edgeCoordinate.w += CARRY_LONGITUDE;
      edgeCoordinate.e = getLongitudeFromDistance(latitude, longitude, distance, true) + CARRY_LONGITUDE;
    }
    return edgeCoordinate;
  }
}