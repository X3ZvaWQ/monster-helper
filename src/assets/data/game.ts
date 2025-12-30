import { getSearchKey } from "@/utils/search";

export const bookIconId = [245, 92, 241, 244, 388] as const;

/**
 * 技能等级标签
 * 用于渲染技能列表以及OCR用于识别技能重数~
 */
export const skillLevelLabel = [
    "未学习",
    "一重",
    "二重",
    "三重",
    "四重",
    "五重",
    "六重",
    "七重",
    "八重",
    "九重",
    "十重",
    "十一重",
    "十二重",
    "十三重",
    "十四重",
    "十五重",
    "十六重",
    "十七重",
    "十八重",
    "十九重",
    "二十重",
] as const;

export type SkillLevelLabel = (typeof skillLevelLabel)[number];

/**
 * boss列表声明
 * alias: boss别名
 * skillAlias: 技能表里boss的名称
 * coef: boss技能全收集的boss精耐分配系数数组，如果是二维数组，则第一项为女号，第二项为男号
 * 数据来源：
 * https://www.jx3box.com/fb/95409#directory-17
 * https://www.jx3box.com/fb/105250
 */
const _bossList = [
    {
        name: "卫栖梧",
        alias: ["老卫"],
        skillAlias: "卫栖梧",
        coef: [0.3, 0.7],
    },
    {
        name: "牡丹",
        alias: [],
        skillAlias: "牡丹",
        coef: [0.8, 0.2],
    },
    {
        name: "谢云流",
        alias: ["老谢"],
        skillAlias: "谢云流",
        coef: [0.5, 0.5],
    },
    {
        name: "提多罗吒",
        alias: [],
        skillAlias: "提多罗吒",
        coef: [0.2, 0.8],
    },
    {
        name: "武逸青",
        alias: ["三王", "萧沙"],
        skillAlias: "武逸青、胡鞑、萧沙",
        coef: [0.2, 0.8],
    },
    {
        name: "阿基修斯",
        alias: [],
        skillAlias: "阿基修斯",
        coef: [0.5, 0.5],
    },
    {
        name: "悉达罗摩",
        alias: [],
        skillAlias: "悉达罗摩",
        coef: [0.7, 0.3],
    },
    {
        name: "萧武宗",
        alias: [],
        skillAlias: "萧武宗",
        coef: [0.4, 0.6],
    },
    {
        name: "武雪散",
        alias: [],
        skillAlias: "武雪散",
        coef: [0.4, 0.6],
    },
    {
        name: "迟驻",
        alias: ["柱子哥"],
        skillAlias: "迟驻",
        coef: [0.6, 0.4],
    },
    {
        name: "韦柔丝",
        alias: [],
        skillAlias: "韦柔丝",
        coef: [0.4, 0.6],
    },
    {
        name: "程沐华",
        alias: [],
        skillAlias: "程沐华",
        coef: [0.8, 0.2],
    },
    {
        name: "鬼影小次郎",
        alias: [],
        skillAlias: "鬼影小次郎",
        coef: [0.7, 0.3],
    },
    {
        name: "冯度",
        alias: [],
        skillAlias: "冯度",
        coef: [0.7, 0.3],
    },
    {
        name: "华鹤炎",
        alias: ["华子"],
        skillAlias: "华鹤炎",
        coef: [0.3, 0.7],
    },
    {
        name: "罗翼",
        alias: [],
        skillAlias: "罗翼",
        coef: [0.2, 0.8],
    },
    {
        name: "钱宗龙",
        alias: [],
        skillAlias: "钱宗龙、杜姬欣",
        coef: [
            [0.7, 0.3],
            [0.3, 0.7],
        ],
    },
    {
        name: "方宇谦",
        alias: [],
        skillAlias: "方宇谦",
        coef: [0.7, 0.3],
    },
    {
        name: "陆寻",
        alias: [],
        skillAlias: "陆寻",
        coef: [0.1, 0.9],
    },
    {
        name: "秦雷",
        alias: [],
        skillAlias: "秦雷",
        coef: [0.3, 0.7],
    },
    {
        name: "上衫勇刀",
        alias: [],
        skillAlias: "上衫勇刀",
        coef: [0.2, 0.8],
    },
    {
        name: "肖童",
        alias: [],
        skillAlias: "肖童",
        coef: [0.8, 0.2],
    },
    {
        name: "源明雅",
        alias: [],
        skillAlias: "源明雅",
        coef: [1, 0],
    },
    {
        name: "钱南撰",
        alias: [],
        skillAlias: "钱南撰",
        coef: [0.4, 0.6],
    },
    {
        name: "恶战灵霄峡",
        alias: [],
        skillAlias: "恶战",
        coef: null,
    },
    {
        name: "恶战日轮山城",
        alias: [],
        skillAlias: "恶战",
        coef: null,
    },
    {
        name: "司徒一一",
        alias: [],
        skillAlias: "司徒一一",
        coef: [0.7, 0.3],
    },
    {
        name: "阿依努尔",
        alias: [],
        skillAlias: "阿依努尔",
        coef: [0.4, 0.6],
    },
    {
        name: "拓跋思南",
        alias: [],
        skillAlias: "拓跋思南",
        coef: [0.2, 0.8],
    },
    {
        name: "谢云流（青年）",
        alias: [],
        skillAlias: "青年谢云流",
        coef: [0.5, 0.5],
    },
    {
        name: "公孙二娘",
        alias: [],
        skillAlias: "公孙二娘",
        coef: [0.8, 0.2],
    },
    {
        name: "程沐华（青年）",
        alias: [],
        skillAlias: "程沐华·青年",
        coef: [0.8, 0.2],
    },
    {
        name: "韦柔丝（困境）",
        alias: [],
        skillAlias: "韦柔丝·困境",
        coef: [0.2, 0.8],
    },
    {
        name: "肖红",
        alias: [],
        skillAlias: "肖红",
        coef: [0.8, 0.2],
    },
] as const;

export const bossList = _bossList.map((boss) => ({
    ...boss,
    searchKey: getSearchKey(boss.name, ...boss.alias),
}));

export type BossName = (typeof bossList)[number]["name"];

/**
 * boss技能全收集的等级精耐系数
 * 用于计算角色精耐
 */
export const levelSpiritEnduranceCoef = [0, 800, 800, 800, 800, 800, 1600, 2400, 4000, 6000, 9000] as const;

/**
 * 收集三本某等级的技能增加的精耐数值
 * 用于计算角色精耐
 */
export const threeLevelSpiritEndurance = [0, 100, 200, 300, 400, 2000, 6000, 8000, 10000, 12000, 14000] as const;

/**
 * 不计算精耐的技能列表
 */
export const noSpiritEnduranceSkills = new Set([
    33602, // 枪法蝮蛇
    33601, // 毒指功
    35136, // 蛮熊碎颅击
    35137, // 水遁水流闪
    30619, // 冲炎枪
    39307, // 阴雷之种
]);

/**
 * 不计入3本高等级技能涨精耐的技能
 */
export const noThreeLevelSpiritEnduranceSkills = new Set([
    39292, // 逆波式
    39293, // 夜叉浮乐
    39294, // 铁猬
    39295, // 海龙御劲
    39296, // 俯阵熊突
    39297, // 麒麟遁甲
    39298, // 绝地反击
]);

export const addonSkillMap = new Map<number, number>([
    [30137, 39292], // 定波 -> 逆波
    [35132, 39293], // 鲨之息 -> 夜叉浮乐
    [30750, 39294], // 枪法铁林 -> 铁猬
    [30587, 39295], // 归潮长生法 -> 海龙御劲
    [35139, 39296], // 角抵技巧 -> 俯阵熊突
    [30542, 39297], // 五行术土遁 -> 麒麟遁甲
    [30687, 39298], // 帝骖 -> 绝地反击
]);

/** 可交易的技能列表，暂时没有数据 */
export const tradeableSkills = new Set([]);

/** 性别不同技能替换表 */
export const genderSkillReplaceMap: Map<number, number> = new Map([]);

export const bookLearnCost = [
    null, // 0级
    { level: 1, cost: 1 }, // 0 -> 1
    { level: 1, cost: 2 }, // 1 -> 2
    { level: 1, cost: 5 }, // 2 -> 3
    { level: 2, cost: 1 }, // 3 -> 4
    { level: 3, cost: 1 }, // 4 -> 5
    { level: 4, cost: 1 }, // 5 -> 6
    { level: 4, cost: 2 }, // 6 -> 7
    { level: 4, cost: 5 }, // 7 -> 8
    null, // 8 -> 9 不能通过通本
    null, // 9 -> 10 不能通过通本
];

export const teachSpritEnduranceRequire = [
    null, // 0重无需传功
    15000, // 1重
    22000, // 2重
    33000, // 3重
    45000, // 4重
    80000, // 5重
    110000, // 6重
    180000, // 7重
];
