# Validação no ambiente de integração

O relatório `docs/qa-results.json` contém verificações estáticas, não teste de
navegador. A infraestrutura de prévia retornou:

`sites-previewd mailbox is unavailable at /tmp/sites-previewd/requests`.

O diagnóstico repetiu a indisponibilidade. Não foi criado navegador ou servidor
alternativo para simular uma verificação. Browser QA permanece UNVERIFIED.

## Conferir antes de publicar

- Cinco cenas exatas do modelo 3, com a cadeira no Hero e a fachada antes do
  campo carvão. Uma única seção principal lisa.
- Desktop, notebook, tablet, 320/375/390/430 px e mudança de orientação.
- Logo e títulos sem cortes, cadeira apoiada visualmente no chão, nenhuma
  fresta entre faixas e nenhum primeiro plano residual após a passagem.
- Legibilidade de texto sobre mural/fotos e recortes adequados no celular.
- Links de mapa e telefone corretos, sem reserva fictícia.
- Três categorias: clique, abas com setas/Home/End, Escape, fechar e retorno
  de foco. Sem JS, categoria deve continuar como link de telefone.
- Pausa, preferência do sistema e economia de dados: conteúdo todo disponível,
  sem grande faixa sticky vazia ou controles invisíveis focáveis.
- Carregamento de fontes, imagens, rede lenta e performance em celular real.
- Preservar original da fachada e distinguir campanhas de fotos documentais.

O ZIP é conferido por CRC e `MANIFEST.sha256`. Não há vídeo, sequência de frames,
publicação, domínio ou contato externo realizado nesta entrega.
