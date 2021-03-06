import React from 'react';
import NoteListComponent from './note-list-component/note-list-component';
import MapComponent from './map-component/map-component';

export default class OSMLoggedInComponent extends React.Component<OSMLoggedInComponentProps, OSMLoggedInComponentState> {
  constructor(props: OSMLoggedInComponentProps) {
    super(props);
    this.state = {
      notes: [],
      noteComments: [],
      coordinate: { lat: null, lon: null },
      userName: '',
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
      'receiveCoordinate',
      (event: CustomEvent) => {
        this.setState({
          coordinate: event.detail.homeCoordinate,
          notes: this.state.notes,
          noteComments: this.state.noteComments,
          userName: event.detail.userName,
        });
      }
    );

    reactRootWrapperElement.addEventListener(
      'foundNotesAndNoteComments',
      (event: CustomEvent) => {
        const foundNotes = event.detail;
        this.setState({
          coordinate: this.state.coordinate,
          notes: foundNotes.notes,
          noteComments: foundNotes.noteComments,
          userName: this.state.userName,
        });
      }
    )
  }
  render() {
    const getMapComponents = (notes: any[]) => {
      if (notes.length) {
        return <MapComponent centerCoordinate={this.state.coordinate} notes={this.state.notes} />
      }
      else {
        return <MapComponent />
      }
    }
    const osmServer = this.props.oauth.options().url;

    return (
      <section className="main">
        <input type="button" value="地図メモの取得を試みる" onClick={(event) => this.handleGetNearbyNotesClick(event)} />
        <section id="note-map-container">
          <NoteListComponent notes={this.state.notes} noteComments={this.state.noteComments} userName={this.state.userName} osmServer={osmServer} />
          {getMapComponents(this.state.notes)}
        </section>
      </section>
    )
  }
}