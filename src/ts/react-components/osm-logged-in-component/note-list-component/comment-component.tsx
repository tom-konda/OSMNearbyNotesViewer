import * as React from 'react';
import convertDatetoText from './convert-date-format';

export default class CommentComponent extends React.Component<CommentComponentProps, void> {
  constructor(props: CommentComponentProps) {
    super(props);
  }
  render() {
    const comment = this.props.noteComment;
    let userNameAndLink: JSX.Element;
    if (comment.user) {
      userNameAndLink = (
        <span className="user-osm-page">
          <a href={comment.userURL}>
            {comment.user}
          </a>
        </span>
      )
    }
    else {
      userNameAndLink = (
        <span className="user-osm-page">anonymous user</span>
      )
    }

    return (
      <article className="comment">
        <div className="comment-info">
          {userNameAndLink}
          <span className="submit-date">
            <time dateTime={comment.date.toISOString()}>{convertDatetoText((comment.date as Date))}</time>
          </span>
          <span className="user-action">{comment.action}</span>
        </div>
        <p className="commentText">{comment.text}</p>
      </article>
    );
  };
}