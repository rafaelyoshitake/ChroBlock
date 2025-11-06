// --- VARIÁVEIS GLOBAIS DO JOGO ---
let currentPlayerName = "Player";
let gameOver = false;
let gameLoopTimeout = '';
let score = 0;
let isPaused = false;

let timerInterval = null;
let secondsPlayed = 0;

const MAX_HIGH_SCORES = 5;
let highScores = JSON.parse(localStorage.getItem('chroBlockHighScores')) || [];
const CORES = [
    null, "blue", "blue", "green", "green",
    "yellow", "yellow", "red", "red"
];
const Chroblocks = [
    [],
    [[1,1,0], [1,0,0], [1,1,0]],
    [[0,2,0], [2,2,2], [0,2,0]],
    [[3,0,0], [3,0,0], [3,3,3]],
    [[4,4,4], [0,4,0], [0,4,0]],
    [[5,5,0], [5,5,0], [5,0,0]],
    [[6,6,0], [0,6,6], [0,6,0]],
    [[7,7,0], [0,7,0], [0,7,7]],
    [[8,0,0], [8,8,0], [8,8,8]]
];
const LIN = 20;
const COL = 10;
let jogo = Array.from({ length: LIN }, () => Array(COL).fill(0));
let BlocoSave = '';
let posX = 0, posY = 0;
let ProxBloco = null;


// --- FUNÇÕES DE DESENHO (DRAW) ---

function drawTela(){
    const canvas = document.getElementById('CanvasJogo');
    const chro = canvas.getContext('2d');
    chro.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < LIN; y++){
        for (let x = 0; x < COL; x++){
            if (jogo[y][x]){
                chro.fillStyle = CORES[jogo[y][x]];
                chro.fillRect(x * 20, y * 20, 20, 20);
            }
        }
    }
    if (BlocoSave){
        for (let i = 0; i < BlocoSave.length; i++){
            for (let j = 0; j < BlocoSave[i].length; j++){
                if (BlocoSave[i][j]) {
                    chro.fillStyle = CORES[BlocoSave[i][j]];
                    chro.fillRect((posX + j) * 20, (posY + i) * 20, 20, 20);
                }
            }
        }
    }
}
function Colisao(movX, movY, bloco) {
    for (let i = 0; i < bloco.length; i++){
        for (let j = 0; j < bloco[i].length; j++){
            if (bloco[i][j]){
                let x = posX + j + movX; 
                let y = posY + i + movY;
                if (x < 0 || x >= COL || y >= LIN || (y >= 0 && jogo[y][x])){
                    return false;
                }
            }
        }
    }
    return true;
}
function fixaBloco(){
    for (let i = 0; i < BlocoSave.length; i++) {
        for (let j = 0; j < BlocoSave[i].length; j++) {
            if (BlocoSave[i][j]) {
                let x = posX + j;
                let y = posY + i;
                if (y < 0){
                    endGame();
                    return; 
                }
                jogo[y][x] = BlocoSave[i][j];
            } 
        }
    }
    LinhasCompletas();
    spawnBloco();
}
function gameLoop() {
    clearTimeout(gameLoopTimeout);
    if (gameOver || isPaused) return; 
    if (Colisao(0, 1, BlocoSave)) {
        posY++;
    }else{
        fixaBloco();
        if (gameOver) return; 
    }
    drawTela();
    drawScore();
    gameLoopTimeout = setTimeout(gameLoop, 500);
}
function rotateBlock(){
    const newBlock = [];
    const size = BlocoSave.length;
    for (let i = 0; i < size; i++){ 
        newBlock[i] = [];
        for (let j = 0; j < size; j++){
            newBlock[i][j] = BlocoSave[size - j - 1][i];
        }
    }
    if (Colisao(0, 0, newBlock)) {
        BlocoSave = newBlock;
    }
}
document.addEventListener('keydown', function(e){
    if (gameOver || isPaused) return; 
    if (e.key === 'ArrowLeft' && Colisao(-1, 0, BlocoSave)) posX--;
    else if (e.key === 'ArrowRight' && Colisao(1, 0, BlocoSave)) posX++;
    else if (e.key === 'ArrowDown' && Colisao(0, 1, BlocoSave)) posY++;
    else if (e.key === 'ArrowUp') rotateBlock();
    drawTela();
});

function spawnBloco(){
    if (ProxBloco === null){
        let idx = Math.floor(Math.random() * (Chroblocks.length - 1)) + 1;
        ProxBloco = JSON.parse(JSON.stringify(Chroblocks[idx]));
    }
    BlocoSave = ProxBloco;
    posX = 3;
    posY = 0;
    let idx = Math.floor(Math.random() * (Chroblocks.length - 1)) + 1;
    ProxBloco = JSON.parse(JSON.stringify(Chroblocks[idx]));
    drawNext();
    if (!Colisao(0, 0, BlocoSave)){
        endGame();
        return;
    }
}
function drawNext(){
    const canvas = document.querySelector('.coluna3 canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!ProxBloco) return;
    let movX = 2;
    let movY = 2;
    for (let i = 0; i < ProxBloco.length; i++) {
        for (let j = 0; j < ProxBloco[i].length; j++) {
            if (ProxBloco[i][j]) {
                ctx.fillStyle = CORES[ProxBloco[i][j]];
                ctx.fillRect((movX + j) * 20, (movY + i) * 20, 20, 20);
            }
        }
    }
}

function endGame() {
    gameOver = true;
    clearTimeout(gameLoopTimeout);
    clearInterval(timerInterval); 
    
    audio.pause(); 
    audio.currentTime = 0; 
    
    BlocoSave = null;
    drawTela();
    checkHighScore(score);
    drawHighScores();
    
    document.getElementById('pauseIcon').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.remove('hidden');
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalTime').textContent = formatTime(secondsPlayed);
    document.getElementById('fundo').style.filter = 'blur(5px)'; 
}

function checkHighScore(currentScore) {
    if (currentScore === 0) return; 
    const isHighScore = highScores.length < MAX_HIGH_SCORES || currentScore > highScores[highScores.length - 1].score;
    if (isHighScore) {
        const name = currentPlayerName; 
        const newScore = { name: name, score: currentScore };
        highScores.push(newScore);
        highScores.sort((a, b) => b.score - a.score);
        highScores.splice(MAX_HIGH_SCORES); 
        localStorage.setItem('chroBlockHighScores', JSON.stringify(highScores));
    }
}
function drawHighScores() {
    const listElement = document.getElementById('highScoresList');
    listElement.innerHTML = ""; 
    if (highScores.length === 0) {
        listElement.innerHTML = "<div style='padding: 5px;'>Nenhum recorde!</div>";
        return;
    }
    for (let i = 0; i < highScores.length; i++) {
        listElement.innerHTML += `<div>${i + 1}. ${highScores[i].name} - ${highScores[i].score}</div>`;
    }
}

function reiniciarJogo(){
    clearTimeout(gameLoopTimeout);
    clearInterval(timerInterval); 
    
    // Reinicia a música
    audio.currentTime = 0;
    audio.play().catch(e => console.log("Audio play failed (user may need to interact first)"));

    jogo = Array.from({ length: LIN }, () => Array(COL).fill(0));
    score = 0;
    BlocoSave = null;
    ProxBloco = null;
    gameOver = false; 
    isPaused = false;
    
    document.getElementById('pauseScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('fundo').style.filter = 'none';
    document.getElementById('pauseIcon').classList.remove('hidden');
    
    drawTela();
    drawScore();
    drawHighScores();
    spawnBloco();
    gameLoop();
    
    startTimer(); 
}

function LinhasCompletas(){
    for (let y = LIN - 1; y >= 0; y--){
        if (jogo[y].every(cell => cell !== 0)){
            score += 100;
            jogo.splice(y, 1);
            jogo.unshift(Array(COL).fill(0));
            y++;
        }
    }
}
function drawScore(){
    const scoreCanvas = document.getElementById('CanvasPontos'); 
    const ctx = scoreCanvas.getContext('2d'); 
    ctx.clearRect(0, 0, scoreCanvas.width, scoreCanvas.height);
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "left"; 
    ctx.fillText(score, 10, 30);
}

// --- FUNÇÕES DE TIMER ---
function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (num) => num.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
function drawTimer(){
    const timerCanvas = document.getElementById('timerCanvas'); 
    const ctx = timerCanvas.getContext('2d'); 
    ctx.clearRect(0, 0, timerCanvas.width, timerCanvas.height);
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "center"; 
    const timeString = formatTime(secondsPlayed);
    ctx.fillText(timeString, timerCanvas.width / 2, 30); 
}
function startTimer() {
    if (timerInterval) clearInterval(timerInterval); 
    secondsPlayed = 0;
    drawTimer(); 
    timerInterval = setInterval(() => {
        secondsPlayed++;
        drawTimer();
    }, 1000); 
}
// ------------------------

function initGame() {
    document.getElementById('pauseIcon').classList.remove('hidden');
    spawnBloco();
    drawNext();
    gameLoop();
    startTimer(); 
}



document.getElementById('startGameButton').onclick = function() {
    const nameError = document.getElementById('nameError'); 
    let name = document.getElementById('playerNameInput').value;
    
    nameError.style.display = 'none';

    if (name.trim() === "") {
        nameError.style.display = 'block'; 
        return; 
    }
    
    currentPlayerName = name;
    document.getElementById('startScreenOverlay').style.display = 'none';
    showTutorial(); 
};

document.getElementById('playerNameInput').addEventListener('keyup', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('startGameButton').click(); 
    }
});

// --- LÓGICA DO TUTORIAL ---
const tutorialDialog = document.getElementById('tutorialDialog');
const closeTutorialButton = document.getElementById('closeTutorialButton');

function showTutorial() {
    tutorialDialog.showModal();
}

function closeTutorialAndStartGame() {
    tutorialDialog.close();
    
    document.getElementById('t').style.display = 'block'; 
    document.getElementById('fundo').style.display = 'flex'; 
    
    // TOCA A MÚSICA PELA PRIMEIRA VEZ
    audio.play().catch(e => console.log("Audio play failed (user may need to interact first)"));

    initGame();
}

closeTutorialButton.addEventListener('click', (e) => {
    e.preventDefault(); 
    closeTutorialAndStartGame();
});

tutorialDialog.addEventListener('cancel', (e) => {
    e.preventDefault();
});


document.addEventListener('keydown', function(e){
    if (gameOver || isPaused) return; 
    if (e.key === 'ArrowLeft' && Colisao(-1, 0, BlocoSave)) posX--;
    else if (e.key === 'ArrowRight' && Colisao(1, 0, BlocoSave)) posX++;
    else if (e.key === 'ArrowDown' && Colisao(0, 1, BlocoSave)) posY++;
    else if (e.key === 'ArrowUp') rotateBlock();
    drawTela();
});

// Desenhos iniciais (antes do jogo começar)
drawHighScores();
drawTimer(); 


// --- PEGANDO OS ELEMENTOS ---
const pauseIcon = document.getElementById('pauseIcon');
const pauseScreen = document.getElementById('pauseScreen');
const continueButton = document.getElementById('continueButton');
const restartPauseButton = document.getElementById('restartPauseButton');
const gameContainer = document.getElementById('fundo');

// Elementos de Créditos
const devButton = document.getElementById('devButton');
const devModal = document.getElementById('devModal');
const closeDevModalButton = document.getElementById('closeDevModalButton');

// Elementos de Game Over
const restartGameOverButton = document.getElementById('restartGameOverButton');

// --- NOVOS ELEMENTOS DE ÁUDIO E CONFIGURAÇÕES ---
const audio = document.getElementById('musicaFundo');
const settingsButton = document.getElementById('settingsButton');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsButton = document.getElementById('closeSettingsButton');
const volumeSlider = document.getElementById('volumeSlider');
const muteButton = document.getElementById('muteButton');

audio.volume = volumeSlider.value / 100; // Define o volume inicial (0.5)

function handleVolumeChange(e) {
    audio.volume = e.target.value / 100;
    if (audio.volume > 0) {
        audio.muted = false;
    }
    updateMuteButton();
}

function toggleMute() {
    audio.muted = !audio.muted;
    updateMuteButton();
}

function updateMuteButton() {
    if (audio.muted || audio.volume === 0) {
        muteButton.innerText = 'ATIVAR SOM (🔇)';
    } else {
        muteButton.innerText = 'MUTAR SOM (🔊)';
    }
}

// --- FUNÇÃO DE PAUSA ATUALIZADA ---
function togglePause() {
    if (gameOver) return; 

    isPaused = !isPaused;

    if (isPaused) {
        // Pausando
        clearTimeout(gameLoopTimeout); 
        clearInterval(timerInterval); 
        audio.pause(); // PAUSA A MÚSICA
        pauseScreen.classList.remove('hidden'); 
        pauseIcon.classList.add('hidden'); 
        gameContainer.style.filter = 'blur(5px)'; 
    } else {
        // Despausando
        pauseScreen.classList.add('hidden'); 
        pauseIcon.classList.remove('hidden'); 
        gameContainer.style.filter = 'none'; 
        gameLoop();
        audio.play().catch(e => console.log("Audio play failed")); // TOCA A MÚSICA
        
        timerInterval = setInterval(() => {
            secondsPlayed++;
            drawTimer();
        }, 1000);
    }
}

// --- LISTENERS DE PAUSA E MODAIS ---
pauseIcon.addEventListener('click', togglePause);

continueButton.addEventListener('click', (e) => {
    e.preventDefault();
    if (isPaused) { 
        togglePause();
    }
});

restartPauseButton.addEventListener('click', (e) => {
    e.preventDefault();
    if (isPaused) {
        togglePause();
    }
    reiniciarJogo();
});

// Botão de Créditos
devButton.addEventListener('click', (e) => {
    e.preventDefault();
    pauseScreen.classList.add('hidden'); 
    devModal.classList.remove('hidden'); 
});

closeDevModalButton.addEventListener('click', (e) => {
    e.preventDefault();
    devModal.classList.add('hidden'); 
    pauseScreen.classList.remove('hidden'); 
});


restartGameOverButton.addEventListener('click', (e) => {
    e.preventDefault();
    reiniciarJogo();
});

settingsButton.addEventListener('click', (e) => {
    e.preventDefault();
    pauseScreen.classList.add('hidden');    // Esconde o menu de pausa
    settingsModal.classList.remove('hidden'); // Mostra o menu de configs
});

closeSettingsButton.addEventListener('click', (e) => {
    e.preventDefault();
    settingsModal.classList.add('hidden');  // Esconde o menu de configs
    pauseScreen.classList.remove('hidden');   // Mostra o menu de pausa
});

volumeSlider.addEventListener('input', handleVolumeChange);
muteButton.addEventListener('click', toggleMute);

updateMuteButton();
