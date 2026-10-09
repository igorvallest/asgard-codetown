// Ponto de entrada do cliente: store (dados) -> mundo (canvas) -> UI (painéis).
import { OfficeStore } from './net/store';
import { applyThemeUi, resolveTheme, setActiveTheme } from './theme';
import { createWorld } from './world';
import { createUI } from './ui';
import { loadPrefs, migrateLegacyKeys, safeLocalStorage } from './ui/prefs';

// Antes de tudo: o mundo (carteiras) e a UI (preferências) leem o localStorage ao serem criados.
migrateLegacyKeys(safeLocalStorage());

// O tema vem antes do mundo e da UI: os dois desenham com a arte dele.
const theme = resolveTheme(loadPrefs(safeLocalStorage()).theme, location.search);
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
