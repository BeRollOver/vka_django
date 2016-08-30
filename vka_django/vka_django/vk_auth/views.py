from django.shortcuts import render
from django.views.generic.base import RedirectView
from django.http import HttpResponseRedirect, HttpResponse, Http404
from django.core.urlresolvers import reverse

from urllib.parse import urlencode
import datetime

from vka_django import settings
from . import serializer

import logging
logger = logging.getLogger('vk_auth.views')

def vkauth(func):
    """
    Проверяет, авторизован ли пользователь в ВК.
    Если нет - вызывает метод авторизации и перенаправляет на главную.
    """
    def inner(*args, **kwargs):
        access_token = args[0].session.get('access_token')
        user_id = args[0].session.get('user_id')
        if(access_token and user_id):
            return func(*args, **kwargs)
        else:
            return HttpResponseRedirect(reverse('vk_auth:auth'))
        
    return inner

class VKAuthRedirectView(RedirectView):
    """Получает код для получения токена"""
    url = 'https://oauth.vk.com/authorize?'

    def get_redirect_url(self, *args, **kwargs):
        url_fields = {
            'client_id': settings.VK_APP_ID,
            'redirect_uri': settings.SITE_URL + reverse('vk_auth:token'),
            'display': 'popup',
            'scope': 'audio,groups',
            'response_type': 'code',
            'v': settings.VK_API_VERS
        }
        url_data = urlencode(url_fields)
        return self.url + url_data


class VKGetTokenRedirectView(RedirectView):
    """Получает токен и сохраняет в сессии"""
    url = 'https://oauth.vk.com/access_token?'

    def get_redirect_url(self, *args, **kwargs):
        """Создаёт запрос для получения токена"""
        url_fields = {
            'client_id': settings.VK_APP_ID,
            'redirect_uri': settings.SITE_URL + reverse('vk_auth:token'),
            'client_secret': settings.VK_APP_SECRET,
            'code': kwargs['code'],
        }
        url_data = urlencode(url_fields)
        return self.url + url_data

    def get(self, request, *args, **kwargs):
        """Запрашивает токен и сохраняет его в сессии"""
        # Получаем код
        code = request.GET.get('code', 0)
        if(code == 0):
            raise Http404("Can't log in VK")

        # Запрашиваем токен
        from urllib.request import urlopen
        resp = urlopen(self.get_redirect_url(**{'code':code}))
        if(resp.getcode() != 200):
            logger.error(str("{0}: {1} {2}".format(datetime.datetime.now()), resp.getcode(), resp.read()))
            raise Http404("Can't log in VK")

        # Десериализуем полученный json
        from rest_framework.parsers import JSONParser
        data = JSONParser().parse(resp)
        s = serializer.VKUserSerializer(data=data)

        # Сохраняем токен в сессии и перенаправляем на главную
        if s.is_valid():
            response = HttpResponseRedirect(reverse('home'))
            request.session.set_expiry(s.data['expires_in'])
            request.session['access_token'] = s.data['access_token']
            request.session['user_id'] = s.data['user_id']
            return response
        else:
            return HttpResponse(s.errors, status=400)
