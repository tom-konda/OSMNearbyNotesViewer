import React from 'react';
import { coordinateCalc } from './coordinate-calc';
import { Map, TileLayer, Rectangle, Marker } from 'react-leaflet';

export default class MapComponent extends React.Component<MapComponentProps, void> {
  constructor(props: MapComponentProps) {
    super(props);
  }
  render() {
    const leaflet = () => {
      if (this.props.notes) {
        const markers = this.props.notes.map(
          (note, index) => {
            const markerLatLng = note.latlng;
            return (<Marker key={index + markerLatLng.lat} position={[Number(markerLatLng.lat), Number(markerLatLng.lng)]} />)
          }
        )
        const centerCoordinate = this.props.centerCoordinate;
        const edge = coordinateCalc.getCoordinateArea(this.props.centerCoordinate, 10);
        const areaBound = [[edge.s, edge.w], [edge.n, edge.e]];
        return (
          <div id="leaflet-wrapper">
            <Map id="leaflet-container" center={[Number(centerCoordinate.lat), Number(centerCoordinate.lon)]} bounds={areaBound} boundsOptions={{ padding: [0, 0] }}>
              <TileLayer
                attribution='&copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="http://{s}.tile.osm.org/{z}/{x}/{y}.png"
                />
              <Rectangle bounds={areaBound} color="#ff1100" />
              {markers}
            </Map>
          </div>
        )
      }
      else {
        return (
          <div id="leaflet-wrapper">
            <Map id="leaflet-container"></Map>
          </div>
        );
      }
    }
    return leaflet();
  }
}