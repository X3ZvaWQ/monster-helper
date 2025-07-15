import { pinyin } from "pinyin-pro";

export const getSearchKey = (search: string): string => {
    if (!search) return "";
    const wholePinyin = pinyin(search, { toneType: "none" });
    const firstPinyin = pinyin(search, {
        pattern: "first",
        toneType: "none",
    });
    const key = [
        search,
        wholePinyin,
        wholePinyin.replace(/\s/g, ""),
        firstPinyin,
        firstPinyin.replace(/\s/g, ""),
    ];
    return key.join(" ").toLowerCase().trim();
};