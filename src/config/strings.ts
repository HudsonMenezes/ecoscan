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
    title: 'O que vamos descartar hoje?',
    greeting: (hour: number) => (hour < 12 ? 'Bom dia!' : hour < 18 ? 'Boa tarde!' : 'Boa noite!'),
    speech:
      'Bem-vindo ao EcoScan. Toque em Escanear objeto para descobrir onde descartar, em Descartar no ponto para ganhar pontos, ou em Minha carteira para ver seu nível.',
    actionsLabel: 'O que você quer fazer?',
    actions: {
      scan: 'Escanear objeto',
      scanHint: 'A IA diz onde descartar',
      discard: 'Descartar no ponto',
      discardHint: 'Leia o QR e ganhe',
      wallet: 'Minha carteira',
      walletHint: 'Nível e histórico',
    },
    player: {
      label: 'Seu nível',
      level: (number: number) => `Nível ${number}`,
      coins: 'moedas',
      progress: (xp: number, toNext: number, next: string) =>
        `${xp} XP · faltam ${toNext} XP para o nível ${next}`,
      maxLevel: (xp: number) => `${xp} XP · você chegou ao nível mais alto!`,
    },
    tipTitle: 'Dica rápida',
    tips: [
      'Enxágue as embalagens antes de descartar. Restos de comida atrapalham a reciclagem.',
      'Pilhas e baterias nunca vão no lixo comum: os metais delas contaminam o solo e a água.',
      'Óleo de cozinha usado não vai na pia. Guarde numa garrafa PET e leve a um ponto de coleta.',
      'Remédios vencidos vão para a farmácia, não para o lixo nem para o vaso sanitário.',
      'Desmonte as caixas de papelão: elas ocupam menos espaço na coleta.',
      'Guardanapo e papel engordurado não são recicláveis: vão no lixo comum.',
    ],
  },
  nav: {
    label: 'Navegação principal',
    home: 'Início',
    scan: 'Escanear',
    discard: 'Descartar',
    wallet: 'Carteira',
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
      newLevel: 'Nível novo',
      xpLabel: 'XP',
      coinsLabel: 'moedas',
      close: 'Fechar e voltar ao início',
    },
  },
  wallet: {
    title: 'Minha carteira',
    speech: 'Aqui você vê seu nível, seus pontos e suas moedas.',
    level: (number: number) => `Nível ${number}`,
    coinsLabel: 'Moedas',
    toNext: (xp: number, level: string) => `Faltam ${xp} XP para o nível ${level}`,
    maxLevel: 'Você chegou ao nível mais alto!',
    progressLabel: 'Progresso até o próximo nível',
    historyTitle: 'Seus descartes',
    historyCount: (count: number) => `${count} ${count === 1 ? 'item' : 'itens'}`,
    levelOf: (number: number, total: number) => `Nível ${number} de ${total}`,
    trailTitle: 'Sua trilha',
    xpTotal: 'XP total',
    empty: 'Você ainda não descartou nada. Escaneie um item para começar!',
    scan: 'Escanear item',
    gain: (xp: number, coins: number) =>
      `+${xp} XP · +${coins} ${coins === 1 ? 'moeda' : 'moedas'}`,
    summarySpeech: (level: string, xp: number, coins: number) =>
      `Você está no nível ${level}, com ${xp} pontos de experiência e ${coins} ${coins === 1 ? 'moeda' : 'moedas'}.`,
    toNextSpeech: (xp: number) => `Faltam ${xp} pontos para o próximo nível.`,
    maxLevelSpeech: 'Você chegou ao nível mais alto. Parabéns!',
  },
  camera: {
    open: 'Abrir câmera',
    opening: 'Abrindo a câmera…',
    capture: 'Tirar foto',
    frameHint: 'Deixe só o objeto dentro da moldura',
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
    discard: 'Descartar no ponto',
    scanAgain: 'Escanear outro',
    back: 'Voltar para o início',
    resultTitle: 'Resultado',
    confidence: { alta: 'Alta confiança', media: 'Confiança média', baixa: 'Confiança baixa' },
    composite: 'Item composto',
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
} as const;
