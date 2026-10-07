"""Genera src/rumbo-suscripciones-vertical.template.html a partir de la horizontal,
recomponiendo cada escena para 1080×1920 (misma historia, textos, tiempos y estética)."""
import pathlib
root = pathlib.Path(__file__).resolve().parent.parent
s = (root/"src/rumbo-suscripciones.template.html").read_text()
def R(a, b, n=1):
    global s
    assert s.count(a) >= 1, "NO ENCONTRADO:\n" + a[:200]
    s = s.replace(a, b) if n == 0 else s.replace(a, b, n)

# ---------- lienzo 9:16 ----------
R('<title>Rumbo · Suscripciones, ingresos y moneda</title>','<title>Rumbo · Suscripciones, ingresos y moneda · Vertical</title>')
R('#stage{position:absolute;left:0;top:0;width:1920px;height:1080px;','#stage{position:absolute;left:0;top:0;width:1080px;height:1920px;')
R('radial-gradient(1200px 720px at 50% 48%,','radial-gradient(900px 1300px at 50% 46%,')
R('#world{position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:960px 560px}','#world{position:absolute;left:0;top:0;width:1080px;height:1920px;transform-origin:500px 1000px}')
R('''<div id="safe"><div style="left:0;top:0;right:0;height:100px"></div><div style="left:0;bottom:0;right:0;height:200px"></div>
        <div style="left:0;top:100px;bottom:200px;width:160px"></div><div style="right:0;top:100px;bottom:200px;width:160px"></div></div>''',
  '''<div id="safe"><div style="left:0;top:0;right:0;height:180px"></div><div style="left:0;bottom:0;right:0;height:320px"></div>
        <div style="left:0;top:180px;bottom:320px;width:80px"></div><div style="right:0;top:180px;bottom:320px;width:160px"></div></div>''')
R('k=Math.min(W/1920,H/1080);','k=Math.min(W/1080,H/1920);')
R('`translate(${((W-1920*k)/2).toFixed(2)}px,${((H-1080*k)/2).toFixed(2)}px) scale(${k})`','`translate(${((W-1080*k)/2).toFixed(2)}px,${((H-1920*k)/2).toFixed(2)}px) scale(${k})`')
R('''   RUMBO · "Lo que pagas, lo que entra, tu moneda" — 25 s, 16:9
   Composición lógica 1920×1080 (se renderiza a 3840×2160 con densidad 2).''','''   RUMBO · "Lo que pagas, lo que entra, tu moneda" — 25 s, VERTICAL 9:16
   Composición 1080×1920 recompuesta para móvil (no es un recorte de la horizontal).''')
R('''   Zona segura para redes: x 160–1760, y 100–880 (los 200 px inferiores
   se reservan para los controles de las apps).''','''   Zona segura: x 80–920, y 180–1600 (arriba 180, abajo 320, derecha 160,
   izquierda 80 libres de información esencial).''')

# ---------- tarjetas en formato fila (anchas y legibles en móvil) ----------
R('''.k .tile{position:absolute;left:24px;top:24px;width:64px;height:64px;border-radius:18px;display:grid;place-items:center;font-size:34px}
.k .nm{position:absolute;left:104px;top:36px;right:22px;font:700 32px/1.05 var(--ui);letter-spacing:-.015em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.k .pr{position:absolute;right:26px;bottom:20px;white-space:nowrap}
.k .pr b{font:800 46px/1 var(--display);letter-spacing:-.03em}''','''.k .tile{position:absolute;left:24px;top:37px;width:76px;height:76px;border-radius:22px;display:grid;place-items:center;font-size:40px}
.k .nm{position:absolute;left:120px;top:30px;right:186px;font:700 36px/1.1 var(--ui);letter-spacing:-.015em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.k .pr{position:absolute;right:28px;top:50px;white-space:nowrap}
.k .pr b{font:800 52px/1 var(--display);letter-spacing:-.03em}''')
R('.k .bd{position:absolute;left:24px;bottom:22px;height:40px;','.k .bd{position:absolute;left:120px;bottom:22px;height:38px;')
R('''.inc .bd{background:#E3F6EC;color:#0F6B45;left:auto;right:18px;top:20px;bottom:auto;width:44px;height:44px;padding:0;justify-content:center}
.inc .bd .bt{display:none}
.inc .pr{left:24px;right:auto}
.inc .nm{right:72px}''','.inc .bd{background:#E3F6EC;color:#0F6B45}')
R('''.k .mini .mt{flex:none;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;font-size:22px}
.k .mini .mn{flex:1;font:700 26px/1 var(--ui);letter-spacing:-.01em}''','''.k .mini .mt{flex:none;width:50px;height:50px;border-radius:14px;display:grid;place-items:center;font-size:28px}
.k .mini .mn{flex:1;font:700 31px/1 var(--ui);letter-spacing:-.01em}''')
R('const BIG={sub:[440,160], inc:[320,170]};','const BIG={sub:[600,150], inc:[600,150]};')

# ---------- moneda: tarjeta vertical centrada, como en Rumbo ----------
R('''.cur .fl{position:absolute;left:28px;top:32px;font-size:52px}
.cur .cd{position:absolute;left:108px;top:22px;font:800 44px/1 var(--display);letter-spacing:-.02em}
.cur .cn{position:absolute;left:108px;top:72px;width:210px;font:500 23px/1.12 var(--ui);color:#6B7280}''','''.cur .fl{position:absolute;left:0;right:0;text-align:center;top:24px;font-size:62px}
.cur .cd{position:absolute;left:0;right:0;text-align:center;top:100px;font:800 52px/1 var(--display);letter-spacing:-.02em}
.cur .cn{position:absolute;left:10px;right:10px;text-align:center;top:156px;font:500 26px/1.1 var(--ui);color:#6B7280;white-space:nowrap}''')
R('#sub4{position:absolute;left:160px;top:512px;width:760px;font:500 38px/1.35 var(--ui);color:#4B5160}','#sub4{position:absolute;left:0;top:0;width:760px;font:500 31px/1.35 var(--ui);color:#4B5160}')

# ---------- cierre vertical ----------
R('#brand{position:absolute;left:0;top:300px;width:1920px;text-align:center;font:900 290px/1 var(--display);','#brand{position:absolute;left:80px;top:600px;width:840px;text-align:center;font:900 256px/1 var(--display);')
R('#tagline{position:absolute;left:0;top:636px;width:1920px;text-align:center;font:800 42px/1 var(--display);letter-spacing:.24em;','#tagline{position:absolute;left:80px;top:900px;width:840px;text-align:center;font:800 50px/1.34 var(--display);letter-spacing:.2em;')
R('#url{position:absolute;left:960px;top:722px;height:88px;padding:0 50px;border-radius:44px;background:var(--green);color:#fff;\n  font:700 38px/88px var(--ui);',
  '#url{position:absolute;left:500px;top:1080px;height:104px;padding:0 48px;border-radius:52px;background:var(--green);color:#fff;\n  font:700 42px/104px var(--ui);')
R('const tagEl=el("div",null,world,`${TX.tagA}<b>${TX.tagB}</b>`);','const tagEl=el("div",null,world,`${TX.tagA.trim()}<br><b>${TX.tagB}</b>`);')

# ---------- titulares: saltos de línea para vertical ----------
R('''    s1a: [["Una","suscripción","más…"]],
    s1b: [["¿Y","ya","van","cuántas?"]],
    s2:  [["Apúntalas.",{w:"Míralas",late:1},{w:"juntas.",late:1}]],
    s3a: [["¿Y","el","dinero","que",{w:"entra?",c:"#12945F"}]],
    s3b: [["Tus","ingresos,","en","un","vistazo."]],
    s4a: [["Y","en","tu",{w:"moneda.",c:"#12945F"}]],''','''    s1a: [["Una","suscripción"],["más…"]],
    s1b: [["¿Y","ya","van"],["cuántas?"]],
    s2:  [["Apúntalas."],[{w:"Míralas",late:1},{w:"juntas.",late:1}]],
    s3a: [["¿Y","el","dinero"],["que",{w:"entra?",c:"#12945F"}]],
    s3b: [["Tus","ingresos,"],["en","un","vistazo."]],
    s4a: [["Y","en","tu"],[{w:"moneda.",c:"#12945F"}]],''')
R('d.style.left=(pos.x??160)+"px"; d.style.width=(pos.w??1600)+"px";','d.style.left=(pos.x??80)+"px"; d.style.width=(pos.w??840)+"px";')
R('const lim=(c.pos.w??1600)-10,','const lim=(c.pos.w??840)-20,')
R('''const LEFT={x:160,w:780,align:"left"};
const CAPS=[
  {c:makeCap(TX.s1a,112,{top:178}), tin:0.12, st:[0,.07,.16], din:.42, tout:2.1, sto:.03, dout:.2},
  {c:makeCap(TX.s1b,112,{top:178}), tin:2.3, st:[0,.06,.1,.17], din:.48, tout:3.86, sto:.025, dout:.2},
  {c:makeCap(TX.s2,100,{top:150}), tin:3.98, st:[0,2.18,2.26], din:.42, tout:8.8, sto:.025, dout:.2},
  {c:makeCap(TX.s3a,100,{top:150}), tin:9.0, st:[0,.05,.1,.16,.22], din:.42, tout:12.3, sto:.022, dout:.2},
  {c:makeCap(TX.s3b,100,{top:150}), tin:12.48, st:[0,.07,.12,.16,.2], din:.45, tout:14.82, sto:.022, dout:.2},
  {c:makeCap(TX.s4a,108,{...LEFT,top:282}), tin:15.3, st:[0,.06,.1,.18], din:.5, tout:18.42, sto:.025, dout:.22},
  {c:makeCap(TX.s4b,100,{...LEFT,top:230}), tin:18.62, st:[0,.07,.16,.21,.28], din:.55, tout:20.32, sto:.02, dout:.2, ease:"glide"},
  {c:makeCap(TX.c1,88,{top:308}), tin:20.86, st:[0,.04,.08], din:.4, tout:22.0, sto:.02, dout:.2},
  {c:makeCap(TX.c2,88,{top:428}), tin:21.26, st:[0,.04,.08], din:.4, tout:22.03, sto:.02, dout:.2},
  {c:makeCap(TX.c3,88,{top:548}), tin:21.66, st:[0,.05,.1], din:.45, tout:22.06, sto:.02, dout:.2},
];''','''const CAPS=[
  {c:makeCap(TX.s1a,124,{top:228}), tin:0.12, st:[0,.07,.16], din:.42, tout:2.1, sto:.03, dout:.2},
  {c:makeCap(TX.s1b,124,{top:228}), tin:2.3, st:[0,.06,.1,.17], din:.48, tout:3.86, sto:.025, dout:.2},
  {c:makeCap(TX.s2,112,{top:206}), tin:3.98, st:[0,2.18,2.26], din:.42, tout:8.8, sto:.025, dout:.2},
  {c:makeCap(TX.s3a,108,{top:200}), tin:9.0, st:[0,.05,.1,.16,.22], din:.42, tout:12.3, sto:.022, dout:.2},
  {c:makeCap(TX.s3b,108,{top:200}), tin:12.48, st:[0,.07,.12,.16,.2], din:.45, tout:14.82, sto:.022, dout:.2},
  {c:makeCap(TX.s4a,112,{top:200}), tin:15.3, st:[0,.06,.1,.18], din:.5, tout:18.42, sto:.025, dout:.22},
  {c:makeCap(TX.s4b,104,{top:200}), tin:18.62, st:[0,.07,.16,.21,.28], din:.55, tout:20.32, sto:.02, dout:.2, ease:"glide"},
  {c:makeCap(TX.c1,104,{top:220}), tin:20.86, st:[0,.04,.08], din:.4, tout:22.0, sto:.02, dout:.2},
  {c:makeCap(TX.c2,104,{top:348}), tin:21.26, st:[0,.04,.08], din:.4, tout:22.03, sto:.02, dout:.2},
  {c:makeCap(TX.c3,104,{top:476}), tin:21.66, st:[0,.05,.1], din:.45, tout:22.06, sto:.02, dout:.2},
];''')

# ---------- paneles ----------
R('''const SP = {x:220,y:300,w:1480,h:560};          // "Suscripciones activas"
const SUMC = {x:160,y:300,w:440,h:520};         // resumen compacto (escena 3)
const IP = {x:660,y:300,w:1100,h:520};          // "Ingresos recurrentes mensuales"
const CP = {x:1000,y:156,w:760,h:712};          // "Moneda principal"''','''const SP = {x:80,y:450,w:840,h:1100};           // "Suscripciones activas": lista de arriba abajo
const SUMC = {x:80,y:452,w:840,h:164};          // resumen compacto arriba (escena 3)
const IP = {x:80,y:646,w:840,h:900};            // "Ingresos recurrentes mensuales" debajo
const CP = {x:80,y:452,w:840,h:1112};           // "Moneda principal": dos columnas''')
R('''subP.innerHTML=`<div class="ph" id="spBig"><div class="p-ttl" style="left:56px;top:44px">${TX.subsTitle}</div><div class="p-sub num" style="left:56px;top:104px"></div>
  <div class="p-tot num" style="right:56px;top:34px"><b></b><i>/mes</i></div></div>
  <div class="ph" id="spMini"><div class="ic-ico" style="left:28px;top:28px;width:64px;height:64px;background:#F0574A;font-size:30px;box-shadow:0 10px 22px rgba(240,87,74,.3)"><span class="emo">🔄</span></div>
  <div class="p-ttl" style="left:108px;top:32px;font-size:34px">Suscripciones</div><div class="p-sub" style="left:108px;top:74px;font-size:26px">${SUBS.length} activas</div>
  <div style="position:absolute;left:30px;top:122px;white-space:nowrap" class="num"><b style="font:900 56px/1 var(--display);letter-spacing:-.04em;color:#E0533F">${SUM_SUBS} €</b><i style="font:600 26px/1 var(--ui);font-style:normal;color:#8A909B;margin-left:6px">/mes</i></div></div>`;''',
'''subP.innerHTML=`<div class="ph" id="spBig"><div class="p-ttl" style="left:48px;top:46px;font-size:50px">${TX.subsTitle}</div><div class="p-sub num" style="left:48px;top:110px;font-size:34px"></div>
  <div class="p-tot num" style="left:44px;top:164px;text-align:left"><b style="font-size:132px"></b><i style="font-size:40px">/mes</i></div></div>
  <div class="ph" id="spMini"><div class="ic-ico" style="left:32px;top:44px;width:76px;height:76px;background:#F0574A;box-shadow:0 10px 22px rgba(240,87,74,.3)"><span class="emo">🔄</span></div>
  <div class="p-ttl" style="left:128px;top:42px;font-size:44px">Suscripciones</div><div class="p-sub" style="left:128px;top:96px;font-size:30px">${SUBS.length} activas</div>
  <div style="position:absolute;right:36px;top:46px;white-space:nowrap" class="num"><b style="font:900 76px/1 var(--display);letter-spacing:-.04em;color:#E0533F">${SUM_SUBS} €</b><i style="font:600 30px/1 var(--ui);font-style:normal;color:#8A909B;margin-left:6px">/mes</i></div></div>`;''')
R('''<div class="p-ttl" style="left:136px;top:42px;font-size:40px">${TX.incTitle}</div><div class="p-sub num" style="left:136px;top:94px;font-size:28px"></div>
  <div class="p-tot num" style="left:40px;top:154px;text-align:left"><b style="color:#0F6B45">0 €</b><i>/mes registrados</i></div></div>`;''',
'''<div class="p-ttl" style="left:136px;top:40px;font-size:40px;line-height:1.08">Ingresos recurrentes<br>mensuales</div><div class="p-sub num" style="left:40px;top:150px;font-size:31px"></div>
  <div class="p-tot num" style="left:38px;top:196px;text-align:left"><b style="color:#0F6B45;font-size:124px">0 €</b><i style="font-size:36px">/mes registrados</i></div></div>`;''')
R('''curP.innerHTML=`<div class="globe emo" style="left:40px;top:34px">🌍</div><div class="p-ttl" style="left:136px;top:52px;font-size:42px">${TX.curTitle}</div>`;
const curHead=[...curP.children];''','''curP.innerHTML=`<div class="globe emo" style="left:40px;top:34px">🌍</div><div class="p-ttl" style="left:136px;top:52px;font-size:48px">${TX.curTitle}</div>`;
const curHead=[...curP.children];
// la explicación vive dentro del panel, como en la app''')
R('const sub4=el("div",null,world,TX.sub4); sub4.id="sub4";','const sub4=el("div",null,curP,TX.sub4); sub4.id="sub4"; sub4.style.left="40px"; sub4.style.top="134px";')

# formularios más grandes (se dibujan a 700 de ancho y se amplían ×1.2)
R('function makeForm(card,{w,h,title,concept,amount,togLabel}){\n  const f=el("div","form",card.el); f.style.width=w+"px"; f.style.height=h+"px";',
  'function makeForm(card,{w,h,title,concept,amount,togLabel,fs=1}){\n  const f=el("div","form",card.el); f.style.width=w+"px"; f.style.height=h+"px"; f.style.transformOrigin="0 0"; f.style.transform=`scale(${fs})`;')
R("card.F={ f, w, h,","card.F={ f, w, h, fs,")
R('makeForm(HERR,{w:900,h:450,title:"Añadir gasto",concept:"Herramientas",amount:"20 €",togLabel:"Gasto recurrente"});',
  'makeForm(HERR,{w:700,h:440,fs:1.2,title:"Añadir gasto",concept:"Herramientas",amount:"20 €",togLabel:"Gasto recurrente"});')
R('makeForm(CA,{w:860,h:420,title:"Añadir ingreso",concept:"Cliente A",amount:"200 €",togLabel:"Ingreso recurrente"});',
  'makeForm(CA,{w:700,h:420,fs:1.2,title:"Añadir ingreso",concept:"Cliente A",amount:"200 €",togLabel:"Ingreso recurrente"});')
R('S(F.f,"left",px((P.w-F.w)/2)); S(F.f,"top",px((P.h-F.h)/2));','S(F.f,"left",px((P.w-F.w*F.fs)/2)); S(F.f,"top",px((P.h-F.h*F.fs)/2));')

# ---------- geometría por escena ----------
R('''  musica:{x:780, y:650, rot:-7, from:[-720,-60], t0:0.34, d:0.62, s0:1.16},  // la primera llega sola y despacio
  series:{x:1140,y:612, rot:6,  from:[760,-90], t0:1.02, d:0.42, s0:1.08},
  gym:   {x:900, y:736, rot:3,  from:[-560,320], t0:1.48, d:0.34, s0:1.1},
  cloud: {x:1180,y:772, rot:-5, from:[620,360], t0:1.63, d:0.3,  s0:1.08},
  herr:  {x:965, y:640, rot:-2, from:[0,-640],  t0:1.8,  d:0.3,  s0:1.22},   // golpe final, encima de todo''',
'''  musica:{x:430, y:700, rot:-6, from:[-760,-120], t0:0.34, d:0.62, s0:1.16},  // la primera llega sola y despacio
  series:{x:600, y:868, rot:5,  from:[760,-40],  t0:1.02, d:0.42, s0:1.08},
  gym:   {x:600, y:1206,rot:3,  from:[-520,560], t0:1.48, d:0.34, s0:1.1},
  cloud: {x:440, y:1372,rot:-4, from:[480,620],  t0:1.63, d:0.3,  s0:1.08},
  herr:  {x:470, y:1036,rot:-2, from:[0,-980],   t0:1.8,  d:0.3,  s0:1.22},   // golpe final, encima de todo''')
R("x+=(p.x-960)*0.012*k;","x+=(p.x-500)*0.03*k;")
R("return {cx:x,cy:y,w:420,h:150,r:28,rot,s:1,o:1,badge:0,lift:0}; };","return {cx:x,cy:y,w:640,h:160,r:30,rot,s:1,o:1,badge:0,lift:0}; };")
R("function slot(i){ const c=i<3?i:i-3, row=i<3?0:1; return {x:SP.x+56+c*464+(row?232:0), y:SP.y+172+row*182, w:440, h:160}; }",
  "function slot(i){ return {x:SP.x+44, y:SP.y+330+i*150, w:SP.w-88, h:138}; }   // lista de arriba abajo")
R("const GHOST = {musica:[300,950,-12], series:[1650,905,10], gym:[150,700,-9], cloud:[1770,640,8]};",
  "const GHOST = {musica:[130,1530,-12], series:[960,1470,10], gym:[90,1760,-9], cloud:[1000,1780,8]};")
R("const ROW = i=>({x:SUMC.x+24, y:SUMC.y+200+i*62, w:SUMC.w-48, h:54});","const ROW = i=>({x:SUMC.x+60, y:SUMC.y+10, w:SUMC.w-120, h:SUMC.h-20});")
R("const ISLOT = i=>({x:IP.x+50+i*340, y:IP.y+300, w:320, h:170});","const ISLOT = i=>({x:IP.x+40, y:IP.y+356+i*172, w:IP.w-80, h:152});")
R("const IFORM = {x:780, y:358, w:860, h:420};","const IFORM = {x:80, y:IP.y+330, w:840, h:504};")
R("const CSLOT = i=>({x:CP.x+40+(i%2)*350, y:CP.y+136+(i>>1)*136, w:330, h:124});","const CSLOT = i=>({x:CP.x+40+(i%2)*390, y:CP.y+272+(i>>1)*206, w:370, h:190});")
R("const CL_SUB = i=>({x:196, y:330+i*72, w:360, h:60});\nconst CL_INC = i=>({x:1364, y:400+i*76, w:360, h:62});",
  "const CL_SUB = i=>({x:96, y:660+i*86, w:396, h:72});\nconst CL_INC = i=>({x:516, y:660+i*86, w:396, h:72});")
R('''  herr:[330,250,138,-8], musica:[176,560,112,6], series:[340,870,124,-5], gym:[640,180,98,7], cloud:[760,938,100,-4],
  a:[1590,250,136,6], b:[1754,560,112,-7], c:[1580,872,124,5], cur:[1290,182,112,-6],''',
'''  herr:[250,340,160,-8], musica:[790,262,132,7], series:[585,470,112,-5], gym:[1000,760,124,6], cloud:[74,1000,124,-6],
  a:[270,1360,146,6], b:[800,1330,128,-7], c:[300,1660,128,5], cur:[740,1640,136,-6],''')
R("const FORM2 = {cx:960, cy:600, w:900, h:450};","const FORM2 = {cx:500, cy:1000, w:840, h:528};")

# escena 2: tamaño de la tarjeta al cerrar el formulario
R("{cx:FORM2.cx,cy:FORM2.cy,w:440,h:160,r:28,rot:0,s:1.08,o:1,badge:1,lift:.5},E.swift(prog(t,6.06,.24)))","{cx:FORM2.cx,cy:FORM2.cy,w:760,h:150,r:30,rot:0,s:1.06,o:1,badge:1,lift:.5},E.swift(prog(t,6.06,.24)))")
R("const R={cx:FORM2.cx,cy:FORM2.cy,w:440,h:160,r:28,rot:0,s:1.08,o:1,badge:1,lift:.5}; P=mixPose(R,SL,E.snap(prog(t,fT,fD)));",
  "const R={cx:FORM2.cx,cy:FORM2.cy,w:760,h:150,r:30,rot:0,s:1.06,o:1,badge:1,lift:.5}; P=mixPose(R,SL,E.snap(prog(t,fT,fD)));")
R("const g=GHOST[d.id], G={cx:g[0],cy:g[1],w:420,h:150,r:28,","const g=GHOST[d.id], G={cx:g[0],cy:g[1],w:640,h:160,r:30,")

# escena 3: las tarjetas se pliegan dentro del resumen compacto (arriba) y desaparecen en él
R('''  const R=ROW(i), RW={cx:R.x+R.w/2, cy:R.y+R.h/2, w:R.w, h:R.h, r:16, rot:0, s:1, o:1, badge:0, miniO:1, lift:0};
  const q3=prog(t,9.0+i*.035,.7); P=mixPose({...SL},RW,E.swift(q3)); P.miniO=clamp((q3-.35)/.35); P.badge=1-clamp(q3*3);
  if(t<14.9) return P;
  // escena 4: sale hacia la izquierda con su panel
  const x4=E.exit(prog(t,14.88+i*.02,.38)); P.cx-=900*x4; if(x4>=1&&t<20.55) return null;
  if(t<20.55) return P;''','''  const R=ROW(i), RW={cx:R.x+R.w/2, cy:R.y+R.h/2, w:R.w, h:R.h, r:24, rot:0, s:.92, o:0, badge:0, miniO:1, lift:0};
  const q3=prog(t,9.0+(4-i)*.045,.62); if(q3>=1&&t<20.55) return null;
  if(t<20.55){ P=mixPose({...SL},RW,E.swift(q3)); P.miniO=clamp((q3-.2)/.3); P.badge=1-clamp(q3*3); P.o=1-clamp((q3-.55)/.4); return P; }''')
R("P=mixPose({...CB,cx:CB.cx-700},CB,E.brake(q5)); P.price=0;","P=mixPose({...CB,cx:CB.cx-620},CB,E.brake(q5)); P.price=0;")
R("P=mixPose({...CB,cx:CB.cx+700},CB,E.brake(q5)); P.price=0;","P=mixPose({...CB,cx:CB.cx+620},CB,E.brake(q5)); P.price=0;")
# panel de suscripciones: se compacta hacia arriba; sale por la izquierda en la escena 4
R("const r=E.snap(prog(t,6.0,.5)); const ins=(1-r)*w/2;\n    S(subP,\"clipPath\",r<1?`inset(0 ${ins.toFixed(1)}px 0 ${ins.toFixed(1)}px round 40px)`:\"none\");",
  "const r=E.snap(prog(t,6.0,.5)); const ins=(1-r)*h/2;   // cajón que se abre de arriba abajo desde el centro\n    S(subP,\"clipPath\",r<1?`inset(${ins.toFixed(1)}px 0 ${ins.toFixed(1)}px 0 round 40px)`:\"none\");")
R('S(SPb.tot.parentElement,"transformOrigin","100% 60%");','S(SPb.tot.parentElement,"transformOrigin","0% 60%");')
R("rect(subP,x-900*ex,y,w,h);","rect(subP,x-1000*ex,y,w,h);")
# ingresos: B entra por la derecha, C en diagonal desde abajo
R("const q=prog(t,t0,dd); P=mixPose({...SL,cx:SL.cx+620,rot:8,lift:.8},SL,E.brake(q)); P.o=clamp(q*5);",
  "const q=prog(t,t0,dd); P=mixPose(d.id===\"b\"?{...SL,cx:SL.cx+760,rot:8,lift:.8}:{...SL,cx:SL.cx+360,cy:SL.cy+520,rot:-7,lift:.8},SL,E.brake(q)); P.o=clamp(q*5);")
# panel de ingresos: la máscara barre de arriba abajo desde el resumen
R('S(incP,"clipPath",r<1?`inset(0 ${((1-r)*w).toFixed(1)}px 0 0 round 40px)`:"none");','S(incP,"clipPath",r<1?`inset(0 0 ${((1-r)*h).toFixed(1)}px 0 round 40px)`:"none");')
R("const ax=sl.x+sl.w-150, ay=sl.y+20, bx=IP.x+60, by=IP.y+180;","const ax=sl.x+sl.w-200, ay=sl.y+20, bx=IP.x+70, by=IP.y+214;")
R("rect(c,x,y,c.offsetWidth||140,52);","rect(c,x,y,c.offsetWidth||160,60);")
R(".chipf{position:absolute;height:52px;padding:0 20px;border-radius:26px;background:#16B47E;color:#fff;font:800 28px/52px var(--ui);",
  ".chipf{position:absolute;height:60px;padding:0 24px;border-radius:30px;background:#16B47E;color:#fff;font:800 34px/60px var(--ui);")
# monedas: la explicación del panel entra después de la cabecera
R("function renderSub4(t){ part(t,sub4,16.35,{dy:24,d:.5,keep:1-E.exit(prog(t,20.3,.25))}); if(t<16.35) hide(sub4); }",
  "function renderSub4(t){ part(t,sub4,15.95,{dy:18,d:.5,keep:1-clamp(E.exit(prog(t,20.52,.2)))}); if(t<15.95) hide(sub4); }")
# MXN en el cierre
R("const tgt={x:960-165,y:686,w:330,h:124};\n    rect(mxChip,lerp(ms.x,tgt.x,q),lerp(ms.y,tgt.y,q),330,124);",
  "const tgt={x:500-185,y:1140,w:370,h:190};\n    rect(mxChip,lerp(ms.x,tgt.x,q),lerp(ms.y,tgt.y,q),370,190);")
R("const a={cx:960,cy:748,w:330,h:116},","const a={cx:500,cy:1235,w:370,h:190},")
# el selector termina de plegarse antes de que entren las filas del cierre
R("ex=E.exit(prog(t,20.52,.32));","ex=E.exit(prog(t,20.38,.3));")
# MXN deja su hueco en cuanto el selector se pliega, antes de que lleguen las filas
R("if(t<21.0||t>22.3){ hide(mxChip); } else {\n    const ms=CSLOT(CONFIG.pick), q=E.swift(prog(t,21.0,.7));","if(t<20.68||t>22.3){ hide(mxChip); } else {\n    const ms=CSLOT(CONFIG.pick), q=E.swift(prog(t,20.68,.5));")
R("if(i===CONFIG.pick && t>=21.0){ hide(c.el); return; }","if(i===CONFIG.pick && t>=20.68){ hide(c.el); return; }")
R("const q5=prog(t,21.0+[0,.06,.11][i],.5);","const q5=prog(t,20.98+[0,.06,.11][i],.5);")
R("const q5=prog(t,20.6+[0,.05,.1,.13,.18][i],.5);","const q5=prog(t,20.72+[0,.05,.1,.13,.18][i],.5);")
R("keep:1-clamp(E.exit(prog(t,20.52,.2)))","keep:1-clamp(E.exit(prog(t,20.36,.18)))")
# cursor (posiciones calculadas a partir de la geometría de cada formulario)
R('''    {t0:4.98,t1:6.1,  pts:[[1560,1010,4.98],[1290,637,5.36],[1290,637,5.5],[1252,751,5.8]], clicks:[5.4,5.84]},
    {t0:10.45,t1:11.2, pts:[[1800,980,10.45],[1520,620,10.8],[1520,620,10.86],[1482,704,11.0]], clicks:[10.8,11.0]},
    {t0:17.3,t1:18.7, pts:[[760,1000,17.3],[1205,500,17.9],[1205,500,18.6]], clicks:[T_PICK]},''',
'''    {t0:4.98,t1:6.1,  pts:[[1010,1820,4.98],[...FP(HERR,FORM2.cx,FORM2.cy,"sw"),5.36],[...FP(HERR,FORM2.cx,FORM2.cy,"sw"),5.5],[...FP(HERR,FORM2.cx,FORM2.cy,"btn"),5.8]], clicks:[5.4,5.84]},
    {t0:10.45,t1:11.2, pts:[[1010,1840,10.45],[...FP(CA,IFORM.x+IFORM.w/2,IFORM.y+IFORM.h/2,"sw"),10.8],[...FP(CA,IFORM.x+IFORM.w/2,IFORM.y+IFORM.h/2,"sw"),10.86],[...FP(CA,IFORM.x+IFORM.w/2,IFORM.y+IFORM.h/2,"btn"),11.0]], clicks:[10.8,11.0]},
    {t0:17.3,t1:18.7, pts:[[180,1820,17.3],[CSLOT(2).x+CSLOT(2).w/2,CSLOT(2).y+CSLOT(2).h/2+10,17.9],[CSLOT(2).x+CSLOT(2).w/2,CSLOT(2).y+CSLOT(2).h/2+10,18.6]], clicks:[T_PICK]},''')
R("function renderCursor(t){",'''// punto de un formulario en coordenadas de escena (interruptor o botón), según su tamaño y escala
function FP(card,cx,cy,what){ const F=card.F, fw=F.w-96; const p= what==="sw" ? [48+fw-24-48, 214+21+27] : [48+fw-110, F.h-112+38];
  return [cx-F.w*F.fs/2+p[0]*F.fs, cy-F.h*F.fs/2+p[1]*F.fs]; }
function renderCursor(t){''')
R('const cursorEl=el("div",null,world,`<svg viewBox="0 0 52 52" width="56" height="56">','const cursorEl=el("div",null,world,`<svg viewBox="0 0 52 52" width="68" height="68">')
R("#cursor{position:absolute;left:0;top:0;width:56px;height:56px;","#cursor{position:absolute;left:0;top:0;width:68px;height:68px;")
R("rect(cursorEl,x-8,y-6,56,56);","rect(cursorEl,x-10,y-7,68,68);")
# cierre
R("part(t,tagEl,22.5,{dy:18,d:.42});","part(t,tagEl,22.5,{dy:22,d:.42});")
R("const s=kf(t,[[12.5,1],[14.8,1.018,E.inOut],[15.3,1,E.inOut]]);","const s=kf(t,[[12.5,1],[14.8,1.015,E.inOut],[15.3,1,E.inOut]]);")
R('CONFIG.scenes','CONFIG.scenes',0)
(root/"src/rumbo-suscripciones-vertical.template.html").write_text(s)
print("ok", len(s))
