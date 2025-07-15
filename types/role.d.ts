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
    inventory: InventoryItem[];
}

interface RoleSkill {
    id: number;
    level: number;
}

interface InventoryItem {
    itemId: number;
}
