import React from 'react';
import { coordinateCalc } from './coordinate-calc';
import { Map, TileLayer, Rectangle } from 'react-leaflet';

export default class MapComponent extends React.Component<MapComponentProps, void> {
  constructor(props: MapComponentProps) {
    super(props);
  }
  render() {
    console.log(this.props, 'props')
    const centerCoordinate = this.props.centerCoordinate;
    const edge = coordinateCalc.getCoordinateArea(this.props.centerCoordinate, 10);
    const areaBound = [[edge.w, edge.s], [edge.e, edge.n]];
    return (
      <Map center={{ lat: Number(centerCoordinate.lat), lon: Number(centerCoordinate.lon) }} bound={areaBound}>
        <TileLayer
          attribution='&copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="http://{s}.tile.osm.org/{z}/{x}/{y}.png"
          />
        <Rectangle bounds={areaBound} color="#ff7800" />
      </Map>
    )
  }
}