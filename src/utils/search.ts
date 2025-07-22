import { pinyin } from "pinyin-pro";

export const getSearchKey = (...search: string[]): string => {
    if (!search) return "";
    const searchStr = search.join("");
    const wholePinyin = pinyin(searchStr, { toneType: "none" });
    const firstPinyin = pinyin(searchStr, {
        pattern: "first",
        toneType: "none",
    });
    const key = [searchStr, wholePinyin, wholePinyin.replace(/\s/g, ""), firstPinyin, firstPinyin.replace(/\s/g, "")];
    return key.join(" ").toLowerCase().trim();
};
