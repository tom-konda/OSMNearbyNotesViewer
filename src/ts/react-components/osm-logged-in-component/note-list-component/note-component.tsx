import React from 'react';
import CommentComponent from './comment-component';

export default class NoteComponent extends React.Component<NoteComponentProps, void> {
  constructor(props: NoteComponentProps) {
    super(props);
  }
  componentDidMount() {
    const reactRootWrapperElement = document.querySelector('#AppWrapper');
    reactRootWrapperElement.addEventListener(
      'submitSuccess',
      (event: CustomEvent) => {
        // this.setState({
        // });
      }
    );
  }
  handleSubmit(event: React.FormEvent<any>) {
    event.preventDefault();
    console.log(event)
    const target = (event.target as Element);

    const submitEvent = new CustomEvent(
      'submitButtonClicked',
      {
        detail: {
          id: target.querySelector('input').value,
          target: target
        }
      }
    );
    window.dispatchEvent(submitEvent);
  }
  render() {
    const comments = this.props.noteComments.map(
      (noteComment, index) => {
        return <CommentComponent key={noteComment.commentNum} noteComment={noteComment} />
      }
    );
    const isClosed = this.props.note.status === 'closed';
    const note = this.props.note;

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
            <select id={`note-${note.id}-changeNoteStatus`}>
              <option value={null}>変更しない</option>
              <option value="closed" disabled={isClosed}>解決</option>
              <option value="reopened" disabled={isClosed === false}>再開</option>
            </select>
            <label htmlFor={`note-${note.id}-addNoteComment`}>コメント</label>
            <textarea id={`note-${note.id}-addNoteComment`}></textarea>
            <button form={`note-${note.id}-form`}>送信</button>
            <input defaultValue={note.id} type="hidden" />
          </form>
        </div>
      </section>
    )
  };
}