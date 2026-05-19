const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\user\\OneDrive\\Documents\\求人まとめサイト\\ハローワークインターネットサービス - 求人情報検索・一覧一般在宅.html', 'utf8');

const jobTables = content.match(/<table class="kyujin.*?".*?>([\s\S]*?)<\/table>/g) || [];
console.log(`検出されたテーブル数: ${jobTables.length}`);

jobTables.forEach((table, i) => {
    const idMatch = table.match(/求人番号.*?(\d{5}-\d{8})/s);
    const dateMatch = table.match(/受付年月日[\s\S]*?(\d{4})年(\d{1,2})月(\d{1,2})日/);
    console.log(`[Job ${i}] ID: ${idMatch ? idMatch[1] : 'なし'}, Date: ${dateMatch ? dateMatch[1]+'-'+dateMatch[2]+'-'+dateMatch[3] : 'なし'}`);
});
