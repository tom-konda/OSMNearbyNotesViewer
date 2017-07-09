import * as React from 'react';
import CommentComponent from './comment-component';
import convertDatetoText from './convert-date-format';

export default class NoteComponent extends React.Component<NoteComponentProps, NoteComponentState> {
  private prePostState: null | NoteComponentState = null;
  constructor(props: NoteComponentProps) {
    super(props);
    this.state = {
      currentNote: this.props.note,
      currentNoteComments: this.props.noteComments,
    }
  }
  componentDidMount() {
    const noteComponentElement = document.querySelector(`#note-${this.props.note.id}`) as Element;
    noteComponentElement.addEventListener(
      'submitSuccess',
      (event: CustomEvent) => {
        const modifiedNoteData = event.detail;
        const currentPostState = this.prePostState as NoteComponentState;
        currentPostState.currentNote.modified = modifiedNoteData.lastModified;
        currentPostState.currentNote.status = modifiedNoteData.noteStatus;
        modifiedNoteData.unloadComments.forEach(
          (unloadComment: any) => {
            currentPostState.currentNoteComments.push(unloadComment);
          }
        );

        this.setState(currentPostState);
        this.prePostState = null
      }
    );
    noteComponentElement.addEventListener(
      'submitFailure',
      () => {
        this.setState(this.prePostState as NoteComponentState);
        this.prePostState = null
      }
    );
  }
  componentWillUnmount() {
    const noteComponentElement = document.querySelector(`#note-${this.props.note.id}`) as Element;
    noteComponentElement.removeEventListener('submitSuccess');
    noteComponentElement.removeEventListener('submitFailure');
  }
  private cloneState(state: NoteComponentState): NoteComponentState {
    const cloned = Object.assign({}, state);
    cloned.currentNote = Object.assign({}, state.currentNote);
    cloned.currentNoteComments = [].concat(state.currentNoteComments as any);
    return cloned;
  }
  private handleSubmit(event: React.FormEvent<any>) {
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
      userURL: `${this.props.osmServer}/user/${this.props.userName}`,
      text: textarea.value
    });

    const note = this.state.currentNote;
    note.modified = commentDate;
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
    event.preventDefault();
    return false;
  }
  render() {
    const comments = this.state.currentNoteComments.map(
      (noteComment) => {
        return <CommentComponent key={noteComment.commentNum} noteComment={noteComment} />
      }
    );
    const isClosed = this.state.currentNote.status === 'closed';
    const note = this.state.currentNote;

    return (
      <section className="note" id={`note-${note.id}`}>
        <div className="note-info">
          <span className="create-date">Created :
            <time dateTime={note.created.toISOString()}>{convertDatetoText((note.created as Date))}</time>
          </span>
          <span className="modified-date">Modified :
            <time dateTime={note.modified.toISOString()}>{convertDatetoText((note.modified as Date))}</time>
          </span>
          <span className="status">{note.status}</span>
          <div className="comment-list">
            {comments}
          </div>
          <form id={`note-${note.id}-form`} onSubmit={(event) => this.handleSubmit(event)}>
            <label htmlFor={`note-${note.id}-changeNoteStatus`}>メモの状態の変更</label>
            <select id={`note-${note.id}-changeNoteStatus`} defaultValue={undefined} name="action">
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