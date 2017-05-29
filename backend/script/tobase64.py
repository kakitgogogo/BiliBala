import pymysql
import time
import uuid
import hashlib
import requests
import base64

conn = pymysql.connect(
	host='localhost',
	port=3306,
	user='root',
	passwd='131413',
	db='voice',
	use_unicode=True, 
	charset="utf8"
	)

try:
	cur = conn.cursor()
	sql = 'select id, text from voices';
	cur.execute(sql)

	for res in cur.fetchall():
		cur1 = conn.cursor()
		sql1 = 'update voices set text="{}" where id="{}"'.format(base64.b64encode(res[1].encode(encoding='utf-8'), res[0]))
		cur1.execute(sql1)
		cur1.close()

	conn.commit()
except Exception as e:
	print(e)