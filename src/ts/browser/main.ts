'use strict';
const OSMOAuthConfig = require('./osmOAuthInit');
import { IDBService } from './indexeddb-class';
import { coordinateCalc } from './coordinate-calc';
// require('leaflet.icon.glyph');

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

  const reactRootWrapperElement = document.querySelector('#AppWrapper');
  const auth: osmAuthInstance = OSMOAuthConfig.OAuth;

  window.addEventListener(
    'oauthButtonClicked',
    (event) => {
      auth.authenticate(
        (err, oauth) => {
          if (err === null) {
            const oauthReadyEvent = new CustomEvent(
              'oauthReady',
              {
                detail: OSMOAuthConfig
              }
            )
            reactRootWrapperElement.dispatchEvent(oauthReadyEvent)
          }
          else {
            console.error(err)
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
        notes: {},
        noteComments: {},
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
                receiveData.coordinate = coordinate;
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
            receiveData[noteId][j] = commentData;

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
          receiveData[noteId] = noteData;

          notesResult.addEventListener(
            'success',
            (event) => { }
          )

          notesResult.addEventListener(
            'error',
            (event) => console.error(event.error)
          )
        }
      }

      getUserHomeLocation().then(
        getNotes,
        (error) => console.error(error)
      ).then(
        setNotesList,
        (error) => console.error(error)
        );

      const receiveDataEvent = new CustomEvent(
        'receiveNotesAndCoordinate',
        {
          detail: receiveData
        }
      )
      reactRootWrapperElement.dispatchEvent(receiveDataEvent);
    }
  );

  const oauthReadyEvent = new CustomEvent(
    'oauthReady',
    {
      detail: OSMOAuthConfig
    }
  )
  reactRootWrapperElement.dispatchEvent(oauthReadyEvent)
})();