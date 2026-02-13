const fs = require('fs');
const path = require('path');

const parseComments = () => {
    const filePath = path.join(__dirname, '../comment.txt');
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const lines = data.split('\n');

        const result = {
            positive: [],
            neutral: [],
            negative: []
        };

        let currentSection = null;

        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine === '***' || trimmedLine === '.') return;

            if (trimmedLine.includes('Positive')) {
                currentSection = 'positive';
            } else if (trimmedLine.includes('Neutral')) {
                currentSection = 'neutral';
            } else if (trimmedLine.includes('Negative')) {
                currentSection = 'negative';
            } else if (currentSection) {
                // Remove numbering (1. , 2. ) if present
                const cleanComment = trimmedLine.replace(/^\d+\.\s*/, '').trim();
                if (cleanComment) {
                    result[currentSection].push(cleanComment);
                }
            }
        });

        return result;
    } catch (err) {
        console.error("Error reading comment.txt:", err);
        return { positive: [], neutral: [], negative: [] };
    }
};

module.exports = parseComments;
