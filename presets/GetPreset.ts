import { SanityFieldProperties } from "../types/SanityFieldProperties";

// parses and returns ./hero-banner.json
export const getHeroBannerPreset = () => {
    const heroBanner = require('./Hero_Banner.json')
    return heroBanner;
}

interface GalleryPreset {
    name: string;
    caption: string;
    content: SanityFieldProperties[];
}