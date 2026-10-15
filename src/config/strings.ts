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
  cameraTest: {
    result: 'Foto pronta',
    again: 'Tirar outra',
  },
  placeholder: 'Em construção.',
} as const;
