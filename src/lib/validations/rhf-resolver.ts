import { zodResolver } from "@hookform/resolvers/zod"
import type { Resolver } from "react-hook-form"
import type { z } from "zod"

export function createZodResolver<TFieldValues extends Record<string, unknown> = Record<string, unknown>>(
  schema: z.ZodType,
): Resolver<TFieldValues> {
  return zodResolver(schema as never) as Resolver<TFieldValues>
}
