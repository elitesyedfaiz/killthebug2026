// --- 1. DATA GENERATORS (WITH DEMO IMAGES) ---
const round1Images = [
    { id: 1, q: "Is this AI Generated?", options: ["AI", "Human"], correct: "AI", img: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=500&q=60" },
    { id: 2, q: "Is this Code Edited?", options: ["Edited", "Original"], correct: "Edited", img: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=500&q=60" },
    { id: 3, q: "AI or Not?", options: ["AI", "Human"], correct: "Human", img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=500&q=60" },
    { id: 4, q: "Detect Manipulation", options: ["Edited", "Real"], correct: "Real", img: "https://images.unsplash.com/photo-1617042375876-a13e36732a04?auto=format&fit=crop&w=500&q=60" },
    { id: 5, q: "Identify Creator", options: ["AI", "Human"], correct: "AI", img: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=500&q=60" },
    { id: 6, q: "Is this Original?", options: ["Original", "Edited"], correct: "Original", img: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=500&q=60" },
    { id: 7, q: "Check Metadata", options: ["Human", "AI"], correct: "Human", img: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=500&q=60" },
    { id: 8, q: "Visual Integrity", options: ["Real", "Edited"], correct: "Edited", img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=500&q=60" }
];

function generateQuestions(prefix, count, points) {
    let q = {};
    for(let i=1; i<=count; i++) {
        q[`${prefix.toLowerCase()}_${i}`] = {
            title: `Target #${i}: ${prefix} Snippet`,
            desc: `Analyze the class structure to identify bugs. Reward: +${points} pts`,
            points: points,
            code: `// Target Snippet #${i}\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println("Hunt the bug!");\n  }\n}`
        };
    }
    return q;
}

const defaultModerate = generateQuestions('Moderate', 25, 3);
defaultModerate['moderate_1'] = { title: "Target #01: Palindrome Check", desc: "Find errors preventing String check. Reward: +3 pts", points: 3, code: `import java.util.*;\npublic class PalindromeCheck {\n    public static void main(String[] args) {\n        String str = "madam";\n        String rev = "";\n        for(int i = str.length(); i > 0; i--) {\n            rev = rev + str.charAt(i);\n        }\n        if(str == rev) { \n            System.out.println("It is a Palindrome")\n        }\n    }\n}` };
defaultModerate['moderate_2'] = { title: "Target #02: Matrix Sum", desc: "2D Array diagonal sum crashes. Reward: +3 pts", points: 3, code: `public class MatrixSum {\n    public static void main(String[] args) {\n        int[][] mat = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};\n        int sum = 0;\n        for(int i = 0; i <= mat.length; i++) {\n            sum += mat[i][i];\n        }\n        System.out.println("Sum: " + sum);\n    }\n}` };
defaultModerate['moderate_3'] = { title: "Target #03: Special Number", desc: "Check sum of factorials. Find logic bugs. Reward: +3 pts", points: 3, code: `public class SpecialNumber {\n    public static void main(String[] args) {\n        int n = 145, temp = n, sum = 0;\n        while(temp > 0) {\n            int d = temp % 10, fact = 1;\n            for(int i = 1; i < d; i++) fact *= i;\n            sum += fact; temp = temp / 10;\n        }\n        if(n = sum) System.out.println("Special Number");\n    }\n}` };

const db = {
    moderate: defaultModerate,
    easy: generateQuestions('Easy', 35, 2),
    hard: generateQuestions('Hardcore', 15, 5),
    surprise: { s1: { title: "🔥 BOSS: Surprise Target", desc: "Unlocked at T-minus 30 mins. Reward: +10 pts", points: 10, code: "// BOSS TARGET\npublic class Boss {\n}" } }
};

let currentProblems = JSON.parse(localStorage.getItem('ktb_problems')) || defaultModerate;
let currentProblemId = null;
let timerInterval = null;
let editingTargetId = null; 
let bugRushActive = false;

// --- 2. CUSTOM MODALS ---
let modalCallback = null;
function showModal(title, msg, type = 'alert', onConfirm = null) {
    document.getElementById('custom-modal-title').textContent = title;
    document.getElementById('custom-modal-body').textContent = msg;
    document.getElementById('custom-modal-overlay').style.display = 'flex';
    if (type === 'confirm') {
        document.getElementById('modal-cancel-btn').style.display = 'inline-block';
        modalCallback = onConfirm;
    } else {
        document.getElementById('modal-cancel-btn').style.display = 'none';
        modalCallback = onConfirm; 
    }
}
function closeModal(result) {
    document.getElementById('custom-modal-overlay').style.display = 'none';
    if (result && modalCallback) modalCallback();
}

// THE WHEEL
function openWheelModal() {
    let score = parseFloat(localStorage.getItem('ktb_score')) || 0;
    if (score < 2) return showModal("Action Denied", "You need at least 2 points to spin the Wheel!");
    document.getElementById('wheel-modal-overlay').style.display = 'flex';
    document.getElementById('fortune-wheel').style.transform = `rotate(0deg)`; 
}
function closeWheelModal() { document.getElementById('wheel-modal-overlay').style.display = 'none'; }

function executeSpin() {
    updateScore(-2);
    const wheel = document.getElementById('fortune-wheel');
    let randomDeg = Math.floor(Math.random() * 360);
    let totalSpin = randomDeg + (360 * 5); 
    wheel.style.transform = `rotate(${totalSpin}deg)`;
    
    setTimeout(() => {
        closeWheelModal();
        let actualPos = (360 - (randomDeg % 360)) % 360;
        const isGreen = (actualPos % 72) >= 36;
        if (isGreen) {
            showModal("Result", "🟢 WHEEL LANDED ON GREEN!\n\nGrid converted to 35 EASY questions (+2 Marks).", "alert", () => {
                localStorage.setItem('ktb_gridState', 'easy');
                localStorage.setItem('ktb_problems', JSON.stringify(db.easy));
                loadDashboard();
            });
        } else {
            showModal("Result", "🔴 WHEEL LANDED ON RED!\n\nGrid converted to 15 HARDCORE questions (+5 Marks).", "alert", () => {
                localStorage.setItem('ktb_gridState', 'hard');
                localStorage.setItem('ktb_problems', JSON.stringify(db.hard));
                loadDashboard();
            });
        }
    }, 4200); 
}

// --- 3. ANIMATIONS & DEV CHEAT ---
const ladybugSVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M 30 20 L 20 5 M 50 20 L 50 0 M 70 20 L 80 5" stroke="#111" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M 30 80 L 20 95 M 50 80 L 50 100 M 70 80 L 80 95" stroke="#111" stroke-width="5" stroke-linecap="round" fill="none"/><ellipse cx="45" cy="50" rx="40" ry="35" fill="#D50000" stroke="#111" stroke-width="4"/><circle cx="85" cy="50" r="14" fill="#111" /><path d="M 95 40 Q 105 30 110 35 M 95 60 Q 105 70 110 65" stroke="#111" stroke-width="3" fill="none"/><line x1="5" y1="50" x2="85" y2="50" stroke="#111" stroke-width="3"/><circle cx="30" cy="30" r="6" fill="#111" /><circle cx="60" cy="35" r="7" fill="#111" /><circle cx="45" cy="20" r="5" fill="#111" /><circle cx="30" cy="70" r="6" fill="#111" /><circle cx="60" cy="65" r="7" fill="#111" /><circle cx="45" cy="80" r="5" fill="#111" /></svg>`;
const goldenBugSVG = ladybugSVG.replace('fill="#D50000"', 'fill="#FFD700"'); 

function spawnLadybugs() {
    const container = document.getElementById('bug-container');
    container.innerHTML = ""; 
    for (let i = 0; i < 12; i++) {
        let bug = document.createElement('div');
        bug.className = 'ladybug-svg';
        bug.innerHTML = ladybugSVG;
        container.appendChild(bug);
        let x = Math.random() * window.innerWidth;
        let y = Math.random() * window.innerHeight;
        bug.style.left = x + 'px'; bug.style.top = y + 'px';

        setInterval(() => {
            let newX = x + (Math.random() * 400 - 200); 
            let newY = y + (Math.random() * 400 - 200);
            newX = Math.max(10, Math.min(window.innerWidth - 60, newX));
            newY = Math.max(10, Math.min(window.innerHeight - 60, newY));
            let angle = Math.atan2(newY - y, newX - x) * (180 / Math.PI); 
            bug.style.transform = `rotate(${angle}deg)`;
            bug.style.left = newX + 'px'; bug.style.top = newY + 'px';
            x = newX; y = newY;
        }, 5000 + Math.random() * 2000); 
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'F8') { e.preventDefault(); spawnGoldenBug(); }
});

// --- 4. VIEW ROUTING ---
document.addEventListener("DOMContentLoaded", () => {
    spawnLadybugs();
    if (localStorage.getItem('isLoggedIn') === 'true') {
        const isAdmin = localStorage.getItem('pName') === "Admin";
        if (!isAdmin) {
            if (localStorage.getItem('ktb_endTime')) {
                startTimer(); loadDashboard(); switchView('dashboard-view'); scheduleGoldenBugs();
            } else if (localStorage.getItem('ktb_r1_done') === 'true') {
                switchView('instructions-view');
            } else {
                initRound1();
            }
        } else {
            loadDashboard(); switchView('dashboard-view');
        }
        updateScoreDisplay();
    }
});

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    window.scrollTo(0, 0);
}

function autoResize(t) { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }

// --- 5. SCORE LOGIC ---
function updateScore(amount) {
    let current = parseFloat(localStorage.getItem('ktb_score')) || 0;
    current += amount; if(current > 100) current = 100; 
    localStorage.setItem('ktb_score', current);
    updateScoreDisplay();
}

function updateScoreDisplay() {
    const isAdmin = localStorage.getItem('pName') === "Admin";
    if (isAdmin) return;
    let score = parseFloat(localStorage.getItem('ktb_score')) || 0;
    document.getElementById('score-badge').textContent = `Score: ${score} / 100`;
    document.getElementById('editor-score-badge').textContent = `Score: ${score} / 100`;
    document.getElementById('score-badge').style.display = 'inline-block';
}

// --- 6. LOGIN ---
function togglePassword() {
    const passInput = document.getElementById('a-pass');
    const icon = document.getElementById('toggle-pwd');
    if (passInput.type === 'password') { passInput.type = 'text'; icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); } 
    else { passInput.type = 'password'; icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
}

function switchLoginTab(type) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.type === type));
    document.getElementById('error-message').textContent = "";
    if (type === 'admin') {
        document.getElementById('login-title').textContent = "Admin Control";
        document.getElementById('player-fields').style.display = "none"; document.getElementById('admin-fields').style.display = "block";
        document.getElementById('p-name').required = false; document.getElementById('p-class').required = false; document.getElementById('p-section').required = false; document.getElementById('p-scholar').required = false;
        document.getElementById('a-user').required = true; document.getElementById('a-pass').required = true;
    } else {
        document.getElementById('login-title').textContent = "Player Registration";
        document.getElementById('player-fields').style.display = "block"; document.getElementById('admin-fields').style.display = "none";
        document.getElementById('p-name').required = true; document.getElementById('p-class').required = true; document.getElementById('p-section').required = true; document.getElementById('p-scholar').required = true;
        document.getElementById('a-user').required = false; document.getElementById('a-pass').required = false;
    }
}

document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.querySelector('.tab-btn.active').dataset.type;
    const errorMsg = document.getElementById('error-message');

    if (type === 'admin') {
        const user = document.getElementById('a-user').value.trim();
        const pass = document.getElementById('a-pass').value.trim();
        if (user === 'admin' && pass === 'quest2026') {
            localStorage.setItem('isLoggedIn', 'true'); localStorage.setItem('pName', "Admin");
            loadDashboard(); switchView('dashboard-view'); document.getElementById('login-form').reset();
        } else { errorMsg.textContent = "Error: Invalid Admin Credentials."; }
    } else {
        const name = document.getElementById('p-name').value.trim();
        const cls = document.getElementById('p-class').value.trim();
        const sec = document.getElementById('p-section').value.trim();
        const sch = document.getElementById('p-scholar').value.trim();
        
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('pName', name); localStorage.setItem('pClass', cls); localStorage.setItem('pSec', sec); localStorage.setItem('pSch', sch);
        localStorage.setItem('ktb_score', '0'); 
        localStorage.setItem('ktb_gridState', 'moderate');
        localStorage.setItem('ktb_problems', JSON.stringify(db.moderate));
        
        document.getElementById('login-form').reset();
        initRound1();
    }
});

function logout() {
    localStorage.clear();
    clearInterval(timerInterval); clearInterval(r1Timer);
    document.getElementById('timer-display').style.display = 'none';
    switchView('landing-view');
}

// --- 7. ROUND 1: IMAGE QUIZ ---
let r1Timer;
function initRound1() {
    const grid = document.getElementById('image-grid');
    grid.innerHTML = "";
    round1Images.forEach(img => {
        let card = document.createElement('div');
        card.className = 'lively-card';
        card.innerHTML = `
            <div class="img-placeholder" style="background: #e0e0e0; border: var(--border-heavy); border-radius: 8px; height: 180px; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 15px;">
                <img src="${img.img}" alt="Round 1 Image" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <h3 style="font-size: 1.2rem; margin-bottom: 15px;">${img.q}</h3>
            <div style="display: flex; gap: 10px;">
                <button class="btn-lively btn-yellow" style="flex: 1;" onclick="checkImageAns(this, '${img.correct}', '${img.options[0]}')">${img.options[0]}</button>
                <button class="btn-lively btn-yellow" style="flex: 1;" onclick="checkImageAns(this, '${img.correct}', '${img.options[1]}')">${img.options[1]}</button>
            </div>
        `;
        grid.appendChild(card);
    });
    switchView('image-quiz-view');
    
    let sec = 300; // 5 mins
    r1Timer = setInterval(() => {
        sec--; let m = Math.floor(sec/60), s = sec%60;
        document.getElementById('round1-timer').textContent = `${m<10?'0'+m:m}:${s<10?'0'+s:s}`;
        if(sec <= 0) finishRound1();
    }, 1000);
}

function checkImageAns(btn, correct, selected) {
    const parent = btn.parentElement;
    parent.querySelectorAll('button').forEach(b => { b.disabled = true; b.style.opacity = '0.5'; });
    btn.style.opacity = '1';
    if(selected === correct) {
        btn.style.background = 'var(--accent-green)'; updateScore(2);
    } else {
        btn.style.background = 'var(--ladybug-red)'; btn.style.color = 'white';
    }
}

function finishRound1() {
    clearInterval(r1Timer);
    localStorage.setItem('ktb_r1_done', 'true');
    showModal("Round 1 Complete", "Your score has been saved.\nProceeding to Main Arena instructions...", "alert", () => {
        switchView('instructions-view');
    });
}

// --- 8. MAIN TIMER & EVENTS ---
function startHunt() {
    const twoHours = 2 * 60 * 60 * 1000;
    localStorage.setItem('ktb_endTime', Date.now() + twoHours);
    startTimer(); loadDashboard(); switchView('dashboard-view'); updateScoreDisplay(); scheduleGoldenBugs();
}

function startTimer() {
    const timerDisplay = document.getElementById('timer-display');
    timerDisplay.style.display = 'block';

    function updateTick() {
        const endTimeStr = localStorage.getItem('ktb_endTime');
        if(!endTimeStr) return;
        const timeRemaining = parseInt(endTimeStr) - Date.now();

        if (timeRemaining <= 30 * 60 * 1000 && localStorage.getItem('ktb_boss') !== 'true') {
            localStorage.setItem('ktb_boss', 'true');
            let currentGrid = JSON.parse(localStorage.getItem('ktb_problems'));
            currentGrid['s1'] = db.surprise['s1']; 
            localStorage.setItem('ktb_problems', JSON.stringify(currentGrid));
            showModal("Boss Unlocked!", "🚨 SURPRISE QUESTION UNLOCKED!\n\nA 10-Point Boss has appeared on your grid.");
            loadDashboard();
        }

        if (timeRemaining <= 20000 && timeRemaining > 0 && !bugRushActive) triggerBugRush();

        if (timeRemaining <= 0) {
            clearInterval(timerInterval); timerDisplay.textContent = "00:00:00";
            document.getElementById('bug-rush-overlay').style.display = 'none';
        } else {
            let h = Math.floor((timeRemaining / (1000 * 60 * 60)) % 24);
            let m = Math.floor((timeRemaining / 1000 / 60) % 60);
            let s = Math.floor((timeRemaining / 1000) % 60);
            timerDisplay.textContent = `${h<10?'0'+h:h}:${m<10?'0'+m:m}:${s<10?'0'+s:s}`;
        }
    }
    updateTick(); timerInterval = setInterval(updateTick, 1000);
}

// --- 9. BLACK MARKET (SHOP) ---
const sideQuests = [
    "PHYSICAL QUEST: Perform 15 pushups for the invigilator to get a hint.",
    "SCAVENGER HUNT: Find the 'hint.txt' hidden on this PC's Desktop.",
    "PHYSICAL QUEST: 20 jumping jacks to reveal the Bug Type.",
    "SCAVENGER HUNT: Look under your keyboard for a yellow sticky note hint!"
];

function openShop() {
    let gridState = localStorage.getItem('ktb_gridState') || 'moderate';
    let cost = gridState === 'easy' ? 1 : gridState === 'moderate' ? 1.5 : 2.5;
    let score = parseFloat(localStorage.getItem('ktb_score')) || 0;
    
    showModal("Side Quest Shop", `Buy a Hint Side-Quest for -${cost} Points?\n\nAlternatively, ask the invigilator for a FREE Physical Quest!`, 'confirm', () => {
        if (score < cost) return showModal("Action Denied", "Not enough points!");
        updateScore(-cost);
        let randomQuest = sideQuests[Math.floor(Math.random() * sideQuests.length)];
        showModal("Transaction Successful", `Penalty: -${cost} Points.\n\nYOUR SIDE QUEST:\n${randomQuest}`);
    });
}

// --- 10. GOLDEN BUGS & FINAL RUSH ---
function scheduleGoldenBugs() {
    const spawnDelays = [45000, 180000, 400000]; 
    spawnDelays.forEach(delay => { setTimeout(spawnGoldenBug, delay); });
}

function spawnGoldenBug() {
    if(bugRushActive) return;
    const bug = document.createElement('div');
    bug.className = 'golden-bug';
    bug.innerHTML = goldenBugSVG;
    bug.style.left = Math.random() * 80 + 'vw'; bug.style.top = Math.random() * 80 + 'vh';
    document.body.appendChild(bug);

    let moveInt = setInterval(() => {
        bug.style.left = Math.random() * 90 + 'vw'; bug.style.top = Math.random() * 90 + 'vh';
    }, 1000);

    bug.onclick = () => {
        clearInterval(moveInt); bug.remove(); updateScore(2);
        showModal("Bonus", "🐞 GOLDEN BUG CAUGHT! +2 BONUS POINTS!");
    };
    setTimeout(() => { if(document.body.contains(bug)) { clearInterval(moveInt); bug.remove(); } }, 4000);
}

function triggerBugRush() {
    bugRushActive = true;
    const overlay = document.getElementById('bug-rush-overlay');
    const rushContainer = document.getElementById('rush-bug-container');
    overlay.style.display = 'flex';
    
    let timeLeft = 20;
    setInterval(() => {
        timeLeft--; if(timeLeft >= 0) document.getElementById('rush-timer').textContent = timeLeft;
    }, 1000);

    for(let i=0; i<10; i++) {
        let b = document.createElement('div');
        b.className = 'rush-bug'; b.innerHTML = ladybugSVG;
        b.style.left = Math.random() * 90 + 'vw'; b.style.top = Math.random() * 90 + 'vh';
        rushContainer.appendChild(b);

        let mInt = setInterval(() => {
            b.style.transform = `rotate(${Math.random() * 360}deg)`;
            b.style.left = Math.random() * 90 + 'vw'; b.style.top = Math.random() * 90 + 'vh';
        }, 500 + Math.random()*300);

        b.onmousedown = function() { clearInterval(mInt); this.remove(); updateScore(1); };
    }
}

// --- 11. DASHBOARD & GRID RENDERING ---
function loadDashboard() {
    const name = localStorage.getItem('pName');
    const isAdmin = name === "Admin";
    document.getElementById('welcome-message').textContent = `Welcome, ${name}`;
    document.getElementById('player-details').textContent = isAdmin ? "System Administrator" : `Scholar No: ${localStorage.getItem('pSch')}`;
    
    document.getElementById('admin-controls').style.display = isAdmin ? "block" : "none";
    document.getElementById('final-submit-btn').style.display = isAdmin ? "none" : "block";

    if (isAdmin) {
        document.getElementById('timer-display').style.display = 'none';
        document.getElementById('grid-title-label').textContent = "Live Targets Grid (Admin View)";
    } else {
        let state = localStorage.getItem('ktb_gridState') || 'moderate';
        document.getElementById('grid-title-label').textContent = `Live Targets Grid (${state.toUpperCase()})`;
        document.getElementById('wheel-btn').style.display = (state === 'moderate') ? 'inline-block' : 'none';
    }
    renderGrid(isAdmin);
}

function renderGrid(isAdmin) {
    const grid = document.getElementById('problems-grid');
    grid.innerHTML = "";
    
    let activeProblems = JSON.parse(localStorage.getItem('ktb_problems')) || currentProblems;
    const savedFixes = JSON.parse(localStorage.getItem('ktb_submissions') || '{}');

    for (let [id, data] of Object.entries(activeProblems)) {
        const isFixed = savedFixes[id] !== undefined;
        let card = document.createElement('div');
        card.className = 'lively-card target-card';
        if(id === 's1') card.style.borderColor = '#FF007F'; 
        
        if (isAdmin) {
            card.innerHTML = `
                <div><h3>${data.title}</h3><p>${data.desc}</p></div>
                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    <button class="btn-lively btn-yellow" style="flex: 1;" onclick="editAdminProblem('${id}')">Edit</button>
                    <button class="btn-lively btn-green" style="flex: 1;" onclick="openEditor('${id}')">Test</button>
                </div>
            `;
        } else {
            card.innerHTML = `
                <div>
                    ${isFixed ? '<span class="status-badge" style="display:block; margin-bottom:10px; font-weight:bold; color:var(--accent-purple);"><i class="fas fa-check-circle"></i> Fix Saved</span>' : ''}
                    <h3>${data.title}</h3><p>${data.desc}</p>
                </div>
                <div style="margin-top: 15px;">
                    <button class="btn-lively ${isFixed ? 'btn-yellow' : ''}" style="width: 100%;" onclick="openEditor('${id}')">
                        ${isFixed ? 'Edit Fix' : 'Hunt Bugs (+'+data.points+' pts)'}
                    </button>
                </div>
            `;
        }
        grid.appendChild(card);
    }
}

// --- 12. ADMIN EDIT SYSTEM ---
function editAdminProblem(id) {
    editingTargetId = id;
    let activeProblems = JSON.parse(localStorage.getItem('ktb_problems')) || currentProblems;
    const target = activeProblems[id];
    document.getElementById('new-target-title').value = target.title; document.getElementById('new-target-code').value = target.code;
    document.getElementById('admin-save-btn').textContent = "Update Target"; document.getElementById('admin-cancel-btn').style.display = "inline-block";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
function cancelAdminEdit() {
    editingTargetId = null;
    document.getElementById('new-target-title').value = ""; document.getElementById('new-target-code').value = "";
    document.getElementById('admin-save-btn').textContent = "Add to Grid"; document.getElementById('admin-cancel-btn').style.display = "none";
}
function saveAdminProblem() {
    const title = document.getElementById('new-target-title').value; const code = document.getElementById('new-target-code').value;
    if(!title || !code) return showModal("Error", "Please fill both Title and Code fields.");
    
    let activeProblems = JSON.parse(localStorage.getItem('ktb_problems')) || currentProblems;
    if (editingTargetId) {
        activeProblems[editingTargetId].title = title; activeProblems[editingTargetId].code = code;
        showModal("Success", "Target Updated Successfully!");
    } else {
        const newId = 'custom_' + Date.now();
        activeProblems[newId] = { title: title, desc: "Admin Custom Target", points: 3, code: code };
        showModal("Success", "Target Added Successfully!");
    }
    localStorage.setItem('ktb_problems', JSON.stringify(activeProblems)); renderGrid(true); cancelAdminEdit(); 
}

// --- 13. EDITOR LOGIC ---
function openEditor(id) {
    currentProblemId = id;
    let activeProblems = JSON.parse(localStorage.getItem('ktb_problems')) || currentProblems;
    const target = activeProblems[id];
    const savedFixes = JSON.parse(localStorage.getItem('ktb_submissions') || '{}');

    document.getElementById('editor-title').textContent = target.title;
    document.getElementById('original-code').textContent = target.code;
    
    const editBox = document.getElementById('editable-code');
    editBox.value = savedFixes[id] ? savedFixes[id].code : target.code;
    
    document.querySelectorAll('.bug-type-check').forEach(chk => {
        chk.checked = false; if(savedFixes[id] && savedFixes[id].types.includes(chk.value)) chk.checked = true;
    });

    switchView('editor-view'); setTimeout(() => autoResize(editBox), 50);
}

function saveFixLocally() {
    const selectedTypes = Array.from(document.querySelectorAll('.bug-type-check:checked')).map(cb => cb.value);
    if(selectedTypes.length === 0) return showModal("Error", "You must select at least one Bug Type before saving!");

    let activeProblems = JSON.parse(localStorage.getItem('ktb_problems')) || currentProblems;
    const codeFix = document.getElementById('editable-code').value;
    let submissions = JSON.parse(localStorage.getItem('ktb_submissions') || '{}');
    
    if (!submissions[currentProblemId] && localStorage.getItem('pName') !== "Admin") updateScore(activeProblems[currentProblemId].points);
    
    submissions[currentProblemId] = { types: selectedTypes.join(" & "), code: codeFix };
    localStorage.setItem('ktb_submissions', JSON.stringify(submissions));
    
    showModal("Success", "Fix saved securely to local storage!", "alert", () => {
        loadDashboard(); switchView('dashboard-view');
    });
}

// --- 14. JSZIP FINAL EXPORT ---
async function exportFinalZip() {
    const submissions = JSON.parse(localStorage.getItem('ktb_submissions') || '{}');
    if(Object.keys(submissions).length === 0) return showModal("Error", "You haven't saved any fixes yet!");

    showModal("Final Submission", "Are you sure you want to Final Submit?\n\nThis will download your zip file.", 'confirm', async () => {
        const zip = new JSZip();
        const pName = localStorage.getItem('pName').replace(/\s+/g, '_');
        const pSch = localStorage.getItem('pSch');
        const finalScore = localStorage.getItem('ktb_score') || '0';
        let activeProblems = JSON.parse(localStorage.getItem('ktb_problems')) || currentProblems;

        for (let [id, data] of Object.entries(submissions)) {
            const problemTitle = activeProblems[id] ? activeProblems[id].title : "Custom Target";
            const fileContent = `/*\nPlayer: ${pName} (${pSch})\nTarget: ${problemTitle}\nIdentified Bugs: ${data.types}\nTotal Event Score: ${finalScore} / 100\n*/\n\n${data.code}`;
            zip.file(`Target_${id}_Fix.java`, fileContent);
        }

        const blob = await zip.generateAsync({type:"blob"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${pName}_${pSch}_KTB.zip`; a.click(); URL.revokeObjectURL(url);
    });
}