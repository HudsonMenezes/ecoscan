import { describe, expect, it } from 'vitest';
import type { ScreenAction } from '@/shared/lib/screen';
import { ACTION_SYNONYMS, GLOBAL_COMMANDS } from './commands';
import { normalize, parseCommand } from './parseCommand';

const noop = () => {};
const action = (id: ScreenAction['id'], label: string): ScreenAction => ({ id, label, run: noop });

// Sinônimos da tabela da SPEC-voice, com acento, como a pessoa fala.
const SPEC_TABLE: [string, string[]][] = [
  ['nav:home', ['início', 'menu', 'voltar', 'começo']],
  ['nav:scan', ['escanear', 'tirar foto', 'foto', 'câmera', 'o que é isso']],
  ['nav:discard', ['descartar', 'jogar fora', 'qr', 'ponto de coleta']],
  ['nav:wallet', ['carteira', 'moedas', 'pontos', 'saldo', 'meu nível']],
  ['repeat', ['repetir', 'de novo', 'ouvir', 'fala de novo']],
  ['help', ['ajuda', 'o que eu posso falar']],
];

function intentKey(transcript: string, actions: ScreenAction[] = []): string {
  const intent = parseCommand(transcript, actions);
  switch (intent.type) {
    case 'nav':
      return `nav:${intent.target}`;
    case 'action':
      return `action:${intent.action.id}`;
    default:
      return intent.type;
  }
}

const stripAccents = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '');

describe('normalize', () => {
  it.each([
    ['Câmera!', 'camera'],
    ['  O QUE É ISSO?  ', 'o que e isso'],
    ['jogar-fora, agora.', 'jogar fora agora'],
    ['Meu   nível', 'meu nivel'],
    ['QR', 'qr'],
    ['', ''],
  ])('%j → %j', (input, expected) => {
    expect(normalize(input)).toBe(expected);
  });
});

describe('parseCommand: comandos globais', () => {
  const cases = SPEC_TABLE.flatMap(([key, phrases]) =>
    phrases.flatMap((phrase) => [
      [phrase, key],
      [stripAccents(phrase), key],
      [phrase.toUpperCase(), key],
    ]),
  );

  it.each(cases)('%j → %s', (phrase, key) => {
    expect(intentKey(phrase)).toBe(key);
  });

  it('a tabela de comandos cobre todos os sinônimos da spec', () => {
    for (const [key, phrases] of SPEC_TABLE) {
      const command = GLOBAL_COMMANDS.find((c) => c.key === key);
      expect(command, key).toBeDefined();
      for (const phrase of phrases) {
        expect(command!.phrases.map(normalize)).toContain(normalize(phrase));
      }
    }
  });

  it.each([
    ['quero escanear', 'nav:scan'],
    ['me mostra a carteira por favor', 'nav:wallet'],
    ['Repetir.', 'repeat'],
    ['ajuda!', 'help'],
  ])('reconhece o comando dentro de uma frase maior: %j', (phrase, key) => {
    expect(intentKey(phrase)).toBe(key);
  });

  it('a frase mais longa vence: "fala de novo" é repetir e "o que eu posso falar" é ajuda', () => {
    expect(intentKey('fala de novo')).toBe('repeat');
    expect(intentKey('o que eu posso falar')).toBe('help');
  });

  it('não casa pedaço de palavra ("pontos" não vira "ponto de coleta"; "fotografia" não é "foto")', () => {
    expect(intentKey('pontos')).toBe('nav:wallet');
    expect(intentKey('fotografia')).toBe('unknown');
  });
});

describe('parseCommand: ações da tela', () => {
  it('reconhece a ação pelo rótulo, com ou sem acento', () => {
    const actions = [action('scan-again', 'Escanear próximo')];
    expect(intentKey('escanear próximo', actions)).toBe('action:scan-again');
    expect(intentKey('ESCANEAR PROXIMO', actions)).toBe('action:scan-again');
  });

  it('devolve a própria ação registrada, para o VoiceDock chamar run()', () => {
    const capture = action('capture', 'Capturar');
    const intent = parseCommand('capturar', [capture]);
    expect(intent).toEqual({ type: 'action', action: capture });
  });

  it.each([
    ['capturar', 'capture'],
    ['tirar agora', 'capture'],
    ['tirar foto', 'capture'],
    ['foto', 'capture'],
  ])('na tela do scanner, %j dispara a captura (e não a navegação)', (phrase, id) => {
    expect(intentKey(phrase, [action('capture', 'Capturar')])).toBe(`action:${id}`);
  });

  it('"tentar de novo" é a ação retry, não "repetir"', () => {
    const actions = [action('retry', 'Tentar de novo'), action('scan-again', 'Tirar outra foto')];
    expect(intentKey('tentar de novo', actions)).toBe('action:retry');
    expect(intentKey('de novo', actions)).toBe('repeat');
    expect(intentKey('tirar outra foto', actions)).toBe('action:scan-again');
  });

  it('quando a tela oferece a ação equivalente, ela vence a navegação', () => {
    const result = [
      action('discard', 'Descartar no ponto'),
      action('scan-again', 'Escanear outro'),
    ];
    expect(intentKey('descartar', result)).toBe('action:discard');
    expect(intentKey('jogar fora', result)).toBe('action:discard');
    expect(intentKey('escanear', result)).toBe('action:scan-again');
    expect(intentKey('carteira', result)).toBe('nav:wallet');

    const celebration = [
      action('scan-again', 'Escanear outro'),
      action('wallet', 'Minha carteira'),
    ];
    expect(intentKey('moedas', celebration)).toBe('action:wallet');
  });

  it('cada id de ação tem sinônimos definidos', () => {
    const ids: ScreenAction['id'][] = ['capture', 'retry', 'discard', 'scan-again', 'wallet'];
    for (const id of ids) expect(ACTION_SYNONYMS[id].length, id).toBeGreaterThan(0);
  });
});

describe('parseCommand: desconhecido', () => {
  it.each(['', '   ', 'banana', 'qual é a previsão do tempo', '!!!'])('%j → unknown', (phrase) => {
    expect(intentKey(phrase, [action('capture', 'Capturar')])).toBe('unknown');
  });
});
