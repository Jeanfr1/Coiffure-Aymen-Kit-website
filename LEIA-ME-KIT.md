# Coiffure Aymen · Kit completo · Modelo 3

**Le Fauteuil Signature — Hero e cinco cenas aprovados em 29/10/2026.**

Este pacote contém o site editável em francês, identidade, fontes com licenças,
fotografia original da fachada, imagens de campanha, arquivos mestres, README,
roteiros e mapa de movimento. **Nenhum vídeo foi criado ou incluído.**

## Abrir o projeto

1. Descompacte o ZIP inteiro, mantendo suas pastas.
2. Abra `site/index.html` no navegador. O site não requer instalação, build,
   biblioteca externa, CDN, API ou servidor de aplicação. Também pode ser
   servido como pasta estática numa hospedagem.
3. Abra `docs/GUIA-VISUAL.html` para conferir a referência e os assets.
4. Para integração em outra base, leia os arquivos de `roteiros/` e mantenha
   a arquitetura descrita em `docs/architecture-lock.json`.

Telefone e mapa são links reais acionados pelo visitante. A página de Planity
consultada não oferecia reserva online; por isso não existe agenda simulada
ou botão de reserva. O endereço e modo de atendimento vêm das fontes registradas.

## Modelo escolhido, sem mistura

| Ordem | Cena | Conteúdo |
|---|---|---|
| 1 | Hero | Cadeira, mural de campanha, assinatura Aymen e “PRENEZ PLACE.” |
| 2 | Savoir-faire | Montagem preto/branco: “LA MAIN. Le détail.” |
| 3 | Nous trouver | Foto real da fachada: “AYMEN, À PONTCHÂTEAU.” |
| 4 | Services | Único fundo liso principal, carvão: “VOTRE ALLURE. NOTRE ATTENTION.” |
| 5 | Contact | Imagem de campanha: “LE STYLE VOUS ATTEND.”, telefone e itinerário |

Hero e corpo são ambos do modelo 3. Não entram o Hero de perfil do modelo 2
ou a seção de fundo âmbar do modelo 1. A referência gerada está incluída como
estudo de direção visual, não como captura do site implementado.

## Pastas e entregáveis

| Pasta | O que contém |
|---|---|
| `site/` | HTML, CSS, JS, fontes WOFF e assets prontos para o site |
| `brand/` | Logo PNG transparente e SVG, monograma, assinatura, avatar e paleta |
| `fonts/` | Fontes TTF, originais e licenças correspondentes |
| `images/originals/` | Fotografia da fachada enviada, preservada byte a byte |
| `images/master/` | Mestres de campanha em PNG, incluindo cadeira com alfa |
| `references/` | Modelo 3 aprovado e três referências fornecidas, com papéis definidos |
| `motion/` | Timeline editável do movimento, sem vídeo ou sequência de frames |
| `roteiros/` | Implementação, animação, identidade, conteúdo e validação |
| `docs/` | Guia visual, textos franceses, fontes, origem, inventário e QA |
| `tools/` | Scripts opcionais de reprodução e conferência |

## Identidade

- Paleta: carvão `#101110`, âmbar `#D5AC62`, marfim `#EFE7D8`, tabaco `#694934`.
- Logo aprovada: `brand/Logo-AYMEN-Ambre-Transparente.png`, **1774 × 887 px,
  RGBA, 85,606% dos pixels completamente transparentes**. Cópia preservada.
- SVGs nativos da marca e assinatura: contornos reais, sem bitmap incorporado.
  O monograma deriva do A da própria marca. A versão de cabeçalho muda apenas
  o viewBox para reduzir a área transparente, sem recortar o desenho.
- Títulos: **Barlow Condensed** 700/800. UI: **Sora** 400/500/600.
- Acento “Le détail.”: **Yellowtail** 400. A assinatura Aymen é lettering de
  campanha exportado em SVG; não é uma fonte de alfabeto completo.
- Licenças incluídas: OFL de Barlow Condensed e Sora; Apache 2.0 de Yellowtail.

## Fotografia e campanha

**Somente a fachada é fotografia documental da empresa recebida nesta etapa.**
O arquivo original permanece intacto. O site usa um WebP de distribuição e um
recorte SVG para omitir a interface da captura, sem redesenhar a placa.

Mural, cadeira, montagem de gestos e cena final são assets ilustrativos de
campanha criados a partir do modelo aprovado. Não são documentação do interior,
da equipe, de clientes ou de resultados reais da Aymen. Não atribuir os rostos
gerados ao proprietário e não apresentar o cenário como reforma instalada.

## Movimento e funcionalidade

O Hero separa fundo, assinatura, cadeira e revelação por cinco faixas SVG.
O movimento é de planos 2,5D, não rotação física real de cadeira em 3D.
Há pausa manual e respeito a movimento reduzido/economia de dados, retirando
o trecho sticky adicional. Nada depende de vídeo, áudio ou autoplay.

As categorias abrem detalhes acessíveis e oferecem telefone e itinerário.
Sem JS, continuam como links de telefone e todo o conteúdo principal permanece
disponível. Não há formulário, analytics, checkout ou envio de mensagens.
Somente a preferência local de pausa é persistida no navegador.

## Verificação e limites

`docs/qa-results.json` registra as verificações estáticas. A sintaxe, caminhos,
estrutura, fontes, transparência, cópias, hashes e integridade do ZIP são conferidos.

**Browser QA: UNVERIFIED.** A infraestrutura de prévia retornou indisponibilidade.
Não foram executados testes de layout final, cliques, teclado ou performance
em navegador nesta entrega. As medições de fonte são apoio estático e não
substituem essa revisão. Veja `roteiros/05-validacao.md`.

O projeto não foi publicado. Não houve domínio, reserva, ligação ou mensagem
enviada. Dados administrativos, horários, preços atuais, avaliações, redes
sociais e credenciais não fornecidos não foram inventados.

## Ferramentas opcionais

O site não precisa de Python. Para conferir o pacote localmente:

```bash
python tools/conferir-kit.py
```

O verificador é somente leitura por padrão. `--atualizar-relatorio` regrava o
relatório de QA. Os scripts opcionais usam dependências de `tools/requirements.txt`.
As fontes originais já estão incluídas; o exportador só faz download oficial
caso algum original esteja ausente.

`MANIFEST.sha256` registra os arquivos distribuídos. Não substitua o CSS por
um tema genérico nem renomeie apenas parte dos assets.
