var app = angular.module('attachSongsApp', [
        'attachSongsApp.services',
        'attachSongsApp.controllers',
        'ui.grid',
        'ui.grid.selection',
        'ui.router',
        'ui.bootstrap',
        'ngAnimate',
]);

app.config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/')
    $stateProvider
    .state('groups', {
        url: '/',
        templateUrl: 'list',
        resolve: {
            getGroupsService: 'getGroupsService',
            getGroups: function (getGroupsService) {
                return getGroupsService.getData('editor')
                    .then(function (value) {
                        return value;
                    });
            }
        },
        controller: 'GroupListController as ctrl'
    })
    .state('posts', {
        url: '/{group_id:[0-9]+}',
        templateUrl: 'posts',
        controller: 'PostListController as plCtrl',

        data: {
            posts: [],
        },

        resolve: {
            getPostsService: 'getPostsService',
            getPosts: function ($stateParams, getPostsService) {
                return getPostsService.getData($stateParams.group_id)
                    .then(function (value) {
                        return value;
                    });
            }
        }
    })
    .state('attachSongs', {
        url: '/{post_id:[0-9]+}',
        parent: 'posts',

        data: {
            post: {},
            attachments: [],
        },

        onEnter: function ($stateParams, $state, $uibModal) {
            $uibModal.open({
                controller: 'AttachSongsController as atsCtrl',
                templateUrl: 'attachsongs',
                size: 'lg',
                backdrop: false,

                resolve: {
                    getGroupsService: 'getGroupsService',
                    getGroups: function (getGroupsService) {
                        return getGroupsService.getData('')
                            .then(function (value) {
                                return value;
                            });
                    }
                },
            });
        }
    })
    .state('albums', {
        url: '/{audio_group_id:[0-9]+}',
        parent: 'attachSongs',

        resolve: {
            getAlbumsService: 'getAlbumsService',
            getAlbums: function ($stateParams, getAlbumsService) {
                return getAlbumsService.getData($stateParams.audio_group_id)
                    .then(function (value) {
                        return value;
                    });
            }
        },

        views: {
            'albums@': {
                templateUrl: 'albums',
                controller: 'GroupAlbumsController as gaCtrl',
            }
        }
    })
    .state('songs', {
        url: '/{audio_album_id:[0-9]+}',
        parent: 'albums',

        resolve: {
            getSongsService: 'getSongsService',
            getSongs: function ($stateParams, getSongsService) {
                return getSongsService.getData($stateParams.audio_group_id, $stateParams.audio_album_id)
                    .then(function (value) {
                        return value;
                    });
            }
        },

        views: {
            'songs@': {
                templateUrl: 'songs',
                controller: 'AlbumSongsController as asCtrl'
            }
        }
    })
    .state('audio', {
        url: '/{audio_url}',
        parent: 'songs',
        views: {
            'audio@': {
                templateUrl: 'audio',
                controller: 'SongAudioController as saCtrl'
            }
        }
    });
});

app.filter('unsafe', function ($sce) {
    return $sce.trustAsResourceUrl;
});

app.filter('songFilter', function () {
    return function (attachments) {
        return attachments.filter(attachment => attachment.type === 'audio' ? true : false);
    };
});