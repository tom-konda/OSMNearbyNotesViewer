import React from 'react';
import CommentComponent from './comment-component';

export default class NoteComponent extends React.Component<NoteComponentProps, void> {
  constructor(props: NoteComponentProps) {
    super(props);
  }
  render() {
    const comments = this.props.noteComments.map(
      (noteComment, index) => {
        return <CommentComponent key={noteComment.commentNum} noteComment={noteComment} />
      }
    )
    return (
      <section className="note">
        <div className="note-info">
          <span className="create-date">
            <time>{this.props.note.created.toLocaleString()}</time>
          </span>
          <span className="modified-date">
            <time />
          </span>
          <span className="status">{this.props.note.status}</span>
          <div className="comment-list">
            {comments}
          </div>
          <form>
            <label>メモの状態の変更</label>
            <select>
              <option value={null}>変更しない</option>
              <option value="closed">解決</option>
              <option value="reopened" disabled={true}>再開</option>
            </select>
            <label>コメント</label>
            <textarea></textarea>
            <button>送信</button>
          </form>
        </div>
      </section>
    )
  };
}