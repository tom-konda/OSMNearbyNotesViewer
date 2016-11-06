'use strict';
const OSMOAuthConfig = require('./osmOAuthInit');
import { IDBService } from './indexeddb-class';
import { coordinateCalc } from './coordinate-calc';
import codePointAt = require('code-point-at')
// require('leaflet.icon.glyph');

if (IDBService.enableIndexedDB() === false) {
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

    let idbService = IDBService;

    let idbReq = idbService.openDB('osmNearNotes', 1);

    idbReq.addEventListener(
      'upgradeneeded',
      function (event) {
        let oldVersion = event.oldVersion;
        if (oldVersion < 1) {
          // Create new indexedDB
          let notesStore = idbService.createObjectStore('notes', 'id', false);
          notesStore.createIndex(
            'createdIdx',
            'created',
            {
              'unique': false,
              'multiEntry': false,
            }
          );

          notesStore.createIndex(
            'modifiedIdx',
            'modified',
            {
              'unique': false,
              'multiEntry': false,
            }
          );

          let commentsStore = idbService.createObjectStore('comments', ['noteId', 'commentNum'], false);
          commentsStore.createIndex(
            'noteIdIdx',
            'noteId',
            {
              'unique': false,
              'multiEntry': false,
            }
          );
        }
      },
      false
    );

    document.addEventListener(
      'DOMContentLoaded',
      () => {
        const reactRootWrapperElement = document.querySelector('#AppWrapper');
        const auth: osmAuthInstance = OSMOAuthConfig.OAuth;
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
              (err, oauth) => {
                if (err) {
                  console.error(err)
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
                }, function (error, details: XMLDocument) {
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
                }, function (err, details: XMLDocument) {
                  if (err === null) {
                    const notesList = details.querySelectorAll('osm > note');

                    if (notesList.length) {
                      resolve(notesList);
                      return;
                    }
                    swal('Cannot get comments around near your home location.', 'error');
                    reject('Cannot get comments around near your home location.');
                  }
                  reject(err);
                });
              });
            };

            const setNotesList = (notesXML: NodeListOf<Element>) => {
              const trans = idbService.getTransaction();
              const notesOS = trans.objectStore('notes');
              const commentsOS = trans.objectStore('comments');

              for (let i = 0, notesCnt = notesXML.length; i < notesCnt; ++i) {
                let lastModified = new Date(0);
                let noteId = notesXML[i].querySelector('id').textContent;

                let commentList = notesXML[i].querySelectorAll('comments > comment');
                for (let j = 0, commentCnt = commentList.length; j < commentCnt; ++j) {
                  let date = commentList[j].querySelector('date').textContent;
                  let commentDate = new Date(Date.parse(`${date.split(' ').slice(0, 2).join('T')}+00:00`));
                  let commentResult = commentsOS.put(createNoteCommentData(commentList[j], j, Number(noteId)));

                  commentResult.addEventListener('success', (event) => { })

                  commentResult.addEventListener('error', (event) => Promise.reject(event.error))
                  if (commentDate > lastModified) {
                    lastModified = commentDate;
                  }
                }

                let notesResult = notesOS.put(createNoteData(notesXML[i], lastModified, Number(noteId)));

                notesResult.addEventListener(
                  'success',
                  (event) => {
                    if (i === notesXML.length - 1) {
                      Promise.resolve();
                    }
                  }
                )

                notesResult.addEventListener(
                  'error',
                  (event) => Promise.reject(event.error)
                )
              }
            }

            getUserHomeLocation().then(
              getNotes
            ).then(
              setNotesList
              ).then(
              () => findNotes(null)
              ).catch((error) => {
                console.error(error);
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
                  const osmXHRPost = (action: string, params) => {
                    auth.xhr(
                      params,
                      (error, xhr) => {
                        if (error === null) {
                          resolve({ action: action, noteId: noteId, response: xhr });
                        }
                        else if (error instanceof XMLHttpRequest) {
                          switch (error.status) {
                            case 409:
                              swal(error.responseText);
                              break;
                            case 410:
                              swal(error.responseText);
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
                  let params: osmAuthXHROptions;
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

            const updateNoteCommentsList = (xhrResult) => {
              return new Promise(
                (resolve, reject) => {
                  const trans = idbService.getTransaction();
                  const notesOS = trans.objectStore('notes');
                  const commentsOS = trans.objectStore('comments');
                  const unloadComments = [];
                  let lastModified = new Date(0);

                  let latestCommentsCount = 0;
                  let storedCommentsCount = 0;

                  const response = <XMLDocument>xhrResult.response;
                  const commentsIdx = commentsOS.index('noteIdIdx');

                  const noteKeyRange = IDBKeyRange.only(+noteId);
                  const noteCommentsRequest = commentsIdx.count(noteKeyRange);

                  noteCommentsRequest.onsuccess = (
                    () => {
                      storedCommentsCount = noteCommentsRequest.result;

                      const lastComments = response.querySelectorAll('comments > comment');
                      latestCommentsCount = response.querySelectorAll('comments > comment').length;

                      for (let i = storedCommentsCount; i < latestCommentsCount; ++i) {
                        let comment = lastComments[i];
                        let commentDate = new Date(Date.parse(`${comment.querySelector('date').textContent.split(' ').slice(0, 2).join('T')}+00:00`));
                        let commentData = createNoteCommentData(comment, i, noteId);
                        unloadComments.push(commentData)

                        let commentResult = commentsOS.add(commentData);

                        commentResult.addEventListener('success', (event) => { })

                        commentResult.addEventListener('error', (event) => reject(event))

                        if (commentDate > lastModified) {
                          lastModified = commentDate;
                        }
                      }

                    }
                  );

                  noteCommentsRequest.onerror = (
                    (event) => reject(event)
                  );

                  const noteData = createNoteData(response.querySelector('note'), lastModified, noteId);
                  const notesResult = notesOS.put(noteData);

                  notesResult.addEventListener(
                    'success',
                    (event) => {
                      return resolve({
                        'unloadComments': unloadComments,
                        'lastModified': lastModified,
                        'noteStatus': noteData.status,
                      });
                    }
                  );

                  notesResult.addEventListener('error', (event) => reject(event.error));
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

    const findNotes = (condition) => {
      let foundNotes = {
        notes: [],
        noteComments: [],
      }
      const trans = idbService.getTransaction(undefined, 'readonly');
      const notesOS = trans.objectStore('notes');
      // Get newest note first
      const notesIdx = notesOS.index('createdIdx');
      const notesCursor = notesIdx.openCursor(null, 'prev');

      notesCursor.addEventListener(
        'success',
        (event) => {
          if (notesCursor.result) {
            const noteCursorVal = (<IDBCursorWithValue>notesCursor.result);
            const noteId = noteCursorVal.value.id;

            const commentsOS = trans.objectStore('comments');
            const commentsIdx = commentsOS.index('noteIdIdx');

            const commentRange = IDBKeyRange.only(noteId);
            const commentCursor = commentsIdx.openCursor(commentRange);
            commentCursor.addEventListener(
              'success',
              (event) => {
                if (commentCursor.result === null) {
                  foundNotes.notes.push(noteCursorVal.value);
                  noteCursorVal.advance(1);
                }
                else {
                  const commentList = foundNotes.noteComments[noteId] || [];
                  const commCursorVal = (<IDBCursorWithValue>commentCursor.result);
                  commentList[commCursorVal.value.commentNum] = commCursorVal.value;
                  foundNotes.noteComments[noteId] = commentList;
                  commCursorVal.advance(1);
                }
              }
            );
          }
          else {
            const foundNotesEvent = new CustomEvent(
              'foundNotesAndNoteComments',
              {
                detail: foundNotes,
              }
            );
            const reactRootWrapperElement = document.querySelector('#AppWrapper');
            reactRootWrapperElement.dispatchEvent(foundNotesEvent);
          }
        }
      );
    }

    const createNoteData = (noteElement: Element, lastModified: Date, noteId: number) => {
      const latlng = {
        lat: noteElement.getAttribute('lat'),
        lng: noteElement.getAttribute('lon'),
      }

      const created = noteElement.querySelector('date_created').textContent;
      const status = noteElement.querySelector('status').textContent;

      return {
        'latlng': latlng,
        'id': +noteId,
        'created': new Date(Date.parse(`${created.split(' ').slice(0, 2).join('T')}+00:00`)),
        'modified': new Date(lastModified.getTime()),
        'status': status,
      };
    }

    const createNoteCommentData = (commentElement: Element, commentNum: number, noteId: number) => {
      const commentDate = new Date(Date.parse(`${commentElement.querySelector('date').textContent.split(' ').slice(0, 2).join('T')}+00:00`));

      let user = '';
      let userURL = '';
      if (commentElement.querySelector('user')) {
        user = commentElement.querySelector('user').textContent;
        userURL = commentElement.querySelector('user_url').textContent;
      }
      return {
        'noteId': +noteId,
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