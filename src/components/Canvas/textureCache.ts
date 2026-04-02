import * as PIXI from 'pixi.js';

interface CacheEntry {
  data: string;
  texture: PIXI.Texture;
}

/**
 * Caches PIXI textures keyed by a string identifier.
 * Only re-decodes the data URL when the layer data actually changes.
 */
export class TextureCache {
  private cache = new Map<string, CacheEntry>();

  /**
   * Get or create a texture for the given key + data URL.
   * Returns the cached texture if data hasn't changed, otherwise
   * decodes the new data URL async and updates the sprite when ready.
   */
  getOrLoad(
    key: string,
    data: string,
    sprite: PIXI.Sprite,
    onDestroyed: () => boolean,
  ): PIXI.Texture | null {
    const entry = this.cache.get(key);
    if (entry && entry.data === data) {
      return entry.texture;
    }

    // Data changed or new entry — decode async
    const img = new Image();
    img.src = data;
    img.onload = () => {
      if (onDestroyed()) return;
      const texture = PIXI.Texture.from(img);
      texture.source.scaleMode = 'nearest';
      this.cache.set(key, { data, texture });
      sprite.texture = texture;
    };

    // Return stale texture while loading if available
    return entry?.texture ?? null;
  }

  /**
   * Remove entries whose keys are not in the provided set.
   */
  prune(activeKeys: Set<string>) {
    for (const key of this.cache.keys()) {
      if (!activeKeys.has(key)) {
        const entry = this.cache.get(key)!;
        entry.texture.destroy(true);
        this.cache.delete(key);
      }
    }
  }

  dispose() {
    for (const entry of this.cache.values()) {
      entry.texture.destroy(true);
    }
    this.cache.clear();
  }
}
