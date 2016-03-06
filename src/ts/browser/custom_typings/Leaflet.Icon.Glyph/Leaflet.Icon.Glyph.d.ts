
declare module L {
  interface IconStatic {
    Glyph: Icon.IconGlyphStatic;
  }

  namespace Icon {
    export interface IconGlyphStatic extends IconStatic {
      new (option ?: IconGlyphConfig):IconGlyph;
    }
    export interface IconGlyph extends L.Icon {
      options : IconGlyphConfig
      createIcon() : HTMLDivElement
    }

    export interface IconGlyphConfig extends IconOptions {

      className?: string,
      // Akin to the 'className' option in L.DivIcon

      prefix?: string,
      // CSS class to be used on all glyphs and prefixed to every glyph name

      glyph?: string,
      // Name of the glyph

      glyphColor?: string,
      // Glyph colour. Value can be any string with a CSS colour definition.

      glyphSize?: string,
      // Size of the glyph, in CSS units

      glyphAnchor?: [number, number],
      // Position of the center of the glyph relative to the center of the icon.
    }
  }

  namespace icon {
    export function glyph(options?:Icon.IconGlyphConfig) : L.Icon.IconGlyph;
  }
}