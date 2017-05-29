from flask import Blueprint, Response, Flask, render_template, jsonify, request, current_app
from werkzeug import secure_filename
from . import main
from .WXBizDataCrypt import WXBizDataCrypt
from .vop import get_token, bd_stt
from .config import configs
import os
import json
import pymysql
import time
import uuid
import hashlib
import requests
import base64

conn = pymysql.connect(
	host='localhost',
	port=3306,
	user=configs['db']['user'],
	passwd=configs['db']['passwd'],
	db='voice',
	use_unicode=True, 
	charset="utf8"
	)

appid = configs['weixin']['appid']
secret = configs['weixin']['secret']

last_get_token_time = 0
token = ''

def debug(msg='', e=''): 
	current_app.logger.debug(msg+'; '+str(e))

def next_id():
	return '%015d%s000' % (int(time.time() * 1000), uuid.uuid4().hex)

def get_user_info(code, encrytedData, iv):
	r = requests.get('https://api.weixin.qq.com/sns/jscode2session?appid={}&secret={}&js_code={}&grant_type=authorization_code'.format(appid, secret, code))
	sessionKey = r.json()['session_key']
	pc = WXBizDataCrypt(appid, sessionKey)
	return pc.decrypt(encrytedData, iv)

def get_voice_text(filepath):
	global last_get_token_time
	global token
	if time.time() - last_get_token_time > 14*24*60*60:
		token = get_token()
		last_get_token_time = time.time()

	return bd_stt(token, filepath)

def time_format(timenum, isDetail=True):
	if isDetail:
		return time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(timenum))
	else:
		return time.strftime('%Y-%m-%d',time.localtime(timenum))

@main.route('/')
def index():
	debug('haha', FileNotFoundError('huhu'))
	return render_template('index.html')

@main.route('/login/voice', methods=['POST'])
def login_voice():
	data = json.loads(request.get_data())
	if data:
		cur = conn.cursor()
		user_info = get_user_info(data['code'], data['encrytedData'], data['iv'])
		uid = user_info['openId']
		nickname = user_info['nickName']
		avatar = user_info['avatarUrl']
		sqli = 'insert into users(id, nickname, avatar) values(%s,"'+nickname+'",%s);'
		try:
			cur.execute(sqli, (uid, avatar))
			cur.close()
			conn.commit()
		except Exception as e:
			debug('新增用户失败或用户已存在', e)
			conn.rollback()

		return jsonify({"status":0, "sessionKey":uid, "msg":"登录成功"})

	debug('无请求内容')
	return jsonify({"status":1, "msg":"登录失败"})

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
	filepath = 'voice/{}'.format(voiceid)+'.silk';

	try:
		cur = conn.cursor()
		sqld = 'delete from voices where id=%s;'
		cur.execute(sqld, (voiceid,))
		cur.close()

		cur = conn.cursor()
		sqld = 'delete from comments where voiceid=%s;'
		cur.execute(sqld, (voiceid,))
		cur.close()

		cur = conn.cursor()
		sqld = 'delete from likes where voiceid=%s;'
		cur.execute(sqld, (voiceid,))
		cur.close()

		conn.commit()
		os.remove(filepath)

		return jsonify({"status":0, "msg":"删除成功"})
	except Exception as e:
		debug('删除失败', e)
		conn.rollback()
		return jsonify({"status":1, "msg":"删除失败"})


@main.route('/share/voice/<voiceid>')
def share_voice(voiceid):
	filepath = 'voice/{}'.format(voiceid);

	try:
		cur = conn.cursor()
		sqlu = 'update voices set is_shared=abs(is_shared-1) where path=%s;'
		cur.execute(sqlu, (filepath,))
		cur.close()
		conn.commit()

		return jsonify({"status":0, "msg":"分享成功"})
	except Exception as e:
		debug('分享失败', e)
		conn.rollback()
		return jsonify({"status":1, "msg":"分享失败"})

@main.route('/edit/voice/<voiceid>', methods=['POST'])
def edit_voice(voiceid):
	data = json.loads(request.get_data())
	debug(str(data))
	try:
		cur = conn.cursor()
		sqlu = 'update voices set `text`="{}" where id=%s;'.format(data['text'])
		cur.execute(sqlu, (voiceid,))
		cur.close()
		conn.commit()

		return jsonify({"status":0, "msg":"更改成功"})
	except Exception as e:
		debug('更改失败', e)
		conn.rollback()
		return jsonify({"status":1, "msg":"更改失败"})

@main.route('/like/voice/<voiceid>', methods=['POST'])
def like_voice(voiceid):
	data = json.loads(request.get_data())
	try:
		if data['method'] == 'like':
			cur = conn.cursor()
			sqli = 'insert into likes values("{}", "{}", {});'.format(data['session'], voiceid, time.time())
			cur.execute(sqli)
			cur.close()

			cur = conn.cursor()
			sqlu = 'update voices set n_likes=n_likes+1 where id="{}";'.format(voiceid)
			cur.execute(sqlu)
			cur.close()

			conn.commit()
		else:
			cur = conn.cursor()
			sqli = 'delete from likes where userid="{}" and voiceid="{}";'.format(data['session'], voiceid)
			cur.execute(sqli)
			cur.close()

			cur = conn.cursor()
			sqlu = 'update voices set n_likes=n_likes-1 where id="{}";'.format(voiceid)
			cur.execute(sqlu)
			cur.close()

			conn.commit()		
		return jsonify({"status":0, "msg":"点赞成功"})
	except Exception as e:
		debug('点赞失败', e)
		conn.rollback()
		return jsonify({"status":1, "msg":"点赞失败"})

@main.route('/comment/voice/<voiceid>', methods=['POST'])
def comment_voice(voiceid):
	data = json.loads(request.get_data())
	print(data)
	unique_id = next_id()
	try:
		cur = conn.cursor()
		sqli = 'insert into comments values("{}", "{}", "{}", "{}", {}, "{}");'.format(unique_id, data['session'], voiceid, data['comment'], time.time(), data['tousername'])
		cur.execute(sqli)
		cur.close()

		cur = conn.cursor()
		sqlu = 'update voices set n_comments=n_comments+1 where id="{}";'.format(voiceid)
		cur.execute(sqlu)
		cur.close()

		conn.commit()
		return jsonify({"status":0, "msg":"评论成功"})
	except Exception as e:
		debug('评论失败', e)
		conn.rollback()
		return jsonify({"status":1, "msg":"评论失败"})

# content_type='multipart/form-data'
@main.route('/upload/voice', methods=['POST'])
def upload_voice():
	try:
		file = request.files['voice']
		userid = request.form['session']
		unique_id = next_id()

		filepath = 'voice/'+unique_id+'.silk'
		file.save(filepath)

		text = get_voice_text(filepath)
		text = base64.b64encode(text[:-1].encode(encoding='utf-8')).decode(encoding='utf-8')

		cur = conn.cursor()
		sqli = 'insert into voices values("{}", "{}", "{}", "{}", {}, 0, 0, 0);'.format(unique_id, userid, filepath, text, time.time())
		cur.execute(sqli)
		cur.close()
		conn.commit()

		return jsonify({"status":0, "msg":"上传成功"})
	except Exception as e:
		debug('上传失败', e)
		conn.rollback()
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
	try:
		cur = conn.cursor()
		userid = data['session']
		userid = data['session']
		sqls = 'select id, path, text, created_at, is_shared from voices where userid="{}" order by created_at desc limit {}, {};'.format(userid, data['index'], data['number'])
		cur.execute(sqls)
		datalist = []
		cnt = 0
		lastTime = ''
		for p in cur.fetchall():
			item = {}
			item['id'] = p[0]
			item['src'] = p[1]
			item['text'] = p[2]
			createdAt = time_format(p[3], False)
			if createdAt == lastTime:
				item['createdAt'] = 0
			else:
				item['createdAt'] = createdAt
				lastTime = createdAt
			item['isShared'] = p[4]
			datalist.append(item)
			cnt = cnt + 1
		cur.close()
		conn.commit()
		return jsonify({"status":0, "data": datalist, "number":cnt, "msg":"请求成功"})
	except Exception as e:
		debug('请求失败', e)
		conn.rollback()
		return jsonify({"status":1, "msg":"请求失败"})

@main.route('/viewall/voice', methods=['POST'])
def view_all_voice():
	data = json.loads(request.get_data())
	try:
		cur = conn.cursor()
		sqls = 'select voices.id, voices.path, voices.text, voices.created_at, voices.n_comments, voices.n_likes, users.nickname, users.avatar from voices, users where voices.userid=users.id and voices.is_shared=1 order by voices.created_at desc limit {}, {};'.format(data['index'], data['number'])
		cur.execute(sqls)
		datalist = []
		cnt = 0
		for p in cur.fetchall():
			item = {}
			item['id'] = p[0]
			item['src'] = p[1]
			item['text'] = p[2]
			item['createdAt'] = time_format(p[3])
			item['nComments'] = p[4]
			item['nLikes'] = p[5]
			item['username'] = p[6]
			item['avatar'] = p[7]

			cur1 = conn.cursor()
			sqls1 = 'select userid from likes where userid="{}" and voiceid="{}"'.format(data['session'], p[0])
			cur1.execute(sqls1)
			if cur1.fetchall():
				item['isLike'] = 1
			else:
				item['isLike'] = 0
			cur1.close()

			datalist.append(item)
			cnt = cnt + 1
		cur.close()
		conn.commit()
		return jsonify({"status":0, "data":datalist, "number":cnt, "msg":"请求成功"})
	except Exception as e:
		debug('请求失败', e)
		conn.rollback()
		return jsonify({"status":1, "msg":"请求失败"})

@main.route('/comments/voice/<voiceid>', methods=['POST'])
def comments_voice(voiceid):
	data = json.loads(request.get_data())
	try:
		cur = conn.cursor()
		sqls = 'select comments.id, comments.text, comments.created_at, users.id, users.nickname, users.avatar, comments.tousername from comments, users where comments.voiceid=%s and comments.userid=users.id order by comments.created_at desc;'
		cur.execute(sqls, (voiceid, ))
		datalist = []
		cnt = 0
		for p in cur.fetchall():
			item = {}
			item['id'] = p[0]
			item['text'] = p[1]
			item['createdAt'] = time_format(p[2])
			item['userid'] = p[3]
			item['username'] = p[4]
			item['avatar'] = p[5]
			item['tousername'] = p[6]

			datalist.append(item)
			cnt = cnt + 1
		cur.close()
		conn.commit()
		return jsonify({"status":0, "data":datalist, "number":cnt, "msg":"请求成功"})
	except Exception as e:
		debug('请求失败', e)
		conn.rollback()
		return jsonify({"status":1, "msg":"请求失败"})

