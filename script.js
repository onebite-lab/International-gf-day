// =========================================
// STATE & AUDIO MANAGEMENT
// =========================================
let bgm = document.getElementById('bgm');
let audioStarted = false;

// Function to start audio on first interaction
function initAudio() {
    if (!audioStarted) {
        bgm.volume = 0.4;
        bgm.play().catch(e => console.log("Audio autoplay prevented"));
        audioStarted = true;
    }
}

// Function to handle page transitions
function changePage(fromPageId, toPageId) {
    const fromPage = document.getElementById(fromPageId);
    const toPage = document.getElementById(toPageId);
    
    fromPage.style.opacity = '0';
    setTimeout(() => {
        fromPage.classList.remove('active');
        fromPage.classList.add('hidden');
        
        toPage.classList.remove('hidden');
        // Force reflow
        void toPage.offsetWidth;
        toPage.classList.add('active');
        toPage.style.opacity = '1';
        
        // Trigger specific page animations based on ID
        if(toPageId === 'page2') startBalloonAnimation();
        if(toPageId === 'page3') initScratchCards();
        if(toPageId === 'page5') startTypewriter();
        if(toPageId === 'page6') startConfetti();
    }, 800); // Wait for CSS fade out
}

// Helper: Spawn floating heart
function spawnFloatingHeart(x, y) {
    const heart = document.createElement('div');
    heart.innerHTML = '❤️';
    heart.className = 'floating-heart';
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;
    document.body.appendChild(heart);
    
    setTimeout(() => heart.remove(), 4000);
}


// =========================================
// PAGE 1: ENVELOPE INTERACTION
// =========================================
const appContainer = document.getElementById('app-container');
appContainer.addEventListener('click', function page1Click(e) {
    if(!document.getElementById('page1').classList.contains('active')) return;
    
    initAudio();
    const envWrapper = document.getElementById('envelope-btn');
    
    // Animate envelope opening
    envWrapper.classList.add('envelope-open');
    document.querySelector('.tap-instruction').style.opacity = '0';
    
    // Wait for envelope animation, then change page
    setTimeout(() => {
        changePage('page1', 'page2');
    }, 1500);
    
    appContainer.removeEventListener('click', page1Click);
}, {once: true});


// =========================================
// PAGE 2: BALLOON ANIMATION
// =========================================
function startBalloonAnimation() {
    const balloon = document.getElementById('balloon');
    // Rise up to center
    balloon.style.transform = 'translateY(-40vh)';
    
    // Spawn sparkles/hearts
    const interval = setInterval(() => {
        spawnFloatingHeart(
            Math.random() * window.innerWidth, 
            window.innerHeight
        );
    }, 500);
    
    // Auto transition to page 3 after animation holds
    setTimeout(() => {
        clearInterval(interval);
        // Float away completely
        balloon.style.transform = 'translateY(-120vh)';
        setTimeout(() => changePage('page2', 'page3'), 1500);
    }, 6000);
}


// =========================================
// PAGE 3: SCRATCH CARDS (CANVAS)
// =========================================
let scratchedCounts = { 1: false, 2: false, 3: false };

function initScratchCards() {
    const canvases = [
        { id: 'scratch1', num: 1 },
        { id: 'scratch2', num: 2 },
        { id: 'scratch3', num: 3 }
    ];

    canvases.forEach(cvsObj => {
        const canvas = document.getElementById(cvsObj.id);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const parent = canvas.parentElement;
        
        // Match canvas logical size to DOM size
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
        
        // Fill canvas with pastel silver/overlay color
        ctx.fillStyle = '#dcdde1';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw some pattern/text on top to look like a scratch card
        ctx.fillStyle = '#a4b0be';
        ctx.font = '20px Quicksand';
        ctx.textAlign = 'center';
        ctx.fillText('Scratch Me', canvas.width/2, canvas.height/2 + 7);

        let isDrawing = false;
        
        const getBrushPos = (xRef, yRef) => {
            const rect = canvas.getBoundingClientRect();
            return {
                x: (xRef - rect.left) / (rect.right - rect.left) * canvas.width,
                y: (yRef - rect.top) / (rect.bottom - rect.top) * canvas.height
            };
        };

        const scratch = (x, y) => {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(x, y, 20, 0, Math.PI * 2); // Brush size 20
            ctx.fill();
        };

        // Mouse Events
        canvas.addEventListener('mousedown', (e) => { isDrawing = true; });
        canvas.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;
            const pos = getBrushPos(e.clientX, e.clientY);
            scratch(pos.x, pos.y);
        });
        canvas.addEventListener('mouseup', () => { isDrawing = false; checkCompletion(canvas, ctx, cvsObj.num); });
        canvas.addEventListener('mouseleave', () => { isDrawing = false; });

        // Touch Events
        canvas.addEventListener('touchstart', (e) => { 
            e.preventDefault(); 
            isDrawing = true; 
        }, {passive: false});
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!isDrawing) return;
            const touch = e.touches[0];
            const pos = getBrushPos(touch.clientX, touch.clientY);
            scratch(pos.x, pos.y);
        }, {passive: false});
        canvas.addEventListener('touchend', () => { 
            isDrawing = false; 
            checkCompletion(canvas, ctx, cvsObj.num); 
        });
    });
}

function checkCompletion(canvas, ctx, num) {
    if(scratchedCounts[num]) return; // Already checked

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparent = 0;
    
    // Check alpha channel of pixels
    for(let i = 3; i < pixels.length; i += 4) {
        if(pixels[i] < 255) transparent++;
    }
    
    const percent = (transparent / (pixels.length / 4)) * 100;
    
    // If more than 50% scratched, reveal entirely
    if (percent > 50) {
        canvas.style.transition = 'opacity 0.5s';
        canvas.style.opacity = '0';
        scratchedCounts[num] = true;
        
        // Spawn particles
        const rect = canvas.getBoundingClientRect();
        spawnFloatingHeart(rect.left + rect.width/2, rect.top);
        
        // Check if all are done
        if (scratchedCounts[1] && scratchedCounts[2] && scratchedCounts[3]) {
            setTimeout(() => {
                const btn = document.getElementById('next-btn-3');
                btn.classList.remove('hidden');
                btn.onclick = () => changePage('page3', 'page4');
            }, 500);
        }
    }
}


// =========================================
// PAGE 4: MEMORY JAR
// =========================================
const memoryJar = document.getElementById('memory-jar');
const polaroidContainer = document.getElementById('polaroid-container');
// Assuming these assets exist in your folder structure
const photos = [
    'assets/photos/photo1.jpg',
    'assets/photos/photo2.jpg',
    'assets/photos/photo3.jpg'
];
let currentPhotoIdx = 0;

memoryJar.addEventListener('click', (e) => {
    if (currentPhotoIdx >= photos.length) return; // All photos pulled
    
    // Jar interaction animation
    memoryJar.style.transform = 'scale(0.9) rotate(5deg)';
    setTimeout(() => memoryJar.style.transform = 'scale(1) rotate(0)', 150);
    spawnFloatingHeart(e.clientX, e.clientY);

    // Create polaroid element
    const polaroid = document.createElement('div');
    polaroid.className = 'polaroid pop-in';
    
    const img = document.createElement('img');
    // If the image fails to load, it will show the white/gray background styled in CSS
    img.src = photos[currentPhotoIdx];
    img.alt = 'Memory';
    
    polaroid.appendChild(img);
    
    // Calculate random position and rotation
    const rotation = (Math.random() * 30 - 15); // -15 to +15 deg
    const tx = -50 + (Math.random() * 40 - 20); // offset center X
    const ty = (currentPhotoIdx * -20) - 30; // Stack upwards slightly
    
    // Set dynamic keyframe result
    polaroid.style.transform = `translate(${tx}%, ${ty}px) scale(1) rotate(${rotation}deg)`;
    polaroidContainer.appendChild(polaroid);
    
    currentPhotoIdx++;
    
    // Show next button after all photos are pulled
    if (currentPhotoIdx === photos.length) {
        setTimeout(() => {
            const btn = document.getElementById('next-btn-4');
            btn.classList.remove('hidden');
            btn.onclick = () => changePage('page4', 'page5');
        }, 1500);
    }
});


// =========================================
// PAGE 5: TYPEWRITER LOVE NOTE
// =========================================
const noteLines = [
    "Happy Girlfriend Day, My Dearest Shreya ❤️",
    "Ejse dinno bana totte. 🥹❤️",
    "Tui otte mo jinghanir sera ekko odyai.",
    "To rwbo mo monanor daily fuel, ar jol goranagan NOS (Nitrous Oxide Systems) dikke monanor goti aro bej guri bare de. 😆❤️",
    "Ar to hojpanagan otte mor vogobane diye sera ekkan gift. 🎁💖",
    "Distance, time ba situation je odosat mui sob somoy to hure tebar sang. 😘😘",
    "Thank you for being my happiness, my peace, and my forever. ❤️",
    "Happy Girlfriend Day, My Love. 🌹",
    "With all my love,",
    "Borgoe ❤️"
];

function startTypewriter() {
    const textContainer = document.getElementById('typewriter-text');
    textContainer.innerHTML = '';
    textContainer.classList.add('typewriter-cursor');
    
    let lineIdx = 0;
    let charIdx = 0;
    
    function typeChar() {
        if (lineIdx >= noteLines.length) {
            textContainer.classList.remove('typewriter-cursor');
            // Show next button
            const btn = document.getElementById('next-btn-5');
            btn.classList.remove('hidden');
            btn.onclick = () => changePage('page5', 'page6');
            return;
        }

        const currentLine = noteLines[lineIdx];
        
        if (charIdx < currentLine.length) {
            // Check for emoji/multi-byte chars to avoid splitting them (basic handling via substring)
            // A more robust way is to convert string to array of characters handling unicode
            const chars = Array.from(currentLine); 
            
            if(charIdx < chars.length) {
                textContainer.innerHTML += chars[charIdx];
                charIdx++;
                
                // Auto scroll to bottom of notebook
                textContainer.scrollTop = textContainer.scrollHeight;
                
                let delay = Math.random() * 50 + 30; // 30-80ms
                if (chars[charIdx-1] === '.' || chars[charIdx-1] === ',') delay += 300; // Pause at punctuation
                setTimeout(typeChar, delay);
            } else {
                // Line finished (safety catch)
                textContainer.innerHTML += '<br><br>';
                lineIdx++;
                charIdx = 0;
                setTimeout(typeChar, 500);
            }
        } else {
            // Line finished
            textContainer.innerHTML += '<br><br>';
            lineIdx++;
            charIdx = 0;
            setTimeout(typeChar, 500); // Pause between lines
        }
    }
    
    typeChar();
}


// =========================================
// PAGE 6: ENDING & CONFETTI
// =========================================
function startConfetti() {
    const container = document.getElementById('confetti-container');
    const colors = ['#ff758f', '#ffcdd2', '#c1e1dc', '#ffecb3'];
    
    for (let i = 0; i < 70; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti-piece');
        
        // Random properties
        const size = Math.random() * 10 + 5; // 5-15px
        const left = Math.random() * 100; // 0-100vw
        const bg = colors[Math.floor(Math.random() * colors.length)];
        const duration = Math.random() * 3 + 2; // 2-5s
        const delay = Math.random() * 2; // 0-2s
        
        confetti.style.width = `${size}px`;
        confetti.style.height = `${size}px`;
        confetti.style.left = `${left}vw`;
        confetti.style.backgroundColor = bg;
        confetti.style.animationDuration = `${duration}s`;
        confetti.style.animationDelay = `${delay}s`;
        
        // Make some of them hearts instead of circles via unicode
        if(Math.random() > 0.5) {
            confetti.style.backgroundColor = 'transparent';
            confetti.innerHTML = '❤️';
            confetti.style.fontSize = `${size + 10}px`;
        }

        container.appendChild(confetti);
    }
    
    // Continuous random floating hearts at the end
    setInterval(() => {
        spawnFloatingHeart(Math.random() * window.innerWidth, window.innerHeight);
    }, 800);
}
