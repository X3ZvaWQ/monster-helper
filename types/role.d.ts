type SchoolIds = keyof typeof import("@jx3box/jx3box-data/data/xf/schoolid.json");
type Gender = "male" | "female";
interface Role {
    id?: string;
    account: string;
    server: string;
    name: string;
    schoolId: SchoolIds | null;
    gender: Gender;
    skills: RoleSkill[];
    inventory: SkillBook[];
    // 角色备注
    remark?: string;
    // 本周进度
    cd?: boolean;
    cdRemark?: string;
    // 传功计数
    teachCount?: number;
    taughtCount?: number;
    // 账号内用的排序
    order?: number;
    // 表格排序
    tableOrder?: number;
    // 自定义属性
    customValue?: Record<string, boolean | number | string>;
}

interface RoleSkill {
    id: number;
    level: number;
}

interface InventoryItem {
    itemId: number;
}

interface SkillBook extends RoleSkill { }
