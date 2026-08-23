import { describe, it, expect } from 'vitest'
import {
  newGame,
  purchaseCost,
  validatePurchases,
  addPurchases,
  cupsMakeable,
  cupsPerIngredient,
  demandRate,
  costToCoverOneCup,
  runDay,
} from './engine'
import type { Inventory, Purchases } from './types'

const NO_PURCHASES: Purchases = { iceLbs: 0, cupPacks: 0, lemonLbs: 0, sugarLbs: 0 }
const EMPTY_INVENTORY: Inventory = { iceUnits: 0, cups: 0, lemons: 0, sugarTbsp: 0 }

describe('purchaseCost', () => {
  it('sums prices: 1 lb ice + 1 cup pack + 2 lb lemons + 1 lb sugar = $18.00', () => {
    // 100 + 500 + 2*500 + 200 = 1800
    expect(purchaseCost({ iceLbs: 1, cupPacks: 1, lemonLbs: 2, sugarLbs: 1 })).toBe(1800)
  })

  it('is zero for nothing', () => {
    expect(purchaseCost(NO_PURCHASES)).toBe(0)
  })
})

describe('validatePurchases', () => {
  it('accepts an affordable order', () => {
    expect(validatePurchases({ iceLbs: 1, cupPacks: 1, lemonLbs: 2, sugarLbs: 1 }, 1800)).toBeNull()
  })

  it('rejects negative quantities', () => {
    expect(validatePurchases({ ...NO_PURCHASES, iceLbs: -1 }, 10000)).toMatch(/whole/)
  })

  it('rejects fractional quantities', () => {
    expect(validatePurchases({ ...NO_PURCHASES, sugarLbs: 1.5 }, 10000)).toMatch(/whole/)
  })

  it('rejects orders costing more than cash on hand', () => {
    // 1 cup pack = 500 > 499
    expect(validatePurchases({ ...NO_PURCHASES, cupPacks: 1 }, 499)).toMatch(/afford/)
  })
})

describe('addPurchases', () => {
  it('converts purchase units to inventory units', () => {
    const inv = addPurchases(EMPTY_INVENTORY, { iceLbs: 1, cupPacks: 1, lemonLbs: 2, sugarLbs: 1 })
    // 1 lb ice = 10 units, 1 pack = 100 cups, 2 lb lemons = 8 lemons, 1 lb sugar = 16 tbsp
    expect(inv).toEqual({ iceUnits: 10, cups: 100, lemons: 8, sugarTbsp: 16 })
  })
})

describe('cupsMakeable', () => {
  it('is limited by the scarcest ingredient', () => {
    // lemons (8) are the constraint: min(10 ice, 100 cups, 8 lemons, 16 sugar)
    expect(cupsMakeable({ iceUnits: 10, cups: 100, lemons: 8, sugarTbsp: 16 })).toBe(8)
  })

  it('is zero with an empty pantry', () => {
    expect(cupsMakeable(EMPTY_INVENTORY)).toBe(0)
  })
})

describe('cupsPerIngredient', () => {
  it('reports what each ingredient covers on its own', () => {
    // Every RECIPE amount is 1, so each count divides straight through:
    // 10/1 ice, 100/1 cups, 8/1 lemons, 16/1 sugar.
    expect(cupsPerIngredient({ iceUnits: 10, cups: 100, lemons: 8, sugarTbsp: 16 })).toEqual({
      iceUnits: 10,
      cups: 100,
      lemons: 8,
      sugarTbsp: 16,
    })
  })

  it('agrees with cupsMakeable — the smallest entry is the cup count', () => {
    const inv: Inventory = { iceUnits: 30, cups: 100, lemons: 12, sugarTbsp: 48 }
    // min(30, 100, 12, 48) = 12, the lemons
    const per = cupsPerIngredient(inv)
    expect(Math.min(per.iceUnits, per.cups, per.lemons, per.sugarTbsp)).toBe(12)
    expect(cupsMakeable(inv)).toBe(12)
  })
})

describe('demandRate', () => {
  it('is 25% at the $2.00 reference price', () => {
    expect(demandRate(200)).toBe(0.25)
  })

  it('falls linearly: 12.5% at $3.00, 0% at $4.00 and beyond', () => {
    expect(demandRate(300)).toBe(0.125)
    expect(demandRate(400)).toBe(0)
    expect(demandRate(999)).toBe(0)
  })

  it('rises for cheap lemonade, capped at 50%', () => {
    expect(demandRate(100)).toBe(0.375)
    expect(demandRate(0)).toBe(0.5)
  })
})

describe('costToCoverOneCup', () => {
  it('prices only the missing ingredients', () => {
    // has lemons and sugar; needs ice (100) and cups (500)
    expect(costToCoverOneCup({ iceUnits: 0, cups: 0, lemons: 4, sugarTbsp: 4 })).toBe(600)
  })

  it('is the full shopping list from empty: 500 + 200 + 100 + 500', () => {
    expect(costToCoverOneCup(EMPTY_INVENTORY)).toBe(1300)
  })
})

describe('runDay', () => {
  it('plays an inventory-limited day, hand-computed end to end', () => {
    // Buy 1 lb ice, 1 cup pack, 2 lb lemons, 1 lb sugar: $18 -> cash $82.00.
    // Stock: 10 ice, 100 cups, 8 lemons, 16 sugar -> 8 cups makeable.
    // 60 passersby at $2.00 (25%) -> demand 15, but only 8 cups -> sell 8.
    // Revenue 8 * 200 = $16.00 -> cash $98.00. Leftover 2 ice units melt.
    const after = runDay(
      newGame('Anne'),
      { iceLbs: 1, cupPacks: 1, lemonLbs: 2, sugarLbs: 1 },
      200,
      60,
    )
    expect(after.cashCents).toBe(9800)
    expect(after.inventory).toEqual({ iceUnits: 0, cups: 92, lemons: 0, sugarTbsp: 8 })
    expect(after.day).toBe(2)
    expect(after.status).toBe('playing')
    expect(after.history).toEqual([
      {
        day: 1,
        priceCents: 200,
        spentCents: 1800,
        passersby: 60,
        demand: 15,
        cupsSold: 8,
        revenueCents: 1600,
        iceMeltedUnits: 2,
        endCashCents: 9800,
        // No chaos was passed, so the day records none of it.
        chaos: null,
        lemonsRotted: 0,
        sugarLostTbsp: 0,
      },
    ])
  })

  it('plays a demand-limited day: 20 passersby at $2.00 sell 5 cups', () => {
    const after = runDay(
      newGame('Anne'),
      { iceLbs: 1, cupPacks: 1, lemonLbs: 2, sugarLbs: 1 },
      200,
      20,
    )
    // demand = 20 * 0.25 = 5; revenue 1000; cash 10000 - 1800 + 1000 = 9200
    expect(after.history[0].cupsSold).toBe(5)
    expect(after.cashCents).toBe(9200)
    // 5 cups used 5 ice units; the other 5 melted
    expect(after.history[0].iceMeltedUnits).toBe(5)
    expect(after.inventory.lemons).toBe(3)
  })

  it('rounds demand half-up, once: 4 passersby at $1.00 -> 1.5 -> 2', () => {
    const after = runDay(
      newGame('Anne'),
      { iceLbs: 1, cupPacks: 1, lemonLbs: 1, sugarLbs: 1 },
      100,
      4,
    )
    expect(after.history[0].demand).toBe(2)
  })

  it('sells nothing at $4.00 or more', () => {
    const after = runDay(
      newGame('Anne'),
      { iceLbs: 1, cupPacks: 1, lemonLbs: 1, sugarLbs: 1 },
      400,
      100,
    )
    expect(after.history[0].cupsSold).toBe(0)
    expect(after.history[0].revenueCents).toBe(0)
  })

  it('goes bankrupt when broke with no way to make a cup', () => {
    // Blow $99 on ice: cash $1.00, ice melts overnight, nothing else stocked.
    // Restocking one cup costs $13.00 > $1.00 -> bankrupt.
    const after = runDay(newGame('Anne'), { ...NO_PURCHASES, iceLbs: 99 }, 200, 50)
    expect(after.status).toBe('bankrupt')
    expect(after.cashCents).toBe(100)
  })

  it('survives when cash exactly covers restocking one cup', () => {
    // 87 lb ice -> cash 1300, exactly the full shopping list from empty.
    const after = runDay(newGame('Anne'), { ...NO_PURCHASES, iceLbs: 87 }, 200, 50)
    expect(after.status).toBe('playing')
    expect(after.cashCents).toBe(1300)
  })

  it('finishes after day 10', () => {
    const state = { ...newGame('Anne'), day: 10 }
    const after = runDay(state, NO_PURCHASES, 200, 0)
    expect(after.status).toBe('finished')
  })

  it('rejects playing a finished game', () => {
    const done = { ...newGame('Anne'), status: 'finished' as const }
    expect(() => runDay(done, NO_PURCHASES, 200, 10)).toThrow(/over/)
  })

  it('rejects an unaffordable order', () => {
    // 21 cup packs = $105 > $100
    expect(() => runDay(newGame('Anne'), { ...NO_PURCHASES, cupPacks: 21 }, 200, 10)).toThrow(
      /afford/,
    )
  })

  it('rejects a negative or fractional price', () => {
    expect(() => runDay(newGame('Anne'), NO_PURCHASES, -5, 10)).toThrow(/[Pp]rice/)
    expect(() => runDay(newGame('Anne'), NO_PURCHASES, 150.5, 10)).toThrow(/[Pp]rice/)
  })
})

describe('chaos events', () => {
  it('pestilence rots carried lemons but spares the ones bought today', () => {
    // Start day 2 with 4 lemons in the cooler and $50.00.
    const state = {
      ...newGame('Anne'),
      day: 2,
      cashCents: 5000,
      inventory: { iceUnits: 0, cups: 20, lemons: 4, sugarTbsp: 10 },
    }
    // The 4 carried lemons rot; buying 1 lb adds 4 fresh ones.
    // Order: 1 lb ice + 1 lb lemons = 100 + 500 = 600 -> cash 4400.
    // Stock: 10 ice, 20 cups, 4 lemons, 10 sugar -> 4 cups makeable.
    // 40 passersby at $2.00 (25%) -> demand 10, sell 4 -> revenue 800 -> 5200.
    const after = runDay(
      state,
      { iceLbs: 1, cupPacks: 0, lemonLbs: 1, sugarLbs: 0 },
      200,
      40,
      'pestilence',
    )
    expect(after.history[0].lemonsRotted).toBe(4)
    expect(after.history[0].chaos).toBe('pestilence')
    expect(after.history[0].cupsSold).toBe(4)
    expect(after.cashCents).toBe(5200)
    expect(after.inventory.lemons).toBe(0)
  })

  it('thunderstorm empties the street no matter the real traffic', () => {
    // Order: $18.00 -> cash 8200. 60 passersby become 0 -> no demand, no sales.
    const after = runDay(
      newGame('Anne'),
      { iceLbs: 1, cupPacks: 1, lemonLbs: 2, sugarLbs: 1 },
      200,
      60,
      'thunderstorm',
    )
    expect(after.history[0].passersby).toBe(0)
    expect(after.history[0].demand).toBe(0)
    expect(after.history[0].revenueCents).toBe(0)
    expect(after.cashCents).toBe(8200)
  })

  it('windstorm cuts traffic by a quarter and halves the sugar', () => {
    // Order: 1 lb each + 1 pack = 100 + 500 + 500 + 200 = 1300 -> cash 8700.
    // Stock: 10 ice, 100 cups, 4 lemons, 16 sugar.
    // Sugar: roundHalfUp(16 * 0.5) = 8 lost, 8 left.
    // Traffic: roundHalfUp(40 * 0.75) = 30.
    // Demand: 30 * 0.25 = 7.5, half-up -> 8. Lemons cap making at 4, sell 4.
    // Revenue 800 -> cash 9500.
    const after = runDay(
      newGame('Anne'),
      { iceLbs: 1, cupPacks: 1, lemonLbs: 1, sugarLbs: 1 },
      200,
      40,
      'windstorm',
    )
    expect(after.history[0].passersby).toBe(30)
    expect(after.history[0].sugarLostTbsp).toBe(8)
    expect(after.history[0].demand).toBe(8)
    expect(after.history[0].cupsSold).toBe(4)
    expect(after.cashCents).toBe(9500)
    // 16 bought - 8 blown away - 4 used = 4 left
    expect(after.inventory.sugarTbsp).toBe(4)
  })

  it('windstorm rounds an odd sugar count half-up: 5 tbsp loses 3', () => {
    // 5 tbsp carried, nothing bought: roundHalfUp(5 * 0.5) = roundHalfUp(2.5) = 3.
    const state = {
      ...newGame('Anne'),
      inventory: { iceUnits: 0, cups: 10, lemons: 2, sugarTbsp: 5 },
    }
    const after = runDay(state, NO_PURCHASES, 200, 0, 'windstorm')
    expect(after.history[0].sugarLostTbsp).toBe(3)
    expect(after.inventory.sugarTbsp).toBe(2)
  })
})

describe('a full ten-day season', () => {
  // A deliberately break-even season, so the arithmetic stays checkable by hand.
  //
  // Day 1 buys a cup pack too: 500 + 500 + 200 + 100 = 1300 spent, leaving
  // 8700. Stock is 100 cups, 4 lemons, 16 tbsp sugar, 10 ice units, so lemons
  // cap the day at 4 cups. 40 passersby at $2.00 want 10, so all 4 sell for
  // 800 -> 9500 in the till, 6 ice units melt.
  //
  // Days 2-10 restock lemons, sugar, and ice for 800 and sell 4 more cups for
  // 800. Every one of those days nets exactly zero, so the till sits at 9500
  // from the end of day 1 onward. Lemons are bought and used 4-for-4; sugar
  // piles up 12 tbsp a day; cups run 100 down to 60.
  const FIRST_DAY: Purchases = { iceLbs: 1, cupPacks: 1, lemonLbs: 1, sugarLbs: 1 }
  const RESTOCK: Purchases = { iceLbs: 1, cupPacks: 0, lemonLbs: 1, sugarLbs: 1 }

  function playSeason() {
    let game = newGame('Anne')
    for (let day = 1; day <= 10; day++) {
      game = runDay(game, day === 1 ? FIRST_DAY : RESTOCK, 200, 40)
    }
    return game
  }

  it('ends after ten days with the hand-computed till', () => {
    const game = playSeason()
    expect(game.status).toBe('finished')
    expect(game.history).toHaveLength(10)
    expect(game.cashCents).toBe(9500)
  })

  it('sells four cups a day, forty in all', () => {
    const game = playSeason()
    expect(game.history.map((day) => day.cupsSold)).toEqual([4, 4, 4, 4, 4, 4, 4, 4, 4, 4])
    expect(game.history.reduce((sum, day) => sum + day.revenueCents, 0)).toBe(8000)
  })

  it('carries cups and sugar forward and melts the ice every night', () => {
    const game = playSeason()
    // 100 cups less 40 sold; 16 tbsp bought and 4 used on nine of ten days,
    // plus day one's 12 left over: 12 + 9 * 12 = 120.
    expect(game.inventory).toEqual({ iceUnits: 0, cups: 60, lemons: 0, sugarTbsp: 120 })
    expect(game.history.every((day) => day.iceMeltedUnits === 6)).toBe(true)
  })

  it('refuses to play an eleventh day', () => {
    const game = playSeason()
    expect(() => runDay(game, RESTOCK, 200, 40)).toThrow(/over/)
  })
})
