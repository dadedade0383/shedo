"""生成她shedo的绿色金色交织APP图标"""
from PIL import Image, ImageDraw, ImageFont
import math

def make_icon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    r = size / 2
    cx, cy = r, r
    margin = size * 0.12
    corner = size * 0.18  # iOS 风格圆角

    # -- 1. 圆角矩形背景：明亮绿色渐变 --
    # 用多层同心圆角矩形模拟渐变（从上到下渐变）
    steps = 20
    for i in range(steps):
        t = i / (steps - 1)
        # 从上到下的渐变：顶部亮绿 → 底部深绿
        r_val = int(26 + (18 - 26) * t)   # 26→18
        g_val = int(145 + (60 - 145) * t)  # 145→60
        b_val = int(85 + (40 - 85) * t)   # 85→40
        a = 255
        color = (r_val, g_val, b_val, a)

        frac = i / steps
        y0 = int(margin + (size - 2 * margin) * frac)
        y1 = int(margin + (size - 2 * margin) * (frac + 1 / steps))
        if y1 > size - margin:
            y1 = int(size - margin)
        if y0 >= y1:
            break

        # 每层画圆角矩形条
        cr = int(corner * (1 - 0.15 * (i / steps)))
        draw.rounded_rectangle(
            [margin, y0, size - margin, y1],
            radius=cr if i == 0 else 0,
            fill=color
        )
        if i < steps - 1:
            draw.rounded_rectangle(
                [margin, y0, size - margin, y1],
                radius=cr if i == 0 else 0,
                fill=color
            )

    # 重新画一个完整的圆角矩形（外层裁剪）
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=int(corner),
        fill=255
    )

    # 重新绘制干净的渐变背景
    bg = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    bg_draw = ImageDraw.Draw(bg)
    # 逐像素垂直线渐变
    for y in range(int(margin), int(size - margin)):
        t = (y - margin) / (size - 2 * margin)
        r_val = int(28 + (8 - 28) * t)
        g_val = int(145 + (42 - 145) * t)
        b_val = int(82 + (28 - 82) * t)
        for x in range(int(margin), int(size - margin)):
            bg_draw.point((x, y), fill=(r_val, g_val, b_val, 255))

    # 应用圆角 mask
    bg_rounded = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    bg_rounded.paste(bg, mask=mask)

    # -- 2. 金色菱形（大） --
    diamond = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d_draw = ImageDraw.Draw(diamond)
    ds = size * 0.52  # 菱形边长
    diamond_pts = [
        (cx, cy - ds * 0.55),      # 顶部略收
        (cx + ds * 0.55, cy),
        (cx, cy + ds * 0.55),
        (cx - ds * 0.55, cy),
    ]
    # 金色渐变描边菱形
    gold_color = (212, 168, 71, 255)  # #d4a847
    gold_light = (235, 200, 105, 255)
    d_draw.polygon(diamond_pts, fill=gold_light, outline=gold_color)
    # 内部镂空（留40%透明）
    inner_scale = 0.72
    inner_pts = [
        (cx, cy - ds * 0.55 * inner_scale),
        (cx + ds * 0.55 * inner_scale, cy),
        (cx, cy + ds * 0.55 * inner_scale),
        (cx - ds * 0.55 * inner_scale, cy),
    ]
    # 用透明填充内部
    d_draw.polygon(inner_pts, fill=(0, 0, 0, 0))

    # -- 3. 绿色圆环（与菱形相交，交织效果） --
    ring = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    r_draw = ImageDraw.Draw(ring)
    ring_outer = size * 0.32
    ring_width = size * 0.045
    green_color = (74, 180, 110, 255)   # #4ab46e
    green_dark = (45, 130, 75, 255)

    # 画外圆
    r_draw.ellipse(
        [cx - ring_outer, cy - ring_outer,
         cx + ring_outer, cy + ring_outer],
        fill=green_color
    )
    # 内圆镂空
    ring_inner = ring_outer - ring_width
    r_draw.ellipse(
        [cx - ring_inner, cy - ring_inner,
         cx + ring_inner, cy + ring_inner],
        fill=(0, 0, 0, 0)
    )

    # -- 4. 组合图层 --
    img.paste(bg_rounded, (0, 0))       # 背景
    img.paste(diamond, (0, 0), diamond)  # 菱形
    img.paste(ring, (0, 0), ring)        # 圆环

    # -- 5. 中心金色小菱形 --
    draw = ImageDraw.Draw(img)
    small_d = size * 0.07
    draw.polygon([
        (cx, cy - small_d),
        (cx + small_d, cy),
        (cx, cy + small_d),
        (cx - small_d, cy),
    ], fill=(218, 175, 78))

    # -- 6. 底部文字 "shedo" --
    font_size = int(size * 0.07)
    try:
        # 尝试系统字体
        font_paths = [
            "C:/Windows/Fonts/segoeuib.ttf",
            "C:/Windows/Fonts/segui.ttf",
            "C:/Windows/Fonts/msyh.ttc",
            "C:/Windows/Fonts/arial.ttf",
        ]
        for fp in font_paths:
            try:
                font = ImageFont.truetype(fp, font_size)
                break
            except:
                continue
        else:
            font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()

    text_y = cy + ring_outer + size * 0.08
    # 文字阴影增加可读性
    bbox = draw.textbbox((0, 0), "shedo", font=font)
    tw = bbox[2] - bbox[0]
    tx = cx - tw / 2
    # 金色描边效果
    for ox, oy in [(-1, -1), (1, -1), (-1, 1), (1, 1)]:
        draw.text((tx + ox, text_y + oy), "shedo", fill=(0, 30, 15, 180), font=font)
    draw.text((tx, text_y), "shedo", fill=(218, 175, 78), font=font)

    return img


if __name__ == "__main__":
    icons = [512, 192]
    for s in icons:
        img = make_icon(s)
        path = f"assets/icon-{s}x{s}.png"
        img.save(path, "PNG")
        print(f"Generated {path}")
    print("Done!")
