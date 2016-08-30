from django.conf.urls import url, include

from . import views

app_name = 'attach_songs'

urlpatterns = [
    url(r'^$', views.main, name='main'),
    url(r'^list/$', views.list, name='list'),
    url(r'^posts/$', views.posts, name='posts'),
    url(r'^attachsongs/$', views.attachsongs, name='attachsongs'),
    url(r'^albums/$', views.albums, name='albums'),
    url(r'^songs/$', views.songs, name='songs'),
    url(r'^audio/$', views.audio, name='audio'),
    
]