import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/api-client', () => ({
  characterApi: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

import { useCharacterStore } from './character-store';

describe('character-store', () => {
  beforeEach(() => useCharacterStore.getState().reset());

  it('starts with null character', () => {
    expect(useCharacterStore.getState().character).toBeNull();
  });

  it('setCharacter writes to local state', async () => {
    await useCharacterStore.getState().setCharacter({
      name: 'Riven',
      class: 'warrior',
      color: '188 95% 60%',
      weaponName: 'Runeblade',
    });
    expect(useCharacterStore.getState().character?.name).toBe('Riven');
    expect(useCharacterStore.getState().character?.class).toBe('warrior');
  });

  it('reset clears the character', async () => {
    await useCharacterStore.getState().setCharacter({
      name: 'Test', class: 'mage', color: '0 0% 0%', weaponName: 'X',
    });
    useCharacterStore.getState().reset();
    expect(useCharacterStore.getState().character).toBeNull();
  });
});
