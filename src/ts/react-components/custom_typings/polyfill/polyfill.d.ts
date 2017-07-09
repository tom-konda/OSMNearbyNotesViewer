/* ref: https://github.com/Microsoft/TypeScript/issues/1075#issuecomment-62084180 */
// User customization
declare var webkitIndexedDB: IDBFactory;
declare var mozIndexedDB: IDBFactory;
declare var webkitIDBKeyRange: IDBKeyRange;
declare var mozIDBKeyRange: IDBKeyRange;
declare var msIDBKeyRange: IDBKeyRange;
declare var webkitIDBTransaction: IDBTransaction;
declare var mozIDBTransaction: IDBTransaction;
declare var msIDBTransaction: IDBTransaction;
declare var webkitIDBCursor: IDBCursor;

interface Window {
  mozIndexedDB ?: IDBFactory
  webkitIndexedDB ?: IDBFactory
  IDBKeyRange: IDBKeyRange
  webkitIDBKeyRange?: IDBKeyRange
  mozIDBKeyRange?: IDBKeyRange
  msIDBKeyRange?: IDBKeyRange
  IDBTransaction: IDBTransaction
  webkitIDBTransaction?: IDBTransaction
  mozIDBTransaction?: IDBTransaction
  msIDBTransaction?: IDBTransaction
  IDBCursor: IDBCursor
  webkitIDBCursor?: IDBCursor
}

interface HTMLTimeElement extends HTMLElement {
  dateTime : string,
}