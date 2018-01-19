#!/usr/bin/env python
#coding: utf-8

import os
import apiai
import json
import random
from base64 import b64encode
from flask import Flask, render_template, session
from flask_socketio import SocketIO, emit
from youtubeapi import YoutubeAPI

import config

app = Flask(__name__)
app.debug = True
app.secret_key = "secret"
socketio = SocketIO(app)

ai = apiai.ApiAI(config.APIAI_CLIENT_ACCESS_TOKEN)
youtube = YoutubeAPI({'key': config.YOUTUBE_API})

user_no = 1

@app.before_request
def before_request():
    global user_no
    if 'session' in session and 'user-id' in session:
        pass
    else:
        session['session'] = os.urandom(24)
        session['username'] = 'user'+str(user_no)
        user_no += 1

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect', namespace='/mynamespace')
def connect():
    emit("response", {
        'data': 'Connected',
        'username': session['username'],
        'youtube': ''
        })

@socketio.on('disconnect', namespace='/mynamespace')
def disconnect():
    session.clear()
    print "Disconnected"

@socketio.on("request", namespace='/mynamespace')
def request(message):
    request = ai.text_request()
    request.session_id = b64encode(session['session']).decode('utf-8')
    request.query = message['data']
    response = request.getresponse().read()
    response_json = json.loads(response)
    result = response_json['result']

    song = {
        'id': '',
        'title': ''
    }
    if result['action'] == 'music.play':
        target = ''
        if len(result['parameters']['artist']) != 0:
            target = result['parameters']['artist'][0]
        if result['parameters']['song'] != '':
            target = target + ' ' + result['parameters']['song']
        if result['parameters']['genre'] != '':
            target = target + ' ' + result['parameters']['genre']
        print target
        video_list = youtube.search_videos(str(target.strip()))
        random.shuffle(video_list)
        song['id']= video_list[0]['id']['videoId']
        song['title'] = video_list[0]['snippet']['title']
    emit("response", {
        'data': 'Requested',
        'username': session['username'],
        'action': result['action'],
        'song': song,
        }, broadcast=True)

if __name__ == '__main__':
    socketio.run(app)
