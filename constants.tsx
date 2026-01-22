
import { Gender, CharacterPortrait, CharacterStats, LifestyleData, Trait, WeaponBase, Consumable } from './types.ts';

export const CONSUMABLES: Consumable[] = [
  {
    id: 'max-doc',
    name: 'MaxDoc',
    description: 'High-velocity bio-regenerative inhaler.',
    effect: 'Heals 1d20 HP',
    cost: 50
  },
  {
    id: 'ram-jolt',
    name: 'Ram Jolt',
    description: 'Neural overclocking fluid injection.',
    effect: 'Restores 5 NC',
    cost: 40
  },
  {
    id: 'adrenaline-shot',
    name: 'Adrenaline Shot',
    description: 'Synthetic combat-grade adrenal boost.',
    effect: 'Restores 5 KP',
    cost: 30
  }
];

export const LIFESTYLES: LifestyleData[] = [
  {
    id: 'street-kid',
    name: 'Street Kid',
    startingEddies: 150,
    efficiency: {
      label: 'Street Wise',
      description: '+3 to Charisma checks.'
    },
    negative: {
      label: 'Unfiltered',
      description: '-3 to Intelligence checks.'
    },
    specialSkill: {
      label: 'Black Market Connection',
      description: 'Can find any items cheaper at black market. all item are discounted 20%'
    }
  },
  {
    id: 'nomad',
    name: 'Nomad',
    startingEddies: 100,
    efficiency: {
      label: 'Rough Rider',
      description: '+3 to Body and Dex checks.'
    },
    negative: {
      label: 'Outsider',
      description: '-3 to Charisma checks.'
    },
    specialSkill: {
      label: 'Backlands Grit',
      description: 'Spend 5 KP to automatically succeed on any Body and Dex checks.'
    }
  },
  {
    id: 'corpo',
    name: 'Corpo',
    startingEddies: 1000,
    efficiency: {
      label: 'Silver Tongue',
      description: '+3 to Charisma and Int checks.'
    },
    negative: {
      label: 'Soft Hands',
      description: '-3 to body check.'
    },
    specialSkill: {
      label: 'Corporate Requisition',
      description: 'Once per session, you can "Require" a standard item.'
    }
  },
  {
    id: 'techie',
    name: 'Techie',
    startingEddies: 600,
    efficiency: {
      label: 'Hardware Expert',
      description: '+4 to Int.'
    },
    negative: {
      label: 'Combat Hesitation',
      description: '-4 to initiative rolls.'
    },
    specialSkill: {
      label: 'Overclock Damage',
      description: 'Spend 5 NC to double damage with any energy or tech weapons.'
    }
  }
];

export const WEAPON_BASES: WeaponBase[] = [
  { id: 'pistol', name: 'Pistol', category: 'Firearm', damage: '1d6', baseMag: 9, shotsPerAction: 3, description: 'Semi-auto reliable sidearm.' },
  { id: 'rifle', name: 'Rifle', category: 'Firearm', damage: '1d8', baseMag: 24, shotsPerAction: 1, description: 'Long-range precision tool.' },
  { id: 'shotgun', name: 'Shotgun', category: 'Firearm', damage: '1d20', baseMag: 6, shotsPerAction: 1, description: 'Close-quarters devastating power.' },
  { id: 'blunt', name: 'Blunt Weapon', category: 'Melee', damage: '1d4', description: 'Heavy impact. Spend 4 KP to double damage.' },
  { id: 'blade', name: 'Blade', category: 'Melee', damage: '1d8', description: 'Sharp edge. Dismember on Nat 20 or spend 6 KP.' },
  { id: 'energy-melee', name: 'Energy Weapon', category: 'Melee', damage: '1d12', description: 'High-frequency vibration edge.' },
  { id: 'mantis-blades', name: 'Mantis Blades', category: 'Tech', damage: '3d6', chgCost: 6, description: 'Neural blades. Dismember on Nat 20 or spend 6 KP + 6 NC.' },
  { id: 'monowire', name: 'Monowire', category: 'Tech', damage: '4d4', chgCost: 4, description: 'Molecular wire. Decapitate from Stealth (14 NC).' },
  { id: 'gorilla-arms', name: 'Gorilla Arms', category: 'Tech', damage: '3d20', chgCost: 8, phyCost: 4, description: 'Hydraulic powered fists.' },
];

export const TRAITS: Trait[] = [
  { id: 'mil-vet', name: 'Military Veteran', bonus: '+2 to all Attack rolls with range weapons', penalty: '-2 to Charisma (Persuasion) checks due to a rigid personality' },
  { id: 'ex-con', name: 'Ex-Con', bonus: '+3 to Intelligence (Investigation)', penalty: '-3 to Charisma (Deception) when speaking to authorities' },
  { id: 'socio', name: 'Sociopath', bonus: 'Immune to the Frightened or surprise conditions', penalty: '-4 to Persuasion' },
  { id: 'cyber-junkie', name: 'Cyber-Junkie', bonus: '+5 to Max Charge', penalty: 'Take 1d4 psychic damage if you end a turn without spending Charge' },
  { id: 'street-brawler', name: 'Street Brawler', bonus: '+2 to damage with Unarmed strikes', penalty: '-2 to Accuracy with any ranged weapon' },
  { id: 'med-tech', name: 'Med-Tech', bonus: 'Regain extra 1d8 HP when healing an ally', penalty: 'Disadvantage on Attack rolls using Shotguns' },
  { id: 'net-runner', name: 'Net-Runner', bonus: '+3 to Intelligence checks to hack/bypass security', penalty: 'Max HP reduced by 5' },
  { id: 'paranoid', name: 'Paranoid', bonus: '+5 bonus to Initiative', penalty: 'Disadvantage on Insight checks' },
  { id: 'heavy-hitter', name: 'Heavy Hitter', bonus: 'Melee attacks deal extra 1d6 damage on a hit', penalty: 'Using a Melee weapon costs 2 PHY instead of 1' },
  { id: 'eagle-eye', name: 'Eagle Eye', bonus: 'Advantage on all range attacks', penalty: '-3 to all Melee attack rolls' },
  { id: 'quick-reflex', name: 'Quick Reflexes', bonus: 'Roll d20 when attacked: 18-20 dodges the attack', penalty: 'Take double damage on surprise attacks' },
  { id: 'scavenger', name: 'Scavenger', bonus: 'Action to find 1d4 CHG or 1d4 PHY from scrap', penalty: 'Starting Health reduced by 4' },
  { id: 'hardened', name: 'Hardened', bonus: '+10 bonus to your HP', penalty: 'Cannot use the "Dash" action' },
  { id: 'infiltrator', name: 'Infiltrator', bonus: '+3 to Stealth checks', penalty: '-3 to Body checks to break or lift objects' },
  { id: 'adrenaline-junkie', name: 'Adrenaline Junkie', bonus: 'Below half Health: +2 to all Damage rolls', penalty: 'Above half Health: -2 to all Accuracy rolls' },
  { id: 'glass-cannon', name: 'Glass Cannon', bonus: 'Deal double damage on a hit once per combat', penalty: 'Take double damage from the next attack that hits you' },
  { id: 'chrome-blood', name: 'Chrome Blood', bonus: 'Resistance to Cyberware or hack', penalty: 'Cannot be healed by items. Ripperdocs only' },
  { id: 'amnesiac', name: 'Amnesiac', bonus: 'Flashback to gain proficiency for 10 min', penalty: '1d6 roll every action: 1 or 2 causes migraine and turn skipped' },
  { id: 'thrill-seeker', name: 'Thrill Seeker', bonus: '+2 to attack when within 5ft of enemy', penalty: 'Disadvantage on Ranged attacks if no enemy within 5ft' },
  { id: 'quiet-type', name: 'Quiet Type', bonus: 'Invisible to thermal and motion sensors', penalty: 'Cannot use Influence or Intimidate skills' },
  { id: 'bully', name: 'Bully', bonus: '+3 to Intimidation checks', penalty: '-3 to all Intelligence checks' },
  { id: 'escape-artist', name: 'Escape Artist', bonus: 'At initiative stage, place yourself anywhere on the map', penalty: 'Disadvantage on saving throws against being Stunned' },
  { id: 'bio-hacked', name: 'Bio-Hacked', bonus: 'Regain 2 HP at the start of every turn', penalty: 'Vulnerability to EMP and electric damage' },
  { id: 'weapon-spec', name: 'Weapon Specialist', bonus: '+3 to hit with one specific weapon', penalty: 'Disadvantage with all other weapon types' },
  { id: 'urban-hunter', name: 'Urban Hunter', bonus: 'Extra 1d6 damage to enemies that haven\'t acted', penalty: 'Cannot attack other enemies until the first target is dead' },
];

export const PORTRAIT_PRESETS: CharacterPortrait[] = [
  { id: 'm1', url: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=600&h=600&fit=crop', name: 'Kaelen "Grid" Vance', gender: Gender.MALE, description: 'Veteran hacker.' },
  { id: 'm2', url: 'https://images.unsplash.com/photo-1614028674026-a65e31bfd27c?q=80&w=600&h=600&fit=crop', name: 'Soren "Apex" Thorne', gender: Gender.MALE, description: 'Corporate security.' },
  { id: 'm3', url: 'https://images.unsplash.com/photo-1627163439134-7a8c47ee80c7?q=80&w=600&h=600&fit=crop', name: 'Elias "Shadow" Wu', gender: Gender.MALE, description: 'Infiltration expert.' },
  { id: 'm4', url: 'https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?q=80&w=600&h=600&fit=crop', name: 'Jax "Circuit" Reed', gender: Gender.MALE, description: 'Street-smart engineer.' },
  { id: 'm5', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600&h=600&fit=crop', name: 'Viktor "Mainframe"', gender: Gender.MALE, description: 'Old-school solo.' },
  { id: 'f1', url: 'https://images.unsplash.com/photo-1605648916319-cf082f7524a1?q=80&w=600&h=600&fit=crop', name: 'Sera "Pulse" Quinn', gender: Gender.FEMALE, description: 'Fast-twitch street samurai.' },
  { id: 'f2', url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=600&h=600&fit=crop', name: 'Valerie "Glitch" Jace', gender: Gender.FEMALE, description: 'Netrunner specialist.' },
  { id: 'f3', url: 'https://images.unsplash.com/photo-1593032465175-481ac7f40197?q=80&w=600&h=600&fit=crop', name: 'Evelyn "Aegis" Cross', gender: Gender.FEMALE, description: 'Corporate executive.' },
  { id: 'f4', url: 'https://images.unsplash.com/photo-1579912437766-79010495886d?q=80&w=600&h=600&fit=crop', name: 'Raven "Naught"', gender: Gender.FEMALE, description: 'Urban scout.' },
  { id: 'f5', url: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=600&h=600&fit=crop', name: 'Sasha "Sync" Ryder', gender: Gender.FEMALE, description: 'Combat medic.' },
  { id: 'nb1', url: 'https://images.unsplash.com/photo-1541178735423-4793f3ad097f?q=80&w=600&h=600&fit=crop', name: 'Flux "Prism"', gender: Gender.NON_BINARY, description: 'Fluid entity.' },
  { id: 'nb2', url: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?q=80&w=600&h=600&fit=crop', name: 'Zenith "Null"', gender: Gender.NON_BINARY, description: 'Deep-net architect.' },
  { id: 'nb3', url: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=600&h=600&fit=crop', name: 'Cipher "Echo"', gender: Gender.NON_BINARY, description: 'Social engineer.' },
  { id: 'nb4', url: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?q=80&w=600&h=600&fit=crop', name: 'Nova "Signal"', gender: Gender.NON_BINARY, description: 'Overclocked technician.' },
  { id: 'nb5', url: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=600&h=600&fit=crop', name: 'Ouro "Loop"', gender: Gender.NON_BINARY, description: 'Neural-pathway specialist.' },
];

export const INITIAL_STATS: CharacterStats = {
  body: 4,
  dexterity: 4,
  intelligence: 4,
  charisma: 4,
  constitution: 4
};

export const MAX_STAT_POINTS = 25;
