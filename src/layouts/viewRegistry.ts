import type { ComponentType } from 'react';
import type { Anchor } from './layoutTypes';

export interface ViewDefinition {
  id: string;
  title: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  component: ComponentType;
  defaultLocation?: Anchor;
  singleton?: boolean; // default: true
}

const viewRegistry = new Map<string, ViewDefinition>();

export function registerView(def: ViewDefinition): void {
  viewRegistry.set(def.id, def);
}

export function getView(id: string): ViewDefinition | undefined {
  return viewRegistry.get(id);
}

export function getAllViews(): ViewDefinition[] {
  return [...viewRegistry.values()];
}
