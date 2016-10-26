import React from 'react';


export default class CommentComponent extends React.Component<CommentComponentProps, void> {
  constructor(props: CommentComponentProps) {
    super(props);
  }
  render() {
    return (
      <article className="comment">
        <div className="comment-info">
          <span className="user-osm-page">
            <a></a>
          </span>
          <span className="submit-date">
            <time>{this.props.noteComment.date.toLocaleString()}</time>
          </span>
          <span className="user-action">{this.props.noteComment.action}</span>
        </div>
        <p className="commentText">{this.props.noteComment.text}</p>
      </article>
    );
  };
}