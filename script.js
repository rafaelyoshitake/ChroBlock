let currentPlayerName = "Player";
    let gameOver = false;
    let gameLoopTimeout = '';
    let score = 0;
    let isPaused = false;
    let isEasterEggActive = false; // Variável para o Easter Egg
    let rgbColor = { r: 255, g: 0, b: 0 }; // Cor inicial para o ciclo RGB
    const RGB_SPEED = 5; // Velocidade da transição (quanto maior, mais rápida)
    let rgbIntervalId = null; // ID do intervalo para o ciclo RGB
    let easterEggTimeoutId = null; // (NOVO) ID do timer para a duração do easter egg
    let warningTimeoutId = null; // (NOVO) ID do timer para o aviso
    let isWarningActive = false; // (NOVO) Flag para o aviso de fim
    let tituloElement; // (NOVO) Elemento H1 do título
    let audioContextStarted = false; // (NOVO) Flag para o áudio
    let synth; // (NOVO) Sintetizador do Tone.js
    let currentFallSpeed = 500; // Velocidade de queda padrão (ms)
    const EASTER_EGG_FALL_SPEED = 350; // Velocidade de queda no easter egg (ms)
    const EASTER_EGG_BONUS_POINTS = 50; // Pontos extras por linha no easter egg

    // Elementos do DOM para as bordas RGB
    let canvasJogoBorder;
    let canvasNextBorder;
    let canvasPontosBorder;
    let timerCanvasBorder;
    let highScoresListBorder;


    let timerInterval = null;
    let secondsPlayed = 0;

    const MAX_HIGH_SCORES = 5;
    let highScores = JSON.parse(localStorage.getItem('chroBlockHighScores')) || [];
    const CORES = [
        null, "blue", "blue", "green", "green",
        "yellow", "yellow", "red", "red"
    ];
    const Chroblocks = [
    [],[
    [1,0,0],
    [0,0,0],
    [0,0,0]],
    [
    [0,2,0],
    [0,2,0],
    [0,2,0]],
    [
    [3,0,0],
    [3,0,0],
    [3,3,0]
    ],
    [[4,4,4]
    ,[0,4,0], 
     [0,4,0]
    ],
    [[8,8,0],
     [8,8,0],
     [8,0,0]],
    [
      [6,6,0],
      [0,6,0],
      [0,6,0]],
    [
    [7,7,7],
    [0,7,0],
    [0,7,0]
    ],
    [[0,5,5],
     [0,5,0],
     [5,5,0]]
];
    const LIN = 20;
    const COL = 10;
    let jogo = Array.from({ length: LIN }, () => Array(COL).fill(0));
    let BlocoSave = '';
    let posX = 0, posY = 0;
    let ProxBloco = null;


    // --- FUNÇÕES DE DESENHO (DRAW) ---

    // Função para gerar a próxima cor no ciclo RGB
    function getNextRGBColor() {
        if (rgbColor.r === 255 && rgbColor.g < 255 && rgbColor.b === 0) {
            rgbColor.g = Math.min(255, rgbColor.g + RGB_SPEED);
        } else if (rgbColor.g === 255 && rgbColor.r > 0 && rgbColor.b === 0) {
            rgbColor.r = Math.max(0, rgbColor.r - RGB_SPEED);
        } else if (rgbColor.g === 255 && rgbColor.b < 255 && rgbColor.r === 0) {
            rgbColor.b = Math.min(255, rgbColor.b + RGB_SPEED);
        } else if (rgbColor.b === 255 && rgbColor.g > 0 && rgbColor.r === 0) {
            rgbColor.g = Math.max(0, rgbColor.g - RGB_SPEED);
        } else if (rgbColor.b === 255 && rgbColor.r < 255 && rgbColor.g === 0) {
            rgbColor.r = Math.min(255, rgbColor.r + RGB_SPEED);
        } else if (rgbColor.r === 255 && rgbColor.b > 0 && rgbColor.g === 0) {
            rgbColor.b = Math.max(0, rgbColor.b - RGB_SPEED);
        }
        return `rgb(${rgbColor.r},${rgbColor.g},${rgbColor.b})`;
    }

    function playSound(type) {
        if (!audioContextStarted || !synth) return; // Não toca se o áudio não foi iniciado

        const now = Tone.now();
        if (type === 'powerUp') {
            synth.triggerAttackRelease("C4", "8n", now);
            synth.triggerAttackRelease("G4", "8n", now + 0.1);
            synth.triggerAttackRelease("C5", "8n", now + 0.2);
        } else if (type === 'powerDown') {
            synth.triggerAttackRelease("C5", "8n", now);
            synth.triggerAttackRelease("G4", "8n", now + 0.1);
            synth.triggerAttackRelease("C4", "8n", now + 0.2);
        }
    }

    function updateRGBBorders(color) {
        if (!canvasJogoBorder) { // Garante que os elementos foram carregados
            canvasJogoBorder = document.getElementById('CanvasJogo');
            canvasNextBorder = document.querySelector('.coluna3 canvas');
            canvasPontosBorder = document.getElementById('CanvasPontos');
            timerCanvasBorder = document.getElementById('timerCanvas');
            highScoresListBorder = document.getElementById('highScoresList');
            tituloElement = document.getElementById('t'); // (NOVO) Pega o título
        }

        let finalColor = color;

        if (isWarningActive) {
            const time = Date.now();
            if (time % 400 < 200) { // Pisca a cada 200ms
                finalColor = 'white';
            }
        }

        const borders = [
            canvasJogoBorder,
            canvasNextBorder,
            canvasPontosBorder,
            timerCanvasBorder,
            highScoresListBorder
        ];

        borders.forEach(element => {
            if (element) {
                element.style.borderColor = finalColor;
            }
        });

        if (tituloElement) {
            tituloElement.style.color = finalColor;
        }
    }

    // Inicia o ciclo de cores RGB para o easter egg
    function startRGBCycle() {
        if (rgbIntervalId) clearInterval(rgbIntervalId);
        rgbColor = { r: 255, g: 0, b: 0 }; // Reseta para vermelho
        rgbIntervalId = setInterval(() => {
            if (isEasterEggActive) {
                const currentColor = getNextRGBColor();
                updateRGBBorders(currentColor); // Atualiza as bordas e o título
                drawTela(); // Redesenha a tela para aplicar a nova cor da peça
                drawNext(); // Redesenha a próxima peça com a nova cor
            }
        }, 50); // Atualiza a cor a cada 50ms para um efeito suave
    }

    // Para o ciclo de cores RGB
    function stopRGBCycle() {
        if (rgbIntervalId) {
            clearInterval(rgbIntervalId);
            rgbIntervalId = null;
        }
        // Reseta as cores das bordas para o padrão
        if (canvasJogoBorder) {
            const defaultBorders = [
                '4px solid #00c3fa',    // top
                '4px solid #fae100',   // right
                '4px solid #ff3b3b',  // bottom
                '4px solid #30ff30'    // left
            ];
            canvasJogoBorder.style.borderTop = defaultBorders[0];
            canvasJogoBorder.style.borderRight = defaultBorders[1];
            canvasJogoBorder.style.borderBottom = defaultBorders[2];
            canvasJogoBorder.style.borderLeft = defaultBorders[3];

            canvasNextBorder.style.borderTop = defaultBorders[0];
            canvasNextBorder.style.borderRight = defaultBorders[1];
            canvasNextBorder.style.borderBottom = defaultBorders[2];
            canvasNextBorder.style.borderLeft = defaultBorders[3];

            canvasPontosBorder.style.borderTop = defaultBorders[0];
            canvasPontosBorder.style.borderRight = defaultBorders[1];
            canvasPontosBorder.style.borderBottom = defaultBorders[2];
            canvasPontosBorder.style.borderLeft = defaultBorders[3];

            timerCanvasBorder.style.borderTop = defaultBorders[0];
            timerCanvasBorder.style.borderRight = defaultBorders[1];
            timerCanvasBorder.style.borderBottom = defaultBorders[2];
            timerCanvasBorder.style.borderLeft = defaultBorders[3];

            highScoresListBorder.style.borderTop = defaultBorders[0];
            highScoresListBorder.style.borderRight = defaultBorders[1];
            highScoresListBorder.style.borderBottom = defaultBorders[2];
            highScoresListBorder.style.borderLeft = defaultBorders[3];
        }

        // (NOVO) Reseta a cor do título
        if (tituloElement) {
            tituloElement.style.color = 'white';
        }
    }


    function drawTela(){
        const canvas = document.getElementById('CanvasJogo');
        const chro = canvas.getContext('2d');
        chro.clearRect(0, 0, canvas.width, canvas.height);
        for (let y = 0; y < LIN; y++){
            for (let x = 0; x < COL; x++){
                if (jogo[y][x]){
                    // Os blocos fixos mantêm suas cores originais
                    chro.fillStyle = CORES[jogo[y][x]]; 
                    chro.fillRect(x * 20, y * 20, 20, 20);
                }
            }
        }
        if (BlocoSave){
            // Se o easter egg estiver ativo, a peça caindo tem cor RGB
            const corPeca = isEasterEggActive ? getNextRGBColor() : null;

            for (let i = 0; i < BlocoSave.length; i++){
                for (let j = 0; j < BlocoSave[i].length; j++){
                    if (BlocoSave[i][j]) {
                        chro.fillStyle = isEasterEggActive ? corPeca : CORES[BlocoSave[i][j]];
                        chro.fillRect((posX + j) * 20, (posY + i) * 20, 20, 20);
                    }
                }
            }
        }
    }
    
    // VERIFICACAO DE COLISÃO
    function Colisao(movX, movY, bloco) {
        for (let i = 0; i < bloco.length; i++){
            for (let j = 0; j < bloco[i].length; j++){
                if (bloco[i][j]){
                    let x = posX + j + movX; 
                    let y = posY + i + movY;
                    // Verifica colisões com as paredes ou o fundo
                    if (x < 0 || x >= COL || y >= LIN) {
                        return false;
                    }
                    // Verifica colisões com blocos já fixados, mas apenas se 'y' não for negativo (acima do topo)
                    if (y >= 0 && jogo[y][x]){
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

        // Tenta mover a peça para baixo
        if (Colisao(0, 1, BlocoSave)) {
            posY++;
        } else {
           
            fixaBloco();
            if (gameOver) return; 
        }
        
        drawTela(); 
        drawScore();
        
       
        gameLoopTimeout = setTimeout(gameLoop, currentFallSpeed);
    }

  
    function rotateBlock(){
        const newBlock = [];
        const size = BlocoSave.length; 
        for (let i = 0; i < size; i++){ 
            newBlock[i] = [];
            for (let j = 0; j < size; j++){
                newBlock[i][j] = BlocoSave[size - 1 - j][i];
            }
        }

        
        const kicks = [[0,0], [-1,0], [1,0], [0,-1], [0,1]]; // Tentativas de deslocamento (x, y)
        for (let k = 0; k < kicks.length; k++) {
            const kickX = kicks[k][0];
            const kickY = kicks[k][1];
            posX += kickX; // Aplica o deslocamento temporariamente
            posY += kickY;

            if (Colisao(0, 0, newBlock)) {
                BlocoSave = newBlock; // Aplica a rotação se for válida
                return; // Sai da função após uma rotação e deslocamento bem-sucedidos
            }
            // Se a rotação com deslocamento ainda não for válida, reverte o deslocamento
            posX -= kickX;
            posY -= kickY;
        }
    }

    document.addEventListener('keydown', function(e){
        if (gameOver || isPaused) return; 
        
        // Remove a chamada para drawTela() daqui, pois o gameLoop já cuida disso
        // Isso evita o "salto" visual da peça.
        if (e.key === 'ArrowLeft') {
            if (Colisao(-1, 0, BlocoSave)) posX--;
        }
        else if (e.key === 'ArrowRight') {
            if (Colisao(1, 0, BlocoSave)) posX++;
        }
        else if (e.key === 'ArrowDown') {
            // Acelera a queda, mas não a congela no chão
            if (Colisao(0, 1, BlocoSave)) {
                posY++;
                // Para queda rápida, você pode chamar gameLoop() imediatamente aqui
                // para que a próxima atualização ocorra mais cedo.
                clearTimeout(gameLoopTimeout);
                gameLoopTimeout = setTimeout(gameLoop, 50); // Queda mais rápida
            }
        }
        else if (e.key === 'ArrowUp') {
            rotateBlock();
        }
        
        // Chama drawTela() apenas no final para refletir qualquer mudança de posição/rotação.
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

        // Se o easter egg estiver ativo, a próxima peça tem cor RGB
        const corPeca = isEasterEggActive ? getNextRGBColor() : null;

        for (let i = 0; i < ProxBloco.length; i++) {
            for (let j = 0; j < ProxBloco[i].length; j++) {
                if (ProxBloco[i][j]) {
                    ctx.fillStyle = isEasterEggActive ? corPeca : CORES[ProxBloco[i][j]];
                    ctx.fillRect((movX + j) * 20, (movY + i) * 20, 20, 20);
                }
            }
        }
    }

    function endGame() {
        gameOver = true;
        isEasterEggActive = false; // Reseta o easter egg
        isWarningActive = false; // (NOVO) Reseta o aviso
        if (easterEggTimeoutId) clearTimeout(easterEggTimeoutId);
        if (warningTimeoutId) clearTimeout(warningTimeoutId); // (NOVO) Limpa o timer do aviso
        stopRGBCycle(); // Para o ciclo RGB
        currentFallSpeed = 500; // Reseta a velocidade de queda
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
        isEasterEggActive = false; // Reseta o easter egg
        isWarningActive = false; // (NOVO) Reseta o aviso
        if (easterEggTimeoutId) clearTimeout(easterEggTimeoutId);
        if (warningTimeoutId) clearTimeout(warningTimeoutId); // (NOVO) Limpa o timer do aviso
        stopRGBCycle(); // Para o ciclo RGB
        currentFallSpeed = 500; // Reseta a velocidade de queda

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
        let linhasLimpas = 0; // Contador para o easter egg
        for (let y = LIN - 1; y >= 0; y--){
            if (jogo[y].every(cell => cell !== 0)){
                score += 100;
                // Adiciona bônus de pontos se o easter egg estiver ativo
                if (isEasterEggActive) {
                    score += EASTER_EGG_BONUS_POINTS;
                }
                jogo.splice(y, 1);
                jogo.unshift(Array(COL).fill(0));
                y++;
                linhasLimpas++; // Incrementa o contador
            }
        }

        if (linhasLimpas >= 2) { 
            if (!isEasterEggActive) { // Ativa apenas se não estiver ativo
                isEasterEggActive = true;
                currentFallSpeed = EASTER_EGG_FALL_SPEED; // Acelera o jogo
                startRGBCycle(); // Inicia o ciclo de cores RGB
                playSound('powerUp'); // (NOVO) Toca som de power-up
            }

            // (NOVO) Se já houver timers (aviso ou fim), limpa-os para resetar
            if (warningTimeoutId) clearTimeout(warningTimeoutId);
            if (easterEggTimeoutId) clearTimeout(easterEggTimeoutId);

            // (NOVO) Define o timer para o AVISO (3 segundos antes do fim)
            warningTimeoutId = setTimeout(startWarningFlash, 12000); // 12000ms

            // (NOVO) Define o timer para desativar o easter egg após 15 segundos
            easterEggTimeoutId = setTimeout(deactivateEasterEgg, 15000); // 15000ms

            // Reinicia o gameLoop para aplicar a nova velocidade imediatamente
            clearTimeout(gameLoopTimeout);
            gameLoop();
        }
    }

    // (FUNÇÃO NOVA) Ativa o modo de aviso de fim
    function startWarningFlash() {
        isWarningActive = true;
        warningTimeoutId = null;
    }

    // (FUNÇÃO NOVA) Chamada após 15s para desativar o easter egg
    function deactivateEasterEgg() {
        isEasterEggActive = false;
        isWarningActive = false; // (NOVO) Garante que o aviso pare
        currentFallSpeed = 500; // Reseta a velocidade
        stopRGBCycle(); // Para as cores RGB e reseta as bordas
        easterEggTimeoutId = null; // Limpa o ID do timer
        warningTimeoutId = null; // Limpa o ID do timer de aviso
        playSound('powerDown'); // (NOVO) Toca som de power-down

        // Reinicia o gameLoop para aplicar a nova velocidade (normal)
        clearTimeout(gameLoopTimeout);
        if (!gameOver && !isPaused) {
            gameLoop();
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
        // Captura os elementos das bordas uma vez que o jogo começa
        canvasJogoBorder = document.getElementById('CanvasJogo');
        canvasNextBorder = document.querySelector('.coluna3 canvas');
        canvasPontosBorder = document.getElementById('CanvasPontos');
        timerCanvasBorder = document.getElementById('timerCanvas');
        highScoresListBorder = document.getElementById('highScoresList');

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

    async function closeTutorialAndStartGame() {
        tutorialDialog.close();
        
        document.getElementById('t').style.display = 'block'; 
        document.getElementById('fundo').style.display = 'flex'; 
        
        // (NOVO) Inicia o contexto de áudio do Tone.js
        if (!audioContextStarted) {
            try {
                await Tone.start();
                audioContextStarted = true;
                synth = new Tone.Synth().toDestination();
                console.log("Áudio Context iniciado e Sintetizador pronto.");
            } catch (e) {
                console.log("Tone.js start failed: ", e);
            }
        }
        
        // TOCA A MÚSICA PELA PRIMEIRA VEZ (HTML5 Audio)
        audio.play().catch(e => console.log("Audio play failed (user may need to interact first)"));

        initGame();
    }

    closeTutorialButton.addEventListener('click', (e) => {
        e.preventDefault(); 
        closeTutorialAndStartGame();
    });

    tutorialDialog.addEventListener('cancel', (e) => {
        // Impede que o diálogo seja fechado com a tecla 'Esc'
        e.preventDefault();
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
            stopRGBCycle(); // Pausa o ciclo RGB
            pauseScreen.classList.remove('hidden'); 
            pauseIcon.classList.add('hidden'); 
            gameContainer.style.filter = 'blur(5px)'; 
        } else {
            // Despausando
            pauseScreen.classList.add('hidden'); 
            pauseIcon.classList.remove('hidden'); 
            gameContainer.style.filter = 'none'; 
            gameLoop(); // Retoma o gameLoop com a velocidade atual
            audio.play().catch(e => console.log("Audio play failed")); // TOCA A MÚSICA
            if (isEasterEggActive) {
                startRGBCycle(); // Retoma o ciclo RGB
            }
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
