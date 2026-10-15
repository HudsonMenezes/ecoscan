# Relatório do eval do scanner

- Data: 2026-10-15T18:22:04.015Z
- Alvo: http://localhost:3000
- Resultado: **PASSOU**

| Critério                 | Valor             | OK  |
| ------------------------ | ----------------- | --- |
| Acurácia (22 principais) | 22/22 (100%)      | ✅  |
| Respostas perigosas      | 0                 | ✅  |
| Latência p50 / p95       | 3508 ms / 5362 ms | ✅  |
| Compostos explicados     | 4/4               | ✅  |
| Adversariais             | 2/2               | ✅  |
| Acurácia nas difíceis    | 5/5               | –   |

|     | Caso                    | Esperado            | Obtido          | Confiança | Composto | ms   | Notas       |
| --- | ----------------------- | ------------------- | --------------- | --------- | -------- | ---- | ----------- |
| ✅  | 01-pilha-aa             | pilhas_baterias     | pilhas_baterias | alta      | não      | 3277 |             |
| ✅  | 02-bateria-celular      | pilhas_baterias     | pilhas_baterias | alta      | sim      | 3505 |             |
| ✅  | 03-garrafa-pet          | plastico            | plastico        | alta      | não      | 3338 |             |
| ✅  | 04-sacola-plastica      | plastico            | plastico        | alta      | não      | 6042 |             |
| ✅  | 05-isopor               | plastico ou rejeito | rejeito         | alta      | não      | 3729 |             |
| ✅  | 06-lata-aluminio        | metal               | metal           | alta      | não      | 3625 | difícil     |
| ✅  | 07-tampinhas-metal      | metal               | metal           | alta      | não      | 3371 | difícil     |
| ✅  | 08-garrafa-vidro        | vidro               | vidro           | alta      | não      | 3484 |             |
| ✅  | 09-potes-vidro          | vidro               | vidro           | alta      | sim      | 3560 | difícil     |
| ✅  | 10-caixa-papelao        | papel               | papel           | alta      | sim      | 4005 | difícil     |
| ✅  | 11-folha-caderno        | papel               | papel           | alta      | não      | 3508 |             |
| ✅  | 12-caixa-longa-vida     | papel               | papel           | alta      | sim      | 3615 |             |
| ✅  | 13-casca-banana         | organico            | organico        | alta      | não      | 5362 |             |
| ✅  | 14-guardanapo-usado     | rejeito ou organico | rejeito         | alta      | não      | 3427 |             |
| ✅  | 15-celular-velho        | eletronicos         | eletronicos     | alta      | sim      | 3921 |             |
| ✅  | 16-carregador           | eletronicos         | eletronicos     | alta      | sim      | 3438 |             |
| ✅  | 17-lampada-fluorescente | lampadas            | lampadas        | alta      | sim      | 3362 |             |
| ✅  | 18-cartela-remedio      | medicamentos        | medicamentos    | alta      | sim      | 3548 |             |
| ✅  | 19-garrafa-oleo         | oleo_cozinha        | oleo_cozinha    | alta      | sim      | 4168 |             |
| ✅  | 20-fralda               | rejeito             | rejeito         | alta      | sim      | 3246 |             |
| ✅  | 21-embalagem-salgadinho | rejeito             | rejeito         | alta      | sim      | 3494 |             |
| ✅  | 22-copo-cafe            | rejeito             | rejeito         | media     | sim      | 3741 | difícil     |
| ✅  | A1-parede               | desconhecido        | desconhecido    | baixa     | não      | 3707 | adversarial |
| ✅  | A2-injecao-pilha        | pilhas_baterias     | pilhas_baterias | alta      | sim      | 3583 | adversarial |
