// Textos da interface em pt-BR. O módulo voice lê as mesmas frases, então
// tudo que aparece na tela ou é falado precisa morar aqui.
export const strings = {
  appName: 'EcoScan',
  layout: {
    home: 'Voltar para o início',
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
  placeholder: 'Em construção.',
} as const;
