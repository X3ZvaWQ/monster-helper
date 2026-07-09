import { effects as localMonsterEffects } from "@/assets/data/baizhan_effects";
import { getMonsterBooks, getMonsterBosses, getMonsterEffects, getMonsterSkills, getWeeklyMonsterMap, MonsterBossRaw, MonsterSkillBook } from "@/services/game";
import { distance } from "fastest-levenshtein";
import { groupBy, keyBy } from "lodash";
import { getBossExtraDrop, SkillLevelLabel, skillLevelLabel } from "@/assets/data/game";
import { getCurrentVersion } from "@/utils/update";
import { getJx3boxPost } from "@/services/jx3box";

const remoteCacheDuration = 6 * 60 * 60 * 1000;
const baizhanImageRoot = "https://img.jx3box.com/pve/baizhan/";
const defaultMonsterBossAvatar = `${baizhanImageRoot}fbcdpanel02_51.png`;

const isRemoteCacheFresh = (lastFetchAt: number, hasData: boolean) => {
    return Boolean(lastFetchAt && hasData && lastFetchAt + remoteCacheDuration > Date.now());
};

const getNextWeeklyMapExpireAt = (now = new Date()) => {
    const expireAt = new Date(now);
    const daysUntilMonday = (8 - expireAt.getDay()) % 7;
    expireAt.setDate(expireAt.getDate() + daysUntilMonday);
    expireAt.setHours(6, 0, 0, 0);
    if (expireAt.getTime() <= now.getTime()) {
        expireAt.setDate(expireAt.getDate() + 7);
    }
    return expireAt.getTime();
};

const getBossAvatar = (boss: MonsterBossRaw) => {
    const filename = boss.ImagePath?.match(/\\([^\\]*)\./)?.[1]?.toLowerCase();
    if (!filename) return defaultMonsterBossAvatar;
    return `${baizhanImageRoot}${filename}_${boss.ImageFrame}.png`;
};

const isWeeklyMapCacheUsable = (map: WeeklyMonsterMap | null) => {
    return Boolean(map?.floors.length && map.floors.every((floor) => "effect" in floor));
};

const getEffectReward = (description: string, localEffect?: (typeof localMonsterEffects)[number]) => {
    const rewardRegexp = localEffect && "rewardRegexp" in localEffect ? localEffect.rewardRegexp : null;
    if (rewardRegexp) {
        const matches = description.match(rewardRegexp);
        if (matches?.[1]) {
            return Number(matches[1]);
        }
    }
    return localEffect?.reward || 0;
};

// 游戏设置，不同步，随时从线上拉的
export const useGameStore = defineStore("game", {
    state: () => ({
        lastUpdatedAt: 0, // 上次更新游戏数据的时间戳
        lastUpdateVersion: "1.2.1", // 上次更新游戏数据的软件版本号

        lastFetchBossListAt: 0, // 上次加载boss列表的时间戳
        bossList: [],
        lastFetchMonsterBossesAt: 0, // 上次加载地图boss字典的时间戳
        monsterBosses: [] as MonsterBoss[],
        monsterBossMap: {} as Record<number, MonsterBoss>,
        lastFetchMonsterEffectsAt: 0, // 上次加载地图效果字典的时间戳
        monsterEffects: [] as MonsterEffect[],
        monsterEffectMap: {} as Record<number, MonsterEffect>,
        lastFetchMonsterMapAt: 0, // 上次加载每周地图的时间戳
        monsterMapCacheExpireAt: 0, // 每周一早上6点失效
        monsterMap: null as WeeklyMonsterMap | null,
        books: [] as MonsterSkillBook[],
        bookMap: {} as Record<number, Record<number, MonsterSkillBook>>,
        skills: [] as MonsterSkill[],
        skillMap: {} as Record<number, MonsterSkill>,
    }),
    actions: {
        async fetchBossList() {
            // 每6小时加载一次boss列表
            if (isRemoteCacheFresh(this.lastFetchBossListAt, this.bossList.length > 0)) {
                return; // 如果已经加载过了，就不再加载
            }
            const post = await getJx3boxPost(101669);
            if (!post || !post.post_content) return;
            // 解析文章内容
            const dom = document.createElement("div");
            dom.innerHTML = post.post_content;
            const bossListDom = dom.querySelector("[data-type='boss-list']");
            if (!bossListDom) return;
            const content = bossListDom.innerHTML.trim();
            try {
                const bossListParseResult = JSON.parse(content);
                this.bossList = bossListParseResult;
                this.lastFetchBossListAt = Date.now();
            } catch { }
        },
        async fetchMonsterBosses(force = false) {
            if (!force && isRemoteCacheFresh(this.lastFetchMonsterBossesAt, this.monsterBosses.length > 0)) {
                return;
            }
            const res = await getMonsterBosses();
            const bosses = (res.data || [])
                .filter((boss) => boss.dwNpcID && boss.szName)
                .map((boss) => {
                    const extraDrop = getBossExtraDrop(boss.szName!);
                    return {
                        id: boss.dwNpcID,
                        name: boss.szName!,
                        skills: boss.szSkill || [],
                        extraDrop,
                        avatar: getBossAvatar(boss),
                        imagePath: boss.ImagePath,
                        imageFrame: boss.ImageFrame,
                    };
                });
            this.monsterBosses = bosses;
            this.monsterBossMap = keyBy(bosses, "id");
            this.lastFetchMonsterBossesAt = Date.now();
        },
        async fetchMonsterEffects(force = false) {
            if (!force && isRemoteCacheFresh(this.lastFetchMonsterEffectsAt, this.monsterEffects.length > 0)) {
                return;
            }
            const res = await getMonsterEffects();
            const effects = (res.data || []).map((effect) => {
                const localEffect = localMonsterEffects.find((item) => item.id === effect.nID);
                return {
                    id: effect.nID,
                    icon: effect.dwIconID || localEffect?.icon || 18505,
                    name: effect.szName || localEffect?.name || "未知效果",
                    description: effect.szDescription || localEffect?.desc || "",
                    reward: getEffectReward(effect.szDescription || "", localEffect),
                    tags: localEffect?.tags || [],
                    buffID: localEffect?.buffID,
                    buffLevel: localEffect?.buffLevel,
                };
            });
            this.monsterEffects = effects;
            this.monsterEffectMap = keyBy(effects, "id");
            this.lastFetchMonsterEffectsAt = Date.now();
        },
        async fetchWeeklyMonsterMap(force = false) {
            if (
                !force &&
                isWeeklyMapCacheUsable(this.monsterMap) &&
                this.monsterMapCacheExpireAt > Date.now()
            ) {
                return;
            }
            await this.fetchMonsterBosses(force);
            await this.fetchMonsterEffects(force);
            const res = await getWeeklyMonsterMap();
            if (res.code !== 0 || !res.data) {
                throw new Error(res.msg || "本周地图加载失败");
            }
            const floors = (res.data.data || []).map((floor, index) => ({
                ...floor,
                floor: index + 1,
                boss: this.monsterBossMap[floor.dwBossID] || null,
                effect: this.monsterEffectMap[floor.nEffectID] || null,
            }));
            this.monsterMap = {
                id: res.data.id,
                start: res.data.start,
                updatedAt: res.data.updated_at,
                enable: res.data.enable,
                floors,
                extra: res.data.extra,
            };
            this.lastFetchMonsterMapAt = Date.now();
            this.monsterMapCacheExpireAt = getNextWeeklyMapExpireAt();
        },
        async fetchSkills() {
            // 6小时以内加载过且skills长度不为0，并且软件版本号相同
            if (
                this.lastUpdatedAt &&
                this.lastUpdatedAt + remoteCacheDuration > Date.now() &&
                this.skills.length &&
                this.skills.every((skill) => "inSkillId" in skill) &&
                this.lastUpdateVersion === (await getCurrentVersion())
            ) {
                return; // 如果技能已经加载过了，就不再加载
            }
            await getMonsterSkills().then((res) => {
                this.skills = res;
                this.skillMap = keyBy(res, "id");
            });
            await getMonsterBooks().then((res) => {
                this.books = Object.values(res);
                this.bookMap = groupBy(this.books, "skillId");
                for (const key in this.bookMap) {
                    this.bookMap[key] = keyBy(this.bookMap[key], "level");
                }
                for (const skill of this.skills) {
                    skill.books = this.bookMap[skill.id] || [];
                }
            });
            this.lastUpdatedAt = Date.now();
            this.lastUpdateVersion = await getCurrentVersion();
        },
        getSkillById(id: number) {
            return this.skillMap[id] || null;
        },
        getSkillNameCharWhiteList() {
            const levelString = skillLevelLabel.slice(1).join("");
            const skillName = this.skills.map((s) => s.name).join("");
            return [...new Set((levelString + skillName).split(""))];
        },
        getBooksCharWhiteList() {
            const levelString = skillLevelLabel.slice(1).join("");
            const skillName = this.skills.map((s) => s.name).join("");
            const extra = "[:0123456789]:你获得: [《变招式要诀·》()]。";
            return [...new Set((levelString + skillName + extra).split(""))];
        },
        getSkillsFromOcrResult(ocrResult: OcrResultItem[]) {
            const result: RoleSkill[] = [];
            const skillMap = keyBy(this.skills, "name");
            let currentLevel = 0;
            for (const item of ocrResult) {
                let ocrSkillName = item.text;
                const level = skillLevelLabel.findIndex((l) => l === ocrSkillName);
                if (level != -1) {
                    // 如果是技能等级的label，配置当前等级
                    currentLevel = level;
                    continue;
                }
                // 如果技能名称完全相同
                if (skillMap[ocrSkillName]) {
                    result.push({
                        id: skillMap[ocrSkillName].id,
                        level: currentLevel,
                    });
                    delete skillMap[ocrSkillName]; // 删除完全匹配的技能
                    continue;
                }
                // 如果技能名称包含现有技能
                for (const name in skillMap) {
                    if (ocrSkillName.includes(name)) {
                        result.push({
                            id: skillMap[name].id,
                            level: currentLevel,
                        });
                        delete skillMap[name]; // 删除包含的技能
                        ocrSkillName = ocrSkillName.replace(name, ""); // 从字符串中移除已识别的技能名称
                        if (ocrSkillName.length === 0) break; // 如果字符串为空，消耗完毕
                    }
                }
                // 如果还有空的，大概率是有错字/错字与技能粘黏同时出现了
                for (const name in skillMap) {
                    if (ocrSkillName.length < name.length - 1) continue; // 如果字符串长度小于技能名称长度 - 1，跳过
                    const lengths = [name.length - 1, name.length, name.length + 1];
                    for (const len of lengths) {
                        if (!len) continue; // 如果长度小于1，跳过
                        let founded = false;
                        for (let i = 0; i <= ocrSkillName.length - len; i++) {
                            const subStr = ocrSkillName.slice(i, i + len);
                            if (distance(subStr, name) <= 1) {
                                result.push({
                                    id: skillMap[name].id,
                                    level: currentLevel,
                                });
                                delete skillMap[name]; // 删除包含的技能
                                founded = true;
                                break; // 找到一个匹配的就可以了
                            }
                        }
                        if (founded) break; // 如果已经找到匹配的技能，跳出循环
                    }
                }
            }
            return result;
        },
        getBooksFromOcrResult(ocrResult: OcrResultItem[]) {
            const books: SkillBook[] = [];
            for (const item of ocrResult) {
                const match = item.text.match(/《(.+·)?(.+?)》.+·(.+重)(\(.+\))?/);
                if (!match) continue; // 如果没有匹配到，跳过
                const [, , skillName, levelLabel] = match;
                const id = this.skills.find((s) => s.name === skillName)?.id;
                const level = skillLevelLabel.indexOf(levelLabel as SkillLevelLabel);
                if (!id || level === -1) continue; // 如果没有找到技能ID或等级，跳过
                books.push({
                    id,
                    level,
                });
            }
            return books;
        },
    },
});
