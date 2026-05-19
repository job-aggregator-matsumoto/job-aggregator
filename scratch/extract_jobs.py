import re
import json
import os
import urllib.parse

# === 設定 ===
# ハローワークで「名前を付けて保存」したHTMLファイルのパス
html_path = r'C:\Users\user\Downloads\ハローワークインターネットサービス - 求人情報検索・一覧.html'
# 出力先のJSファイル
output_path = r'c:\Users\user\Google ドライブ ストリーミング\マイドライブ\求人情報まとめサイト\data\jobs_data.js'
# 今日の日付（掲載期間フィルター用）
TODAY = "2026-04-27"

def extract_jobs():
    if not os.path.exists(html_path):
        print(f"エラー: HTMLファイルが見つかりません。パスを確認してください: {html_path}")
        return

    with open(html_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # 各求人カード（テーブル）を抽出
    # ハローワークの求人一覧は table.kyujin クラスの中にあります
    job_tables = re.findall(r'<table class="kyujin.*?".*?>(.*?)</table>', content, re.DOTALL)
    
    print(f"解析中: {len(job_tables)}件の要素を検出しました。")

    jobs = []
    for i, table in enumerate(job_tables):
        try:
            # 1. 求人番号 (ID)
            id_match = re.search(r'求人番号.*?(\d{5}-\d{8})', table, re.DOTALL)
            job_id = id_match.group(1) if id_match else f"ID-{i}"

            # 2. 職種 (Title)
            title_match = re.search(r'職種</span>.*?<div class="fb">(.*?)</div>', table, re.DOTALL)
            title = re.sub(r'<.*?>', '', title_match.group(1)).strip() if title_match else "職種不明"

            # 3. 事業所名 (Company)
            company_match = re.search(r'事業所名</span>.*?<div.*?>(.*?)</div>', table, re.DOTALL)
            company = re.sub(r'<.*?>', '', company_match.group(1)).strip() if company_match else "企業名非公開"

            # 4. 所在地・勤務地 (Location)
            location_match = re.search(r'就業場所</span>.*?<div.*?>(.*?)</div>', table, re.DOTALL)
            location = re.sub(r'<.*?>', '', location_match.group(1)).strip() if location_match else "勤務地不明"

            # 5. 賃金 (Salary)
            salary_match = re.search(r'賃金.*?<div class="disp_inline_block">(.*?)</div>', table, re.DOTALL)
            salary = re.sub(r'<.*?>', '', salary_match.group(1)).strip() if salary_match else "給与情報なし"

            # 6. 就業時間 (Working Hours)
            hours_match = re.search(r'就業時間</span>.*?<div.*?>(.*?)</div>', table, re.DOTALL)
            hours = re.sub(r'<.*?>', '', hours_match.group(1)).strip() if hours_match else "時間指定なし"

            # 7. 休日 (Holiday)
            holiday_match = re.search(r'休日</span>.*?<div.*?>(.*?)</div>', table, re.DOTALL)
            holiday = re.sub(r'<.*?>', '', holiday_match.group(1)).strip() if holiday_match else "規定による"

            # 8. 雇用形態 (Type) - 正社員/パート等
            type_match = re.search(r'<div class="bg_label_white">(.*?)</div>', table, re.DOTALL)
            job_type = type_match.group(1).strip() if type_match else "正社員"

            # 9. 掲載日 (PostedAt)
            date_match = re.search(r'受理年月日.*?：(\d{4})年(\d{1,2})月(\d{1,2})日', table)
            if date_match:
                posted_at = f"{date_match.group(1)}-{int(date_match.group(2)):02d}-{int(date_match.group(3)):02d}"
            else:
                posted_at = TODAY

            # 10. 公式詳細URLの組み立て
            # ページ内の「詳細を表示」ボタンの hidden input や onclick からパラメータを抽出
            url = "https://www.hellowork.mhlw.go.jp/kensaku/GECA110010.do?action=initDisp&screenId=GECA110010"
            params_match = re.search(r"onclick=\"dispDetail\('(.*?)','(.*?)','(.*?)','(.*?)','(.*?)','(.*?)','(.*?)','(.*?)'\)\"", table)
            if params_match:
                p = params_match.groups()
                # p[0]: screenId, p[1]: action, p[2]: kJNo, p[3]: kJKbn, p[4]: jGSHNo, p[5]: fullPart, p[6]: iNFTeikyoRiyoDtiID, p[7]: kSNo
                url = f"https://www.hellowork.mhlw.go.jp/kensaku/GECA110010.do?screenId={p[0]}&action=dispDetailBtn&kJNo={p[2]}&kJKbn={p[3]}&jGSHNo={urllib.parse.quote(p[4])}&fullPart={p[5]}&iNFTeikyoRiyoDtiID={p[6]}&kSNo={p[7]}&tatZngy=1"

            jobs.append({
                "id": job_id,
                "title": title,
                "company": company,
                "location": location,
                "salary": salary,
                "workingHours": hours,
                "holiday": holiday,
                "type": job_type,
                "category": "障害者枠" if "（障）" in title or "【障】" in title else "一般",
                "isRemote": "在宅" in title or "リモート" in title or "テレワーク" in title,
                "postedAt": posted_at,
                "description": "ハローワーク公式ページで詳細をご確認ください。",
                "officialUrl": url
            })
        except Exception as e:
            print(f"求人項目 {i} の解析中にエラーが発生しました: {e}")

    # JavaScriptファイルとして保存
    js_content = "const initialJobsData = " + json.dumps(jobs, indent=2, ensure_ascii=False) + ";"
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(js_content)

    print(f"\n完了！ {len(jobs)} 件の求人を {output_path} に書き出しました。")
    print("ブラウザで index.html を再読み込みして確認してください。")

if __name__ == "__main__":
    extract_jobs()
