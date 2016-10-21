import React from 'react';
import { coordinateCalc } from './coordinate-calc';
import { Map, Marker, TileLayer, Rectangle } from 'react-leaflet';

export default class MapComponent extends React.Component<MapComponentProps, void> {
    constructor(props: MapComponentProps) {
        super(props);
    }
    render() {
        const edge = coordinateCalc.getCoordinateArea(this.props.centerCoordinate, 10);
        const areaBound = [[edge.w, edge.s], [edge.e, edge.n]];
        let noteComponents = this.props.notes.map(
            (note) => {
                const noteCoordinate = [note.latlng.lat, note.latlng.lng];
                return <Marker position={noteCoordinate} />
            }
        )
        return (
            <Map center={this.props.centerCoordinate} bound={areaBound}>
                <TileLayer
                    attribution='&copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'
                    />
                <Rectangle bounds={areaBound} color="#ff7800" />
                {noteComponents}
            </Map>
        )
    }
}