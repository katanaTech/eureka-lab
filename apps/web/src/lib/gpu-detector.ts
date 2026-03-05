/** Quality preset for Three.js rendering based on GPU capability */
export type GpuQuality = 'high' | 'medium' | 'low';

let cachedQuality: GpuQuality | null = null;

/**
 * Detects GPU tier using the detect-gpu library and returns a quality preset.
 * Result is cached after the first call to avoid repeated GPU benchmark calls.
 *
 * @returns Promise resolving to 'high', 'medium', or 'low'
 */
export async function detectGpuQuality(): Promise<GpuQuality> {
  if (cachedQuality) return cachedQuality;

  try {
    const { getGPUTier } = await import('detect-gpu');
    const result = await getGPUTier();

    if (result.tier >= 2) {
      cachedQuality = 'high';
    } else if (result.tier === 1) {
      cachedQuality = 'medium';
    } else {
      cachedQuality = 'low';
    }
  } catch {
    // Fallback to medium if detection fails (e.g., SSR or unsupported browser)
    cachedQuality = 'medium';
  }

  return cachedQuality;
}

/**
 * Returns render settings for a given quality tier.
 *
 * @param quality - The GPU quality preset
 * @returns Object with Three.js renderer configuration
 */
export function getQualitySettings(quality: GpuQuality) {
  return {
    high: {
      shadows: true,
      shadowMapSize: 2048,
      antialias: true,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
      bloom: true,
      outline: true,
      targetFps: 60,
    },
    medium: {
      shadows: false,
      shadowMapSize: 1024,
      antialias: true,
      pixelRatio: 1,
      bloom: true,
      outline: false,
      targetFps: 60,
    },
    low: {
      shadows: false,
      shadowMapSize: 512,
      antialias: false,
      pixelRatio: 1,
      bloom: false,
      outline: false,
      targetFps: 30,
    },
  }[quality];
}
