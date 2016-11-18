import Dexie from 'dexie';

export class OSMNearbyNotesDatabase extends Dexie {

  notes: Dexie.Table<INotes, number>;
  comments: Dexie.Table<IComments, [number, number]>;

  constructor() {
    super('OSMNearbyNotes');
    this.version(1).stores({
      notes: '&id, created, modified, deleted',
      comments: '&[noteId+commentNum], noteId',
    });
  }
}