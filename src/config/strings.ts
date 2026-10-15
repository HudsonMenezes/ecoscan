// Textos da interface em pt-BR. O módulo voice lê as mesmas frases, então
// tudo que aparece na tela ou é falado precisa morar aqui.
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
    why: 'Por que aqui?',
    consequence: 'Se descartar errado',
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
