// Textos da interface em pt-BR. O módulo voice lê as mesmas frases, então
// tudo que aparece na tela ou é falado precisa morar aqui.

// Nome do item no meio da frase: "Garrafa PET" → "garrafa PET"; siglas ("PET") ficam como estão.
const midSentence = (item: string) =>
  /^\p{Lu}\p{Ll}/u.test(item) ? item[0]!.toLowerCase() + item.slice(1) : item;

export const strings = {
  appName: 'EcoScan',
  layout: {
    // Complemento do nome acessível do link do topo, que começa pelo texto
    // visível ("EcoScan") para quem usa controle por voz (WCAG 2.5.3).
    homeHint: ', voltar para o início',
  },
  home: {
    title: 'EcoScan',
    subtitle: 'O que você quer fazer?',
    speech:
      'Bem-vindo ao EcoScan. Toque no botão verde para escanear um objeto, no azul para descartar no ponto de coleta, ou no amarelo para ver sua carteira.',
    actions: {
      scan: 'Escanear',
      discard: 'Descartar (QR)',
      wallet: 'Minha carteira',
    },
  },
  scan: {
    title: 'Escanear',
    speech: 'Aponte a câmera para o objeto e toque no botão de captura.',
  },
  discard: {
    title: 'Descartar',
    speech: 'Aponte a câmera para o QR do ponto de coleta.',
  },
  disposal: {
    readerHint:
      'Você também pode ler o QR com a câmera do celular: ele abre o EcoScan e conta o seu descarte.',
    scanItem: 'Escanear item',
    scanNext: 'Escanear próximo',
    scanAnother: 'Escanear outro',
    readAnotherQr: 'Ler outro QR',
    openReader: 'Ler QR do ponto',
    readerAim: 'Aponte para o QR do ponto de coleta',
    readerVideo: 'Imagem da câmera para ler o QR',
    cameraFailed:
      'Não consegui usar a câmera aqui. Abra a câmera do celular e aponte para o QR do ponto de coleta.',
    wallet: 'Minha carteira',
    errors: {
      unknown_point: 'Esse QR não é um ponto do EcoScan.',
      no_scan: 'Primeiro escaneie o item que você vai descartar.',
      scan_expired: 'Escaneie o item de novo antes de descartar.',
      already_claimed: 'Esse item já foi contado! Escaneie o próximo item para descartar de novo.',
      category_not_accepted: (category: string) => `Esse ponto não recebe ${category}.`,
    },
    success: {
      title: 'Parabéns!',
      gained: (xp: number, coins: number) => `+${xp} XP e +${coins} moedas`,
      item: (item: string) => `Você descartou ${midSentence(item)} corretamente.`,
      speech: (item: string, xp: number, coins: number) =>
        `Parabéns! Você descartou ${midSentence(item)} corretamente e ganhou ${xp} pontos e ${coins} moedas.`,
      levelUp: (level: string) => `Você subiu para o nível ${level}!`,
      summary: (level: string, xp: number, coins: number) =>
        `${level} · ${xp} XP · ${coins} moedas`,
    },
  },
  wallet: {
    title: 'Minha carteira',
    speech: 'Aqui você vê seu nível, seus pontos e suas moedas.',
  },
  camera: {
    open: 'Abrir câmera',
    opening: 'Abrindo a câmera…',
    capture: 'Tirar foto',
    upload: 'Enviar foto',
    denied: 'Sem permissão para usar a câmera. Você pode enviar uma foto.',
    unavailable: 'Não encontramos uma câmera. Você pode enviar uma foto.',
    invalidImage: 'Não consegui abrir essa imagem. Tente outra foto.',
    processing: 'Preparando a foto…',
    dropHint: 'Arraste uma foto para cá ou clique para escolher',
    dropActive: 'Solte a foto aqui',
  },
  desktopHint: {
    title: 'Melhor no celular',
    text: 'Aponte a câmera do celular para o QR e abra o EcoScan por lá.',
    qrAlt: 'QR code que abre o EcoScan no celular',
    dismiss: 'Fechar aviso',
  },
  scanErrors: {
    network: 'Sem internet. Confira a conexão e tente de novo.',
    rateLimited: 'Muitas fotos seguidas. Espere um pouco e tente de novo.',
    tooLarge: 'A foto ficou grande demais. Tente tirar outra.',
    invalidImage: 'Não consegui ler essa foto. Tente tirar outra.',
    timeout: 'Demorou demais para analisar. Tente de novo.',
    unavailable: 'Não consegui analisar a foto agora. Tente de novo.',
  },
  scanner: {
    loading: 'Analisando a foto…',
    loadingSpeech: 'Estou analisando a foto. Espere um pouquinho.',
    bin: (color: string) => `Lixeira ${color}`,
    howTo: 'Como descartar',
    consequence: 'O que acontece se descartar errado?',
    benefit: 'Descartando certo, você ajuda',
    localTitle: (city: string) => `Em ${city}`,
    sources: 'Fonte:',
    verifiedAt: (date: string) => `conferida em ${date}`,
    discard: 'Descartar',
    scanAgain: 'Escanear outro',
    tryAgain: 'Tentar de novo',
    newPhoto: 'Tirar outra foto',
    capture: 'Capturar',
    retryTitle: 'Não consegui identificar o objeto',
    retryTips: [
      'Procure um lugar com mais luz.',
      'Deixe só o objeto na foto, sem outras coisas em volta.',
      'Chegue mais perto, com o objeto inteiro aparecendo.',
    ],
    retrySpeech:
      'Não consegui identificar o objeto. Tente de novo num lugar com mais luz, com só o objeto na foto.',
  },
  placeholder: 'Em construção.',
} as const;
