# Implementação · Modelo 3 completo

Base visual: `references/Modelo-3-Aprovado.png`. O cliente escolheu o modelo 3,
incluindo Hero e corpo. Não há pedido de mistura com as outras propostas.

## Mapa das cinco cenas

1. `#accueil`: cadeira de couro/cromo como primeiro plano, mural de campanha,
   assinatura Aymen atrás do objeto e chamada “PRENEZ PLACE.”
2. `#savoir-faire`: montagem preto/branco de três planos diagonais, tipografia
   “LA MAIN.” e acento “Le détail.”
3. `#nous-trouver`: fachada documental, endereço e mapa. Preservar a placa real.
4. `#prestations`: único fundo liso principal, carvão, monograma em contorno
   e “VOTRE ALLURE. NOTRE ATTENTION.”
5. `#contact`: macro de campanha, telefone e mapa; rodapé na mesma fotografia.

Não criar uma grade de cards, depoimentos, equipe fictícia, tabela de preços
ou outra seção de cor. A página pública é toda em francês.

## Arquivos de aplicação

- `site/index.html`: estrutura, textos principais, links, dialog e metadados.
- `site/styles.css`: identidade, composição, fonte local e versões responsivas.
- `site/content.js`: três categorias de serviço e dados de contato.
- `site/app.js`: movimento em camadas, preferência, detalhes e navegação mobile.
- `site/assets/`: imagens WebP, logo e assinatura SVG usados pela página.
- `motion/timeline.json`: parâmetros e intenções de movimento.

O site é estático e usa scripts clássicos deferidos, sem fetch de conteúdo.
Pode abrir pelo arquivo local ou ser servido como pasta estática. Links de
mapa e telefone dependem da ação do visitante e do serviço/dispositivo externo.

## Ordem de camadas no Hero

Fundo mural/floor → assinatura → sombra de chão → cadeira transparente →
revelação da montagem por faixas → texto e navegação acessíveis.

Não achatar esses elementos num JPEG único com títulos. A cadeira com alfa
permite que o lettering passe por trás. O texto permanece HTML e pode se
adaptar a telas e tecnologias assistivas. Não distorcer o desenho do fauteuil.

O mural e as fotografias de campanha não são o interior ou funcionários reais.
O local real é representado pela fotografia da fachada da terceira cena.

## Integração em outra base

Copiar estrutura, assets e fontes mantendo referências consistentes. Adaptar
o mecanismo de movimento ao ambiente da base, sem carregar dois motores que
controlem a mesma transformação. Não reaproveitar efeitos de outros clientes.
Conservar as cinco cenas, as cores, as famílias e os pontos de ação da proposta.

O cabeçalho usa o mesmo path da logo com viewBox ajustado para espaços de
navegação. O PNG de marca completo continua intacto em `brand/`.

O arquivo `.openai/hosting.json` contém apenas configuração estática local,
sem ID de publicação, credenciais ou deploy. Nenhuma hospedagem foi criada.
