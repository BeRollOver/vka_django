from rest_framework import serializers


class VKUserSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    access_token = serializers.CharField(max_length=85)
    expires_in = serializers.IntegerField()