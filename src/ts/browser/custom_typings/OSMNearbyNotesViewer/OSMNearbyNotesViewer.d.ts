interface NoteCommentFormat {
  'noteId': number,
  'commentNum': number,
  'date': Date,
  'user': string,
  'userURL': string,
  'text': string,
  'action': string,
}

interface NoteFormat {
  'latlng': LatLngFormat,
  'id': number,
  'created': Date,
  'modified': Date,
  'deleted': Date | null,
  'status': string,
}

interface LatLngFormat {
  lat: string,
  lng: string,
}