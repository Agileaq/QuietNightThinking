import { describe, it, expect } from 'vitest';
import { getSceneStateAt } from '../src/core/TimelineData.js';
import { TangCourtyard } from '../src/scene/TangCourtyard.js';
import { PoetCharacter } from '../src/scene/PoetCharacter.js';
import { VisualEffects } from '../src/scene/VisualEffects.js';

describe('3D Scene Graph & State Updates', () => {
  it('constructs TangCourtyard with moon, window lattice, bed, and volumetric beam', () => {
    const courtyard = new TangCourtyard();
    expect(courtyard.group.children.length).toBeGreaterThan(5);
    expect(courtyard.group.getObjectByName('FullMoon')).toBeTruthy();
    expect(courtyard.group.getObjectByName('TangBed')).toBeTruthy();
    expect(courtyard.group.getObjectByName('WindowLattice')).toBeTruthy();
    courtyard.update(getSceneStateAt(8.0));
  });

  it('updates PoetCharacter head pitch upward on verse3 and downward on verse4', () => {
    const poet = new PoetCharacter();
    poet.update(getSceneStateAt(21.0));
    const lookUpRotX = poet.headGroup.rotation.x;
    poet.update(getSceneStateAt(26.5));
    const lookDownRotX = poet.headGroup.rotation.x;
    expect(lookUpRotX).not.toBeCloseTo(lookDownRotX, 2);
  });

  it('updates VisualEffects frost shader uniform and homeland glow intensity', () => {
    const fx = new VisualEffects();
    fx.update(getSceneStateAt(3.0));
    expect(fx.frostMaterial.uniforms.uFrostProgress.value).toBe(0);

    fx.update(getSceneStateAt(16.0));
    expect(fx.frostMaterial.uniforms.uFrostProgress.value).toBeGreaterThan(0.8);

    fx.update(getSceneStateAt(26.5));
    expect(fx.homelandGroup.visible).toBe(true);
  });
});
