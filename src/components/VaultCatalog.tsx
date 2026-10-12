import React, { useState } from 'react';
import { Search, Sparkles, Wand2, Check, Video, Type, Camera, Layers, Zap } from 'lucide-react';
import { csBridge } from '../utils/csinterface';

interface VaultItem {
  id: string;
  name: string;
  category: 'titles' | 'motion' | 'vfx' | 'rigs';
  description: string;
  tag: string;
  icon: React.ElementType;
  gradient: string;
}

const VAULT_ITEMS: VaultItem[] = [
  {
    id: 'kinetic-title',
    name: 'Cinematic 3D Title',
    category: 'titles',
    description: 'Impactful centered kinetic title with automated scale dynamic in/out.',
    tag: 'Typography',
    icon: Type,
    gradient: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400'
  },
  {
    id: 'glitch-layer',
    name: 'Cyberpunk Glitch FX',
    category: 'vfx',
    description: 'Dual-frequency chromatic displacement adjustment layer.',
    tag: 'VFX Stack',
    icon: Zap,
    gradient: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400'
  },
  {
    id: 'vignette-fx',
    name: 'Anamorphic Vignette',
    category: 'vfx',
    description: 'Subtly feathered inverted mask vignette for cinematic depth.',
    tag: 'Optics',
    icon: Video,
    gradient: 'from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-400'
  },
  {
    id: 'null-rig',
    name: '3D Camera Orbit Rig',
    category: 'rigs',
    description: 'Parented null controller setup for smooth perspective camera orbits.',
    tag: 'Camera Control',
    icon: Camera,
    gradient: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400'
  },
  {
    id: 'lower-third',
    name: 'Minimal Modern Lower-Third',
    category: 'titles',
    description: 'Sleek broadcast lower-third bar with dual text hierarchy.',
    tag: 'Broadcast',
    icon: Type,
    gradient: 'from-rose-500/20 to-pink-500/10 border-rose-500/30 text-rose-400'
  },
  {
    id: 'motion-burst',
    name: 'Kinetic Particle Accent',
    category: 'motion',
    description: 'Procedural accent burst for button pops, logos, and transitions.',
    tag: 'Motion Graphics',
    icon: Sparkles,
    gradient: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-400'
  }
];

export const VaultCatalog: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Record<string, boolean>>({});

  const filteredItems = VAULT_ITEMS.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.tag.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleApply = async (item: VaultItem) => {
    setApplyingId(item.id);
    try {
      await csBridge.applyElement(item.id, item.name);
      setAppliedIds((prev) => ({ ...prev, [item.id]: true }));
      setTimeout(() => {
        setAppliedIds((prev) => ({ ...prev, [item.id]: false }));
      }, 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search and Filters Header */}
      <div className="p-3 border-b border-[#303038] bg-[#1e1e24] space-y-2.5 flex-shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search elements, titles, VFX..."
            className="w-full bg-[#16161a] border border-[#32323a] focus:border-blue-500 text-xs rounded-md pl-8 pr-3 py-1.5 text-neutral-200 placeholder:text-neutral-500 outline-none transition-all"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px]">
          {[
            { id: 'all', label: 'All Elements' },
            { id: 'titles', label: 'Titles' },
            { id: 'vfx', label: 'VFX & Stacks' },
            { id: 'motion', label: 'Motion Shapes' },
            { id: 'rigs', label: 'Camera Rigs' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white font-medium shadow-sm shadow-blue-700/50'
                  : 'bg-[#292930] text-neutral-400 hover:text-neutral-200 hover:bg-[#34343c]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preset List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="py-8 text-center text-neutral-500 text-xs">
            No elements found matching "{search}".
          </div>
        ) : (
          filteredItems.map((item) => {
            const Icon = item.icon;
            const isApplying = applyingId === item.id;
            const isApplied = !!appliedIds[item.id];

            return (
              <div
                key={item.id}
                className="group p-3 rounded-lg bg-[#25252c] border border-[#353540] hover:border-blue-500/40 transition-all flex flex-col justify-between gap-2.5 shadow-sm hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-md flex items-center justify-center border ${item.gradient} flex-shrink-0`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-neutral-100 group-hover:text-blue-400 transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-neutral-400 mt-0.5 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1a1a20] text-neutral-400 border border-[#32323a] whitespace-nowrap font-mono">
                    {item.tag}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#2e2e36]">
                  <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    Active Comp Injector
                  </span>

                  <button
                    onClick={() => handleApply(item)}
                    disabled={isApplying}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
                      isApplied
                        ? 'bg-emerald-600 text-white'
                        : isApplying
                        ? 'bg-blue-700 text-white opacity-80 cursor-wait'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-900/30 active:scale-95'
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <Check className="w-3 h-3" />
                        Applied
                      </>
                    ) : isApplying ? (
                      <>
                        <Wand2 className="w-3 h-3 animate-spin" />
                        Injecting...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3 h-3" />
                        Apply to Comp
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
