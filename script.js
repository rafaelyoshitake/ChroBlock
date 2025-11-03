let gameOver = false; // variavel para verificar se o jogo esta ativo
let gameLoopTimeout= ''; // variavel para controlar o loop
let score = 0; // variavel para guardar a pontuação
let bestScore = 0; // variavel pra best score

const CORES = [ // vetores que definem as cores dos blocos (usado no vetor de bloco)
  null, // 0 - espaco vazio
  "blue", // Azul
  "blue", // Azul2
  "green", // Verde
  "green", // Verde2
  "yellow", // Amarelo
  "yellow", // Amarelo2
  "red", // Vermelho
  "red", // Vermelho2
];

const Chroblocks = [ // cria vetores/matrizes com blocos definidos
  [],
  [ // Azul
    [1,1,0],
    [1,0,0],
    [1,1,0]
  ],
  [ // Azul2
    [0,2,0],
    [2,2,2],
    [0,2,0]
  ],
  [ // Verde
    [3,0,0],
    [3,0,0],
    [3,3,3]
  ],
  [ // Verde2
    [4,4,4],
    [0,4,0],
    [0,4,0]
  ],
  [ // Amarelo
    [5,5,0],
    [5,5,0],
    [5,0,0]
  ],
  [ // Amarelo2
    [6,6,0],
    [0,6,6],
    [0,6,0]
  ],
   [ // Vermelho
    [7,7,0],
    [0,7,0],
    [0,7,7]
  ],
   [ // Vermelho2
    [8,0,0],
    [8,8,0],
    [8,8,8]
  ],
];

const LIN = 20; // linhas da area do jogo
const COL = 10; // colunas da area do jogo
let jogo = Array.from({ length: LIN }, function() { // cria um vetor com a quantidade de linhas definidas
  return Array(COL).fill(0); // cria um vetor para as colunas e preenche com 0
  }
);
 
 
 
let BlocoSave = ''; // variavel vazia para armazenar o bloco
let posX = 0, posY = 0; // cria variavel onde vai definir em que posicao o bloco ira spawnar



function drawTela(){
  const canvas = document.getElementById('CanvasJogo'); // defne uma constante para o canvas referenciado no id
  const chro = canvas.getContext('2d'); // coloca o contexto de 2d para desenhar no canvas
  chro.clearRect(0, 0, canvas.width, canvas.height); // limpa a area do canvas

  for (let y = 0; y < LIN; y++){ // percorre as linhas do canvas
    for (let x = 0; x < COL; x++){ // percorre as colunas
      if (jogo[y][x]){ //verifica se o espaco x e y esta preenchido e desenha um bloco da cor
        chro.fillStyle = CORES[jogo[y][x]];
        chro.fillRect(x * 20, y * 20, 20, 20);
      }
    }
  }
  if (BlocoSave){
    for (let i = 0; i < BlocoSave.length; i++){ // percorre as linhas de blocos ativos
      for (let j = 0; j < BlocoSave[i].length; j++){ // percorre as colunas com blocos
        if (BlocoSave[i][j]) { // verifica se o bloco ativo (em movimento) nao passou em alguma area q ja tenha um bloco e a desenha
          chro.fillStyle = CORES[BlocoSave[i][j]];
          chro.fillRect((posX + j) * 20, (posY + i) * 20, 20, 20);
        }
      }
    }
  }
}

function Colisao(movX, movY, bloco) { // cria uma funcao que verifica o movimentos com os parametros x e y
  for (let i = 0; i < bloco.length; i++){ // percorre as celulas do bloco
    for (let j = 0; j < bloco[i].length; j++){
      if (bloco[i][j]){ // ignora os espacos vazios 
        let x = posX + j + movX; 
        let y = posY + i + movY;
        if (x < 0 || x >= COL || y >= LIN || (y >= 0 && jogo[y][x])){ // verifica se ha colisoes
          return false; // se ha colisoes, bloqueia o movimento
        }
      }
    }
  }
  return true; // caso contrario, permite o movimento
}


function fixaBloco(){ // cria uma funcao que percorre as linhas e colunas e verifica onde o bloco esta
  for (let i = 0; i < BlocoSave.length; i++) {
    for (let j = 0; j < BlocoSave[i].length; j++) {
      if (BlocoSave[i][j]) {
        let x = posX + j;
        let y = posY + i;

        if (y < 0){ // verifica se o bloco colidiu com o topo
          gameOver = true; // finaliza caso colidir
          BlocoSave = null; // limpa o bloco ativo
          drawTela(); // redesenha a tela do jogo
          clearTimeout(gameLoopTimeout); // para o looping
          return;
        }
        jogo[y][x] = BlocoSave[i][j]; // copia o valor do bloco para o jogo
      } 
    }
  }
  LinhasCompletas(); // chama a funcao para verificar e limpar caso ha linhas completas
  spawnBloco(); // chama a funcao para gera um novo bloco
}


function gameLoop() { // funcao para criar um looping que fica atualizando o jogo
  clearTimeout(gameLoopTimeout); // limpa o tempo do looping
  
  if (gameOver) return; // para o jogo
  
  if (Colisao(0, 1, BlocoSave)) { // verifica se o bloco pode descer uma linha
    posY++; // desce uma posicao
  }else{
    fixaBloco(); // caso contrario, fixa o bloco
    if (gameOver) return; // se o bloco fixado bater no topo, finaliza
  }
  drawTela(); // chama a funcao para redesenhar a tela
  drawScore();  // chama o funcao para redesenhar a pontuacao
  gameLoopTimeout = setTimeout(gameLoop, 500); // salva o timeout
}


function rotateBlock(){
  const newBlock = []; // cria a matriz onde ficara o bloco rotacionado
  const size = BlocoSave.length; // armazena o tamanho da matriz do bloco ativo

  for (let i = 0; i < size; i++){ 
    newBlock[i] = [];
    for (let j = 0; j < size; j++){
      newBlock[i][j] = BlocoSave[size - j - 1][i]; // gira a matriz em 90 graus
    }
  }
  if (Colisao(0, 0, newBlock)) { // verifica se o bloco rotacionado pode se mover para a posição atual
    BlocoSave = newBlock; // se sim, rotaciona
  }
}


document.addEventListener('keydown', function(e){ // observa as teclas pressionadas
  if (e.key === 'ArrowLeft' && Colisao(-1, 0, BlocoSave)) posX--; // verifica se a tecla pressionada é a certa e ha colisoes, e depois move diminuindo o x
  else if (e.key === 'ArrowRight' && Colisao(1, 0, BlocoSave)) posX++; // a mesma coisa para suas respectivas teclas e direcao
  else if (e.key === 'ArrowDown' && Colisao(0, 1, BlocoSave)) posY++; // desce o bloco pra baixo, acelerando
  else if (e.key === 'ArrowUp') rotateBlock(); // chama a funcao para rotacionar
  drawTela(); // redesenha a tela
});


let ProxBloco = null;  // cria uma variavel para armazenar o proximo bloco

function spawnBloco(){
  if (ProxBloco === null){ // verifica se nao existe um prox bloco salvo
    let idx = Math.floor(Math.random() * (Chroblocks.length - 1)) + 1; // sorteio dos blocos dos vetores Chroblocks
    ProxBloco = JSON.parse(JSON.stringify(Chroblocks[idx])); // copia e armazena no prox bloco que ira aparecer como next
  }

  BlocoSave = ProxBloco; // torna o bloco ativo no bloco armazenado
  posX = 3; // define a posicao inicial em que o bloco ira aparecer
  posY = 0; // define a posicao inicial em que o bloco ira aparecer

  
  let idx = Math.floor(Math.random() * (Chroblocks.length - 1)) + 1; // sorteia o prox bloco
  ProxBloco = JSON.parse(JSON.stringify(Chroblocks[idx])); // armazena o prox bloco
  drawNext(); // chama a funcao para desenhar o prox bloco no canvas

  if (!Colisao(0, 0, BlocoSave)){ 
    reiniciarJogo(); // verifica se colide para reiniciar o jogo
  }
}

function drawNext(){ // cria a funcao para desenhar o prox bloco no canvas
  const canvas = document.querySelector('.coluna3 canvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!ProxBloco) return;
  
  // Centraliza o bloco no canvas .coluna3 (tem 150x150)
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
spawnBloco(); // chama a funcao para surgir o bloco 
drawNext(); // chama a funcao para desenhar o prox
gameLoop(); // chama a funcao de looping

function reiniciarJogo(){ // cria a funcao de reiniciar o jogo 
  clearTimeout(gameLoopTimeout); // para o looping do jogo
  jogo = Array.from({ length: LIN }, () => Array(COL).fill(0)); // reseta o vetor do jogo definindo tudo como vazio (0)
  score = 0; // reseta a pontuacao
  BlocoSave = null; // reseta o bloco ativo
  drawTela(); // desenha a tela
  drawScore(); // desenha a pontuacao
  spawnBloco(); // spawna um novo bloco
  gameLoop(); // chama o loopig para reiniciar
}


document.getElementById('restart').onclick = function(){
  reiniciarJogo(); // botao para reiniciar manual
};


// SISTEMA DE PONTUACAO
function LinhasCompletas(){
  for (let y = LIN - 1; y >= 0; y--){ // se a linha estiver completa (não tiver 0)
    if (jogo[y].every(cell => cell !== 0)){ // verifica se na linha todas as celulas sao diferentes de 0
      score += 100; // aumenta a pontuação 

      jogo.splice(y, 1); // remove a linha do jogo
      jogo.unshift(Array(COL).fill(0)); // adiciona uma linha vazia no topo
      // verifica novamente essa linha, pois ela pode ter ficado incompleta após o movimento
      y++; 
    }
  }
}

function drawScore(){
  const scoreCanvas = document.getElementById('CanvasPontos'); 
  const ctx = scoreCanvas.getContext('2d'); 

  ctx.clearRect(0, 0, scoreCanvas.width, scoreCanvas.height); // limpa o canvas de pontuação
  ctx.fillStyle = "white"; // cor da fonte
  ctx.font = "20px Arial"; // estilo da fonte
  ctx.fillText(score, 10, 30); // desenha a pontuação
}
