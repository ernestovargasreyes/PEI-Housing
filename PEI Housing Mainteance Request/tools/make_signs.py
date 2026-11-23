#!/usr/bin/env python3
"""
Generate print-ready QR signs for Plateau Excavation housing maintenance requests.

One sign per property, each QR encoding a URL that pre-fills that property on the form.
Also emits a sheet of wallet cards per property.

Usage
-----
Sample (placeholder QR, for design review):
    python3 make_signs.py --out signs.html

Real signs, once the form URL exists:
    python3 make_signs.py --out signs.html \
        --base-url "https://forms.example.com/housing" \
        --emergency "(555) 010-0100" \
        --property "Hampton Inn Valdosta=hamp-vald" \
        --property "Riverbend Apartments=river-pc"

Each --property is "Display Name=slug". The slug is appended as ?p=<slug>.
"""
import argparse, html, sys

try:
    import segno
except ImportError:
    sys.exit("segno not installed.  pip3 install segno")

SAMPLE_PAYLOAD = ("SAMPLE SIGN - NOT A WORKING LINK. "
                  "Regenerate with make_signs.py --base-url once the form is live.")


def qr_svg(payload, scale=1):
    """Inline SVG for a QR, sized by CSS rather than by scale."""
    qr = segno.make(payload, error="h")
    return qr.svg_inline(scale=scale, border=2, dark="#000000", light=None)


def sign(prop_name, payload, short_link, emergency, sample):
    badge = ('<p class="sample-badge">SAMPLE QR — not a working link. '
             'Regenerate before printing.</p>') if sample else ""
    return f"""
<section class="sheet sign">
  <header class="sign-top">
    <p class="kicker">Plateau Excavation · Housing</p>
    <h1>Maintenance<br>request</h1>
    <h2 lang="es">Solicitud de<br>mantenimiento</h2>
  </header>

  <p class="prop">{html.escape(prop_name)}</p>

  <div class="qr-wrap">
    <div class="qr">{qr_svg(payload)}</div>
    {badge}
  </div>

  <div class="instructions">
    <p class="scan-en"><b>Scan the code</b> to report a problem in your room.</p>
    <p class="scan-es" lang="es"><b>Escanea el código</b> para reportar un problema en tu habitación.</p>
    <p class="scan-sub">About a minute. No app, no password.<br>
      <span lang="es">Un minuto. Sin aplicación, sin contraseña.</span></p>
    <p class="orlink">or type <span class="mono">{html.escape(short_link)}</span></p>
  </div>

  <div class="emergency">
    <p class="emg-head">EMERGENCY? CALL — DON'T SCAN.<br>
      <span lang="es">¿EMERGENCIA? LLAMA — NO ESCANEES.</span></p>
    <p class="emg-list">No heat or A/C · No water · Flooding · Gas smell · Smoke · No power · Locked out<br>
      <span lang="es">Sin calefacción o A/C · Sin agua · Inundación · Olor a gas · Humo · Sin luz · Encerrado afuera</span></p>
    <p class="emg-num">{html.escape(emergency)}</p>
    <p class="emg-sub">Answered 24 hours · <span lang="es">Contestamos 24 horas</span></p>
  </div>
</section>"""


def card_sheet(prop_name, payload, short_link, emergency, per_sheet=8):
    card = f"""
    <div class="card">
      <div class="card-qr">{qr_svg(payload)}</div>
      <div class="card-text">
        <p class="card-head">Maintenance request<br><span lang="es">Solicitud de mantenimiento</span></p>
        <p class="card-prop">{html.escape(prop_name)}</p>
        <p class="card-link mono">{html.escape(short_link)}</p>
        <p class="card-emg"><b>Emergency / Emergencia:</b><br>{html.escape(emergency)}</p>
      </div>
    </div>"""
    return f"""
<section class="sheet cards">
  <div class="card-grid">{card * per_sheet}</div>
</section>"""


def build(props, base_url, emergency, sample, title):
    blocks = []
    for name, slug in props:
        payload = SAMPLE_PAYLOAD if sample else f"{base_url}?p={slug}"
        short = "(short link here)" if sample else base_url.replace("https://", "")
        blocks.append(sign(name, payload, short, emergency, sample))
        blocks.append(card_sheet(name, payload, short, emergency))
    return TEMPLATE.replace("{{TITLE}}", html.escape(title)).replace("{{BODY}}", "\n".join(blocks))


TEMPLATE = r"""<title>{{TITLE}}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=Source+Sans+3:wght@400;600;700&family=IBM+Plex+Mono:wght@500&display=swap">
<style>
:root{
  --ground:#EFF2F1; --surface:#FFFFFF; --ink:#121E22; --ink-2:#4B5E63; --ink-3:#73878B;
  --line:#D3DCDA; --accent:#0E6B70; --crit:#B3291A;
  --sans:"Source Sans 3",ui-sans-serif,system-ui,sans-serif;
  --display:"Archivo","Source Sans 3",ui-sans-serif,system-ui,sans-serif;
  --mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --ground:#0E1A1D; --ink:#DFE9E8; --ink-2:#9BAEAF; --ink-3:#7A8E90; --line:#2A3C40; --accent:#57B9BC;
}}
:root[data-theme="dark"]{
  --ground:#0E1A1D; --ink:#DFE9E8; --ink-2:#9BAEAF; --ink-3:#7A8E90; --line:#2A3C40; --accent:#57B9BC;
}
*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--ink);font-family:var(--sans);font-size:16px;line-height:1.55}
.page{max-width:9.4in;margin:0 auto;padding:40px 20px 72px}

/* ---- screen-only explainer ---- */
.explain{margin-bottom:34px}
.explain .eyebrow{font-family:var(--mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin:0 0 14px}
.explain h1{font-family:var(--display);font-weight:800;font-size:clamp(1.9rem,4.6vw,2.8rem);letter-spacing:-.025em;line-height:1.04;margin:0 0 14px;max-width:18ch}
.explain p{color:var(--ink-2);max-width:64ch;margin:0 0 12px}
.explain strong{color:var(--ink)}
.explain code{font-family:var(--mono);font-size:.85em;background:var(--surface);border:1px solid var(--line);border-radius:3px;padding:1px 5px;color:var(--ink)}
.notes{border-left:2px solid var(--accent);padding-left:14px;margin-top:22px}
.notes li{color:var(--ink-2);margin-bottom:7px;max-width:62ch}
.notes b{color:var(--ink)}

/* ---- the sheets: always paper-white, this is a physical object ---- */
.sheet{
  width:8.5in;min-height:11in;background:#FFFFFF;color:#000000;
  margin:0 auto 28px;padding:0.55in 0.6in;
  border:1px solid var(--line);border-radius:3px;
  box-shadow:0 2px 18px rgba(0,0,0,.09);
  display:flex;flex-direction:column;
}
.sign{text-align:center}
.sign-top .kicker{font-family:var(--mono);font-size:12.5px;letter-spacing:.2em;text-transform:uppercase;color:#4A4A4A;margin:0 0 14px}
.sign h1{font-family:var(--display);font-weight:800;font-size:62px;line-height:.96;letter-spacing:-.03em;margin:0;color:#000}
.sign h2{font-family:var(--display);font-weight:600;font-size:31px;line-height:1.04;letter-spacing:-.015em;margin:10px 0 0;color:#5A5A5A}
.prop{font-family:var(--display);font-weight:600;font-size:23px;margin:20px 0 0;padding:9px 0;border-top:2px solid #000;border-bottom:2px solid #000;color:#000}

.qr-wrap{margin:26px 0 20px}
.qr{width:3.3in;height:3.3in;margin:0 auto}
.qr svg{width:100%;height:100%;display:block}
.sample-badge{font-family:var(--mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#B3291A;border:1.5px dashed #B3291A;border-radius:3px;padding:6px 10px;margin:14px auto 0;max-width:4.6in}

.instructions{margin-bottom:auto}
.scan-en{font-size:25px;margin:0;color:#000;line-height:1.25}
.scan-es{font-size:21px;margin:5px 0 0;color:#4A4A4A;line-height:1.25}
.scan-sub{font-size:16px;margin:14px 0 0;color:#4A4A4A;line-height:1.4}
.orlink{font-size:15px;margin:16px 0 0;color:#4A4A4A}
.orlink .mono{font-family:var(--mono);font-size:15px;color:#000;border-bottom:1.5px solid #000;padding-bottom:1px}

/* Emergency block: readable in black and white, not reliant on the red */
.emergency{border:4px solid #000;border-radius:4px;padding:16px 18px;margin-top:26px;background:#fff}
.emg-head{font-family:var(--display);font-weight:800;font-size:25px;line-height:1.16;margin:0;color:#B3291A;letter-spacing:-.01em}
.emg-head span{font-weight:600;font-size:20px;color:#000}
.emg-list{font-size:13.5px;line-height:1.45;margin:11px 0 0;color:#000}
.emg-list span{color:#4A4A4A}
.emg-num{font-family:var(--display);font-weight:800;font-size:47px;letter-spacing:-.02em;margin:10px 0 0;color:#000}
.emg-sub{font-family:var(--mono);font-size:12px;letter-spacing:.1em;text-transform:uppercase;margin:4px 0 0;color:#4A4A4A}

/* ---- wallet cards ---- */
.cards{justify-content:flex-start}
.card-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;width:100%}
.card{
  display:flex;gap:11px;align-items:center;
  border:1px dashed #9A9A9A;padding:13px;height:2.35in;
}
.card-qr{width:1.5in;height:1.5in;flex:none}
.card-qr svg{width:100%;height:100%;display:block}
.card-text{min-width:0}
.card-head{font-family:var(--display);font-weight:700;font-size:14px;line-height:1.2;margin:0;color:#000}
.card-head span{font-weight:500;font-size:12px;color:#5A5A5A}
.card-prop{font-size:12px;margin:5px 0 0;color:#000;font-weight:600}
.card-link{font-size:10.5px;margin:3px 0 0;color:#4A4A4A;word-break:break-all}
.card-emg{font-size:11.5px;line-height:1.3;margin:7px 0 0;color:#B3291A}
.card-emg b{color:#000}
.mono{font-family:var(--mono)}

@media print{
  body{background:#fff}
  .page{max-width:none;padding:0}
  .explain{display:none}
  .sheet{margin:0;border:none;border-radius:0;box-shadow:none;page-break-after:always;width:100%;min-height:auto;height:10.6in}
}
@page{size:letter portrait;margin:0.4in}
@media (max-width:9in){
  .sheet{width:100%;padding:28px 22px;min-height:0}
  .sign h1{font-size:44px}.sign h2{font-size:24px}
  .qr{width:2.6in;height:2.6in}
  .emg-num{font-size:36px}.emg-head{font-size:20px}
  .card-grid{grid-template-columns:1fr}
}
</style>

<div class="page">
<div class="explain">
  <p class="eyebrow">Plateau Excavation · Housing · print template</p>
  <h1>QR sign for the hotels</h1>
  <p>One sign per property, each code pre-filling that property on the form so a worker only
  types their room number. Print on letter, post where the hotel allows it — the crew
  breakfast area and the laundry room work better than the lobby, which most hotels won't
  give you.</p>
  <p>A second sheet of <strong>wallet cards</strong> follows each sign. Those matter more than the
  poster: a card in someone's truck or hard hat works at 9pm from a job site, and a sign on a
  wall only works while standing in front of it.</p>
  <ul class="notes">
    <li><b>The emergency number is the point of the bottom block.</b> A worker with a gas leak
    standing at this sign needs a phone number, not a QR code — so it's the largest thing on
    the page after the code itself, and it's framed in black so it survives a black-and-white
    photocopy.</li>
    <li><b>Bilingual throughout.</b> This is the one surface where it costs almost nothing, and
    a sign nobody can read fast is a sign nobody uses. Confirm the Spanish with a native
    speaker before printing.</li>
    <li><b>Regenerate before printing.</b> Run
    <code>make_signs.py --base-url "&lt;form url&gt;" --property "Name=slug"</code> once the form
    is live. The QR below encodes a placeholder, on purpose.</li>
    <li><b>Ask the hotel first.</b> Posting without asking gets it taken down and sours a
    relationship Tonya needs. A GM who's been asked usually says yes to the breakfast room.</li>
  </ul>
</div>
{{BODY}}
</div>"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--base-url", default=None, help="Form URL. Omitted = sample mode.")
    ap.add_argument("--emergency", default="(XXX) XXX-XXXX")
    ap.add_argument("--property", action="append", default=[], metavar="NAME=SLUG")
    ap.add_argument("--title", default="Housing QR Sign")
    a = ap.parse_args()

    sample = a.base_url is None
    props = []
    for p in a.property:
        name, _, slug = p.partition("=")
        props.append((name.strip(), (slug or name).strip()))
    if not props:
        props = [("[ Property name goes here ]", "sample")]

    with open(a.out, "w", encoding="utf-8") as fh:
        fh.write(build(props, a.base_url, a.emergency, sample, a.title))
    print(f"wrote {a.out}  ({len(props)} propert{'y' if len(props)==1 else 'ies'}, "
          f"{'SAMPLE' if sample else 'live'} mode)")


if __name__ == "__main__":
    main()
