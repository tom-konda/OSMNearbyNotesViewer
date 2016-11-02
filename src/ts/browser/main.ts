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
            let receiveData = {
              coordinate: {},
              notes: [],
              noteComments: [],
            }

            const getUserHomeLocation = () => {
              return new Promise(function (resolve, reject) {
                auth.xhr({
                  method: 'GET',
                  path: '/api/0.6/user/details'
                }, function (err, details) {
                  // details is an XML DOM of user details
                  if (err === null) {
                    const homeLocation = details.querySelector('osm > user > home');
                    if (homeLocation !== null) {
                      let coordinate: { lat: string, lon: string } = {
                        lat: homeLocation.getAttribute('lat'),
                        lon: homeLocation.getAttribute('lon'),
                      }
                      resolve(coordinate);
                      return;
                    }
                    swal('Cannot get user home location.', 'error');
                    reject('Cannot get user home location.');
                  }
                  reject(err);
                });
              });
            };

            const getNotes = (coordinate: { lat: string, lon: string }) => {
              receiveData.coordinate = coordinate;
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
                let noteComments = [];
                let lastModified = new Date(0);
                let noteId = notesXML[i].querySelector('id').textContent;

                let commentList = notesXML[i].querySelectorAll('comments > comment');
                for (let j = 0, commentCnt = commentList.length; j < commentCnt; ++j) {
                  let date = commentList[j].querySelector('date').textContent;
                  let text = commentList[j].querySelector('text').textContent;
                  let action = commentList[j].querySelector('action').textContent;

                  let user = '';
                  let userURL = '';
                  if (commentList[j].querySelector('user')) {
                    user = commentList[j].querySelector('user').textContent;
                    userURL = commentList[j].querySelector('user_url').textContent;
                  }

                  let commentDate = new Date(Date.parse(`${date.split(' ').slice(0, 2).join('T')}+0000`));
                  let commentData = {
                    'noteId': +noteId,
                    'commentNum': j,
                    'date': commentDate,
                    'user': user,
                    'userURL': userURL,
                    'text': text,
                    'action': action,
                  }
                  let commentResult = commentsOS.put(commentData);
                  noteComments[j] = commentData;

                  commentResult.addEventListener(
                    'success',
                    (event) => {
                    }
                  )

                  commentResult.addEventListener(
                    'error',
                    (event) => console.warn(event)
                  )
                  if (commentDate > lastModified) {
                    lastModified = commentDate;
                  }
                }
                receiveData.noteComments[noteId] = noteComments;

                let latlng = {
                  lat: notesXML[i].getAttribute('lat'),
                  lng: notesXML[i].getAttribute('lon'),
                }

                let created = notesXML[i].querySelector('date_created').textContent;
                let status = notesXML[i].querySelector('status').textContent;
                let noteData = {
                  'latlng': latlng,
                  'id': +noteId,
                  'created': new Date(Date.parse(`${created.split(' ').slice(0, 2).join('T')}+0000`)),
                  'modified': new Date(lastModified.getTime()),
                  'status': status,
                };
                let notesResult = notesOS.put(noteData);
                receiveData.notes[noteId] = noteData;

                notesResult.addEventListener(
                  'success',
                  (event) => { }
                )

                notesResult.addEventListener(
                  'error',
                  (event) => console.error(event.error)
                )
              }
              Promise.resolve();
            }

            getUserHomeLocation().then(
              getNotes,
              (error) => console.error(error)
            ).then(
              setNotesList,
              (error) => console.error(error)
              ).then(
              () => {
                const receiveDataEvent = new CustomEvent(
                  'receiveNotesAndCoordinate',
                  {
                    detail: receiveData
                  }
                )
                reactRootWrapperElement.dispatchEvent(receiveDataEvent);
              }
              );
          }
        );

        window.addEventListener(
          'submitButtonClicked',
          (event: CustomEvent) => {
            const noteId = event.detail.noteId;
            const target = event.detail.target;

            const postCommentAndMemoState = (target: Element, noteId: string) => {
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
                              swal('409');
                              break;
                            case 410:
                              swal('410');
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

            let updateNoteCommentsList = (xhrResult) => {
              return new Promise(
                (resolve, reject) => {
                  let noteId = xhrResult.noteId;
                  let trans = idbService.getTransaction();
                  let notesOS = trans.objectStore('notes');
                  let commentsOS = trans.objectStore('comments');
                  let isOpened = true;
                  let lastModified = new Date(0);

                  let lastCommentsCount = 0;
                  let storedCommentsCount = 0;

                  let response = <XMLDocument>xhrResult.response;
                  let commentsIdx = commentsOS.index('noteIdIdx');

                  let noteKeyRange = IDBKeyRange.only(noteId);
                  let noteCommentsRequest = commentsIdx.count(noteKeyRange);

                  noteCommentsRequest.onsuccess = (
                    () => {
                      storedCommentsCount = noteCommentsRequest.result;

                      let lastComments = response.querySelectorAll('comments > comment');
                      lastCommentsCount = response.querySelectorAll('comments > comment').length;

                      for (let i = storedCommentsCount; i < lastCommentsCount; ++i) {
                        let comment = lastComments[i];
                        let commentDate = new Date(Date.parse(`${comment.querySelector('date').textContent.split(' ').slice(0, 2).join('T')}+0000`));

                        let user = '';
                        let userURL = '';
                        if (comment.querySelector('user')) {
                          user = comment.querySelector('user').textContent;
                          userURL = comment.querySelector('user_url').textContent;
                        }
                        let commentResult = commentsOS.add({
                          'noteId': +noteId,
                          'commentNum': i,
                          'date': commentDate,
                          'user': user,
                          'userURL': userURL,
                          'text': comment.querySelector('text').textContent,
                          'action': comment.querySelector('action').textContent,
                        });

                        commentResult.addEventListener(
                          'success',
                          (event) => { }
                        )

                        commentResult.addEventListener(
                          'error',
                          (event) => {
                            console.warn(event);
                            return reject(event);
                          }
                        )

                        if (commentDate > lastModified) {
                          lastModified = commentDate;
                        }
                      }

                    }
                  );

                  noteCommentsRequest.onerror = (
                    (event) => {
                      console.warn(event);
                      return reject(event);
                    }
                  );

                  if (xhrResult.action !== 'commented') {
                    if (xhrResult.action === 'closed') {
                      isOpened = false;
                    }
                  }

                  let latlng = {
                    lat: response.querySelector('note').getAttribute('lat'),
                    lng: response.querySelector('note').getAttribute('lon'),
                  }

                  let created = response.querySelector('date_created').textContent;
                  let status = response.querySelector('status').textContent;

                  let notesResult = notesOS.put({
                    'latlng': latlng,
                    'id': +noteId,
                    'created': new Date(Date.parse(`${created.split(' ').slice(0, 2).join('T')}+0000`)),
                    'modified': new Date(lastModified.getTime()),
                    'status': status,
                  });

                  notesResult.addEventListener(
                    'success',
                    (event) => {
                      return resolve({
                        'displayedCommentsCount': storedCommentsCount,
                        'currentStoredCommentsCount': lastCommentsCount,
                        'responseXML': response,
                        'lastModified': lastModified,
                        'noteId': +noteId,
                        'isOpened': isOpened,
                      });
                    }
                  );
                }
              );
            }

            postCommentAndMemoState(target, noteId).then(
              updateNoteCommentsList,
              (reject) => console.error(reject)
            ).then(
              () => null,
              (reject) => console.error(reject)
              );
          }
        )
      }
    )
  })();
}