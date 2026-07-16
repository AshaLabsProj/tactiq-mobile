from pathlib import Path
from PIL import Image

PROJECT = Path("/home/ubuntu/tactiq-mobile")
SOURCE = Path("/home/ubuntu/webdev-static-assets/tactiq-coach-icon.png")
TARGETS = {
    PROJECT / "assets/images/icon.png": 1024,
    PROJECT / "assets/images/splash-icon.png": 1024,
    PROJECT / "assets/images/favicon.png": 512,
    PROJECT / "assets/images/android-icon-foreground.png": 1024,
}

with Image.open(SOURCE) as source:
    source = source.convert("RGB")
    for target, size in TARGETS.items():
        image = source.resize((size, size), Image.Resampling.LANCZOS)
        image.save(target, format="PNG", optimize=True, compress_level=9)
        print(f"{target.name}: {target.stat().st_size} bytes")
