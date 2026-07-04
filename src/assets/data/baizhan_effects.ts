export const effectsFilter = [
    {
        text: "全部效果",
        key: "all",
        ids: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
        text: "额外奖励",
        key: "reward",
        ids: [1, 2, 3, 4, 5, 6, 7, 8],
    },
    {
        text: "骰子提升",
        key: "dice",
        ids: [5],
    },
    {
        text: "骰子减弱",
        key: "dice_1",
        ids: [6],
    },
    {
        text: "秒杀首领",
        key: "fight",
        ids: [2],
    },
    {
        text: "格子前进",
        key: "forward",
        ids: [6, 9],
    },
    {
        text: "格子后退",
        key: "back",
        ids: [5, 8],
    },
    {
        text: "逆向移动",
        key: "reverse",
        ids: [9],
    },
    {
        text: "稀有提高",
        key: "reward_1",
        ids: [3],
    },
];

export const skill_colors = [
    {
        id: 0,
        name: "全部颜色",
    },
    {
        id: 1,
        name: "无颜色招式",
    },
    {
        id: 2,
        name: "黄色",
    },
    {
        id: 3,
        name: "蓝色",
    },
    {
        id: 4,
        name: "绿色",
    },
    {
        id: 5,
        name: "红色",
    },
    {
        id: 6,
        name: "紫色",
    },
    {
        id: 7,
        name: "黑色",
    },
];

export const skill_types = [
    {
        id: 0,
        name: "全部效果",
    },
    {
        id: 1,
        name: "伤害",
    },
    {
        id: 2,
        name: "精神值打击",
    },
    {
        id: 3,
        name: "耐力值打击",
    },
    {
        id: 4,
        name: "伤害增益技能",
    },
    {
        id: 5,
        name: "打断",
    },
    {
        id: 6,
        name: "驱散敌方增益",
    },
    {
        id: 7,
        name: "驱散友军减益",
    },
    {
        id: 8,
        name: "恢复精神值",
    },
    {
        id: 9,
        name: "恢复耐力值",
    },
    {
        id: 10,
        name: "控制效果技能",
    },
    {
        id: 11,
        name: "生存技能",
    },
    {
        id: 12,
        name: "召唤技能",
    },
    {
        id: 13,
        name: "解除控制技能",
    },
    {
        id: 14,
        name: "其他类型技能",
    },
];

export const skill_costs = [
    {
        id: 0,
        name: "全部消耗",
    },
    {
        id: 1,
        name: "一星",
    },
    {
        id: 2,
        name: "二星",
    },
    {
        id: 3,
        name: "三星",
    },
];

export const effects = [
    {
        id: 1,
        icon: 4533,
        name: "因陀罗的胜机",
        desc: "击败首领额外获取500个修罗之印。",
        rewardRegexp: /击败首领额外获取(\d+)个修罗之印。/,
        reward: 500,
        tags: [],
        buffID: 24899,
        buffLevel: 1,
    },
    {
        id: 2,
        icon: 13548,
        name: "阿修罗的悟性",
        desc: "直接获得100个修罗之印，并在下次与首领的战斗中直接击败首领。",
        rewardRegexp: /直接获得(\d+)个修罗之印，并在下次与首领的战斗中直接击败首领。/,
        reward: 100,
        tags: ["秒杀首领"],
        buffID: 24900,
        buffLevel: 1,
    },
    {
        id: 3,
        icon: 13547,
        name: "阿修罗的幸运",
        desc: "本层稀有招式要诀出现率提高，击败首领额外获得120个修罗之印。",
        rewardRegexp: /本层稀有招式要诀出现率提高，击败首领额外获得(\d+)个修罗之印。/,
        reward: 120,
        tags: ["稀有提高"],
        buffID: 24901,
        buffLevel: 1,
    },
    {
        id: 4,
        icon: 3313,
        name: "因陀罗的护佑",
        desc: "获得一个随机前进次数，直接获得100个修罗之印。",
        rewardRegexp: /获得一个随机前进次数，直接获得(\d+)个修罗之印/,
        reward: 100,
        tags: ["随机前进"],
        buffID: 24902,
        buffLevel: 1,
    },
    {
        id: 5,
        icon: 4577,
        name: "因陀罗的策略",
        desc: "后跃六步，下一次随机前进上限翻倍，直接获得50个修罗之印。",
        rewardRegexp: /后跃六步，下一次随机前进上限翻倍，直接获得(\d+)个修罗之印。/,
        reward: 50,
        // tags: ["后跃六步", "骰子翻倍"],
        tags: ["后六翻倍"],
        buffID: 24903,
        buffLevel: 1,
    },
    {
        id: 6,
        icon: 4543,
        name: "因陀罗的战术",
        desc: "前跃六步，下一次随机前进上限减半，直接获得50个修罗之印。",
        rewardRegexp: /前跃六步，下一次随机前进上限减半，直接获得(\d+)个修罗之印。/,
        reward: 50,
        // tags: ["前跃六步", "骰子减半"],
        tags: ["前六减半"],
        buffID: 24904,
        buffLevel: 1,
    },
    {
        id: 7,
        icon: 4558,
        name: "阿修罗的本性",
        desc: "击败首领额外获得200个修罗之印。",
        rewardRegexp: /击败首领额外获得(\d+)个修罗之印。/,
        reward: 200,
        tags: [],
        buffID: 24905,
        buffLevel: 1,
    },
    {
        id: 8,
        icon: 4576,
        name: "阿修罗的愤怒",
        desc: "后跃三步，击败首领额外获得120个修罗之印。",
        rewardRegexp: /后跃三步，击败首领额外获得(\d+)个修罗之印。/,
        reward: 120,
        tags: ["后跃三步"],
        buffID: 24906,
        buffLevel: 1,
    },
    {
        id: 9,
        icon: 4573,
        name: "因陀罗的迂回",
        desc: "获得逆向前进的机会。",
        reward: 0,
        tags: ["逆向前进"],
        buffID: 26257,
        buffLevel: 0,
    },
];
