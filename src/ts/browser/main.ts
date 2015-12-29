let osmAuth = require('osm-auth');
import {IDBService} from './indexeddb-class';
import {coordinateCalc} from './coordinate-calc';

(function(){
  'use strict';
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
        // 新規作成時
        let notesStore = idbService.createObjectStore('notes', 'id', false);
        notesStore.createIndex(
          'createdIdx',
          'created',
          {
            'unique' : false,
            'multiEntry' : false,
          }
        )
        let commentsStore = idbService.createObjectStore('comments', 'threadIdCommId', false);
        commentsStore.createIndex(
          'threadIdIdx',
          'threadId',
          {
            'unique' : false,
            'multiEntry' : false,
          }
        );
        commentsStore.createIndex(
          'dateIdx',
          'date',
          {
            'unique' : false,
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
      console.log((<any>event.target).errorCode);
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
    let markers =  L.layerGroup();
    let searchArea =  L.layerGroup();
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    }).addTo(map);
    
    let auth = new osmAuth({
      url : 'http://api06.dev.openstreetmap.org',
      oauth_consumer_key: 'nxoVnBJUnzEexg9MMw8fJfeNfIrewJPa5uCOY9Md',
      oauth_secret: 'dxg765uScWbTRyh9l7BDoyxTw0FOplCthjZfHfLJ',
      auto: true
    });
    
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
              let areaRect = L.rectangle(bounds, {color: "#ff7800", weight: 1});
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
      let thread = [];
      let trans = idbService.getTransaction();
      let notesOS = trans.objectStore('notes');
      let commentsOS = trans.objectStore('comments');
      
      for(let i = 0, notesCnt = notesXML.length; i < notesCnt; ++i){
        let latlng = {
          lat : notesXML[i].getAttribute('lat'),
          lng : notesXML[i].getAttribute('lon'),
        }
        L.marker(latlng).addTo(map);
        
        let threadId = notesXML[i].querySelector('id').textContent;
        let created = notesXML[i].querySelector('date_created').textContent;
        let status = notesXML[i].querySelector('status').textContent;
        let notesResult = notesOS.put({
          'latlng' : latlng,
          'id' : threadId,
          'created' : new Date(Date.parse(`${created.split(' ').slice(0, 2).join('T')}+0000`)),
          'status' : status,
        });
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
          let user = commentList[j].querySelector('user').textContent;
          let userURL = commentList[j].querySelector('user_url').textContent;
          let text = commentList[j].querySelector('text').textContent;
          let action = commentList[j].querySelector('action').textContent;
          let commentResult = commentsOS.put({
            'threadIdCommId' : `${threadId}-${j}`,
            'threadId' : threadId,
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
    }
    
    let button = document.getElementById('get-near-notes');
    button.addEventListener(
      'click',
      function(){
        if (auth.authenticated()) {
          getUserHomeLocation().then(
            getNotes,
            function(error){console.log(error)}
          ).then(
            function(success){
              setNotesList(success);
            },
            function(error){console.log(error)}
          );
        }
        else {
          getUserHomeLocation().then(
            getNotes,
            function(error){console.log(error)}
          ).then(
            function(success){
              setNotesList(success);
            },
            function(error){console.log(error)}
          );
        }
      }
    );
    
    let dispButton = document.getElementById('display');
    dispButton.addEventListener(
      'click',
      function(){
        let trans = idbService.getTransaction(undefined, 'readonly');
        let notesOS = trans.objectStore('notes');
        // Get newest note first
        let notesIdx = notesOS.index('createdIdx');
        let notesCursor = notesIdx.openCursor(null, 'prev');
        
        let threadTemplate = (<HTMLTemplateElement>document.querySelector('#note-content'));
        notesCursor.addEventListener(
          'success',
          function(event){
            if(notesCursor.result){
              let commentTemplate = (<HTMLTemplateElement>document.querySelector('#comment-content'));
              //IDBRequestのresultはIDBCursorWithValueである
              let noteCursorVal = (<IDBCursorWithValue>notesCursor.result);

              let noteStatus = threadTemplate.content.querySelector('.status');
              noteStatus.textContent = noteCursorVal.value.status;
              let noteSection = threadTemplate.content.querySelector('section');
              noteSection.id = `note-${noteCursorVal.value.id}`;
              let created = threadTemplate.content.querySelector('time');
              created.textContent = (<Date>noteCursorVal.value.created).toLocaleString();
              let note = document.importNode(threadTemplate.content, true);
              document.querySelector('#note-list').appendChild(note);
              
              let commentsOS = trans.objectStore('comments');
              let commentsIdx = commentsOS.index('threadIdIdx');

              let commentCursor = commentsIdx.openCursor(IDBKeyRange.only(noteCursorVal.value.id));
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
                    let date = commentTemplate.content.querySelector('time');
                    date.textContent = (<Date>commCursorVal.value.date).toLocaleString();
                    let userOSMPage = (<HTMLAnchorElement>commentTemplate.content.querySelector('a'));
                    userOSMPage.textContent = commCursorVal.value.user;
                    userOSMPage.href = commCursorVal.value.userURL;
                    let userAction = commentTemplate.content.querySelector('.user-action');
                    userAction.textContent = commCursorVal.value.action;
                    
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
    );
  });
  
  document.addEventListener('displayThread', function(){
    ;
  });
})();