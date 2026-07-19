declare const __hexBrand: unique symbol;
export type HexColor = string & { readonly [__hexBrand]: "HexColor" };

export const hexColor = (s: string): HexColor => s as HexColor;
