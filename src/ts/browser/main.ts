'use strict';
let osmAuth:osmAuthConstructor = require('osm-auth');
require('es6-promise').polyfill();
require('leaflet.icon.glyph');
import {IDBService} from './indexeddb-class';
import {coordinateCalc} from './coordinate-calc';

(function(){

  let idbService = IDBService;

  let idbReq = idbService.openDB('osmNearNotes', 1);

  idbReq.addEventListener(
    'upgradeneeded',
    function(event) {
      let oldVersion = event.oldVersion;
      /*
        iOS 8 は挙動が変なので注意
        ref http://webos-goodies.jp/archives/5_pitfalls_of_indexeddb_on_ios8.html
      */
      if(oldVersion < 1) {
        // Create new indexedDB
        let notesStore = idbService.createObjectStore('notes', 'id', false);
        notesStore.createIndex(
          'createdIdx',
          'created',
          {
            'unique' : false,
            'multiEntry' : false,
          }
        )
        let commentsStore = idbService.createObjectStore('comments', ['noteId', 'commentNum'], false);
        commentsStore.createIndex(
          'noteIdIdx',
          'noteId',
          {
            'unique' : false,
            'multiEntry' : false,
          }
        );
        commentsStore.createIndex(
          'threadCommentIdx',
          ['noteId', 'commentNum'],
          {
            'unique' : true,
            'multiEntry' : false,
          }
        );
      }
    },
    false
  );

  idbReq.addEventListener(
    'success',
    function(event) {
      // this.db = (<IDBRequest>event.target).result;
    }
  );

  idbReq.addEventListener(
    'error',
    function(event) {
      console.error((<any>event.target).errorCode);
    },
    false
  );

  document.addEventListener('DOMContentLoaded', function(event) {
    let map = L.map(
      'map',
      {
        scrollWheelZoom: false,
      }
    );
    let markers = new L.MarkerClusterGroup();
    let searchArea =  L.layerGroup();
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    }).addTo(map);

    let authConfig:osmAuthConfig = {
      url : 'http://api06.dev.openstreetmap.org',
      oauth_consumer_key: 'nxoVnBJUnzEexg9MMw8fJfeNfIrewJPa5uCOY9Md',
      oauth_secret: 'dxg765uScWbTRyh9l7BDoyxTw0FOplCthjZfHfLJ',
      auto: true,
    };

    let auth = new osmAuth(authConfig);

    let getUserHomeLocation = function(){
      return new Promise(function(resolve, reject){
        auth.xhr({
          method: 'GET',
          path: '/api/0.6/user/details'
        }, function(err, details) {
          // details is an XML DOM of user details
          if(err === null){
            let homeLocation = details.querySelector('osm > user > home');
            if(homeLocation !== null){
              let coordinate:{lat:string, lon:string} = {
                lat : homeLocation.getAttribute('lat'),
                lon : homeLocation.getAttribute('lon'),
              }
              resolve(coordinate);
              return ;
            }
            swal('Cannot get user home location.', 'error');
            reject('Cannot get user home location.');
          }
          reject(err);
        });
      });
    };

    let getNotes = function(coordinate:{lat:string, lon:string}){
      return new Promise(function(resolve, reject){
        let edge = coordinateCalc.getCoordinateArea(coordinate, 10);
        auth.xhr({
          method: 'GET',
          path: `/api/0.6/notes?limit=1000&bbox=${edge.w},${edge.s},${edge.e},${edge.n}`
        }, function(err, details) {
          searchArea.clearLayers();
          if(err === null){
            let notesList = (<XMLDocument>details).querySelectorAll('osm > note');

            if(notesList.length){
              let bounds = L.latLngBounds({lat : edge.s, lng : edge.w}, {lat : edge.n, lng : edge.e});
              let areaRect = L.rectangle(bounds, {color: '#ff7800', weight: 1});
              searchArea.addLayer(areaRect).addTo(map);
              map.fitBounds(bounds);
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

    let setNotesList = function(notesXML) {
      let trans = idbService.getTransaction();
      let notesOS = trans.objectStore('notes');
      let commentsOS = trans.objectStore('comments');

      for(let i = 0, notesCnt = notesXML.length; i < notesCnt; ++i){
        let latlng = {
          lat : notesXML[i].getAttribute('lat'),
          lng : notesXML[i].getAttribute('lon'),
        }

        let noteId = notesXML[i].querySelector('id').textContent;
        let created = notesXML[i].querySelector('date_created').textContent;
        let status = notesXML[i].querySelector('status').textContent;
        let notesResult = notesOS.put({
          'latlng' : latlng,
          'id' : +noteId,
          'created' : new Date(Date.parse(`${created.split(' ').slice(0, 2).join('T')}+0000`)),
          'status' : status,
        });

        let glyph:string,
            glyphColor:string;
        switch (status) {
          case 'open':
            glyph = 'close';
            glyphColor = 'red';
            break;

          default:
            glyph = 'check';
            glyphColor = 'lime';
            break;
        }
        let marker = L.marker(
          latlng,
          {
            icon : L.icon.glyph({
              className : 'fa',
              prefix: 'fa',
              glyph: glyph,
              glyphColor: glyphColor,
            })
          }
        );
        markers.addLayer(marker);

        notesResult.addEventListener(
          'success',
          function(event){
            console.log(event, notesResult);
          }
        )

        notesResult.addEventListener(
          'error',
          function(event){
            console.log(event.error);
          }
        )

        let commentList = notesXML[i].querySelectorAll('comments > comment');
        let comments = [];
        for(let j = 0, commentCnt = commentList.length; j < commentCnt; ++j){
          let date = commentList[j].querySelector('date').textContent;
          let text = commentList[j].querySelector('text').textContent;
          let action = commentList[j].querySelector('action').textContent;

          let user = '';
          let userURL = '';
          if (commentList[j].querySelector('user')) {
            user = commentList[j].querySelector('user').textContent;
            userURL = commentList[j].querySelector('user_url').textContent;
          }
          let commentResult = commentsOS.put({
            'noteId' : +noteId,
            'commentNum' : j,
            'date' : new Date(Date.parse(`${date.split(' ').slice(0, 2).join('T')}+0000`)),
            'user' : user,
            'userURL' : userURL,
            'text' : text,
            'action' : action,
          });

          commentResult.addEventListener(
            'success',
            function(event){
              console.log(event, commentResult);
            }
          )

          commentResult.addEventListener(
            'error',
            function(event){
              console.warn(event);
            }
          )
        }
      }
      markers.addTo(map);
    }

    let displayNoteAndComment = function(){
      let trans = idbService.getTransaction(undefined, 'readonly');
      let notesOS = trans.objectStore('notes');
      // Get newest note first
      let notesIdx = notesOS.index('createdIdx');
      let notesCursor = notesIdx.openCursor(null, 'prev');

      let noteTemplate = (<HTMLTemplateElement>document.querySelector('#note-content'));
      notesCursor.addEventListener(
        'success',
        function(event){
          if(notesCursor.result){
            let commentTemplate = (<HTMLTemplateElement>document.querySelector('#comment-content'));
            let noteCursorVal = (<IDBCursorWithValue>notesCursor.result);
            let noteId = noteCursorVal.value.id;

            let noteStatus = noteTemplate.content.querySelector('.status');
            noteStatus.textContent = `状態：${noteCursorVal.value.status}`;
            let noteSection = noteTemplate.content.querySelector('section');
            noteSection.id = `note-${noteId}`;
            noteTemplate.content.querySelector('.create-date').firstChild.textContent = 'メモ作成日：';
            let created = (<HTMLTimeElement>noteTemplate.content.querySelector('time'));
            created.dateTime = (<Date>noteCursorVal.value.created).toISOString();
            created.textContent = (<Date>noteCursorVal.value.created).toLocaleString();

            noteSection.querySelector('form').id = `${noteSection.id}-form`;

            noteSection.querySelector(`#${noteSection.id}-form > select`).id
              = (<HTMLLabelElement>noteSection.querySelector(`#${noteSection.id}-form > label:first-child`)).htmlFor
              = `${noteSection.id}-changeNoteStatus`;

            if (noteCursorVal.value.status === 'closed') {
               let options = noteSection.querySelectorAll(`#${noteSection.id}-form > select > option`)
               for (let i = 0, cnt = options.length; i < cnt; ++i) {
                 let option = <HTMLOptionElement>options.item(i);
                 if (option.value) {
                   option.disabled = !option.disabled;
                 }
               }
            }
            (<any>(<HTMLElement>noteSection.querySelector(`#${noteSection.id}-form > select`)).dataset).currentStatus = noteCursorVal.value.status;

            noteSection.querySelector(`#${noteSection.id}-form > label > textarea`).id
              = (<HTMLLabelElement>noteSection.querySelector(`#${noteSection.id}-form > label:last-child`)).htmlFor
              = `${noteSection.id}-addNoteComment`;
            noteSection.querySelector('button').setAttribute('form', `${noteSection.id}-form`);
            let note = document.importNode(noteTemplate.content, true);
            document.querySelector('#note-list').appendChild(note);

            let submitButton = (document.querySelector(`#${noteSection.id}-form`));
            submitButton.addEventListener(
              'submit',
              (event) => {
                postCommentAndMemoState(event, noteId).then(
                  updateNoteCommentsList,
                  (reject) => console.error(reject)
                ).then(
                  updateNotesDisplay,
                  (reject) => console.error(reject)
                );
                event.preventDefault();
              },
              false
            )

            let commentsOS = trans.objectStore('comments');
            let commentsIdx = commentsOS.index('noteIdIdx');

            let commentRange = IDBKeyRange.only(noteCursorVal.value.id);
            let commentCursor = commentsIdx.openCursor(commentRange);
            commentCursor.addEventListener(
              'success',
              function(event) {
                if (commentCursor.result === null) {
                  // コメントがなくなったら次のメモに移動
                  noteCursorVal.advance(1);
                }
                else {
                  let commCursorVal = (<IDBCursorWithValue>commentCursor.result);
                  let commentText = commentTemplate.content.querySelector('p.commentText');
                  commentText.textContent = commCursorVal.value.text;
                  let commentDate = (<HTMLTimeElement>commentTemplate.content.querySelector('time'));
                  commentDate.dateTime = (<Date>commCursorVal.value.date).toISOString();
                  commentDate.textContent = (<Date>commCursorVal.value.date).toLocaleString();
                  let userAction = commentTemplate.content.querySelector('.user-action');
                  userAction.textContent = `${commCursorVal.value.action}`;

                  if (commCursorVal.value.user) {
                    let userOSMPage = (<HTMLAnchorElement>commentTemplate.content.querySelector('a'));
                    userOSMPage.textContent = commCursorVal.value.user;
                    userOSMPage.href = commCursorVal.value.userURL;
                  }

                  let comment = document.importNode(commentTemplate.content, true);
                  document.querySelector(`#note-${noteCursorVal.value.id} > div`).appendChild(comment);
                  commCursorVal.advance(1);
                }
              }
            );
          }
        }
      );
    }

    let postCommentAndMemoState = function(event:Event, noteId:string) {
      return new Promise(
        (resolve, reject) => {
          let select = (<HTMLSelectElement>document.querySelector(`#note-${noteId}-changeNoteStatus`));
          let textarea = (<HTMLTextAreaElement>document.querySelector(`#note-${noteId}-addNoteComment`));
          let fixedEncodeURIComponent = (str:string) => encodeURIComponent(str).replace(/[!'()*]/g, (c) => '%' + c.codePointAt(0).toString(16));
          let params:osmAuthXHROptions;
          if (select.value) {
            switch (select.value) {
              case 'closed' :
                params = {
                  path : `/api/0.6/notes/${noteId}/close`,
                  method : 'POST',
                }

                if (textarea.value.length > 0) {
                  params.content = `text=${fixedEncodeURIComponent(textarea.value)}`;
                }
                auth.xhr(
                  params,
                  (err, xhr) => {
                    if (err === null) {
                      console.log(xhr, 'XHR');
                      (<any>(<HTMLElement>select).dataset).currentStatus = 'closed';
                      resolve({action : 'closed', noteId : noteId, response : xhr});
                    }
                    else {
                      switch (err.status) {
                        case 409:
                          swal('409');
                          break;
                        case 410:
                          swal('410');
                      }
                      reject(err.responseText);
                    }
                  }
                );
                break;
              case 'reopened' :
                params = {
                  path : `/api/0.6/notes/${noteId}/reopen`,
                  method : 'POST',
                }

                if (textarea.value.length > 0) {
                  params.content = `text=${fixedEncodeURIComponent(textarea.value)}`;
                }
                auth.xhr(
                  params,
                  (err, xhr) => {
                    if (err === null) {
                      console.log(xhr, 'XHR');
                      (<any>(<HTMLElement>select).dataset).currentStatus = 'opened';
                      resolve({action : 'reopened', noteId : noteId, response : xhr});
                    }
                    else {
                      switch (err.status) {
                        case 409:
                          swal('409');
                          break;
                        case 410:
                          swal('410');
                          break;
                      }
                      reject(err.responseText);
                    }
                  }
                );
                break;
            }
          }
          else if(textarea.value.length > 0) {
            params = {
              path : `/api/0.6/notes/${noteId}/comment`,
              method : 'POST',
              content : `text=${fixedEncodeURIComponent(textarea.value)}`,
            }

            auth.xhr(
              params,
              (err, responseXML) => {
                if (err === null) {
                  console.log(responseXML, 'XHR');
                  resolve({action : 'commented', noteId : noteId, response : responseXML});
                }
                else {
                  switch (err.status) {
                    case 409:
                      swal('409');
                      break;
                    case 410:
                      swal('410');
                      break;
                  }
                  reject(err.responseText);
                }
              }
            );
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

          let response = <XMLDocument>xhrResult.response;

          if (xhrResult.action !== 'commented') {
            console.log(xhrResult ,'変更');

            let latlng = {
              lat : response.querySelector('note').getAttribute('lat'),
              lng : response.querySelector('note').getAttribute('lon'),
            }

            let created = response.querySelector('date_created').textContent;
            let status = response.querySelector('status').textContent;

            let notesResult = notesOS.put({
              'latlng' : latlng,
              'id' : +noteId,
              'created' : new Date(Date.parse(`${created.split(' ').slice(0, 2).join('T')}+0000`)),
              'status' : status,
            });


            if(xhrResult.action === 'closed'){
              isOpened = false;
            }
          }

          let commentsIdx = commentsOS.index('noteIdIdx');

          let noteKeyRange = IDBKeyRange.only(noteId);
          let noteCommentsRequest = commentsIdx.count(noteKeyRange);

          noteCommentsRequest.onsuccess = (
            () => {
              console.log(arguments);
              let storedCommentsCount = noteCommentsRequest.result;

              let lastComments = response.querySelectorAll('comments > comment');
              let lastCommentsCount = response.querySelectorAll('comments > comment').length;

              let successCommentsCount = 0;

              console.log(storedCommentsCount);
              for (let i = storedCommentsCount; i < lastCommentsCount; ++i) {
                let comment = lastComments[i];
                let commentResult = commentsOS.add({
                  'noteId' : +noteId,
                  'commentNum' : i,
                  'date' : new Date(Date.parse(`${comment.querySelector('date').textContent.split(' ').slice(0, 2).join('T')}+0000`)),
                  'user' : comment.querySelector('user').textContent,
                  'userURL' : comment.querySelector('user_url').textContent,
                  'text' : comment.querySelector('text').textContent,
                  'action' : comment.querySelector('action').textContent,
                });

                commentResult.addEventListener(
                  'success',
                  function(event){
                    ++successCommentsCount;

                    if (successCommentsCount === lastCommentsCount - storedCommentsCount) {
                      return resolve({
                        'displayedCommentsCount' : storedCommentsCount,
                        'currentStoredCommentsCount' : lastCommentsCount,
                        'responseXML' : response,
                        'noteId' : +noteId,
                        'isOpened' : isOpened,
                      });
                    }
                  }
                )

                commentResult.addEventListener(
                  'error',
                  function(event){
                    console.warn(event);
                    return reject(event);
                  }
                )
              }

            }
          );

          noteCommentsRequest.onerror = (
            (event) => {
              console.warn(event);
              return reject(event);
            }
          );
        }
      );
    }

    let updateNotesDisplay = (updateResult) => {
      console.log(updateResult, 'アップデート')
      let displayedCommentCount = updateResult.displayedCommentsCount;
      let currentStoredCommentsCount = updateResult.currentStoredCommentsCount;
      let commentTemplate = (<HTMLTemplateElement>document.querySelector('#comment-content'));
      let noteId = updateResult.noteId;
      let noteIsOpened = updateResult.isOpened;
      let response = <XMLDocument>updateResult.responseXML;
      let comments = response.querySelectorAll('comments > comment');

      for (let i = displayedCommentCount; i < currentStoredCommentsCount; i++) {
        let comment = comments[i];

        let commentText = commentTemplate.content.querySelector('p.commentText');
        commentText.textContent = comment.querySelector('text').textContent;
        let commentDate = (<HTMLTimeElement>commentTemplate.content.querySelector('time'));
        let xmlDate = new Date(Date.parse(`${comment.querySelector('date').textContent.split(' ').slice(0, 2).join('T')}+0000`));
        commentDate.dateTime = xmlDate.toISOString();
        commentDate.textContent = xmlDate.toLocaleString();
        let userAction = commentTemplate.content.querySelector('.user-action');
        userAction.textContent = comment.querySelector('action').textContent;

        if (comment.querySelector('user')) {
          let userOSMPage = (<HTMLAnchorElement>commentTemplate.content.querySelector('a'));
          userOSMPage.textContent = comment.querySelector('user').textContent;
          userOSMPage.href = comment.querySelector('user_url').textContent;
        }

        let commentDOM = document.importNode(commentTemplate.content, true);
        document.querySelector(`#note-${noteId} > div`).appendChild(commentDOM);
      }

      (<HTMLTextAreaElement>document.querySelector(`#note-${noteId}-addNoteComment`)).value = '';
      if (noteIsOpened) {
        ;
      }
      else {
        ;
      }
    }

    let button = document.getElementById('get-near-notes');
    button.addEventListener(
      'click',
      function(){
        if (auth.authenticated()) {
          getUserHomeLocation().then(
            getNotes,
            (error) => console.error(error)
          ).then(
            function(success){
              setNotesList(success);
            },
            (error) => console.error(error)
          );
        }
        else {
          auth.bootstrapToken('', (err, oauth) => console.info(arguments));
          auth.authenticate(() => console.log(arguments));
        }
      }
    );

    let dispButton = document.getElementById('display');
    dispButton.addEventListener(
      'click',
      displayNoteAndComment
    );
  });

  document.addEventListener('displayThread', function(){
    ;
  });
})();