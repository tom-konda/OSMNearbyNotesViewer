import React from 'react';
import MapComponent from './map-component/map-component';

export default class OSMLoggedInComponent extends React.Component<OSMLoggedInComponentProps, OSMLoggedInComponentState> {
    constructor(props: OSMLoggedInComponentProps) {
        super(props);
        this.state = {
            notes: [],
            noteComments: [],
            coordinate: { lat: null, lon: null },
        }
    }
    private handleGetNearbyNotesClick(event: React.MouseEvent<HTMLInputElement>) {
        const getNearbyNotesClickEvent = new CustomEvent(
            'getNearbyNotesClicked',
            {
                detail: this.props.oauth
            }
        );
        window.dispatchEvent(getNearbyNotesClickEvent);
    }
    componentDidMount() {
        const reactRootWrapperElement = document.querySelector('#AppWrapper');
        reactRootWrapperElement.addEventListener(
            'receiveNotesAndCoordinate',
            (event: CustomEvent) => {
                const receivedData = event.detail;
                this.setState({
                    coordinate: receivedData.coordinate,
                    notes: receivedData.notes,
                    noteComments: receivedData.noteComments,
                });
            }
        );
    }
    private getMapComponents(notes: any[]) {
        if (notes.length) {
            return <MapComponent centerCoordinate={this.state.coordinate} notes={this.state.notes} />
        }
        else {
            return null
        }
    }
    render() {
        return (
            <section className="main">
                <input type="button" value="地図メモの取得を試みる" onClick={(event) => this.handleGetNearbyNotesClick(event)} />
                {() => this.getMapComponents(this.state.notes)}
            </section>
        )
    }
}