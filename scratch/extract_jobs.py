import re
import json
import os

html_path = r'C:\Users\user\Downloads\ハローワークインターネットサービス - 求人情報検索・一覧.html'
output_path = r'c:\Users\user\Google ドライブ ストリーミング\マイドライブ\求人情報まとめサイト\data\jobs_data.js'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 各求人テーブルを抽出
job_tables = re.findall(r'<table class="kyujin.*?>(.*?)</table>', content, re.DOTALL)

jobs = []
for i, table in enumerate(job_tables):
    try:
        # 求人番号 (ID)
        id_match = re.search(r'(\d{5}-\d{8})', table)
        job_id = id_match.group(1) if id_match else f"ID-{i}"

        # 掲載日
        date_match = re.search(r'受付年月日.*?：(\d{4})年(\d{1,2})月(\d{1,2})日', table)
        if date_match:
            posted_at = f"{date_match.group(1)}-{int(date_match.group(2)):02d}-{int(date_match.group(3)):02d}"
        else:
            posted_at = "2026-04-27"

        # 職種 (Title)
        title_match = re.search(r'職種</span>.*?<div class="fb">(.*?)</div>', table, re.DOTALL)
        title = title_match.group(1).strip() if title_match else ""
        title = re.sub(r'<.*?>', '', title) # HTMLタグ除去

        # 事業所名 (Company)
        company_match = re.search(r'事業所名</span>.*?<td class="data_col"><div.*?>(.*?)</div>', table, re.DOTALL)
        company = company_match.group(1).strip() if company_match else ""
        company = re.sub(r'<.*?>', '', company)

        # 給料 (Salary)
        salary_match = re.search(r'賃金.*?<div class="disp_inline_block">(.*?)</div>', table, re.DOTALL)
        salary = salary_match.group(1).strip() if salary_match else ""
        salary = re.sub(r'<.*?>', '', salary)

        # 就業場所 (Location)
        location_match = re.search(r'就業場所</span>.*?<div>(.*?)</div>', table, re.DOTALL)
        location = location_match.group(1).strip() if location_match else ""
        location = re.sub(r'<.*?>', '', location)

        # 雇用形態 (Type)
        type_match = re.search(r'<span class="bg_label white_back">.*?<div>(.*?)</div>', table, re.DOTALL)
        job_type = type_match.group(1).strip() if type_match else "正社員"

        jobs.append({
            "id": job_id,
            "title": title,
            "company": company,
            "location": location,
            "salary": salary,
            "type": job_type,
            "category": "一般",
            "isRemote": "在宅" in title or "リモート" in title,
            "postedAt": posted_at,
            "description": "ハローワーク公式で詳細を確認"
        })
    except Exception as e:
        print(f"Error parsing job {i}: {e}")

# JSファイルとして出力
js_content = "const initialJobsData = " + json.dumps(jobs, indent=2, ensure_ascii=False) + ";"
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Successfully extracted {len(jobs)} jobs.")
