from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"


def make_icon(size: int, output: str, *, maskable: bool = False) -> None:
    background = "#0B3D2E" if maskable else "#FFFFFF"
    image = Image.new("RGB", (size, size), background)
    draw = ImageDraw.Draw(image)

    # The logo's bar-and-arrow mark, centered with a larger safe zone for
    # maskable launchers. Coordinates are proportional for crisp rerenders.
    inset = size * (0.24 if maskable else 0.16)
    left = inset
    right = size - inset
    top = size * 0.28
    bar_height = size * 0.085
    gap = size * 0.075
    radius = int(bar_height / 2)
    start_color = (110, 231, 183) if maskable else (11, 61, 46)
    end_color = (52, 211, 153) if maskable else (46, 204, 113)

    gradient = Image.new("RGB", (size, size), start_color)
    pixels = gradient.load()
    for x in range(size):
        ratio = x / max(size - 1, 1)
        color = tuple(round(a + (b - a) * ratio) for a, b in zip(start_color, end_color))
        for y in range(size):
            pixels[x, y] = color

    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    widths = (0.58, 0.78)
    for index, width in enumerate(widths):
        y = top + index * (bar_height + gap)
        mask_draw.rounded_rectangle(
            (left, y, left + (right - left) * width, y + bar_height),
            radius=radius,
            fill=255,
        )

    y = top + 2 * (bar_height + gap)
    arrow_body_right = right - size * 0.09
    mask_draw.rounded_rectangle(
        (left, y, arrow_body_right, y + bar_height), radius=radius, fill=255
    )
    mask_draw.polygon(
        [
            (arrow_body_right - radius, y),
            (right, y + bar_height / 2),
            (arrow_body_right - radius, y + bar_height),
        ],
        fill=255,
    )

    image.paste(gradient, mask=mask)

    image.save(PUBLIC / output, "PNG", optimize=True)


make_icon(192, "icon-192.png")
make_icon(512, "icon-512.png")
make_icon(512, "icon-maskable-512.png", maskable=True)
make_icon(180, "apple-touch-icon.png")
