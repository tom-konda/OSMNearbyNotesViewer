namespace coordinateCalc {
  'use strict'
  export const EARTH_RADIUS = 6378.137;
  export const EARTH_POLAR_RADIUS = 6356.752;
  
  export function getCoordinateArea(coordinate:{lat : string, lng : string}, distance:number, direction:string):any {
    let latitude = parseFloat(coordinate.lat);
    let longitude = parseFloat(coordinate.lng);
    let edgeCoordinate:{
      n : number,
      e : number,
      s : number,
      w : number,
    };

    /*
      南北 θ = (d * 180) / (PI * R)
      東西 θ = (d * 180) / (PI * r')
      d = 指定POIからの距離
      R = 地球の極半径
      r' = R'cos(指定POIの緯度)
      R' = 地球の赤道半径
    */
    switch (direction) {
      case 'n':
        edgeCoordinate.n = latitude + distance * 180 / (EARTH_POLAR_RADIUS * Math.PI);
      break;
      case 'e':
        edgeCoordinate.e = longitude + distance * 180 / (EARTH_RADIUS * Math.PI * Math.cos(latitude / 180 * Math.PI));
      break;
      case 's':
        edgeCoordinate.s = latitude - distance * 180 / (EARTH_POLAR_RADIUS * Math.PI);
      break;
      case 'w':
        edgeCoordinate.w = longitude - distance * 180 / (EARTH_RADIUS * Math.PI * Math.cos(latitude / 180 * Math.PI));
      break;
    }
    return edgeCoordinate;
  }
}