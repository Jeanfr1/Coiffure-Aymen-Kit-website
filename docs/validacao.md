# Estado da verificação

`qa-results.json` registra cada verificação estática executada. O escopo inclui
modelo 3, ordem das cinco cenas, único fundo liso, francês, referências locais,
contato, SVG, PNG com alfa, fontes/licenças, originais, dados e sintaxe JS.

Resultado desta entrega: **77 verificações estáticas aprovadas**, com 20
arquivos raster legíveis. Esse total não representa testes em navegador.

Mural, cadeira, montagem, contato, assinatura e aplicações da marca foram
inspecionados visualmente como assets. Medições de texto por arquivo de fonte
servem de apoio estático; não são prova de layout no navegador.

**Browser QA: UNVERIFIED.** A tentativa de prévia e o diagnóstico retornaram:

`sites-previewd mailbox is unavailable at /tmp/sites-previewd/requests`.

Não houve screenshot do site, teste de cliques, teclado ou performance em
navegador. A infraestrutura não foi substituída por servidor/navegador alternativo.
O roteiro `05-validacao.md` lista as verificações necessárias no ambiente real.

Nenhum vídeo, publicação, domínio, ligação, mensagem ou agendamento foi feito.
O ZIP é conferido por CRC e `MANIFEST.sha256` registra o conteúdo distribuído.
