// Formato de tema: a cara do escritório num só lugar, trocável sem mexer no mundo nem na UI.
import type { ArtModule } from '../art/api';

/** Cores dos painéis que um tema pode trocar: as variáveis --ui-* de .ui-root em ui/styles.css. */
export type UiVar =
  | '--ui-bg'
  | '--ui-bg-solid'
  | '--ui-bg-soft'
  | '--ui-bg-hover'
  | '--ui-line'
  | '--ui-line-strong'
  | '--ui-text'
  | '--ui-muted'
  | '--ui-faint'
  | '--ui-accent'
  | '--ui-accent-soft';

export interface Theme {
  /** Identificador estável: é o que fica salvo na preferência e o que vai em ?tema= na URL. */
  id: string;
  /** Nome no seletor das Configurações. */
  name: string;
  /** Toda a arte do mundo e dos avatares: pisos, paredes, móveis, personagens, ícones, telas e paletas das salas. */
  art: ArtModule;
  /** Cores dos painéis; o que faltar fica como em ui/styles.css. */
  ui?: Partial<Record<UiVar, string>>;
}
