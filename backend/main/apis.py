from flask import Blueprint, Response, Flask, render_template, jsonify, request
from werkzeug import secure_filename
from . import main
import json
import os
import pymysql
import time
import uuid
import hashlib
import requests
from .WXBizDataCrypt import WXBizDataCrypt

conn = pymysql.connect(
	host='localhost',
	port=3306,
	user='root',
	passwd='xxxxxx',
	db='voice',
	use_unicode=True, 
	charset="utf8"
	)

appid = 'xxxxxx'
secret = 'xxxxxx'

def next_id():
	return '%015d%s000' % (int(time.time() * 1000), uuid.uuid4().hex)

def get_user_info(code, encrytedData, iv):
	r = requests.get('https://api.weixin.qq.com/sns/jscode2session?appid={}&secret={}&js_code={}&grant_type=authorization_code'.format(appid, secret, code))
	sessionKey = r.json()['session_key']
	pc = WXBizDataCrypt(appid, sessionKey)
	return pc.decrypt(encrytedData, iv)

@main.route('/')
def index():
	return render_template('index.html')

@main.route('/login/voice', methods=['POST'])
def login_voice():
	data = json.loads(request.get_data())
	print(data)
	if data:
		cur = conn.cursor()
		user_info = get_user_info(data['code'], data['encrytedData'], data['iv'])
		print(user_info)
		uid = user_info['openId']
		nickname = user_info['nickName']
		avatar = user_info['avatarUrl']
		sqli = 'insert into users(id, nickname, avatar) values(%s,"'+nickname+'",%s);'
		try:
			cur.execute(sqli, (uid, avatar))
			cur.close()
			conn.commit()
		except:
			print('insert user error')
			conn.rollback()

		return jsonify({"status":0, "sessionKey":uid, "msg":"上传成功"})

	return jsonify({"status":1, "msg":"上传失败"})

@main.route('/voice/<voiceid>')
def get_voice(voiceid):
	voice = open('voice/{}'.format(voiceid), 'rb')
	resp = Response(voice, mimetype='application/octet-stream')
	return resp

@main.route('/image/<imageid>')
def get_image(imageid):
	image = open('image/{}.jpg'.format(imageid), 'rb')
	resp = Response(image, mimetype='image/jpeg')
	return resp

@main.route('/delete/voice/<voiceid>')
def delete_voice(voiceid):
	filepath = 'voice/{}'.format(voiceid);

	try:
		cur = conn.cursor()
		sqld = 'delete from voices where path=%s;'
		cur.execute(sqld, (filepath,))
		cur.close()
		conn.commit()

		os.remove(filepath)

		return jsonify({"status":0, "msg":"删除成功"})
	except:
		conn.rollback()
		return jsonify({"status":1, "msg":"删除失败"})

# content_type='multipart/form-data'
@main.route('/upload/voice', methods=['POST'])
def upload_voice():
	#print(request.form)
	file = request.files['voice']
	userid = request.form['session']
	unique_id = next_id()
	if file:
		filepath = 'voice/'+unique_id+'.silk'
		file.save(filepath)

		cur = conn.cursor()
		sqli = 'insert into voices values(%s,%s,%s,%s);'
		cur.execute(sqli, (unique_id, userid, filepath, str(time.time())))
		cur.close()
		conn.commit()

		return jsonify({"status":0, "msg":"上传成功"})

	return jsonify({"status":1, "msg":"上传失败"})


@main.route('/upload/image',  methods=['POST'])
def upload_image():
	file = request.files['file']
	if file:
		file.save('image/'+file.filename)
		return jsonify({"status":0, "msg":"上传成功"})

	return jsonify({"status":1, "msg":"上传失败"})

@main.route('/view/voice', methods=['POST'])
def view_voice():
	data = json.loads(request.get_data())
	print(data)
	if data['session']:
		cur = conn.cursor()
		userid = data['session']
		sqls = 'select path, created_at from voices where userid=%s order by created_at desc limit %s, %s;'
		cur.execute(sqls, (userid, data['index'], data['number']))
		plist = []
		pcnt = 0
		for p in cur.fetchall():
			item = {}
			item['src'] = p[0]
			item['created_at'] = p[1]
			plist.append(item)
			pcnt = pcnt + 1
		cur.close()
		conn.commit()
		return jsonify({"status":0, "data": plist, "number":pcnt, "msg":"上传成功"})

	return jsonify({"status":1, "msg":"上传失败"})

@main.route('/viewall/voice', methods=['POST'])
def view_all_voice():
	data = json.loads(request.get_data())
	print(data)
	if data:
		cur = conn.cursor()
		sqls = 'select voices.path as path, users.avatar as avatar from voices, users where voices.userid=users.id order by voices.created_at desc limit %s, %s;'
		cur.execute(sqls, (data['index'], data['number']))
		plist = []
		pcnt = 0
		for p in cur.fetchall():
			item = {}
			item['src'] = p[0]
			item['avatar'] = p[1]
			plist.append(item)
			pcnt = pcnt + 1
		cur.close()
		conn.commit()
		return jsonify({"status":0, "data":plist, "number":pcnt, "msg":"请求成功"})

	return jsonify({"status":1, "msg":"请求失败"})

