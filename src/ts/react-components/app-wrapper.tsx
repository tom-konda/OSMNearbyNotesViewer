import React from 'react';
import OSMLoggedInComponent from './osm-logged-in-component/osm-logged-in-component';

export default class AppComponent extends React.Component<AppDefaultComponentProps, AppComponentState> {
  constructor() {
    super();
    this.state = {
      isOAuthReady: false,
      OSMOAuth: null,
    }
  }
  componentDidMount() {
    const reactRootWrapperElement = document.querySelector('#AppWrapper');
    reactRootWrapperElement.addEventListener(
      'oauthReady',
      (event: CustomEvent) => {
        this.setState({
          isOAuthReady: true,
          OSMOAuth: event.detail,
        });
      }
    );
    reactRootWrapperElement.addEventListener(
      'oauthNotReady',
      () => {
        this.setState({
          isOAuthReady: false,
          OSMOAuth: null,
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
        {mainComponent(this.state.OSMOAuth && this.state.OSMOAuth.authenticated())}
      </section>
    )
  }
}