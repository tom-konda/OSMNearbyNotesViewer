import React from 'react';
import NoteComponent from './note-component';

export default class NoteListComponent extends React.Component<NoteListComponentProps, void> {
  constructor(props: NoteListComponentProps) {
    super(props);
  }
  render() {
    let noteList = this.props.notes.map(
      (note, index) => {
        return <NoteComponent key={note.id} note={note} noteComments={this.props.noteComments[note.id]} userName={this.props.userName} osmServer={this.props.osmServer} />
      }
    );
    return (
      <section id="note-list">
        {noteList}
      </section>
    )
  };
}