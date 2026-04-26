import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

// ─── Admin guard ──────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

// ─── Blog Router ──────────────────────────────────────────────────────────────
export const blogRouter = router({
  // Public: List published posts
  listPublished: publicProcedure.query(() => db.getBlogPosts("published")),

  // Public: Get post by slug
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const post = await db.getBlogPostBySlug(input.slug);
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      if (post.status === "draft") throw new TRPCError({ code: "FORBIDDEN" });
      
      // Increment view count (fire and forget)
      db.updateBlogPost(post.id, { viewCount: post.viewCount + 1 }).catch(() => {});
      
      return post;
    }),

  // Admin: List all posts (including drafts and private)
  listAll: adminProcedure.query(() => db.getBlogPosts()),

  // Admin: Get post by ID
  get: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const post = await db.getBlogPostById(input.id);
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      return post;
    }),

  // Admin: Create new post
  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(1).max(512),
        slug: z.string().min(1).max(512),
        description: z.string().optional(),
        content: z.string().min(1),
        targetLeadId: z.number().optional(),
        status: z.enum(["draft", "published", "private"]).default("draft"),
      })
    )
    .mutation(async ({ input }) => {
      // Check for duplicate slug
      const existing = await db.getBlogPostBySlug(input.slug);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A post with this slug already exists",
        });
      }

      const publishedAt = input.status === "published" ? new Date() : null;
      const id = await db.createBlogPost({
        ...input,
        publishedAt,
      });
      return { id };
    }),

  // Admin: Update post
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(512).optional(),
        slug: z.string().min(1).max(512).optional(),
        description: z.string().optional(),
        content: z.string().min(1).optional(),
        targetLeadId: z.number().optional(),
        status: z.enum(["draft", "published", "private"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const existing = await db.getBlogPostById(id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      // If status is changing to published, set publishedAt
      let publishedAt = existing.publishedAt;
      if (data.status === "published" && existing.status !== "published") {
        publishedAt = new Date();
      }

      await db.updateBlogPost(id, { ...data, publishedAt });
      return { success: true };
    }),

  // Admin: Delete post
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const existing = await db.getBlogPostById(input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      await db.deleteBlogPost(input.id);
      return { success: true };
    }),
});
