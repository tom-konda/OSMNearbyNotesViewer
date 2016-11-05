import React from 'react';
import CommentComponent from './comment-component';

export default class NoteComponent extends React.Component<NoteComponentProps, NoteComponentState> {
  private prePostState = null;
  constructor(props: NoteComponentProps) {
    super(props);
    this.state = {
      currentNote: this.props.note,
      currentNoteComments: this.props.noteComments,
    }
  }
  componentDidMount() {
    console.log(this)
    const noteComponentElement = document.querySelector(`#note-${this.props.note.id}`);
    noteComponentElement.addEventListener(
      'submitSuccess',
      (event: CustomEvent) => {
        // this.setState({
        // });
      }
    );
    noteComponentElement.addEventListener(
      'submitFailure',
      (event: CustomEvent) => {
        console.log(this.prePostState, 'Expect revert')
        this.setState(this.prePostState);
        this.prePostState = null
      }
    );
  }
  private cloneState(state: NoteComponentState): NoteComponentState {
    const cloned = Object.assign({}, state);
    cloned.currentNote = Object.assign({}, state.currentNote);
    cloned.currentNoteComments = [].concat(state.currentNoteComments);
    return cloned;
  }
  private handleSubmit(event: React.FormEvent<any>) {
    event.preventDefault();
    console.log(event.target);
    this.prePostState = this.cloneState(this.state);

    const target = (event.target as Element);
    const noteId = (target.querySelector('input[name="noteID"]') as HTMLInputElement).value;
    const select = (target.querySelector(`#note-${noteId}-changeNoteStatus`) as HTMLSelectElement);
    const textarea = (document.querySelector(`#note-${noteId}-addNoteComment`) as HTMLTextAreaElement);
    const noteComments = this.state.currentNoteComments;
    const commentDate = new Date(Date.now());
    const commentAction = select.value || 'commented';
    noteComments.push({
      action: commentAction,
      commentNum: noteComments.length,
      date: commentDate,
      noteId: noteId,
      user: this.props.userName,
      userURL: `http://www.openstreetmap.org/user/${this.props.userName}`,
      text: textarea.value
    });

    const note = this.state.currentNote;
    if (commentAction !== 'commented') {
      if (commentAction === 'closed') {
        note.status = 'closed'
      }
      else {
        note.status = 'open'
      }
    }

    this.setState({
      currentNote: note,
      currentNoteComments: noteComments
    });

    const submitEvent = new CustomEvent(
      'submitButtonClicked',
      {
        detail: {
          noteId: noteId,
          target: target
        }
      }
    );
    window.dispatchEvent(submitEvent);
  }
  render() {
    const comments = this.state.currentNoteComments.map(
      (noteComment, index) => {
        return <CommentComponent key={noteComment.commentNum} noteComment={noteComment} />
      }
    );
    const isClosed = this.state.currentNote.status === 'closed';
    const note = this.state.currentNote;

    return (
      <section className="note" id={`note-${note.id}`}>
        <div className="note-info">
          <span className="create-date">
            <time dateTime={note.created.toISOString()}>{note.created.toLocaleString()}</time>
          </span>
          <span className="modified-date">
            <time dateTime={note.modified.toISOString()}>{note.modified.toLocaleString()}</time>
          </span>
          <span className="status">{note.status}</span>
          <div className="comment-list">
            {comments}
          </div>
          <form id={`note-${note.id}-form`} onSubmit={(event) => this.handleSubmit(event)}>
            <label htmlFor={`note-${note.id}-changeNoteStatus`}>メモの状態の変更</label>
            <select id={`note-${note.id}-changeNoteStatus`} defaultValue={null} name="action">
              <option value="">変更しない</option>
              <option value="closed" disabled={isClosed}>解決</option>
              <option value="reopened" disabled={isClosed === false}>再開</option>
            </select>
            <label htmlFor={`note-${note.id}-addNoteComment`}>コメント</label>
            <textarea id={`note-${note.id}-addNoteComment`} name="noteComment"></textarea>
            <button form={`note-${note.id}-form`}>送信</button>
            <input defaultValue={note.id} type="hidden" name="noteID" />
            <input defaultValue={this.props.userName} type="hidden" name="userName" />
          </form>
        </div>
      </section>
    )
  };
}