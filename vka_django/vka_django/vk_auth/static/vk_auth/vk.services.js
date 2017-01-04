var app = angular.module('vkApp.services', []);

var API_VERS = "5.60";

app.factory('getGroupsService', function ($q) {
	return {
		getData: function (filter) {
			var deferred = $q.defer();
			VK.Auth.getLoginStatus(function (response) {
				VK.Api.call('groups.get', { user_id: parseInt(response.session.mid), extended: 1, filter: filter, v: API_VERS }, function (r) {
					if (r.response) {
						deferred.resolve(r.response.items);
					}
				});
			});
			return deferred.promise;
		}
	};
});

app.factory('getPostsService', function ($q) {
	return {
		getData: function (group_id) {
			var deferred = $q.defer();
			VK.Auth.getLoginStatus(function (response) {
				VK.Api.call('wall.get', { owner_id: -group_id, filter: 'postponed', v: API_VERS }, function (r) {
					if (r.response) {
						deferred.resolve(r.response.items);
					}
				});
			});
			return deferred.promise;
		}
	};
});

app.factory('getPostService', function ($q) {
	return {
		getData: function (group_id, post_id) {
			var deferred = $q.defer();
			VK.Auth.getLoginStatus(function (response) {
				VK.Api.call('wall.getById', { owner_id: "-" + group_id + "_" + post_id, filter: 'postponed', v: API_VERS }, function (r) {
					if (r.response) {
						deferred.resolve(r.response);
					}
				});
			});
			return deferred.promise;
		}
	};
});

app.factory('getAlbumsService', function ($q) {
	return {
		getData: function (audio_group_id) {
			var deferred = $q.defer();

			// Рекурентный процесс - делает запрос за 100 альбомами со смещением offset, 
			// сохраняет в аккумуляторе result и прибавляет к offset 100 и проверяет,
			// больше или равно общее количество альбомов и offset:
			// если offset больше или равно, значит все альбомы получены,
			// иначе - необходим вызов с новым смещением и обновленным акумулятором
			var call = function (offset, result) {
				VK.Api.call('audio.getAlbums', { owner_id: "-" + audio_group_id, count: 100, offset: offset, v: API_VERS }, function (r) {
					if (r.response) {
						result = result.concat(r.response.items);
						offset += 100;
					}
					if (offset >= r.response.count) {
						deferred.resolve(result);
					}
					else {
						call(offset, result);
					}
				});
			};

			VK.Auth.getLoginStatus(function (response) {
				call(0, []);
			});

			return deferred.promise;
		}
	};
});

app.factory('getSongsService', function ($q) {
	return {
		getData: function (audio_group_id, audio_album_id) {
			var deferred = $q.defer();
			VK.Auth.getLoginStatus(function (response) {
				VK.Api.call('audio.get', { owner_id: -audio_group_id, album_id: audio_album_id, v: API_VERS }, function (r) {
					if (r.response) {
						deferred.resolve(r.response.items);
					}
				});
			});
			return deferred.promise;
		}
	};
});

app.factory('editPostService', function ($q) {
	return {
		getData: function (post, attachments) {
			var deferred = $q.defer();
			VK.Auth.getLoginStatus(function (response) {
				var atts = attachments.map(attachment => attachment.type !== 'link'?
                    attachment.type + attachment[attachment.type].owner_id + "_" + attachment[attachment.type].id:
                    attachment[attachment.type].url);
				var str_atts = atts.join(",");

				VK.Api.call('wall.edit', {
					owner_id: post.owner_id,
					post_id: post.post_id,
					publish_date: post.date,
					message: post.message,
					attachments: str_atts,
					v: API_VERS
				}, function (r) {
					if (r.response) {
						deferred.resolve(r.response.items);
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

app.factory('AttachSongsService', function ($http) {
    return {
        getData: function (token) {
            return null;
        }
    }
});