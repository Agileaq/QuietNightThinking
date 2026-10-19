import { describe, it, expect } from 'vitest';
import { getSceneStateAt } from '../src/core/TimelineData.js';
import { TangCourtyard } from '../src/scene/TangCourtyard.js';
import { PoetCharacter } from '../src/scene/PoetCharacter.js';
import { VisualEffects } from '../src/scene/VisualEffects.js';

describe('3D Scene Graph & State Updates', () => {
  it('constructs TangCourtyard with complete house (roof, walls, window), bed, and window-projected moonlight', () => {
    const courtyard = new TangCourtyard();
    expect(courtyard.group.children.length).toBeGreaterThan(5);
    expect(courtyard.group.getObjectByName('FullMoon')).toBeTruthy();
    expect(courtyard.group.getObjectByName('TangBed')).toBeTruthy();
    expect(courtyard.group.getObjectByName('WindowLattice')).toBeTruthy();
    expect(courtyard.group.getObjectByName('HouseRoof')).toBeTruthy();
    expect(courtyard.group.getObjectByName('HouseWalls')).toBeTruthy();
    expect(courtyard.group.getObjectByName('MoonlightBeam')).toBeTruthy();
    expect(courtyard.group.getObjectByName('WindowFloorLight')).toBeTruthy();
    expect(courtyard.group.getObjectByName('PoetRimLight')).toBeTruthy();
    courtyard.update(getSceneStateAt(8.0));
  });

  it('constructs next-gen PBR PoetCharacter (MeshPhysicalMaterial with sheen, normalMap, aoMap, Futou, XiedieBelt) and executes full 6-chapter choreography', () => {
    const poet = new PoetCharacter();
    expect(poet.group.getObjectByName('PoetBeard')).toBeTruthy();
    expect(poet.group.getObjectByName('LeftArmGroup')).toBeTruthy();
    expect(poet.group.getObjectByName('RightArmGroup')).toBeTruthy();
    expect(poet.group.getObjectByName('LeftHandGroup')).toBeTruthy();
    expect(poet.group.getObjectByName('RightHandGroup')).toBeTruthy();
    expect(poet.group.getObjectByName('RobeSkirtLathe')).toBeTruthy();
    expect(poet.group.getObjectByName('PoetFutou')).toBeTruthy();
    expect(poet.group.getObjectByName('XiedieBelt')).toBeTruthy();

    const robeMesh = poet.group.getObjectByName('RobeSkirtLathe');
    expect(robeMesh.material.isMeshPhysicalMaterial).toBe(true);
    expect(robeMesh.material.sheen).toBeGreaterThan(0.5);
    expect(robeMesh.material.normalMap).toBeTruthy();
    expect(robeMesh.material.aoMap).toBeTruthy();

    // Intro initial state
    poet.update(getSceneStateAt(1.0));
    const initX = poet.group.position.x;
    const initZ = poet.group.position.z;
    const initRotY = poet.group.rotation.y;

    // Verse 1: Turned toward the bed
    poet.update(getSceneStateAt(8.5));
    const bedRotY = poet.group.rotation.y;
    expect(Math.abs(bedRotY - initRotY)).toBeGreaterThan(1.2);

    // Verse 2: Looking down at frosted floor
    poet.update(getSceneStateAt(14.5));
    const frostRotX = poet.headGroup.rotation.x;
    expect(frostRotX).toBeGreaterThan(0.25);

    // Verse 3: Looking up at the moon
    poet.update(getSceneStateAt(21.0));
    const lookUpRotX = poet.headGroup.rotation.x;
    expect(lookUpRotX).toBeLessThan(-0.35);

    // Verse 4: Bowed head
    poet.update(getSceneStateAt(26.5));
    const lookDownRotX = poet.headGroup.rotation.x;
    expect(lookDownRotX).toBeGreaterThan(0.3);

    // Outro: Moved back to initial state
    poet.update(getSceneStateAt(31.8));
    expect(poet.group.position.x).toBeCloseTo(initX, 2);
    expect(poet.group.position.z).toBeCloseTo(initZ, 2);
    expect(poet.group.rotation.y).toBeCloseTo(initRotY, 2);
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
