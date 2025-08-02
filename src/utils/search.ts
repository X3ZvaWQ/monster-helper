import { uniqBy } from "lodash";
import { polyphonic } from "pinyin-pro";

// 获取拼音搜索 key
export const getSearchKey = (...search: string[]): string => {
    if (!search || search.length === 0) return "";

    const searchStr = search.join("");
    const pinyinList: [string, string][][] = polyphonic(searchStr, {
        toneType: "none",
        type: "all",
    }).map((words) =>
        uniqBy(
            words.map((word) => [word.pinyin, word.first] as [string, string]),
            (item) => item[0] // 根据全拼去重
        )
    );

    // 笛卡尔积组合所有拼音路径
    const cartesian = (arr: [string, string][][]): [string, string][][] => {
        return arr.reduce<[string, string][][]>((acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])), [[]]);
    };

    const combinations = cartesian(pinyinList);

    // 生成全拼和缩写组合
    const results = new Set<string>();
    results.add(searchStr); // 添加原始字符串
    for (const combo of combinations) {
        const full = combo.map((pair) => pair[0]).join("");
        const abbr = combo.map((pair) => pair[1]).join("");
        results.add(full);
        results.add(abbr);
    }

    // 返回以空格分隔的 search key
    return Array.from(results).join(" ");
};

export const matchSearch = (pattern: string, searchKey: string): boolean => {
    if (!pattern || !searchKey) return false;

    const cleanedPattern = pattern.toLowerCase().replace(/\s+/g, "");
    const lowerSearchKey = searchKey.toLowerCase();

    // 利用空格分词并使用 includes 简配模糊匹配
    return lowerSearchKey.split(" ").some((key) => key.includes(cleanedPattern));
};
