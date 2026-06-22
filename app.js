let allJobs = [];
let favorites = JSON.parse(localStorage.getItem('hw_favorites') || '[]');
let showFavoritesOnly = false;

function init() {
    try {
        // サービスのお知らせ注意書きをロード
        const savedNotice = localStorage.getItem('hw_service_notice');
        if (savedNotice) {
            const noticeTextEl = document.getElementById('service-notice-text');
            if (noticeTextEl) {
                noticeTextEl.textContent = savedNotice;
            }
        }

        if (typeof initialJobsData === 'undefined') {
            throw new Error('データが見つかりません');
        }

        // 1. LocalStorageから保存されたインポートデータを読み込む
        let importedJobs = [];
        const savedJobs = localStorage.getItem('importedJobs');
        if (savedJobs) {
            try {
                importedJobs = JSON.parse(savedJobs);
            } catch (e) {
                console.error('保存されたデータのパースに失敗しました', e);
            }
        }

        // 2. data/jobs_data.js からのデータを読み込む (initialJobsData)
        let fileJobs = [];
        if (localStorage.getItem('sync_data_hidden') !== 'true') {
            fileJobs = (typeof initialJobsData !== 'undefined') ? initialJobsData : [];
        }

        // 3. 重複を排除して統合 (localStorageのデータを優先)
        const mergedJobs = [...importedJobs];
        fileJobs.forEach(fj => {
            if (!mergedJobs.some(mj => mj.id === fj.id)) {
                mergedJobs.push(fj);
            }
        });

        allJobs = mergedJobs.map(job => {
            if (job.category !== '障害者枠' && 
                ((job.type && job.type.includes('会計年度任用職員')) || 
                 (job.title && job.title.includes('会計年度任用職員')))) {
                job.category = '会計年度任用職員';
            }
            return job;
        });
        
        // 更新日時を表示
        if (typeof lastUpdated !== 'undefined') {
            document.getElementById('last-updated-time').textContent = lastUpdated;
        }

        // バックアップの有無を確認して復元ボタンを表示
        checkBackupStatus();

        // 初期表示時にフィルターを適用
        filterJobs();
    } catch (error) {
        console.error('Error loading jobs:', error);
        document.getElementById('job-grid').innerHTML = 
            `<p style="text-align:center; grid-column: 1/-1; padding: 40px; color: var(--danger);">
                求人データの読み込み中にエラーが発生しました。
            </p>`;
    }
}

// Googleドライブからの同期を確認する関数
function syncFromGoogleDrive() {
    localStorage.removeItem('sync_data_hidden'); // 同期データの非表示フラグを解除
    const time = typeof lastUpdated !== 'undefined' ? lastUpdated : '不明';
    
    // バックグラウンド同期の説明
    alert(`【Googleドライブ同期】\n\n最終同期日時: ${time}\n\nこのシステムは、お使いのPCのGoogleドライブ（共有ドライブ\\求人情報PDF）と自動的に同期するように設定されています。\n\n最新の求人が反映されていない場合は、背景で動作している同期プログラム（auto_sync.ps1）が完了しているか確認し、完了後にこのページを再読み込み（F5キー）してください。`);
    
    // ページをリロードして最新の data/jobs_data.js を読み込み直す
    location.reload();
}

function renderJobs(jobsToRender) {
    const grid = document.getElementById('job-grid');
    const countEl = document.getElementById('result-count');
    
    grid.innerHTML = '';
    if (countEl) {
        countEl.innerHTML = `<span>${jobsToRender.length}</span> 件の求人が見つかりました`;
    }

    if (jobsToRender.length === 0) {
        grid.innerHTML = `
            <div style="text-align:center; grid-column: 1/-1; padding: 80px 20px; color: var(--text-muted); background: var(--card-bg); border-radius: 20px; border: 1px solid var(--border-color);">
                <i class="fab fa-google-drive fa-3x" style="margin-bottom: 20px; color: var(--primary); opacity: 0.8; display:block;"></i>
                <p style="font-size: 1.2rem; font-weight: bold; color: var(--text-main); margin-bottom: 10px;">求人データがありません</p>
                <p>画面右上の「Googleドライブ同期」ボタンを押して、最新の求人情報を確認してください。</p>
                <p style="font-size: 0.8rem; margin-top: 10px;">（背景の自動同期プログラム auto_sync.ps1 が最新のHTMLを解析して表示します）</p>
            </div>`;
        return;
    }

    jobsToRender.forEach((job, index) => {
        const card = document.createElement('div');
        card.className = 'job-card';
        card.style.animationDelay = `${index * 0.1}s`;
        
        let categoryClass = 'category-general';
        if (job.category === '障害者枠') categoryClass = 'category-disability';
        if (job.category === '会計年度任用職員') categoryClass = 'category-gov';
        const remoteBadge = job.isRemote ? '<span class="remote-badge">在宅OK</span>' : '';
        
        // NEWバッジの判定（投稿日から14日以内）
        let isRecent = false;
        if (job.postedAt) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const [y, m, d] = job.postedAt.split('-').map(Number);
            const postedDate = new Date(y, m - 1, d);
            postedDate.setHours(0, 0, 0, 0);
            const diffDays = Math.floor((today - postedDate) / (1000 * 60 * 60 * 24));
            isRecent = diffDays <= 14;
        }
        
        const newBadge = job.isImported ? `<span class="badge-real">リアル求人</span>${isRecent ? '<span class="badge-new">NEW</span>' : ''}` : '';
        const isFav = favorites.includes(job.id);
        const favIconClass = isFav ? 'fas' : 'far';
        const favActiveClass = isFav ? 'active' : '';

        card.innerHTML = `
            <button class="btn-favorite ${favActiveClass}" onclick="toggleFavorite(event, '${job.id}')" title="お気に入り">
                <i class="${favIconClass} fa-star"></i>
            </button>
            <div style="margin-bottom: 12px; position: relative;">
                ${newBadge}
                <span class="job-type">${job.type}</span>
                <span class="category-badge ${categoryClass}">${job.category}</span>
                ${remoteBadge}
            </div>
            <h2 class="job-title">${job.title}</h2>
            <div class="company-name">
                <i class="far fa-building"></i> ${job.company}
            </div>
            <div class="job-details">
                <div class="detail-item">
                    <i class="fas fa-map-marker-alt"></i> ${job.location}
                </div>
                <div class="detail-item salary">
                    <i class="fas fa-yen-sign"></i> ${job.salary || '規定による'}
                </div>
                <div class="detail-item">
                    <i class="far fa-clock"></i> ${job.workingHours || '規定による'}
                </div>
            </div>
            <p style="font-size: 0.8rem; color: var(--text-muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 20px;">
                ${job.description || '※詳細な仕事内容は公式ページでご確認ください。'}
            </p>
            <div class="posted-at" onclick="promptDateEdit(event, '${job.id}')" title="クリックして日付を修正">
                <i class="far fa-calendar-alt"></i> 受付年月日：<span class="editable-date">${formatDate(job.postedAt)}</span>
                <i class="fas fa-pen" style="font-size: 0.7rem; margin-left: 5px; opacity: 0.5;"></i>
            </div>
        `;

        card.onclick = () => openModal(job);

        grid.appendChild(card);
    });
}

function filterJobs() {
    const keyword = document.getElementById('keyword').value.toLowerCase();
    const location = document.getElementById('location').value;
    const category = document.getElementById('category').value;
    const period = document.getElementById('period').value;
    const sortOrder = document.getElementById('sort-order').value;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let filtered = allJobs.filter(job => {
        let matchesKeyword = true;
        if (keyword) {
            // 全角・半角スペースでキーワードを分割して配列化
            const words = keyword.split(/[\s\u3000]+/);
            // 分割されたすべての単語（AND条件）が含まれているかチェック
            matchesKeyword = words.every(word => {
                if (!word) return true;
                
                const titleStr = job.title || '';
                const compStr = job.company || '';
                const typeStr = job.type || '';
                const descStr = job.description || '';
                const salaryStr = job.salary || '規定による';
                const hoursStr = job.workingHours || '規定による';
                const holidayStr = job.holiday || '規定による';
                
                return titleStr.toLowerCase().includes(word) || 
                       compStr.toLowerCase().includes(word) ||
                       typeStr.toLowerCase().includes(word) ||
                       descStr.toLowerCase().includes(word) ||
                       salaryStr.toLowerCase().includes(word) ||
                       hoursStr.toLowerCase().includes(word) ||
                       holidayStr.toLowerCase().includes(word);
            });
        }
        
        const matchesLocation = !location || job.location.includes(location) || (location === '在宅' && job.isRemote);
        const matchesCategory = !category || job.category === category;
        const matchesFavorite = !showFavoritesOnly || favorites.includes(job.id);

        // 期間検索
        let matchesPeriod = true;
        if (period !== 'all') {
            const [y, m, d] = job.postedAt.split('-').map(Number);
            const postedDate = new Date(y, m - 1, d);
            postedDate.setHours(0, 0, 0, 0);
            
            // ミリ秒単位の差分を日に変換
            const diffTime = today - postedDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            // diffDaysが0なら今日、1なら昨日...
            matchesPeriod = diffDays >= 0 && diffDays < parseInt(period);
        }

        return matchesKeyword && matchesLocation && matchesCategory && matchesPeriod && matchesFavorite;
    });

    // ソート処理
    if (sortOrder === 'date-desc') {
        filtered.sort((a, b) => b.postedAt.localeCompare(a.postedAt));
    } else if (sortOrder === 'date-asc') {
        filtered.sort((a, b) => a.postedAt.localeCompare(b.postedAt));
    } else if (sortOrder === 'salary-desc') {
        filtered.sort((a, b) => {
            const getVal = s => {
                const match = s.match(/(\d+)[\uff0c,]*\d*/);
                return match ? parseInt(match[0].replace(/[\uff0c,]/g, '')) : 0;
            };
            return getVal(b.salary) - getVal(a.salary);
        });
    }

    renderJobs(filtered);
}

// Modal Logic
function openModal(job) {
    const modal = document.getElementById('job-modal');
    const body = document.getElementById('modal-body');
    
    let categoryClass = 'category-general';
    if (job.category === '障害者枠') categoryClass = 'category-disability';
    if (job.category === '会計年度任用職員') categoryClass = 'category-gov';

    body.innerHTML = `
        <div class="modal-header">
            <div style="margin-bottom: 15px;">
                <span class="job-type">${job.type}</span>
                <span class="category-badge ${categoryClass}">${job.category}</span>
            </div>
            <h2 class="modal-title">${job.title}</h2>
            <div class="modal-company">${job.company}</div>
        </div>
        
        <div class="modal-grid">
            <div class="modal-item">
                <div class="modal-item-label"><i class="fas fa-map-marker-alt"></i> 勤務地</div>
                <div class="modal-item-value">${job.location || '情報なし'}</div>
            </div>
            <div class="modal-item clickable" onclick="promptFieldEdit(event, '${job.id}', 'salary', '給与')" title="クリックして給与を修正">
                <div class="modal-item-label"><i class="fas fa-yen-sign"></i> 給与 (修正可能)</div>
                <div class="modal-item-value">${job.salary || '規定による'} <i class="fas fa-pen" style="font-size: 0.8rem; opacity: 0.5;"></i></div>
            </div>
            <div class="modal-item clickable" onclick="promptFieldEdit(event, '${job.id}', 'workingHours', '勤務時間')" title="クリックして勤務時間を修正">
                <div class="modal-item-label"><i class="far fa-clock"></i> 勤務時間 (修正可能)</div>
                <div class="modal-item-value">${job.workingHours || '規定による'} <i class="fas fa-pen" style="font-size: 0.8rem; opacity: 0.5;"></i></div>
            </div>
            <div class="modal-item">
                <div class="modal-item-label"><i class="far fa-calendar-alt"></i> 休日</div>
                <div class="modal-item-value">${job.holiday || '規定による'}</div>
            </div>
            <div class="modal-item">
                <div class="modal-item-label"><i class="fas fa-hashtag"></i> 求人番号</div>
                <div class="modal-item-value">${job.id}</div>
            </div>
            <div class="modal-item clickable" onclick="promptDateEdit(event, '${job.id}')" title="クリックして日付を修正">
                <div class="modal-item-label"><i class="far fa-calendar-check"></i> 受付年月日 (修正可能)</div>
                <div class="modal-item-value"><span class="editable-date">${formatDate(job.postedAt)}</span> <i class="fas fa-pen" style="font-size: 0.8rem; opacity: 0.5;"></i></div>
            </div>
        </div>
        
        <div class="modal-description clickable" onclick="promptFieldEdit(event, '${job.id}', 'description', '仕事内容・特徴', true)" title="クリックして仕事内容を修正" style="cursor: pointer; padding: 10px; border-radius: 8px; transition: background-color 0.2s;">
            <h3>仕事内容・特徴 (クリックして修正) <i class="fas fa-pen" style="font-size: 0.8rem; opacity: 0.5; margin-left: 5px;"></i></h3>
            <p style="white-space: pre-wrap;">${job.description || '※詳細な仕事内容は公式ページでご確認ください。'}</p>
        </div>
        </div>
        
        <div style="margin-top: 40px; text-align: center;">
            ${(job.officialUrl && job.officialUrl !== 'https://www.hellowork.mhlw.go.jp/') 
                ? `<button class="btn-search" onclick="copyAndGoToOfficial('${job.id}')" style="background-color: var(--primary); color: white; padding: 12px 24px; border-radius: 8px; border: none; cursor: pointer; font-size: 1rem; font-weight: bold; transition: all 0.3s ease;">
                    <i class="fas fa-external-link-alt"></i> 応募・詳細を公式で見る
                   </button>
                   <p style="margin-top: 10px; font-size: 0.8rem; color: var(--text-muted);">
                       ※公式の詳細ページへ直接ジャンプします<br>削除済みだった場合は下のボタンで一覧から削除できます。
                   </p>`
                : `<button class="btn-search" onclick="copyAndGoToOfficial('${job.id}')" style="background-color: var(--primary); color: white; padding: 12px 24px; border-radius: 8px; border: none; cursor: pointer; font-size: 1rem; font-weight: bold; transition: all 0.3s ease;">
                    <i class="fas fa-copy"></i> 求人番号をコピーして公式で検索する
                   </button>
                   <p style="margin-top: 10px; font-size: 0.8rem; color: var(--text-muted);">
                       ※ハローワークのシステム仕様上、直接のリンクが厳しく制限されています。<br>トップページの「求人番号検索」から番号を貼り付けてご確認ください。
                   </p>`
            }
            <div style="margin-top: 16px;">
                <button onclick="deleteJob('${job.id}')" style="background-color: transparent; color: var(--danger, #e74c3c); border: 1px solid var(--danger, #e74c3c); padding: 8px 18px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: bold; transition: all 0.2s ease;" onmouseover="this.style.backgroundColor='var(--danger,#e74c3c)';this.style.color='white'" onmouseout="this.style.backgroundColor='transparent';this.style.color='var(--danger,#e74c3c)'">
                    <i class="fas fa-trash-alt"></i> ハローワークで削除済み・一覧から削除する
                </button>
            </div>
        </div>
    `;
    
    modal.style.display = "block";
    document.body.style.overflow = "hidden"; // Prevent scrolling
}

// 確実な公式ページへの遷移ロジック
function copyAndGoToOfficial(jobId) {
    const job = allJobs.find(j => j.id === jobId);

    // インポートした本物のデータ（セキュリティパス付きのURLがある）場合は直接飛ぶ！
    if (job && job.officialUrl && job.officialUrl !== 'https://www.hellowork.mhlw.go.jp/') {
        // ハローワークに飛ぶ前に、どの求人を確認しに行ったか記録する
        sessionStorage.setItem('checking_job_id', jobId);
        window.open(job.officialUrl, '_blank');
        return;
    }

    // デモデータの場合は、コピー＆ペースト方式で回避する
    navigator.clipboard.writeText(jobId).then(() => {
        alert(`求人番号「${jobId}」をコピーしました！\n\nハローワークのシステム仕様により直接画面を開くことができないため、開いた画面の「求人番号を指定して検索」に貼り付けて検索してください。`);
        window.open('https://www.hellowork.mhlw.go.jp/', '_blank');
    }).catch(err => {
        console.error('クリップボードへのコピーに失敗しました', err);
        alert(`お手数ですが、求人番号「${jobId}」をメモして、ハローワークのサイトで検索してください。`);
        window.open('https://www.hellowork.mhlw.go.jp/', '_blank');
    });
}

// 求人を一覧から削除する関数
function deleteJob(jobId) {
    const job = allJobs.find(j => j.id === jobId);
    if (!job) return;

    const confirmed = confirm(`「${job.title}」\n(${job.company})\n\nをハローワークで削除済みとして、一覧から削除しますか？\n\n※この操作は取り消せません。`);
    if (!confirmed) return;

    // メモリ上から削除
    allJobs = allJobs.filter(j => j.id !== jobId);

    // LocalStorage のインポートデータからも削除
    const savedJobs = localStorage.getItem('importedJobs');
    if (savedJobs) {
        try {
            let importedJobs = JSON.parse(savedJobs);
            importedJobs = importedJobs.filter(j => j.id !== jobId);
            localStorage.setItem('importedJobs', JSON.stringify(importedJobs));
        } catch (e) {
            console.error('削除処理中にエラー', e);
        }
    }

    // sessionStorageのフラグをクリア
    sessionStorage.removeItem('checking_job_id');

    closeModal();
    filterJobs();
    showToast(`求人を一覧から削除しました。`);
}

function closeModal() {
    const modal = document.getElementById('job-modal');
    modal.style.display = "none";
    document.body.style.overflow = "auto";
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    
    // Close modal events
    const modal = document.getElementById('job-modal');
    const closeBtn = document.querySelector('.close-modal');
    
    closeBtn.onclick = closeModal;
    
    window.onclick = (event) => {
        if (event.target == modal) {
            closeModal();
        }
    };

    document.getElementById('keyword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            filterJobs();
        }
    });

    // ハローワークのタブから戻ってきたとき、求人が削除済みか自動確認する
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            const checkingJobId = sessionStorage.getItem('checking_job_id');
            if (checkingJobId) {
                sessionStorage.removeItem('checking_job_id');
                const job = allJobs.find(j => j.id === checkingJobId);
                if (job) {
                    // 少し遅らせてからダイアログを出す（タブ切り替えの描画が完了してから）
                    setTimeout(() => {
                        const wasDeleted = confirm(`【ハローワーク確認】\n\n「${job.title}」(${job.company})\n\nこの求人はハローワークで「削除済み」または「見つからない」状態でしたか？\n\n→ はい：一覧から削除します\n→ いいえ：そのまま残します`);
                        if (wasDeleted) {
                            deleteJob(checkingJobId);
                        }
                    }, 500);
                }
            }
        }
    });

    // データのインポート処理（ハローワークのHTMLを解析）
    document.getElementById('import-html').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // FileReaderで読み込む (文字コード自動判別を試みる)
        const reader = new FileReader();
        reader.onload = function(event) {
        const arrayBuffer = event.target.result;
        
        // まずはUTF-8でデコード
        let decoder = new TextDecoder('utf-8');
        let text = decoder.decode(arrayBuffer);
        
        // UTF-8として不正なバイト列が含まれている場合、代替文字（\uFFFD）になる
        if (text.includes('\uFFFD') || text.includes('charset=Shift_JIS')) {
            // Shift_JIS (CP932) で再試行
            decoder = new TextDecoder('shift-jis');
            text = decoder.decode(arrayBuffer);
        }
        
        parseHelloWorkHtml(text);
        // 連続して同じファイルを読み込めるようにリセット
        e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
});
});

// ハローワークのHTMLを解析して求人データを抽出する関数
function parseHelloWorkHtml(htmlText) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        const jobTables = doc.querySelectorAll('table.kyujin');
        
        if (jobTables.length === 0) {
            alert('求人データが見つかりませんでした。正しいハローワークの検索結果ページ（HTML）を選択してください。');
            return;
        }

        const newJobs = [];
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        // ページ全体から共通のセキュリティパス（jGSHNo）を探し出す
        const globalTokenMatch = htmlText.match(/name="jGSHNo"\s+value="([^"]+)"/i) || htmlText.match(/jGSHNo[=']([^&'"\s\)\>]+)/i);
        const jGSHNo = globalTokenMatch ? globalTokenMatch[1] : '';

        jobTables.forEach((table, index) => {
            try {
                const html = table.innerHTML;
                
                // ヘルパー関数: ラベルの後に続くデータセル（td）の内容を抽出
                const extractField = (label) => {
                    // ラベルから始まり、最初に出現するtdの中身をキャプチャする（最短一致）
                    const regex = new RegExp(label + '[\\s\\S]*?<td[^>]*?>([\\s\\S]*?)<\\/td>', 'i');
                    const m = html.match(regex);
                    if (!m) return '';
                    // HTMLタグを除去し、改行を保持
                    let text = m[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
                    // 全角スペースを半角に変換し、連続スペースを圧縮、行頭・行末のスペースをトリム
                    text = text.replace(/\u3000/g, ' ').replace(/ +/g, ' ').replace(/^[ ]+|[ ]+$/gm, '');
                    return text.trim();
                };

                // 求人番号
                const idMatch = html.match(/求人番号.*?(\d{5}-\d{8})/s);
                const jobId = idMatch ? idMatch[1] : `ID-${index}`;

                // 職種（通常 fb クラスの要素に入っている）
                const titleNode = table.querySelector('.fb');
                const title = titleNode ? titleNode.textContent.trim() : '職種不明';

                // 各項目の抽出
                const company = extractField('事業所名');
                const location = extractField('就業場所');
                let salary = extractField('賃金(?:・手当)?'); // 「賃金・手当」などもヒットするように
                const hours = extractField('就業時間');
                const holiday = extractField('休日');
                let description = extractField('仕事(?:の)?内容'); // 「仕事内容」と「仕事の内容」の両方に対応
                
                // 雇用形態の抽出（複数のパターンを試行）
                let jobType = '';
                
                // 1. ラベル形式の要素を探す (検索結果一覧のバッジなど)
                // 「閲覧済」や「新着」などのステータスバッジを除外するために、テキストを確認する
                const typeLabels = html.matchAll(/<(?:div|span)[^>]*class="[^"]*bg_label[^"]*"[^>]*>([\s\S]*?)<\/(?:div|span)>/gs);
                for (const match of typeLabels) {
                    const text = match[1].replace(/<[^>]+>/g, '').trim();
                    if (text && text !== '閲覧済' && text !== '新着' && text !== '詳細を表示' && text !== '求人票を表示') {
                        jobType = text;
                        break; // 最初の有効なラベルを採用
                    }
                }
                
                // 2. 表内のラベル（求人区分 or 雇用形態）を探す (詳細表示や特定のレイアウトで一般的)
                if (!jobType || jobType === '正社員') {
                    const rowType = extractField('求人区分') || extractField('雇用形態');
                    if (rowType) jobType = rowType;
                }
                
                // 3. テキストからキーワードを直接探す (最終的なフォールバック)
                if (!jobType || jobType === '正社員') {
                    if (html.includes('正社員以外')) {
                        jobType = '正社員以外';
                    } else if (html.includes('無期雇用')) {
                        jobType = '無期雇用';
                    } else if (html.includes('パート')) {
                        jobType = 'パート';
                    } else if (!jobType) {
                        jobType = '正社員';
                    }
                }
                
                // 表記の統一（ユーザー要望に合わせる）
                // より具体的な表記（「正社員以外」など）を優先し、それ以外は標準的な表記に統一
                if (jobType.includes('正社員以外')) jobType = '正社員以外';
                else if (jobType.includes('正社員')) jobType = '正社員';
                
                if (jobType.includes('パート')) jobType = 'パート';
                if (jobType.includes('無期雇用')) jobType = '無期雇用';
                if (jobType.includes('有期雇用')) jobType = '有期雇用';

                // 受理年月日（重要：判定の基準になる日付）
                let postedAt = today;
                
                // より柔軟な正規表現（コロンの有無、全角半角、スペースなどに対応）
                // 1. 受付年月日 2026年4月28日 形式
                // 2. 受注年月日：2026年04月28日 形式
                const dateMatch = html.match(/(受理|受付)年月日[\s\S]*?(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/);
                
                if (dateMatch) {
                    postedAt = `${dateMatch[2]}-${dateMatch[3].padStart(2, '0')}-${dateMatch[4].padStart(2, '0')}`;
                } else {
                    // テーブルの外（ヘッダー部分など）に書かれている場合も探す
                    const globalDateMatch = htmlText.match(/(受理|受付)年月日[\s\S]*?(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/);
                    if (globalDateMatch) {
                        postedAt = `${globalDateMatch[2]}-${globalDateMatch[3].padStart(2, '0')}-${globalDateMatch[4].padStart(2, '0')}`;
                    }
                }

                // 仕事内容が空の場合のフォールバック
                if (!description) description = '※詳細な仕事内容は公式ページでご確認ください。';
                // 連続する空白や改行を整形
                description = description.replace(/\n\s+/g, '\n').replace(/\n{3,}/g, '\n\n');

                // 公式URLの構築 (ID_dispDetailBtnのhref属性から直接URLを取得)
                let officialUrl = null;
                // まずDOMから直接する方法を試みる
                const detailBtn = table.querySelector('#ID_dispDetailBtn, a[href*="GECA110010"]');
                if (detailBtn && detailBtn.href) {
                    officialUrl = detailBtn.href;
                }

                newJobs.push({
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
                    description: description,
                    officialUrl: officialUrl,
                    isImported: true
                });

            } catch (err) {
                console.error('個別の求人解析エラー', err);
            }
        });

        if (newJobs.length > 0) {
            // 既存のインポートデータを取得して追加する（最新を上に）
            let savedImported = [];
            const prevSaved = localStorage.getItem('importedJobs');
            if (prevSaved) {
                try { savedImported = JSON.parse(prevSaved); } catch(e){}
            }
            
            // IDの重複を排除して結合
            const mergedJobs = [...newJobs];
            savedImported.forEach(sj => {
                if (!mergedJobs.some(nj => nj.id === sj.id)) {
                    mergedJobs.push(sj);
                }
            });

            // LocalStorageに保存
            localStorage.setItem('importedJobs', JSON.stringify(mergedJobs));
            localStorage.removeItem('sync_data_hidden'); // 新規インポート時は非表示フラグを解除
            
            // 全データを再結合して表示を更新するため、init()を呼び出す
            init();
            
            alert(`成功しました！\n最新の求人データを ${newJobs.length}件 読み込み、ブラウザに保存しました。\n（次回以降も保存された状態で表示されます）`);
        }

    } catch (error) {
        console.error('HTML解析エラー:', error);
        alert('ファイルの解析中にエラーが発生しました。');
    }
}

// インポートデータをクリアする関数
async function clearImportedData() {
    // 現在のデータを取得
    const currentData = localStorage.getItem('importedJobs');
    if (!currentData || JSON.parse(currentData).length === 0) {
        showToast('クリアするデータがありません。');
        return;
    }

    const message = '保存されているすべての求人データを削除し、初期状態に戻します。\n（直前のデータは一度だけ復元可能です）\n本当にクリアしますか？';
    const confirmed = await showCustomConfirm('警告：データの全削除', message);
    
    if (confirmed) {
        try {
            // バックアップを作成する前に、一旦変数に逃がして既存データを消す（容量制限対策）
            const dataToBackup = currentData;
            
            // 既存データを先に削除して容量を空ける
            localStorage.removeItem('importedJobs');
            localStorage.setItem('sync_data_hidden', 'true'); // 同期データも一時的に非表示にする
            
            // バックアップとして保存を試みる
            try {
                localStorage.setItem('importedJobs_backup', dataToBackup);
            } catch (e) {
                console.warn('バックアップの保存に失敗しました（容量制限の可能性があります）', e);
                // バックアップに失敗しても、クリア自体は続行
            }
            
            // 表示を更新
            init(); 
            showToast('データをクリアしました。');
        } catch (error) {
            console.error('クリア処理中にエラーが発生しました', error);
            showToast('エラーが発生しました。一部のデータが残っている可能性があります。');
        }
    }
}

// クリアしたデータを復元する関数
function restoreImportedData() {
    const backup = localStorage.getItem('importedJobs_backup');
    if (!backup) {
        showToast('復元できるバックアップがありません。');
        return;
    }

    localStorage.setItem('importedJobs', backup);
    localStorage.removeItem('importedJobs_backup'); // 復元後はバックアップを消す
    localStorage.removeItem('sync_data_hidden'); // 復元時は非表示フラグも解除
    
    init();
    showToast('データを正常に復元しました。');
}

// バックアップの有無を確認してUIを更新する関数
function checkBackupStatus() {
    const restoreBtn = document.getElementById('restore-data');
    if (!restoreBtn) return;
    
    const backup = localStorage.getItem('importedJobs_backup');
    console.log('Checking backup status...', backup ? 'Backup found' : 'No backup found');
    
    if (backup) {
        try {
            const backupData = JSON.parse(backup);
            console.log(`Backup data contains ${backupData.length} jobs.`);
            if (backupData.length > 0) {
                restoreBtn.style.display = 'inline-block';
                restoreBtn.innerHTML = `<i class="fas fa-undo"></i> 直前のデータを復元 (${backupData.length}件)`;
            } else {
                restoreBtn.style.display = 'none';
            }
        } catch (e) {
            console.error('バックアップデータの解析に失敗しました', e);
            restoreBtn.style.display = 'none';
        }
    } else {
        restoreBtn.style.display = 'none';
    }
}

// カスタム確認モーダルを表示する関数
function showCustomConfirm(title, message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        const titleEl = document.getElementById('confirm-title');
        const messageEl = document.getElementById('confirm-message');
        const okBtn = document.getElementById('confirm-ok');
        const cancelBtn = document.getElementById('confirm-cancel');

        titleEl.textContent = title;
        messageEl.textContent = message;
        modal.style.display = "block";
        document.body.style.overflow = "hidden";

        const cleanup = (result) => {
            modal.style.display = "none";
            document.body.style.overflow = "auto";
            okBtn.onclick = null;
            cancelBtn.onclick = null;
            resolve(result);
        };

        okBtn.onclick = () => cleanup(true);
        cancelBtn.onclick = () => cleanup(false);
        
        // モーダル外クリックでキャンセル
        modal.onclick = (e) => {
            if (e.target === modal) cleanup(false);
        };
    });
}

// 日付の修正プロンプトを表示する関数
function promptDateEdit(event, jobId) {
    if (event) event.stopPropagation(); // カードクリック（モーダル開く）を防ぐ
    
    const job = allJobs.find(j => j.id === jobId);
    if (!job) return;

    const currentDisplayDate = formatDate(job.postedAt);
    const newDateStr = prompt(`${job.title}\nの受付年月日を修正します。\n形式: YYYY-MM-DD (例: 2026-05-08)`, job.postedAt);

    if (newDateStr && newDateStr !== job.postedAt) {
        // 簡易的なバリデーション
        if (/^\d{4}-\d{2}-\d{2}$/.test(newDateStr)) {
            updateJobDate(jobId, newDateStr);
        } else {
            alert('日付の形式が正しくありません。YYYY-MM-DD 形式で入力してください。');
        }
    }
}

// 特定の求人の日付を更新して保存する関数
function updateJobDate(jobId, newDate) {
    const jobIndex = allJobs.findIndex(j => j.id === jobId);
    if (jobIndex === -1) return;

    // メモリ上のデータを更新
    allJobs[jobIndex].postedAt = newDate;

    // LocalStorageに保存されているインポートデータを更新
    let importedJobs = [];
    const savedJobs = localStorage.getItem('importedJobs');
    if (savedJobs) {
        try {
            importedJobs = JSON.parse(savedJobs);
            const impIndex = importedJobs.findIndex(j => j.id === jobId);
            if (impIndex !== -1) {
                importedJobs[impIndex].postedAt = newDate;
                localStorage.setItem('importedJobs', JSON.stringify(importedJobs));
            }
        } catch (e) {
            console.error('保存データの更新に失敗', e);
        }
    }

    // 表示を更新
    filterJobs();
    
    // モーダルが開いていれば更新
    const modal = document.getElementById('job-modal');
    if (modal.style.display === "block") {
        openModal(allJobs[jobIndex]);
    }

    showToast('日付を修正しました。');
}

// 特定の求人の任意のフィールドを修正するプロンプトを表示する関数
function promptFieldEdit(event, jobId, fieldName, fieldLabel, isLongText) {
    if (event) event.stopPropagation(); // イベントのバブリング防止
    
    const job = allJobs.find(j => j.id === jobId);
    if (!job) return;

    const currentValue = job[fieldName] || '';
    let newValue;
    
    if (isLongText) {
        // 改行を含んだ編集に対応するため、プロンプトに表示するメッセージを分かりやすく
        newValue = prompt(`${job.company}\n「${job.title}」の「${fieldLabel}」を修正します。\n（改行はそのまま入力するか、コピーした内容を貼り付けてください）`, currentValue);
    } else {
        newValue = prompt(`${job.company}\n「${job.title}」の「${fieldLabel}」を修正します。`, currentValue);
    }

    if (newValue !== null && newValue !== currentValue) {
        updateJobField(jobId, fieldName, newValue);
    }
}

// 特定の求人のフィールドを更新して保存する関数
function updateJobField(jobId, fieldName, newValue) {
    const jobIndex = allJobs.findIndex(j => j.id === jobId);
    if (jobIndex === -1) return;

    // メモリ上のデータを更新
    allJobs[jobIndex][fieldName] = newValue;

    // LocalStorageに保存されているインポートデータ（上書き優先リスト）を取得
    let importedJobs = [];
    const savedJobs = localStorage.getItem('importedJobs');
    if (savedJobs) {
        try {
            importedJobs = JSON.parse(savedJobs);
        } catch (e) {
            console.error('保存データのパース失敗', e);
        }
    }

    const impIndex = importedJobs.findIndex(j => j.id === jobId);
    if (impIndex !== -1) {
        // すでにインポートリストにある場合はそこを更新
        importedJobs[impIndex][fieldName] = newValue;
    } else {
        // 同期データの場合は、同期データをベースとしたコピーを作成してインポートリスト（上書き優先リスト）に追加！
        const newImportedJob = { ...allJobs[jobIndex] };
        newImportedJob[fieldName] = newValue;
        newImportedJob.isImported = true; // 上書きフラグ
        importedJobs.push(newImportedJob);
    }

    // LocalStorageに保存
    localStorage.setItem('importedJobs', JSON.stringify(importedJobs));

    // 表示を更新
    filterJobs();
    
    // モーダルが開いていれば再レンダリングして即時反映！
    const modal = document.getElementById('job-modal');
    if (modal.style.display === "block") {
        openModal(allJobs[jobIndex]);
    }

    showToast('情報を修正しました。');
}

// トースト通知を表示する関数
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // アニメーションのために微小な遅延を入れる
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// Toggle favorite status for a job
function toggleFavorite(event, jobId) {
    // Prevent the card click which opens modal
    if (event) event.stopPropagation();

    const isFav = favorites.includes(jobId);
    if (isFav) {
        // Remove from favorites
        favorites = favorites.filter(id => id !== jobId);
    } else {
        favorites.push(jobId);
    }
    // Persist to localStorage
    localStorage.setItem('hw_favorites', JSON.stringify(favorites));

    // Update UI: find the button for this job and toggle classes
    const btn = event.currentTarget; // the button element itself
    if (btn) {
        const icon = btn.querySelector('i');
        if (icon) {
            if (isFav) {
                // was favorite, now removing
                icon.classList.remove('fas');
                icon.classList.add('far');
                btn.classList.remove('active');
            } else {
                // adding favorite
                icon.classList.remove('far');
                icon.classList.add('fas');
                btn.classList.add('active');
            }
        }
    }

    // お気に入りフィルターが有効な場合、即座にリストを更新して非表示にする
    if (showFavoritesOnly) {
        filterJobs();
    }
}

// お気に入りフィルターの切り替え
function toggleFavoriteFilter() {
    showFavoritesOnly = !showFavoritesOnly;
    
    const btn = document.getElementById('favorite-filter');
    const icon = btn.querySelector('i');
    
    if (showFavoritesOnly) {
        btn.classList.add('active');
        if (icon) {
            icon.classList.remove('far');
            icon.classList.add('fas');
        }
    } else {
        btn.classList.remove('active');
        if (icon) {
            icon.classList.remove('fas');
            icon.classList.add('far');
        }
    }
    
    filterJobs();
}

// 日付を「YYYY年MM月DD日」形式に変換する関数
function formatDate(dateStr) {
    if (!dateStr || !dateStr.includes('-')) return dateStr || '不明';
    const [y, m, d] = dateStr.split('-');
    return `${y}年${parseInt(m)}月${parseInt(d)}日`;
}

// サービス注意書きを編集する関数
function editServiceNotice() {
    const noticeTextEl = document.getElementById('service-notice-text');
    if (!noticeTextEl) return;

    const currentText = noticeTextEl.textContent;
    const newText = prompt('求人検索サービスのトップ注意書きを編集します。\n（空欄にすると初期の注意書きに戻ります）', currentText);

    if (newText !== null) {
        const trimmedText = newText.trim();
        if (trimmedText === '') {
            // 空欄の場合はデフォルト値に戻す
            const defaultText = '※障害者雇用求人は、勤務地は近畿だけを載せています。また、在宅可能と、通勤の両方の求人を載せています。※一般求人の方では、全国にある在宅勤務可能な求人だけを載せています。通勤が必要な求人は一般求人では、載せていません。';
            noticeTextEl.textContent = defaultText;
            localStorage.removeItem('hw_service_notice');
            showToast('注意書きを初期値に戻しました。');
        } else {
            noticeTextEl.textContent = trimmedText;
            localStorage.setItem('hw_service_notice', trimmedText);
            showToast('注意書きを更新しました。');
        }
    }
}

// 手動編集データをJSONファイルとしてエクスポートする関数
function exportManualEdits() {
    const savedJobs = localStorage.getItem('importedJobs');
    if (!savedJobs || JSON.parse(savedJobs).length === 0) {
        showToast('書き出すデータがありません。');
        return;
    }
    
    const blob = new Blob([savedJobs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    a.download = `job_edits_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('修正データを書き出しました！');
}

// エクスポートされたJSONファイルをインポートする関数
function importManualEdits(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (!Array.isArray(importedData)) {
                throw new Error('無効なデータ形式です');
            }
            
            // 既存のデータとマージする
            let currentSaved = [];
            const prevSaved = localStorage.getItem('importedJobs');
            if (prevSaved) {
                try { currentSaved = JSON.parse(prevSaved); } catch(err){}
            }
            
            // IDの重複を排除して結合（インポートしたデータを優先）
            const mergedJobs = [...importedData];
            currentSaved.forEach(cj => {
                if (!mergedJobs.some(mj => mj.id === cj.id)) {
                    mergedJobs.push(cj);
                }
            });
            
            localStorage.setItem('importedJobs', JSON.stringify(mergedJobs));
            localStorage.removeItem('sync_data_hidden');
            
            init(); // 再描画
            showToast(`成功！ ${importedData.length} 件の修正データを取り込みました。`);
            
        } catch (error) {
            console.error('インポートエラー:', error);
            alert('ファイルの読み込みに失敗しました。正しいJSONファイルを選択してください。');
        }
        
        // inputをリセット
        event.target.value = '';
    };
    reader.readAsText(file);
}
