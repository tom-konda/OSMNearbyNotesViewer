
interface INotes {
  id: number,
  latlng: {
    lat: string,
    lng: string,
  }
  created: Date,
  modified: Date,
  deleted: Date | null,
  status: string,
}

interface IComments {
  noteId: number,
  commentNum: number,
  date: Date,
  user: string,
  userURL: string,
  text: string,
  action: string,
}
