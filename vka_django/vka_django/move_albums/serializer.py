from rest_framework import serializers


class GroupSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField(max_length=100)
    photo_100 = serializers.URLField()


class AlbumSerializer(serializers.Serializer):
    album_id = serializers.IntegerField()
    owner_id = serializers.IntegerField()
    title = serializers.CharField(max_length=150)


class SongSerializer(serializers.Serializer):
    aid = serializers.IntegerField()
    owner_id = serializers.IntegerField()
    artist = serializers.CharField(max_length=100)
    title = serializers.CharField(max_length=100)
    duration = serializers.IntegerField()
    url = serializers.URLField()
