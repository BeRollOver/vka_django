from django.shortcuts import render
from django.http import HttpResponseRedirect, HttpResponse, Http404
from django.core.urlresolvers import reverse

from rest_framework.renderers import JSONRenderer
from rest_framework.parsers import JSONParser

from vka_django import settings
from vk_auth.views import vkauth
from . import serializer

from urllib.request import urlopen
from urllib.parse import urlencode, quote

import logging
logger = logging.getLogger('move_albums.views')

@vkauth
def main(request):
    """
    Выводит список групп пользователя, 
    в которых он является админом или редактором
    """
    # Запрашиваем список групп в сессии
    try:
        groups = request.session['groups']
    except KeyError:
        # Если ключа нет, создаём его:
        # Запрашиваем json групп в ВК
        resp = urlopen('https://api.vk.com/method/groups.get?user_id={USER_ID}&'
                       'extended=1&'
                       'filter=editor&'
                       'access_token={ACCESS_TOKEN}&v={V}'.format(
                           **{'USER_ID': request.session['user_id'], 'ACCESS_TOKEN': request.session['access_token'],
                              'V': settings.VK_API_VERS}
                       ))

        # Сериализуем json в список групп
        data = JSONParser().parse(resp)
        serialize = serializer.GroupSerializer(data=data['response']['items'], many=True)
        
        # Десериализуем список групп в json и сохраняем в session
        if(serialize.is_valid()):
            groups = serialize.validated_data
            serialize = serializer.GroupSerializer(groups, many=True).data
            request.session['groups'] = serialize
            # Редирект на эту же страницу: теперь session содержит ключ groups
            return HttpResponseRedirect(reverse('move_albums:main'))
        
        raise Http404(serialize.errors)

    # Сериализуем json из session в список групп
    grouplist = serializer.GroupSerializer(data=groups, many=True)
    if grouplist.is_valid():
        # Передаём список групп в шаблон
        return render(request, 'move_albums/index.html', {'grouplist': grouplist.validated_data})
    
    raise Http404(grouplist.errors)

@vkauth
def albums(request, group_id):
    """
    Выводит список альбомов выбранной группы
    """
    offset = 0
    albums = []
    
    # Запрашиваем json альбомов в ВК по 100 за один запрос
    while True:
        resp = urlopen('https://api.vk.com/method/audio.getAlbums?'
                        'owner_id=-{0}&offset={1}&count=100&access_token={2}'.format(
                            group_id, offset, request.session['access_token'],
                        ))
        data = JSONParser().parse(resp)
        serialize = serializer.AlbumSerializer(data=data['response'][1:], many=True)
        # Десериализуем список групп
        if(serialize.is_valid()):
            albums.extend(serialize.validated_data)
        else:
            raise Http404(serialize.errors)

        offset += 100
        if(offset >= data['response'][0]):
            break
        
    return render(request, 'move_albums/albums.html', {
        'albumlist': albums,
        'group_id': group_id })

@vkauth
def move_to(request, group_id, album_id):
    groups = request.session['groups']
    grouplist = serializer.GroupSerializer(data=groups, many=True)
    if grouplist.is_valid():
        # Передаём список групп в шаблон
        return render(request, 'move_albums/move_to.html', {
            'grouplist': grouplist.validated_data,
            'group_id': group_id,
            'album_id': album_id,
            'title': request.GET['title']
            })
    
    raise Http404(grouplist.errors)

@vkauth
def move(request, group_id, album_id, move_to_id):

    # Если группа отправления и назначения совпадают - удаляем альбом
    if(group_id == move_to_id):
        deleteAlbum(request, group_id, album_id)

    # Получаем список песен в альбоме и десериализуем его
    resp = urlopen('https://api.vk.com/method/audio.get?' \
        'owner_id=-{0}&album_id={1}&access_token={2}'.format(
            group_id, album_id, 
            request.session['access_token']))

    data = JSONParser().parse(resp)
    serialize = serializer.SongSerializer(data=data['response'][1:], many=True)
    
    if(serialize.is_valid()):
        songs = serialize.validated_data
    else:
        raise Http404(serialize.errors)

    # Если количество треков не совпадает с переданным значением count,
    # значит не все треки были получены
    if(len(songs) != data['response'][0]):
        raise Http404('Album not completed')

    # Обращаем порядок треков, чтобы в при добавлении в новый альбом 
    # они располагались в начальном порядке
    song_ids = [str(item['aid']) for item in songs][::-1]
    
    # Создаём альбом в группе с таким же названием и сохраняем его id
    resp = urlopen('https://api.vk.com/method/audio.addAlbum?' \
        'group_id={0}&title={1}&access_token={2}'.format(
            move_to_id, quote(request.GET['title']), 
            request.session['access_token']))
    if(resp.getcode() == 302):
        raise Http404("Can't move this album")

    import json
    json_resp = resp.read().decode('utf-8')
    move_to_album_id = json.loads(json_resp)['response']['album_id']
    
    from vk_auth.responses import moveSongs
    moveSongs(song_ids, group_id, move_to_id, move_to_album_id)

    return HttpResponseRedirect(reverse('move_albums:main'))

@vkauth
def deleteAlbum(request, group_id, album_id):
    return HttpResponseRedirect(reverse('move_albums:main'))

def post(request):

    resp = urlopen('')

    return HttpResponse(resp.read().decode('utf-8'))
