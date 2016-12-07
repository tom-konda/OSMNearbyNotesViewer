import React from 'react';
import OSMLoggedInComponent from './osm-logged-in-component/osm-logged-in-component';

export default class AppComponent extends React.Component<AppDefaultComponentProps, AppComponentState> {
  constructor() {
    super();
    this.state = {
      isOAuthReady: false,
      OSMOAuth: null,
      isAuthenticated: false,
      isQuarifiedBrowser: true,
    }
  }
  componentDidMount() {
    const reactRootWrapperElement = document.querySelector('#AppWrapper');
    reactRootWrapperElement.addEventListener(
      'notQualifiedBrowser',
      (event: CustomEvent) => {
        this.setState({
          isOAuthReady: false,
          OSMOAuth: null,
          isAuthenticated: false,
          isQuarifiedBrowser: false,
        });
      }
    );
    reactRootWrapperElement.addEventListener(
      'oauthReady',
      (event: CustomEvent) => {
        const auth: osmAuthInstance = event.detail;
        this.setState({
          isOAuthReady: true,
          OSMOAuth: auth,
          isAuthenticated: auth.authenticated(),
          isQuarifiedBrowser: this.state.isQuarifiedBrowser,
        });
      }
    );
    reactRootWrapperElement.addEventListener(
      'oauthNotReady',
      () => {
        this.setState({
          isOAuthReady: false,
          OSMOAuth: null,
          isAuthenticated: false,
          isQuarifiedBrowser: this.state.isQuarifiedBrowser,
        });
      }
    );
  }
  handleOAuthClick() {
    const buttonClickEvent = new CustomEvent('oauthButtonClicked');
    window.dispatchEvent(buttonClickEvent);
  }
  render() {
    const mainComponent = (isAuthenticated: boolean) => {
      if (this.state.isQuarifiedBrowser === false) {
        return (
          <section className="main">
            <p>ご使用のブラウザは必須環境を満たしていないため、動作対象外となります。</p>
          </section>
        )
      }
      if (isAuthenticated) {
        return (
          <OSMLoggedInComponent oauth={this.state.OSMOAuth} />
        )
      }
      else {
        return (
          <section className="main">
            <input type="button" value="OpenStreetMap にログイン" onClick={this.handleOAuthClick} />
          </section>
        )
      }
    }
    return (
      <section id="AppComponent">
        {mainComponent(this.state.isAuthenticated)}
      </section>
    )
  }
}