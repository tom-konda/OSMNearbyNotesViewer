(function e(t, n, r) { function s(o, u) { if (!n[o]) { if (!t[o]) { var a = typeof require == "function" && require; if (!u && a) return a(o, !0); if (i) return i(o, !0); var f = new Error("Cannot find module '" + o + "'"); throw f.code = "MODULE_NOT_FOUND", f } var l = n[o] = { exports: {} }; t[o][0].call(l.exports, function (e) { var n = t[o][1][e]; return s(n ? n : e) }, l, l.exports, e, t, n, r) } return n[o].exports } var i = typeof require == "function" && require; for (var o = 0; o < r.length; o++)s(r[o]); return s })({
  1: [function (require, module, exports) {
    (function (global) {
      'use strict';

      function _interopDefault(ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

      var React = _interopDefault((typeof window !== "undefined" ? window['React'] : typeof global !== "undefined" ? global['React'] : null));
      var ReactDOM = _interopDefault((typeof window !== "undefined" ? window['ReactDOM'] : typeof global !== "undefined" ? global['ReactDOM'] : null));
      var reactLeaflet = (typeof window !== "undefined" ? window['ReactLeaflet'] : typeof global !== "undefined" ? global['ReactLeaflet'] : null);

      var convertDatetoText = function (originalDate) {
        'use strict';
        var nowUNIXtime = Math.floor(Date.now() / 1000);
        var originalDateUNIXtime = Math.floor(originalDate.getTime() / 1000);
        var diff = nowUNIXtime - originalDateUNIXtime;
        if (diff < 60) {
          return `${diff}s`;
        }
        else if (diff < 3600) {
          return `${Math.floor(diff / 60)}m`;
        }
        else if (diff < 86400) {
          return `${Math.floor(diff / 3600)}h`;
        }
        else {
          return `${originalDate.toLocaleDateString()}`;
        }
      };

      class CommentComponent extends React.Component {
        constructor(props) {
          super(props);
        }
        render() {
          var comment = this.props.noteComment;
          var userNameAndLink;
          if (comment.user) {
            userNameAndLink = (React.createElement("span", { className: "user-osm-page" },
              React.createElement("a", { href: comment.userURL }, comment.user)
            ));
          }
          else {
            userNameAndLink = (React.createElement("span", { className: "user-osm-page" }, "annonymous user"));
          }
          return (React.createElement("article", { className: "comment" },
            React.createElement("div", { className: "comment-info" },
              userNameAndLink,
              React.createElement("span", { className: "submit-date" },
                React.createElement("time", { dateTime: comment.date.toISOString() }, convertDatetoText(comment.date))
              ),
              React.createElement("span", { className: "user-action" }, comment.action)),
            React.createElement("p", { className: "commentText" }, comment.text)));
        }
        ;
      }

      class NoteComponent extends React.Component {
        constructor(props) {
          super(props);
          this.prePostState = null;
          this.state = {
            currentNote: this.props.note,
            currentNoteComments: this.props.noteComments,
          };
        }
        componentDidMount() {
          var this$1 = this;

          var noteComponentElement = document.querySelector(`#note-${this.props.note.id}`);
          noteComponentElement.addEventListener('submitSuccess', function (event) {
            var modifiedNoteData = event.detail;
            var currentPostState = this$1.prePostState;
            currentPostState.currentNote.modified = modifiedNoteData.lastModified;
            currentPostState.currentNote.status = modifiedNoteData.noteStatus;
            Array.prototype.push.apply(currentPostState.currentNoteComments, modifiedNoteData.unloadComments);
            this$1.setState(currentPostState);
            this$1.prePostState = null;
          });
          noteComponentElement.addEventListener('submitFailure', function (event) {
            this$1.setState(this$1.prePostState);
            this$1.prePostState = null;
          });
        }
        componentWillUnmount() {
          var noteComponentElement = document.querySelector(`#note-${this.props.note.id}`);
          noteComponentElement.removeEventListener('submitSuccess');
          noteComponentElement.removeEventListener('submitFailure');
        }
        cloneState(state) {
          var cloned = Object.assign({}, state);
          cloned.currentNote = Object.assign({}, state.currentNote);
          cloned.currentNoteComments = [].concat(state.currentNoteComments);
          return cloned;
        }
        handleSubmit(event) {
          this.prePostState = this.cloneState(this.state);
          var target = event.target;
          var noteId = target.querySelector('input[name="noteID"]').value;
          var select = target.querySelector(`#note-${noteId}-changeNoteStatus`);
          var textarea = document.querySelector(`#note-${noteId}-addNoteComment`);
          var noteComments = this.state.currentNoteComments;
          var commentDate = new Date(Date.now());
          var commentAction = select.value || 'commented';
          noteComments.push({
            action: commentAction,
            commentNum: noteComments.length,
            date: commentDate,
            noteId: noteId,
            user: this.props.userName,
            userURL: `${this.props.osmServer}/user/${this.props.userName}`,
            text: textarea.value
          });
          var note = this.state.currentNote;
          note.modified = commentDate;
          if (commentAction !== 'commented') {
            if (commentAction === 'closed') {
              note.status = 'closed';
            }
            else {
              note.status = 'open';
            }
          }
          this.setState({
            currentNote: note,
            currentNoteComments: noteComments
          });
          var submitEvent = new CustomEvent('submitButtonClicked', {
            detail: {
              noteId: noteId,
              target: target
            }
          });
          window.dispatchEvent(submitEvent);
          event.preventDefault();
          return false;
        }
        render() {
          var this$1 = this;

          var comments = this.state.currentNoteComments.map(function (noteComment, index) {
            return React.createElement(CommentComponent, { key: noteComment.commentNum, noteComment: noteComment });
          });
          var isClosed = this.state.currentNote.status === 'closed';
          var note = this.state.currentNote;
          return (React.createElement("section", { className: "note", id: `note-${note.id}` },
            React.createElement("div", { className: "note-info" },
              React.createElement("span", { className: "create-date" },
                "Created :",
                React.createElement("time", { dateTime: note.created.toISOString() }, convertDatetoText(note.created))),
              React.createElement("span", { className: "modified-date" },
                "Modified :",
                React.createElement("time", { dateTime: note.modified.toISOString() }, convertDatetoText(note.modified))),
              React.createElement("span", { className: "status" }, note.status),
              React.createElement("div", { className: "comment-list" }, comments),
              React.createElement("form", { id: `note-${note.id}-form`, onSubmit: function (event) { return this$1.handleSubmit(event); } },
                React.createElement("label", { htmlFor: `note-${note.id}-changeNoteStatus` }, "メモの状態の変更"),
                React.createElement("select", { id: `note-${note.id}-changeNoteStatus`, defaultValue: null, name: "action" },
                  React.createElement("option", { value: "" }, "変更しない"),
                  React.createElement("option", { value: "closed", disabled: isClosed }, "解決"),
                  React.createElement("option", { value: "reopened", disabled: isClosed === false }, "再開")),
                React.createElement("label", { htmlFor: `note-${note.id}-addNoteComment` }, "コメント"),
                React.createElement("textarea", { id: `note-${note.id}-addNoteComment`, name: "noteComment" }),
                React.createElement("button", { form: `note-${note.id}-form` }, "送信"),
                React.createElement("input", { defaultValue: note.id, type: "hidden", name: "noteID" }),
                React.createElement("input", { defaultValue: this.props.userName, type: "hidden", name: "userName" })))
          ));
        }
        ;
      }

      class NoteListComponent extends React.Component {
        constructor(props) {
          super(props);
        }
        render() {
          var this$1 = this;

          var noteList = this.props.notes.map(function (note, index) {
            return React.createElement(NoteComponent, { key: note.id, note: note, noteComments: this$1.props.noteComments[note.id], userName: this$1.props.userName, osmServer: this$1.props.osmServer });
          });
          return (React.createElement("section", { id: "note-list" }, noteList));
        }
        ;
      }

      var coordinateCalc;
      (function (coordinateCalc) {
        'use strict';
        coordinateCalc.EARTH_RADIUS = 6378.137;
        coordinateCalc.EARTH_POLAR_RADIUS = 6356.752;
        coordinateCalc.STRAIGHT_ANGLE = 180;
        function getLongitudeFromDistance(latitude, longitude, distance, isEastward) {
          if (isEastward) {
            return longitude + distance * coordinateCalc.STRAIGHT_ANGLE /
              (coordinateCalc.EARTH_RADIUS * Math.PI * Math.cos(latitude / coordinateCalc.STRAIGHT_ANGLE * Math.PI));
          }
          else {
            return longitude - distance * coordinateCalc.STRAIGHT_ANGLE /
              (coordinateCalc.EARTH_RADIUS * Math.PI * Math.cos(latitude / coordinateCalc.STRAIGHT_ANGLE * Math.PI));
          }
        }
        coordinateCalc.getLongitudeFromDistance = getLongitudeFromDistance;
        function getLatitudeFromDistance(latitude, distance, isNorthward) {
          'use strict';
          var calculatedLatitude;
          var MAX_LATITUDE_ABSOLUTE_VALUE = 90;
          if (isNorthward) {
            calculatedLatitude = latitude + distance * coordinateCalc.STRAIGHT_ANGLE / (coordinateCalc.EARTH_POLAR_RADIUS * Math.PI);
            return calculatedLatitude > MAX_LATITUDE_ABSOLUTE_VALUE ? MAX_LATITUDE_ABSOLUTE_VALUE : calculatedLatitude;
          }
          else {
            calculatedLatitude = latitude - distance * coordinateCalc.STRAIGHT_ANGLE / (coordinateCalc.EARTH_POLAR_RADIUS * Math.PI);
            return calculatedLatitude < -MAX_LATITUDE_ABSOLUTE_VALUE ? -MAX_LATITUDE_ABSOLUTE_VALUE : calculatedLatitude;
          }
        }
        coordinateCalc.getLatitudeFromDistance = getLatitudeFromDistance;
        function getCoordinateArea(coordinate, distance) {
          'use strict';
          var latitude = parseFloat(coordinate.lat);
          var longitude = parseFloat(coordinate.lon);
          var edgeCoordinate = {
            n: 0,
            e: 0,
            s: 0,
            w: 0,
          };
          var MIN_LONGITUDE = -180;
          var CARRY_LONGITUDE = 360;
          /*
            North-south θ = (d * 180) / (PI * R)
            East-west θ = (d * 180) / (PI * r')
            d = Distance from POI to north-south direction or east-west direction
            R = Eatth Polar Radius
            r' = R' * cos( Latitude of POI )
            R' = Earth Equator Radius
          */
          edgeCoordinate.n = getLatitudeFromDistance(latitude, distance, true);
          edgeCoordinate.s = getLatitudeFromDistance(latitude, distance, false);
          edgeCoordinate.w = getLongitudeFromDistance(latitude, longitude, distance, false);
          if (edgeCoordinate.w >= MIN_LONGITUDE) {
            edgeCoordinate.e = getLongitudeFromDistance(latitude, longitude, distance, true);
          }
          else {
            edgeCoordinate.w += CARRY_LONGITUDE;
            edgeCoordinate.e = getLongitudeFromDistance(latitude, longitude, distance, true) + CARRY_LONGITUDE;
          }
          return edgeCoordinate;
        }
        coordinateCalc.getCoordinateArea = getCoordinateArea;
      })(coordinateCalc || (coordinateCalc = {}));

      class MapComponent extends React.Component {
        constructor(props) {
          super(props);
        }
        render() {
          var this$1 = this;

          var leaflet = function () {
            if (this$1.props.notes) {
              var markers = this$1.props.notes.map(function (note, index) {
                var markerLatLng = note.latlng;
                return (React.createElement(reactLeaflet.Marker, { key: index + markerLatLng.lat, position: [Number(markerLatLng.lat), Number(markerLatLng.lng)] }));
              });
              var centerCoordinate = this$1.props.centerCoordinate;
              var edge = coordinateCalc.getCoordinateArea(this$1.props.centerCoordinate, 10);
              var areaBound = [[edge.s, edge.w], [edge.n, edge.e]];
              return (React.createElement("div", { id: "leaflet-wrapper" },
                React.createElement(reactLeaflet.Map, { id: "leaflet-container", center: [Number(centerCoordinate.lat), Number(centerCoordinate.lon)], bounds: areaBound, boundsOptions: { padding: [0, 0] } },
                  React.createElement(reactLeaflet.TileLayer, { attribution: '&copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors', url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" }),
                  React.createElement(reactLeaflet.Rectangle, { bounds: areaBound, color: "#ff1100" }),
                  markers)
              ));
            }
            else {
              return (React.createElement("div", { id: "leaflet-wrapper" },
                React.createElement(reactLeaflet.Map, { id: "leaflet-container" })
              ));
            }
          };
          return leaflet();
        }
      }

      class OSMLoggedInComponent extends React.Component {
        constructor(props) {
          super(props);
          this.state = {
            notes: [],
            noteComments: [],
            coordinate: { lat: null, lon: null },
            userName: '',
          };
        }
        handleGetNearbyNotesClick(event) {
          var getNearbyNotesClickEvent = new CustomEvent('getNearbyNotesClicked', {
            detail: this.props.oauth
          });
          window.dispatchEvent(getNearbyNotesClickEvent);
        }
        componentDidMount() {
          var this$1 = this;

          var reactRootWrapperElement = document.querySelector('#AppWrapper');
          reactRootWrapperElement.addEventListener('receiveCoordinate', function (event) {
            this$1.setState({
              coordinate: event.detail.homeCoordinate,
              notes: this$1.state.notes,
              noteComments: this$1.state.noteComments,
              userName: event.detail.userName,
            });
          });
          reactRootWrapperElement.addEventListener('foundNotesAndNoteComments', function (event) {
            var foundNotes = event.detail;
            this$1.setState({
              coordinate: this$1.state.coordinate,
              notes: foundNotes.notes,
              noteComments: foundNotes.noteComments,
              userName: this$1.state.userName,
            });
          });
        }
        render() {
          var this$1 = this;

          var getMapComponents = function (notes) {
            if (notes.length) {
              return React.createElement(MapComponent, { centerCoordinate: this$1.state.coordinate, notes: this$1.state.notes });
            }
            else {
              return React.createElement(MapComponent, null);
            }
          };
          var osmServer = this.props.oauth.options().url;
          return (React.createElement("section", { className: "main" },
            React.createElement("input", { type: "button", value: "地図メモの取得を試みる", onClick: function (event) { return this$1.handleGetNearbyNotesClick(event); } }),
            React.createElement("section", { id: "note-map-container" },
              React.createElement(NoteListComponent, { notes: this.state.notes, noteComments: this.state.noteComments, userName: this.state.userName, osmServer: osmServer }),
              getMapComponents(this.state.notes))));
        }
      }

      class AppComponent extends React.Component {
        constructor() {
          super();
          this.state = {
            isOAuthReady: false,
            OSMOAuth: null,
            isAuthenticated: false,
            isQuarifiedBrowser: true,
          };
        }
        componentDidMount() {
          var this$1 = this;

          var reactRootWrapperElement = document.querySelector('#AppWrapper');
          reactRootWrapperElement.addEventListener('notQualifiedBrowser', function (event) {
            this$1.setState({
              isOAuthReady: false,
              OSMOAuth: null,
              isAuthenticated: false,
              isQuarifiedBrowser: false,
            });
          });
          reactRootWrapperElement.addEventListener('oauthReady', function (event) {
            var auth = event.detail;
            this$1.setState({
              isOAuthReady: true,
              OSMOAuth: auth,
              isAuthenticated: auth.authenticated(),
              isQuarifiedBrowser: this$1.state.isQuarifiedBrowser,
            });
          });
          reactRootWrapperElement.addEventListener('oauthNotReady', function () {
            this$1.setState({
              isOAuthReady: false,
              OSMOAuth: null,
              isAuthenticated: false,
              isQuarifiedBrowser: this$1.state.isQuarifiedBrowser,
            });
          });
        }
        handleOAuthClick() {
          var buttonClickEvent = new CustomEvent('oauthButtonClicked');
          window.dispatchEvent(buttonClickEvent);
        }
        render() {
          var this$1 = this;

          var mainComponent = function (isAuthenticated) {
            if (this$1.state.isQuarifiedBrowser === false) {
              return (React.createElement("section", { className: "main" },
                React.createElement("p", null, "ご使用のブラウザは必須環境を満たしていないため、動作対象外となります。")
              ));
            }
            if (isAuthenticated) {
              return (React.createElement(OSMLoggedInComponent, { oauth: this$1.state.OSMOAuth }));
            }
            else {
              return (React.createElement("section", { className: "main" },
                React.createElement("input", { type: "button", value: "OpenStreetMap にログイン", onClick: this$1.handleOAuthClick })
              ));
            }
          };
          return (React.createElement("section", { id: "AppComponent" }, mainComponent(this.state.isAuthenticated)));
        }
      }

      ReactDOM.render(React.createElement(AppComponent, null), document.querySelector('#AppWrapper'));

    }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
  }, {}]
}, {}, [1]);
