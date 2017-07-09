import * as OSMAuth from 'osm-auth';

interface AppDefaultComponentProps {
}

interface AppComponentState {
  isOAuthReady: boolean,
  OSMOAuth: OSMAuth.OSMAuthInstance,
  isAuthenticated: boolean,
  isQuarifiedBrowser: boolean,
}

interface OSMLoggedInComponentProps {
  oauth: OSMAuth.OSMAuthInstance
}

interface OSMLoggedInComponentState {
  notes: any[],
  noteComments: any[],
  coordinate: {
    lat: string,
    lon: string,
  },
  userName: string,
}

interface MapComponentProps {
  centerCoordinate?: {
    lat: string,
    lon: string,
  }
  notes?: any[]
}

interface NoteListComponentProps {
  notes: any[],
  noteComments: any[],
  osmServer: string,
  userName: string,
}

interface NoteComponentProps {
  note: any,
  noteComments: any[],
  userName: string,
  osmServer: string,
}

interface NoteComponentState {
  currentNote: any,
  currentNoteComments: any[]
}

interface CommentComponentProps {
  noteComment: any,
}