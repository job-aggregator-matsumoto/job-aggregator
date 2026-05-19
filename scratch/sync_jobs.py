import re
import json
import os
import glob
from datetime import datetime

# === 設定 ===
# ハローワークのHTMLファイルが保存されているフォルダ
SOURCE_DIR = r'C:\Users\user\OneDrive\Documents\求人まとめサイト'
# 出力先のJSファイル
OUTPUT_PATH = r'c:\Users\user\Google ドライブ ストリーミング\マイドライブ\求人情報まとめサイト\data\jobs_data.js'
# 今日の日付
TODAY = datetime.now().strftime("%Y-%m-%d")

def extract_field(html, label):
    # ラベルから始まり、最初に出現するtdの中身をキャプチャする（最短一致）
    regex = label + r'[\s\S]*?<td[^>]*?>(.*?)</td>'
    m = re.search(regex, html, re.IGNORECASE | re.DOTALL)
    if not m:
        return ''
    # HTMLタグを除去し、改行を保持しつつトリミング
    val = re.sub(r'<br\s*/?>', '\n', m.group(1), flags=re.IGNORECASE)
    val = re.sub(r'<[^>]+>', '', val)
    return val.strip()

def process_files():
    if not os.path.exists(SOURCE_DIR):
        print(f"エラー: フォルダが見つかりません: {SOURCE_DIR}")
        return

    html_files = glob.glob(os.path.join(SOURCE_DIR, "*.html"))
    print(f"検出されたHTMLファイル: {len(html_files)}件")

    all_jobs_dict = {}

    for file_path in html_files:
        print(f"処理中: {os.path.basename(file_path)}")
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # 求人テーブルの抽出
            job_tables = re.findall(r'<table class="kyujin.*?".*?>(.*?)</table>', content, re.DOTALL)
            
            for table in job_tables:
                # 求人番号
                id_match = re.search(r'求人番号.*?(\d{5}-\d{8})', table, re.DOTALL)
                job_id = id_match.group(1) if id_match else None
                if not job_id: continue

                # 職種
                title_match = re.search(r'class="fb">(.*?)</div>', table, re.DOTALL)
                title = re.sub(r'<[^>]+>', '', title_match.group(1)).strip() if title_match else "職種不明"

                # 各項目
                company = extract_field(table, '事業所名')
                location = extract_field(table, '就業場所')
                salary = extract_field(table, '賃金')
                hours = extract_field(table, '就業時間')
                holiday = extract_field(table, '休日')
                description = extract_field(table, '仕事内容')

                # 雇用形態
                type_match = re.search(r'<div class="bg_label_white">(.*?)</div>', table, re.DOTALL)
                job_type = re.sub(r'<[^>]+>', '', type_match.group(1)).strip() if type_match else "正社員"

                # 受付年月日
                posted_at = TODAY
                date_match = re.search(r'受付年月日[\s\S]*?(\d{4})年(\d{1,2})月(\d{1,2})日', table)
                if date_match:
                    posted_at = f"{date_match.group(1)}-{int(date_match.group(2)):02d}-{int(date_match.group(3)):02d}"

                # 重複チェック（既に存在する場合はスキップまたは更新）
                if job_id not in all_jobs_dict:
                    all_jobs_dict[job_id] = {
                        "id": job_id,
                        "title": title,
                        "company": company,
                        "location": location,
                        "salary": salary,
                        "workingHours": hours,
                        "holiday": holiday,
                        "type": job_type,
                        "category": "障害者枠" if any(x in title for x in ["障", "【障】", "（障）"]) else "一般",
                        "isRemote": any(x in title for x in ["在宅", "リモート", "テレワーク"]),
                        "postedAt": posted_at,
                        "description": description if description else "※詳細は公式ページでご確認ください。",
                        "officialUrl": None, # URL生成ロジックはjGSHNoが必要なため今回は省略
                        "isImported": True
                    }
        except Exception as e:
            print(f"ファイル {file_path} の処理中にエラー: {e}")

    # リストに変換してソート（最新順）
    jobs_list = list(all_jobs_dict.values())
    jobs_list.sort(key=lambda x: x['postedAt'], reverse=True)

    # JSファイルとして保存
    js_content = "const initialJobsData = " + json.dumps(jobs_list, indent=2, ensure_ascii=False) + ";"
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write(js_content)

    print(f"\n成功！ 合計 {len(jobs_list)} 件の求人を統合して {OUTPUT_PATH} に保存しました。")

if __name__ == "__main__":
    process_files()
