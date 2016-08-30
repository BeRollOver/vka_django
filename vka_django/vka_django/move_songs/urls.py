from django.conf.urls import url, include

from . import views

app_name = 'move_songs'

urlpatterns = [
    url(r'^$', views.main, name='main'),
]