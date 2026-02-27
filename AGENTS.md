# AGENTS.md

Your Next Store — e-commerce app built with Next.js App Router + Commerce Kit SDK.

## Commands

```bash
# Development
bun dev              # Dev server (port 3000)
bun run build        # Production build
bun start            # Production server

# Linting & Formatting
bun run lint         # Biome lint (checks for errors)
bun run lint --write # Biome lint with auto-fix
bun run format       # Biome format

# Testing
bun test             # Run all tests
bun test <file>      # Run single test file
bun test --watch     # Run tests in watch mode
bun test -t "name"   # Run tests matching name pattern

# Type Checking
bun run typecheck    # Type check (alias for tsgo --noEmit)
tsgo --noEmit        # Type check

# Database
bun run db:generate:global   # Generate global DB
bun run db:generate:tenant     # Generate tenant DB
bun run db:migrate:global      # Run global migrations
bun run db:migrate:tenants     # Run tenant migrations
```

## Code Style Guidelines

### General Rules (Biome-enforced)
- **Line width**: 110 characters
- **No default exports** except: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `default.tsx`
- **No `any` types** - use proper types or type inference
- **No `for...of` / `forEach`** for mutations - use `map`/`filter`/`reduce`
- **Use `as const`** for literal objects
- **Use template literals** over string concatenation

### Imports (grouped order)
```typescript
import { useState } from "react";              // React/Next
import Link from "next/link";                   // Next.js
import { Button } from "@/components/ui/button"; // Components
import { formatMoney } from "@/lib/money";      // Lib
import { cn } from "@/lib/utils";               // Utils
import { safe } from "safe-try";                // Third-party
```

### Naming Conventions
- **Components**: PascalCase (`ProductCard`)
- **Functions**: camelCase (`formatPrice`)
- **Constants**: SCREAMING_SNAKE_CASE
- **Files**: kebab-case (`product-form.tsx`)
- **Server Actions**: suffix with `Action` (`createProductAction`)

### Types
- Avoid explicit return type annotations - let TypeScript infer
- Use `interface` for object shapes, `type` for unions/intersections
- Never use `any` - use `unknown` if necessary, then narrow

### Error Handling
```typescript
import { safe } from "safe-try";
const [error, result] = await safe(someAsyncFunction());
if (error || !result) {
  return <div>Error: {error.message}</div>;
}
// use result
```

## Brutalist UI Design
- Bold black borders (`border-2` or `border-4 border-black`)
- High contrast (black/white with accent colors)
- Strong shadows (`shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`)
- Uppercase bold text for labels
- No/minimal rounded corners (`rounded-sm` or `rounded-lg`)
- `font-black` for headings, `font-mono` for numbers/code
- `h-10` for inputs, `h-12` for large inputs
- Use `tabular-nums` for numeric displays

## GLOBAL DESIGN RULE: BRUTALIST ECOMMERCE UI

All UI components must follow a strict brutalist web aesthetic.

### Core Principles (Avoid)
- No rounded corners (`rounded-none` or no border-radius)
- No soft shadows (use hard shadows: `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`)
- No gradients
- No glassmorphism
- No neumorphism
- No pastel colors

### Visual Style (Required)
- High contrast: black, white, red, blue, neon green only
- Thick borders: `border-2` or `border-4 border-black`
- Flat buttons, system fonts only
- Large bold typography: `font-black`, `text-xl`+
- Underlined links: `underline`
- Square product images
- Hard section separations with visible borders

### Buttons
- ALL CAPS text: `uppercase`
- Thick border: `border-2 border-black`
- Hover = color inversion only (black→white, white→black)
- No smooth animations

### Cards
- No soft shadows (use hard shadows)
- Sharp rectangular blocks
- Visible structure with borders
- Bold price display with `font-black font-mono`

### Layout
- Asymmetrical layouts allowed
- Clear hierarchy using scale
- No decorative elements
- No fancy icon libraries (use Lucide minimal)

### UX
- Must remain usable and conversion-oriented
- Clear CTA buttons
- Clear product information

If any UI element violates brutalist rules, refactor it immediately.

## Local Environment Setup
```bash
# Start services + configure S3 + launch app
chmod +x scripts/launch.sh && ./scripts/launch.sh

# Manual: docker-compose up -d
# Manual: npx tsx scripts/setup-garage.ts

# .env.local required:
AWS_REGION=garage
AWS_BUCKET_NAME=delivery
AWS_ENDPOINT=http://127.0.0.1:3900
YNS_API_KEY=<your-key>
```

## Key Directories
```
app/           # Pages, layouts, actions (App Router)
components/ui/ # Shadcn UI components (50+)
lib/           # Commerce API, money, utils
hooks/         # Custom React hooks
```

## Commerce Kit SDK
```tsx
const products = await commerce.productBrowse({ active: true, limit: 12 });
const product = await commerce.productGet({ idOrSlug: productId });
const cart = await commerce.cartUpsert({ cartId, variantId, quantity });
```

## Validation Checklist
- [ ] `tsgo --noEmit` — no type errors
- [ ] `bun run lint` — no lint errors
- [ ] `bun run format` — code formatted
- [ ] `bun test` — tests pass
- [ ] `bun run build` — build succeeds
- [ ] No console errors, images load

## Troubleshooting
| Error | Fix |
|-------|-----|
| `variants of undefined` | Use optional chaining (`product?.variants`) |
| `Missing env.YNS_API_KEY` | Create `.env.local`, restart dev server |
| `noDefaultExport` | Use named export |
| `BigInt literal` | Use `BigInt(0)` instead of `0n` |

## Agent Notes
- Explore: `lib/commerce.ts`, `app/layout.tsx `"use server"`/`"use cache`, search"`
- Always quote paths with special characters: `rg "term" "app/(auth)/login"`
- Use `safe-try` for error handling, `formatMoney` for prices
- Use functional array methods (`map`/`filter`/`reduce`), not loops

## Token Optimization

RTK is globally installed and transparently rewrites all Bash commands via hook.
Run `rtk gain` to see token savings. Run `rtk discover` to identify missed optimizations.
