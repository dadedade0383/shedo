#!/usr/bin/env python3
"""
每日申论素材自动抓取脚本
数据源：feedx.net 聚合的人民日报 RSS（100 篇） + 求是 RSS（20 篇）
GitHub Actions 每天北京时间 7:00 (UTC 23:00) 自动运行

输出：data/daily-brief-{YYYY-MM-DD}.json
- words: 申论金句（从评论/观点/理论文章中提取，含求是）
- cases: 案例素材（从含数据/措施的报道中提取）
- news: 时政要闻（从人民日报头版提取）
"""

import json
import os
import re
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from html.parser import HTMLParser
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

# ── 配置 ──────────────────────────────────────────────

TZ_BEIJING = timezone(timedelta(hours=8))
TODAY = datetime.now(TZ_BEIJING).strftime("%Y-%m-%d")
TODAY_SHORT = datetime.now(TZ_BEIJING).strftime("%m月%d日")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "..", "data")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, f"daily-brief-{TODAY}.json")

# 多数据源
FEED_SOURCES = [
    ("https://feedx.net/rss/people.xml",    "人民日报"),
    ("https://feedx.net/rss/qstheory.xml",  "求是"),
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; shedo-bot/1.0; +https://github.com/dadedade0383/shedo)"
}

# 金句来源栏目（优先提取这些栏目的文章）
OPINION_COLUMNS = ["今日谈", "人民论坛", "人民时评", "思想纵横", "评论员", "编辑手记",
                    "金台随笔", "大家谈", "暖闻热评", "连线评论员"]

# 申论方向关键词
SHENLUN_KW = [
    "实干", "奋斗", "坚持", "创新", "改革", "民生", "基层", "治理",
    "青年", "担当", "作风", "高质量", "人民", "乡村", "生态", "科技",
    "营商", "法治", "开放", "发展", "安全", "就业", "教育", "养老",
    "文化", "初心", "使命", "斗争", "公平", "服务", "数字", "绿色",
    "协调", "共享", "文明", "精神", "信念", "攻坚", "突破", "扎根",
    "为民", "政绩", "奉献", "拼搏", "使命", "担当", "清廉", "群众",
    "产业", "转型", "保障", "普惠", "福祉", "和谐", "合力", "共建",
    # 求是理论风格关键词
    "自信", "特色", "战略", "强国", "复兴", "制度", "探索", "协商",
    "民主", "团结", "领域", "体系", "思想", "理论", "大局", "稳健"
]

# 江苏地名（用于筛选本地案例）
JIANGSU_PLACES = ["江苏", "南京", "苏州", "无锡", "常州", "镇江", "扬州",
                   "南通", "泰州", "盐城", "淮安", "连云港", "徐州", "宿迁",
                   "昆山", "江阴", "张家港", "常熟", "太仓", "宜兴", "盱眙"]


# ── HTML 工具 ──────────────────────────────────────────

class HTMLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
    def handle_data(self, data):
        self.text.append(data)
    def get_text(self):
        return "".join(self.text)


def strip_html(html_str):
    if not html_str:
        return ""
    stripper = HTMLStripper()
    stripper.feed(html_str)
    return stripper.get_text()


def clean_text(text):
    text = strip_html(text)
    text = text.replace("\u00a0", " ").replace("\u200b", "")
    text = text.replace("&nbsp;", " ").replace("&ldquo;", "\u201c").replace("&rdquo;", "\u201d")
    text = text.replace("&mdash;", "\u2014").replace("&ndash;", "\u2013")
    text = re.sub(r"\s+", " ", text).strip()
    # 去掉求是来源元数据
    text = re.sub(r"来源：《求是》\d{4}/\d{2}\s*作者：\S+\s*\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2}:\d{2}\s*", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


# ── 网络请求 ──────────────────────────────────────────

def fetch_rss(url, source_name):
    """获取 RSS 并解析，给每条标记来源"""
    try:
        req = Request(url, headers=HEADERS)
        with urlopen(req, timeout=20) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
    except (URLError, HTTPError, OSError) as e:
        print(f"  [ERROR] 无法获取 {source_name}: {e}", file=sys.stderr)
        return []

    try:
        root = ET.fromstring(raw)
    except ET.ParseError as e:
        print(f"  [ERROR] {source_name} RSS 解析失败: {e}", file=sys.stderr)
        return []

    entries = []
    for item in root.iter("item"):
        title = item.find("title")
        link = item.find("link")
        desc = item.find("description")
        pubdate = item.find("pubDate")

        t = clean_text(title.text) if title is not None and title.text else ""
        l = clean_text(link.text) if link is not None and link.text else ""
        d = clean_text(desc.text) if desc is not None and desc.text else ""
        p = clean_text(pubdate.text) if pubdate is not None and pubdate.text else ""

        entries.append({
            "title": t, "desc": d, "link": l, "date": p,
            "source": source_name,      # 标记来源
            "shortSource": f"{source_name} {TODAY_SHORT}"
        })

    return entries


# ── 提取金句 ──────────────────────────────────────────

def is_opinion_article(title):
    """判断是否是评论/观点类文章"""
    for col in OPINION_COLUMNS:
        if col in title:
            return True
    # 也匹配"XX版"的评论版
    if re.search(r"0[4-5]版|09版|评论|观点", title):
        return True
    return False


def extract_sentences(text):
    """从文本中提取完整句子"""
    sentences = re.split(r"[。！；\n]", text)
    result = []
    for s in sentences:
        s = s.strip()
        # 太短或太长都不合适
        if len(s) < 10 or len(s) > 200:
            continue
        # 必须含中文且非纯标题
        chinese_chars = len(re.findall(r"[\u4e00-\u9fff]", s))
        if chinese_chars < 8:
            continue
        # 排除元数据/来源信息
        if re.match(r"^[\d年月日记者摄报道责编]", s):
            continue
        if re.match(r"^(来源|本期导读|本期发表)", s):
            continue
        if "本报" in s[:10] and len(s) < 30:
            continue
        result.append(s)
    return result


def extract_words(entries):
    """从多源 RSS 提取申论金句（求是优先但限制数量，兼顾人民日报）"""
    words = []
    seen = set()
    max_qstheory = 5  # 求是上限 5 条

    # 重排：求是优先，然后是人民日报评论，最后是其他
    prioritized = sorted(entries, key=lambda e: (
        0 if e["source"] == "求是" else (1 if is_opinion_article(e["title"]) else 2)
    ))

    for entry in prioritized:
        qs_count = sum(1 for w in words if w["source"].startswith("求是"))

        # 只看评论类或求是，非评论类作为补充
        is_qstheory = entry["source"] == "求是"
        is_opinion = is_opinion_article(entry["title"])

        if is_qstheory and qs_count >= max_qstheory:
            continue  # 求是达上限，跳过剩余求是
        if not is_qstheory and not is_opinion:
            continue  # 非评论非求是：跳过

        combined = f"{entry['title']} {entry['desc']}"
        sentences = extract_sentences(combined)
        article_count = 0
        for s in sentences:
            if article_count >= 2:
                break
            if is_qstheory and qs_count >= max_qstheory:
                break  # 求是达上限，当前文章不再取
            if any(kw in s for kw in SHENLUN_KW):
                key = s[:30]
                if key not in seen:
                    seen.add(key)
                    words.append({
                        "text": s + "。",
                        "source": entry["shortSource"],
                        "url": entry["link"]
                    })
                    article_count += 1
                    if is_qstheory:
                        qs_count += 1
            if len(words) >= 10:
                break
        if len(words) >= 10:
            break

    return words


# ── 提取案例 ──────────────────────────────────────────

def has_data(text):
    """检查文本是否包含量化数据"""
    return bool(re.search(r"\d+[%％个项家万千亿元吨亩]", text))


def extract_cases(entries):
    """从多源 RSS 提取案例素材（优先江苏本地）"""
    jiangsu_cases = []
    other_cases = []

    for entry in entries:
        combined = f"{entry['title']} {entry['desc']}"
        title = entry["title"]
        desc = entry["desc"]

        # 必须含数据
        if not has_data(combined):
            continue

        # 排除评论类
        if is_opinion_article(title):
            continue
        # 求是偏理论，案例价值低，跳过
        if entry["source"] == "求是":
            continue

        # 排除纯会议/简报
        if re.match(r"^\d+版\s*-\s*导读|图片|广告|简讯", title):
            continue

        # 截取标题（去版面号）
        clean_title = re.sub(r"^\d+版\s*-\s*", "", title).strip()
        if len(clean_title) > 40:
            clean_title = clean_title[:40] + "…"

        # 截取描述
        clean_desc = desc
        if len(clean_desc) > 250:
            clean_desc = clean_desc[:250] + "…"

        case = {
            "title": clean_title,
            "desc": clean_desc,
            "source": entry["shortSource"],
            "url": entry["link"]
        }

        # 江苏优先
        if any(p in combined for p in JIANGSU_PLACES):
            jiangsu_cases.append(case)
        else:
            other_cases.append(case)

    # 江苏案例 + 其他补足
    result = jiangsu_cases[:3] + other_cases
    return result[:5]


# ── 提取时政 ──────────────────────────────────────────

def extract_news(entries, case_titles=None):
    """从头版文章提取时政要闻（仅人民日报，求是无头版）"""
    if case_titles is None:
        case_titles = set()
    news = []
    seen = set()

    for entry in entries:
        # 时政只取人民日报头版
        if entry["source"] != "人民日报":
            continue
        title = entry["title"]
        # 取头版
        if not re.match(r"0[1-2]版", title):
            continue

        # 去版面号
        clean_title = re.sub(r"^\d+版\s*-\s*", "", title).strip()

        # 排除评论/导读/图片
        if any(kw in clean_title for kw in ["导读", "图片", "广告"]):
            continue
        if is_opinion_article(clean_title):
            continue
        # 排除和案例重复的
        if clean_title[:20] in case_titles:
            continue

        if len(clean_title) > 120:
            clean_title = clean_title[:120] + "…"

        key = clean_title[:30]
        if key not in seen:
            seen.add(key)
            news.append({
                "text": clean_title,
                "source": entry["shortSource"],
                "date": TODAY,
                "url": entry["link"]
            })

    return news[:8]


# ── 主流程 ─────────────────────────────────────────────

def main():
    print(f"\n{'='*60}")
    print(f"  shed 每日申论素材自动抓取")
    print(f"  日期: {TODAY}")
    print(f"  数据源: 人民日报 + 求是")
    print(f"{'='*60}\n")

    # 获取所有 RSS 源
    all_entries = []
    for url, name in FEED_SOURCES:
        entries = fetch_rss(url, name)
        if entries:
            all_entries.extend(entries)
            print(f"  [{name}] {len(entries)} 篇")
        else:
            print(f"  [{name}] 获取失败，跳过")

    if not all_entries:
        print("[ERROR] 所有数据源均获取失败，退出", file=sys.stderr)
        return 1

    print(f"\n  总计 {len(all_entries)} 篇文章\n")

    # 分类统计
    opinion_count = sum(1 for e in all_entries
                        if is_opinion_article(e["title"]) or e["source"] == "求是")
    jiangsu_count = sum(1 for e in all_entries
                        if any(p in f"{e['title']} {e['desc']}" for p in JIANGSU_PLACES))
    print(f"  其中理论/评论类: {opinion_count} 篇, 江苏相关: {jiangsu_count} 篇\n")

    # 提取
    print("[1/3] 提取申论金句...")
    words = extract_words(all_entries)
    print(f"      共 {len(words)} 条")

    print("[2/3] 提取案例素材...")
    cases = extract_cases(all_entries)
    print(f"      共 {len(cases)} 条")

    print("[3/3] 提取时政要闻...")
    case_titles = {c["title"][:20] for c in cases}
    news = extract_news(all_entries, case_titles)
    print(f"      共 {len(news)} 条")

    # 写入 JSON
    result = {
        "date": TODAY,
        "updatedAt": f"{TODAY} 07:00",
        "words": words,
        "cases": cases,
        "news": news
    }

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"\n  写入: {OUTPUT_FILE}")
    print(f"  完成! {len(words)} 金句 | {len(cases)} 案例 | {len(news)} 时政")
    print(f"{'='*60}\n")

    # 质量警告
    if len(words) < 3:
        print("  [WARN] 金句偏少，今日可能无足够评论文章")
    if len(cases) < 2:
        print("  [WARN] 案例偏少")

    return 0


if __name__ == "__main__":
    sys.exit(main())
