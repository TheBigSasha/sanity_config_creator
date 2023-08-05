import { GalleryPreset } from "../types/GalleryPreset";


const ALL_PRESET_LIST: GalleryPreset[] = [
    {
        title: 'Hero Banner',
        subtitle: "A large banner with a title and subtitle",
        element: require("./Hero_Banner.json"),
    },
    {
        title: 'Photo Gallery',
        subtitle: "An extensible gallery for a photographer",
        element: require("./Photo_Post-Photo_Album-Home_Page.json"),
    }
]



export const getAllPresets: () => GalleryPreset[] = () => {
    return ALL_PRESET_LIST;
}