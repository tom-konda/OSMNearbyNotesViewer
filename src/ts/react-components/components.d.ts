interface AppDefaultComponentProps {
}

interface AppComponentState {
  isOAuthReady: boolean,
  OSMOAuth: osmAuthInstance,
  isAuthenticated: boolean,
  isQuarifiedBrowser: boolean,
}

interface OSMLoggedInComponentProps {
  oauth: osmAuthInstance
}

interface OSMLoggedInComponentState {
  notes: any[],
  noteComments: any[],
  coordinate: {
    lat: string,
    lon: string,
  }
}

interface MapComponentProps {
  centerCoordinate: {
    lat: string,
    lon: string,
  }
  notes: any[]
}