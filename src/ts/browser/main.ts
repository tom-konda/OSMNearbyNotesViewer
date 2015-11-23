require('osm-auth');
require('./coordinate-calc');

(function(){
    'use strict';
    document.addEventListener('DOMContentLoaded', function(event) {
        let auth = osmAuth({
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
                    // details is an XML DOM of user details
                    if(err === null){
                        resolve(details);
                        return ;
                    }
                    reject(err);
                });
            });
        };
        
        let button = document.getElementById('get-japan-notes');
        button.addEventListener(
            'click',
            function(){
                if (auth.authenticated()) {
                    getUserHomeLocation().then(
                        getNotes,
                        function(error){console.log(error)}
                    ).then(
                        function(success){console.log(success)},
                        function(error){console.log(error)}
                    );
                }
                else {
                    getUserHomeLocation().then(
                        getNotes,
                        function(error){console.log(error)}
                    ).then(
                        function(success){console.log(success)},
                        function(error){console.log(error)}
                    );
                }
            }
        );
    });
})();