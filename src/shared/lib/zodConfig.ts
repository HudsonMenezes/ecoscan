// Importado primeiro no main.tsx, antes de qualquer módulo que valide dados ao carregar.
// Sem isso, o Zod testa `new Function` e a CSP (sem 'unsafe-eval') registra uma violação.
import { z } from 'zod';

z.config({ jitless: true });
