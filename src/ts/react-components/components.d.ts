interface AppDefaultComponentProps {
}

interface AppComponentState {
    isOAuthReady: boolean,
    OSMOAuth: osmAuthInstance,
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