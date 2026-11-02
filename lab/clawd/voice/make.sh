set -e
cd /workspace/tools/clawd_voice
O=/workspace/work/moontide/clawd_lab/voice
gen() {
python tts.py zh-CN-XiaoyiNeural "$2" $O/$1_raw.mp3 -10% +55Hz
ffmpeg -loglevel error -y -i $O/$1_raw.mp3 -ac 1 -ar 22050 $O/$1_r.wav
python -c "
import librosa,soundfile as sf,numpy as np
from tomo import tomo,SR
x,_=librosa.load('$O/$1_r.wav',sr=SR)
sf.write('$O/$1_o.wav',np.r_[np.zeros(1100),tomo(x,base=520,span=0.35,buzz=0.35,shift=1.32,wob=0.7,air=0.3),np.zeros(3000)],SR)"
ffmpeg -loglevel error -y -i $O/$1_o.wav -af "highpass=f=220,loudnorm=I=-16" -ac 1 -ar 32000 -b:a 56k $O/$1.mp3
}
gen cheer "耶！好耶好耶！我最棒啦！"
gen cute "嘿嘿，可不可以，再多看我一会儿呀？"
