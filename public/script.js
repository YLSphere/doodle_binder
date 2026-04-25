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
const SPIN_DURATION = 6000; // always same speed
let removedNumbers = new Set();

// Load crossed-out numbers from file
async function loadCrossedOutNumbers() {
    try {
        const response = await fetch('/api/get-crossed-out');
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
    removedNumbers.forEach(num => {
        removeNumberFromPool(num);
    });

    renderNumberStrip();
});

function renderNumberStrip() {
    numberStrip.innerHTML = '';
    const allNumbers = Array.from({ length: 1028 * 3 }, (_, i) => (i % 1028) + 1);
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
        startIdle();
        idleTimeout = null;
    }, 10000); // shorter delay so it visibly resumes
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
    runItBtn.innerText = 'run it 🗣️';
    runItBtn.addEventListener('click', async () => {
        removedNumbers.add(finalNum);
        removeNumberFromPool(finalNum);
        renderNumberStrip();
        clearPostSpinActions();
        
        // Save to crossed_out.json
        try {
            await fetch('/api/add-crossed-out', {
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
    imGoodBtn.innerText = "yea i'm good dawg 💀";
    imGoodBtn.addEventListener('click', () => {
        clearPostSpinActions();
    });

    buttonContainer.appendChild(runItBtn);
    buttonContainer.appendChild(imGoodBtn);
    postSpinActions.appendChild(buttonContainer);
}

function startIdle() {
    if (idleFrame) return;

    numberStrip.classList.add('idle');

    lastIdleTimestamp = null;

    function step(timestamp) {
        if (!lastIdleTimestamp) {
            lastIdleTimestamp = timestamp;
        }

        const delta = (timestamp - lastIdleTimestamp) / 1000;
        lastIdleTimestamp = timestamp;

        idleOffset -= delta * idleSpeed;

        const TOTAL = 1028;
        const cycleWidth = TOTAL * numberWidth;

        // keep within safe render range
        if (idleOffset < -cycleWidth) {
            idleOffset += cycleWidth;
        }

        numberStrip.style.transform = `translateX(${idleOffset}px)`;

        idleFrame = requestAnimationFrame(step);
    }

    idleFrame = requestAnimationFrame(step);
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
    const indexInMiddleCycle = 1028 + (finalNum - 1); // land in middle cycle

    const targetOffset =
        indicatorOffset -
        numberWidth / 2 -
        indexInMiddleCycle * numberWidth;

    // After the 1.5 second border animation completes, start the 5.5 second spin
    setTimeout(() => {
        stopIdle();

        const TOTAL = 1028;
        const SPIN_CYCLES = 1;
        const cycleWidth = TOTAL * numberWidth;
        const containerWidth = animationContainer.clientWidth;
        const indicatorOffset = containerWidth / 2;

        // ALWAYS FORCE FORWARD MOVEMENT (never backward)
        const currentIndex = Math.abs(Math.round(-idleOffset / numberWidth));

        const targetIndex =
            currentIndex +
            (SPIN_CYCLES * TOTAL) +
            (finalNum - 1 - (currentIndex % TOTAL));

        const startX = -currentIndex * numberWidth;

        const endX =
            indicatorOffset -
            numberWidth / 2 -
            targetIndex * numberWidth;

        const startTime = performance.now();

        function easeOutQuart(t) {
            return 1 - Math.pow(1 - t, 4);
        }

        function animate(now) {
            const t = Math.min((now - startTime) / SPIN_DURATION, 1);
            const eased = easeOutQuart(t);

            const x = startX + (endX - startX) * eased;

            numberStrip.style.transform = `translateX(${x}px)`;

            idleOffset = ((x % cycleWidth) + cycleWidth) % cycleWidth;

            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                numberStrip.style.transform = `translateX(${endX}px)`;
                idleOffset = endX;

                resultDiv.innerText = `Pokémon #${finalNum}`;
                generateBtn.disabled = false;
                generateBtn.innerText = 'Pick your fate';

                scheduleIdle();
                showPostSpinActions(finalNum);
            }
        }

        requestAnimationFrame(animate);

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