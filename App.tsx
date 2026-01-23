
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Gender, 
  Character, 
  CharacterStats, 
  LifestyleData, 
  DerivedVitals, 
  Trait, 
  EquippedWeapon, 
  WeaponBase,
  WeaponAttachments,
  WeaponCategory,
  Consumable,
  BodyModCategory,
  BodyMod,
  SkillBranch
} from './types.ts';
import { INITIAL_STATS, MAX_STAT_POINTS, LIFESTYLES, TRAITS, WEAPON_BASES, CONSUMABLES, BODY_MODS, SKILL_BRANCHES } from './constants.tsx';
import CyberButton from './components/CyberButton.tsx';
import StatBox from './components/StatBox.tsx';
import HackingMinigame from './components/HackingMinigame.tsx';

const STORAGE_KEY = 'NEON_VALLEY_CHARACTER_DATA_V3';
const LEGACY_KEYS = ['NEON_VALLEY_CHARACTER_DATA_V2', 'NEON_VALLEY_CHARACTER_DATA_V1', 'NEON_VALLEY_CHARACTER_DATA'];

const sanitizeCharacterData = (data: any): Character => {
  const defaults = {
    name: 'OPERATIVE_NULL',
    gender: Gender.NON_BINARY,
    stats: { ...INITIAL_STATS },
    vitals: {
      hp: { current: 30, temp: 0 },
      chg: { current: 18, temp: 0 },
      phy: { current: 18, temp: 0 }
    },
    lifestyleId: 'street-kid',
    selectedTraitIds: [],
    equippedWeapons: [],
    bodyMods: { Eyes: null, Core: null, Arms: null, Legs: null },
    consumables: { 'max-doc': 0, 'ram-jolt': 0, 'adrenaline-shot': 0 },
    eddies: 150,
    memos: [],
    unlockedSkills: {}
  };

  if (!data) return defaults;

  const vitals = {
    hp: { current: data.vitals?.hp?.current ?? defaults.vitals.hp.current, temp: data.vitals?.hp?.temp ?? 0 },
    chg: { current: data.vitals?.chg?.current ?? defaults.vitals.chg.current, temp: data.vitals?.chg?.temp ?? 0 },
    phy: { current: data.vitals?.phy?.current ?? defaults.vitals.phy.current, temp: data.vitals?.phy?.temp ?? 0 },
  };

  const equippedWeapons = (data.equippedWeapons || []).map((w: any) => {
    if (w.attachments) {
      return {
        ...w,
        attachments: {
          ammoType: w.attachments.ammoType || 'Regular',
          magSize: w.attachments.magSize || 0,
          sight: w.attachments.sight || 'None',
          muzzle: w.attachments.muzzle || 'None',
        }
      };
    }
    return w;
  });

  return {
    ...defaults,
    ...data,
    vitals,
    equippedWeapons,
    bodyMods: { ...defaults.bodyMods, ...data.bodyMods },
    consumables: { ...defaults.consumables, ...data.consumables },
    unlockedSkills: data.unlockedSkills || {}
  };
};

const playReloadSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playMechanicalClick = (freq: number, startTime: number, type: 'sine' | 'triangle' | 'square' = 'triangle') => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq / 3, startTime + 0.1);
      gain.gain.setValueAtTime(0.08, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.1);
    };
    playMechanicalClick(120, audioCtx.currentTime); 
    playMechanicalClick(180, audioCtx.currentTime + 0.15); 
    playMechanicalClick(350, audioCtx.currentTime + 0.45, 'sine'); 
  } catch (e) {
    console.warn("Neural audio feedback disabled.");
  }
};

const App: React.FC = () => {
  const [character, setCharacter] = useState<Character>(() => {
    const allKeys = [STORAGE_KEY, ...LEGACY_KEYS];
    for (const key of allKeys) {
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return sanitizeCharacterData(parsed);
        } catch (e) {
          console.error(`Failed to parse character from ${key}`, e);
        }
      }
    }
    return sanitizeCharacterData(null);
  });

  const [neuralId, setNeuralId] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_ID');
    return saved || 'NC-SYNC-' + Math.floor(10000 + Math.random() * 89999);
  });

  const [neuralGrade, setNeuralGrade] = useState(() => {
    return localStorage.getItem(STORAGE_KEY + '_GRADE') || '1';
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [memoInput, setMemoInput] = useState('');
  const [forceExpandTraits, setForceExpandTraits] = useState(false);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [isHackingOpen, setIsHackingOpen] = useState(false);
  const [reloadingId, setReloadingId] = useState<string | null>(null);
  const [activeModCategory, setActiveModCategory] = useState<BodyModCategory>('Eyes');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(character));
    localStorage.setItem(STORAGE_KEY + '_ID', neuralId);
    localStorage.setItem(STORAGE_KEY + '_GRADE', neuralGrade);
  }, [character, neuralId, neuralGrade]);

  const activeLifestyle = useMemo(() => 
    LIFESTYLES.find(l => l.id === character.lifestyleId) || LIFESTYLES[0],
    [character.lifestyleId]
  );

  const pointsUsed = useMemo(() => {
    const s = character.stats;
    return s.body + s.dexterity + s.intelligence + s.charisma + s.constitution;
  }, [character.stats]);

  const pointsRemaining = MAX_STAT_POINTS - pointsUsed;

  const skillPointsData = useMemo(() => {
    const grade = parseInt(neuralGrade) || 1;
    const totalPoints = grade + 1;
    const spentPoints = (Object.values(character.unlockedSkills) as number[]).reduce((a: number, b: number) => a + b, 0);
    return {
      grade,
      total: totalPoints,
      remaining: totalPoints - spentPoints
    };
  }, [neuralGrade, character.unlockedSkills]);

  const displayedSkills = useMemo(() => {
    const branches = [...SKILL_BRANCHES];
    branches.sort((a, b) => {
      const lvlA = character.unlockedSkills[a.id] || 0;
      const lvlB = character.unlockedSkills[b.id] || 0;
      if (lvlA > 0 && lvlB === 0) return -1;
      if (lvlA === 0 && lvlB > 0) return 1;
      return 0;
    });

    if (skillPointsData.remaining === 0) {
      return branches.filter(b => (character.unlockedSkills[b.id] || 0) > 0);
    }
    return branches;
  }, [character.unlockedSkills, skillPointsData.remaining]);

  const externalModifiers = useMemo(() => {
    const mods: Record<keyof CharacterStats, number> = {
      body: 0, dexterity: 0, intelligence: 0, charisma: 0, constitution: 0
    };

    if (character.lifestyleId === 'street-kid') {
      mods.charisma += 3; mods.intelligence -= 3;
    } else if (character.lifestyleId === 'nomad') {
      mods.body += 3; mods.dexterity += 3; mods.charisma -= 3;
    } else if (character.lifestyleId === 'corpo') {
      mods.charisma += 3; mods.intelligence += 3; mods.body -= 3;
    } else if (character.lifestyleId === 'techie') {
      mods.intelligence += 4;
    }

    // Apply Body Mod Stat Adjustments
    if (character.bodyMods.Core === 'neural-processor') mods.intelligence += 4;

    character.selectedTraitIds.forEach(id => {
      if (id === 'mil-vet') mods.charisma -= 2;
      if (id === 'ex-con') { mods.intelligence += 3; mods.charisma -= 3; }
      if (id === 'socio') mods.charisma -= 4;
      if (id === 'net-runner') mods.intelligence += 3;
      if (id === 'bully') { mods.charisma += 3; mods.intelligence -= 3; }
      if (id === 'quiet-type') mods.charisma -= 3;
      if (id === 'infiltrator') mods.body -= 3;
    });

    return mods;
  }, [character.lifestyleId, character.selectedTraitIds, character.bodyMods.Core]);

  const derivedStats = useMemo(() => {
    let initiative = 0;
    let stealth = 0;
    
    // Quick Draw Skill
    const qdLevel = character.unlockedSkills['quick-draw'] || 0;
    if (qdLevel >= 3) initiative += 10;
    else if (qdLevel >= 1) initiative += 5;

    // Ghost Protocol Skill
    const ghostLevel = character.unlockedSkills['ghost'] || 0;
    if (ghostLevel >= 1) stealth += 4;

    // Traits
    if (character.selectedTraitIds.includes('paranoid')) initiative += 5;
    if (character.selectedTraitIds.includes('infiltrator')) stealth += 3;

    // Body Mods
    if (character.bodyMods.Core === 'adrenal-gland') initiative += 2; // Advantage usually but +2 for tracking
    if (character.bodyMods.Legs === 'silent-treads') stealth += 5;

    return { initiative, stealth };
  }, [character.unlockedSkills, character.selectedTraitIds, character.bodyMods]);

  const maxValues = useMemo(() => {
    let hpMod = 0; 
    let chgMod = 0;
    let phyMod = 0;

    // Trait modifiers
    if (character.selectedTraitIds.includes('net-runner')) hpMod -= 5;
    if (character.selectedTraitIds.includes('scavenger')) hpMod -= 4;
    if (character.selectedTraitIds.includes('hardened')) hpMod += 10;
    if (character.selectedTraitIds.includes('cyber-junkie')) chgMod += 5;

    // Body mod modifiers
    if (character.bodyMods.Core === 'bio-pump') hpMod += 15;

    // Skill Branch modifiers: Adrenaline Overload (KP Integrity)
    const adrenalineLevel = character.unlockedSkills['adrenaline-lord'] || 0;
    if (adrenalineLevel >= 3) phyMod += 10;
    else if (adrenalineLevel >= 1) phyMod += 5;
    
    return {
      hp: 10 + (character.stats.constitution * 5) + hpMod,
      chg: 10 + (character.stats.intelligence * 2) + chgMod,
      phy: 10 + (character.stats.body * 2) + phyMod
    };
  }, [character.stats, character.selectedTraitIds, character.bodyMods, character.unlockedSkills]);

  const totalMax = useMemo(() => ({
    hp: maxValues.hp + character.vitals.hp.temp,
    chg: maxValues.chg + character.vitals.chg.temp,
    phy: maxValues.phy + character.vitals.phy.temp
  }), [maxValues, character.vitals]);

  const shieldRating = useMemo(() => {
    const getMod = (val: number) => Math.floor((val - 4) / 2);
    const nGrade = parseInt(neuralGrade) || 1;
    
    const conMod = getMod(character.stats.constitution) + externalModifiers.constitution;
    const dexMod = getMod(character.stats.dexterity) + externalModifiers.dexterity;
    const bodyMod = getMod(character.stats.body) + externalModifiers.body;

    // Skill Branch modifiers: Titan Shell Grid
    const titanLevel = character.unlockedSkills['titan'] || 0;
    let titanMod = 0;
    if (titanLevel >= 5) titanMod = 10;
    else if (titanLevel >= 3) titanMod = 4;
    else if (titanLevel >= 1) titanMod = 2;

    return {
      total: 8 + nGrade + conMod + dexMod + bodyMod + titanMod,
      breakdown: `8 (BASE) + ${nGrade} (N) + ${conMod >= 0 ? '+' : ''}${conMod} (CON) + ${dexMod >= 0 ? '+' : ''}${dexMod} (DEX) + ${bodyMod >= 0 ? '+' : ''}${bodyMod} (BODY)${titanMod > 0 ? ` + ${titanMod} (TITAN)` : ''}`
    };
  }, [neuralGrade, character.stats, externalModifiers, character.unlockedSkills]);

  const hackCostModifier = useMemo(() => {
    const netrunnerLevel = character.unlockedSkills['net-runner-x'] || 0;
    return netrunnerLevel >= 1 ? -1 : 0;
  }, [character.unlockedSkills]);

  // Added missing variables for trait display logic
  const isTraitsComplete = character.selectedTraitIds.length >= 3;
  const displayTraits = TRAITS;

  useEffect(() => {
    setCharacter(prev => ({
      ...prev,
      vitals: {
        hp: { ...prev.vitals.hp, current: Math.min(prev.vitals.hp.current, totalMax.hp) },
        chg: { ...prev.vitals.chg, current: Math.min(prev.vitals.chg.current, totalMax.chg) },
        phy: { ...prev.vitals.phy, current: Math.min(prev.vitals.phy.current, totalMax.phy) }
      }
    }));
  }, [totalMax.hp, totalMax.chg, totalMax.phy]);

  const handleStatChange = (stat: keyof CharacterStats, value: number) => {
    if (value < 1 || value > 10) return;
    const oldValue = character.stats[stat];
    if (value > oldValue && pointsRemaining <= 0) return;
    setCharacter(prev => ({ ...prev, stats: { ...prev.stats, [stat]: value } }));
  };

  const updateVital = (key: keyof DerivedVitals, field: 'current' | 'temp', delta: number) => {
    setCharacter(prev => {
      const newVal = prev.vitals[key][field] + delta;
      if (field === 'current') {
        const capped = Math.max(0, Math.min(newVal, Math.max(0, totalMax[key])));
        return { ...prev, vitals: { ...prev.vitals, [key]: { ...prev.vitals[key], current: capped } } };
      }
      return { ...prev, vitals: { ...prev.vitals, [key]: { ...prev.vitals[key], temp: newVal } } };
    });
  };

  const updateEddies = (delta: number) => setCharacter(prev => ({ ...prev, eddies: Math.max(0, prev.eddies + delta) }));

  const handleLifestyleChange = (lifestyleId: string) => {
    const lifestyle = LIFESTYLES.find(l => l.id === lifestyleId);
    if (!lifestyle) return;
    setCharacter(prev => ({ ...prev, lifestyleId, eddies: lifestyle.startingEddies, consumables: { 'max-doc': 0, 'ram-jolt': 0, 'adrenaline-shot': 0 } }));
  };

  const handleRipperdoc = () => { if (character.eddies >= 100) { updateVital('hp', 'current', totalMax.hp - character.vitals.hp.current); updateEddies(-100); } };
  const handleChargeNC = () => { if (character.eddies >= 100) { updateVital('chg', 'current', totalMax.chg - character.vitals.chg.current); updateEddies(-100); } };
  const handleRestKP = () => updateVital('phy', 'current', totalMax.phy - character.vitals.phy.current);

  const toggleTrait = (traitId: string) => {
    setCharacter(prev => {
      const isSelected = prev.selectedTraitIds.includes(traitId);
      if (isSelected) return { ...prev, selectedTraitIds: prev.selectedTraitIds.filter(id => id !== traitId) };
      if (prev.selectedTraitIds.length < 3) return { ...prev, selectedTraitIds: [...prev.selectedTraitIds, traitId] };
      return prev;
    });
  };

  const upgradeSkill = (branchId: string) => {
    const currentLevel = character.unlockedSkills[branchId] || 0;
    if (skillPointsData.remaining <= 0) return;
    if (currentLevel >= 5) return;
    if (currentLevel + 1 > skillPointsData.grade) return;

    setCharacter(prev => ({
      ...prev,
      unlockedSkills: {
        ...prev.unlockedSkills,
        [branchId]: currentLevel + 1
      }
    }));
  };

  const downgradeSkill = (branchId: string) => {
    const currentLevel = character.unlockedSkills[branchId] || 0;
    if (currentLevel <= 0) return;
    setCharacter(prev => ({
      ...prev,
      unlockedSkills: {
        ...prev.unlockedSkills,
        [branchId]: currentLevel - 1
      }
    }));
  };

  const equipBodyMod = (mod: BodyMod) => {
    setCharacter(prev => ({
      ...prev,
      bodyMods: { ...prev.bodyMods, [mod.category]: prev.bodyMods[mod.category] === mod.id ? null : mod.id }
    }));
  };

  const equipWeapon = (base: WeaponBase) => {
    setCharacter(prev => {
      const exists = prev.equippedWeapons.find(w => w.baseId === base.id);
      if (exists) return prev;
      const newWeapon: EquippedWeapon = { baseId: base.id, currentAmmo: base.baseMag || 0, attachments: base.category === 'Firearm' ? { ammoType: 'Regular', magSize: 0, sight: 'None', muzzle: 'None' } : undefined };
      return { ...prev, equippedWeapons: [...prev.equippedWeapons, newWeapon] };
    });
  };

  const unequipWeapon = (baseId: string) => setCharacter(prev => ({ ...prev, equippedWeapons: prev.equippedWeapons.filter(w => w.baseId !== baseId) }));

  const updateWeaponAttachment = (baseId: string, key: keyof WeaponAttachments, value: any) => {
    setCharacter(prev => ({
      ...prev,
      equippedWeapons: prev.equippedWeapons.map(w => {
        if (w.baseId === baseId && w.attachments) {
          const newAttachments = { ...w.attachments, [key]: value };
          return { ...w, attachments: newAttachments };
        }
        return w;
      })
    }));
  };

  const useWeapon = (weapon: EquippedWeapon, isSpecial: boolean = false) => {
    const base = WEAPON_BASES.find(b => b.id === weapon.baseId);
    if (!base) return;

    if (base.category === 'Firearm') {
      if (weapon.currentAmmo > 0) {
        setCharacter(prev => ({ ...prev, equippedWeapons: prev.equippedWeapons.map(w => w.baseId === weapon.baseId ? { ...w, currentAmmo: Math.max(0, w.currentAmmo - 1) } : w) }));
      }
    } else {
      const isHeavyHitter = character.selectedTraitIds.includes('heavy-hitter');
      const basePhyCost = isHeavyHitter && base.category === 'Melee' ? 1 : 0;
      let chgCost = 0; let phyCost = basePhyCost;
      if (isSpecial) {
        if (base.id === 'monowire') chgCost = 14;
        else if (base.id === 'mantis-blades') { chgCost = 6; phyCost = 6; }
        else if (base.id === 'blunt') phyCost = 4;
        else if (base.id === 'blade') phyCost = 6;
        else if (base.id === 'gorilla-arms') { chgCost = 8; phyCost = 4; }
        else { chgCost = base.chgCost || 0; phyCost = base.phyCost || 0; }
      } else {
        chgCost = base.chgCost || 0;
        phyCost += base.phyCost || 0;
      }
      if (character.bodyMods.Arms === 'zero-cost-actuators' && (base.id === 'gorilla-arms' || base.id === 'mantis-blades')) {
        phyCost = 0;
      }
      if (character.vitals.chg.current >= chgCost && character.vitals.phy.current >= phyCost) {
        updateVital('chg', 'current', -chgCost);
        updateVital('phy', 'current', -phyCost);
      }
    }
  };

  const reloadWeapon = (weapon: EquippedWeapon) => {
    const base = WEAPON_BASES.find(b => b.id === weapon.baseId);
    if (!base || base.category !== 'Firearm') return;
    setReloadingId(base.id); playReloadSound();
    setTimeout(() => {
      const magBonus = weapon.attachments?.magSize || 0;
      const maxAmmo = (base.baseMag || 0) + magBonus;
      setCharacter(prev => ({ ...prev, equippedWeapons: prev.equippedWeapons.map(w => w.baseId === weapon.baseId ? { ...w, currentAmmo: maxAmmo } : w) }));
      setReloadingId(null);
    }, 600);
  };

  const useConsumable = (cons: Consumable) => {
    const count = character.consumables[cons.id] || 0;
    if (count <= 0) return;
    if (cons.id === 'max-doc') { setLastRoll(Math.floor(Math.random() * 20) + 1); updateVital('hp', 'current', lastRoll || 10); } 
    else if (cons.id === 'ram-jolt') updateVital('chg', 'current', 5);
    else if (cons.id === 'adrenaline-shot') updateVital('phy', 'current', 5);
    setCharacter(prev => ({ ...prev, consumables: { ...prev.consumables, [cons.id]: count - 1 } }));
  };

  const adjustConsumable = (consId: string, delta: number) => setCharacter(prev => ({ ...prev, consumables: { ...prev.consumables, [consId]: Math.max(0, (prev.consumables[consId] || 0) + delta) } }));

  const addMemo = () => { if (!memoInput.trim()) return; setCharacter(prev => ({ ...prev, memos: [memoInput.trim(), ...prev.memos] })); setMemoInput(''); };
  const removeMemo = (index: number) => setCharacter(prev => ({ ...prev, memos: prev.memos.filter((_, i) => i !== index) }));

  const getWeaponStats = (weapon: EquippedWeapon) => {
    const base = WEAPON_BASES.find(b => b.id === weapon.baseId);
    if (!base) return { damage: '0', effects: [], hitBonus: 0, attacks: 1 };
    let damage = base.damage; let hitBonus = 0; const effects: string[] = [];
    let attacks = base.shotsPerAction || 1;

    // Gunslinger skill for Pistols
    if (base.id === 'pistol') {
      const gsLevel = character.unlockedSkills['gunslinger'] || 0;
      if (gsLevel >= 5) attacks = 5;
      else if (gsLevel >= 4) attacks = 4;
      else if (gsLevel >= 3) attacks = 3;
      else if (gsLevel >= 1) attacks = 2;
    }

    if (weapon.attachments) {
      if (weapon.attachments.ammoType === 'Incendiary') damage += ' + 1d4 (Burn)';
      else if (weapon.attachments.ammoType === 'Electric') damage += ' + 1d4 (Elec)';
      else if (weapon.attachments.ammoType === 'Armor Piercing') effects.push('Ammo: Ignores 5 Armor');
      if (weapon.attachments.sight === 'Red Dot') hitBonus += 1;
      else if (weapon.attachments.sight === '2x') hitBonus += 2;
      else if (weapon.attachments.sight === '4x') hitBonus += 3;
      else if (weapon.attachments.sight === 'Smart Link') hitBonus += 5;
      if (weapon.attachments.sight === 'Thermal') effects.push('Ocular: Thermal highlight');
      if (weapon.attachments.muzzle === 'Compensator') hitBonus += 2;
      else if (weapon.attachments.muzzle === 'Suppressor') effects.push('Muzzle: Stealth firing (Low noise)');
      else if (weapon.attachments.muzzle === 'Ported Barrel') damage += ' + 2 (Kinetic)';
    }
    if (base.id === 'blunt') effects.push('Special: Overpower (4 KP) for 2x DMG');
    if (base.id === 'blade') effects.push('Special: Dismember (6 KP) for Limb Loss');
    if (base.id === 'mantis-blades') effects.push('Special: Dismember (6 KP + 6 NC)');
    if (base.id === 'monowire') effects.push('Special: Stealth Decapitate (14 NC)');
    if (character.selectedTraitIds.includes('glass-cannon')) effects.push('[!] NEURAL_OVERCLOCK: 2X TOTAL DAMAGE');
    return { damage, effects, hitBonus, attacks };
  };

  const handleClear = () => { if (window.confirm("WARNING: Purging active neural link will wipe all unsaved data. Proceed?")) { localStorage.removeItem(STORAGE_KEY); window.location.reload(); } };

  // Component Sub-renders
  const WalletComponent = (
    <section className="cyber-card p-5 bg-slate-900/60 overflow-hidden">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] font-orbitron text-cyan-400 uppercase tracking-widest">Wallet_Encryption</span>
        <span className="text-[8px] font-mono text-slate-600">STATUS: SOLVENT</span>
      </div>
      <div className="flex flex-col items-center gap-4 bg-black/60 p-4 border border-slate-800 group hover:border-cyan-500/50 transition-all">
        <div className="flex items-center justify-between w-full">
          <div className="text-4xl font-orbitron font-black text-white neon-text-cyan shrink-0">₩</div>
          <div className="text-3xl font-orbitron font-black text-white truncate tabular-nums">{character.eddies.toLocaleString()}</div>
        </div>
        <div className="grid grid-cols-4 gap-1 w-full">
          {[100, 50, 10, 5].map(v => (
            <button key={`sub-${v}`} onClick={() => updateEddies(-v)} className="py-1 text-[8px] font-bold border border-rose-900/50 text-rose-500 hover:bg-rose-900 hover:text-white transition-all">-{v}</button>
          ))}
          {[5, 10, 50, 100].map(v => (
            <button key={`add-${v}`} onClick={() => updateEddies(v)} className="py-1 text-[8px] font-bold border border-cyan-900/50 text-cyan-500 hover:bg-cyan-900 hover:text-white transition-all">+{v}</button>
          ))}
        </div>
      </div>
    </section>
  );

  const ActiveCacheComponent = (
    <section className="cyber-card p-5 space-y-4">
       <div className="flex justify-between items-center">
         <h3 className="text-[10px] font-orbitron text-amber-500 uppercase tracking-widest">Active_Cache</h3>
         <span className="text-[9px] font-mono text-slate-600">RAM: 64TB_LINKED</span>
       </div>
       <div className="space-y-3">
         <textarea 
           value={memoInput} 
           onChange={(e) => setMemoInput(e.target.value)}
           className="w-full bg-slate-950 border border-slate-800 p-3 text-[10px] font-mono text-amber-500/80 focus:border-amber-500 outline-none resize-none h-20 uppercase"
           placeholder="Buffer_Fragment_Data..."
         />
         <CyberButton onClick={addMemo} variant="secondary" className="w-full py-2">Buffer_Data</CyberButton>
       </div>
       <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2 pr-2">
         {character.memos.map((m, i) => (
           <div key={i} className="bg-black/40 border border-slate-800 p-3 relative group hover:bg-slate-900/40 transition-all">
             <button onClick={() => removeMemo(i)} className="absolute top-1 right-1 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-bold">[PURGE]</button>
             <p className="text-[10px] font-mono text-slate-400 break-words pr-4 leading-tight">{m}</p>
           </div>
         ))}
       </div>
    </section>
  );

  return (
    <div className="min-h-screen p-4 md:p-8 relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent shadow-[0_0_20px_var(--cyan)]" />

      {isHackingOpen && (
        <HackingMinigame 
          currentChg={character.vitals.chg.current}
          onClose={() => setIsHackingOpen(false)} 
          onInitiate={(cost) => updateVital('chg', 'current', -cost)}
          onSuccess={() => setIsHackingOpen(false)} 
          costModifier={hackCostModifier}
        />
      )}

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 animate-fade-in">
        {/* TOP HEADER */}
        <header className="lg:col-span-12 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-800 pb-6 mb-4 gap-6">
          <div className="flex flex-col">
            <h1 className="text-4xl md:text-6xl font-orbitron font-black text-white neon-text-cyan flex items-center gap-4 tracking-tighter">
              NEON_VALLEY <span className="text-xs bg-cyan-500 text-black px-3 py-1 font-mono font-bold tracking-widest rounded-none transform -skew-x-12">v.2.5.1-STABLE</span>
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
              <p className="text-cyan-500/80 font-mono text-xs uppercase tracking-[0.3em]">Protocol: Neural_Archivist_Engaged</p>
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end font-mono">
            <div className="text-[10px] text-slate-500 uppercase tracking-widest">Linked_Node:</div>
            <input 
              type="text" 
              value={neuralId} 
              onChange={(e) => setNeuralId(e.target.value)} 
              className="bg-transparent border-b border-slate-800 text-cyan-400 text-sm focus:outline-none focus:border-cyan-500 w-48 text-left md:text-right uppercase font-bold" 
            />
          </div>
        </header>

        {/* SIDEBAR: Operative Profile */}
        <div className="lg:col-span-4 space-y-6">
          <section className="cyber-card p-6 space-y-5">
            <div className="absolute -top-3 left-4 bg-slate-950 px-3 text-[10px] font-orbitron text-cyan-500 font-bold tracking-widest uppercase">Operative_ID</div>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Codename</label>
                  <input 
                    type="text" 
                    value={character.name}
                    onChange={(e) => setCharacter(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-900/50 border border-slate-800 px-3 py-3 text-xl font-orbitron text-white focus:border-cyan-500 transition-all uppercase"
                  />
                </div>
                <div className="w-16">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">N_Grade</label>
                  <input 
                    type="text" 
                    value={neuralGrade}
                    onChange={(e) => setNeuralGrade(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-800 px-3 py-3 text-xl font-orbitron text-cyan-500 focus:border-cyan-500 transition-all text-center font-black"
                    placeholder="1"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-2">Genetic_Sync</label>
                <div className="grid grid-cols-3 gap-2">
                  {[Gender.MALE, Gender.FEMALE, Gender.NON_BINARY].map((g) => (
                    <button key={g} onClick={() => setCharacter(prev => ({ ...prev, gender: g }))} className={`py-2 text-[10px] font-orbitron font-bold border transition-all ${character.gender === g ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-transparent text-slate-400 border-slate-800 hover:border-slate-600'}`}>{g}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-2">Class_Matrix</label>
                <div className="grid grid-cols-2 gap-2">
                  {LIFESTYLES.map((l) => (
                    <button key={l.id} onClick={() => handleLifestyleChange(l.id)} className={`py-2 text-[10px] font-orbitron font-bold border transition-all truncate px-2 ${character.lifestyleId === l.id ? 'bg-pink-600 text-white border-pink-400 neon-text-pink' : 'bg-slate-900/40 text-slate-500 border-slate-800'}`}>{l.name}</button>
                  ))}
                </div>
                {/* LIFESTYLE FEATS PANEL */}
                <div className="mt-4 p-3 bg-black/40 border border-slate-800/60 rounded-sm space-y-3">
                   <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1">
                     <span className="text-[9px] font-orbitron font-bold text-slate-500 uppercase">Class_Feats_Manifest</span>
                     <span className="text-[8px] font-mono text-slate-700">LVL_1</span>
                   </div>
                   <div className="space-y-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                           <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                           <span className="text-[9px] font-mono font-bold text-emerald-500 uppercase">Buff: {activeLifestyle.efficiency.label}</span>
                        </div>
                        <p className="text-[8px] font-mono text-slate-400 mt-0.5 ml-2.5 leading-tight">{activeLifestyle.efficiency.description}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                           <span className="w-1 h-1 bg-rose-500 rounded-full" />
                           <span className="text-[9px] font-mono font-bold text-rose-500 uppercase">Friction: {activeLifestyle.negative.label}</span>
                        </div>
                        <p className="text-[8px] font-mono text-slate-400 mt-0.5 ml-2.5 leading-tight">{activeLifestyle.negative.description}</p>
                      </div>
                      <div className="pt-1">
                        <div className="flex items-center gap-1.5">
                           <span className="w-1.5 h-1.5 bg-amber-500 rotate-45" />
                           <span className="text-[9px] font-orbitron font-bold text-amber-500 uppercase">Ability: {activeLifestyle.specialSkill.label}</span>
                        </div>
                        <p className="text-[9px] font-mono text-amber-200/60 mt-0.5 ml-3 leading-tight italic">{activeLifestyle.specialSkill.description}</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </section>

          {/* Derived Tactical Stats */}
          <section className="cyber-card p-5 space-y-4 bg-black/20">
             <div className="flex justify-between items-center border-b border-slate-800 pb-2">
               <h3 className="text-[10px] font-orbitron text-emerald-500 uppercase tracking-widest">Tactical_Calculations</h3>
               <span className="text-[8px] font-mono text-slate-600">RT_SYNC_V1.2</span>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-900/40 border border-slate-800 flex flex-col items-center">
                  <span className="text-[8px] font-mono text-slate-500 uppercase mb-1">Initiative</span>
                  <span className="text-2xl font-orbitron font-black text-white tabular-nums">+{derivedStats.initiative}</span>
                </div>
                <div className="p-3 bg-slate-900/40 border border-slate-800 flex flex-col items-center">
                  <span className="text-[8px] font-mono text-slate-500 uppercase mb-1">Stealth_Mod</span>
                  <span className="text-2xl font-orbitron font-black text-white tabular-nums">+{derivedStats.stealth}</span>
                </div>
             </div>
          </section>

          {/* Body Modification Section */}
          <section className="cyber-card p-5 space-y-4 bg-slate-900/40">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-orbitron text-pink-500 uppercase tracking-widest">Body_Modification</h3>
              <span className="text-[8px] font-mono text-slate-600">MODS_SYNCED: {Object.values(character.bodyMods).filter(v => v !== null).length}/4</span>
            </div>
            
            <div className="flex border-b border-slate-800">
              {(['Eyes', 'Core', 'Arms', 'Legs'] as BodyModCategory[]).map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setActiveModCategory(cat)}
                  className={`flex-1 py-1.5 text-[9px] font-orbitron font-bold transition-all ${activeModCategory === cat ? 'text-pink-500 border-b border-pink-500 bg-pink-500/5' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {BODY_MODS.filter(m => m.category === activeModCategory).map(mod => {
                const active = character.bodyMods[mod.category] === mod.id;
                return (
                  <button 
                    key={mod.id} 
                    onClick={() => equipBodyMod(mod)}
                    className={`w-full text-left p-2 border transition-all flex flex-col group ${active ? 'border-pink-500 bg-pink-500/10' : 'border-slate-800 bg-black/20 hover:border-slate-600'}`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className={`text-[10px] font-orbitron font-black uppercase ${active ? 'text-pink-400' : 'text-slate-300'}`}>{mod.name}</span>
                      {active && <span className="text-[8px] bg-pink-500 text-black px-1 font-bold">ONLINE</span>}
                    </div>
                    <div className="text-[8px] font-mono text-emerald-400 uppercase mt-1">Effect: {mod.effect}</div>
                    <div className="text-[7px] font-mono text-slate-500 leading-tight mt-1 group-hover:text-slate-400">{mod.description}</div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Desktop-only Wallet and Cache */}
          <div className="hidden lg:block space-y-6">
            {WalletComponent}
            {ActiveCacheComponent}
          </div>
        </div>

        {/* MAIN HUD COLUMN */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Vitals Monitoring */}
          <section className="cyber-card p-6 md:p-8">
            <div className="absolute top-4 right-6 text-[8px] font-mono text-slate-700 uppercase tracking-[0.4em]">Life_Support_v4.2</div>
            <h2 className="text-xl font-orbitron font-bold text-white uppercase tracking-widest mb-8 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-cyan-900" /> Biometrics <span className="flex-1 h-[1px] bg-cyan-900/30" />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: 'HP_Integrity', key: 'hp' as const, color: 'emerald', sub: 'Vital_Signal' },
                { label: 'Neural_Charge', key: 'chg' as const, color: 'cyan', sub: 'RAM_Load' },
                { label: 'Kinetic_Potential', key: 'phy' as const, color: 'amber', sub: 'Bio_Energy_Drive' }
              ].map((v) => (
                <div key={v.key} className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className={`text-[11px] font-black text-${v.color}-500 font-mono uppercase tracking-widest`}>{v.label}</span>
                      <span className="text-[8px] text-slate-600 font-mono uppercase font-bold">{v.sub}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-4xl font-orbitron font-black text-${v.color}-400`}>{character.vitals[v.key].current}</span>
                      <span className="text-xs text-slate-700 font-mono ml-1">/ {totalMax[v.key]}</span>
                    </div>
                  </div>
                  <div className="h-4 bg-black/40 border border-slate-800 relative shadow-inner overflow-hidden">
                    <div className={`h-full bg-${v.color}-500 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)]`} style={{ width: `${(character.vitals[v.key].current / totalMax[v.key]) * 100}%` }} />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-scan-fast pointer-events-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex gap-1">
                      <button onClick={() => updateVital(v.key, 'current', -1)} className="flex-1 py-1 bg-slate-900 border border-slate-800 text-slate-500 hover:text-white hover:bg-slate-800 transition-all">-</button>
                      <button onClick={() => updateVital(v.key, 'current', 1)} className="flex-1 py-1 bg-slate-900 border border-slate-800 text-slate-500 hover:text-white hover:bg-slate-800 transition-all">+</button>
                    </div>
                    <div className="flex items-center justify-center bg-black/40 border border-slate-800 text-[9px] font-mono text-slate-500 uppercase">
                      TEMP: {character.vitals[v.key].temp}
                      <button onClick={() => updateVital(v.key, 'temp', 1)} className="ml-2 text-emerald-500">+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Shield Rating Unit */}
            <div className="mt-8 p-6 bg-slate-900/60 border border-cyan-500/30 clip-path-cyber relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex flex-col items-center md:items-start text-center md:text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-cyan-400 rotate-45 shadow-[0_0_5px_#22d3ee]" />
                    <span className="text-[10px] font-orbitron font-black text-cyan-400 uppercase tracking-[0.3em]">Shield_Rating_System</span>
                  </div>
                  <p className="text-[8px] font-mono text-slate-500 uppercase max-w-xs leading-tight">Neural-mesh harmonic defense. Reduces incoming kinetic and energy damage via active interception.</p>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right flex flex-col items-center md:items-end">
                    <span className="text-[8px] font-mono text-cyan-500/50 uppercase mb-1">Calculated_Defense:</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-orbitron font-black text-white neon-text-cyan tabular-nums tracking-tighter">{shieldRating.total}</span>
                      <span className="text-xs font-orbitron font-bold text-cyan-600">SR</span>
                    </div>
                  </div>
                  <div className="hidden md:block w-[1px] h-12 bg-slate-800" />
                  <div className="hidden md:flex flex-col text-[8px] font-mono text-slate-600 uppercase gap-1">
                    <span className="text-slate-400">Formula_Sync:</span>
                    <code className="bg-black/40 px-2 py-1 border border-slate-800 text-cyan-500/80">{shieldRating.breakdown}</code>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent group-hover:animate-pulse" />
            </div>

            {/* Ripperdoc controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-10 pt-8 border-t border-slate-800/50">
               <button onClick={handleRipperdoc} disabled={character.eddies < 100} className="py-3 border border-emerald-900/50 bg-emerald-950/20 text-emerald-500 font-orbitron text-[10px] font-black uppercase hover:bg-emerald-600 hover:text-black transition-all disabled:opacity-20 group">
                 <span className="block mb-0.5">Ripper_Heal</span>
                 <span className="text-[8px] font-mono opacity-50 group-hover:opacity-100 tracking-tighter">Cost: ₩100</span>
               </button>
               <button onClick={handleChargeNC} disabled={character.eddies < 100} className="py-3 border border-cyan-900/50 bg-cyan-950/20 text-cyan-500 font-orbitron text-[10px] font-black uppercase hover:bg-cyan-500 hover:text-black transition-all disabled:opacity-20 group">
                 <span className="block mb-0.5">Charge_Sync</span>
                 <span className="text-[8px] font-mono opacity-50 group-hover:opacity-100 tracking-tighter">Cost: ₩100</span>
               </button>
               <button onClick={handleRestKP} className="py-3 border border-amber-900/50 bg-amber-950/20 text-amber-500 font-orbitron text-[10px] font-black uppercase hover:bg-amber-500 hover:text-black transition-all group">
                 <span className="block mb-0.5">Bio_Rest</span>
                 <span className="text-[8px] font-mono opacity-50 group-hover:opacity-100 tracking-tighter">Cost: FREE</span>
               </button>
            </div>
          </section>

          {/* Neural Matrix - Traits */}
          <section className="cyber-card p-4 md:p-8 overflow-hidden">
            <h2 className="text-xl font-orbitron font-bold text-white uppercase tracking-widest mb-8 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-pink-900" /> Neural_Matrix <span className="flex-1 h-[1px] bg-pink-900/30" />
            </h2>
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4 custom-scrollbar transition-all ${isTraitsComplete && !forceExpandTraits ? 'max-h-[320px] md:max-h-40' : 'max-h-[600px] overflow-y-auto'}`}>
              {displayTraits.map(t => {
                const active = character.selectedTraitIds.includes(t.id);
                if (isTraitsComplete && !forceExpandTraits && !active) return null;
                return (
                  <button key={t.id} onClick={() => toggleTrait(t.id)} className={`text-left p-3 md:p-4 border transition-all relative overflow-hidden group/trait ${active ? 'bg-pink-600/10 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.2)]' : 'bg-slate-900/40 border-slate-800 grayscale hover:grayscale-0 hover:border-slate-600 opacity-60 hover:opacity-100'}`}>
                    <div className="font-orbitron font-black uppercase tracking-tighter text-[11px] md:text-sm mb-1">{t.name}</div>
                    <div className="text-[8px] md:text-[9px] text-emerald-400 font-mono uppercase font-black leading-none mb-1">▲ {t.bonus}</div>
                    <div className="text-[8px] md:text-[9px] text-rose-500 font-mono uppercase font-black leading-none">▼ {t.penalty}</div>
                    {active && <div className="absolute top-0 right-0 w-5 h-5 md:w-6 md:h-6 bg-pink-500 clip-path-cyber flex items-center justify-center"><span className="text-black font-black text-[9px] md:text-[10px]">✓</span></div>}
                  </button>
                );
              })}
            </div>
            {isTraitsComplete && <button onClick={() => setForceExpandTraits(!forceExpandTraits)} className="mt-6 text-[10px] font-orbitron font-black text-slate-500 hover:text-cyan-400 uppercase tracking-widest transition-all flex items-center gap-2">
              <span className="w-4 h-4 border border-slate-800 flex items-center justify-center font-bold">{forceExpandTraits ? '-' : '+'}</span>
              {forceExpandTraits ? 'Neural_Link_Static' : 'Modify_Neural_Architecture'}
            </button>}
          </section>

          {/* Neural Combat Protocols - Skills */}
          <section className="cyber-card p-6 md:p-8 relative">
            <div className="absolute top-4 right-6 text-[8px] font-mono text-pink-500 uppercase tracking-[0.4em]">Combat_Protocols_v8.1</div>
            <h2 className="text-xl font-orbitron font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-pink-900" /> Neural_Combat_Protocols <span className="flex-1 h-[1px] bg-pink-900/30" />
            </h2>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-black/40 border border-slate-800 p-4 mb-8 gap-4">
              <div className="flex items-center gap-4">
                 <div className="flex flex-col">
                   <span className="text-[9px] font-mono text-slate-500 uppercase">Available_Neural_Points:</span>
                   <div className="text-3xl font-orbitron font-black text-pink-500 tabular-nums">{skillPointsData.remaining} / {skillPointsData.total} <span className="text-[10px] text-slate-600">NP</span></div>
                 </div>
              </div>
              <div className="text-[9px] font-mono text-slate-400 uppercase max-w-xs leading-relaxed italic pr-4 border-l border-slate-800 pl-4 hidden md:block">
                {skillPointsData.remaining === 0 
                  ? "INTERFACE_MINIMIZED: 0 NP AVAILABLE. INITIALIZED SKILLS PRIORITY." 
                  : "UPLINK_EXPANDED: SELECT PROTOCOLS FOR INITIALIZATION."}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 max-h-[800px] overflow-y-auto custom-scrollbar pr-2 transition-all">
              {displayedSkills.length > 0 ? displayedSkills.map(branch => {
                const currentLvl = character.unlockedSkills[branch.id] || 0;
                const nextLvl = currentLvl + 1;
                const canUpgrade = skillPointsData.remaining > 0 && nextLvl <= 5 && nextLvl <= skillPointsData.grade;
                const nextLvlInfo = branch.levels.find(l => l.level === nextLvl);

                return (
                  <div key={branch.id} className={`bg-slate-900/40 border p-4 group/skill hover:border-pink-500/40 transition-all flex flex-col h-full min-h-[220px] ${currentLvl > 0 ? 'border-pink-500/50' : 'border-slate-800'}`}>
                    <div className="flex flex-col mb-3">
                       <div className="flex justify-between items-start gap-2">
                          <h4 className={`text-xs md:text-sm font-orbitron font-black uppercase leading-tight ${currentLvl > 0 ? 'text-pink-400' : 'text-white'}`}>{branch.name}</h4>
                          <span className="text-[7px] font-mono text-slate-600 uppercase font-black shrink-0 mt-0.5">ID_{branch.id.substring(0,3).toUpperCase()}</span>
                       </div>
                    </div>
                    
                    {/* Level Indicator Pips */}
                    <div className="flex gap-1 mb-4">
                      {branch.levels.map(l => (
                        <div 
                          key={l.level} 
                          className={`flex-1 h-1.5 transition-all duration-300 ${
                            l.level <= currentLvl ? 'bg-pink-500 shadow-[0_0_5px_#ec4899]' : 
                            l.level === nextLvl && canUpgrade ? 'bg-pink-900/40 animate-pulse' : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>

                    <p className="text-[9px] font-mono text-slate-500 uppercase leading-tight h-8 overflow-hidden mb-4">{branch.description}</p>
                    
                    {/* Current / Next Level Display */}
                    <div className="bg-black/40 border border-slate-800 p-3 flex-1 mb-4">
                      {currentLvl > 0 ? (
                        <div className="mb-2">
                           <span className="text-[8px] font-mono text-emerald-500 uppercase font-bold block mb-0.5">Active_Effect (LVL_{currentLvl}):</span>
                           <p className="text-[9px] font-mono text-white leading-tight">{branch.levels[currentLvl - 1].effect}</p>
                        </div>
                      ) : (
                        <div className="mb-2 opacity-30">
                           <span className="text-[8px] font-mono text-slate-500 uppercase font-bold block mb-0.5">Inactive</span>
                           <p className="text-[9px] font-mono text-slate-600 leading-tight">No protocols engaged.</p>
                        </div>
                      )}
                      
                      {nextLvl <= 5 && skillPointsData.remaining > 0 && (
                        <div className={`mt-2 pt-2 border-t border-slate-800/50 ${!canUpgrade ? 'opacity-30' : ''}`}>
                          <span className="text-[8px] font-mono text-amber-500 uppercase font-bold block mb-0.5">Next_Uplink (LVL_{nextLvl}):</span>
                          <p className="text-[9px] font-mono text-slate-400 leading-tight italic">{nextLvlInfo?.effect}</p>
                          <div className="mt-1 flex justify-between text-[7px] font-mono uppercase">
                             <span className="text-amber-600">Cost: {nextLvlInfo?.cost}</span>
                             {nextLvl > skillPointsData.grade && <span className="text-rose-600">Requires N_Grade {nextLvl}</span>}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => upgradeSkill(branch.id)}
                        disabled={!canUpgrade}
                        className="flex-1 py-1.5 bg-pink-600 text-white text-[9px] font-orbitron font-black uppercase tracking-widest hover:bg-pink-500 disabled:opacity-10 transition-all"
                      >
                        {currentLvl === 0 ? 'Initialize' : 'Upgrade'}
                      </button>
                      {currentLvl > 0 && (
                        <button 
                          onClick={() => downgradeSkill(branch.id)}
                          className="px-3 py-1.5 bg-transparent border border-slate-800 text-slate-600 hover:text-rose-500 hover:border-rose-500 text-[9px] font-mono font-black uppercase transition-all"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                );
              }) : (
                <div className="col-span-full py-20 flex flex-col items-center justify-center border border-dashed border-slate-800 bg-black/20">
                   <div className="text-pink-500 font-orbitron font-black text-xs uppercase tracking-[0.3em] mb-2 animate-pulse">LINK_IDLE</div>
                   <div className="text-slate-600 font-mono text-[9px] uppercase tracking-widest">No active protocols detected. Gain N_Grade points to expand uplink.</div>
                </div>
              )}
            </div>
          </section>

          {/* Biometrics - Core Stats */}
          <section className="cyber-card p-6 md:p-8">
            <h2 className="text-xl font-orbitron font-bold text-white uppercase tracking-widest mb-8 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-cyan-900" /> Biometric_Core <span className="flex-1 h-[1px] bg-cyan-900/30" />
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              <StatBox label="Body" value={character.stats.body} externalModifier={externalModifiers.body} description="Strength, melee logic." onChange={(v) => handleStatChange('body', v)} canIncrease={pointsRemaining > 0} />
              <StatBox label="Dex" value={character.stats.dexterity} externalModifier={externalModifiers.dexterity} description="Reflex, ballistic evasion." onChange={(v) => handleStatChange('dexterity', v)} canIncrease={pointsRemaining > 0} />
              <StatBox label="Int" value={character.stats.intelligence} externalModifier={externalModifiers.intelligence} description="Neural, logic uplink." onChange={(v) => handleStatChange('intelligence', v)} canIncrease={pointsRemaining > 0} />
              <StatBox label="Cha" value={character.stats.charisma} externalModifier={externalModifiers.charisma} description="Manipulation, infiltration." onChange={(v) => handleStatChange('charisma', v)} canIncrease={pointsRemaining > 0} />
              <StatBox label="Con" value={character.stats.constitution} externalModifier={externalModifiers.constitution} description="Toughness, system stability." onChange={(v) => handleStatChange('constitution', v)} canIncrease={pointsRemaining > 0} />
            </div>
            <div className="mt-8 flex justify-end items-center gap-4">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Neural_Pool_Available:</div>
              <div className="text-3xl font-orbitron font-black text-cyan-400 tabular-nums">{pointsRemaining} <span className="text-xs text-slate-600">PTS</span></div>
            </div>
          </section>

          {/* Armory HUD */}
          <section className="cyber-card p-6 md:p-8 bg-tactical border-amber-500/20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
              <h2 className="text-2xl font-orbitron font-black text-white uppercase tracking-[0.2em] neon-text-cyan">Armory_Uplink</h2>
              <div className="flex w-full sm:w-auto">
                 <button 
                  onClick={() => setIsHackingOpen(true)} 
                  className="w-full sm:w-auto px-5 py-3 bg-amber-500/10 border border-amber-500/50 text-amber-500 font-orbitron text-[10px] font-black uppercase hover:bg-amber-500 hover:text-black transition-all text-center"
                 >
                  [ HACK_UPLINK ]
                 </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
              <div className="md:col-span-4 space-y-6 border-r border-slate-800 pr-8">
                <h3 className="text-[10px] font-orbitron text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Inventory_Matrix</h3>
                <div className="space-y-4">
                  {(['Firearm', 'Melee', 'Tech'] as WeaponCategory[]).map(cat => (
                    <div key={cat}>
                      <div className="text-[9px] font-mono text-cyan-500/60 uppercase mb-2 font-bold">{cat}</div>
                      <div className="space-y-1">
                        {WEAPON_BASES.filter(b => b.category === cat).map(base => {
                          const active = character.equippedWeapons.some(w => w.baseId === base.id);
                          return (
                            <button key={base.id} onClick={() => active ? unequipWeapon(base.id) : equipWeapon(base)} className={`w-full text-left px-3 py-2 border transition-all flex justify-between items-center group/btn ${active ? 'bg-cyan-500/10 border-cyan-500 text-cyan-100' : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:border-slate-600'}`}>
                              <span className="text-[10px] font-orbitron font-bold uppercase truncate">{base.name}</span>
                              <span className={`text-[8px] font-mono uppercase font-bold transition-opacity ${active ? 'text-cyan-400 animate-pulse' : 'opacity-0 group-hover/btn:opacity-100'}`}>{active ? 'SYNCED' : 'LINK'}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-8 space-y-6">
                <h3 className="text-[10px] font-orbitron text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Active_Combat_HUD</h3>
                {character.equippedWeapons.length === 0 ? (
                  <div className="h-60 flex flex-col items-center justify-center border border-dashed border-slate-800 opacity-30 italic font-mono text-xs text-slate-500">NO_HARDWARE_CONNECTED</div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {character.equippedWeapons.map(w => {
                      const base = WEAPON_BASES.find(b => b.id === w.baseId);
                      if (!base) return null;
                      const stats = getWeaponStats(w);
                      const isReloading = reloadingId === base.id;
                      const maxAmmo = (base.baseMag || 0) + (w.attachments?.magSize || 0);

                      return (
                        <div key={w.baseId} className="bg-slate-900/60 border border-slate-800 p-5 relative group/item overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-500/30 group-hover/item:bg-cyan-500/60" />
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <div className="flex items-center gap-3">
                                <h4 className="text-xl font-orbitron font-black text-white uppercase">{base.name}</h4>
                                <span className="text-[8px] px-2 py-0.5 bg-slate-800 text-slate-400 font-bold uppercase">{base.category}</span>
                              </div>
                              <p className="text-[10px] text-slate-500 uppercase font-mono mt-1">{base.description}</p>
                            </div>
                            <button onClick={() => unequipWeapon(base.id)} className="text-[8px] font-bold text-rose-500 hover:text-rose-400 uppercase tracking-widest bg-black/40 px-3 py-1 border border-rose-900/20">UNSYNC</button>
                          </div>

                          <div className="flex flex-col md:flex-row gap-10">
                             <div className="w-full md:w-1/2 space-y-4">
                               <div className="text-3xl font-orbitron font-black text-cyan-400">{stats.damage} <span className="text-[8px] text-slate-600 tracking-widest uppercase">POWER_LEVEL</span></div>
                               <div className="text-[11px] font-mono text-pink-400 uppercase tracking-[0.2em] font-black">Actions: {stats.attacks}x Shots / Turn</div>
                               {stats.hitBonus > 0 && <div className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest font-black">Accuracy_Bonus: +{stats.hitBonus}</div>}
                               {stats.effects.length > 0 && (
                                 <div className="space-y-1">
                                   {stats.effects.map((e, idx) => <div key={idx} className="text-[9px] font-mono text-amber-500 uppercase flex gap-2"><span className="shrink-0 text-amber-600">▶</span> {e}</div>)}
                                 </div>
                               )}
                             </div>
                             
                             <div className="flex-1 flex flex-col justify-end space-y-4">
                               {base.category === 'Firearm' && (
                                 <div className="space-y-4">
                                   <div className="flex justify-between items-end">
                                      <span className="text-[9px] font-mono text-slate-500 uppercase">Mag_Capacity</span>
                                      <span className={`text-2xl font-orbitron font-black tabular-nums ${isReloading ? 'text-amber-500 animate-pulse' : 'text-cyan-400'}`}>{isReloading ? 'SYNC' : w.currentAmmo} / {maxAmmo}</span>
                                   </div>
                                   <div className="h-1 bg-black/40 border border-slate-800 overflow-hidden relative">
                                     <div className={`h-full transition-all duration-500 ${isReloading ? 'bg-amber-500' : 'bg-cyan-500'}`} style={{ width: `${(w.currentAmmo/maxAmmo)*100}%` }} />
                                   </div>
                                   <div className="flex gap-2">
                                     <CyberButton onClick={() => useWeapon(w)} disabled={w.currentAmmo <= 0 || isReloading} className="flex-1 py-2 text-[9px]">ENGAGE</CyberButton>
                                     <button onClick={() => reloadWeapon(w)} disabled={isReloading} className="px-4 border border-slate-700 text-[9px] font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all uppercase">Reload</button>
                                   </div>
                                   <div className="grid grid-cols-2 gap-4 mt-2 pt-4 border-t border-slate-800/50">
                                      <div className="space-y-3">
                                        <div>
                                          <label className="text-[7px] text-slate-600 uppercase font-black block mb-1 tracking-widest">Ammunition_Matrix</label>
                                          <select 
                                            value={w.attachments?.ammoType}
                                            onChange={(e) => updateWeaponAttachment(base.id, 'ammoType', e.target.value)}
                                            className="bg-slate-950 text-[10px] text-cyan-400 border border-slate-800 px-2 py-1.5 w-full outline-none font-mono uppercase focus:border-cyan-500 transition-all"
                                          >
                                            {['Regular', 'Incendiary', 'Electric', 'Armor Piercing'].map(t => <option key={t} value={t}>{t}</option>)}
                                          </select>
                                        </div>
                                        <div>
                                          <label className="text-[7px] text-slate-600 uppercase font-black block mb-1 tracking-widest">Ocular_Uplink</label>
                                          <select 
                                            value={w.attachments?.sight}
                                            onChange={(e) => updateWeaponAttachment(base.id, 'sight', e.target.value)}
                                            className="bg-slate-950 text-[10px] text-cyan-400 border border-slate-800 px-2 py-1.5 w-full outline-none font-mono uppercase focus:border-cyan-500 transition-all"
                                          >
                                            {['None', 'Red Dot', '2x', '4x', 'Thermal', 'Smart Link'].map(s => <option key={s} value={s}>{s}</option>)}
                                          </select>
                                        </div>
                                      </div>
                                      <div className="space-y-3">
                                        <div>
                                          <label className="text-[7px] text-slate-600 uppercase font-black block mb-1 tracking-widest">Muzzle_Modular</label>
                                          <select 
                                            value={w.attachments?.muzzle}
                                            onChange={(e) => updateWeaponAttachment(base.id, 'muzzle', e.target.value)}
                                            className="bg-slate-950 text-[10px] text-cyan-400 border border-slate-800 px-2 py-1.5 w-full outline-none font-mono uppercase focus:border-cyan-500 transition-all"
                                          >
                                            {['None', 'Suppressor', 'Compensator', 'Ported Barrel'].map(m => <option key={m} value={m}>{m}</option>)}
                                          </select>
                                        </div>
                                        <div>
                                          <label className="text-[7px] text-slate-600 uppercase font-black block mb-1 tracking-widest">Mag_Expansion</label>
                                          <select 
                                            value={w.attachments?.magSize}
                                            onChange={(e) => updateWeaponAttachment(base.id, 'magSize', parseInt(e.target.value))}
                                            className="bg-slate-950 text-[10px] text-cyan-400 border border-slate-800 px-2 py-1.5 w-full outline-none font-mono focus:border-cyan-500 transition-all"
                                          >
                                            {[0, 2, 4, 6, 12].map(v => <option key={v} value={v}>CAPACITY {v > 0 ? `+${v}` : 'STD'}</option>)}
                                          </select>
                                        </div>
                                      </div>
                                   </div>
                                 </div>
                               )}
                               {base.category === 'Tech' && (
                                 <div className="space-y-3">
                                    <div className="text-[9px] font-mono text-slate-500 uppercase flex justify-between"><span>Base_Cost</span> <span>{base.chgCost} NC | {base.phyCost || 0} KP</span></div>
                                    <div className="flex flex-col gap-2">
                                      <CyberButton onClick={() => useWeapon(w)} disabled={character.vitals.chg.current < (base.chgCost || 0)} className="w-full py-2 text-[9px]">BASIC_ACTUATION</CyberButton>
                                      {base.id === 'monowire' && (
                                        <CyberButton onClick={() => useWeapon(w, true)} disabled={character.vitals.chg.current < 14} variant="danger" className="w-full py-1.5 text-[8px]">STEALTH DECAPITATE (14 NC)</CyberButton>
                                      )}
                                      {(base.id === 'mantis-blades' || base.id === 'gorilla-arms') && (
                                        <CyberButton onClick={() => useWeapon(w, true)} disabled={character.vitals.chg.current < (base.chgCost || 0)} variant="danger" className="w-full py-1.5 text-[8px]">DISMEMBER / OVERPOWER</CyberButton>
                                      )}
                                    </div>
                                 </div>
                               )}
                               {base.category === 'Melee' && (
                                 <div className="space-y-3">
                                    <div className="text-[9px] font-mono text-slate-500 uppercase text-right">Tactical_Melee_Link</div>
                                    <div className="flex flex-col gap-2">
                                      {base.id === 'blunt' && (
                                        <CyberButton onClick={() => useWeapon(w, true)} disabled={character.vitals.phy.current < 4} variant="danger" className="w-full py-2 text-[9px]">OVERPOWER (4 KP)</CyberButton>
                                      )}
                                      {base.id === 'blade' && (
                                        <CyberButton onClick={() => useWeapon(w, true)} disabled={character.vitals.phy.current < 6} variant="danger" className="w-full py-2 text-[9px]">DISMEMBER (6 KP)</CyberButton>
                                      )}
                                      {base.id === 'energy-melee' && (
                                        <p className="text-[10px] text-cyan-500/60 font-mono text-center italic">Energy oscillation active.</p>
                                      )}
                                    </div>
                                 </div>
                               )}
                             </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Tactical Consumables */}
          <section className="cyber-card p-6 md:p-8">
            <h2 className="text-xl font-orbitron font-bold text-white uppercase tracking-widest mb-8 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-emerald-900" /> Tactical_Supplies <span className="flex-1 h-[1px] bg-emerald-900/30" />
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {CONSUMABLES.map(c => (
                <div key={c.id} className="bg-slate-900/40 border border-slate-800 p-5 group/cons flex flex-col hover:border-emerald-500/40 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0">
                      <div className="text-sm font-orbitron font-black text-white uppercase truncate">{c.name}</div>
                      <div className="text-[8px] font-mono text-slate-500 uppercase mt-1">{c.effect}</div>
                    </div>
                    <div className="text-2xl font-orbitron font-black text-emerald-400 tabular-nums">x{character.consumables[c.id] || 0}</div>
                  </div>
                  <div className="mt-auto space-y-3">
                    <div className="flex gap-1">
                      <button onClick={() => adjustConsumable(c.id, -1)} className="flex-1 py-1 bg-slate-950 border border-slate-800 text-slate-600 hover:text-rose-500 transition-all">-</button>
                      <button onClick={() => adjustConsumable(c.id, 1)} className="flex-1 py-1 bg-slate-950 border border-slate-800 text-slate-600 hover:text-emerald-500 transition-all">+</button>
                    </div>
                    <CyberButton onClick={() => useConsumable(c)} disabled={!character.consumables[c.id]} className="w-full py-2 text-[9px]" variant="primary">Deploy_Asset</CyberButton>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Mobile-only Wallet and Cache */}
          <div className="block lg:hidden space-y-6">
            {WalletComponent}
            {ActiveCacheComponent}
          </div>

          {/* System Integrity footer buttons */}
          <section className="cyber-card p-6 bg-slate-950/80 mt-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button onClick={() => {
                const blob = new Blob([JSON.stringify({character, neuralId})], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = `NEON-V-${character.name}.json`; a.click();
              }} className="py-2 px-4 border border-cyan-500/20 text-cyan-500 font-orbitron text-[9px] font-bold uppercase hover:bg-cyan-500 hover:text-black transition-all">Archive_Data</button>
              
              <button onClick={() => fileInputRef.current?.click()} className="py-2 px-4 border border-pink-500/20 text-pink-500 font-orbitron text-[9px] font-bold uppercase hover:bg-pink-500 hover:text-black transition-all">Link_Archive</button>
              
              <button onClick={handleClear} className="py-2 px-4 border border-rose-500/20 text-rose-500 font-orbitron text-[9px] font-bold uppercase hover:bg-rose-500 hover:text-white transition-all">Neural_Purge</button>
              <input type="file" ref={fileInputRef} onChange={(e) => {
                const f = e.target.files?.[0]; if (!f) return;
                const r = new FileReader(); r.onload = (ev) => {
                  try { 
                    const d = JSON.parse(ev.target?.result as string); 
                    setCharacter(sanitizeCharacterData(d.character)); 
                    setNeuralId(d.neuralId || 'NC-SYNC-' + Math.floor(10000 + Math.random() * 89999)); 
                  } catch { alert("CORRUPT_ARCHIVE"); }
                }; r.readAsText(f);
              }} className="hidden" accept=".json" />
            </div>
          </section>
        </div>
      </main>

      <footer className="mt-20 pb-10 text-center text-slate-700 text-[10px] font-mono uppercase tracking-[0.5em] opacity-30">
        Design_Protocol_NV-2077 // All_Neural_Rights_Reserved
      </footer>
    </div>
  );
};

export default App;
