(function () {
	'use strict';

	var app = angular.module('moveSongsApp.services', [])

	app.factory('getGroupsService', function ($q) {
	    return {
	        getData: function () {
	            var deferred = $q.defer();
	            VK.Auth.getLoginStatus(function (response) {
	                VK.Api.call('groups.get', { user_id: parseInt(response.session.mid), extended: 1, filter: 'editor' }, function (r) {
	                    if (r.response) {
	                        deferred.resolve(r.response.slice(1));
	                    }
	                });
	            });
	            return deferred.promise;
	        }
	    };
	});

	app.factory('moveSongsService', function ($q) {
	    return {
	        getData: function (from, to, album_title, songs) {
	            var deferred = $q.defer();

                // Группа источника и приёмника не должны совпадать
	            if (from === to) {
	                console.log("from is equal to");
	                deferred.resolve();
	            }

                // Создаём альбом в группе приёмника
	            VK.Api.call('audio.addAlbum', { group_id: to, title: album_title }, function (r) {
	                if (r.response) {
	                    var album_id = r.response.album_id;
	                    // Описываем процедуру передачи по COUNT песен за один запрос и выполняем процедуру со смещением в offset
	                    var offset = 0;
	                    var COUNT = 5;
	                    function moveSongs() {
	                        var execute = 'var ls = ['
                                .concat(songs.slice(offset, offset + COUNT).join(","))
                                .concat('];var owner_id = -')
                                .concat(from)
                                .concat(';var move_to_album_id = ')
                                .concat(album_id)
                                .concat(';var move_to_group_id = ')
                                .concat(to)
                                .concat(';var i = 0;while (i < ls.length) {' +
                                        'API.audio.add({"album_id": move_to_album_id,' +
                                        '"group_id": move_to_group_id,' +
                                        '"owner_id": owner_id ,"audio_id": ls[i]});' +
                                        'i = i + 1;}return i;');

	                        VK.Api.call('execute', { code: execute }, function (r) {
	                            if (r.response) {
	                                console.log(r.response.toString() + ' / ' + offset.toString());
	                            }
	                            else {
	                                clearInterval(timerId);
	                                console.log("Done");
	                                deferred.resolve();
	                            }
	                        });

	                        offset += COUNT;
	                        if (!(songs.slice(offset, offset + COUNT))) {
	                            clearInterval(timerId);
	                        }
	                    }

	                    // Вызываем процедуру передачи песен через интервал времени
	                    var timerId = setInterval(moveSongs, 20000);
	                }
	                else {
	                    console.log("Can't create album");
	                    deferred.resolve();
	                }
	            });

	            return deferred.promise;
	        }
	    };
	});
})();