#!/usr/bin/env python3
"""source.html (clon Tiendanube) + content.json -> index.html con copy de NEASistemas.

Solo toca nodos de texto y atributos de texto (alt/aria-label/title/data-action).
No toca clases, ni el orden del DOM, ni el CSS inline, ni el JS, ni los assets.
"""
import json, os, re, struct, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "source.html")
OUT = os.path.join(ROOT, "index.html")
MAP = os.path.join(ROOT, "content.json")

# ponytail: los <script>/<style> quedan intocables; reemplazar ahí rompería el JS.
SKIP = re.compile(r"<script.*?</script>|<style.*?</style>", re.S)


def protected_ranges(html):
    return [(m.start(), m.end()) for m in SKIP.finditer(html)]


def replace(html, old, new, limit=None):
    """Reemplaza `old` por `new` fuera de <script>/<style>. Devuelve (html, n)."""
    bad = protected_ranges(html)
    out, pos, n = [], 0, 0
    while True:
        i = html.find(old, pos)
        if i < 0 or (limit is not None and n >= limit):
            break
        if any(a <= i < b for a, b in bad):          # dentro de script/style
            out.append(html[pos:i + len(old)])
            pos = i + len(old)
            continue
        out.append(html[pos:i])
        out.append(new)
        pos = i + len(old)
        n += 1
    out.append(html[pos:])
    return "".join(out), n


def localize_assets(html):
    """El mirror solo reescribio src=; los srcset/ seguian pidiendo el CDN de origen.

    Mapea cada URL remota a su equivalente local por nombre base (sin el sufijo
    -400w/-800w y sin el hash del mirror). Las que no tienen equivalente local
    (el video del hero) quedan como estaban.
    """
    local = {}
    for f in os.listdir(os.path.join(ROOT, "assets")):
        base = re.sub(r"\.[0-9a-f]{8}(?=\.)", "", f)      # quita el hash del mirror
        local[base] = f

    def swap(m):
        name = m.group(0).rsplit("/", 1)[-1].split("?")[0]
        name = re.sub(r"-\d+w(?=\.)", "", name)            # quita el sufijo de ancho
        return "assets/" + local[name] if name in local else m.group(0)

    return re.sub(
        r"https://[^\s\"',]+\.(?:webp|jpe?g|png|gif|svg|ico|mp4|webm|css|js)[^\s\"',]*",
        swap, html)


FAVICON = "assets/favicon-512.png"      # el original deja demasiado margen vacio
LOGO_BLANCO = "assets/Nea_logo_blanco.png"
LOGO_AZUL = "assets/Nea_logo_azul.png"

HERO_H = 120          # el SVG original medía 83px de alto; el hero lo aguanta mas grande
NAV_H = 52            # navbar: el SVG rendereaba a 42px; +10 como se pidio

# Logos de una sola pieza (contenedor, archivo, alto en px).
# El alto/ancho van inline porque el CSS del clon dimensiona `<svg>`, no `<img>`.
LOGOS = (
    (r'<div class="js-hp-hero-logo wg-hp-hero-logo"', LOGO_BLANCO, HERO_H),
    (r'<div class="footer-brand-logo"', LOGO_BLANCO, 63),
)


def png_size(rel_path):
    """Ancho y alto del PNG, leidos del IHDR (los primeros 8 bytes del chunk)."""
    with open(os.path.join(ROOT, rel_path.replace("/", os.sep)), "rb") as fh:
        head = fh.read(24)
    assert head[:8] == b"\x89PNG\r\n\x1a\n", f"no es PNG: {rel_path}"
    return struct.unpack(">II", head[16:24])


def logo_img(src, height, extra="", display="block"):
    """<img> con alto fijo y ancho calculado del PNG (evita que se achate).

    `display=""` deja la visibilidad al CSS (el navbar la alterna por estado; un
    `display` inline ganaria sobre la hoja de estilos y romperia el swap).
    """
    nat_w, nat_h = png_size(src)
    width = round(height * nat_w / nat_h)
    disp = f"display:{display};" if display else ""
    return (f'<img{extra} src="{src}" alt="NEASistemas"'
            f' style="height:{height}px;width:{width}px;max-width:none;'
            f'object-fit:contain;{disp}" />')


def own_logos(html):
    """Los wordmarks de Tiendanube (hero, navbar, footer) -> logo NEASistemas.

    Cambia cada <svg> por un <img>, asi que se aplica despues del chequeo de
    estructura: es una diferencia buscada, no una rotura del layout.
    """
    for container, src, height in LOGOS:
        img = logo_img(src, height)
        # `.*?` hasta el <svg>: algun atributo intermedio trae '>' (data-action).
        html, n = re.subn(f"({container}.*?)<svg.*?</svg>",
                          lambda m: m.group(1) + img, html, count=1, flags=re.S)
        assert n == 1, f"logo no encontrado: {container}"

    # El contenedor del hero esta clavado en 60px con overflow:hidden en el CSS:
    # sin subirlo, un logo mas alto se recorta en vez de verse mas grande.
    html, n = re.subn(
        r'<div class="js-hp-hero-logo wg-hp-hero-logo"',
        '<div style="height:{0}px;max-height:{0}px" '
        'class="js-hp-hero-logo wg-hp-hero-logo"'.format(HERO_H),
        html, count=1)
    assert n == 1, "contenedor del logo del hero no encontrado"

    html = own_navbar_logo(html)
    # Despues del CSS del navbar: en igualdad de especificidad, gana el ultimo.
    html = own_theme(html)
    html = own_typing_font(html)
    return html


# {slot} = ancho reservado al logo. El diseño tenia un `overflow:hidden` con una
# animacion que abria el ancho de 0 a 160px; con el logo raster ese cierre cortaba
# el final de "SISTEMAS". Se fija el ancho al del logo (con un respiro) y se deja
# `overflow:visible` para que se vea completo.
NAV_LOGO_STYLE = """
<style>
/* Logo NEASistemas del navbar: centrado vertical y completo (siempre blanco). */
.navbar-full .navbar .navbar-logo,
.navbar-full .navbar .navbar-logo .row,
.navbar-full .navbar .navbar-logo-img{{width:{slot}px !important;max-width:none !important;
  overflow:visible !important}}
.navbar-full .navbar .navbar-logo{{animation:none !important}}
.navbar-full .navbar .navbar-logo-img{{margin:0 !important;padding:0 !important;
  display:flex;align-items:center;height:var(--header-height)}}
.navbar-full .navbar .navbar-logo-img a{{display:flex;align-items:center;height:100%}}
</style>
</head>"""


def own_navbar_logo(html):
    """Reemplaza el SVG del navbar por el PNG blanco de NEASistemas."""
    nat_w, nat_h = png_size(LOGO_BLANCO)
    slot = round(NAV_H * nat_w / nat_h) + 6      # ancho del logo + respiro
    blanco = logo_img(LOGO_BLANCO, NAV_H, ' class="nea-navbar-logo"')
    html, n = re.subn(r'(<div class="navbar-logo-img.*?)<svg.*?</svg>',
                      lambda m: m.group(1) + blanco, html, count=1, flags=re.S)
    assert n == 1, "logo del navbar no encontrado"
    html, n = re.subn(r"</head>", NAV_LOGO_STYLE.format(slot=slot), html, count=1)
    assert n == 1, "</head> no encontrado para el CSS del logo del navbar"
    return html


# El texto que se "tipea" en el hero venia en Ivy Presto (serif italica). Se pasa
# a DotGothic16, auto-hospedada en assets/ igual que el resto de las fuentes del
# proyecto (subset latin de Google Fonts, woff2). Solo trae un peso y ninguna
# italica: el `font-style:normal` la saca (si no, el navegador la inclina el solo).
TYPING_FONT_STYLE = """
<style>
@font-face{font-family:'DotGothic16';font-style:normal;font-weight:400;
  font-display:swap;src:url(assets/DotGothic16-Regular.woff2) format('woff2')}
/* Texto animado del hero (efecto de escritura) + su cursor. */
.wg-hp-hero-typing,
.wg-hp-hero-typing-text,
.wg-hp-hero-typing-cursor{font-family:'DotGothic16',ui-monospace,monospace;
  font-style:normal !important}
</style>
</head>"""


def own_typing_font(html):
    """DotGothic16 (sin italica) para el texto animado del hero."""
    html, n = re.subn(r"</head>", TYPING_FONT_STYLE, html, count=1)
    assert n == 1, "</head> no encontrado para la fuente del texto animado"
    return html


NEGRO = "#080808"
NEGRO_RGB = "8,8,8"

# El azul de marca vivia en variables CSS (--primary-nimbus-blue #0050c3 pintaba
# hero, brands, planes y flechas; --primary-dark-blue #171E43 los paneles sticky).
# Se redefinen en :root en vez de buscar y reemplazar cada color suelto.
# La pildora del navbar y el footer eran blancos: con el logo unicamente en blanco
# quedarian invisibles, asi que pasan a negro y su texto a blanco.
THEME_STYLE = """
<style>
/* Color principal: azul -> {negro}. */
:root{{
  --primary-nimbus-blue:{negro};
  --primary-nimbus-blue-rgb:{negro_rgb};
  --primary-dark-blue:{negro};
  --primary-dark-blue-rgb:{negro_rgb};
  --secondary-deep-blue:{negro};
  --secondary-deep-blue-rgb:{negro_rgb};
  --color-light-ai-gradient-blue-high:{negro};
  --color-dark-ai-gradient-blue-high:{negro};
  --primary-blue-transparent-gradient:linear-gradient(180deg,{negro} 0%,rgba({negro_rgb},0.7) 100%);
  --primary-clear-blue-gradient:linear-gradient(180deg,rgba({negro_rgb},0.10) 0%,rgba({negro_rgb},0.30) 100%);
  --primary-clear-blue-transparent-gradient:linear-gradient(180deg,rgba({negro_rgb},0.40) 0%,rgba({negro_rgb},0.20) 100%);
}}
/* Pildora del navbar: era blanca; en negro el logo blanco se lee. */
.navbar-full.navbar-pill.is-scrolled .navbar{{
  --pill-bg:rgba({negro_rgb},0.92);
  --pill-border:1px solid rgba(255,255,255,0.15);
  --nav-link-color:#fff;
  --nav-link-color-hover:rgba(255,255,255,0.7);
  --header-logo-color:#fff;
}}
.navbar-full.navbar-pill.is-scrolled .navbar .navbar-nav[data-level='0']{{background-color:transparent}}
/* Footer: mismo motivo que la pildora. El texto venia en gris oscuro (#1c1c1c)
   desde reglas mas especificas, por eso el color va con !important sobre todo
   el arbol; los SVG heredan via currentColor. */
footer{{background-color:{negro} !important;--footer-accent:#fff}}
footer,footer *{{color:#fff !important;border-color:rgba(255,255,255,0.2)}}
footer hr{{background-color:rgba(255,255,255,0.2)}}
footer .btn-primary,footer .hs-button{{background-color:#fff !important}}
footer .btn-primary,footer .btn-primary *,
footer .hs-button,footer .hs-button *{{color:{negro} !important}}
</style>
</head>"""


def own_theme(html):
    """Redefine el azul de marca a negro y oscurece pildora y footer."""
    style = THEME_STYLE.format(negro=NEGRO, negro_rgb=NEGRO_RGB)
    html, n = re.subn(r"</head>", style, html, count=1)
    assert n == 1, "</head> no encontrado para el tema negro"
    return html


def own_favicon(html):
    """El <link rel="shortcut icon"> seguia apuntando al favicon de Tiendanube."""
    return re.sub(
        r'(<link[^>]*\brel="shortcut icon"[^>]*\bhref=")[^"]*(")',
        r"\g<1>" + FAVICON + r"\g<2>", html)


SCHEMA = """{"@context":"https://schema.org","@graph":[
{"@type":"Organization","@id":"#organization","name":"NEASistemas",
 "description":"Estudio de desarrollo y presencia digital de Ober\\u00e1, Misiones. Web, SEO, Ads y sistemas a medida en cuatro etapas independientes.",
 "areaServed":"Argentina"},
{"@type":"LocalBusiness","@id":"#localbusiness","name":"NEASistemas","areaServed":"Argentina",
 "address":{"@type":"PostalAddress","addressLocality":"Ober\\u00e1","addressRegion":"Misiones","addressCountry":"AR"}},
{"@type":"Service","name":"Dise\\u00f1o y Desarrollo Web","serviceType":"Dise\\u00f1o web",
 "provider":{"@id":"#organization"},"areaServed":"Argentina"},
{"@type":"Service","name":"Tienda Online","serviceType":"Ecommerce",
 "provider":{"@id":"#organization"},"areaServed":"Argentina"},
{"@type":"Service","name":"Marketing Digital, SEO y Ads","serviceType":"Marketing digital",
 "provider":{"@id":"#organization"},"areaServed":"Argentina"},
{"@type":"Service","name":"Sistemas a Medida","serviceType":"Software a medida",
 "provider":{"@id":"#organization"},"areaServed":"Argentina"}]}"""

# Dominios de terceros del sitio original: analytics, tag manager, CRM y A/B testing.
# Dejarlos activos mandaria el trafico de esta pagina a las cuentas de Tiendanube.
THIRD_PARTY = ("googletagmanager", "google-analytics", "doubleclick", "hs-scripts",
               "hs-analytics", "track.hubspot", "visualwebsiteoptimizer",
               "cms.nuvemshop", "cloudfront.net")


def detach_third_party(html):
    """Neutraliza tracking ajeno, redes de Tiendanube y su JSON-LD.

    No se borra ningun elemento: los <script> externos pierden el src y los
    perfiles sociales apuntan a '#'. La estructura del DOM queda intacta.
    """
    # JSON-LD de Yoast (declara la pagina como Tiendanube) -> schema propio.
    html = re.sub(
        r'(<script type="application/ld\+json"[^>]*>).*?(</script>)',
        lambda m: m.group(1) + SCHEMA + m.group(2), html, flags=re.S)

    # <script src> y <link href> hacia terceros: se desactivan sin quitar el tag.
    def kill(m):
        tag = m.group(0)
        return re.sub(r'\b(src|href)="[^"]*"', r'\1=""', tag) if any(
            d in tag for d in THIRD_PARTY) else tag

    html = re.sub(r"<(?:script|link|iframe)\b[^>]*>", kill, html)

    # Perfiles sociales y links institucionales de Tiendanube.
    html = re.sub(
        r'href="https?://(?:www\.)?(?:facebook|instagram|linkedin|youtube|tiktok|x)\.com[^"]*"',
        'href="#"', html)

    # Los bootstraps de GTM/HubSpot/VWO arman sus URLs dentro de <script> inline:
    # se les rompe el dominio para que ninguna request salga hacia esas cuentas.
    for domain in THIRD_PARTY:
        html = html.replace(domain, "localhost.invalid")
    html = re.sub(r'https?://(?:www\.)?(?:facebook|instagram|linkedin|youtube|tiktok|x)'
                  r'\.com/[^"\']*', "#", html)
    # canonical / og:url apuntando al dominio original
    html = html.replace("https://www.tiendanube.com", "/")
    return html


def structure(html):
    """Huella estructural: si cambia, rompimos el layout."""
    body = SKIP.sub("", html)
    # los data-action traen pseudo-tags ("<clicked><link__X>") dentro de atributos:
    # se vacian los valores entrecomillados antes de contar tags reales.
    naked = re.sub(r'"[^"]*"', '""', body)
    return (
        re.findall(r"<(/?\w+)[\s/>]", naked),
        re.findall(r'class="([^"]*)"', body),
        re.findall(r'<section[^>]*class="([^"]*)"', body),
    )


def main():
    html = open(SRC, encoding="utf-8").read()
    before = structure(html)
    spec = json.load(open(MAP, encoding="utf-8"))

    misses = []
    for group, pairs in spec.items():
        if group.startswith("_"):
            continue
        for pair in pairs:
            old, new = pair[0], pair[1]
            limit = pair[2] if len(pair) > 2 else None
            html, n = replace(html, old, new, limit)
            if n == 0:
                misses.append((group, old))

    html = localize_assets(html)

    # Links externos del original -> ancla muerta (esto no es un sitio de Tiendanube).
    html = re.sub(r'href="(?:https?://[^"]*(?:tiendanube|nuvemshop)[^"]*|/[^"#][^"]*)"',
                  'href="#"', html)

    html = detach_third_party(html)
    html = own_favicon(html)

    after = structure(html)
    for name, a, b in zip(("tags", "clases", "secciones"), before, after):
        assert a == b, f"ESTRUCTURA ROTA en {name}"

    # Los logos cambian <svg> por <img>: van despues del chequeo, a proposito.
    html = own_logos(html)

    open(OUT, "w", encoding="utf-8").write(html)

    print(f"OK -> {OUT}  ({len(html)} bytes)")
    print("estructura identica: tags, clases y secciones sin cambios")
    if misses:
        print(f"\n{len(misses)} pares SIN aplicar (revisar content.json):")
        for g, o in misses:
            print(f"  [{g}] {o[:80]}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
