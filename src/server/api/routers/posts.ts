import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";
import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis";
import { filterUserForClient } from "~/server/helpers/filterUserForClient";

// Create a new ratelimiter, that allows 3 requests per 1 minute
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "10 m"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */ 
  prefix: "@upstash/ratelimit",
});

export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
        take: 100,
        orderBy: [{ createdAt:"desc"}]
    });

    const users = (
        await clerkClient.users.getUserList({
            userId: posts.map((post) => post.authorID),
            limit: 100,
    })).map(filterUserForClient)

    return posts.map(post => {
        const author = users.find((user) => user.id === post.authorID)

        if (!author || !author.username) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Author for post not found"})

        return {
            post,
            author,
        }
    })
  }),

  create: privateProcedure
    .input(
        z.object({
            content: z.string().emoji("Only emojis are allowed").min(1).max(280)
        })
    )
  .mutation(async ({ ctx, input }) => {
    const authorID = ctx.userID

    const { success } = await ratelimit.limit(authorID)

    if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" })

    const post = await ctx.prisma.post.create({
        data: {
            authorID,
            content: input.content
        }
    })

    return post
  })
});
