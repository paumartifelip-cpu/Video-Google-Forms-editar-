import sys,glob
from PIL import Image
d=sys.argv[1]; fs=sorted(glob.glob(d+"/t*.png")); im0=Image.open(fs[0]); vert=im0.height>im0.width
W,H=(270,480) if vert else (480,270); cols=5 if vert else 3; per=cols*2 if vert else 9
for part in range(0,len(fs),per):
  sub=fs[part:part+per]; r=(len(sub)+cols-1)//cols; im=Image.new("RGB",(W*cols,H*r),"black")
  for i,f in enumerate(sub): im.paste(Image.open(f).resize((W,H)),((i%cols)*W,(i//cols)*H))
  im.save(f"{d}/sheet{part//per}.png")
