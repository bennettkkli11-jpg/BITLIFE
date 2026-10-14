import React, { useState } from 'react';
import { Character, Pet, RealEstate, Vehicle, Heirloom } from '../../types/bitlife';
import { PET_BREEDS, PET_NAMES } from '../../data/names';
import { pickRandom, randomInt, clamp, calculateNetWorth } from '../../utils/lifeEngine';
import { playCashSound, playClickSound, playSuccessSound } from '../../utils/audio';
import { AchievementsSection } from '../AchievementsSection';

interface AssetsTabProps {
  character: Character;
  onUpdateCharacter: (updater: (prev: Character) => Character) => void;
  onAddLog: (text: string) => void;
  onOpenKendama?: (initialTab?: 'BAG' | 'SHOP' | 'NAKO') => void;
}

export const AssetsTab: React.FC<AssetsTabProps> = ({
  character,
  onUpdateCharacter,
  onAddLog,
  onOpenKendama,
}) => {
  const [modal, setModal] = useState<'NONE' | 'BUY_HOUSE' | 'BUY_CAR' | 'BUY_PET'>('NONE');
  const [msg, setMsg] = useState<string | null>(null);

  const netWorth = calculateNetWorth(character);

  // Real estate market offerings
  const REAL_ESTATE_CATALOG: Omit<RealEstate, 'id' | 'hasMortgage' | 'mortgageLeft'>[] = [
    { name: 'Mobile Home Trailer', type: 'Trailer', price: 18000, monthlyCost: 150, condition: 60 },
    { name: 'Downtown Studio Condo', type: 'Condo', price: 175000, monthlyCost: 450, condition: 85 },
    { name: 'Suburban 3-Bedroom Home', type: 'Suburban House', price: 420000, monthlyCost: 750, condition: 90 },
    { name: 'Skyline Luxury Penthouse', type: 'Penthouse', price: 1650000, monthlyCost: 2400, condition: 95 },
    { name: 'Bel-Air Mediterranean Mansion', type: 'Mansion', price: 4800000, monthlyCost: 6500, condition: 98 },
    { name: 'Historic Scottish Highlands Castle', type: 'Castle', price: 14500000, monthlyCost: 18000, condition: 92 },
  ];

  // Vehicle dealership
  const VEHICLE_CATALOG: Omit<Vehicle, 'id'>[] = [
    { name: 'Vintage 250cc Motorcycle', type: 'Motorcycle', price: 4500, condition: 80 },
    { name: 'Used Honda Civic', type: 'Compact', price: 9500, condition: 75 },
    { name: 'Tesla Model 3 EV', type: 'Sedan', price: 38000, condition: 95 },
    { name: 'Range Rover Sport SUV', type: 'SUV', price: 82000, condition: 90 },
    { name: 'Porsche 911 Carrera', type: 'Sports Car', price: 135000, condition: 98 },
    { name: 'Ferrari SF90 Stradale', type: 'Supercar', price: 540000, condition: 100 },
  ];

  const handleBuyHouse = (house: (typeof REAL_ESTATE_CATALOG)[0], withMortgage: boolean) => {
    playClickSound();
    const downPayment = withMortgage ? Math.round(house.price * 0.1) : house.price;
    if (character.money < downPayment) {
      setMsg(`You need at least ${character.currencySymbol}${downPayment.toLocaleString()} to purchase this property.`);
      return;
    }

    playSuccessSound();
    playCashSound();
    const newProperty: RealEstate = {
      id: 'house_' + Date.now(),
      name: house.name,
      type: house.type,
      price: house.price,
      monthlyCost: house.monthlyCost,
      condition: house.condition,
      hasMortgage: withMortgage,
      mortgageLeft: withMortgage ? house.price - downPayment : 0,
    };

    onUpdateCharacter((prev) => ({
      ...prev,
      money: prev.money - downPayment,
      realEstate: [...prev.realEstate, newProperty],
      happiness: clamp(prev.happiness + 20),
    }));

    onAddLog(`I bought a ${house.name} for ${character.currencySymbol}${house.price.toLocaleString()}.`);
    setMsg(`Purchased ${house.name}! Congratulations on homeownership!`);
    setModal('NONE');
  };

  const handleSellHouse = (houseId: string) => {
    playClickSound();
    playCashSound();
    const house = character.realEstate.find((h) => h.id === houseId);
    if (!house) return;
    const payout = house.price - (house.hasMortgage ? house.mortgageLeft : 0);

    onUpdateCharacter((prev) => ({
      ...prev,
      money: prev.money + payout,
      realEstate: prev.realEstate.filter((h) => h.id !== houseId),
    }));
    onAddLog(`I sold my ${house.name} for ${character.currencySymbol}${house.price.toLocaleString()}.`);
    setMsg(`Sold ${house.name} for ${character.currencySymbol}${payout.toLocaleString()} net proceeds!`);
  };

  const handleBuyCar = (car: (typeof VEHICLE_CATALOG)[0]) => {
    playClickSound();
    if (!character.hasDriversLicense) {
      setMsg('You need a driver’s license before buying a motor vehicle! Take the DMV test in Activities.');
      return;
    }
    if (character.money < car.price) {
      setMsg('You do not have enough cash to purchase this vehicle.');
      return;
    }
    playSuccessSound();
    playCashSound();
    const newCar: Vehicle = {
      id: 'veh_' + Date.now(),
      name: car.name,
      type: car.type,
      price: car.price,
      condition: car.condition,
    };
    onUpdateCharacter((prev) => ({
      ...prev,
      money: prev.money - car.price,
      vehicles: [...prev.vehicles, newCar],
      happiness: clamp(prev.happiness + 15),
    }));
    onAddLog(`I bought a ${car.name} for ${character.currencySymbol}${car.price.toLocaleString()}.`);
    setMsg(`Vroom! You drove off in your brand new ${car.name}!`);
    setModal('NONE');
  };

  const handleSellCar = (carId: string) => {
    playClickSound();
    playCashSound();
    const car = character.vehicles.find((c) => c.id === carId);
    if (!car) return;
    onUpdateCharacter((prev) => ({
      ...prev,
      money: prev.money + car.price,
      vehicles: prev.vehicles.filter((c) => c.id !== carId),
    }));
    onAddLog(`I sold my ${car.name} for ${character.currencySymbol}${car.price.toLocaleString()}.`);
    setMsg(`Sold ${car.name} for ${character.currencySymbol}${car.price.toLocaleString()}!`);
  };

  const handleDriveCar = (car: Vehicle) => {
    playClickSound();
    onUpdateCharacter((prev) => ({
      ...prev,
      happiness: clamp(prev.happiness + 8),
    }));
    setMsg(`You went for an exhilarating cruise along the coastal highway in your ${car.name}!`);
  };

  const handleAdoptPet = (species: Pet['species']) => {
    playClickSound();
    const cost = 250;
    if (character.money < cost) {
      setMsg('You cannot afford the shelter adoption fee.');
      return;
    }
    playSuccessSound();
    playCashSound();
    const breed = pickRandom(PET_BREEDS[species] || ['Domestic']);
    const name = pickRandom(PET_NAMES);
    const newPet: Pet = {
      id: 'pet_' + Date.now(),
      name,
      species,
      breed,
      age: 1,
      relationshipLevel: 100,
      health: randomInt(80, 95),
    };
    onUpdateCharacter((prev) => ({
      ...prev,
      money: prev.money - cost,
      pets: [...prev.pets, newPet],
      happiness: clamp(prev.happiness + 20),
    }));
    onAddLog(`I adopted a ${breed} ${species.toLowerCase()} named ${name}.`);
    setMsg(`You welcomed ${name} the ${breed} into your home! So fluffy!`);
    setModal('NONE');
  };

  const handleInteractPet = (petId: string, action: 'pet' | 'treat' | 'walk' | 'vet') => {
    playClickSound();
    onUpdateCharacter((prev) => {
      const updatedPets = prev.pets.map((p) => {
        if (p.id !== petId) return p;
        if (action === 'pet') {
          return { ...p, relationshipLevel: clamp(p.relationshipLevel + 10) };
        }
        if (action === 'treat') {
          return { ...p, relationshipLevel: clamp(p.relationshipLevel + 15), health: clamp(p.health + 5) };
        }
        if (action === 'walk') {
          return { ...p, relationshipLevel: clamp(p.relationshipLevel + 12), health: clamp(p.health + 10) };
        }
        if (action === 'vet') {
          return { ...p, health: 100 };
        }
        return p;
      });
      return {
        ...prev,
        pets: updatedPets,
        happiness: clamp(prev.happiness + 5),
        money: action === 'vet' ? prev.money - 150 : prev.money,
      };
    });
    setMsg(
      action === 'pet'
        ? 'You gave your pet a gentle belly scratch! It purred/wagged with delight.'
        : action === 'treat'
        ? 'You fed your pet an artisanal gourmet snack!'
        : action === 'walk'
        ? 'You went for a revitalizing jog together around the neighborhood park!'
        : 'The veterinarian conducted a thorough checkup and certified clean bill of health!'
    );
  };

  const handleSellHeirloom = (heirloom: Heirloom) => {
    playClickSound();
    playCashSound();
    onUpdateCharacter((prev) => ({
      ...prev,
      money: prev.money + heirloom.value,
      heirlooms: prev.heirlooms.filter((h) => h.id !== heirloom.id),
      happiness: clamp(prev.happiness + 5),
    }));
    onAddLog(`I sold my ${heirloom.name} heirloom for ${character.currencySymbol}${heirloom.value.toLocaleString()}.`);
    setMsg(`Sold ${heirloom.name} to an antique collector for ${character.currencySymbol}${heirloom.value.toLocaleString()}!`);
  };

  return (
    <div className="flex flex-col h-full space-y-3 overflow-y-auto pr-1">
      {msg && (
        <div className="p-3 rounded-2xl bg-slate-900 border border-emerald-500/50 text-xs text-emerald-200 font-medium">
          {msg}
        </div>
      )}

      {/* Finances Overview */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
          <span>🏦</span> Financial Portfolio
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
            <div className="text-[10px] text-slate-400">Liquid Cash</div>
            <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
              {character.currencySymbol}{character.money.toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
            <div className="text-[10px] text-slate-400">Estimated Net Worth</div>
            <div className="text-base font-bold font-mono text-emerald-300 mt-0.5">
              {character.currencySymbol}{netWorth.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Achievements & Milestones Section */}
      <AchievementsSection character={character} />

      {/* Real Estate */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex justify-between items-center mb-2.5">
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
            <span>🏡</span> Real Estate ({character.realEstate.length})
          </h3>
          <button
            onClick={() => {
              playClickSound();
              setModal('BUY_HOUSE');
            }}
            disabled={character.age < 18}
            className="text-xs px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold shadow"
          >
            + Buy Property
          </button>
        </div>

        {character.realEstate.length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center py-2">
            You do not own any real estate properties.
          </p>
        ) : (
          <div className="space-y-2">
            {character.realEstate.map((re) => (
              <div
                key={re.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">{re.name}</div>
                  <div className="text-[10px] text-slate-400">
                    Condition: {re.condition}% · Market: {character.currencySymbol}{re.price.toLocaleString()}
                  </div>
                  {re.hasMortgage && (
                    <div className="text-[10px] text-red-400 font-mono">
                      Mortgage: {character.currencySymbol}{re.mortgageLeft.toLocaleString()}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleSellHouse(re.id)}
                  className="px-2.5 py-1 rounded-lg bg-red-900/60 hover:bg-red-800 text-red-200 text-xs font-semibold"
                >
                  Sell
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vehicles */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex justify-between items-center mb-2.5">
          <h3 className="text-sm font-bold text-blue-400 flex items-center gap-1.5">
            <span>🚗</span> Vehicles ({character.vehicles.length})
          </h3>
          <button
            onClick={() => {
              playClickSound();
              setModal('BUY_CAR');
            }}
            disabled={character.age < 16}
            className="text-xs px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold shadow"
          >
            + Dealership
          </button>
        </div>

        {character.vehicles.length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center py-2">
            No cars in your garage. Visit dealership to buy wheels!
          </p>
        ) : (
          <div className="space-y-2">
            {character.vehicles.map((v) => (
              <div
                key={v.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">{v.name}</div>
                  <div className="text-[10px] text-slate-400">
                    Condition: {v.condition}% · Valued at: {character.currencySymbol}{v.price.toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleDriveCar(v)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
                  >
                    Drive
                  </button>
                  <button
                    onClick={() => handleSellCar(v.id)}
                    className="px-2 py-1 rounded-lg bg-red-900/60 hover:bg-red-800 text-xs font-semibold text-red-200"
                  >
                    Sell
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pets */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex justify-between items-center mb-2.5">
          <h3 className="text-sm font-bold text-rose-400 flex items-center gap-1.5">
            <span>🐾</span> Pets & Companions ({character.pets.length})
          </h3>
          <button
            onClick={() => {
              playClickSound();
              setModal('BUY_PET');
            }}
            className="text-xs px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold shadow"
          >
            + Adopt Pet
          </button>
        </div>

        {character.pets.length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center py-2">
            No pets currently. Adopt an animal companion!
          </p>
        ) : (
          <div className="space-y-2">
            {character.pets.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-850 text-xs space-y-2"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white">{p.name}</span>
                    <span className="text-slate-400 ml-1.5">
                      ({p.breed} {p.species}, Age {p.age})
                    </span>
                  </div>
                  <span className="text-emerald-400 font-bold">{p.relationshipLevel}% ❤️</span>
                </div>

                <div className="flex gap-1.5 pt-1">
                  <button
                    onClick={() => handleInteractPet(p.id, 'pet')}
                    className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200"
                  >
                    Pet
                  </button>
                  <button
                    onClick={() => handleInteractPet(p.id, 'treat')}
                    className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200"
                  >
                    Treat
                  </button>
                  <button
                    onClick={() => handleInteractPet(p.id, 'walk')}
                    className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200"
                  >
                    Walk
                  </button>
                  <button
                    onClick={() => handleInteractPet(p.id, 'vet')}
                    className="flex-1 py-1 rounded bg-teal-900 hover:bg-teal-800 text-[11px] font-semibold text-teal-200"
                  >
                    Vet ($150)
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Heirlooms */}
      {character.heirlooms.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <h3 className="text-sm font-bold text-yellow-400 flex items-center gap-1.5 mb-2.5">
            <span>✨</span> Attic Heirlooms ({character.heirlooms.length})
          </h3>
          <div className="space-y-2">
            {character.heirlooms.map((h) => (
              <div
                key={h.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{h.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-white">{h.name}</div>
                    <div className="text-[10px] text-amber-300 font-semibold">{h.rarity}</div>
                    <div className="text-xs font-mono font-bold text-emerald-400">
                      {character.currencySymbol}{h.value.toLocaleString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleSellHeirloom(h)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow"
                >
                  Sell
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kendamas Collection (Sweets, Krom, Yuntrove) */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/30 shadow-md">
        <div className="flex justify-between items-center mb-2.5">
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
            <span>🎯</span> Kendama Collection ({(character.kendamas || []).length})
          </h3>
          <button
            onClick={() => {
              playClickSound();
              onOpenKendama?.('SHOP');
            }}
            className="text-xs px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold shadow cursor-pointer"
          >
            + Pro Shop
          </button>
        </div>

        {(character.kendamas || []).length === 0 ? (
          <div className="text-center py-3 space-y-2">
            <p className="text-xs text-slate-400 italic">
              You do not own any Kendamas yet. Visit the Pro Shop for Sweets, Krom & Yuntrove damas!
            </p>
            <button
              onClick={() => {
                playClickSound();
                onOpenKendama?.('SHOP');
              }}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold border border-slate-700 cursor-pointer"
            >
              Open Kendama Pro Shop 🛒
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {(character.kendamas || []).map((dama) => (
              <div
                key={dama.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">
                    {dama.brand === 'Sweets Kendamas' ? '🎯' : dama.brand === 'KROM Kendama' ? '🇩🇰' : '🍃'}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{dama.name}</span>
                      {dama.signedByMattJorgensen && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-yellow-400 text-slate-950 font-extrabold">
                          ✍️ Signed
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {dama.brand} · Condition: {dama.condition}%
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    playClickSound();
                    onOpenKendama?.('BAG');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Play 🪀
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Buy House */}
      {modal === 'BUY_HOUSE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md max-h-[80vh] rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-3">
              <h4 className="font-bold text-sm text-amber-400">Real Estate Brokerage</h4>
              <button
                onClick={() => setModal('NONE')}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {REAL_ESTATE_CATALOG.map((prop, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{prop.name}</div>
                    <div className="text-xs font-mono font-bold text-emerald-400">
                      {character.currencySymbol}{prop.price.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Down: {character.currencySymbol}{Math.round(prop.price * 0.1).toLocaleString()} (10%)
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleBuyHouse(prop, true)}
                      className="px-2 py-1 rounded bg-amber-700 hover:bg-amber-600 text-[11px] font-bold text-white shadow"
                    >
                      Mortgage
                    </button>
                    <button
                      onClick={() => handleBuyHouse(prop, false)}
                      className="px-2 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-[11px] font-bold text-white shadow"
                    >
                      Cash
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Buy Car */}
      {modal === 'BUY_CAR' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md max-h-[80vh] rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-3">
              <h4 className="font-bold text-sm text-blue-400">Motor Dealership Showroom</h4>
              <button
                onClick={() => setModal('NONE')}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {VEHICLE_CATALOG.map((v, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{v.name}</div>
                    <div className="text-xs font-mono font-bold text-emerald-400">
                      {character.currencySymbol}{v.price.toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleBuyCar(v)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow"
                  >
                    Buy Vehicle
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Buy Pet */}
      {modal === 'BUY_PET' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-3">
              <h4 className="font-bold text-sm text-rose-400">Adoption Shelter & Exotic Pet Store</h4>
              <button
                onClick={() => setModal('NONE')}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded"
              >
                Close
              </button>
            </div>
            <div className="space-y-2">
              {[
                { name: 'Puppy Dog 🐶', species: 'Dog' as const },
                { name: 'Kitten Cat 🐱', species: 'Cat' as const },
                { name: 'Talking Parrot 🦜', species: 'Parrot' as const },
                { name: 'Python Snake 🐍', species: 'Snake' as const },
                { name: 'Siberian Tiger 🐯', species: 'Tiger' as const },
                { name: 'Fluffy Hamster 🐹', species: 'Hamster' as const },
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAdoptPet(p.species)}
                  className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 flex items-center justify-between text-xs font-bold text-slate-200"
                >
                  <span>{p.name}</span>
                  <span className="text-emerald-400 font-mono">{character.currencySymbol}250</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
