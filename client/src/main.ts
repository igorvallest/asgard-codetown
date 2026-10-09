// Ponto de entrada do cliente: tema (do servidor) -> store (dados) -> mundo (canvas) -> UI (painéis).
import { OfficeStore } from './net/store';
import { applyThemeUi, resolveTheme, setActiveTheme } from './theme';
import { createWorld } from './world';
import { createUI } from './ui';
import { migrateLegacyKeys, safeLocalStorage } from './ui/prefs';

/** Tema escolhido no servidor (HABBLAUD_TEMA); sem resposta, vale o padrão. */
async function serverTheme(): Promise<string | undefined> {
  try {
    const res = await fetch('/api/health', { cache: 'no-cache' });
    const body = res.ok ? ((await res.json()) as { theme?: unknown }) : null;
    return typeof body?.theme === 'string' ? body.theme : undefined;
  } catch {
    return undefined;
  }
}

async function start(): Promise<void> {
  // Antes de tudo: o mundo (carteiras) e a UI (preferências) leem o localStorage ao serem criados.
  migrateLegacyKeys(safeLocalStorage());

  // O tema vem antes do mundo e da UI: os dois desenham com a arte dele. ?tema= na URL serve para testar o visual.
  const theme = resolveTheme(await serverTheme(), location.search);
  setActiveTheme(theme);
  const uiRoot = document.getElementById('ui') as HTMLElement;
  applyThemeUi(theme, uiRoot);

  const params = new URLSearchParams(location.search);
  const store = new OfficeStore({ mock: params.has('mock') });
  const world = createWorld(document.getElementById('world') as HTMLCanvasElement, store);
  createUI(uiRoot, store, world);
  store.connect();

  // Facilita a depuração pelo console do navegador.
  Object.assign(window, { habblaud: { store, world } });
}

void start();
