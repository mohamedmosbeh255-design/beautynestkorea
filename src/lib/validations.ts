import { z } from "zod";

const stringToArray = (val: unknown): string[] => {
  if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
  if (typeof val === "string") return val.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
  return [];
};

export const productSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().min(3, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
  brand: z.string().min(2, "Brand is required"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  price: z.coerce.number().min(0, "Price must be >= 0"),
  compare_at_price: z.coerce.number().min(0).optional().nullable(),
  category: z.string().min(2, "Category is required"),
  concern: z.preprocess(stringToArray, z.array(z.string()).min(1, "Pick at least one concern")),
  skin_type: z.preprocess(stringToArray, z.array(z.string()).default([])),
  key_ingredients: z.preprocess(stringToArray, z.array(z.string()).default([])),
  image_urls: z.preprocess(stringToArray, z.array(z.string().url("Must be a valid URL")).min(1, "At least one image URL is required")),
  amazon_url: z.string().url("Must be a valid URL").optional().or(z.literal("")).or(z.null()),
  oliveyoung_url: z.string().url("Must be a valid URL").optional().or(z.literal("")).or(z.null()),
  rating: z.coerce.number().min(0).max(5).optional().nullable(),
  review_count: z.coerce.number().min(0).optional().nullable(),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
