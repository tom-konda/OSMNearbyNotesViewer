export namespace IDBService {
  let _db:IDBDatabase;
  let _idbName:string;
  let _tables:string[] = [];
  
  export function openDB(idbName = 'example', version = 1):IDBOpenDBRequest {
    _idbName = idbName;
    let idbReq = indexedDB.open(idbName, version);
    idbReq.addEventListener(
      'upgradeneeded',
      function(event){
        _db = (<IDBRequest>event.target).result;
      }
    );
    idbReq.addEventListener(
      'success',
      function(event){
        _db = _db || (<IDBRequest>event.target).result;
        let objStoreNameList = (<DOMStringList>(<IDBRequest>event.target).result.objectStoreNames);
        
        for(let i = 0, cnt = objStoreNameList.length; i < cnt;++i){
          _tables.push(objStoreNameList.item(i));
        }
      }
    );
    return idbReq;
  }
  export function dropDB(idbName = _idbName){
    indexedDB.deleteDatabase(idbName);
  }
  export function add (dataObj) {
    ;
  }
  export function getTransaction(tables = _tables, mode = 'readwrite'):IDBTransaction{
    return _db.transaction(tables, mode);
  }
  export function createObjectStore (table, keyPath, isAutoIncrement = true):IDBObjectStore{
      // _tables.push(table);
      return _db.createObjectStore(table, {keyPath : keyPath, autoIncrement : isAutoIncrement});
  }
  export function deleteObjectStore (tables){
      // TODO
  }
};

window.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.mozIDBTransaction || window.msIDBTransaction;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.mozIDBKeyRange || window.msIDBKeyRange;
window.IDBCursor = window.IDBCursor || window.webkitIDBCursor;
