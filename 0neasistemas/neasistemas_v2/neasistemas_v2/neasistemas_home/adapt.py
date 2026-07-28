#!/usr/bin/env python3
"""source.html (clon Tiendanube) + content.json -> index.html con copy de NEASistemas.

Solo toca nodos de texto y atributos de texto (alt/aria-label/title/data-action).
No toca clases, ni el orden del DOM, ni el CSS inline, ni el JS, ni los assets.
"""
import json, os, re, sys

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

    after = structure(html)
    for name, a, b in zip(("tags", "clases", "secciones"), before, after):
        assert a == b, f"ESTRUCTURA ROTA en {name}"

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
