import sys,glob
from PIL import Image
d=sys.argv[1]; fs=sorted(glob.glob(d+"/t*.png")); W,H=480,270
for part in range(0,len(fs),9):
  sub=fs[part:part+9]; r=(len(sub)+2)//3; im=Image.new("RGB",(W*3,H*r),"black")
  for i,f in enumerate(sub): im.paste(Image.open(f).resize((W,H)),((i%3)*W,(i//3)*H))
  im.save(f"{d}/sheet{part//9}.png")
