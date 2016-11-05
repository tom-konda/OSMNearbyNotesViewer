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
  userName: string,
}

interface NoteComponentProps {
  note: any,
  noteComments: any[],
  userName: string,
}

interface NoteComponentState {
  currentNote: any,
  currentNoteComments: any[]
}

interface CommentComponentProps {
  noteComment: any,
}