export namespace IDBService {
  'use strict';
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
        let i = 0;
        let cnt = objStoreNameList.length;
        for( ; i < cnt; ++i){
          if(_tables.indexOf(objStoreNameList.item(i)) === -1){
            _tables.push(objStoreNameList.item(i));
          }
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
      if (_tables.indexOf(table) === -1){
        _tables.push(table);
      }
      return _db.createObjectStore(table, {keyPath : keyPath, autoIncrement : isAutoIncrement});
  }
  export function deleteObjectStore (tables){
      // TODO
  }

  export function getTables(){
    return _tables;
  }
};
