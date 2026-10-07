"""Inserta las fuentes (woff2 en base64) en la plantilla → rumbo-motion.html autocontenido."""
import base64, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = (root/"src/rumbo.template.html").read_text()
faces = [("RInter",400,"Inter-Regular"),("RInter",500,"Inter-Medium"),("RInter",600,"Inter-SemiBold"),("RInter",700,"Inter-Bold"),
         ("RDisplay",800,"InterDisplay-ExtraBold"),("RDisplay",900,"InterDisplay-Black")]
css = "\n".join(f'@font-face{{font-family:"{f}";font-weight:{w};font-style:normal;font-display:block;src:url(data:font/woff2;base64,{base64.b64encode((root/"src/fonts"/(n+".woff2")).read_bytes()).decode()}) format("woff2")}}' for f,w,n in faces)
out = root/"rumbo-motion.html"
out.write_text(src.replace("/*__FONTS__*/", "/* Inter (SIL OFL 1.1) — subconjunto latino incrustado */\n"+css))
print(out, out.stat().st_size, "bytes")
