
export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  NON_BINARY = 'Non-Binary'
}

export interface CharacterPortrait {
  id: string;
  url: string;
  name: string;
  gender: Gender;
  description: string;
}

export interface CharacterStats {
  body: number;
  dexterity: number;
  intelligence: number;
  charisma: number;
  constitution: number;
}

export interface DerivedVitals {
  hp: { current: number; temp: number };
  chg: { current: number; temp: number };
  phy: { current: number; temp: number };
}

export interface Trait {
  id: string;
  name: string;
  bonus: string;
  penalty: string;
}

export interface LifestyleData {
  id: string;
  name: string;
  startingEddies: number;
  efficiency: {
    label: string;
    description: string;
  };
  negative: {
    label: string;
    description: string;
  };
  specialSkill: {
    label: string;
    description: string;
  };
}

export type AmmoType = 'Regular' | 'Incendiary' | 'Electric' | 'Armor Piercing';
export type SightType = 'None' | 'Red Dot' | '2x' | '4x' | 'Thermal' | 'Smart Link';
export type MuzzleType = 'None' | 'Suppressor' | 'Compensator' | 'Ported Barrel';
export type MagSizeBonus = 0 | 2 | 4 | 6 | 12;

export interface WeaponAttachments {
  ammoType: AmmoType;
  magSize: MagSizeBonus;
  sight: SightType;
  muzzle: MuzzleType;
}

export type WeaponCategory = 'Firearm' | 'Melee' | 'Tech';

export interface WeaponBase {
  id: string;
  name: string;
  category: WeaponCategory;
  damage: string;
  description: string;
  baseMag?: number;
  shotsPerAction?: number;
  chgCost?: number;
  phyCost?: number;
}

export interface EquippedWeapon {
  baseId: string;
  currentAmmo: number;
  attachments?: WeaponAttachments;
}

export interface Consumable {
  id: string;
  name: string;
  description: string;
  effect: string;
  cost: number;
}

export type BodyModCategory = 'Eyes' | 'Core' | 'Arms' | 'Legs';

export interface BodyMod {
  id: string;
  category: BodyModCategory;
  name: string;
  effect: string;
  description: string;
}

export interface Character {
  name: string;
  gender: Gender;
  stats: CharacterStats;
  vitals: DerivedVitals;
  lifestyleId: string;
  selectedTraitIds: string[];
  equippedWeapons: EquippedWeapon[];
  bodyMods: Record<BodyModCategory, string | null>;
  consumables: Record<string, number>;
  eddies: number;
  memos: string[];
}
