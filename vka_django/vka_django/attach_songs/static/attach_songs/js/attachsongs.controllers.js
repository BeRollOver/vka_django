var app = angular.module('attachSongsApp.controllers', ['vkApp.services']);

app.controller('GroupListController', function ($state, getGroups) {
    this.grid = {
        data: getGroups,
        enableSorting: true,
        enableFiltering: true,
        rowHeight: 50,
        columnDefs: [
            { field: 'photo_50', enableSorting: false, enableFiltering: false, cellTemplate: '<div><img ng-src="{{grid.getCellValue(row, col)}}" /><div>', width: 50 },
            { field: 'name', cellTooltip: 'grid.getCellValue(row, col)', cellTemplate: '<div class="ui-grid-cell-contents"><a ui-sref="posts({group_id : grid.getCellValue(row, grid.getColumn(\'id\'))})">{{grid.getCellValue(row, col)}}</a></div>' },
            { field: 'id', width: 100, visible: false },
        ],
    };
});

app.controller('PostListController', function ($state, getPosts) {
    // Сохраняем список постов
    $state.current.data.posts = getPosts;

    this.grid = {
        data: $state.current.data.posts,
        enableSorting: true,
        enableFiltering: true,
        rowHeight: 50,
        columnDefs: [
            { field: 'date', enableFiltering: false, width: 200, cellTemplate: '<div class="ui-grid-cell-contents"><a ui-sref="attachSongs({post_id : grid.getCellValue(row, grid.getColumn(\'id\'))})">{{grid.getCellValue(row, col)*1000 | date:\'dd MMM yyyy, HH:mm\'}}</a></div>' },
            { field: 'text', cellTemplate: '<div class="ui-grid-cell-contents">{{grid.getCellValue(row, col)}}</div>' },
            { field: 'id', width: 100 },
        ],
    };
});

app.controller('AttachSongsController', function ($scope, $state, $stateParams, $http, getGroups, $uibModalInstance) {
    var post = $state.current.data.posts.find(post => post.id == $stateParams.post_id ? true : false);
    $state.current.data.post = { post_id: post.id, owner_id: post.owner_id, date: post.date, message: post.text };
    $state.current.data.attachments = post.attachments || [];
    $scope.attachments = $state.current.data.attachments;

    // Удаляет песни из списка прикреплений
    $scope.removeSongs = function (song) {
        var i = $state.current.data.attachments.indexOf(song);
        if (i !== -1 && $state.current.data.attachments[i].type === 'audio')
            $state.current.data.attachments.splice(i, 1);
    };

    $scope.attachSongs = function (url, aids) {
        // Получаем токен из переданного url
        var token = url.split("=")[1].split("&")[0]
        if (!token) {
            alert("Invalid token!");
            return null;
        }

        // Формируем текстовое представление массива выбранных прикреплений
        // Особый случай - прикрепление-ссылка, её необходимо разместить в самом конце
        var link = "";
        var str_atts = $scope.attachments.map(attachment => {
            if (attachment.type !== 'link') {
                return attachment.type + attachment[attachment.type].owner_id + "_" + attachment[attachment.type].id;
            }
            else {
                link = attachment[attachment.type].url;
                return "";
            }
        }).join(",");

        // Прикрепляем аудио по переданным ids
        if (aids) {
            if (str_atts) {
                str_atts += ",";
            }
            str_atts += aids.split(",").map(x => "audio" + x).join(",");
        }

        // Прикрепляем ссылку если есть
        if (link) {
            str_atts += "," + link;
        }

        $http.jsonp(`https://api.vk.com/method/wall.edit?` +
            `owner_id=${$state.current.data.post.owner_id}&` +
            `post_id=${$state.current.data.post.post_id}&` +
            `message=${encodeURIComponent($state.current.data.post.message)}&` +
            `attachments=${str_atts}&` +
            `publish_date=${$state.current.data.post.date}&` +
            `access_token=${token}&v=5.53&callback=JSON_CALLBACK`).
              success(function (data, status, headers, config) {
                  // this callback will be called asynchronously
                  // when the response is available
                  if (data.error) alert(data.error.error_code + ": " + data.error.error_msg);
                  else alert("Success");
              }).
              error(function (data, status, headers, config) {
                  // called asynchronously if an error occurs
                  // or server returns response with an error status.
                  alert("Fail");
              });
    };

    this.grid = {
        data: getGroups,
        enableSorting: true,
        enableFiltering: true,
        rowHeight: 50,

        columnDefs: [
            { field: 'photo_50', enableSorting: false, enableFiltering: false, cellTemplate: '<a ui-sref="albums({audio_group_id: grid.getCellValue(row, grid.getColumn(\'id\'))})"><img ng-src="{{grid.getCellValue(row, col)}}" title="{{grid.getCellValue(row, grid.getColumn(\'name\'))}}"/></a>', width: 50 },
            { field: 'name' },
            { field: 'id', visible: false },
        ],
    };

    this.back = function () {
        $uibModalInstance.close();
        $state.go('posts', { group_id: $stateParams.group_id });
    };
});

app.controller('GroupAlbumsController', function ($state, getAlbums) {
    this.grid = {
        data: getAlbums,
        enableSorting: true,
        enableFiltering: true,
        columnDefs: [
            { field: 'title', cellTemplate: '<div class="ui-grid-cell-contents"><a ui-sref="songs({audio_album_id: grid.getCellValue(row, grid.getColumn(\'id\'))})">{{grid.getCellValue(row, col)}}</a></div>' },
            { field: 'id', visible: false },
        ],
    };
});

app.controller('AlbumSongsController', function ($scope, $state, $stateParams, getSongs) {
    // Добавляет песни с список прикреплений
    $scope.addSong = function (song) {
        var audios = $state.current.data.attachments.filter(attachment => attachment.type === 'audio' ? true : false);
        var ids = audios.map(audio => audio.audio.id);
        if (!ids.includes(song.audio.id) && $state.current.data.attachments.length < 10)
            $state.current.data.attachments.push(song);
    };

    this.grid = {
        data: getSongs,
        multiSelect: true,
        onRegisterApi: function (gridApi) {
            // Добавляем выбранные песни в список прикреплений
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                
                if (row.isSelected) {
                    $scope.addSong({ type: 'audio', audio: row.entity });
                }
            });
            gridApi.selection.on.rowSelectionChangedBatch($scope, function (rows) {
                rows.forEach(row => row.isSelected ? $scope.addSong({ type: 'audio', audio: row.entity }) : undefined);
            });
        },

        enableSorting: true,
        enableFiltering: true,
        columnDefs: [
            { field: 'artist', width: 150 },
            { field: 'title' },
            { field: 'id', visible: false },
            { field: 'owner_id', visible: false },
            { field: 'duration', width: 60, enableFiltering: false, cellTemplate: '<div class="ui-grid-cell-contents">{{grid.getCellValue(row, col) * 1000  | date:\'mm:ss\'}}</div>' },
            { field: 'url', width: 60, enableSorting: false, enableFiltering: false, cellTemplate: '<div class="ui-grid-cell-contents"><a ui-sref="audio({audio_url: grid.getCellValue(row, col)})">Play</a></div>' }
        ],
    };
});

app.controller('SongAudioController', function ($stateParams) {
    this.audio_url = $stateParams.audio_url;
});