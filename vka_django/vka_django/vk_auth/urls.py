from django.conf.urls import url

from . import views

app_name = 'vk_auth'

urlpatterns = [
    url(r'^vk_auth', views.VKAuthRedirectView.as_view(), name='auth'),
    url(r'^vk_token', views.VKGetTokenRedirectView.as_view(), name='token'),
]
