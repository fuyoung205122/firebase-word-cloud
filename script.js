import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    const textInput = document.getElementById('text-input');
    const generateBtn = document.getElementById('generate-btn');
    const saveBtn = document.getElementById('save-btn');
    const canvasContainer = document.getElementById('canvas-container');
    const canvas = document.getElementById('word-canvas');
    const historyContainer = document.getElementById('history-container');

    // Default placeholder text to show something beautiful on first load
    const defaultText = `
        Firebase Cloud GitHub Serverless Hosting Web App Modern Responsive Design Glassmorphism
        UI UX Typography Colors DarkMode Developer Code Javascript HTML CSS Awesome Fast Secure
        Performance API Data Database Firestore Storage Functions Innovation Creativity Frontend
        Beautiful Elegant Magic World Future Tech
    `;

    // Initialize Firebase
    let db;
    try {
        const response = await fetch('/__/firebase/init.json');
        if (response.ok) {
            const firebaseConfig = await response.json();
            const app = initializeApp(firebaseConfig);
            db = getFirestore(app);
            setupFirestoreListeners();
        } else {
            console.error('Failed to load Firebase config.');
            historyContainer.innerHTML = '<p class="loading-text">無法連線到資料庫 (可能在本地端非 Firebase Hosting 環境執行)</p>';
            saveBtn.disabled = true;
        }
    } catch (e) {
        console.error('Firebase initialization error:', e);
        historyContainer.innerHTML = '<p class="loading-text">資料庫初始化失敗，請確保使用 firebase serve 或部署後查看。</p>';
        saveBtn.disabled = true;
    }

    // A curated list of premium colors for the word cloud
    const colorPalette = [
        '#3b82f6', '#60a5fa', '#8b5cf6', '#a78bfa', 
        '#ec4899', '#f472b6', '#06b6d4', '#14b8a6', '#f8fafc'
    ];

    function getRandomColor() {
        return colorPalette[Math.floor(Math.random() * colorPalette.length)];
    }

    function parseText(text) {
        const words = text.toLowerCase().match(/\p{L}+/gu) || [];
        const counts = {};
        words.forEach(word => {
            if (word.length > 1) { 
                counts[word] = (counts[word] || 0) + 1;
            }
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1]) 
            .slice(0, 100) 
            .map(([word, count]) => [word, count * 15]); 
    }

    function generateWordCloud(text) {
        const list = parseText(text);
        if (list.length === 0) {
            alert('請輸入足夠的文字內容來產生文字雲！');
            return;
        }

        const rect = canvasContainer.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

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

    // Firestore logic
    function setupFirestoreListeners() {
        const q = query(collection(db, "cloudTexts"), orderBy("createdAt", "desc"), limit(8));
        onSnapshot(q, (snapshot) => {
            historyContainer.innerHTML = '';
            if (snapshot.empty) {
                historyContainer.innerHTML = '<p class="loading-text">目前還沒有任何雲端文字，趕快新增第一個吧！</p>';
                return;
            }
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                const card = document.createElement('div');
                card.className = 'history-card';
                
                const date = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleString() : '剛剛';
                
                card.innerHTML = `
                    <div class="date">${date}</div>
                    <div class="text-snippet">${escapeHtml(data.text)}</div>
                `;
                
                // Click history card to load and generate word cloud
                card.addEventListener('click', () => {
                    textInput.value = data.text;
                    generateWordCloud(data.text);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
                
                historyContainer.appendChild(card);
            });
        }, (error) => {
            console.error("Error listening to history:", error);
            historyContainer.innerHTML = '<p class="loading-text">讀取歷史紀錄失敗，請確定 Firestore 已建立並設定好權限。</p>';
        });
    }

    async function saveToCloud() {
        const text = textInput.value.trim();
        if (!text) {
            alert('請先輸入文字再儲存！');
            return;
        }
        if (!db) return;

        saveBtn.disabled = true;
        const originalText = saveBtn.querySelector('span').innerText;
        saveBtn.querySelector('span').innerText = '儲存中...';

        try {
            await addDoc(collection(db, "cloudTexts"), {
                text: text,
                createdAt: serverTimestamp()
            });
            // 儲存成功後，文字雲也同步更新一下
            generateWordCloud(text);
            alert('成功儲存到雲端！');
        } catch (e) {
            console.error("Error adding document: ", e);
            alert('儲存失敗：' + e.message);
        } finally {
            saveBtn.disabled = false;
            saveBtn.querySelector('span').innerText = originalText;
        }
    }

    function escapeHtml(unsafe) {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    // Event Listeners
    generateBtn.addEventListener('click', () => {
        const text = textInput.value.trim() || defaultText;
        generateWordCloud(text);
    });

    saveBtn.addEventListener('click', saveToCloud);

    window.addEventListener('resize', () => {
        clearTimeout(window.resizeTimer);
        window.resizeTimer = setTimeout(() => {
            const text = textInput.value.trim() || defaultText;
            generateWordCloud(text);
        }, 250);
    });

    // Initial render
    setTimeout(() => {
        generateWordCloud(defaultText);
    }, 100);
});
