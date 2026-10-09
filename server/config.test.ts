import { describe, expect, it } from 'vitest';
import { loadConfig } from './config';
import { tempDir } from './test/fixtures';

describe('loadConfig: tema', () => {
  it('padrão Escritório; HABBLAUD_TEMA ou --tema escolhem; id desconhecido é ignorado', () => {
    const tmp = tempDir();
    try {
      const cfg = (env: NodeJS.ProcessEnv, argv: string[] = []) => loadConfig({ HOME: tmp.dir, HABBLAUD_IN_DOCKER: '0', ...env }, argv);
      expect(cfg({}).theme).toBe('escritorio');
      expect(cfg({ HABBLAUD_TEMA: 'Asgard' }).theme).toBe('asgard');
      expect(cfg({}, ['node', 'index.ts', '--dev', '--tema', 'asgard']).theme).toBe('asgard');
      expect(cfg({ HABBLAUD_TEMA: 'escritorio' }, ['--tema=asgard']).theme).toBe('asgard');
      expect(cfg({ HABBLAUD_TEMA: 'valhalla' }).theme).toBe('escritorio');
    } finally {
      tmp.cleanup();
    }
  });
});
