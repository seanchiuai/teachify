import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const join = mutation({
  args: {
    gameId: v.id("games"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (game.state !== "lobby") throw new Error("Game already started");

    const trimmedName = args.name.trim().slice(0, 20);
    if (trimmedName.length === 0) throw new Error("Name is required");

    const existingPlayers = await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    let finalName = trimmedName;
    const existingNames = existingPlayers.map((p) => p.name);
    if (existingNames.includes(trimmedName)) {
      let suffix = 2;
      while (existingNames.includes(`${trimmedName} (${suffix})`)) {
        suffix++;
      }
      finalName = `${trimmedName} (${suffix})`;
    }

    return await ctx.db.insert("players", {
      gameId: args.gameId,
      name: finalName,
      score: 0,
    });
  },
});

export const listByGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();
  },
});

export const leaderboard = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const players = await ctx.db
      .query("players")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();
    return players.sort((a, b) => b.score - a.score);
  },
});

export const get = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.playerId);
  },
});
