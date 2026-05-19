const fs = require('fs');

// Read current jobs data
const content = fs.readFileSync('data/jobs_data.js', 'utf8');

// Mock variable to capture initialJobsData
let initialJobsData = [];
eval(content + '; initialJobsData = initialJobsData;');

console.log('Total jobs loaded:', initialJobsData.length);

const types = {};
initialJobsData.forEach(job => {
    types[job.type] = (types[job.type] || 0) + 1;
});

console.log('Employment types distribution:', JSON.stringify(types, null, 2));
