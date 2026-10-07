"""Inserta las fuentes (woff2 en base64) en las plantillas → rumbo-motion.html y rumbo-motion-vertical.html autocontenidos."""
import base64, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
faces = [("RInter",400,"Inter-Regular"),("RInter",500,"Inter-Medium"),("RInter",600,"Inter-SemiBold"),("RInter",700,"Inter-Bold"),
         ("RDisplay",800,"InterDisplay-ExtraBold"),("RDisplay",900,"InterDisplay-Black")]
css = "\n".join(f'@font-face{{font-family:"{f}";font-weight:{w};font-style:normal;font-display:block;src:url(data:font/woff2;base64,{base64.b64encode((root/"src/fonts"/(n+".woff2")).read_bytes()).decode()}) format("woff2")}}' for f,w,n in faces)
for tpl, name in [("rumbo.template.html","rumbo-motion.html"), ("rumbo-vertical.template.html","rumbo-motion-vertical.html"), ("rumbo-suscripciones.template.html","rumbo-suscripciones.html"), ("rumbo-suscripciones-vertical.template.html","rumbo-suscripciones-vertical.html")]:
    src = (root/"src"/tpl).read_text()
    out = root/name
    out.write_text(src.replace("/*__FONTS__*/", "/* Inter (SIL OFL 1.1) — subconjunto latino incrustado */\n"+css))
    print(out, out.stat().st_size, "bytes")
