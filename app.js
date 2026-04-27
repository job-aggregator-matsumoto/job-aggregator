let allJobs = [];

function init() {
    try {
        if (typeof initialJobsData === 'undefined') {
            throw new Error('データが見つかりません');
        }
        allJobs = initialJobsData;
        // 初期表示時にフィルターを適用（デフォルトで今週を表示）
        filterJobs();
    } catch (error) {
        console.error('Error loading jobs:', error);
        document.getElementById('job-grid').innerHTML = 
            `<p style="text-align:center; grid-column: 1/-1; padding: 40px; color: var(--danger);">
                求人データの読み込み中にエラーが発生しました。
            </p>`;
    }
}

function renderJobs(jobsToRender) {
    const grid = document.getElementById('job-grid');
    grid.innerHTML = '';

    if (jobsToRender.length === 0) {
        grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 40px; color: var(--text-muted);">条件に一致する求人は見つかりませんでした。</p>';
        return;
    }

    jobsToRender.forEach((job, index) => {
        const card = document.createElement('div');
        card.className = 'job-card';
        card.style.animationDelay = `${index * 0.1}s`;
        
        const categoryClass = job.category === '障害者枠' ? 'category-disability' : 'category-general';
        const remoteBadge = job.isRemote ? '<span class="remote-badge">在宅OK</span>' : '';

        card.innerHTML = `
            <div style="margin-bottom: 12px;">
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
                    <i class="fas fa-yen-sign"></i> ${job.salary}
                </div>
                <div class="detail-item">
                    <i class="far fa-clock"></i> ${job.workingHours}
                </div>
            </div>
            <p style="font-size: 0.8rem; color: var(--text-muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 20px;">
                ${job.description}
            </p>
            <div class="posted-at">${job.postedAt}</div>
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

    const now = new Date('2026-04-27'); // デモ用に現在時刻を固定
    
    const filtered = allJobs.filter(job => {
        const matchesKeyword = !keyword || 
            job.title.toLowerCase().includes(keyword) || 
            job.company.toLowerCase().includes(keyword) ||
            job.description.toLowerCase().includes(keyword);
        
        const matchesLocation = !location || job.location.includes(location) || (location === '在宅' && job.isRemote);
        const matchesCategory = !category || job.category === category;

        // 期間検索
        let matchesPeriod = true;
        if (period !== 'all') {
            const postedDate = new Date(job.postedAt);
            const diffTime = Math.abs(now - postedDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            matchesPeriod = diffDays <= parseInt(period);
        }

        return matchesKeyword && matchesLocation && matchesCategory && matchesPeriod;
    });

    renderJobs(filtered);
}

// Modal Logic
function openModal(job) {
    const modal = document.getElementById('job-modal');
    const body = document.getElementById('modal-body');
    
    const categoryClass = job.category === '障害者枠' ? 'category-disability' : 'category-general';

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
                <div class="modal-item-value">${job.location}</div>
            </div>
            <div class="modal-item">
                <div class="modal-item-label"><i class="fas fa-yen-sign"></i> 給与</div>
                <div class="modal-item-value">${job.salary}</div>
            </div>
            <div class="modal-item">
                <div class="modal-item-label"><i class="far fa-clock"></i> 勤務時間</div>
                <div class="modal-item-value">${job.workingHours}</div>
            </div>
            <div class="modal-item">
                <div class="modal-item-label"><i class="far fa-calendar-alt"></i> 休日</div>
                <div class="modal-item-value">${job.holiday || '規定による'}</div>
            </div>
            <div class="modal-item">
                <div class="modal-item-label"><i class="fas fa-hashtag"></i> 求人番号</div>
                <div class="modal-item-value">${job.id}</div>
            </div>
            <div class="modal-item">
                <div class="modal-item-label"><i class="far fa-calendar-check"></i> 掲載日</div>
                <div class="modal-item-value">${job.postedAt}</div>
            </div>
        </div>
        
        <div class="modal-description">
            <h3>仕事内容・特徴</h3>
            <p>${job.description}</p>
        </div>
        
        <div style="margin-top: 40px; text-align: center;">
            <button class="btn-search" onclick="goToOfficial('${job.id}')">
                <i class="fas fa-external-link-alt"></i> 応募・詳細を公式で見る
            </button>
        </div>
    `;
    
    modal.style.display = "block";
    document.body.style.overflow = "hidden"; // Prevent scrolling
}

// 公式ページへの遷移ロジック
function goToOfficial(jobId) {
    const job = allJobs.find(j => j.id === jobId);
    
    // データ抽出時に取得した公式URLがあれば、それをそのまま使う
    if (job && job.officialUrl) {
        window.open(job.officialUrl, '_blank');
        return;
    }

    // バックアップ用（IDから生成する旧方式）
    const parts = jobId.split('-');
    if (parts.length === 2) {
        const url = `https://www.hellowork.mhlw.go.jp/kensaku/GECA110010.do?screenId=GECA110010&action=dispDetail&kyujinNumber1=${parts[0]}&kyujinNumber2=${parts[1]}`;
        window.open(url, '_blank');
    } else {
        alert('ハローワーク公式サイトへ遷移できません。求人番号を確認してください。');
    }
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
});
