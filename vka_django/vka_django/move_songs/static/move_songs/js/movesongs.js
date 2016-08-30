(function () {
    var app = angular.module('moveSongsApp', ['moveSongsApp.services']);

    app.controller('GroupListController', function (getGroupsService) {
        gl = this;
        var promiseObj = getGroupsService.getData();
        promiseObj.then(function (value) {
            gl.groups = value;
        });
    });

    app.controller('MoveSongsController', function (moveSongsService) {
        this.data = {};
        this.isEnable = true;
        ms = this;
        this.moveSongs = function () {
            this.isEnable = false;
            var ls = ms.data.songs.split("\n");
            function get_id(value, index, array) {
                return value.split('_')[1];
            };
            var ids = ls.map(get_id);

            var promiseObj = moveSongsService.getData(ms.data.from, ms.data.to, ms.data.album_title, ids.reverse());
            promiseObj.then(function (value) {
                ms.isEnable = true;
            });
        };
    });
})();

