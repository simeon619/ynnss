import { LocalCommerceImplementation } from "./local-commerce";

// biome-ignore lint/suspicious/noExplicitAny: temporary compatibility facade during local-commerce migration
export const commerce: any = LocalCommerceImplementation;
