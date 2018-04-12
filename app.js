var app = angular.module('GpsLocationSystem', ['ngStorage']);
app.config(function ($httpProvider) {
});


//64bit encoder.
app.factory('Base64', function () {
    var keyStr = 'ABCDEFGHIJKLMNOP' +
        'QRSTUVWXYZabcdef' +
        'ghijklmnopqrstuv' +
        'wxyz0123456789+/' +
        '=';
    return {
        encode: function (input) {
            var output = "";
            var chr1, chr2, chr3 = "";
            var enc1, enc2, enc3, enc4 = "";
            var i = 0;

            do {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);

                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;

                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }

                output = output +
                    keyStr.charAt(enc1) +
                    keyStr.charAt(enc2) +
                    keyStr.charAt(enc3) +
                    keyStr.charAt(enc4);
                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";
            } while (i < input.length);

            return output;
        },

        decode: function (input) {
            var output = "";
            var chr1, chr2, chr3 = "";
            var enc1, enc2, enc3, enc4 = "";
            var i = 0;

            // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
            var base64test = /[^A-Za-z0-9\+\/\=]/g;
            if (base64test.exec(input)) {
                alert("There were invalid base64 characters in the input text.\n" +
                    "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
                    "Expect errors in decoding.");
            }
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

            do {
                enc1 = keyStr.indexOf(input.charAt(i++));
                enc2 = keyStr.indexOf(input.charAt(i++));
                enc3 = keyStr.indexOf(input.charAt(i++));
                enc4 = keyStr.indexOf(input.charAt(i++));

                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;

                output = output + String.fromCharCode(chr1);

                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }

                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";

            } while (i < input.length);

            return output;
        }
    };
});

app.controller('AuthenticationCtrl', function ($scope, $http, Base64, $window, $sessionStorage) {

    var authenticationURL = 'http://localhost:8080/GpsLocationSystem/authentication';

    $scope.signIn = function (username, password) {

        $http.defaults.headers.common['Authorization'] = 'Basic ' + Base64.encode(username + ':' + password);

        $http({method: 'GET', url: authenticationURL}).success(function (data, status, headers, config) {
            $window.sessionStorage.setItem("USERNAME", username);
            $window.location.href = 'map.html';
        }).error(function (data, status, headers, config) {
            alert("Invalid username or password.")
        });
    }
});


app.controller('MapCtrl', function ($scope, $http, $window, $sessionStorage) {


    $scope.username = '';
    $scope.username = $window.sessionStorage.getItem("USERNAME")


    var getCoordinatesURL = 'http://localhost:8080/GpsLocationSystem/getCoordinatesFromSession/' + $scope.username + '/';
    var getSessionsList = 'http://localhost:8080/GpsLocationSystem/getSessionList/' + $scope.username + '/';
    var flightPath;

    $http.get(getSessionsList).then(function (sessionsList) {
        $scope.sessionsList = sessionsList.data;
    });

    //Initial position.
    $scope.map = new google.maps.Map(document.getElementById('map_div'), {
        zoom: 10,
        center: new google.maps.LatLng(52, 20),
        mapTypeId: google.maps.MapTypeId.TERRAIN
    });

    //Draw map.
    $scope.drawMapClick = function (idSession) {


        if (flightPath != null) {
            flightPath.setMap(null);
        }

        $http.get(getCoordinatesURL + idSession)
            .success(function (data) {
                data.forEach(function (coordinates) {

                    $scope.map = new google.maps.Map(document.getElementById('map_div'), {
                        zoom: 16,
                        center: new google.maps.LatLng(coordinates[0].lat, coordinates[0].lng),
                        mapTypeId: google.maps.MapTypeId.TERRAIN
                    });

                    //Draw track.
                    flightPath = new google.maps.Polyline({
                        path: coordinates,
                        geodesic: false,
                        strokeColor: '#FF0000',
                        strokeOpacity: 1.0,
                        strokeWeight: 5
                    });

                    flightPath.setMap($scope.map);


                    //Draw start marker.
                    var startMarker = new google.maps.Marker({
                        position: new google.maps.LatLng(coordinates[0].lat, coordinates[0].lng),
                        map: $scope.map,
                        icon: 'http://maps.google.co.uk/intl/en_ALL/mapfiles/ms/micons/green-dot.png'
                    });

                    //Draw end marker.
                    var endMarker = new google.maps.Marker({
                        position: new google.maps.LatLng(coordinates[coordinates.length - 1].lat, coordinates[coordinates.length - 1].lng),
                        map: $scope.map,
                        icon: 'http://maps.google.co.uk/intl/en_ALL/mapfiles/ms/micons/red-dot.png'
                    });
                });
            });
    }

    $scope.logout = function () {
        $window.sessionStorage.clear();
        $window.location.href = 'login.html';
    }
});

