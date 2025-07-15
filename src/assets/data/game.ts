import { c } from "naive-ui";

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

/**
 * boss列表
 * name: boss名称
 * alias: boss别名
 * skillAlias: 技能表里boss的名称
 */
export const bossList = [
    {
        name: "卫栖梧",
        alias: ["老卫"],
        skillAlias: "卫栖梧",
    },
    {
        name: "牡丹",
        alias: [],
        skillAlias: "牡丹",
    },
    {
        name: "谢云流",
        alias: ["老谢"],
        skillAlias: "谢云流",
    },
    {
        name: "提多罗吒",
        alias: [],
        skillAlias: "提多罗吒",
    },
    {
        name: "武逸青",
        alias: ["三王", "萧沙"],
        skillAlias: "武逸青、胡鞑、萧沙",
    },
    {
        name: "阿基修斯",
        alias: [],
        skillAlias: "阿基修斯",
    },
    {
        name: "悉达罗摩",
        alias: [],
        skillAlias: "悉达罗摩",
    },
    {
        name: "萧武宗",
        alias: [],
        skillAlias: "萧武宗",
    },
    {
        name: "武雪散",
        alias: [],
        skillAlias: "武雪散",
    },
    {
        name: "迟驻",
        alias: ["柱子哥"],
        skillAlias: "迟驻",
    },
    {
        name: "韦柔丝",
        alias: [],
        skillAlias: "韦柔丝",
    },
    {
        name: "程沐华",
        alias: [],
        skillAlias: "程沐华",
    },
    {
        name: "鬼影小次郎",
        alias: [],
        skillAlias: "鬼影小次郎",
    },
    {
        name: "冯度",
        alias: [],
        skillAlias: "冯度",
    },
    {
        name: "华鹤炎",
        alias: [],
        skillAlias: "华鹤炎",
    },
    {
        name: "罗翼",
        alias: [],
        skillAlias: "罗翼",
    },
    {
        name: "钱宗龙",
        alias: [],
        skillAlias: "钱宗龙、杜姬欣",
    },
    {
        name: "方宇谦",
        alias: [],
        skillAlias: "方宇谦",
    },
    {
        name: "陆寻",
        alias: [],
        skillAlias: "陆寻",
    },
    {
        name: "秦雷",
        alias: [],
        skillAlias: "秦雷",
    },
    {
        name: "上衫勇刀",
        alias: [],
        skillAlias: "上衫勇刀",
    },
    {
        name: "肖童",
        alias: [],
        skillAlias: "肖童",
    },
    {
        name: "源明雅",
        alias: [],
        skillAlias: "源明雅",
    },
    {
        name: "钱南撰",
        alias: [],
        skillAlias: "钱南撰",
    },
    {
        name: "恶战灵霄峡",
        alias: [],
        skillAlias: "恶战",
    },
    {
        name: "恶战日轮山城",
        alias: [],
        skillAlias: "恶战",
    },
    {
        name: "司徒一一",
        alias: [],
        skillAlias: "司徒一一",
    },
    {
        name: "阿依努尔",
        alias: [],
        skillAlias: "阿依努尔",
    },
    {
        name: "拓跋思南",
        alias: [],
        skillAlias: "拓跋思南",
    },
    {
        name: "谢云流（青年）",
        alias: [],
        skillAlias: "青年谢云流",
    },
    {
        name: "公孙二娘",
        alias: [],
        skillAlias: "公孙二娘",
    },
] as const;

export type BossName = (typeof bossList)[number]["name"];

/**
 * boss技能全收集的等级精耐系数
 * 用于计算角色精耐
 */
export const levelSpiritEnduranceCoef = [0, 800, 800, 800, 800, 800, 1600, 2400, 4000, 6000, 9000] as const;

/**
 * boss技能全收集的boss精耐分配系数
 * key: boss名称， value: 精耐系数数组，如果是二维数组，则第一项为女号，第二项为男号
 * 数据来源：https://www.jx3box.com/fb/95409#directory-17
 */
export const bossSpiritEnduranceCoef = [
    {
        boss: "华鹤炎",
        coef: [0.3, 0.7],
    },
    {
        boss: "罗翼",
        coef: [0.2, 0.8],
    },
    {
        boss: "钱宗龙",
        coef: [
            [0.7, 0.3],
            [0.3, 0.7],
        ],
    },
    {
        boss: "鬼影小次郎",
        coef: [0.7, 0.3],
    },
    {
        boss: "上衫勇刀",
        coef: [0.2, 0.8],
    },
    {
        boss: "源明雅",
        coef: [1, 0],
    },
    {
        boss: "方宇谦",
        coef: [0.7, 0.3],
    },
    {
        boss: "肖童",
        coef: [0.8, 0.2],
    },
    {
        boss: "秦雷",
        coef: [0.3, 0.7],
    },
    {
        boss: "卫栖梧",
        coef: [0.3, 0.7],
    },
    {
        boss: "牡丹",
        coef: [0.8, 0.2],
    },
    {
        boss: "陆寻",
        coef: [0.1, 0.9],
    },
    {
        boss: "谢云流",
        coef: [0.5, 0.5],
    },
    {
        boss: "武逸青",
        coef: [0.2, 0.8],
    },
    {
        boss: "韦柔丝",
        coef: [0.4, 0.6],
    },
    {
        boss: "程沐华",
        coef: [0.8, 0.2],
    },
    {
        boss: "提多罗吒",
        coef: [0.2, 0.8],
    },
    {
        boss: "阿基修斯",
        coef: [0.5, 0.5],
    },
    {
        boss: "钱南撰",
        coef: [0.4, 0.6],
    },
    {
        boss: "悉达罗摩",
        coef: [0.7, 0.3],
    },
    {
        boss: "萧武宗",
        coef: [0.4, 0.6],
    },
    {
        boss: "阿依努尔",
        coef: [0.4, 0.6],
    },
    {
        boss: "司徒一一",
        coef: [0.7, 0.3],
    },
    {
        boss: "迟驻",
        coef: [0.6, 0.4],
    },
    {
        boss: "武雪散",
        coef: [0.4, 0.6],
    },
    {
        boss: "拓跋思南",
        coef: [0.2, 0.8],
    },
    {
        boss: "谢云流（青年）",
        coef: [0.5, 0.5],
    },
    {
        boss: "公孙二娘",
        coef: [0.8, 0.2],
    },
    {
        boss: "冯度",
        coef: [0.7, 0.3],
    },
] as const;

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
