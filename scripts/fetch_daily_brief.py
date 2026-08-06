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

# 金句方向关键词 —— 文化修身 + 政治理论 + 实干，三类平衡
CULTURE_KW = [
    "光华", "气韵", "风骨", "品格", "修养", "境界", "格局", "胸怀", "情怀",
    "气节", "精神", "坚守", "耕耘", "岁月", "时光", "热爱", "专注", "匠心",
    "传承", "淡泊", "宁静", "从容", "温润", "厚重", "诗意", "远方", "初心",
    "理想", "志向", "信念", "力量", "光芒", "坚韧", "执着", "沉静", "内敛",
    "谦逊", "朴实", "纯粹", "脊梁", "灵魂", "根脉", "血脉", "薪火", "文明",
    "家风", "礼仪", "德行", "智慧", "良知", "道义", "仁爱", "大义", "操守",
    "心性", "涵养", "修为", "磨砺", "淬炼", "积淀", "沉淀", "滋养", "浸润",
    "熏陶", "启迪", "觉醒", "通透", "澄明", "清朗", "清雅", "清正", "正气",
    "浩气", "骨气", "志气", "胆气", "锐气", "朝气", "灵气", "洗礼", "净化",
    "蜕变", "绽放", "芬芳", "馨香", "温度", "底色", "烟火",
    "淡泊明志", "宁静致远", "厚德载物", "自强不息", "知行合一",
    "修身齐家", "格物致知", "诚意正心", "慎独", "克己", "奉公",
]

THEORY_KW = [
    "共同体", "制度", "战略", "强国", "复兴", "思想", "理论", "体系",
    "大局", "民主", "协商", "团结", "自信", "特色", "探索", "领域",
    "马克思主义", "治理体系", "现代化", "全过程", "社会主义", "领导核心",
    "旗帜", "道路", "方向", "立场", "纲领", "路线", "方针", "政策",
    "部署", "决策", "统筹", "协调", "深化", "完善", "健全", "机制",
    "体制", "结构", "功能", "效能", "优势", "特征", "本质", "内涵",
    "外延", "逻辑", "规律", "趋势", "大势", "全局", "长远", "根本",
    "核心", "关键", "重点", "基础", "前提", "保障", "支撑", "引领",
    "驱动", "赋能", "激活", "激发", "凝聚", "汇聚", "融合", "整合",
    "优化", "升级", "转型", "变革", "跨越", "跃升", "提升", "提高",
    "增强", "强化", "巩固", "夯实",
]

ACTION_KW = [
    "实干", "奋斗", "坚持", "创新", "改革", "民生", "基层", "治理",
    "担当", "作风", "高质量", "发展", "科技", "产业", "转型", "数据",
    "增长", "突破", "攻坚", "成效", "成果", "项目", "工程", "建设",
    "推进", "落实", "行动", "实践", "举措", "措施", "服务", "保障",
    "就业", "营商", "数字", "绿色", "乡村", "振兴", "生态", "开放",
    "共享", "协调", "公平", "安全", "稳定", "和谐", "普惠", "福祉",
    "效益", "效率", "质量", "速度", "进度", "力度", "深度", "广度",
    "精度", "准度", "温度", "满意度", "获得感", "幸福感", "安全感",
    "覆盖率", "普及率", "合格率", "达标率", "完成率", "实现率",
    "投入", "产出", "收益", "回报", "贡献", "价值", "意义", "作用",
    "影响", "效果", "绩效", "业绩", "成绩", "成就", "功业", "功绩",
    "实绩", "实事", "好事", "难事", "急事", "要事", "大事", "小事",
]

KW_CATEGORIES = {
    "culture": CULTURE_KW,
    "theory":  THEORY_KW,
    "action":  ACTION_KW,
}

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
    # 去掉 HTML 标签残余
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    # 去掉求是来源元数据
    text = re.sub(r"来源：《求是》\d{4}/\d{2}\s*作者：\S+\s*\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2}:\d{2}\s*", "", text)
    # 去掉"※ 习近平"这种标记
    text = re.sub(r"※\s*\S+", "", text)
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


# ── 跨日去重 ──────────────────────────────────────────

def load_recent_word_keys(days=7):
    """读取最近 N 天的素材文件，收集已出现过的金句 key（前30字符）"""
    used_keys = set()
    for i in range(1, days + 1):  # 从1开始，跳过今天
        d = datetime.now(TZ_BEIJING) - timedelta(days=i)
        ds = d.strftime("%Y-%m-%d")
        path = os.path.join(OUTPUT_DIR, f"daily-brief-{ds}.json")
        if not os.path.exists(path):
            continue
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            for w in data.get("words", []):
                key = w.get("text", "")[:30]
                if key:
                    used_keys.add(key)
        except (json.JSONDecodeError, OSError):
            continue
    return used_keys


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
    """从文本中提取完整句子，过滤低质量内容"""
    sentences = re.split(r"[。！；\n]", text)
    result = []
    for s in sentences:
        s = s.strip()
        # 长度过滤
        if len(s) < 12 or len(s) > 200:
            continue
        # 必须含足够中文
        chinese_chars = len(re.findall(r"[\u4e00-\u9fff]", s))
        if chinese_chars < 10:
            continue
        # 排除元数据
        if re.match(r"^[\d年月日记者摄报道责编]", s):
            continue
        if re.match(r"^(来源|本期导读|本期发表|摘要|关键词)", s):
            continue
        if "本报" in s[:10] and len(s) < 30:
            continue
        # 排除求是编辑说明
        if "《求是》杂志编辑部" in s and len(s) < 50:
            continue
        # 排除标题重复（求是文章标题经常在正文中重复）
        if s.count(" ") < 1 and len(s) > 40 and " " not in s[:20]:
            # 可能是一个长标题，检查是否重复
            pass
        # 排除纯英文/数字
        if re.match(r"^[A-Za-z0-9\s]+$", s):
            continue
        result.append(s)
    return result


def classify_sentence(s):
    """判断句子属于哪一类，返回 (category, score)"""
    c = sum(1 for kw in CULTURE_KW if kw in s)
    t = sum(1 for kw in THEORY_KW if kw in s)
    a = sum(1 for kw in ACTION_KW if kw in s)
    scores = [("culture", c), ("theory", t), ("action", a)]
    best = max(scores, key=lambda x: x[1])
    if best[1] == 0:
        return None, 0
    return best[0], best[1]


def extract_words(entries, exclude_keys=None):
    """从多源 RSS 提取金句，文化修身 + 政治理论 + 实干 三类平衡
    exclude_keys: 跨日去重，已出现过的金句 key 集合
    """
    if exclude_keys is None:
        exclude_keys = set()
    candidates = []
    seen = set()

    for entry in entries:
        is_qstheory = entry["source"] == "求是"
        is_opinion = is_opinion_article(entry["title"])

        # 只从评论/观点/求是/人文类文章提取
        if not is_qstheory and not is_opinion:
            # 非评论非求是，但含文化关键词的也保留
            pass  # 不跳过，文化类可能在非评论文章里

        # 从描述中提取句子（不用 title 避免标题混入正文）
        sentences = extract_sentences(entry["desc"])

        for s in sentences:
            # 去重（当日 + 跨日）
            key = s[:30]
            if key in seen:
                continue
            if key in exclude_keys:
                continue
            seen.add(key)

            # 分类
            cat, score = classify_sentence(s)
            if cat is None:
                continue

            candidates.append({
                "text": s + "。",
                "source": entry["shortSource"],
                "url": entry["link"],
                "category": cat,
                "score": score,
            })

    # 按类别分组，每类内按得分排序
    by_cat = {"culture": [], "theory": [], "action": []}
    for c in candidates:
        by_cat[c["category"]].append(c)

    for cat in by_cat:
        by_cat[cat].sort(key=lambda x: x["score"], reverse=True)

    # 配额提取：每类最多 7 条，总量 20
    TARGET_TOTAL = 20
    PER_CAT_TARGET = 7

    result = []
    used_keys = set()

    # 第一轮：每类取前 PER_CAT_TARGET
    for cat in ["culture", "theory", "action"]:
        for c in by_cat[cat][:PER_CAT_TARGET]:
            k = c["text"][:30]
            if k not in used_keys:
                used_keys.add(k)
                result.append({
                    "text": c["text"],
                    "source": c["source"],
                    "url": c["url"],
                })

    # 如果总量不足 20，从剩余候选补充（按得分）
    if len(result) < TARGET_TOTAL:
        remaining = []
        for cat in by_cat:
            for c in by_cat[cat][PER_CAT_TARGET:]:
                k = c["text"][:30]
                if k not in used_keys:
                    remaining.append(c)
        remaining.sort(key=lambda x: x["score"], reverse=True)
        for c in remaining[:TARGET_TOTAL - len(result)]:
            k = c["text"][:30]
            if k not in used_keys:
                used_keys.add(k)
                result.append({
                    "text": c["text"],
                    "source": c["source"],
                    "url": c["url"],
                })

    return result[:TARGET_TOTAL]


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

    # 跨日去重：加载最近 7 天已用金句
    recent_keys = load_recent_word_keys(7)
    if recent_keys:
        print(f"  跨日去重: 排除最近7天已用 {len(recent_keys)} 条金句\n")

    # 分类统计
    opinion_count = sum(1 for e in all_entries
                        if is_opinion_article(e["title"]) or e["source"] == "求是")
    jiangsu_count = sum(1 for e in all_entries
                        if any(p in f"{e['title']} {e['desc']}" for p in JIANGSU_PLACES))
    print(f"  其中理论/评论类: {opinion_count} 篇, 江苏相关: {jiangsu_count} 篇\n")

    # 提取
    print("[1/3] 提取申论金句...")
    words = extract_words(all_entries, exclude_keys=recent_keys)
    # 降级：7天去重后不足15条，缩窄到3天再试
    if len(words) < 15:
        print(f"      仅 {len(words)} 条，缩窄去重窗口到3天重试...")
        recent_keys_3d = load_recent_word_keys(3)
        words = extract_words(all_entries, exclude_keys=recent_keys_3d)
        print(f"      重试后 {len(words)} 条")
    print(f"      最终 {len(words)} 条")

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
