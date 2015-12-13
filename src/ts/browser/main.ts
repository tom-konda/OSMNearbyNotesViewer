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
                let notesStore = idbService.createObjectStore('notes', 'id');
                notesStore.createIndex(
                    'createdIdx',
                    'created',
                    {
                        'unique' : false,
                        'multiEntry' : false,
                    }
                )
                let commentsStore = idbService.createObjectStore('comments', 'id', true);
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
                    path: `/api/0.6/notes?bbox=${edge.w},${edge.s},${edge.e},${edge.n}`
                }, function(err, details) {
                    if(err === null){
                        let notesList = (<XMLDocument>details).querySelectorAll('osm > note');
                        
                        if(notesList.length){
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
                    lon : notesXML[i].getAttribute('lon'),
                }
                
                let threadId = notesXML[i].querySelector('id').textContent;
                let created = notesXML[i].querySelector('date_created').textContent;
                let notesResult = notesOS.put({
                    'latlng' : latlng,
                    'id' : threadId,
                    'created' : created,
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
                    let status = commentList[j].querySelector('action').textContent;
                    let commentResult = commentsOS.add({
                      'threadId' : threadId,
                      'date' : date,
                      'user' : user,
                      'userURL' : userURL,
                      'text' : text,
                      'status' : status,
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
                            console.log(event.error);
                        }
                    )
                    
                    comments[i] = {
                        'date' : date,
                        'user' : user,
                        'userURL' : userURL,
                        'text' : text,
                        'status' : status,
                    }
                }
                thread[i] = {
                    'latlng' : latlng,
                    'id' : threadId,
                    'created' : created,
                    'comments' : comments
                }
            }
            sessionStorage.setItem('threads', JSON.stringify(thread));
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
                let trans = idbService.getTransaction(['notes'], 'readonly');
                let notesOS = trans.objectStore('notes');
                let notesCursor = notesOS.openCursor(null);
                notesCursor.addEventListener(
                    'success',
                    function(event){
                        if(notesCursor.result==null){
                        //IDBRequestのresultがnullのときは、もうデータがない
                        console.log("終了しました。");
                        } else{
                        //IDBRequestのresultはIDBCursorWithValueである
                        let cursor=notesCursor.result;
                        console.log(cursor.value);	//そのレコードを表示
                        //次のレコードに進む
                        cursor.advance(1);
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