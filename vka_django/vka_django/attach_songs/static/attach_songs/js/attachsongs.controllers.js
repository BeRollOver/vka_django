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

app.controller('AttachSongsController', function ($state, $stateParams, getGroups, $uibModalInstance) {
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

app.controller('AlbumSongsController', function ($scope, $http, $state, $stateParams, getSongs) {
    var post = $state.current.data.posts.find(post => post.id == $stateParams.post_id ? true : false);
    $scope.post = { post_id: post.id, owner_id: post.owner_id, date: post.date, message: post.text };
    $scope.attachments = post.attachments || [];

    // Удаляет песни из списка прикреплений
    $scope.removeSongs = function (song) {
        var i = $scope.attachments.indexOf(song);
        if (i !== -1 && $scope.attachments[i].type === 'audio')
            $scope.attachments.splice(i, 1);
    };

    // Добавляет песни с список прикреплений
    $scope.addSong = function (song) {
        var audios = $scope.attachments.filter(attachment => attachment.type === 'audio' ? true : false);
        var ids = audios.map(audio => audio.audio.id);
        if (!ids.includes(song.audio.id) && $scope.attachments.length < 10)
            $scope.attachments.push(song);
    };

    $scope.attachSongs = function (url, aids) {
        var token = url.split("=")[1].split("&")[0]
        if (!token) {
            alert("Invalid token!");
            return null;
        }
        var atts = $scope.attachments.map(attachment => attachment.type !== 'link' ?
            attachment.type + attachment[attachment.type].owner_id + "_" + attachment[attachment.type].id :
            attachment[attachment.type].url);
        var str_atts = atts.join(",");
        if (aids) {
            var arr_aids = aids.split(",");
            str_atts += arr_aids.map(x => ",audio" + x);
        }

        $http.jsonp(`https://api.vk.com/method/wall.edit?` +
            `owner_id=${$scope.post.owner_id}&` +
            `post_id=${$scope.post.post_id}&` +
            `message=${encodeURIComponent($scope.post.message)}&` +
            `attachments=${str_atts}&` +
            `publish_date=${$scope.post.date}&` +
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