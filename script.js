document.addEventListener('DOMContentLoaded', () => {
    const textInput = document.getElementById('text-input');
    const generateBtn = document.getElementById('generate-btn');
    const canvasContainer = document.getElementById('canvas-container');
    const canvas = document.getElementById('word-canvas');

    // Default placeholder text to show something beautiful on first load
    const defaultText = `
        Firebase Cloud GitHub Serverless Hosting Web App Modern Responsive Design Glassmorphism
        UI UX Typography Colors DarkMode Developer Code Javascript HTML CSS Awesome Fast Secure
        Performance API Data Database Firestore Storage Functions Innovation Creativity Frontend
        Beautiful Elegant Magic World Future Tech
    `;

    // A curated list of premium colors for the word cloud
    const colorPalette = [
        '#3b82f6', // blue-500
        '#60a5fa', // blue-400
        '#8b5cf6', // violet-500
        '#a78bfa', // violet-400
        '#ec4899', // pink-500
        '#f472b6', // pink-400
        '#06b6d4', // cyan-500
        '#14b8a6', // teal-500
        '#f8fafc'  // slate-50
    ];

    function getRandomColor() {
        return colorPalette[Math.floor(Math.random() * colorPalette.length)];
    }

    function parseText(text) {
        // Simple word frequency counter
        const words = text.toLowerCase().match(/\p{L}+/gu) || [];
        const counts = {};
        
        words.forEach(word => {
            if (word.length > 1) { // Ignore single character words
                counts[word] = (counts[word] || 0) + 1;
            }
        });

        // Convert to array format required by wordcloud2.js: [[word, weight], ...]
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1]) // Sort by frequency
            .slice(0, 100) // Keep top 100 words
            .map(([word, count]) => [word, count * 15]); // Scale up weight for visibility
    }

    function generateWordCloud(text) {
        const list = parseText(text);
        
        if (list.length === 0) {
            alert('請輸入足夠的文字內容來產生文字雲！');
            return;
        }

        // Adjust canvas size to fit container
        const rect = canvasContainer.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        // Clear previous
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Options for wordcloud2.js
        const options = {
            list: list,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 800,
            color: getRandomColor,
            backgroundColor: 'transparent',
            rotateRatio: 0.3,
            rotationSteps: 2,
            gridSize: Math.round(16 * canvas.width / 1024),
            drawOutOfBound: false,
            shrinkToFit: true
        };

        WordCloud(canvas, options);
    }

    // Event Listeners
    generateBtn.addEventListener('click', () => {
        const text = textInput.value.trim() || defaultText;
        generateWordCloud(text);
    });

    // Handle resize
    window.addEventListener('resize', () => {
        clearTimeout(window.resizeTimer);
        window.resizeTimer = setTimeout(() => {
            const text = textInput.value.trim() || defaultText;
            generateWordCloud(text);
        }, 250);
    });

    // Initial render
    // Small delay to ensure container dimensions are calculated
    setTimeout(() => {
        generateWordCloud(defaultText);
    }, 100);
});
