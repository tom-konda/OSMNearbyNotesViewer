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
      function() {
        document.body.dispatchEvent(noteLoadedEvent);
      }
    );
    
    observer.observe(target, {childList: true});
    
    document.body.addEventListener(
      'notesLoaded',
      function() {
        observer.disconnect();
        document.body.removeEventListener('notesLoaded');
        observer = null;
        
        var notes = document.querySelectorAll('#note-list > .note');
        var noteNum = notes.length;
        var notesArray = Array.prototype.slice.call(notes);
        var notesObservers = [];
        notesArray.forEach(
          function(note, index) {
            noteObservers[index] = new MutationObserver(
              /**
               * ga exec
               */
            );
            
            notesObservers[index].observe(note, {childList: true});
          }
        );
      }
    );
  }
)();