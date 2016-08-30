from urllib.request import urlopen
import time

def moveSongs(song_ids, from_group, to_group, album_id):
    "Добавить песни одной группы в другую группу"
    offset = 0
    COUNT = 5

    # В цикле передаём процедуру для добавления COUNT треков за один запрос
    while(song_ids[offset:offset + COUNT]):
        execute = 'var ls = [{0}];var owner_id = -{1};' \
                  'var move_to_album_id = {2};' \
                  'var move_to_group_id = {3};' \
                  .format(",".join(song_ids[offset:offset + COUNT]), 
                          from_group, album_id, to_group)

        execute += 'var i = 0;while (i < ls.length) {'\
                    'API.audio.add({"album_id": move_to_album_id,'\
                    '"group_id": move_to_group_id,'\
                    '"owner_id": owner_id ,"audio_id": ls[i]});'\
                    'i = i + 1;}return i;'

        resp = urlopen('https://api.vk.com/method/execute?' \
            'code={0}&access_token={1}'.format(
               quote(execute), request.session['access_token']))

        offset +=COUNT

        logger.error('offset=' + str(offset) + ', resp=' + resp.read().decode('utf-8'))

        time.sleep(20)
