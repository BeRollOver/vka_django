from django.shortcuts import render

# Create your views here.
def main(request):
    return render(request, 'attach_songs/index.html')

def list(request):
    return render(request, 'attach_songs/partials/list.html')

def posts(request):
    return render(request, 'attach_songs/partials/posts.html')

def attachsongs(request):
    return render(request, 'attach_songs/partials/attachsongs.html')

def albums(request):
    return render(request, 'attach_songs/partials/albums.html')

def songs(request):
    return render(request, 'attach_songs/partials/songs.html')

def audio(request):
    return render(request, 'attach_songs/partials/audio.html')
