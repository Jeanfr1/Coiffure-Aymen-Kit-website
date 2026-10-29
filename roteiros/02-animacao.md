# Roteiro de movimento · Le Fauteuil Signature

**Sem vídeo.** A composição usa elementos HTML, CSS e SVG do próprio site.
Os números efetivos estão em `motion/timeline.json`.

## Abertura

Foto, navegação e ações estão no HTML desde o início. A abertura só ocorre
com fontes prontas, cadeira decodificada, movimento permitido e scroll menor
que 24 px. Não usar loader ou introdução que bloqueie o telefone/itinerário.

- 100–1150 ms: revelar a assinatura por máscara horizontal, sugerindo o traço
  de pincel. Não é digitação e não é uma nova fonte completa.
- 50–1150 ms: cadeira passa de 1,025 a 1 em escala, de 16 a 0 px no eixo Y,
  e de 0,45 a 1 em opacidade. Refletir o peso do objeto, sem elasticidade de brinquedo.
- 180–980 ms: título entra com 18 px de curso e opacidade suave.
- 1350 ms: limpar classe de entrada. Scroll já iniciado interrompe a intro.

## Scroll do Hero

Trecho total desktop 152 svh e mobile 144 svh, palco de uma viewport com alturas
mínimas necessárias à composição. Progresso normalizado de 0 a 1.

- Texto/navegação saem entre 18% e 57%, com 25 px máximos para cima.
- Cadeira desloca à esquerda até o menor valor entre 4,5vw e 74 px, sobe 12 px,
  escala até 1,025 e sai completamente entre 30% e 92%.
- Assinatura desloca até 3,5vw para a direita e perde opacidade entre 18% e 72%.
- Cinco faixas SVG revelam a montagem preto/branco. Cada uma começa com atraso
  de 5,5 pontos percentuais; os intervalos vão de 34–78% na primeira a 56–100%
  na última. A largura 0,202 evita frestas entre as faixas de passo 0,2.
- O fim encontra a fotografia da segunda cena, sem cadeira ou lettering residual.

O gesto lembra a passagem de um pente; não virar efeito de persiana agressivo,
cintilação ou barra de loading. O movimento deve ser contínuo e reversível.

É composição 2,5D. Não há rotação real do fauteuil, arquivo GLB ou outra
perspectiva física. Não simular giro amplo de uma única imagem. Ponteiro fino
pode mover o plano no máximo 4 px para cada lado; em toque isso fica desativado.

## Conexões das cenas

Montagem diagonal → fachada por um recorte curto e firme; a fachada estabiliza
para localização. Da rua, a composição entra no campo carvão e no monograma
em contorno. A cena final de tecido/gesto conclui em telefone e mapa.

Textos abaixo do Hero entram uma vez, com até 15 px e 700 ms. Parallax de
fotografia usa razão limitada a ±0,8, multiplicador 18 px desktop/10 px mobile.
Não aumentar para movimento de fundo contínuo ou fazer o botão fugir do cursor.

## Preferências e desempenho

requestAnimationFrame é solicitado por scroll, resize e ponteiro; não há loop
permanente. A página oculta suspende atualizações. Fontes são locais, fotos em
WebP e a cadeira é priorizada na primeira pintura.

Pausa, movimento reduzido e economia de dados retiram abertura, trecho sticky
extra, faixas e parallax. O conteúdo completo continua visível. Só a preferência
de pausa é salva localmente. Elementos do Hero que ficam invisíveis tornam-se
inertes para não receber foco.

## Conferência necessária no ambiente final

Testar scroll reverso, resize, orientação, teclado, foco, botões, contraste,
mudança de preferência com a página aberta e desempenho em celular real.
Não interpretar análise de código como teste de fluidez. A prévia gerenciada
estava indisponível; a revisão em navegador permanece não verificada nesta entrega.
