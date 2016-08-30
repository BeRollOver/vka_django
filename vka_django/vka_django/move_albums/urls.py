from django.conf.urls import url, include

from . import views

app_name = 'move_albums'

urlpatterns = [
    url(r'^$', views.main, name='main'),
    url(r'from(?P<group_id>[0-9]+)/$', views.albums, name='albums'),
    url(r'from(?P<group_id>[0-9]+)/album(?P<album_id>[0-9]+)/$', views.move_to, name='move_to'),
    url(r'from(?P<group_id>[0-9]+)/album(?P<album_id>[0-9]+)/to(?P<move_to_id>[0-9]+)', views.move, name='move'),
    url(r'post', views.post, name='post'),
]