const generateBtn = document.getElementById('generateBtn');
const resultDiv = document.getElementById('result');
const numberStrip = document.getElementById('numberStrip');
const animationContainer = document.getElementById('animationContainer');
const borderPath = document.querySelector('.border-path');
const postSpinActions = document.getElementById('postSpinActions');
const numberWidth = 80; // px
const clickSound = new Audio('VAS.mp3');
let idleTimeout = null;
let idleFrame = null;
let idleOffset = 0;
let lastIdleTimestamp = null;
const idleSpeed = 50; // px per second

let removedNumbers = new Set();

// Load crossed-out numbers from file
async function loadCrossedOutNumbers() {
    try {
        const response = await fetch('crossed_out.json');
        const data = await response.json();
        if (data.crossed_out && Array.isArray(data.crossed_out)) {
            data.crossed_out.forEach(num => removedNumbers.add(num));
        }
    } catch (error) {
        console.log('No crossed_out.json file or error loading it:', error);
    }
}

// Initialize by loading crossed-out numbers
loadCrossedOutNumbers().then(() => {
    renderNumberStrip();
});

function renderNumberStrip() {
    numberStrip.innerHTML = '';
    const allNumbers = Array.from({ length: 1028 }, (_, i) => i + 1);
    allNumbers.forEach(num => {
        const span = document.createElement('span');
        span.className = 'number';
        if (removedNumbers.has(num)) {
            span.classList.add('removed');
        }
        span.innerText = num;
        numberStrip.appendChild(span);
    });
}

function stopIdle() {
    numberStrip.classList.remove('idle');
    if (idleTimeout) {
        clearTimeout(idleTimeout);
        idleTimeout = null;
    }
    if (idleFrame) {
        cancelAnimationFrame(idleFrame);
        idleFrame = null;
    }
    lastIdleTimestamp = null;
    idleOffset = 0;
    numberStrip.style.setProperty('--idle-offset', '0px');
}

function scheduleIdle() {
    if (idleTimeout) {
        clearTimeout(idleTimeout);
    }
    idleTimeout = setTimeout(() => {
        numberStrip.classList.add('idle');
        startIdle();
        idleTimeout = null;
    }, 10000);
}

function clearPostSpinActions() {
    postSpinActions.innerHTML = '';
}

function showPostSpinActions(finalNum) {
    clearPostSpinActions();

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'action-buttons';

    const runItBtn = document.createElement('button');
    runItBtn.className = 'run-it';
    runItBtn.innerText = 'run it';
    runItBtn.addEventListener('click', async () => {
        removedNumbers.add(finalNum);
        removeNumberFromPool(finalNum);
        renderNumberStrip();
        clearPostSpinActions();
        
        // Save to crossed_out.json
        try {
            await fetch('https://ylsphere.github.io/doodle_binder/api/add-crossed-out', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number: finalNum })
            });
        } catch (error) {
            console.error('Error saving to crossed_out.json:', error);
        }
    });

    const imGoodBtn = document.createElement('button');
    imGoodBtn.className = 'im-good';
    imGoodBtn.innerText = "I'm good";
    imGoodBtn.addEventListener('click', () => {
        clearPostSpinActions();
    });

    buttonContainer.appendChild(runItBtn);
    buttonContainer.appendChild(imGoodBtn);
    postSpinActions.appendChild(buttonContainer);
}

function startIdle() {
    if (idleFrame) {
        return;
    }
    numberStrip.classList.add('idle');
    lastIdleTimestamp = null;
    idleFrame = requestAnimationFrame(function step(timestamp) {
        if (!lastIdleTimestamp) {
            lastIdleTimestamp = timestamp;
        }
        const delta = (timestamp - lastIdleTimestamp) / 1000;
        lastIdleTimestamp = timestamp;
        idleOffset -= delta * idleSpeed;
        numberStrip.style.setProperty('--idle-offset', `${idleOffset}px`);
        idleFrame = requestAnimationFrame(step);
    });
}

generateBtn.addEventListener('click', function() {
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {
        // Play may fail if browser requires user interaction; ignore silently.
    });
    generateBtn.disabled = true;
    generateBtn.innerText = 'Generating...';
    resultDiv.innerText = '';
    clearPostSpinActions();
    // keep idle motion active while the red line circles the border

    if (borderPath) {
        borderPath.classList.remove('animate');
        void borderPath.getBoundingClientRect();
        borderPath.classList.add('animate');
    }


    const containerWidth = animationContainer.clientWidth;
    const indicatorOffset = containerWidth / 2;
    const finalNum = getRandomNumberFromPool();
    if (finalNum === null) {
        resultDiv.innerText = 'No numbers left';
        generateBtn.disabled = false;
        return;
    }
    const finalPosition = indicatorOffset - numberWidth / 2 - (finalNum - 1) * numberWidth;

    // After the 1.5 second border animation completes, start the 5.5 second spin
    setTimeout(() => {
        stopIdle();
        numberStrip.classList.add('spinning');
        numberStrip.style.setProperty('transition', 'none');
        
        // Calculate spin distance to ensure multiple full rotations
        // Always spin at least 5-7 full cycles (5-7 * 1028 numbers) plus the final position
        const fullRotations = 2; // 5-7 rotations
        const spinDistance = fullRotations * 1028 * numberWidth;
        const startOffset = spinDistance + finalPosition;
        
        numberStrip.style.setProperty('--base', `${startOffset}px`);
        numberStrip.offsetWidth; // force reflow
        
        // Apply transition and animate to final position
        numberStrip.style.removeProperty('transition');
        requestAnimationFrame(() => {
            numberStrip.style.setProperty('--base', `${finalPosition}px`);
        });
    }, 1500);

    // After animation ends
    setTimeout(() => {
        numberStrip.classList.remove('spinning');
        resultDiv.innerText = `Pokémon #${finalNum}`;
        scheduleIdle();
        generateBtn.disabled = false;
        generateBtn.innerText = 'Pick your fate';
        showPostSpinActions(finalNum);
    }, 7600); // 5.5s animation + 1.5s delay
});

// Initialize idle animation after page load
loadCrossedOutNumbers().then(() => {
    numberStrip.classList.add('idle');
    startIdle();
});