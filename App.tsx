
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
  Consumable
} from './types.ts';
import { INITIAL_STATS, MAX_STAT_POINTS, LIFESTYLES, TRAITS, WEAPON_BASES, CONSUMABLES } from './constants.tsx';
import CyberButton from './components/CyberButton.tsx';
import StatBox from './components/StatBox.tsx';

const STORAGE_KEY = 'NEON_VALLEY_CHARACTER_DATA';

const App: React.FC = () => {
  const [character, setCharacter] = useState<Character>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved character", e);
      }
    }
    return {
      name: 'UNREGISTERED_ENTITY',
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
      consumables: {
        'max-doc': 0,
        'ram-jolt': 0,
        'adrenaline-shot': 0
      },
      eddies: 150,
      memos: []
    };
  });

  const [neuralId, setNeuralId] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_ID');
    return saved || 'NC-2077-' + Math.floor(1000 + Math.random() * 9000);
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [memoInput, setMemoInput] = useState('');
  const [forceExpandTraits, setForceExpandTraits] = useState(false);
  const [lastRoll, setLastRoll] = useState<number | null>(null);

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(character));
    localStorage.setItem(STORAGE_KEY + '_ID', neuralId);
  }, [character, neuralId]);

  const activeLifestyle = useMemo(() => 
    LIFESTYLES.find(l => l.id === character.lifestyleId) || LIFESTYLES[0],
    [character.lifestyleId]
  );

  const pointsUsed = useMemo(() => {
    const s = character.stats;
    return s.body + s.dexterity + s.intelligence + s.charisma + s.constitution;
  }, [character.stats]);

  const pointsRemaining = MAX_STAT_POINTS - pointsUsed;

  const displayTraits = useMemo(() => {
    return [...TRAITS].sort((a, b) => {
      const aSelected = character.selectedTraitIds.includes(a.id) ? 1 : 0;
      const bSelected = character.selectedTraitIds.includes(b.id) ? 1 : 0;
      return bSelected - aSelected;
    });
  }, [character.selectedTraitIds]);

  const isTraitsComplete = character.selectedTraitIds.length === 3;

  const maxValues = useMemo(() => {
    let hpMod = 0;
    let chgMod = 0;

    if (character.selectedTraitIds.includes('net-runner')) hpMod -= 5;
    if (character.selectedTraitIds.includes('scavenger')) hpMod -= 4;
    if (character.selectedTraitIds.includes('hardened')) hpMod += 10;
    if (character.selectedTraitIds.includes('cyber-junkie')) chgMod += 5;

    return {
      hp: 10 + (character.stats.constitution * 5) + hpMod,
      chg: 10 + (character.stats.intelligence * 2) + chgMod,
      phy: 10 + (character.stats.body * 2)
    };
  }, [character.stats, character.selectedTraitIds]);

  const totalMax = useMemo(() => ({
    hp: maxValues.hp + character.vitals.hp.temp,
    chg: maxValues.chg + character.vitals.chg.temp,
    phy: maxValues.phy + character.vitals.phy.temp
  }), [maxValues, character.vitals]);

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

  const updateEddies = (delta: number) => {
    setCharacter(prev => ({ ...prev, eddies: Math.max(0, prev.eddies + delta) }));
  };

  const handleLifestyleChange = (lifestyleId: string) => {
    const lifestyle = LIFESTYLES.find(l => l.id === lifestyleId);
    if (!lifestyle) return;
    
    setCharacter(prev => ({ 
      ...prev, 
      lifestyleId, 
      eddies: lifestyle.startingEddies,
      consumables: {
        'max-doc': 0,
        'ram-jolt': 0,
        'adrenaline-shot': 0
      }
    }));
  };

  const handleRipperdoc = () => {
    if (character.eddies >= 100) {
      updateVital('hp', 'current', totalMax.hp - character.vitals.hp.current);
      updateEddies(-100);
    }
  };

  const handleChargeNC = () => {
    if (character.eddies >= 100) {
      updateVital('chg', 'current', totalMax.chg - character.vitals.chg.current);
      updateEddies(-100);
    }
  };

  const handleRestKP = () => {
    updateVital('phy', 'current', totalMax.phy - character.vitals.phy.current);
  };

  const toggleTrait = (traitId: string) => {
    setCharacter(prev => {
      const isSelected = prev.selectedTraitIds.includes(traitId);
      if (isSelected) return { ...prev, selectedTraitIds: prev.selectedTraitIds.filter(id => id !== traitId) };
      if (prev.selectedTraitIds.length < 3) return { ...prev, selectedTraitIds: [...prev.selectedTraitIds, traitId] };
      return prev;
    });
  };

  const equipWeapon = (base: WeaponBase) => {
    setCharacter(prev => {
      const exists = prev.equippedWeapons.find(w => w.baseId === base.id);
      if (exists) return prev;
      const newWeapon: EquippedWeapon = {
        baseId: base.id,
        currentAmmo: base.baseMag || 0,
        attachments: base.category === 'Firearm' ? { ammoType: 'Regular', magSize: 0, sight: 'None' } : undefined
      };
      return { ...prev, equippedWeapons: [...prev.equippedWeapons, newWeapon] };
    });
  };

  const unequipWeapon = (baseId: string) => {
    setCharacter(prev => ({ ...prev, equippedWeapons: prev.equippedWeapons.filter(w => w.baseId !== baseId) }));
  };

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
        setCharacter(prev => ({
          ...prev,
          equippedWeapons: prev.equippedWeapons.map(w => 
            w.baseId === weapon.baseId ? { ...w, currentAmmo: Math.max(0, w.currentAmmo - 1) } : w
          )
        }));
      }
    } else if (base.category === 'Tech') {
      let chgCost = base.chgCost || 0;
      let phyCost = base.phyCost || 0;

      if (base.id === 'monowire' && isSpecial) {
        chgCost = 14;
        phyCost = 0;
      }
      
      if (base.id === 'mantis-blades' && isSpecial) {
        chgCost = 6;
        phyCost = 6;
      }

      if (character.vitals.chg.current >= chgCost && character.vitals.phy.current >= phyCost) {
        updateVital('chg', 'current', -chgCost);
        updateVital('phy', 'current', -phyCost);
      }
    } else if (base.category === 'Melee') {
      if (base.id === 'blunt' && isSpecial) {
        if (character.vitals.phy.current >= 4) {
          updateVital('phy', 'current', -4);
        }
      } else if (base.id === 'blade' && isSpecial) {
        if (character.vitals.phy.current >= 6) {
          updateVital('phy', 'current', -6);
        }
      }
    }
  };

  const reloadWeapon = (weapon: EquippedWeapon) => {
    const base = WEAPON_BASES.find(b => b.id === weapon.baseId);
    if (!base || base.category !== 'Firearm') return;
    const magBonus = weapon.attachments?.magSize || 0;
    const maxAmmo = (base.baseMag || 0) + magBonus;
    setCharacter(prev => ({
      ...prev,
      equippedWeapons: prev.equippedWeapons.map(w => 
        w.baseId === weapon.baseId ? { ...w, currentAmmo: maxAmmo } : w
      )
    }));
  };

  const useConsumable = (cons: Consumable) => {
    const count = character.consumables[cons.id] || 0;
    if (count <= 0) return;

    if (cons.id === 'max-doc') {
      const roll = Math.floor(Math.random() * 20) + 1;
      setLastRoll(roll);
      updateVital('hp', 'current', roll);
    } else if (cons.id === 'ram-jolt') {
      updateVital('chg', 'current', 5);
    } else if (cons.id === 'adrenaline-shot') {
      updateVital('phy', 'current', 5);
    }

    setCharacter(prev => ({
      ...prev,
      consumables: {
        ...prev.consumables,
        [cons.id]: count - 1
      }
    }));
  };

  const adjustConsumable = (consId: string, delta: number) => {
    setCharacter(prev => ({
      ...prev,
      consumables: {
        ...prev.consumables,
        [consId]: Math.max(0, (prev.consumables[consId] || 0) + delta)
      }
    }));
  };

  const handleGenderChange = (gender: Gender) => {
    setCharacter(prev => ({ ...prev, gender }));
  };

  const addMemo = () => {
    if (!memoInput.trim()) return;
    setCharacter(prev => ({
      ...prev,
      memos: [memoInput.trim(), ...prev.memos]
    }));
    setMemoInput('');
  };

  const removeMemo = (index: number) => {
    setCharacter(prev => ({
      ...prev,
      memos: prev.memos.filter((_, i) => i !== index)
    }));
  };

  const getWeaponStats = (weapon: EquippedWeapon) => {
    const base = WEAPON_BASES.find(b => b.id === weapon.baseId);
    if (!base) return { damage: '0', hitBonus: 0, effects: [] };

    let damage = base.damage;
    let hitBonus = 0;
    const effects: string[] = [];

    if (base.id === 'blunt') {
      effects.push('Special: Spend 4 KP to double Damage Output');
    } else if (base.id === 'blade') {
      effects.push('Passive: Nat 20 = Dismember Limb');
      effects.push('Special: Spend 6 KP to Dismember Limb');
    } else if (base.id === 'mantis-blades') {
      effects.push('Passive: Nat 20 = Dismember Limb');
      effects.push('Special: Spend 6 KP + 6 NC to Dismember Limb');
    } else if (base.id === 'monowire') {
      effects.push('Stealth: Spend 14 NC to Decapitate');
    }

    if (weapon.attachments) {
      if (weapon.attachments.ammoType === 'Incendiary') {
        damage += ' + 1d4 (Burn)';
      } else if (weapon.attachments.ammoType === 'Electric') {
        damage += ' + 1d4 (Elec)';
        effects.push('1 in 6 chance: Tech Shutdown');
      }

      if (weapon.attachments.sight === 'Red Dot') hitBonus = 1;
      if (weapon.attachments.sight === '2x') hitBonus = 2;
      if (weapon.attachments.sight === '4x') hitBonus = 3;
      if (weapon.attachments.sight === 'Thermal') {
        effects.push('Optics: See through walls/objects');
      }
    }

    return { damage, hitBonus, effects };
  };

  const handleExport = () => {
    const data = {
      character,
      neuralId,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NEON-VALLEY-${character.name.replace(/\s+/g, '_') || 'UNTITLED'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.character) {
          setCharacter(data.character);
          if (data.neuralId) setNeuralId(data.neuralId);
          alert("Neural Archive Loaded Successfully.");
        }
      } catch (err) {
        console.error("Failed to load archive", err);
        alert("CRITICAL ERROR: Data corruption detected in source archive.");
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClear = () => {
    if (window.confirm("WARNING: Purging active neural link will wipe all unsaved data. Proceed?")) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY + '_ID');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-3 md:p-8 font-rajdhani relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 shadow-[0_0_15px_#06b6d4]" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-pink-500 shadow-[0_0_15px_#ec4899]" />
        <div className="scanline" />
      </div>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 relative z-10">
        <header className="lg:col-span-12 flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-slate-800 pb-4 mb-4 gap-4 overflow-hidden">
          <div className="flex flex-col w-full md:w-auto">
            <h1 className="text-3xl sm:text-4xl md:text-7xl font-orbitron font-black text-white neon-text-cyan flex items-center gap-3 uppercase flex-wrap">
              NEON_VALLEY <span className="text-[10px] md:text-sm bg-cyan-500 text-black px-2 py-0.5 rounded-sm whitespace-nowrap">V.2.5.0</span>
            </h1>
            <p className="text-cyan-400 font-mono text-xs md:text-base tracking-tighter uppercase truncate">Protocol: P@ND4 Neural System MK. P1PB01</p>
          </div>
          <div className="text-left md:text-right flex flex-col items-start md:items-end gap-1 w-full md:w-auto">
             <div className="text-slate-500 font-mono text-[10px] md:text-xs uppercase tracking-widest whitespace-nowrap">Neural_ID: <input type="text" value={neuralId} onChange={(e) => setNeuralId(e.target.value)} className="bg-transparent border-b border-slate-800 text-cyan-400 focus:outline-none focus:border-cyan-500 w-24 md:w-32 ml-1" /></div>
             <div className="text-slate-500 font-mono text-[9px] md:text-xs truncate">LOC: Night City / Sector 7 // IP: 192.168.0.254</div>
          </div>
        </header>

        {/* Character Info Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-slate-900/80 border-t-2 border-cyan-500 p-4 md:p-6 relative">
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-orbitron text-cyan-500 uppercase mb-1 tracking-wider">Entity Name</label>
                <input 
                  type="text" 
                  value={character.name}
                  onChange={(e) => setCharacter(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-800 border-b border-slate-600 px-3 py-2 text-xl md:text-2xl font-orbitron text-white focus:outline-none focus:border-cyan-400 transition-all uppercase truncate"
                />
              </div>
              <div>
                <label className="block text-xs font-orbitron text-cyan-500 uppercase mb-2 tracking-wider">Gender Identification</label>
                <div className="grid grid-cols-3 gap-1 md:gap-2">
                  {[Gender.MALE, Gender.FEMALE, Gender.NON_BINARY].map((g) => (
                    <button key={g} onClick={() => handleGenderChange(g)} className={`py-2 text-[10px] md:text-sm border transition-all truncate px-1 ${character.gender === g ? 'bg-cyan-500 text-black border-cyan-400 font-bold' : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500'}`}>{g}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-orbitron text-pink-500 uppercase mb-2 tracking-wider">Lifestyle Select</label>
                <div className="grid grid-cols-2 gap-1 md:gap-2">
                  {LIFESTYLES.map((l) => (
                    <button key={l.id} onClick={() => handleLifestyleChange(l.id)} className={`py-2 md:py-3 text-[10px] font-orbitron border transition-all uppercase tracking-widest truncate px-1 ${character.lifestyleId === l.id ? 'bg-pink-500 text-black border-pink-400 shadow-[0_0_10px_#ec4899]' : 'bg-slate-800/50 text-slate-400 border-slate-700'}`}>{l.name}</button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Data Integrity Section (Save/Load) */}
          <section className="bg-slate-900/80 border border-slate-800 p-4 space-y-3 relative group">
            <div className="text-[10px] font-orbitron text-cyan-500 uppercase tracking-widest border-b border-cyan-900/30 pb-1">System_Integrity</div>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={handleExport}
                className="py-2 px-3 bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 text-[10px] font-orbitron hover:bg-cyan-500 hover:text-black transition-all uppercase tracking-widest"
              >
                Save_Backup
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="py-2 px-3 bg-pink-500/10 border border-pink-500/50 text-pink-400 text-[10px] font-orbitron hover:bg-pink-500 hover:text-black transition-all uppercase tracking-widest"
              >
                Load_Archive
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImport} 
                accept=".json" 
                className="hidden" 
              />
            </div>
            <button 
              onClick={handleClear}
              className="w-full py-1.5 bg-rose-950/20 border border-rose-900/30 text-rose-800 text-[9px] font-mono hover:text-rose-400 hover:border-rose-700 transition-all uppercase tracking-widest"
            >
              Purge_Neural_Link
            </button>
          </section>

          <section className="bg-slate-900/50 p-4 border border-slate-800 space-y-3 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-pink-500 opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="text-[10px] font-orbitron text-pink-500 uppercase tracking-widest border-b border-pink-900/30 pb-1">Lifestyle_Parameters</div>
            <div className="space-y-3">
              <div>
                <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-tighter mb-0.5">{activeLifestyle.efficiency.label}</div>
                <div className="text-[10px] text-slate-400 leading-tight uppercase font-mono break-words">{activeLifestyle.efficiency.description}</div>
              </div>
              <div>
                <div className="text-[11px] font-bold text-rose-400 uppercase tracking-tighter mb-0.5">{activeLifestyle.negative.label}</div>
                <div className="text-[10px] text-slate-400 leading-tight uppercase font-mono break-words">{activeLifestyle.negative.description}</div>
              </div>
              <div className="bg-pink-500/5 p-2 border-l-2 border-pink-500/30 mt-2">
                <div className="text-[11px] font-bold text-pink-400 uppercase tracking-tighter mb-0.5">{activeLifestyle.specialSkill.label}</div>
                <div className="text-[10px] text-slate-300 leading-tight uppercase font-mono break-words">{activeLifestyle.specialSkill.description}</div>
              </div>
            </div>
          </section>

          <section className="bg-slate-900/80 border border-slate-800 p-4 flex flex-col gap-2 relative group">
            <div className="absolute top-0 right-0 w-12 h-12 bg-cyan-500/5 clip-path-cyber pointer-events-none" />
            <div className="flex justify-between items-center">
              <label className="text-[10px] md:text-xs font-orbitron text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
                Eurodollars (₩)
              </label>
              <div className="text-[9px] text-slate-500 font-mono uppercase">Status: Solvent</div>
            </div>
            <div className="flex items-center gap-2 md:gap-4 bg-black/60 p-3 md:p-4 border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-5 bg-[linear-gradient(90deg,transparent_0%,rgba(6,182,212,1)_50%,transparent_100%)] bg-[length:200%_100%] animate-scan" />
              <span className="text-xl md:text-3xl font-orbitron font-black text-white neon-text-cyan tabular-nums tracking-tighter shrink-0">₩ {character.eddies.toLocaleString()}</span>
              <div className="flex flex-col gap-1 md:gap-2 ml-auto shrink min-w-0">
                <div className="flex flex-wrap justify-end gap-1">
                  {[100, 50, 10].map(val => (
                    <button 
                      key={`sub-${val}`} 
                      onClick={() => updateEddies(-val)} 
                      className="px-1 md:px-2 py-0.5 text-[8px] md:text-[9px] bg-slate-900/80 border border-rose-900/50 hover:bg-rose-900 hover:text-white transition-all uppercase font-mono text-rose-500"
                    >-{val}</button>
                  ))}
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  {[10, 50, 100].map(val => (
                    <button 
                      key={`add-${val}`} 
                      onClick={() => updateEddies(val)} 
                      className="px-1 md:px-2 py-0.5 text-[8px] md:text-[9px] bg-slate-900/80 border border-cyan-900/50 hover:bg-cyan-900 hover:text-white transition-all uppercase font-mono text-cyan-500"
                    >+{val}</button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Random Access Memory - Renamed section */}
          <section className="bg-slate-900/80 border border-slate-800 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-4">
            <h2 className="text-sm font-orbitron font-bold text-amber-500 uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="w-4 h-4 bg-amber-500/10 border border-amber-500 flex items-center justify-center">!</span>
              Random Access Memory
            </h2>
            <div className="flex flex-col gap-2">
              <textarea 
                value={memoInput} 
                onChange={(e) => setMemoInput(e.target.value)} 
                placeholder="Buffer new data segment..."
                className="w-full bg-black/60 border border-slate-800 p-3 text-xs font-mono text-amber-400/80 outline-none focus:border-amber-500/50 min-h-[100px] resize-none"
              />
              <CyberButton onClick={addMemo} variant="secondary" className="text-[10px] md:text-xs py-2 px-3">Inject_Memory_Buffer</CyberButton>
            </div>
            <div className="space-y-3 max-h-[800px] overflow-y-auto pr-1 custom-scrollbar">
              {character.memos.length === 0 ? (
                <div className="text-[10px] text-slate-700 font-mono uppercase italic text-center py-8">RAM cache empty. No active buffers.</div>
              ) : (
                character.memos.map((memo, idx) => (
                  <div key={idx} className="bg-black/40 border border-slate-800 p-3 md:p-4 group relative hover:border-slate-600 transition-all border-l-2 border-l-amber-500/30 overflow-hidden">
                    <button onClick={() => removeMemo(idx)} className="absolute top-1 right-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 text-rose-500 hover:text-rose-400 text-[10px] transition-all font-bold px-1">[PURGE]</button>
                    <p className="text-[10px] md:text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed break-words overflow-hidden">{memo}</p>
                    <div className="text-[8px] text-slate-600 font-mono mt-3 uppercase tracking-tighter flex justify-between">
                      <span className="truncate">Memory_Segment_{idx}</span>
                      <span className="opacity-40 shrink-0">CRC_STABLE</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Main Dashboard Column */}
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-slate-900 border-t-2 border-cyan-500 p-4 md:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <h2 className="text-[10px] md:text-sm font-orbitron font-bold text-cyan-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
              <span className="w-4 md:w-8 h-[1px] bg-cyan-900" />
              Neural_Monitor_v4.2
              <span className="flex-1 h-[1px] bg-cyan-900" />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-6">
              {[
                { label: 'HP_Stability', key: 'hp' as const, color: 'emerald', desc: 'Survivability.' },
                { label: 'Neural_Charge', key: 'chg' as const, color: 'cyan', desc: 'Tech/Hardware energy.' },
                { label: 'Kinetic_Potential', key: 'phy' as const, color: 'amber', desc: 'Bio-mechanical exertion.' }
              ].map((vital) => (
                <div key={vital.key} className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col max-w-[60%]">
                      <span className={`text-[10px] md:text-xs text-${vital.color}-500 font-mono uppercase font-bold tracking-widest truncate`}>{vital.label}</span>
                      <span className="text-[9px] md:text-[10px] text-slate-500 font-mono uppercase tracking-tighter truncate">{vital.desc}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-3xl md:text-4xl font-orbitron font-black text-${vital.color}-400 drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]`}>{character.vitals[vital.key].current}</span>
                      <span className="text-xs md:text-sm text-slate-500 font-mono ml-1 md:ml-2">/ {totalMax[vital.key]}</span>
                    </div>
                  </div>
                  <div className="h-3 md:h-4 bg-slate-950 border border-slate-800 relative overflow-hidden flex shadow-inner">
                    <div className={`h-full bg-${vital.color}-500 shadow-[0_0_15px_#${vital.color === 'cyan' ? '06b6d4' : vital.color === 'emerald' ? '10b981' : 'f59e0b'}] transition-all duration-700 ease-out`} style={{ width: `${(character.vitals[vital.key].current / Math.max(1, totalMax[vital.key])) * 100}%` }} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="flex gap-1">
                      <button onClick={() => updateVital(vital.key, 'current', -1)} className="flex-1 h-8 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-all active:scale-95">-</button>
                      <button onClick={() => updateVital(vital.key, 'current', 1)} className="flex-1 h-8 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-all active:scale-95">+</button>
                    </div>
                    <div className="flex gap-1 items-center bg-black/40 px-2 md:px-3 border border-slate-800 text-[9px] md:text-xs font-mono text-slate-400 truncate">
                      <span className="opacity-50">TMP:</span> {character.vitals[vital.key].temp}
                      <button onClick={() => updateVital(vital.key, 'temp', 1)} className="ml-auto text-emerald-500 hover:text-emerald-300">+</button>
                      <button onClick={() => updateVital(vital.key, 'temp', -1)} className="ml-1 text-rose-500 hover:text-rose-300">-</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4 pt-4 border-t border-slate-800/50">
              <button 
                onClick={handleRipperdoc} 
                disabled={character.eddies < 100}
                className="group relative flex flex-col items-center justify-center py-2 md:py-3 px-2 md:px-4 border border-emerald-900/50 bg-emerald-950/20 hover:bg-emerald-900/40 hover:border-emerald-500 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
              >
                <span className="text-[9px] md:text-[10px] font-orbitron font-bold text-emerald-500 uppercase tracking-widest">RIPPERDOC</span>
                <span className="text-[8px] md:text-[9px] font-mono text-emerald-600 uppercase">Heal Full // ₩100</span>
              </button>
              <button 
                onClick={handleChargeNC} 
                disabled={character.eddies < 100}
                className="group relative flex flex-col items-center justify-center py-2 md:py-3 px-2 md:px-4 border border-cyan-900/50 bg-cyan-950/20 hover:bg-cyan-900/40 hover:border-cyan-500 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
              >
                <span className="text-[9px] md:text-[10px] font-orbitron font-bold text-cyan-500 uppercase tracking-widest">RECHARGE NC</span>
                <span className="text-[8px] md:text-[9px] font-mono text-emerald-600 uppercase">Charge Full // ₩100</span>
              </button>
              <button 
                onClick={handleRestKP} 
                className="group relative flex flex-col items-center justify-center py-2 md:py-3 px-2 md:px-4 border border-amber-900/50 bg-amber-950/20 hover:bg-amber-900/40 hover:border-amber-500 transition-all active:scale-95"
              >
                <span className="text-[9px] md:text-[10px] font-orbitron font-bold text-amber-500 uppercase tracking-widest">RESTORE KP</span>
                <span className="text-[8px] md:text-[9px] font-mono text-amber-600 uppercase">Full Rest // FREE</span>
              </button>
            </div>
          </section>

          <section className="bg-slate-900/50 p-4 md:p-6 border-l-4 border-pink-500 shadow-[0_4px_20px_rgba(0,0,0,0.3)] overflow-hidden">
            <h2 className="text-xl md:text-2xl font-orbitron font-bold text-white neon-text-pink uppercase mb-6 tracking-widest flex items-center gap-4">
              Neural_Matrix
              <span className="h-[2px] flex-1 bg-gradient-to-r from-pink-900/50 to-transparent" />
            </h2>
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 transition-all scrollbar-thin overflow-y-auto pr-1 md:pr-2 ${isTraitsComplete && !forceExpandTraits ? 'max-h-[180px]' : 'max-h-[500px]'}`}>
              {displayTraits.map(trait => {
                const isSelected = character.selectedTraitIds.includes(trait.id);
                if (isTraitsComplete && !forceExpandTraits && !isSelected) return null;
                return (
                  <button key={trait.id} onClick={() => toggleTrait(trait.id)} className={`text-left p-3 md:p-4 border transition-all relative overflow-hidden group/trait ${isSelected ? 'bg-pink-500/10 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.15)]' : 'bg-slate-900 border-slate-800 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 hover:border-slate-600'}`}>
                    <span className={`text-[13px] md:text-base font-orbitron font-black uppercase tracking-tighter block truncate ${isSelected ? 'text-pink-400' : 'text-slate-200'}`}>{trait.name}</span>
                    <div className="text-[9px] md:text-[10px] text-emerald-400 font-mono mt-1 font-black tracking-tight leading-tight uppercase flex items-start gap-1">
                      <span className="text-emerald-600">▲</span> 
                      <span className="break-words">{trait.bonus}</span>
                    </div>
                    <div className="text-[9px] md:text-[10px] text-rose-400 font-mono mt-1 font-black tracking-tight leading-tight uppercase flex items-start gap-1">
                      <span className="text-rose-600">▼</span> 
                      <span className="break-words">{trait.penalty}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            {isTraitsComplete && <button onClick={() => setForceExpandTraits(!forceExpandTraits)} className="mt-6 text-[9px] md:text-[10px] text-slate-500 uppercase hover:text-cyan-400 tracking-[0.2em] font-black transition-all flex items-center gap-2 group/swap">
              <span className="w-3 md:w-4 h-3 md:h-4 border border-slate-800 flex items-center justify-center group-hover/swap:border-cyan-500 transition-all">{forceExpandTraits ? '[-] ' : '[+] '}</span>
              {forceExpandTraits ? 'Lock_Neural_Modules' : 'Swap_Neural_Configuration'}
            </button>}
          </section>

          <section className="bg-slate-900/50 p-4 md:p-6 border-l-4 border-cyan-500 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl md:text-3xl font-orbitron font-bold text-white neon-text-cyan uppercase mb-6 tracking-widest flex items-center gap-4">
              Biometrics
              <span className="h-[2px] flex-1 bg-gradient-to-r from-cyan-900/50 to-transparent" />
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
              <StatBox label="Body" value={character.stats.body} description="Strength, melee." onChange={(v) => handleStatChange('body', v)} canIncrease={pointsRemaining > 0} />
              <StatBox label="Dex" value={character.stats.dexterity} description="Firearms, evasion." onChange={(v) => handleStatChange('dexterity', v)} canIncrease={pointsRemaining > 0} />
              <StatBox label="Int" value={character.stats.intelligence} description="Hacking, logic." onChange={(v) => handleStatChange('intelligence', v)} canIncrease={pointsRemaining > 0} />
              <StatBox label="Cha" value={character.stats.charisma} description="Manipulation." onChange={(v) => handleStatChange('charisma', v)} canIncrease={pointsRemaining > 0} />
              <StatBox label="Con" value={character.stats.constitution} description="Toughness." onChange={(v) => handleStatChange('constitution', v)} canIncrease={pointsRemaining > 0} />
            </div>
            <div className="mt-6 flex justify-end items-center gap-2 md:gap-3">
              <span className="text-[8px] md:text-[10px] font-mono uppercase text-slate-500 tracking-[0.1em] md:tracking-[0.2em]">Available_Allocation_Pool</span>
              <span className="text-xl md:text-2xl font-orbitron font-black text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.3)] shrink-0">{pointsRemaining} PTS</span>
            </div>
          </section>

          <section className="bg-slate-900/50 p-4 md:p-6 border-l-4 border-amber-500 space-y-6 shadow-[0_4px_20px_rgba(0,0,0,0.3)] overflow-hidden">
            <div className="flex justify-between items-center gap-2">
              <h2 className="text-xl md:text-3xl font-orbitron font-bold text-white neon-text-pink uppercase tracking-widest leading-none truncate">Armory</h2>
              <div className="hidden sm:block text-[9px] font-mono text-amber-500 uppercase tracking-widest border border-amber-500/20 px-3 py-1 bg-amber-500/5 whitespace-nowrap">Interface_Engaged</div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] md:text-xs font-orbitron text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 md:w-2 h-1.5 md:h-2 bg-slate-800 rotate-45" />
                Inventory_Matrix
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {(['Firearm', 'Melee', 'Tech'] as WeaponCategory[]).map(cat => (
                  <div key={cat} className="space-y-2">
                    <div className="text-[9px] font-bold text-cyan-400 uppercase tracking-tighter border-b border-cyan-900/30 pb-1">{cat} Category</div>
                    <div className="space-y-1">
                      {WEAPON_BASES.filter(b => b.category === cat).map(base => {
                        const isEquipped = character.equippedWeapons.some(w => w.baseId === base.id);
                        return (
                          <button
                            key={base.id}
                            onClick={() => isEquipped ? unequipWeapon(base.id) : equipWeapon(base)}
                            className={`w-full text-left px-2 md:px-3 py-2 border transition-all text-[10px] md:text-xs flex justify-between items-center group/btn truncate ${
                              isEquipped ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-100' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                            }`}
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold uppercase tracking-wider truncate">{base.name}</span>
                              <span className="text-[8px] opacity-40 font-mono tracking-tighter truncate">{base.damage} BASE</span>
                            </div>
                            <span className={`text-[7px] md:text-[8px] uppercase font-bold tracking-widest shrink-0 ml-1 ${isEquipped ? 'text-cyan-400 animate-pulse' : 'text-slate-700 opacity-0 group-hover/btn:opacity-100'}`}>{isEquipped ? 'Active' : 'Equip'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] md:text-xs font-orbitron text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 md:w-2 h-1.5 md:h-2 bg-slate-800 rotate-45" />
                Active_HUD
              </h3>
              {character.equippedWeapons.length === 0 ? (
                <div className="bg-black/20 border border-dashed border-slate-800 p-8 md:p-12 text-center relative">
                  <div className="text-slate-700 text-[10px] md:text-xs uppercase font-mono italic tracking-[0.1em] md:tracking-[0.2em] break-words">No hardware synced to Neural link.</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {character.equippedWeapons.map(weapon => {
                    const base = WEAPON_BASES.find(b => b.id === weapon.baseId);
                    if (!base) return null;
                    const maxAmmo = (base.baseMag || 0) + (weapon.attachments?.magSize || 0);
                    const { damage, hitBonus, effects } = getWeaponStats(weapon);
                    
                    return (
                      <div key={weapon.baseId} className="bg-slate-900/80 border border-slate-800 p-3 md:p-5 relative overflow-hidden group/hud">
                        <div className="absolute top-1 right-1 p-1">
                           <button onClick={() => unequipWeapon(weapon.baseId)} className="text-[8px] md:text-[10px] text-rose-500 uppercase hover:text-rose-400 font-bold tracking-widest bg-black/40 px-2 py-1 border border-rose-900/30">ABORT</button>
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-4 md:gap-8 mt-4 md:mt-0">
                          <div className="w-full md:w-1/3">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xl md:text-2xl font-orbitron font-black text-white uppercase tracking-tighter truncate">{base.name}</span>
                              <span className="text-[8px] bg-slate-800 px-1.5 py-0.5 text-slate-400 uppercase font-bold shrink-0">{base.category}</span>
                            </div>
                            <div className="text-2xl md:text-3xl font-orbitron font-black text-cyan-400 mb-2 leading-none">
                              {damage} 
                              <span className="text-[9px] md:text-xs text-slate-500 uppercase tracking-tighter ml-1 font-mono">Output</span>
                            </div>
                            {hitBonus > 0 && <div className="text-[9px] font-mono text-emerald-400 uppercase mb-2 flex items-center gap-1"><span className="w-1 h-1 bg-emerald-400 rounded-full" /> +{hitBonus} TRACKING</div>}
                            <p className="text-[9px] md:text-[10px] text-slate-500 leading-tight uppercase font-mono mb-4 border-l border-slate-800 pl-2 italic break-words">{base.description}</p>
                            {effects.length > 0 && (
                              <div className="space-y-1 bg-black/40 p-2 border border-slate-800/50 overflow-hidden">
                                {effects.map((e, idx) => (
                                  <div key={idx} className="text-[8px] md:text-[9px] font-mono text-amber-500 uppercase flex gap-1.5"><span className="text-amber-700 shrink-0">◈</span> <span className="break-words">{e}</span></div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 space-y-4">
                            {base.category === 'Firearm' && (
                              <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Munition</span>
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-xl md:text-2xl font-orbitron font-black text-cyan-400 tabular-nums">{weapon.currentAmmo}</span>
                                    <span className="text-[10px] text-slate-700 font-mono">/ {maxAmmo}</span>
                                  </div>
                                </div>
                                <div className="h-1.5 bg-black border border-slate-800 overflow-hidden flex shadow-inner">
                                  <div className="h-full bg-cyan-600 transition-all duration-300" style={{ width: `${(weapon.currentAmmo / maxAmmo) * 100}%` }} />
                                </div>
                                <div className="flex gap-2 mt-4">
                                  <CyberButton onClick={() => useWeapon(weapon)} disabled={weapon.currentAmmo <= 0} className="flex-1 text-[10px] py-2 px-3" variant="primary">FIRE</CyberButton>
                                  <button onClick={() => reloadWeapon(weapon)} className="px-3 border border-slate-700 text-[9px] uppercase font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-all">RELOAD</button>
                                </div>
                                
                                <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800/50">
                                  <div>
                                    <label className="text-[8px] text-slate-600 uppercase font-black block mb-1 tracking-widest truncate">Ammo_Mod</label>
                                    <select 
                                      value={weapon.attachments?.ammoType}
                                      onChange={(e) => updateWeaponAttachment(weapon.baseId, 'ammoType', e.target.value)}
                                      className="bg-slate-950 text-[9px] text-cyan-400 border border-slate-800 px-1 py-1 w-full outline-none font-mono"
                                    >
                                      {['Regular', 'Incendiary', 'Electric'].map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[8px] text-slate-600 uppercase font-black block mb-1 tracking-widest truncate">Mag_Struct</label>
                                    <select 
                                      value={weapon.attachments?.magSize}
                                      onChange={(e) => updateWeaponAttachment(weapon.baseId, 'magSize', parseInt(e.target.value))}
                                      className="bg-slate-950 text-[9px] text-cyan-400 border border-slate-800 px-1 py-1 w-full outline-none font-mono"
                                    >
                                      {[0, 2, 4, 6].map(v => <option key={v} value={v}>STD {v > 0 ? `+${v}` : ''}</option>)}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[8px] text-slate-600 uppercase font-black block mb-1 tracking-widest truncate">Ocular_Link</label>
                                    <select 
                                      value={weapon.attachments?.sight}
                                      onChange={(e) => updateWeaponAttachment(weapon.baseId, 'sight', e.target.value)}
                                      className="bg-slate-950 text-[9px] text-cyan-400 border border-slate-800 px-1 py-1 w-full outline-none font-mono"
                                    >
                                      {['None', 'Red Dot', '2x', '4x', 'Thermal'].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                  </div>
                                </div>
                              </div>
                            )}

                            {base.category === 'Tech' && (
                              <div className="space-y-4">
                                <div className="bg-cyan-500/5 border border-cyan-500/20 p-2 md:p-3">
                                  <div className="flex justify-between items-center text-[8px] md:text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2 flex-wrap gap-2">
                                    <span className="shrink-0">RESOURCE_DEPLETION</span>
                                    <div className="flex gap-2">
                                      <span className="text-cyan-400 font-bold">NC: {base.chgCost}</span>
                                      {base.phyCost ? <span className="text-amber-500 font-bold">KP: {base.phyCost}</span> : null}
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <CyberButton 
                                      onClick={() => useWeapon(weapon)} 
                                      disabled={character.vitals.chg.current < (base.chgCost || 0) || character.vitals.phy.current < (base.phyCost || 0)} 
                                      className="w-full text-[10px] py-2 px-3" 
                                      variant="primary"
                                    >
                                      EXECUTE ACTUATION
                                    </CyberButton>
                                    {base.id === 'monowire' && (
                                      <CyberButton 
                                        onClick={() => useWeapon(weapon, true)} 
                                        disabled={character.vitals.chg.current < 14}
                                        className="w-full text-[9px] py-1.5 px-3" 
                                        variant="danger"
                                      >
                                        STEALTH DECAPITATE (14 NC)
                                      </CyberButton>
                                    )}
                                    {base.id === 'mantis-blades' && (
                                      <CyberButton 
                                        onClick={() => useWeapon(weapon, true)} 
                                        disabled={character.vitals.phy.current < 6 || character.vitals.chg.current < 6}
                                        className="w-full text-[9px] py-1.5 px-3" 
                                        variant="danger"
                                      >
                                        DISMEMBER (6 KP + 6 NC)
                                      </CyberButton>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {base.category === 'Melee' && (
                              <div className="space-y-4">
                                <div className="bg-slate-950/50 p-3 border border-slate-800">
                                  <div className="text-[8px] md:text-[9px] font-mono text-slate-600 italic tracking-widest mb-2 uppercase break-words">Bio-mechanical loop active. No passive drain.</div>
                                  <div className="flex flex-col gap-2">
                                    {base.id === 'blunt' && (
                                      <CyberButton 
                                        onClick={() => useWeapon(weapon, true)} 
                                        disabled={character.vitals.phy.current < 4}
                                        className="w-full text-[9px] py-2 px-3" 
                                        variant="danger"
                                      >
                                        OVERPOWER (4 KP)
                                      </CyberButton>
                                    )}
                                    {base.id === 'blade' && (
                                      <CyberButton 
                                        onClick={() => useWeapon(weapon, true)} 
                                        disabled={character.vitals.phy.current < 6}
                                        className="w-full text-[9px] py-2 px-3" 
                                        variant="danger"
                                      >
                                        DISMEMBER (6 KP)
                                      </CyberButton>
                                    )}
                                  </div>
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
          </section>

          <section className="bg-slate-900/50 p-4 md:p-6 border-l-4 border-emerald-500 shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-6">
            <div className="flex justify-between items-center gap-2">
              <h2 className="text-xl md:text-3xl font-orbitron font-bold text-white neon-text-cyan uppercase tracking-widest leading-none truncate">Tactical</h2>
              <div className="hidden sm:block text-[9px] font-mono text-emerald-500 uppercase tracking-widest border border-emerald-500/20 px-3 py-1 bg-emerald-500/5 whitespace-nowrap">Supplies_Synced</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {CONSUMABLES.map((cons) => (
                <div key={cons.id} className="bg-slate-950/50 border border-slate-800 p-3 md:p-4 group/cons flex flex-col justify-between overflow-hidden">
                  <div className="mb-4 min-w-0">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <span className="text-[12px] md:text-sm font-orbitron font-bold text-white uppercase truncate">{cons.name}</span>
                      <span className="text-base md:text-lg font-orbitron text-emerald-400 font-black tabular-nums shrink-0">x{character.consumables[cons.id] || 0}</span>
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono uppercase italic mb-2 break-words leading-tight">{cons.description}</div>
                    <div className="text-[10px] text-cyan-400 font-black font-mono uppercase border-l-2 border-cyan-500/40 pl-2 break-words">{cons.effect}</div>
                  </div>

                  <div className="space-y-3 shrink-0">
                    <div className="flex gap-2 items-center justify-between border-t border-slate-800/50 pt-2 md:pt-3">
                      <span className="text-[8px] md:text-[9px] text-slate-600 uppercase font-black tracking-widest truncate">Inv_Buffer</span>
                      <div className="flex gap-1">
                        <button onClick={() => adjustConsumable(cons.id, -1)} className="w-6 h-6 bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-rose-900/40 hover:text-white transition-all">-</button>
                        <button onClick={() => adjustConsumable(cons.id, 1)} className="w-6 h-6 bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-emerald-900/40 hover:text-white transition-all">+</button>
                      </div>
                    </div>
                    <CyberButton 
                      onClick={() => useConsumable(cons)} 
                      disabled={(character.consumables[cons.id] || 0) <= 0}
                      className="w-full text-[9px] md:text-[10px] py-2 px-2" 
                      variant="primary"
                    >
                      USE {cons.name.toUpperCase()}
                    </CyberButton>
                  </div>
                </div>
              ))}
            </div>
            {lastRoll !== null && (
              <div className="text-center bg-black/40 border border-slate-800 p-2 animate-pulse overflow-hidden">
                <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest truncate block">MaxDoc Roll: <span className="font-orbitron font-black">{lastRoll} HP Restored</span></span>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="mt-12 md:mt-16 text-center text-slate-700 text-[8px] md:text-[10px] font-mono uppercase tracking-[0.2em] md:tracking-[0.5em] pb-12 opacity-50 px-4">
        Design_by_Joon_Jeong_NV_ARCHITECT // Night_City_2077 // All_Neural_Rights_Reserved // V.2.5.0_STABLE
      </footer>
    </div>
  );
};

export default App;
