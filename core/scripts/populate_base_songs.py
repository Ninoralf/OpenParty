import json
import os

base_songs = [
    ('AllAboutUs', 'All About Us', 'Jordan Fisher', 1, 1, 196, ['Main', 'Solo', 'Easy', 'JustDance2017']),
    ('Bailar', 'Bailar', 'Deorro feat. Elvis Crespo', 1, 2, 160, ['Main', 'Solo', 'Medium', 'Latin', 'JustDance2017']),
    ('Bang', 'Bang', 'Anitta', 1, 2, 191, ['Main', 'Solo', 'Medium', 'JustDance2017']),
    ('Bicicleta', 'La Bicicleta', 'Carlos Vives & Shakira', 2, 1, 228, ['Main', 'Duet', 'Easy', 'Latin', 'JustDance2017']),
    ('Bonbon', 'Bonbon', 'Era Istrefi', 1, 2, 167, ['Main', 'Solo', 'Medium', 'JustDance2017']),
    ('CakeByTheOcean', 'Cake by the Ocean', 'DNCE', 1, 2, 218, ['Main', 'Solo', 'Medium', 'JustDance2017']),
    ('CakeByTheOceanALT', 'Cake by the Ocean (Alternate)', 'DNCE', 2, 3, 218, ['Alternate', 'Duet', 'Hard', 'JustDance2017']),
    ('CantFeelMyFace', "Can't Feel My Face", 'The Weeknd', 1, 1, 213, ['Main', 'Solo', 'Easy', 'JustDance2017']),
    ('CheapThrills', 'Cheap Thrills', 'Sia feat. Sean Paul', 1, 2, 224, ['Main', 'Solo', 'Medium', 'JustDance2017']),
    ('CheapThrillsALT', 'Cheap Thrills (Alternate)', 'Sia feat. Sean Paul', 4, 3, 224, ['Alternate', 'Quartet', 'Hard', 'Bollywood', 'JustDance2017']),
    ('ColaSong', 'Cola Song', 'INNA feat. J Balvin', 1, 2, 198, ['Main', 'Solo', 'Medium', 'JustDance2017']),
    ('ColaSongALT', 'Cola Song (Alternate)', 'INNA feat. J Balvin', 4, 1, 198, ['Alternate', 'Quartet', 'Easy', 'JustDance2017']),
    ('Daddy', 'DADDY', 'PSY feat. CL', 2, 2, 230, ['Main', 'Duet', 'Medium', 'Kpop', 'JustDance2017']),
    ('DaddyALT', 'DADDY (Alternate)', 'PSY feat. CL', 1, 3, 230, ['Alternate', 'Solo', 'Hard', 'Kpop', 'JustDance2017']),
    ('DontStopMe', "Don't Stop Me Now", 'Queen', 1, 2, 209, ['Main', 'Solo', 'Medium', 'Rock', 'JustDance2017']),
    ('DontStopMeALT', "Don't Stop Me Now (Alternate)", 'Queen', 1, 3, 209, ['Alternate', 'Solo', 'Hard', 'Rock', 'Panda', 'JustDance2017']),
    ('DragosteaDinTei', 'Dragostea Din Tei', 'O-Zone', 3, 1, 215, ['Main', 'Trio', 'Easy', 'JustDance2017']),
    ('ElTiki', 'El Tiki', 'Maluma', 2, 1, 184, ['Main', 'Duet', 'Easy', 'Latin', 'JustDance2017']),
    ('ElTikiALT', 'El Tiki (Alternate)', 'Maluma', 3, 2, 184, ['Alternate', 'Trio', 'Medium', 'Latin', 'JustDance2017']),
    ('GhostInTheKeys', 'Ghost in the Keys', 'Halloween Thrills', 4, 2, 164, ['Main', 'Quartet', 'Medium', 'Halloween', 'JustDance2017']),
    ('Groove', 'Groove', 'Jack & Jack', 2, 2, 215, ['Main', 'Duet', 'Medium', 'JustDance2017']),
    ('Hips', "Hips Don't Lie", 'Shakira feat. Wyclef Jean', 1, 1, 218, ['Main', 'Solo', 'Easy', 'Latin', 'JustDance2017']),
    ('HipsALT', "Hips Don't Lie (Alternate)", 'Shakira feat. Wyclef Jean', 2, 3, 218, ['Alternate', 'Duet', 'Hard', 'Latin', 'Sumo', 'JustDance2017']),
    ('ILoveRock', "I Love Rock 'n' Roll", 'Fast Forward Highway', 1, 1, 175, ['Main', 'Solo', 'Easy', 'Rock', 'JustDance2017']),
    ('IntoYou', 'Into You', 'Ariana Grande', 1, 2, 242, ['Main', 'Solo', 'Medium', 'Pop', 'JustDance2017']),
    ('LastChristmas', 'Last Christmas', 'Santa Clones', 2, 1, 228, ['Main', 'Duet', 'Easy', 'Holiday', 'JustDance2017']),
    ('LeanOn', 'Lean On', 'Major Lazer & DJ Snake feat. MØ', 4, 2, 176, ['Main', 'Quartet', 'Medium', 'Electro', 'JustDance2017']),
    ('LeanOnALT', 'Lean On (Alternate)', 'Major Lazer & DJ Snake feat. MØ', 1, 3, 176, ['Alternate', 'Solo', 'Hard', 'Electro', 'JustDance2017']),
    ('Leila', 'Leila', 'Cheb Salama', 1, 2, 200, ['Main', 'Solo', 'Medium', 'JustDance2017']),
    ('LikeIWould', 'LIKE I WOULD', 'ZAYN', 1, 2, 192, ['Main', 'Solo', 'Medium', 'JustDance2017']),
    ('LittleSwing', 'Little Swing', 'AronChupa feat. Little Sis Nora', 2, 1, 163, ['Main', 'Duet', 'Easy', 'Electro', 'JustDance2017']),
    ('NaeNae', 'Watch Me (Whip / Nae Nae)', 'Silentó', 4, 1, 185, ['Main', 'Quartet', 'Easy', 'Hip Hop', 'JustDance2017']),
    ('NaeNaeALT', 'Watch Me (Whip / Nae Nae) (Alternate)', 'Silentó', 2, 1, 185, ['Alternate', 'Duet', 'Easy', 'Hip Hop', 'JustDance2017']),
    ('Oishii', 'Oishii Oishii', 'Wanko Ni Mero Mero', 2, 1, 176, ['Main', 'Duet', 'Easy', 'JustDance2017']),
    ('PoPiPo', 'PoPiPo', 'Hatsune Miku', 3, 3, 182, ['Main', 'Trio', 'Hard', 'J-pop', 'JustDance2017']),
    ('Radical', 'RADICAL', 'Dyro & Dannic', 3, 3, 160, ['Main', 'Trio', 'Hard', 'Electro', 'JustDance2017']),
    ('RadicalALT', 'RADICAL (Alternate)', 'Dyro & Dannic', 1, 4, 160, ['Alternate', 'Solo', 'Extreme', 'Electro', 'JustDance2017']),
    ('RedMangoose', 'Red Mongoose', 'Latino Sunset', 1, 2, 166, ['Main', 'Solo', 'Medium', 'Latin', 'JustDance2017']),
    ('RunTheNight', 'Run The Night', 'Gigi Rowe', 1, 2, 222, ['Main', 'Solo', 'Medium', 'Pop', 'JustDance2017']),
    ('Samba', 'Carnaval Boom', 'Latino Sunset', 1, 1, 165, ['Main', 'Solo', 'Easy', 'Latin', 'JustDance2017']),
    ('ScreamNShout', 'Scream & Shout', 'will.i.am feat. Britney Spears', 4, 2, 252, ['Main', 'Quartet', 'Medium', 'Pop', 'JustDance2017']),
    ('ScreamNShoutALT', 'Scream & Shout (Alternate)', 'will.i.am feat. Britney Spears', 1, 4, 252, ['Alternate', 'Solo', 'Extreme', 'Pop', 'JustDance2017']),
    ('September', 'September', 'Equinox Stars', 3, 2, 215, ['Main', 'Trio', 'Medium', 'Disco Funk', 'JustDance2017']),
    ('SeptemberALT', 'September (Alternate)', 'Equinox Stars', 1, 3, 215, ['Alternate', 'Solo', 'Hard', 'Disco Funk', 'JustDance2017']),
    ('SingleLadies', 'Single Ladies (Put a Ring on It)', 'Beyoncé', 3, 3, 193, ['Main', 'Trio', 'Hard', 'Pop', 'JustDance2017']),
    ('Sorry', 'Sorry', 'Justin Bieber', 1, 2, 200, ['Main', 'Solo', 'Medium', 'Pop', 'JustDance2017']),
    ('SorryALT', 'Sorry (Alternate)', 'Justin Bieber', 1, 4, 200, ['Alternate', 'Solo', 'Extreme', 'Pop', 'JustDance2017']),
    ('TeDominar', 'Te Dominar', 'Daya Luz', 3, 2, 208, ['Main', 'Trio', 'Medium', 'Latin', 'JustDance2017']),
    ('TicoTico', 'Tico-Tico no Fubá', 'The Frankie Bostello Orchestra', 2, 2, 147, ['Main', 'Duet', 'Medium', 'Latin', 'JustDance2017']),
    ('Titanium', 'Titanium', 'David Guetta feat. Sia', 1, 2, 245, ['Main', 'Solo', 'Medium', 'Electro', 'JustDance2017']),
    ('WhatIsLove', 'What Is Love', 'Ultraclub 90', 1, 1, 248, ['Main', 'Solo', 'Easy', 'Electro', 'JustDance2017']),
    ('WhatIsLoveALT', 'What Is Love (Alternate)', 'Ultraclub 90', 2, 3, 248, ['Alternate', 'Duet', 'Hard', 'Electro', 'JustDance2017']),
    ('WhereverIGo', 'Wherever I Go', 'OneRepublic', 1, 2, 170, ['Main', 'Solo', 'Medium', 'Pop', 'JustDance2017']),
    ('WorthIt', 'Worth It', 'Fifth Harmony feat. Kid Ink', 1, 2, 224, ['Main', 'Solo', 'Medium', 'Pop', 'JustDance2017']),
    ('WorthItALT', 'Worth It (Alternate)', 'Fifth Harmony feat. Kid Ink', 4, 3, 224, ['Alternate', 'Quartet', 'Hard', 'Pop', 'JustDance2017'])
]

songdbs_path = os.path.join(os.path.dirname(__file__), '../../database/Platforms/openparty-all/songdbs.json')

with open(songdbs_path, 'r', encoding='utf-8') as f:
    existing_db = json.load(f)

for codename, title, artist, coaches, diff, length, tags in base_songs:
    existing_db[codename] = {
        'artist': artist,
        'assets': {
            'nx': {},
            'x1': {},
            'common': {
                'banner_bkgImageUrl': '',
                'coach1ImageUrl': '',
                'coverImageUrl': '',
                'coverKidsImageUrl': '',
                'coverKids_smallImageUrl': '',
                'cover_1024ImageUrl': '',
                'cover_smallImageUrl': '',
                'expandBkgImageUrl': '',
                'expandCoachImageUrl': '',
                'map_bkgImageUrl': '',
                'phoneCoach1ImageUrl': '',
                'phoneCoverImageUrl': ''
            }
        },
        'coachCount': coaches,
        'credits': f'All Credits Goes to {artist}',
        'difficulty': diff,
        'doubleScoringType': -1,
        'jdmAttributes': [],
        'lyricsColor': 'FFFFFFFF',
        'lyricsType': 0,
        'mainCoach': -1,
        'mapLength': length,
        'mapName': codename,
        'mode': 6,
        'originalJDVersion': 2017,
        'packages': {
            'mapContent': f'{codename}_mapContent'
        },
        'parentMapName': codename.replace('ALT', ''),
        'skuIds': ['jd2017-pc-ww'],
        'status': 3,
        'sweatDifficulty': diff,
        'tags': tags,
        'title': title,
        'urls': {}
    }

with open(songdbs_path, 'w', encoding='utf-8') as f:
    json.dump(existing_db, f, indent=2, ensure_ascii=False)

print(f'Successfully populated {len(existing_db)} songs in songdbs.json')
