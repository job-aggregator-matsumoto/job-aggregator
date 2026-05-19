const fs = require('fs');
const path = require('path');

// === 設定 ===
const SOURCE_DIR = 'C:\\Users\\user\\OneDrive\\Documents\\求人まとめサイト';
const OUTPUT_PATH = 'c:\\Users\\user\\Google ドライブ ストリーミング\\マイドライブ\\求人情報まとめサイト\\data\\jobs_data.js';
const TODAY = new Date().toISOString().split('T')[0];

function extractField(html, label) {
    const regex = new RegExp(label + '[\\s\\S]*?<td[^>]*?>([\\s\\S]*?)<\\/td>', 'i');
    const m = html.match(regex);
    if (!m) return '';
    return m[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
}

function processFiles() {
    if (!fs.existsSync(SOURCE_DIR)) {
        console.error(`エラー: フォルダが見つかりません: ${SOURCE_DIR}`);
        return;
    }

    const files = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.html'));
    console.log(`検出されたHTMLファイル: ${files.length}件`);

    const allJobs = new Map();

    files.forEach(file => {
        const filePath = path.join(SOURCE_DIR, file);
        console.log(`処理中: ${file}`);
        try {
            const content = fs.readFileSync(filePath, 'utf8');

            // 求人テーブルの抽出
            const jobTables = content.match(/<table class="kyujin.*?".*?>([\s\S]*?)<\/table>/g) || [];
            
            jobTables.forEach((table, index) => {
                // 求人番号
                const idMatch = table.match(/求人番号.*?(\d{5}-\d{8})/s);
                const jobId = idMatch ? idMatch[1] : null;
                if (!jobId) return;

                // 職種
                const titleMatch = table.match(/class="fb">([\s\S]*?)<\/div>/);
                const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '職種不明';

                // 各項目
                const company = extractField(table, '事業所名');
                const location = extractField(table, '就業場所');
                const salary = extractField(table, '賃金');
                const hours = extractField(table, '就業時間');
                const holiday = extractField(table, '休日');
                const description = extractField(table, '仕事内容');

                // 雇用形態
                const typeMatch = table.match(/<div class="bg_label_white">([\s\S]*?)<\/div>/s);
                const jobType = typeMatch ? typeMatch[1].replace(/<[^>]+>/g, '').trim() : '正社員';

                // 受付年月日
                let postedAt = TODAY;
                const dateMatch = table.match(/受付年月日[\s\S]*?(\d{4})年(\d{1,2})月(\d{1,2})日/);
                if (dateMatch) {
                    postedAt = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
                }

                if (!allJobs.has(jobId)) {
                    allJobs.set(jobId, {
                        id: jobId,
                        title: title,
                        company: company,
                        location: location,
                        salary: salary,
                        workingHours: hours,
                        holiday: holiday,
                        type: jobType,
                        category: (title.includes('障') || title.includes('【障】') || title.includes('（障）')) ? '障害者枠' : '一般',
                        isRemote: title.includes('在宅') || title.includes('リモート') || title.includes('テレワーク'),
                        postedAt: postedAt,
                        description: description || '※詳細な仕事内容は公式ページでご確認ください。',
                        officialUrl: null,
                        isImported: true
                    });
                }
            });
        } catch (e) {
            console.error(`ファイル ${file} の処理中にエラー: ${e.message}`);
        }
    });

    const jobsList = Array.from(allJobs.values());
    // 最新順にソート
    jobsList.sort((a, b) => b.postedAt.localeCompare(a.postedAt));

    const jsContent = `const initialJobsData = ${JSON.stringify(jobsList, null, 2)};`;
    fs.writeFileSync(OUTPUT_PATH, jsContent, 'utf8');

    console.log(`\n成功！ 合計 ${jobsList.length} 件の求人を統合して ${OUTPUT_PATH} に保存しました。`);
}

processFiles();
