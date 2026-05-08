// --- 1. INITIALIZE DATA ---
const defaultProblems = {
    1: {
        title: "Target #01: Palindrome Check",
        code: `import java.util.*;\n\npublic class PalindromeCheck {\n    public static void main(String[] args) {\n        String str = "madam";\n        String rev = "";\n        \n        // Bug hunting starts here...\n        for(int i = str.length(); i > 0; i--) {\n            rev = rev + str.charAt(i);\n        }\n        \n        if(str == rev) { \n            System.out.println("It is a Palindrome")\n        } else {\n            System.out.println("Not a Palindrome");\n        }\n    }\n}`
    },
    2: {
        title: "Target #02: Matrix Sum",
        code: `public class MatrixSum {\n    public static void main(String[] args) {\n        int[][] mat = {\n            {1, 2, 3}, \n            {4, 5, 6}, \n            {7, 8, 9}\n        };\n        int sum = 0;\n        \n        // Watch the boundaries...\n        for(int i = 0; i <= mat.length; i++) {\n            sum += mat[i][i];\n        }\n        \n        System.out.println("Diagonal Sum: " + sum);\n    }\n}`
    },
    3: {
        title: "Target #03: Special Number",
        code: `public class SpecialNumber {\n    public static void main(String[] args) {\n        int n = 145;\n        int temp = n;\n        int sum = 0;\n        \n        while(temp > 0) {\n            int d = temp % 10;\n            int fact = 1;\n            \n            for(int i = 1; i < d; i++) {\n                fact *= i;\n            }\n            \n            sum += fact;\n            temp = temp / 10;\n        }\n        \n        if(n = sum) {\n            System.out.println("Special Number");\n        }\n    }\n}`
    }
};

let currentProblems = JSON.parse(localStorage.getItem('ktb_problems')) || defaultProblems;
let currentProblemId = null;
let timerInterval = null;
let editingTargetId = null; 

// --- 2. CARTOON LADYBUG ANIMATION ---
const ladybugSVG = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M 30 20 L 20 5 M 50 20 L 50 0 M 70 20 L 80 5" stroke="#111" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M 30 80 L 20 95 M 50 80 L 50 100 M 70 80 L 80 95" stroke="#111" stroke-width="5" stroke-linecap="round" fill="none"/>
    <ellipse cx="45" cy="50" rx="40" ry="35" fill="#D50000" stroke="#111" stroke-width="4"/>
    <circle cx="85" cy="50" r="14" fill="#111" />
    <path d="M 95 40 Q 105 30 110 35 M 95 60 Q 105 70 110 65" stroke="#111" stroke-width="3" fill="none"/>
    <line x1="5" y1="50" x2="85" y2="50" stroke="#111" stroke-width="3"/>
    <circle cx="30" cy="30" r="6" fill="#111" />
    <circle cx="60" cy="35" r="7" fill="#111" />
    <circle cx="45" cy="20" r="5" fill="#111" />
    <circle cx="30" cy="70" r="6" fill="#111" />
    <circle cx="60" cy="65" r="7" fill="#111" />
    <circle cx="45" cy="80" r="5" fill="#111" />
</svg>`;

function spawnLadybugs() {
    const container = document.getElementById('bug-container');
    container.innerHTML = ""; 
    const numBugs = 12;

    for (let i = 0; i < numBugs; i++) {
        let bug = document.createElement('div');
        bug.className = 'ladybug-svg';
        bug.innerHTML = ladybugSVG;
        container.appendChild(bug);
        
        let x = Math.random() * window.innerWidth;
        let y = Math.random() * window.innerHeight;
        bug.style.left = x + 'px';
        bug.style.top = y + 'px';

        setInterval(() => {
            let newX = x + (Math.random() * 400 - 200); 
            let newY = y + (Math.random() * 400 - 200);
            
            newX = Math.max(10, Math.min(window.innerWidth - 60, newX));
            newY = Math.max(10, Math.min(window.innerHeight - 60, newY));

            let angle = Math.atan2(newY - y, newX - x) * (180 / Math.PI); 
            
            bug.style.transform = `rotate(${angle}deg)`;
            bug.style.left = newX + 'px';
            bug.style.top = newY + 'px';

            x = newX; y = newY;
        }, 5000 + Math.random() * 2000); 
    }
}

// --- 3. CORE LOGIC & INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    spawnLadybugs();
    
    if (localStorage.getItem('isLoggedIn') === 'true') {
        const isAdmin = localStorage.getItem('pName') === "Admin";
        
        if (!isAdmin) {
            // Check if player has started the hunt
            if (localStorage.getItem('ktb_endTime')) {
                startTimer(); 
                loadDashboard();
                switchView('dashboard-view');
            } else {
                // If they refresh on instructions before starting
                switchView('instructions-view');
            }
        } else {
            // Admin routing
            loadDashboard();
            switchView('dashboard-view');
        }
        updatePenaltyDisplay();
    }
});

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    window.scrollTo(0, 0);
}

function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

// --- 4. LOGIN LOGIC ---
function togglePassword() {
    const passInput = document.getElementById('a-pass');
    const icon = document.getElementById('toggle-pwd');
    if (passInput.type === 'password') {
        passInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function switchLoginTab(type) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.type === type));
    document.getElementById('error-message').textContent = "";
    
    if (type === 'admin') {
        document.getElementById('login-title').textContent = "Admin Control";
        document.getElementById('player-fields').style.display = "none";
        document.getElementById('admin-fields').style.display = "block";

        document.getElementById('p-name').required = false;
        document.getElementById('p-class').required = false;
        document.getElementById('p-section').required = false;
        document.getElementById('p-scholar').required = false;
        
        document.getElementById('a-user').required = true;
        document.getElementById('a-pass').required = true;
    } else {
        document.getElementById('login-title').textContent = "Player Registration";
        document.getElementById('player-fields').style.display = "block";
        document.getElementById('admin-fields').style.display = "none";

        document.getElementById('p-name').required = true;
        document.getElementById('p-class').required = true;
        document.getElementById('p-section').required = true;
        document.getElementById('p-scholar').required = true;
        
        document.getElementById('a-user').required = false;
        document.getElementById('a-pass').required = false;
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
            grantAccess("Admin", "", "", "");
        } else {
            errorMsg.textContent = "Error: Invalid Admin Credentials.";
        }
    } else {
        const name = document.getElementById('p-name').value.trim();
        const cls = document.getElementById('p-class').value.trim();
        const sec = document.getElementById('p-section').value.trim();
        const sch = document.getElementById('p-scholar').value.trim();
        
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('pName', name);
        localStorage.setItem('pClass', cls);
        localStorage.setItem('pSec', sec);
        localStorage.setItem('pSch', sch);
        
        localStorage.setItem('ktb_shopUses', '0');
        localStorage.setItem('ktb_penalty', '0');
        
        document.getElementById('login-form').reset();
        switchView('instructions-view');
    }
});

function grantAccess(name, pClass, pSec, pSch) {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('pName', name);
    localStorage.setItem('pClass', pClass);
    localStorage.setItem('pSec', pSec);
    localStorage.setItem('pSch', pSch);

    loadDashboard();
    switchView('dashboard-view');
    document.getElementById('login-form').reset();
}

function logout() {
    localStorage.clear();
    clearInterval(timerInterval);
    document.getElementById('timer-display').style.display = 'none';
    switchView('landing-view');
}

// --- 5. TIMER LOGIC ---
function startHunt() {
    const twoHours = 2 * 60 * 60 * 1000;
    localStorage.setItem('ktb_endTime', Date.now() + twoHours);
    
    startTimer();
    loadDashboard();
    switchView('dashboard-view');
    updatePenaltyDisplay();
}

function startTimer() {
    const timerDisplay = document.getElementById('timer-display');
    timerDisplay.style.display = 'block';

    // Function to calculate and update immediately so it doesn't blink 02:00:00
    function updateTick() {
        const endTimeStr = localStorage.getItem('ktb_endTime');
        if(!endTimeStr) return;
        
        const endTime = parseInt(endTimeStr);
        const now = Date.now();
        const timeRemaining = endTime - now;

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            timerDisplay.textContent = "00:00:00 (TIME UP)";
            timerDisplay.style.color = "#D50000";
            timerDisplay.style.borderColor = "#D50000";
        } else {
            let hours = Math.floor((timeRemaining / (1000 * 60 * 60)) % 24);
            let mins = Math.floor((timeRemaining / 1000 / 60) % 60);
            let secs = Math.floor((timeRemaining / 1000) % 60);

            hours = hours < 10 ? "0" + hours : hours;
            mins = mins < 10 ? "0" + mins : mins;
            secs = secs < 10 ? "0" + secs : secs;

            timerDisplay.textContent = `${hours}:${mins}:${secs}`;
        }
    }

    updateTick(); // Call instantly
    timerInterval = setInterval(updateTick, 1000);
}


// --- 6. SIDE QUEST SHOP LOGIC ---
const sideQuests = [
    "PHYSICAL QUEST: Perform 15 pushups in front of the invigilator. Once verified, they will point out one incorrect line number in your code.",
    "SCAVENGER HUNT: Minimize the browser. There is a 'hint.txt' file hidden somewhere on your Desktop. Find it to reveal a crucial logic clue!",
    "PHYSICAL QUEST: Do 20 jumping jacks. Once verified, the invigilator will tell you if the bug is Syntax, Runtime, or Logic.",
    "SCAVENGER HUNT: Look under your keyboard or desk. If you find a yellow sticky note, it contains the exact name of the missing variable!"
];

function openShop() {
    let shopUses = parseInt(localStorage.getItem('ktb_shopUses') || '0');
    let currentPenalty = parseInt(localStorage.getItem('ktb_penalty') || '0');
    
    let cost = (shopUses === 0) ? 3 : 5;
    
    let confirmBuy = confirm(`Welcome to the Black Market!\n\nDo you want to buy a Side Quest for a hint?\nCost: -${cost} Points.\n\n(Your Current Penalty: -${currentPenalty})`);
    
    if (confirmBuy) {
        shopUses++;
        currentPenalty += cost;
        
        localStorage.setItem('ktb_shopUses', shopUses);
        localStorage.setItem('ktb_penalty', currentPenalty);
        
        updatePenaltyDisplay();
        
        let randomQuest = sideQuests[Math.floor(Math.random() * sideQuests.length)];
        alert(`TRANSACTION SUCCESSFUL!\nPenalty Applied: -${cost} Points.\n\nYOUR SIDE QUEST:\n${randomQuest}`);
    }
}

function updatePenaltyDisplay() {
    let currentPenalty = parseInt(localStorage.getItem('ktb_penalty') || '0');
    const dashBadge = document.getElementById('dash-penalty-badge');
    const editorBadge = document.getElementById('editor-penalty-badge');
    
    const isAdmin = localStorage.getItem('pName') === "Admin";
    
    if(dashBadge && !isAdmin) {
        dashBadge.textContent = `Penalty: -${currentPenalty}`;
        dashBadge.style.display = currentPenalty > 0 ? 'inline-block' : 'none';
    }
    if(editorBadge && !isAdmin) {
        editorBadge.textContent = `Penalty: -${currentPenalty}`;
        editorBadge.style.display = currentPenalty > 0 ? 'inline-block' : 'none';
    }
}


// --- 7. DASHBOARD & GRID RENDERING ---
function loadDashboard() {
    const name = localStorage.getItem('pName');
    const sch = localStorage.getItem('pSch');
    const isAdmin = name === "Admin";
    
    document.getElementById('welcome-message').textContent = `Welcome, ${name}`;
    document.getElementById('player-details').textContent = isAdmin ? "System Administrator" : `Scholar No: ${sch}`;
    
    document.getElementById('admin-controls').style.display = isAdmin ? "block" : "none";
    document.getElementById('final-submit-btn').style.display = isAdmin ? "none" : "block";

    if (isAdmin) {
        document.getElementById('timer-display').style.display = 'none';
    }

    renderGrid(isAdmin);
    updatePenaltyDisplay();
}

function renderGrid(isAdmin) {
    const grid = document.getElementById('problems-grid');
    grid.innerHTML = "";
    
    const savedFixes = JSON.parse(localStorage.getItem('ktb_submissions') || '{}');

    for (let [id, data] of Object.entries(currentProblems)) {
        const isFixed = savedFixes[id] !== undefined;
        let card = document.createElement('div');
        card.className = 'lively-card target-card';
        
        if (isAdmin) {
            card.innerHTML = `
                <div>
                    <h3>${data.title}</h3>
                    <p>Analyze the full class structure to identify bugs.</p>
                </div>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button class="btn-lively btn-yellow" style="flex: 1;" onclick="editAdminProblem(${id})">Edit</button>
                    <button class="btn-lively btn-green" style="flex: 1;" onclick="openEditor(${id})">Test View</button>
                </div>
            `;
        } else {
            card.innerHTML = `
                <div>
                    ${isFixed ? '<span class="status-badge"><i class="fas fa-check-circle"></i> Fix Saved Locally</span>' : ''}
                    <h3>${data.title}</h3>
                    <p>Analyze the full class structure to identify bugs.</p>
                </div>
                <button class="btn-lively ${isFixed ? 'btn-yellow' : ''}" onclick="openEditor(${id})">
                    ${isFixed ? 'Edit Fix' : 'Hunt Bugs'}
                </button>
            `;
        }
        grid.appendChild(card);
    }
}

// --- 8. ADMIN EDIT SYSTEM ---
function editAdminProblem(id) {
    editingTargetId = id;
    const target = currentProblems[id];
    
    document.getElementById('new-target-title').value = target.title;
    document.getElementById('new-target-code').value = target.code;
    
    document.getElementById('admin-save-btn').textContent = "Update Target";
    document.getElementById('admin-cancel-btn').style.display = "inline-block";
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelAdminEdit() {
    editingTargetId = null;
    document.getElementById('new-target-title').value = "";
    document.getElementById('new-target-code').value = "";
    document.getElementById('admin-save-btn').textContent = "Add to Grid";
    document.getElementById('admin-cancel-btn').style.display = "none";
}

function saveAdminProblem() {
    const title = document.getElementById('new-target-title').value;
    const code = document.getElementById('new-target-code').value;
    
    if(!title || !code) return alert("Please fill both Title and Code fields.");
    
    if (editingTargetId) {
        currentProblems[editingTargetId] = { title, code };
        alert("Target Updated Successfully!");
    } else {
        const newId = Object.keys(currentProblems).length > 0 ? Math.max(...Object.keys(currentProblems).map(Number)) + 1 : 1;
        currentProblems[newId] = { title, code };
        alert("Target Added Successfully!");
    }
    
    localStorage.setItem('ktb_problems', JSON.stringify(currentProblems));
    renderGrid(true);
    cancelAdminEdit(); 
}

// --- 9. EDITOR LOGIC ---
function openEditor(id) {
    currentProblemId = id;
    const target = currentProblems[id];
    const savedFixes = JSON.parse(localStorage.getItem('ktb_submissions') || '{}');

    document.getElementById('editor-title').textContent = target.title;
    document.getElementById('original-code').textContent = target.code;
    
    const editBox = document.getElementById('editable-code');
    editBox.value = savedFixes[id] ? savedFixes[id].code : target.code;
    
    document.querySelectorAll('.bug-type-check').forEach(chk => {
        chk.checked = false;
        if(savedFixes[id] && savedFixes[id].types.includes(chk.value)) chk.checked = true;
    });

    switchView('editor-view');
    updatePenaltyDisplay();
    setTimeout(() => autoResize(editBox), 50);
}

function saveFixLocally() {
    const selectedTypes = Array.from(document.querySelectorAll('.bug-type-check:checked')).map(cb => cb.value);
    
    if(selectedTypes.length === 0) {
        return alert("You must select at least one Bug Type before saving!");
    }

    const codeFix = document.getElementById('editable-code').value;
    let submissions = JSON.parse(localStorage.getItem('ktb_submissions') || '{}');
    
    submissions[currentProblemId] = {
        types: selectedTypes.join(" & "),
        code: codeFix
    };
    
    localStorage.setItem('ktb_submissions', JSON.stringify(submissions));
    alert("Fix saved securely to local storage!");
    
    loadDashboard();
    switchView('dashboard-view');
}

// --- 10. JSZIP FINAL EXPORT ---
async function exportFinalZip() {
    const submissions = JSON.parse(localStorage.getItem('ktb_submissions') || '{}');
    
    if(Object.keys(submissions).length === 0) {
        return alert("You haven't saved any fixes yet!");
    }

    if(confirm("Are you sure you want to Final Submit? This will download your zip file.")) {
        const zip = new JSZip();
        const pName = localStorage.getItem('pName').replace(/\s+/g, '_');
        const pSch = localStorage.getItem('pSch');
        const finalPenalty = localStorage.getItem('ktb_penalty') || '0';

        for (let [id, data] of Object.entries(submissions)) {
            const problemTitle = currentProblems[id].title;
            const fileContent = `/*\nPlayer: ${pName} (${pSch})\nTarget: ${problemTitle}\nIdentified Bugs: ${data.types}\nTotal Event Penalty: -${finalPenalty} Points\n*/\n\n${data.code}`;
            zip.file(`Target_${id}_Fix.java`, fileContent);
        }

        const blob = await zip.generateAsync({type:"blob"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${pName}_${pSch}_KTB.zip`;
        a.click();
        URL.revokeObjectURL(url);
    }
}