from __future__ import annotations

from pathlib import Path
from typing import Iterable, Tuple

from PIL import Image, ImageDraw, ImageFont


CANVAS_W = 2100
CANVAS_H = 1200
BG_COLOR = "#F5F7FB"
TEXT_DARK = "#1F2937"
TEXT_MUTED = "#4B5563"
CARD_BG = "#FFFFFF"
SHADOW = "#D7DEE9"
LINE_COLOR = "#5A6C84"

OUT_PATH = Path(__file__).resolve().parents[2] / "docs" / "architecture" / "eventzen-high-level-architecture.png"


def get_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = []
    if bold:
        candidates = [
            Path("C:/Windows/Fonts/segoeuib.ttf"),
            Path("C:/Windows/Fonts/arialbd.ttf"),
        ]
    else:
        candidates = [
            Path("C:/Windows/Fonts/segoeui.ttf"),
            Path("C:/Windows/Fonts/arial.ttf"),
        ]

    for font_path in candidates:
        if font_path.exists():
            return ImageFont.truetype(str(font_path), size=size)
    return ImageFont.load_default()


def draw_shadowed_card(
    draw: ImageDraw.ImageDraw,
    x: int,
    y: int,
    w: int,
    h: int,
    top_color: str,
    radius: int = 14,
) -> None:
    draw.rounded_rectangle((x + 4, y + 6, x + w + 4, y + h + 6), radius=radius, fill=SHADOW)
    draw.rounded_rectangle((x, y, x + w, y + h), radius=radius, fill=CARD_BG, outline="#D8DEE9", width=1)
    draw.rounded_rectangle((x, y, x + w, y + 11), radius=radius, fill=top_color)
    draw.rectangle((x, y + 7, x + w, y + 11), fill=top_color)


def text_center(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, center_x: int, y: int, fill: str) -> None:
    bbox = draw.textbbox((0, 0), text, font=font)
    width = bbox[2] - bbox[0]
    draw.text((center_x - width // 2, y), text, font=font, fill=fill)


def text_center_fit(
    draw: ImageDraw.ImageDraw,
    text: str,
    center_x: int,
    y: int,
    max_width: int,
    start_size: int,
    min_size: int,
    bold: bool,
    fill: str,
) -> None:
    size = start_size
    font = get_font(size, bold=bold)
    bbox = draw.textbbox((0, 0), text, font=font)
    width = bbox[2] - bbox[0]

    while width > max_width and size > min_size:
        size -= 1
        font = get_font(size, bold=bold)
        bbox = draw.textbbox((0, 0), text, font=font)
        width = bbox[2] - bbox[0]

    draw.text((center_x - width // 2, y), text, font=font, fill=fill)


def draw_icon_badge(
    draw: ImageDraw.ImageDraw,
    x: int,
    y: int,
    label: str,
    bg: str,
    fg: str = "#FFFFFF",
    r: int = 14,
) -> None:
    draw.ellipse((x - r, y - r, x + r, y + r), fill=bg)
    font = get_font(14, bold=True)
    bbox = draw.textbbox((0, 0), label, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((x - tw // 2, y - th // 2 - 1), label, font=font, fill=fg)


def draw_card_with_content(
    draw: ImageDraw.ImageDraw,
    x: int,
    y: int,
    w: int,
    h: int,
    top_color: str,
    title: str,
    lines: Iterable[str],
    icon_label: str | None = None,
    icon_bg: str = "#5B8DEF",
) -> None:
    draw_shadowed_card(draw, x, y, w, h, top_color)

    line_font = get_font(18)

    icon_reserved = 64 if icon_label else 24
    title_center_x = x + (w - (40 if icon_label else 0)) // 2

    text_center_fit(
        draw,
        text=title,
        center_x=title_center_x,
        y=y + 28,
        max_width=w - icon_reserved,
        start_size=24,
        min_size=18,
        bold=True,
        fill=TEXT_DARK,
    )

    curr_y = y + 76
    for line in lines:
        text_center(draw, line, line_font, x + w // 2, curr_y, TEXT_MUTED)
        curr_y += 30

    if icon_label:
        draw_icon_badge(draw, x + w - 26, y + 32, icon_label, icon_bg)


def draw_arrow(draw: ImageDraw.ImageDraw, start: Tuple[int, int], end: Tuple[int, int], width: int = 3) -> None:
    draw.line((start, end), fill=LINE_COLOR, width=width)

    ex, ey = end
    ax1, ay1 = ex - 9, ey - 13
    ax2, ay2 = ex + 9, ey - 13
    draw.polygon([(ex, ey), (ax1, ay1), (ax2, ay2)], fill=LINE_COLOR)


def draw_orthogonal_link(draw: ImageDraw.ImageDraw, x1: int, y1: int, y_mid: int, x2: int, y2: int, width: int = 3) -> None:
    draw.line((x1, y1, x1, y_mid), fill=LINE_COLOR, width=width)
    draw.line((x1, y_mid, x2, y_mid), fill=LINE_COLOR, width=width)
    draw.line((x2, y_mid, x2, y2), fill=LINE_COLOR, width=width)
    draw.polygon([(x2, y2), (x2 - 8, y2 - 12), (x2 + 8, y2 - 12)], fill=LINE_COLOR)


def render() -> Path:
    image = Image.new("RGB", (CANVAS_W, CANVAS_H), BG_COLOR)
    draw = ImageDraw.Draw(image)

    title_font = get_font(60, bold=True)
    subtitle_font = get_font(32)

    text_center(draw, "EventZen", title_font, CANVAS_W // 2, 28, TEXT_DARK)
    text_center(draw, "Professional, deployable event management platform", subtitle_font, CANVAS_W // 2, 104, TEXT_MUTED)

    # Frontend layer
    layer_margin = 140
    layer_w = CANVAS_W - (2 * layer_margin)

    frontend = (layer_margin, 170, layer_w, 135)
    draw_card_with_content(
        draw,
        *frontend,
        top_color="#4FA4E8",
        title="Frontend Layer",
        lines=["React 19 + Vite + Tailwind CSS 3 + Redux Toolkit", "Nginx container | Port 5174 host mapped"],
        icon_label="R",
        icon_bg="#38BDF8",
    )

    # Gateway layer
    gateway = (layer_margin, 365, layer_w, 130)
    draw_card_with_content(
        draw,
        *gateway,
        top_color="#4B6A88",
        title="API Gateway Layer",
        lines=["Kong 3.5 declarative routing", "Rate Limiting | CORS | Request Size Limit | File Logging"],
        icon_label="K",
        icon_bg="#2E7D32",
    )

    # Flow text
    flow_font = get_font(26)
    text_center(draw, "HTTP / REST", flow_font, CANVAS_W // 2, 324, TEXT_DARK)

    # Services row
    service_y = 560
    box_w = 250
    box_h = 195
    gap = 34

    service_defs = [
        ("Auth Service", ["Node.js / Express / TS", "Port 8093 host"], "#66BB6A", "N", "#43A047"),
        ("Event Service", ["Java 21 / Spring Boot", "Port 8094 host"], "#4EA1F3", "J", "#1E88E5"),
        ("Venue-Vendor Service", ["Node.js / Express / TS", "Port 8095 host"], "#8E63CE", "N", "#6A1B9A"),
        ("Ticketing Service", ["C# / .NET 10", "Port 8096 host"], "#F0A64A", ".N", "#EF6C00"),
        ("Finance Service", ["C# / .NET 10", "Port 8097 host"], "#4DB6AC", ".N", "#00897B"),
        ("Notification Service", ["Node.js / Express / TS", "Port 8098 host"], "#E5749E", "N", "#D81B60"),
    ]

    services_total_w = (len(service_defs) * box_w) + ((len(service_defs) - 1) * gap)
    start_x = (CANVAS_W - services_total_w) // 2

    service_boxes = []
    sx = start_x
    for title, lines, color, icon, icon_bg in service_defs:
        draw_card_with_content(draw, sx, service_y, box_w, box_h, color, title, lines, icon_label=icon, icon_bg=icon_bg)
        service_boxes.append((sx, service_y, box_w, box_h))
        sx += box_w + gap

    # Infra row
    infra_y = 840
    infra_h = 115
    infra_defs = [
        ("MySQL x3", "auth/events/finance", "#44C278", "DB", "#2E7D32"),
        ("MongoDB x3", "venue/ticketing/notification", "#5BC2A9", "MG", "#00897B"),
        ("Redis", "cache + sessions", "#324B74", "RD", "#1E3A8A"),
        ("Kafka + Zookeeper", "event streaming", "#2D3748", "KF", "#111827"),
        ("MinIO + Elasticsearch", "storage + search", "#6C63FF", "ME", "#4F46E5"),
        ("Vault", "secrets management", "#F2C94C", "V", "#C99700"),
        ("Prometheus + Grafana", "monitoring stack", "#F28B55", "PG", "#E65100"),
    ]

    infra_gap = 18
    infra_w = (CANVAS_W - 2 * 80 - (len(infra_defs) - 1) * infra_gap) // len(infra_defs)
    infra_x = 80
    infra_boxes = []
    for title, subtitle, color, icon, icon_bg in infra_defs:
        draw_card_with_content(
            draw,
            infra_x,
            infra_y,
            infra_w,
            infra_h,
            color,
            title,
            [subtitle],
            icon_label=icon,
            icon_bg=icon_bg,
        )
        infra_boxes.append((infra_x, infra_y, infra_w, infra_h))
        infra_x += infra_w + infra_gap

    # Main vertical connectors
    fx, fy, fw, fh = frontend
    gx, gy, gw, gh = gateway
    draw_arrow(draw, (CANVAS_W // 2, fy + fh), (CANVAS_W // 2, gy))

    # Gateway fan-out bus to services
    bus_y = 528
    draw.line((gx + 140, bus_y, gx + gw - 140, bus_y), fill=LINE_COLOR, width=3)
    draw.line((CANVAS_W // 2, gy + gh, CANVAS_W // 2, bus_y), fill=LINE_COLOR, width=3)

    for sx, sy, sw, _ in service_boxes:
        cx = sx + sw // 2
        draw_arrow(draw, (cx, bus_y), (cx, sy))

    # Service to infra connectors
    target_indices = [0, 1, 2, 3, 4, 5, 6]
    for idx, (sx, sy, sw, sh) in enumerate(service_boxes):
        tx, ty, tw, _ = infra_boxes[target_indices[idx % len(target_indices)]]
        source_x = sx + sw // 2
        target_x = tx + tw // 2
        draw_orthogonal_link(draw, source_x, sy + sh, 790, target_x, ty)

    # Legend note
    legend_font = get_font(16)
    legend = "Sources: docker-compose.yml, gateway/kong.yml, frontend/README.md, service manifests"
    text_center(draw, legend, legend_font, CANVAS_W // 2, CANVAS_H - 34, "#6B7280")

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    image.save(OUT_PATH, format="PNG", optimize=True)
    return OUT_PATH


if __name__ == "__main__":
    result = render()
    print(f"Generated: {result}")
