'use strict';
const OSMOAuthConfig = require('./osmOAuthInit');
import { coordinateCalc } from './coordinate-calc';
import { OSMNearbyNotesDatabase } from './dexie-db';
import codePointAt = require('code-point-at');

if (typeof indexedDB === 'undefined') {
  document.addEventListener(
    'DOMContentLoaded',
    () => {
      const reactRootWrapperElement = document.querySelector('#AppWrapper');
      const notQualifiedBrowserEvent = new CustomEvent('notQualifiedBrowser');
      reactRootWrapperElement.dispatchEvent(notQualifiedBrowserEvent);
    }
  )
}
else {
  (function () {
    const db = new OSMNearbyNotesDatabase();
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        const reactRootWrapperElement = document.querySelector('#AppWrapper');
        const auth: OSMAuth.OSMAuthInstance = OSMOAuthConfig.OAuth;
        const oauthReadyEvent = new CustomEvent(
          'oauthReady',
          {
            detail: auth
          }
        )
        reactRootWrapperElement.dispatchEvent(oauthReadyEvent)

        window.addEventListener(
          'oauthButtonClicked',
          (event) => {
            auth.authenticate(
              (error, oauth) => {
                if (error) {
                  console.error(error)
                }
                else {
                  const oauthReadyEvent = new CustomEvent(
                    'oauthReady',
                    {
                      detail: auth
                    }
                  )
                  reactRootWrapperElement.dispatchEvent(oauthReadyEvent)
                }
              }
            );
          }
        )

        window.addEventListener(
          'getNearbyNotesClicked',
          (event: CustomEvent) => {
            const getUserHomeLocation = () => {
              return new Promise(function (resolve, reject) {
                auth.xhr({
                  method: 'GET',
                  path: '/api/0.6/user/details'
                }, function (error: any, details: XMLDocument) {
                  // details is an XML DOM of user details
                  if (error === null) {
                    const homeLocation = details.querySelector('osm > user > home');
                    const userName = details.querySelector('osm > user').getAttribute('display_name');
                    if (homeLocation !== null) {
                      let coordinate: { lat: string, lon: string } = {
                        lat: homeLocation.getAttribute('lat'),
                        lon: homeLocation.getAttribute('lon'),
                      }
                      const receiveDataEvent = new CustomEvent(
                        'receiveCoordinate',
                        {
                          detail: {
                            homeCoordinate: coordinate,
                            userName: userName
                          },
                        }
                      );
                      reactRootWrapperElement.dispatchEvent(receiveDataEvent);
                      resolve(coordinate);
                      return;
                    }
                    swal('Cannot get user home location.', 'error');
                    reject('Cannot get user home location.');
                  }
                  reject(error);
                });
              });
            };

            const getNotes = (coordinate: { lat: string, lon: string }) => {
              return new Promise((resolve, reject) => {
                const edge = coordinateCalc.getCoordinateArea(coordinate, 10);
                auth.xhr({
                  method: 'GET',
                  path: `/api/0.6/notes?limit=1000&bbox=${edge.w},${edge.s},${edge.e},${edge.n}`
                }, function (error: any, details: XMLDocument) {
                  if (error === null) {
                    const notesList = details.querySelectorAll('osm > note');

                    if (notesList.length) {
                      resolve(notesList);
                      return;
                    }
                    swal('Cannot get comments around near your home location.', 'error');
                    reject('Cannot get comments around near your home location.');
                  }
                  reject(error);
                });
              });
            };

            const setNotesList = (notesXML: NodeListOf<Element>) => {
              const noteData: NoteFormat[] = [];
              for (let i = 0, notesCnt = notesXML.length; i < notesCnt; ++i) {
                let lastModified = new Date(0);
                let noteId = notesXML[i].querySelector('id').textContent;

                let commentList = notesXML[i].querySelectorAll('comments > comment');
                const noteCommentsData: NoteCommentFormat[] = [];
                for (let j = 0, commentCnt = commentList.length; j < commentCnt; ++j) {
                  let date = commentList[j].querySelector('date').textContent;
                  let commentDate = new Date(Date.parse(`${date.split(' ').slice(0, 2).join('T')}+00:00`));
                  noteCommentsData.push(createNoteCommentData(commentList[j], j, Number(noteId)));
                  if (commentDate > lastModified) {
                    lastModified = commentDate;
                  }
                }
                db.comments.bulkPut(noteCommentsData).catch((error) => Promise.reject(error));
                noteData.push(createNoteData(notesXML[i], lastModified, Number(noteId)));
              }
              return db.notes.bulkPut(noteData);
            }

            getUserHomeLocation().then(
              getNotes
            ).then(
              setNotesList
              ).then(
              () => findNotes(null)
              ).catch((error) => {
                if (error instanceof XMLHttpRequest) {
                  swal(error.statusText, error.responseText, 'error');
                  console.error(error);
                }
                else {
                  console.error(error);
                }
              });
          }
        );

        window.addEventListener(
          'submitButtonClicked',
          (event: CustomEvent) => {
            event.preventDefault();
            const noteId: number = +event.detail.noteId;
            const target = event.detail.target;
            const noteComponentElement = document.querySelector(`#note-${noteId}`)

            const postCommentAndMemoState = (target: Element, noteId: number) => {
              return new Promise(
                (resolve, reject) => {
                  const osmXHRPost = (action: string, params: any) => {
                    auth.xhr(
                      params,
                      (error, xhr) => {
                        if (error === null) {
                          resolve({ action: action, noteId: noteId, response: xhr });
                        }
                        else if (error instanceof XMLHttpRequest) {
                          switch (error.status) {
                            case 409:
                              swal(error.statusText, error.responseText, 'error');
                              break;
                            case 410:
                              swal(error.statusText, error.responseText, 'error');
                          }
                          reject(error.responseText);
                        }
                        else {
                          reject(error);
                        }
                      }
                    );
                  }

                  const select = (target.querySelector(`#note-${noteId}-changeNoteStatus`) as HTMLSelectElement);
                  const textarea = (document.querySelector(`#note-${noteId}-addNoteComment`) as HTMLTextAreaElement);
                  const fixedEncodeURIComponent = (str: string) => encodeURIComponent(str).replace(/[!'()*]/g, (c) => '%' + codePointAt(c, 0).toString(16));
                  let params: OSMAuth.OSMAuthXHROptions;
                  if (select.value) {
                    switch (select.value) {
                      case 'closed':
                        params = {
                          path: `/api/0.6/notes/${noteId}/close`,
                          method: 'POST',
                        }
                        break;
                      case 'reopened':
                        params = {
                          path: `/api/0.6/notes/${noteId}/reopen`,
                          method: 'POST',
                        }

                        break;
                      default:
                        reject('unknown action')
                        return;
                    }

                    if (textarea.value.length > 0) {
                      params.content = `text=${fixedEncodeURIComponent(textarea.value)}`;
                    }
                    osmXHRPost(select.value, params);
                  }
                  else if (textarea.value.length > 0) {
                    params = {
                      path: `/api/0.6/notes/${noteId}/comment`,
                      method: 'POST',
                      content: `text=${fixedEncodeURIComponent(textarea.value)}`,
                    }
                    osmXHRPost('commented', params);
                  }
                }
              );
            }

            const updateNoteCommentsList = (xhrResult: any) => {
              return new Promise(
                (resolve, reject) => {
                  const unloadComments: NoteCommentFormat[] = [];
                  let noteData: NoteFormat;
                  let lastModified = new Date(0);

                  let latestCommentsCount = 0;
                  let storedCommentsCount = 0;

                  const response = <XMLDocument>xhrResult.response;
                  db.comments.where('noteId').equals(noteId).count().then(
                    (rowCount) => {
                      storedCommentsCount = rowCount;

                      const latestComments = response.querySelectorAll('comments > comment');
                      latestCommentsCount = response.querySelectorAll('comments > comment').length;

                      for (let i = storedCommentsCount; i < latestCommentsCount; ++i) {
                        let comment = latestComments[i];
                        let commentDate = new Date(Date.parse(`${comment.querySelector('date').textContent.split(' ').slice(0, 2).join('T')}+00:00`));
                        let commentData = createNoteCommentData(comment, i, noteId);
                        unloadComments.push(commentData)

                        if (commentDate > lastModified) {
                          lastModified = commentDate;
                        }
                      }
                      return db.comments.bulkAdd(unloadComments);
                    }
                  ).then(
                    (comment) => {
                      noteData = createNoteData(response.querySelector('note'), lastModified, noteId);
                      return db.notes.put(noteData);
                    }
                    ).then(
                    () => {
                      return resolve({
                        'unloadComments': unloadComments,
                        'lastModified': lastModified,
                        'noteStatus': noteData.status,
                      });
                    }
                    ).catch(
                    (error) => {
                      reject(error);
                    }
                    );
                }
              );
            }

            postCommentAndMemoState(target, noteId).then(
              updateNoteCommentsList,
            ).then(
              (modifiedNoteData) => {
                const submitSuccessEvent = new CustomEvent(
                  'submitSuccess',
                  {
                    detail: modifiedNoteData,
                  }
                );
                noteComponentElement.dispatchEvent(submitSuccessEvent);
              },
            ).catch((error: Error) => {
              console.error(error);
              const submitFailureEvent = new Event('submitFailure');
              noteComponentElement.dispatchEvent(submitFailureEvent);
            });
          }
        )
      }
    )

    const findNotes = (condition: any) => {
      let foundNotes: {
        notes: NoteFormat[],
        noteComments: { [key: number]: NoteCommentFormat[] },
      }
      foundNotes = {
        notes: [],
        noteComments: [],
      }

      db.notes.reverse().sortBy('created').then(
        (notes) => {
          const noteIds: number[] = [];
          notes.forEach(
            (note) => {
              foundNotes.notes.push(note);
              noteIds.push(note.id);
            }
          )
          return Promise.resolve(noteIds);
        }
      ).then(
        (noteIds) => {
          return Promise.all(
            noteIds.map(
              (noteId) => {
                return db.comments.where('noteId').equals(noteId).toArray().then(
                  (comments) => {
                    comments.forEach(
                      (comment) => {
                        const noteId = comment.noteId;
                        foundNotes.noteComments[noteId] = comments;
                      }
                    )
                  }
                );
              }
            )
          )
        }
        ).then(
        () => {
          const foundNotesEvent = new CustomEvent(
            'foundNotesAndNoteComments',
            {
              detail: foundNotes,
            }
          );
          const reactRootWrapperElement = document.querySelector('#AppWrapper');
          reactRootWrapperElement.dispatchEvent(foundNotesEvent);
        }
        )
    }

    const createNoteData = (noteElement: Element, lastModified: Date, noteId: number): NoteFormat => {
      const latlng: LatLngFormat = {
        lat: noteElement.getAttribute('lat'),
        lng: noteElement.getAttribute('lon'),
      }

      const created = noteElement.querySelector('date_created').textContent;
      const status = noteElement.querySelector('status').textContent;

      return {
        'latlng': latlng,
        'id': noteId,
        'created': new Date(Date.parse(`${created.split(' ').slice(0, 2).join('T')}+00:00`)),
        'modified': new Date(lastModified.getTime()),
        'deleted': status === 'closed' ? new Date(lastModified.getTime()) : null,
        'status': status,
      };
    }

    const createNoteCommentData = (commentElement: Element, commentNum: number, noteId: number): NoteCommentFormat => {
      const commentDate = new Date(Date.parse(`${commentElement.querySelector('date').textContent.split(' ').slice(0, 2).join('T')}+00:00`));

      let user = '';
      let userURL = '';
      if (commentElement.querySelector('user')) {
        user = commentElement.querySelector('user').textContent;
        userURL = commentElement.querySelector('user_url').textContent;
      }
      return {
        'noteId': noteId,
        'commentNum': commentNum,
        'date': commentDate,
        'user': user,
        'userURL': userURL,
        'text': commentElement.querySelector('text').textContent,
        'action': commentElement.querySelector('action').textContent,
      };
    }
  })();
}