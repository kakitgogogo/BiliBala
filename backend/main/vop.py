import os
import sys
import wave 
import requests
import subprocess
from .config import configs

url = 'https://openapi.baidu.com/oauth/2.0/token?grant_type=client_credentials&client_id={}&client_secret={}'.format(configs['baidu']['apikey'], configs['baidu']['secret'])

def get_token():
	r = requests.get(url)
	return r.json()['access_token']

def bd_tts(token, text='没有内容'):
	tts_url = 'http://tsn.baidu.com/text2audio?tex={}&lan=zh&cuid=02:42:4d:70:f7:97&ctp=1&tok='+token
	r = requests.get(url)
	if r.headers['Content-Type'] == 'audio/mp3':
		with open('tmp.mp3', 'wb') as f:
			f.write(r.content)
	else:
		print(r.json()['err_no'])

def bd_stt(token, filepath):
	pcmfilename = filepath.replace('.silk', '.pcm')
	wavfilename = filepath.replace('.silk', '.wav')

	subprocess.call('main/silk/decoder {} {} -Fs_API 16000 > /dev/null 2>&1'.format(filepath, pcmfilename), shell=True)
	subprocess.call('ffmpeg -y -f s16le -ar 16000 -ac 1 -i {} {} > /dev/null 2>&1'.format(pcmfilename, wavfilename), shell=True)

	f = wave.open(wavfilename, 'rb')
	audio_info = {}
	params = f.getparams()
	audio_info['nchannels'], audio_info['sampwidth'], audio_info['framerate'], audio_info['nframes'] = params[:4]
	audio_info['content'] = f.readframes(audio_info['nframes'])
	f.close()

	stt_url= 'http://vop.baidu.com/server_api?lan=zh&cuid=02:42:4d:70:f7:97&token='+token
	headers = {
		'Content-Type': 'audio/wav;rate={}'.format(audio_info['framerate']),
		'Content-Length': str(audio_info['nframes'])
	}
	r = requests.post(stt_url, headers=headers, data=audio_info['content'])
	
	os.remove(pcmfilename)
	os.remove(wavfilename)

	if r.headers['Content-Type'] == 'application/json':
		if r.json()['err_no'] == 0:
			return r.json()['result'][0]
		else:
			return ''
	else:
		return ''
