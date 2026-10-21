"""
Build responsive mock media from the supplied production imagery (docs/PW-images).

In production, Laravel uploads originals to Cloudinary and returns transformation
URLs (f_auto,q_auto,w_<n>). For local/mock mode we pre-render equivalent variants
so the frontend's <picture>/srcset logic is exercised against realistic assets:

    public/media/mock/<slug>-<width>.avif
    public/media/mock/<slug>-<width>.webp
    public/media/mock/<slug>-<width>.jpg

It also writes src/mocks/media.manifest.json (slug -> width/height/widths) which the
mock API uses to emit contract-accurate MediaAsset payloads.

Usage:  python scripts/build-mock-media.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "docs" / "PW-images"
OUT = ROOT / "public" / "media" / "mock"
MANIFEST = ROOT / "src" / "mocks" / "media.manifest.json"

PRODUCT_WIDTHS = [320, 640, 960, 1440]
HERO_WIDTHS = [640, 960, 1440, 1920, 2560]

# source filename -> (slug, alt text, kind)
SOURCES: dict[str, tuple[str, str, str]] = {
    "ANR-headset.png": ("bose-a20", "Bose A20 aviation headset with dual GA plugs on a light surface", "product"),
    "p-3.png": ("lightspeed-zulu-3", "Lightspeed Zulu 3 ANR headset with bronze ear cups", "product"),
    "p-4.png": ("david-clark-h10", "David Clark H10-13.4 passive headset", "product"),
    "p-9.png": ("david-clark-onex", "David Clark ONE-X ENC headset", "product"),
    "p-5.png": ("randolph-aviator", "Black aviator sunglasses with green lenses", "product"),
    "p-6.png": ("uniform-shirt", "White pilot uniform shirt with four-bar epaulettes and black tie", "product"),
    "p-0.png": ("captain-jacket", "Navy double-breasted captain's uniform jacket with gold sleeve stripes", "product"),
    "p-7.png": ("jeppesen-flight-bag", "Black Jeppesen Captain flight bag", "product"),
    "p-8.png": ("altimeter-smartwatch", "Altimeter smartwatch with mesh strap", "product"),
    "p-1.png": ("pilot-chronograph", "Stainless steel pilot chronograph watch with blue dial", "product"),
    "p-2.png": ("leg-kneeboard", "Black leg-strap kneeboard", "product"),
    "aviation-kneeboard.png": ("tri-fold-kneeboard", "Tri-fold aviation kneeboard with checklist clip", "product"),
    "tablet-kneeboard.png": ("tablet-kneeboard", "iPad kneeboard with moving map and leather checklist folio", "product"),
    "E6B-flight-computer.png": ("e6b-flight-computer", "E6B circular flight computer on a black pad", "product"),
    "handheld-aviation-GPS.png": ("garmin-handheld-gps", "Garmin handheld aviation GPS with moving map", "product"),
    "Aircraft-Communication-Radio.png": ("com-radio", "Panel-mount aircraft communication radio with handheld mic", "product"),
    "Portable-oxygen.png": ("portable-oxygen", "Portable aviation oxygen cylinder in carry case with mask", "product"),
    "fuel-tester.png": ("fuel-tester", "Aviation fuel sampler tester on a cockpit glare shield", "product"),
    "pilot-flight-bag.png": ("pilot-flight-bag", "Black pilot flight bag with wings emblem", "product"),
    "black power-bank.png": ("power-bank-black", "Black 4-port USB power bank", "product"),
    "Portable-Power-Bank.png": ("power-bank-desk", "Portable power bank charging a phone on a desk", "product"),
    "action-camera.png": ("action-camera", "GoPro-style action camera on a mount", "product"),
    "Canon-EOS-90D-DSLR-camera.png": ("canon-eos-90d", "Canon EOS 90D DSLR camera with zoom lens", "product"),
    "Compact -Drone.png": ("compact-drone", "Compact folding drone with controller", "product"),
    "Digital-multimeter.png": ("digital-multimeter", "Digital multimeter testing avionics wiring", "product"),
    "Im-1.png": ("photo-santorini-rollout", "Airliner rolling out beneath a mountain on Santorini", "photo"),
    "Im-2.png": ("photo-wing-view", "View over a light aircraft wing above snowy terrain", "photo"),
    "Im-3.png": ("photo-warbird-formation", "Black-and-white warbird formation trailing smoke", "photo"),
    "Im-4.png": ("photo-gate-sunset", "Airliner nose at the gate during a dramatic sunset", "photo"),
    "Im-5.png": ("photo-formation-pair", "Two light aircraft flying in formation at dusk", "photo"),
    "cockpit.png": ("hero-cockpit", "Pilot's lap in a light-aircraft cockpit with headset and iPad kneeboard", "hero"),
}


def flatten(im: Image.Image) -> Image.Image:
    """Composite transparency onto the design's product-card surface colour."""
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        bg = Image.new("RGBA", im.size, (245, 246, 249, 255))  # --pw-surface-sunken #f5f6f9
        bg.alpha_composite(im)
        return bg.convert("RGB")
    return im.convert("RGB")


def edge_colour(im: Image.Image) -> str:
    """Median colour of the outermost pixels — the frame fill when a product shot is
    letterboxed (`placeholder` in the MediaAsset contract)."""
    rgb = im.convert("RGB")
    w, h = rgb.size
    px = [rgb.getpixel((x, y)) for x in range(w) for y in (0, h - 1)] + [rgb.getpixel((x, y)) for y in range(h) for x in (0, w - 1)]
    channels = [sorted(c[i] for c in px)[len(px) // 2] for i in range(3)]
    return "#{:02x}{:02x}{:02x}".format(*channels)


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, dict[str, object]] = {}
    for filename, (slug, alt, kind) in SOURCES.items():
        path = SRC / filename
        if not path.exists():
            print(f"skip (missing): {filename}", file=sys.stderr)
            continue
        im = flatten(Image.open(path))
        widths_target = HERO_WIDTHS if kind == "hero" else PRODUCT_WIDTHS
        widths = sorted({min(w, im.width) for w in widths_target})
        for w in widths:
            h = round(im.height * w / im.width)
            resized = im.resize((w, h), Image.LANCZOS)
            resized.save(OUT / f"{slug}-{w}.avif", quality=55)
            resized.save(OUT / f"{slug}-{w}.webp", quality=78, method=6)
            resized.save(OUT / f"{slug}-{w}.jpg", quality=80, optimize=True, progressive=True)
        manifest[slug] = {
            "width": im.width,
            "height": im.height,
            "widths": widths,
            "alt": alt,
            "kind": kind,
            "edge": edge_colour(im),
        }
        print(f"{slug}: {im.width}x{im.height} -> {widths}")
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {MANIFEST.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
