(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-12732179-5', 'auto');
ga('send', 'pageview');

(
  function() {
    'use strict';
    var target = document.querySelector('#note-list');
    var noteLoadedEvent = new Event('notesLoaded');
    var observer = new MutationObserver(
      function(mutations) {
        mutations.forEach(
          function(mutation) {
            var addedNodes = mutation.addedNodes;
            var addedNodesArray = Array.prototype.slice.call(addedNodes);
            var addedElements = addedNodesArray.filter(
              function (node) {
                return node.nodeType === 1;
              }
            );
            addedElements.forEach(
              function(element) {
                var noteForm = document.querySelector(`#${element.id}-form`);
                noteForm.addEventListener(
                  'submit',
                  function (event) {
                    var noteId = this.id.split('-')[1];
                    var comments = document.querySelectorAll(`#note-${noteId} > div > .comment-list > article`);
                    var values = [];
                    for(var i = 0, cnt = this.length; i < cnt; ++i) {
                      values[i] = this[i].value;
                    }
                    var action = values[0] || 'commented';
                    ga('send', 'event', 'OSMNote', action, noteId, comments.length);
                    console.log([action, noteId, comments.length])
                  },
                  false
                );
              }
            );
          }
        );
      }
    );
    
    observer.observe(target, {childList: true});
  }
)();