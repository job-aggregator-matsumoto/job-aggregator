const fs = require('fs');

// Load database
const content = fs.readFileSync('data/jobs_data.js', 'utf8');

// Mock variable to capture initialJobsData
let initialJobsData = [];
eval(content + '; initialJobsData = initialJobsData;');

console.log('--- Database Diagnostics ---');
console.log('Total jobs loaded:', initialJobsData.length);

const keywords = ['事務', '品出し', '介護', '販売'];

keywords.forEach(kw => {
    let matchesTitle = 0;
    let matchesDesc = 0;
    let matchesAny = 0;
    
    initialJobsData.forEach(job => {
        const t = (job.title || '').toLowerCase();
        const d = (job.description || '').toLowerCase();
        const c = (job.company || '').toLowerCase();
        const type = (job.type || '').toLowerCase();
        
        const inTitle = t.indexOf(kw.toLowerCase()) !== -1;
        const inDesc = d.indexOf(kw.toLowerCase()) !== -1;
        const inAny = inTitle || inDesc || c.indexOf(kw.toLowerCase()) !== -1 || type.indexOf(kw.toLowerCase()) !== -1;
        
        if (inTitle) matchesTitle++;
        if (inDesc) matchesDesc++;
        if (inAny) matchesAny++;
    });
    
    console.log(`Keyword "${kw}":`);
    console.log(`  Matches in Title: ${matchesTitle}`);
    console.log(`  Matches in Description: ${matchesDesc}`);
    console.log(`  Matches total (any field): ${matchesAny}`);
});

// Let's inspect some sample job titles and types to see what's in there
console.log('\n--- Random Sample Titles (first 10) ---');
initialJobsData.slice(0, 10).forEach((job, i) => {
    console.log(`${i+1}. [${job.type}] ${job.title} at ${job.company}`);
});
